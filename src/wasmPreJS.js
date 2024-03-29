const path = require('path');
var Module = module.exports = {};
if (typeof self === 'undefined') {
// When loaded with nodejs, the absolute file path is needed
    Module.wasmBinaryFile = path.resolve(__dirname, 'liblinear.wasm');
} else {
    Module.wasmBinaryFile = 'liblinear.wasm';
}

Module.isReady = new Promise(function (resolve) {
    Module.onRuntimeInitialized = function () {
        resolve(Module);
    };
});
