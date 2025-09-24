-- Create entries table
CREATE TABLE IF NOT EXISTS entries (
    entry_id INTEGER PRIMARY KEY AUTOINCREMENT,
    computing_id VARCHAR(50) NOT NULL,
    session_date DATE NOT NULL,
    start_photo_url VARCHAR(255),
    start_chips DECIMAL(10,2),
    start_chip_breakdown TEXT, -- JSON stored as TEXT for SQLite compatibility
    end_photo_url VARCHAR(255),
    end_chips DECIMAL(10,2),
    end_chip_breakdown TEXT, -- JSON stored as TEXT for SQLite compatibility
    net_winnings DECIMAL(10,2),
    is_completed BOOLEAN DEFAULT FALSE,
    admin_override BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (computing_id) REFERENCES players(computing_id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_entries_computing_id ON entries(computing_id);
CREATE INDEX IF NOT EXISTS idx_entries_session_date ON entries(session_date);
CREATE INDEX IF NOT EXISTS idx_entries_completed ON entries(is_completed);