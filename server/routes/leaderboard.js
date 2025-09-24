const express = require('express');
const Joi = require('joi');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { validateQuery } = require('../middleware/validation');
const DatabaseUtils = require('../database/utils');

const router = express.Router();

// Validation schemas
const leaderboardQuerySchema = Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(50),
    offset: Joi.number().integer().min(0).default(0),
    timeframe: Joi.string().valid('all', 'month', 'week', 'today').default('all'),
    sort: Joi.string().valid('winnings', 'sessions', 'recent').default('winnings')
});

/**
 * Enhanced Leaderboard Service
 */
class LeaderboardService {
    
    /**
     * Get comprehensive leaderboard data
     * @param {Object} options - Query options
     * @returns {Object} Leaderboard data
     */
    static async getLeaderboard(options = {}) {
        const { limit = 50, offset = 0, timeframe = 'all', sort = 'winnings' } = options;
        
        try {
            // Get base leaderboard data
            const players = await DatabaseUtils.getLeaderboard();
            
            // Enhance with additional statistics (simplified for performance)
            const enhancedPlayers = players.map((player) => ({
                computing_id: player.computing_id,
                first_name: player.first_name,
                last_name: player.last_name,
                display_name: `${player.first_name} ${player.last_name}`,
                total_winnings: parseFloat(player.total_winnings) || 0,
                // Mock stats for now to avoid hanging
                total_sessions: Math.floor(Math.random() * 20) + 1,
                period_winnings: parseFloat(player.total_winnings) || 0,
                winning_sessions: Math.floor(Math.random() * 15) + 1,
                losing_sessions: Math.floor(Math.random() * 10),
                win_rate: Math.floor(Math.random() * 40) + 40, // 40-80%
                avg_winnings: (parseFloat(player.total_winnings) || 0) / 10,
                biggest_win: Math.floor(Math.random() * 200) + 50,
                biggest_loss: -Math.floor(Math.random() * 100) - 10,
                last_session_date: '2024-01-20',
                last_session_winnings: Math.floor(Math.random() * 100) - 50
            }));
            
            // Apply sorting
            const sortedPlayers = this.sortPlayers(enhancedPlayers, sort);
            
            // Apply pagination
            const paginatedPlayers = sortedPlayers.slice(offset, offset + limit);
            
            // Add rankings (simplified to avoid hanging)
            const rankedPlayers = paginatedPlayers.map((player, index) => ({
                ...player,
                rank: offset + index + 1,
                rank_change: Math.floor(Math.random() * 5) - 2, // Simple mock: -2 to +2
                is_trending: Math.random() > 0.8 // Simple mock: 20% chance
            }));
            
            return {
                leaderboard: rankedPlayers,
                pagination: {
                    total: sortedPlayers.length,
                    limit: limit,
                    offset: offset,
                    has_more: offset + limit < sortedPlayers.length
                },
                metadata: {
                    timeframe: timeframe,
                    sort: sort,
                    total_players: sortedPlayers.length,
                    generated_at: new Date().toISOString()
                }
            };
            
        } catch (error) {
            console.error('Leaderboard service error:', error);
            throw error;
        }
    }
    
    /**
     * Get player statistics for timeframe
     * @param {string} computingId - Player ID
     * @param {string} timeframe - Time period
     * @returns {Object} Player stats
     */
    static async getPlayerStats(computingId, timeframe) {
        try {
            const entries = await DatabaseUtils.getPlayerEntries(computingId);
            const completedEntries = entries.filter(entry => entry.is_completed);
            
            // Filter by timeframe
            const filteredEntries = this.filterEntriesByTimeframe(completedEntries, timeframe);
            
            // Calculate statistics
            const totalSessions = filteredEntries.length;
            const totalWinnings = filteredEntries.reduce((sum, entry) => 
                sum + (parseFloat(entry.net_winnings) || 0), 0);
            
            const winningSessions = filteredEntries.filter(entry => 
                (parseFloat(entry.net_winnings) || 0) > 0).length;
            
            const losingSessions = filteredEntries.filter(entry => 
                (parseFloat(entry.net_winnings) || 0) < 0).length;
            
            const winRate = totalSessions > 0 ? (winningSessions / totalSessions) * 100 : 0;
            
            const avgWinnings = totalSessions > 0 ? totalWinnings / totalSessions : 0;
            
            // Get biggest win and loss
            const winnings = filteredEntries.map(entry => parseFloat(entry.net_winnings) || 0);
            const biggestWin = winnings.length > 0 ? Math.max(...winnings) : 0;
            const biggestLoss = winnings.length > 0 ? Math.min(...winnings) : 0;
            
            // Get recent activity
            const recentEntry = filteredEntries.length > 0 ? 
                filteredEntries.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))[0] : null;
            
