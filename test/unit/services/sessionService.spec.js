describe('SessionService', function() {
    var SessionService, $httpBackend, API_BASE_URL;
    
    beforeEach(module('pokerPalApp'));
    
    beforeEach(inject(function(_SessionService_, _$httpBackend_, _API_BASE_URL_) {
        SessionService = _SessionService_;
        $httpBackend = _$httpBackend_;
        API_BASE_URL = _API_BASE_URL_;
    }));
    
    afterEach(function() {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });
    
    describe('createSession', function() {
        it('should create check-in session successfully', function() {
            var sessionData = {
                computing_id: 'test123',
                session_date: '2023-12-01',
                type: 'checkin'
            };
            
            var mockFile = new Blob(['fake image'], { type: 'image/jpeg' });
            
            var createdSession = {
                entry_id: 1,
                computing_id: 'test123',
                session_date: '2023-12-01',
                start_photo_url: '/uploads/start_123.jpg',
                start_chips: 250.00,
                is_completed: false
            };
            
            // Note: For file uploads, we expect FormData
            $httpBackend.expectPOST(API_BASE_URL + '/sessions')
                .respond(201, createdSession);
            
            var result;
            SessionService.createSession(sessionData, mockFile).then(function(session) {
                result = session;
            });
            
            $httpBackend.flush();
            
            expect(result).toEqual(createdSession);
        });
        
        it('should create check-out session successfully', function() {
            var sessionData = {
                computing_id: 'test123',
                session_date: '2023-12-01',
                type: 'checkout'
            };
            
            var mockFile = new Blob(['fake image'], { type: 'image/jpeg' });
            
            var updatedSession = {
                entry_id: 1,
                computing_id: 'test123',
                session_date: '2023-12-01',
                start_photo_url: '/uploads/start_123.jpg',
                start_chips: 250.00,
                end_photo_url: '/uploads/end_123.jpg',
                end_chips: 375.50,
                net_winnings: 125.50,
                is_completed: true
            };
            
            $httpBackend.expectPOST(API_BASE_URL + '/sessions')
                .respond(200, updatedSession);
            
            var result;
            SessionService.createSession(sessionData, mockFile).then(function(session) {
                result = session;
            });
            
            $httpBackend.flush();
            
            expect(result).toEqual(updatedSession);
            expect(result.is_completed).toBe(true);
            expect(result.net_winnings).toBe(125.50);
        });
        
        it('should handle session creation errors', function() {
            var sessionData = {
                computing_id: 'invalid',
                type: 'checkin'
            };
            
            $httpBackend.expectPOST(API_BASE_URL + '/sessions')
                .respond(400, { error: 'Invalid session data' });
            
            var error;
            SessionService.createSession(sessionData, null).catch(function(err) {
                error = err;
            });
            
            $httpBackend.flush();
            
            expect(error.status).toBe(400);
        });
    });
    
    describe('getPlayerSessions', function() {
        it('should fetch player sessions', function() {
            var computingId = 'test123';
            var mockSessions = [
                {
                    entry_id: 1,
                    computing_id: computingId,
                    session_date: '2023-12-01',
                    start_chips: 250.00,
                    end_chips: 375.50,
                    net_winnings: 125.50,
                    is_completed: true
                },
                {
                    entry_id: 2,
                    computing_id: computingId,
                    session_date: '2023-12-02',
                    start_chips: 300.00,
                    is_completed: false
                }
            ];
            
            $httpBackend.expectGET(API_BASE_URL + '/sessions/' + computingId)
                .respond(200, mockSessions);
            
            var result;
            SessionService.getPlayerSessions(computingId).then(function(sessions) {
                result = sessions;
            });
            
            $httpBackend.flush();
            
            expect(result).toEqual(mockSessions);
            expect(result.length).toBe(2);
            expect(result[0].is_completed).toBe(true);
            expect(result[1].is_completed).toBe(false);
        });
        
        it('should handle empty sessions list', function() {
            var computingId = 'newuser123';
            
            $httpBackend.expectGET(API_BASE_URL + '/sessions/' + computingId)
                .respond(200, []);
            
            var result;
            SessionService.getPlayerSessions(computingId).then(function(sessions) {
                result = sessions;
            });
            
            $httpBackend.flush();
            
            expect(result).toEqual([]);
        });
    });
    
    describe('updateSession', function() {
        it('should update session successfully', function() {
            var sessionId = 1;
            var updateData = {
                end_chips: 400.00,
                net_winnings: 150.00
            };
            
            var updatedSession = {
                entry_id: sessionId,
                computing_id: 'test123',
                session_date: '2023-12-01',
                start_chips: 250.00,
                end_chips: 400.00,
                net_winnings: 150.00,
                is_completed: true
            };
            
            $httpBackend.expectPUT(API_BASE_URL + '/sessions/' + sessionId, updateData)
                .respond(200, updatedSession);
            
            var result;
            SessionService.updateSession(sessionId, updateData).then(function(session) {
                result = session;
            });
            
            $httpBackend.flush();
            
            expect(result).toEqual(updatedSession);
        });
        
        it('should handle update errors', function() {
            var sessionId = 999;
            var updateData = { end_chips: -100 };
            
            $httpBackend.expectPUT(API_BASE_URL + '/sessions/' + sessionId, updateData)
                .respond(404, { error: 'Session not found' });
            
            var error;
            SessionService.updateSession(sessionId, updateData).catch(function(err) {
                error = err;
            });
            
            $httpBackend.flush();
            
            expect(error.status).toBe(404);
        });
    });
    
    describe('getCurrentSession', function() {
        it('should find incomplete session for player', function() {
            var computingId = 'test123';
            var mockSessions = [
                {
                    entry_id: 1,
                    computing_id: computingId,
                    session_date: '2023-12-01',
                    start_chips: 250.00,
                    is_completed: false
                }
            ];
            
            $httpBackend.expectGET(API_BASE_URL + '/sessions/' + computingId)
                .respond(200, mockSessions);
            
            var result;
            SessionService.getCurrentSession(computingId).then(function(session) {
                result = session;
            });
            
            $httpBackend.flush();
            
            expect(result).toEqual(mockSessions[0]);
            expect(result.is_completed).toBe(false);
        });
        
        it('should return null when no incomplete session exists', function() {
            var computingId = 'test123';
            var mockSessions = [
                {
                    entry_id: 1,
                    computing_id: computingId,
                    session_date: '2023-12-01',
                    start_chips: 250.00,
                    end_chips: 300.00,
                    is_completed: true
                }
            ];
            
            $httpBackend.expectGET(API_BASE_URL + '/sessions/' + computingId)
                .respond(200, mockSessions);
            
            var result;
            SessionService.getCurrentSession(computingId).then(function(session) {
                result = session;
            });
            
            $httpBackend.flush();
            
            expect(result).toBeNull();
        });
    });
});