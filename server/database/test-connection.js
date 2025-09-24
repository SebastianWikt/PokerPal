const dbConnection = require('./connection');
const dbInitializer = require('./init');
const DatabaseUtils = require('./utils');

async function testDatabase() {
    try {
        console.log('Testing database connection and utilities...');
        
        // Initialize database
        await dbInitializer.initialize();
        
        // Test health check
        const health = await DatabaseUtils.healthCheck();
        console.log('Health check:', health);
        
        // Test chip values
        const chipValues = await DatabaseUtils.getChipValues();
        console.log('Default chip values:', chipValues);
        
        // Test creating a player
        const playerData = {
            computing_id: 'test123',
            first_name: 'Test',
            last_name: 'User',
            years_of_experience: 2,
            level: 'Intermediate',
            major: 'Computer Science'
        };
        
        await DatabaseUtils.createPlayer(playerData);
        console.log('Created test player');
        
        // Test retrieving the player
        const player = await DatabaseUtils.getPlayer('test123');
        console.log('Retrieved player:', player);
        
        // Test creating an entry
        const entryData = {
            computing_id: 'test123',
            session_date: '2024-01-15',
            start_photo_url: '/uploads/test.jpg',
            start_chips: 100.00,
            start_chip_breakdown: { white: 50, red: 10 }
        };
        
        const entryResult = await DatabaseUtils.createEntry(entryData);
        console.log('Created entry with ID:', entryResult.lastID);
        
        // Test calculating chip total
        const chipTotal = await DatabaseUtils.calculateChipTotal({ white: 50, red: 10 });
        console.log('Calculated chip total:', chipTotal);
        
        // Test leaderboard
        const leaderboard = await DatabaseUtils.getLeaderboard();
        console.log('Leaderboard:', leaderboard);
        
        console.log('All database tests passed!');
        
    } catch (error) {
        console.error('Database test failed:', error);
    } finally {
        await dbConnection.close();
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    testDatabase();
}

module.exports = testDatabase;