const express = require('express');
const Joi = require('joi');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateBody, validateParams, schemas } = require('../middleware/validation');
const DatabaseUtils = require('../database/utils');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename: computingId_timestamp_type.ext
        const timestamp = Date.now();
        const type = req.body.session_type || 'session';
        const ext = path.extname(file.originalname);
        const filename = `${req.user.computing_id}_${timestamp}_${type}${ext}`;
        cb(null, filename);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: function (req, file, cb) {
        // Accept only image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

// Middleware to parse JSON string fields from multipart/form-data
function parseMultipartJsonFields(req, res, next) {
    try {
        if (req.body) {
            ['start_chip_breakdown', 'end_chip_breakdown'].forEach(field => {
                if (req.body[field] && typeof req.body[field] === 'string') {
                    try {
                        req.body[field] = JSON.parse(req.body[field]);
                    } catch (e) {
                        // leave as-is; validation will catch invalid format
                    }
                }
            });
            // Coerce numeric fields that arrive as strings in multipart/form-data
            if (req.body.start_chips && typeof req.body.start_chips === 'string') {
                var n = parseFloat(req.body.start_chips);
                if (!isNaN(n)) req.body.start_chips = n;
            }
            if (req.body.end_chips && typeof req.body.end_chips === 'string') {
                var m = parseFloat(req.body.end_chips);
                if (!isNaN(m)) req.body.end_chips = m;
            }
            // Ensure session_date is a trimmed string
            if (req.body.session_date && typeof req.body.session_date === 'string') {
                req.body.session_date = req.body.session_date.trim();
            }
        }
    } catch (e) {
        // don't block request on parsing errors here
    }
    next();
}

// Validation schemas
const createSessionSchema = Joi.object({
    session_date: schemas.sessionDate.required(),
    start_chips: Joi.number().positive().precision(2).optional(),
    start_chip_breakdown: Joi.object().pattern(
        schemas.chipColor,
        schemas.chipCount
    ).optional(),
    session_type: Joi.string().valid('check-in', 'check-out').default('check-in')
});

const updateSessionSchema = Joi.object({
    end_chips: Joi.number().positive().precision(2).optional(),
    end_chip_breakdown: Joi.object().pattern(
        schemas.chipColor,
        schemas.chipCount
    ).optional(),
    admin_override: Joi.boolean().optional()
}).min(1);

const sessionIdSchema = Joi.object({
    sessionId: Joi.number().integer().positive().required()
});

/**
 * POST /api/sessions
 * Create a new session (check-in) or complete existing session (check-out)
 */
router.post('/',
    authenticateToken,
    upload.single('photo'),
    parseMultipartJsonFields,
    validateBody(createSessionSchema),
    async (req, res) => {
        try {
            const { session_date, start_chips, start_chip_breakdown, session_type } = req.body;
            const computing_id = req.user.computing_id;
            const photo = req.file;
            
            // Check if player exists
            const player = await DatabaseUtils.getPlayer(computing_id);
            if (!player) {
                return res.status(404).json({
                    error: 'Player not found',
                    message: 'Player profile not found'
                });
            }
            
            if (session_type === 'check-in') {
                // Check if there's already an incomplete session for this date
                const existingSession = await DatabaseUtils.getIncompleteEntry(computing_id, session_date);
                if (existingSession) {
                    return res.status(409).json({
                        error: 'Session already exists',
                        message: 'You already have an incomplete session for this date',
                        existing_session: existingSession
                    });
                }
                
                // Calculate start chips total if breakdown provided
                let calculatedStartChips = start_chips;
                if (start_chip_breakdown && Object.keys(start_chip_breakdown).length > 0) {
                    calculatedStartChips = await DatabaseUtils.calculateChipTotal(start_chip_breakdown);
                }
                
                // Create new session entry
                const entryData = {
                    computing_id: computing_id,
                    session_date: session_date,
                    start_photo_url: photo ? `/uploads/${photo.filename}` : null,
                    start_chips: calculatedStartChips,
                    start_chip_breakdown: start_chip_breakdown || {}
                };
                
                const result = await DatabaseUtils.createEntry(entryData);
                const newEntry = await DatabaseUtils.getEntry(result.lastID);
                
                res.status(201).json({
                    message: 'Session check-in successful',
                    session: {
                        entry_id: newEntry.entry_id,
                        computing_id: newEntry.computing_id,
                        session_date: newEntry.session_date,
                        start_photo_url: newEntry.start_photo_url,
                        start_chips: parseFloat(newEntry.start_chips) || 0,
                        start_chip_breakdown: newEntry.start_chip_breakdown,
                        is_completed: Boolean(newEntry.is_completed),
                        created_at: newEntry.created_at
                    }
                });
                
            } else if (session_type === 'check-out') {
                // Find incomplete session for this date
                const incompleteSession = await DatabaseUtils.getIncompleteEntry(computing_id, session_date);
                if (!incompleteSession) {
                    return res.status(404).json({
                        error: 'No active session',
                        message: 'No incomplete session found for this date. Please check in first.'
                    });
                }
                
                // Parse request data for check-out
                const end_chips = parseFloat(req.body.end_chips);
                let end_chip_breakdown = {};
                if (req.body.end_chip_breakdown) {
                    if (typeof req.body.end_chip_breakdown === 'string') {
                        try {
                            end_chip_breakdown = JSON.parse(req.body.end_chip_breakdown);
                        } catch (e) {
                            end_chip_breakdown = {};
                        }
                    } else {
                        end_chip_breakdown = req.body.end_chip_breakdown;
                    }
                }
                
                // Calculate end chips total if breakdown provided
                let calculatedEndChips = end_chips;
                if (end_chip_breakdown && Object.keys(end_chip_breakdown).length > 0) {
                    calculatedEndChips = await DatabaseUtils.calculateChipTotal(end_chip_breakdown);
                }
                
                // Calculate net winnings
                const startChips = parseFloat(incompleteSession.start_chips) || 0;
                const netWinnings = calculatedEndChips - startChips;
                
                // Update session with check-out data
                const updateData = {
                    end_photo_url: photo ? `/uploads/${photo.filename}` : null,
                    end_chips: calculatedEndChips,
                    end_chip_breakdown: end_chip_breakdown,
                    net_winnings: netWinnings,
                    is_completed: true
                };
                
                await DatabaseUtils.updateEntry(incompleteSession.entry_id, updateData);
                
                // Recalculate player's total winnings
                await DatabaseUtils.recalculatePlayerWinnings(computing_id);
                
                // Get updated session
                const completedSession = await DatabaseUtils.getEntry(incompleteSession.entry_id);
                
                res.json({
                    message: 'Session check-out successful',
                    session: {
                        entry_id: completedSession.entry_id,
                        computing_id: completedSession.computing_id,
                        session_date: completedSession.session_date,
                        start_photo_url: completedSession.start_photo_url,
                        start_chips: parseFloat(completedSession.start_chips) || 0,
                        start_chip_breakdown: completedSession.start_chip_breakdown,
                        end_photo_url: completedSession.end_photo_url,
                        end_chips: parseFloat(completedSession.end_chips) || 0,
                        end_chip_breakdown: completedSession.end_chip_breakdown,
                        net_winnings: parseFloat(completedSession.net_winnings) || 0,
                        is_completed: Boolean(completedSession.is_completed),
                        created_at: completedSession.created_at,
                        updated_at: completedSession.updated_at
                    }
                });
            }
            
        } catch (error) {
            console.error('Session operation error:', error);
            
            // Clean up uploaded file if there was an error
            if (req.file) {
                try {
                    fs.unlinkSync(req.file.path);
                } catch (unlinkError) {
                    console.error('Failed to clean up uploaded file:', unlinkError);
                }
            }
            
            res.status(500).json({
                error: 'Session operation failed',
                message: 'An unexpected error occurred'
            });
        }
    }
);

/**
 * GET /api/sessions/:computingId
 * Get all sessions for a specific player
 */
router.get('/:computingId',
    validateParams(Joi.object({ computingId: schemas.computingId })),
    authenticateToken,
    async (req, res) => {
        try {
            const { computingId } = req.params;
            
            // Check if user can access these sessions (own sessions or admin)
            if (req.user.computing_id !== computingId && !req.user.is_admin) {
                return res.status(403).json({
                    error: 'Access denied',
                    message: 'You can only view your own sessions'
                });
            }
            
            // Get player sessions
            const sessions = await DatabaseUtils.getPlayerEntries(computingId);
            
            // Format sessions
            const formattedSessions = sessions.map(session => ({
                entry_id: session.entry_id,
                session_date: session.session_date,
                start_photo_url: session.start_photo_url,
                start_chips: parseFloat(session.start_chips) || 0,
                start_chip_breakdown: session.start_chip_breakdown,
                end_photo_url: session.end_photo_url,
                end_chips: parseFloat(session.end_chips) || 0,
                end_chip_breakdown: session.end_chip_breakdown,
                net_winnings: parseFloat(session.net_winnings) || 0,
                is_completed: Boolean(session.is_completed),
                admin_override: Boolean(session.admin_override),
                created_at: session.created_at,
                updated_at: session.updated_at
            }));
            
            res.json({
                sessions: formattedSessions,
                total: formattedSessions.length,
                completed: formattedSessions.filter(s => s.is_completed).length,
                incomplete: formattedSessions.filter(s => !s.is_completed).length
            });
            
        } catch (error) {
            console.error('Get sessions error:', error);
            res.status(500).json({
                error: 'Failed to retrieve sessions',
                message: 'An unexpected error occurred'
            });
        }
    }
);

/**
 * GET /api/sessions/active/:computingId/:date
 * Get active (incomplete) session for a specific player and date
 */
// Normalize date param: if missing or the literal string 'undefined', replace with today's YYYY-MM-DD
function normalizeDateParam(req, res, next) {
    try {
        var dateParam = req.params && req.params.date;
        if (!dateParam || dateParam === 'undefined') {
            var t = new Date();
            var y = t.getFullYear();
            var m = String(t.getMonth() + 1).padStart(2, '0');
            var d = String(t.getDate()).padStart(2, '0');
            // ensure params object exists
            req.params = req.params || {};
            req.params.date = y + '-' + m + '-' + d;
        }
    } catch (e) {
        // if anything goes wrong, leave params as-is and let validation handle it
    }
    next();
}

router.get('/active/:computingId/:date',
    normalizeDateParam,
    validateParams(Joi.object({ 
        computingId: schemas.computingId,
        date: schemas.sessionDate
    })),
    authenticateToken,
    async (req, res) => {
        try {
            const { computingId, date } = req.params;
            
            // Check if user can access this session (own session or admin)
            if (req.user.computing_id !== computingId && !req.user.is_admin) {
                return res.status(403).json({
                    error: 'Access denied',
                    message: 'You can only view your own sessions'
                });
            }
            
            // Get active session
            const activeSession = await DatabaseUtils.getIncompleteEntry(computingId, date);
            
            if (!activeSession) {
                return res.status(404).json({
                    error: 'No active session',
                    message: 'No incomplete session found for this date'
                });
            }
            
            res.json({
                session: {
                    entry_id: activeSession.entry_id,
                    computing_id: activeSession.computing_id,
                    session_date: activeSession.session_date,
                    start_photo_url: activeSession.start_photo_url,
                    start_chips: parseFloat(activeSession.start_chips) || 0,
                    start_chip_breakdown: activeSession.start_chip_breakdown,
                    is_completed: Boolean(activeSession.is_completed),
                    created_at: activeSession.created_at
                }
            });
            
        } catch (error) {
            console.error('Get active session error:', error);
            res.status(500).json({
                error: 'Failed to retrieve active session',
                message: 'An unexpected error occurred'
            });
        }
    }
);

/**
 * PUT /api/sessions/:sessionId
 * Update session information
 */
router.put('/:sessionId',
    validateParams(sessionIdSchema),
    validateBody(updateSessionSchema),
    authenticateToken,
    upload.single('photo'),
    async (req, res) => {
        try {
            const { sessionId } = req.params;
            const updates = req.body;
            const photo = req.file;
            
            // Get existing session
            const existingSession = await DatabaseUtils.getEntry(sessionId);
            if (!existingSession) {
                return res.status(404).json({
                    error: 'Session not found',
                    message: 'No session found with the specified ID'
                });
            }
            
            // Check if user can update this session (own session or admin)
            if (req.user.computing_id !== existingSession.computing_id && !req.user.is_admin) {
                return res.status(403).json({
                    error: 'Access denied',
                    message: 'You can only update your own sessions'
                });
            }
            
            // Prepare update data
            const updateData = { ...updates };
            
            // Add photo URL if uploaded
            if (photo) {
                if (updates.end_chips !== undefined || updates.end_chip_breakdown !== undefined) {
                    updateData.end_photo_url = `/uploads/${photo.filename}`;
                } else {
                    updateData.start_photo_url = `/uploads/${photo.filename}`;
                }
            }
            
            // Calculate chips total if breakdown provided
            if (updates.end_chip_breakdown) {
                updateData.end_chips = await DatabaseUtils.calculateChipTotal(updates.end_chip_breakdown);
                
                // Calculate net winnings if completing session
                const startChips = parseFloat(existingSession.start_chips) || 0;
                updateData.net_winnings = updateData.end_chips - startChips;
                updateData.is_completed = true;
            }
            
            // Update session
            await DatabaseUtils.updateEntry(sessionId, updateData);
            
            // If session was completed, recalculate player winnings
            if (updateData.is_completed) {
                await DatabaseUtils.recalculatePlayerWinnings(existingSession.computing_id);
            }
            
            // Create audit log if admin is updating another user's session
            if (req.user.is_admin && req.user.computing_id !== existingSession.computing_id) {
                await DatabaseUtils.createAuditLog({
                    admin_id: req.user.computing_id,
                    action: 'UPDATE_SESSION',
                    target_table: 'entries',
                    target_id: sessionId.toString(),
                    old_values: existingSession,
                    new_values: updateData
                });
            }
            
            // Get updated session
            const updatedSession = await DatabaseUtils.getEntry(sessionId);
            
            res.json({
                message: 'Session updated successfully',
                session: {
                    entry_id: updatedSession.entry_id,
                    computing_id: updatedSession.computing_id,
                    session_date: updatedSession.session_date,
                    start_photo_url: updatedSession.start_photo_url,
                    start_chips: parseFloat(updatedSession.start_chips) || 0,
                    start_chip_breakdown: updatedSession.start_chip_breakdown,
                    end_photo_url: updatedSession.end_photo_url,
                    end_chips: parseFloat(updatedSession.end_chips) || 0,
                    end_chip_breakdown: updatedSession.end_chip_breakdown,
                    net_winnings: parseFloat(updatedSession.net_winnings) || 0,
                    is_completed: Boolean(updatedSession.is_completed),
                    admin_override: Boolean(updatedSession.admin_override),
                    created_at: updatedSession.created_at,
                    updated_at: updatedSession.updated_at
                }
            });
            
        } catch (error) {
            console.error('Update session error:', error);
            
            // Clean up uploaded file if there was an error
            if (req.file) {
                try {
                    fs.unlinkSync(req.file.path);
                } catch (unlinkError) {
                    console.error('Failed to clean up uploaded file:', unlinkError);
                }
            }
            
            res.status(500).json({
                error: 'Failed to update session',
                message: 'An unexpected error occurred'
            });
        }
    }
);

/**
 * POST /api/sessions/:sessionId/override
 * Admin override for session data (admin only)
 */
router.post('/:sessionId/override',
    validateParams(sessionIdSchema),
    authenticateToken,
    requireAdmin,
    async (req, res) => {
        try {
            const { sessionId } = req.params;
            const { net_winnings, reason } = req.body;
            
            // Validate override data
            if (typeof net_winnings !== 'number') {
                return res.status(400).json({
                    error: 'Invalid data',
                    message: 'Net winnings must be a number'
                });
            }
            
            // Get existing session
            const existingSession = await DatabaseUtils.getEntry(sessionId);
            if (!existingSession) {
                return res.status(404).json({
                    error: 'Session not found',
                    message: 'No session found with the specified ID'
                });
            }
            
            const oldWinnings = parseFloat(existingSession.net_winnings) || 0;
            
            // Update session with override
            const updateData = {
                net_winnings: net_winnings,
                admin_override: true,
                is_completed: true
            };
            
            await DatabaseUtils.updateEntry(sessionId, updateData);
            
            // Recalculate player winnings
            await DatabaseUtils.recalculatePlayerWinnings(existingSession.computing_id);
            
            // Create audit log
            await DatabaseUtils.createAuditLog({
                admin_id: req.user.computing_id,
                action: 'ADMIN_OVERRIDE_SESSION',
                target_table: 'entries',
                target_id: sessionId.toString(),
                old_values: { 
                    net_winnings: oldWinnings,
                    admin_override: existingSession.admin_override 
                },
                new_values: { 
                    net_winnings: net_winnings,
                    admin_override: true,
                    reason: reason || 'No reason provided'
                }
            });
            
            // Get updated session
            const updatedSession = await DatabaseUtils.getEntry(sessionId);
            
            res.json({
                message: 'Session override applied successfully',
                session: {
                    entry_id: updatedSession.entry_id,
                    computing_id: updatedSession.computing_id,
                    session_date: updatedSession.session_date,
                    net_winnings: parseFloat(updatedSession.net_winnings) || 0,
                    admin_override: Boolean(updatedSession.admin_override),
                    is_completed: Boolean(updatedSession.is_completed),
                    updated_at: updatedSession.updated_at
                },
                old_winnings: oldWinnings,
                new_winnings: net_winnings,
                difference: net_winnings - oldWinnings
            });
            
        } catch (error) {
            console.error('Session override error:', error);
            res.status(500).json({
                error: 'Failed to apply session override',
                message: 'An unexpected error occurred'
            });
        }
    }
);

module.exports = router;