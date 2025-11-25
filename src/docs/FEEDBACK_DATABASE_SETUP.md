# Feedback Database Setup Guide

## Overview

This guide shows you how the feedback system stores data in Supabase's `resume_feedback` table instead of just localStorage.

## What Was Implemented

### 1. Database Table Structure

```sql
CREATE TABLE resume_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id VARCHAR(255) NOT NULL,
  section_type VARCHAR(50) NOT NULL,
  is_positive BOOLEAN NOT NULL,
  comment TEXT,
  parsed_content JSONB,
  original_text TEXT,
  user_id UUID,
  session_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Backend API Endpoint

**Endpoint:** `POST /make-server-bc1c5df9/feedback`

**Location:** `/supabase/functions/server/index.tsx` (lines ~2108+)

**What it does:**
- Receives feedback data from frontend
- Validates required fields (section_id, section_type, is_positive)
- Checks if user is authenticated (optional)
- Inserts feedback into `resume_feedback` table
- Returns success/error response

### 3. Frontend Integration

**Location:** `/components/AIRewritePanel.tsx`

**New function added:** `sendFeedbackToBackend()`
- Extracts section type from section_id
- Gets parsed content for the section
- Creates/retrieves session ID
- Sends data to backend API
- Falls back to localStorage on error

**Updated functions:**
- `handleThumbsUp()` - Now sends to backend + localStorage
- `submitFeedback()` - Now sends to backend + localStorage

## Data Flow

```
User clicks 👍/👎
       ↓
handleThumbsUp() or submitFeedback()
       ↓
sendFeedbackToBackend()
       ↓
POST /make-server-bc1c5df9/feedback
       ↓
Supabase resume_feedback table
       ↓
Response back to frontend
       ↓
Also saved to localStorage as backup
```

## Example Data Stored

### Positive Feedback (Thumbs Up)
```json
{
  "section_id": "summary",
  "section_type": "summary",
  "is_positive": true,
  "comment": null,
  "parsed_content": {
    "summary": "Experienced software engineer..."
  },
  "session_id": "session-1732464000000-xyz789",
  "user_id": null,
  "created_at": "2025-11-24T10:30:00Z"
}
```

### Negative Feedback (Thumbs Down)
```json
{
  "section_id": "experience-abc123",
  "section_type": "experience",
  "is_positive": false,
  "comment": "Job title was parsed incorrectly",
  "parsed_content": {
    "id": "abc123",
    "title": "Engineer Senior",
    "company": "Tech Corp",
    "dates": "2020-2023",
    "description": "..."
  },
  "session_id": "session-1732464000000-xyz789",
  "user_id": null,
  "created_at": "2025-11-24T10:31:00Z"
}
```

## How to Test

### 1. Submit Feedback
1. Upload a resume
2. Navigate to any section
3. Click 👍 or 👎
4. For negative feedback, enter a comment

### 2. Verify in Console
Open browser console (F12) and look for:
```
✅ Feedback sent to backend successfully
```

### 3. Check Database
1. Go to Supabase Dashboard
2. Navigate to **Table Editor** → `resume_feedback`
3. You should see your feedback entries

### 4. Verify localStorage Backup
In browser console:
```javascript
JSON.parse(localStorage.getItem('aiParsingFeedback'))
```

## Session Tracking

The system automatically creates a unique session ID for each user:
- Stored in `localStorage.getItem('feedbackSessionId')`
- Format: `session-{timestamp}-{random}`
- All feedback from the same session shares this ID
- Allows tracking feedback patterns without user identification

## Benefits of Database Storage

1. **Centralized Data**: All user feedback in one place
2. **Analytics**: Query patterns across all users
3. **Debugging**: Access to parsed_content helps identify issues
4. **User Tracking**: Optional user_id for authenticated users
5. **Session Tracking**: Group feedback by anonymous sessions
6. **Reliability**: localStorage as backup if backend fails
7. **Scalability**: Can handle large volumes of feedback

## Querying Examples

```typescript
// Get all negative feedback
const { data } = await supabase
  .from('resume_feedback')
  .select('*')
  .eq('is_positive', false);

// Get feedback for experience sections
const { data } = await supabase
  .from('resume_feedback')
  .select('*')
  .eq('section_type', 'experience');

// Get feedback with comments
const { data } = await supabase
  .from('resume_feedback')
  .select('*')
  .not('comment', 'is', null);

// Count positive vs negative
const { data } = await supabase
  .from('resume_feedback')
  .select('is_positive')
  .eq('is_positive', true);
```

## Future Enhancements

- Admin dashboard to view all feedback
- Automated analysis of common issues
- Email alerts for critical feedback
- Feedback trends over time
- A/B testing of prompt improvements
- Machine learning categorization

## Documentation

For complete details, see:
- `/docs/FEEDBACK_SYSTEM.md` - Full system documentation
- `/components/AIRewritePanel.tsx` - Frontend implementation
- `/supabase/functions/server/index.tsx` - Backend endpoint

## Support

If feedback is not being stored:
1. Check browser console for errors
2. Verify network tab shows POST to `/feedback`
3. Check Supabase table permissions
4. Verify the table exists with correct column names
5. Check server logs for error messages
