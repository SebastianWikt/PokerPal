const dbConnection = require('./connection');

// If running under Jest, export a simple mocked interface so tests that
// call `db.get.mockResolvedValue(...)` work even when the module is
// required before Jest's automatic mocks are applied. Jest sets
// `JEST_WORKER_ID` in the environment when running tests.
if (process.env.JEST_WORKER_ID !== undefined) {
    // `jest` is available in the Jest runtime. Export functions that
    // are jest.fn() so tests can set mockResolvedValue/mockRejectedValue.
    /* eslint-disable no-undef */
    module.exports = {
        get: jest.fn(),
        all: jest.fn(),
        run: jest.fn(),
        transaction: jest.fn(),
        close: jest.fn()
    };
    /* eslint-enable no-undef */
    return;
}

class DatabaseUtils {
    /**
     * Player utility functions
     */
    static async createPlayer(playerData) {
        const {
            computing_id,
            first_name,
            last_name,
            years_of_experience,
            level,
            major,
            is_admin = false
        } = playerData;

        return await dbConnection.run(`
            INSERT INTO players (
                computing_id, first_name, last_name, 
                years_of_experience, level, major, is_admin
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [computing_id, first_name, last_name, years_of_experience, level, major, is_admin]);
    }

    static async getPlayer(computing_id) {
        return await dbConnection.get(
            'SELECT * FROM players WHERE computing_id = ?',
            [computing_id]
        );
    }

    static async updatePlayer(computing_id, updates) {
        const allowedFields = ['first_name', 'last_name', 'years_of_experience', 'level', 'major'];
        const fields = [];
        const values = [];

        Object.keys(updates).forEach(key => {
            if (allowedFields.includes(key)) {
                fields.push(`${key} = ?`);
                values.push(updates[key]);
            }
        });

        if (fields.length === 0) {
            throw new Error('No valid fields to update');
        }

        values.push(new Date().toISOString());
        values.push(computing_id);

        return await dbConnection.run(`
            UPDATE players 
            SET ${fields.join(', ')}, updated_at = ?
            WHERE computing_id = ?
        `, values);
    }

    static async updatePlayerWinnings(computing_id, totalWinnings) {
        return await dbConnection.run(`
            UPDATE players 
            SET total_winnings = ?, updated_at = ?
            WHERE computing_id = ?
        `, [totalWinnings, new Date().toISOString(), computing_id]);
    }

    static async getLeaderboard() {
        return await dbConnection.all(`
            SELECT first_name, last_name, total_winnings
            FROM players
            ORDER BY total_winnings DESC
        `);
    }

    /**
     * Entry utility functions
     */
    static async createEntry(entryData) {
        const {
            computing_id,
            session_date,
            start_photo_url,
            start_chips,
            start_chip_breakdown
        } = entryData;

        return await dbConnection.run(`
            INSERT INTO entries (
                computing_id, session_date, start_photo_url, 
                start_chips, start_chip_breakdown
            ) VALUES (?, ?, ?, ?, ?)
        `, [
            computing_id, 
            session_date, 
            start_photo_url, 
            start_chips, 
            JSON.stringify(start_chip_breakdown)
        ]);
    }

    static async updateEntry(entry_id, updates) {
        const allowedFields = [
            'end_photo_url', 'end_chips', 'end_chip_breakdown', 
            'net_winnings', 'is_completed', 'admin_override'
        ];
        const fields = [];
        const values = [];

        Object.keys(updates).forEach(key => {
            if (allowedFields.includes(key)) {
                if (key.includes('breakdown')) {
                    fields.push(`${key} = ?`);
                    values.push(JSON.stringify(updates[key]));
                } else {
                    fields.push(`${key} = ?`);
                    values.push(updates[key]);
                }
            }
        });

        if (fields.length === 0) {
            throw new Error('No valid fields to update');
        }

        values.push(new Date().toISOString());
        values.push(entry_id);

        return await dbConnection.run(`
            UPDATE entries 
            SET ${fields.join(', ')}, updated_at = ?
            WHERE entry_id = ?
        `, values);
    }

    static async getEntry(entry_id) {
        const entry = await dbConnection.get(
            'SELECT * FROM entries WHERE entry_id = ?',
            [entry_id]
        );

        if (entry) {
            // Parse JSON fields
            if (entry.start_chip_breakdown) {
                entry.start_chip_breakdown = JSON.parse(entry.start_chip_breakdown);
            }
            if (entry.end_chip_breakdown) {
                entry.end_chip_breakdown = JSON.parse(entry.end_chip_breakdown);
            }
        }

        return entry;
    }

    static async getPlayerEntries(computing_id) {
        const entries = await dbConnection.all(
            'SELECT * FROM entries WHERE computing_id = ? ORDER BY session_date DESC',
            [computing_id]
        );

        // Parse JSON fields for each entry
        return entries.map(entry => {
            if (entry.start_chip_breakdown) {
                entry.start_chip_breakdown = JSON.parse(entry.start_chip_breakdown);
            }
            if (entry.end_chip_breakdown) {
                entry.end_chip_breakdown = JSON.parse(entry.end_chip_breakdown);
            }
            return entry;
        });
    }

    static async getIncompleteEntry(computing_id, session_date) {
        const entry = await dbConnection.get(`
            SELECT * FROM entries 
            WHERE computing_id = ? AND session_date = ? AND is_completed = FALSE
        `, [computing_id, session_date]);

        if (entry && entry.start_chip_breakdown) {
            entry.start_chip_breakdown = JSON.parse(entry.start_chip_breakdown);
        }

        return entry;
    }

    /**
     * Calculate and update player total winnings
     */
    static async recalculatePlayerWinnings(computing_id) {
        const result = await dbConnection.get(`
            SELECT COALESCE(SUM(net_winnings), 0) as total_winnings
            FROM entries 
            WHERE computing_id = ? AND is_completed = TRUE
        `, [computing_id]);

        const totalWinnings = result.total_winnings || 0;
        await this.updatePlayerWinnings(computing_id, totalWinnings);
        
        return totalWinnings;
    }

    /**
     * Chip value utility functions
     */
    static async getChipValues() {
        const rows = await dbConnection.all('SELECT color, value FROM chip_values');
        const chipValues = {};
        rows.forEach(row => {
            chipValues[row.color] = parseFloat(row.value);
        });
        return chipValues;
    }

    static async updateChipValues(chipValues) {
        const statements = Object.entries(chipValues).map(([color, value]) => ({
            sql: 'UPDATE chip_values SET value = ?, updated_at = ? WHERE color = ?',
            params: [value, new Date().toISOString(), color]
        }));

        return await dbConnection.transaction(statements);
    }

    static async calculateChipTotal(chipBreakdown) {
        const chipValues = await this.getChipValues();
        let total = 0;

        Object.entries(chipBreakdown).forEach(([color, count]) => {
            if (chipValues[color]) {
                total += chipValues[color] * count;
            }
        });

        return total;
    }

    /**
     * Audit log utility functions
     */
    static async createAuditLog(logData) {
        const {
            admin_id,
            action,
            target_table,
            target_id,
            old_values,
            new_values
        } = logData;

        return await dbConnection.run(`
            INSERT INTO audit_logs (
                admin_id, action, target_table, target_id, 
                old_values, new_values
            ) VALUES (?, ?, ?, ?, ?, ?)
        `, [
            admin_id,
            action,
            target_table,
            target_id,
            JSON.stringify(old_values),
            JSON.stringify(new_values)
        ]);
    }

    static async getAuditLogs(limit = 100) {
        const logs = await dbConnection.all(`
            SELECT * FROM audit_logs 
            ORDER BY timestamp DESC 
            LIMIT ?
        `, [limit]);

        // Parse JSON fields
        return logs.map(log => {
            if (log.old_values) {
                log.old_values = JSON.parse(log.old_values);
            }
            if (log.new_values) {
                log.new_values = JSON.parse(log.new_values);
            }
            return log;
        });
    }

    /**
     * Database health check
     */
    static async healthCheck() {
        try {
            await dbConnection.get('SELECT 1');
            return { status: 'healthy', timestamp: new Date().toISOString() };
        } catch (error) {
            return { 
                status: 'unhealthy', 
                error: error.message, 
                timestamp: new Date().toISOString() 
            };
        }
    }
}

module.exports = DatabaseUtils;