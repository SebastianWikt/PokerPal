#!/usr/bin/env node

// PokerPal Integration Validation Script
const fs = require('fs');
const path = require('path');

class IntegrationValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.passed = [];
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [${type.toUpperCase()}] ${message}`);
    }

    addError(message) {
        this.errors.push(message);
        this.log(message, 'error');
    }

    addWarning(message) {
        this.warnings.push(message);
        this.log(message, 'warning');
    }

    addPassed(message) {
        this.passed.push(message);
        this.log(message, 'success');
    }

    // Check if file exists
    checkFileExists(filePath, description) {
        if (fs.existsSync(filePath)) {
            this.addPassed(`✓ ${description}: ${filePath}`);
            return true;
        } else {
            this.addError(`✗ Missing ${description}: ${filePath}`);
            return false;
        }
    }

    // Check if directory exists
    checkDirectoryExists(dirPath, description) {
        if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
            this.addPassed(`✓ ${description}: ${dirPath}`);
            return true;
        } else {
            this.addError(`✗ Missing ${description}: ${dirPath}`);
            return false;
        }
    }

    // Check file content contains specific text
    checkFileContains(filePath, searchText, description) {
        if (!fs.existsSync(filePath)) {
            this.addError(`✗ File not found for ${description}: ${filePath}`);
            return false;
        }

        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes(searchText)) {
            this.addPassed(`✓ ${description}`);
            return true;
        } else {
            this.addError(`✗ ${description} - Missing: ${searchText}`);
            return false;
        }
    }

    // Validate PokerPal branding
    validateBranding() {
        this.log('Validating PokerPal branding...');

        // Check main HTML file
        this.checkFileContains('index.html', 'PokerPal', 'PokerPal branding in index.html');
        this.checkFileContains('index.html', 'Track Your Poker Sessions', 'PokerPal tagline in index.html');

        // Check package.json files
        this.checkFileContains('package.json', '"name": "pokerpal"', 'PokerPal name in root package.json');
        this.checkFileContains('server/package.json', 'PokerPal', 'PokerPal branding in server package.json');

        // Check app.js module name
        this.checkFileContains('js/app.js', 'pokerPalApp', 'PokerPal app module name');

        // Check README files
        if (fs.existsSync('README.md')) {
            this.checkFileContains('README.md', 'PokerPal', 'PokerPal branding in README.md');
        }
    }

    // Validate file structure
    validateFileStructure() {
        this.log('Validating file structure...');

        // Core application files
        const coreFiles = [
            'index.html',
            'package.json',
            'js/app.js',
            'css/app.css',
            'server/app.js',
            'server/package.json'
        ];

        coreFiles.forEach(file => {
            this.checkFileExists(file, 'Core file');
        });

        // Service files
        const serviceFiles = [
            'js/services/authService.js',
            'js/services/playerService.js',
            'js/services/sessionService.js',
            'js/services/leaderboardService.js',
            'js/services/adminService.js',
            'js/services/computerVisionService.js',
            'js/services/errorService.js',
            'js/services/errorInterceptor.js',
            'js/services/validationService.js'
        ];

        serviceFiles.forEach(file => {
            this.checkFileExists(file, 'Service file');
        });

        // Controller files
        const controllerFiles = [
            'js/controllers/loginController.js',
            'js/controllers/homeController.js',
            'js/controllers/profileController.js',
            'js/controllers/sessionController.js',
            'js/controllers/leaderboardController.js',
            'js/controllers/adminController.js',
            'js/controllers/navController.js'
        ];

        controllerFiles.forEach(file => {
            this.checkFileExists(file, 'Controller file');
        });

        // View files
        const viewFiles = [
            'views/login.html',
            'views/home.html',
            'views/profile-create.html',
            'views/profile-edit.html',
            'views/session.html',
            'views/leaderboard.html',
            'views/admin.html'
        ];

        viewFiles.forEach(file => {
            this.checkFileExists(file, 'View file');
        });

        // Server route files
        const routeFiles = [
            'server/routes/auth.js',
            'server/routes/players.js',
            'server/routes/sessions.js',
            'server/routes/leaderboard.js',
            'server/routes/admin.js',
            'server/routes/vision.js'
        ];

        routeFiles.forEach(file => {
            this.checkFileExists(file, 'Route file');
        });
    }

    // Validate environment configuration
    validateEnvironmentConfig() {
        this.log('Validating environment configuration...');

        // Check environment files
        this.checkFileExists('server/.env', 'Development environment config');
        this.checkFileExists('server/.env.production', 'Production environment config');
        this.checkFileExists('server/.env.test', 'Test environment config');

        // Check build configuration
        this.checkFileExists('build.config.js', 'Build configuration');
        this.checkFileExists('js/config/environment.js', 'Generated environment config');

        // Check environment variables in .env files
        if (fs.existsSync('server/.env')) {
            this.checkFileContains('server/.env', 'NODE_ENV=development', 'Development NODE_ENV setting');
            this.checkFileContains('server/.env', 'JWT_SECRET=', 'JWT secret configuration');
            this.checkFileContains('server/.env', 'PORT=3000', 'Port configuration');
        }

        if (fs.existsSync('server/.env.production')) {
            this.checkFileContains('server/.env.production', 'NODE_ENV=production', 'Production NODE_ENV setting');
            this.checkFileContains('server/.env.production', 'LOG_LEVEL=error', 'Production log level');
        }
    }

    // Validate module integration
    validateModuleIntegration() {
        this.log('Validating module integration...');

        // Check that all services are included in index.html
        const indexContent = fs.readFileSync('index.html', 'utf8');
        
        const requiredScripts = [
            'js/services/errorService.js',
            'js/services/errorInterceptor.js',
            'js/services/authService.js',
            'js/services/playerService.js',
            'js/services/sessionService.js',
            'js/services/leaderboardService.js',
            'js/services/adminService.js',
            'js/services/computerVisionService.js',
            'js/controllers/navController.js',
            'js/controllers/loginController.js',
            'js/controllers/homeController.js',
            'js/controllers/profileController.js',
            'js/controllers/sessionController.js',
            'js/controllers/leaderboardController.js',
            'js/controllers/adminController.js'
        ];

        requiredScripts.forEach(script => {
            if (indexContent.includes(script)) {
                this.addPassed(`✓ Script included in index.html: ${script}`);
            } else {
                this.addError(`✗ Script missing from index.html: ${script}`);
            }
        });

        // Check app.js module dependencies
        this.checkFileContains('js/app.js', 'pokerPalApp', 'Main app module declaration');
        this.checkFileContains('js/app.js', 'ngRoute', 'ngRoute dependency');
        this.checkFileContains('js/app.js', 'ErrorInterceptor', 'ErrorInterceptor integration');

        // Check that all routes are defined
        const routePaths = ['/home', '/profile/create', '/profile/edit', '/session', '/leaderboard', '/admin'];
        routePaths.forEach(route => {
            this.checkFileContains('js/app.js', route, `Route definition: ${route}`);
        });
    }

    // Validate database structure
    validateDatabaseStructure() {
        this.log('Validating database structure...');

        // Check database files
        this.checkDirectoryExists('server/database', 'Database directory');
        this.checkFileExists('server/database/init.js', 'Database initialization');
        this.checkFileExists('server/database/utils.js', 'Database utilities');

        // Check migration files
        const migrationDir = 'server/database/migrations';
        if (this.checkDirectoryExists(migrationDir, 'Migration directory')) {
            const expectedMigrations = [
                '001_create_players_table.sql',
                '002_create_entries_table.sql',
                '003_create_chip_values_table.sql',
                '004_create_audit_logs_table.sql'
            ];

            expectedMigrations.forEach(migration => {
                this.checkFileExists(path.join(migrationDir, migration), `Migration: ${migration}`);
            });
        }
    }

    // Validate test structure
    validateTestStructure() {
        this.log('Validating test structure...');

        // Check test directories
        this.checkDirectoryExists('test', 'Test directory');
        this.checkDirectoryExists('test/unit', 'Unit test directory');
        this.checkDirectoryExists('test/e2e', 'E2E test directory');
        this.checkDirectoryExists('server/test', 'Server test directory');

        // Check test configuration files
        this.checkFileExists('jest.config.js', 'Jest configuration');
        this.checkFileExists('karma.conf.js', 'Karma configuration');
        this.checkFileExists('protractor.conf.js', 'Protractor configuration');

        // Check test runner
        this.checkFileExists('test/e2e/run-e2e-tests.js', 'E2E test runner');
        this.checkFileExists('test/run-all-tests.js', 'Main test runner');
    }

    // Validate package.json scripts
    validatePackageScripts() {
        this.log('Validating package.json scripts...');

        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        const requiredScripts = [
            'start',
            'dev',
            'build',
            'build:dev',
            'build:prod',
            'setup',
            'setup:db',
            'test',
            'test:backend',
            'test:frontend',
            'test:e2e'
        ];

        requiredScripts.forEach(script => {
            if (packageJson.scripts && packageJson.scripts[script]) {
                this.addPassed(`✓ Package script defined: ${script}`);
            } else {
                this.addError(`✗ Missing package script: ${script}`);
            }
        });
    }

    // Validate API endpoints
    validateAPIEndpoints() {
        this.log('Validating API endpoint definitions...');

        const routeFiles = [
            { file: 'server/routes/auth.js', endpoints: ['POST /login', 'POST /logout', 'GET /me'] },
            { file: 'server/routes/players.js', endpoints: ['GET /:computingId', 'POST /', 'PUT /:computingId', 'GET /leaderboard'] },
            { file: 'server/routes/sessions.js', endpoints: ['POST /', 'GET /:computingId', 'PUT /:sessionId'] },
            { file: 'server/routes/admin.js', endpoints: ['GET /chip-values', 'PUT /chip-values'] },
            { file: 'server/routes/vision.js', endpoints: ['POST /analyze'] }
        ];

        routeFiles.forEach(({ file, endpoints }) => {
            if (fs.existsSync(file)) {
                const content = fs.readFileSync(file, 'utf8');
                endpoints.forEach(endpoint => {
                    const [method, path] = endpoint.split(' ');
                    const routePattern = `router.${method.toLowerCase()}('${path}'`;
                    if (content.includes(routePattern) || content.includes(`router.${method.toLowerCase()}("${path}"`)) {
                        this.addPassed(`✓ API endpoint: ${method} ${path} in ${file}`);
                    } else {
                        this.addWarning(`⚠ API endpoint may be missing: ${method} ${path} in ${file}`);
                    }
                });
            }
        });
    }

    // Generate summary report
    generateReport() {
        this.log('\n' + '='.repeat(60));
        this.log('POKERPAL INTEGRATION VALIDATION REPORT');
        this.log('='.repeat(60));

        this.log(`\n✓ PASSED: ${this.passed.length} checks`);
        this.log(`⚠ WARNINGS: ${this.warnings.length} checks`);
        this.log(`✗ ERRORS: ${this.errors.length} checks`);

        if (this.warnings.length > 0) {
            this.log('\nWARNINGS:');
            this.warnings.forEach(warning => this.log(`  ⚠ ${warning}`));
        }

        if (this.errors.length > 0) {
            this.log('\nERRORS:');
            this.errors.forEach(error => this.log(`  ✗ ${error}`));
        }

        this.log('\n' + '='.repeat(60));
        
        if (this.errors.length === 0) {
            this.log('🎉 INTEGRATION VALIDATION PASSED!');
            this.log('PokerPal application is ready for deployment.');
            return true;
        } else {
            this.log('❌ INTEGRATION VALIDATION FAILED!');
            this.log(`Please fix ${this.errors.length} error(s) before deployment.`);
            return false;
        }
    }

    // Run all validations
    async validate() {
        this.log('Starting PokerPal integration validation...\n');

        this.validateBranding();
        this.validateFileStructure();
        this.validateEnvironmentConfig();
        this.validateModuleIntegration();
        this.validateDatabaseStructure();
        this.validateTestStructure();
        this.validatePackageScripts();
        this.validateAPIEndpoints();

        return this.generateReport();
    }
}

// CLI interface
if (require.main === module) {
    const validator = new IntegrationValidator();
    
    validator.validate().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('Validation failed with error:', error);
        process.exit(1);
    });
}

module.exports = IntegrationValidator;