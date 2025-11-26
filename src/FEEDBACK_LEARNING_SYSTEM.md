# Feedback Learning System - Resume Parsing Improvement

## 🎯 Overview

The **Feedback Learning System** is a comprehensive solution that uses user feedback to continuously improve resume parsing accuracy. The system creates a closed-loop learning cycle: collect feedback → analyze patterns → generate improvements → apply to parsing → measure results.

## 🔄 The Learning Cycle

```
┌─────────────────┐
│  User Uploads   │
│     Resume      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  AI Parsing     │◄───────────────┐
│  with Guidance  │                │
└────────┬────────┘                │
         │                         │
         ▼                         │
┌─────────────────┐                │
│  User Reviews   │                │
│  & Provides     │                │
│   Feedback 👍👎  │                │
└────────┬────────┘                │
         │                         │
         ▼                         │
┌─────────────────┐                │
│ Daily Analysis  │                │
│  (6 PM PST)     │                │
│   - Categorize  │                │
│   - Identify    │                │
│   - Recommend   │                │
└────────┬────────┘                │
         │                         │
         ▼                         │
┌─────────────────┐                │
│  Generate       │                │
│  Parsing        │                │
│  Guidance       │                │
└────────┬────────┘                │
         │                         │
         ▼                         │
┌─────────────────┐                │
│  Auto-Apply     │                │
│  Improvements   │────────────────┘
│  to Future      │
│  Parsing        │
└─────────────────┘
```

## 📂 System Components

### 1. Feedback Guidance Generator (`feedbackGuidanceGenerator.ts`)

**Purpose**: Converts analyzed feedback into actionable parsing instructions.

**Key Functions**:
- `generateParsingGuidance()` - Creates structured guidance from analyses
- `getRecentFeedbackAnalyses()` - Retrieves recent feedback analyses (last 7 days)
- `createConciseGuidance()` - Creates token-efficient guidance for prompts
- `calculateImprovementMetrics()` - Measures parsing improvement over time

**How It Works**:
```typescript
// Get recent analyses
const analyses = await getRecentFeedbackAnalyses(supabase, 7);

// Generate guidance
const guidance = generateParsingGuidance(analyses, 'medium');

// guidance.guidance_text contains formatted instructions
// guidance.priority_areas lists problem categories
// guidance.specific_instructions has actionable fixes
```

**Example Output**:
```
🔍 COMMON USER-REPORTED ISSUES (fix these first):

🔴 **DATES** (15 issues reported)
   • Always extract dates in MM/YYYY format
   • Look for "Present", "Current" for ongoing positions
   Example issue: "Missing end date for current job"

🟡 **COMPANY** (8 issues reported)
   • Extract full company name, not abbreviations
   • Include location if present
```

### 2. Auto-Applied Learning (Server Endpoint)

**Location**: `/src/supabase/functions/server/index.tsx`

**Modified Endpoint**: `POST /make-server-bc1c5df9/parse-resume`

**What Changed**:
```typescript
// Before: Manual guidance only
const { resumeText, feedbackGuidance } = await c.req.json();

// After: Auto-fetches and applies recent feedback
const { resumeText, feedbackGuidance: manualGuidance } = await c.req.json();

// System now:
// 1. Fetches last 7 days of feedback analyses
// 2. Aggregates common issues
// 3. Generates guidance automatically
// 4. Injects into parsing prompt
```

**Process Flow**:
1. User uploads resume → parsing endpoint called
2. System queries `kv_store` for recent feedback analyses
3. Aggregates issues by category and severity
4. Builds guidance text with top 5 issues
5. Injects guidance into OpenAI system prompt
6. Resume parsed with enhanced instructions
7. Better results returned to user

### 3. Improvement Tracking Endpoints

#### `GET /make-server-bc1c5df9/improvement-metrics`
Returns historical improvement metrics showing success rate changes.

