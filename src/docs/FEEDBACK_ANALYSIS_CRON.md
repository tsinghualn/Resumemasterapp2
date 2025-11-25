# Daily Feedback Analysis Cron Job

## Overview

An automated system that runs daily at 6 PM PST to analyze user feedback, detect recurring parsing issues, and suggest improvements to the resume parsing AI prompt.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Daily at 6 PM PST                         │
│                  (2 AM UTC / 1 AM UTC DST)                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
          ┌─────────────────────────┐
          │  Cron Trigger Function   │
          │  (_cron/feedback-        │
          │   analysis.ts)           │
          └────────────┬─────────────┘
                       │
                       ▼
          ┌─────────────────────────┐
          │  Feedback Analyzer       │
          │  (analyze-feedback/      │
          │   index.ts)              │
          └────────────┬─────────────┘
                       │
     ┌─────────────────┼─────────────────┐
     │                 │                 │
     ▼                 ▼                 ▼
┌─────────┐    ┌──────────────┐   ┌──────────┐
│Database │    │   Keyword    │   │ OpenAI   │
│ Query   │    │  Detection   │   │ Analysis │
└────┬────┘    └──────┬───────┘   └─────┬────┘
     │                │                  │
     └────────────────┼──────────────────┘
                      │
                      ▼
           ┌──────────────────────┐
           │ Store Analysis in KV  │
           │ (status: pending_     │
           │  review)              │
           └──────────┬────────────┘
                      │
                      ▼
           ┌──────────────────────┐
           │  Admin Reviews &      │
           │  Applies Changes      │
           └───────────────────────┘
```

## Components

### 1. Cron Trigger (`/supabase/functions/_cron/feedback-analysis.ts`)

**Schedule:** Daily at 6 PM PST (2 AM UTC standard time, 1 AM UTC during DST)

**Cron Expression:** `0 2 * * *` (runs at 2:00 AM UTC)

**Function:**
- Triggers the feedback analyzer function
- Calls `/functions/v1/analyze-feedback/analyze-feedback-cron`
- Logs execution status

### 2. Feedback Analyzer (`/supabase/functions/analyze-feedback/index.ts`)

**Endpoints:**
- `POST /analyze-feedback-cron` - Main cron handler (called by cron)
- `GET /analyze-feedback-now` - Manual trigger (for testing)
- `GET /health` - Health check

**Process:**
1. Query database for negative feedback from last 24 hours
2. Extract and filter comments
3. Pre-categorize using keyword detection
4. Send to OpenAI for detailed analysis
5. Store results in KV store with `pending_review` status

### 3. Keyword Detection System

**Issue Patterns:**
```typescript
{
  dates: ['missing date', 'wrong date', 'incorrect date', ...],
  company: ['wrong company', 'company name', 'missing company', ...],
  skills: ['wrong skill', 'missing skill', 'skill error', ...],
  contact: ['email error', 'phone error', 'contact info', ...],
  title: ['wrong title', 'job title', 'incorrect title', ...],
  bullets: ['missing bullet', 'lost information', 'truncated', ...],
  order: ['wrong order', 'chronological', 'sorting', ...],
  name: ['name error', 'wrong name', 'missing name', ...],
  education: ['GPA missing', 'GPA wrong', 'degree error', ...],
  projects: ['project missing', 'lost project', ...],
  certifications: ['certification missing', 'cert not', ...],
  awards: ['award missing', 'honor not', ...],
  whitespace: ['extra space', 'spacing', 'whitespace', ...],
  duplicates: ['duplicate', 'repeated', 'duplicated', ...]
}
```

**How It Works:**
- Scans each feedback comment for predefined keywords
- Categorizes issues automatically before AI analysis
- Provides quick summary of issue distribution
- Example: "dates: 15 issues, skills: 8 issues, contact: 5 issues"

### 4. OpenAI Analysis

**Model:** gpt-4o-mini  
**Temperature:** 0.3 (for consistent analysis)  
**Response Format:** JSON

**AI Task:**
1. Identify recurring themes
2. Categorize issues with severity levels
3. Count frequency of each issue type
4. Suggest specific prompt improvements
5. Generate updated prompt sections

**Output Structure:**
```json
{
  "total_feedback_analyzed": 25,
  "common_issues": [
    {
      "category": "Missing Dates",
      "count": 15,
      "severity": "high",
      "examples": [
        "Experience dates are missing",
        "No graduation date found"
      ],
      "keywords": ["date", "missing", "when"]
    }
  ],
  "recommendations": [
    {
      "issue": "Dates frequently missing from experience section",
      "current_problem": "Parser not extracting date ranges consistently",
      "suggested_fix": "Add explicit instruction to look for dates in formats: 'Jan 2020', '2020-2023', 'Present', etc."
    }
  ],
  "updated_prompt_sections": {
    "contact_info": "Enhanced instructions...",
    "experience": "Enhanced instructions...",
    "education": "Enhanced instructions...",
    "skills": "Enhanced instructions..."
  },
  "summary": "Main issues: date extraction (15), skill parsing (8), contact info (5)"
}
```

### 5. Storage System

**KV Store Key Pattern:** `feedback_analysis_YYYY-MM-DD`

**Stored Data:**
```json
{
  "analysis_date": "2025-11-25T02:00:00.000Z",
  "feedback_count": 25,
  "comments_analyzed": 20,
  "keyword_categorization": [
    {
      "category": "dates",
      "count": 15,
      "examples": ["Missing graduation date", "No work dates", "Date format wrong"]
    }
  ],
  "common_issues": [...],
  "recommendations": [...],
  "updated_prompt_sections": {...},
  "summary": "...",
  "raw_analysis": {...},
  "status": "pending_review"
}
```

## Workflow

### Daily Automated Workflow

```
6:00 PM PST - Cron triggers
     ↓
