// Simple test to check provider earnings API
const fetch = require('node-fetch');

// Test configuration
const API_BASE = 'http://localhost:5000/api';
const TEST_EMAIL = 'provider@test.com';
const TEST_PASSWORD = 'password123';

async function testProviderEarnings() {
  try {
    console.log('🧪 Starting provider earnings test...');
    
    // 1. Login as provider
    console.log('🔐 Logging in as provider...');
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      })
    });
    
    if (!loginRes.ok) {
      console.log('❌ Login failed:', await loginRes.text());
      return;
    }
    
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log('✅ Login successful');
    
    // 2. Get profile data
    console.log('📊 Fetching profile...');
    const profileRes = await fetch(`${API_BASE}/auth/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!profileRes.ok) {
      console.log('❌ Profile fetch failed:', await profileRes.text());
      return;
    }
    
    const profileData = await profileRes.json();
    console.log('👤 Profile data:', JSON.stringify(profileData, null, 2));
    
    // 3. Set test earnings
    console.log('💰 Setting test earnings...');
    const testRes = await fetch(`${API_BASE}/auth/test-earnings`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (testRes.ok) {
      const testData = await testRes.json();
      console.log('✅ Test earnings set:', testData);
    } else {
      console.log('❌ Test earnings failed:', await testRes.text());
    }
    
    // 4. Get updated profile
    console.log('📊 Fetching updated profile...');
    const updatedProfileRes = await fetch(`${API_BASE}/auth/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (updatedProfileRes.ok) {
      const updatedData = await updatedProfileRes.json();
      console.log('✅ Updated profile:', JSON.stringify(updatedData.user.providerStats, null, 2));
    }
    
  } catch (err) {
    console.error('❌ Test error:', err.message);
  }
}

// Run the test
testProviderEarnings();