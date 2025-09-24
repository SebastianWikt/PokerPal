describe('AuthService', function() {
    var AuthService, $httpBackend, $q, $rootScope, API_BASE_URL;
    
    beforeEach(module('pokerPalApp'));
    
    beforeEach(inject(function(_AuthService_, _$httpBackend_, _$q_, _$rootScope_, _API_BASE_URL_) {
        AuthService = _AuthService_;
        $httpBackend = _$httpBackend_;
        $q = _$q_;
        $rootScope = _$rootScope_;
        API_BASE_URL = _API_BASE_URL_;
        
        // Clear localStorage before each test
        localStorage.clear();
    }));
    
    afterEach(function() {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
        localStorage.clear();
    });
    
    describe('initializeAuth', function() {
        it('should initialize auth state from localStorage', function() {
            var mockUser = { computing_id: 'test123', first_name: 'Test', is_admin: false };
            var mockToken = 'mock-jwt-token';
            
            localStorage.setItem('pokerpal_token', mockToken);
            localStorage.setItem('pokerpal_user', JSON.stringify(mockUser));
            
            // Mock token verification
            $httpBackend.expectGET(API_BASE_URL + '/auth/me')
                .respond(200, { user: mockUser });
            
            AuthService.initializeAuth();
            $httpBackend.flush();
            
            expect(AuthService.isAuthenticated()).toBe(true);
            expect(AuthService.getCurrentUser()).toEqual(mockUser);
            expect(AuthService.getToken()).toBe(mockToken);
        });
        
        it('should clear invalid stored data', function() {
            localStorage.setItem('pokerpal_token', 'invalid-token');
            localStorage.setItem('pokerpal_user', 'invalid-json');
            
            AuthService.initializeAuth();
            
            expect(AuthService.isAuthenticated()).toBe(false);
            expect(localStorage.getItem('pokerpal_token')).toBeNull();
            expect(localStorage.getItem('pokerpal_user')).toBeNull();
        });
    });
    
    describe('login', function() {
        it('should login successfully with valid computing ID', function() {
            var computingId = 'test123';
            var mockResponse = {
                token: 'mock-jwt-token',
                user: { computing_id: computingId, first_name: 'Test', is_admin: false }
            };
            
            $httpBackend.expectPOST(API_BASE_URL + '/auth/login', { computing_id: computingId })
                .respond(200, mockResponse);
            
            var result;
            AuthService.login(computingId).then(function(response) {
                result = response;
            });
            
            $httpBackend.flush();
            
            expect(result).toEqual(mockResponse);
            expect(AuthService.isAuthenticated()).toBe(true);
            expect(AuthService.getCurrentUser()).toEqual(mockResponse.user);
            expect(localStorage.getItem('pokerpal_token')).toBe(mockResponse.token);
        });
        
        it('should handle login failure', function() {
            var computingId = 'invalid123';
            var errorResponse = { message: 'Computing ID not found' };
            
            $httpBackend.expectPOST(API_BASE_URL + '/auth/login', { computing_id: computingId })
                .respond(404, errorResponse);
            
            var error;
            AuthService.login(computingId).catch(function(err) {
                error = err;
            });
            
            $httpBackend.flush();
            
            expect(error).toEqual(errorResponse);
            expect(AuthService.isAuthenticated()).toBe(false);
        });
    });
    
    describe('logout', function() {
        beforeEach(function() {
            // Set up authenticated state
            localStorage.setItem('pokerpal_token', 'mock-token');
            localStorage.setItem('pokerpal_user', JSON.stringify({ computing_id: 'test123' }));
            AuthService.initializeAuth();
        });
        
        it('should logout successfully', function() {
            $httpBackend.expectPOST(API_BASE_URL + '/auth/logout')
                .respond(200, { success: true });
            
            var success = false;
            AuthService.logout().then(function() {
                success = true;
            });
            
            $httpBackend.flush();
            
            expect(success).toBe(true);
            expect(AuthService.isAuthenticated()).toBe(false);
            expect(localStorage.getItem('pokerpal_token')).toBeNull();
            expect(localStorage.getItem('pokerpal_user')).toBeNull();
        });
        
        it('should clear local data even if server call fails', function() {
            $httpBackend.expectPOST(API_BASE_URL + '/auth/logout')
                .respond(500, { error: 'Server error' });
            
            var completed = false;
            AuthService.logout().then(function() {
                completed = true;
            });
            
            $httpBackend.flush();
            
            expect(completed).toBe(true);
            expect(AuthService.isAuthenticated()).toBe(false);
        });
    });
    
    describe('isAdmin', function() {
        it('should return true for admin users', function() {
            localStorage.setItem('pokerpal_user', JSON.stringify({ 
                computing_id: 'admin123', 
                is_admin: true 
            }));
            localStorage.setItem('pokerpal_token', 'mock-token');
            AuthService.initializeAuth();
            
            expect(AuthService.isAdmin()).toBe(true);
        });
        
        it('should return false for non-admin users', function() {
            localStorage.setItem('pokerpal_user', JSON.stringify({ 
                computing_id: 'user123', 
                is_admin: false 
            }));
            localStorage.setItem('pokerpal_token', 'mock-token');
            AuthService.initializeAuth();
            
            expect(AuthService.isAdmin()).toBe(false);
        });
        
        it('should return false when not authenticated', function() {
            expect(AuthService.isAdmin()).toBe(false);
        });
    });
    
    describe('verifyToken', function() {
        it('should verify valid token', function() {
            localStorage.setItem('pokerpal_token', 'valid-token');
            AuthService.initializeAuth();
            
            var mockUser = { computing_id: 'test123', first_name: 'Test' };
            $httpBackend.expectGET(API_BASE_URL + '/auth/me')
                .respond(200, { user: mockUser });
            
            var result;
            AuthService.verifyToken().then(function(user) {
                result = user;
            });
            
            $httpBackend.flush();
            
            expect(result).toEqual(mockUser);
            expect(AuthService.getCurrentUser()).toEqual(mockUser);
        });
        
        it('should reject when no token available', function() {
            var error;
            AuthService.verifyToken().catch(function(err) {
                error = err;
            });
            
            $rootScope.$apply();
            
            expect(error.message).toBe('No token available');
        });
    });
});