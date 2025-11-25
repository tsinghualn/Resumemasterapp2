# Testing Feedback Storage

## How to Test

### 1. Open Browser Console (F12)

### 2. Test Thumbs Up Feedback

1. Upload a resume
2. Navigate to any section (e.g., Summary)
3. Click the 👍 button
4. Watch the console for:
   ```
   📤 Sending feedback to backend: { section_id: "summary", section_type: "summary", ... }
   📥 Backend response: { success: true, ... }
   ✅ Feedback sent to backend successfully
   ```

### 3. Test Thumbs Down Feedback

1. Navigate to any section
2. Click the 👎 button
3. Enter feedback (e.g., "Test feedback")
4. Click Submit
5. Watch the console for the same log messages

### 4. Check Database

Go to your Supabase Dashboard:
1. Navigate to **Table Editor**
2. Select `resume_feedback` table
3. You should see your feedback entries

### 5. Test Feedback Caching/Updating

1. Click 👎 on the same section again
2. You should see a toast: "Loading your previous feedback for this section"
3. The textarea should be pre-filled with your previous feedback
4. Dialog title should say "Update Your Feedback"
5. Modify the text and submit
6. You should see: "Your feedback has been updated!"

### 6. Check Cache

In browser console:
```javascript
// Check session ID
localStorage.getItem('feedbackSessionId')

// Check feedback cache
const sessionId = localStorage.getItem('feedbackSessionId');
localStorage.getItem(`feedbackCache_${sessionId}`)
```

## Common Issues & Solutions

### Issue: "Failed to save feedback to database"

**Possible causes:**
1. API endpoint not responding
2. Network error
3. Database table doesn't exist or has wrong schema

**Debug steps:**
1. Check Network tab in DevTools
2. Look for POST request to `/make-server-bc1c5df9/feedback`
3. Check the request payload and response
4. Verify the response status code

### Issue: No data in database table

**Check:**
1. Does the `resume_feedback` table exist?
2. Run this in SQL Editor:
   ```sql
   SELECT * FROM resume_feedback ORDER BY created_at DESC LIMIT 10;
   ```
3. Check table permissions (should allow INSERT)

### Issue: Console error "apiClient.submitFeedback is not a function"

**Solution:**
This means the API client method wasn't added. Verify `/utils/api.tsx` has:
```typescript
async submitFeedback(feedbackData: { ... }) {
  return this.request('/feedback', {
    method: 'POST',
    body: JSON.stringify(feedbackData),
  });
}
```

## Expected Console Logs

### Successful Feedback Submission:
```
📤 Sending feedback to backend: {
  section_id: "summary",
  section_type: "summary",
  is_positive: false,
  comment: "Test feedback",
  parsed_content: { summary: "..." },
  session_id: "session-1732464000000-xyz789"
}
📥 Backend response: {
  success: true,
  message: "Feedback stored successfully",
  data: [{ id: "uuid-here", ... }]
}
✅ Feedback sent to backend successfully
```

### Failed Submission:
```
📤 Sending feedback to backend: { ... }
❌ Error sending feedback to backend: Error: API request failed
```

## SQL Queries for Testing

```sql
-- Count all feedback
SELECT COUNT(*) FROM resume_feedback;

-- Get all negative feedback
SELECT * FROM resume_feedback 
WHERE is_positive = false 
ORDER BY created_at DESC;

-- Count feedback by section type
SELECT section_type, COUNT(*) as count
FROM resume_feedback
GROUP BY section_type;

-- Get feedback for a specific session
SELECT * FROM resume_feedback 
WHERE session_id = 'your-session-id-here'
ORDER BY created_at DESC;
```
