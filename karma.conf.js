// Karma configuration
// Generated on Fri Feb 06 2015 04:09:58 GMT+0900 (Tokyo Standard Time)

var _ = require('lodash');

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: [ 'mocha', 'chai' ],
    
    client: {
      mocha: {
        timeout: 10000
      }
    },


    // list of files / patterns to load in the browser
    files: [
      "test/browser/bundle.js"
    ],


    // list of files to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['mocha'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: _.compact([
      (process.env.CI ? 'Chrome_CI' : 'Chrome'),
      'Firefox',
      (/^win/.test(process.platform) ? 'IE' : null) // if Windows
    ]),
    
    customLaunchers: {
        Chrome_CI: {
            base: 'Chrome',
            flags: ['--no-sandbox']
        }
    },
    
    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false
  });
};
