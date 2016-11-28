/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

const fs = require('fs');
const path = require('path');
const netListen = require('net-listen');
const http = require('http');

class WebpackRPC {

  constructor(spec) {
    this.spec = spec;
    this.server = null;
    this.watching = null;
    this.compiler = null;
  }

  apply(compiler) {
    this.compiler = compiler;
    this.compiler.plugin('watch-run', this.onListen.bind(this));
  }

  onListen(watching, cb) {
    this.watching = watching;
    if (this.server != null) {
      cb(null);
    } else {
      const sockName = path.join(this.compiler.context, 'webpack-rpc-socket');
      this.server = http.createServer(this.onRequest.bind(this));
      netListen.listen(this.server, sockName, this.onListenStart.bind(this));
      cb(null);
    }
  }

  onRequest(req, res) {
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
  }

  onCall(name, payload) {
    console.log(name, payload);
  }

  onListenStart(err) {
    if (err) {
      console.error(err);
      process.exit(1);
    }
  }
}

module.exports = WebpackRPC;
