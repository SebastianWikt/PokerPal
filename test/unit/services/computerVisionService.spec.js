describe('ComputerVisionService', function() {
    var ComputerVisionService, $httpBackend, API_BASE_URL;
    
    beforeEach(module('pokerPalApp'));
    
    beforeEach(inject(function(_ComputerVisionService_, _$httpBackend_, _API_BASE_URL_) {
        ComputerVisionService = _ComputerVisionService_;
        $httpBackend = _$httpBackend_;
        API_BASE_URL = _API_BASE_URL_;
    }));
    
    afterEach(function() {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });
    
    describe('analyzeImage', function() {
        it('should analyze image and return chip data', function() {
            var mockFile = new Blob(['fake image data'], { type: 'image/jpeg' });
            
            var mockResponse = {
                chipCounts: {
                    red: 10,
                    blue: 5,
                    green: 2,
                    black: 1
                },
                chipValues: {
                    red: 5.00,
                    blue: 10.00,
                    green: 25.00,
                    black: 100.00
                },
                totalValue: 200.00,
                confidence: 0.85,
                processingTime: 1200
            };
            
            // Note: FormData is used for file uploads
            $httpBackend.expectPOST(API_BASE_URL + '/vision/analyze')
                .respond(200, mockResponse);
            
            var result;
            ComputerVisionService.analyzeImage(mockFile).then(function(response) {
                result = response;
            });
            
            $httpBackend.flush();
            
            expect(result).toEqual(mockResponse);
            expect(result.totalValue).toBe(200.00);
            expect(result.confidence).toBe(0.85);
        });
        
        it('should handle empty chip detection', function() {
            var mockFile = new Blob(['empty table image'], { type: 'image/jpeg' });
            
            var mockResponse = {
                chipCounts: {},
                chipValues: {
                    red: 5.00,
                    blue: 10.00
                },
                totalValue: 0.00,
                confidence: 0.95,
                processingTime: 800
            };
            
            $httpBackend.expectPOST(API_BASE_URL + '/vision/analyze')
                .respond(200, mockResponse);
            
            var result;
            ComputerVisionService.analyzeImage(mockFile).then(function(response) {
                result = response;
            });
            
            $httpBackend.flush();
            
            expect(result.chipCounts).toEqual({});
            expect(result.totalValue).toBe(0.00);
            expect(result.confidence).toBe(0.95);
        });
        
        it('should handle low confidence results with warnings', function() {
            var mockFile = new Blob(['blurry image'], { type: 'image/jpeg' });
            
            var mockResponse = {
                chipCounts: {
                    red: 3
                },
                chipValues: {
                    red: 5.00
                },
                totalValue: 15.00,
                confidence: 0.45,
                processingTime: 1800,
                warnings: ['Low confidence detection - image may be blurry']
            };
            
            $httpBackend.expectPOST(API_BASE_URL + '/vision/analyze')
                .respond(200, mockResponse);
            
            var result;
            ComputerVisionService.analyzeImage(mockFile).then(function(response) {
                result = response;
            });
            
            $httpBackend.flush();
            
            expect(result.confidence).toBe(0.45);
            expect(result.warnings).toContain('Low confidence detection');
        });
        
        it('should handle unknown chip colors', function() {
            var mockFile = new Blob(['mixed chips image'], { type: 'image/jpeg' });
            
            var mockResponse = {
                chipCounts: {
                    red: 5,
                    blue: 3,
                    yellow: 2 // Unknown color
                },
                chipValues: {
                    red: 5.00,
                    blue: 10.00
                },
                totalValue: 55.00, // Only known colors counted
                confidence: 0.75,
                processingTime: 1100,
                warnings: ['Unknown chip color detected: yellow']
            };
            
            $httpBackend.expectPOST(API_BASE_URL + '/vision/analyze')
                .respond(200, mockResponse);
            
            var result;
            ComputerVisionService.analyzeImage(mockFile).then(function(response) {
                result = response;
            });
            
            $httpBackend.flush();
            
            expect(result.chipCounts.yellow).toBe(2);
            expect(result.totalValue).toBe(55.00);
            expect(result.warnings).toContain('Unknown chip color detected: yellow');
        });
        
        it('should handle analysis errors', function() {
            var mockFile = new Blob(['corrupted image'], { type: 'image/jpeg' });
            
            $httpBackend.expectPOST(API_BASE_URL + '/vision/analyze')
                .respond(500, { error: 'Image analysis failed' });
            
            var error;
            ComputerVisionService.analyzeImage(mockFile).catch(function(err) {
                error = err;
            });
            
            $httpBackend.flush();
            
            expect(error.status).toBe(500);
            expect(error.data.error).toBe('Image analysis failed');
        });
        
        it('should validate file type before sending', function() {
            var invalidFile = new Blob(['not an image'], { type: 'text/plain' });
            
            var error;
            ComputerVisionService.analyzeImage(invalidFile).catch(function(err) {
                error = err;
            });
            
            expect(error.message).toContain('Invalid file type');
        });
        
        it('should validate file size before sending', function() {
            // Create a large file (> 10MB)
            var largeFile = new Blob([new ArrayBuffer(11 * 1024 * 1024)], { type: 'image/jpeg' });
            
            var error;
            ComputerVisionService.analyzeImage(largeFile).catch(function(err) {
                error = err;
            });
            
            expect(error.message).toContain('File too large');
        });
    });
    
    describe('validateImageFile', function() {
        it('should validate supported image types', function() {
            var jpegFile = new Blob(['fake'], { type: 'image/jpeg' });
            var pngFile = new Blob(['fake'], { type: 'image/png' });
            var gifFile = new Blob(['fake'], { type: 'image/gif' });
            var webpFile = new Blob(['fake'], { type: 'image/webp' });
            
            expect(ComputerVisionService.validateImageFile(jpegFile)).toBe(true);
            expect(ComputerVisionService.validateImageFile(pngFile)).toBe(true);
            expect(ComputerVisionService.validateImageFile(gifFile)).toBe(true);
            expect(ComputerVisionService.validateImageFile(webpFile)).toBe(true);
        });
        
        it('should reject unsupported file types', function() {
            var textFile = new Blob(['fake'], { type: 'text/plain' });
            var pdfFile = new Blob(['fake'], { type: 'application/pdf' });
            var videoFile = new Blob(['fake'], { type: 'video/mp4' });
            
            expect(ComputerVisionService.validateImageFile(textFile)).toBe(false);
            expect(ComputerVisionService.validateImageFile(pdfFile)).toBe(false);
            expect(ComputerVisionService.validateImageFile(videoFile)).toBe(false);
        });
        
        it('should validate file size limits', function() {
            // Small file (1KB)
            var smallFile = new Blob([new ArrayBuffer(1024)], { type: 'image/jpeg' });
            expect(ComputerVisionService.validateImageFile(smallFile)).toBe(true);
            
            // Large file (15MB)
            var largeFile = new Blob([new ArrayBuffer(15 * 1024 * 1024)], { type: 'image/jpeg' });
            expect(ComputerVisionService.validateImageFile(largeFile)).toBe(false);
        });
        
        it('should handle null or undefined files', function() {
            expect(ComputerVisionService.validateImageFile(null)).toBe(false);
            expect(ComputerVisionService.validateImageFile(undefined)).toBe(false);
        });
    });
    
    describe('calculateTotalValue', function() {
        it('should calculate total value from chip counts and values', function() {
            var chipCounts = {
                red: 10,
                blue: 5,
                green: 2,
                black: 1
            };
            
            var chipValues = {
                red: 5.00,
                blue: 10.00,
                green: 25.00,
                black: 100.00
            };
            
            var total = ComputerVisionService.calculateTotalValue(chipCounts, chipValues);
            
            expect(total).toBe(200.00); // (10*5) + (5*10) + (2*25) + (1*100)
        });
        
        it('should handle missing chip values', function() {
            var chipCounts = {
                red: 10,
                yellow: 5 // No value defined
            };
            
            var chipValues = {
                red: 5.00,
                blue: 10.00
            };
            
            var total = ComputerVisionService.calculateTotalValue(chipCounts, chipValues);
            
            expect(total).toBe(50.00); // Only red chips counted
        });
        
        it('should handle empty chip counts', function() {
            var chipCounts = {};
            var chipValues = { red: 5.00, blue: 10.00 };
            
            var total = ComputerVisionService.calculateTotalValue(chipCounts, chipValues);
            
            expect(total).toBe(0.00);
        });
        
        it('should handle decimal chip counts', function() {
            var chipCounts = {
                red: 10.5, // Fractional count (shouldn't happen but handle gracefully)
                blue: 5
            };
            
            var chipValues = {
                red: 5.00,
                blue: 10.00
            };
            
            var total = ComputerVisionService.calculateTotalValue(chipCounts, chipValues);
            
            expect(total).toBe(102.50); // (10.5*5) + (5*10)
        });
    });
    
    describe('getConfidenceLevel', function() {
        it('should categorize confidence levels correctly', function() {
            expect(ComputerVisionService.getConfidenceLevel(0.95)).toBe('high');
            expect(ComputerVisionService.getConfidenceLevel(0.85)).toBe('high');
            expect(ComputerVisionService.getConfidenceLevel(0.75)).toBe('medium');
            expect(ComputerVisionService.getConfidenceLevel(0.65)).toBe('medium');
            expect(ComputerVisionService.getConfidenceLevel(0.45)).toBe('low');
            expect(ComputerVisionService.getConfidenceLevel(0.25)).toBe('low');
        });
        
        it('should handle edge cases', function() {
            expect(ComputerVisionService.getConfidenceLevel(1.0)).toBe('high');
            expect(ComputerVisionService.getConfidenceLevel(0.8)).toBe('high');
            expect(ComputerVisionService.getConfidenceLevel(0.6)).toBe('medium');
            expect(ComputerVisionService.getConfidenceLevel(0.0)).toBe('low');
        });
    });
});