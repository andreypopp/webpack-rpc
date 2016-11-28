/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

const fs = require('fs');
const path = require('path');
const netListen = require('net-listen');
const http = require('http');
const onExit = require('death');

const DummyWatchFileSystem = require('./DummyWatchFileSystem');

const BUNDLE_PREFIX = '/bundle';

class WebpackRPC {

  constructor(spec) {
    this.spec = spec;
    this.server = null;
    this.watchFileSystem = null;
    this.compiler = null;
    this.compilation = null;
  }

  apply(compiler) {
    this.compiler = compiler;
    this.compiler.plugin('watch-run', wrapAsyncPlugin(this.onListen.bind(this)));
    this.compiler.plugin('compilation', compilation => {
      this.compilation = compilation;
    });
  }

  onListen(_watching) {
    if (this.server == null) {
      this.watchFileSystem = new DummyWatchFileSystem(this.compiler.inputFileSystem);
      this.compiler.watchFileSystem = this.watchFileSystem;
      return getSocketName(this.compiler.context).then(sockName => {
        this.server = http.createServer(this.onRequest.bind(this));
        netListen.listen(this.server, sockName, this.onListenStart.bind(this));
      });
    }
  }

  onRequest(req, res) {
    if (req.method === 'GET' && req.url.startsWith(BUNDLE_PREFIX)) {
      let url = req.url.slice(BUNDLE_PREFIX.length + 1);
      if (this.compilation) {
        let asset = this.compilation.assets[url];
        if (asset == null) {
          res.statusCode = 400;
          res.write('Not Found');
          res.end();
        } else {
          let source = asset._source ? asset._source.source() : asset.source();
          res.write(source);
          res.end();
        }
      }
    } else if (req.method === 'POST' && req.url === '/rpc') {
      let data = '';
      req.on('data', chunk => {
        data += chunk;
      });
      req.on('end', () => {
        try {
          let {name, payload} = JSON.parse(data);
          let response = this.onCall(name, payload);
          res.write(JSON.stringify(response || null));
          res.end();
        } catch(err) {
          console.error('oops', err);
        }
      });
    } else {
      res.statusCode = 400;
      res.write('Bad request');
      res.end();
    }
  }

  onCall(name, payload) {
    if (name === 'notifyFileChanged') {
      let {filename} = payload;
      this.watchFileSystem.fileChanged(filename);
    }
  }

  onListenStart(err) {
    if (err) {
      console.error(err);
      process.exit(1);
    }
  }
}

function getSocketName(context, filename = '.webpack-rpc-socket') {
  return new Promise(resolve => {
  let nodeModules = path.join(context, 'node_modules');
    fs.exists(nodeModules, exists => {
      if (exists) {
        resolve(path.join(nodeModules, filename));
      } else {
        resolve(path.join(context, filename));
      }
    });
  });
}

function wrapAsyncPlugin(f) {
  return function(...args) {
    let cb = args.pop();
    try {
      Promise.resolve(f(...args))
        .then(res => cb(null, res))
        .then(undefined, err => cb(err));
    } catch (err) {
      cb(err);
    }
  };
}

module.exports = WebpackRPC;
