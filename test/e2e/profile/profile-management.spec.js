// E2E tests for profile management
describe('Profile Management', function() {
  var PageObjects = require('../helpers/pageObjects');
  var loginPage, profilePage, homePage;
  
  beforeEach(function() {
    loginPage = new PageObjects.LoginPage();
    profilePage = new PageObjects.ProfilePage();
    homePage = new PageObjects.HomePage();
  });
  
  describe('Profile Creation', function() {
    beforeEach(function() {
      profilePage.getCreate();
    });
    
    it('should display profile creation form correctly', function() {
      expect(browser.getTitle()).toContain('PokerPal');
      expect(profilePage.computingIdInput).toBeDisplayed();
      expect(profilePage.firstNameInput).toBeDisplayed();
      expect(profilePage.lastNameInput).toBeDisplayed();
      expect(profilePage.yearsExperienceInput).toBeDisplayed();
      expect(profilePage.levelSelect).toBeDisplayed();
      expect(profilePage.majorInput).toBeDisplayed();
      expect(profilePage.saveButton).toBeDisplayed();
      expect(profilePage.cancelButton).toBeDisplayed();
    });
    
    it('should create new profile successfully', function() {
      var newUser = testData.users.newUser;
      
      profilePage.fillProfile(newUser);
      profilePage.save();
      
      // Wait for success and navigation
      browser.wait(function() {
        return browser.getCurrentUrl().then(function(url) {
          return url.indexOf('/home') !== -1;
        });
      }, testData.timeouts.medium);
      
      expect(browser.getCurrentUrl()).toContain('/home');
      expect(homePage.welcomeMessage).toBeDisplayed();
      expect(homePage.getWelcomeText()).toContain(newUser.first_name);
    });
    
    it('should validate required fields', function() {
      // Try to save without filling required fields
      profilePage.save();
      
      browser.wait(function() {
        return profilePage.errorMessage.isDisplayed();
      }, testData.timeouts.short);
      
      expect(profilePage.errorMessage).toBeDisplayed();
      expect(profilePage.getErrorText()).toContain('required');
    });
    
    it('should validate computing ID format', function() {
      var invalidUser = Object.assign({}, testData.users.newUser, {
        computing_id: 'ab' // Too short
      });
      
      profilePage.fillProfile(invalidUser);
      profilePage.save();
      
      browser.wait(function() {
        return profilePage.errorMessage.isDisplayed();
      }, testData.timeouts.short);
      
      expect(profilePage.errorMessage).toBeDisplayed();
      expect(profilePage.getErrorText()).toContain('at least 3 characters');
    });
    
    it('should validate name fields', function() {
      var invalidUser = Object.assign({}, testData.users.newUser, {
        first_name: 'John123', // Contains numbers
        last_name: 'D@e' // Contains special characters
      });
      
      profilePage.fillProfile(invalidUser);
      profilePage.save();
      
      browser.wait(function() {
        return profilePage.errorMessage.isDisplayed();
      }, testData.timeouts.short);
      
      expect(profilePage.errorMessage).toBeDisplayed();
      expect(profilePage.getErrorText()).toContain('letters');
    });
    
    it('should validate years of experience range', function() {
      var invalidUser = Object.assign({}, testData.users.newUser, {
        years_of_experience: -1 // Invalid negative value
      });
      
      profilePage.fillProfile(invalidUser);
      profilePage.save();
      
      browser.wait(function() {
        return profilePage.errorMessage.isDisplayed();
      }, testData.timeouts.short);
      
      expect(profilePage.errorMessage).toBeDisplayed();
      expect(profilePage.getErrorText()).toContain('0 and 50');
    });
    
    it('should handle duplicate computing ID', function() {
      var duplicateUser = Object.assign({}, testData.users.testUser);
      
      profilePage.fillProfile(duplicateUser);
      profilePage.save();
      
      browser.wait(function() {
        return profilePage.errorMessage.isDisplayed();
      }, testData.timeouts.medium);
      
      expect(profilePage.errorMessage).toBeDisplayed();
      expect(profilePage.getErrorText()).toContain('already exists');
    });
    
    it('should cancel profile creation and return to login', function() {
      profilePage.fillProfile(testData.users.newUser);
      profilePage.cancel();
      
      browser.wait(function() {
        return browser.getCurrentUrl().then(function(url) {
          return url.indexOf('/profile/create') === -1;
        });
      }, testData.timeouts.short);
      
      expect(browser.getCurrentUrl()).not.toContain('/profile/create');
    });
    
    it('should pre-populate computing ID from query parameter', function() {
      var computingId = 'queryparam123';
      browser.get('/#/profile/create?computing_id=' + computingId);
      
      expect(profilePage.computingIdInput).toHaveValue(computingId);
    });
  });
  
  describe('Profile Editing', function() {
    beforeEach(function() {
      // Login first
      loginPage.get();
      loginPage.login(testData.users.testUser.computing_id);
      
      browser.wait(function() {
        return browser.getCurrentUrl().then(function(url) {
          return url.indexOf('/home') !== -1;
        });
      }, testData.timeouts.medium);
      
      // Navigate to profile edit
      homePage.navigateToProfile();
      
      browser.wait(function() {
        return browser.getCurrentUrl().then(function(url) {
          return url.indexOf('/profile/edit') !== -1;
        });
      }, testData.timeouts.short);
    });
    
    it('should display profile edit form with existing data', function() {
      expect(browser.getCurrentUrl()).toContain('/profile/edit');
      expect(profilePage.computingIdInput).toBeDisplayed();
      expect(profilePage.firstNameInput).toBeDisplayed();
      
      // Computing ID should be disabled/readonly in edit mode
      expect(profilePage.computingIdInput.getAttribute('readonly')).toBeTruthy();
      
      // Should have existing user data
      expect(profilePage.firstNameInput).toHaveValue(testData.users.testUser.first_name);
      expect(profilePage.lastNameInput).toHaveValue(testData.users.testUser.last_name);
    });
    
    it('should update profile successfully', function() {
      var updatedData = {
        first_name: 'Updated',
        last_name: 'Name',
        years_of_experience: 5,
        level: 'Advanced',
        major: 'Updated Major'
      };
      
      profilePage.fillProfile(updatedData);
      profilePage.save();
      
      browser.wait(function() {
        return browser.getCurrentUrl().then(function(url) {
          return url.indexOf('/home') !== -1;
        });
      }, testData.timeouts.medium);
      
      expect(browser.getCurrentUrl()).toContain('/home');
      expect(homePage.getWelcomeText()).toContain(updatedData.first_name);
    });
    
    it('should not allow updating computing ID', function() {
      // Computing ID field should be readonly
      expect(profilePage.computingIdInput.getAttribute('readonly')).toBeTruthy();
      
      // Verify the value cannot be changed
      var originalValue = profilePage.computingIdInput.getAttribute('value');
      profilePage.computingIdInput.clear();
      profilePage.computingIdInput.sendKeys('newidthatshouldfail');
      
      // Value should remain unchanged
      expect(profilePage.computingIdInput).toHaveValue(originalValue);
    });
    
    it('should validate updated fields', function() {
      profilePage.firstNameInput.clear();
      profilePage.firstNameInput.sendKeys(''); // Empty name
      profilePage.save();
      
      browser.wait(function() {
        return profilePage.errorMessage.isDisplayed();
      }, testData.timeouts.short);
      
      expect(profilePage.errorMessage).toBeDisplayed();
      expect(profilePage.getErrorText()).toContain('required');
    });
    
    it('should cancel profile edit and return to home', function() {
      profilePage.firstNameInput.clear();
      profilePage.firstNameInput.sendKeys('Changed Name');
      profilePage.cancel();
      
      browser.wait(function() {
        return browser.getCurrentUrl().then(function(url) {
          return url.indexOf('/home') !== -1;
        });
      }, testData.timeouts.short);
      
      expect(browser.getCurrentUrl()).toContain('/home');
      
      // Verify changes were not saved
      homePage.navigateToProfile();
      browser.wait(function() {
        return browser.getCurrentUrl().then(function(url) {
          return url.indexOf('/profile/edit') !== -1;
        });
      }, testData.timeouts.short);
      
      expect(profilePage.firstNameInput).toHaveValue(testData.users.testUser.first_name);
    });
  });
  
  describe('Profile Navigation', function() {
    it('should navigate from home to profile edit', function() {
      loginPage.get();
      loginPage.login(testData.users.testUser.computing_id);
      
      browser.wait(function() {
        return browser.getCurrentUrl().then(function(url) {
          return url.indexOf('/home') !== -1;
        });
      }, testData.timeouts.medium);
      
      homePage.navigateToProfile();
      
      browser.wait(function() {
        return browser.getCurrentUrl().then(function(url) {
          return url.indexOf('/profile/edit') !== -1;
        });
      }, testData.timeouts.short);
      
      expect(browser.getCurrentUrl()).toContain('/profile/edit');
    });
    
    it('should require authentication for profile edit', function() {
      browser.executeScript('localStorage.clear(); sessionStorage.clear();');
      
      profilePage.getEdit();
      
      browser.wait(function() {
        return browser.getCurrentUrl().then(function(url) {
          return url.indexOf('/profile/edit') === -1;
        });
      }, testData.timeouts.short);
      
      expect(browser.getCurrentUrl()).not.toContain('/profile/edit');
      expect(loginPage.computingIdInput).toBeDisplayed();
    });
  });
});