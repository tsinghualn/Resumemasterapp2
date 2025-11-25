# Daily Feedback Analysis - Status & Testing Guide

## 🔍 Check if the Cron Job is Running

The "Updating..." message on the homepage appears when the daily feedback analysis is running. Here's how to check if it's configured and running:

### Method 1: Check the Status Endpoint

```bash
curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/analyze-feedback/status
```

**Expected Response:**

If it's running:
```json
{
  "is_running": true,
  "started_at": "2025-11-25T22:00:00.000Z"
}
```

If it's idle:
```json
{
  "is_running": false,
  "completed_at": "2025-11-25T22:05:32.000Z"
}
```

If there's an error:
```json
{
  "is_running": false,
  "error": true,
  "error_message": "OpenAI API key not found",
  "completed_at": "2025-11-25T22:00:15.000Z"
}
```

### Method 2: Check the Database

```sql
-- Run this in Supabase SQL Editor
SELECT 
  key,
  value->>'is_running' as is_running,
  value->>'started_at' as started_at,
  value->>'completed_at' as completed_at,
  value->>'error' as has_error,
  value->>'error_message' as error_message
FROM kv_store_bc1c5df9
WHERE key = 'feedback_analysis_running';
```

### Method 3: Check Latest Analysis Results

```sql
-- Check if any analysis has been performed
SELECT 
  key,
  value->>'analysis_date' as analysis_date,
  value->>'feedback_count' as feedback_count,
  value->>'comments_analyzed' as comments_analyzed,
  value->>'summary' as summary
FROM kv_store_bc1c5df9
WHERE key LIKE 'feedback_analysis_%'
ORDER BY key DESC
LIMIT 5;
```

## 🎯 Manual Testing (Trigger Analysis Now)

If you want to test the system without waiting for 10 PM PST:

### Option 1: Use the New Status Component

1. Navigate to your admin dashboard
2. Look for the "Feedback Analysis Status" card
3. Click the "Run Analysis Now" button
4. Wait 30-60 seconds for results

### Option 2: Use curl

```bash
curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/analyze-feedback/analyze-feedback-now
```

**Expected Response:**

If successful:
```json
{
  "success": true,
  "message": "Feedback analysis completed",
  "analysis_id": "feedback_analysis_2025-11-25",
  "feedback_analyzed": 25,
  "comments_analyzed": 20,
  "analysis": {
    "total_feedback_analyzed": 20,
    "common_issues": [...],
    "recommendations": [...],
    "summary": "..."
  }
}
```

If no feedback:
```json
{
  "success": true,
  "message": "No negative feedback to analyze",
  "analyzed_count": 0
}
```

## ⚙️ Cron Job Configuration Status

The cron job is **NOT automatically configured** in Figma Make. You need to set it up manually in Supabase Dashboard.

### Current Status: ❌ NOT CONFIGURED

The cron job files exist in the codebase:
- ✅ `/supabase/functions/analyze-feedback/index.ts` - Main analysis function
- ✅ `/supabase/functions/_cron/feedback-analysis.ts` - Cron trigger
- ❌ **Supabase cron schedule NOT configured**

### How to Configure (Required for Automatic Daily Runs)

**Step 1: Deploy Edge Functions**

```bash
# From your project root
cd supabase/functions

# Deploy the analysis function
supabase functions deploy analyze-feedback

# Deploy the cron trigger
supabase functions deploy _cron
```

**Step 2: Configure Cron in Supabase Dashboard**

1. Go to your Supabase project dashboard
2. Navigate to **Edge Functions** → **Cron Jobs**
3. Click **Create Cron Job**
4. Configure:
   - **Name:** `daily-feedback-analysis`
   - **Function:** `_cron/feedback-analysis`
   - **Schedule:** `0 6 * * *` (6 AM UTC = 10 PM PST)
   - **Enabled:** ✅ Yes
5. Click **Create**

**Step 3: Verify Configuration**

```bash
# Check if functions are deployed
curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/analyze-feedback/health

# Expected: {"status":"ok","service":"feedback-analyzer"}
```

## 📊 Understanding the Schedule

### Cron Expression: `0 6 * * *`

- **Runs at:** 6:00 AM UTC
- **Which is:** 10:00 PM PST (Pacific Standard Time)
- **Which is:** 10:00 PM PDT (Pacific Daylight Time, UTC-7)

### Timeline Example

```
10:00 PM PST - Cron triggers
10:00 PM PST - Sets is_running = true (Homepage shows "Updating...")
10:00 PM PST - Fetches negative feedback from last 24 hours
10:01 PM PST - Analyzes with OpenAI GPT-4o-mini
10:02 PM PST - Stores results in database
10:02 PM PST - Sets is_running = false (Homepage hides "Updating...")
```

**Duration:** Typically 1-3 minutes depending on feedback volume

## 🧪 Testing the "Updating..." Message

### Test 1: Simulate the Running State

```sql
-- Manually set running status to test the UI
INSERT INTO kv_store_bc1c5df9 (key, value)
VALUES ('feedback_analysis_running', '{"is_running": true, "started_at": "2025-11-25T22:00:00.000Z"}')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

Now visit your homepage - you should see "Updating..." to the left of "Sign in"

```sql
-- Clear it after testing
UPDATE kv_store_bc1c5df9
SET value = '{"is_running": false, "completed_at": "2025-11-25T22:02:00.000Z"}'
WHERE key = 'feedback_analysis_running';
```

### Test 2: Run Full Analysis

```bash
# Trigger manual analysis
curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/analyze-feedback/analyze-feedback-now

