angular.module('pokerPalApp')
.service('AdminService', ['$http', '$q', 'API_BASE_URL', function($http, $q, API_BASE_URL) {
    var self = this;
    
    // Check if admin service is ready
    this.isAdminServiceReady = function() {
        return true;
    };
    
    // Get chip values (admin function)
    this.getChipValues = function() {
        var deferred = $q.defer();
        
        $http.get(API_BASE_URL + '/admin/chip-values').then(function(response) {
            deferred.resolve(response.data);
        }).catch(function(error) {
            console.error('Get admin chip values error:', error);
            deferred.reject(error.data || { message: 'Failed to get chip values' });
        });
        
        return deferred.promise;
    };
    
    // Update chip values (admin function)
    this.updateChipValues = function(chipValues) {
        var deferred = $q.defer();
        
        $http.put(API_BASE_URL + '/admin/chip-values', chipValues).then(function(response) {
            deferred.resolve(response.data);
        }).catch(function(error) {
            console.error('Update chip values error:', error);
            deferred.reject(error.data || { message: 'Failed to update chip values' });
        });
        
        return deferred.promise;
    };
    
    // Override session (admin function)
    this.overrideSession = function(sessionId, netWinnings, reason) {
        var deferred = $q.defer();
        
        var data = {
            net_winnings: netWinnings,
            reason: reason
        };
        
        $http.put(API_BASE_URL + '/admin/sessions/' + sessionId + '/override', data).then(function(response) {
            deferred.resolve(response.data);
        }).catch(function(error) {
            console.error('Override session error:', error);
            deferred.reject(error.data || { message: 'Failed to override session' });
        });
        
        return deferred.promise;
    };
    
    // Get audit logs
    this.getAuditLogs = function(limit, offset) {
        var deferred = $q.defer();
        
        var params = {};
        if (limit) params.limit = limit;
        if (offset) params.offset = offset;
        
        $http.get(API_BASE_URL + '/admin/audit-logs', { params: params }).then(function(response) {
            deferred.resolve(response.data);
        }).catch(function(error) {
            console.error('Get audit logs error:', error);
            deferred.reject(error.data || { message: 'Failed to get audit logs' });
        });
        
        return deferred.promise;
    };
    
    // Get admin players
    this.getAdminPlayers = function() {
        var deferred = $q.defer();
        
        $http.get(API_BASE_URL + '/admin/players').then(function(response) {
            deferred.resolve(response.data);
        }).catch(function(error) {
            console.error('Get admin players error:', error);
            deferred.reject(error.data || { message: 'Failed to get players' });
        });
        
        return deferred.promise;
    };
    
    // Get admin statistics
    this.getAdminStats = function() {
        var deferred = $q.defer();
        
        $http.get(API_BASE_URL + '/admin/stats').then(function(response) {
            deferred.resolve(response.data);
        }).catch(function(error) {
            console.error('Get admin stats error:', error);
            deferred.reject(error.data || { message: 'Failed to get admin statistics' });
        });
        
        return deferred.promise;
    };
    
    // Format currency
    this.formatCurrency = function(amount) {
        if (typeof amount !== 'number') {
            amount = parseFloat(amount) || 0;
        }
        return '$' + amount.toFixed(2);
    };
    
    // Get available chip colors
    this.getAvailableChipColors = function() {
        return ['white', 'red', 'green', 'black', 'blue'];
    };
    
    // Validate chip values
    this.validateChipValues = function(chipValues) {
        var errors = [];
        
        if (!chipValues || Object.keys(chipValues).length === 0) {
            errors.push('At least one chip color must be configured');
            return errors;
        }
        
        Object.keys(chipValues).forEach(function(color) {
            var value = parseFloat(chipValues[color]);
            
            if (isNaN(value) || value <= 0) {
                errors.push('Chip value for ' + color + ' must be a positive number');
            }
            
            if (value > 10000) {
                errors.push('Chip value for ' + color + ' cannot exceed $10,000');
            }
        });
        
        return errors;
    };
    
    // Format audit log action
    this.formatAuditAction = function(action) {
        var actionMap = {
            'UPDATE_CHIP_VALUES': 'Updated Chip Values',
            'ADMIN_OVERRIDE_SESSION': 'Overrode Session',
            'UPDATE_PLAYER_PROFILE': 'Updated Player Profile',
            'RECALCULATE_WINNINGS': 'Recalculated Winnings'
        };
        
        return actionMap[action] || action;
    };
    
    // Format date for display
    this.formatDate = function(dateString) {
        if (!dateString) return 'Never';
        
        var date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };
    
    // Get chip color display name
    this.getChipColorDisplay = function(color) {
        return color.charAt(0).toUpperCase() + color.slice(1);
    };
    
    // Get override reason display
    this.getOverrideReasonDisplay = function(reason) {
        return reason || 'No reason provided';
    };
}]);