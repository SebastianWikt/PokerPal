const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
require("dotenv").config();

// Import database connection
const dbConnection = require("./database/connection");
const dbInitializer = require("./database/init");

// Import routes
const authRoutes = require("./routes/auth");
const playerRoutes = require("./routes/players");
const sessionRoutes = require("./routes/sessions");
const visionRoutes = require("./routes/vision");
const leaderboardRoutes = require("./routes/leaderboard");
const adminRoutes = require("./routes/admin-minimal");

// Import middleware
const {
  sanitizeMiddleware,
  createRateLimit,
  createTimeoutHandler,
} = require("./middleware/validation");
const {
  globalErrorHandler,
  notFoundHandler,
  healthCheck,
  createTimeoutHandler: timeoutHandler,
} = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:8080",
    credentials: true,
  })
);

// Request timeout middleware
app.use(timeoutHandler(30000)); // 30 second timeout

// Rate limiting middleware
app.use(
  "/api/",
  createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many API requests from this IP, please try again later",
  })
);

// Logging middleware
app.use(morgan("combined"));

// Body parsing middleware with error handling
app.use(
  express.json({
    limit: "10mb",
    verify: (req, res, buf) => {
      try {
        JSON.parse(buf);
      } catch (e) {
        res.status(400).json({
          error: "Invalid JSON",
          message: "Request body contains invalid JSON",
        });
        return;
      }
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Input sanitization middleware
app.use(sanitizeMiddleware);

// Static file serving for uploads
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Serve frontend static files
app.use(express.static(path.join(__dirname, "..")));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/players", playerRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/vision", visionRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/admin", adminRoutes);

// Health check endpoint
app.get("/api/health", healthCheck);

// Global error handling middleware (must be last)
app.use(globalErrorHandler);

// 404 handler for unmatched routes
app.use("*", notFoundHandler);

// Initialize database and start server
async function startServer() {
  try {
    console.log("Initializing database...");
    await dbInitializer.initialize();

    app.listen(PORT, () => {
      console.log(`PokerPal server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down server...");
  await dbConnection.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Shutting down server...");
  await dbConnection.close();
  process.exit(0);
});

// Only start the server when this file is executed directly. This prevents
// the server (and database initialization) from running during unit tests
// which `require` this module.
if (require.main === module) {
  startServer();
}

module.exports = app;
