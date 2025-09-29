angular.module('pokerPalApp')
.controller('ProfileController', ['$scope', '$location', 'AuthService', 'PlayerService', function($scope, $location, AuthService, PlayerService) {
    
    console.log('ProfileController loading...');
    
    // Initialize controller
    $scope.isCreateMode = $location.path().includes('/create');
    $scope.isEditMode = $location.path().includes('/edit');
    $scope.loading = false;
    $scope.saving = false;
    $scope.error = null;
    $scope.success = null;
    
    // Form data
    $scope.playerData = {
        computing_id: '',
        first_name: '',
        last_name: '',
        years_of_experience: null,
        level: '',
        major: ''
    };
    
    // Available options - try to get from service, fallback to hardcoded
    try {
        $scope.experienceLevels = PlayerService.getExperienceLevels();
        $scope.commonMajors = PlayerService.getCommonMajors();
    } catch (error) {
        console.warn('PlayerService methods failed, using fallback data:', error);
        $scope.experienceLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
        $scope.commonMajors = [
            'Computer Science',
            'Information Technology', 
            'Software Engineering',
            'Computer Engineering',
            'Data Science',
            'Cybersecurity',
            'Business',
            'Mathematics',
            'Other'
        ];
    }
    
    // Initialize based on mode
    if ($scope.isCreateMode) {
        console.log('Profile create mode');
        // Pre-fill computing ID if passed from login
        var computingIdParam = $location.search().computing_id;
        if (computingIdParam) {
            $scope.playerData.computing_id = computingIdParam;
        }
    } else if ($scope.isEditMode) {
        console.log('Profile edit mode');
        // Load current user data for editing
        if (AuthService.isAuthenticated()) {
            var currentUser = AuthService.getCurrentUser();
            if (currentUser) {
                $scope.playerData = {
                    computing_id: currentUser.computing_id,
                    first_name: currentUser.first_name,
                    last_name: currentUser.last_name,
                    years_of_experience: currentUser.years_of_experience,
                    level: currentUser.level,
                    major: currentUser.major
                };
                // store original snapshot for change detection
                $scope.originalData = angular.copy($scope.playerData);
            }
        } else {
            $location.path('/');
            return;
        }
    }

    // Clear messages helper
    $scope.clearMessages = function() {
        $scope.error = null;
        $scope.success = null;
        $scope.validationErrors = [];
    };

    // Suggest experience level based on years (safe call)
    $scope.updateSuggestedLevel = function() {
        try {
            if ($scope.playerData.years_of_experience && !$scope.playerData.level && PlayerService && PlayerService.suggestExperienceLevel) {
                $scope.playerData.level = PlayerService.suggestExperienceLevel($scope.playerData.years_of_experience);
            }
        } catch (err) {
            // ignore
        }
    };

    // Handle Enter key to submit if form valid and has changes
    $scope.handleKeyPress = function(event) {
        if (event && event.keyCode === 13 && !$scope.saving && $scope.profileForm.$valid && $scope.hasChanges()) {
            $scope.saveProfile();
        }
    };

    // Check if form has changes (edit mode)
    $scope.hasChanges = function() {
        if ($scope.isCreateMode) return true;
        if (!$scope.originalData) return false;

        function normalize(v) {
            if (v === null || v === undefined) return '';
            if (typeof v === 'number') return String(v);
            return String(v).trim();
        }

        return (
            normalize($scope.playerData.first_name) !== normalize($scope.originalData.first_name) ||
            normalize($scope.playerData.last_name) !== normalize($scope.originalData.last_name) ||
            normalize($scope.playerData.years_of_experience) !== normalize($scope.originalData.years_of_experience) ||
            normalize($scope.playerData.level) !== normalize($scope.originalData.level) ||
            normalize($scope.playerData.major) !== normalize($scope.originalData.major)
        );
    };
    
    // Save profile function
    $scope.saveProfile = function() {
        console.log('Save profile clicked', $scope.playerData);
        $scope.saving = true;
        $scope.error = null;
        $scope.success = null;
        
        var savePromise;
        
        if ($scope.isCreateMode) {
            // Create new player
            savePromise = PlayerService.createPlayer($scope.playerData);
        } else {
            // Update existing player
            savePromise = PlayerService.updatePlayer($scope.playerData.computing_id, $scope.playerData);
        }
        
        savePromise.then(function(response) {
            console.log('Profile saved successfully:', response);
            $scope.saving = false;
            $scope.success = 'Profile saved successfully!';
            
            // If this was a create, redirect to login or home
            if ($scope.isCreateMode) {
                setTimeout(function() {
                    $location.path('/');
                    $scope.$apply();
                }, 2000);
            } else {
                // Update AuthService with new user data if available
                if (response.player) {
                    AuthService.updateCurrentUser(response.player);
                    // update snapshot so hasChanges returns false
                    $scope.originalData = angular.copy($scope.playerData);
                } else if (response.user) {
                    // fallback for endpoints returning `user`
                    AuthService.updateCurrentUser(response.user);
                    $scope.originalData = angular.copy($scope.playerData);
                }
            }
        }).catch(function(error) {
            console.error('Profile save failed:', error);
            $scope.saving = false;
            $scope.error = error.message || 'Failed to save profile. Please try again.';
        });
    };
    
    // Cancel function
    $scope.cancel = function() {
        if (AuthService.isAuthenticated()) {
            $location.path('/home');
        } else {
            $location.path('/');
        }
    };
    
    console.log('ProfileController loaded successfully');
}]);