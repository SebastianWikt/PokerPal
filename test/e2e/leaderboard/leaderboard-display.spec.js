// E2E tests for leaderboard display and functionality
describe('Leaderboard Display and Functionality', function() {
  var PageObjects = require('../helpers/pageObjects');
  var loginPage, leaderboardPage, homePage;
  
  beforeEach(function() {
    loginPage = new PageObjects.LoginPage();
    leaderboardPage = new PageObjects.LeaderboardPage();
    homePage = new PageObjects.HomePage();
  });
  
  describe('Leaderboard Access and Display', function() {
    beforeEach(function() {
      // Login and navigate to leaderboard
      loginPage.get();
      loginPage.login(testData.users.testUser.computing_id);
      
      browser.wait(function() {
        return browser.getCurrentUrl().then(function(url) {
          return url.indexOf('/home') !== -1;
        });
      }, testData.timeouts.medium);
      
      homePage.navigateToLeaderboard();
      
      browser.wait(function() {
        return browser.getCurrentUrl().then(function(url) {
          return url.indexOf('/leaderboard') !== -1;
        });
      }, testData.timeouts.short);
    });
    
    it('should display leaderboard page correctly', function() {
      expect(browser.getCurrentUrl()).toContain('/leaderboard');
      expect(leaderboardPage.leaderboardTable).toBeDisplayed();
      expect(leaderboardPage.refreshButton).toBeDisplayed();
    });
    
    it('should load and display player rankings', function() {
      browser.wait(function() {
        return leaderboardPage.getPlayerCount().then(function(count) {
          return count >= 0;
        });
      }, testData.timeouts.medium);
      
      leaderboardPage.getPlayerCount().then(function(count) {
        if (count > 0) {
          expect(leaderboardPage.leaderboardRows.first()).toBeDisplayed();
          
          // Check that rankings are displayed
          var firstPlayer = leaderboardPage.getPlayerAtRank(1);
          expect(firstPlayer.getText()).toMatch(/1\./); // Should start with "1."
          
          // Check that winnings are displayed in currency format
          expect(firstPlayer.getText()).toMatch(/\$\d+\.\d{2}/);
        }
      });
    });
    
    it('should sort players by total winnings (highest first)', function() {
      browser.wait(function() {
        return leaderboardPage.getPlayerCount().then(function(count) {
          return count > 1;
        });
      }, testData.timeouts.medium);
      
      leaderboardPage.getPlayerCount().then(function(count) {
        if (count > 1) {
          var firstPlayerWinnings, secondPlayerWinnings;
          
          // Extract winnings from first player
          leaderboardPage.getPlayerAtRank(1).getText().then(function(text) {
            var match = text.match(/\$(\d+\.\d{2})/);
            firstPlayerWinnings = match ? parseFloat(match[1]) : 0;
          });
          
          // Extract winnings from second player
          leaderboardPage.getPlayerAtRank(2).getText().then(function(text) {
            var match = text.match(/\$(\d+\.\d{2})/);
            secondPlayerWinnings = match ? parseFloat(match[1]) : 0;
            
            // First player should have higher or equal winnings
            expect(firstPlayerWinnings).toBeGreaterThanOrEqual(secondPlayerWinnings);
          });
        }
      });
    });
    
    it('should highlight current user in leaderboard', function() {
      browser.wait(function() {
        return leaderboardPage.getPlayerCount().then(function(count) {
          return count > 0;
        });
      }, testData.timeouts.medium);
      
      // Look for current user highlight
      leaderboardPage.isCurrentUserHighlighted().then(function(highlighted) {
        if (highlighted) {
          expect(leaderboardPage.currentUserHighlight).toBeDisplayed();
          expect(leaderboardPage.currentUserHighlight).toHaveClass('current-user-row');
        }
      });
    });
    
    it('should display player names and winnings correctly', function() {
      browser.wait(function() {
        return leaderboardPage.getPlayerCount().then(function(count) {
          return count > 0;
        });
      }, testData.timeouts.medium);
      
      leaderboardPage.getPlayerCount().then(function(count) {
        if (count > 0) {
          var firstPlayer = leaderboardPage.getPlayerAtRank(1);
          
          firstPlayer.getText().then(function(text) {
            // Should contain rank number
            expect(text).toMatch(/^\d+\./);
            
            // Should contain player name (first and last)
            expect(text).toMatch(/[A-Za-z]+ [A-Za-z]+/);
            
            // Should contain winnings in currency format
            expect(text).toMatch(/[\+\-]?\$\d+\.\d{2}/);
          });
        }
      });
    });
    
    it('should handle empty leaderboard gracefully', function() {
      // This test would require a clean database state
      // For now, we'll test the UI behavior when no data is loaded
      
      browser.executeScript('angular.element(document.body).scope().$apply(function() { angular.element(document.body).scope().leaderboard = []; });');
      
      browser.sleep(500); // Brief wait for UI update
      
      var emptyMessage = element(by.css('.empty-leaderboard-message'));
      emptyMessage.isPresent().then(function(present) {
        if (present) {
          expect(emptyMessage).toBeDisplayed();
          expect(emptyMessage.getText()).toContain('No players found');
        }
      });
    });
  });
  
  describe('Leaderboard Refresh Functionality', function() {
    beforeEach(function() {
      loginPage.get();
      loginPage.login(testData.users.testUser.computing_id);
      
      browser.wait(function() {
        return browser.getCurrentUrl().then(function(url) {
          return url.indexOf('/home') !== -1;
        });
      }, testData.timeouts.medium);
      
      homePage.navigateToLeaderboard();
      
      browser.wait(function() {
        return browser.getCurrentUrl().then(function(url) {
          return url.indexOf('/leaderboard') !== -1;
        });
      }, testData.timeouts.short);
    });
    
    it('should refresh leaderboard data when refresh button clicked', function() {
      browser.wait(function() {
        return leaderboardPage.getPlayerCount().then(function(count) {
          return count >= 0;
        });
      }, testData.timeouts.medium);
      
      var initialCount = leaderboardPage.getPlayerCount();
      
      leaderboardPage.refresh();
      
      // Should show loading indicator briefly
      expect(leaderboardPage.isLoading()).toBe(true);
      
      browser.wait(function() {
        return leaderboardPage.isLoading().then(function(loading) {
          return !loading;
        });
      }, testData.timeouts.medium);
      
      // Data should be reloaded (count should be the same or updated)
      expect(leaderboardPage.getPlayerCount()).toBeGreaterThanOrEqual(0);
    });
    
    it('should show loading indicator during refresh', function() {
      leaderboardPage.refresh();
      
      // Should show loading indicator immediately
      expect(leaderboardPage.isLoading()).toBe(true);
      
      browser.wait(function() {
        return leaderboardPage.isLoading().then(function(loading) {
          return !loading;
        });
      }, testData.timeouts.medium);
      
      // Loading should complete
      expect(leaderboardPage.isLoading()).toBe(false);
    });
    
    it('should handle refresh errors gracefully', function() {
      // Mock network failure
      browser.executeScript('window.navigator.onLine = false;');
      
      leaderboardPage.refresh();
      
      browser.wait(function() {
        return leaderboardPage.errorMessage.isDisplayed();
      }, testData.timeouts.medium);
      
      expect(leaderboardPage.errorMessage).toBeDisplayed();
      expect(leaderboardPage.errorMessage.getText()).toContain('failed to load');
      
      // Restore network
      browser.executeScript('window.navigator.onLine = true;');
    });
  });
  
  describe('Leaderboard Navigation and Access Control', function() {
    it('should navigate from home to leaderboard', function() {
      loginPage.get();
      loginPage.login(testData.users.testUser.computing_id);
      
      browser.wait(function() {
        return browser.getCurrentUrl().then(function(url) {
          return url.indexOf('/home') !== -1;
        });
      }, testData.timeouts.medium);
      
      homePage.navigateToLeaderboard();
      
      browser.wait(function() {
        return browser.getCurrentUrl().then(function(url) {
          return url.indexOf('/leaderboard') !== -1;
        });
      }, testData.timeouts.short);
      
      expect(browser.getCurrentUrl()).toContain('/leaderboard');
    });
    
    it('should require authentication for leaderboard access', function() {
      browser.executeScript('localStorage.clear(); sessionStorage.clear();');
      
      leaderboardPage.get();
      
      browser.wait(function() {
        return browser.getCurrentUrl().then(function(url) {
          return url.indexOf('/leaderboard') === -1;
        });
      }, testData.timeouts.short);
      
      expect(browser.getCurrentUrl()).not.toContain('/leaderboard');
      expect(loginPage.computingIdInput).toBeDisplayed();
    });
    
    it('should allow both regular and admin users to view leaderboard', function() {
      // Test with regular user
      loginPage.get();
      loginPage.login(testData.users.testUser.computing_id);
      
      browser.wait(function() {
        return browser.getCurrentUrl().then(function(url) {
          return url.indexOf('/home') !== -1;
        });
      }, testData.timeouts.medium);
      
      homePage.navigateToLeaderboard();
      
      browser.wait(function() {
        return browser.getCurrentUrl().then(function(url) {
          return url.indexOf('/leaderboard') !== -1;
        });
      }, testData.timeouts.short);
      
      expect(browser.getCurrentUrl()).toContain('/leaderboard');
      expect(leaderboardPage.leaderboardTable).toBeDisplayed();
      
      // Logout and test with admin user
      homePage.logout();
      
      browser.wait(function() {
        return browser.getCurrentUrl().then(function(url) {
          return url.indexOf('/home') === -1;
        });
      }, testData.timeouts.short);
      
      loginPage.login(testData.users.adminUser.computing_id);
      
      browser.wait(function() {
        return browser.getCurrentUrl().then(function(url) {
          return url.indexOf('/home') !== -1;
        });
      }, testData.timeouts.medium);
      
      homePage.navigateToLeaderboard();
      
      browser.wait(function() {
        return browser.getCurrentUrl().then(function(url) {
          return url.indexOf('/leaderboard') !== -1;
        });
      }, testData.timeouts.short);
      
      expect(browser.getCurrentUrl()).toContain('/leaderboard');
      expect(leaderboardPage.leaderboardTable).toBeDisplayed();
    });
  });
  
  describe('Leaderboard Data Accuracy', function() {
    beforeEach(function() {
      loginPage.get();
      loginPage.login(testData.users.testUser.computing_id);
      
      browser.wait(function() {
        return browser.getCurrentUrl().then(function(url) {
          return url.indexOf('/home') !== -1;
        });
      }, testData.timeouts.medium);
      
      homePage.navigateToLeaderboard();
      
      browser.wait(function() {
        return browser.getCurrentUrl().then(function(url) {
          return url.indexOf('/leaderboard') !== -1;
        });
      }, testData.timeouts.short);
    });
    
    it('should display accurate ranking numbers', function() {
      browser.wait(function() {
        return leaderboardPage.getPlayerCount().then(function(count) {
          return count > 0;
        });
      }, testData.timeouts.medium);
      
      leaderboardPage.getPlayerCount().then(function(count) {
        for (var i = 1; i <= Math.min(count, 5); i++) {
          leaderboardPage.getPlayerAtRank(i).getText().then(function(rank) {
            return function(text) {
              expect(text).toMatch(new RegExp('^' + rank + '\\.'));
            };
          }(i));
        }
      });
    });
    
    it('should handle negative winnings correctly', function() {
      browser.wait(function() {
        return leaderboardPage.getPlayerCount().then(function(count) {
          return count > 0;
        });
      }, testData.timeouts.medium);
      
      // Look for players with negative winnings
      leaderboardPage.leaderboardRows.each(function(row) {
        row.getText().then(function(text) {
          if (text.indexOf('-$') !== -1) {
            // Should display negative winnings correctly
            expect(text).toMatch(/-\$\d+\.\d{2}/);
            
            // Should have appropriate styling
            row.getAttribute('class').then(function(classes) {
              expect(classes).toContain('negative-winnings');
            });
          }
        });
      });
    });
    
    it('should display zero winnings correctly', function() {
      browser.wait(function() {
        return leaderboardPage.getPlayerCount().then(function(count) {
          return count > 0;
        });
      }, testData.timeouts.medium);
      
      // Look for players with zero winnings
      leaderboardPage.leaderboardRows.each(function(row) {
        row.getText().then(function(text) {
          if (text.indexOf('$0.00') !== -1) {
            // Should display zero winnings correctly
            expect(text).toMatch(/\$0\.00/);
            
            // Should have appropriate styling
            row.getAttribute('class').then(function(classes) {
              expect(classes).toContain('zero-winnings');
            });
          }
        });
      });
    });
  });
  
  describe('Leaderboard Responsive Design', function() {
    beforeEach(function() {
      loginPage.get();
      loginPage.login(testData.users.testUser.computing_id);
      
      browser.wait(function() {
        return browser.getCurrentUrl().then(function(url) {
          return url.indexOf('/home') !== -1;
        });
      }, testData.timeouts.medium);
      
      homePage.navigateToLeaderboard();
      
      browser.wait(function() {
        return browser.getCurrentUrl().then(function(url) {
          return url.indexOf('/leaderboard') !== -1;
        });
      }, testData.timeouts.short);
    });
    
    it('should display correctly on mobile viewport', function() {
      browser.driver.manage().window().setSize(375, 667); // iPhone size
      
      browser.sleep(500); // Wait for responsive adjustments
      
      expect(leaderboardPage.leaderboardTable).toBeDisplayed();
      
      // Table should be responsive
      leaderboardPage.leaderboardTable.getCssValue('overflow-x').then(function(overflow) {
        expect(overflow).toBe('auto');
      });
      
      // Restore original size
      browser.driver.manage().window().setSize(1280, 1024);
    });
    
    it('should display correctly on tablet viewport', function() {
      browser.driver.manage().window().setSize(768, 1024); // iPad size
      
      browser.sleep(500); // Wait for responsive adjustments
      
      expect(leaderboardPage.leaderboardTable).toBeDisplayed();
      expect(leaderboardPage.refreshButton).toBeDisplayed();
      
      // Restore original size
      browser.driver.manage().window().setSize(1280, 1024);
    });
  });
});