// Test admin routes import
try {
    const adminRoutes = require('./routes/admin');
    console.log('Admin routes type:', typeof adminRoutes);
    console.log('Admin routes constructor:', adminRoutes.constructor.name);
    console.log('Admin routes keys:', Object.keys(adminRoutes));
    console.log('Is function?', typeof adminRoutes === 'function');
    console.log('Has stack property?', adminRoutes.stack !== undefined);
} catch (error) {
    console.error('Error importing admin routes:', error);
}