describe('SessionController', function() {
    var $controller, $scope, $location, SessionService, AuthService, ComputerVisionService, ValidationService, ErrorService, $q, $rootScope;
    
    beforeEach(module('pokerPalApp'));
    
    beforeEach(inject(function(_$controller_, _$rootScope_, _$location_, _$q_) {
        $controller = _$controller_;
        $rootScope = _$rootScope_;
        $scope = $rootScope.$new();
        $location = _$location_;
        $q = _$q_;
        
        // Mock services
        SessionService = {
            getCurrentSession: jasmine.createSpy('getCurrentSession').and.returnValue($q.defer().promise),
            createSession: jasmine.createSpy('createSession').and.returnValue($q.defer().promise),
            getPlayerSessions: jasmine.createSpy('getPlayerSessions').and.returnValue($q.defer().promise)
        };
        
        AuthService = {
            getCurrentUser: jasmine.createSpy('getCurrentUser').and.returnValue({
                computing_id: 'test123',
                first_name: 'Test',
                last_name: 'User'
            })
        };
        
        ComputerVisionService = {
            analyzeImage: jasmine.createSpy('analyzeImage').and.returnValue($q.defer().promise)
        };
        
        ValidationService = {
            validateForm: jasmine.createSpy('validateForm').and.returnValue({ isValid: true, errors: [] }),
            displayErrors: jasmine.createSpy('displayErrors')
        };
        
        ErrorService = {
            clearErrors: jasmine.createSpy('clearErrors')
        };
    }));
    
    function createController() {
        return $controller('SessionController', {
            $scope: $scope,
            $location: $location,
            SessionService: SessionService,
            AuthService: AuthService,
            ComputerVisionService: ComputerVisionService,
            ValidationService: ValidationService,
            ErrorService: ErrorService
        });
    }
    
    describe('initialization', function() {
        it('should initialize with default values', function() {
            createController();
            
            expect($scope.currentUser).toEqual({
                computing_id: 'test123',
                first_name: 'Test',
                last_name: 'User'
            });
            expect($scope.currentSession).toBeNull();
            expect($scope.sessionType).toBe('checkin');
            expect($scope.loading).toBe(false);
            expect($scope.analyzing).toBe(false);
        });
        
        it('should load current session on initialization', function() {
            var deferred = $q.defer();
            SessionService.getCurrentSession.and.returnValue(deferred.promise);
            
            createController();
            
            expect(SessionService.getCurrentSession).toHaveBeenCalledWith('test123');
            
            var mockSession = {
                entry_id: 1,
                computing_id: 'test123',
                session_date: '2023-12-01',
                start_chips: 250.00,
                is_completed: false
            };
            
            deferred.resolve(mockSession);
            $scope.$apply();
            
            expect($scope.currentSession).toEqual(mockSession);
            expect($scope.sessionType).toBe('checkout');
        });
        
        it('should set session type to checkin when no current session', function() {
            var deferred = $q.defer();
            SessionService.getCurrentSession.and.returnValue(deferred.promise);
            
            createController();
            
            deferred.resolve(null);
            $scope.$apply();
            
            expect($scope.currentSession).toBeNull();
            expect($scope.sessionType).toBe('checkin');
        });
    });
    
    describe('photo upload and analysis', function() {
        beforeEach(function() {
            createController();
        });
        
        it('should handle photo selection', function() {
            var mockFile = new Blob(['fake image'], { type: 'image/jpeg' });
            var mockEvent = {
                target: {
                    files: [mockFile]
                }
            };
            
            $scope.onPhotoSelected(mockEvent);
            
            expect($scope.selectedPhoto).toBe(mockFile);
            expect($scope.photoPreview).toBeDefined();
        });
        
        it('should analyze photo and extract chip data', function() {
            var mockFile = new Blob(['fake image'], { type: 'image/jpeg' });
            $scope.selectedPhoto = mockFile;
            
            var deferred = $q.defer();
            ComputerVisionService.analyzeImage.and.returnValue(deferred.promise);
            
            $scope.analyzePhoto();
            
            expect($scope.analyzing).toBe(true);
            expect(ComputerVisionService.analyzeImage).toHaveBeenCalledWith(mockFile);
            
            var mockAnalysis = {
                chipCounts: { red: 10, blue: 5, green: 2 },
                totalValue: 175.00,
                confidence: 0.85
            };
            
            deferred.resolve(mockAnalysis);
            $scope.$apply();
            
            expect($scope.analyzing).toBe(false);
            expect($scope.chipAnalysis).toEqual(mockAnalysis);
            expect($scope.sessionData.chips).toBe(175.00);
        });
        
        it('should handle photo analysis errors', function() {
            var mockFile = new Blob(['fake image'], { type: 'image/jpeg' });
            $scope.selectedPhoto = mockFile;
            
            var deferred = $q.defer();
            ComputerVisionService.analyzeImage.and.returnValue(deferred.promise);
            
            $scope.analyzePhoto();
            
            deferred.reject({ error: 'Analysis failed' });
            $scope.$apply();
            
            expect($scope.analyzing).toBe(false);
            expect($scope.error).toContain('Analysis failed');
        });
        
        it('should validate photo before analysis', function() {
            $scope.selectedPhoto = null;
            
            $scope.analyzePhoto();
            
            expect($scope.error).toContain('Please select a photo');
            expect(ComputerVisionService.analyzeImage).not.toHaveBeenCalled();
        });
    });
    
    describe('session management', function() {
        beforeEach(function() {
            createController();
        });
        
        it('should create check-in session successfully', function() {
            $scope.sessionType = 'checkin';
            $scope.sessionData = {
                session_date: '2023-12-01',
                chips: 250.00
            };
            $scope.selectedPhoto = new Blob(['fake image'], { type: 'image/jpeg' });
            
            var deferred = $q.defer();
            SessionService.createSession.and.returnValue(deferred.promise);
            spyOn($location, 'path');
            
            $scope.submitSession();
            
            expect($scope.loading).toBe(true);
            expect(SessionService.createSession).toHaveBeenCalledWith({
                computing_id: 'test123',
                session_date: '2023-12-01',
                type: 'checkin'
            }, $scope.selectedPhoto);
            
            var createdSession = {
                entry_id: 1,
                computing_id: 'test123',
                session_date: '2023-12-01',
                start_chips: 250.00,
                is_completed: false
            };
            
            deferred.resolve(createdSession);
            $scope.$apply();
            
            expect($scope.loading).toBe(false);
            expect($location.path).toHaveBeenCalledWith('/home');
        });
        
        it('should create check-out session successfully', function() {
            $scope.sessionType = 'checkout';
            $scope.currentSession = {
                entry_id: 1,
                computing_id: 'test123',
                start_chips: 250.00
            };
            $scope.sessionData = {
                session_date: '2023-12-01',
                chips: 375.50
            };
            $scope.selectedPhoto = new Blob(['fake image'], { type: 'image/jpeg' });
            
            var deferred = $q.defer();
            SessionService.createSession.and.returnValue(deferred.promise);
            spyOn($location, 'path');
            
            $scope.submitSession();
            
            expect(SessionService.createSession).toHaveBeenCalledWith({
                computing_id: 'test123',
                session_date: '2023-12-01',
                type: 'checkout'
            }, $scope.selectedPhoto);
            
            var completedSession = {
                entry_id: 1,
                computing_id: 'test123',
                session_date: '2023-12-01',
                start_chips: 250.00,
                end_chips: 375.50,
                net_winnings: 125.50,
                is_completed: true
            };
            
            deferred.resolve(completedSession);
            $scope.$apply();
            
            expect($scope.loading).toBe(false);
            expect($location.path).toHaveBeenCalledWith('/home');
        });
        
        it('should validate session data before submission', function() {
            ValidationService.validateForm.and.returnValue({
                isValid: false,
                errors: ['Session date is required']
            });
            
            $scope.submitSession();
            
            expect(ValidationService.displayErrors).toHaveBeenCalled();
            expect(SessionService.createSession).not.toHaveBeenCalled();
        });
        
        it('should require photo for session submission', function() {
            $scope.selectedPhoto = null;
            
            $scope.submitSession();
            
            expect($scope.error).toContain('Photo is required');
            expect(SessionService.createSession).not.toHaveBeenCalled();
        });
        
        it('should handle session creation errors', function() {
            $scope.sessionType = 'checkin';
            $scope.sessionData = { session_date: '2023-12-01', chips: 250.00 };
            $scope.selectedPhoto = new Blob(['fake image'], { type: 'image/jpeg' });
            
            var deferred = $q.defer();
            SessionService.createSession.and.returnValue(deferred.promise);
            
            $scope.submitSession();
            
            deferred.reject({ status: 400, data: { error: 'Invalid session data' } });
            $scope.$apply();
            
            expect($scope.loading).toBe(false);
            expect($scope.error).toContain('Invalid session data');
        });
    });
    
    describe('utility functions', function() {
        beforeEach(function() {
            createController();
        });
        
        it('should calculate net winnings correctly', function() {
            $scope.currentSession = { start_chips: 250.00 };
            $scope.sessionData = { chips: 375.50 };
            
            var netWinnings = $scope.calculateNetWinnings();
            
            expect(netWinnings).toBe(125.50);
        });
        
        it('should handle negative winnings', function() {
            $scope.currentSession = { start_chips: 300.00 };
            $scope.sessionData = { chips: 200.00 };
            
            var netWinnings = $scope.calculateNetWinnings();
            
            expect(netWinnings).toBe(-100.00);
        });
        
        it('should check if form is valid', function() {
            $scope.sessionData = {
                session_date: '2023-12-01',
                chips: 250.00
            };
            $scope.selectedPhoto = new Blob(['fake image'], { type: 'image/jpeg' });
            
            expect($scope.isFormValid()).toBe(true);
            
            $scope.sessionData.session_date = '';
            expect($scope.isFormValid()).toBe(false);
            
            $scope.sessionData.session_date = '2023-12-01';
            $scope.selectedPhoto = null;
            expect($scope.isFormValid()).toBe(false);
        });
        
        it('should clear errors', function() {
            $scope.error = 'Some error message';
            
            $scope.clearError();
            
            expect($scope.error).toBeNull();
        });
        
        it('should cancel and navigate back', function() {
            spyOn($location, 'path');
            
            $scope.cancel();
            
            expect($location.path).toHaveBeenCalledWith('/home');
        });
        
        it('should get today\'s date in correct format', function() {
            var today = $scope.getTodayDate();
            var expectedDate = new Date().toISOString().split('T')[0];
            
            expect(today).toBe(expectedDate);
        });
    });
});