# Watch the status change
watch -n 1 'curl -s https://YOUR_PROJECT_ID.supabase.co/functions/v1/analyze-feedback/status | jq'
```

During execution, you'll see:
1. `is_running: true` (Homepage shows "Updating...")
2. ... processing ...
3. `is_running: false` (Homepage hides "Updating...")

## 🔔 When Will the Analysis Run Today?

### If Cron is NOT Configured (Current State)
- ❌ **It will NOT run automatically**
- ✅ **You can run it manually** using the methods above

### If Cron IS Configured
- ✅ **Next run:** Today at 10:00 PM PST (6:00 AM UTC tomorrow)
- ✅ **Every day:** Same time daily
- ✅ **Duration:** 1-3 minutes

### Check Last Run Time

```sql
SELECT 
  key,
  value->>'analysis_date' as last_run
FROM kv_store_bc1c5df9
WHERE key LIKE 'feedback_analysis_%'
ORDER BY key DESC
LIMIT 1;
```

## 📈 Monitoring the Cron Job

### View Execution Logs

1. Go to Supabase Dashboard
2. Navigate to **Edge Functions** → Select `analyze-feedback`
3. Click **Logs** tab
4. Filter by date to see execution history

### Check for Errors

```sql
-- Check if last analysis had errors
SELECT 
  key,
  value->'status' as status,
  value->>'error_message' as error,
  value->>'analysis_date' as date
FROM kv_store_bc1c5df9
WHERE key LIKE 'feedback_analysis_%'
ORDER BY key DESC
LIMIT 1;
```

### View Analysis Results

```sql
-- Get detailed results
SELECT 
  key,
  jsonb_pretty(value) as analysis_details
FROM kv_store_bc1c5df9
WHERE key LIKE 'feedback_analysis_%'
ORDER BY key DESC
LIMIT 1;
```

## 🐛 Troubleshooting

### Issue: "Updating..." Never Appears

**Possible Causes:**
1. ❌ Cron not configured in Supabase
2. ❌ Status endpoint not reachable
3. ❌ Frontend polling not working
4. ❌ User is authenticated (message only shows for non-authenticated users)

**Solutions:**
1. Check cron configuration in Supabase Dashboard
2. Test status endpoint manually: `curl .../status`
3. Check browser console for errors
4. Try in incognito mode (non-authenticated)

### Issue: Analysis Fails

**Check logs for common errors:**

```bash
# View function logs
curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/analyze-feedback/health
```

**Common errors:**
- `OPENAI_API_KEY not configured` - Set environment variable in Supabase
- `No negative feedback` - Normal if no users provided feedback
- `OpenAI API error: 401` - Invalid API key
- `OpenAI API error: 429` - Rate limit exceeded

### Issue: Cron Runs But No Results

**Check if feedback exists:**

```sql
SELECT COUNT(*) as total_feedback,
       COUNT(CASE WHEN is_positive = false THEN 1 END) as negative_feedback,
       COUNT(CASE WHEN is_positive = false AND comment IS NOT NULL THEN 1 END) as with_comments
FROM resume_feedback
WHERE created_at >= NOW() - INTERVAL '24 hours';
```

If `with_comments` is 0, the analysis will run but return "No comments to analyze"

## 📝 Quick Commands Reference

```bash
# Check if running
curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/analyze-feedback/status

# Trigger manual analysis
curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/analyze-feedback/analyze-feedback-now

# Check latest analysis (from server)
curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-bc1c5df9/latest-analysis

# Check analysis history (last 7 days)
curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-bc1c5df9/analysis-history

# Health check
curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/analyze-feedback/health
```

## ✅ Current Implementation Status

### ✅ Implemented
- Analysis function with OpenAI integration
- Status tracking in database
- Manual trigger endpoint
- Frontend polling for status
- "Updating..." indicator on homepage
- Keyword-based categorization
- AI-powered deep analysis
- Results storage with version tracking
- Admin review workflow

### ❌ NOT Configured (Manual Setup Required)
- Supabase cron schedule
- Edge function deployment
- Environment variables in Supabase

### 📋 Next Steps

1. **Deploy functions to Supabase**
   ```bash
   supabase functions deploy analyze-feedback
   supabase functions deploy _cron
   ```

2. **Configure cron in Supabase Dashboard**
   - Schedule: `0 6 * * *`
   - Function: `_cron/feedback-analysis`

3. **Test manually**
   - Visit the FeedbackAnalysisStatus component
   - Click "Run Analysis Now"
   - Verify results appear

4. **Wait for scheduled run**
   - Next run: Today at 10 PM PST
   - Check logs tomorrow morning
   - Verify "Updating..." appeared

## 📖 Related Documentation

- **Setup Guide:** `/docs/SETUP_FEEDBACK_CRON.md`
- **Testing Guide:** `/docs/FEEDBACK_TESTING_GUIDE.md`
- **System Overview:** `/docs/FEEDBACK_SYSTEM.md`
- **Cron Implementation:** `/docs/FEEDBACK_ANALYSIS_CRON.md`

## 💡 Summary

**Current Status:** Cron job code is ready, but **NOT configured in Supabase**.

**Why no "Updating..." message?** The cron isn't running automatically because it needs to be configured in the Supabase Dashboard.

**How to fix:** Follow the deployment steps above to configure the cron job.

**For immediate testing:** Use the manual trigger button in the FeedbackAnalysisStatus component or call the `/analyze-feedback-now` endpoint.
