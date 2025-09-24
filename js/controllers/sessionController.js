angular.module('pokerPalApp')
.controller('SessionController', ['$scope', '$location', 'AuthService', 'SessionService', 'ComputerVisionService', function($scope, $location, AuthService, SessionService, ComputerVisionService) {
    
    // Initialize controller
    $scope.currentUser = AuthService.getCurrentUser();
    $scope.loading = false;
    $scope.saving = false;
    $scope.error = null;
    $scope.success = null;
    
    // Session state
    $scope.sessionType = 'check-in'; // 'check-in' or 'check-out'
    $scope.activeSession = null;
    $scope.hasActiveSession = false;
    
    // Form data
    $scope.sessionData = {
        session_date: SessionService.getTodayDate(),
        start_chips: null,
        start_chip_breakdown: {},
        end_chips: null,
        end_chip_breakdown: {}
    };
    
    // Photo handling
    $scope.photoFile = null;
    $scope.photoPreview = null;
    $scope.photoError = null;
    
    // Computer vision
    $scope.cvAnalyzing = false;
    $scope.cvResult = null;
    $scope.cvError = null;
    $scope.cvAvailable = false;
    $scope.showCvResults = false;
    
    // Chip values and colors
    $scope.chipColors = SessionService.getChipColors();
    $scope.chipValues = SessionService.getDefaultChipValues();
    
    // Form validation
    $scope.sessionForm = {};
    $scope.validationErrors = [];
    
    // Initialize page
    function initialize() {
        if (!$scope.currentUser) {
            $location.path('/');
            return;
        }
        
        // Check for active session for today
        checkActiveSession();
    }
    
    // Check for active session
    function checkActiveSession() {
        $scope.loading = true;
        
        SessionService.getActiveSession($scope.currentUser.computing_id, $scope.sessionData.session_date)
            .then(function(session) {
                $scope.activeSession = session;
                $scope.hasActiveSession = true;
                $scope.sessionType = 'check-out';
                
                // Pre-fill data from active session
                $scope.sessionData.start_chips = session.start_chips;
                $scope.sessionData.start_chip_breakdown = session.start_chip_breakdown || {};
                
                $scope.loading = false;
            })
            .catch(function(error) {
                // No active session found - this is normal
                $scope.activeSession = null;
                $scope.hasActiveSession = false;
                $scope.sessionType = 'check-in';
                $scope.loading = false;
            });
    }
    
    // Switch session type
    $scope.switchSessionType = function(type) {
        if (type === 'check-out' && !$scope.hasActiveSession) {
            $scope.error = 'No active session found for today. Please check in first.';
            return;
        }
        
        // Only switch if it's a different type
        if ($scope.sessionType !== type) {
            $scope.sessionType = type;
            $scope.clearMessages();
            
            if (type === 'check-in') {
                // Reset form for check-in only if switching from check-out
                $scope.sessionData.start_chips = null;
                $scope.sessionData.start_chip_breakdown = {};
                $scope.sessionData.end_chips = null;
                $scope.sessionData.end_chip_breakdown = {};
            } else if (type === 'check-out') {
                // Clear end data when switching to check-out
                $scope.sessionData.end_chips = null;
                $scope.sessionData.end_chip_breakdown = {};
            }
        }
    };
    
    // Handle file selection from input
    $scope.handleFileSelect = function(event) {
        var files = event.target.files;
        $scope.onPhotoSelected(files);
    };
    
    // Handle photo selection
    $scope.onPhotoSelected = function(files) {
        if (!files || files.length === 0) {
            $scope.clearPhoto();
            return;
        }
        
        var file = files[0];
        $scope.photoError = null;
        
        // Validate photo
        var photoErrors = SessionService.validatePhotoFile(file);
        if (photoErrors.length > 0) {
            $scope.photoError = photoErrors.join(', ');
            $scope.clearPhoto();
            $scope.$apply();
            return;
        }
        
        // Set photo and create preview
        $scope.photoFile = file;
        $scope.photoPreview = SessionService.createImagePreview(file);
        $scope.$apply();
    };
    
    // Clear photo
    $scope.clearPhoto = function() {
        if ($scope.photoPreview) {
            SessionService.cleanupImagePreview($scope.photoPreview);
        }
        $scope.photoFile = null;
        $scope.photoPreview = null;
        $scope.photoError = null;
        
        // Clear file input
        var fileInput = document.getElementById('photoInput');
        if (fileInput) {
            fileInput.value = '';
        }
    };
    
    // Update chip breakdown when individual counts change
    $scope.updateChipBreakdown = function(color, count, isStart) {
        var breakdown = isStart ? $scope.sessionData.start_chip_breakdown : $scope.sessionData.end_chip_breakdown;
        
        if (count && count > 0) {
            breakdown[color] = parseInt(count);
        } else {
            delete breakdown[color];
        }
        
        // Calculate total chips
        if (isStart) {
            $scope.sessionData.start_chips = SessionService.calculateChipTotal(breakdown, $scope.chipValues);
        } else {
            $scope.sessionData.end_chips = SessionService.calculateChipTotal(breakdown, $scope.chipValues);
        }
    };
    
    // Submit session
    $scope.submitSession = function() {
        if ($scope.sessionForm.$invalid) {
            $scope.error = 'Please correct the errors below';
            return;
        }
        
        // Client-side validation
        $scope.validationErrors = SessionService.validateSessionData($scope.sessionData, $scope.sessionType);
        if ($scope.validationErrors.length > 0) {
            $scope.error = 'Please correct the validation errors';
            return;
        }
        
        $scope.saving = true;
        $scope.error = null;
        $scope.success = null;
        
        // Prepare session data
        var sessionData = {
            session_date: $scope.sessionData.session_date,
            session_type: $scope.sessionType
        };
        
        if ($scope.sessionType === 'check-in') {
            if ($scope.sessionData.start_chips) {
                sessionData.start_chips = parseFloat($scope.sessionData.start_chips);
            }
            if (Object.keys($scope.sessionData.start_chip_breakdown).length > 0) {
                sessionData.start_chip_breakdown = $scope.sessionData.start_chip_breakdown;
            }
        } else {
            if ($scope.sessionData.end_chips) {
                sessionData.end_chips = parseFloat($scope.sessionData.end_chips);
            }
            if (Object.keys($scope.sessionData.end_chip_breakdown).length > 0) {
                sessionData.end_chip_breakdown = $scope.sessionData.end_chip_breakdown;
            }
        }
        
        // Submit session
        SessionService.createSession(sessionData, $scope.photoFile)
            .then(function(response) {
                console.log('Session submitted successfully:', response);
                $scope.saving = false;
                
                if ($scope.sessionType === 'check-in') {
                    $scope.success = 'Check-in successful! You can now check out when you\'re done playing.';
                    
                    // Switch to check-out mode
                    $scope.activeSession = response.session;
                    $scope.hasActiveSession = true;
                    $scope.sessionType = 'check-out';
                    
                    // Pre-fill start data
                    $scope.sessionData.start_chips = response.session.start_chips;
                    $scope.sessionData.start_chip_breakdown = response.session.start_chip_breakdown || {};
                    
                } else {
                    $scope.success = 'Check-out successful! Net winnings: ' + SessionService.formatCurrency(response.session.net_winnings);
                    
                    // Reset form
                    $scope.resetForm();
                    
                    // Refresh user data to update total winnings
                    AuthService.refreshUser();
                }
                
                // Clear photo
                $scope.clearPhoto();
                
            })
            .catch(function(error) {
                console.error('Submit session error:', error);
                $scope.saving = false;
                
                if (error && error.message) {
                    $scope.error = error.message;
                } else {
                    $scope.error = 'Failed to submit session. Please try again.';
                }
            });
    };
    
    // Reset form
    $scope.resetForm = function() {
        $scope.sessionData = {
            session_date: SessionService.getTodayDate(),
            start_chips: null,
            start_chip_breakdown: {},
            end_chips: null,
            end_chip_breakdown: {}
        };
        $scope.activeSession = null;
        $scope.hasActiveSession = false;
        $scope.sessionType = 'check-in';
        $scope.clearPhoto();
        $scope.clearMessages();
    };
    
    // Clear messages
    $scope.clearMessages = function() {
        $scope.error = null;
        $scope.success = null;
        $scope.validationErrors = [];
        $scope.photoError = null;
    };
    
    // Date change handler
    $scope.onDateChange = function() {
        $scope.clearMessages();
        
        // Check for active session on new date
        if ($scope.sessionData.session_date) {
            checkActiveSession();
        }
    };
    
    // Get chip breakdown display
    $scope.getChipBreakdownDisplay = function(breakdown) {
        if (!breakdown || Object.keys(breakdown).length === 0) {
            return 'No chips specified';
        }
        
        var display = [];
        Object.keys(breakdown).forEach(function(color) {
            var count = breakdown[color];
            if (count > 0) {
                display.push(count + ' ' + color);
            }
        });
        
        return display.join(', ') || 'No chips specified';
    };
    
    // Format currency
    $scope.formatCurrency = SessionService.formatCurrency;
    
    // Get winnings color class
    $scope.getWinningsColorClass = SessionService.getWinningsColorClass;
    
    // Format date
    $scope.formatDate = SessionService.formatDate;
    
    // Get session type display
    $scope.getSessionTypeDisplay = function() {
        return $scope.sessionType === 'check-in' ? 'Check In' : 'Check Out';
    };
    
    // Get today's date for max date validation
    $scope.getTodayDate = function() {
        return SessionService.getTodayDate();
    };
    
    // Check if form is valid for submission
    $scope.canSubmit = function() {
        if ($scope.saving || $scope.sessionForm.$invalid) {
            return false;
        }
        
        if ($scope.sessionType === 'check-in') {
            return $scope.sessionData.session_date && 
                   ($scope.sessionData.start_chips > 0 || Object.keys($scope.sessionData.start_chip_breakdown).length > 0);
        } else {
            return $scope.sessionData.session_date && $scope.hasActiveSession &&
                   ($scope.sessionData.end_chips > 0 || Object.keys($scope.sessionData.end_chip_breakdown).length > 0);
        }
    };
    
    // Computer vision methods
    
    // Check if computer vision is available
    function checkComputerVisionAvailability() {
        ComputerVisionService.isAvailable().then(function(available) {
            $scope.cvAvailable = available;
        }).catch(function(error) {
            $scope.cvAvailable = false;
        });
    }
    
    // Analyze photo with computer vision
    $scope.analyzePhoto = function() {
        if (!$scope.photoFile) {
            $scope.cvError = 'Please select a photo first';
            return;
        }
        
        // Validate image file
        var validationErrors = ComputerVisionService.validateImageFile($scope.photoFile);
        if (validationErrors.length > 0) {
            $scope.cvError = validationErrors.join(', ');
            return;
        }
        
        $scope.cvAnalyzing = true;
        $scope.cvError = null;
        $scope.cvResult = null;
        $scope.showCvResults = false;
        
        ComputerVisionService.analyzeImage($scope.photoFile).then(function(result) {
            console.log('Computer vision analysis result:', result);
            
            $scope.cvResult = ComputerVisionService.createAnalysisSummary(result);
            $scope.showCvResults = true;
            $scope.cvAnalyzing = false;
            
            // Auto-populate chip breakdown if confidence is high
            if (result.suggestions.use_detected_values) {
                $scope.applyDetectedValues();
            }
            
        }).catch(function(error) {
            console.error('Computer vision analysis error:', error);
            $scope.cvError = error.message || 'Failed to analyze image';
            $scope.cvAnalyzing = false;
        });
    };
    
    // Apply detected chip values to form
    $scope.applyDetectedValues = function() {
        if (!$scope.cvResult || !$scope.cvResult.detected_chips) {
            return;
        }
        
        var detectedChips = $scope.cvResult.detected_chips;
        var isStart = $scope.sessionType === 'check-in';
        
        // Clear existing breakdown
        if (isStart) {
            $scope.sessionData.start_chip_breakdown = {};
        } else {
            $scope.sessionData.end_chip_breakdown = {};
        }
        
        // Apply detected values
        Object.keys(detectedChips).forEach(function(color) {
            var count = detectedChips[color];
            if (count > 0) {
                if (isStart) {
                    $scope.sessionData.start_chip_breakdown[color] = count;
                } else {
                    $scope.sessionData.end_chip_breakdown[color] = count;
                }
            }
        });
        
        // Update total chips
        if (isStart) {
            $scope.sessionData.start_chips = $scope.cvResult.total_value;
        } else {
            $scope.sessionData.end_chips = $scope.cvResult.total_value;
        }
        
        $scope.success = 'Chip values applied from computer vision analysis!';
        
        // Clear success message after a few seconds
        setTimeout(function() {
            $scope.success = null;
            $scope.$apply();
        }, 3000);
    };
    
    // Clear computer vision results
    $scope.clearCvResults = function() {
        $scope.cvResult = null;
        $scope.cvError = null;
        $scope.showCvResults = false;
        $scope.cvAnalyzing = false;
    };
    
    // Get computer vision recommendations
    $scope.getCvRecommendations = function() {
        if (!$scope.cvResult) return [];
        
        // Create a mock analysis result for recommendations
        var mockResult = {
            analysis: {
                confidence: $scope.cvResult.confidence
            },
            suggestions: {
                manual_verification_recommended: $scope.cvResult.manual_verification_recommended
            }
        };
        
        return ComputerVisionService.getAnalysisRecommendations(mockResult);
    };
    
    // Format confidence for display
    $scope.formatConfidence = ComputerVisionService.formatConfidence;
    
    // Get confidence color class
    $scope.getConfidenceColorClass = ComputerVisionService.getConfidenceColorClass;
    
    // Debug method
    $scope.debugSession = function() {
        console.log('=== SESSION DEBUG ===');
        console.log('Session Type:', $scope.sessionType);
        console.log('Has Active Session:', $scope.hasActiveSession);
        console.log('Active Session:', $scope.activeSession);
        console.log('Session Data:', $scope.sessionData);
        console.log('Photo File:', $scope.photoFile);
        console.log('Photo Preview:', $scope.photoPreview);
        console.log('Current User:', $scope.currentUser);
        console.log('===================');
    };
    
    // Initialize the controller
    initialize();
    checkComputerVisionAvailability();
}]);