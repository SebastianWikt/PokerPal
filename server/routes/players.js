const express = require('express');
const Joi = require('joi');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateBody, validateParams, schemas } = require('../middleware/validation');
const DatabaseUtils = require('../database/utils');

const router = express.Router();

// Validation schemas
const createPlayerSchema = Joi.object({
    computing_id: schemas.computingId,
    first_name: schemas.name,
    last_name: schemas.name,
    years_of_experience: schemas.yearsOfExperience.optional(),
    level: schemas.level.optional(),
    major: schemas.major.optional()
});

const updatePlayerSchema = Joi.object({
    first_name: schemas.name.optional(),
    last_name: schemas.name.optional(),
    years_of_experience: schemas.yearsOfExperience.optional(),
    level: schemas.level.optional(),
    major: schemas.major.optional()
}).min(1); // At least one field must be provided

const computingIdSchema = Joi.object({
    computingId: schemas.computingId
});

/**
 * GET /api/players/:computingId
 * Get player information by computing ID
 */
router.get('/:computingId', 
    validateParams(computingIdSchema),
    authenticateToken,
    async (req, res) => {
        try {
            const { computingId } = req.params;
            
            // Check if user can access this profile (own profile or admin)
            if (req.user.computing_id !== computingId && !req.user.is_admin) {
                return res.status(403).json({
                    error: 'Access denied',
                    message: 'You can only view your own profile'
                });
            }
            
            const player = await DatabaseUtils.getPlayer(computingId);
            
            if (!player) {
                return res.status(404).json({
                    error: 'Player not found',
                    message: 'No player found with the specified computing ID'
                });
            }
            
            // Format response
            const playerData = {
                computing_id: player.computing_id,
                first_name: player.first_name,
                last_name: player.last_name,
                years_of_experience: player.years_of_experience,
                level: player.level,
                major: player.major,
                total_winnings: parseFloat(player.total_winnings) || 0,
                is_admin: Boolean(player.is_admin),
                created_at: player.created_at,
                updated_at: player.updated_at
            };
            
            res.json({
                player: playerData
            });
            
        } catch (error) {
            console.error('Get player error:', error);
            res.status(500).json({
                error: 'Failed to retrieve player',
                message: 'An unexpected error occurred'
            });
        }
    }
);

/**
 * POST /api/players
 * Create a new player profile
 */
router.post('/', 
    validateBody(createPlayerSchema),
    async (req, res) => {
        try {
            const playerData = req.body;
            
            // Check if player already exists
            const existingPlayer = await DatabaseUtils.getPlayer(playerData.computing_id);
            if (existingPlayer) {
                return res.status(409).json({
                    error: 'Player already exists',
                    message: 'A player with this computing ID already exists'
                });
            }
            
            // Create the player
            const result = await DatabaseUtils.createPlayer(playerData);
            
            // Retrieve the created player
            const newPlayer = await DatabaseUtils.getPlayer(playerData.computing_id);
            
            // Format response
            const responseData = {
                computing_id: newPlayer.computing_id,
                first_name: newPlayer.first_name,
                last_name: newPlayer.last_name,
                years_of_experience: newPlayer.years_of_experience,
                level: newPlayer.level,
                major: newPlayer.major,
                total_winnings: parseFloat(newPlayer.total_winnings) || 0,
                is_admin: Boolean(newPlayer.is_admin),
                created_at: newPlayer.created_at,
                updated_at: newPlayer.updated_at
            };
            
            res.status(201).json({
                message: 'Player created successfully',
                player: responseData
            });
            
        } catch (error) {
            console.error('Create player error:', error);
            
            if (error.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
                return res.status(409).json({
                    error: 'Player already exists',
                    message: 'A player with this computing ID already exists'
                });
            }
            
            res.status(500).json({
                error: 'Failed to create player',
                message: 'An unexpected error occurred'
            });
        }
    }
);

/**
 * PUT /api/players/:computingId
 * Update player profile information
 */
router.put('/:computingId',
    validateParams(computingIdSchema),
    validateBody(updatePlayerSchema),
    authenticateToken,
    async (req, res) => {
        try {
            const { computingId } = req.params;
            const updates = req.body;
            
            // Check if user can update this profile (own profile or admin)
            if (req.user.computing_id !== computingId && !req.user.is_admin) {
                return res.status(403).json({
                    error: 'Access denied',
                    message: 'You can only update your own profile'
                });
            }
            
            // Check if player exists
            const existingPlayer = await DatabaseUtils.getPlayer(computingId);
            if (!existingPlayer) {
                return res.status(404).json({
                    error: 'Player not found',
                    message: 'No player found with the specified computing ID'
                });
            }
            
            // Update the player
            console.debug('Updating player:', computingId, 'with updates:', updates);
            const updateResult = await DatabaseUtils.updatePlayer(computingId, updates);
            console.debug('Update result:', updateResult);
            
            // Retrieve updated player data
            const updatedPlayer = await DatabaseUtils.getPlayer(computingId);
            console.debug('Updated player from DB:', updatedPlayer);
            
            // Create audit log if admin is updating another user's profile
            if (req.user.is_admin && req.user.computing_id !== computingId) {
                await DatabaseUtils.createAuditLog({
                    admin_id: req.user.computing_id,
                    action: 'UPDATE_PLAYER_PROFILE',
                    target_table: 'players',
                    target_id: computingId,
                    old_values: existingPlayer,
                    new_values: updatedPlayer
                });
            }
            
            // Format response
            const responseData = {
                computing_id: updatedPlayer.computing_id,
                first_name: updatedPlayer.first_name,
                last_name: updatedPlayer.last_name,
                years_of_experience: updatedPlayer.years_of_experience,
                level: updatedPlayer.level,
                major: updatedPlayer.major,
                total_winnings: parseFloat(updatedPlayer.total_winnings) || 0,
                is_admin: Boolean(updatedPlayer.is_admin),
                created_at: updatedPlayer.created_at,
                updated_at: updatedPlayer.updated_at
            };
            
            res.json({
                message: 'Player updated successfully',
                player: responseData
            });
            
        } catch (error) {
            console.error('Update player error:', error);
            res.status(500).json({
                error: 'Failed to update player',
                message: 'An unexpected error occurred'
            });
        }
    }
);

