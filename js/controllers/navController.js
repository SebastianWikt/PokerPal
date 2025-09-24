angular.module('pokerPalApp')
.controller('NavController', ['$scope', '$location', 'AuthService', function($scope, $location, AuthService) {
    
    // Initialize navigation state
    $scope.isAuthenticated = false;
    $scope.currentUser = null;
    $scope.isAdmin = false;
    
    // Update authentication state
    function updateAuthState() {
        $scope.isAuthenticated = AuthService.isAuthenticated();
        $scope.currentUser = AuthService.getCurrentUser();
        $scope.isAdmin = AuthService.isAdmin();
    }
    
    // Initialize auth state
    updateAuthState();
    
    // Watch for authentication changes
    $scope.$on('$routeChangeSuccess', function() {
        updateAuthState();
    });
    
    // Logout function
    $scope.logout = function() {
        AuthService.logout().then(function() {
            console.log('Logout successful');
            updateAuthState();
            $location.path('/');
        }).catch(function(error) {
            console.error('Logout error:', error);
            // Still redirect even if logout call fails
            updateAuthState();
            $location.path('/');
        });
    };
    
    // Navigation helpers
    $scope.isCurrentPath = function(path) {
        return $location.path() === path;
    };
    
    $scope.navigateTo = function(path) {
        $location.path(path);
    };
    
    // Get user display name
    $scope.getUserDisplayName = function() {
        if ($scope.currentUser) {
            return $scope.currentUser.first_name + ' ' + $scope.currentUser.last_name;
        }
        return '';
    };
    
    // Get user initials for avatar
    $scope.getUserInitials = function() {
        if ($scope.currentUser) {
            var first = $scope.currentUser.first_name ? $scope.currentUser.first_name.charAt(0) : '';
            var last = $scope.currentUser.last_name ? $scope.currentUser.last_name.charAt(0) : '';
            return (first + last).toUpperCase();
        }
        return '';
    };
    
    // Check if user can access admin features
    $scope.canAccessAdmin = function() {
        return $scope.isAuthenticated && $scope.isAdmin;
    };
    
    // Refresh user data
    $scope.refreshUser = function() {
        if ($scope.isAuthenticated) {
            AuthService.refreshUser().then(function() {
                updateAuthState();
            }).catch(function(error) {
                console.error('Failed to refresh user data:', error);
            });
        }
    };
    
    // Format currency for display
    $scope.formatCurrency = function(amount) {
        if (typeof amount !== 'number') {
            amount = parseFloat(amount) || 0;
        }
        return '$' + amount.toFixed(2);
    };
    
    // Get winnings color class
    $scope.getWinningsClass = function() {
        if (!$scope.currentUser) return 'text-muted';
        
        var winnings = parseFloat($scope.currentUser.total_winnings) || 0;
        if (winnings > 0) {
            return 'text-success';
        } else if (winnings < 0) {
            return 'text-danger';
        }
        return 'text-muted';
    };
}]);