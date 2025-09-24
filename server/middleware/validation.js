const Joi = require('joi');
const multer = require('multer');
const path = require('path');

/**
 * Create validation middleware for request body
 * @param {Joi.Schema} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
function validateBody(schema) {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });
        
        if (error) {
            const details = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));
            
            return res.status(400).json({
                error: 'Validation failed',
                message: 'Invalid request data',
                details: details
            });
        }
        
        req.body = value;
        next();
    };
}

/**
 * Create validation middleware for request parameters
 * @param {Joi.Schema} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
function validateParams(schema) {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.params, {
            abortEarly: false,
            stripUnknown: true
        });
        
        if (error) {
            const details = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));
            
            return res.status(400).json({
                error: 'Validation failed',
                message: 'Invalid request parameters',
                details: details
            });
        }
        
        req.params = value;
        next();
    };
}

/**
 * Create validation middleware for query parameters
 * @param {Joi.Schema} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
function validateQuery(schema) {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.query, {
            abortEarly: false,
            stripUnknown: true
        });
        
        if (error) {
            const details = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));
            
            return res.status(400).json({
                error: 'Validation failed',
                message: 'Invalid query parameters',
                details: details
            });
        }
        
        req.query = value;
        next();
    };
}

// Common validation schemas
const schemas = {
    computingId: Joi.string()
        .pattern(/^[a-zA-Z0-9]+$/)
        .min(3)
        .max(50)
        .required()
        .messages({
            'string.pattern.base': 'Computing ID must contain only letters and numbers',
            'string.min': 'Computing ID must be at least 3 characters long',
            'string.max': 'Computing ID must not exceed 50 characters'
        }),
    
    name: Joi.string()
        .trim()
        .min(1)
        .max(100)
        .required()
        .messages({
            'string.min': 'Name cannot be empty',
            'string.max': 'Name must not exceed 100 characters'
        }),
    
    email: Joi.string()
        .email()
        .max(255)
        .messages({
            'string.email': 'Must be a valid email address',
            'string.max': 'Email must not exceed 255 characters'
        }),
    
    yearsOfExperience: Joi.number()
        .integer()
        .min(0)
        .max(50)
        .messages({
            'number.min': 'Years of experience cannot be negative',
            'number.max': 'Years of experience must not exceed 50'
        }),
    
    level: Joi.string()
        .valid('Beginner', 'Intermediate', 'Advanced', 'Expert')
        .messages({
            'any.only': 'Level must be one of: Beginner, Intermediate, Advanced, Expert'
        }),
    
    major: Joi.string()
        .trim()
        .max(100)
        .messages({
            'string.max': 'Major must not exceed 100 characters'
        }),
    
    sessionDate: Joi.date()
        .iso()
        .max('now')
        .messages({
            'date.max': 'Session date cannot be in the future'
        }),
    
    chipCount: Joi.number()
        .integer()
        .min(0)
        .messages({
            'number.min': 'Chip count cannot be negative'
        }),
    
    chipValue: Joi.number()
        .positive()
        .precision(2)
        .messages({
            'number.positive': 'Chip value must be positive'
        }),
    
    chipColor: Joi.string()
        .valid('white', 'red', 'green', 'black', 'blue')
        .messages({
            'any.only': 'Chip color must be one of: white, red, green, black, blue'
        })
};

/**
 * File upload validation middleware
 * @param {Object} options - Upload options
 * @returns {Function} Multer middleware
 */
