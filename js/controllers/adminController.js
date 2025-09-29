angular.module('pokerPalApp')
.controller('AdminController', ['$scope', '$location', 'AuthService', 'AdminService', function($scope, $location, AuthService, AdminService) {
    
    // Initialize controller
    $scope.currentUser = AuthService.getCurrentUser();
    $scope.loading = false;
    $scope.error = null;
    $scope.success = null;
    
    // Check if user is admin
    if (!$scope.currentUser || !$scope.currentUser.is_admin) {
        $location.path('/home');
        return;
    }
    
    // Admin data
    $scope.adminStats = null;
    $scope.chipValues = {};
    $scope.auditLogs = [];
    $scope.players = [];
    
    // UI state
    $scope.activeTab = 'dashboard';
    $scope.editingChipValues = false;
    $scope.originalChipValues = {};
    
    // Session override
    $scope.overrideForm = {
        sessionId: '',
        netWinnings: 0,
        reason: ''
    };
    
    // Initialize admin dashboard
    function initialize() {
        loadAdminStats();
        loadChipValues();
        loadAuditLogs();
        loadPlayers();
    }
    
    // Load admin statistics
    function loadAdminStats() {
        $scope.loading = true;
        
        AdminService.getAdminStats().then(function(data) {
            $scope.adminStats = data.stats;
            $scope.loading = false;
        }).catch(function(error) {
            console.error('Load admin stats error:', error);
            $scope.error = error.message || 'Failed to load admin statistics';
            $scope.loading = false;
        });
    }
    
    // Load chip values
    function loadChipValues() {
        AdminService.getChipValues().then(function(data) {
            $scope.chipValues = data.chip_values;
            $scope.originalChipValues = angular.copy(data.chip_values);
        }).catch(function(error) {
            console.error('Load chip values error:', error);
        });
    }
    
    // Load audit logs
    function loadAuditLogs() {
        AdminService.getAuditLogs(50, 0).then(function(data) {
            $scope.auditLogs = data.audit_logs;
        }).catch(function(error) {
            console.error('Load audit logs error:', error);
        });
    }
    
    // Load players
    function loadPlayers() {
        AdminService.getAdminPlayers().then(function(data) {
            $scope.players = data.players;
        }).catch(function(error) {
            console.error('Load players error:', error);
        });
    }
    
    // Switch tabs
    $scope.switchTab = function(tab) {
        $scope.activeTab = tab;
        $scope.clearMessages();
    };
    
    // Clear messages
    $scope.clearMessages = function() {
        $scope.error = null;
        $scope.success = null;
    };
    
    // Chip Values Management
    $scope.startEditingChipValues = function() {
        $scope.editingChipValues = true;
        $scope.clearMessages();
    };
    
    $scope.cancelEditingChipValues = function() {
        $scope.editingChipValues = false;
        $scope.chipValues = angular.copy($scope.originalChipValues);
        $scope.clearMessages();
    };
    
    $scope.saveChipValues = function() {
        // Validate chip values
        var validationErrors = AdminService.validateChipValues($scope.chipValues);
        if (validationErrors.length > 0) {
            $scope.error = validationErrors.join(', ');
            return;
        }
        
        $scope.loading = true;
        $scope.clearMessages();
        
        AdminService.updateChipValues($scope.chipValues).then(function(response) {
            $scope.success = response.message + ' (' + response.recalculated_players + ' players recalculated)';
            $scope.originalChipValues = angular.copy($scope.chipValues);
            $scope.editingChipValues = false;
            $scope.loading = false;
            
            // Reload stats to reflect changes
            loadAdminStats();
            
        }).catch(function(error) {
            console.error('Save chip values error:', error);
            $scope.error = error.message || 'Failed to update chip values';
            $scope.loading = false;
        });
    };
    
    $scope.hasChipValueChanges = function() {
        return !angular.equals($scope.chipValues, $scope.originalChipValues);
    };
    
    // Session Override
    $scope.overrideSession = function() {
        if (!$scope.overrideForm.sessionId || !$scope.overrideForm.netWinnings) {
            $scope.error = 'Session ID and Net Winnings are required';
            return;
        }
        
        $scope.loading = true;
        $scope.clearMessages();
        
        AdminService.overrideSession(
            $scope.overrideForm.sessionId,
            parseFloat($scope.overrideForm.netWinnings),
            $scope.overrideForm.reason
        ).then(function(response) {
            $scope.success = response.message + ' (Difference: ' + AdminService.formatCurrency(response.difference) + ')';
            
            // Reset form
            $scope.overrideForm = {
                sessionId: '',
                netWinnings: 0,
                reason: ''
            };
            
            $scope.loading = false;
            
            // Reload data
            loadAdminStats();
            loadAuditLogs();
            
        }).catch(function(error) {
            console.error('Override session error:', error);
            $scope.error = error.message || 'Failed to override session';
            $scope.loading = false;
        });
    };
    
    // Refresh data
    $scope.refreshData = function() {
        loadAdminStats();
        loadChipValues();
        loadAuditLogs();
        loadPlayers();
    };
    
    // Helper functions from service
    $scope.formatCurrency = AdminService.formatCurrency;
    $scope.formatDate = AdminService.formatDate;
    $scope.formatAuditAction = AdminService.formatAuditAction;
    $scope.getChipColorDisplay = AdminService.getChipColorDisplay;
    $scope.getOverrideReasonDisplay = AdminService.getOverrideReasonDisplay;
    
    // Get available chip colors
    $scope.availableChipColors = AdminService.getAvailableChipColors();
    
    // Add new chip color
    $scope.addChipColor = function(color) {
        if (color && !$scope.chipValues[color]) {
            $scope.chipValues[color] = 1.00;
        }
    };
    
    // Remove chip color
    $scope.removeChipColor = function(color) {
        if ($scope.chipValues[color]) {
            delete $scope.chipValues[color];
        }
    };
    
    // Get chip colors in use
    $scope.getChipColorsInUse = function() {
        return Object.keys($scope.chipValues);
    };
    
    // Initialize the controller
    initialize();
}]);