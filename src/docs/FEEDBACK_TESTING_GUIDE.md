# Feedback System Testing Guide

## Quick Test Checklist

### ✅ Test 1: Personal Details Section
1. Navigate to **Personal Details**
2. Scroll to the bottom of the section
3. You should see: "Help us improve AI. Parsed correctly? [👍] [👎]"
4. Click **👍** - Should show "Thank you for your feedback!"
5. Check localStorage: `JSON.parse(localStorage.getItem('aiParsingFeedback'))`
6. Should see entry: `{ section: "personalDetails", is_positive: true, timestamp: ... }`

### ✅ Test 2: Contact Information Section
1. Navigate to **Contact Information**
2. Scroll to the bottom after the Website field
3. Feedback buttons should be visible
4. Click **👎**
5. Dialog should open: "Please tell us what went wrong with the parsing"
6. Enter: "Email was not detected"
7. Submit
8. Should show: "Thank you for helping us improve!"
9. Check localStorage - should see entry with comment field

### ✅ Test 3: Professional Summary Section
1. Navigate to **Professional Summary**
2. Feedback buttons should be below the summary textarea
3. Test both thumbs up and thumbs down
4. Verify feedback is stored with section: "summary"

### ✅ Test 4: Employment History (Multiple Experiences)
1. Navigate to **Employment History**
2. If you have 2 experiences, you should see **2 sets of feedback buttons**
3. Each experience card should have feedback buttons at the bottom
4. Click **👎** on first experience
5. Enter reason: "Job title was incorrect"
6. Submit
7. Check localStorage - should see: `{ section: "experience-[id]", ... }`
8. Click **👍** on second experience
9. Both feedback entries should be stored with different section IDs

### ✅ Test 5: Education (Multiple Educations)
1. Navigate to **Education**
2. If you have 2 education entries, you should see **2 sets of feedback buttons**
3. Each education card should have feedback buttons after the details textarea
4. Test feedback on each education entry separately
5. Verify both are stored with different IDs: `education-[id1]`, `education-[id2]`

### ✅ Test 6: Skills Section
1. Navigate to **Skills**
2. Feedback buttons should be at the bottom
3. Test feedback collection
4. Verify storage with section: "skills"

### ✅ Test 7: Links Section
1. Navigate to **Links**
2. Feedback buttons should be after "Add link" button
3. Test feedback
4. Verify storage with section: "links"

### ✅ Test 8: Custom Sections
1. If you have custom sections (Awards, Publications, etc.)
2. Navigate to a custom section
3. Feedback buttons should be above the "Delete this section" button
4. Test feedback
5. Verify storage with the custom section's unique ID

### ✅ Test 9: Visual Verification
**Check that:**
- ✅ No feedback buttons appear at the bottom of the entire card (centralized location removed)
- ✅ Feedback buttons are inside each section's content area
- ✅ For multi-item sections (experience, education), each item has its own feedback buttons
- ✅ Feedback buttons have proper styling (gray background, rounded border)
- ✅ Active state shows green for thumbs up, red for thumbs down

### ✅ Test 10: Feedback Dialog
1. Click any **👎** button
2. Dialog should open with:
   - Title: "Help us improve AI parsing"
   - Text: "Please tell us what went wrong..."
   - Textarea for input
   - Cancel and Submit buttons
3. Try submitting empty feedback - should show error
4. Enter valid feedback and submit
5. Dialog should close
6. Toast should show: "Thank you for helping us improve!"

## Checking Stored Feedback

Open browser console (F12) and run:

```javascript
// View all feedback
const feedback = JSON.parse(localStorage.getItem('aiParsingFeedback') || '[]');
console.table(feedback);

// Count feedback by is_positive
const positive = feedback.filter(f => f.is_positive).length;
const negative = feedback.filter(f => !f.is_positive).length;
console.log(`Positive: ${positive}, Negative: ${negative}`);

// View feedback by section
const bySect = {};
feedback.forEach(f => {
  bySect[f.section] = (bySect[f.section] || 0) + 1;
});
console.table(bySect);
```

## Expected Feedback Storage Format

```json
[
  {
    "section": "personalDetails",
    "is_positive": true,
    "timestamp": 1732483200000
  },
  {
    "section": "contact",
    "is_positive": false,
    "comment": "Email was not detected correctly",
    "timestamp": 1732483201000
  },
  {
    "section": "summary",
    "is_positive": true,
    "timestamp": 1732483202000
  },
  {
    "section": "experience-exp-1732483100123",
    "is_positive": false,
    "comment": "Job title was parsed incorrectly",
    "timestamp": 1732483203000
  },
  {
    "section": "experience-exp-1732483100456",
    "is_positive": true,
    "timestamp": 1732483204000
  },
  {
    "section": "education-edu-1732483100789",
    "is_positive": true,
    "timestamp": 1732483205000
  },
  {
    "section": "skills",
    "is_positive": true,
    "timestamp": 1732483206000
  },
  {
    "section": "links",
    "is_positive": true,
    "timestamp": 1732483207000
  },
  {
    "section": "custom-1732483150000-0",
    "is_positive": false,
    "comment": "Awards section was not parsed correctly",
    "timestamp": 1732483208000
  }
]
```

## Verifying AI Uses Feedback

After collecting feedback, upload a new resume:

1. **Watch for toast notification**: "Learning from X previous feedback items"
2. **Check console logs**: `📊 Using X previous feedback items to improve parsing`
3. **Check network request**: The parse-resume API call should include feedbackGuidance parameter

Example console output:
```
📊 Using 5 previous feedback items to improve parsing
Success rate: 60.0%
Using feedback guidance: Based on previous feedback, pay special attention to: email parsing (2 reports)
```

## Common Issues

### Issue: Feedback buttons not appearing
- **Check**: Make sure you've navigated to the correct section
- **Check**: Ensure FeedbackButtons component is imported
- **Solution**: Verify all sections have FeedbackButtons added

### Issue: Clicking feedback buttons does nothing
- **Check**: Console for JavaScript errors
- **Check**: Handler functions are receiving sectionId parameter
- **Solution**: Verify handleThumbsUp and handleThumbsDown accept sectionId

### Issue: Feedback stored with wrong section ID
- **Check**: The sectionId being passed to FeedbackButtons
- **For experience**: Should be `experience-${exp.id}`
- **For education**: Should be `education-${edu.id}`
- **For custom**: Should be the custom section's `id`

### Issue: Multiple experience items show same feedback state
- **Check**: Each FeedbackButtons uses unique sectionId
- **Check**: sectionFeedback state key matches the sectionId
- **Solution**: Ensure `experience-${exp.id}` is unique for each experience

## Success Criteria

✅ All sections show feedback buttons in correct locations
✅ Multi-item sections show feedback buttons for EACH item
✅ No centralized feedback section at bottom
✅ Clicking thumbs up stores positive feedback
✅ Clicking thumbs down opens dialog
✅ Dialog requires reason before submitting
✅ Feedback stored in localStorage with correct section IDs
✅ Subsequent resume uploads show "Learning from X feedback items"
✅ Console shows feedback being used in parsing

## Next Steps After Testing

1. **Monitor feedback collection** - Check how many users provide feedback
2. **Analyze feedback patterns** - Use FeedbackViewer component to see common issues
3. **Improve AI prompts** - Based on frequent negative feedback
4. **A/B test improvements** - Compare parsing accuracy before/after changes
5. **Share feedback insights** - Document common issues for AI prompt engineering