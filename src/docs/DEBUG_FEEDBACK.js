/**
 * Feedback System Debugging Script
 * 
 * Paste this into your browser console to debug feedback storage issues
 */

console.log('🔍 Starting Feedback System Diagnostics...\n');

// 1. Check Session ID
const sessionId = localStorage.getItem('feedbackSessionId');
console.log('1️⃣ Session ID:', sessionId || '❌ NOT FOUND');

// 2. Check Feedback Cache
if (sessionId) {
  const cacheKey = `feedbackCache_${sessionId}`;
  const cache = localStorage.getItem(cacheKey);
  
  if (cache) {
    console.log('2️⃣ Feedback Cache:', JSON.parse(cache));
    console.log('   Sections with feedback:', Object.keys(JSON.parse(cache)));
  } else {
    console.log('2️⃣ Feedback Cache: ❌ EMPTY');
  }
} else {
  console.log('2️⃣ Feedback Cache: ⏭️ Skipped (no session ID)');
}

// 3. Check localStorage backup
const backupFeedback = localStorage.getItem('aiParsingFeedback');
if (backupFeedback) {
  const parsed = JSON.parse(backupFeedback);
  console.log('3️⃣ localStorage Backup:', parsed.length, 'entries');
  console.log('   Latest 3 entries:', parsed.slice(-3));
} else {
  console.log('3️⃣ localStorage Backup: ❌ EMPTY');
}

// 4. Check API Configuration
console.log('\n4️⃣ API Configuration Check:');
try {
  const projectId = localStorage.getItem('sb-project-id') || 'Check /utils/supabase/info.tsx';
  console.log('   Supabase Project ID:', projectId);
  console.log('   Expected API URL:', `https://${projectId}.supabase.co/functions/v1/make-server-bc1c5df9/feedback`);
} catch (e) {
  console.log('   ⚠️ Could not determine API URL');
}

// 5. Test Feedback Submission (simulation)
console.log('\n5️⃣ To test feedback submission, run this in console after loading the app:');
console.log(`
// Test API client
if (typeof apiClient !== 'undefined') {
  apiClient.submitFeedback({
    section_id: 'test-section',
    section_type: 'test',
    is_positive: false,
    comment: 'Test feedback from console',
    session_id: '${sessionId || 'test-session-id'}'
  }).then(response => {
    console.log('✅ Test feedback response:', response);
  }).catch(error => {
    console.error('❌ Test feedback error:', error);
  });
} else {
  console.log('❌ apiClient not found. Make sure you\\'re on the resume editing page.');
}
`);

// 6. Helpful SQL queries
console.log('\n6️⃣ Run these SQL queries in Supabase SQL Editor:');
console.log(`
-- Check if table exists
SELECT * FROM resume_feedback LIMIT 5;

-- Count all feedback
SELECT COUNT(*) as total FROM resume_feedback;

-- Get feedback for your session
SELECT * FROM resume_feedback 
WHERE session_id = '${sessionId}'
ORDER BY created_at DESC;

-- Check recent feedback
SELECT 
  section_id, 
  section_type, 
  is_positive, 
  LEFT(comment, 50) as comment_preview,
  created_at 
FROM resume_feedback 
ORDER BY created_at DESC 
LIMIT 10;
`);

// 7. Environment Check
console.log('\n7️⃣ Environment Variables Check:');
console.log('   Run this in your server logs or Supabase Functions dashboard:');
console.log('   - SUPABASE_URL: Should be set');
console.log('   - SUPABASE_SERVICE_ROLE_KEY: Should be set');
console.log('   - Check: https://supabase.com/dashboard → Settings → API');

console.log('\n✅ Diagnostics complete! Check the results above.\n');
console.log('💡 Next steps:');
console.log('   1. If session ID is missing → Try submitting feedback (creates session)');
console.log('   2. If cache is empty → Submit feedback to populate it');
console.log('   3. If no data in database → Check server logs and SQL queries above');
console.log('   4. If API errors → Check Network tab in DevTools');
