#!/usr/bin/env node

// E2E Test Validation Script
// Validates that all E2E tests are properly implemented and cover required functionality

const fs = require('fs');
const path = require('path');

class E2ETestValidator {
  constructor() {
    this.testDir = path.join(__dirname);
    this.errors = [];
    this.warnings = [];
    this.coverage = {
      auth: [],
      profile: [],
      session: [],
      leaderboard: [],
      admin: []
    };
  }

  // Validate test file structure
  validateFileStructure() {
    console.log('Validating E2E test file structure...');

    const requiredDirs = [
      'auth',
      'profile', 
      'session',
      'leaderboard',
      'admin',
      'helpers',
      'fixtures'
    ];

    const requiredFiles = [
      'helpers/pageObjects.js',
      'helpers/customMatchers.js',
      'helpers/testData.js',
      'config.js',
      'run-e2e-tests.js',
      'README.md'
    ];

    // Check directories
    requiredDirs.forEach(dir => {
      const dirPath = path.join(this.testDir, dir);
      if (!fs.existsSync(dirPath)) {
        this.errors.push(`Missing required directory: ${dir}`);
      }
    });

    // Check files
    requiredFiles.forEach(file => {
      const filePath = path.join(this.testDir, file);
      if (!fs.existsSync(filePath)) {
        this.errors.push(`Missing required file: ${file}`);
      }
    });
  }

  // Validate test specs exist for each module
  validateTestSpecs() {
    console.log('Validating test specifications...');

    const requiredSpecs = [
      'auth/login.spec.js',
      'profile/profile-management.spec.js',
      'session/session-workflow.spec.js',
      'leaderboard/leaderboard-display.spec.js',
      'admin/admin-functions.spec.js'
    ];

    requiredSpecs.forEach(spec => {
      const specPath = path.join(this.testDir, spec);
      if (!fs.existsSync(specPath)) {
        this.errors.push(`Missing test specification: ${spec}`);
      } else {
        this.validateSpecContent(specPath, spec);
      }
    });
  }

  // Validate individual spec file content
  validateSpecContent(filePath, specName) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const module = specName.split('/')[0];

      // Check for required test patterns
      const requiredPatterns = this.getRequiredPatterns(module);
      
      requiredPatterns.forEach(pattern => {
        if (!content.includes(pattern.text)) {
          this.warnings.push(`${specName}: Missing test for ${pattern.description}`);
        } else {
          this.coverage[module].push(pattern.description);
        }
      });

