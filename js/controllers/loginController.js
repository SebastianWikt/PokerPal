angular.module('pokerPalApp')
.controller('LoginController', ['$scope', '$location', 'AuthService', 'ValidationService', 'ErrorService', 
function($scope, $location, AuthService, ValidationService, ErrorService) {
    
    // Initialize controller
    $scope.loginData = {
        computing_id: ''
    };
    
    $scope.loading = false;
    $scope.error = null;
    $scope.showCreateProfile = false;
    
    // Form validation
    $scope.loginForm = {};
    
    // Login function
    $scope.login = function() {
        // Clear previous errors
        ErrorService.clearErrors();
        
        // Validate form
        var validation = ValidationService.validateForm($scope.loginData, ValidationService.schemas.login);
        if (!validation.isValid) {
            ValidationService.displayErrors(validation.errors, 'login');
            return;
        }
        
        $scope.loading = true;
        $scope.error = null;
        
        var computingId = $scope.loginData.computing_id.trim();
        
        AuthService.login(computingId).then(function(response) {
            console.log('Login successful:', response.user);
            
            // Redirect to home page
            $location.path('/home');
            
        }).catch(function(error) {
            console.error('Login failed:', error);
            $scope.loading = false;
            
            if (error && error.requiresProfile) {
                $scope.error = error.message;
                $scope.showCreateProfile = true;
            } else {
                // Error will be handled by the HTTP interceptor
                // But we can add specific login context
                if (error && error.status === 404) {
                    $scope.showCreateProfile = true;
                    $scope.error = 'Computing ID not found. Would you like to create a profile?';
                }
            }
        });
    };
    
    // Navigate to profile creation
    $scope.createProfile = function() {
        // Pass the computing ID to profile creation
        $location.path('/profile/create').search('computing_id', $scope.loginData.computing_id);
    };
    
    // Clear error when user starts typing
    $scope.clearError = function() {
        $scope.error = null;
        $scope.showCreateProfile = false;
    };
    
    // Validate computing ID format
    $scope.validateComputingId = function() {
        var computingId = $scope.loginData.computing_id;
        
        if (!computingId) {
            return true; // Don't show error for empty field
        }
        
        // Check format: alphanumeric, 3-50 characters
        var pattern = /^[a-zA-Z0-9]{3,50}$/;
        return pattern.test(computingId);
    };
    
    // Get validation error message
    $scope.getValidationError = function() {
        var computingId = $scope.loginData.computing_id;
        
        if (!computingId) {
            return '';
        }
        
        if (computingId.length < 3) {
            return 'Computing ID must be at least 3 characters long';
        }
        
        if (computingId.length > 50) {
            return 'Computing ID must not exceed 50 characters';
        }
        
        if (!/^[a-zA-Z0-9]+$/.test(computingId)) {
            return 'Computing ID must contain only letters and numbers';
        }
        
        return '';
    };
    
    // Handle Enter key press
    $scope.handleKeyPress = function(event) {
        if (event.keyCode === 13 && !$scope.loading && $scope.loginForm.$valid) {
            $scope.login();
        }
    };
    
    // Check if already authenticated (shouldn't happen due to route resolve, but just in case)
    if (AuthService.isAuthenticated()) {
        $location.path('/home');
    }
}]);