var WebpackRPC = require('../lib/index');
var WatchIgnorePlugin = require('webpack/lib/WatchIgnorePlugin');

module.exports = {
  entry: './index.js',
  output: {
    path: __dirname + '/bundle',
    filename: 'bundle.js',
  },
  plugins: [
    new WebpackRPC()
  ]
};
