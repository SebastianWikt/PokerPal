const { handleDatabaseError, sendErrorResponse } = require('./validation');

/**
 * Global error handling middleware
 * This should be the last middleware in the chain
 */
function globalErrorHandler(err, req, res, next) {
    console.error('Global error handler:', {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
    
    // Handle different types of errors
    
    // Validation errors (Joi)
    if (err.isJoi) {
        const details = err.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
        }));
        
        return sendErrorResponse(res, 400, 'Validation failed', 'Invalid request data', details);
    }
    
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return sendErrorResponse(res, 401, 'Authentication failed', 'Invalid token');
    }
    
    if (err.name === 'TokenExpiredError') {
        return sendErrorResponse(res, 401, 'Authentication failed', 'Token expired');
    }
    
    // Multer errors (file upload)
    if (err.code && err.code.startsWith('LIMIT_')) {
        let message = 'File upload error';
        
        switch (err.code) {
            case 'LIMIT_FILE_SIZE':
                message = 'File too large';
                break;
            case 'LIMIT_FILE_COUNT':
                message = 'Too many files';
                break;
            case 'LIMIT_UNEXPECTED_FILE':
                message = 'Unexpected file field';
                break;
        }
        
        return sendErrorResponse(res, 400, 'File upload failed', message);
    }
    
    // Database errors
    if (err.code && err.code.startsWith('SQLITE_')) {
        return handleDatabaseError(err, res);
    }
    
    // Custom application errors
    if (err.statusCode) {
        return sendErrorResponse(res, err.statusCode, err.type || 'Application error', err.message);
    }
    
    // Network/timeout errors
    if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
        return sendErrorResponse(res, 503, 'Service unavailable', 'External service is temporarily unavailable');
    }
    
    // Syntax errors (malformed JSON, etc.)
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return sendErrorResponse(res, 400, 'Invalid JSON', 'Request body contains invalid JSON');
    }
    
    // Default server error
    const isDevelopment = process.env.NODE_ENV === 'development';
    const message = isDevelopment ? err.message : 'An unexpected error occurred';
    const details = isDevelopment ? { stack: err.stack } : null;
    
    sendErrorResponse(res, 500, 'Internal server error', message, details);
}

/**
 * 404 handler for unmatched routes
 */
function notFoundHandler(req, res) {
    // Check if it's an API route
    if (req.originalUrl.startsWith('/api/')) {
        sendErrorResponse(res, 404, 'Not found', `API endpoint ${req.originalUrl} not found`);
    } else {
        // For non-API routes, serve the frontend (SPA routing)
        res.sendFile(path.join(__dirname, '../../index.html'));
    }
}

/**
 * Create custom error
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {string} type - Error type
 * @returns {Error} Custom error object
 */
function createError(message, statusCode = 500, type = 'Application error') {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.type = type;
    return error;
}

/**
 * Validation error creator
 * @param {string} message - Error message
 * @param {Object} details - Validation details
 * @returns {Error} Validation error
 */
function createValidationError(message, details = null) {
    const error = createError(message, 400, 'Validation error');
    error.details = details;
    return error;
}

/**
 * Authentication error creator
 * @param {string} message - Error message
 * @returns {Error} Authentication error
 */
function createAuthError(message = 'Authentication required') {
    return createError(message, 401, 'Authentication error');
}

/**
 * Authorization error creator
 * @param {string} message - Error message
 * @returns {Error} Authorization error
 */
function createAuthorizationError(message = 'Insufficient privileges') {
    return createError(message, 403, 'Authorization error');
}

/**
 * Not found error creator
 * @param {string} resource - Resource name
 * @returns {Error} Not found error
 */
function createNotFoundError(resource = 'Resource') {
    return createError(`${resource} not found`, 404, 'Not found');
}

/**
 * Conflict error creator
 * @param {string} message - Error message
 * @returns {Error} Conflict error
 */
function createConflictError(message) {
    return createError(message, 409, 'Conflict');
}

/**
 * Request timeout handler
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Function} Timeout middleware
 */
function createTimeoutHandler(timeout = 30000) {
    return (req, res, next) => {
        res.setTimeout(timeout, () => {
            const error = createError('Request timeout', 408, 'Timeout');
            next(error);
        });
        next();
    };
}

/**
 * Health check endpoint
 */
function healthCheck(req, res) {
    const healthData = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version,
        environment: process.env.NODE_ENV || 'development'
    };
    
    res.json(healthData);
}

module.exports = {
    globalErrorHandler,
    notFoundHandler,
    createError,
    createValidationError,
    createAuthError,
    createAuthorizationError,
    createNotFoundError,
    createConflictError,
    createTimeoutHandler,
    healthCheck
};