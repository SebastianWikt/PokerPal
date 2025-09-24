describe('photoUpload directive', function() {
    var $compile, $rootScope, $scope, element;
    
    beforeEach(module('pokerPalApp'));
    
    beforeEach(inject(function(_$compile_, _$rootScope_) {
        $compile = _$compile_;
        $rootScope = _$rootScope_;
        $scope = $rootScope.$new();
        
        // Mock scope functions
        $scope.onPhotoSelected = jasmine.createSpy('onPhotoSelected');
        $scope.analyzePhoto = jasmine.createSpy('analyzePhoto');
        $scope.clearPhoto = jasmine.createSpy('clearPhoto');
    }));
    
    function compileDirective(template) {
        if (!template) {
            template = '<photo-upload on-select="onPhotoSelected(file)" on-analyze="analyzePhoto()" on-clear="clearPhoto()"></photo-upload>';
        }
        
        element = $compile(template)($scope);
        $scope.$digest();
        return element;
    }
    
    describe('directive compilation', function() {
        it('should compile and render correctly', function() {
            compileDirective();
            
            expect(element).toBeDefined();
            expect(element.find('input[type="file"]').length).toBe(1);
            expect(element.find('.photo-upload-container').length).toBe(1);
        });
        
        it('should have correct file input attributes', function() {
            compileDirective();
            
            var fileInput = element.find('input[type="file"]');
            expect(fileInput.attr('accept')).toContain('image/*');
            expect(fileInput.attr('capture')).toBe('camera');
        });
        
        it('should show upload area initially', function() {
            compileDirective();
            
            var uploadArea = element.find('.upload-area');
            expect(uploadArea.length).toBe(1);
            expect(uploadArea.hasClass('ng-hide')).toBe(false);
        });
    });
    
    describe('file selection', function() {
        beforeEach(function() {
            compileDirective();
        });
        
        it('should handle file selection', function() {
            var fileInput = element.find('input[type="file"]');
            var mockFile = new Blob(['fake image'], { type: 'image/jpeg' });
            
            // Mock file input change event
            var mockEvent = {
                target: {
                    files: [mockFile]
                }
            };
            
            // Trigger file selection
            fileInput.triggerHandler('change', mockEvent);
            
            expect($scope.onPhotoSelected).toHaveBeenCalled();
        });
        
        it('should validate file type on selection', function() {
            var fileInput = element.find('input[type="file"]');
            var invalidFile = new Blob(['not an image'], { type: 'text/plain' });
            
            var mockEvent = {
                target: {
                    files: [invalidFile]
                }
            };
            
            fileInput.triggerHandler('change', mockEvent);
            
            // Should show error for invalid file type
            var errorMessage = element.find('.error-message');
            expect(errorMessage.length).toBe(1);
            expect(errorMessage.text()).toContain('Please select a valid image file');
        });
        
        it('should validate file size on selection', function() {
            var fileInput = element.find('input[type="file"]');
            
            // Create a large file (> 10MB)
            var largeFile = new Blob([new ArrayBuffer(11 * 1024 * 1024)], { type: 'image/jpeg' });
            
            var mockEvent = {
                target: {
                    files: [largeFile]
                }
            };
            
            fileInput.triggerHandler('change', mockEvent);
            
            var errorMessage = element.find('.error-message');
            expect(errorMessage.text()).toContain('File size must be less than 10MB');
        });
        
        it('should show preview after valid file selection', function() {
            var fileInput = element.find('input[type="file"]');
            var validFile = new Blob(['fake image'], { type: 'image/jpeg' });
            
            // Mock FileReader
            var mockFileReader = {
                readAsDataURL: jasmine.createSpy('readAsDataURL'),
                result: 'data:image/jpeg;base64,fake-image-data',
                onload: null
            };
            
            spyOn(window, 'FileReader').and.returnValue(mockFileReader);
            
            var mockEvent = {
                target: {
                    files: [validFile]
                }
            };
            
            fileInput.triggerHandler('change', mockEvent);
            
            // Simulate FileReader onload
            mockFileReader.onload();
            $scope.$digest();
            
            expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(validFile);
            
            var preview = element.find('.photo-preview');
            expect(preview.length).toBe(1);
            
            var previewImage = element.find('.preview-image');
            expect(previewImage.attr('src')).toBe('data:image/jpeg;base64,fake-image-data');
        });
    });
    
    describe('photo actions', function() {
        beforeEach(function() {
            compileDirective();
            
            // Simulate a selected photo
            $scope.selectedFile = new Blob(['fake image'], { type: 'image/jpeg' });
            $scope.previewUrl = 'data:image/jpeg;base64,fake-image-data';
            $scope.$digest();
        });
        
        it('should show action buttons when photo is selected', function() {
            var analyzeButton = element.find('.analyze-button');
            var clearButton = element.find('.clear-button');
            
            expect(analyzeButton.length).toBe(1);
            expect(clearButton.length).toBe(1);
        });
        
        it('should call analyze function when analyze button clicked', function() {
            var analyzeButton = element.find('.analyze-button');
            
            analyzeButton.triggerHandler('click');
            
            expect($scope.analyzePhoto).toHaveBeenCalled();
        });
        
        it('should call clear function when clear button clicked', function() {
            var clearButton = element.find('.clear-button');
            
            clearButton.triggerHandler('click');
            
            expect($scope.clearPhoto).toHaveBeenCalled();
        });
        
        it('should disable analyze button during analysis', function() {
            $scope.analyzing = true;
            $scope.$digest();
            
            var analyzeButton = element.find('.analyze-button');
            expect(analyzeButton.prop('disabled')).toBe(true);
            expect(analyzeButton.text()).toContain('Analyzing...');
        });
        
        it('should show loading indicator during analysis', function() {
            $scope.analyzing = true;
            $scope.$digest();
            
            var loadingIndicator = element.find('.loading-indicator');
            expect(loadingIndicator.length).toBe(1);
            expect(loadingIndicator.hasClass('ng-hide')).toBe(false);
        });
    });
    
    describe('drag and drop functionality', function() {
        beforeEach(function() {
            compileDirective();
        });
        
        it('should handle drag over events', function() {
            var uploadArea = element.find('.upload-area');
            
            var dragOverEvent = {
                preventDefault: jasmine.createSpy('preventDefault'),
                stopPropagation: jasmine.createSpy('stopPropagation')
            };
            
            uploadArea.triggerHandler('dragover', dragOverEvent);
            
            expect(dragOverEvent.preventDefault).toHaveBeenCalled();
            expect(dragOverEvent.stopPropagation).toHaveBeenCalled();
            expect(uploadArea.hasClass('drag-over')).toBe(true);
        });
        
        it('should handle drag leave events', function() {
            var uploadArea = element.find('.upload-area');
            
            // First add drag-over class
            uploadArea.addClass('drag-over');
            
            var dragLeaveEvent = {
                preventDefault: jasmine.createSpy('preventDefault'),
                stopPropagation: jasmine.createSpy('stopPropagation')
            };
            
            uploadArea.triggerHandler('dragleave', dragLeaveEvent);
            
            expect(uploadArea.hasClass('drag-over')).toBe(false);
        });
        
        it('should handle file drop events', function() {
            var uploadArea = element.find('.upload-area');
            var mockFile = new Blob(['fake image'], { type: 'image/jpeg' });
            
            var dropEvent = {
                preventDefault: jasmine.createSpy('preventDefault'),
                stopPropagation: jasmine.createSpy('stopPropagation'),
                originalEvent: {
                    dataTransfer: {
                        files: [mockFile]
                    }
                }
            };
            
            uploadArea.triggerHandler('drop', dropEvent);
            
            expect(dropEvent.preventDefault).toHaveBeenCalled();
            expect(dropEvent.stopPropagation).toHaveBeenCalled();
            expect($scope.onPhotoSelected).toHaveBeenCalled();
            expect(uploadArea.hasClass('drag-over')).toBe(false);
        });
    });
    
    describe('error handling', function() {
        beforeEach(function() {
            compileDirective();
        });
        
        it('should display error messages', function() {
            $scope.errorMessage = 'Test error message';
            $scope.$digest();
            
            var errorElement = element.find('.error-message');
            expect(errorElement.length).toBe(1);
            expect(errorElement.text()).toBe('Test error message');
            expect(errorElement.hasClass('ng-hide')).toBe(false);
        });
        
        it('should hide error messages when cleared', function() {
            $scope.errorMessage = 'Test error message';
            $scope.$digest();
            
            $scope.errorMessage = null;
            $scope.$digest();
            
            var errorElement = element.find('.error-message');
            expect(errorElement.hasClass('ng-hide')).toBe(true);
        });
        
        it('should clear error when new file is selected', function() {
            $scope.errorMessage = 'Previous error';
            $scope.$digest();
            
            var fileInput = element.find('input[type="file"]');
            var validFile = new Blob(['fake image'], { type: 'image/jpeg' });
            
            var mockEvent = {
                target: {
                    files: [validFile]
                }
            };
            
            fileInput.triggerHandler('change', mockEvent);
            
            expect($scope.errorMessage).toBeNull();
        });
    });
    
    describe('accessibility', function() {
        beforeEach(function() {
            compileDirective();
        });
        
        it('should have proper ARIA labels', function() {
            var fileInput = element.find('input[type="file"]');
            expect(fileInput.attr('aria-label')).toBeDefined();
            
            var uploadArea = element.find('.upload-area');
            expect(uploadArea.attr('role')).toBe('button');
            expect(uploadArea.attr('tabindex')).toBe('0');
        });
        
        it('should handle keyboard navigation', function() {
            var uploadArea = element.find('.upload-area');
            
            var enterKeyEvent = {
                keyCode: 13,
                preventDefault: jasmine.createSpy('preventDefault')
            };
            
            uploadArea.triggerHandler('keydown', enterKeyEvent);
            
            expect(enterKeyEvent.preventDefault).toHaveBeenCalled();
            // Should trigger file input click
        });
        
        it('should provide screen reader feedback', function() {
            $scope.selectedFile = new Blob(['fake image'], { type: 'image/jpeg' });
            $scope.$digest();
            
            var srText = element.find('.sr-only');
            expect(srText.length).toBeGreaterThan(0);
            expect(srText.text()).toContain('Photo selected');
        });
    });
});