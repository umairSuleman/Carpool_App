import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config({override: true});

const BASE_URL = 'http://localhost:5000/api';

async function testAuthRoutes() {
  console.log('🧪 Starting Auth Routes Tests...\n');

  let token = '';
  let testEmail = `test${Date.now()}@example.com`;

  // Test 1: Register
  try {
    console.log('1️⃣  Testing REGISTER...');
    const registerResponse = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: testEmail,
        phone: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        password: 'Test1234!',
        confirmPassword: 'Test1234!'
      })
    });
    
    const registerData = await registerResponse.json();
    
    if (registerResponse.ok) {
      console.log('   ✅ Register successful');
      console.log('   📧 Email:', testEmail);
      token = registerData.token;
      console.log('   🔑 Token received:', token.substring(0, 20) + '...');
    } else {
      console.log('   ❌ Register failed:', registerData.error);
      return;
    }
  } catch (error) {
    console.log('   ❌ Register error:', error.message);
    return;
  }

  console.log('\n');

  // Test 2: Login
  try {
    console.log('2️⃣  Testing LOGIN...');
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'Test1234!'
      })
    });
    
    const loginData = await loginResponse.json();
    
    if (loginResponse.ok) {
      console.log('   ✅ Login successful');
      token = loginData.token;
      console.log('   🔑 Token:', token.substring(0, 20) + '...');
    } else {
      console.log('   ❌ Login failed:', loginData.error);
    }
  } catch (error) {
    console.log('   ❌ Login error:', error.message);
  }

  console.log('\n');

  // Test 3: Get Profile (Protected Route)
  if (token) {
    try {
      console.log('3️⃣  Testing GET PROFILE (Protected)...');
      const profileResponse = await fetch(`${BASE_URL}/auth/profile`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });
      
      const profileData = await profileResponse.json();
      
      if (profileResponse.ok) {
        console.log('   ✅ Profile retrieved successfully');
        console.log('   👤 User:', profileData.user.name);
        console.log('   📧 Email:', profileData.user.email);
        console.log('   ✔️  Verified:', profileData.user.is_verified);
      } else {
        console.log('   ❌ Profile failed:', profileData.error);
      }
    } catch (error) {
      console.log('   ❌ Profile error:', error.message);
    }
  }

  console.log('\n');

  // Test 4: Invalid Login
  try {
    console.log('4️⃣  Testing INVALID LOGIN...');
    const invalidLoginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'WrongPassword123!'
      })
    });
    
    const invalidLoginData = await invalidLoginResponse.json();
    
    if (!invalidLoginResponse.ok) {
      console.log('   ✅ Invalid login correctly rejected');
      console.log('   ⚠️  Error message:', invalidLoginData.error);
    } else {
      console.log('   ❌ Invalid login should have failed!');
    }
  } catch (error) {
    console.log('   ❌ Invalid login error:', error.message);
  }

  console.log('\n');

  // Test 5: Forgot Password
  try {
    console.log('5️⃣  Testing FORGOT PASSWORD...');
    const forgotResponse = await fetch(`${BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail
      })
    });
    
    const forgotData = await forgotResponse.json();
    
    if (forgotResponse.ok) {
      console.log('   ✅ Forgot password request sent');
      console.log('   💬 Message:', forgotData.message);
    } else {
      console.log('   ❌ Forgot password failed:', forgotData.error);
    }
  } catch (error) {
    console.log('   ❌ Forgot password error:', error.message);
  }

  console.log('\n');

  // Test 6: Refresh Token
  if (token) {
    try {
      console.log('6️⃣  Testing REFRESH TOKEN...');
      const refreshResponse = await fetch(`${BASE_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });
      
      const refreshData = await refreshResponse.json();
      
      if (refreshResponse.ok) {
        console.log('   ✅ Token refreshed successfully');
        console.log('   🔑 New token:', refreshData.token.substring(0, 20) + '...');
      } else {
        console.log('   ❌ Token refresh failed:', refreshData.error);
      }
    } catch (error) {
      console.log('   ❌ Token refresh error:', error.message);
    }
  }

  console.log('\n');

  // Test 7: Logout
  if (token) {
    try {
      console.log('7️⃣  Testing LOGOUT...');
      const logoutResponse = await fetch(`${BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });
      
      const logoutData = await logoutResponse.json();
      
      if (logoutResponse.ok) {
        console.log('   ✅ Logout successful');
        console.log('   💬 Message:', logoutData.message);
      } else {
        console.log('   ❌ Logout failed:', logoutData.error);
      }
    } catch (error) {
      console.log('   ❌ Logout error:', error.message);
    }
  }

  console.log('\n✨ All tests completed!\n');
}

// Run the tests
testAuthRoutes().catch(console.error);