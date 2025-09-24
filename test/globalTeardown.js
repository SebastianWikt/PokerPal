// Global teardown for Jest tests
module.exports = async () => {
  console.log('Cleaning up test environment...');
  
  // Clean up test files and directories
  const fs = require('fs');
  const path = require('path');
  
  const cleanupDirs = [
    './test/uploads'
  ];
  
  cleanupDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
      } catch (error) {
        console.warn(`Failed to clean up ${dir}:`, error.message);
      }
    }
  });
  
  console.log('Test environment cleanup complete');
};