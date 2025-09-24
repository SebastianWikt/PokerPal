-- Create chip_values table
CREATE TABLE IF NOT EXISTS chip_values (
    color VARCHAR(50) PRIMARY KEY,
    value DECIMAL(10,2) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default chip values
INSERT OR IGNORE INTO chip_values (color, value) VALUES
    ('white', 1.00),
    ('red', 2.00),
    ('green', 5.00),
    ('black', 20.00),
    ('blue', 50.00);