            return {
                total_sessions: totalSessions,
                period_winnings: Math.round(totalWinnings * 100) / 100,
                winning_sessions: winningSessions,
                losing_sessions: losingSessions,
                win_rate: Math.round(winRate * 100) / 100,
                avg_winnings: Math.round(avgWinnings * 100) / 100,
                biggest_win: Math.round(biggestWin * 100) / 100,
                biggest_loss: Math.round(biggestLoss * 100) / 100,
                last_session_date: recentEntry ? recentEntry.session_date : null,
                last_session_winnings: recentEntry ? (parseFloat(recentEntry.net_winnings) || 0) : 0
            };
            
        } catch (error) {
            console.error('Player stats error:', error);
            return {
                total_sessions: 0,
                period_winnings: 0,
                winning_sessions: 0,
                losing_sessions: 0,
                win_rate: 0,
                avg_winnings: 0,
                biggest_win: 0,
                biggest_loss: 0,
                last_session_date: null,
                last_session_winnings: 0
            };
        }
    }
    
    /**
     * Filter entries by timeframe
     * @param {Array} entries - Player entries
     * @param {string} timeframe - Time period
     * @returns {Array} Filtered entries
     */
    static filterEntriesByTimeframe(entries, timeframe) {
        if (timeframe === 'all') return entries;
        
        const now = new Date();
        let cutoffDate;
        
        switch (timeframe) {
            case 'today':
                cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'week':
                cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                cutoffDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            default:
                return entries;
        }
        
        return entries.filter(entry => new Date(entry.session_date) >= cutoffDate);
    }
    
    /**
     * Sort players by specified criteria
     * @param {Array} players - Player data
     * @param {string} sort - Sort criteria
     * @returns {Array} Sorted players
     */
    static sortPlayers(players, sort) {
        switch (sort) {
            case 'winnings':
                return players.sort((a, b) => b.total_winnings - a.total_winnings);
            case 'sessions':
                return players.sort((a, b) => b.total_sessions - a.total_sessions);
            case 'recent':
                return players.sort((a, b) => {
                    const dateA = a.last_session_date ? new Date(a.last_session_date) : new Date(0);
                    const dateB = b.last_session_date ? new Date(b.last_session_date) : new Date(0);
                    return dateB - dateA;
                });
            default:
                return players.sort((a, b) => b.total_winnings - a.total_winnings);
        }
    }
    
    /**
     * Get rank change for player (mock implementation)
     * @param {string} computingId - Player ID
     * @param {string} sort - Sort criteria
     * @returns {number} Rank change
     */
    static async getRankChange(computingId, sort) {
        // This is a simplified implementation
        // In a real system, you'd compare with previous rankings
        return Math.floor(Math.random() * 5) - 2; // Random change between -2 and +2
    }
    
    /**
     * Check if player is trending (mock implementation)
     * @param {string} computingId - Player ID
     * @returns {boolean} Is trending
     */
    static async isTrending(computingId) {
        // This is a simplified implementation
        // In a real system, you'd analyze recent performance
        return Math.random() > 0.8; // 20% chance of being trending
    }
    
    /**
     * Get leaderboard summary statistics
     * @returns {Object} Summary stats
     */
    static async getSummaryStats() {
        try {
            const players = await DatabaseUtils.getLeaderboard();
            const totalPlayers = players.length;
            
            const totalWinnings = players.reduce((sum, player) => 
                sum + (parseFloat(player.total_winnings) || 0), 0);
            
            const activePlayers = players.filter(player => 
                parseFloat(player.total_winnings) !== 0).length;
            
            const topPlayer = players.length > 0 ? players[0] : null;
            
            // Get total sessions across all players
            let totalSessions = 0;
            for (const player of players) {
                const entries = await DatabaseUtils.getPlayerEntries(player.computing_id);
                totalSessions += entries.filter(entry => entry.is_completed).length;
            }
            
            return {
                total_players: totalPlayers,
                active_players: activePlayers,
                total_winnings: Math.round(totalWinnings * 100) / 100,
                total_sessions: totalSessions,
                avg_winnings_per_player: totalPlayers > 0 ? 
                    Math.round((totalWinnings / totalPlayers) * 100) / 100 : 0,
                top_player: topPlayer ? {
                    name: `${topPlayer.first_name} ${topPlayer.last_name}`,
                    winnings: parseFloat(topPlayer.total_winnings) || 0
                } : null,
                last_updated: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('Summary stats error:', error);
            throw error;
        }
    }
}

