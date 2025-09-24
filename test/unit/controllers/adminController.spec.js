describe('AdminController', function() {
    var $controller, $scope, AdminService, AuthService, $q, $rootScope;
    
    beforeEach(module('pokerPalApp'));
    
    beforeEach(inject(function(_$controller_, _$rootScope_, _$q_) {
        $controller = _$controller_;
        $rootScope = _$rootScope_;
        $scope = $rootScope.$new();
        $q = _$q_;
        
        // Mock services
        AdminService = {
            getAllPlayers: jasmine.createSpy('getAllPlayers').and.returnValue($q.defer().promise),
            getAllSessions: jasmine.createSpy('getAllSessions').and.returnValue($q.defer().promise),
            updatePlayer: jasmine.createSpy('updatePlayer').and.returnValue($q.defer().promise),
            deletePlayer: jasmine.createSpy('deletePlayer').and.returnValue($q.defer().promise),
            updateSession: jasmine.createSpy('updateSession').and.returnValue($q.defer().promise),
            deleteSession: jasmine.createSpy('deleteSession').and.returnValue($q.defer().promise),
            getSystemStats: jasmine.createSpy('getSystemStats').and.returnValue($q.defer().promise)
        };
        
        AuthService = {
            getCurrentUser: jasmine.createSpy('getCurrentUser').and.returnValue({
                computing_id: 'admin123',
                first_name: 'Admin',
                last_name: 'User',
                is_admin: true
            }),
            isAdmin: jasmine.createSpy('isAdmin').and.returnValue(true)
        };
    }));
    
    function createController() {
        return $controller('AdminController', {
            $scope: $scope,
            AdminService: AdminService,
            AuthService: AuthService
        });
    }
    
    describe('initialization', function() {
        it('should initialize with default values', function() {
            createController();
            
            expect($scope.players).toEqual([]);
            expect($scope.sessions).toEqual([]);
            expect($scope.systemStats).toEqual({});
            expect($scope.loading).toBe(true);
            expect($scope.activeTab).toBe('players');
            expect($scope.selectedPlayer).toBeNull();
            expect($scope.selectedSession).toBeNull();
        });
        
        it('should verify admin privileges', function() {
            createController();
            
            expect(AuthService.isAdmin).toHaveBeenCalled();
        });
        
        it('should load initial data', function() {
            var playersDeferred = $q.defer();
            var sessionsDeferred = $q.defer();
            var statsDeferred = $q.defer();
            
            AdminService.getAllPlayers.and.returnValue(playersDeferred.promise);
            AdminService.getAllSessions.and.returnValue(sessionsDeferred.promise);
            AdminService.getSystemStats.and.returnValue(statsDeferred.promise);
            
            createController();
            
            expect(AdminService.getAllPlayers).toHaveBeenCalled();
            expect(AdminService.getAllSessions).toHaveBeenCalled();
            expect(AdminService.getSystemStats).toHaveBeenCalled();
            
            var mockPlayers = [
                { computing_id: 'user1', first_name: 'John', last_name: 'Doe', total_winnings: 100.00 },
                { computing_id: 'user2', first_name: 'Jane', last_name: 'Smith', total_winnings: 200.00 }
            ];
            
            var mockSessions = [
                { entry_id: 1, computing_id: 'user1', session_date: '2023-12-01', net_winnings: 50.00 },
                { entry_id: 2, computing_id: 'user2', session_date: '2023-12-02', net_winnings: 75.00 }
            ];
            
            var mockStats = {
                totalPlayers: 2,
                totalSessions: 2,
                totalWinnings: 300.00,
                averageWinnings: 150.00
            };
            
            playersDeferred.resolve(mockPlayers);
            sessionsDeferred.resolve(mockSessions);
            statsDeferred.resolve(mockStats);
            $scope.$apply();
            
            expect($scope.players).toEqual(mockPlayers);
            expect($scope.sessions).toEqual(mockSessions);
            expect($scope.systemStats).toEqual(mockStats);
            expect($scope.loading).toBe(false);
        });
    });
    
    describe('player management', function() {
        beforeEach(function() {
            createController();
            
            $scope.players = [
                { computing_id: 'user1', first_name: 'John', last_name: 'Doe', total_winnings: 100.00, is_admin: false },
                { computing_id: 'user2', first_name: 'Jane', last_name: 'Smith', total_winnings: 200.00, is_admin: false }
            ];
        });
        
        it('should select player for editing', function() {
            var player = $scope.players[0];
            
            $scope.selectPlayer(player);
            
            expect($scope.selectedPlayer).toEqual(player);
            expect($scope.editingPlayer).toEqual(angular.copy(player));
        });
        
        it('should update player successfully', function() {
            var player = $scope.players[0];
            $scope.selectedPlayer = player;
            $scope.editingPlayer = {
                computing_id: 'user1',
                first_name: 'Updated',
                last_name: 'Name',
                total_winnings: 150.00,
                is_admin: true
            };
            
            var deferred = $q.defer();
            AdminService.updatePlayer.and.returnValue(deferred.promise);
            
            $scope.updatePlayer();
            
            expect(AdminService.updatePlayer).toHaveBeenCalledWith('user1', $scope.editingPlayer);
            
            deferred.resolve($scope.editingPlayer);
            $scope.$apply();
            
            expect($scope.players[0]).toEqual($scope.editingPlayer);
            expect($scope.selectedPlayer).toBeNull();
            expect($scope.editingPlayer).toBeNull();
        });
        
        it('should handle player update errors', function() {
            var player = $scope.players[0];
            $scope.selectedPlayer = player;
            $scope.editingPlayer = angular.copy(player);
            
            var deferred = $q.defer();
            AdminService.updatePlayer.and.returnValue(deferred.promise);
            
            $scope.updatePlayer();
            
            deferred.reject({ error: 'Update failed' });
            $scope.$apply();
            
            expect($scope.error).toContain('Update failed');
        });
        
        it('should delete player with confirmation', function() {
            var player = $scope.players[0];
            spyOn(window, 'confirm').and.returnValue(true);
            
            var deferred = $q.defer();
            AdminService.deletePlayer.and.returnValue(deferred.promise);
            
            $scope.deletePlayer(player);
            
            expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this player?');
            expect(AdminService.deletePlayer).toHaveBeenCalledWith('user1');
            
            deferred.resolve();
            $scope.$apply();
            
            expect($scope.players.length).toBe(1);
            expect($scope.players[0].computing_id).toBe('user2');
        });
        
        it('should not delete player without confirmation', function() {
            var player = $scope.players[0];
            spyOn(window, 'confirm').and.returnValue(false);
            
            $scope.deletePlayer(player);
            
            expect(AdminService.deletePlayer).not.toHaveBeenCalled();
            expect($scope.players.length).toBe(2);
        });
        
        it('should cancel player editing', function() {
            var player = $scope.players[0];
            $scope.selectedPlayer = player;
            $scope.editingPlayer = angular.copy(player);
            
            $scope.cancelPlayerEdit();
            
            expect($scope.selectedPlayer).toBeNull();
            expect($scope.editingPlayer).toBeNull();
        });
    });
    
    describe('session management', function() {
        beforeEach(function() {
            createController();
            
            $scope.sessions = [
                { entry_id: 1, computing_id: 'user1', session_date: '2023-12-01', net_winnings: 50.00, is_completed: true },
                { entry_id: 2, computing_id: 'user2', session_date: '2023-12-02', net_winnings: 75.00, is_completed: true }
            ];
        });
        
        it('should select session for editing', function() {
            var session = $scope.sessions[0];
            
            $scope.selectSession(session);
            
            expect($scope.selectedSession).toEqual(session);
            expect($scope.editingSession).toEqual(angular.copy(session));
        });
        
        it('should update session successfully', function() {
            var session = $scope.sessions[0];
            $scope.selectedSession = session;
            $scope.editingSession = {
                entry_id: 1,
                computing_id: 'user1',
                session_date: '2023-12-01',
                start_chips: 250.00,
                end_chips: 350.00,
                net_winnings: 100.00,
                is_completed: true
            };
            
            var deferred = $q.defer();
            AdminService.updateSession.and.returnValue(deferred.promise);
            
            $scope.updateSession();
            
            expect(AdminService.updateSession).toHaveBeenCalledWith(1, $scope.editingSession);
            
            deferred.resolve($scope.editingSession);
            $scope.$apply();
            
            expect($scope.sessions[0]).toEqual($scope.editingSession);
            expect($scope.selectedSession).toBeNull();
            expect($scope.editingSession).toBeNull();
        });
        
        it('should delete session with confirmation', function() {
            var session = $scope.sessions[0];
            spyOn(window, 'confirm').and.returnValue(true);
            
            var deferred = $q.defer();
            AdminService.deleteSession.and.returnValue(deferred.promise);
            
            $scope.deleteSession(session);
            
            expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this session?');
            expect(AdminService.deleteSession).toHaveBeenCalledWith(1);
            
            deferred.resolve();
            $scope.$apply();
            
            expect($scope.sessions.length).toBe(1);
            expect($scope.sessions[0].entry_id).toBe(2);
        });
        
        it('should cancel session editing', function() {
            var session = $scope.sessions[0];
            $scope.selectedSession = session;
            $scope.editingSession = angular.copy(session);
            
            $scope.cancelSessionEdit();
            
            expect($scope.selectedSession).toBeNull();
            expect($scope.editingSession).toBeNull();
        });
    });
    
    describe('tab management', function() {
        beforeEach(function() {
            createController();
        });
        
        it('should switch between tabs', function() {
            expect($scope.activeTab).toBe('players');
            
            $scope.setActiveTab('sessions');
            expect($scope.activeTab).toBe('sessions');
            
            $scope.setActiveTab('stats');
            expect($scope.activeTab).toBe('stats');
        });
        
        it('should check if tab is active', function() {
            expect($scope.isActiveTab('players')).toBe(true);
            expect($scope.isActiveTab('sessions')).toBe(false);
            
            $scope.setActiveTab('sessions');
            expect($scope.isActiveTab('players')).toBe(false);
            expect($scope.isActiveTab('sessions')).toBe(true);
        });
    });
    
    describe('utility functions', function() {
        beforeEach(function() {
            createController();
        });
        
        it('should format currency values', function() {
            expect($scope.formatCurrency(100.50)).toBe('$100.50');
            expect($scope.formatCurrency(-25.75)).toBe('-$25.75');
            expect($scope.formatCurrency(0)).toBe('$0.00');
        });
        
        it('should format dates', function() {
            var date = '2023-12-01';
            var formatted = $scope.formatDate(date);
            
            expect(formatted).toContain('2023');
            expect(formatted).toContain('12');
            expect(formatted).toContain('01');
        });
        
        it('should refresh all data', function() {
            var playersDeferred = $q.defer();
            var sessionsDeferred = $q.defer();
            var statsDeferred = $q.defer();
            
            AdminService.getAllPlayers.and.returnValue(playersDeferred.promise);
            AdminService.getAllSessions.and.returnValue(sessionsDeferred.promise);
            AdminService.getSystemStats.and.returnValue(statsDeferred.promise);
            
            $scope.refreshData();
            
            expect($scope.loading).toBe(true);
            expect(AdminService.getAllPlayers).toHaveBeenCalled();
            expect(AdminService.getAllSessions).toHaveBeenCalled();
            expect(AdminService.getSystemStats).toHaveBeenCalled();
        });
        
        it('should clear errors', function() {
            $scope.error = 'Some error message';
            
            $scope.clearError();
            
            expect($scope.error).toBeNull();
        });
    });
});