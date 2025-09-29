angular.module('pokerPalApp')
.service('ErrorService', ['$rootScope', function($rootScope) {
    
    var self = this;
    
    // Error types
    self.ERROR_TYPES = {
        NETWORK: 'network',
        VALIDATION: 'validation',
        AUTHENTICATION: 'authentication',
        AUTHORIZATION: 'authorization',
        SERVER: 'server',
        UNKNOWN: 'unknown'
    };
    
    // Current errors
    self.errors = [];
    
    // Add error
    self.addError = function(error, type, context) {
        var errorObj = {
            id: Date.now() + Math.random(),
            message: error.message || error,
            type: type || self.ERROR_TYPES.UNKNOWN,
            context: context || '',
            timestamp: new Date(),
            dismissed: false
        };
        
        self.errors.push(errorObj);
        
        // Broadcast error event
        $rootScope.$broadcast('error:added', errorObj);
        
        // Auto-dismiss after 10 seconds for non-critical errors
        if (type !== self.ERROR_TYPES.AUTHENTICATION && type !== self.ERROR_TYPES.AUTHORIZATION) {
            setTimeout(function() {
                self.dismissError(errorObj.id);
            }, 10000);
        }
        
        return errorObj.id;
    };
    
    // Dismiss error
    self.dismissError = function(errorId) {
        var error = self.errors.find(function(e) { return e.id === errorId; });
        if (error) {
            error.dismissed = true;
            $rootScope.$broadcast('error:dismissed', errorId);
        }
    };
    
    // Clear all errors
    self.clearErrors = function() {
        self.errors = [];
        $rootScope.$broadcast('errors:cleared');
    };
    
    // Get active errors
    self.getActiveErrors = function() {
        return self.errors.filter(function(error) {
            return !error.dismissed;
        });
    };
    
    // Handle HTTP errors
    self.handleHttpError = function(response, context) {
        var errorType = self.ERROR_TYPES.UNKNOWN;
        var message = 'An unexpected error occurred';
        
        if (!response) {
            errorType = self.ERROR_TYPES.NETWORK;
            message = 'Network connection failed. Please check your internet connection.';
        } else {
            switch (response.status) {
                case 400:
                    errorType = self.ERROR_TYPES.VALIDATION;
                    message = response.data && response.data.message ? 
                        response.data.message : 'Invalid request data';
                    break;
                case 401:
                    errorType = self.ERROR_TYPES.AUTHENTICATION;
                    message = 'Authentication required. Please log in again.';
                    break;
                case 403:
                    errorType = self.ERROR_TYPES.AUTHORIZATION;
                    message = 'You do not have permission to perform this action.';
                    break;
                case 404:
                    errorType = self.ERROR_TYPES.VALIDATION;
                    message = 'The requested resource was not found.';
                    break;
                case 409:
                    errorType = self.ERROR_TYPES.VALIDATION;
                    message = response.data && response.data.message ? 
                        response.data.message : 'Conflict with existing data';
                    break;
                case 422:
                    errorType = self.ERROR_TYPES.VALIDATION;
                    message = response.data && response.data.message ? 
                        response.data.message : 'Validation failed';
                    break;
                case 500:
                    errorType = self.ERROR_TYPES.SERVER;
                    message = 'Server error occurred. Please try again later.';
                    break;
                case 502:
                case 503:
                case 504:
                    errorType = self.ERROR_TYPES.NETWORK;
                    message = 'Service temporarily unavailable. Please try again later.';
                    break;
                default:
                    if (response.status >= 500) {
                        errorType = self.ERROR_TYPES.SERVER;
                        message = 'Server error occurred. Please try again later.';
                    } else if (response.status >= 400) {
                        errorType = self.ERROR_TYPES.VALIDATION;
                        message = response.data && response.data.message ? 
                            response.data.message : 'Request failed';
                    }
            }
        }
        
        return self.addError(message, errorType, context);
    };
    
    // Handle validation errors
    self.handleValidationError = function(field, message, context) {
        var fullMessage = field ? field + ': ' + message : message;
        return self.addError(fullMessage, self.ERROR_TYPES.VALIDATION, context);
    };
    
    // Check if network is available
    self.isOnline = function() {
        return navigator.onLine;
    };
    
    // Network status monitoring
    window.addEventListener('online', function() {
        $rootScope.$broadcast('network:online');
        $rootScope.$apply();
    });
    
    window.addEventListener('offline', function() {
        self.addError('You are currently offline. Some features may not work properly.', 
                     self.ERROR_TYPES.NETWORK, 'network');
        $rootScope.$broadcast('network:offline');
        $rootScope.$apply();
    });
    
}])

// HTTP Interceptor for error handling
.factory('ErrorInterceptor', ['$q', '$location', 'ErrorService', 'AuthService', 
function($q, $location, ErrorService, AuthService) {
    
    var retryQueue = [];
    var isRetrying = false;
    
    return {
        request: function(config) {
            // Add timestamp to prevent caching issues
            if (config.method === 'GET') {
                config.params = config.params || {};
                config.params._t = Date.now();
            }
            
            return config;
        },
        
        requestError: function(rejection) {
            ErrorService.handleHttpError(null, 'request');
            return $q.reject(rejection);
        },
        
        response: function(response) {
            return response;
        },
        
        responseError: function(rejection) {
            var context = rejection.config ? rejection.config.url : 'unknown';
            
            // Handle authentication errors
            if (rejection.status === 401) {
                // Clear auth and redirect to login
                AuthService.logout().then(function() {
                    $location.path('/');
                });
                ErrorService.handleHttpError(rejection, context);
                return $q.reject(rejection);
            }
            
            // Handle network errors with retry logic
            if (rejection.status === 0 || rejection.status === -1) {
                if (!isRetrying && retryQueue.length < 3) {
                    isRetrying = true;
                    retryQueue.push(rejection.config);
                    
                    // Retry after 2 seconds
                    return $q(function(resolve, reject) {
                        setTimeout(function() {
                            var retryConfig = retryQueue.shift();
                            isRetrying = false;
                            
                            // Retry the request
                            var $http = angular.injector(['ng']).get('$http');
                            $http(retryConfig).then(resolve, function(retryRejection) {
                                ErrorService.handleHttpError(retryRejection, context);
                                reject(retryRejection);
                            });
                        }, 2000);
                    });
                }
            }
            
            // Handle all other errors
            ErrorService.handleHttpError(rejection, context);
            return $q.reject(rejection);
        }
    };
}]);