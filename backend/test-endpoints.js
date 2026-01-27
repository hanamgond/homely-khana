// backend/test-endpoints.js
const axios = require('axios');

// Your JWT token from browser localStorage
const token = 'PASTE_YOUR_JWT_TOKEN_HERE'; // Get this from browser console: localStorage.getItem('token')
const baseURL = 'http://localhost:5000'; // Your backend URL

async function testAllEndpoints() {
    const headers = { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
    
    console.log('🚀 Starting endpoint tests...\n');
    
    // Test 1: Debug token endpoint
    try {
        console.log('1. Testing /api/auth/debug-token...');
        const debugRes = await axios.get(`${baseURL}/api/auth/debug-token`, { headers });
        console.log('✅ Success:', debugRes.data.success);
        console.log('   User ID:', debugRes.data.user?.id);
        console.log('   Full user:', debugRes.data.user);
    } catch (error) {
        console.log('❌ Failed:', error.response?.data || error.message);
        console.log('   Status:', error.response?.status);
    }
    
    // Test 2: User Dashboard endpoints
    const dashboardEndpoints = [
        '/api/userDashboard/next-delivery',
        '/api/userDashboard/subscriptions'
    ];
    
    for (const endpoint of dashboardEndpoints) {
        console.log(`\n2. Testing ${endpoint}...`);
        try {
            const response = await axios.get(baseURL + endpoint, { headers });
            console.log('✅ Success:', response.data.success);
            console.log('   Data:', response.data.data ? 'Has data' : 'No data');
            if (response.data.data) {
                console.log('   Sample:', JSON.stringify(response.data.data).substring(0, 100) + '...');
            }
        } catch (error) {
            console.log('❌ Failed:', error.response?.data?.error || error.message);
            console.log('   Status:', error.response?.status);
            console.log('   Response:', error.response?.data);
        }
    }
    
    // Test 3: Other endpoints
    const otherEndpoints = [
        '/api/auth/profile',
        '/api/addresses/all',
        '/api/reviews/user'
    ];
    
    for (const endpoint of otherEndpoints) {
        console.log(`\n3. Testing ${endpoint}...`);
        try {
            const response = await axios.get(baseURL + endpoint, { headers });
            console.log('✅ Success:', response.data.success);
        } catch (error) {
            console.log('❌ Failed:', error.response?.data?.error || error.message);
        }
    }
    
    console.log('\n🎯 Tests completed!');
}

// How to get your token:
console.log(`
==========================================
HOW TO GET YOUR JWT TOKEN:
==========================================
1. Open your browser
2. Go to your HomelyKhana frontend
3. Open Developer Tools (F12)
4. Go to Console tab
5. Type: localStorage.getItem('token')
6. Copy the token string
7. Paste it in the 'token' variable above
==========================================
`);

// Uncomment to run automatically, or run manually:
// testAllEndpoints();

module.exports = { testAllEndpoints };