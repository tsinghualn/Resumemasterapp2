# 🚀 Quick Test Guide - 2 Minute Verification

## Step 1: Submit Initial Feedback (30 seconds)

1. Upload a resume
2. Navigate to Summary section
3. Click 👎 (thumbs down)
4. Enter: "Test feedback"
5. Click Submit
6. ✅ **Expect:** Toast says "Thank you for helping us improve!"

## Step 2: Check Console (10 seconds)

Press F12 → Console tab

✅ **Look for:**
```
📤 Sending feedback to backend: {...}
📥 Backend response: {success: true, ...}
✅ Feedback sent to backend successfully
```

❌ **If you see errors:** Copy them and share

## Step 3: Test Update Feature (30 seconds)

1. Click 👎 on Summary section AGAIN
2. ✅ **Expect:** 
   - Toast: "Loading your previous feedback for this section"
   - Dialog title: "Update Your Feedback"
   - Textarea pre-filled with "Test feedback"
3. Change text to: "Updated test feedback"
4. Click Submit
5. ✅ **Expect:** Toast says "Your feedback has been updated!"

## Step 4: Verify Database (30 seconds)

Go to Supabase Dashboard:
1. Click **Table Editor**
2. Select `resume_feedback` table
3. ✅ **Expect:** See 2 rows for "summary" section

If table is empty → Continue to Step 5

## Step 5: Debug (30 seconds)

### Check #1: Session ID
Console (F12):
```javascript
localStorage.getItem('feedbackSessionId')
```
✅ Should return: `"session-1732464000000-abc123"` (or similar)
❌ If null → Submit feedback to create session

### Check #2: Network Request
1. DevTools → Network tab
2. Filter: "feedback"
3. Find POST request
4. Check Status: Should be 200
5. Check Response: Should have `"success": true`

❌ **If Status is 404:** Backend endpoint not found
❌ **If Status is 500:** Server error - check backend logs
❌ **If no request:** API call not being made

### Check #3: Cache
Console (F12):
```javascript
const sid = localStorage.getItem('feedbackSessionId');
localStorage.getItem(`feedbackCache_${sid}`)
```
✅ Should return: JSON with your feedback
❌ If null → Feedback not being cached

## Common Problems & Quick Fixes

### Problem: No console logs
**Fix:** Make sure you're on the resume editing screen (AIRewritePanel)

### Problem: "Failed to save feedback"
**Fix:** 
1. Check Supabase Dashboard is accessible
2. Verify `resume_feedback` table exists
3. Check table has INSERT permissions for anon users

### Problem: Previous feedback not loading
**Fix:**
1. Make sure you clicked 👎 (not 👍) previously
2. Check cache exists (Step 5, Check #3)
3. Clear cache and try again

### Problem: Nothing in database
**Fix:**
1. Run in SQL Editor: `SELECT * FROM resume_feedback;`
2. If error → Table doesn't exist or wrong schema
3. If empty → Check Network tab for successful POST

## Success Indicators ✅

You'll know it's working when you see ALL of these:

### In Console:
- ✅ `📤 Sending feedback to backend`
- ✅ `📥 Backend response: {success: true}`
- ✅ `✅ Feedback sent to backend successfully`

### In UI:
- ✅ Toast notifications appear
- ✅ Dialog title changes on update
- ✅ Textarea pre-fills with previous feedback

### In Database:
- ✅ New rows appear in `resume_feedback` table
- ✅ `session_id` is consistent across rows
- ✅ `parsed_content` contains JSON data

### In Network Tab:
- ✅ POST to `/make-server-bc1c5df9/feedback`
- ✅ Status: 200 OK
- ✅ Response: `{"success": true, ...}`

## Still Not Working?

### Run Debug Script

1. Copy content from `/docs/DEBUG_FEEDBACK.js`
2. Paste in console (F12)
3. Review output
4. Share any ❌ marked items

### Share These Details

If you need help, share:
1. Console error messages (red text)
2. Network request/response (Network tab → feedback request)
3. SQL query result: `SELECT COUNT(*) FROM resume_feedback;`
4. Output from debug script

---

⏱️ **Total time: ~2 minutes**

✅ If all checks pass → System is working perfectly!
❌ If any checks fail → Follow the fixes above or share the error details
