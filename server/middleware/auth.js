const jwt = require('jsonwebtoken');
const DatabaseUtils = require('../database/utils');

const JWT_SECRET = process.env.JWT_SECRET || 'poker-pal-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Generate JWT token for user
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
function generateToken(user) {
    const payload = {
        computing_id: user.computing_id,
        first_name: user.first_name,
        last_name: user.last_name,
        is_admin: user.is_admin
    };
    
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
function verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
}

/**
 * Authentication middleware
 * Verifies JWT token and adds user info to request
 */
async function authenticateToken(req, res, next) {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
        
        if (!token) {
            return res.status(401).json({
                error: 'Access denied',
                message: 'No token provided'
            });
        }
        
        const decoded = verifyToken(token);
        
        // Verify user still exists in database
        const user = await DatabaseUtils.getPlayer(decoded.computing_id);
        if (!user) {
            return res.status(401).json({
                error: 'Access denied',
                message: 'User not found'
            });
        }
        
        // Add user info to request
        req.user = {
            computing_id: user.computing_id,
            first_name: user.first_name,
            last_name: user.last_name,
            is_admin: Boolean(user.is_admin)
        };
        
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Access denied',
                message: 'Invalid token'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Access denied',
                message: 'Token expired'
            });
        }
        
        console.error('Authentication error:', error);
        res.status(500).json({
            error: 'Authentication failed',
            message: 'Internal server error'
        });
    }
}

/**
 * Admin authorization middleware
 * Requires user to be authenticated and have admin privileges
 */
function requireAdmin(req, res, next) {
    if (!req.user) {
        return res.status(401).json({
            error: 'Access denied',
            message: 'Authentication required'
        });
    }
    
    if (!req.user.is_admin) {
        return res.status(403).json({
            error: 'Access denied',
            message: 'Admin privileges required'
        });
    }
    
    next();
}

/**
 * Optional authentication middleware
 * Adds user info to request if token is provided, but doesn't require it
 */
async function optionalAuth(req, res, next) {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        if (token) {
            const decoded = verifyToken(token);
            const user = await DatabaseUtils.getPlayer(decoded.computing_id);
            
            if (user) {
                req.user = {
                    computing_id: user.computing_id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    is_admin: Boolean(user.is_admin)
                };
            }
        }
        
        next();
    } catch (error) {
        // For optional auth, we don't fail on token errors
        next();
    }
}

module.exports = {
    generateToken,
    verifyToken,
    authenticateToken,
    requireAdmin,
    optionalAuth
};