describe('LeaderboardController', function() {
    var $controller, $scope, LeaderboardService, AuthService, $q, $rootScope;
    
    beforeEach(module('pokerPalApp'));
    
    beforeEach(inject(function(_$controller_, _$rootScope_, _$q_) {
        $controller = _$controller_;
        $rootScope = _$rootScope_;
        $scope = $rootScope.$new();
        $q = _$q_;
        
        // Mock services
        LeaderboardService = {
            getLeaderboard: jasmine.createSpy('getLeaderboard').and.returnValue($q.defer().promise)
        };
        
        AuthService = {
            getCurrentUser: jasmine.createSpy('getCurrentUser').and.returnValue({
                computing_id: 'test123',
                first_name: 'Test',
                last_name: 'User'
            })
        };
    }));
    
    function createController() {
        return $controller('LeaderboardController', {
            $scope: $scope,
            LeaderboardService: LeaderboardService,
            AuthService: AuthService
        });
    }
    
    describe('initialization', function() {
        it('should initialize with default values', function() {
            createController();
            
            expect($scope.leaderboard).toEqual([]);
            expect($scope.loading).toBe(true);
            expect($scope.error).toBeNull();
            expect($scope.currentUser).toEqual({
                computing_id: 'test123',
                first_name: 'Test',
                last_name: 'User'
            });
        });
        
        it('should load leaderboard data on initialization', function() {
            var deferred = $q.defer();
            LeaderboardService.getLeaderboard.and.returnValue(deferred.promise);
            
            createController();
            
            expect(LeaderboardService.getLeaderboard).toHaveBeenCalled();
            expect($scope.loading).toBe(true);
            
            var mockLeaderboard = [
                { first_name: 'John', last_name: 'Doe', total_winnings: 500.00 },
                { first_name: 'Jane', last_name: 'Smith', total_winnings: 350.25 },
                { first_name: 'Test', last_name: 'User', total_winnings: 200.50 }
            ];
            
            deferred.resolve(mockLeaderboard);
            $scope.$apply();
            
            expect($scope.leaderboard).toEqual(mockLeaderboard);
            expect($scope.loading).toBe(false);
        });
        
        it('should handle leaderboard loading errors', function() {
            var deferred = $q.defer();
            LeaderboardService.getLeaderboard.and.returnValue(deferred.promise);
            
            createController();
            
            deferred.reject({ error: 'Failed to load leaderboard' });
            $scope.$apply();
            
            expect($scope.loading).toBe(false);
            expect($scope.error).toContain('Failed to load leaderboard');
        });
    });
    
    describe('leaderboard functionality', function() {
        beforeEach(function() {
            createController();
            
            $scope.leaderboard = [
                { first_name: 'John', last_name: 'Doe', total_winnings: 500.00 },
                { first_name: 'Jane', last_name: 'Smith', total_winnings: 350.25 },
                { first_name: 'Test', last_name: 'User', total_winnings: 200.50 },
                { first_name: 'Bob', last_name: 'Johnson', total_winnings: -50.00 }
            ];
        });
        
        it('should get player rank correctly', function() {
            expect($scope.getPlayerRank('John', 'Doe')).toBe(1);
            expect($scope.getPlayerRank('Jane', 'Smith')).toBe(2);
            expect($scope.getPlayerRank('Test', 'User')).toBe(3);
            expect($scope.getPlayerRank('Bob', 'Johnson')).toBe(4);
            expect($scope.getPlayerRank('Nonexistent', 'Player')).toBe(-1);
        });
        
        it('should identify current user in leaderboard', function() {
            expect($scope.isCurrentUser('Test', 'User')).toBe(true);
            expect($scope.isCurrentUser('John', 'Doe')).toBe(false);
        });
        
        it('should format winnings correctly', function() {
            expect($scope.formatWinnings(500.00)).toBe('$500.00');
            expect($scope.formatWinnings(350.25)).toBe('$350.25');
            expect($scope.formatWinnings(-50.00)).toBe('-$50.00');
            expect($scope.formatWinnings(0)).toBe('$0.00');
        });
        
        it('should get winnings class for styling', function() {
            expect($scope.getWinningsClass(500.00)).toBe('positive');
            expect($scope.getWinningsClass(0)).toBe('neutral');
            expect($scope.getWinningsClass(-50.00)).toBe('negative');
        });
        
        it('should get rank class for styling', function() {
            expect($scope.getRankClass(1)).toBe('rank-1');
            expect($scope.getRankClass(2)).toBe('rank-2');
            expect($scope.getRankClass(3)).toBe('rank-3');
            expect($scope.getRankClass(4)).toBe('rank-other');
        });
        
        it('should check if leaderboard has data', function() {
            expect($scope.hasLeaderboardData()).toBe(true);
            
            $scope.leaderboard = [];
            expect($scope.hasLeaderboardData()).toBe(false);
        });
        
        it('should get current user position', function() {
            var position = $scope.getCurrentUserPosition();
            
            expect(position.rank).toBe(3);
            expect(position.player).toEqual({
                first_name: 'Test',
                last_name: 'User',
                total_winnings: 200.50
            });
        });
        
        it('should return null for current user position when not found', function() {
            AuthService.getCurrentUser.and.returnValue({
                computing_id: 'notfound',
                first_name: 'Not',
                last_name: 'Found'
            });
            
            var position = $scope.getCurrentUserPosition();
            
            expect(position).toBeNull();
        });
    });
    
    describe('refresh functionality', function() {
        beforeEach(function() {
            createController();
        });
        
        it('should refresh leaderboard data', function() {
            var deferred = $q.defer();
            LeaderboardService.getLeaderboard.and.returnValue(deferred.promise);
            
            $scope.refreshLeaderboard();
            
            expect($scope.loading).toBe(true);
            expect($scope.error).toBeNull();
            expect(LeaderboardService.getLeaderboard).toHaveBeenCalled();
            
            var updatedLeaderboard = [
                { first_name: 'Updated', last_name: 'Player', total_winnings: 600.00 }
            ];
            
            deferred.resolve(updatedLeaderboard);
            $scope.$apply();
            
            expect($scope.leaderboard).toEqual(updatedLeaderboard);
            expect($scope.loading).toBe(false);
        });
        
        it('should handle refresh errors', function() {
            var deferred = $q.defer();
            LeaderboardService.getLeaderboard.and.returnValue(deferred.promise);
            
            $scope.refreshLeaderboard();
            
            deferred.reject({ error: 'Refresh failed' });
            $scope.$apply();
            
            expect($scope.loading).toBe(false);
            expect($scope.error).toContain('Refresh failed');
        });
    });
    
    describe('filtering and sorting', function() {
        beforeEach(function() {
            createController();
            
            $scope.leaderboard = [
                { first_name: 'Alice', last_name: 'Anderson', total_winnings: 300.00 },
                { first_name: 'Bob', last_name: 'Brown', total_winnings: 150.00 },
                { first_name: 'Charlie', last_name: 'Clark', total_winnings: -25.00 },
                { first_name: 'Diana', last_name: 'Davis', total_winnings: 0.00 }
            ];
        });
        
        it('should filter positive winnings only', function() {
            var positiveWinners = $scope.getPositiveWinners();
            
            expect(positiveWinners.length).toBe(2);
            expect(positiveWinners[0].first_name).toBe('Alice');
            expect(positiveWinners[1].first_name).toBe('Bob');
        });
        
        it('should get top N players', function() {
            var top2 = $scope.getTopPlayers(2);
            
            expect(top2.length).toBe(2);
            expect(top2[0].first_name).toBe('Alice');
            expect(top2[1].first_name).toBe('Bob');
        });
        
        it('should calculate total winnings across all players', function() {
            var total = $scope.getTotalWinnings();
            
            expect(total).toBe(425.00); // 300 + 150 + (-25) + 0
        });
        
        it('should get average winnings', function() {
            var average = $scope.getAverageWinnings();
            
            expect(average).toBe(106.25); // 425 / 4
        });
        
        it('should handle empty leaderboard for calculations', function() {
            $scope.leaderboard = [];
            
            expect($scope.getTotalWinnings()).toBe(0);
            expect($scope.getAverageWinnings()).toBe(0);
            expect($scope.getPositiveWinners()).toEqual([]);
            expect($scope.getTopPlayers(5)).toEqual([]);
        });
    });
});