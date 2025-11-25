# Setup Guide: Daily Feedback Analysis Cron Job

## Prerequisites

- ✅ Supabase project set up
- ✅ Resume feedback system collecting data in `resume_feedback` table
- ✅ OpenAI API key
- ✅ Supabase CLI installed (optional, for local testing)

## Step-by-Step Setup

### Step 1: Deploy Edge Functions

#### Option A: Using Supabase Dashboard

1. **Navigate to Edge Functions:**
   - Go to your Supabase project
   - Click **Edge Functions** in left sidebar

2. **Deploy analyze-feedback function:**
   - Click **New Function**
   - Name: `analyze-feedback`
   - Upload files from `/supabase/functions/analyze-feedback/`
   - Click **Deploy**

3. **Deploy cron function:**
   - Click **New Function**
   - Name: `_cron`
   - Upload files from `/supabase/functions/_cron/`
   - Click **Deploy**

#### Option B: Using Supabase CLI (Recommended)

```bash
# From your project root
cd supabase/functions

# Deploy analyze-feedback function
supabase functions deploy analyze-feedback

# Deploy cron function
supabase functions deploy _cron
```

### Step 2: Set Environment Variables

**In Supabase Dashboard:**

1. Go to **Project Settings** → **Edge Functions** → **Manage Secrets**

2. Add the following secrets:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   OPENAI_API_KEY=sk-your-openai-key
   ```

3. Click **Save**

**Using CLI:**

```bash
# Set OpenAI API key
supabase secrets set OPENAI_API_KEY=sk-your-openai-key

# Other variables are auto-set by Supabase
```

### Step 3: Configure Cron Schedule

**In Supabase Dashboard:**

1. Go to **Edge Functions** → **Cron Jobs**

2. Click **Create Cron Job**

3. Configure:
   - **Name:** `daily-feedback-analysis`
   - **Function:** `_cron/feedback-analysis`
   - **Schedule:** `0 2 * * *`
     - This runs at 2:00 AM UTC
     - Which is 6:00 PM PST (previous day)
     - Or 6:00 PM PDT during daylight saving
   - **Enabled:** ✅ Yes

4. Click **Create**

**Alternative schedules:**

```
# Run at different times
0 1 * * *   # 1 AM UTC = 5 PM PST
0 3 * * *   # 3 AM UTC = 7 PM PST

# Run multiple times per day
0 2,14 * * * # 2 AM and 2 PM UTC

# Run only on weekdays
0 2 * * 1-5  # 2 AM UTC, Monday-Friday
```

### Step 4: Verify Deployment

#### Test the analyze-feedback function:

```bash
# Using curl
curl https://your-project.supabase.co/functions/v1/analyze-feedback/health

# Expected response:
{"status":"ok","service":"feedback-analyzer"}
```

#### Test the cron trigger manually:

```bash
curl https://your-project.supabase.co/functions/v1/analyze-feedback/analyze-feedback-now
```

**Expected response (if feedback exists):**
```json
{
  "success": true,
  "message": "Feedback analysis completed",
  "analysis_id": "feedback_analysis_2025-11-25",
  "feedback_analyzed": 25,
  "comments_analyzed": 20,
  "analysis": {...}
}
```

**Expected response (if no feedback):**
```json
{
  "success": true,
  "message": "No negative feedback to analyze",
  "analyzed_count": 0
}
```

### Step 5: Verify Data Storage

**Check KV store for analysis results:**

```sql
-- Run in SQL Editor
SELECT 
  key, 
  value->>'analysis_date' as analysis_date,
  value->>'feedback_count' as feedback_count,
  value->>'status' as status
FROM kv_store_bc1c5df9
WHERE key LIKE 'feedback_analysis_%'
ORDER BY key DESC
LIMIT 5;
```

**View full analysis:**

```sql
-- Get latest analysis
SELECT value
FROM kv_store_bc1c5df9
WHERE key LIKE 'feedback_analysis_%'
ORDER BY key DESC
LIMIT 1;
```

### Step 6: Set Up Monitoring (Optional)

#### Supabase Dashboard Monitoring:

1. **Go to Edge Functions** → Select `analyze-feedback`
2. Click **Logs** tab
3. Filter by time range to see execution history

#### Email Alerts (Future):

```typescript
// Add to analyze-feedback/index.ts
// Send email when high-severity issues detected
if (analysis.common_issues.some(issue => issue.severity === 'high')) {
  await sendEmailAlert({
    subject: 'High-severity parsing issues detected',
    body: `${analysis.summary}\n\nCheck dashboard for details.`
  });
}
```

## Verification Checklist

After setup, verify:

- [ ] ✅ `analyze-feedback` function deployed
- [ ] ✅ `_cron` function deployed
- [ ] ✅ Environment variables set (OPENAI_API_KEY)
- [ ] ✅ Cron job created and enabled
- [ ] ✅ Health endpoint returns 200 OK
- [ ] ✅ Manual trigger works (`/analyze-feedback-now`)
- [ ] ✅ Analysis stored in KV store
- [ ] ✅ Can view logs in Supabase Dashboard

## Testing the Full Workflow

### 1. Create Test Feedback

```sql
-- Insert some test negative feedback
INSERT INTO resume_feedback (section_id, section_type, is_positive, comment, session_id)
VALUES 
  ('summary', 'summary', false, 'Missing graduation date from education', 'test-session-1'),
  ('experience-1', 'experience', false, 'Wrong company name extracted', 'test-session-1'),
  ('contact', 'contact', false, 'Email address not found', 'test-session-1'),
  ('skills', 'skills', false, 'Missing Python skill', 'test-session-1'),
  ('education-1', 'education', false, 'GPA was wrong', 'test-session-1');
