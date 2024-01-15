/* eslint-disable no-async-promise-executor,no-misleading-character-class,require-atomic-updates,no-useless-catch */
'use strict';

const fs = require('fs');
const path = require('path');

const heartScale = (LINEAR, features, labels) => {
  const linear = new LINEAR();
  linear.train(features, labels);
  const pred = linear.predict(features);
  const correct = pred.filter((p, i) => p === labels[i]);
  console.log('accuracy', correct.length / labels.length);
  console.log('labels', linear.getLabels());
  console.log('save model', linear.serializeModel());
};

const createData = () => {
  const dataHeartScale = (fs.readFileSync(path.join(__dirname, '../liblinear/heart_scale'), 'utf8'));
  const features = [];
  const labels = [];
  dataHeartScale.split('\n').forEach((line) => {
    const cols = line.trim().split(' ');
    if (cols.length > 1) {
      const feature = [...Array(13)].fill(0);
      cols.slice(1).forEach((col) => {
        const vals = col.split(':');
        feature[Number(vals[0]) - 1] = Number(vals[1]);
      });
      features.push(feature);
      labels.push(Number(cols[0]));
    }
  });
  return { features, labels };
};

async function execAsm(features, labels) {
  console.log('asm');
  const LINEAR = await require('../asm');
  heartScale(LINEAR, features, labels);
}

async function execWasm(features, labels) {
  console.log('wasm');
  const LINEAR = await require('../wasm');
  heartScale(LINEAR, features, labels);
}

(async () => {
  try {
    const { features, labels } = createData();
    await execAsm(features, labels);
    await execWasm(features, labels);
  } catch (e) {
    console.log('failed');
    console.log(e);
  }
})();
