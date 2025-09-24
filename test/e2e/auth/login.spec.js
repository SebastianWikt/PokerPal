// E2E tests for authentication flow
describe('Authentication Flow', function() {
  var PageObjects = require('../helpers/pageObjects');
  var loginPage, homePage;
  
  beforeEach(function() {
    loginPage = new PageObjects.LoginPage();
    homePage = new PageObjects.HomePage();
  });
  
  describe('Login Process', function() {
    beforeEach(function() {
      loginPage.get();
    });
    
    it('should display login page correctly', function() {
      expect(browser.getTitle()).toContain('PokerPal');
      expect(loginPage.computingIdInput).toBeDisplayed();
      expect(loginPage.loginButton).toBeDisplayed();
    });
    
    it('should login successfully with valid computing ID', function() {
      var testUser = testData.users.testUser;
      
      loginPage.login(testUser.computing_id);
      
      // Wait for navigation to home page
      browser.wait(function() {
        return browser.getCurrentUrl().then(function(url) {
          return url.indexOf('/home') !== -1;
        });
      }, testData.timeouts.medium);
      
      expect(browser.getCurrentUrl()).toContain('/home');
      expect(homePage.welcomeMessage).toBeDisplayed();
      expect(homePage.getWelcomeText()).toContain(testUser.first_name);
    });
    
    it('should show error for non-existent computing ID', function() {
      loginPage.login('nonexistent123');
      
      browser.wait(function() {
        return loginPage.isErrorDisplayed();
      }, testData.timeouts.medium);
      
      expect(loginPage.errorMessage).toBeDisplayed();
      expect(loginPage.getErrorText()).toContain('not found');
      expect(loginPage.createProfileButton).toBeDisplayed();
    });
    
    it('should validate computing ID format', function() {
      loginPage.login('ab'); // Too short
      
      expect(loginPage.errorMessage).toBeDisplayed();
      expect(loginPage.getErrorText()).toContain('at least 3 characters');
    });
    
    it('should show loading indicator during login', function() {
      loginPage.computingIdInput.sendKeys(testData.users.testUser.computing_id);
      loginPage.loginButton.click();
      
      // Check loading state briefly
      expect(loginPage.isLoading()).toBe(true);
    });
    
    it('should navigate to profile creation for new users', function() {
      loginPage.login('newuser123');
      
      browser.wait(function() {
        return loginPage.createProfileButton.isDisplayed();
      }, testData.timeouts.medium);
      
      loginPage.createProfileButton.click();
      
      expect(browser.getCurrentUrl()).toContain('/profile/create');
      expect(browser.getCurrentUrl()).toContain('computing_id=newuser123');
    });
  });
  
  describe('Logout Process', function() {
    beforeEach(function() {
      // Login first
      loginPage.get();
      loginPage.login(testData.users.testUser.computing_id);
      
      browser.wait(function() {
        return browser.getCurrentUrl().then(function(url) {
          return url.indexOf('/home') !== -1;
        });
      }, testData.timeouts.medium);
    });
    
    it('should logout successfully and redirect to login', function() {
      homePage.logout();
      
      browser.wait(function() {
        return browser.getCurrentUrl().then(function(url) {
          return url.indexOf('/home') === -1;
        });
      }, testData.timeouts.medium);
      
      expect(browser.getCurrentUrl()).not.toContain('/home');
      expect(loginPage.computingIdInput).toBeDisplayed();
    });
    
    it('should clear authentication state after logout', function() {
      homePage.logout();
      
      // Try to access protected route directly
      browser.get('/#/home');
      
      browser.wait(function() {
        return browser.getCurrentUrl().then(function(url) {
          return url.indexOf('/home') === -1;
        });
      }, testData.timeouts.medium);
      
      expect(browser.getCurrentUrl()).not.toContain('/home');
    });
  });
  
  describe('Authentication State Persistence', function() {
    it('should maintain login state across page refreshes', function() {
      loginPage.get();
      loginPage.login(testData.users.testUser.computing_id);
      
      browser.wait(function() {
        return browser.getCurrentUrl().then(function(url) {
          return url.indexOf('/home') !== -1;
        });
      }, testData.timeouts.medium);
      
      // Refresh the page
      browser.refresh();
      
      // Should still be logged in
      expect(browser.getCurrentUrl()).toContain('/home');
      expect(homePage.welcomeMessage).toBeDisplayed();
    });
    
    it('should redirect authenticated users away from login page', function() {
      // First login
      loginPage.get();
      loginPage.login(testData.users.testUser.computing_id);
      
      browser.wait(function() {
        return browser.getCurrentUrl().then(function(url) {
          return url.indexOf('/home') !== -1;
        });
      }, testData.timeouts.medium);
      
      // Try to go back to login page
      browser.get('/');
      
      // Should be redirected to home
      browser.wait(function() {
        return browser.getCurrentUrl().then(function(url) {
          return url.indexOf('/home') !== -1;
        });
      }, testData.timeouts.medium);
      
      expect(browser.getCurrentUrl()).toContain('/home');
    });
  });
  
  describe('Route Protection', function() {
    it('should redirect unauthenticated users to login', function() {
      // Clear any existing authentication
      browser.executeScript('localStorage.clear(); sessionStorage.clear();');
      
      // Try to access protected routes
      var protectedRoutes = ['/home', '/profile/edit', '/session', '/leaderboard'];
      
      protectedRoutes.forEach(function(route) {
        browser.get('/#' + route);
        
        browser.wait(function() {
          return browser.getCurrentUrl().then(function(url) {
            return url.indexOf(route) === -1;
          });
        }, testData.timeouts.short);
        
        expect(browser.getCurrentUrl()).not.toContain(route);
        expect(loginPage.computingIdInput).toBeDisplayed();
      });
    });
    
    it('should allow access to public routes without authentication', function() {
      browser.executeScript('localStorage.clear(); sessionStorage.clear();');
      
      var publicRoutes = ['/', '/profile/create'];
      
      publicRoutes.forEach(function(route) {
        browser.get('/#' + route);
        
        // Should not be redirected
        browser.sleep(1000); // Brief wait
        
        if (route === '/') {
          expect(loginPage.computingIdInput).toBeDisplayed();
        } else {
          expect(browser.getCurrentUrl()).toContain(route);
        }
      });
    });
  });
});