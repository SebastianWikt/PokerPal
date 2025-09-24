// E2E Test Configuration
module.exports = {
  // Environment settings
  environment: {
    baseUrl: process.env.BASE_URL || 'http://localhost:8080',
    apiUrl: process.env.API_URL || 'http://localhost:3000/api',
    seleniumUrl: process.env.SELENIUM_URL || 'http://localhost:4444/wd/hub'
  },

  // Browser configuration
  browser: {
    name: process.env.BROWSER || 'chrome',
    headless: process.env.HEADLESS !== 'false',
    windowSize: {
      width: parseInt(process.env.WINDOW_WIDTH) || 1280,
      height: parseInt(process.env.WINDOW_HEIGHT) || 1024
    },
    implicitWait: 25000,
    pageLoadTimeout: 40000,
    scriptTimeout: 30000
  },

  // Test execution settings
  execution: {
    defaultTimeout: 30000,
    retryAttempts: 2,
    parallel: false,
    maxSessions: 1
  },

  // Test data configuration
  testData: {
    // Override test users if needed
    users: {
      testUser: {
        computing_id: process.env.TEST_USER_ID || 'e2etest123',
        first_name: 'E2E',
        last_name: 'TestUser',
        years_of_experience: 3,
        level: 'Intermediate',
        major: 'Computer Science',
        is_admin: false
      },
      adminUser: {
        computing_id: process.env.ADMIN_USER_ID || 'e2eadmin123',
        first_name: 'E2E',
        last_name: 'AdminUser',
        years_of_experience: 10,
        level: 'Expert',
        major: 'Mathematics',
        is_admin: true
      }
    }
  },

  // Reporting configuration
  reporting: {
    screenshotOnFailure: true,
    screenshotDir: 'test/e2e/screenshots',
    reportDir: 'test/e2e/reports',
    htmlReport: true,
    junitReport: true
  },

  // Feature flags for conditional testing
  features: {
    computerVision: true,
    adminFunctions: true,
    fileUpload: true,
    realTimeUpdates: false
  },

  // Performance thresholds
  performance: {
    pageLoadTime: 5000,
    apiResponseTime: 2000,
    imageProcessingTime: 15000
  },

  // Test suite definitions
  suites: {
    smoke: {
      description: 'Quick smoke tests for critical functionality',
      specs: ['auth/login.spec.js'],
      timeout: 10000
    },
    auth: {
      description: 'Authentication and authorization tests',
      specs: ['auth/*.spec.js'],
      timeout: 30000
    },
    profile: {
      description: 'Profile management tests',
      specs: ['profile/*.spec.js'],
      timeout: 30000
    },
    session: {
      description: 'Session workflow tests',
      specs: ['session/*.spec.js'],
      timeout: 60000
    },
    leaderboard: {
      description: 'Leaderboard display and functionality tests',
      specs: ['leaderboard/*.spec.js'],
      timeout: 30000
    },
    admin: {
      description: 'Admin functions and privilege enforcement tests',
      specs: ['admin/*.spec.js'],
      timeout: 45000
    },
    regression: {
      description: 'Full regression test suite',
      specs: ['**/*.spec.js'],
      timeout: 120000
    }
  }
};