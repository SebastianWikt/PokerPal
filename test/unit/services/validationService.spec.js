describe('ValidationService', function() {
    var ValidationService;
    
    beforeEach(module('pokerPalApp'));
    
    beforeEach(inject(function(_ValidationService_) {
        ValidationService = _ValidationService_;
    }));
    
    describe('validateForm', function() {
        it('should validate login form successfully', function() {
            var validData = {
                computing_id: 'test123'
            };
            
            var result = ValidationService.validateForm(validData, ValidationService.schemas.login);
            
            expect(result.isValid).toBe(true);
            expect(result.errors).toEqual([]);
        });
        
        it('should validate login form with errors', function() {
            var invalidData = {
                computing_id: 'ab' // Too short
            };
            
            var result = ValidationService.validateForm(invalidData, ValidationService.schemas.login);
            
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors[0]).toContain('Computing ID must be at least 3 characters');
        });
        
        it('should validate player form successfully', function() {
            var validData = {
                computing_id: 'test123',
                first_name: 'John',
                last_name: 'Doe',
                years_of_experience: 5,
                level: 'Intermediate',
                major: 'Computer Science'
            };
            
            var result = ValidationService.validateForm(validData, ValidationService.schemas.player);
            
            expect(result.isValid).toBe(true);
            expect(result.errors).toEqual([]);
        });
        
        it('should validate player form with multiple errors', function() {
            var invalidData = {
                computing_id: '', // Required
                first_name: '', // Required
                last_name: 'D0e', // Invalid characters
                years_of_experience: -1, // Invalid range
                level: 'Invalid', // Not in allowed values
                major: '' // Required
            };
            
            var result = ValidationService.validateForm(invalidData, ValidationService.schemas.player);
            
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(4);
        });
        
        it('should validate session form successfully', function() {
            var validData = {
                computing_id: 'test123',
                session_date: '2023-12-01',
                type: 'checkin'
            };
            
            var result = ValidationService.validateForm(validData, ValidationService.schemas.session);
            
            expect(result.isValid).toBe(true);
            expect(result.errors).toEqual([]);
        });
    });
    
    describe('validation schemas', function() {
        it('should have login schema', function() {
            expect(ValidationService.schemas.login).toBeDefined();
            expect(ValidationService.schemas.login.computing_id).toBeDefined();
        });
        
        it('should have player schema', function() {
            expect(ValidationService.schemas.player).toBeDefined();
            expect(ValidationService.schemas.player.computing_id).toBeDefined();
            expect(ValidationService.schemas.player.first_name).toBeDefined();
            expect(ValidationService.schemas.player.last_name).toBeDefined();
        });
        
        it('should have session schema', function() {
            expect(ValidationService.schemas.session).toBeDefined();
            expect(ValidationService.schemas.session.computing_id).toBeDefined();
            expect(ValidationService.schemas.session.session_date).toBeDefined();
            expect(ValidationService.schemas.session.type).toBeDefined();
        });
    });
    
    describe('field validation functions', function() {
        it('should validate computing ID format', function() {
            expect(ValidationService.validateComputingId('test123')).toBe(true);
            expect(ValidationService.validateComputingId('user456')).toBe(true);
            expect(ValidationService.validateComputingId('ab')).toBe(false); // Too short
            expect(ValidationService.validateComputingId('a'.repeat(51))).toBe(false); // Too long
            expect(ValidationService.validateComputingId('test@123')).toBe(false); // Invalid chars
            expect(ValidationService.validateComputingId('')).toBe(false); // Empty
        });
        
        it('should validate name fields', function() {
            expect(ValidationService.validateName('John')).toBe(true);
            expect(ValidationService.validateName('Mary-Jane')).toBe(true);
            expect(ValidationService.validateName("O'Connor")).toBe(true);
            expect(ValidationService.validateName('John123')).toBe(false); // Numbers
            expect(ValidationService.validateName('J@hn')).toBe(false); // Special chars
            expect(ValidationService.validateName('')).toBe(false); // Empty
            expect(ValidationService.validateName('A')).toBe(false); // Too short
        });
        
        it('should validate years of experience', function() {
            expect(ValidationService.validateYearsOfExperience(0)).toBe(true);
            expect(ValidationService.validateYearsOfExperience(5)).toBe(true);
            expect(ValidationService.validateYearsOfExperience(50)).toBe(true);
            expect(ValidationService.validateYearsOfExperience(-1)).toBe(false); // Negative
            expect(ValidationService.validateYearsOfExperience(51)).toBe(false); // Too high
            expect(ValidationService.validateYearsOfExperience('abc')).toBe(false); // Not a number
        });
        
        it('should validate skill levels', function() {
            var validLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
            
            validLevels.forEach(function(level) {
                expect(ValidationService.validateLevel(level)).toBe(true);
            });
            
            expect(ValidationService.validateLevel('Invalid')).toBe(false);
            expect(ValidationService.validateLevel('')).toBe(false);
            expect(ValidationService.validateLevel('beginner')).toBe(false); // Case sensitive
        });
        
        it('should validate session dates', function() {
            expect(ValidationService.validateSessionDate('2023-12-01')).toBe(true);
            expect(ValidationService.validateSessionDate('2023-01-31')).toBe(true);
            expect(ValidationService.validateSessionDate('invalid-date')).toBe(false);
            expect(ValidationService.validateSessionDate('')).toBe(false);
            expect(ValidationService.validateSessionDate('12/01/2023')).toBe(false); // Wrong format
        });
        
        it('should validate session types', function() {
            expect(ValidationService.validateSessionType('checkin')).toBe(true);
            expect(ValidationService.validateSessionType('checkout')).toBe(true);
            expect(ValidationService.validateSessionType('invalid')).toBe(false);
            expect(ValidationService.validateSessionType('')).toBe(false);
            expect(ValidationService.validateSessionType('CHECKIN')).toBe(false); // Case sensitive
        });
        
        it('should validate chip amounts', function() {
            expect(ValidationService.validateChipAmount(0)).toBe(true);
            expect(ValidationService.validateChipAmount(100.50)).toBe(true);
            expect(ValidationService.validateChipAmount(1000000)).toBe(true);
            expect(ValidationService.validateChipAmount(-1)).toBe(false); // Negative
            expect(ValidationService.validateChipAmount('abc')).toBe(false); // Not a number
            expect(ValidationService.validateChipAmount(null)).toBe(false);
        });
    });
    
    describe('displayErrors', function() {
        it('should display errors in specified container', function() {
            var errors = ['Error 1', 'Error 2'];
            var containerId = 'test-container';
            
            // Mock DOM element
            var mockElement = {
                innerHTML: '',
                style: { display: 'none' }
            };
            
            spyOn(document, 'getElementById').and.returnValue(mockElement);
            
            ValidationService.displayErrors(errors, containerId);
            
            expect(document.getElementById).toHaveBeenCalledWith(containerId);
            expect(mockElement.style.display).toBe('block');
            expect(mockElement.innerHTML).toContain('Error 1');
            expect(mockElement.innerHTML).toContain('Error 2');
        });
        
        it('should handle missing container gracefully', function() {
            var errors = ['Error 1'];
            var containerId = 'nonexistent-container';
            
            spyOn(document, 'getElementById').and.returnValue(null);
            spyOn(console, 'warn');
            
            ValidationService.displayErrors(errors, containerId);
            
            expect(console.warn).toHaveBeenCalledWith('Error container not found:', containerId);
        });
    });
    
    describe('clearErrors', function() {
        it('should clear errors from specified container', function() {
            var containerId = 'test-container';
            
            var mockElement = {
                innerHTML: 'Previous errors',
                style: { display: 'block' }
            };
            
            spyOn(document, 'getElementById').and.returnValue(mockElement);
            
            ValidationService.clearErrors(containerId);
            
            expect(mockElement.innerHTML).toBe('');
            expect(mockElement.style.display).toBe('none');
        });
        
        it('should clear all error containers when no ID specified', function() {
            var mockElements = [
                { innerHTML: 'Error 1', style: { display: 'block' } },
                { innerHTML: 'Error 2', style: { display: 'block' } }
            ];
            
            spyOn(document, 'querySelectorAll').and.returnValue(mockElements);
            
            ValidationService.clearErrors();
            
            expect(document.querySelectorAll).toHaveBeenCalledWith('.error-container');
            mockElements.forEach(function(element) {
                expect(element.innerHTML).toBe('');
                expect(element.style.display).toBe('none');
            });
        });
    });
    
    describe('utility functions', function() {
        it('should check if value is required and empty', function() {
            expect(ValidationService.isRequired('')).toBe(false);
            expect(ValidationService.isRequired(null)).toBe(false);
            expect(ValidationService.isRequired(undefined)).toBe(false);
            expect(ValidationService.isRequired('   ')).toBe(false); // Whitespace only
            expect(ValidationService.isRequired('value')).toBe(true);
            expect(ValidationService.isRequired(0)).toBe(true); // Zero is valid
        });
        
        it('should check string length constraints', function() {
            expect(ValidationService.checkLength('test', 2, 10)).toBe(true);
            expect(ValidationService.checkLength('test', 5, 10)).toBe(false); // Too short
            expect(ValidationService.checkLength('test', 1, 3)).toBe(false); // Too long
            expect(ValidationService.checkLength('', 1, 10)).toBe(false); // Empty
        });
        
        it('should check numeric range constraints', function() {
            expect(ValidationService.checkRange(5, 0, 10)).toBe(true);
            expect(ValidationService.checkRange(0, 0, 10)).toBe(true); // Min boundary
            expect(ValidationService.checkRange(10, 0, 10)).toBe(true); // Max boundary
            expect(ValidationService.checkRange(-1, 0, 10)).toBe(false); // Below min
            expect(ValidationService.checkRange(11, 0, 10)).toBe(false); // Above max
        });
        
        it('should validate against regex patterns', function() {
            var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            
            expect(ValidationService.matchesPattern('test@example.com', emailPattern)).toBe(true);
            expect(ValidationService.matchesPattern('invalid-email', emailPattern)).toBe(false);
            expect(ValidationService.matchesPattern('', emailPattern)).toBe(false);
        });
    });
});