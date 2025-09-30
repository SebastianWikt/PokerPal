angular.module('pokerPalApp')
.controller('LeaderboardController', ['$scope', '$location', 'AuthService', 'LeaderboardService', function($scope, $location, AuthService, LeaderboardService) {
    
    // Initialize controller
    $scope.currentUser = AuthService.getCurrentUser();
    $scope.loading = false;
    $scope.error = null;
    
    // Leaderboard data
    $scope.leaderboard = [];
    $scope.pagination = {};
    $scope.metadata = {};
    $scope.summaryStats = null;
    $scope.playerPosition = null;
    
    // Filter options
    $scope.filters = {
        timeframe: 'all',
        sort: 'winnings',
        limit: 25,
        offset: 0
    };
    
    // Available options
    $scope.timeframes = LeaderboardService.getTimeframes();
    $scope.sortOptions = LeaderboardService.getSortOptions();
    
    // UI state
    $scope.showFilters = false;
    $scope.showStats = true;
    $scope.showPlayerPosition = false;
    
    // Initialize page
    function initialize() {
        loadLeaderboard();
        loadSummaryStats();
        
        if ($scope.currentUser) {
            loadPlayerPosition();
        }
    }
    
    // Load leaderboard data
    function loadLeaderboard() {
        $scope.loading = true;
        $scope.error = null;
        
        var options = {
            timeframe: $scope.filters.timeframe,
            sort: $scope.filters.sort,
            limit: $scope.filters.limit,
            offset: $scope.filters.offset
        };
        
        // Validate options
        var validationErrors = LeaderboardService.validateOptions(options);
        if (validationErrors.length > 0) {
            $scope.error = validationErrors.join(', ');
            $scope.loading = false;
            return;
        }
        
        LeaderboardService.getLeaderboard(options).then(function(data) {
            $scope.leaderboard = data.leaderboard;
            $scope.pagination = data.pagination;
            $scope.metadata = data.metadata;
            $scope.loading = false;
            
            console.log('Leaderboard loaded:', data);
            
        }).catch(function(error) {
            console.error('Load leaderboard error:', error);
            $scope.error = error.message || 'Failed to load leaderboard';
            $scope.loading = false;
        });
    }
    
    // Load summary statistics
    function loadSummaryStats() {
        LeaderboardService.getLeaderboardStats().then(function(data) {
            $scope.summaryStats = data.summary;
            // Cache the formatted stats to prevent infinite digest loop
            $scope.summaryStatsDisplay = LeaderboardService.getSummaryStatsDisplay(data.summary);
            console.log('Summary stats loaded:', data);
            
        }).catch(function(error) {
            console.error('Load summary stats error:', error);
            // Don't show error for stats, just log it
        });
    }
    
    // Load player position
    function loadPlayerPosition() {
        if (!$scope.currentUser) return;
        
        LeaderboardService.getPlayerPosition($scope.currentUser.computing_id).then(function(data) {
            $scope.playerPosition = data;
            $scope.showPlayerPosition = true;
            console.log('Player position loaded:', data);
            
        }).catch(function(error) {
            console.error('Load player position error:', error);
            // Don't show error for player position, just log it
        });
    }
    
    // Apply filters
    $scope.applyFilters = function() {
        $scope.filters.offset = 0; // Reset to first page
        loadLeaderboard();
    };
    
    // Reset filters
    $scope.resetFilters = function() {
        $scope.filters = {
            timeframe: 'all',
            sort: 'winnings',
            limit: 25,
            offset: 0
        };
        loadLeaderboard();
    };
    
    // Toggle filters panel
    $scope.toggleFilters = function() {
        $scope.showFilters = !$scope.showFilters;
    };
    
    // Toggle stats panel
    $scope.toggleStats = function() {
        $scope.showStats = !$scope.showStats;
    };
    
    // Toggle player position panel
    $scope.togglePlayerPosition = function() {
        $scope.showPlayerPosition = !$scope.showPlayerPosition;
    };
    
    // Pagination methods
    $scope.goToPage = function(page) {
        var newOffset = (page - 1) * $scope.filters.limit;
        if (newOffset >= 0 && newOffset < $scope.pagination.total) {
            $scope.filters.offset = newOffset;
            loadLeaderboard();
        }
    };
    
    $scope.nextPage = function() {
        if ($scope.pagination.has_more) {
            $scope.filters.offset += $scope.filters.limit;
            loadLeaderboard();
        }
    };
    
    $scope.prevPage = function() {
        if ($scope.filters.offset > 0) {
            $scope.filters.offset = Math.max(0, $scope.filters.offset - $scope.filters.limit);
            loadLeaderboard();
        }
    };
    
    // Get current page number
    $scope.getCurrentPage = function() {
        return Math.floor($scope.filters.offset / $scope.filters.limit) + 1;
    };
    
    // Get total pages
    $scope.getTotalPages = function() {
        return Math.ceil($scope.pagination.total / $scope.filters.limit);
    };
    
    // Check if has previous page
    $scope.hasPrevPage = function() {
        return $scope.filters.offset > 0;
    };
    
    // Check if has next page
    $scope.hasNextPage = function() {
        return $scope.pagination.has_more;
    };
    
    // Refresh data
    $scope.refresh = function() {
        loadLeaderboard();
        loadSummaryStats();
        if ($scope.currentUser) {
            loadPlayerPosition();
        }
    };
    
    // Navigate to player profile (if implemented)
    $scope.viewPlayerProfile = function(player) {
        // This could navigate to a player profile page
        console.log('View profile for:', player.display_name);
    };
    
    // Utility functions - wrapped to prevent infinite digest loop
    $scope.formatCurrency = function(amount) {
        return LeaderboardService.formatCurrency(amount);
    };
    
    $scope.getWinningsColorClass = function(amount) {
        return LeaderboardService.getWinningsColorClass(amount);
    };
    
    $scope.getRankBadgeClass = function(rank) {
        return LeaderboardService.getRankBadgeClass(rank);
    };
    
    $scope.formatPercentage = function(value) {
        return LeaderboardService.formatPercentage(value);
    };
    
    $scope.formatTimeframeDisplay = function(timeframe) {
        return LeaderboardService.formatTimeframeDisplay(timeframe);
    };
    
    $scope.formatSortDisplay = function(sort) {
        return LeaderboardService.formatSortDisplay(sort);
    };
    
    // Get filter display text
    $scope.getFilterSummary = function() {
        var timeframe = LeaderboardService.formatTimeframeDisplay($scope.filters.timeframe);
        var sort = LeaderboardService.formatSortDisplay($scope.filters.sort);
        return timeframe + ' • Sorted by ' + sort;
    };
    
    // Check if player is current user
    $scope.isCurrentUser = function(player) {
        return $scope.currentUser && player.computing_id === $scope.currentUser.computing_id;
    };
    
    // Get player row class
    $scope.getPlayerRowClass = function(player) {
        var classes = [];
        
        if ($scope.isCurrentUser(player)) {
            classes.push('table-warning');
        }
        
        if (player.is_trending) {
            classes.push('trending-player');
        }
        
        return classes.join(' ');
    };
    
    // Initialize the controller
    initialize();
}]);