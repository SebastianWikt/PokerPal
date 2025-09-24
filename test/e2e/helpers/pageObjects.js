// Page Object Model for E2E tests
var PageObjects = {};

// Login Page Object
PageObjects.LoginPage = function() {
  this.computingIdInput = element(by.model('loginData.computing_id'));
  this.loginButton = element(by.css('.login-button'));
  this.createProfileButton = element(by.css('.create-profile-button'));
  this.errorMessage = element(by.css('.error-message'));
  this.loadingIndicator = element(by.css('.loading-indicator'));
  
  this.get = function() {
    browser.get('/');
  };
  
  this.login = function(computingId) {
    this.computingIdInput.clear();
    this.computingIdInput.sendKeys(computingId);
    this.loginButton.click();
  };
  
  this.isErrorDisplayed = function() {
    return this.errorMessage.isDisplayed();
  };
  
  this.getErrorText = function() {
    return this.errorMessage.getText();
  };
  
  this.isLoading = function() {
    return this.loadingIndicator.isDisplayed();
  };
};

// Home Page Object
PageObjects.HomePage = function() {
  this.welcomeMessage = element(by.css('.welcome-message'));
  this.navigationMenu = element(by.css('.navigation-menu'));
  this.profileLink = element(by.css('a[href="#/profile/edit"]'));
  this.sessionLink = element(by.css('a[href="#/session"]'));
  this.leaderboardLink = element(by.css('a[href="#/leaderboard"]'));
  this.adminLink = element(by.css('a[href="#/admin"]'));
  this.logoutButton = element(by.css('.logout-button'));
  
  this.get = function() {
    browser.get('/#/home');
  };
  
  this.getWelcomeText = function() {
    return this.welcomeMessage.getText();
  };
  
  this.navigateToProfile = function() {
    this.profileLink.click();
  };
  
  this.navigateToSession = function() {
    this.sessionLink.click();
  };
  
  this.navigateToLeaderboard = function() {
    this.leaderboardLink.click();
  };
  
  this.navigateToAdmin = function() {
    this.adminLink.click();
  };
  
  this.logout = function() {
    this.logoutButton.click();
  };
  
  this.isAdminLinkVisible = function() {
    return this.adminLink.isDisplayed();
  };
};

// Profile Page Object
PageObjects.ProfilePage = function() {
  this.computingIdInput = element(by.model('playerData.computing_id'));
  this.firstNameInput = element(by.model('playerData.first_name'));
  this.lastNameInput = element(by.model('playerData.last_name'));
  this.yearsExperienceInput = element(by.model('playerData.years_of_experience'));
  this.levelSelect = element(by.model('playerData.level'));
  this.majorInput = element(by.model('playerData.major'));
  this.saveButton = element(by.css('.save-button'));
  this.cancelButton = element(by.css('.cancel-button'));
  this.errorMessage = element(by.css('.error-message'));
  this.successMessage = element(by.css('.success-message'));
  
  this.getCreate = function() {
    browser.get('/#/profile/create');
  };
  
  this.getEdit = function() {
    browser.get('/#/profile/edit');
  };
  
  this.fillProfile = function(profileData) {
    if (profileData.computing_id) {
      this.computingIdInput.clear();
      this.computingIdInput.sendKeys(profileData.computing_id);
    }
    
    this.firstNameInput.clear();
    this.firstNameInput.sendKeys(profileData.first_name);
    
    this.lastNameInput.clear();
    this.lastNameInput.sendKeys(profileData.last_name);
    
    this.yearsExperienceInput.clear();
    this.yearsExperienceInput.sendKeys(profileData.years_of_experience);
    
    this.levelSelect.element(by.css('option[value="' + profileData.level + '"]')).click();
    
    this.majorInput.clear();
    this.majorInput.sendKeys(profileData.major);
  };
  
  this.save = function() {
    this.saveButton.click();
  };
  
  this.cancel = function() {
    this.cancelButton.click();
  };
  
  this.getErrorText = function() {
    return this.errorMessage.getText();
  };
  
  this.getSuccessText = function() {
    return this.successMessage.getText();
  };
};

