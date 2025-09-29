angular.module('pokerPalApp')
.service('PlayerService', ['$http', '$q', 'API_BASE_URL', function($http, $q, API_BASE_URL) {
    var self = this;
    
    // Create a new player profile
    this.createPlayer = function(playerData) {
        var deferred = $q.defer();
        
        $http.post(API_BASE_URL + '/players', playerData).then(function(response) {
            deferred.resolve(response.data);
        }).catch(function(error) {
            console.error('Create player error:', error);
            deferred.reject(error.data || { message: 'Failed to create player' });
        });
        
        return deferred.promise;
    };
    
    // Get player by computing ID
    this.getPlayer = function(computingId) {
        var deferred = $q.defer();
        
        $http.get(API_BASE_URL + '/players/' + computingId).then(function(response) {
            deferred.resolve(response.data.player);
        }).catch(function(error) {
            console.error('Get player error:', error);
            deferred.reject(error.data || { message: 'Failed to get player' });
        });
        
        return deferred.promise;
    };
    
    // Update player profile
    this.updatePlayer = function(computingId, updates) {
        var deferred = $q.defer();
        
        $http.put(API_BASE_URL + '/players/' + computingId, updates).then(function(response) {
            deferred.resolve(response.data);
        }).catch(function(error) {
            console.error('Update player error:', error);
            deferred.reject(error.data || { message: 'Failed to update player' });
        });
        
        return deferred.promise;
    };
    
    // Get leaderboard
    this.getLeaderboard = function(limit, offset, timeframe, sort) {
        var deferred = $q.defer();
        
        var params = {};
        if (limit) params.limit = limit;
        if (offset) params.offset = offset;
        if (timeframe) params.timeframe = timeframe;
        if (sort) params.sort = sort;
        
        $http.get(API_BASE_URL + '/leaderboard', { params: params }).then(function(response) {
            deferred.resolve(response.data);
        }).catch(function(error) {
            console.error('Get leaderboard error:', error);
            deferred.reject(error.data || { message: 'Failed to get leaderboard' });
        });
        
        return deferred.promise;
    };
    
    // Get player entries
    this.getPlayerEntries = function(computingId) {
        var deferred = $q.defer();
        
        $http.get(API_BASE_URL + '/players/' + computingId + '/entries').then(function(response) {
            deferred.resolve(response.data);
        }).catch(function(error) {
            console.error('Get player entries error:', error);
            deferred.reject(error.data || { message: 'Failed to get player entries' });
        });
        
        return deferred.promise;
    };
    
    // Recalculate player winnings (admin only)
    this.recalculateWinnings = function(computingId) {
        var deferred = $q.defer();
        
        $http.post(API_BASE_URL + '/players/' + computingId + '/recalculate-winnings').then(function(response) {
            deferred.resolve(response.data);
        }).catch(function(error) {
            console.error('Recalculate winnings error:', error);
            deferred.reject(error.data || { message: 'Failed to recalculate winnings' });
        });
        
        return deferred.promise;
    };
    
    // Validate player data
    this.validatePlayerData = function(playerData) {
        var errors = [];
        
        // Required fields
        if (!playerData.computing_id || playerData.computing_id.trim() === '') {
            errors.push('Computing ID is required');
        } else {
            // Computing ID format validation
            var computingIdPattern = /^[a-zA-Z0-9]{3,50}$/;
            if (!computingIdPattern.test(playerData.computing_id)) {
                errors.push('Computing ID must be 3-50 characters and contain only letters and numbers');
            }
        }
        
        if (!playerData.first_name || playerData.first_name.trim() === '') {
            errors.push('First name is required');
        } else if (playerData.first_name.length > 100) {
            errors.push('First name must not exceed 100 characters');
        }
        
        if (!playerData.last_name || playerData.last_name.trim() === '') {
            errors.push('Last name is required');
        } else if (playerData.last_name.length > 100) {
            errors.push('Last name must not exceed 100 characters');
        }
        
        // Optional field validations
        if (playerData.years_of_experience !== undefined && playerData.years_of_experience !== null) {
            var experience = parseInt(playerData.years_of_experience);
            if (isNaN(experience) || experience < 0 || experience > 50) {
                errors.push('Years of experience must be a number between 0 and 50');
            }
        }
        
        if (playerData.level && !['Beginner', 'Intermediate', 'Advanced', 'Expert'].includes(playerData.level)) {
            errors.push('Level must be one of: Beginner, Intermediate, Advanced, Expert');
        }
        
        if (playerData.major && playerData.major.length > 100) {
            errors.push('Major must not exceed 100 characters');
        }
        
        return errors;
    };
    
    // Get available experience levels
    this.getExperienceLevels = function() {
        return ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
    };
    
    // Get common majors (for autocomplete/suggestions)
    this.getCommonMajors = function() {
        return [
            'Computer Science',
            'Information Technology',
            'Software Engineering',
            'Computer Engineering',
            'Mathematics',
            'Statistics',
            'Data Science',
            'Business Administration',
            'Economics',
            'Finance',
            'Electrical Engineering',
            'Mechanical Engineering',
            'Physics',
            'Chemistry',
            'Biology',
            'Psychology',
            'Other'
        ];
    };
    
    // Format currency display
    this.formatCurrency = function(amount) {
        if (typeof amount !== 'number') {
            amount = parseFloat(amount) || 0;
        }
        return '$' + amount.toFixed(2);
    };
    
    // Get winnings color class for display
    this.getWinningsColorClass = function(amount) {
        var winnings = parseFloat(amount) || 0;
        if (winnings > 0) {
            return 'text-success';
        } else if (winnings < 0) {
            return 'text-danger';
        }
        return 'text-muted';
    };
    
    // Calculate experience level based on years
    this.suggestExperienceLevel = function(years) {
        if (!years || years < 1) return 'Beginner';
        if (years < 3) return 'Intermediate';
        if (years < 7) return 'Advanced';
        return 'Expert';
    };
}]);