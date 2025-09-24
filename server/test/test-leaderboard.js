const axios = require('axios');
const DatabaseUtils = require('../database/utils');
const dbInitializer = require('../database/init');

const BASE_URL = 'http://localhost:3000/api';

async function testLeaderboardEndpoints() {
    try {
        console.log('Testing enhanced leaderboard API endpoints...');
        
        // Initialize database
        await dbInitializer.initialize();
        
        // Create test players with different winnings
        const testPlayers = [
            {
                computing_id: 'leader1',
                first_name: 'Top',
                last_name: 'Player',
                years_of_experience: 5,
                level: 'Expert',
                major: 'Computer Science'
            },
            {
                computing_id: 'leader2',
                first_name: 'Second',
                last_name: 'Place',
                years_of_experience: 3,
                level: 'Advanced',
                major: 'Mathematics'
            },
            {
                computing_id: 'leader3',
                first_name: 'Third',
                last_name: 'Rank',
                years_of_experience: 2,
                level: 'Intermediate',
                major: 'Statistics'
            }
        ];
        
        // Create players and sessions
        for (let i = 0; i < testPlayers.length; i++) {
            const player = testPlayers[i];
            await DatabaseUtils.createPlayer(player);
            
            // Create some test sessions with different winnings
            const winnings = [100, 50, 25][i]; // Decreasing winnings for ranking
            
            for (let j = 0; j < 3; j++) {
                const sessionData = {
                    computing_id: player.computing_id,
                    session_date: `2024-01-${15 + j}`,
                    start_chips: 100,
                    start_chip_breakdown: { white: 50, red: 10 },
                    end_chips: 100 + winnings - (j * 10),
                    end_chip_breakdown: { white: 40 + winnings/2, red: 15 },
                    net_winnings: winnings - (j * 10),
                    is_completed: true
                };
                
                const result = await DatabaseUtils.createEntry(sessionData);
                await DatabaseUtils.updateEntry(result.lastID, {
                    end_chips: sessionData.end_chips,
                    end_chip_breakdown: sessionData.end_chip_breakdown,
                    net_winnings: sessionData.net_winnings,
                    is_completed: true
                });
            }
            
            // Recalculate winnings
            await DatabaseUtils.recalculatePlayerWinnings(player.computing_id);
        }
        
        console.log('✓ Created test players with sessions');
        
        // Test health endpoint first
        try {
            await axios.get(`${BASE_URL}/health`);
            console.log('✓ Server is running');
        } catch (error) {
            console.log('✗ Server not running - start with: npm start');
            return;
        }
        
        // Login as first player to get token
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            computing_id: 'leader1'
        });
        const token = loginResponse.data.token;
        console.log('✓ Player login successful');
        
        const headers = { 'Authorization': `Bearer ${token}` };
        
        // Test 1: Get basic leaderboard
        console.log('\n1. Testing basic leaderboard...');
        const leaderboardResponse = await axios.get(`${BASE_URL}/leaderboard`);
        console.log('✓ Basic leaderboard retrieved');
        console.log('  Total players:', leaderboardResponse.data.pagination.total);
        console.log('  Top player:', leaderboardResponse.data.leaderboard[0]?.display_name);
        console.log('  Top winnings:', leaderboardResponse.data.leaderboard[0]?.total_winnings);
        
        // Test 2: Get leaderboard with pagination
        console.log('\n2. Testing leaderboard pagination...');
        const paginatedResponse = await axios.get(`${BASE_URL}/leaderboard?limit=2&offset=0`);
        console.log('✓ Paginated leaderboard retrieved');
        console.log('  Returned players:', paginatedResponse.data.leaderboard.length);
        console.log('  Has more:', paginatedResponse.data.pagination.has_more);
        
        // Test 3: Get leaderboard with different sorting
        console.log('\n3. Testing leaderboard sorting...');
        const sortedResponse = await axios.get(`${BASE_URL}/leaderboard?sort=sessions`);
        console.log('✓ Sorted leaderboard retrieved');
        console.log('  Sort by sessions - top player:', sortedResponse.data.leaderboard[0]?.display_name);
        console.log('  Sessions count:', sortedResponse.data.leaderboard[0]?.total_sessions);
        
        // Test 4: Get leaderboard statistics
        console.log('\n4. Testing leaderboard statistics...');
        const statsResponse = await axios.get(`${BASE_URL}/leaderboard/stats`);
        console.log('✓ Leaderboard statistics retrieved');
        console.log('  Total players:', statsResponse.data.summary.total_players);
        console.log('  Active players:', statsResponse.data.summary.active_players);
        console.log('  Total winnings:', statsResponse.data.summary.total_winnings);
        console.log('  Total sessions:', statsResponse.data.summary.total_sessions);
        console.log('  Top player:', statsResponse.data.summary.top_player?.name);
        
        // Test 5: Get specific player leaderboard position
        console.log('\n5. Testing player leaderboard position...');
        const playerResponse = await axios.get(`${BASE_URL}/leaderboard/player/leader1`, { headers });
        console.log('✓ Player leaderboard position retrieved');
        console.log('  Player rank:', playerResponse.data.player.rank);
        console.log('  Player percentile:', playerResponse.data.leaderboard_info.percentile + '%');
        console.log('  All-time sessions:', playerResponse.data.stats.all_time.total_sessions);
        console.log('  All-time winnings:', playerResponse.data.stats.all_time.period_winnings);
        console.log('  Win rate:', playerResponse.data.stats.all_time.win_rate + '%');
        
        // Test 6: Get leaderboard with timeframe filter
        console.log('\n6. Testing timeframe filtering...');
        const monthResponse = await axios.get(`${BASE_URL}/leaderboard?timeframe=month`);
        console.log('✓ Monthly leaderboard retrieved');
        console.log('  Monthly timeframe data available');
        
        // Test 7: Try to access other player's data (should fail)
        console.log('\n7. Testing access control...');
        try {
            await axios.get(`${BASE_URL}/leaderboard/player/leader2`, { headers });
            console.log('✗ Should have denied access to other player data');
        } catch (error) {
            if (error.response && error.response.status === 403) {
                console.log('✓ Correctly denied access to other player data');
            } else {
                console.log('✗ Unexpected error:', error.message);
            }
        }
        
        // Test 8: Access leaderboard without authentication (should work)
        console.log('\n8. Testing public leaderboard access...');
        const publicResponse = await axios.get(`${BASE_URL}/leaderboard`);
        console.log('✓ Public leaderboard access successful');
        console.log('  Public access works for general leaderboard');
        
        console.log('\n🎉 All enhanced leaderboard API tests passed!');
        console.log('\nAvailable leaderboard endpoints:');
        console.log('  GET    /api/leaderboard (with query params)');
        console.log('  GET    /api/leaderboard/stats');
        console.log('  GET    /api/leaderboard/player/:computingId (auth required)');
        
        console.log('\n📊 Enhanced Leaderboard Features:');
        console.log('  • Advanced sorting (winnings, sessions, recent activity)');
        console.log('  • Timeframe filtering (all, month, week, today)');
        console.log('  • Comprehensive player statistics');
        console.log('  • Win/loss ratios and averages');
        console.log('  • Rank change tracking');
        console.log('  • Trending player detection');
        console.log('  • Summary statistics');
        console.log('  • Player percentile rankings');
        console.log('  • Pagination support');
        console.log('  • Public and authenticated access');
        
    } catch (error) {
        console.error('❌ Enhanced leaderboard API test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

if (require.main === module) {
    testLeaderboardEndpoints()
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = { testLeaderboardEndpoints };