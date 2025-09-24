const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class DatabaseConnection {
    constructor() {
        this.db = null;
        this.dbPath = path.join(__dirname, 'poker_tracker.db');
    }

    /**
     * Initialize database connection
     * @returns {Promise<sqlite3.Database>}
     */
    async connect() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Error opening database:', err.message);
                    reject(err);
                } else {
                    console.log('Connected to SQLite database');
                    // Enable foreign key constraints
                    this.db.run('PRAGMA foreign_keys = ON', (err) => {
                        if (err) {
                            console.error('Error enabling foreign keys:', err.message);
                            reject(err);
                        } else {
                            resolve(this.db);
                        }
                    });
                }
            });
        });
    }

    /**
     * Close database connection
     * @returns {Promise<void>}
     */
    async close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        console.error('Error closing database:', err.message);
                        reject(err);
                    } else {
                        console.log('Database connection closed');
                        this.db = null;
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }

    /**
     * Get database instance
     * @returns {sqlite3.Database}
     */
    getDatabase() {
        if (!this.db) {
            throw new Error('Database not connected. Call connect() first.');
        }
        return this.db;
    }

    /**
     * Execute a query with parameters
     * @param {string} sql - SQL query
     * @param {Array} params - Query parameters
     * @returns {Promise<any>}
     */
    async run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    console.error('Database run error:', err.message);
                    reject(err);
                } else {
                    resolve({ 
                        lastID: this.lastID, 
                        changes: this.changes 
                    });
                }
            });
        });
    }

    /**
     * Get a single row
     * @param {string} sql - SQL query
     * @param {Array} params - Query parameters
     * @returns {Promise<any>}
     */
    async get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    console.error('Database get error:', err.message);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    /**
     * Get all rows
     * @param {string} sql - SQL query
     * @param {Array} params - Query parameters
     * @returns {Promise<Array>}
     */
    async all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    console.error('Database all error:', err.message);
                    reject(err);
                } else {
                    resolve(rows || []);
                }
            });
        });
    }

    /**
     * Execute multiple statements in a transaction
     * @param {Array<{sql: string, params: Array}>} statements
     * @returns {Promise<Array>}
     */
    async transaction(statements) {
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                this.db.run('BEGIN TRANSACTION');
                
                const results = [];
                let completed = 0;
                let hasError = false;

                if (statements.length === 0) {
                    this.db.run('COMMIT');
                    resolve([]);
                    return;
                }

                statements.forEach((stmt, index) => {
                    this.db.run(stmt.sql, stmt.params || [], function(err) {
                        if (err && !hasError) {
                            hasError = true;
                            console.error('Transaction error:', err.message);
                            this.db.run('ROLLBACK');
                            reject(err);
                        } else if (!hasError) {
                            results[index] = { 
                                lastID: this.lastID, 
                                changes: this.changes 
                            };
                            completed++;
                            
                            if (completed === statements.length) {
                                this.db.run('COMMIT', (commitErr) => {
                                    if (commitErr) {
                                        console.error('Commit error:', commitErr.message);
                                        reject(commitErr);
                                    } else {
                                        resolve(results);
                                    }
                                });
                            }
                        }
                    });
                });
            });
        });
    }
}

// Export singleton instance
const dbConnection = new DatabaseConnection();
module.exports = dbConnection;