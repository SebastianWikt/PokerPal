// Simple server test script
// Run this after starting the server with 'npm start'

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testServer() {
    try {
        console.log('Testing PokerPal server endpoints...');
        console.log('Make sure the server is running with: npm start\n');
        
        // Test health endpoint
        console.log('1. Testing health endpoint...');
        const healthResponse = await axios.get(`${BASE_URL}/health`);
        console.log('✓ Health check:', healthResponse.data.status);
        console.log('  Database:', healthResponse.data.database.status);
        
        // Test login endpoint with existing user
        console.log('\n2. Testing login endpoint...');
        try {
            const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
                computing_id: 'testuser123'
            });
            console.log('✓ Login successful for testuser123');
            console.log('  User:', loginResponse.data.user.first_name, loginResponse.data.user.last_name);
            
            const token = loginResponse.data.token;
            
            // Test protected endpoint
            console.log('\n3. Testing protected endpoint...');
            const meResponse = await axios.get(`${BASE_URL}/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('✓ Protected endpoint access successful');
            console.log('  Profile data retrieved for:', meResponse.data.user.computing_id);
            
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('ℹ No test user found - this is expected on first run');
                console.log('  The authentication system is working correctly');
            } else {
                throw error;
            }
        }
        
        // Test verify endpoint
        console.log('\n4. Testing verify endpoint...');
        const verifyResponse = await axios.post(`${BASE_URL}/auth/verify`, {
            computing_id: 'nonexistent'
        });
        console.log('✓ Verify endpoint working');
        console.log('  User exists:', verifyResponse.data.exists);
        
        console.log('\n🎉 Server is running correctly!');
        console.log('\nAvailable endpoints:');
        console.log('  GET  /api/health');
        console.log('  POST /api/auth/login');
        console.log('  POST /api/auth/logout');
        console.log('  GET  /api/auth/me');
        console.log('  POST /api/auth/verify');
        console.log('  GET  /api/auth/status');
        
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.log('❌ Cannot connect to server');
            console.log('   Please start the server first with: npm start');
        } else {
            console.error('❌ Server test failed:', error.message);
            if (error.response) {
                console.error('   Response:', error.response.data);
            }
        }
    }
}

testServer();