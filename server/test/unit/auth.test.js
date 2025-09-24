const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const app = require('../../app');
const db = require('../../database/utils');

// Mock database
jest.mock('../../database/utils');

describe('Auth Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/auth/login', () => {
        it('should login existing user successfully', async () => {
            const mockUser = {
                computing_id: 'test123',
                first_name: 'Test',
                last_name: 'User',
                is_admin: false,
                total_winnings: 100.50
            };

            db.get.mockResolvedValue(mockUser);

            const response = await request(app)
                .post('/api/auth/login')
                .send({ computing_id: 'test123' })
                .expect(200);

            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('user');
            expect(response.body.user.computing_id).toBe('test123');
            expect(response.body.isAdmin).toBe(false);

            // Verify JWT token
            const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET || 'test-secret');
            expect(decoded.computing_id).toBe('test123');
        });

        it('should return 404 for non-existent user', async () => {
            db.get.mockResolvedValue(null);

            const response = await request(app)
                .post('/api/auth/login')
                .send({ computing_id: 'nonexistent' })
                .expect(404);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('not found');
        });

        it('should validate computing_id format', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ computing_id: 'ab' }) // Too short
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('validation');
        });

        it('should handle database errors', async () => {
            db.get.mockRejectedValue(new Error('Database connection failed'));

            const response = await request(app)
                .post('/api/auth/login')
                .send({ computing_id: 'test123' })
                .expect(500);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('POST /api/auth/logout', () => {
        it('should logout successfully with valid token', async () => {
            const token = jwt.sign(
                { computing_id: 'test123' },
                process.env.JWT_SECRET || 'test-secret',
                { expiresIn: '24h' }
            );

            const response = await request(app)
                .post('/api/auth/logout')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body).toHaveProperty('success');
            expect(response.body.success).toBe(true);
        });

        it('should return 401 without token', async () => {
            const response = await request(app)
                .post('/api/auth/logout')
                .expect(401);

            expect(response.body).toHaveProperty('error');
        });

        it('should return 401 with invalid token', async () => {
            const response = await request(app)
                .post('/api/auth/logout')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('GET /api/auth/me', () => {
        it('should return current user info with valid token', async () => {
            const mockUser = {
                computing_id: 'test123',
                first_name: 'Test',
                last_name: 'User',
                is_admin: false,
                total_winnings: 100.50
            };

            const token = jwt.sign(
                { computing_id: 'test123' },
                process.env.JWT_SECRET || 'test-secret',
                { expiresIn: '24h' }
            );

            db.get.mockResolvedValue(mockUser);

            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body).toHaveProperty('user');
            expect(response.body.user.computing_id).toBe('test123');
        });

        it('should return 401 without token', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .expect(401);

            expect(response.body).toHaveProperty('error');
        });

        it('should return 404 if user no longer exists', async () => {
            const token = jwt.sign(
                { computing_id: 'deleted123' },
                process.env.JWT_SECRET || 'test-secret',
                { expiresIn: '24h' }
            );

            db.get.mockResolvedValue(null);

            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${token}`)
                .expect(404);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('POST /api/auth/verify', () => {
        it('should verify existing computing ID', async () => {
            const mockUser = {
                computing_id: 'test123',
                first_name: 'Test',
                last_name: 'User'
            };

            db.get.mockResolvedValue(mockUser);

            const response = await request(app)
                .post('/api/auth/verify')
                .send({ computing_id: 'test123' })
                .expect(200);

            expect(response.body).toHaveProperty('exists');
            expect(response.body.exists).toBe(true);
            expect(response.body).toHaveProperty('user');
        });

        it('should return false for non-existent computing ID', async () => {
            db.get.mockResolvedValue(null);

            const response = await request(app)
                .post('/api/auth/verify')
                .send({ computing_id: 'nonexistent' })
                .expect(200);

            expect(response.body).toHaveProperty('exists');
            expect(response.body.exists).toBe(false);
        });

        it('should validate computing_id format', async () => {
            const response = await request(app)
                .post('/api/auth/verify')
                .send({ computing_id: '' })
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('GET /api/auth/status', () => {
        it('should return authentication status with valid token', async () => {
            const token = jwt.sign(
                { computing_id: 'test123' },
                process.env.JWT_SECRET || 'test-secret',
                { expiresIn: '24h' }
            );

            const response = await request(app)
                .get('/api/auth/status')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body).toHaveProperty('authenticated');
            expect(response.body.authenticated).toBe(true);
            expect(response.body).toHaveProperty('computing_id');
            expect(response.body.computing_id).toBe('test123');
        });

        it('should return unauthenticated status without token', async () => {
            const response = await request(app)
                .get('/api/auth/status')
                .expect(200);

            expect(response.body).toHaveProperty('authenticated');
            expect(response.body.authenticated).toBe(false);
        });

        it('should return unauthenticated status with invalid token', async () => {
            const response = await request(app)
                .get('/api/auth/status')
                .set('Authorization', 'Bearer invalid-token')
                .expect(200);

            expect(response.body).toHaveProperty('authenticated');
            expect(response.body.authenticated).toBe(false);
        });
    });
});

describe('Auth Middleware', () => {
    const authMiddleware = require('../../middleware/auth');

    describe('authenticateToken', () => {
        let req, res, next;

        beforeEach(() => {
            req = {
                headers: {}
            };
            res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            next = jest.fn();
        });

        it('should authenticate valid token', () => {
            const token = jwt.sign(
                { computing_id: 'test123' },
                process.env.JWT_SECRET || 'test-secret',
                { expiresIn: '24h' }
            );

            req.headers.authorization = `Bearer ${token}`;

            authMiddleware.authenticateToken(req, res, next);

            expect(req.user).toBeDefined();
            expect(req.user.computing_id).toBe('test123');
            expect(next).toHaveBeenCalled();
        });

        it('should reject missing token', () => {
            authMiddleware.authenticateToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: 'Access token required' });
            expect(next).not.toHaveBeenCalled();
        });

        it('should reject invalid token', () => {
            req.headers.authorization = 'Bearer invalid-token';

            authMiddleware.authenticateToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
            expect(next).not.toHaveBeenCalled();
        });

        it('should reject expired token', () => {
            const expiredToken = jwt.sign(
                { computing_id: 'test123' },
                process.env.JWT_SECRET || 'test-secret',
                { expiresIn: '-1h' } // Expired 1 hour ago
            );

            req.headers.authorization = `Bearer ${expiredToken}`;

            authMiddleware.authenticateToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('requireAdmin', () => {
        let req, res, next;

        beforeEach(() => {
            req = {};
            res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            next = jest.fn();
            db.get.mockClear();
        });

        it('should allow admin users', async () => {
            req.user = { computing_id: 'admin123' };
            
            const mockAdmin = {
                computing_id: 'admin123',
                is_admin: true
            };

            db.get.mockResolvedValue(mockAdmin);

            await authMiddleware.requireAdmin(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should reject non-admin users', async () => {
            req.user = { computing_id: 'user123' };
            
            const mockUser = {
                computing_id: 'user123',
                is_admin: false
            };

            db.get.mockResolvedValue(mockUser);

            await authMiddleware.requireAdmin(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ error: 'Admin privileges required' });
            expect(next).not.toHaveBeenCalled();
        });

        it('should reject if user not found', async () => {
            req.user = { computing_id: 'nonexistent' };

            db.get.mockResolvedValue(null);

            await authMiddleware.requireAdmin(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
            expect(next).not.toHaveBeenCalled();
        });
    });
});