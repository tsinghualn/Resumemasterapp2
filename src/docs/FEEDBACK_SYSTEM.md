# AI Resume Parsing Feedback System

## Overview

This feedback system allows users to rate the accuracy of AI-powered resume parsing and provides a mechanism for continuous improvement based on user feedback.

## User Flow

### 1. Resume Parsing
When a user uploads their resume, the AI parsing engine extracts information into structured sections:
- Personal Details
- Contact Information
- Professional Summary
- Employment History
- Education
- Skills
- Links
- Custom Sections

### 2. Feedback Collection

On each section editing screen, users see:
```
Help us improve AI. Parsed correctly?
[👍] [👎]
```

**Thumbs Up (👍)**
- Indicates the parsing was accurate
- Stored as positive feedback
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

Feedback is stored in browser localStorage with this structure:

```json
{
  "section": "contact",
  "type": "negative",
  "reason": "Email address was not detected correctly",
  "timestamp": 1700000000000
}
```

## For Developers

### Files

**Frontend:**
- `/components/AIRewritePanel.tsx` - Main component with feedback UI
- `/utils/feedbackAnalyzer.ts` - Feedback analysis utilities
- `/components/FeedbackViewer.tsx` - Admin view for feedback inspection
- `/utils/api.tsx` - API client with parseResumeWithAI method

**Backend:**
- `/supabase/functions/server/index.tsx` - Server endpoint that accepts feedback guidance

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
- Thumbs down dialog for collecting reasons
- localStorage storage system
- Feedback analyzer utility with statistics and common issues
- Parsing guidance generation
- Backend endpoint accepts feedback guidance
- AI prompt injection of feedback guidance
- FeedbackViewer admin component
- Export/clear functionality

🔄 **Future Enhancements:**
- Automatically use feedback guidance for all new resume uploads
- Machine learning to better categorize feedback reasons
- Server-side feedback aggregation across all users
- A/B testing of prompt improvements based on feedback
- Feedback trends dashboard
- Email notifications for high-priority issues

## Data Privacy

- Feedback is stored locally in browser localStorage
- No personal information from resumes is stored in feedback
- Only section names and user-provided reasons are stored
- Users can clear their feedback at any time
- Export functionality allows users to review their data

## Testing

To test the feedback system:

1. Upload a resume
2. Navigate through sections
3. Click thumbs down on a section
4. Enter a reason (e.g., "Email was not detected")
5. Check localStorage: `localStorage.getItem('aiParsingFeedback')`
6. Upload another resume to see if guidance is applied

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
   - Open browser console (F12)
   - Run: `JSON.parse(localStorage.getItem('aiParsingFeedback'))`
   - You should see your feedback stored

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