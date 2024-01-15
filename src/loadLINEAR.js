/* eslint-disable no-async-promise-executor,no-misleading-character-class,require-atomic-updates,no-useless-catch */
'use strict';

module.exports = function (liblinear) {
  const util = require('./util');

  /* eslint-disable camelcase */
  const predict_one = liblinear.cwrap('liblinear_predict_one', 'number', ['number', 'array', 'number']);
  const predict_one_probability = liblinear.cwrap('liblinear_predict_one_probability', 'number', ['number', 'array', 'number', 'number']);
  const add_instance = liblinear.cwrap('add_instance', null, ['number', 'array', 'number', 'number', 'number']);
  const create_nodes = liblinear.cwrap('create_nodes', 'number', ['number', 'number']);
  const train_problem = liblinear.cwrap('liblinear_train_problem', 'number', ['number', 'string']);
  const get_nr_class = liblinear.cwrap('get_nr_class', 'number', ['number']);
  const get_labels = liblinear.cwrap('get_labels', null, ['number', 'number']);
  const free_model = liblinear.cwrap('free_model', null, ['number']);
  const cross_validation = liblinear.cwrap('liblinear_cross_validation', null, ['number', 'string', 'number', 'number']);
  const free_problem = liblinear.cwrap('free_problem', null, ['number']);
  const serialize_model = liblinear.cwrap('serialize_model', 'number', ['number']);
  const deserialize_model = liblinear.cwrap('deserialize_model', 'number', ['string']);

  /* eslint-enable camelcase */

  class LINEAR {
    /**
         * @constructor
         * @param {object} options
         * @param {number} [options.s=LINEAR_TYPES.L2R_L2LOSS_SVC_DUAL] - solver_type,
         * @param {number} [options.degree=3] - Degree of polynomial, for polynomial kernel
         * @param {number} [options.gamma] -  Gamma parameter of the RBF, Polynomial and Sigmoid kernels. Default value is 1/num_features
         * @param {number} [options.coef0=0] - coef0 parameter for Polynomial and Sigmoid kernels
         * @param {number} [options.cost=1] - Cost parameter, for C SVC, Epsilon SVR and NU SVR
         * @param {number} [options.nu=0.5] - For NU SVC and NU SVR
         * @param {number} [options.epsilon=0.1] - For epsilon SVR
         * @param {number} [options.cacheSize=100] - Cache size in MB
         * @param {number} [options.tolerance=0.001] - Tolerance
         * @param {boolean} [options.shrinking=true] - Use shrinking euristics (faster),
         * @param {boolean} [options.probabilityEstimates=false] - weather to train SVC/SVR model for probability estimates,
         * @param {object} [options.weight] - Set weight for each possible class
         * @param {boolean} [options.quiet=true] - Print info during training if false
         */
    constructor(options) {
      this.options = Object.assign({}, options);
      this.model = null;
    }

    /**
         * Trains the LINEAR model.
         * @param {Array<Array<number>>} samples - The training samples. First level of array are the samples, second
         * level are the individual features
         * @param {Array<number>} labels - The training labels. It should have the same size as the samples. If you are
         * training a classification model, the labels should be distinct integers for each class. If you are training
         * a regression model, each label should be the value of the predicted variable.
         * @throws if LINEAR instance was instantiated from LINEAR.load.
         */
    train(samples, labels) {
      if (this._deserialized) throw new Error('Train cannot be called on instance created with LINEAR.load');
      this.free();
      this.problem = createProblem(samples, labels);
      const command = this.getCommand();
      this.model = train_problem(this.problem, command);
    }

    /**
         * Performs k-fold cross-validation (KF-CV). KF-CV separates the data-set into kFold random equally sized partitions,
         * and uses each as a validation set, with all other partitions used in the training set. Observations left over
         * from if kFold does not divide the number of observations are left out of the cross-validation process. If
         * kFold is one, this is equivalent to a leave-on-out cross-validation
         * @param {Array<Array<number>>} samples - The training samples.
         * @param {Array<number>} labels - The training labels.
         * @param {number} kFold - Number of datasets into which to split the training set.
         * @throws if LINEAR instance was instantiated from LINEAR.load.
         * @return {Array<number>} The array of predicted labels produced by the cross validation. Has a size equal to
         * the number of samples provided as input.
         */
    crossValidation(samples, labels, kFold) {
      if (this._deserialized) throw new Error('crossValidation cannot be called on instance created with LINEAR.load');
      const problem = createProblem(samples, labels);
      const target = liblinear._malloc(labels.length * 8);
      cross_validation(problem, this.getCommand(), kFold, target);
      const data = liblinear.HEAPF64.subarray(target / 8, target / 8 + labels.length);
      const arr = Array.from(data);
      liblinear._free(target);
      free_problem(problem);
      return arr;
    }

    /**
         * Free the memory allocated for the model. Since this memory is stored in the memory model of emscripten, it is
         * allocated within an ArrayBuffer and WILL NOT BE GARBARGE COLLECTED, you have to explicitly free it. So
         * not calling this will result in memory leaks. As of today in the browser, there is no way to hook the
         * garbage collection of the LINEAR object to free it automatically.
         * Free the memory that was created by the compiled liblinear library to.
         * store the model. This model is reused every time the predict method is called.
         */
    free() {
      if (this.problem) {
        free_problem(this.problem);
        this.problem = null;
      }
      if (this.model !== null) {
        free_model(this.model);
        this.model = null;
      }
    }

    getCommand() {
      const options = {};
      Object.assign(options, this.options);
      return util.getCommand(options);
    }

    /**
         * Predict the label of one sample.
         * @param {Array<number>} sample - The sample to predict.
         * @return {number} - The predicted label.
         */
    predictOne(sample) {
      if (this.model === null) {
        throw new Error('Cannot predict, you must train first');
      }
      return predict_one(this.model, new Uint8Array(new Float64Array(sample).buffer), sample.length);
    }

    /**
         * Predict the label of many samples.
         * @param {Array<Array<number>>} samples - The samples to predict.
         * @return {Array<number>} - The predicted labels.
         */
    predict(samples) {
      let arr = [];
      for (let i = 0; i < samples.length; i++) {
        arr.push(this.predictOne(samples[i]));
      }
      return arr;
    }

    /**
         * Predict the label with probability estimate of many samples.
         * @param {Array<Array<number>>} samples - The samples to predict.
         * @return {Array<object>} - An array of objects containing the prediction label and the probability estimates for each label
         */
    predictProbability(samples) {
      let arr = [];
      for (let i = 0; i < samples.length; i++) {
        arr.push(this.predictOneProbability(samples[i]));
      }
      return arr;
    }

    /** Predict the label with probability estimate.
         * @param {Array<number>} sample
         * @return {object} - An object containing the prediction label and the probability estimates for each label
         */

    predictOneProbability(sample) {
      const labels = this.getLabels();
      const nbLabels = labels.length;
      const estimates = liblinear._malloc(nbLabels * 8);
      const prediction = predict_one_probability(this.model, new Uint8Array(new Float64Array(sample).buffer), sample.length, estimates);
      const estimatesArr = Array.from(liblinear.HEAPF64.subarray(estimates / 8, estimates / 8 + nbLabels));
      const result = {
        prediction,
        estimates: labels.map((label, idx) => ({
          label,
          probability: estimatesArr[idx]
        }))
      };
      liblinear._free(estimates);
      return result;
    }

    /** Predict a regression value with a confidence interval
         * @param {Array<number>} sample
         * @param {number} confidence - A value between 0 and 1. For example, a value 0.95 will give you the 95% confidence interval of the predicted value.
         * @return {object} - An object containing the prediction value and the lower and upper bounds of the confidence interval
         */
    predictOneInterval(sample, confidence) {
      const interval = this._getInterval(confidence);
      const predicted = this.predictOne(sample);
      return {
        predicted,
        interval: [predicted - interval, predicted + interval]
      };
    }

    /**
         * Get the array of labels from the model. Useful when creating an LINEAR instance with LINEAR.load
         * @return {Array<number>} - The list of labels.
         */
    getLabels() {
      const nbLabels = get_nr_class(this.model);
      return getIntArrayFromModel(get_labels, this.model, nbLabels);
    }

    /**
         * Uses liblinear's serialization method of the model.
         * @return {string} The serialization string.
         */
    serializeModel() {
      if (!this.model) throw new Error('Cannot serialize model. No model was trained');
      const result = serialize_model(this.model);
      const str = liblinear.UTF8ToString(result);
      liblinear._free(result);
      return str;
    }

    /**
         * Create a LINEAR instance from the serialized model.
         * @param {string} serializedModel - The serialized model.
         * @return {LINEAR} - LINEAR instance that contains the model.
         */
    static load(serializedModel) {
      const linear = new LINEAR();
      linear.model = deserialize_model(serializedModel);
      linear._deserialized = true;
      return linear;
    }
  }

  /**
     * solver_type
     */
  LINEAR.LINEAR_TYPES = {
    L2R_LR: '0',
    L2R_L2LOSS_SVC_DUAL: '1',
    L2R_L2LOSS_SVC: '2',
    L2R_L1LOSS_SVC_DUAL: '3',
    MCSVM_CS: '4',
    L1R_L2LOSS_SVC: '5',
    L1R_LR: '6',
    L2R_LR_DUAL: '7',
    L2R_L2LOSS_SVR: '11',
    L2R_L2LOSS_SVR_DUAL: '12',
    L2R_L1LOSS_SVR_DUAL: '13',
    ONECLASS_SVM: '21'
  };

  function getIntArrayFromModel(fn, model, size) {
    const offset = liblinear._malloc(size * 4);
    fn(model, offset);
    const data = liblinear.HEAP32.subarray(offset / 4, offset / 4 + size);
    const arr = Array.from(data);
    liblinear._free(offset);
    return arr;
  }

  function createProblem(samples, labels) {
    const nbSamples = samples.length;
    const nbFeatures = samples[0].length;
    const problem = create_nodes(nbSamples, nbFeatures);
    for (let i = 0; i < nbSamples; i++) {
      add_instance(problem, new Uint8Array(new Float64Array(samples[i]).buffer), nbFeatures, labels[i], i);
    }
    return problem;
  }

  return LINEAR;
};
