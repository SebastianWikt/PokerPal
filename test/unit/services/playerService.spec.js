describe('PlayerService', function() {
    var PlayerService, $httpBackend, API_BASE_URL;
    
    beforeEach(module('pokerPalApp'));
    
    beforeEach(inject(function(_PlayerService_, _$httpBackend_, _API_BASE_URL_) {
        PlayerService = _PlayerService_;
        $httpBackend = _$httpBackend_;
        API_BASE_URL = _API_BASE_URL_;
    }));
    
    afterEach(function() {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });
    
    describe('getPlayer', function() {
        it('should fetch player by computing ID', function() {
            var computingId = 'test123';
            var mockPlayer = {
                computing_id: computingId,
                first_name: 'Test',
                last_name: 'User',
                total_winnings: 100.50
            };
            
            $httpBackend.expectGET(API_BASE_URL + '/players/' + computingId)
                .respond(200, mockPlayer);
            
            var result;
            PlayerService.getPlayer(computingId).then(function(player) {
                result = player;
            });
            
            $httpBackend.flush();
            
            expect(result).toEqual(mockPlayer);
        });
        
        it('should handle player not found', function() {
            var computingId = 'notfound123';
            
            $httpBackend.expectGET(API_BASE_URL + '/players/' + computingId)
                .respond(404, { error: 'Player not found' });
            
            var error;
            PlayerService.getPlayer(computingId).catch(function(err) {
                error = err;
            });
            
            $httpBackend.flush();
            
            expect(error.status).toBe(404);
        });
    });
    
    describe('createPlayer', function() {
        it('should create new player successfully', function() {
            var playerData = {
                computing_id: 'newuser123',
                first_name: 'New',
                last_name: 'User',
                years_of_experience: 2,
                level: 'Intermediate',
                major: 'Computer Science'
            };
            
            var createdPlayer = Object.assign({}, playerData, {
                total_winnings: 0.00,
                created_at: '2023-01-01T00:00:00Z'
            });
            
            $httpBackend.expectPOST(API_BASE_URL + '/players', playerData)
                .respond(201, createdPlayer);
            
            var result;
            PlayerService.createPlayer(playerData).then(function(player) {
                result = player;
            });
            
            $httpBackend.flush();
            
            expect(result).toEqual(createdPlayer);
        });
        
        it('should handle validation errors', function() {
            var invalidData = {
                computing_id: '',
                first_name: 'Test'
            };
            
            var errorResponse = {
                error: 'Validation failed',
                details: ['Computing ID is required', 'Last name is required']
            };
            
            $httpBackend.expectPOST(API_BASE_URL + '/players', invalidData)
                .respond(400, errorResponse);
            
            var error;
            PlayerService.createPlayer(invalidData).catch(function(err) {
                error = err;
            });
            
            $httpBackend.flush();
            
            expect(error.status).toBe(400);
            expect(error.data).toEqual(errorResponse);
        });
    });
    
    describe('updatePlayer', function() {
        it('should update player successfully', function() {
            var computingId = 'test123';
            var updateData = {
                first_name: 'Updated',
                years_of_experience: 5
            };
            
            var updatedPlayer = {
                computing_id: computingId,
                first_name: 'Updated',
                last_name: 'User',
                years_of_experience: 5,
                level: 'Advanced',
                major: 'Computer Science',
                total_winnings: 150.75
            };
            
            $httpBackend.expectPUT(API_BASE_URL + '/players/' + computingId, updateData)
                .respond(200, updatedPlayer);
            
            var result;
            PlayerService.updatePlayer(computingId, updateData).then(function(player) {
                result = player;
            });
            
            $httpBackend.flush();
            
            expect(result).toEqual(updatedPlayer);
        });
        
        it('should handle update errors', function() {
            var computingId = 'test123';
            var updateData = { first_name: '' };
            
            $httpBackend.expectPUT(API_BASE_URL + '/players/' + computingId, updateData)
                .respond(400, { error: 'First name cannot be empty' });
            
            var error;
            PlayerService.updatePlayer(computingId, updateData).catch(function(err) {
                error = err;
            });
            
            $httpBackend.flush();
            
            expect(error.status).toBe(400);
        });
    });
    
    describe('getLeaderboard', function() {
        it('should fetch leaderboard data', function() {
            var mockLeaderboard = [
                { first_name: 'John', last_name: 'Doe', total_winnings: 500.00 },
                { first_name: 'Jane', last_name: 'Smith', total_winnings: 350.25 },
                { first_name: 'Bob', last_name: 'Johnson', total_winnings: 200.50 }
            ];
            
            $httpBackend.expectGET(API_BASE_URL + '/players/leaderboard')
                .respond(200, mockLeaderboard);
            
            var result;
            PlayerService.getLeaderboard().then(function(leaderboard) {
                result = leaderboard;
            });
            
            $httpBackend.flush();
            
            expect(result).toEqual(mockLeaderboard);
            expect(result.length).toBe(3);
            expect(result[0].total_winnings).toBe(500.00);
        });
        
        it('should handle empty leaderboard', function() {
            $httpBackend.expectGET(API_BASE_URL + '/players/leaderboard')
                .respond(200, []);
            
            var result;
            PlayerService.getLeaderboard().then(function(leaderboard) {
                result = leaderboard;
            });
            
            $httpBackend.flush();
            
            expect(result).toEqual([]);
        });
    });
});