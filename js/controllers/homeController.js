angular.module('pokerPalApp')
.controller('HomeController', ['$scope', '$location', 'AuthService', function($scope, $location, AuthService) {
    
    // Initialize controller
    $scope.currentUser = AuthService.getCurrentUser();
    $scope.loading = false;
    
    // Navigation functions
    $scope.navigateToSession = function() {
        $location.path('/session');
    };
    
    $scope.navigateToLeaderboard = function() {
        $location.path('/leaderboard');
    };
    
    $scope.navigateToProfile = function() {
        $location.path('/profile/edit');
    };
    
    $scope.navigateToAdmin = function() {
        if (AuthService.isAdmin()) {
            $location.path('/admin');
        }
    };
    
    // Check if user is admin
    $scope.isAdmin = function() {
        return AuthService.isAdmin();
    };
    
    // Refresh user data
    $scope.refreshUserData = function() {
        $scope.loading = true;
        
        AuthService.refreshUser().then(function(user) {
            $scope.currentUser = user;
            $scope.loading = false;
        }).catch(function(error) {
            console.error('Failed to refresh user data:', error);
            $scope.loading = false;
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
    $scope.getWinningsColorClass = function() {
        var winnings = parseFloat($scope.currentUser.total_winnings) || 0;
        if (winnings > 0) {
            return 'text-success';
        } else if (winnings < 0) {
            return 'text-danger';
        }
        return 'text-muted';
    };
    
    // Initialize page
    if ($scope.currentUser) {
        console.log('Home page loaded for user:', $scope.currentUser.computing_id);
    }
}]);