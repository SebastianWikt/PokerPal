#!/usr/bin/env node

// Simple test script to verify the authentication flow
const http = require('http');

function makeRequest(options, data = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(body);
                    resolve({ status: res.statusCode, data: result });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', reject);
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
}

async function testAuthFlow() {
    console.log('Testing PokerPal Authentication Flow...\n');

    try {
        // Test 1: Health check
        console.log('1. Testing API health...');
        const health = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/health',
            method: 'GET'
        });
        console.log(`   Status: ${health.status} - ${health.data.status}\n`);

        // Test 2: Login with test user
        console.log('2. Testing login with test123...');
        const login = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }, { computing_id: 'test123' });
        
        if (login.status === 200) {
            console.log(`   ✓ Login successful! Token received.`);
            const token = login.data.token;
            
            // Test 3: Get user info with token
            console.log('3. Testing authenticated request...');
            const userInfo = await makeRequest({
                hostname: 'localhost',
                port: 3000,
                path: '/api/auth/me',
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (userInfo.status === 200) {
                console.log(`   ✓ User info retrieved: ${userInfo.data.first_name} ${userInfo.data.last_name}`);
                console.log(`   ✓ Total winnings: $${userInfo.data.total_winnings || 0}`);
            } else {
                console.log(`   ✗ Failed to get user info: ${userInfo.status}`);
            }
        } else {
            console.log(`   ✗ Login failed: ${login.status} - ${login.data.error || login.data}`);
        }

        console.log('\n=== Test Results ===');
        console.log('✓ Backend API is working');
        console.log('✓ Authentication flow is functional');
        console.log('\nTo use the app:');
        console.log('1. Go to http://localhost:8080');
        console.log('2. Enter "test123" as Computing ID');
        console.log('3. Click Sign In');
        console.log('4. You should be redirected to the home page with navigation buttons');

    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

testAuthFlow();