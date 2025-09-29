angular.module('pokerPalApp')
.controller('ProfileController', ['$scope', '$location', '$routeParams', '$timeout', 'AuthService', 'PlayerService', function($scope, $location, $routeParams, $timeout, AuthService, PlayerService) {
    
    // Initialize controller
    $scope.isCreateMode = $location.path().includes('/create');
    $scope.isEditMode = $location.path().includes('/edit');
    $scope.loading = false;
    $scope.saving = false;
    $scope.error = null;
    $scope.success = null;
    
    // Player statistics
    $scope.stats = {
        total_winnings: 0,
        sessions: 0,
        rank: '-'
    };
    
    // Form data
    $scope.playerData = {
        computing_id: '',
        first_name: '',
        last_name: '',
        years_of_experience: null,
        level: '',
        major: ''
    };
    
    // Form validation
    $scope.profileForm = {};
    $scope.validationErrors = [];
    
    // Available options
    $scope.experienceLevels = PlayerService.getExperienceLevels();
    $scope.commonMajors = PlayerService.getCommonMajors();
    
    // Initialize based on mode
    if ($scope.isCreateMode) {
        // Pre-fill computing ID if passed from login
        var computingIdParam = $location.search().computing_id;
        if (computingIdParam) {
            $scope.playerData.computing_id = computingIdParam;
        }
    } else if ($scope.isEditMode) {
        // Load current user data for editing
        if (AuthService.isAuthenticated()) {
            var currentUser = AuthService.getCurrentUser();
            $scope.playerData = {
                computing_id: currentUser.computing_id,
                first_name: currentUser.first_name,
                last_name: currentUser.last_name,
                years_of_experience: currentUser.years_of_experience,
                level: currentUser.level,
                major: currentUser.major
            };
            // Keep an original copy to detect changes reliably
            $scope.originalData = angular.copy($scope.playerData);
            
            // Load stats from current user data
            $scope.stats.total_winnings = currentUser.total_winnings || 0;
            
            // Load additional stats
            loadPlayerStats();
        } else {
            $location.path('/');
        }
    }
    
    // Load player statistics
    function loadPlayerStats() {
        if (!$scope.isEditMode) return;
        
        var currentUser = AuthService.getCurrentUser();
        if (!currentUser) return;
        
        // Get player entries to count sessions
        PlayerService.getPlayerEntries(currentUser.computing_id).then(function(response) {
            $timeout(function() {
                $scope.stats.sessions = response.entries ? response.entries.length : 0;
                $scope.stats.total_winnings = response.player ? response.player.total_winnings : 0;
            });
        }).catch(function(error) {
            console.log('Could not load player stats:', error);
        });
        
        // Get leaderboard to find rank
        PlayerService.getLeaderboard().then(function(response) {
            $timeout(function() {
                var leaderboard = response.leaderboard || [];
                for (var i = 0; i < leaderboard.length; i++) {
                    if (leaderboard[i].computing_id === currentUser.computing_id) {
                        $scope.stats.rank = i + 1;
                        break;
                    }
                }
            });
        }).catch(function(error) {
            console.log('Could not load leaderboard:', error);
        });
    }
    
    // Format currency (same as home controller)
    $scope.formatCurrency = function(amount) {
        if (typeof amount !== 'number') {
            amount = parseFloat(amount) || 0;
        }
        return '$' + amount.toFixed(2);
    };
    
    // Get winnings color class (same as home controller)
    $scope.getWinningsColorClass = function() {
        var winnings = parseFloat($scope.stats.total_winnings) || 0;
        if (winnings > 0) {
            return 'text-success';
        } else if (winnings < 0) {
            return 'text-danger';
        }
        return 'text-muted';
    };
    
    // Save profile (create or update)
    $scope.saveProfile = function() {
        if ($scope.profileForm.$invalid) {
            $scope.error = 'Please correct the errors below';
            return;
        }
        
        // Client-side validation
        $scope.validationErrors = PlayerService.validatePlayerData($scope.playerData);
        if ($scope.validationErrors.length > 0) {
            $scope.error = 'Please correct the validation errors';
            return;
        }
        
        $scope.saving = true;
        $scope.error = null;
        $scope.success = null;
        
        // Prepare data (remove empty strings and convert numbers)
        var dataToSave = angular.copy($scope.playerData);
        
        // Convert years of experience to number
        if (dataToSave.years_of_experience) {
            dataToSave.years_of_experience = parseInt(dataToSave.years_of_experience);
        }
        
        // Remove empty optional fields
        Object.keys(dataToSave).forEach(function(key) {
            if (dataToSave[key] === '' || dataToSave[key] === null) {
                delete dataToSave[key];
            }
        });
        
        var savePromise;
        
        if ($scope.isCreateMode) {
            savePromise = PlayerService.createPlayer(dataToSave);
        } else {
            // For updates, remove computing_id from the data
            var updateData = angular.copy(dataToSave);
            delete updateData.computing_id;
            savePromise = PlayerService.updatePlayer($scope.playerData.computing_id, updateData);
        }
        
        savePromise.then(function(response) {
            console.log('Profile saved successfully:', response);
            $scope.saving = false;
            
            if ($scope.isCreateMode) {
                $scope.success = 'Profile created successfully! You can now log in.';
                
                // Redirect to login after a delay
                setTimeout(function() {
                    $location.path('/').search('computing_id', $scope.playerData.computing_id);
                    $scope.$apply();
                }, 2000);
            } else {
                $scope.success = 'Profile updated successfully!';
                
                // Refresh user data in AuthService
                // If server returned the updated player in the response, use it to update AuthService
                if (response.player) {
                    AuthService.updateCurrentUser(response.player);
                    var updatedUser = AuthService.getCurrentUser();
                    $scope.playerData = {
                        computing_id: updatedUser.computing_id,
                        first_name: updatedUser.first_name,
                        last_name: updatedUser.last_name,
                        years_of_experience: updatedUser.years_of_experience,
                        level: updatedUser.level,
                        major: updatedUser.major
                    };
                    // Update original snapshot so hasChanges is reset
                    $scope.originalData = angular.copy($scope.playerData);
                } else {
                    // Fallback: refresh from server
                    AuthService.refreshUser().then(function() {
                        var updatedUser = AuthService.getCurrentUser();
                        $scope.playerData = {
                            computing_id: updatedUser.computing_id,
                            first_name: updatedUser.first_name,
                            last_name: updatedUser.last_name,
                            years_of_experience: updatedUser.years_of_experience,
                            level: updatedUser.level,
                            major: updatedUser.major
                        };
                        $scope.originalData = angular.copy($scope.playerData);
                    });
                }
            }
            
        }).catch(function(error) {
            console.error('Save profile error:', error);
            $scope.saving = false;
            
            if (error && error.message) {
                $scope.error = error.message;
            } else {
                $scope.error = 'Failed to save profile. Please try again.';
            }
        });
    };
    
    // Cancel and go back
    $scope.cancel = function() {
        if ($scope.isCreateMode) {
            $location.path('/');
        } else {
            $location.path('/home');
        }
    };
    
    // Clear messages when user starts typing
    $scope.clearMessages = function() {
        $scope.error = null;
        $scope.success = null;
        $scope.validationErrors = [];
    };
    
    // Auto-suggest experience level based on years
    $scope.updateSuggestedLevel = function() {
        if ($scope.playerData.years_of_experience && !$scope.playerData.level) {
            $scope.playerData.level = PlayerService.suggestExperienceLevel($scope.playerData.years_of_experience);
        }
    };
    
    // Validate computing ID format
    $scope.validateComputingId = function() {
        var computingId = $scope.playerData.computing_id;
        if (!computingId) return true;
        
        var pattern = /^[a-zA-Z0-9]{3,50}$/;
        return pattern.test(computingId);
    };
    
    // Get computing ID validation error
    $scope.getComputingIdError = function() {
        var computingId = $scope.playerData.computing_id;
        if (!computingId) return '';
        
        if (computingId.length < 3) {
            return 'Computing ID must be at least 3 characters';
        }
        if (computingId.length > 50) {
            return 'Computing ID must not exceed 50 characters';
        }
        if (!/^[a-zA-Z0-9]+$/.test(computingId)) {
            return 'Computing ID must contain only letters and numbers';
        }
        return '';
    };
    
    // Check if form has changes (for edit mode)
    $scope.hasChanges = function() {
        if ($scope.isCreateMode) return true;
        // If we have an originalData snapshot, compare against that for stability
        if (!$scope.originalData) {
            var currentUser = AuthService.getCurrentUser();
            if (!currentUser) return false;
            $scope.originalData = {
                computing_id: currentUser.computing_id,
                first_name: currentUser.first_name,
                last_name: currentUser.last_name,
                years_of_experience: currentUser.years_of_experience,
                level: currentUser.level,
                major: currentUser.major
            };
        }

        function normalize(v) {
            if (v === null || v === undefined) return '';
            // normalize numbers to string for comparison
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
    
    // Handle Enter key press
    $scope.handleKeyPress = function(event) {
        if (event.keyCode === 13 && !$scope.saving && $scope.profileForm.$valid) {
            $scope.saveProfile();
        }
    };
    
    // Get page title
    $scope.getPageTitle = function() {
        return $scope.isCreateMode ? 'Create Profile' : 'Edit Profile';
    };
    
    // Get save button text
    $scope.getSaveButtonText = function() {
        if ($scope.saving) {
            return $scope.isCreateMode ? 'Creating...' : 'Updating...';
        }
        return $scope.isCreateMode ? 'Create Profile' : 'Update Profile';
    };
}]);