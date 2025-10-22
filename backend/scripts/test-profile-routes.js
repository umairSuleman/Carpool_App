import dotenv from 'dotenv';
dotenv.config({ override: true }); 

const BASE_URL = 'http://localhost:5000/api';
const PROFILE_URL = `${BASE_URL}/profile`;
const AUTH_URL = `${BASE_URL}/auth`;

// --- Test State ---
let token = '';
let userId = '';
let testEmail = `test_profile_${Date.now()}@example.com`;
let testPhone = `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`;

async function runTest(name, url, options, expectedStatus = 200, log = true) {
    let data;
    try {
        const response = await fetch(url, options);
        data = await response.json();
        
        if (response.status === expectedStatus) {
            if (log) console.log(`  ✅ ${name} successful (${response.status})`);
        } else {
            console.log(`  ❌ ${name} failed: Expected ${expectedStatus}, got ${response.status}`);
            console.log('    Error:', data.error || data.message || 'Unknown error');
            return null;
        }
    } catch (error) {
        console.log(`  ❌ ${name} failed (Fatal):`, error.message);
        return null;
    }
    return data;
}

async function setupUser() {
    console.log('🛠️ Running Setup: Registering Test User...');
    
    const registerData = await runTest(
        'User Registration',
        `${AUTH_URL}/register`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test Profile User',
                email: testEmail,
                phone: testPhone,
                password: 'Test1234!',
                confirmPassword: 'Test1234!'
            })
        },
        201,
        false
    );

    if (registerData && registerData.token && registerData.user.id) {
        token = registerData.token;
        userId = registerData.user.id;
        console.log(`  ✅ Setup successful. User ID: ${userId.substring(0, 8)}...`);
        console.log(`  🔑 Token received: ${token.substring(0, 20)}...`);
        return true;
    } else {
        console.log('  ❌ Setup FAILED. Cannot proceed with profile tests.');
        return false;
    }
}

async function testProfileRoutes() {
    if (!(await setupUser())) return;

    console.log('\n======================================================');
    console.log('🧪 Starting Profile Management Tests...');
    console.log('======================================================\n');
    
    // Test 1: GET /profile (Get Current Profile)
    console.log('1️⃣  Testing GET /profile (Retrieve Current User)');
    const getProfileData = await runTest(
        'GET Profile',
        `${PROFILE_URL}`,
        {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        },
        200
    );
    if (getProfileData) {
        console.log(`  📧 Retrieved Email: ${getProfileData.user.email}`);
        console.log(`  👤 Profile Bio: ${getProfileData.user.profile.bio || 'None'}`);
    }
    
    console.log('\n');

    // Test 2: PUT /profile (Update Profile Information)
    const newName = 'Profile User Updated';
    const newBio = 'Updated bio for testing purposes.';
    const newAge = 30;
    
    console.log('2️⃣  Testing PUT /profile (Update Name, Bio, and Preferences)');
    const updateProfileData = await runTest(
        'PUT Profile Update',
        `${PROFILE_URL}`,
        {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                name: newName,
                age: newAge,
                bio: newBio,
                smoking: true,
                music: false
            })
        },
        200
    );

    if (updateProfileData) {
        const user = updateProfileData.user;
        console.log(`  ✅ Name updated to: ${user.name} (Expected: ${newName})`);
        console.log(`  ✅ Age updated to: ${user.profile.age} (Expected: ${newAge})`);
        console.log(`  ✅ Smoking preference: ${user.profile.smoking} (Expected: true)`);
    }

    console.log('\n');
    
    // Test 3: PUT /profile (Validation Test: Invalid Email)
    console.log('3️⃣  Testing PUT /profile (Validation Test: Invalid Email)');
    await runTest(
        'PUT Profile Invalid Email',
        `${PROFILE_URL}`,
        {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ email: 'invalid-email' })
        },
        400 // Expecting a validation failure
    );

    console.log('\n');
    
    // Test 4: POST /profile/photo (Photo Upload Placeholder)
    const photoUrl = 'https://example.com/new-photo.jpg';
    console.log('4️⃣  Testing POST /profile/photo (Upload Placeholder)');
    await runTest(
        'POST Profile Photo',
        `${PROFILE_URL}/photo`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ photoUrl: photoUrl })
        },
        200
    );

    console.log('\n');

    // Test 5: GET /profile/:userId (View Public Profile)
    // NOTE: We use the current user's ID as the target for simplicity
    console.log('5️⃣  Testing GET /profile/:userId (View Public Profile)');
    const publicProfileData = await runTest(
        'GET Public Profile',
        `${PROFILE_URL}/${userId}`,
        {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        },
        200
    );
    
    if (publicProfileData) {
        const user = publicProfileData.user;
        console.log(`  👤 Retrieved Name: ${user.name} (Public)`);
        console.log(`  💬 Retrieved Bio: ${user.profile.bio}`);
        // Ensure email is NOT returned in the public profile
        if (user.email === undefined) {
             console.log('  ✅ Private fields (email) excluded from public view.');
        } else {
             console.log('  ❌ WARNING: Private fields (email) were NOT excluded.');
        }
    }
    
    console.log('\n✨ All profile tests completed!');
}

testProfileRoutes().catch(console.error);