/**
 * GET /api/players/leaderboard
 * Get leaderboard with player rankings sorted by total winnings
 */
router.get('/leaderboard', async (req, res) => {
    try {
        // Get query parameters for pagination and filtering
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;
        
        // Validate limits
        if (limit > 100) {
            return res.status(400).json({
                error: 'Invalid limit',
                message: 'Limit cannot exceed 100'
            });
        }
        
        // Get leaderboard data
        const leaderboard = await DatabaseUtils.getLeaderboard();
        
        // Apply pagination
        const paginatedResults = leaderboard.slice(offset, offset + limit);
        
        // Format response with rankings
        const formattedLeaderboard = paginatedResults.map((player, index) => ({
            rank: offset + index + 1,
            first_name: player.first_name,
            last_name: player.last_name,
            total_winnings: parseFloat(player.total_winnings) || 0,
            display_name: `${player.first_name} ${player.last_name}`
        }));
        
        res.json({
            leaderboard: formattedLeaderboard,
            pagination: {
                total: leaderboard.length,
                limit: limit,
                offset: offset,
                has_more: offset + limit < leaderboard.length
            }
        });
        
    } catch (error) {
        console.error('Get leaderboard error:', error);
        res.status(500).json({
            error: 'Failed to retrieve leaderboard',
            message: 'An unexpected error occurred'
        });
    }
});

/**
 * GET /api/players/:computingId/entries
 * Get player's session entries
 */
router.get('/:computingId/entries',
    validateParams(computingIdSchema),
    authenticateToken,
    async (req, res) => {
        try {
            const { computingId } = req.params;
            
            // Check if user can access these entries (own entries or admin)
            if (req.user.computing_id !== computingId && !req.user.is_admin) {
                return res.status(403).json({
                    error: 'Access denied',
                    message: 'You can only view your own entries'
                });
            }
            
            // Check if player exists
            const player = await DatabaseUtils.getPlayer(computingId);
            if (!player) {
                return res.status(404).json({
                    error: 'Player not found',
                    message: 'No player found with the specified computing ID'
                });
            }
            
            // Get player entries
            const entries = await DatabaseUtils.getPlayerEntries(computingId);
            
            // Format entries
            const formattedEntries = entries.map(entry => ({
                entry_id: entry.entry_id,
                session_date: entry.session_date,
                start_photo_url: entry.start_photo_url,
                start_chips: parseFloat(entry.start_chips) || 0,
                start_chip_breakdown: entry.start_chip_breakdown,
                end_photo_url: entry.end_photo_url,
                end_chips: parseFloat(entry.end_chips) || 0,
                end_chip_breakdown: entry.end_chip_breakdown,
                net_winnings: parseFloat(entry.net_winnings) || 0,
                is_completed: Boolean(entry.is_completed),
                admin_override: Boolean(entry.admin_override),
                created_at: entry.created_at,
                updated_at: entry.updated_at
            }));
            
            res.json({
                entries: formattedEntries,
                player: {
                    computing_id: player.computing_id,
                    first_name: player.first_name,
                    last_name: player.last_name,
                    total_winnings: parseFloat(player.total_winnings) || 0
                }
            });
            
        } catch (error) {
            console.error('Get player entries error:', error);
            res.status(500).json({
                error: 'Failed to retrieve player entries',
                message: 'An unexpected error occurred'
            });
        }
    }
);

/**
 * POST /api/players/:computingId/recalculate-winnings
 * Recalculate player's total winnings (admin only)
 */
router.post('/:computingId/recalculate-winnings',
    validateParams(computingIdSchema),
    authenticateToken,
    requireAdmin,
    async (req, res) => {
        try {
            const { computingId } = req.params;
            
            // Check if player exists
            const player = await DatabaseUtils.getPlayer(computingId);
            if (!player) {
                return res.status(404).json({
                    error: 'Player not found',
                    message: 'No player found with the specified computing ID'
                });
            }
            
            const oldWinnings = parseFloat(player.total_winnings) || 0;
            
            // Recalculate winnings
            const newWinnings = await DatabaseUtils.recalculatePlayerWinnings(computingId);
            
            // Create audit log
            await DatabaseUtils.createAuditLog({
                admin_id: req.user.computing_id,
                action: 'RECALCULATE_WINNINGS',
                target_table: 'players',
                target_id: computingId,
                old_values: { total_winnings: oldWinnings },
                new_values: { total_winnings: newWinnings }
            });
            
            res.json({
                message: 'Winnings recalculated successfully',
                old_winnings: oldWinnings,
                new_winnings: newWinnings,
                difference: newWinnings - oldWinnings
            });
            
        } catch (error) {
            console.error('Recalculate winnings error:', error);
            res.status(500).json({
                error: 'Failed to recalculate winnings',
                message: 'An unexpected error occurred'
            });
        }
    }
);

module.exports = router;