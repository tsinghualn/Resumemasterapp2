# Feedback Logic Clarification

## Overview
This document clarifies how positive and negative feedback is determined throughout the application.

## Database Schema

The `resume_feedback` table uses a boolean column to store feedback type:

- **Positive feedback**: `is_positive = true`
- **Negative feedback**: `is_positive = false`

## Implementation Details

### 1. Database Operations (Server-Side)

All database operations correctly use the `is_positive` boolean column:

**Fetching negative feedback:**
```typescript
const { data: rawFeedback } = await supabase
  .from('resume_feedback')
  .select('*')
  .eq('is_positive', false)  // ✅ Correct: false = negative
```

**Filtering feedback:**
```typescript
const negativeFeedback = feedbackData.filter((f: any) => !f.is_positive);  // ✅ Correct
const positiveFeedback = feedbackData.filter((f: any) => f.is_positive);   // ✅ Correct
```

**Counting feedback:**
```typescript
const positive = feedbackData.filter(f => f.is_positive).length;  // ✅ Correct
const negative = feedbackData.filter(f => !f.is_positive).length; // ✅ Correct
```

### 2. Frontend (Client-Side)

#### Data Structure

The `ParseFeedback` interface in `/utils/feedbackAnalyzer.ts` now matches the database schema:

```typescript
export interface ParseFeedback {
  section: string;
  is_positive: boolean;  // ✅ Updated to match database
  comment?: string;      // ✅ Updated from 'reason' to match database
  timestamp: number;
}
```

#### Usage in Components

**Filtering:**
```typescript
// Get negative feedback
const negativeFeedback = allFeedback.filter(f => !f.is_positive);

// Get positive feedback  
const positiveFeedback = allFeedback.filter(f => f.is_positive);
```

**Display:**
```tsx
<div className={item.is_positive ? 'bg-green-50' : 'bg-red-50'}>
  {item.is_positive ? 'positive' : 'negative'}
</div>
```

### 3. API Endpoints

**Submit Feedback** (`POST /make-server-bc1c5df9/feedback`):
```json
{
  "section_id": "experience-abc123",
  "section_type": "experience",
  "is_positive": false,  // ✅ false = negative, true = positive
  "comment": "Job title was parsed incorrectly"
}
```

**Update Feedback** (`PATCH /make-server-bc1c5df9/feedback/:id`):
```json
{
  "section_id": "experience-abc123",
  "section_type": "experience",
  "is_positive": true,  // ✅ true = positive, false = negative
  "comment": null
}
```

### 4. Feedback Analysis

The daily feedback analysis cron job (`/supabase/functions/server/index.tsx`) correctly processes feedback:

```typescript
// Line 3131-3132: Filter by is_positive
const negativeFeedback = feedbackData.filter((f: any) => !f.is_positive);
const positiveFeedback = feedbackData.filter((f: any) => f.is_positive);

// Extract comments from negative feedback
const negativeComments = negativeFeedback
  .map((f: any) => f.comment)
  .filter((comment: string | null) => comment && comment.trim().length > 0);

// Extract comments from positive feedback
const positiveComments = positiveFeedback
  .map((f: any) => f.comment)
  .filter((comment: string | null) => comment && comment.trim().length > 0);
```

## Summary

✅ **Consistent Logic Across Application:**
- `is_positive = true` → Positive feedback (thumbs up)
- `is_positive = false` → Negative feedback (thumbs down)

✅ **All components updated to use:**
- Boolean `is_positive` field (not `type: 'positive' | 'negative'`)
- `comment` field (not `reason`)

✅ **Database, server, frontend, and cron jobs all use consistent logic**

## Files Updated

1. `/utils/feedbackAnalyzer.ts` - Interface updated to use `is_positive` and `comment`
2. `/components/FeedbackViewer.tsx` - Display logic updated to use `is_positive`
3. `/supabase/functions/server/index.tsx` - Already correctly using `is_positive`
4. `/supabase/functions/analyze-feedback/index.ts` - Already correctly using `is_positive`

## Migration Note

Any existing localStorage feedback data using the old `type: 'positive' | 'negative'` format will need to be migrated or cleared. New feedback submissions will use the correct `is_positive: boolean` format.
