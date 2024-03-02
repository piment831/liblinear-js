/* eslint-disable no-async-promise-executor,no-misleading-character-class,require-atomic-updates,no-useless-catch */
'use strict';

async function andOp() {
  const LINEAR = await require('../wasm');
  const linear = new LINEAR();

  // This is the and problem
  //
  //  1  1
  //  0  1
  const features = [[0, 1], [1, 1], [0, 0], [1, 0]];
  const labels = [1, 1, 0, 1];
  linear.train(features, labels); // train the model
  const predictedLabel = linear.predict(features);
  console.log(predictedLabel); // 0
}

andOp().then(() => console.log('done!'));

