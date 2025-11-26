// Paste this in browser console (F12) on http://localhost:3000
// This will properly test the API with authentication

(async function testAdminAPI() {
  console.log('=== ADMIN API TEST ===\n');
  
  // Step 1: Check if you're logged in
  console.log('Step 1: Checking if logged in...');
  try {
    // Try to get session from Supabase
    const { createClient } = await import('./src/utils/supabase/client.tsx');
    const supabase = createClient();
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (!session) {
      console.log('❌ NOT LOGGED IN');
      console.log('Please sign in first, then run this script again.');
      return;
    }
    
    console.log('✅ Logged in as:', session.user.email);
    console.log('Access token:', session.access_token.substring(0, 20) + '...');
    
    // Step 2: Test the API endpoint with proper auth
    console.log('\nStep 2: Testing /auth/me endpoint...');
    const response = await fetch('/make-server-bc1c5df9/auth/me', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    const data = await response.json();
    
    console.log('\n=== API RESPONSE ===');
    console.log(JSON.stringify(data, null, 2));
    
    // Step 3: Check for role
    console.log('\n=== ROLE CHECK ===');
    if (data.role) {
      console.log('✅ Role field exists:', data.role);
      if (data.role === 'admin') {
        console.log('🎉 SUCCESS! You are an admin!');
      } else {
        console.log('⚠️ Role is "' + data.role + '" (not admin)');
        console.log('Run this in Supabase SQL:');
        console.log("UPDATE users SET role = 'admin' WHERE email = '" + session.user.email + "';");
      }
    } else {
      console.log('❌ No role field in response');
      console.log('Backend is not returning database role.');
      console.log('Check if backend server is running and updated.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Full error:', error.message);
  }
})();


