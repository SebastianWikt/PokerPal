// Protractor configuration for end-to-end testing
exports.config = {
  // Selenium Server Info
  seleniumAddress: 'http://localhost:4444/wd/hub',
  
  // Capabilities to be passed to the webdriver instance
  capabilities: {
    'browserName': 'chrome',
    'chromeOptions': {
      'args': ['--headless', '--no-sandbox', '--disable-dev-shm-usage']
    }
  },
  
  // Framework to use. Jasmine is recommended
  framework: 'jasmine',
  
  // Spec patterns are relative to the current working directory when protractor is called
  specs: ['test/e2e/**/*.spec.js'],
  
  // Base URL for your application under test
  baseUrl: 'http://localhost:8080',
  
  // Options to be passed to Jasmine
  jasmineNodeOpts: {
    defaultTimeoutInterval: 30000,
    showColors: true,
    includeStackTrace: true
  },
  
  // Global setup and teardown
  onPrepare: function() {
    // Set window size for consistent testing
    browser.driver.manage().window().setSize(1280, 1024);
    
    // Add custom matchers
    var customMatchers = require('./test/e2e/helpers/customMatchers');
    jasmine.addMatchers(customMatchers);
    
    // Set up test data
    var testData = require('./test/e2e/helpers/testData');
    global.testData = testData;
    
    // Configure browser settings
    browser.ignoreSynchronization = false;
    browser.manage().timeouts().pageLoadTimeout(40000);
    browser.manage().timeouts().implicitlyWait(25000);
    
    // Add screenshot capability for failed tests
    var fs = require('fs-extra');
    var path = require('path');
    
    jasmine.getEnv().addReporter({
      specDone: function(result) {
        if (result.status === 'failed') {
          browser.takeScreenshot().then(function(png) {
            var stream = fs.createWriteStream(
              path.join('test/e2e/screenshots', result.fullName + '.png')
            );
            stream.write(new Buffer(png, 'base64'));
            stream.end();
          });
        }
      }
    });
    
    // Ensure screenshots directory exists
    fs.ensureDirSync('test/e2e/screenshots');
  },
  
  // Multi-browser testing
  multiCapabilities: [
    {
      'browserName': 'chrome',
      'chromeOptions': {
        'args': ['--headless', '--no-sandbox', '--disable-dev-shm-usage']
      }
    }
  ],
  
  // Test suites
  suites: {
    auth: 'test/e2e/auth/*.spec.js',
    profile: 'test/e2e/profile/*.spec.js',
    session: 'test/e2e/session/*.spec.js',
    leaderboard: 'test/e2e/leaderboard/*.spec.js',
    admin: 'test/e2e/admin/*.spec.js',
    full: 'test/e2e/**/*.spec.js'
  },
  
  // Params for test configuration
  params: {
    testUser: {
      computing_id: 'testuser123',
      first_name: 'Test',
      last_name: 'User'
    },
    adminUser: {
      computing_id: 'admin123',
      first_name: 'Admin',
      last_name: 'User'
    },
    apiUrl: 'http://localhost:3000/api'
  }
};