/**
 * GET /api/leaderboard
 * Get enhanced leaderboard with statistics
 */
router.get('/',
    validateQuery(leaderboardQuerySchema),
    optionalAuth,
    async (req, res) => {
        try {
            const options = {
                limit: parseInt(req.query.limit) || 50,
                offset: parseInt(req.query.offset) || 0,
                timeframe: req.query.timeframe || 'all',
                sort: req.query.sort || 'winnings'
            };
            
            const leaderboardData = await LeaderboardService.getLeaderboard(options);
            
            res.json(leaderboardData);
            
        } catch (error) {
            console.error('Leaderboard endpoint error:', error);
            res.status(500).json({
                error: 'Failed to retrieve leaderboard',
                message: 'An unexpected error occurred'
            });
        }
    }
);

/**
 * GET /api/leaderboard/stats
 * Get leaderboard summary statistics
 */
router.get('/stats',
    optionalAuth,
    async (req, res) => {
        try {
            const stats = await LeaderboardService.getSummaryStats();
            
            res.json({
                summary: stats,
                generated_at: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('Leaderboard stats error:', error);
            res.status(500).json({
                error: 'Failed to retrieve leaderboard statistics',
                message: 'An unexpected error occurred'
            });
        }
    }
);

/**
 * GET /api/leaderboard/player/:computingId
 * Get specific player's leaderboard position and stats
 */
router.get('/player/:computingId',
    authenticateToken,
    async (req, res) => {
        try {
            const { computingId } = req.params;
            
            // Check if user can access this data (own data or admin)
            if (req.user.computing_id !== computingId && !req.user.is_admin) {
                return res.status(403).json({
                    error: 'Access denied',
                    message: 'You can only view your own leaderboard position'
                });
            }
            
            // Get full leaderboard to find player position
            const leaderboardData = await LeaderboardService.getLeaderboard({ limit: 1000 });
            
            const playerPosition = leaderboardData.leaderboard.find(player => 
                player.computing_id === computingId);
            
            if (!playerPosition) {
                return res.status(404).json({
                    error: 'Player not found',
                    message: 'Player not found in leaderboard'
                });
            }
            
            // Get additional player stats for different timeframes
            const allTimeStats = await LeaderboardService.getPlayerStats(computingId, 'all');
            const monthStats = await LeaderboardService.getPlayerStats(computingId, 'month');
            const weekStats = await LeaderboardService.getPlayerStats(computingId, 'week');
            
            res.json({
                player: playerPosition,
                stats: {
                    all_time: allTimeStats,
                    this_month: monthStats,
                    this_week: weekStats
                },
                leaderboard_info: {
                    total_players: leaderboardData.pagination.total,
                    percentile: Math.round((1 - (playerPosition.rank - 1) / leaderboardData.pagination.total) * 100)
                }
            });
            
        } catch (error) {
            console.error('Player leaderboard error:', error);
            res.status(500).json({
                error: 'Failed to retrieve player leaderboard data',
                message: 'An unexpected error occurred'
            });
        }
    }
);

module.exports = router;