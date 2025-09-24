// Global setup for Jest tests
module.exports = async () => {
  console.log('Setting up test environment...');
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-key-for-testing';
  process.env.DB_PATH = ':memory:';
  process.env.UPLOAD_DIR = './test/uploads';
  
  // Create test directories if needed
  const fs = require('fs');
  const path = require('path');
  
  const testDirs = [
    './test/uploads',
    './test/fixtures',
    './coverage'
  ];
  
  testDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
  
  console.log('Test environment setup complete');
};