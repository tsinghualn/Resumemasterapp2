# Test: Update Behavior (No Duplicates)

## Quick 3-Minute Test

### Step 1: Submit Initial Feedback (30 sec)
1. Upload a resume
2. Navigate to **Summary** section
3. Click 👎 (thumbs down)
4. Enter: **"Test feedback 1"**
5. Click Submit

**Check Console:**
```
📤 Creating new feedback in backend: {...}
✅ Feedback created successfully
```

**Check Database:**
```sql
SELECT * FROM resume_feedback WHERE section_id = 'summary';
-- Expected: 1 row
```

### Step 2: Update Feedback First Time (30 sec)
1. Click 👎 on **Summary** again
2. Textarea should pre-fill with: **"Test feedback 1"**
3. Change to: **"Test feedback 2 - Updated"**
4. Click Submit

**Check Console:**
```
📝 Updating existing feedback in backend: {uuid} {...}
✅ Feedback updated successfully
```

**Check Database:**
```sql
SELECT * FROM resume_feedback WHERE section_id = 'summary';
-- Expected: STILL 1 row (not 2!)
-- Comment should be: "Test feedback 2 - Updated"
```

### Step 3: Update Feedback Second Time (30 sec)
1. Click 👎 on **Summary** again
2. Textarea should pre-fill with: **"Test feedback 2 - Updated"**
3. Change to: **"Test feedback 3 - Final"**
4. Click Submit

**Check Console:**
```
📝 Updating existing feedback in backend: {uuid} {...}
✅ Feedback updated successfully
```

**Check Database:**
```sql
SELECT * FROM resume_feedback WHERE section_id = 'summary';
-- Expected: STILL 1 row (not 3!)
-- Comment should be: "Test feedback 3 - Final"
```

### Step 4: Verify No Duplicates (30 sec)

**Count rows for this section:**
```sql
SELECT COUNT(*) as total 
FROM resume_feedback 
WHERE section_id = 'summary';
```
✅ **Expected: 1** (NOT 3!)

**Check all feedback for your session:**
```sql
SELECT section_id, comment, created_at
FROM resume_feedback 
WHERE session_id = 'your-session-id'
ORDER BY created_at DESC;
```
✅ **Expected: 1 row for summary** with latest comment

**Verify same UUID used:**
```javascript
const sid = localStorage.getItem('feedbackSessionId');
const cache = JSON.parse(localStorage.getItem(`feedbackCache_${sid}`) || '{}');
console.log('Summary feedback ID:', cache.summary.dbId);
// This UUID should match the database row
```

### Step 5: Test Multiple Sections (60 sec)

1. Navigate to **Skills** section
2. Click 👎, enter: **"Skills issue"**, submit
3. Navigate to **Experience** section
4. Click 👎, enter: **"Experience issue"**, submit

**Check Database:**
```sql
SELECT section_id, comment 
FROM resume_feedback 
WHERE session_id = 'your-session-id';
```

✅ **Expected Results:**
```
section_id  | comment
summary     | Test feedback 3 - Final
skills      | Skills issue
experience  | Experience issue
```

✅ **Total: 3 rows (one per section, no duplicates)**

## What You Should See

### ✅ Success Indicators

**Console Logs:**
- First submission: `📤 Creating new feedback`
- Later submissions: `📝 Updating existing feedback`
- Always: Same UUID in update logs

**Database:**
- Each section has **exactly 1 row**
- Comments show latest update
- `created_at` timestamp from first submission
- Same `id` (UUID) across all updates

**Cache:**
```javascript
{
  "summary": {
    dbId: "550e8400-...",  // ← Same ID
    comment: "Test feedback 3 - Final",
    timestamp: 1732464200000
  },
  "skills": {
    dbId: "660e8400-...",  // ← Different ID
    comment: "Skills issue",
    timestamp: 1732464300000
  }
}
```

### ❌ Failure Indicators

**Problem: Still creating duplicates**

