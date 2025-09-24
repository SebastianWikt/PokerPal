describe('ProfileController', function() {
    var $controller, $scope, $location, $routeParams, PlayerService, AuthService, ValidationService, ErrorService, $q, $rootScope;
    
    beforeEach(module('pokerPalApp'));
    
    beforeEach(inject(function(_$controller_, _$rootScope_, _$location_, _$q_) {
        $controller = _$controller_;
        $rootScope = _$rootScope_;
        $scope = $rootScope.$new();
        $location = _$location_;
        $q = _$q_;
        
        // Mock route params
        $routeParams = {
            computing_id: 'test123'
        };
        
        // Mock services
        PlayerService = {
            getPlayer: jasmine.createSpy('getPlayer').and.returnValue($q.defer().promise),
            createPlayer: jasmine.createSpy('createPlayer').and.returnValue($q.defer().promise),
            updatePlayer: jasmine.createSpy('updatePlayer').and.returnValue($q.defer().promise)
        };
        
        AuthService = {
            getCurrentUser: jasmine.createSpy('getCurrentUser').and.returnValue({
                computing_id: 'test123',
                first_name: 'Test',
                last_name: 'User'
            }),
            refreshUser: jasmine.createSpy('refreshUser').and.returnValue($q.defer().promise)
        };
        
        ValidationService = {
            validateForm: jasmine.createSpy('validateForm').and.returnValue({ isValid: true, errors: [] }),
            displayErrors: jasmine.createSpy('displayErrors'),
            schemas: {
                player: {}
            }
        };
        
        ErrorService = {
            clearErrors: jasmine.createSpy('clearErrors')
        };
    }));
    
    function createController() {
        return $controller('ProfileController', {
            $scope: $scope,
            $location: $location,
            $routeParams: $routeParams,
            PlayerService: PlayerService,
            AuthService: AuthService,
            ValidationService: ValidationService,
            ErrorService: ErrorService
        });
    }
    
    describe('initialization', function() {
        it('should initialize with empty player data for creation', function() {
            spyOn($location, 'path').and.returnValue('/profile/create');
            
            createController();
            
            expect($scope.isEditMode).toBe(false);
            expect($scope.playerData.computing_id).toBe('');
            expect($scope.playerData.first_name).toBe('');
            expect($scope.loading).toBe(false);
        });
        
        it('should load existing player data for editing', function() {
            spyOn($location, 'path').and.returnValue('/profile/edit');
            
            var deferred = $q.defer();
            PlayerService.getPlayer.and.returnValue(deferred.promise);
            
            createController();
            
            expect($scope.isEditMode).toBe(true);
            expect(PlayerService.getPlayer).toHaveBeenCalledWith('test123');
            
            var mockPlayer = {
                computing_id: 'test123',
                first_name: 'Test',
                last_name: 'User',
                years_of_experience: 3,
                level: 'Intermediate',
                major: 'Computer Science'
            };
            
            deferred.resolve(mockPlayer);
            $scope.$apply();
            
            expect($scope.playerData).toEqual(mockPlayer);
        });
        
        it('should handle computing_id from query params', function() {
            spyOn($location, 'path').and.returnValue('/profile/create');
            spyOn($location, 'search').and.returnValue({ computing_id: 'newuser123' });
            
            createController();
            
            expect($scope.playerData.computing_id).toBe('newuser123');
        });
    });
    
    describe('saveProfile function', function() {
        beforeEach(function() {
            createController();
        });
        
        it('should create new player successfully', function() {
            $scope.isEditMode = false;
            $scope.playerData = {
                computing_id: 'newuser123',
                first_name: 'New',
                last_name: 'User',
                years_of_experience: 2,
                level: 'Beginner',
                major: 'Mathematics'
            };
            
            var deferred = $q.defer();
            PlayerService.createPlayer.and.returnValue(deferred.promise);
            spyOn($location, 'path');
            
            $scope.saveProfile();
            
            expect(ErrorService.clearErrors).toHaveBeenCalled();
            expect(ValidationService.validateForm).toHaveBeenCalled();
            expect($scope.loading).toBe(true);
            expect(PlayerService.createPlayer).toHaveBeenCalledWith($scope.playerData);
            
            deferred.resolve($scope.playerData);
            $scope.$apply();
            
            expect($location.path).toHaveBeenCalledWith('/home');
        });
        
        it('should update existing player successfully', function() {
            $scope.isEditMode = true;
            $scope.playerData = {
                computing_id: 'test123',
                first_name: 'Updated',
                last_name: 'User',
                years_of_experience: 5,
                level: 'Advanced',
                major: 'Computer Science'
            };
            
            var deferred = $q.defer();
            PlayerService.updatePlayer.and.returnValue(deferred.promise);
            spyOn($location, 'path');
            
            $scope.saveProfile();
            
            expect(PlayerService.updatePlayer).toHaveBeenCalledWith('test123', $scope.playerData);
            
            deferred.resolve($scope.playerData);
            $scope.$apply();
            
            expect($location.path).toHaveBeenCalledWith('/home');
        });
        
        it('should handle validation errors', function() {
            ValidationService.validateForm.and.returnValue({
                isValid: false,
                errors: ['First name is required']
            });
            
            $scope.saveProfile();
            
            expect(ValidationService.displayErrors).toHaveBeenCalled();
            expect(PlayerService.createPlayer).not.toHaveBeenCalled();
            expect(PlayerService.updatePlayer).not.toHaveBeenCalled();
        });
        
        it('should handle save errors', function() {
            $scope.isEditMode = false;
            
            var deferred = $q.defer();
            PlayerService.createPlayer.and.returnValue(deferred.promise);
            
            $scope.saveProfile();
            
            deferred.reject({ status: 409, data: { error: 'Player already exists' } });
            $scope.$apply();
            
            expect($scope.loading).toBe(false);
            expect($scope.error).toContain('Player already exists');
        });
    });
    
    describe('validation functions', function() {
        beforeEach(function() {
            createController();
        });
        
        it('should validate years of experience', function() {
            // Valid values
            $scope.playerData.years_of_experience = 5;
            expect($scope.validateYearsOfExperience()).toBe(true);
            
            $scope.playerData.years_of_experience = 0;
            expect($scope.validateYearsOfExperience()).toBe(true);
            
            // Invalid values
            $scope.playerData.years_of_experience = -1;
            expect($scope.validateYearsOfExperience()).toBe(false);
            
            $scope.playerData.years_of_experience = 51;
            expect($scope.validateYearsOfExperience()).toBe(false);
        });
        
        it('should validate level selection', function() {
            var validLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
            
            validLevels.forEach(function(level) {
                $scope.playerData.level = level;
                expect($scope.validateLevel()).toBe(true);
            });
            
            $scope.playerData.level = 'Invalid Level';
            expect($scope.validateLevel()).toBe(false);
        });
        
        it('should validate name fields', function() {
            // Valid names
            $scope.playerData.first_name = 'John';
            expect($scope.validateName('first_name')).toBe(true);
            
            $scope.playerData.last_name = 'Doe-Smith';
            expect($scope.validateName('last_name')).toBe(true);
            
            // Invalid names
            $scope.playerData.first_name = 'J0hn'; // Contains number
            expect($scope.validateName('first_name')).toBe(false);
            
            $scope.playerData.last_name = ''; // Empty
            expect($scope.validateName('last_name')).toBe(false);
        });
    });
    
    describe('utility functions', function() {
        beforeEach(function() {
            createController();
        });
        
        it('should get available levels', function() {
            var levels = $scope.getAvailableLevels();
            
            expect(levels).toContain('Beginner');
            expect(levels).toContain('Intermediate');
            expect(levels).toContain('Advanced');
            expect(levels).toContain('Expert');
        });
        
        it('should check if form is valid', function() {
            $scope.playerData = {
                computing_id: 'test123',
                first_name: 'Test',
                last_name: 'User',
                years_of_experience: 3,
                level: 'Intermediate',
                major: 'Computer Science'
            };
            
            expect($scope.isFormValid()).toBe(true);
            
            $scope.playerData.first_name = '';
            expect($scope.isFormValid()).toBe(false);
        });
        
        it('should clear errors when user starts typing', function() {
            $scope.error = 'Some error message';
            
            $scope.clearError();
            
            expect($scope.error).toBeNull();
        });
        
        it('should cancel and navigate back', function() {
            spyOn($location, 'path');
            
            $scope.cancel();
            
            expect($location.path).toHaveBeenCalledWith('/home');
        });
    });
});