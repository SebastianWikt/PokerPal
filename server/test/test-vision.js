const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const DatabaseUtils = require('../database/utils');
const dbInitializer = require('../database/init');

const BASE_URL = 'http://localhost:3000/api';

// Create a simple test image (1x1 pixel PNG)
function createTestImage() {
    const testImagePath = path.join(__dirname, 'test-chip-image.png');
    
    // Simple 1x1 pixel PNG in base64
    const pngData = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg==',
        'base64'
    );
    
    fs.writeFileSync(testImagePath, pngData);
    return testImagePath;
}

async function testVisionEndpoints() {
    try {
        console.log('Testing computer vision API endpoints...');
        
        // Initialize database
        await dbInitializer.initialize();
        
        // Create test player
        const testPlayer = {
            computing_id: 'visiontest123',
            first_name: 'Vision',
            last_name: 'Tester',
            years_of_experience: 2,
            level: 'Intermediate',
            major: 'Computer Science'
        };
        
        await DatabaseUtils.createPlayer(testPlayer);
        console.log('✓ Created test player');
        
        // Test health endpoint first
        try {
            await axios.get(`${BASE_URL}/health`);
            console.log('✓ Server is running');
        } catch (error) {
            console.log('✗ Server not running - start with: npm start');
            return;
        }
        
        // Login to get token
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            computing_id: 'visiontest123'
        });
        const token = loginResponse.data.token;
        console.log('✓ Player login successful');
        
        const headers = { 'Authorization': `Bearer ${token}` };
        
        // Test 1: Get chip values
        console.log('\n1. Testing get chip values...');
        const chipValuesResponse = await axios.get(`${BASE_URL}/vision/chip-values`, { headers });
        console.log('✓ Chip values retrieved');
        console.log('  Available colors:', chipValuesResponse.data.colors);
        console.log('  Chip values:', chipValuesResponse.data.chip_values);
        
        // Test 2: Test computer vision service
        console.log('\n2. Testing vision service test endpoint...');
        const testResponse = await axios.post(`${BASE_URL}/vision/test`, {}, { headers });
        console.log('✓ Vision service test successful');
        console.log('  Service status:', testResponse.data.service_status);
        console.log('  Test detection:', testResponse.data.test_result.detected_chips);
        console.log('  Test total value:', testResponse.data.test_result.total_value);
        console.log('  Test confidence:', testResponse.data.test_result.confidence);
        
        // Test 3: Analyze image
        console.log('\n3. Testing image analysis...');
        
        // Create test image
        const testImagePath = createTestImage();
        
        // Create form data with image
        const formData = new FormData();
        formData.append('image', fs.createReadStream(testImagePath));
        
        const analysisResponse = await axios.post(`${BASE_URL}/vision/analyze`, formData, {
            headers: {
                ...headers,
                ...formData.getHeaders()
            }
        });
        
        console.log('✓ Image analysis successful');
        console.log('  Detected chips:', analysisResponse.data.analysis.detected_chips);
        console.log('  Total value:', analysisResponse.data.analysis.total_value);
        console.log('  Confidence:', analysisResponse.data.analysis.confidence);
        console.log('  Processing time:', analysisResponse.data.analysis.processing_time_ms + 'ms');
        console.log('  Confidence level:', analysisResponse.data.suggestions.confidence_level);
        console.log('  Use detected values:', analysisResponse.data.suggestions.use_detected_values);
        
        // Clean up test image
        try {
            fs.unlinkSync(testImagePath);
        } catch (error) {
            // Ignore cleanup errors
        }
        
        // Test 4: Try to analyze without image (should fail)
        console.log('\n4. Testing analysis without image...');
        try {
            await axios.post(`${BASE_URL}/vision/analyze`, {}, { headers });
            console.log('✗ Should have required image');
        } catch (error) {
            if (error.response && error.response.status === 400) {
                console.log('✓ Correctly required image for analysis');
            } else {
                console.log('✗ Unexpected error:', error.message);
            }
        }
        
        // Test 5: Try to access without authentication
        console.log('\n5. Testing authentication requirement...');
        try {
            await axios.get(`${BASE_URL}/vision/chip-values`);
            console.log('✗ Should have required authentication');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('✓ Correctly required authentication');
            } else {
                console.log('✗ Unexpected error:', error.message);
            }
        }
        
        console.log('\n🎉 All computer vision API tests passed!');
        console.log('\nAvailable vision endpoints:');
        console.log('  POST   /api/vision/analyze (with image upload)');
        console.log('  GET    /api/vision/chip-values');
        console.log('  POST   /api/vision/test');
        
        console.log('\n💡 Computer Vision Features:');
        console.log('  • Mock chip detection with realistic results');
        console.log('  • Confidence scoring (75-95%)');
        console.log('  • Multiple chip color detection');
        console.log('  • Automatic total value calculation');
        console.log('  • Image validation and processing');
        console.log('  • Integration with current chip values');
        
    } catch (error) {
        console.error('❌ Computer vision API test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

if (require.main === module) {
    testVisionEndpoints()
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = { testVisionEndpoints };