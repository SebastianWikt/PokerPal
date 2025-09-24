const request = require('supertest');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const app = require('../../app');
const db = require('../../database/utils');

// Mock database and file system
jest.mock('../../database/utils');
jest.mock('fs');

describe('Sessions Routes', () => {
    let authToken;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Create auth token for tests
        authToken = jwt.sign(
            { computing_id: 'test123' },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '24h' }
        );

        // Mock file system operations
        fs.existsSync = jest.fn().mockReturnValue(true);
        fs.mkdirSync = jest.fn();
    });

    describe('POST /api/sessions', () => {
        it('should create check-in session successfully', async () => {
            const mockPlayer = {
                computing_id: 'test123',
                first_name: 'Test',
                last_name: 'User'
            };

            const createdSession = {
                entry_id: 1,
                computing_id: 'test123',
                session_date: '2023-12-01',
                start_photo_url: '/uploads/sessions/start_test123_20231201.jpg',
                start_chips: 250.00,
                start_chip_breakdown: { red: 10, blue: 5, green: 2 },
                is_completed: false
            };

            // Mock database calls
            db.get.mockResolvedValueOnce(mockPlayer); // Player exists
            db.get.mockResolvedValueOnce(null); // No incomplete session
            db.run.mockResolvedValue({ lastID: 1 });
            db.get.mockResolvedValueOnce(createdSession); // Return created session

            const response = await request(app)
                .post('/api/sessions')
                .set('Authorization', `Bearer ${authToken}`)
                .field('computing_id', 'test123')
                .field('session_date', '2023-12-01')
                .field('type', 'checkin')
                .attach('photo', Buffer.from('fake image data'), 'test.jpg')
                .expect(201);

            expect(response.body).toMatchObject({
                computing_id: 'test123',
                session_date: '2023-12-01',
                is_completed: false
            });
            expect(response.body).toHaveProperty('start_photo_url');
            expect(response.body).toHaveProperty('start_chips');
        });

        it('should create check-out session successfully', async () => {
            const mockPlayer = {
                computing_id: 'test123',
                first_name: 'Test',
                last_name: 'User'
            };

            const incompleteSession = {
                entry_id: 1,
                computing_id: 'test123',
                session_date: '2023-12-01',
                start_chips: 250.00,
                is_completed: false
            };

            const completedSession = {
                ...incompleteSession,
                end_photo_url: '/uploads/sessions/end_test123_20231201.jpg',
                end_chips: 375.50,
                end_chip_breakdown: { red: 15, blue: 7, green: 3 },
                net_winnings: 125.50,
                is_completed: true
            };

            // Mock database calls
            db.get.mockResolvedValueOnce(mockPlayer); // Player exists
            db.get.mockResolvedValueOnce(incompleteSession); // Has incomplete session
            db.run.mockResolvedValue({ changes: 1 });
            db.get.mockResolvedValueOnce(completedSession); // Return updated session

            const response = await request(app)
                .post('/api/sessions')
                .set('Authorization', `Bearer ${authToken}`)
                .field('computing_id', 'test123')
                .field('session_date', '2023-12-01')
                .field('type', 'checkout')
                .attach('photo', Buffer.from('fake image data'), 'test.jpg')
                .expect(200);

            expect(response.body).toMatchObject({
                computing_id: 'test123',
                is_completed: true,
                net_winnings: 125.50
            });
            expect(response.body).toHaveProperty('end_photo_url');
            expect(response.body).toHaveProperty('end_chips');
        });

        it('should return 404 if player does not exist', async () => {
            db.get.mockResolvedValue(null); // Player doesn't exist

            const response = await request(app)
                .post('/api/sessions')
                .set('Authorization', `Bearer ${authToken}`)
                .field('computing_id', 'nonexistent')
                .field('type', 'checkin')
                .expect(404);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('Player not found');
        });

        it('should return 400 if trying to check-in with incomplete session', async () => {
            const mockPlayer = {
                computing_id: 'test123',
                first_name: 'Test'
            };

            const incompleteSession = {
                entry_id: 1,
                computing_id: 'test123',
                is_completed: false
            };

            db.get.mockResolvedValueOnce(mockPlayer);
            db.get.mockResolvedValueOnce(incompleteSession);

            const response = await request(app)
                .post('/api/sessions')
                .set('Authorization', `Bearer ${authToken}`)
                .field('computing_id', 'test123')
                .field('type', 'checkin')
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('incomplete session');
        });

        it('should return 400 if trying to check-out without incomplete session', async () => {
            const mockPlayer = {
                computing_id: 'test123',
                first_name: 'Test'
            };

            db.get.mockResolvedValueOnce(mockPlayer);
            db.get.mockResolvedValueOnce(null); // No incomplete session

            const response = await request(app)
                .post('/api/sessions')
                .set('Authorization', `Bearer ${authToken}`)
                .field('computing_id', 'test123')
                .field('type', 'checkout')
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('No incomplete session');
        });

        it('should validate required fields', async () => {
            const response = await request(app)
                .post('/api/sessions')
                .set('Authorization', `Bearer ${authToken}`)
                .field('computing_id', '')
                .field('type', 'checkin')
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('validation');
        });

        it('should validate session type', async () => {
            const response = await request(app)
                .post('/api/sessions')
                .set('Authorization', `Bearer ${authToken}`)
                .field('computing_id', 'test123')
                .field('type', 'invalid')
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        it('should require photo upload', async () => {
            const mockPlayer = {
                computing_id: 'test123',
                first_name: 'Test'
            };

            db.get.mockResolvedValue(mockPlayer);

            const response = await request(app)
                .post('/api/sessions')
                .set('Authorization', `Bearer ${authToken}`)
                .field('computing_id', 'test123')
                .field('type', 'checkin')
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('Photo is required');
        });

        it('should require authentication', async () => {
            const response = await request(app)
                .post('/api/sessions')
                .field('computing_id', 'test123')
                .field('type', 'checkin')
                .expect(401);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('GET /api/sessions/:computingId', () => {
        it('should get player sessions', async () => {
            const mockSessions = [
                {
                    entry_id: 1,
                    computing_id: 'test123',
                    session_date: '2023-12-01',
                    start_chips: 250.00,
                    end_chips: 375.50,
                    net_winnings: 125.50,
                    is_completed: true
                },
                {
                    entry_id: 2,
                    computing_id: 'test123',
                    session_date: '2023-12-02',
                    start_chips: 300.00,
                    is_completed: false
                }
            ];

            db.all.mockResolvedValue(mockSessions);

            const response = await request(app)
                .get('/api/sessions/test123')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toEqual(mockSessions);
            expect(response.body.length).toBe(2);
            expect(db.all).toHaveBeenCalledWith(
                expect.stringContaining('WHERE computing_id = ?'),
                ['test123']
            );
        });

        it('should return empty array for player with no sessions', async () => {
            db.all.mockResolvedValue([]);

            const response = await request(app)
                .get('/api/sessions/newuser123')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toEqual([]);
        });

        it('should require authentication', async () => {
            const response = await request(app)
                .get('/api/sessions/test123')
                .expect(401);

            expect(response.body).toHaveProperty('error');
        });

        it('should handle database errors', async () => {
            db.all.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .get('/api/sessions/test123')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(500);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('PUT /api/sessions/:sessionId', () => {
        it('should update session successfully', async () => {
            const sessionId = 1;
            const updateData = {
                end_chips: 400.00,
                net_winnings: 150.00
            };

            const existingSession = {
                entry_id: sessionId,
                computing_id: 'test123',
                start_chips: 250.00,
                is_completed: false
            };

            const updatedSession = {
                ...existingSession,
                ...updateData,
                is_completed: true
            };

            db.get.mockResolvedValueOnce(existingSession);
            db.run.mockResolvedValue({ changes: 1 });
            db.get.mockResolvedValueOnce(updatedSession);

            const response = await request(app)
                .put(`/api/sessions/${sessionId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body).toMatchObject(updateData);
            expect(response.body.is_completed).toBe(true);
        });

        it('should return 404 for non-existent session', async () => {
            db.get.mockResolvedValue(null);

            const response = await request(app)
                .put('/api/sessions/999')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ end_chips: 400.00 })
                .expect(404);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('Session not found');
        });

        it('should validate update data', async () => {
            const response = await request(app)
                .put('/api/sessions/1')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ end_chips: -100 }) // Invalid negative value
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        it('should not allow updating immutable fields', async () => {
            const sessionId = 1;
            const updateData = {
                entry_id: 999, // Should be ignored
                computing_id: 'hacker123', // Should be ignored
                end_chips: 400.00
            };

            const existingSession = {
                entry_id: sessionId,
                computing_id: 'test123',
                start_chips: 250.00
            };

            db.get.mockResolvedValue(existingSession);
            db.run.mockResolvedValue({ changes: 1 });

            const response = await request(app)
                .put(`/api/sessions/${sessionId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(200);

            // Verify immutable fields weren't updated
            expect(db.run).toHaveBeenCalledWith(
                expect.not.stringContaining('entry_id'),
                expect.any(Array)
            );
            expect(db.run).toHaveBeenCalledWith(
                expect.not.stringContaining('computing_id'),
                expect.any(Array)
            );
        });

        it('should require authentication', async () => {
            const response = await request(app)
                .put('/api/sessions/1')
                .send({ end_chips: 400.00 })
                .expect(401);

            expect(response.body).toHaveProperty('error');
        });
    });
});