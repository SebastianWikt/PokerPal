# Database Module

This module provides database schema, connection utilities, and common operations for the PokerPal application.

## Structure

```
database/
├── migrations/           # SQL migration files
│   ├── 001_create_players_table.sql
│   ├── 002_create_entries_table.sql
│   ├── 003_create_chip_values_table.sql
│   └── 004_create_audit_logs_table.sql
├── connection.js        # Database connection management
├── init.js             # Database initialization and migrations
├── utils.js            # Common database operations
├── test-connection.js  # Database testing utilities
└── README.md           # This file
```

## Setup

1. Install dependencies:
```bash
cd server
npm install
```

2. Initialize the database:
```bash
npm run init-db
```

3. (Optional) Seed with default data:
```bash
npm run seed-db
```

## Usage

### Connection Management

```javascript
const dbConnection = require('./database/connection');

// Connect to database
await dbConnection.connect();

// Execute queries
const result = await dbConnection.run('INSERT INTO players ...', [params]);
const row = await dbConnection.get('SELECT * FROM players WHERE ...', [params]);
const rows = await dbConnection.all('SELECT * FROM players');

// Close connection
await dbConnection.close();
```

### Database Utilities

```javascript
const DatabaseUtils = require('./database/utils');

// Player operations
const player = await DatabaseUtils.createPlayer(playerData);
const playerInfo = await DatabaseUtils.getPlayer('computing_id');
await DatabaseUtils.updatePlayer('computing_id', updates);

// Entry operations
const entry = await DatabaseUtils.createEntry(entryData);
await DatabaseUtils.updateEntry(entryId, updates);
const entries = await DatabaseUtils.getPlayerEntries('computing_id');

// Chip value operations
const chipValues = await DatabaseUtils.getChipValues();
await DatabaseUtils.updateChipValues(newValues);
const total = await DatabaseUtils.calculateChipTotal(chipBreakdown);

// Audit logging
await DatabaseUtils.createAuditLog(logData);
const logs = await DatabaseUtils.getAuditLogs(100);
```

## Database Schema

### Players Table
- `computing_id` (VARCHAR, PRIMARY KEY)
- `first_name` (VARCHAR, NOT NULL)
- `last_name` (VARCHAR, NOT NULL)
- `total_winnings` (DECIMAL, DEFAULT 0.00)
- `years_of_experience` (INTEGER)
- `level` (VARCHAR)
- `major` (VARCHAR)
- `is_admin` (BOOLEAN, DEFAULT FALSE)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Entries Table
- `entry_id` (INTEGER, PRIMARY KEY, AUTOINCREMENT)
- `computing_id` (VARCHAR, FOREIGN KEY)
- `session_date` (DATE)
- `start_photo_url` (VARCHAR)
- `start_chips` (DECIMAL)
- `start_chip_breakdown` (TEXT/JSON)
- `end_photo_url` (VARCHAR)
- `end_chips` (DECIMAL)
- `end_chip_breakdown` (TEXT/JSON)
- `net_winnings` (DECIMAL)
- `is_completed` (BOOLEAN, DEFAULT FALSE)
- `admin_override` (BOOLEAN, DEFAULT FALSE)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Chip Values Table
- `color` (VARCHAR, PRIMARY KEY)
- `value` (DECIMAL, NOT NULL)
- `updated_at` (TIMESTAMP)

### Audit Logs Table
- `log_id` (INTEGER, PRIMARY KEY, AUTOINCREMENT)
- `admin_id` (VARCHAR, FOREIGN KEY)
- `action` (VARCHAR)
- `target_table` (VARCHAR)
- `target_id` (VARCHAR)
- `old_values` (TEXT/JSON)
- `new_values` (TEXT/JSON)
- `timestamp` (TIMESTAMP)

## Scripts

- `npm run init-db` - Initialize database with migrations
- `npm run reset-db` - Drop all tables and recreate
- `npm run seed-db` - Add default data
- `node database/test-connection.js` - Test database functionality

## Error Handling

The database module includes comprehensive error handling:
- Connection errors with retry logic
- Transaction rollback on failures
- Proper foreign key constraint enforcement
- Input validation and sanitization
- Audit logging for admin operations

## Performance Features

- Indexed columns for fast queries
- Transaction support for data consistency
- Connection pooling ready
- Optimized queries for leaderboard and aggregations

## Default Chip Values

The system comes with the following default chip values:
- White: $1.00
- Red: $2.00  
- Green: $5.00
- Black: $20.00
- Blue: $50.00

These values can be updated through the admin interface or using the `DatabaseUtils.updateChipValues()` method.