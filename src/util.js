'use strict';

const mapOptionToCommand = {
  type: 's',
  cost: 'c',
  epsilon: 'p',
  nu: 'n',
  tolerance: 'e',
  bias: 'B',
  weight: 'w',
  quiet: 'q',
  find: 'C',
  regularize: 'R',
};

module.exports = {
  getCommand: function getCommand(options) {
    var str = '';
    var keys = Object.keys(options);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (options[key] == null) continue;
      if (mapOptionToCommand[key] == null) throw new Error('Bad option');
      if (str) str += ' ';
      switch (key) {
        case 'find':
        case 'regularize':
        case 'quiet': {
          if (options[key]) {
            str += `-${mapOptionToCommand[key]} 1`;
          }
          break;
        }
        case 'weight': {
          const weightKeys = Object.keys(options.weight);
          for (let j = 0; j < weightKeys.length; j++) {
            if (j !== 0) str += ' ';
            str += `-w${weightKeys[j]} ${options.weight[weightKeys[j]]}`;
          }
          break;
        }
        default: {
          str += `-${mapOptionToCommand[key]} ${options[key]}`;
          break;
        }
      }
    }

    return str;
  }
};
