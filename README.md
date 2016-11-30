# webpack-rpc

***NOT READY YET***

Webpack RPC implements API for Webpack running in watch mode.

## Motivation

* Notify Webpack of changes to modules directly from editor rather than watching
  filesystem for changes (much faster feedback loop).

* Get a list of errors from Webpack. ESLint can be run as a part of Webpack
  build pipeline so you would get fast linting too.

* ...

## Installation

    % npm install webpack-rpc

## Usage

Add `WebpackRPC` plugin to your `webpack.config.js` plugins section:

    const WebpackRPC = require('webpack-rpc')

    module.exports = {

      ...

      plugins: [
        ...
        new WebpackRPC()
      ]
    }

Run `webpack --watch` or `webpack-dev-server` and then you can send Webpack
process commands via `webpack-rpc` utility:

    % webpack-rpc notify-file-changed ./index.js

For Vim you would want:

    :au BufPostWrite * execute 'silent :!webpack-rpc notify-file-changed ' . expand('%:p')
