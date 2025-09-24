const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8080;

// MIME types
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
};

const server = http.createServer((req, res) => {
    console.log(`${req.method} ${req.url}`);
    
    // Parse URL
    const parsedUrl = url.parse(req.url);
    let pathname = parsedUrl.pathname;
    
    // Default to index.html for root and SPA routes
    if (pathname === '/' || pathname.startsWith('/#!/')) {
        pathname = '/index.html';
    }
    
    // Build file path
    const filePath = path.join(__dirname, pathname);
    
    // Get file extension
    const ext = path.parse(filePath).ext;
    
    // Check if file exists
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            // File not found - serve index.html for SPA routing
            if (ext === '' || pathname.startsWith('/#!/')) {
                const indexPath = path.join(__dirname, 'index.html');
                fs.readFile(indexPath, (err, data) => {
                    if (err) {
                        res.statusCode = 500;
                        res.end('Error loading index.html');
                        return;
                    }
                    res.setHeader('Content-Type', 'text/html');
                    res.end(data);
                });
            } else {
                res.statusCode = 404;
                res.end('File not found');
            }
            return;
        }
        
        // Read and serve file
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.statusCode = 500;
                res.end('Error reading file');
                return;
            }
            
            // Set content type
            const contentType = mimeTypes[ext] || 'application/octet-stream';
            res.setHeader('Content-Type', contentType);
            
            // Enable CORS for API calls
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            
            res.end(data);
        });
    });
});

server.listen(PORT, () => {
    console.log(`PokerPal frontend server running at http://localhost:${PORT}`);
    console.log('Backend API should be running at http://localhost:3000');
    console.log('');
    console.log('Navigate to: http://localhost:8080');
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`Port ${PORT} is already in use. Please close other applications using this port.`);
    } else {
        console.error('Server error:', err);
    }
});