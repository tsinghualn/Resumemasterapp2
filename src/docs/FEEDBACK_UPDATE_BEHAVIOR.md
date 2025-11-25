# Feedback Update Behavior

## Overview

When users update their feedback for a section, the system now **UPDATES** the existing database row instead of creating a new one. This prevents duplicate entries and maintains data integrity.

## How It Works

### First Feedback Submission (INSERT)

1. User clicks 👎 on "Summary" section
2. Enters comment: "Summary wasn't parsed correctly"
3. System checks cache: No `dbId` found
4. **Action: INSERT new row** in database
5. Response includes new record `id`
6. Cache is updated with `dbId: {new-id}`

**Database result:**
```sql
-- One new row created
SELECT * FROM resume_feedback WHERE section_id = 'summary';
-- Returns 1 row
```

### Updating Existing Feedback (UPDATE)

1. User clicks 👎 on "Summary" section again
2. System loads previous feedback from cache
3. User modifies comment: "Updated: Summary wasn't parsed correctly"
4. System checks cache: `dbId` exists
5. **Action: UPDATE existing row** in database using `dbId`
6. Cache is updated with same `dbId`

**Database result:**
```sql
-- Same row updated, no new row created
SELECT * FROM resume_feedback WHERE section_id = 'summary';
-- Still returns 1 row (updated)
```

## Code Flow

### Backend Endpoints

**POST `/make-server-bc1c5df9/feedback`** - Create new feedback
- Inserts new row into `resume_feedback` table
- Returns the new record with `id`

**PUT `/make-server-bc1c5df9/feedback/:id`** - Update existing feedback
- Updates existing row by `id`
- Returns the updated record
- Returns 404 if record not found

### Frontend Logic

```typescript
// Check if feedback exists in cache
const cachedFeedback = getCachedFeedback(sectionId);
const existingDbId = cachedFeedback?.dbId;

if (existingDbId) {
  // UPDATE existing feedback
  response = await apiClient.updateFeedback(existingDbId, feedbackData);
} else {
  // CREATE new feedback
  response = await apiClient.submitFeedback(feedbackData);
}

// Cache with the db ID (new or existing)
cacheFeedback(sectionId, {
  ...feedbackData,
  dbId: existingDbId || response.data[0].id
});
```

## Cache Structure

```javascript
{
  "summary": {
    section_id: "summary",
    section_type: "summary",
    is_positive: false,
    comment: "Updated: Summary wasn't parsed correctly",
    parsed_content: { summary: "..." },
    session_id: "session-xyz",
    timestamp: 1732464100000,
    dbId: "550e8400-e29b-41d4-a716-446655440000"  // ← Key field!
  }
}
```

The `dbId` field is crucial:
- **Present** → System calls UPDATE endpoint
- **Absent** → System calls INSERT endpoint

## Console Logs

### Creating New Feedback:
```
📤 Creating new feedback in backend: { section_id: "summary", ... }
📥 Backend response: { success: true, data: [{ id: "uuid-123", ... }] }
✅ Feedback created successfully
```

### Updating Existing Feedback:
```
📝 Updating existing feedback in backend: uuid-123 { section_id: "summary", ... }
📥 Backend response: { success: true, data: [{ id: "uuid-123", ... }] }
✅ Feedback updated successfully
```

## Database Behavior

### Before (Incorrect - Creates Duplicates):
```sql
-- User submits feedback 3 times
SELECT * FROM resume_feedback WHERE section_id = 'summary';

-- Returns 3 rows (duplicates!) ❌
id                  | comment              | created_at
uuid-1              | Original feedback    | 2025-11-24 10:30:00
uuid-2              | Updated feedback     | 2025-11-24 10:31:00
uuid-3              | Updated again        | 2025-11-24 10:32:00
```

### After (Correct - Updates Same Row):
```sql
-- User submits feedback 3 times
SELECT * FROM resume_feedback WHERE section_id = 'summary';

-- Returns 1 row (updated) ✅
id                  | comment              | created_at
uuid-1              | Updated again        | 2025-11-24 10:30:00
```

## Benefits

