describe('LoginController', function() {
    var $controller, $scope, $location, AuthService, ValidationService, ErrorService, $q, $rootScope;
    
    beforeEach(module('pokerPalApp'));
    
    beforeEach(inject(function(_$controller_, _$rootScope_, _$location_, _$q_) {
        $controller = _$controller_;
        $rootScope = _$rootScope_;
        $scope = $rootScope.$new();
        $location = _$location_;
        $q = _$q_;
        
        // Mock services
        AuthService = {
            login: jasmine.createSpy('login').and.returnValue($q.defer().promise),
            isAuthenticated: jasmine.createSpy('isAuthenticated').and.returnValue(false)
        };
        
        ValidationService = {
            validateForm: jasmine.createSpy('validateForm').and.returnValue({ isValid: true, errors: [] }),
            displayErrors: jasmine.createSpy('displayErrors'),
            schemas: {
                login: {}
            }
        };
        
        ErrorService = {
            clearErrors: jasmine.createSpy('clearErrors')
        };
    }));
    
    function createController() {
        return $controller('LoginController', {
            $scope: $scope,
            $location: $location,
            AuthService: AuthService,
            ValidationService: ValidationService,
            ErrorService: ErrorService
        });
    }
    
    describe('initialization', function() {
        it('should initialize with empty login data', function() {
            createController();
            
            expect($scope.loginData.computing_id).toBe('');
            expect($scope.loading).toBe(false);
            expect($scope.error).toBeNull();
            expect($scope.showCreateProfile).toBe(false);
        });
        
        it('should redirect if already authenticated', function() {
            AuthService.isAuthenticated.and.returnValue(true);
            spyOn($location, 'path');
            
            createController();
            
            expect($location.path).toHaveBeenCalledWith('/home');
        });
    });
    
    describe('login function', function() {
        beforeEach(function() {
            createController();
        });
        
        it('should login successfully with valid data', function() {
            var deferred = $q.defer();
            AuthService.login.and.returnValue(deferred.promise);
            spyOn($location, 'path');
            
            $scope.loginData.computing_id = 'test123';
            $scope.login();
            
            expect(ErrorService.clearErrors).toHaveBeenCalled();
            expect(ValidationService.validateForm).toHaveBeenCalled();
            expect($scope.loading).toBe(true);
            expect(AuthService.login).toHaveBeenCalledWith('test123');
            
            // Resolve the promise
            deferred.resolve({ user: { computing_id: 'test123' } });
            $scope.$apply();
            
            expect($location.path).toHaveBeenCalledWith('/home');
        });
        
        it('should handle validation errors', function() {
            ValidationService.validateForm.and.returnValue({
                isValid: false,
                errors: ['Computing ID is required']
            });
            
            $scope.login();
            
            expect(ValidationService.displayErrors).toHaveBeenCalled();
            expect(AuthService.login).not.toHaveBeenCalled();
        });
        
        it('should handle login failure with profile creation option', function() {
            var deferred = $q.defer();
            AuthService.login.and.returnValue(deferred.promise);
            
            $scope.loginData.computing_id = 'newuser123';
            $scope.login();
            
            // Reject with 404 error
            deferred.reject({ status: 404, message: 'Computing ID not found' });
            $scope.$apply();
            
            expect($scope.loading).toBe(false);
            expect($scope.showCreateProfile).toBe(true);
            expect($scope.error).toContain('Computing ID not found');
        });
        
        it('should handle login failure requiring profile', function() {
            var deferred = $q.defer();
            AuthService.login.and.returnValue(deferred.promise);
            
            $scope.loginData.computing_id = 'test123';
            $scope.login();
            
            // Reject with profile requirement
            deferred.reject({ 
                requiresProfile: true, 
                message: 'Profile creation required' 
            });
            $scope.$apply();
            
            expect($scope.loading).toBe(false);
            expect($scope.showCreateProfile).toBe(true);
            expect($scope.error).toBe('Profile creation required');
        });
    });
    
    describe('createProfile function', function() {
        beforeEach(function() {
            createController();
        });
        
        it('should navigate to profile creation with computing ID', function() {
            spyOn($location, 'path').and.returnValue($location);
            spyOn($location, 'search');
            
            $scope.loginData.computing_id = 'test123';
            $scope.createProfile();
            
            expect($location.path).toHaveBeenCalledWith('/profile/create');
            expect($location.search).toHaveBeenCalledWith('computing_id', 'test123');
        });
    });
    
    describe('validation functions', function() {
        beforeEach(function() {
            createController();
        });
        
        it('should validate computing ID format correctly', function() {
            // Valid computing ID
            $scope.loginData.computing_id = 'test123';
            expect($scope.validateComputingId()).toBe(true);
            
            // Too short
            $scope.loginData.computing_id = 'ab';
            expect($scope.validateComputingId()).toBe(false);
            
            // Too long
            $scope.loginData.computing_id = 'a'.repeat(51);
            expect($scope.validateComputingId()).toBe(false);
            
            // Invalid characters
            $scope.loginData.computing_id = 'test@123';
            expect($scope.validateComputingId()).toBe(false);
            
            // Empty (should return true - no error for empty)
            $scope.loginData.computing_id = '';
            expect($scope.validateComputingId()).toBe(true);
        });
        
        it('should return appropriate validation error messages', function() {
            // Too short
            $scope.loginData.computing_id = 'ab';
            expect($scope.getValidationError()).toBe('Computing ID must be at least 3 characters long');
            
            // Too long
            $scope.loginData.computing_id = 'a'.repeat(51);
            expect($scope.getValidationError()).toBe('Computing ID must not exceed 50 characters');
            
            // Invalid characters
            $scope.loginData.computing_id = 'test@123';
            expect($scope.getValidationError()).toBe('Computing ID must contain only letters and numbers');
            
            // Valid
            $scope.loginData.computing_id = 'test123';
            expect($scope.getValidationError()).toBe('');
        });
    });
    
    describe('utility functions', function() {
        beforeEach(function() {
            createController();
        });
        
        it('should clear error and create profile flag', function() {
            $scope.error = 'Some error';
            $scope.showCreateProfile = true;
            
            $scope.clearError();
            
            expect($scope.error).toBeNull();
            expect($scope.showCreateProfile).toBe(false);
        });
        
        it('should handle Enter key press for login', function() {
            spyOn($scope, 'login');
            $scope.loginForm = { $valid: true };
            $scope.loading = false;
            
            var event = { keyCode: 13 };
            $scope.handleKeyPress(event);
            
            expect($scope.login).toHaveBeenCalled();
        });
        
        it('should not login on Enter if form is invalid or loading', function() {
            spyOn($scope, 'login');
            
            // Invalid form
            $scope.loginForm = { $valid: false };
            $scope.loading = false;
            $scope.handleKeyPress({ keyCode: 13 });
            expect($scope.login).not.toHaveBeenCalled();
            
            // Loading state
            $scope.loginForm = { $valid: true };
            $scope.loading = true;
            $scope.handleKeyPress({ keyCode: 13 });
            expect($scope.login).not.toHaveBeenCalled();
        });
    });
});