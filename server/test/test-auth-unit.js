const { generateToken, verifyToken } = require('../middleware/auth');
const DatabaseUtils = require('../database/utils');
const dbInitializer = require('../database/init');

async function testAuthUnit() {
    try {
        console.log('Testing authentication unit functions...');
        
        // Initialize database
        await dbInitializer.initialize();
        
        // Create a test user
        const testUser = {
            computing_id: 'testuser123',
            first_name: 'Test',
            last_name: 'User',
            years_of_experience: 3,
            level: 'Intermediate',
            major: 'Computer Science',
            is_admin: false
        };
        
        await DatabaseUtils.createPlayer(testUser);
        console.log('✓ Created test user');
        
        // Test token generation
        const token = generateToken(testUser);
        console.log('✓ Token generated successfully');
        console.log('  Token length:', token.length);
        
        // Test token verification
        const decoded = verifyToken(token);
        console.log('✓ Token verified successfully');
        console.log('  Decoded payload:', {
            computing_id: decoded.computing_id,
            first_name: decoded.first_name,
            last_name: decoded.last_name,
            is_admin: decoded.is_admin
        });
        
        // Test database user retrieval
        const retrievedUser = await DatabaseUtils.getPlayer('testuser123');
        console.log('✓ User retrieved from database');
        console.log('  User data:', {
            computing_id: retrievedUser.computing_id,
            first_name: retrievedUser.first_name,
            last_name: retrievedUser.last_name,
            is_admin: Boolean(retrievedUser.is_admin)
        });
        
        // Test invalid token
        try {
            verifyToken('invalid-token');
            console.log('✗ Should have failed for invalid token');
        } catch (error) {
            console.log('✓ Correctly rejected invalid token');
        }
        
        console.log('\n🎉 All authentication unit tests passed!');
        
    } catch (error) {
        console.error('❌ Authentication unit test failed:', error.message);
        throw error;
    }
}

if (require.main === module) {
    testAuthUnit()
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = { testAuthUnit };