1. **No Duplicates**: Each section has at most one feedback entry per session
2. **Data Integrity**: Historical record is maintained with updates
3. **Cleaner Data**: Database stays small and manageable
4. **Better Analytics**: Easy to count unique feedback entries
5. **User Intent**: Reflects that user is modifying their opinion, not adding new one

## Edge Cases

### User Changes Feedback Type (👎 to 👍)

1. User clicks 👎, submits "Issue with parsing"
2. Cache stores: `{ is_positive: false, comment: "...", dbId: "uuid-1" }`
3. User clicks 👍
4. System **updates** same row: `{ is_positive: true, comment: null }`
5. Result: Same row, now marked as positive

### Multiple Sections, Same User

Each section has its own cache entry and database row:

```javascript
// Cache
{
  "summary": { dbId: "uuid-1", ... },
  "experience-abc": { dbId: "uuid-2", ... },
  "education-xyz": { dbId: "uuid-3", ... }
}
```

```sql
-- Database
SELECT section_id, COUNT(*) FROM resume_feedback 
WHERE session_id = 'session-xyz' 
GROUP BY section_id;

-- Result: Each section has 1 row ✅
section_id       | count
summary          | 1
experience-abc   | 1
education-xyz    | 1
```

### Cache Cleared / Different Session

If user clears cache or uses different device:
- Cache is empty, no `dbId` available
- System creates **new** row (INSERT)
- This is expected behavior - different session = different feedback

## Testing

### Test Case 1: Create New Feedback
```javascript
// Clear cache first
const sid = localStorage.getItem('feedbackSessionId');
localStorage.removeItem(`feedbackCache_${sid}`);

// Submit feedback
// Expected: POST request, new row in database
```

### Test Case 2: Update Existing Feedback
```javascript
// Submit feedback once (creates cache with dbId)
// Submit feedback again on same section
// Expected: PUT request, same row updated in database
```

### Test Case 3: Verify No Duplicates
```sql
-- After updating feedback 3 times
SELECT section_id, COUNT(*) as count 
FROM resume_feedback 
WHERE session_id = 'your-session-id'
GROUP BY section_id
HAVING COUNT(*) > 1;

-- Expected: 0 rows (no duplicates)
```

## Troubleshooting

### Issue: Still creating duplicates

**Check:**
1. Is `dbId` being stored in cache?
   ```javascript
   const cache = localStorage.getItem(`feedbackCache_${sessionId}`);
   console.log(JSON.parse(cache));
   // Should have dbId field
   ```

2. Is UPDATE endpoint working?
   ```javascript
   // Check Network tab for PUT request
   // Should see: PUT /feedback/{uuid}
   ```

3. Is cache being used?
   ```javascript
   // Check console logs
   // Should see: "📝 Updating existing feedback"
   // NOT: "📤 Creating new feedback"
   ```

### Issue: UPDATE not working

**Error: "Feedback not found"**
- The `dbId` in cache doesn't match any database record
- Possible cause: Database was cleared but cache wasn't
- **Fix:** Clear cache and submit fresh feedback

**Error: "Failed to update feedback"**
- Check Supabase table permissions
- Verify UPDATE operations are allowed
- Check RLS (Row Level Security) policies

## API Reference

### POST /feedback (Create)
```typescript
POST /make-server-bc1c5df9/feedback
Body: {
  section_id: string,
  section_type: string,
  is_positive: boolean,
  comment?: string,
  parsed_content?: any,
  session_id?: string
}
Response: {
  success: true,
  message: "Feedback stored successfully",
  data: [{ id: "uuid", ... }]
}
```

### PUT /feedback/:id (Update)
```typescript
PUT /make-server-bc1c5df9/feedback/{feedbackId}
Body: {
  section_id: string,
  section_type: string,
  is_positive: boolean,
  comment?: string,
  parsed_content?: any,
  session_id?: string
}
Response: {
  success: true,
  message: "Feedback updated successfully",
  data: [{ id: "uuid", ... }]
}
```

## Summary

✅ **First submission** → INSERT new row  
✅ **Subsequent submissions** → UPDATE same row  
✅ **No duplicates** → One row per section per session  
✅ **Cache-driven** → `dbId` determines INSERT vs UPDATE  
✅ **Clean data** → Database stays organized and efficient
