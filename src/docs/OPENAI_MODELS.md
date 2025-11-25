# OpenAI Models in Your Resume App

## Currently Using

Your application uses **two different OpenAI models** depending on the task:

### 1. **GPT-4o** (Main Resume Parsing)
- **Location:** `/supabase/functions/server/index.tsx` (line 837)
- **Used For:** Resume parsing (extracting structured data from resume text)
- **Why:** Higher accuracy needed for precise data extraction
- **Cost:** ~$2.50 per 1M input tokens, ~$10 per 1M output tokens
- **Typical Usage:** ~2,000 tokens per resume parse = ~$0.02 per parse

### 2. **GPT-4o-mini** (All Other AI Tasks)
- **Locations:** 
  - `/supabase/functions/server/index.tsx` (lines 1729, 1895, 1993)
  - `/supabase/functions/analyze-feedback/index.ts` (line 108)
- **Used For:**
  - Resume optimization/rewriting
  - Job match scoring
  - Feedback analysis
  - Resume improvements
- **Why:** Cost-effective for high-volume operations
- **Cost:** ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
- **Typical Usage:** ~3,000 tokens per optimization = ~$0.002 per operation

## Model Breakdown by Feature

| Feature | Model | Reason | Avg Cost |
|---------|-------|--------|----------|
| **Resume Parsing** | GPT-4o | Accuracy critical | ~$0.02 |
| **Resume Optimization** | GPT-4o-mini | High volume | ~$0.002 |
| **Job Match Scoring** | GPT-4o-mini | Cost-effective | ~$0.002 |
| **Feedback Analysis** | GPT-4o-mini | Daily batch job | ~$0.01 |

## Available OpenAI Models in Figma Make

Figma Make supports all standard OpenAI models that are accessible via the OpenAI API. Here are the recommended options:

### ✅ **Recommended Models**

#### **GPT-4o** (Currently Using for Parsing)
- **Best for:** Structured data extraction, complex reasoning
- **Speed:** Fast (~1-2 seconds for resume parsing)
- **Context:** 128K tokens
- **Cost:** Medium-high ($2.50 in / $10 out per 1M tokens)
- **When to use:** Accuracy is critical (resume parsing, complex analysis)

#### **GPT-4o-mini** (Currently Using for Optimization)
- **Best for:** High-volume operations, general tasks
- **Speed:** Very fast (~1 second for optimizations)
- **Context:** 128K tokens
- **Cost:** Very low ($0.15 in / $0.60 out per 1M tokens)
- **When to use:** Most AI operations, cost-sensitive tasks

### 🎯 **Alternative Models Available**

#### **GPT-4-turbo**
- **Best for:** Complex reasoning, longer outputs
- **Speed:** Medium (~2-3 seconds)
- **Context:** 128K tokens
- **Cost:** High ($10 in / $30 out per 1M tokens)
- **When to use:** When you need maximum quality

#### **GPT-3.5-turbo**
- **Best for:** Simple tasks, legacy support
- **Speed:** Fast
- **Context:** 16K tokens
- **Cost:** Low ($0.50 in / $1.50 out per 1M tokens)
- **When to use:** Very simple operations, testing

## Model Comparison

| Model | Speed | Quality | Cost | Context | Best Use Case |
|-------|-------|---------|------|---------|---------------|
| **GPT-4o** | ⚡⚡⚡ | ⭐⭐⭐⭐⭐ | 💰💰💰 | 128K | Parsing, accuracy-critical |
| **GPT-4o-mini** | ⚡⚡⚡⚡ | ⭐⭐⭐⭐ | 💰 | 128K | Optimization, general AI |
| **GPT-4-turbo** | ⚡⚡ | ⭐⭐⭐⭐⭐ | 💰💰💰💰 | 128K | Complex reasoning |
| **GPT-3.5-turbo** | ⚡⚡⚡⚡ | ⭐⭐⭐ | 💰 | 16K | Simple operations |

## Your Current Cost Breakdown

Based on your current model usage:

### Per User Session (Upload → Optimize → Match)
1. **Resume Parsing** (GPT-4o): ~$0.02
2. **Resume Optimization** (GPT-4o-mini): ~$0.002
3. **Job Match Scoring** (GPT-4o-mini): ~$0.002
4. **Total per session**: ~$0.024

### Daily Operations
- **Feedback Analysis** (GPT-4o-mini): ~$0.01 per day
- **Monthly feedback cost**: ~$0.30

