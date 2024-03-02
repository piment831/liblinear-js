Port of to port liblinear v2.47 using [emscripten](https://github.com/kripken/emscripten) , for usage in the browser or nodejs. 2 build targets: asm and WebAssembly.

What is liblinear?
liblinear is a [c++ library](https://github.com/cjlin1/liblinear) developped by Chih-Chung Chang and Chih-Jen Lin that allows to do solving large-scale regularized linear classification, regression and outlier detection.

Resources about liblinear:
- [liblinear website](https://www.csie.ntu.edu.tw/~cjlin/liblinear/)
- [liblinear github repository](https://github.com/cjlin1/liblinear)
- [Wikipedia article](https://en.wikipedia.org/wiki/Support_vector_machine)

# Usage
## Load
The main entry point loads the WebAssembly build and is asynchronous.
```js
require('liblinear-js').then(LINEAR => {
    const linear = new LINEAR(); // ...
});
```

There is an alternative entry point if you want to use asm build. This entrypoint is asynchronous.
```js
const LINEAR = await require('liblinear-js/asm');
const linear = new LINEAR(); // ...
```

## Load in a web browser
The npm package contains a bundle for the browser that works with AMD and browser globals. There is one bundle for the asm build and another for the web assembly build. They are located in the `dist/browser` directory of the package. You can load them into your web page with a `script` tag. For the web assembly module, make sure that the libsvm.wasm file is served from the same relative path as the js file.

## Basic usage
This example illustrates how to use the library to train and use an LINEAR classifier.
```js

async function andOp() {
    const LINEAR = await require('liblinear-js');
    const linear = new LINEAR();

    // This is the and problem
    //
    //  1  1
    //  0  1
    const features = [[0, 1], [1, 1], [0, 0], [1, 0]];
    const labels = [1, 1, 0, 1];
    linear.train(features, labels);  // train the model
    const predictedLabel = linear.predict(features);
    console.log(predictedLabel) // [ 1, 1, 0, 1 ]
}

andOp().then(() => console.log('done!'));
```


# What are asm and WebAssembly ?
From [asmjs.org](http;//asmjs.org)
> asm is an optimizable subset of javascript.

From [webassembly.org](http://webassembly.org)
> WebAssembly or wasm is a new portable, size- and load-time-efficient format suitable for compilation to the web

# Should I use asm or WebAssembly ?
Both. You should try to use WebAssembly first and fall back to asm in order to support all browsers.

WebAssembly is currently supported in the latest stable versions of Chrome, Firefox and on preview versions of Safari and Edge.

# API Documentation
<a name="LINEAR"></a>

## LINEAR
**Kind**: global class  

* [LINEAR](#LINEAR)
    * [new LINEAR(options)](#new_LINEAR_new)
    * _instance_
        * [.train(samples, labels)](#SVM+train)
        * [.crossValidation(samples, labels, kFold)](#LINEAR+crossValidation) ⇒ <code>[ &#x27;Array&#x27; ].&lt;number&gt;</code>
        * [.free()](#LINEAR+free)
        * [.predictOne(sample)](#LINEAR+predictOne) ⇒ <code>number</code>
        * [.predict(samples)](#LINEAR+predict) ⇒ <code>[ &#x27;Array&#x27; ].&lt;number&gt;</code>
        * [.predictProbability(samples)](#LINEAR+predictProbability) ⇒ <code>[ &#x27;Array&#x27; ].&lt;object&gt;</code>
        * [.predictOneProbability(sample)](#LINEAR+predictOneProbability) ⇒ <code>object</code>
        * [.predictOneInterval(sample, confidence)](#LINEAR+predictOneInterval) ⇒ <code>object</code>
        * [.predictInterval(samples, confidence)](#LINEAR+predictInterval) ⇒ <code>[ &#x27;Array&#x27; ].&lt;object&gt;</code>
        * [.getLabels()](#LINEAR+getLabels) ⇒ <code>[ &#x27;Array&#x27; ].&lt;number&gt;</code>
        * [.serializeModel()](#LINEAR+serializeModel) ⇒ <code>string</code>
    * _static_
        * [.LINEAR_TYPES](#LINEAR.LINEAR_TYPES) : <code>Object</code>
        * [.load(serializedModel)](#LINEAR.load) ⇒ [<code>LINEAR</code>](#LINEAR)

<a name="new_LINEAR_new"></a>

### new LINEAR(options)

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>object</code> |  |  |
| [options.type] | <code>number</code> | <code>1</code> | set type of solver<br>for multi-class classification<br>&nbsp;&nbsp;&nbsp;&nbsp;0 -- L2-regularized logistic regression (primal)<br>&nbsp;&nbsp;&nbsp;&nbsp;1 -- L2-regularized L2-loss support vector classification (dual)<br>&nbsp;&nbsp;&nbsp;&nbsp;2 -- L2-regularized L2-loss support vector classification (primal)<br>&nbsp;&nbsp;&nbsp;&nbsp;3 -- L2-regularized L1-loss support vector classification (dual)<br>&nbsp;&nbsp;&nbsp;&nbsp;4 -- support vector classification by Crammer and Singer<br>&nbsp;&nbsp;&nbsp;&nbsp;5 -- L1-regularized L2-loss support vector classification<br>&nbsp;&nbsp;&nbsp;&nbsp;6 -- L1-regularized logistic regression<br>&nbsp;&nbsp;&nbsp;&nbsp;7 -- L2-regularized logistic regression (dual)<br>for regression<br>&nbsp;&nbsp;&nbsp;&nbsp;11 -- L2-regularized L2-loss support vector regression (primal)<br>&nbsp;&nbsp;&nbsp;&nbsp;12 -- L2-regularized L2-loss support vector regression (dual)<br>&nbsp;&nbsp;&nbsp;&nbsp;13 -- L2-regularized L1-loss support vector regression (dual)<br>for outlier detection<br>&nbsp;&nbsp;&nbsp;&nbsp;21 -- one-class support vector machine (dual) |
| [options.cost] | <code>number</code> | <code>1</code> | set the parameter C |
| [options.epsilon] | <code>number</code> | <code>0.1</code> | set the epsilon in loss function of epsilon-SVR |
| [options.nu] | <code>number</code> | <code>0.5</code> | set the parameter nu of one-class SVM |
| [options.tolerance] | <code>number</code> | <code>0.001</code> | set tolerance of termination criterion<br>-s 0 and 2<br>&nbsp;&nbsp;&nbsp;&nbsp;\|f'(w)\|_2 <= eps*min(pos,neg)/l*\|f'(w0)\|_2,<br>&nbsp;&nbsp;&nbsp;&nbsp;where f is the primal function and pos/neg are # of<br>positive/negative data (default 0.01)<br>-s 11<br>&nbsp;&nbsp;&nbsp;&nbsp;\|f'(w)\|_2 <= eps*\|f'(w0)\|_2 (default 0.0001)<br>-s 1, 3, 4, 7, and 21<br>&nbsp;&nbsp;&nbsp;&nbsp;Dual maximal violation <= eps; similar to libsvm (default 0.1 except 0.01 for -s 21)<br>-s 5 and 6<br>&nbsp;&nbsp;&nbsp;&nbsp;\|f'(w)\|_1 <= eps*min(pos,neg)/l*\|f'(w0)\|_1,<br>&nbsp;&nbsp;&nbsp;&nbsp;where f is the primal function (default 0.01)<br>-s 12 and 13<br>&nbsp;&nbsp;&nbsp;&nbsp;\|f'(alpha)\|_1 <= eps \|f'(alpha0)\|,<br>&nbsp;&nbsp;&nbsp;&nbsp;where f is the dual function (default 0.1) |
| [options.bias] | <code>number</code> | <code>-1</code> | if bias >= 0, instance x becomes [x; bias]; if < 0, no bias term added |
| [options.regularize] |  |  | not regularize the bias; must with -B 1 to have the bias; DON'T use this unless you know what it is<br>(for -s 0, 2, 5, 6, 11) |
| [options.weight] | <code>object</code> |  | Set weight for each possible class |
| [options.quiet] | <code>boolean</code> | <code>true</code> | Print info during training if false |

# LICENSE
BSD-3-Clause
