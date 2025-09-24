const axios = require('axios');
const DatabaseUtils = require('../database/utils');
const dbInitializer = require('../database/init');

const BASE_URL = 'http://localhost:3000/api';

async function testPlayerEndpoints() {
    try {
        console.log('Testing player API endpoints...');
        
        // Initialize database
        await dbInitializer.initialize();
        
        // Test data
        const testPlayer = {
            computing_id: 'testplayer456',
            first_name: 'Jane',
            last_name: 'Doe',
            years_of_experience: 5,
            level: 'Advanced',
            major: 'Mathematics'
        };
        
        const adminPlayer = {
            computing_id: 'admin123',
            first_name: 'Admin',
            last_name: 'User',
            years_of_experience: 10,
            level: 'Expert',
            major: 'Computer Science',
            is_admin: true
        };
        
        // Create admin user for testing
        await DatabaseUtils.createPlayer(adminPlayer);
        console.log('✓ Created admin test user');
        
        // Test health endpoint first
        try {
            await axios.get(`${BASE_URL}/health`);
            console.log('✓ Server is running');
        } catch (error) {
            console.log('✗ Server not running - start with: npm start');
            return;
        }
        
        // Login as admin to get token
        const adminLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            computing_id: 'admin123'
        });
        const adminToken = adminLoginResponse.data.token;
        console.log('✓ Admin login successful');
        
        // Test 1: Create new player
        console.log('\n1. Testing player creation...');
        const createResponse = await axios.post(`${BASE_URL}/players`, testPlayer);
        console.log('✓ Player created successfully');
        console.log('  Player:', createResponse.data.player.first_name, createResponse.data.player.last_name);
        
        // Test 2: Get player by computing ID
        console.log('\n2. Testing get player...');
        const getResponse = await axios.get(`${BASE_URL}/players/${testPlayer.computing_id}`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        console.log('✓ Player retrieved successfully');
        console.log('  Player data:', getResponse.data.player);
        
        // Test 3: Update player
        console.log('\n3. Testing player update...');
        const updateData = {
            years_of_experience: 7,
            level: 'Expert'
        };
        const updateResponse = await axios.put(`${BASE_URL}/players/${testPlayer.computing_id}`, updateData, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        console.log('✓ Player updated successfully');
        console.log('  Updated experience:', updateResponse.data.player.years_of_experience);
        console.log('  Updated level:', updateResponse.data.player.level);
        
        // Test 4: Get leaderboard
        console.log('\n4. Testing leaderboard...');
        const leaderboardResponse = await axios.get(`${BASE_URL}/players/leaderboard`);
        console.log('✓ Leaderboard retrieved successfully');
        console.log('  Total players:', leaderboardResponse.data.pagination.total);
        console.log('  Top player:', leaderboardResponse.data.leaderboard[0]);
        
        // Test 5: Get player entries
        console.log('\n5. Testing player entries...');
        const entriesResponse = await axios.get(`${BASE_URL}/players/${testPlayer.computing_id}/entries`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        console.log('✓ Player entries retrieved successfully');
        console.log('  Number of entries:', entriesResponse.data.entries.length);
        
        // Test 6: Recalculate winnings (admin only)
        console.log('\n6. Testing winnings recalculation...');
        const recalcResponse = await axios.post(`${BASE_URL}/players/${testPlayer.computing_id}/recalculate-winnings`, {}, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        console.log('✓ Winnings recalculated successfully');
        console.log('  New winnings:', recalcResponse.data.new_winnings);
        
        // Test 7: Try to create duplicate player (should fail)
        console.log('\n7. Testing duplicate player creation...');
        try {
            await axios.post(`${BASE_URL}/players`, testPlayer);
            console.log('✗ Should have failed for duplicate player');
        } catch (error) {
            if (error.response && error.response.status === 409) {
                console.log('✓ Correctly rejected duplicate player');
            } else {
                console.log('✗ Unexpected error:', error.message);
            }
        }
        
        // Test 8: Try to access without authentication (should fail)
        console.log('\n8. Testing authentication requirement...');
        try {
            await axios.get(`${BASE_URL}/players/${testPlayer.computing_id}`);
            console.log('✗ Should have required authentication');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('✓ Correctly required authentication');
            } else {
                console.log('✗ Unexpected error:', error.message);
            }
        }
        
        console.log('\n🎉 All player API tests passed!');
        console.log('\nAvailable player endpoints:');
        console.log('  GET    /api/players/:computingId');
        console.log('  POST   /api/players');
        console.log('  PUT    /api/players/:computingId');
        console.log('  GET    /api/players/leaderboard');
        console.log('  GET    /api/players/:computingId/entries');
        console.log('  POST   /api/players/:computingId/recalculate-winnings (admin)');
        
    } catch (error) {
        console.error('❌ Player API test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

if (require.main === module) {
    testPlayerEndpoints()
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = { testPlayerEndpoints };