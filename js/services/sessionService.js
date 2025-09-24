angular.module('pokerPalApp')
.service('SessionService', ['$http', '$q', 'API_BASE_URL', function($http, $q, API_BASE_URL) {
    var self = this;
    
    // Create session (check-in or check-out)
    this.createSession = function(sessionData, photoFile) {
        var deferred = $q.defer();
        
        var formData = new FormData();
        
        // Add session data
        Object.keys(sessionData).forEach(function(key) {
            if (sessionData[key] !== null && sessionData[key] !== undefined) {
                if (typeof sessionData[key] === 'object') {
                    formData.append(key, JSON.stringify(sessionData[key]));
                } else {
                    formData.append(key, sessionData[key]);
                }
            }
        });
        
        // Add photo if provided
        if (photoFile) {
            formData.append('photo', photoFile);
        }
        
        $http.post(API_BASE_URL + '/sessions', formData, {
            headers: { 'Content-Type': undefined },
            transformRequest: angular.identity
        }).then(function(response) {
            deferred.resolve(response.data);
        }).catch(function(error) {
            console.error('Create session error:', error);
            deferred.reject(error.data || { message: 'Failed to create session' });
        });
        
        return deferred.promise;
    };
    
    // Get all sessions for a player
    this.getPlayerSessions = function(computingId) {
        var deferred = $q.defer();
        
        $http.get(API_BASE_URL + '/sessions/' + computingId).then(function(response) {
            deferred.resolve(response.data);
        }).catch(function(error) {
            console.error('Get player sessions error:', error);
            deferred.reject(error.data || { message: 'Failed to get sessions' });
        });
        
        return deferred.promise;
    };
    
    // Get active session for a player and date
    this.getActiveSession = function(computingId, date) {
        var deferred = $q.defer();
        
        $http.get(API_BASE_URL + '/sessions/active/' + computingId + '/' + date).then(function(response) {
            deferred.resolve(response.data.session);
        }).catch(function(error) {
            console.error('Get active session error:', error);
            deferred.reject(error.data || { message: 'Failed to get active session' });
        });
        
        return deferred.promise;
    };
    
    // Update session
    this.updateSession = function(sessionId, updateData, photoFile) {
        var deferred = $q.defer();
        
        var formData = new FormData();
        
        // Add update data
        Object.keys(updateData).forEach(function(key) {
            if (updateData[key] !== null && updateData[key] !== undefined) {
                if (typeof updateData[key] === 'object') {
                    formData.append(key, JSON.stringify(updateData[key]));
                } else {
                    formData.append(key, updateData[key]);
                }
            }
        });
        
        // Add photo if provided
        if (photoFile) {
            formData.append('photo', photoFile);
        }
        
        $http.put(API_BASE_URL + '/sessions/' + sessionId, formData, {
            headers: { 'Content-Type': undefined },
            transformRequest: angular.identity
        }).then(function(response) {
            deferred.resolve(response.data);
        }).catch(function(error) {
            console.error('Update session error:', error);
            deferred.reject(error.data || { message: 'Failed to update session' });
        });
        
        return deferred.promise;
    };
    
    // Admin override session
    this.overrideSession = function(sessionId, netWinnings, reason) {
        var deferred = $q.defer();
        
        $http.post(API_BASE_URL + '/sessions/' + sessionId + '/override', {
            net_winnings: netWinnings,
            reason: reason
        }).then(function(response) {
            deferred.resolve(response.data);
        }).catch(function(error) {
            console.error('Override session error:', error);
            deferred.reject(error.data || { message: 'Failed to override session' });
        });
        
        return deferred.promise;
    };
    
    // Get today's date in YYYY-MM-DD format
    this.getTodayDate = function() {
        var today = new Date();
        var year = today.getFullYear();
        var month = String(today.getMonth() + 1).padStart(2, '0');
        var day = String(today.getDate()).padStart(2, '0');
        return year + '-' + month + '-' + day;
    };
    
    // Format date for display
    this.formatDate = function(dateString) {
        if (!dateString) return '';
        var date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };
    
    // Format currency
    this.formatCurrency = function(amount) {
        if (typeof amount !== 'number') {
            amount = parseFloat(amount) || 0;
        }
        return '$' + amount.toFixed(2);
    };
    
    // Get winnings color class
    this.getWinningsColorClass = function(amount) {
        var winnings = parseFloat(amount) || 0;
        if (winnings > 0) {
            return 'text-success';
        } else if (winnings < 0) {
            return 'text-danger';
        }
        return 'text-muted';
    };
    
    // Calculate chip total from breakdown
    this.calculateChipTotal = function(chipBreakdown, chipValues) {
        if (!chipBreakdown || !chipValues) return 0;
        
        var total = 0;
        Object.keys(chipBreakdown).forEach(function(color) {
            var count = parseInt(chipBreakdown[color]) || 0;
            var value = parseFloat(chipValues[color]) || 0;
            total += count * value;
        });
        
        return total;
    };
    
    // Validate session data
    this.validateSessionData = function(sessionData, sessionType) {
        var errors = [];
        
        // Common validations
        if (!sessionData.session_date) {
            errors.push('Session date is required');
        } else {
            var sessionDate = new Date(sessionData.session_date);
            var today = new Date();
            today.setHours(23, 59, 59, 999); // End of today
            
            if (sessionDate > today) {
                errors.push('Session date cannot be in the future');
            }
        }
        
        if (sessionType === 'check-in') {
            // Check-in validations
            if (sessionData.start_chips !== undefined && sessionData.start_chips !== null) {
                var startChips = parseFloat(sessionData.start_chips);
                if (isNaN(startChips) || startChips < 0) {
                    errors.push('Start chips must be a positive number');
                }
            }
            
            // Validate chip breakdown if provided
            if (sessionData.start_chip_breakdown) {
                var breakdown = sessionData.start_chip_breakdown;
                Object.keys(breakdown).forEach(function(color) {
                    var count = parseInt(breakdown[color]);
                    if (isNaN(count) || count < 0) {
                        errors.push('Chip count for ' + color + ' must be a positive number');
                    }
                });
            }
        } else if (sessionType === 'check-out') {
            // Check-out validations
            if (sessionData.end_chips !== undefined && sessionData.end_chips !== null) {
                var endChips = parseFloat(sessionData.end_chips);
                if (isNaN(endChips) || endChips < 0) {
                    errors.push('End chips must be a positive number');
                }
            }
            
            // Validate end chip breakdown if provided
            if (sessionData.end_chip_breakdown) {
                var endBreakdown = sessionData.end_chip_breakdown;
                Object.keys(endBreakdown).forEach(function(color) {
                    var count = parseInt(endBreakdown[color]);
                    if (isNaN(count) || count < 0) {
                        errors.push('End chip count for ' + color + ' must be a positive number');
                    }
                });
            }
        }
        
        return errors;
    };
    
    // Get available chip colors
    this.getChipColors = function() {
        return ['white', 'red', 'green', 'black', 'blue'];
    };
    
    // Get default chip values
    this.getDefaultChipValues = function() {
        return {
            white: 1,
            red: 2,
            green: 5,
            black: 20,
            blue: 50
        };
    };
    
    // Validate photo file
    this.validatePhotoFile = function(file) {
        var errors = [];
        
        if (!file) return errors;
        
        // Check file type
        if (!file.type.startsWith('image/')) {
            errors.push('Only image files are allowed');
        }
        
        // Check file size (10MB limit)
        var maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            errors.push('Image file must be smaller than 10MB');
        }
        
        return errors;
    };
    
    // Create image preview URL
    this.createImagePreview = function(file) {
        if (!file || !window.URL) return null;
        return window.URL.createObjectURL(file);
    };
    
    // Clean up image preview URL
    this.cleanupImagePreview = function(url) {
        if (url && window.URL) {
            window.URL.revokeObjectURL(url);
        }
    };
}]);