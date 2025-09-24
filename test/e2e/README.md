# End-to-End Testing for PokerPal

This directory contains comprehensive end-to-end (E2E) tests for the PokerPal poker tracking application using Protractor and Jasmine.

## Overview

The E2E tests validate complete user workflows from login to logout, ensuring all features work correctly in a real browser environment. Tests cover:

- **Authentication Flow**: Login, logout, session management, route protection
- **Profile Management**: Profile creation, editing, validation
- **Session Workflow**: Check-in/check-out, photo upload, computer vision integration
- **Leaderboard Display**: Rankings, sorting, real-time updates
- **Admin Functions**: User management, session overrides, privilege enforcement

## Test Structure

```
test/e2e/
├── auth/                   # Authentication tests
├── profile/               # Profile management tests
├── session/               # Session workflow tests
├── leaderboard/           # Leaderboard functionality tests
├── admin/                 # Admin functions tests
├── helpers/               # Test utilities and page objects
│   ├── pageObjects.js     # Page Object Model definitions
│   ├── customMatchers.js  # Custom Jasmine matchers
│   └── testData.js        # Test data and fixtures
├── fixtures/              # Test files (images, etc.)
├── screenshots/           # Failure screenshots (auto-generated)
├── reports/               # Test reports (auto-generated)
├── config.js              # E2E test configuration
├── run-e2e-tests.js       # Test runner script
└── README.md              # This file
```

## Prerequisites

1. **Node.js** (v14 or higher)
2. **Chrome browser** (for headless testing)
3. **Java** (for Selenium WebDriver)

Install dependencies:
```bash
npm install
npm run webdriver:update
```

## Running Tests

### Quick Start
```bash
# Run all E2E tests
npm run test:e2e

# Run specific test suite
npm run test:e2e:auth
npm run test:e2e:profile
npm run test:e2e:session
npm run test:e2e:leaderboard
npm run test:e2e:admin

# Run smoke tests (quick validation)
npm run test:e2e:smoke
```

### Advanced Usage
```bash
# Run with custom configuration
BASE_URL=http://localhost:3000 npm run test:e2e

# Run in visible browser (non-headless)
HEADLESS=false npm run test:e2e:auth

# Run with custom window size
WINDOW_WIDTH=1920 WINDOW_HEIGHT=1080 npm run test:e2e
```

### Direct Protractor Usage
```bash
# Run Protractor directly
npm run test:e2e:protractor

# Run specific suite with Protractor
npx protractor protractor.conf.js --suite=auth
```

## Test Suites

### Authentication Tests (`auth/`)
- **Login Process**: Valid/invalid credentials, new user flow
- **Logout Process**: Session cleanup, redirect behavior
- **Route Protection**: Authenticated/unauthenticated access
- **Session Persistence**: Refresh behavior, token management

### Profile Management Tests (`profile/`)
- **Profile Creation**: New user registration, validation
- **Profile Editing**: Update existing profiles, field restrictions
- **Form Validation**: Required fields, format validation
- **Navigation**: Profile access from different entry points

### Session Workflow Tests (`session/`)
- **Check-in Process**: Session creation, photo upload
- **Check-out Process**: Session completion, winnings calculation
- **Computer Vision**: Image analysis, chip detection
- **Error Handling**: Network errors, invalid files

### Leaderboard Tests (`leaderboard/`)
- **Display Logic**: Player rankings, sorting accuracy
- **Data Refresh**: Real-time updates, manual refresh
- **User Highlighting**: Current user identification
- **Responsive Design**: Mobile/tablet compatibility

### Admin Function Tests (`admin/`)
- **Access Control**: Admin-only features, privilege enforcement
- **Player Management**: Edit/delete players, data validation
- **Session Management**: Override session data, audit logging
- **System Statistics**: Accurate counts, data consistency

## Page Object Model

Tests use the Page Object Model pattern for maintainable and reusable code:

```javascript
// Example usage
const PageObjects = require('../helpers/pageObjects');
const loginPage = new PageObjects.LoginPage();

loginPage.get();
loginPage.login('testuser123');
expect(loginPage.isErrorDisplayed()).toBe(false);
```

### Available Page Objects
- `LoginPage`: Login form interactions
- `HomePage`: Main navigation and user actions
- `ProfilePage`: Profile creation and editing
- `SessionPage`: Session workflow and photo upload
- `LeaderboardPage`: Leaderboard display and refresh
- `AdminPage`: Admin panel functionality

## Test Data Management

