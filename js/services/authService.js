angular.module('pokerPalApp')
.service('AuthService', ['$http', '$q', 'API_BASE_URL', function($http, $q, API_BASE_URL) {
    var self = this;
    var currentUser = null;
    var authToken = null;
    
    // Initialize authentication state from localStorage
    this.initializeAuth = function() {
        var storedToken = localStorage.getItem('pokerpal_token');
        var storedUser = localStorage.getItem('pokerpal_user');
        
        if (storedToken && storedUser) {
            try {
                authToken = storedToken;
                currentUser = JSON.parse(storedUser);
                
                // Set default authorization header
                $http.defaults.headers.common['Authorization'] = 'Bearer ' + authToken;
                
                // Verify token is still valid
                self.verifyToken().catch(function() {
                    self.logout();
                });
            } catch (error) {
                console.error('Error parsing stored user data:', error);
                self.logout();
            }
        }
    };
    
    // Login with computing ID
    this.login = function(computingId) {
        var deferred = $q.defer();
        
        $http.post(API_BASE_URL + '/auth/login', {
            computing_id: computingId
        }).then(function(response) {
            var data = response.data;
            
            // Store token and user data
            authToken = data.token;
            currentUser = data.user;
            
            localStorage.setItem('pokerpal_token', authToken);
            localStorage.setItem('pokerpal_user', JSON.stringify(currentUser));
            
            // Set default authorization header
            $http.defaults.headers.common['Authorization'] = 'Bearer ' + authToken;
            
            deferred.resolve(data);
        }).catch(function(error) {
            console.error('Login error:', error);
            deferred.reject(error.data || { message: 'Login failed' });
        });
        
        return deferred.promise;
    };
    
    // Logout user
    this.logout = function() {
        var deferred = $q.defer();
        
        // Call logout endpoint if authenticated
        if (authToken) {
            $http.post(API_BASE_URL + '/auth/logout').then(function() {
                self.clearAuthData();
                deferred.resolve();
            }).catch(function(error) {
                console.error('Logout error:', error);
                self.clearAuthData();
                deferred.resolve(); // Still clear local data even if server call fails
            });
        } else {
            self.clearAuthData();
            deferred.resolve();
        }
        
        return deferred.promise;
    };
    
    // Clear authentication data
    this.clearAuthData = function() {
        authToken = null;
        currentUser = null;
        
        localStorage.removeItem('pokerpal_token');
        localStorage.removeItem('pokerpal_user');
        
        delete $http.defaults.headers.common['Authorization'];
    };
    
    // Check if user is authenticated
    this.isAuthenticated = function() {
        return !!(authToken && currentUser);
    };
    
    // Check if user is admin
    this.isAdmin = function() {
        return currentUser && currentUser.is_admin === true;
    };
    
    // Get current user
    this.getCurrentUser = function() {
        return currentUser;
    };
    
    // Get auth token
    this.getToken = function() {
        return authToken;
    };
    
    // Verify token with server
    this.verifyToken = function() {
        var deferred = $q.defer();
        
        if (!authToken) {
            deferred.reject({ message: 'No token available' });
            return deferred.promise;
        }
        
        $http.get(API_BASE_URL + '/auth/me').then(function(response) {
            // Update user data with fresh info from server
            currentUser = response.data.user;
            localStorage.setItem('pokerpal_user', JSON.stringify(currentUser));
            deferred.resolve(currentUser);
        }).catch(function(error) {
            console.error('Token verification failed:', error);
            deferred.reject(error.data || { message: 'Token verification failed' });
        });
        
        return deferred.promise;
    };
    
    // Check if computing ID exists
    this.verifyComputingId = function(computingId) {
        var deferred = $q.defer();
        
        $http.post(API_BASE_URL + '/auth/verify', {
            computing_id: computingId
        }).then(function(response) {
            deferred.resolve(response.data);
        }).catch(function(error) {
            console.error('Computing ID verification error:', error);
            deferred.reject(error.data || { message: 'Verification failed' });
        });
        
        return deferred.promise;
    };
    
    // Refresh user data
    this.refreshUser = function() {
        return self.verifyToken();
    };
    
    // Get authentication status
    this.getAuthStatus = function() {
        var deferred = $q.defer();
        
        if (!authToken) {
            deferred.resolve({ authenticated: false });
            return deferred.promise;
        }
        
        $http.get(API_BASE_URL + '/auth/status').then(function(response) {
            deferred.resolve(response.data);
        }).catch(function(error) {
            console.error('Auth status check failed:', error);
            deferred.resolve({ authenticated: false });
        });
        
        return deferred.promise;
    };
}]);