### Monthly Estimates (100 users)
- 100 resume parsing sessions: ~$2.00
- 100 optimizations: ~$0.20
- 100 match scores: ~$0.20
- Daily feedback analysis: ~$0.30
- **Total monthly**: ~$2.70

## Recommendations

### ✅ **Current Setup is Optimal**

Your current model selection is excellent:

1. **GPT-4o for parsing** - Correct choice because:
   - Resume parsing requires high accuracy
   - Structured data extraction is critical
   - Small cost increase worth the quality

2. **GPT-4o-mini for everything else** - Smart because:
   - Resume optimization doesn't need maximum accuracy
   - High volume operations benefit from low cost
   - Quality is still excellent for these tasks

### 💡 **Potential Optimizations**

If you need to reduce costs further:

#### **Option 1: All GPT-4o-mini**
- Switch parsing to GPT-4o-mini
- **Savings:** ~$0.018 per parse
- **Risk:** Slightly lower parsing accuracy
- **Recommendation:** Test first with sample resumes

#### **Option 2: Upgrade to GPT-4-turbo for Critical Tasks**
- Use GPT-4-turbo for complex resumes
- **Cost increase:** ~$0.02 per parse
- **Benefit:** Even better quality for edge cases
- **Recommendation:** Only if accuracy issues occur

## How to Change Models

### In Your Code

**Resume Parsing** (`/supabase/functions/server/index.tsx` line 837):
```typescript
body: JSON.stringify({
  model: 'gpt-4o',  // Change to 'gpt-4o-mini', 'gpt-4-turbo', etc.
  messages: [...]
})
```

**Resume Optimization** (`/supabase/functions/server/index.tsx` line 1729):
```typescript
body: JSON.stringify({
  model: 'gpt-4o-mini',  // Already optimal
  messages: [...]
})
```

**Feedback Analysis** (`/supabase/functions/analyze-feedback/index.ts` line 108):
```typescript
body: JSON.stringify({
  model: 'gpt-4o-mini',  // Already optimal
  messages: [...]
})
```

### Available Model Names

```typescript
// Latest models (recommended)
'gpt-4o'           // Current for parsing
'gpt-4o-mini'      // Current for optimization

// Other options
'gpt-4-turbo'      // Higher quality, slower
'gpt-4'            // Legacy (not recommended)
'gpt-3.5-turbo'    // Budget option
```

## Model Selection Guidelines

### Choose **GPT-4o** when:
- ✅ Extracting structured data (JSON parsing)
- ✅ Accuracy is critical
- ✅ Complex reasoning required
- ✅ Budget allows for quality

### Choose **GPT-4o-mini** when:
- ✅ High-volume operations
- ✅ General AI tasks
- ✅ Cost is a concern
- ✅ Quality is still important but not critical

### Choose **GPT-4-turbo** when:
- ✅ Maximum quality needed
- ✅ Very complex reasoning
- ✅ Long-form outputs
- ✅ Budget is not a constraint

### Choose **GPT-3.5-turbo** when:
- ✅ Simple tasks only
- ✅ Extreme cost sensitivity
- ✅ Testing/development
- ✅ Quality is less important

## Testing Different Models

To test a different model:

1. **Update the model name** in the code
2. **Deploy the function**:
   ```bash
   supabase functions deploy server
   ```
3. **Test with sample resumes**
4. **Compare quality and cost**
5. **Monitor for issues**

### Test Metrics to Track
- ✅ Parsing accuracy (correct field extraction)
- ✅ Optimization quality (resume improvements)
- ✅ Response time (user experience)
- ✅ Cost per operation
- ✅ Error rates

## Summary

**Your Current Setup:**
- ✅ GPT-4o for resume parsing (high accuracy)
- ✅ GPT-4o-mini for optimization, scoring, and feedback (cost-effective)
- ✅ Estimated cost: ~$0.024 per user session
- ✅ **This is an optimal configuration!**

**Available in Figma Make:**
- All OpenAI models accessible via API
- Switch models by changing the `model` parameter
- No restrictions on model selection

**Recommendation:**
- **Keep your current setup** - it's well-optimized
- Only change if you have specific needs:
  - Lower cost → Try GPT-4o-mini for parsing
  - Higher quality → Try GPT-4-turbo for parsing
  - Budget constraints → Use GPT-4o-mini everywhere

Your model selection shows good understanding of the cost/quality tradeoffs! 🎯
