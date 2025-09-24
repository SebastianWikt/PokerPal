const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../app');
const db = require('../../database/utils');

// Mock database
jest.mock('../../database/utils');

describe('Players Routes', () => {
    let authToken;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Create auth token for tests
        authToken = jwt.sign(
            { computing_id: 'test123' },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '24h' }
        );
    });

    describe('GET /api/players/:computingId', () => {
        it('should get player by computing ID', async () => {
            const mockPlayer = {
                computing_id: 'test123',
                first_name: 'Test',
                last_name: 'User',
                total_winnings: 150.75,
                years_of_experience: 3,
                level: 'Intermediate',
                major: 'Computer Science',
                is_admin: false
            };

            db.get.mockResolvedValue(mockPlayer);

            const response = await request(app)
                .get('/api/players/test123')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toEqual(mockPlayer);
            expect(db.get).toHaveBeenCalledWith(
                'SELECT * FROM players WHERE computing_id = ?',
                ['test123']
            );
        });

        it('should return 404 for non-existent player', async () => {
            db.get.mockResolvedValue(null);

            const response = await request(app)
                .get('/api/players/nonexistent')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('not found');
        });

        it('should require authentication', async () => {
            const response = await request(app)
                .get('/api/players/test123')
                .expect(401);

            expect(response.body).toHaveProperty('error');
        });

        it('should handle database errors', async () => {
            db.get.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .get('/api/players/test123')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(500);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('POST /api/players', () => {
        it('should create new player successfully', async () => {
            const playerData = {
                computing_id: 'newuser123',
                first_name: 'New',
                last_name: 'User',
                years_of_experience: 2,
                level: 'Beginner',
                major: 'Mathematics'
            };

            const createdPlayer = {
                ...playerData,
                total_winnings: 0.00,
                is_admin: false,
                created_at: '2023-12-01T00:00:00Z'
            };

            // Mock database calls
            db.get.mockResolvedValue(null); // Player doesn't exist
            db.run.mockResolvedValue({ lastID: 1 });
            db.get.mockResolvedValueOnce(null).mockResolvedValueOnce(createdPlayer);

            const response = await request(app)
                .post('/api/players')
                .send(playerData)
                .expect(201);

            expect(response.body).toMatchObject(playerData);
            expect(response.body.total_winnings).toBe(0.00);
            expect(response.body.is_admin).toBe(false);
        });

        it('should return 409 if player already exists', async () => {
            const playerData = {
                computing_id: 'existing123',
                first_name: 'Existing',
                last_name: 'User'
            };

            const existingPlayer = {
                computing_id: 'existing123',
                first_name: 'Existing',
                last_name: 'User'
            };

            db.get.mockResolvedValue(existingPlayer);

            const response = await request(app)
                .post('/api/players')
                .send(playerData)
                .expect(409);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('already exists');
        });

        it('should validate required fields', async () => {
            const invalidData = {
                computing_id: '',
                first_name: 'Test'
                // Missing last_name
            };

            const response = await request(app)
                .post('/api/players')
                .send(invalidData)
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('validation');
        });

        it('should validate computing_id format', async () => {
            const invalidData = {
                computing_id: 'ab', // Too short
                first_name: 'Test',
                last_name: 'User'
            };

            const response = await request(app)
                .post('/api/players')
                .send(invalidData)
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        it('should validate years_of_experience range', async () => {
            const invalidData = {
                computing_id: 'test123',
                first_name: 'Test',
                last_name: 'User',
                years_of_experience: -1 // Invalid
            };

            const response = await request(app)
                .post('/api/players')
                .send(invalidData)
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('PUT /api/players/:computingId', () => {
        it('should update player successfully', async () => {
            const updateData = {
                first_name: 'Updated',
                years_of_experience: 5,
                level: 'Advanced'
            };

            const existingPlayer = {
                computing_id: 'test123',
                first_name: 'Test',
                last_name: 'User',
                years_of_experience: 3,
                level: 'Intermediate',
                major: 'Computer Science',
                total_winnings: 100.00,
                is_admin: false
            };

            const updatedPlayer = {
                ...existingPlayer,
                ...updateData
            };

            db.get.mockResolvedValueOnce(existingPlayer).mockResolvedValueOnce(updatedPlayer);
            db.run.mockResolvedValue({ changes: 1 });

            const response = await request(app)
                .put('/api/players/test123')
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.first_name).toBe('Updated');
            expect(response.body.years_of_experience).toBe(5);
            expect(response.body.level).toBe('Advanced');
        });

        it('should return 404 for non-existent player', async () => {
            db.get.mockResolvedValue(null);

            const response = await request(app)
                .put('/api/players/nonexistent')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ first_name: 'Updated' })
                .expect(404);

            expect(response.body).toHaveProperty('error');
        });

        it('should not allow updating computing_id', async () => {
            const updateData = {
                computing_id: 'newid123', // Should be ignored
                first_name: 'Updated'
            };

            const existingPlayer = {
                computing_id: 'test123',
                first_name: 'Test',
                last_name: 'User'
            };

            db.get.mockResolvedValue(existingPlayer);
            db.run.mockResolvedValue({ changes: 1 });

            const response = await request(app)
                .put('/api/players/test123')
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(200);

            // Verify computing_id wasn't changed
            expect(db.run).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE players SET'),
                expect.not.arrayContaining(['newid123'])
            );
        });

        it('should not allow updating total_winnings', async () => {
            const updateData = {
                total_winnings: 999.99, // Should be ignored
                first_name: 'Updated'
            };

            const existingPlayer = {
                computing_id: 'test123',
                first_name: 'Test',
                total_winnings: 100.00
            };

            db.get.mockResolvedValue(existingPlayer);
            db.run.mockResolvedValue({ changes: 1 });

            const response = await request(app)
                .put('/api/players/test123')
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(200);

            // Verify total_winnings wasn't in the update
            expect(db.run).toHaveBeenCalledWith(
                expect.not.stringContaining('total_winnings'),
                expect.any(Array)
            );
        });

        it('should require authentication', async () => {
            const response = await request(app)
                .put('/api/players/test123')
                .send({ first_name: 'Updated' })
                .expect(401);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('GET /api/players/leaderboard', () => {
        it('should return leaderboard sorted by winnings', async () => {
            const mockLeaderboard = [
                { first_name: 'John', last_name: 'Doe', total_winnings: 500.00 },
                { first_name: 'Jane', last_name: 'Smith', total_winnings: 350.25 },
                { first_name: 'Bob', last_name: 'Johnson', total_winnings: 200.50 },
                { first_name: 'Alice', last_name: 'Brown', total_winnings: -50.00 }
            ];

            db.all.mockResolvedValue(mockLeaderboard);

            const response = await request(app)
                .get('/api/players/leaderboard')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toEqual(mockLeaderboard);
            expect(response.body.length).toBe(4);
            
            // Verify sorting (highest winnings first)
            expect(response.body[0].total_winnings).toBe(500.00);
            expect(response.body[1].total_winnings).toBe(350.25);
            expect(response.body[3].total_winnings).toBe(-50.00);

            expect(db.all).toHaveBeenCalledWith(
                expect.stringContaining('ORDER BY total_winnings DESC')
            );
        });

        it('should return empty array when no players exist', async () => {
            db.all.mockResolvedValue([]);

            const response = await request(app)
                .get('/api/players/leaderboard')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toEqual([]);
        });

        it('should only return first_name, last_name, and total_winnings', async () => {
            const mockLeaderboard = [
                { 
                    first_name: 'John', 
                    last_name: 'Doe', 
                    total_winnings: 500.00
                }
            ];

            db.all.mockResolvedValue(mockLeaderboard);

            const response = await request(app)
                .get('/api/players/leaderboard')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body[0]).toHaveProperty('first_name');
            expect(response.body[0]).toHaveProperty('last_name');
            expect(response.body[0]).toHaveProperty('total_winnings');
            
            // Should not include sensitive data
            expect(response.body[0]).not.toHaveProperty('computing_id');
            expect(response.body[0]).not.toHaveProperty('major');
            expect(response.body[0]).not.toHaveProperty('is_admin');
        });

        it('should require authentication', async () => {
            const response = await request(app)
                .get('/api/players/leaderboard')
                .expect(401);

            expect(response.body).toHaveProperty('error');
        });

        it('should handle database errors', async () => {
            db.all.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .get('/api/players/leaderboard')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(500);

            expect(response.body).toHaveProperty('error');
        });
    });
});