angular.module('pokerPalApp')
.service('LeaderboardService', ['$http', '$q', 'API_BASE_URL', function($http, $q, API_BASE_URL) {
    var self = this;
    
    // Get leaderboard data
    this.getLeaderboard = function(options) {
        var deferred = $q.defer();
        
        options = options || {};
        var params = {};
        
        if (options.limit) params.limit = options.limit;
        if (options.offset) params.offset = options.offset;
        if (options.timeframe) params.timeframe = options.timeframe;
        if (options.sort) params.sort = options.sort;
        
        $http.get(API_BASE_URL + '/leaderboard', { params: params }).then(function(response) {
            deferred.resolve(response.data);
        }).catch(function(error) {
            console.error('Get leaderboard error:', error);
            deferred.reject(error.data || { message: 'Failed to get leaderboard' });
        });
        
        return deferred.promise;
    };
    
    // Get leaderboard statistics
    this.getLeaderboardStats = function() {
        var deferred = $q.defer();
        
        $http.get(API_BASE_URL + '/leaderboard/stats').then(function(response) {
            deferred.resolve(response.data);
        }).catch(function(error) {
            console.error('Get leaderboard stats error:', error);
            deferred.reject(error.data || { message: 'Failed to get leaderboard statistics' });
        });
        
        return deferred.promise;
    };
    
    // Get player leaderboard position
    this.getPlayerPosition = function(computingId) {
        var deferred = $q.defer();
        
        $http.get(API_BASE_URL + '/leaderboard/player/' + computingId).then(function(response) {
            deferred.resolve(response.data);
        }).catch(function(error) {
            console.error('Get player position error:', error);
            deferred.reject(error.data || { message: 'Failed to get player position' });
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
    
    // Get rank badge class
    this.getRankBadgeClass = function(rank) {
        if (rank === 1) return 'rank-badge gold';
        if (rank === 2) return 'rank-badge silver';
        if (rank === 3) return 'rank-badge bronze';
        return 'rank-badge';
    };
    
    // Get rank change icon
    this.getRankChangeIcon = function(change) {
        if (change > 0) return 'bi-arrow-up text-success';
        if (change < 0) return 'bi-arrow-down text-danger';
        return 'bi-dash text-muted';
    };
    
    // Get rank change text
    this.getRankChangeText = function(change) {
        if (change > 0) return '+' + change;
        if (change < 0) return change.toString();
        return '—';
    };
    
    // Format percentage
    this.formatPercentage = function(value) {
        if (typeof value !== 'number') {
            value = parseFloat(value) || 0;
        }
        return value.toFixed(1) + '%';
    };
    
    // Get win rate color class
    this.getWinRateColorClass = function(winRate) {
        if (winRate >= 70) return 'text-success';
        if (winRate >= 50) return 'text-warning';
        return 'text-danger';
    };
    
    // Get available timeframes
    this.getTimeframes = function() {
        return [
            { value: 'all', label: 'All Time' },
            { value: 'month', label: 'This Month' },
            { value: 'week', label: 'This Week' },
            { value: 'today', label: 'Today' }
        ];
    };
    
    // Get available sort options
    this.getSortOptions = function() {
        return [
            { value: 'winnings', label: 'Total Winnings' },
            { value: 'sessions', label: 'Session Count' },
            { value: 'recent', label: 'Recent Activity' }
        ];
    };
    
    // Format timeframe display
    this.formatTimeframeDisplay = function(timeframe) {
        var timeframes = this.getTimeframes();
        var found = timeframes.find(function(t) { return t.value === timeframe; });
        return found ? found.label : 'All Time';
    };
    
    // Format sort display
    this.formatSortDisplay = function(sort) {
        var sortOptions = this.getSortOptions();
        var found = sortOptions.find(function(s) { return s.value === sort; });
        return found ? found.label : 'Total Winnings';
    };
    
    // Get player initials
    this.getPlayerInitials = function(firstName, lastName) {
        var first = firstName ? firstName.charAt(0).toUpperCase() : '';
        var last = lastName ? lastName.charAt(0).toUpperCase() : '';
        return first + last;
    };
    
    // Format session count
    this.formatSessionCount = function(count) {
        if (count === 1) return '1 session';
        return count + ' sessions';
    };
    
    // Get trending indicator
    this.getTrendingIndicator = function(isTrending) {
        return isTrending ? '🔥' : '';
    };
    
    // Calculate percentile color
    this.getPercentileColorClass = function(percentile) {
        if (percentile >= 90) return 'text-success';
        if (percentile >= 70) return 'text-info';
        if (percentile >= 50) return 'text-warning';
        return 'text-muted';
    };
    
    // Format last session date
    this.formatLastSessionDate = function(dateString) {
        if (!dateString) return 'Never';
        
        var date = new Date(dateString);
        var now = new Date();
        var diffTime = Math.abs(now - date);
        var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return 'Yesterday';
        if (diffDays <= 7) return diffDays + ' days ago';
        if (diffDays <= 30) return Math.ceil(diffDays / 7) + ' weeks ago';
        if (diffDays <= 365) return Math.ceil(diffDays / 30) + ' months ago';
        return Math.ceil(diffDays / 365) + ' years ago';
    };
    
    // Get summary statistics display
    this.getSummaryStatsDisplay = function(stats) {
        if (!stats) return [];
        
        return [
            {
                label: 'Total Players',
                value: stats.total_players,
                icon: 'bi-people',
                color: 'text-primary'
            },
            {
                label: 'Active Players',
                value: stats.active_players,
                icon: 'bi-person-check',
                color: 'text-success'
            },
            {
                label: 'Total Winnings',
                value: this.formatCurrency(stats.total_winnings),
                icon: 'bi-currency-dollar',
                color: 'text-info'
            },
            {
                label: 'Total Sessions',
                value: stats.total_sessions,
                icon: 'bi-calendar-event',
                color: 'text-warning'
            }
        ];
    };
    
    // Validate leaderboard options
    this.validateOptions = function(options) {
        var errors = [];
        
        if (options.limit && (options.limit < 1 || options.limit > 100)) {
            errors.push('Limit must be between 1 and 100');
        }
        
        if (options.offset && options.offset < 0) {
            errors.push('Offset must be non-negative');
        }
        
        var validTimeframes = this.getTimeframes().map(function(t) { return t.value; });
        if (options.timeframe && validTimeframes.indexOf(options.timeframe) === -1) {
            errors.push('Invalid timeframe');
        }
        
        var validSorts = this.getSortOptions().map(function(s) { return s.value; });
        if (options.sort && validSorts.indexOf(options.sort) === -1) {
            errors.push('Invalid sort option');
        }
        
        return errors;
    };
}]);