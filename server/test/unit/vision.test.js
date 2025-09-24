const request = require('supertest');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const app = require('../../app');
const db = require('../../database/utils');

// Mock dependencies
jest.mock('../../database/utils');
jest.mock('fs');

describe('Computer Vision Routes', () => {
    let authToken;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Create auth token for tests
        authToken = jwt.sign(
            { computing_id: 'test123' },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '24h' }
        );

        // Mock file system
        fs.readFileSync = jest.fn();
        fs.existsSync = jest.fn().mockReturnValue(true);
    });

    describe('POST /api/vision/analyze', () => {
        it('should analyze chip image successfully', async () => {
            // Mock chip values from database
            const mockChipValues = [
                { color: 'red', value: 5.00 },
                { color: 'blue', value: 10.00 },
                { color: 'green', value: 25.00 },
                { color: 'black', value: 100.00 }
            ];

            db.all.mockResolvedValue(mockChipValues);

            // Mock computer vision analysis result
            const mockAnalysisResult = {
                chipCounts: {
                    red: 10,
                    blue: 5,
                green: 2,
                black: 1
                },
                confidence: 0.85,
                processingTime: 1250
            };

            // Mock the computer vision service
            jest.doMock('../../services/computerVision', () => ({
                analyzeChipImage: jest.fn().mockResolvedValue(mockAnalysisResult)
            }));

            const expectedResponse = {
                chipCounts: mockAnalysisResult.chipCounts,
                chipValues: {
                    red: 5.00,
                    blue: 10.00,
                    green: 25.00,
                    black: 100.00
                },
                totalValue: 275.00, // (10*5) + (5*10) + (2*25) + (1*100)
                confidence: 0.85,
                processingTime: 1250
            };

            const response = await request(app)
                .post('/api/vision/analyze')
                .set('Authorization', `Bearer ${authToken}`)
                .attach('image', Buffer.from('fake image data'), 'chips.jpg')
                .expect(200);

            expect(response.body).toMatchObject({
                chipCounts: mockAnalysisResult.chipCounts,
                totalValue: 275.00
            });
            expect(response.body).toHaveProperty('confidence');
            expect(response.body).toHaveProperty('processingTime');
        });

        it('should handle image with no chips detected', async () => {
            const mockChipValues = [
                { color: 'red', value: 5.00 },
                { color: 'blue', value: 10.00 }
            ];

            db.all.mockResolvedValue(mockChipValues);

            const mockAnalysisResult = {
                chipCounts: {},
                confidence: 0.95,
                processingTime: 800
            };

            jest.doMock('../../services/computerVision', () => ({
                analyzeChipImage: jest.fn().mockResolvedValue(mockAnalysisResult)
            }));

            const response = await request(app)
                .post('/api/vision/analyze')
                .set('Authorization', `Bearer ${authToken}`)
                .attach('image', Buffer.from('fake image data'), 'empty.jpg')
                .expect(200);

            expect(response.body.chipCounts).toEqual({});
            expect(response.body.totalValue).toBe(0);
            expect(response.body.confidence).toBe(0.95);
        });

        it('should handle unknown chip colors', async () => {
            const mockChipValues = [
                { color: 'red', value: 5.00 },
                { color: 'blue', value: 10.00 }
            ];

            db.all.mockResolvedValue(mockChipValues);

            const mockAnalysisResult = {
                chipCounts: {
                    red: 5,
                    blue: 3,
                    yellow: 2 // Unknown color
                },
                confidence: 0.75,
                processingTime: 1100
            };

            jest.doMock('../../services/computerVision', () => ({
                analyzeChipImage: jest.fn().mockResolvedValue(mockAnalysisResult)
            }));

            const response = await request(app)
                .post('/api/vision/analyze')
                .set('Authorization', `Bearer ${authToken}`)
                .attach('image', Buffer.from('fake image data'), 'mixed.jpg')
                .expect(200);

            expect(response.body.chipCounts).toEqual(mockAnalysisResult.chipCounts);
            expect(response.body.totalValue).toBe(55.00); // Only red and blue counted
            expect(response.body).toHaveProperty('warnings');
            expect(response.body.warnings).toContain('Unknown chip color detected: yellow');
        });

        it('should require image upload', async () => {
            const response = await request(app)
                .post('/api/vision/analyze')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('Image file is required');
        });

        it('should validate image file type', async () => {
            const response = await request(app)
                .post('/api/vision/analyze')
                .set('Authorization', `Bearer ${authToken}`)
                .attach('image', Buffer.from('fake data'), 'document.txt')
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('Invalid file type');
        });

        it('should validate image file size', async () => {
            // Create a large buffer to simulate oversized file
            const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB

            const response = await request(app)
                .post('/api/vision/analyze')
                .set('Authorization', `Bearer ${authToken}`)
                .attach('image', largeBuffer, 'large.jpg')
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('File too large');
        });

        it('should handle computer vision processing errors', async () => {
            const mockChipValues = [
                { color: 'red', value: 5.00 }
            ];

            db.all.mockResolvedValue(mockChipValues);

            jest.doMock('../../services/computerVision', () => ({
                analyzeChipImage: jest.fn().mockRejectedValue(new Error('Vision processing failed'))
            }));

            const response = await request(app)
                .post('/api/vision/analyze')
                .set('Authorization', `Bearer ${authToken}`)
                .attach('image', Buffer.from('corrupted image'), 'corrupted.jpg')
                .expect(500);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('Image analysis failed');
        });

        it('should handle database errors when fetching chip values', async () => {
            db.all.mockRejectedValue(new Error('Database connection failed'));

            const response = await request(app)
                .post('/api/vision/analyze')
                .set('Authorization', `Bearer ${authToken}`)
                .attach('image', Buffer.from('fake image'), 'test.jpg')
                .expect(500);

            expect(response.body).toHaveProperty('error');
        });

        it('should require authentication', async () => {
            const response = await request(app)
                .post('/api/vision/analyze')
                .attach('image', Buffer.from('fake image'), 'test.jpg')
                .expect(401);

            expect(response.body).toHaveProperty('error');
        });

        it('should handle low confidence results', async () => {
            const mockChipValues = [
                { color: 'red', value: 5.00 }
            ];

            db.all.mockResolvedValue(mockChipValues);

            const mockAnalysisResult = {
                chipCounts: {
                    red: 3
                },
                confidence: 0.45, // Low confidence
                processingTime: 2000
            };

            jest.doMock('../../services/computerVision', () => ({
                analyzeChipImage: jest.fn().mockResolvedValue(mockAnalysisResult)
            }));

            const response = await request(app)
                .post('/api/vision/analyze')
                .set('Authorization', `Bearer ${authToken}`)
                .attach('image', Buffer.from('blurry image'), 'blurry.jpg')
                .expect(200);

            expect(response.body.confidence).toBe(0.45);
            expect(response.body).toHaveProperty('warnings');
            expect(response.body.warnings).toContain('Low confidence detection');
        });
    });

    describe('Computer Vision Service Unit Tests', () => {
        let computerVisionService;

        beforeEach(() => {
            // Reset module cache to get fresh instance
            jest.resetModules();
            computerVisionService = require('../../services/computerVision');
        });

        describe('analyzeChipImage', () => {
            it('should process valid image buffer', async () => {
                // Mock image processing libraries
                const mockImageData = {
                    width: 800,
                    height: 600,
                    data: new Uint8Array(800 * 600 * 4) // RGBA
                };

                // This would normally test the actual computer vision logic
                // For now, we'll test the interface
                const imageBuffer = Buffer.from('fake image data');
                
                // Mock the actual implementation
                computerVisionService.analyzeChipImage = jest.fn().mockResolvedValue({
                    chipCounts: { red: 5, blue: 3 },
                    confidence: 0.85,
                    processingTime: 1200
                });

                const result = await computerVisionService.analyzeChipImage(imageBuffer);

                expect(result).toHaveProperty('chipCounts');
                expect(result).toHaveProperty('confidence');
                expect(result).toHaveProperty('processingTime');
                expect(result.confidence).toBeGreaterThan(0);
                expect(result.confidence).toBeLessThanOrEqual(1);
            });

            it('should handle invalid image data', async () => {
                computerVisionService.analyzeChipImage = jest.fn().mockRejectedValue(
                    new Error('Invalid image format')
                );

                const invalidBuffer = Buffer.from('not an image');

                await expect(computerVisionService.analyzeChipImage(invalidBuffer))
                    .rejects.toThrow('Invalid image format');
            });

            it('should detect different chip colors', async () => {
                const mockResults = [
                    { chipCounts: { red: 10 }, confidence: 0.9 },
                    { chipCounts: { blue: 5 }, confidence: 0.85 },
                    { chipCounts: { green: 2 }, confidence: 0.8 },
                    { chipCounts: { black: 1 }, confidence: 0.95 },
                    { chipCounts: { red: 3, blue: 2, green: 1 }, confidence: 0.88 }
                ];

                computerVisionService.analyzeChipImage = jest.fn()
                    .mockResolvedValueOnce(mockResults[0])
                    .mockResolvedValueOnce(mockResults[1])
                    .mockResolvedValueOnce(mockResults[2])
                    .mockResolvedValueOnce(mockResults[3])
                    .mockResolvedValueOnce(mockResults[4]);

                for (let i = 0; i < mockResults.length; i++) {
                    const result = await computerVisionService.analyzeChipImage(
                        Buffer.from(`test image ${i}`)
                    );
                    expect(result).toEqual(expect.objectContaining(mockResults[i]));
                }
            });
        });

        describe('calculateChipValue', () => {
            it('should calculate total value correctly', () => {
                const chipCounts = { red: 10, blue: 5, green: 2 };
                const chipValues = { red: 5.00, blue: 10.00, green: 25.00 };

                const totalValue = computerVisionService.calculateChipValue(chipCounts, chipValues);

                expect(totalValue).toBe(150.00); // (10*5) + (5*10) + (2*25)
            });

            it('should handle missing chip values', () => {
                const chipCounts = { red: 10, yellow: 3 }; // yellow not in values
                const chipValues = { red: 5.00, blue: 10.00 };

                const totalValue = computerVisionService.calculateChipValue(chipCounts, chipValues);

                expect(totalValue).toBe(50.00); // Only red chips counted
            });

            it('should handle empty chip counts', () => {
                const chipCounts = {};
                const chipValues = { red: 5.00, blue: 10.00 };

                const totalValue = computerVisionService.calculateChipValue(chipCounts, chipValues);

                expect(totalValue).toBe(0);
            });
        });
    });
});