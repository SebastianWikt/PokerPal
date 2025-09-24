angular.module('pokerPalApp')
.directive('errorDisplay', ['ErrorService', function(ErrorService) {
    return {
        restrict: 'E',
        template: `
            <div class="error-container" ng-show="errors.length > 0">
                <div ng-repeat="error in errors track by error.id" 
                     class="alert alert-dismissible fade show"
                     ng-class="getAlertClass(error.type)">
                    <div class="d-flex align-items-center">
                        <i class="me-2" ng-class="getIconClass(error.type)"></i>
                        <div class="flex-grow-1">
                            <strong ng-if="error.context">{{ error.context }}:</strong>
                            {{ error.message }}
                            <small class="d-block text-muted" ng-if="showTimestamp">
                                {{ error.timestamp | date:'short' }}
                            </small>
                        </div>
                        <button type="button" class="btn-close" 
                                ng-click="dismissError(error.id)"
                                aria-label="Close"></button>
                    </div>
                </div>
            </div>
        `,
        scope: {
            context: '@',
            showTimestamp: '=?',
            maxErrors: '=?'
        },
        link: function(scope, element, attrs) {
            scope.errors = [];
            scope.showTimestamp = scope.showTimestamp || false;
            scope.maxErrors = scope.maxErrors || 5;
            
            // Update errors list
            function updateErrors() {
                var allErrors = ErrorService.getActiveErrors();
                
                // Filter by context if specified
                if (scope.context) {
                    allErrors = allErrors.filter(function(error) {
                        return error.context === scope.context;
                    });
                }
                
                // Limit number of errors shown
                scope.errors = allErrors.slice(0, scope.maxErrors);
            }
            
            // Listen for error events
            scope.$on('error:added', updateErrors);
            scope.$on('error:dismissed', updateErrors);
            scope.$on('errors:cleared', updateErrors);
            
            // Initial load
            updateErrors();
            
            // Dismiss error
            scope.dismissError = function(errorId) {
                ErrorService.dismissError(errorId);
            };
            
            // Get alert CSS class based on error type
            scope.getAlertClass = function(errorType) {
                switch (errorType) {
                    case ErrorService.ERROR_TYPES.VALIDATION:
                        return 'alert-warning';
                    case ErrorService.ERROR_TYPES.AUTHENTICATION:
                    case ErrorService.ERROR_TYPES.AUTHORIZATION:
                        return 'alert-danger';
                    case ErrorService.ERROR_TYPES.NETWORK:
                        return 'alert-info';
                    case ErrorService.ERROR_TYPES.SERVER:
                        return 'alert-danger';
                    default:
                        return 'alert-secondary';
                }
            };
            
            // Get icon CSS class based on error type
            scope.getIconClass = function(errorType) {
                switch (errorType) {
                    case ErrorService.ERROR_TYPES.VALIDATION:
                        return 'bi bi-exclamation-triangle-fill';
                    case ErrorService.ERROR_TYPES.AUTHENTICATION:
                    case ErrorService.ERROR_TYPES.AUTHORIZATION:
                        return 'bi bi-shield-exclamation';
                    case ErrorService.ERROR_TYPES.NETWORK:
                        return 'bi bi-wifi-off';
                    case ErrorService.ERROR_TYPES.SERVER:
                        return 'bi bi-server';
                    default:
                        return 'bi bi-info-circle-fill';
                }
            };
        }
    };
}])

.directive('fieldError', ['ValidationService', function(ValidationService) {
    return {
        restrict: 'E',
        template: `
            <div class="field-error" ng-show="errors.length > 0">
                <small class="text-danger" ng-repeat="error in errors">
                    <i class="bi bi-exclamation-circle me-1"></i>
                    {{ error }}
                </small>
            </div>
        `,
        scope: {
            field: '@',
            errors: '='
        },
        link: function(scope, element, attrs) {
            scope.errors = scope.errors || [];
        }
    };
}])

.directive('validationFeedback', function() {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function(scope, element, attrs, ngModel) {
            var validationRules = scope.$eval(attrs.validationFeedback);
            var fieldName = attrs.fieldName || attrs.name || 'Field';
            
            // Add validation classes
            element.addClass('form-control');
            
            // Create error container
            var errorContainer = angular.element('<div class="invalid-feedback"></div>');
            element.after(errorContainer);
            
            // Validate on blur and input
            element.on('blur input', function() {
                validateField();
            });
            
            function validateField() {
                var value = ngModel.$viewValue;
                var errors = [];
                
                if (validationRules && validationRules.length > 0) {
                    var ValidationService = angular.element(document.body).injector().get('ValidationService');
                    errors = ValidationService.validateField(value, validationRules, fieldName);
                }
                
                // Update UI
                if (errors.length > 0) {
                    element.addClass('is-invalid');
                    element.removeClass('is-valid');
                    errorContainer.html(errors.join('<br>'));
                    ngModel.$setValidity('custom', false);
                } else if (value) {
                    element.addClass('is-valid');
                    element.removeClass('is-invalid');
                    errorContainer.html('');
                    ngModel.$setValidity('custom', true);
                } else {
                    element.removeClass('is-valid is-invalid');
                    errorContainer.html('');
                    ngModel.$setValidity('custom', true);
                }
            }
            
            // Watch for changes
            scope.$watch(function() {
                return ngModel.$viewValue;
            }, validateField);
        }
    };
});