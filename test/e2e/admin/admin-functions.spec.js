// E2E tests for admin functions and privilege enforcement
describe('Admin Functions and Privilege Enforcement', function() {
  var PageObjects = require('../helpers/pageObjects');
  var loginPage, adminPage, homePage;
  
  beforeEach(function() {
    loginPage = new PageObjects.LoginPage();
    adminPage = new PageObjects.AdminPage();
    homePage = new PageObjects.HomePage();
  });
  
  describe('Admin Access Control', function() {
    it('should allow admin users to access admin page', function() {
      loginPage.get();
      loginPage.login(testData.users.adminUser.computing_id);
      
      browser.wait(function() {
        return browser.getCurrentUrl().then(function(url) {
          return url.indexOf('/home') !== -1;
        });
      }, testData.timeouts.medium);
      
      // Admin link should be visible
      expect(homePage.isAdminLinkVisible()).toBe(true);
      
      homePage.navigateToAdmin();
      
      browser.wait(function() {
        return browser.getCurrentUrl().then(function(url) {
          return url.indexOf('/admin') !== -1;
        });
      }, testData.timeouts.short);
      
      expect(browser.getCurrentUrl()).toContain('/admin');
      expect(adminPage.playersTab).toBeDisplayed();
      expect(adminPage.sessionsTab).toBeDisplayed();
      expect(adminPage.statsTab).toBeDisplayed();
    });
    
    it('should deny non-admin users access to admin page', function() {
      loginPage.get();
      loginPage.login(testData.users.testUser.computing_id);
      
      browser.wait(function() {
        return browser.getCurrentUrl().then(function(url) {
          return url.indexOf('/home') !== -1;
        });
      }, testData.timeouts.medium);
      
      // Admin link should not be visible
      expect(homePage.isAdminLinkVisible()).toBe(false);
      
      // Try to access admin page directly
      adminPage.get();
      
      browser.wait(function() {
        return browser.getCurrentUrl().then(function(url) {
          return url.indexOf('/admin') === -1;
        });
      }, testData.timeouts.short);
      
      expect(browser.getCurrentUrl()).not.toContain('/admin');
      expect(browser.getCurrentUrl()).toContain('/home');
    });
    
    it('should redirect unauthenticated users to login', function() {
      browser.executeScript('localStorage.clear(); sessionStorage.clear();');
      
      adminPage.get();
      
      browser.wait(function() {
        return browser.getCurrentUrl().then(function(url) {
          return url.indexOf('/admin') === -1;
        });
      }, testData.timeouts.short);
      
      expect(browser.getCurrentUrl()).not.toContain('/admin');
      expect(loginPage.computingIdInput).toBeDisplayed();
    });
  });
  
  describe('Player Management', function() {
    beforeEach(function() {
      // Login as admin
      loginPage.get();
      loginPage.login(testData.users.adminUser.computing_id);
      
      browser.wait(function() {
        return browser.getCurrentUrl().then(function(url) {
          return url.indexOf('/home') !== -1;
        });
      }, testData.timeouts.medium);
      
      homePage.navigateToAdmin();
      
      browser.wait(function() {
        return browser.getCurrentUrl().then(function(url) {
          return url.indexOf('/admin') !== -1;
        });
      }, testData.timeouts.short);
      
      adminPage.switchToPlayersTab();
    });
    
    it('should display players table correctly', function() {
      expect(adminPage.playersTable).toBeDisplayed();
      
      browser.wait(function() {
        return adminPage.getPlayerCount().then(function(count) {
          return count > 0;
        });
      }, testData.timeouts.medium);
      
      expect(adminPage.getPlayerCount()).toBeGreaterThan(0);
      expect(adminPage.editPlayerButtons.first()).toBeDisplayed();
      expect(adminPage.deletePlayerButtons.first()).toBeDisplayed();
    });
    
    it('should open edit modal when edit button clicked', function() {
      browser.wait(function() {
        return adminPage.getPlayerCount().then(function(count) {
          return count > 0;
        });
      }, testData.timeouts.medium);
      
      adminPage.editPlayer(0);
      
      browser.wait(function() {
        return adminPage.isEditModalVisible();
      }, testData.timeouts.short);
      
      expect(adminPage.editModal).toBeDisplayed();
      expect(adminPage.saveEditButton).toBeDisplayed();
      expect(adminPage.cancelEditButton).toBeDisplayed();
    });
    
    it('should update player information successfully', function() {
      browser.wait(function() {
        return adminPage.getPlayerCount().then(function(count) {
          return count > 0;
        });
      }, testData.timeouts.medium);
      
      adminPage.editPlayer(0);
      
      browser.wait(function() {
        return adminPage.isEditModalVisible();
      }, testData.timeouts.short);
      
      // Update player information
      var firstNameInput = element(by.model('editingPlayer.first_name'));
      firstNameInput.clear();
      firstNameInput.sendKeys('Updated Name');
      
      adminPage.saveEdit();
      
      browser.wait(function() {
        return adminPage.isEditModalVisible().then(function(visible) {
          return !visible;
        });
      }, testData.timeouts.medium);
      
      // Verify the change was saved
      var firstPlayerRow = adminPage.playerRows.first();
      expect(firstPlayerRow.getText()).toContain('Updated Name');
    });
    
    it('should cancel player edit without saving changes', function() {
      browser.wait(function() {
        return adminPage.getPlayerCount().then(function(count) {
          return count > 0;
        });
      }, testData.timeouts.medium);
      
      // Get original name
      var firstPlayerRow = adminPage.playerRows.first();
      var originalText = firstPlayerRow.getText();
      
      adminPage.editPlayer(0);
      
      browser.wait(function() {
        return adminPage.isEditModalVisible();
      }, testData.timeouts.short);
      
      // Make changes but cancel
      var firstNameInput = element(by.model('editingPlayer.first_name'));
      firstNameInput.clear();
      firstNameInput.sendKeys('Should Not Save');
      
      adminPage.cancelEdit();
      
      browser.wait(function() {
        return adminPage.isEditModalVisible().then(function(visible) {
          return !visible;
        });
      }, testData.timeouts.short);
      
      // Verify changes were not saved
      expect(firstPlayerRow.getText()).toBe(originalText);
    });
    
    it('should delete player with confirmation', function() {
      browser.wait(function() {
        return adminPage.getPlayerCount().then(function(count) {
          return count > 0;
        });
      }, testData.timeouts.medium);
      
      var initialCount = adminPage.getPlayerCount();
      
      // Mock confirmation dialog
      browser.executeScript('window.confirm = function() { return true; }');
      
      adminPage.deletePlayer(0);
      
      browser.wait(function() {
        return adminPage.getPlayerCount().then(function(newCount) {
          return initialCount.then(function(initial) {
            return newCount < initial;
          });
        });
      }, testData.timeouts.medium);
      
      // Player count should decrease
      expect(adminPage.getPlayerCount()).toBeLessThan(initialCount);
    });
    
    it('should not delete player without confirmation', function() {
      browser.wait(function() {
        return adminPage.getPlayerCount().then(function(count) {
          return count > 0;
        });
      }, testData.timeouts.medium);
      
      var initialCount = adminPage.getPlayerCount();
      
      // Mock confirmation dialog to return false
      browser.executeScript('window.confirm = function() { return false; }');
      
      adminPage.deletePlayer(0);
      
      browser.sleep(1000); // Brief wait
      
      // Player count should remain the same
      expect(adminPage.getPlayerCount()).toBe(initialCount);
    });
  });
  
  describe('Session Management', function() {
    beforeEach(function() {
      // Login as admin
      loginPage.get();
      loginPage.login(testData.users.adminUser.computing_id);
      
      browser.wait(function() {
        return browser.getCurrentUrl().then(function(url) {
          return url.indexOf('/home') !== -1;
        });
      }, testData.timeouts.medium);
      
      homePage.navigateToAdmin();
      
      browser.wait(function() {
        return browser.getCurrentUrl().then(function(url) {
          return url.indexOf('/admin') !== -1;
        });
      }, testData.timeouts.short);
      
      adminPage.switchToSessionsTab();
    });
    
    it('should display sessions table correctly', function() {
      expect(adminPage.sessionsTable).toBeDisplayed();
      
      browser.wait(function() {
        return adminPage.getSessionCount().then(function(count) {
          return count >= 0; // May be 0 if no sessions exist
        });
      }, testData.timeouts.medium);
      
      adminPage.getSessionCount().then(function(count) {
        if (count > 0) {
          expect(adminPage.editSessionButtons.first()).toBeDisplayed();
          expect(adminPage.deleteSessionButtons.first()).toBeDisplayed();
        }
      });
    });
    
    it('should edit session information successfully', function() {
      browser.wait(function() {
        return adminPage.getSessionCount().then(function(count) {
          return count > 0;
        });
      }, testData.timeouts.medium);
      
      adminPage.getSessionCount().then(function(count) {
        if (count > 0) {
          adminPage.editSession(0);
          
          browser.wait(function() {
            return adminPage.isEditModalVisible();
          }, testData.timeouts.short);
          
          // Update session information
          var endChipsInput = element(by.model('editingSession.end_chips'));
          endChipsInput.clear();
          endChipsInput.sendKeys('500.00');
          
          adminPage.saveEdit();
          
          browser.wait(function() {
            return adminPage.isEditModalVisible().then(function(visible) {
              return !visible;
            });
          }, testData.timeouts.medium);
          
          // Verify the change was saved
          var firstSessionRow = adminPage.sessionRows.first();
          expect(firstSessionRow.getText()).toContain('500.00');
        }
      });
    });
    
    it('should delete session with confirmation', function() {
      browser.wait(function() {
        return adminPage.getSessionCount().then(function(count) {
          return count > 0;
        });
      }, testData.timeouts.medium);
      
      adminPage.getSessionCount().then(function(initialCount) {
        if (initialCount > 0) {
          // Mock confirmation dialog
          browser.executeScript('window.confirm = function() { return true; }');
          
          adminPage.deleteSession(0);
          
          browser.wait(function() {
            return adminPage.getSessionCount().then(function(newCount) {
              return newCount < initialCount;
            });
          }, testData.timeouts.medium);
          
          // Session count should decrease
          expect(adminPage.getSessionCount()).toBeLessThan(initialCount);
        }
      });
    });
  });
  
  describe('System Statistics', function() {
    beforeEach(function() {
      // Login as admin
      loginPage.get();
      loginPage.login(testData.users.adminUser.computing_id);
      
      browser.wait(function() {
        return browser.getCurrentUrl().then(function(url) {
          return url.indexOf('/home') !== -1;
        });
      }, testData.timeouts.medium);
      
      homePage.navigateToAdmin();
      
      browser.wait(function() {
        return browser.getCurrentUrl().then(function(url) {
          return url.indexOf('/admin') !== -1;
        });
      }, testData.timeouts.short);
      
      adminPage.switchToStatsTab();
    });
    
    it('should display system statistics correctly', function() {
      expect(adminPage.systemStats).toBeDisplayed();
      expect(adminPage.totalPlayersCount).toBeDisplayed();
      expect(adminPage.totalSessionsCount).toBeDisplayed();
      
      // Statistics should contain numeric values
      expect(adminPage.totalPlayersCount.getText()).toMatch(/\d+/);
      expect(adminPage.totalSessionsCount.getText()).toMatch(/\d+/);
    });
    
    it('should show accurate player and session counts', function() {
      // Switch to players tab to get count
      adminPage.switchToPlayersTab();
      
      browser.wait(function() {
        return adminPage.getPlayerCount().then(function(count) {
          return count >= 0;
        });
      }, testData.timeouts.medium);
      
      var playersCount = adminPage.getPlayerCount();
      
      // Switch to sessions tab to get count
      adminPage.switchToSessionsTab();
      
      browser.wait(function() {
        return adminPage.getSessionCount().then(function(count) {
          return count >= 0;
        });
      }, testData.timeouts.medium);
      
      var sessionsCount = adminPage.getSessionCount();
      
      // Switch back to stats tab
      adminPage.switchToStatsTab();
      
      // Verify stats match table counts
      playersCount.then(function(pCount) {
        expect(adminPage.totalPlayersCount.getText()).toContain(pCount.toString());
      });
      
      sessionsCount.then(function(sCount) {
        expect(adminPage.totalSessionsCount.getText()).toContain(sCount.toString());
      });
    });
  });
  
  describe('Tab Navigation', function() {
    beforeEach(function() {
      // Login as admin
      loginPage.get();
      loginPage.login(testData.users.adminUser.computing_id);
      
      browser.wait(function() {
        return browser.getCurrentUrl().then(function(url) {
          return url.indexOf('/home') !== -1;
        });
      }, testData.timeouts.medium);
      
      homePage.navigateToAdmin();
      
      browser.wait(function() {
        return browser.getCurrentUrl().then(function(url) {
          return url.indexOf('/admin') !== -1;
        });
      }, testData.timeouts.short);
    });
    
    it('should switch between tabs correctly', function() {
      // Start on players tab (default)
      expect(adminPage.playersTable).toBeDisplayed();
      
      // Switch to sessions tab
      adminPage.switchToSessionsTab();
      expect(adminPage.sessionsTable).toBeDisplayed();
      
      // Switch to stats tab
      adminPage.switchToStatsTab();
      expect(adminPage.systemStats).toBeDisplayed();
      
      // Switch back to players tab
      adminPage.switchToPlayersTab();
      expect(adminPage.playersTable).toBeDisplayed();
    });
    
    it('should maintain tab state during operations', function() {
      // Switch to sessions tab
      adminPage.switchToSessionsTab();
      expect(adminPage.sessionsTable).toBeDisplayed();
      
      // Perform an operation (if sessions exist)
      adminPage.getSessionCount().then(function(count) {
        if (count > 0) {
          adminPage.editSession(0);
          
          browser.wait(function() {
            return adminPage.isEditModalVisible();
          }, testData.timeouts.short);
          
          adminPage.cancelEdit();
          
          browser.wait(function() {
            return adminPage.isEditModalVisible().then(function(visible) {
              return !visible;
            });
          }, testData.timeouts.short);
          
          // Should still be on sessions tab
          expect(adminPage.sessionsTable).toBeDisplayed();
        }
      });
    });
  });
});