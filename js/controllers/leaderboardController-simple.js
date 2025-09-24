angular.module('pokerPalApp')
.controller('LeaderboardController', ['$scope', 'AuthService', 'PlayerService', function($scope, AuthService, PlayerService) {
    
    console.log('LeaderboardController loading...');
    
    // Initialize controller
    $scope.loading = false;
    $scope.currentUser = AuthService.getCurrentUser();
    $scope.leaderboard = [];
    $scope.userRank = null;
    $scope.lastUpdated = new Date();
    
    // Filter options
    $scope.filters = {
        timeframe: 'all',
        sort: 'winnings',
        limit: 25
    };
    
    // UI state
    $scope.showFilters = false;
    
    // Mock leaderboard data
    $scope.mockLeaderboard = [
        {
            computing_id: 'test123',
            first_name: 'Test',
            last_name: 'User',
            total_winnings: 150.75,
            rank: 1
        },
        {
            computing_id: 'player2',
            first_name: 'John',
            last_name: 'Doe',
            total_winnings: 89.50,
            rank: 2
        },
        {
            computing_id: 'player3',
            first_name: 'Jane',
            last_name: 'Smith',
            total_winnings: 45.25,
            rank: 3
        },
        {
            computing_id: 'player4',
            first_name: 'Bob',
            last_name: 'Johnson',
            total_winnings: -12.75,
            rank: 4
        }
    ];
    
    // Load leaderboard function
    $scope.loadLeaderboard = function() {
        console.log('Loading leaderboard...');
        console.log('Current user:', $scope.currentUser);
        console.log('Auth token:', localStorage.getItem('pokerpal_token'));
        $scope.loading = true;
        
        // Try real API first, fallback to mock data
        PlayerService.getLeaderboard($scope.filters.limit, 0, $scope.filters.timeframe, $scope.filters.sort).then(function(data) {
            console.log('SUCCESS: Leaderboard loaded from API:', data);
            
            // The API returns { leaderboard: [...], pagination: {...} }
            var leaderboardData = data.leaderboard || data.players || data;
            
            if (Array.isArray(leaderboardData)) {
                $scope.leaderboard = leaderboardData;
                console.log('Using API data:', $scope.leaderboard.length, 'players');
            } else {
                console.warn('API data not in expected format, using mock data');
                $scope.leaderboard = $scope.mockLeaderboard;
            }
            
            // Find user's rank
            if ($scope.currentUser) {
                var userEntry = $scope.leaderboard.find(function(entry) {
                    return entry.computing_id === $scope.currentUser.computing_id;
                });
                $scope.userRank = userEntry ? userEntry.rank : null;
                console.log('User rank:', $scope.userRank);
            }
            
            $scope.loading = false;
            $scope.lastUpdated = new Date();
        }).catch(function(error) {
            console.error('ERROR: API failed, using mock data:', error);
            console.error('Error details:', error);
            
            // Fallback to mock data
            $scope.leaderboard = $scope.mockLeaderboard;
            
            // Find user's rank
            if ($scope.currentUser) {
                var userEntry = $scope.leaderboard.find(function(entry) {
                    return entry.computing_id === $scope.currentUser.computing_id;
                });
                $scope.userRank = userEntry ? userEntry.rank : null;
            }
            
            $scope.loading = false;
            $scope.lastUpdated = new Date();
        });
    };
    
    // Format currency
    $scope.formatCurrency = function(amount) {
        if (typeof amount !== 'number') {
            amount = parseFloat(amount) || 0;
        }
        return '$' + amount.toFixed(2);
    };
    
    // Get winnings color class
    $scope.getWinningsColorClass = function(amount) {
        var winnings = parseFloat(amount) || 0;
        if (winnings > 0) {
            return 'text-success';
        } else if (winnings < 0) {
            return 'text-danger';
        }
        return 'text-muted';
    };
    
    // Toggle filters panel
    $scope.toggleFilters = function() {
        $scope.showFilters = !$scope.showFilters;
    };
    
    // Apply filters
    $scope.applyFilters = function() {
        console.log('Applying filters:', $scope.filters);
        $scope.loadLeaderboard();
    };
    
    // Reset filters
    $scope.resetFilters = function() {
        $scope.filters = {
            timeframe: 'all',
            sort: 'winnings',
            limit: 25
        };
        $scope.loadLeaderboard();
    };
    
    // Refresh data
    $scope.refresh = function() {
        console.log('Refreshing leaderboard data...');
        $scope.loadLeaderboard();
    };
    
    // Get filter summary
    $scope.getFilterSummary = function() {
        var timeframe = $scope.filters.timeframe === 'all' ? 'All Time' : 
                       $scope.filters.timeframe === 'month' ? 'This Month' :
                       $scope.filters.timeframe === 'week' ? 'This Week' : 'Today';
        var sort = $scope.filters.sort === 'winnings' ? 'Total Winnings' :
                  $scope.filters.sort === 'sessions' ? 'Session Count' : 'Recent Activity';
        return timeframe + ' • Sorted by ' + sort;
    };
    
    // Get rank badge class
    $scope.getRankBadgeClass = function(rank) {
        if (rank === 1) return 'bg-warning text-dark'; // Gold
        if (rank === 2) return 'bg-secondary'; // Silver
        if (rank === 3) return 'bg-warning'; // Bronze
        return 'bg-primary';
    };
    
    // Get player initials
    $scope.getPlayerInitials = function(firstName, lastName) {
        var first = firstName ? firstName.charAt(0).toUpperCase() : '';
        var last = lastName ? lastName.charAt(0).toUpperCase() : '';
        return first + last || '??';
    };
    
    // Get win rate color class
    $scope.getWinRateColorClass = function(winRate) {
        if (!winRate) return 'text-muted';
        if (winRate >= 70) return 'text-success';
        if (winRate >= 50) return 'text-warning';
        return 'text-danger';
    };
    
    // Format percentage
    $scope.formatPercentage = function(value) {
        if (typeof value !== 'number') {
            value = parseFloat(value) || 0;
        }
        return value.toFixed(1) + '%';
    };
    
    // Format last session date
    $scope.formatLastSessionDate = function(dateString) {
        if (!dateString) return 'Never';
        
        var date = new Date(dateString);
        var now = new Date();
        var diffTime = Math.abs(now - date);
        var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return 'Yesterday';
        if (diffDays <= 7) return diffDays + ' days ago';
        if (diffDays <= 30) return Math.ceil(diffDays / 7) + ' weeks ago';
        return 'Long ago';
    };
    
    // Initialize
    $scope.loadLeaderboard();
    
    console.log('LeaderboardController loaded successfully');
}]);