# 🚀 Quick Start: Daily Feedback Analysis

## Deploy in 5 Minutes

### 1. Deploy Functions (2 min)

```bash
# From project root
cd supabase/functions

# Deploy analyzer
supabase functions deploy analyze-feedback

# Deploy cron trigger
supabase functions deploy _cron
```

### 2. Set OpenAI Key (1 min)

**Option A: Dashboard**
- Settings → Edge Functions → Secrets
- Add: `OPENAI_API_KEY = sk-your-key`

**Option B: CLI**
```bash
supabase secrets set OPENAI_API_KEY=sk-your-key
```

### 3. Create Cron Job (1 min)

**Supabase Dashboard:**
- Edge Functions → Cron Jobs → **Create**
- Name: `daily-feedback-analysis`
- Function: `_cron/feedback-analysis`
- Schedule: `0 2 * * *` (6 PM PST)
- Enable: ✅

### 4. Test (1 min)

```bash
# Health check
curl https://YOUR-PROJECT.supabase.co/functions/v1/analyze-feedback/health

# Run analysis now
curl https://YOUR-PROJECT.supabase.co/functions/v1/analyze-feedback/analyze-feedback-now
```

**Expected:**
```json
{
  "success": true,
  "message": "Feedback analysis completed",
  "analysis_id": "feedback_analysis_2025-11-25",
  "feedback_analyzed": 25,
  "comments_analyzed": 20
}
```

## Verify Setup

### Check Results

```sql
-- View latest analysis
SELECT * FROM kv_store_bc1c5df9
WHERE key LIKE 'feedback_analysis_%'
ORDER BY key DESC
LIMIT 1;
```

### View Categories

```sql
-- See keyword categorization
SELECT 
  key,
  jsonb_pretty(value->'keyword_categorization') as categories
FROM kv_store_bc1c5df9
WHERE key LIKE 'feedback_analysis_%'
ORDER BY key DESC
LIMIT 1;
```

## What Happens Next

**6 PM PST Tonight:**
1. ✅ Cron triggers automatically
2. ✅ Analyzes last 24 hours of negative feedback
3. ✅ Categorizes by keywords (dates, skills, contact, etc.)
4. ✅ AI generates recommendations
5. ✅ Stores in KV store with `pending_review` status

**Tomorrow Morning:**
1. Check results in database
2. Review AI recommendations
3. Decide to apply or defer changes

## Quick Reference

### Endpoints

| Endpoint | Purpose | When to Use |
|----------|---------|-------------|
| `/health` | Health check | Verify deployment |
| `/analyze-feedback-now` | Manual trigger | Testing |
| `/analyze-feedback-cron` | Auto-triggered | Daily at 6 PM PST |

### Cron Schedules

| Time | Cron Expression |
|------|----------------|
| 6 PM PST | `0 2 * * *` |
| 5 PM PST | `0 1 * * *` |
| 7 PM PST | `0 3 * * *` |
| Twice daily | `0 2,14 * * *` |

### Issue Categories

Automatically detected:
- 📅 Dates
- 🏢 Company names
- 🛠️ Skills
- 📧 Contact info
- 💼 Job titles
- 📝 Bullet points
- 🔢 Chronological order
- 👤 Names
- 🎓 Education
- 🚀 Projects
- 📜 Certifications
- 🏆 Awards
- ⎵ Whitespace
- 🔁 Duplicates

## Troubleshooting

### ❌ No results?

```sql
-- Check if negative feedback exists
SELECT COUNT(*) FROM resume_feedback
WHERE is_positive = false
AND created_at >= NOW() - INTERVAL '24 hours';
```

If 0: No feedback today (expected)

### ❌ OpenAI error?

- Verify API key is set
- Check key hasn't expired
- Visit status.openai.com

### ❌ Cron not running?

- Verify cron job is **enabled**
- Check function name matches
- Review logs in Edge Functions

## Costs

- **OpenAI:** ~$0.01-$0.05 per day
- **Supabase:** Free tier
- **Total:** <$2/month

## Next Steps

1. ✅ Wait for first analysis tonight
2. ✅ Review results tomorrow
3. ✅ Apply recommended changes
4. ✅ Monitor impact on feedback

## Documentation

- 📘 Full docs: `/docs/FEEDBACK_ANALYSIS_CRON.md`
- 📗 Setup guide: `/docs/SETUP_FEEDBACK_CRON.md`
- 📙 Complete summary: `/FEEDBACK_CRON_COMPLETE.md`

---

**That's it! Your automated feedback analysis system is live.** 🎉

It will analyze user feedback daily and help you continuously improve the resume parsing AI.
