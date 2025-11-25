# AI Resume Parsing Feedback System

## Overview

This feedback system allows users to rate the accuracy of AI-powered resume parsing and provides a mechanism for continuous improvement based on user feedback.

## Architecture

The feedback system consists of:
- **Frontend**: Thumbs up/down buttons on each resume section
- **Backend API**: `/make-server-bc1c5df9/feedback` endpoint
- **Database**: `resume_feedback` table in Supabase
- **Fallback Storage**: localStorage for offline or backup storage

## User Flow

### 1. Resume Parsing
When a user uploads their resume, the AI parsing engine extracts information into structured sections:
- Personal Details
- Contact Information
- Professional Summary
- Employment History (with individual entries)
- Education (with individual entries)
- Skills
- Projects
- Certifications
- Awards
- Custom Sections

### 2. Feedback Collection

Each section has feedback buttons at the bottom with the prompt:
```
Help us improve AI. Parsed correctly?
[👍] [👎]
```

For sections with multiple items (Employment History and Education), each individual entry has its own feedback buttons.

**Thumbs Up (👍)**
- Indicates the parsing was accurate
- Stored as positive feedback in Supabase
- Confirms current parsing logic is working well
- No additional input required

**Thumbs Down (👎)**
- Indicates there was an issue with parsing
- Opens a dialog asking for details:
  ```
  Please tell us what went wrong with the parsing
  so we can improve it.
  
  [Text area for feedback]
  
  E.g., "The email was parsed incorrectly" or
  "Experience dates are wrong"
  ```
- Stores the reason along with the feedback

### 3. Feedback Storage

Feedback is stored in the Supabase `resume_feedback` table with this structure:

```sql
CREATE TABLE resume_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id VARCHAR(255) NOT NULL,        -- e.g., "summary", "experience-123"
  section_type VARCHAR(50) NOT NULL,       -- e.g., "summary", "experience"
  is_positive BOOLEAN NOT NULL,
  comment TEXT,                            -- User's feedback comment
  parsed_content JSONB,                    -- The actual parsed data
  original_text TEXT,                      -- Original text (optional)
  user_id UUID,                            -- If user is authenticated
  session_id VARCHAR(255),                 -- Anonymous session tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Example stored data:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "section_id": "experience-abc123",
  "section_type": "experience",
  "is_positive": false,
  "comment": "Job title was parsed incorrectly",
  "parsed_content": {
    "title": "Engineer Senior",
    "company": "Tech Corp",
    "dates": "2020-2023"
  },
  "user_id": null,
  "session_id": "session-1700000000000-xyz789",
  "created_at": "2025-11-24T10:30:00Z"
}
```

**Fallback Storage:**
Feedback is also stored in browser localStorage as a backup:
```javascript
localStorage.getItem('aiParsingFeedback')
```

## For Developers

### Files

**Frontend:**
- `/components/AIRewritePanel.tsx` - Main component with feedback UI and backend integration
- `/utils/feedbackAnalyzer.ts` - Feedback analysis utilities
- `/components/FeedbackViewer.tsx` - Admin view for feedback inspection
- `/utils/api.tsx` - API client with parseResumeWithAI method

**Backend:**
- `/supabase/functions/server/index.tsx` - Server with `/feedback` endpoint and parsing endpoint
- Database table: `resume_feedback` in Supabase

### Backend API Endpoint

**POST `/make-server-bc1c5df9/feedback`**

Stores user feedback about AI parsing accuracy in the database.

**Request Body:**
```json
{
  "section_id": "experience-abc123",      // Required: Unique section identifier
  "section_type": "experience",           // Required: Base section type
  "is_positive": false,                   // Required: true for thumbs up, false for thumbs down
  "comment": "Job title parsed wrong",    // Optional: User's feedback text
  "parsed_content": { ... },              // Optional: The actual parsed data for context
  "original_text": "...",                 // Optional: Original resume text
  "session_id": "session-xyz"             // Optional: Anonymous session identifier
}
```

**Response:**
```json
{
  "success": true,
  "message": "Feedback stored successfully",
  "data": { ... }
}
```