// Session Page Object
PageObjects.SessionPage = function() {
  this.sessionTypeRadios = element.all(by.model('sessionType'));
  this.sessionDateInput = element(by.model('sessionData.session_date'));
  this.photoUpload = element(by.css('.photo-upload input[type="file"]'));
  this.photoPreview = element(by.css('.photo-preview img'));
  this.analyzeButton = element(by.css('.analyze-button'));
  this.chipAnalysisResults = element(by.css('.chip-analysis-results'));
  this.totalValueDisplay = element(by.css('.total-value'));
  this.submitButton = element(by.css('.submit-button'));
  this.cancelButton = element(by.css('.cancel-button'));
  this.errorMessage = element(by.css('.error-message'));
  this.successMessage = element(by.css('.success-message'));
  this.loadingIndicator = element(by.css('.loading-indicator'));
  
  this.get = function() {
    browser.get('/#/session');
  };
  
  this.selectSessionType = function(type) {
    var radio = element(by.css('input[value="' + type + '"]'));
    radio.click();
  };
  
  this.setSessionDate = function(date) {
    this.sessionDateInput.clear();
    this.sessionDateInput.sendKeys(date);
  };
  
  this.uploadPhoto = function(filePath) {
    this.photoUpload.sendKeys(filePath);
  };
  
  this.analyzePhoto = function() {
    this.analyzeButton.click();
  };
  
  this.submitSession = function() {
    this.submitButton.click();
  };
  
  this.cancel = function() {
    this.cancelButton.click();
  };
  
  this.getTotalValue = function() {
    return this.totalValueDisplay.getText();
  };
  
  this.isAnalysisResultsVisible = function() {
    return this.chipAnalysisResults.isDisplayed();
  };
  
  this.isLoading = function() {
    return this.loadingIndicator.isDisplayed();
  };
};

// Leaderboard Page Object
PageObjects.LeaderboardPage = function() {
  this.leaderboardTable = element(by.css('.leaderboard-table'));
  this.leaderboardRows = element.all(by.css('.leaderboard-row'));
  this.refreshButton = element(by.css('.refresh-button'));
  this.loadingIndicator = element(by.css('.loading-indicator'));
  this.errorMessage = element(by.css('.error-message'));
  this.currentUserHighlight = element(by.css('.current-user-row'));
  
  this.get = function() {
    browser.get('/#/leaderboard');
  };
  
  this.refresh = function() {
    this.refreshButton.click();
  };
  
  this.getPlayerCount = function() {
    return this.leaderboardRows.count();
  };
  
  this.getPlayerAtRank = function(rank) {
    return this.leaderboardRows.get(rank - 1);
  };
  
  this.isCurrentUserHighlighted = function() {
    return this.currentUserHighlight.isDisplayed();
  };
  
  this.isLoading = function() {
    return this.loadingIndicator.isDisplayed();
  };
};

// Admin Page Object
PageObjects.AdminPage = function() {
  this.playersTab = element(by.css('.tab-players'));
  this.sessionsTab = element(by.css('.tab-sessions'));
  this.statsTab = element(by.css('.tab-stats'));
  
  this.playersTable = element(by.css('.players-table'));
  this.playerRows = element.all(by.css('.player-row'));
  this.editPlayerButtons = element.all(by.css('.edit-player-button'));
  this.deletePlayerButtons = element.all(by.css('.delete-player-button'));
  
  this.sessionsTable = element(by.css('.sessions-table'));
  this.sessionRows = element.all(by.css('.session-row'));
  this.editSessionButtons = element.all(by.css('.edit-session-button'));
  this.deleteSessionButtons = element.all(by.css('.delete-session-button'));
  
  this.systemStats = element(by.css('.system-stats'));
  this.totalPlayersCount = element(by.css('.total-players'));
  this.totalSessionsCount = element(by.css('.total-sessions'));
  
  this.editModal = element(by.css('.edit-modal'));
  this.saveEditButton = element(by.css('.save-edit-button'));
  this.cancelEditButton = element(by.css('.cancel-edit-button'));
  
  this.get = function() {
    browser.get('/#/admin');
  };
  
  this.switchToPlayersTab = function() {
    this.playersTab.click();
  };
  
  this.switchToSessionsTab = function() {
    this.sessionsTab.click();
  };
  
  this.switchToStatsTab = function() {
    this.statsTab.click();
  };
  
  this.getPlayerCount = function() {
    return this.playerRows.count();
  };
  
  this.getSessionCount = function() {
    return this.sessionRows.count();
  };
  
  this.editPlayer = function(index) {
    this.editPlayerButtons.get(index).click();
  };
  
  this.deletePlayer = function(index) {
    this.deletePlayerButtons.get(index).click();
  };
  
  this.editSession = function(index) {
    this.editSessionButtons.get(index).click();
  };
  
  this.deleteSession = function(index) {
    this.deleteSessionButtons.get(index).click();
  };
  
  this.saveEdit = function() {
    this.saveEditButton.click();
  };
  
  this.cancelEdit = function() {
    this.cancelEditButton.click();
  };
  
  this.isEditModalVisible = function() {
    return this.editModal.isDisplayed();
  };
};

module.exports = PageObjects;