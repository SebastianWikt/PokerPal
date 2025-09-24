angular.module('pokerPalApp')
.service('ComputerVisionService', ['$http', '$q', 'API_BASE_URL', function($http, $q, API_BASE_URL) {
    var self = this;
    
    // Analyze image for chip detection
    this.analyzeImage = function(imageFile) {
        var deferred = $q.defer();
        
        if (!imageFile) {
            deferred.reject({ message: 'No image file provided' });
            return deferred.promise;
        }
        
        var formData = new FormData();
        formData.append('image', imageFile);
        
        $http.post(API_BASE_URL + '/vision/analyze', formData, {
            headers: { 'Content-Type': undefined },
            transformRequest: angular.identity
        }).then(function(response) {
            deferred.resolve(response.data);
        }).catch(function(error) {
            console.error('Computer vision analysis error:', error);
            deferred.reject(error.data || { message: 'Failed to analyze image' });
        });
        
        return deferred.promise;
    };
    
    // Get current chip values
    this.getChipValues = function() {
        var deferred = $q.defer();
        
        $http.get(API_BASE_URL + '/vision/chip-values').then(function(response) {
            deferred.resolve(response.data);
        }).catch(function(error) {
            console.error('Get chip values error:', error);
            deferred.reject(error.data || { message: 'Failed to get chip values' });
        });
        
        return deferred.promise;
    };
    
    // Test computer vision service
    this.testService = function() {
        var deferred = $q.defer();
        
        $http.post(API_BASE_URL + '/vision/test').then(function(response) {
            deferred.resolve(response.data);
        }).catch(function(error) {
            console.error('Vision service test error:', error);
            deferred.reject(error.data || { message: 'Failed to test vision service' });
        });
        
        return deferred.promise;
    };
    
    // Check if computer vision is available
    this.isAvailable = function() {
        var deferred = $q.defer();
        
        this.testService().then(function(response) {
            deferred.resolve(response.service_status === 'operational');
        }).catch(function(error) {
            deferred.resolve(false);
        });
        
        return deferred.promise;
    };
    
    // Format confidence percentage
    this.formatConfidence = function(confidence) {
        if (typeof confidence !== 'number') {
            confidence = parseFloat(confidence) || 0;
        }
        return Math.round(confidence * 100) + '%';
    };
    
    // Get confidence level description
    this.getConfidenceLevel = function(confidence) {
        if (confidence >= 0.9) return 'High';
        if (confidence >= 0.7) return 'Medium';
        return 'Low';
    };
    
    // Get confidence color class
    this.getConfidenceColorClass = function(confidence) {
        if (confidence >= 0.9) return 'text-success';
        if (confidence >= 0.7) return 'text-warning';
        return 'text-danger';
    };
    
    // Check if detected values should be used automatically
    this.shouldUseDetectedValues = function(confidence) {
        return confidence >= 0.8;
    };
    
    // Check if manual verification is recommended
    this.isManualVerificationRecommended = function(confidence) {
        return confidence < 0.9;
    };
    
    // Format chip breakdown for display
    this.formatChipBreakdown = function(chipBreakdown) {
        if (!chipBreakdown || Object.keys(chipBreakdown).length === 0) {
            return 'No chips detected';
        }
        
        var breakdown = [];
        Object.keys(chipBreakdown).forEach(function(color) {
            var count = chipBreakdown[color];
            if (count > 0) {
                breakdown.push(count + ' ' + color);
            }
        });
        
        return breakdown.join(', ') || 'No chips detected';
    };
    
    // Get analysis status message
    this.getAnalysisStatusMessage = function(analysisResult) {
        if (!analysisResult) return '';
        
        var confidence = analysisResult.analysis.confidence;
        var totalValue = analysisResult.analysis.total_value;
        
        if (confidence >= 0.9) {
            return 'High confidence detection! Total value: $' + totalValue.toFixed(2);
        } else if (confidence >= 0.7) {
            return 'Medium confidence detection. Please verify: $' + totalValue.toFixed(2);
        } else {
            return 'Low confidence detection. Manual verification recommended: $' + totalValue.toFixed(2);
        }
    };
    
    // Validate image file for analysis
    this.validateImageFile = function(file) {
        var errors = [];
        
        if (!file) {
            errors.push('No image file selected');
            return errors;
        }
        
        // Check file type
        if (!file.type.startsWith('image/')) {
            errors.push('Only image files are supported');
        }
        
        // Check file size (10MB limit)
        var maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            errors.push('Image file must be smaller than 10MB');
        }
        
        // Check minimum file size (avoid empty files)
        if (file.size < 100) {
            errors.push('Image file appears to be empty or corrupted');
        }
        
        return errors;
    };
    
    // Create analysis summary
    this.createAnalysisSummary = function(analysisResult) {
        if (!analysisResult || !analysisResult.analysis) {
            return null;
        }
        
        var analysis = analysisResult.analysis;
        var suggestions = analysisResult.suggestions;
        
        return {
            detected_chips: analysis.detected_chips,
            total_value: analysis.total_value,
            confidence: analysis.confidence,
            confidence_level: this.getConfidenceLevel(analysis.confidence),
            confidence_percentage: this.formatConfidence(analysis.confidence),
            processing_time: analysis.processing_time_ms + 'ms',
            use_detected_values: suggestions.use_detected_values,
            manual_verification_recommended: suggestions.manual_verification_recommended,
            status_message: this.getAnalysisStatusMessage(analysisResult),
            chip_breakdown_display: this.formatChipBreakdown(analysis.detected_chips),
            timestamp: analysis.timestamp
        };
    };
    
    // Get analysis recommendations
    this.getAnalysisRecommendations = function(analysisResult) {
        if (!analysisResult || !analysisResult.suggestions) {
            return [];
        }
        
        var recommendations = [];
        var confidence = analysisResult.analysis.confidence;
        
        if (confidence >= 0.9) {
            recommendations.push('✅ High confidence - values can be used automatically');
        } else if (confidence >= 0.7) {
            recommendations.push('⚠️ Medium confidence - please verify the detected values');
            recommendations.push('💡 Consider retaking the photo with better lighting');
        } else {
            recommendations.push('❌ Low confidence - manual entry recommended');
            recommendations.push('📸 Try retaking the photo with better lighting and focus');
            recommendations.push('🔍 Ensure all chips are clearly visible in the frame');
        }
        
        if (analysisResult.suggestions.manual_verification_recommended) {
            recommendations.push('👀 Double-check the detected chip counts before proceeding');
        }
        
        return recommendations;
    };
    
    // Format processing time
    this.formatProcessingTime = function(timeMs) {
        if (timeMs < 1000) {
            return timeMs + 'ms';
        } else {
            return (timeMs / 1000).toFixed(1) + 's';
        }
    };
}]);