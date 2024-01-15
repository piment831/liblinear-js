'use strict';

const path = require('path');

module.exports = {
  entry: ['./asm.js'],
  output: {
    path: path.join(__dirname, '../dist/browser/asm'),
    filename: 'liblinear.js',
    library: 'liblinear',
    libraryTarget: 'umd'
  },
  node: {
    fs: 'empty',
    crypto: 'empty',
    process: 'mock',
    Buffer: false,
    path: 'empty'
  }
};
