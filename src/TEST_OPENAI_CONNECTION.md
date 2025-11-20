# 🧪 OpenAI Connection Test Guide

## Quick Test Checklist

Use this guide to verify your OpenAI integration is working correctly.

### ✅ Pre-Test Checklist

- [ ] OpenAI API key added to Supabase secrets as `OPENAI_API_KEY`
- [ ] API key has available credits (check at platform.openai.com/settings/organization/billing)
- [ ] API key starts with `sk-`
- [ ] Backend is deployed and running

---

## Test 1: System Status Check (30 seconds)

### Steps:
1. Open the resume app
2. Look at the navigation bar
3. Find the "Backend" and "AI" status badges

### Expected Result:
- ✅ Backend: **Green "Online"** badge
- ✅ AI: **Green "Ready"** badge with sparkle icon

### If Failed:
- **Backend Offline**: Check Supabase functions are deployed
- **AI Not Configured**: Upload your API key via environment variables
- **AI Error**: Hover over badge to see error message

---

## Test 2: AI Diagnostic Test (1 minute)

### Steps:
1. Click the **"Test AI"** button in the navigation bar
2. A dialog will open titled "AI Connection Diagnostics"
3. Click **"Test Connection"** button
4. Wait for the test to complete (5-10 seconds)

### Expected Result:
```
✅ Success! OpenAI API is working correctly.

Test used: Professional tone with Balanced style

[View optimized test response] (dropdown shows AI-generated text)
[View AI suggestions] (dropdown shows suggestion list)
```

### If Failed - Quota Error:
```
❌ Error: OpenAI API quota exceeded

💳 Quota Issue Detected:
1. Visit OpenAI Billing Settings
2. Add credits to your OpenAI account ($5-10 recommended)
3. Wait 1-2 minutes for the credits to be available
4. Click "Test Connection" again to verify
```

**Action**: Follow the steps to add credits, then retest

### If Failed - API Key Error:
```
❌ Error: OpenAI API key not configured...

To fix this:
1. Make sure you've added your OpenAI API key via the Supabase secrets modal
2. Your API key should start with "sk-"
3. Wait a few seconds after adding the key, then refresh and try again
```

**Action**: Add or verify your API key, then retest

---

## Test 3: Full Integration Test (2-3 minutes)

### Steps:

**Part A: Upload Resume**
1. Click **"Upload Resume"** or **"Start from Scratch"**
2. If uploading, select a PDF/DOC resume
3. If from scratch, enter basic resume information
4. Proceed to the next step

**Part B: Add Job Description**
1. Enter or paste a job description (sample below if needed)
2. Click **"Continue"** or **"Next"**

**Sample Job Description** (if needed):
```
Senior Software Engineer
- 5+ years experience in full-stack development
- Proficiency in React, Node.js, and AWS
- Strong leadership and mentoring skills
- Experience with agile methodologies
```

**Part C: AI Optimization**
1. You should see the "AI Resume Optimization" panel
2. Select an **Industry Tone**: Professional / Creative / Technical / Executive
3. Select a **Rewrite Style**: Concise / Detailed / Balanced / Achievement-Focused
4. Click **"Optimize with AI"** or **"Regenerate All"**
5. Wait for optimization (10-30 seconds)

### Expected Result:
- ✅ Toast notification: **"Resume optimized with AI!"**
  - Description shows selected tone and style
- ✅ Sections show optimized content (different from original)
- ✅ Each section has AI-generated suggestions
- ✅ You can accept, regenerate, or edit sections
- ✅ Console shows: `✅ AI optimization successful`

### If Using Fallback Mode:
- ⚠️ Toast notification: **"AI optimization unavailable. Using fallback optimization."**
- ⚠️ Console shows: `❌ Error optimizing section...`

**This means**: Your API is not working. Go back to Test 1 and Test 2 to diagnose.

---

## Test 4: Job Match Analysis (1 minute)

### Steps:
1. Continue from the optimization step
2. Click **"Next"** or navigate to "Job Match Score"
3. Wait for the AI analysis (5-10 seconds)

