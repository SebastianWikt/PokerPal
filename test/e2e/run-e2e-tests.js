#!/usr/bin/env node

// E2E Test Runner for PokerPal Application
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  // Server configuration
  serverPort: 3000,
  frontendPort: 8080,
  seleniumPort: 4444,
  
  // Test configuration
  testTimeout: 60000,
  retryAttempts: 2,
  
  // Directories
  screenshotDir: 'test/e2e/screenshots',
  reportDir: 'test/e2e/reports',
  
  // Test suites
  suites: {
    smoke: ['auth/login.spec.js'],
    auth: ['auth/*.spec.js'],
    profile: ['profile/*.spec.js'],
    session: ['session/*.spec.js'],
    leaderboard: ['leaderboard/*.spec.js'],
    admin: ['admin/*.spec.js'],
    full: ['**/*.spec.js']
  }
};

class E2ETestRunner {
  constructor() {
    this.processes = [];
    this.isSetupComplete = false;
  }

  // Ensure required directories exist
  setupDirectories() {
    const dirs = [config.screenshotDir, config.reportDir];
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
      }
    });
  }

  // Start the backend server
  async startBackendServer() {
    return new Promise((resolve, reject) => {
      console.log('Starting backend server...');
      
      const serverProcess = spawn('node', ['server/app.js'], {
        env: {
          ...process.env,
          NODE_ENV: 'test',
          PORT: config.serverPort,
          DB_PATH: ':memory:',
          JWT_SECRET: 'test-secret-key'
        },
        stdio: 'pipe'
      });

      this.processes.push(serverProcess);

      serverProcess.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('Server running on port')) {
          console.log('Backend server started successfully');
          resolve();
        }
      });

      serverProcess.stderr.on('data', (data) => {
        console.error('Backend server error:', data.toString());
      });

      serverProcess.on('error', (error) => {
        console.error('Failed to start backend server:', error);
        reject(error);
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        reject(new Error('Backend server startup timeout'));
      }, 30000);
    });
  }

  // Start the frontend server
  async startFrontendServer() {
    return new Promise((resolve, reject) => {
      console.log('Starting frontend server...');
      
      const frontendProcess = spawn('node', ['start-frontend.js'], {
        env: {
          ...process.env,
          PORT: config.frontendPort
        },
        stdio: 'pipe'
      });

      this.processes.push(frontendProcess);

      frontendProcess.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('Frontend server running') || output.includes('listening on')) {
          console.log('Frontend server started successfully');
          resolve();
        }
      });

      frontendProcess.stderr.on('data', (data) => {
        console.error('Frontend server error:', data.toString());
      });

      frontendProcess.on('error', (error) => {
        console.error('Failed to start frontend server:', error);
        reject(error);
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        reject(new Error('Frontend server startup timeout'));
      }, 30000);
    });
  }

  // Start Selenium WebDriver
  async startSelenium() {
    return new Promise((resolve, reject) => {
      console.log('Starting Selenium WebDriver...');
      
      // Check if selenium is already running
      const checkProcess = spawn('curl', ['-s', `http://localhost:${config.seleniumPort}/wd/hub/status`], {
        stdio: 'pipe'
      });

      checkProcess.on('close', (code) => {
        if (code === 0) {
          console.log('Selenium WebDriver already running');
          resolve();
        } else {
          // Start selenium
          const seleniumProcess = spawn('webdriver-manager', ['start'], {
            stdio: 'pipe'
          });

          this.processes.push(seleniumProcess);

          seleniumProcess.stdout.on('data', (data) => {
            const output = data.toString();
            if (output.includes('Selenium Server is up and running')) {
              console.log('Selenium WebDriver started successfully');
              resolve();
            }
          });

          seleniumProcess.stderr.on('data', (data) => {
            console.error('Selenium error:', data.toString());
          });

          seleniumProcess.on('error', (error) => {
            console.error('Failed to start Selenium:', error);
            reject(error);
          });

          // Timeout after 60 seconds
          setTimeout(() => {
            reject(new Error('Selenium startup timeout'));
          }, 60000);
        }
      });
    });
  }

  // Setup test data
  async setupTestData() {
    console.log('Setting up test data...');
    
    try {
      // Create test users via API
      const testUsers = require('./helpers/testData').users;
      
      for (const [key, user] of Object.entries(testUsers)) {
        await this.createTestUser(user);
      }
      
      console.log('Test data setup complete');
    } catch (error) {
      console.error('Failed to setup test data:', error);
      throw error;
    }
  }

  // Create a test user via API
  async createTestUser(userData) {
    const fetch = require('node-fetch');
    
    try {
      const response = await fetch(`http://localhost:${config.serverPort}/api/players`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      if (!response.ok && response.status !== 409) { // 409 = user already exists
        throw new Error(`Failed to create test user: ${response.statusText}`);
      }
    } catch (error) {
      // Ignore errors for existing users
      if (!error.message.includes('already exists')) {
        console.warn(`Warning: Could not create test user ${userData.computing_id}:`, error.message);
      }
    }
  }

  // Run Protractor tests
  async runProtractorTests(suite = 'full') {
    return new Promise((resolve, reject) => {
      console.log(`Running E2E tests for suite: ${suite}`);
      
      const protractorArgs = ['protractor.conf.js'];
      
      if (suite !== 'full' && config.suites[suite]) {
        protractorArgs.push('--suite', suite);
      }

      const protractorProcess = spawn('npx', ['protractor', ...protractorArgs], {
        stdio: 'inherit',
        env: {
          ...process.env,
          BASE_URL: `http://localhost:${config.frontendPort}`,
          API_URL: `http://localhost:${config.serverPort}/api`
        }
      });

      protractorProcess.on('close', (code) => {
        if (code === 0) {
          console.log('E2E tests completed successfully');
          resolve();
        } else {
          console.error(`E2E tests failed with exit code: ${code}`);
          reject(new Error(`Tests failed with exit code: ${code}`));
        }
      });

      protractorProcess.on('error', (error) => {
        console.error('Failed to run Protractor tests:', error);
        reject(error);
      });
    });
  }

  // Cleanup all processes
  cleanup() {
    console.log('Cleaning up test processes...');
    
    this.processes.forEach((process, index) => {
      try {
        process.kill('SIGTERM');
        console.log(`Terminated process ${index + 1}`);
      } catch (error) {
        console.warn(`Failed to terminate process ${index + 1}:`, error.message);
      }
    });

    this.processes = [];
  }

  // Main test execution
  async run(suite = 'full') {
    try {
      console.log('Starting E2E test execution...');
      
      // Setup
      this.setupDirectories();
      
      // Start services
      await this.startBackendServer();
      await this.startFrontendServer();
      
      // Wait a moment for servers to stabilize
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Setup test data
      await this.setupTestData();
      
      // Run tests
      await this.runProtractorTests(suite);
      
      console.log('E2E test execution completed successfully');
      
    } catch (error) {
      console.error('E2E test execution failed:', error);
      process.exit(1);
    } finally {
      this.cleanup();
    }
  }
}

// CLI interface
if (require.main === module) {
  const suite = process.argv[2] || 'full';
  
  if (!config.suites[suite]) {
    console.error(`Invalid test suite: ${suite}`);
    console.error(`Available suites: ${Object.keys(config.suites).join(', ')}`);
    process.exit(1);
  }

  const runner = new E2ETestRunner();
  
  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\nReceived SIGINT, cleaning up...');
    runner.cleanup();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\nReceived SIGTERM, cleaning up...');
    runner.cleanup();
    process.exit(0);
  });

  // Run tests
  runner.run(suite);
}

module.exports = E2ETestRunner;