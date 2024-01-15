/* eslint-disable no-async-promise-executor,no-misleading-character-class,require-atomic-updates,no-useless-catch */
'use strict';

const loadLINEAR = require('./src/loadLINEAR');
const liblinear = require('./out/asm/liblinear');

module.exports = liblinear.then((instance) => loadLINEAR(instance));