function validateFileUpload(options = {}) {
    const {
        maxSize = 10 * 1024 * 1024, // 10MB default
        allowedTypes = ['image/jpeg', 'image/png', 'image/gif'],
        maxFiles = 1
    } = options;
    
    const storage = multer.memoryStorage();
    
    const fileFilter = (req, file, cb) => {
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`), false);
        }
    };
    
    const upload = multer({
        storage,
        fileFilter,
        limits: {
            fileSize: maxSize,
            files: maxFiles
        }
    });
    
    return (req, res, next) => {
        const uploadMiddleware = maxFiles === 1 ? upload.single('photo') : upload.array('photos', maxFiles);
        
        uploadMiddleware(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                let message = 'File upload error';
                let statusCode = 400;
                
                switch (err.code) {
                    case 'LIMIT_FILE_SIZE':
                        message = `File too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB`;
                        break;
                    case 'LIMIT_FILE_COUNT':
                        message = `Too many files. Maximum is ${maxFiles}`;
                        break;
                    case 'LIMIT_UNEXPECTED_FILE':
                        message = 'Unexpected file field';
                        break;
                    default:
                        message = err.message;
                }
                
                return res.status(statusCode).json({
                    error: 'File upload validation failed',
                    message: message,
                    code: err.code
                });
            } else if (err) {
                return res.status(400).json({
                    error: 'File validation failed',
                    message: err.message
                });
            }
            
            next();
        });
    };
}

/**
 * Sanitize input data
 * @param {Object} data - Data to sanitize
 * @returns {Object} Sanitized data
 */
function sanitizeInput(data) {
    if (typeof data === 'string') {
        return data.trim().replace(/[<>]/g, '');
    } else if (Array.isArray(data)) {
        return data.map(sanitizeInput);
    } else if (typeof data === 'object' && data !== null) {
        const sanitized = {};
        for (const key in data) {
            sanitized[key] = sanitizeInput(data[key]);
        }
        return sanitized;
    }
    return data;
}

/**
 * Input sanitization middleware
 */
function sanitizeMiddleware(req, res, next) {
    if (req.body) {
        req.body = sanitizeInput(req.body);
    }
    if (req.query) {
        req.query = sanitizeInput(req.query);
    }
    if (req.params) {
        req.params = sanitizeInput(req.params);
    }
    next();
}

/**
 * Rate limiting validation
 * @param {Object} options - Rate limiting options
 * @returns {Function} Rate limiting middleware
 */
function createRateLimit(options = {}) {
    const {
        windowMs = 15 * 60 * 1000, // 15 minutes
        max = 100, // limit each IP to 100 requests per windowMs
        message = 'Too many requests from this IP, please try again later'
    } = options;
    
    const requests = new Map();
    
    return (req, res, next) => {
        const ip = req.ip || req.connection.remoteAddress;
        const now = Date.now();
        const windowStart = now - windowMs;
        
        // Clean old entries
        for (const [key, timestamps] of requests.entries()) {
            const validTimestamps = timestamps.filter(timestamp => timestamp > windowStart);
            if (validTimestamps.length === 0) {
                requests.delete(key);
            } else {
                requests.set(key, validTimestamps);
            }
        }
        
        // Check current IP
        const ipRequests = requests.get(ip) || [];
        const validRequests = ipRequests.filter(timestamp => timestamp > windowStart);
        
        if (validRequests.length >= max) {
            return res.status(429).json({
                error: 'Rate limit exceeded',
                message: message,
                retryAfter: Math.ceil(windowMs / 1000)
            });
        }
        
        // Add current request
        validRequests.push(now);
        requests.set(ip, validRequests);
        
        next();
    };
}

/**
 * Database error handler
 * @param {Error} error - Database error
 * @param {Object} res - Express response object
 */
function handleDatabaseError(error, res) {
    console.error('Database error:', error);
    
    // SQLite specific errors
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return res.status(409).json({
            error: 'Duplicate entry',
            message: 'A record with this information already exists',
            code: error.code
        });
    }
    
    if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
        return res.status(400).json({
            error: 'Invalid reference',
            message: 'Referenced record does not exist',
            code: error.code
        });
    }
    
    if (error.code === 'SQLITE_CONSTRAINT_CHECK') {
        return res.status(400).json({
            error: 'Constraint violation',
            message: 'Data does not meet database constraints',
            code: error.code
        });
    }
    
    // Generic database error
    return res.status(500).json({
        error: 'Database error',
        message: 'An error occurred while processing your request',
        code: error.code || 'DATABASE_ERROR'
    });
}

/**
 * Async error wrapper
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

/**
 * Standard error response format
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} error - Error type
 * @param {string} message - Error message
 * @param {Object} details - Additional error details
 */
function sendErrorResponse(res, statusCode, error, message, details = null) {
    const response = {
        error,
        message,
        timestamp: new Date().toISOString()
    };
    
    if (details) {
        response.details = details;
    }
    
    res.status(statusCode).json(response);
}

module.exports = {
    validateBody,
    validateParams,
    validateQuery,
    validateFileUpload,
    sanitizeMiddleware,
    createRateLimit,
    handleDatabaseError,
    asyncHandler,
    sendErrorResponse,
    schemas
};