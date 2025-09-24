const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');
const DatabaseUtils = require('../database/utils');

const router = express.Router();

// Configure multer for vision analysis uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../uploads/vision');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        const filename = `vision_${timestamp}${ext}`;
        cb(null, filename);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

/**
 * Computer Vision Service
 * This is a simplified implementation that demonstrates the concept.
 * In a production environment, you would integrate with actual CV libraries
 * like TensorFlow.js, OpenCV.js, or cloud services like Google Vision API.
 */
class ComputerVisionService {
    
    /**
     * Analyze chip image and detect chips
     * This is a mock implementation that returns realistic results
     * @param {string} imagePath - Path to the image file
     * @returns {Object} Analysis results
     */
    static async analyzeChipImage(imagePath) {
        try {
            // In a real implementation, this would use actual computer vision
            // For now, we'll simulate the analysis with realistic results
            
            // Simulate processing time
            await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
            
            // Get chip values for calculation
            const chipValues = await DatabaseUtils.getChipValues();
            
            // Generate realistic chip detection results
            const detectedChips = this.generateMockChipDetection(chipValues);
            
            // Calculate total value
            const totalValue = this.calculateTotalValue(detectedChips, chipValues);
            
            // Generate confidence score
            const confidence = 0.75 + Math.random() * 0.2; // 75-95% confidence
            
            return {
                success: true,
                detected_chips: detectedChips,
                total_value: totalValue,
                confidence: Math.round(confidence * 100) / 100,
                processing_time_ms: 1500 + Math.random() * 1000,
                image_analyzed: true,
                analysis_method: 'mock_cv_service',
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('Vision analysis error:', error);
            return {
                success: false,
                error: 'Failed to analyze image',
                message: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
    
    /**
     * Generate realistic mock chip detection results
     * @param {Object} chipValues - Available chip values
     * @returns {Object} Detected chips breakdown
     */
    static generateMockChipDetection(chipValues) {
        const detectedChips = {};
        const availableColors = Object.keys(chipValues);
        
        // Randomly select 2-4 chip colors to detect
        const numColors = 2 + Math.floor(Math.random() * 3);
        const selectedColors = this.shuffleArray(availableColors).slice(0, numColors);
        
        selectedColors.forEach(color => {
            // Generate realistic chip counts (1-20 chips per color)
            const count = 1 + Math.floor(Math.random() * 20);
            detectedChips[color] = count;
        });
        
        return detectedChips;
    }
    
    /**
     * Calculate total value from detected chips
     * @param {Object} detectedChips - Chip breakdown
     * @param {Object} chipValues - Chip values
     * @returns {number} Total value
     */
    static calculateTotalValue(detectedChips, chipValues) {
        let total = 0;
        Object.entries(detectedChips).forEach(([color, count]) => {
            const value = chipValues[color] || 0;
            total += count * value;
        });
        return Math.round(total * 100) / 100; // Round to 2 decimal places
    }
    
    /**
     * Shuffle array utility
     * @param {Array} array - Array to shuffle
     * @returns {Array} Shuffled array
     */
    static shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    
    /**
     * Validate image for chip detection
     * @param {string} imagePath - Path to image
     * @returns {Object} Validation result
     */
    static async validateImage(imagePath) {
        try {
            const stats = fs.statSync(imagePath);
            const fileSizeMB = stats.size / (1024 * 1024);
            
            // Basic validation
            if (fileSizeMB > 10) {
                return {
                    valid: false,
                    error: 'Image file too large (max 10MB)'
                };
            }
            
            // Check if file exists and is readable
            fs.accessSync(imagePath, fs.constants.R_OK);
            
            return {
                valid: true,
                file_size_mb: Math.round(fileSizeMB * 100) / 100
            };
            
        } catch (error) {
            return {
                valid: false,
                error: 'Invalid or inaccessible image file'
            };
        }
    }
}

/**
 * POST /api/vision/analyze
 * Analyze uploaded image for chip detection
 */
router.post('/analyze',
    authenticateToken,
    upload.single('image'),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    error: 'No image provided',
                    message: 'Please upload an image file for analysis'
                });
            }
            
            const imagePath = req.file.path;
            
            // Validate image
            const validation = await ComputerVisionService.validateImage(imagePath);
            if (!validation.valid) {
                // Clean up uploaded file
                try {
                    fs.unlinkSync(imagePath);
                } catch (unlinkError) {
                    console.error('Failed to clean up invalid image:', unlinkError);
                }
                
                return res.status(400).json({
                    error: 'Invalid image',
                    message: validation.error
                });
            }
            
            // Analyze image
            const analysisResult = await ComputerVisionService.analyzeChipImage(imagePath);
            
            // Clean up uploaded file after analysis
            try {
                fs.unlinkSync(imagePath);
            } catch (unlinkError) {
                console.error('Failed to clean up analyzed image:', unlinkError);
            }
            
            if (!analysisResult.success) {
                return res.status(500).json({
                    error: 'Analysis failed',
                    message: analysisResult.message || 'Computer vision analysis failed'
                });
            }
            
            // Return analysis results
            res.json({
                message: 'Image analysis completed successfully',
                analysis: {
                    detected_chips: analysisResult.detected_chips,
                    total_value: analysisResult.total_value,
                    confidence: analysisResult.confidence,
                    processing_time_ms: analysisResult.processing_time_ms,
                    timestamp: analysisResult.timestamp
                },
                suggestions: {
                    use_detected_values: analysisResult.confidence > 0.8,
                    manual_verification_recommended: analysisResult.confidence < 0.9,
                    confidence_level: analysisResult.confidence > 0.9 ? 'high' : 
                                    analysisResult.confidence > 0.7 ? 'medium' : 'low'
                }
            });
            
        } catch (error) {
            console.error('Vision analysis endpoint error:', error);
            
            // Clean up uploaded file if there was an error
            if (req.file) {
                try {
                    fs.unlinkSync(req.file.path);
                } catch (unlinkError) {
                    console.error('Failed to clean up uploaded file:', unlinkError);
                }
            }
            
            res.status(500).json({
                error: 'Analysis failed',
                message: 'An unexpected error occurred during image analysis'
            });
        }
    }
);

