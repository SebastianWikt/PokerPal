// Test admin routes dependencies
try {
    console.log('Testing express...');
    const express = require('express');
    console.log('Express OK');
    
    console.log('Testing Joi...');
    const Joi = require('joi');
    console.log('Joi OK');
    
    console.log('Testing auth middleware...');
    const { authenticateToken, requireAdmin } = require('./middleware/auth');
    console.log('Auth middleware OK');
    
    console.log('Testing validation middleware...');
    const { validateBody, validateParams, schemas } = require('./middleware/validation');
    console.log('Validation middleware OK');
    
    console.log('Testing DatabaseUtils...');
    const DatabaseUtils = require('./database/utils');
    console.log('DatabaseUtils OK');
    
    console.log('Creating router...');
    const router = express.Router();
    console.log('Router created OK');
    
} catch (error) {
    console.error('Error testing dependencies:', error);
}