const fs = require("fs");
const path = require("path");
const dbConnection = require("./connection");

class DatabaseInitializer {
  constructor() {
    this.migrationsPath = path.join(__dirname, "migrations");
  }

  /**
   * Initialize database with all migrations
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      console.log("Initializing database...");

      // Connect to database
      await dbConnection.connect();

      // Run migrations
      await this.runMigrations();

      console.log("Database initialization completed successfully");
    } catch (error) {
      console.error("Database initialization failed:", error.message);
      throw error;
    }
  }

  /**
   * Run all migration files in order
   * @returns {Promise<void>}
   */
  async runMigrations() {
    try {
      // Get all migration files
      const migrationFiles = fs
        .readdirSync(this.migrationsPath)
        .filter((file) => file.endsWith(".sql"))
        .sort(); // Ensure they run in order

      console.log(`Found ${migrationFiles.length} migration files`);

      // Execute each migration
      for (const file of migrationFiles) {
        await this.runMigration(file);
      }
    } catch (error) {
      console.error("Migration error:", error.message);
      throw error;
    }
  }

  /**
   * Run a single migration file
   * @param {string} filename - Migration file name
   * @returns {Promise<void>}
   */
  async runMigration(filename) {
    try {
      console.log(`Running migration: ${filename}`);

      const filePath = path.join(this.migrationsPath, filename);
      const sql = fs.readFileSync(filePath, "utf8");

      // Split SQL file by semicolons and execute each statement
      const statements = sql
        .split(";")
        .map((stmt) => stmt.trim())
        .filter((stmt) => stmt.length > 0);

      for (const statement of statements) {
        await dbConnection.run(statement);
      }

      console.log(`Migration completed: ${filename}`);
    } catch (error) {
      console.error(`Migration failed for ${filename}:`, error.message);
      throw error;
    }
  }

  /**
   * Reset database (drop all tables and recreate)
   * @returns {Promise<void>}
   */
  async reset() {
    try {
      console.log("Resetting database...");

      // Connect to database
      await dbConnection.connect();

      // Drop all tables
      await dbConnection.run("DROP TABLE IF EXISTS audit_logs");
      await dbConnection.run("DROP TABLE IF EXISTS entries");
      await dbConnection.run("DROP TABLE IF EXISTS chip_values");
      await dbConnection.run("DROP TABLE IF EXISTS players");

      // Re-run migrations
      await this.runMigrations();

      console.log("Database reset completed");
    } catch (error) {
      console.error("Database reset failed:", error.message);
      throw error;
    }
  }

  /**
   * Seed database with default data
   * @returns {Promise<void>}
   */
  async seed() {
    try {
      console.log("Seeding database with default data...");

      // Create default admin user
      const adminExists = await dbConnection.get(
        "SELECT computing_id FROM players WHERE computing_id = ?",
        ["admin"]
      );

      if (!adminExists) {
        await dbConnection.run(
          `
                    INSERT INTO players (
                        computing_id, first_name, last_name, 
                        years_of_experience, level, major, is_admin
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                `,
          ["admin", "Admin", "User", 5, "Expert", "Computer Science", true]
        );

        console.log("Default admin user created");
      }

      console.log("Database seeding completed");
    } catch (error) {
      console.error("Database seeding failed:", error.message);
      throw error;
    }
  }
}

// Export singleton instance
const dbInitializer = new DatabaseInitializer();

// If this file is run directly, initialize the database
if (require.main === module) {
  dbInitializer
    .initialize()
    .then(() => {
      console.log("Database setup complete");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Database setup failed:", error);
      process.exit(1);
    });
}

module.exports = dbInitializer;
