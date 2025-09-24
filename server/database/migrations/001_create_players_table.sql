-- Create players table
CREATE TABLE IF NOT EXISTS players (
    computing_id VARCHAR(50) PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    total_winnings DECIMAL(10,2) DEFAULT 0.00,
    years_of_experience INTEGER,
    level VARCHAR(50),
    major VARCHAR(100),
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_players_total_winnings ON players(total_winnings DESC);