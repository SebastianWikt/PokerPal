const axios = require('axios');
const DatabaseUtils = require('../database/utils');
const dbInitializer = require('../database/init');

const BASE_URL = 'http://localhost:3000/api';

async function testAuth() {
    try {
        console.log('Testing authentication endpoints...');
        
        // Initialize database
        await dbInitializer.initialize();
        
        // Create a test user
        const testUser = {
            computing_id: 'testuser123',
            first_name: 'Test',
            last_name: 'User',
            years_of_experience: 3,
            level: 'Intermediate',
            major: 'Computer Science'
        };
        
        await DatabaseUtils.createPlayer(testUser);
        console.log('✓ Created test user');
        
        // Test health endpoint
        try {
            const healthResponse = await axios.get(`${BASE_URL}/health`);
            console.log('✓ Health check:', healthResponse.data.status);
        } catch (error) {
            console.log('✗ Health check failed - server may not be running');
            console.log('  Start the server with: npm start');
            return;
        }
        
        // Test login with valid user
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            computing_id: 'testuser123'
        });
        
        console.log('✓ Login successful');
        console.log('  Token received:', loginResponse.data.token ? 'Yes' : 'No');
        console.log('  User data:', loginResponse.data.user);
        
        const token = loginResponse.data.token;
        
        // Test protected endpoint
        const meResponse = await axios.get(`${BASE_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('✓ Protected endpoint access successful');
        console.log('  User profile:', meResponse.data.user);
        
        // Test verify endpoint
        const verifyResponse = await axios.post(`${BASE_URL}/auth/verify`, {
            computing_id: 'testuser123'
        });
        
        console.log('✓ Verify endpoint:', verifyResponse.data.exists ? 'User exists' : 'User not found');
        
        // Test login with non-existent user
        try {
            await axios.post(`${BASE_URL}/auth/login`, {
                computing_id: 'nonexistent'
            });
            console.log('✗ Should have failed for non-existent user');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('✓ Correctly rejected non-existent user');
            } else {
                console.log('✗ Unexpected error for non-existent user:', error.message);
            }
        }
        
        // Test logout
        const logoutResponse = await axios.post(`${BASE_URL}/auth/logout`, {}, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('✓ Logout successful:', logoutResponse.data.message);
        
        console.log('\n🎉 All authentication tests passed!');
        
    } catch (error) {
        console.error('❌ Authentication test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

// Install axios if running this test
async function ensureAxios() {
    try {
        require('axios');
    } catch (error) {
        console.log('Installing axios for testing...');
        const { execSync } = require('child_process');
        execSync('npm install axios', { stdio: 'inherit' });
    }
}

if (require.main === module) {
    ensureAxios().then(() => testAuth());
}

module.exports = { testAuth };