**Features:**
- Automatically detects authenticated users and stores `user_id`
- Accepts anonymous feedback via `session_id`
- Stores complete parsed content for debugging
- Returns detailed error messages on failure

### Querying Feedback from Database

To query feedback data from Supabase:

```typescript
// Get all feedback
const { data, error } = await supabase
  .from('resume_feedback')
  .select('*')
  .order('created_at', { ascending: false });

// Get feedback by section type
const { data, error } = await supabase
  .from('resume_feedback')
  .select('*')
  .eq('section_type', 'experience');

// Get negative feedback only
const { data, error } = await supabase
  .from('resume_feedback')
  .select('*')
  .eq('is_positive', false);

// Get feedback with comments
const { data, error } = await supabase
  .from('resume_feedback')
  .select('*')
  .not('comment', 'is', null);

// Get feedback statistics
const { data, error } = await supabase
  .from('resume_feedback')
  .select('is_positive, count(*)')
  .group('is_positive');
```

### Using Feedback Data

```typescript
import { 
  getAllFeedback, 
  getFeedbackStats, 
  getCommonIssues,
  generateParsingGuidance 
} from '../utils/feedbackAnalyzer';

// Get all feedback
const allFeedback = getAllFeedback();

// Get statistics
const stats = getFeedbackStats();
// Returns: { total, positive, negative, withReasons, successRate }

// Get common parsing issues
const issues = getCommonIssues();
// Returns: [{ issue: 'email parsing', count: 5 }, ...]

// Generate guidance for AI
const guidance = generateParsingGuidance();
// Returns a formatted string for AI prompt injection
```

### AI Parsing with Feedback

The system can incorporate feedback into future parsing attempts:

```typescript
import { generateParsingGuidance } from '../utils/feedbackAnalyzer';
import { apiClient } from '../utils/api';

// Generate guidance from previous feedback
const guidance = generateParsingGuidance();

// Parse resume with AI using feedback
const result = await apiClient.parseResumeWithAI(resumeText, guidance);
```

The backend receives this guidance and injects it into the system prompt:

```
🔍 IMPORTANT FEEDBACK FROM PREVIOUS USERS:
Based on previous feedback, pay special attention to:
- email parsing (5 reports)
- date parsing (3 reports)

Email parsing tips: Look for @ symbol and common email domains.
Date parsing tips: Watch for various date formats (MM/YYYY, Month Year, etc.).

[Rest of system prompt...]
```

### Feedback Analysis

The `feedbackAnalyzer` categorizes issues using keyword matching:

- "email" → email parsing
- "phone" → phone parsing
- "date" → date parsing
- "name" → name parsing
- "experience" → experience parsing
- "education" → education parsing
- "skill" → skills parsing
- "format" → formatting issues

### Viewing Feedback (Admin)

To view collected feedback, use the `FeedbackViewer` component:

```tsx
import { FeedbackViewer } from './components/FeedbackViewer';

// In your admin panel or debug screen:
<FeedbackViewer />
```

This displays:
- Overall statistics (total, positive/negative counts, success rate)
- Common issues ranked by frequency
- Generated parsing guidance
- Full feedback list with timestamps
- Export to JSON functionality
- Clear all feedback option

## Implementation Status

✅ **Completed:**
- Feedback UI (thumbs up/down) on every section
- Individual feedback buttons for each experience/education entry
- Thumbs down dialog for collecting reasons
- Supabase database integration with `resume_feedback` table
- Backend `/feedback` endpoint for storing feedback
- localStorage storage as backup/fallback
- Feedback analyzer utility with statistics and common issues
- Parsing guidance generation
- Backend endpoint accepts feedback guidance
- AI prompt injection of feedback guidance
- FeedbackViewer admin component
- Export/clear functionality
- Session tracking for anonymous users
- User ID tracking for authenticated users
- Parsed content storage for debugging

🔄 **Future Enhancements:**
- Query feedback from database to improve AI prompts automatically
- Machine learning to better categorize feedback reasons
- Server-side feedback aggregation across all users
- A/B testing of prompt improvements based on feedback
- Feedback trends dashboard with charts
- Email notifications for high-priority issues
- Admin panel to view database feedback with filters
- Feedback analytics API endpoints

