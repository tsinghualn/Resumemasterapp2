# Quick Test: Daily Feedback Analysis System

## ✅ Component Added to Admin Dashboard

The `FeedbackAnalysisStatus` component has been added to the FeedbackViewer admin page. You can now test the daily feedback analysis system!

## 🎯 How to Access & Test

### Step 1: Navigate to the Admin Dashboard

The FeedbackViewer component should be accessible from your admin/dashboard section. It now includes the new **"Daily Feedback Analysis Status"** card at the top.

### Step 2: What You'll See

The status card displays:

1. **Current Status Badge:**
   - 🔵 **Running** - Analysis in progress (with spinning icon)
   - 🟢 **Idle** - System ready
   - 🔴 **Error** - Something went wrong

2. **Last Run Information:**
   - When the analysis last completed
   - Error messages if applicable

3. **"Run Analysis Now" Button:**
   - Click to manually trigger analysis
   - Button disables while running
   - Shows "Analyzing..." with spinner when active

4. **Latest Analysis Results:**
   - Total feedback analyzed
   - Comments analyzed
   - Summary of findings
   - Issue categories with counts
   - Status (Pending Review, etc.)

5. **Setup Instructions:**
   - Blue info box with deployment instructions
   - Link to full documentation

## 🧪 Test It Right Now

### Test 1: Check Current Status