**Response**:
```json
{
  "success": true,
  "metrics": [
    {
      "date": "2025-11-20",
      "before_application": {
        "total_feedback": 45,
        "negative_feedback": 12,
        "success_rate": 73.33
      },
      "after_application": {
        "total_feedback": 52,
        "negative_feedback": 8,
        "success_rate": 84.62
      },
      "improvement_percentage": 11.29,
      "calculated_at": "2025-11-25T10:00:00Z"
    }
  ]
}
```

#### `POST /make-server-bc1c5df9/calculate-improvement`
Calculates current improvement based on before/after feedback.

**Request**:
```json
{
  "daysBack": 7
}
```

**Process**:
1. Gets last guidance application date
2. Fetches feedback N days before guidance
3. Fetches feedback N days after guidance
4. Compares success rates
5. Stores metrics in KV store

#### `GET /make-server-bc1c5df9/feedback-stats`
Returns overall feedback statistics.

**Query Parameters**:
- `daysBack` (default: 30) - How many days to analyze

**Response**:
```json
{
  "success": true,
  "stats": {
    "total": 150,
    "positive": 125,
    "negative": 25,
    "success_rate": 83.33,
    "by_section": {
      "experience": {
        "total": 60,
        "positive": 52,
        "negative": 8,
        "success_rate": 86.67
      },
      "education": {
        "total": 40,
        "positive": 35,
        "negative": 5,
        "success_rate": 87.5
      }
    }
  }
}
```

### 4. Admin Review System

#### `GET /make-server-bc1c5df9/admin/pending-analyses`
Lists all feedback analyses awaiting review.

**Authentication**: Requires admin user token

**Response**:
```json
{
  "success": true,
  "analyses": [
    {
      "id": "feedback_analysis_2025-11-25",
      "analysis_date": "2025-11-25T18:00:00Z",
      "feedback_count": 15,
      "comments_analyzed": 12,
      "common_issues": [...],
      "recommendations": [...],
      "summary": "Main issues: date parsing (8), company names (5)",
      "status": "pending_review"
    }
  ]
}
```

#### `POST /make-server-bc1c5df9/admin/review-analysis`
Review and approve/reject/apply an analysis.

**Request**:
```json
{
  "analysisId": "feedback_analysis_2025-11-25",
  "action": "apply",  // or "approve" or "reject"
  "notes": "Applied improvements for date parsing"
}
```