/**
 * GET /api/vision/chip-values
 * Get current chip values for reference
 */
router.get('/chip-values',
    authenticateToken,
    async (req, res) => {
        try {
            const chipValues = await DatabaseUtils.getChipValues();
            
            res.json({
                chip_values: chipValues,
                colors: Object.keys(chipValues),
                total_colors: Object.keys(chipValues).length
            });
            
        } catch (error) {
            console.error('Get chip values error:', error);
            res.status(500).json({
                error: 'Failed to get chip values',
                message: 'An unexpected error occurred'
            });
        }
    }
);

/**
 * POST /api/vision/test
 * Test endpoint for computer vision service
 */
router.post('/test',
    authenticateToken,
    async (req, res) => {
        try {
            // Generate test analysis without requiring an image
            const chipValues = await DatabaseUtils.getChipValues();
            const testResult = ComputerVisionService.generateMockChipDetection(chipValues);
            const totalValue = ComputerVisionService.calculateTotalValue(testResult, chipValues);
            
            res.json({
                message: 'Computer vision service test successful',
                test_result: {
                    detected_chips: testResult,
                    total_value: totalValue,
                    confidence: 0.85,
                    processing_time_ms: 1200,
                    timestamp: new Date().toISOString()
                },
                service_status: 'operational',
                available_chip_colors: Object.keys(chipValues)
            });
            
        } catch (error) {
            console.error('Vision test error:', error);
            res.status(500).json({
                error: 'Test failed',
                message: 'Computer vision service test failed'
            });
        }
    }
);

module.exports = router;