Query last 24 hours of negative feedback
     ↓
Extract feedback comments (filter nulls/empty)
     ↓
Pre-categorize with keyword detection
     ↓
Send to OpenAI for deep analysis
     ↓
Receive AI recommendations
     ↓
Store analysis with "pending_review" status
     ↓
Admin reviews in dashboard
     ↓
Admin approves/rejects changes
     ↓
If approved: Update prompt template
```

### Manual Testing Workflow

```
1. Visit: https://{project}.supabase.co/functions/v1/analyze-feedback/analyze-feedback-now
2. System analyzes current negative feedback
3. Returns analysis immediately
4. Check results in KV store
```

## Configuration

### Supabase Cron Setup

1. **Go to Supabase Dashboard** → Edge Functions → Cron Jobs
2. **Add new cron job:**
   - Name: `daily-feedback-analysis`
   - Function: `_cron/feedback-analysis`
   - Schedule: `0 2 * * *` (2 AM UTC = 6 PM PST)
   - Enabled: ✅

### Environment Variables Required

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=sk-...
```

## Testing

### Test Manually

```bash
# Call the manual trigger endpoint
curl https://your-project.supabase.co/functions/v1/analyze-feedback/analyze-feedback-now

# Or from browser:
https://your-project.supabase.co/functions/v1/analyze-feedback/analyze-feedback-now
```

### Check Results

```sql
-- Query KV store for analysis results
SELECT * FROM kv_store_bc1c5df9 
WHERE key LIKE 'feedback_analysis_%'
ORDER BY key DESC
LIMIT 5;
```

### View Analysis

```javascript
// In browser console or Node.js
const analysisKey = 'feedback_analysis_2025-11-25';
// Fetch from KV store and view results
```

## Expected Behavior

### If Feedback Exists (Happy Path)

```
🕐 Starting daily feedback analysis at 2025-11-25T02:00:00.000Z
📊 Found 25 negative feedback entries
💬 Analyzing 20 feedback comments with AI...
📋 Keyword-based categorization: dates: 15 issues, skills: 8 issues, contact: 5 issues
✅ Analysis complete
💾 Analysis stored with ID: feedback_analysis_2025-11-25
```

**Result:** Analysis stored in KV store with `pending_review` status

### If No Feedback (No Issues)

```
🕐 Starting daily feedback analysis at 2025-11-25T02:00:00.000Z
ℹ️ No negative feedback in the last 24 hours
```

**Result:** Returns success with `analyzed_count: 0`

### If No Comments (Only Thumbs Down Without Text)

```
🕐 Starting daily feedback analysis at 2025-11-25T02:00:00.000Z
📊 Found 10 negative feedback entries
ℹ️ No comments in negative feedback (all thumbs down without text)
```

**Result:** Returns success with `analyzed_count: 0`

## Keyword Detection Examples

### Example Feedback → Categories