## Data Privacy

**Database Storage:**
- Feedback is stored in Supabase `resume_feedback` table
- Stores section identifiers and user feedback comments
- Parsed content is stored in JSONB format for debugging purposes
- User ID is stored only if user is authenticated (optional)
- Anonymous users are tracked via session ID

**Local Storage:**
- Feedback is also stored in browser localStorage as backup
- Acts as fallback if backend is unavailable
- Can be cleared by user at any time

**Privacy Considerations:**
- No personally identifiable resume content (names, emails, addresses) is required to be stored in feedback
- Only structural parsing information and user comments are essential
- Users can inspect stored data via browser dev tools
- Session IDs allow tracking patterns without identifying users
- Authenticated users' feedback is linked to their user_id for better support

**Data Access:**
- Only administrators can query the `resume_feedback` table
- Users can view their own feedback via localStorage
- Export functionality allows users to review their data
- No feedback data is shared with third parties

## Testing

To test the feedback system:

1. Upload a resume
2. Navigate through sections
3. Click thumbs down on a section
4. Enter a reason (e.g., "Email was not detected")
5. Check localStorage: `localStorage.getItem('aiParsingFeedback')`
6. Upload another resume to see if guidance is applied

### Testing Database Integration

**1. Submit Feedback:**
- Upload a resume and navigate to any section
- Click 👍 or 👎 on a section
- For thumbs down, provide a comment

**2. Verify Backend Logs:**
- Check the browser console (F12) for:
  - `✅ Feedback sent to backend successfully`
  - Backend response from `/feedback` endpoint

**3. Query Database:**
- Go to your Supabase Dashboard
- Navigate to Table Editor → `resume_feedback`
- You should see your feedback entries with:
  - `section_id` (e.g., "summary", "experience-abc123")
  - `section_type` (e.g., "experience")
  - `is_positive` (true/false)
  - `comment` (if negative feedback)
  - `parsed_content` (JSONB with the actual data)
  - `session_id` (for anonymous users)
  - `created_at` timestamp

**4. Test Error Handling:**
- Disable network in DevTools
- Submit feedback
- Verify it still saves to localStorage as fallback
- Re-enable network and verify future submissions work

**5. Test Session Tracking:**
- Submit multiple feedback items
- Check localStorage for `feedbackSessionId`
- Verify all feedback from same session has same `session_id` in database

**How to verify feedback is being used:**

When you upload a resume after providing feedback, you'll see:
- **Console log**: `📊 Using X previous feedback items to improve parsing`
- **Toast notification**: "Learning from X previous feedback items" with success rate
- **Browser Console** (F12): Look for logs showing:
  - `Using 3 previous feedback items to improve parsing` (example)
  - `Using feedback guidance: Based on previous feedback...`
- **Server logs**: The backend will show `📊 Using feedback guidance: ...`

**Step-by-step verification:**

1. **First Resume Upload:**
   - Upload a resume
   - Notice an error in parsing (e.g., email wasn't detected)
   - Click 👎 on Contact section
   - Write: "Email address was not parsed correctly"

2. **Check Feedback Storage:**
   - **localStorage:** Run `JSON.parse(localStorage.getItem('aiParsingFeedback'))` in console
   - **Database:** Query Supabase `resume_feedback` table
   - You should see your feedback in both places

3. **Second Resume Upload:**
   - Upload another resume
   - Watch for the toast: "Learning from 1 previous feedback items"
   - Check console for: `📊 Using 1 previous feedback items to improve parsing`
   - The AI will receive guidance like: "Based on previous feedback, pay special attention to: email parsing (1 reports)"

4. **Verify on Server:**
   - In the server logs, look for: `📊 Using feedback guidance: ...`
   - This confirms the AI received your feedback

## Analytics

Track these metrics:
- Total feedback submissions
- Positive/negative ratio (target: >80% positive)
- Most common issues
- Time to resolution for reported issues
- Impact of prompt changes on feedback

## Contributing

When adding new parsing logic:
1. Check common issues in feedback
2. Write tests for reported edge cases
3. Update prompts to address feedback
4. Monitor success rate changes
5. Document improvements in changelog