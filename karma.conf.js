// Karma configuration for AngularJS unit tests
module.exports = function(config) {
  config.set({
    // Base path that will be used to resolve all patterns
    basePath: '',

    // Frameworks to use
    frameworks: ['jasmine'],

    // List of files / patterns to load in the browser
    files: [
      // Angular and dependencies
      'node_modules/angular/angular.js',
      'node_modules/angular-route/angular-route.js',
      'node_modules/angular-mocks/angular-mocks.js',
      
      // Application files
      'js/app.js',
      'js/services/*.js',
      'js/controllers/*.js',
      'js/directives/*.js',
      
      // Test files
      'test/unit/**/*.spec.js'
    ],

    // List of files to exclude
    exclude: [],

    // Preprocess matching files before serving them to the browser
    preprocessors: {},

    // Test results reporter to use
    reporters: ['progress', 'coverage'],

    // Coverage reporter configuration
    coverageReporter: {
      type: 'html',
      dir: 'coverage/',
      subdir: 'frontend'
    },

    // Web server port
    port: 9876,

    // Enable / disable colors in the output (reporters and logs)
    colors: true,

    // Level of logging
    logLevel: config.LOG_INFO,

    // Enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // Start these browsers
    browsers: ['Chrome'],

    // Continuous Integration mode
    singleRun: false,

    // Concurrency level
    concurrency: Infinity
  });
};