| Feedback Comment | Detected Categories |
|-----------------|-------------------|
| "Missing graduation date" | dates, education |
| "Wrong company name extracted" | company |
| "Email not found in contact" | contact |
| "Skills are incomplete" | skills, bullets |
| "Experience not in order" | order |
| "Extra spaces in name" | whitespace, name |
| "Duplicate job entries" | duplicates |

### Category Count Example

```
📋 Keyword-based categorization: 
  dates: 15 issues, 
  skills: 8 issues, 
  contact: 5 issues, 
  company: 4 issues, 
  order: 3 issues, 
  education: 3 issues
```

## Admin Review Process

1. **Check for new analysis:**
   ```sql
   SELECT key, value->>'status' as status, value->>'analysis_date' as date
   FROM kv_store_bc1c5df9
   WHERE key LIKE 'feedback_analysis_%'
   AND value->>'status' = 'pending_review'
   ORDER BY value->>'analysis_date' DESC;
   ```

2. **Review recommendations:**
   - Read `common_issues` - What problems are users reporting?
   - Check `keyword_categorization` - Quick stats on issue types
   - Review `recommendations` - What changes does AI suggest?
   - Examine `updated_prompt_sections` - Specific prompt improvements

3. **Decide:**
   - ✅ **Approve:** Update prompt template with suggested changes
   - ❌ **Reject:** Mark as reviewed but don't apply
   - ⏸️ **Defer:** Leave in pending state for more data

4. **Apply changes:** (If approved)
   - Update `resume_parsing_prompt_template` in KV store
   - Increment version number
   - Log applied feedback in template history

## Monitoring

### Check Cron Execution

```sql
-- View cron job logs in Supabase Dashboard
-- Edge Functions → Logs → Filter by "feedback-analysis"
```

### Success Metrics

- **Execution frequency:** Once per day at 6 PM PST
- **Success rate:** >95% successful executions
- **Avg processing time:** <30 seconds for <100 feedback items
- **Analysis quality:** AI provides actionable recommendations

### Alerts to Set Up

- ❌ Cron job fails to run
- ❌ OpenAI API errors
- ❌ Database query failures
- ⚠️ High volume of same issue (>20 similar feedbacks)
- ⚠️ Severity "high" issues detected

## Troubleshooting

### Issue: Cron not running

**Check:**
1. Cron job is enabled in Supabase Dashboard
2. Function is deployed (`_cron/feedback-analysis.ts`)
3. Check function logs for errors

**Fix:**
- Redeploy cron function
- Verify cron expression: `0 2 * * *`
- Check environment variables are set

### Issue: No analysis results

**Possible causes:**
1. No negative feedback in last 24 hours (expected)
2. All feedback is thumbs down without comments (expected)
3. OpenAI API error

**Debug:**
```bash
# Manually trigger to see real-time logs
curl https://your-project.supabase.co/functions/v1/analyze-feedback/analyze-feedback-now
```

### Issue: OpenAI API errors

**Check:**
- `OPENAI_API_KEY` is set correctly
- API key has not expired
- OpenAI API is operational

**Fix:**
- Update API key in Supabase secrets
- Check OpenAI status page
- Review error logs for specific error message

### Issue: Analysis stored but low quality

**Possible causes:**
- Feedback comments are too vague
- Not enough feedback data
- Keywords not matching actual issues

**Fix:**
- Wait for more feedback to accumulate
- Update `ISSUE_PATTERNS` with new keywords
- Adjust AI prompt for better analysis

## Future Enhancements

- [ ] **Auto-apply low-risk changes** - If severity is "low" and confidence is high
- [ ] **Email notifications** - Send analysis summary to admins daily
- [ ] **Trending issues dashboard** - Track issues over time
- [ ] **A/B testing** - Test prompt changes on subset of users
- [ ] **Feedback loop** - Track if changes reduce complaints
- [ ] **Multi-language support** - Detect and categorize non-English feedback
- [ ] **Sentiment analysis** - Detect urgency/frustration in feedback
- [ ] **Auto-close resolved issues** - Mark issues as fixed after prompt update

## Summary

✅ **Automated daily analysis** at 6 PM PST  
✅ **Keyword detection** for quick categorization  
✅ **AI-powered insights** with specific recommendations  
✅ **Safe review process** - No auto-deployment  
✅ **Comprehensive logging** for debugging  
✅ **Manual trigger** for testing anytime  

The system continuously learns from user feedback and suggests improvements to the resume parsing AI, making it more accurate over time.
