angular.module('pokerPalApp')
.controller('SessionController', ['$scope', '$location', '$timeout', 'AuthService', 'SessionService', 'ComputerVisionService', function($scope, $location, $timeout, AuthService, SessionService, ComputerVisionService) {
    
    // Initialize controller
    $scope.currentUser = AuthService.getCurrentUser();
    // Prevent async checks from stomping recent manual session type changes
    var manualOverrideUntil = 0; // timestamp (ms) until which manual choice is respected
    var __debug = true; // set to true to enable extra console logging for debugging
    $scope.loading = false;
    $scope.saving = false;
    $scope.error = null;
    $scope.success = null;
    
    // Session state
    $scope.sessionType = 'check-in'; // 'check-in' or 'check-out'
    $scope.activeSession = null;
    $scope.hasActiveSession = false;
    
        
        // DOM listeners will be attached after the view has rendered
    // Simple date helper - get today's date as YYYY-MM-DD
    function getTodayDateString() {
        var today = new Date();
        var year = today.getFullYear();
        var month = today.getMonth() + 1;
        var day = today.getDate();
        
        var monthStr = month < 10 ? '0' + month : '' + month;
        var dayStr = day < 10 ? '0' + day : '' + day;
        
        return year + '-' + monthStr + '-' + dayStr;
    }
    // (no automatic sessionType flips here)
    // Form data with simple date default
    $scope.sessionData = {
        session_date: new Date(),
        start_chips: null,
        start_chip_breakdown: {},
        end_chips: null,
        end_chip_breakdown: {}
    };
    


    // Drag state for photo upload
    $scope.isDragOver = false;
    // Photo handling
    $scope.photoFile = null;
    $scope.photoPreview = null;
    $scope.photoError = null;
        // Attach DOM listeners for photo area and hidden file input so events call controller methods reliably
        function attachDomListeners() {
            try {
                var photoArea = document.querySelector('.photo-upload-area');
                var fileInput = document.getElementById('photoInput');

                if (__debug) console.debug('[session] attachDomListeners: found photoArea=', !!photoArea, 'fileInput=', !!fileInput);
                if (photoArea) {
                    photoArea.addEventListener('click', function(e) {
                        // Use scope method
                        if (__debug) console.debug('[session] photoArea click');
                        $scope.triggerFileInput();
                        // no $apply needed here since click originates from DOM
                    });

                    photoArea.addEventListener('dragover', function(e) {
                        e.preventDefault();
                        if (__debug) console.debug('[session] photoArea dragover');
                        $scope.onDragOver(e);
                    });

                    photoArea.addEventListener('dragleave', function(e) {
                        e.preventDefault();
                        $scope.onDragLeave(e);
                    });

                    photoArea.addEventListener('drop', function(e) {
                        e.preventDefault();
                        if (__debug) console.debug('[session] photoArea drop');
                        $scope.onDrop(e);
                    });
                }

                if (fileInput) {
                    fileInput.addEventListener('change', function(e) {
                        if (__debug) console.debug('[session] fileInput change, files=', e.target.files && e.target.files.length);
                        $scope.handleFileSelect(e);
                    });
                }
            } catch (err) {
                // ignore DOM attach errors
                console.error('Failed to attach DOM listeners for photo upload', err);
            }
        }
    
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
        // Attach DOM listeners after view render (retry a couple times if view not ready)
        (function tryAttach(attempts) {
            $timeout(function() {
                attachDomListeners();
                // If elements not found, attachDomListeners will silently fail; retry once
                if (attempts > 0) tryAttach(attempts - 1);
            }, 50);
        })(3);
    }
    
    // Check for active session
    function checkActiveSession() {
        $scope.loading = true;

        var dateToCheck = $scope.sessionData.session_date;
        SessionService.getActiveSession($scope.currentUser.computing_id, dateToCheck)
            .then(function(session) {
                if (session) {
                    $scope.activeSession = session;
                    $scope.hasActiveSession = true;
                    // Only change the visible session type if the user hasn't manually overridden recently
                    if (Date.now() >= manualOverrideUntil) {
                        $scope.sessionType = 'check-out';
                    }

                    // Pre-fill data from active session
                    $scope.sessionData.start_chips = session.start_chips;
                    $scope.sessionData.start_chip_breakdown = session.start_chip_breakdown || {};
                } else {
                    // No active session - reset related state
                    $scope.activeSession = null;
                    $scope.hasActiveSession = false;
                    if (Date.now() >= manualOverrideUntil) {
                        $scope.sessionType = 'check-in';
                    }
                }

                $scope.loading = false;
            })
            .catch(function(error) {
                // Unexpected error while checking; mark not loading and surface a message
                console.error('Error while checking active session:', error);
                $scope.activeSession = null;
                $scope.hasActiveSession = false;
                if (Date.now() >= manualOverrideUntil) {
                    $scope.sessionType = 'check-in';
                }
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
            // Clear any currently selected photo/preview so files are not accidentally reused
            if ($scope.clearPhoto) {
                $scope.clearPhoto();
            }
            // prevent background checks from overriding this manual change for a short window
            // give the user a longer window (5s) to avoid immediate UI flicker
            manualOverrideUntil = Date.now() + 5000;
            if (__debug) console.debug('[session] manual switch to', type, 'manualOverrideUntil=', manualOverrideUntil);
            
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
        // Use $applyAsync to schedule digest safely when called from native DOM handlers
        $scope.$applyAsync(function() {
            if (__debug) console.debug('[session] handleFileSelect files=', files && files.length);
            $scope.onPhotoSelected(files);
        });
    };

    // Trigger hidden file input
    $scope.triggerFileInput = function() {
        var fileInput = document.getElementById('photoInput');
        if (fileInput) {
            try {
                if (__debug) console.debug('[session] triggerFileInput -> clicking file input');
                fileInput.click();
            } catch (e) {
                // fallback: focus and send keyboard event (very rare)
                if (__debug) console.debug('[session] triggerFileInput fallback focus');
                fileInput.focus();
            }
        }
    };

    // Drag & drop handlers
    $scope.onDragOver = function(event) {
        event.preventDefault();
        event.stopPropagation();
        $scope.isDragOver = true;
        $scope.$applyAsync();
    };

    $scope.onDragLeave = function(event) {
        event.preventDefault();
        event.stopPropagation();
        $scope.isDragOver = false;
        $scope.$applyAsync();
    };

    $scope.onDrop = function(event) {
        event.preventDefault();
        event.stopPropagation();
        $scope.isDragOver = false;
        var dt = event.dataTransfer || event.originalEvent && event.originalEvent.dataTransfer;
        if (dt && dt.files && dt.files.length > 0) {
            $scope.$applyAsync(function() {
                if (__debug) console.debug('[session] onDrop files=', dt.files.length);
                $scope.onPhotoSelected(dt.files);
            });
        }
        $scope.$applyAsync();
    };
    
    // Handle photo selection
    $scope.onPhotoSelected = function(files) {
        if (!files || files.length === 0) {
            $scope.clearPhoto();
            return;
        }
        
        var file = files[0];
        $scope.photoError = null;
        if (__debug) console.debug('[session] onPhotoSelected file=', file && file.name, 'size=', file && file.size);
        
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
        
        // Prepare session data - ensure date is in YYYY-MM-DD format
        var dateValue = $scope.sessionData.session_date;
        var formattedDate;
        
        if (dateValue instanceof Date) {
            // Convert Date object to YYYY-MM-DD string
            var year = dateValue.getFullYear();
            var month = dateValue.getMonth() + 1;
            var day = dateValue.getDate();
            var monthStr = month < 10 ? '0' + month : '' + month;
            var dayStr = day < 10 ? '0' + day : '' + day;
            formattedDate = year + '-' + monthStr + '-' + dayStr;
        } else {
            // Already a string, use as-is
            formattedDate = dateValue;
        }
        
        var sessionData = {
            session_date: formattedDate,
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
                    
                    // Ensure date stays as Date object for HTML5 date input
                    $scope.sessionData.session_date = new Date();
                    
                } else {
                    $scope.success = 'Check-out successful! Net winnings: ' + SessionService.formatCurrency(response.session.net_winnings);
                    
                    // Reset form
                    $scope.resetForm();
                    
                    // Ensure date is Date object after reset
                    $scope.sessionData.session_date = new Date();
                    
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
            session_date: new Date(),
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