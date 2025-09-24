angular.module('pokerPalApp')
.controller('SessionController', ['$scope', '$location', 'AuthService', 'SessionService', function($scope, $location, AuthService, SessionService) {
    
    console.log('SessionController loading...');
    
    // Initialize controller
    $scope.loading = false;
    $scope.currentUser = AuthService.getCurrentUser();
    $scope.sessionData = {
        type: 'checkin',
        photo: null,
        notes: ''
    };
    
    // Session state
    $scope.hasActiveSession = false;
    $scope.activeSession = null;
    
    // Check for active session
    $scope.checkActiveSession = function() {
        if (!$scope.currentUser) return;
        
        $scope.loading = true;
        
        // Try to get active session from API
        SessionService.getActiveSession($scope.currentUser.computing_id).then(function(session) {
            console.log('Active session found:', session);
            $scope.hasActiveSession = true;
            $scope.activeSession = session;
            $scope.loading = false;
        }).catch(function(error) {
            console.log('No active session or API error:', error);
            $scope.hasActiveSession = false;
            $scope.activeSession = null;
            $scope.loading = false;
        });
    };
    
    // Check-in function
    $scope.checkIn = function() {
        console.log('Check-in clicked');
        $scope.loading = true;
        
        var sessionData = {
            computing_id: $scope.currentUser.computing_id,
            notes: $scope.sessionData.notes
        };
        
        SessionService.checkIn(sessionData).then(function(session) {
            console.log('Check-in successful:', session);
            $scope.loading = false;
            $scope.hasActiveSession = true;
            $scope.activeSession = session;
        }).catch(function(error) {
            console.error('Check-in failed:', error);
            $scope.loading = false;
            // Fallback to mock behavior
            $scope.hasActiveSession = true;
            $scope.activeSession = {
                id: 1,
                start_time: new Date(),
                computing_id: $scope.currentUser.computing_id
            };
        });
    };
    
    // Check-out function
    $scope.checkOut = function() {
        console.log('Check-out clicked');
        $scope.loading = true;
        
        if (!$scope.activeSession) {
            $scope.loading = false;
            return;
        }
        
        var sessionData = {
            notes: $scope.sessionData.notes,
            photo: $scope.sessionData.photo
        };
        
        SessionService.checkOut($scope.activeSession.id, sessionData).then(function(result) {
            console.log('Check-out successful:', result);
            $scope.loading = false;
            $scope.hasActiveSession = false;
            $scope.activeSession = null;
            
            // Show success message or redirect
            if (result.net_winnings !== undefined) {
                alert('Session completed! Net winnings: $' + result.net_winnings.toFixed(2));
            }
        }).catch(function(error) {
            console.error('Check-out failed:', error);
            $scope.loading = false;
            // Fallback to mock behavior
            $scope.hasActiveSession = false;
            $scope.activeSession = null;
        });
    };
    
    // Photo upload function
    $scope.uploadPhoto = function(file) {
        console.log('Photo upload:', file);
        $scope.sessionData.photo = file;
    };
    
    // Initialize
    $scope.checkActiveSession();
    
    console.log('SessionController loaded successfully');
}]);