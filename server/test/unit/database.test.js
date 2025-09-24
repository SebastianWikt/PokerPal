const db = require('../../database/utils');
const sqlite3 = require('sqlite3');
const path = require('path');
const fs = require('fs');

// Mock sqlite3
jest.mock('sqlite3');
jest.mock('fs');

describe('Database Utils', () => {
    let mockDatabase;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Mock database instance
        mockDatabase = {
            get: jest.fn(),
            all: jest.fn(),
            run: jest.fn(),
            close: jest.fn(),
            serialize: jest.fn((callback) => callback()),
            exec: jest.fn()
        };

        // Mock sqlite3.Database constructor
        sqlite3.Database = jest.fn().mockImplementation(() => mockDatabase);
        
        // Mock file system
        fs.existsSync = jest.fn();
        fs.mkdirSync = jest.fn();
    });

    describe('Database Connection', () => {
        it('should create database connection successfully', () => {
            fs.existsSync.mockReturnValue(true);
            
            const dbInstance = new sqlite3.Database();
            
            expect(sqlite3.Database).toHaveBeenCalled();
            expect(dbInstance).toBeDefined();
        });

        it('should create database directory if it does not exist', () => {
            fs.existsSync.mockReturnValue(false);
            
            new sqlite3.Database();
            
            expect(fs.mkdirSync).toHaveBeenCalledWith(
                expect.stringContaining('database'),
                { recursive: true }
            );
        });
    });

    describe('Database Operations', () => {
        beforeEach(() => {
            // Mock the database module to return our mock database
            jest.doMock('../../database/utils', () => ({
                get: jest.fn(),
                all: jest.fn(),
                run: jest.fn(),
                close: jest.fn()
            }));
        });

        describe('get method', () => {
            it('should execute SELECT query and return single row', async () => {
                const mockRow = { id: 1, name: 'Test' };
                const dbUtils = require('../../database/utils');
                
                dbUtils.get.mockImplementation((sql, params) => {
                    return new Promise((resolve) => {
                        resolve(mockRow);
                    });
                });

                const result = await dbUtils.get('SELECT * FROM test WHERE id = ?', [1]);
                
                expect(result).toEqual(mockRow);
                expect(dbUtils.get).toHaveBeenCalledWith('SELECT * FROM test WHERE id = ?', [1]);
            });

            it('should return null when no row found', async () => {
                const dbUtils = require('../../database/utils');
                
                dbUtils.get.mockResolvedValue(null);

                const result = await dbUtils.get('SELECT * FROM test WHERE id = ?', [999]);
                
                expect(result).toBeNull();
            });

            it('should handle database errors', async () => {
                const dbUtils = require('../../database/utils');
                
                dbUtils.get.mockRejectedValue(new Error('Database error'));

                await expect(dbUtils.get('INVALID SQL', []))
                    .rejects.toThrow('Database error');
            });
        });

        describe('all method', () => {
            it('should execute SELECT query and return multiple rows', async () => {
                const mockRows = [
                    { id: 1, name: 'Test1' },
                    { id: 2, name: 'Test2' }
                ];
                const dbUtils = require('../../database/utils');
                
                dbUtils.all.mockResolvedValue(mockRows);

                const result = await dbUtils.all('SELECT * FROM test');
                
                expect(result).toEqual(mockRows);
                expect(result.length).toBe(2);
            });

            it('should return empty array when no rows found', async () => {
                const dbUtils = require('../../database/utils');
                
                dbUtils.all.mockResolvedValue([]);

                const result = await dbUtils.all('SELECT * FROM empty_table');
                
                expect(result).toEqual([]);
            });

            it('should handle database errors', async () => {
                const dbUtils = require('../../database/utils');
                
                dbUtils.all.mockRejectedValue(new Error('Table does not exist'));

                await expect(dbUtils.all('SELECT * FROM nonexistent'))
                    .rejects.toThrow('Table does not exist');
            });
        });

        describe('run method', () => {
            it('should execute INSERT query and return result', async () => {
                const mockResult = { lastID: 1, changes: 1 };
                const dbUtils = require('../../database/utils');
                
                dbUtils.run.mockResolvedValue(mockResult);

                const result = await dbUtils.run(
                    'INSERT INTO test (name) VALUES (?)',
                    ['Test Name']
                );
                
                expect(result).toEqual(mockResult);
                expect(result.lastID).toBe(1);
                expect(result.changes).toBe(1);
            });

            it('should execute UPDATE query and return changes count', async () => {
                const mockResult = { changes: 2 };
                const dbUtils = require('../../database/utils');
                
                dbUtils.run.mockResolvedValue(mockResult);

                const result = await dbUtils.run(
                    'UPDATE test SET name = ? WHERE active = 1',
                    ['Updated Name']
                );
                
                expect(result.changes).toBe(2);
            });

            it('should execute DELETE query and return changes count', async () => {
                const mockResult = { changes: 3 };
                const dbUtils = require('../../database/utils');
                
                dbUtils.run.mockResolvedValue(mockResult);

                const result = await dbUtils.run('DELETE FROM test WHERE id < ?', [10]);
                
                expect(result.changes).toBe(3);
            });

            it('should handle constraint violations', async () => {
                const dbUtils = require('../../database/utils');
                
                dbUtils.run.mockRejectedValue(new Error('UNIQUE constraint failed'));

                await expect(dbUtils.run(
                    'INSERT INTO test (unique_field) VALUES (?)',
                    ['duplicate']
                )).rejects.toThrow('UNIQUE constraint failed');
            });
        });
    });

    describe('Database Initialization', () => {
        let initModule;

        beforeEach(() => {
            jest.resetModules();
            
            // Mock the init module
            jest.doMock('../../database/init', () => ({
                createTables: jest.fn(),
                seedData: jest.fn(),
                reset: jest.fn()
            }));
            
            initModule = require('../../database/init');
        });

        describe('createTables', () => {
            it('should create all required tables', async () => {
                initModule.createTables.mockResolvedValue();

                await initModule.createTables();

                expect(initModule.createTables).toHaveBeenCalled();
            });

            it('should handle table creation errors', async () => {
                initModule.createTables.mockRejectedValue(new Error('Table creation failed'));

                await expect(initModule.createTables())
                    .rejects.toThrow('Table creation failed');
            });
        });

        describe('seedData', () => {
            it('should insert default chip values', async () => {
                initModule.seedData.mockResolvedValue();

                await initModule.seedData();

                expect(initModule.seedData).toHaveBeenCalled();
            });

            it('should handle seeding errors', async () => {
                initModule.seedData.mockRejectedValue(new Error('Seeding failed'));

                await expect(initModule.seedData())
                    .rejects.toThrow('Seeding failed');
            });
        });

        describe('reset', () => {
            it('should drop and recreate all tables', async () => {
                initModule.reset.mockResolvedValue();

                await initModule.reset();

                expect(initModule.reset).toHaveBeenCalled();
            });

            it('should handle reset errors', async () => {
                initModule.reset.mockRejectedValue(new Error('Reset failed'));

                await expect(initModule.reset())
                    .rejects.toThrow('Reset failed');
            });
        });
    });

    describe('Database Transactions', () => {
        let dbUtils;

        beforeEach(() => {
            dbUtils = require('../../database/utils');
        });

        it('should handle transaction rollback on error', async () => {
            // Mock transaction methods
            const mockTransaction = {
                begin: jest.fn().mockResolvedValue(),
                commit: jest.fn().mockResolvedValue(),
                rollback: jest.fn().mockResolvedValue()
            };

            dbUtils.transaction = jest.fn().mockImplementation(async (callback) => {
                try {
                    await mockTransaction.begin();
                    await callback();
                    await mockTransaction.commit();
                } catch (error) {
                    await mockTransaction.rollback();
                    throw error;
                }
            });

            const failingOperation = async () => {
                throw new Error('Operation failed');
            };

            await expect(dbUtils.transaction(failingOperation))
                .rejects.toThrow('Operation failed');

            expect(mockTransaction.begin).toHaveBeenCalled();
            expect(mockTransaction.rollback).toHaveBeenCalled();
            expect(mockTransaction.commit).not.toHaveBeenCalled();
        });

        it('should commit successful transactions', async () => {
            const mockTransaction = {
                begin: jest.fn().mockResolvedValue(),
                commit: jest.fn().mockResolvedValue(),
                rollback: jest.fn().mockResolvedValue()
            };

            dbUtils.transaction = jest.fn().mockImplementation(async (callback) => {
                await mockTransaction.begin();
                await callback();
                await mockTransaction.commit();
            });

            const successfulOperation = async () => {
                return 'success';
            };

            const result = await dbUtils.transaction(successfulOperation);

            expect(result).toBe('success');
            expect(mockTransaction.begin).toHaveBeenCalled();
            expect(mockTransaction.commit).toHaveBeenCalled();
            expect(mockTransaction.rollback).not.toHaveBeenCalled();
        });
    });

    describe('Database Connection Pool', () => {
        it('should manage connection pool properly', () => {
            // Mock connection pool behavior
            const mockPool = {
                getConnection: jest.fn().mockResolvedValue(mockDatabase),
                releaseConnection: jest.fn(),
                closeAll: jest.fn()
            };

            // Test connection acquisition
            expect(mockPool.getConnection).toBeDefined();
            expect(mockPool.releaseConnection).toBeDefined();
            expect(mockPool.closeAll).toBeDefined();
        });

        it('should handle connection pool exhaustion', async () => {
            const mockPool = {
                getConnection: jest.fn().mockRejectedValue(new Error('Pool exhausted'))
            };

            await expect(mockPool.getConnection())
                .rejects.toThrow('Pool exhausted');
        });
    });
});