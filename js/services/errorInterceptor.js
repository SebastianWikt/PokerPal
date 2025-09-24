angular.module('pokerPalApp')
.factory('ErrorInterceptor', ['$q', 'ErrorService', function($q, ErrorService) {
    return {
        responseError: function(response) {
            // Handle different types of errors
            var errorMessage = 'An unexpected error occurred';
            
            if (response.data && response.data.error) {
                if (typeof response.data.error === 'string') {
                    errorMessage = response.data.error;
                } else if (response.data.error.message) {
                    errorMessage = response.data.error.message;
                }
            } else if (response.data && response.data.message) {
                errorMessage = response.data.message;
            } else if (response.statusText) {
                errorMessage = response.statusText;
            }
            
            // Add status code context
            switch (response.status) {
                case 400:
                    errorMessage = 'Bad Request: ' + errorMessage;
                    break;
                case 401:
                    errorMessage = 'Authentication required';
                    break;
                case 403:
                    errorMessage = 'Access denied: ' + errorMessage;
                    break;
                case 404:
                    errorMessage = 'Resource not found';
                    break;
                case 409:
                    errorMessage = 'Conflict: ' + errorMessage;
                    break;
                case 422:
                    errorMessage = 'Validation error: ' + errorMessage;
                    break;
                case 500:
                    errorMessage = 'Server error: Please try again later';
                    break;
                case 0:
                case -1:
                    errorMessage = 'Network error: Please check your connection';
                    break;
            }
            
            // Don't show error for 401 responses as they're handled by auth interceptor
            if (response.status !== 401) {
                ErrorService.addError(errorMessage, 'error');
            }
            
            return $q.reject(response);
        }
    };
}]);