### Expected Result:
- ✅ Toast notification: **"AI match analysis complete!"**
- ✅ Overall match score displayed (e.g., 87%)
- ✅ Category breakdown shows:
  - Skills Match
  - Experience Level
  - Keywords
  - Qualifications
- ✅ AI-generated strengths, gaps, and recommendations
- ✅ Console shows: `✅ AI match analysis successful`

### If Using Fallback Mode:
- ⚠️ Toast notification: **"Match analysis complete (using fallback method)"**
- ⚠️ Description: "AI analysis unavailable"

**This means**: Your API is not working. Go back to Test 1 and Test 2 to diagnose.

---

## Test 5: Different Tone/Style Combinations (Optional - 5 minutes)

### Steps:
1. Go back to the optimization panel
2. Try different combinations:
   - **Professional + Concise**: Formal and brief
   - **Creative + Detailed**: Innovative and comprehensive
   - **Technical + Achievement-Focused**: Precise and results-driven
   - **Executive + Balanced**: Strategic with moderate detail
3. Click **"Regenerate All"** for each combination
4. Compare the outputs

### Expected Result:
- ✅ Each combination produces different optimized content
- ✅ Content matches the selected tone and style
- ✅ Professional: Formal language
- ✅ Creative: Dynamic and unique phrasing
- ✅ Technical: Specific methodologies and metrics
- ✅ Executive: Strategic and high-level focus

---

## Console Monitoring

### Open Browser Console (F12)

#### Successful Connection - Look For:
```
✅ API key found, optimizing section: [section] with tone: [tone], style: [style]
✅ AI optimization successful
✅ AI match analysis successful
```

#### Failed Connection - Look For:
```
❌ OpenAI API error: { error: { ... } }
❌ Error optimizing section [name]: [error message]
⚠️ OpenAI Quota Exceeded: ...
⚠️ API Key Issue: ...
```

---

## Common Issues & Solutions

### Issue: "AI: Error" Badge
**Cause**: API call failed
**Solution**: 
1. Click the refresh button next to status badges
2. Check console for specific error
3. Follow error-specific instructions

### Issue: "Quota Exceeded" Error
**Cause**: No credits in OpenAI account
**Solution**:
1. Visit https://platform.openai.com/settings/organization/billing
2. Add $5-10 in credits
3. Wait 1-2 minutes
4. Run Test 2 again

### Issue: Fallback Optimization (No AI)
**Cause**: API not responding correctly
**Solution**:
1. Run Test 1 to check system status
2. Run Test 2 for detailed diagnostic
3. Check console logs for error messages
4. Verify API key is correct and has credits

### Issue: "Network Error" or "Failed to Fetch"
**Cause**: Backend connection issue
**Solution**:
1. Check if Supabase functions are deployed
2. Verify `projectId` in `/utils/supabase/info.tsx`
3. Check browser network tab for 400/500 errors
4. Try refreshing the page

---

## Success Criteria

### ✅ All Tests Passed If:
- [x] System Status shows Backend: Online, AI: Ready
- [x] AI Diagnostic Test returns success with optimized text
- [x] Full integration produces AI-optimized resume sections
- [x] Job match analysis uses AI (not fallback)
- [x] Different tone/style combinations produce varied results
- [x] Console shows `✅ AI optimization successful`

### 🎉 Congratulations!
Your OpenAI integration is **fully operational** and ready for production use!

---

## Cost Tracking

After testing, check your OpenAI usage:
1. Go to https://platform.openai.com/usage
2. View recent API calls
3. Monitor costs (should be very minimal for testing)

**Typical Test Costs**: $0.05-0.15 total

---

## Need Help?

If tests continue to fail:
1. Review `/OPENAI_INTEGRATION.md` for detailed integration info
2. Check OpenAI status at https://status.openai.com
3. Verify your API key at https://platform.openai.com/api-keys
4. Check Supabase logs for backend errors

---

**Last Updated**: Ready for testing with proper API key and credits