If you see multiple rows:
```sql
SELECT section_id, COUNT(*) 
FROM resume_feedback 
GROUP BY section_id 
HAVING COUNT(*) > 1;

-- If this returns any rows → duplicates exist!
```

**Fixes:**
1. Check console logs - are you seeing `📝 Updating` or `📤 Creating`?
2. Verify cache has `dbId` field
3. Check Network tab - should see PUT requests (not POST)
4. Clear cache and retry:
   ```javascript
   const sid = localStorage.getItem('feedbackSessionId');
   localStorage.removeItem(`feedbackCache_${sid}`);
   ```

**Problem: Update says "not found"**

This means `dbId` in cache doesn't match database:
```javascript
// Check cache
const cache = JSON.parse(localStorage.getItem(`feedbackCache_${sid}`) || '{}');
console.log('Cached dbId:', cache.summary?.dbId);

// Check database
SELECT id FROM resume_feedback WHERE section_id = 'summary';
// Should match cached dbId
```

**Fix:** Clear cache and resubmit fresh feedback

## Advanced Testing

### Test Scenario: Change Feedback Type

1. Submit 👎 with comment: "Issue"
2. Then submit 👍 (positive)
3. Check database:
   ```sql
   SELECT is_positive, comment FROM resume_feedback 
   WHERE section_id = 'summary';
   ```
   ✅ **Expected:** `is_positive = true, comment = null` (same row, updated)

### Test Scenario: Multiple Experience Entries

1. Submit feedback on Experience Entry #1
2. Submit feedback on Experience Entry #2
3. Update feedback on Entry #1
4. Check database:
   ```sql
   SELECT section_id, comment FROM resume_feedback 
   WHERE section_type = 'experience';
   ```
   ✅ **Expected:** 2 rows (one per entry, no duplicates)

## SQL Verification Queries

### Count total feedback entries
```sql
SELECT COUNT(*) FROM resume_feedback;
```

### Count by section (should all be 1)
```sql
SELECT section_id, COUNT(*) as count
FROM resume_feedback
GROUP BY section_id;
```

### Check for duplicates (should be empty)
```sql
SELECT section_id, COUNT(*) as duplicates
FROM resume_feedback
GROUP BY section_id
HAVING COUNT(*) > 1;
```

### View all feedback with timestamps
```sql
SELECT 
  section_id,
  is_positive,
  LEFT(comment, 30) as comment_preview,
  created_at,
  id
FROM resume_feedback
ORDER BY created_at DESC;
```

## Expected Results Summary

After 3 feedback submissions on Summary section:

| Metric | Expected | Actual |
|--------|----------|--------|
| Database rows for 'summary' | 1 | ✅ Check |
| Console shows "Updating" (2nd/3rd time) | Yes | ✅ Check |
| Same UUID in all updates | Yes | ✅ Check |
| Latest comment in database | "Test feedback 3 - Final" | ✅ Check |
| Network tab shows PUT (2nd/3rd time) | Yes | ✅ Check |

✅ **If all checks pass → Update behavior working correctly!**  
❌ **If any fail → See troubleshooting section above**

## Quick Debug Commands

```javascript
// Get session ID
const sid = localStorage.getItem('feedbackSessionId');

// Get cache
const cache = JSON.parse(localStorage.getItem(`feedbackCache_${sid}`) || '{}');

// Check specific section
console.log('Summary feedback:', cache.summary);
console.log('Has dbId?', !!cache.summary?.dbId);

// Check all sections
Object.keys(cache).forEach(section => {
  console.log(`${section}: dbId = ${cache[section].dbId}`);
});
```

## Success Checklist

- [ ] First submission creates new row (INSERT)
- [ ] Second submission updates same row (UPDATE)
- [ ] Third submission still updates same row
- [ ] Console shows "Creating" then "Updating"
- [ ] Database has exactly 1 row per section
- [ ] Cache has `dbId` for each section
- [ ] Network tab shows POST then PUT requests
- [ ] Latest comment appears in database
- [ ] No duplicate rows in database
- [ ] Each section has unique `dbId`

✅ **All checked? Perfect! Update behavior is working correctly!**