**Actions**:
- **approve**: Mark as approved (manual application later)
- **reject**: Mark as rejected (won't be used)
- **apply**: Mark as applied + record application time (for metrics)

### 5. Feedback Learning Dashboard

**Location**: `/src/components/FeedbackLearningDashboard.tsx`

**Features**:
- 📊 Overall parsing accuracy statistics
- 📋 Section-by-section breakdown
- 📈 Improvement tracking over time
- ⏳ Pending analyses for admin review
- 🤖 "How it works" explanation

**Usage**:
```tsx
import { FeedbackLearningDashboard } from './components/FeedbackLearningDashboard';

// In your admin panel or dashboard
<FeedbackLearningDashboard />
```

## 🔧 Setup & Configuration

### 1. Database Tables

The system uses the following tables:
- `resume_feedback` - Stores user feedback (👍👎 + comments)
- `feedback_analyses` - Stores daily analysis results (including counts + examples of positive feedback)
- `analysis_common_issues` - Stores categorized issues from each analysis
- `analysis_recommendations` - Stores AI-generated recommendations
- `improvement_metrics` - Tracks improvement over time
- `parsing_guidance` - Stores generated parsing guidance

### 2. Cron Job

Daily analysis runs at 6 PM PST:
- Location: `/supabase/functions/_cron/feedback-analysis.ts`
- Frequency: Daily
- Action: Analyzes last 24 hours of negative feedback

### 3. Environment Variables

Required:
- `OPENAI_API_KEY` - For analysis and parsing
- `SUPABASE_URL` - Database connection
- `SUPABASE_SERVICE_ROLE_KEY` - Database access

## 📊 Data Flow

### Feedback Collection
```sql
-- User provides feedback
INSERT INTO resume_feedback (
  section_id,
  section_type,
  is_positive,
  comment,
  parsed_content,
  original_text
) VALUES (...);
```

### Daily Analysis
```sql
-- Fetch all feedback (positive + negative) from the last 24 hours
SELECT * FROM resume_feedback
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Analyze with AI and store results
INSERT INTO feedback_analyses (
  analysis_date,
  feedback_count,
  comments_analyzed,
  summary,
  status,
  positive_feedback_count,
  positive_examples
) VALUES (
  '2025-11-25',
  15,
  12,
  'Main issues: date parsing, company names',
  'pending_review',
  4,
  ARRAY['Contacts stayed intact', 'Dates interpreted correctly', 'Experience sections preserved', 'Recognized skill keywords']
)
RETURNING id;

-- Store common issues
INSERT INTO analysis_common_issues (analysis_id, category, count, severity, keywords, examples)
VALUES 
  ('uuid-here', 'dates', 8, 'high', ARRAY['missing date', 'wrong date'], ARRAY['Date was wrong']),
  ('uuid-here', 'company', 5, 'medium', ARRAY['wrong company'], ARRAY['Company name incorrect']);

-- Store recommendations
INSERT INTO analysis_recommendations (analysis_id, issue, current_problem, suggested_fix)
VALUES ('uuid-here', 'Date parsing', 'Dates not extracted correctly', 'Always use MM/YYYY format');
```

### Auto-Application
```sql
-- Fetch recent analyses with joined data
SELECT 
  fa.*,
  aci.category, aci.count, aci.severity, aci.examples,
  ar.issue, ar.suggested_fix
FROM feedback_analyses fa
LEFT JOIN analysis_common_issues aci ON fa.id = aci.analysis_id
LEFT JOIN analysis_recommendations ar ON fa.id = ar.analysis_id
WHERE fa.analysis_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY fa.analysis_date DESC;

-- Generate guidance and inject into parsing prompt
```

### Metrics Tracking
```sql
-- Calculate improvement and store metrics
INSERT INTO improvement_metrics (
  date_measured, guidance_applied_date,
  before_total_feedback, before_negative_feedback, before_success_rate,
  after_total_feedback, after_negative_feedback, after_success_rate,
  improvement_percentage
) VALUES (
  '2025-11-25', '2025-11-20',
  45, 12, 73.33,
  52, 8, 84.62,
  11.29
);
```

### Feedback Analysis Layers

- **Real-time-guidance layer** – `generateGuidanceFromRawFeedback()` pulls the last N days of raw negative feedback directly from `resume_feedback` whenever guidance is needed (e.g., when a parse request arrives). It categorizes keywords on the fly and creates instant guidance without waiting for the nightly job.
- **Daily batch-analysis layer** – the cron job (and now `/make-server-bc1c5df9/run-feedback-analysis`) runs once per day, stores structured analyses (including positive counts/examples) in `feedback_analyses`, and feeds the admin dashboard/improvement metrics. This layer gives a curated, auditable version of the same insights that power the long-term learning pipeline.


## 🎯 Usage Examples

### For Developers

**1. Access Feedback Stats**:
```typescript
const response = await fetch('/make-server-bc1c5df9/feedback-stats?daysBack=30');
const data = await response.json();
console.log(`Success rate: ${data.stats.success_rate}%`);
```

**2. Calculate Improvement**:
```typescript
const response = await fetch('/make-server-bc1c5df9/calculate-improvement', {
  method: 'POST',
  body: JSON.stringify({ daysBack: 7 })
});
const data = await response.json();
console.log(`Improvement: ${data.metrics.improvement_percentage}%`);
```

**3. Review Analysis (Admin)**:
```typescript
const response = await fetch('/make-server-bc1c5df9/admin/review-analysis', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    analysisId: 'feedback_analysis_2025-11-25',
    action: 'apply',
    notes: 'Applied date parsing improvements'
  })
});
```

### For Admins

**View Dashboard**:
1. Navigate to admin panel
2. Open "Feedback Learning" section
3. View current statistics and pending reviews
4. Review and apply improvements

**Manual Trigger Analysis**:
```bash
curl -X POST https://your-domain.com/make-server-bc1c5df9/analyze-feedback-now
```

## 📈 Measuring Success

### Key Metrics

1. **Overall Success Rate**: `(positive feedback / total feedback) × 100`
2. **Improvement Rate**: `after_success_rate - before_success_rate`
3. **Section Accuracy**: Success rate per resume section
4. **Issue Resolution**: Reduction in specific issue categories

### Example Success Story

```
Before Applying Feedback:
- Total Feedback: 100
- Negative: 25
- Success Rate: 75%
- Common Issue: Date parsing (15 reports)

Feedback Analysis Generated:
- "Always extract dates in MM/YYYY format"
- "Look for 'Present' or 'Current' for ongoing positions"
- "Parse date ranges like '2020-2023' correctly"

After Applying Feedback:
- Total Feedback: 110
- Negative: 12
- Success Rate: 89.1%
- Date Issues: 3 reports (80% reduction)

🎉 Improvement: +14.1% success rate
```

## 🔍 Monitoring & Debugging

### Check if Guidance is Being Applied

```typescript
// In server logs during parsing
console.log('📊 Using feedback guidance (234 chars)');
// If you see this, guidance is being applied
```

### View Current Guidance

```typescript
const response = await fetch('/make-server-bc1c5df9/admin/pending-analyses');
const data = await response.json();
// Check the latest analysis and its recommendations
```

### Track Specific Issue Resolution

```sql
-- Count specific issue mentions before/after guidance
SELECT COUNT(*) FROM resume_feedback
WHERE comment LIKE '%date%'
AND is_positive = false
AND created_at BETWEEN ? AND ?;
```

## 🚀 Future Enhancements

1. **Real-time Learning**: Apply guidance after every N feedbacks (not just daily)
2. **A/B Testing**: Test different guidance approaches
3. **User-Specific Learning**: Personalize parsing based on user history
4. **Confidence Scoring**: Weight guidance by feedback volume
5. **Automatic Rollback**: Revert changes if success rate drops
6. **Visualization**: Charts showing improvement over time
7. **Email Alerts**: Notify admins of major issues or improvements

## 📝 API Reference

### Endpoints Summary

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/parse-resume` | POST | No | Parse resume with auto-applied guidance |
| `/feedback-stats` | GET | No | Get overall feedback statistics |
| `/improvement-metrics` | GET | No | Get historical improvement data |
| `/calculate-improvement` | POST | No | Calculate current improvement |
| `/admin/pending-analyses` | GET | Yes | Get analyses awaiting review |
| `/admin/review-analysis` | POST | Yes | Approve/reject/apply analysis |

## 🎓 Best Practices

1. **Review Regularly**: Check pending analyses weekly
2. **Apply Gradually**: Apply high-severity issues first
3. **Monitor Impact**: Track success rates after applying changes
4. **Document Changes**: Use review notes to track what was applied
5. **User Communication**: Let users know their feedback is improving the system
6. **Quality Over Quantity**: Prefer well-documented feedback over volume

## ❓ Troubleshooting

**Q: Guidance not being applied to parsing?**
- Check server logs for "Using feedback guidance"
- Verify analyses exist in `feedback_analyses` table
- Ensure analyses are within last 7 days

**Q: No improvement showing?**
- Verify enough feedback collected (minimum 20 before, 20 after)
- Check if guidance was actually applied
- Review specific issue categories - some may improve, others not

**Q: How to force immediate application?**
- Call `POST /admin/review-analysis` with action='apply'
- This marks the guidance as applied immediately

**Q: Can I customize the guidance generation?**
- Yes! Edit `feedbackGuidanceGenerator.ts`
- Adjust `minSeverity`, `daysBack`, or categorization logic

## 🔗 Related Documentation

- [Feedback System Overview](./FEEDBACK_SYSTEM.md)
- [Feedback Analysis Cron](./FEEDBACK_ANALYSIS_CRON.md)
- [Resume Parsing Architecture](./PARSING_ARCHITECTURE.md)

---

**Last Updated**: November 25, 2025  
**Version**: 1.0  
**Maintained By**: Development Team

