#!/usr/bin/env node

// Comprehensive test runner for PokerPal application
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const testConfig = {
  backend: {
    command: 'npm',
    args: ['run', 'test:backend'],
    description: 'Backend unit tests (Jest)'
  },
  frontend: {
    command: 'npm',
    args: ['run', 'test:frontend'],
    description: 'Frontend unit tests (Karma/Jasmine)'
  },
  e2e: {
    command: 'npm',
    args: ['run', 'test:e2e'],
    description: 'End-to-end tests (Protractor)',
    requiresServer: true
  }
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logHeader(message) {
  log(`\n${'='.repeat(60)}`, colors.cyan);
  log(`${message}`, colors.cyan + colors.bright);
  log(`${'='.repeat(60)}`, colors.cyan);
}

function logSuccess(message) {
  log(`✓ ${message}`, colors.green);
}

function logError(message) {
  log(`✗ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠ ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`ℹ ${message}`, colors.blue);
}

// Run a test suite
function runTest(testName, config) {
  return new Promise((resolve, reject) => {
    logHeader(`Running ${config.description}`);
    
    const child = spawn(config.command, config.args, {
      stdio: 'inherit',
      shell: true
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        logSuccess(`${testName} tests passed`);
        resolve();
      } else {
        logError(`${testName} tests failed with code ${code}`);
        reject(new Error(`${testName} tests failed`));
      }
    });
    
    child.on('error', (error) => {
      logError(`Failed to start ${testName} tests: ${error.message}`);
      reject(error);
    });
  });
}

// Check if required files exist
function checkTestFiles() {
  const requiredFiles = [
    'jest.config.js',
    'karma.conf.js',
    'protractor.conf.js',
    'test/setup.js',
    'test/globalSetup.js',
    'test/globalTeardown.js'
  ];
  
  const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
  
  if (missingFiles.length > 0) {
    logError('Missing required test configuration files:');
    missingFiles.forEach(file => logError(`  - ${file}`));
    return false;
  }
  
  return true;
}

// Check if test directories exist
function checkTestDirectories() {
  const requiredDirs = [
    'test/unit',
    'test/e2e',
    'server/test/unit'
  ];
  
  const missingDirs = requiredDirs.filter(dir => !fs.existsSync(dir));
  
  if (missingDirs.length > 0) {
    logWarning('Missing test directories (will be created):');
    missingDirs.forEach(dir => {
      logWarning(`  - ${dir}`);
      fs.mkdirSync(dir, { recursive: true });
    });
  }
  
  return true;
}

// Start application servers for E2E tests
function startServers() {
  return new Promise((resolve, reject) => {
    logInfo('Starting application servers for E2E tests...');
    
    // Start backend server
    const backendServer = spawn('npm', ['run', 'dev'], {
      stdio: 'pipe',
      shell: true,
      env: { ...process.env, NODE_ENV: 'test' }
    });
    
    // Start frontend server (if needed)
    const frontendServer = spawn('node', ['start-frontend.js'], {
      stdio: 'pipe',
      shell: true
    });
    
    // Wait for servers to start
    setTimeout(() => {
      logSuccess('Servers started');
      resolve({ backendServer, frontendServer });
    }, 5000);
    
    backendServer.on('error', reject);
    frontendServer.on('error', reject);
  });
}

// Stop application servers
function stopServers(servers) {
  if (servers) {
    logInfo('Stopping application servers...');
    
    if (servers.backendServer) {
      servers.backendServer.kill();
    }
    
    if (servers.frontendServer) {
      servers.frontendServer.kill();
    }
    
    logSuccess('Servers stopped');
  }
}

// Generate test report
function generateReport(results) {
  logHeader('Test Results Summary');
  
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  
  Object.entries(results).forEach(([testName, result]) => {
    totalTests++;
    
    if (result.success) {
      passedTests++;
      logSuccess(`${testName}: PASSED`);
    } else {
      failedTests++;
      logError(`${testName}: FAILED - ${result.error}`);
    }
  });
  
  log('\n' + '='.repeat(60), colors.cyan);
  log(`Total test suites: ${totalTests}`, colors.bright);
  log(`Passed: ${passedTests}`, colors.green);
  log(`Failed: ${failedTests}`, failedTests > 0 ? colors.red : colors.green);
  log(`Success rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`, 
      failedTests > 0 ? colors.yellow : colors.green);
  log('='.repeat(60), colors.cyan);
  
  return failedTests === 0;
}

// Main test runner
async function runAllTests() {
  logHeader('PokerPal Test Suite Runner');
  
  // Pre-flight checks
  if (!checkTestFiles()) {
    process.exit(1);
  }
  
  checkTestDirectories();
  
  const results = {};
  let servers = null;
  
  try {
    // Run backend tests
    try {
      await runTest('backend', testConfig.backend);
      results.backend = { success: true };
    } catch (error) {
      results.backend = { success: false, error: error.message };
    }
    
    // Run frontend tests
    try {
      await runTest('frontend', testConfig.frontend);
      results.frontend = { success: true };
    } catch (error) {
      results.frontend = { success: false, error: error.message };
    }
    
    // Run E2E tests (requires servers)
    try {
      servers = await startServers();
      await runTest('e2e', testConfig.e2e);
      results.e2e = { success: true };
    } catch (error) {
      results.e2e = { success: false, error: error.message };
    } finally {
      stopServers(servers);
    }
    
    // Generate final report
    const allTestsPassed = generateReport(results);
    
    if (allTestsPassed) {
      logSuccess('\nAll tests passed! 🎉');
      process.exit(0);
    } else {
      logError('\nSome tests failed! 😞');
      process.exit(1);
    }
    
  } catch (error) {
    logError(`Test runner error: ${error.message}`);
    stopServers(servers);
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  log('PokerPal Test Suite Runner', colors.bright);
  log('\nUsage: node test/run-all-tests.js [options]');
  log('\nOptions:');
  log('  --help, -h     Show this help message');
  log('  --backend      Run only backend tests');
  log('  --frontend     Run only frontend tests');
  log('  --e2e          Run only E2E tests');
  log('  --no-e2e       Skip E2E tests');
  log('\nExamples:');
  log('  node test/run-all-tests.js');
  log('  node test/run-all-tests.js --backend');
  log('  node test/run-all-tests.js --no-e2e');
  process.exit(0);
}

// Handle specific test suite requests
if (args.includes('--backend')) {
  runTest('backend', testConfig.backend)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
} else if (args.includes('--frontend')) {
  runTest('frontend', testConfig.frontend)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
} else if (args.includes('--e2e')) {
  startServers()
    .then(servers => {
      return runTest('e2e', testConfig.e2e)
        .finally(() => stopServers(servers));
    })
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
} else {
  // Run all tests
  runAllTests();
}