1. Open your admin dashboard
2. Scroll to the "Daily Feedback Analysis Status" card
3. You should see:
   - Current status badge
   - Setup instructions (since cron isn't configured yet)

### Test 2: Manually Trigger Analysis

**Requirements:** You need some negative feedback in the database first.

**Option A: Create Test Feedback**

Run this SQL in Supabase SQL Editor:

```sql
-- Create test negative feedback
INSERT INTO resume_feedback (section_id, section_type, is_positive, comment, session_id)
VALUES 
  ('summary', 'summary', false, 'Missing graduation date from education section', uuid_generate_v4()::text),
  ('experience-1', 'experience', false, 'Wrong company name was extracted', uuid_generate_v4()::text),
  ('contact', 'contact', false, 'Email address not found in the resume', uuid_generate_v4()::text),
  ('skills', 'skills', false, 'Missing Python programming skill', uuid_generate_v4()::text),
  ('education-1', 'education', false, 'GPA was parsed incorrectly', uuid_generate_v4()::text);
```

**Option B: Use Real Feedback**

If users have already submitted feedback, you can use that instead.

**Now Test the Analysis:**

1. Click the **"Run Analysis Now"** button
2. You'll see:
   - Toast notification: "Starting feedback analysis..."
   - Button changes to "Analyzing..." with spinner
   - Status badge changes to "Running" (blue)
3. Wait 30-60 seconds
4. Results appear:
   - Toast notification: "Analysis completed!"
   - Status badge changes back to "Idle" (green)
   - Latest Analysis card appears with results
   - Shows keyword categories detected

### Test 3: View Analysis Results

After running the analysis, the "Latest Analysis" card shows:

- **Statistics:**
  - Total feedback count
  - Comments analyzed

- **Summary:**
  - AI-generated summary of issues found

- **Issue Categories:**
  - Each category with count (e.g., "dates: 2 issues")
  - Based on keyword detection

- **Status Badge:**
  - "Pending Review" - Admin needs to review before applying changes

### Test 4: Check Raw Data in Database

```sql
-- View the stored analysis
SELECT 
  key,
  value->>'analysis_date' as date,
  value->>'feedback_count' as total_feedback,
  value->>'comments_analyzed' as comments,
  value->>'summary' as summary,
  jsonb_pretty(value->'keyword_categorization') as categories
FROM kv_store_bc1c5df9
WHERE key LIKE 'feedback_analysis_%'
ORDER BY key DESC
LIMIT 1;
```

### Test 5: Simulate "Updating..." Message on Homepage

While analysis is running, the homepage should show "Updating..." (for non-authenticated users).

To test this without running analysis:

```sql
-- Manually set running state
UPDATE kv_store_bc1c5df9
SET value = '{"is_running": true, "started_at": "2025-11-25T22:00:00.000Z"}'
WHERE key = 'feedback_analysis_running';
```

Now:
1. Visit the homepage (in incognito/logged out)
2. You should see "Updating..." to the left of "Sign in"
3. The status card in admin shows "Running"

Clear it:

```sql
-- Clear running state
UPDATE kv_store_bc1c5df9
SET value = '{"is_running": false, "completed_at": "2025-11-25T22:02:00.000Z"}'
WHERE key = 'feedback_analysis_running';
```

## 📊 What the Analysis Detects

The system categorizes feedback into 14 categories:

1. **dates** - Missing/wrong dates
2. **company** - Wrong company names
3. **skills** - Missing/incorrect skills
4. **contact** - Email/phone/LinkedIn issues
5. **title** - Job title errors
6. **bullets** - Missing bullet points
7. **order** - Chronological order issues
8. **name** - Name parsing errors
9. **education** - GPA/degree issues
10. **projects** - Missing projects
11. **certifications** - Missing certifications
12. **awards** - Missing awards/honors
13. **whitespace** - Extra spacing issues
14. **duplicates** - Duplicate content

## 🎨 Expected UI Components

In the FeedbackViewer admin page, you should now see:

```
┌─────────────────────────────────────────┐
│  AI Parsing Feedback         [Export] [Clear All]
├─────────────────────────────────────────┤
│                                         │
│  📊 Daily Feedback Analysis Status      │
│  ├─ Status Badge: [Idle] 🟢            │
│  ├─ Last completed: Nov 25, 10:02 PM   │
│  └─ [Run Analysis Now] button          │
│                                         │
│  📈 Latest Analysis                     │
│  ├─ 25 Total Feedback                  │
│  ├─ 20 Comments Analyzed               │
│  ├─ Summary: "Main issues found..."    │
│  ├─ Issue Categories:                  │
│  │   • dates: 5 issues                 │
│  │   • company: 3 issues               │
│  │   • skills: 2 issues                │
│  └─ Status: [Pending Review]           │
│                                         │
│  📋 Setup Required                      │
│  └─ Instructions to configure cron...  │
│                                         │
├─────────────────────────────────────────┤
│  📊 Statistics                          │
│  ... (existing stats)                  │
├─────────────────────────────────────────┤
│  ⚠️ Common Issues                       │
│  ... (existing issues)                 │
└─────────────────────────────────────────┘
```

## 🚀 Next Steps

### For Testing (Now):

1. ✅ Open admin dashboard
2. ✅ Create test feedback (SQL above)
3. ✅ Click "Run Analysis Now"
4. ✅ View results in the status card
5. ✅ Check database for stored analysis

### For Production (Later):

1. Deploy Edge Functions to Supabase
2. Configure cron job in Supabase Dashboard
3. Schedule: `0 6 * * *` (10 PM PST daily)
4. Enable automatic daily runs
5. Monitor execution logs

See `/docs/SETUP_FEEDBACK_CRON.md` for deployment instructions.

## 🔍 Troubleshooting

### Button Not Working

**Check browser console for errors:**
- Network errors → Check Supabase URL
- 401 errors → Check authentication
- 500 errors → Check server logs

**Verify endpoints are accessible:**
```bash
curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/analyze-feedback/health
# Expected: {"status":"ok","service":"feedback-analyzer"}
```

### No Results After Analysis

**Check if feedback exists:**
```sql
SELECT COUNT(*) as negative_feedback
FROM resume_feedback
WHERE is_positive = false
AND created_at >= NOW() - INTERVAL '24 hours';
```

If count is 0, create test feedback first.

### Analysis Takes Too Long

- Normal duration: 30-60 seconds
- If longer than 2 minutes, check:
  - OpenAI API status
  - Network connectivity
  - Server logs for errors

### Status Not Updating

The component polls every 10 seconds. If status isn't updating:
1. Check browser console for fetch errors
2. Verify status endpoint is working
3. Check if `is_running` flag is stuck in database

## 📚 Documentation Reference

- **Setup Guide:** `/docs/SETUP_FEEDBACK_CRON.md` - How to deploy and configure
- **Status Guide:** `/docs/FEEDBACK_CRON_STATUS.md` - How to check and monitor
- **System Overview:** `/docs/FEEDBACK_SYSTEM.md` - Complete system documentation
- **Testing Guide:** `/docs/FEEDBACK_TESTING_GUIDE.md` - Comprehensive testing

## 💡 Summary

You can now:

✅ **View status** - See if analysis is running or idle  
✅ **Manually trigger** - Click button to run analysis on demand  
✅ **View results** - See latest analysis with categories and summary  
✅ **Monitor system** - Real-time status updates every 10 seconds  
✅ **Test locally** - No need to wait for 10 PM PST  

The cron job code is ready and fully functional. It just needs to be deployed to Supabase for automatic daily runs!

**Ready to test? Open your admin dashboard and look for the "Daily Feedback Analysis Status" card! 🎯**