```

### 2. Trigger Analysis Manually

```bash
curl https://your-project.supabase.co/functions/v1/analyze-feedback/analyze-feedback-now
```

### 3. Check Results

```sql
-- View the analysis
SELECT 
  key,
  value->>'feedback_count' as total_feedback,
  value->>'comments_analyzed' as comments,
  value->>'summary' as summary
FROM kv_store_bc1c5df9
WHERE key LIKE 'feedback_analysis_%'
ORDER BY key DESC
LIMIT 1;

-- View keyword categorization
SELECT 
  key,
  jsonb_pretty(value->'keyword_categorization') as categories
FROM kv_store_bc1c5df9
WHERE key LIKE 'feedback_analysis_%'
ORDER BY key DESC
LIMIT 1;

-- View AI recommendations
SELECT 
  key,
  jsonb_pretty(value->'recommendations') as recommendations
FROM kv_store_bc1c5df9
WHERE key LIKE 'feedback_analysis_%'
ORDER BY key DESC
LIMIT 1;
```

### 4. Verify Keyword Detection

The test feedback should be categorized as:
- **dates:** 1 issue ("Missing graduation date")
- **company:** 1 issue ("Wrong company name")
- **contact:** 1 issue ("Email address not found")
- **skills:** 1 issue ("Missing Python skill")
- **education:** 2 issues ("graduation date", "GPA")

### 5. Wait for Cron Execution

- Cron will run at 6 PM PST (2 AM UTC)
- Check logs next day to verify automatic execution
- View results in KV store

## Troubleshooting Setup

### Issue: Function deployment fails

**Error:** `Function name already exists`
**Fix:** Delete existing function first, then redeploy

**Error:** `Missing dependencies`
**Fix:** Ensure all files are uploaded, especially `deno.json` if exists

### Issue: Cron not executing

**Check:**
1. Cron job is **enabled** in dashboard
2. Schedule expression is correct: `0 2 * * *`
3. Function name matches exactly

**Fix:**
- Toggle cron job off and on
- Verify function name: `_cron/feedback-analysis`
- Check function logs for errors

### Issue: OpenAI API errors

**Error:** `OPENAI_API_KEY not configured`
**Fix:** Set environment variable in Edge Functions secrets

**Error:** `OpenAI API error: 401 Unauthorized`
**Fix:** Check API key is valid and not expired

**Error:** `OpenAI API error: 429 Rate Limit`
**Fix:** Upgrade OpenAI plan or reduce analysis frequency

### Issue: No data in KV store

**Check:**
1. Function executed successfully (check logs)
2. Negative feedback exists in last 24 hours
3. Comments are not null/empty

**Debug:**
```sql
-- Check if negative feedback exists
SELECT COUNT(*) as total, 
       COUNT(comment) as with_comments
FROM resume_feedback
WHERE is_positive = false
AND created_at >= NOW() - INTERVAL '24 hours';
```

### Issue: Analysis quality is poor

**Possible causes:**
- Too few feedback items (need at least 5-10)
- Feedback comments are too vague
- Keywords don't match actual issues

**Fix:**
- Wait for more feedback to accumulate
- Update `ISSUE_PATTERNS` in code
- Adjust AI prompt for better analysis

## Next Steps

After successful setup:

1. **Monitor daily executions** - Check logs for first few days
2. **Review analysis results** - Look at stored analyses in KV store
3. **Create admin dashboard** - Build UI to review and apply changes
4. **Test prompt updates** - Apply suggested changes and measure impact
5. **Set up alerts** - Get notified of high-severity issues

## Cost Estimates

### OpenAI API Costs

- Model: `gpt-4o-mini`
- Avg tokens per analysis: ~2,000 input + 1,000 output
- Cost per analysis: ~$0.01 - $0.05
- Daily cost (1 execution): ~$0.01 - $0.05
- Monthly cost: ~$0.30 - $1.50

### Supabase Costs

- Edge Function invocations: Free tier includes 500K/month
- Daily executions: 30-60/month (well within free tier)
- Storage: Minimal (KV store entries are small)

**Total estimated cost: <$2/month**

## Support

If you encounter issues:

1. **Check function logs** in Supabase Dashboard
2. **Review this guide** for common issues
3. **Test manually** using `/analyze-feedback-now` endpoint
4. **Check OpenAI status** at status.openai.com
5. **Verify environment variables** are set correctly

## Summary

✅ **Functions deployed** - analyze-feedback & cron  
✅ **Secrets configured** - OpenAI API key  
✅ **Cron scheduled** - Daily at 6 PM PST  
✅ **Testing complete** - Manual trigger works  
✅ **Monitoring ready** - Logs available  
✅ **Cost-efficient** - <$2/month  

Your automated feedback analysis system is now running! It will analyze user feedback daily and provide actionable insights to improve your resume parsing AI.
