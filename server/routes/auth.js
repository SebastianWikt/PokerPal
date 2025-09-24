const express = require('express');
const Joi = require('joi');
const { generateToken, authenticateToken } = require('../middleware/auth');
const { validateBody, asyncHandler } = require('../middleware/validation');
const { createError, createNotFoundError, createValidationError } = require('../middleware/errorHandler');
const DatabaseUtils = require('../database/utils');

const router = express.Router();

// Validation schemas
const loginSchema = Joi.object({
    computing_id: Joi.string()
        .pattern(/^[a-zA-Z0-9]+$/)
        .min(3)
        .max(50)
        .required()
        .messages({
            'string.pattern.base': 'Computing ID must contain only letters and numbers',
            'string.min': 'Computing ID must be at least 3 characters long',
            'string.max': 'Computing ID must not exceed 50 characters',
            'any.required': 'Computing ID is required'
        })
});

/**
 * POST /api/auth/login
 * Authenticate user with computing ID
 */
router.post('/login', validateBody(loginSchema), asyncHandler(async (req, res) => {
    const { computing_id } = req.body;
    
    // Check if user exists
    const user = await DatabaseUtils.getPlayer(computing_id);
    
    if (!user) {
        const error = createError('Computing ID not found. Please create a profile first.', 401, 'Authentication failed');
        error.requiresProfile = true;
        throw error;
    }
    
    // Generate JWT token
    const token = generateToken(user);
    
    // Return user info and token
    res.json({
        message: 'Login successful',
        token: token,
        user: {
            computing_id: user.computing_id,
            first_name: user.first_name,
            last_name: user.last_name,
            is_admin: Boolean(user.is_admin),
            total_winnings: parseFloat(user.total_winnings) || 0
        }
    });
}));

/**
 * POST /api/auth/logout
 * Logout user (client-side token removal)
 */
router.post('/logout', authenticateToken, async (req, res) => {
    try {
        // In a more complex system, we might maintain a token blacklist
        // For now, we rely on client-side token removal
        
        res.json({
            message: 'Logout successful'
        });
        
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            error: 'Logout failed',
            message: 'An unexpected error occurred during logout'
        });
    }
});

/**
 * GET /api/auth/me
 * Get current user information
 */
router.get('/me', authenticateToken, async (req, res) => {
    try {
        // Get fresh user data from database
        const user = await DatabaseUtils.getPlayer(req.user.computing_id);
        
        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                message: 'User account no longer exists'
            });
        }
        
        res.json({
            user: {
                computing_id: user.computing_id,
                first_name: user.first_name,
                last_name: user.last_name,
                years_of_experience: user.years_of_experience,
                level: user.level,
                major: user.major,
                is_admin: Boolean(user.is_admin),
                total_winnings: parseFloat(user.total_winnings) || 0,
                created_at: user.created_at,
                updated_at: user.updated_at
            }
        });
        
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            error: 'Failed to get user information',
            message: 'An unexpected error occurred'
        });
    }
});

/**
 * POST /api/auth/verify
 * Verify if computing ID exists (for profile creation check)
 */
router.post('/verify', validateBody(loginSchema), async (req, res) => {
    try {
        const { computing_id } = req.body;
        
        const user = await DatabaseUtils.getPlayer(computing_id);
        
        res.json({
            exists: !!user,
            computing_id: computing_id
        });
        
    } catch (error) {
        console.error('Verify error:', error);
        res.status(500).json({
            error: 'Verification failed',
            message: 'An unexpected error occurred during verification'
        });
    }
});

/**
 * GET /api/auth/status
 * Check authentication status
 */
router.get('/status', authenticateToken, async (req, res) => {
    try {
        res.json({
            authenticated: true,
            user: {
                computing_id: req.user.computing_id,
                first_name: req.user.first_name,
                last_name: req.user.last_name,
                is_admin: req.user.is_admin
            }
        });
        
    } catch (error) {
        console.error('Status check error:', error);
        res.status(500).json({
            error: 'Status check failed',
            message: 'An unexpected error occurred'
        });
    }
});

module.exports = router;