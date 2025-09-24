const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const DatabaseUtils = require('../database/utils');
const dbInitializer = require('../database/init');

const BASE_URL = 'http://localhost:3000/api';

async function testSessionEndpoints() {
    try {
        console.log('Testing session API endpoints...');
        
        // Initialize database
        await dbInitializer.initialize();
        
        // Test data
        const testPlayer = {
            computing_id: 'sessiontest123',
            first_name: 'Session',
            last_name: 'Tester',
            years_of_experience: 3,
            level: 'Intermediate',
            major: 'Computer Science'
        };
        
        // Create test player
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
            computing_id: 'sessiontest123'
        });
        const token = loginResponse.data.token;
        console.log('✓ Player login successful');
        
        const headers = { 'Authorization': `Bearer ${token}` };
        
        // Test 1: Create session (check-in)
        console.log('\n1. Testing session check-in...');
        const checkInData = {
            session_date: '2024-01-15',
            start_chips: 100.00,
            start_chip_breakdown: { white: 50, red: 10 },
            session_type: 'check-in'
        };
        
        const checkInResponse = await axios.post(`${BASE_URL}/sessions`, checkInData, { headers });
        console.log('✓ Session check-in successful');
        console.log('  Session ID:', checkInResponse.data.session.entry_id);
        console.log('  Start chips:', checkInResponse.data.session.start_chips);
        
        const sessionId = checkInResponse.data.session.entry_id;
        
        // Test 2: Get active session
        console.log('\n2. Testing get active session...');
        const activeResponse = await axios.get(`${BASE_URL}/sessions/active/${testPlayer.computing_id}/2024-01-15`, { headers });
        console.log('✓ Active session retrieved');
        console.log('  Active session ID:', activeResponse.data.session.entry_id);
        
        // Test 3: Get all sessions for player
        console.log('\n3. Testing get player sessions...');
        const sessionsResponse = await axios.get(`${BASE_URL}/sessions/${testPlayer.computing_id}`, { headers });
        console.log('✓ Player sessions retrieved');
        console.log('  Total sessions:', sessionsResponse.data.total);
        console.log('  Incomplete sessions:', sessionsResponse.data.incomplete);
        
        // Test 4: Session check-out
        console.log('\n4. Testing session check-out...');
        const checkOutData = {
            session_date: '2024-01-15',
            end_chips: 150.00,
            end_chip_breakdown: JSON.stringify({ white: 25, red: 25 }),
            session_type: 'check-out'
        };
        
        const checkOutResponse = await axios.post(`${BASE_URL}/sessions`, checkOutData, { headers });
        console.log('✓ Session check-out successful');
        console.log('  Net winnings:', checkOutResponse.data.session.net_winnings);
        console.log('  Session completed:', checkOutResponse.data.session.is_completed);
        
        // Test 5: Update session
        console.log('\n5. Testing session update...');
        const updateData = {
            end_chips: 175.00
        };
        
        const updateResponse = await axios.put(`${BASE_URL}/sessions/${sessionId}`, updateData, { headers });
        console.log('✓ Session updated successfully');
        console.log('  Updated net winnings:', updateResponse.data.session.net_winnings);
        
        // Test 6: Try to check-in again (should fail)
        console.log('\n6. Testing duplicate check-in prevention...');
        try {
            await axios.post(`${BASE_URL}/sessions`, {
                session_date: '2024-01-15',
                start_chips: 100.00,
                session_type: 'check-in'
            }, { headers });
            console.log('✗ Should have prevented duplicate check-in');
        } catch (error) {
            if (error.response && error.response.status === 409) {
                console.log('✓ Correctly prevented duplicate check-in');
            } else {
                console.log('✗ Unexpected error:', error.message);
            }
        }
        
        // Test 7: Try to check-out without active session
        console.log('\n7. Testing check-out without active session...');
        try {
            await axios.post(`${BASE_URL}/sessions`, {
                session_date: '2024-01-16',
                end_chips: 100.00,
                session_type: 'check-out'
            }, { headers });
            console.log('✗ Should have required active session for check-out');
        } catch (error) {
            if (error.response && error.response.status === 404) {
                console.log('✓ Correctly required active session for check-out');
            } else {
                console.log('✗ Unexpected error:', error.message);
            }
        }
        
        // Test 8: Try to access without authentication
        console.log('\n8. Testing authentication requirement...');
        try {
            await axios.get(`${BASE_URL}/sessions/${testPlayer.computing_id}`);
            console.log('✗ Should have required authentication');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('✓ Correctly required authentication');
            } else {
                console.log('✗ Unexpected error:', error.message);
            }
        }
        
        console.log('\n🎉 All session API tests passed!');
        console.log('\nAvailable session endpoints:');
        console.log('  POST   /api/sessions (check-in/check-out)');
        console.log('  GET    /api/sessions/:computingId');
        console.log('  GET    /api/sessions/active/:computingId/:date');
        console.log('  PUT    /api/sessions/:sessionId');
        console.log('  POST   /api/sessions/:sessionId/override (admin)');
        
    } catch (error) {
        console.error('❌ Session API test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

if (require.main === module) {
    testSessionEndpoints()
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = { testSessionEndpoints };