Test data is centralized in `helpers/testData.js`:

```javascript
const testData = require('./helpers/testData');

// Use predefined test users
loginPage.login(testData.users.testUser.computing_id);

// Use test fixtures
sessionPage.uploadPhoto(testData.fixtures.validImage);
```

### Test Users
- `testUser`: Regular user with existing data
- `adminUser`: Admin user with elevated privileges
- `newUser`: New user for registration testing
- `playerWithNegativeWinnings`: User with losses

## Custom Matchers

Enhanced Jasmine matchers for better assertions:

```javascript
// Element visibility
expect(element).toBeDisplayed();

// Text content
expect(element).toHaveText('Expected Text');
expect(element).toContainText('Partial Text');

// Attributes and properties
expect(element).toHaveClass('css-class');
expect(element).toHaveValue('input-value');
expect(element).toBeEnabled();
expect(element).toBeSelected();

// Collections
expect(elementList).toHaveCount(5);
```

## Configuration

### Environment Variables
- `BASE_URL`: Frontend application URL (default: http://localhost:8080)
- `API_URL`: Backend API URL (default: http://localhost:3000/api)
- `BROWSER`: Browser to use (default: chrome)
- `HEADLESS`: Run in headless mode (default: true)
- `WINDOW_WIDTH/HEIGHT`: Browser window size

### Test Configuration
Edit `config.js` to customize:
- Browser settings
- Timeout values
- Test data
- Feature flags
- Performance thresholds

## Debugging Tests

### Screenshots on Failure
Failed tests automatically capture screenshots saved to `test/e2e/screenshots/`.

### Running in Visible Browser
```bash
HEADLESS=false npm run test:e2e:auth
```

### Verbose Logging
```bash
DEBUG=true npm run test:e2e
```

### Debugging Specific Tests
```bash
# Run single test file
npx protractor protractor.conf.js --specs=test/e2e/auth/login.spec.js

# Add browser.pause() in test code for manual debugging
it('should debug this test', function() {
  loginPage.get();
  browser.pause(); // Pauses execution for manual inspection
  loginPage.login('testuser');
});
```

## Continuous Integration

### GitHub Actions Example
```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm install
      - run: npm run webdriver:update
      - run: npm run test:e2e
```

### Jenkins Pipeline
```groovy
pipeline {
  agent any
  stages {
    stage('E2E Tests') {
      steps {
        sh 'npm install'
        sh 'npm run webdriver:update'
        sh 'npm run test:e2e'
      }
      post {
        always {
          publishHTML([
            allowMissing: false,
            alwaysLinkToLastBuild: true,
            keepAll: true,
            reportDir: 'test/e2e/reports',
            reportFiles: 'index.html',
            reportName: 'E2E Test Report'
          ])
        }
      }
    }
  }
}
```

## Troubleshooting

### Common Issues

1. **WebDriver Issues**
   ```bash
   npm run webdriver:update
   ```

2. **Port Conflicts**
   ```bash
   # Check for running processes
   lsof -i :3000
   lsof -i :8080
   lsof -i :4444
   ```

3. **Chrome/Selenium Issues**
   ```bash
   # Update Chrome and WebDriver
   npm run webdriver:update
   ```

4. **Test Timeouts**
   - Increase timeout values in `config.js`
   - Check server startup times
   - Verify network connectivity

### Performance Issues
- Use `--suite` flag to run smaller test sets
- Increase browser window size for better element detection
- Check system resources during test execution

### Test Flakiness
- Add explicit waits for dynamic content
- Use `browser.wait()` instead of `browser.sleep()`
- Verify test data setup and cleanup

## Best Practices

1. **Test Independence**: Each test should be able to run independently
2. **Data Cleanup**: Clean up test data after each test
3. **Explicit Waits**: Use `browser.wait()` for dynamic content
4. **Page Objects**: Keep page interactions in page object methods
5. **Descriptive Names**: Use clear, descriptive test and variable names
6. **Error Handling**: Test both success and failure scenarios
7. **Performance**: Keep tests focused and avoid unnecessary operations

## Contributing

When adding new E2E tests:

1. Follow the existing page object pattern
2. Add test data to `testData.js`
3. Use custom matchers for better assertions
4. Include both positive and negative test cases
5. Update this README if adding new test suites
6. Ensure tests pass in both headless and visible modes

## Support

For issues with E2E tests:
1. Check the troubleshooting section above
2. Review test logs and screenshots
3. Verify application functionality manually
4. Check Protractor and WebDriver documentation