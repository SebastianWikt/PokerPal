# PokerPal Deployment Guide

## Overview

PokerPal is a web-based poker tracking application with computer vision chip detection. This guide covers deployment for development, testing, and production environments.

## Prerequisites

- Node.js 16+ and npm
- SQLite3 (for database)
- Modern web browser with JavaScript enabled
- Optional: Docker for containerized deployment

## Quick Start

### 1. Initial Setup

```bash
# Clone and setup the application
git clone <repository-url>
cd PokerPal

# Install dependencies for both frontend and backend
npm run setup

# Initialize the database
npm run setup:db
```

### 2. Development Environment

```bash
# Start development servers
npm run dev

# This will:
# - Generate development environment configuration
# - Start the backend server on port 3000
# - Serve the frontend on port 8080
```

### 3. Production Environment

```bash
# Build for production
npm run build:prod

# Start production servers
npm start

# This will:
# - Generate production environment configuration
# - Start the backend server with production settings
# - Serve the frontend with optimized settings
```

## Environment Configuration

### Development (.env)

- Port: 3000
- Database: SQLite (development)
- Logging: Debug level
- JWT: Development secret

### Production (.env.production)

- Port: 3000 (configurable via PORT env var)
- Database: SQLite (production)
- Logging: Error level only
- JWT: Production secret (MUST be changed)
- Security: Enhanced CORS and rate limiting

### Test (.env.test)

- Port: 3001
- Database: SQLite (test/in-memory)
- Logging: Debug level
- JWT: Test secret

## Database Setup

### Initial Setup

```bash
# Initialize database with tables and default data
npm run setup:db

# Reset database (WARNING: Deletes all data)
npm run reset:db

# Seed database with sample data
npm run seed:db
```

### Manual Database Operations

```bash
# Access the server directory
cd server

# Run database initialization
node database/init.js

# Test database connection
node database/test-connection.js
```

## Testing

### Run All Tests

```bash
npm test
```

### Individual Test Suites

```bash
# Backend unit tests
npm run test:backend

# Frontend unit tests
npm run test:frontend

# End-to-end tests
npm run test:e2e

# Smoke tests (quick validation)
npm run test:e2e:smoke
```

### Test Categories

- **Unit Tests**: Individual component testing
- **Integration Tests**: API and database testing
- **E2E Tests**: Complete user workflow testing
- **Smoke Tests**: Basic functionality validation

## Production Deployment

### 1. Environment Setup

Create production environment file:

```bash
cp server/.env.production server/.env
```

**IMPORTANT**: Update the following in production:

- `JWT_SECRET`: Use a strong, unique secret key
- `CORS_ORIGIN`: Set to your domain
- `DATABASE_PATH`: Set appropriate database location
- `LOG_LEVEL`: Set to 'error' for production

### 2. Security Considerations

- Change default JWT secret
- Configure CORS for your domain
- Set up HTTPS/SSL certificates
- Configure rate limiting
- Set up proper file permissions
- Use environment variables for secrets

### 3. Performance Optimization

- Enable compression (`COMPRESSION_ENABLED=true`)
- Set static file caching (`STATIC_CACHE_MAX_AGE=86400000`)
- Configure appropriate rate limits
- Monitor database performance
- Set up log rotation

### 4. Monitoring and Logging

- Logs are written to console (configure log aggregation)
- Monitor server health at `/api/health`
- Set up error tracking and alerting
- Monitor database size and performance

## Docker Deployment (Optional)

### Dockerfile

```dockerfile
FROM node:16-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/

# Install dependencies
RUN npm run setup

# Copy application code
COPY . .

# Build for production
RUN npm run build:prod

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
```

### Docker Compose

```yaml
version: "3.8"
services:
  pokerpal:
    build: .
    ports:
      - "3000:3000"
      - "8080:8080"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=your-production-secret
    volumes:
      - ./data:/app/server/database
      - ./uploads:/app/uploads
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**

   ```bash
   # Find process using port 3000
   netstat -ano | findstr :3000
   # Kill process (Windows)
   taskkill /PID <PID> /F
   ```

2. **Database Connection Issues**

   ```bash
   # Test database connection
   cd server && node database/test-connection.js
   # Reset database if corrupted
   npm run reset:db
   ```

3. **Module Not Found Errors**

   ```bash
   # Reinstall dependencies
   rm -rf node_modules server/node_modules
   npm run setup
   ```

4. **Build Issues**
   ```bash
   # Clean and rebuild
   rm -rf js/config/environment.js
   npm run build:dev
   ```

### Validation

Run the integration validation script:

```bash
node validate-integration.js
```

This checks:

- File structure completeness
- Module integration
- Environment configuration
- Database setup
- Test configuration
- API endpoint definitions

## Maintenance

### Regular Tasks

- Monitor log files for errors
- Check database size and performance
- Update dependencies regularly
- Backup database files
- Monitor disk space usage

### Updates

```bash
# Update dependencies
npm update
cd server && npm update

# Run tests after updates
npm test

# Validate integration
node validate-integration.js
```

## Support

### Application Structure

- **Frontend**: AngularJS SPA with Bootstrap UI
- **Backend**: Node.js/Express REST API
- **Database**: SQLite with migration system
- **Testing**: Jest, Karma, Protractor
- **Computer Vision**: TensorFlow.js/OpenCV.js

### Key Features

- User authentication with JWT
- Player profile management
- Session tracking with photo upload
- Computer vision chip detection
- Real-time leaderboard
- Admin panel with audit logging
- Comprehensive error handling
- Responsive design

### Configuration Files

- `package.json`: Main application configuration
- `server/package.json`: Backend dependencies
- `build.config.js`: Build and environment configuration
- `js/config/environment.js`: Generated runtime configuration
- `server/.env*`: Environment-specific settings

For additional support, refer to the application documentation or contact the development team.
