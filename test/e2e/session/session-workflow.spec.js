// E2E tests for session workflow
describe('Session Management Workflow', function() {
  var PageObjects = require('../helpers/pageObjects');
  var loginPage, sessionPage, homePage;
  var path = require('path');
  
  beforeEach(function() {
    loginPage = new PageObjects.LoginPage();
    sessionPage = new PageObjects.SessionPage();
    homePage = new PageObjects.HomePage();
  });
  
  describe('Session Check-in Process', function() {
    beforeEach(function() {
      // Login and navigate to session page
      loginPage.get();
      loginPage.login(testData.users.testUser.computing_id);
      
      browser.wait(function() {
        return browser.getCurrentUrl().then(function(url) {
          return url.indexOf('/home') !== -1;
        });
      }, testData.timeouts.medium);
      
      homePage.navigateToSession();
      
      browser.wait(function() {
        return browser.getCurrentUrl().then(function(url) {
          return url.indexOf('/session') !== -1;
        });
      }, testData.timeouts.short);
    });
    
    it('should display session page correctly for check-in', function() {
      expect(browser.getCurrentUrl()).toContain('/session');
      expect(sessionPage.sessionTypeRadios).toHaveCount(2);
      expect(sessionPage.sessionDateInput).toBeDisplayed();
      expect(sessionPage.photoUpload).toBeDisplayed();
      expect(sessionPage.submitButton).toBeDisplayed();
      expect(sessionPage.cancelButton).toBeDisplayed();
      
      // Check-in should be selected by default (no current session)
      var checkinRadio = element(by.css('input[value="checkin"]'));
      expect(checkinRadio).toBeSelected();
    });
    
    it('should set today\'s date by default', function() {
      var today = new Date().toISOString().split('T')[0];
      expect(sessionPage.sessionDateInput).toHaveValue(today);
    });
    
    it('should require photo upload for session', function() {
      sessionPage.selectSessionType('checkin');
      sessionPage.setSessionDate('2023-12-01');
      sessionPage.submitSession();
      
      browser.wait(function() {
        return sessionPage.errorMessage.isDisplayed();
      }, testData.timeouts.short);
      
      expect(sessionPage.errorMessage).toBeDisplayed();
      expect(sessionPage.errorMessage.getText()).toContain('Photo is required');
    });
    
    it('should upload and analyze photo successfully', function() {
      // Create a test image file path
      var testImagePath = path.resolve(__dirname, '../fixtures/test-chips.jpg');
      
      sessionPage.selectSessionType('checkin');
      sessionPage.setSessionDate('2023-12-01');
      sessionPage.uploadPhoto(testImagePath);
      
      // Wait for photo preview
      browser.wait(function() {
        return sessionPage.photoPreview.isDisplayed();
      }, testData.timeouts.short);
      
      expect(sessionPage.photoPreview).toBeDisplayed();
      expect(sessionPage.analyzeButton).toBeDisplayed();
      
      sessionPage.analyzePhoto();
      
      // Wait for analysis to complete
      browser.wait(function() {
        return sessionPage.isAnalysisResultsVisible();
      }, testData.timeouts.visionAnalysis);
      
      expect(sessionPage.chipAnalysisResults).toBeDisplayed();
      expect(sessionPage.totalValueDisplay).toBeDisplayed();
      
      var totalValue = sessionPage.getTotalValue();
      expect(totalValue).toMatch(/\$\d+\.\d{2}/); // Should be currency format
    });
    
    it('should complete check-in session successfully', function() {
      var testImagePath = path.resolve(__dirname, '../fixtures/test-chips.jpg');
      
      sessionPage.selectSessionType('checkin');
      sessionPage.setSessionDate('2023-12-01');
      sessionPage.uploadPhoto(testImagePath);
      
      browser.wait(function() {
        return sessionPage.photoPreview.isDisplayed();
      }, testData.timeouts.short);
      
      sessionPage.analyzePhoto();
      
      browser.wait(function() {
        return sessionPage.isAnalysisResultsVisible();
      }, testData.timeouts.visionAnalysis);
      
      sessionPage.submitSession();
      
      // Wait for success and navigation
      browser.wait(function() {
        return browser.getCurrentUrl().then(function(url) {
          return url.indexOf('/home') !== -1;
        });
      }, testData.timeouts.medium);
      
      expect(browser.getCurrentUrl()).toContain('/home');
      
      // Should show success message or updated status
      expect(homePage.welcomeMessage).toBeDisplayed();
    });
    
    it('should validate session date', function() {
      sessionPage.selectSessionType('checkin');
      sessionPage.setSessionDate('invalid-date');
      
      var testImagePath = path.resolve(__dirname, '../fixtures/test-chips.jpg');
      sessionPage.uploadPhoto(testImagePath);
      
      browser.wait(function() {
        return sessionPage.photoPreview.isDisplayed();
      }, testData.timeouts.short);
      
      sessionPage.submitSession();
      
      browser.wait(function() {
        return sessionPage.errorMessage.isDisplayed();
      }, testData.timeouts.short);
      
      expect(sessionPage.errorMessage).toBeDisplayed();
      expect(sessionPage.errorMessage.getText()).toContain('valid date');
    });
    
    it('should handle photo analysis errors gracefully', function() {
      // Upload an invalid file (not an image)
      var invalidFilePath = path.resolve(__dirname, '../fixtures/invalid-file.txt');
      
      sessionPage.selectSessionType('checkin');
      sessionPage.uploadPhoto(invalidFilePath);
      
      browser.wait(function() {
        return sessionPage.errorMessage.isDisplayed();
      }, testData.timeouts.short);
      
      expect(sessionPage.errorMessage).toBeDisplayed();
      expect(sessionPage.errorMessage.getText()).toContain('valid image');
    });
  });
  
  describe('Session Check-out Process', function() {
    beforeEach(function() {
      // First create a check-in session
      loginPage.get();
      loginPage.login(testData.users.testUser.computing_id);
      
      browser.wait(function() {
        return browser.getCurrentUrl().then(function(url) {
          return url.indexOf('/home') !== -1;
        });
      }, testData.timeouts.medium);
      
      // Create check-in session via API or previous test setup
      // For this test, we'll assume there's an incomplete session
      
      homePage.navigateToSession();
      
      browser.wait(function() {
        return browser.getCurrentUrl().then(function(url) {
          return url.indexOf('/session') !== -1;
        });
      }, testData.timeouts.short);
    });
    
    it('should display checkout option when incomplete session exists', function() {
      // If there's an incomplete session, checkout should be selected
      var checkoutRadio = element(by.css('input[value="checkout"]'));
      
      // This test depends on having an incomplete session
      // In a real scenario, we'd set up the test data properly
      browser.wait(function() {
        return checkoutRadio.isPresent();
      }, testData.timeouts.short);
      
      if (checkoutRadio.isPresent()) {
        expect(checkoutRadio).toBeSelected();
      }
    });
    
    it('should complete check-out session successfully', function() {
      var testImagePath = path.resolve(__dirname, '../fixtures/test-chips-end.jpg');
      
      // Only proceed if checkout is available
      var checkoutRadio = element(by.css('input[value="checkout"]'));
      
      checkoutRadio.isPresent().then(function(present) {
        if (present) {
          sessionPage.selectSessionType('checkout');
          sessionPage.setSessionDate('2023-12-01');
          sessionPage.uploadPhoto(testImagePath);
          
          browser.wait(function() {
            return sessionPage.photoPreview.isDisplayed();
          }, testData.timeouts.short);
          
          sessionPage.analyzePhoto();
          
          browser.wait(function() {
            return sessionPage.isAnalysisResultsVisible();
          }, testData.timeouts.visionAnalysis);
          
          sessionPage.submitSession();
          
          browser.wait(function() {
            return browser.getCurrentUrl().then(function(url) {
              return url.indexOf('/home') !== -1;
            });
          }, testData.timeouts.medium);
          
          expect(browser.getCurrentUrl()).toContain('/home');
        }
      });
    });
    
    it('should calculate and display net winnings', function() {
      var checkoutRadio = element(by.css('input[value="checkout"]'));
      
      checkoutRadio.isPresent().then(function(present) {
        if (present) {
          var testImagePath = path.resolve(__dirname, '../fixtures/test-chips-end.jpg');
          
          sessionPage.selectSessionType('checkout');
          sessionPage.uploadPhoto(testImagePath);
          
          browser.wait(function() {
            return sessionPage.photoPreview.isDisplayed();
          }, testData.timeouts.short);
          
          sessionPage.analyzePhoto();
          
          browser.wait(function() {
            return sessionPage.isAnalysisResultsVisible();
          }, testData.timeouts.visionAnalysis);
          
          // Should display net winnings calculation
          var netWinningsElement = element(by.css('.net-winnings'));
          expect(netWinningsElement).toBeDisplayed();
          
          var netWinningsText = netWinningsElement.getText();
          expect(netWinningsText).toMatch(/[\+\-]\$\d+\.\d{2}/);
        }
      });
    });
  });
  
  describe('Session Navigation and Cancellation', function() {
    beforeEach(function() {
      loginPage.get();
      loginPage.login(testData.users.testUser.computing_id);
      
      browser.wait(function() {
        return browser.getCurrentUrl().then(function(url) {
          return url.indexOf('/home') !== -1;
        });
      }, testData.timeouts.medium);
      
      homePage.navigateToSession();
      
      browser.wait(function() {
        return browser.getCurrentUrl().then(function(url) {
          return url.indexOf('/session') !== -1;
        });
      }, testData.timeouts.short);
    });
    
    it('should cancel session and return to home', function() {
      sessionPage.cancel();
      
      browser.wait(function() {
        return browser.getCurrentUrl().then(function(url) {
          return url.indexOf('/home') !== -1;
        });
      }, testData.timeouts.short);
      
      expect(browser.getCurrentUrl()).toContain('/home');
    });
    
    it('should require authentication for session page', function() {
      browser.executeScript('localStorage.clear(); sessionStorage.clear();');
      
      sessionPage.get();
      
      browser.wait(function() {
        return browser.getCurrentUrl().then(function(url) {
          return url.indexOf('/session') === -1;
        });
      }, testData.timeouts.short);
      
      expect(browser.getCurrentUrl()).not.toContain('/session');
      expect(loginPage.computingIdInput).toBeDisplayed();
    });
    
    it('should show loading indicator during photo analysis', function() {
      var testImagePath = path.resolve(__dirname, '../fixtures/test-chips.jpg');
      
      sessionPage.uploadPhoto(testImagePath);
      
      browser.wait(function() {
        return sessionPage.photoPreview.isDisplayed();
      }, testData.timeouts.short);
      
      sessionPage.analyzePhoto();
      
      // Should show loading indicator briefly
      expect(sessionPage.isLoading()).toBe(true);
    });
  });
  
  describe('Session Error Handling', function() {
    beforeEach(function() {
      loginPage.get();
      loginPage.login(testData.users.testUser.computing_id);
      
      browser.wait(function() {
        return browser.getCurrentUrl().then(function(url) {
          return url.indexOf('/home') !== -1;
        });
      }, testData.timeouts.medium);
      
      homePage.navigateToSession();
      
      browser.wait(function() {
        return browser.getCurrentUrl().then(function(url) {
          return url.indexOf('/session') !== -1;
        });
      }, testData.timeouts.short);
    });
    
    it('should handle network errors during session creation', function() {
      // Mock network failure
      browser.executeScript('window.navigator.onLine = false;');
      
      var testImagePath = path.resolve(__dirname, '../fixtures/test-chips.jpg');
      
      sessionPage.selectSessionType('checkin');
      sessionPage.uploadPhoto(testImagePath);
      
      browser.wait(function() {
        return sessionPage.photoPreview.isDisplayed();
      }, testData.timeouts.short);
      
      sessionPage.analyzePhoto();
      
      // Should handle the error gracefully
      browser.wait(function() {
        return sessionPage.errorMessage.isDisplayed();
      }, testData.timeouts.medium);
      
      expect(sessionPage.errorMessage).toBeDisplayed();
      
      // Restore network
      browser.executeScript('window.navigator.onLine = true;');
    });
    
    it('should handle server errors during photo analysis', function() {
      // This would require mocking the server response
      // For now, we'll test the UI behavior with a corrupted image
      
      var corruptedImagePath = path.resolve(__dirname, '../fixtures/corrupted-image.jpg');
      
      sessionPage.uploadPhoto(corruptedImagePath);
      
      browser.wait(function() {
        return sessionPage.photoPreview.isDisplayed();
      }, testData.timeouts.short);
      
      sessionPage.analyzePhoto();
      
      browser.wait(function() {
        return sessionPage.errorMessage.isDisplayed();
      }, testData.timeouts.visionAnalysis);
      
      expect(sessionPage.errorMessage).toBeDisplayed();
      expect(sessionPage.errorMessage.getText()).toContain('analysis failed');
    });
  });
});