// PokerPal Build Configuration
const fs = require('fs');
const path = require('path');

const buildConfig = {
    development: {
        apiBaseUrl: 'http://localhost:3000/api',
        serverPort: 3000,
        frontendPort: 8080,
        minify: false,
        sourceMap: true,
        debug: true,
        logLevel: 'debug'
    },
    
    production: {
        apiBaseUrl: '/api',
        serverPort: process.env.PORT || 3000,
        frontendPort: process.env.FRONTEND_PORT || 8080,
        minify: true,
        sourceMap: false,
        debug: false,
        logLevel: 'error'
    },
    
    test: {
        apiBaseUrl: 'http://localhost:3001/api',
        serverPort: 3001,
        frontendPort: 8081,
        minify: false,
        sourceMap: true,
        debug: true,
        logLevel: 'debug'
    }
};

function getConfig(environment = 'development') {
    const config = buildConfig[environment];
    if (!config) {
        throw new Error(`Unknown environment: ${environment}`);
    }
    return config;
}

function generateEnvironmentFile(environment = 'development') {
    const config = getConfig(environment);
    
    const envContent = `// Auto-generated environment configuration for ${environment}
window.ENV_CONFIG = ${JSON.stringify(config, null, 2)};
`;
    
    const outputPath = path.join(__dirname, 'js', 'config', 'environment.js');
    
    // Ensure config directory exists
    const configDir = path.dirname(outputPath);
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, envContent);
    console.log(`Environment configuration generated for ${environment}: ${outputPath}`);
}

module.exports = {
    getConfig,
    generateEnvironmentFile,
    buildConfig
};

// CLI usage
if (require.main === module) {
    const environment = process.argv[2] || 'development';
    generateEnvironmentFile(environment);
}