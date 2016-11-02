module.exports = function (config) {
  config.set({

    frameworks: ['mocha', 'chai'],

    files: [],

    port: 3001,

    reporters: ['progress'],

    browsers: ['Chrome']
  });
};