      // Check for proper describe blocks
      const describeMatches = content.match(/describe\(/g);
      if (!describeMatches || describeMatches.length === 0) {
        this.errors.push(`${specName}: No describe blocks found`);
      }

      // Check for proper it blocks
      const itMatches = content.match(/it\(/g);
      if (!itMatches || itMatches.length === 0) {
        this.errors.push(`${specName}: No it blocks found`);
      }

      // Check for page object usage
      if (!content.includes('PageObjects') && !content.includes('require(')) {
        this.warnings.push(`${specName}: Not using page objects pattern`);
      }

      // Check for proper expectations
      const expectMatches = content.match(/expect\(/g);
      if (!expectMatches || expectMatches.length === 0) {
        this.errors.push(`${specName}: No expectations found`);
      }

    } catch (error) {
      this.errors.push(`Failed to read ${specName}: ${error.message}`);
    }
  }

  // Get required test patterns for each module
  getRequiredPatterns(module) {
    const patterns = {
      auth: [
        { text: 'login successfully', description: 'Successful login' },
        { text: 'logout', description: 'Logout functionality' },
        { text: 'route protection', description: 'Route protection' },
        { text: 'authentication state', description: 'Authentication state management' }
      ],
      profile: [
        { text: 'create new profile', description: 'Profile creation' },
        { text: 'edit profile', description: 'Profile editing' },
        { text: 'validate', description: 'Form validation' },
        { text: 'required fields', description: 'Required field validation' }
      ],
      session: [
        { text: 'check-in', description: 'Session check-in' },
        { text: 'check-out', description: 'Session check-out' },
        { text: 'photo upload', description: 'Photo upload' },
        { text: 'computer vision', description: 'Computer vision integration' }
      ],
      leaderboard: [
        { text: 'display', description: 'Leaderboard display' },
        { text: 'sort', description: 'Sorting functionality' },
        { text: 'refresh', description: 'Data refresh' },
        { text: 'ranking', description: 'Player rankings' }
      ],
      admin: [
        { text: 'admin access', description: 'Admin access control' },
        { text: 'privilege', description: 'Privilege enforcement' },
        { text: 'edit player', description: 'Player management' },
        { text: 'session override', description: 'Session overrides' }
      ]
    };

    return patterns[module] || [];
  }

  // Validate page objects
  validatePageObjects() {
    console.log('Validating page objects...');

    const pageObjectsPath = path.join(this.testDir, 'helpers/pageObjects.js');
    
    if (!fs.existsSync(pageObjectsPath)) {
      this.errors.push('Page objects file not found');
      return;
    }

    try {
      const content = fs.readFileSync(pageObjectsPath, 'utf8');

      const requiredPageObjects = [
        'LoginPage',
        'HomePage', 
        'ProfilePage',
        'SessionPage',
        'LeaderboardPage',
        'AdminPage'
      ];

      requiredPageObjects.forEach(pageObject => {
        if (!content.includes(`${pageObject} = function`)) {
          this.errors.push(`Missing page object: ${pageObject}`);
        }
      });

      // Check for proper method definitions
      const methodPatterns = [
        'this.get = function',
        'this.login = function',
        'this.save = function',
        'this.cancel = function'
      ];

      methodPatterns.forEach(pattern => {
        if (!content.includes(pattern)) {
          this.warnings.push(`Page objects may be missing common methods: ${pattern}`);
        }
      });

    } catch (error) {
      this.errors.push(`Failed to validate page objects: ${error.message}`);
    }
  }

  // Validate test data
  validateTestData() {
    console.log('Validating test data...');

    const testDataPath = path.join(this.testDir, 'helpers/testData.js');
    
    if (!fs.existsSync(testDataPath)) {
      this.errors.push('Test data file not found');
      return;
    }

    try {
      const content = fs.readFileSync(testDataPath, 'utf8');

      const requiredDataSections = [
        'users',
        'sessions',
        'chipValues',
        'timeouts',
        'fixtures'
      ];

      requiredDataSections.forEach(section => {
        if (!content.includes(`${section}:`)) {
          this.warnings.push(`Test data missing section: ${section}`);
        }
      });

      // Check for required test users
      const requiredUsers = ['testUser', 'adminUser', 'newUser'];
      requiredUsers.forEach(user => {
        if (!content.includes(`${user}:`)) {
          this.errors.push(`Test data missing required user: ${user}`);
        }
      });

    } catch (error) {
      this.errors.push(`Failed to validate test data: ${error.message}`);
    }
  }

  // Validate configuration files
  validateConfiguration() {
    console.log('Validating configuration files...');

    // Check protractor.conf.js
    const protractorConfPath = path.join(__dirname, '../../protractor.conf.js');
    if (!fs.existsSync(protractorConfPath)) {
      this.errors.push('Protractor configuration file not found');
    } else {
      try {
        const content = fs.readFileSync(protractorConfPath, 'utf8');
        
        const requiredConfig = [
          'seleniumAddress',
          'capabilities',
          'framework',
          'specs',
          'baseUrl',
          'jasmineNodeOpts'
        ];

        requiredConfig.forEach(config => {
          if (!content.includes(config)) {
            this.warnings.push(`Protractor config missing: ${config}`);
          }
        });

      } catch (error) {
        this.errors.push(`Failed to validate Protractor config: ${error.message}`);
      }
    }

    // Check E2E config
    const e2eConfigPath = path.join(this.testDir, 'config.js');
    if (fs.existsSync(e2eConfigPath)) {
      try {
        const content = fs.readFileSync(e2eConfigPath, 'utf8');
        
        if (!content.includes('environment') || !content.includes('browser')) {
          this.warnings.push('E2E config may be incomplete');
        }

      } catch (error) {
        this.warnings.push(`Failed to validate E2E config: ${error.message}`);
      }
    }
  }

  // Validate test fixtures
  validateFixtures() {
    console.log('Validating test fixtures...');

    const fixturesDir = path.join(this.testDir, 'fixtures');
    
    if (!fs.existsSync(fixturesDir)) {
      this.errors.push('Fixtures directory not found');
      return;
    }

    const requiredFixtures = [
      'test-chips.jpg',
      'test-chips-end.jpg',
      'invalid-file.txt',
      'corrupted-image.jpg',
      'sampleImages.js'
    ];

    requiredFixtures.forEach(fixture => {
      const fixturePath = path.join(fixturesDir, fixture);
      if (!fs.existsSync(fixturePath)) {
        this.warnings.push(`Missing test fixture: ${fixture}`);
      }
    });
  }

  // Generate coverage report
  generateCoverageReport() {
    console.log('\n=== E2E Test Coverage Report ===');
    
    Object.keys(this.coverage).forEach(module => {
      console.log(`\n${module.toUpperCase()} Module:`);
      if (this.coverage[module].length === 0) {
        console.log('  No test coverage detected');
      } else {
        this.coverage[module].forEach(test => {
          console.log(`  ✓ ${test}`);
        });
      }
    });
  }

  // Run all validations
  validate() {
    console.log('Starting E2E test validation...\n');

    this.validateFileStructure();
    this.validateTestSpecs();
    this.validatePageObjects();
    this.validateTestData();
    this.validateConfiguration();
    this.validateFixtures();

    // Report results
    console.log('\n=== Validation Results ===');
    
    if (this.errors.length === 0) {
      console.log('✅ No critical errors found');
    } else {
      console.log(`❌ Found ${this.errors.length} error(s):`);
      this.errors.forEach(error => console.log(`  - ${error}`));
    }

    if (this.warnings.length === 0) {
      console.log('✅ No warnings');
    } else {
      console.log(`⚠️  Found ${this.warnings.length} warning(s):`);
      this.warnings.forEach(warning => console.log(`  - ${warning}`));
    }

    this.generateCoverageReport();

    // Exit with appropriate code
    if (this.errors.length > 0) {
      console.log('\n❌ Validation failed due to critical errors');
      process.exit(1);
    } else {
      console.log('\n✅ E2E test validation completed successfully');
      process.exit(0);
    }
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new E2ETestValidator();
  validator.validate();
}

module.exports = E2ETestValidator;