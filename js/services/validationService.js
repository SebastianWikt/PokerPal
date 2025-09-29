angular.module('pokerPalApp')
.service('ValidationService', ['ErrorService', function(ErrorService) {
    
    var self = this;
    
    // Validation rules
    self.rules = {
        required: function(value, fieldName) {
            if (!value || (typeof value === 'string' && value.trim() === '')) {
                return fieldName + ' is required';
            }
            return null;
        },
        
        minLength: function(value, minLength, fieldName) {
            if (value && value.length < minLength) {
                return fieldName + ' must be at least ' + minLength + ' characters long';
            }
            return null;
        },
        
        maxLength: function(value, maxLength, fieldName) {
            if (value && value.length > maxLength) {
                return fieldName + ' must be no more than ' + maxLength + ' characters long';
            }
            return null;
        },
        
        email: function(value, fieldName) {
            if (value) {
                var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    return fieldName + ' must be a valid email address';
                }
            }
            return null;
        },
        
        computingId: function(value, fieldName) {
            if (value) {
                // Computing ID should be alphanumeric, 3-20 characters
                var computingIdRegex = /^[a-zA-Z0-9]{3,20}$/;
                if (!computingIdRegex.test(value)) {
                    return fieldName + ' must be 3-20 alphanumeric characters';
                }
            }
            return null;
        },
        
        number: function(value, fieldName) {
            if (value !== null && value !== undefined && value !== '') {
                if (isNaN(value) || !isFinite(value)) {
                    return fieldName + ' must be a valid number';
                }
            }
            return null;
        },
        
        positiveNumber: function(value, fieldName) {
            var numberError = self.rules.number(value, fieldName);
            if (numberError) return numberError;
            
            if (value !== null && value !== undefined && value !== '' && parseFloat(value) < 0) {
                return fieldName + ' must be a positive number';
            }
            return null;
        },
        
        integer: function(value, fieldName) {
            if (value !== null && value !== undefined && value !== '') {
                if (!Number.isInteger(parseFloat(value))) {
                    return fieldName + ' must be a whole number';
                }
            }
            return null;
        },
        
        range: function(value, min, max, fieldName) {
            if (value !== null && value !== undefined && value !== '') {
                var numValue = parseFloat(value);
                if (numValue < min || numValue > max) {
                    return fieldName + ' must be between ' + min + ' and ' + max;
                }
            }
            return null;
        },
        
        date: function(value, fieldName) {
            if (value) {
                var date = new Date(value);
                if (isNaN(date.getTime())) {
                    return fieldName + ' must be a valid date';
                }
            }
            return null;
        },
        
        futureDate: function(value, fieldName) {
            var dateError = self.rules.date(value, fieldName);
            if (dateError) return dateError;
            
            if (value) {
                var date = new Date(value);
                var now = new Date();
                if (date <= now) {
                    return fieldName + ' must be a future date';
                }
            }
            return null;
        },
        
        pastDate: function(value, fieldName) {
            var dateError = self.rules.date(value, fieldName);
            if (dateError) return dateError;
            
            if (value) {
                var date = new Date(value);
                var now = new Date();
                if (date > now) {
                    return fieldName + ' cannot be a future date';
                }
            }
            return null;
        }
    };
    
    // Validate single field
    self.validateField = function(value, validations, fieldName) {
        var errors = [];
        
        for (var i = 0; i < validations.length; i++) {
            var validation = validations[i];
            var error = null;
            
            if (typeof validation === 'string') {
                // Simple rule name
                error = self.rules[validation](value, fieldName);
            } else if (typeof validation === 'object') {
                // Rule with parameters
                var ruleName = validation.rule;
                var params = validation.params || [];
                error = self.rules[ruleName].apply(null, [value].concat(params).concat([fieldName]));
            } else if (typeof validation === 'function') {
                // Custom validation function
                error = validation(value, fieldName);
            }
            
            if (error) {
                errors.push(error);
            }
        }
        
        return errors;
    };
    
    // Validate entire form
    self.validateForm = function(formData, validationSchema) {
        var errors = {};
        var hasErrors = false;
        
        for (var fieldName in validationSchema) {
            var fieldValidations = validationSchema[fieldName];
            var fieldValue = formData[fieldName];
            var fieldErrors = self.validateField(fieldValue, fieldValidations, fieldName);
            
            if (fieldErrors.length > 0) {
                errors[fieldName] = fieldErrors;
                hasErrors = true;
            }
        }
        
        return {
            isValid: !hasErrors,
            errors: errors
        };
    };
    
    // Real-time field validation
    self.createFieldValidator = function(validations, fieldName, errorCallback) {
        return function(value) {
            var errors = self.validateField(value, validations, fieldName);
            if (errorCallback) {
                errorCallback(errors);
            }
            return errors.length === 0;
        };
    };
    
    // Common validation schemas
    self.schemas = {
        login: {
            computing_id: ['required', 'computingId']
        },
        
        profile: {
            first_name: ['required', { rule: 'maxLength', params: [50] }],
            last_name: ['required', { rule: 'maxLength', params: [50] }],
            computing_id: ['required', 'computingId'],
            years_of_experience: ['number', 'positiveNumber', { rule: 'range', params: [0, 50] }],
            level: [{ rule: 'maxLength', params: [20] }],
            major: [{ rule: 'maxLength', params: [100] }]
        },
        
        session: {
            session_date: ['required', 'date', 'pastDate'],
            session_type: ['required'],
            chip_counts: function(value, fieldName) {
                if (!value || typeof value !== 'object') {
                    return 'Chip counts are required';
                }
                
                var hasChips = false;
                for (var color in value) {
                    if (value[color] > 0) {
                        hasChips = true;
                        break;
                    }
                }
                
                if (!hasChips) {
                    return 'At least one chip count must be greater than zero';
                }
                
                return null;
            }
        },
        
        chipValues: {
            white: ['required', 'positiveNumber'],
            red: ['required', 'positiveNumber'],
            green: ['required', 'positiveNumber'],
            black: ['required', 'positiveNumber'],
            purple: ['required', 'positiveNumber']
        }
    };
    
    // Display validation errors
    self.displayErrors = function(errors, context) {
        for (var fieldName in errors) {
            var fieldErrors = errors[fieldName];
            for (var i = 0; i < fieldErrors.length; i++) {
                ErrorService.handleValidationError(fieldName, fieldErrors[i], context);
            }
        }
    };
    
}]);