# Feedback System - Quick Reference Card

## 📍 Placement Summary

| Section | Location | Multiple Buttons? |
|---------|----------|-------------------|
| Personal Details | Bottom of section | ❌ No (1 button) |
| Contact | Bottom of section | ❌ No (1 button) |
| Summary | After textarea | ❌ No (1 button) |
| **Experience** | **After EACH experience description** | ✅ **Yes (1 per experience)** |
| **Education** | **After EACH education details** | ✅ **Yes (1 per education)** |
| Skills | After textarea | ❌ No (1 button) |
| Links | After "Add link" button | ❌ No (1 button) |
| **Custom Sections** | **Above delete button** | ✅ **Yes (1 per section)** |

## 🔧 Implementation Code

### Single Section
```tsx
<FeedbackButtons
  sectionId="summary"
  currentFeedback={sectionFeedback['summary'] as 'up' | 'down' | undefined}
  onThumbsUp={handleThumbsUp}
  onThumbsDown={handleThumbsDown}
  className="mt-4"
/>
```

### Multi-Item Section (Experience)
```tsx
<FeedbackButtons
  sectionId={`experience-${exp.id}`}
  currentFeedback={sectionFeedback[`experience-${exp.id}`] as 'up' | 'down' | undefined}
  onThumbsUp={handleThumbsUp}
  onThumbsDown={handleThumbsDown}
/>
```

## 💾 Section ID Formats

```typescript
// Simple sections
"personalDetails"
"contact"
"summary"
"skills"
"links"

// Multi-item sections
"experience-exp-1732483100123"
"education-edu-1732483100456"
"custom-1732483150000-0"
```

## 🔄 Handler Functions

```typescript
const handleThumbsUp = (sectionId: string) => {
  setSectionFeedback(prev => ({ ...prev, [sectionId]: 'up' }));
  // ... store in localStorage
};

const handleThumbsDown = (sectionId: string) => {
  setSectionFeedback(prev => ({ ...prev, [sectionId]: 'down' }));
  setCurrentFeedbackSection(sectionId);
  setShowFeedbackDialog(true);
};
```

## 📊 Data Structure

```json
[
  {
    "section": "summary",
    "type": "positive",
    "timestamp": 1732483200000
  },
  {
    "section": "experience-exp-123",
    "type": "negative",
    "reason": "Job title incorrect",
    "timestamp": 1732483201000
  }
]
```

## 🧪 Quick Test

1. Upload resume
2. Go to Employment History
3. Should see feedback buttons after **each** experience
4. Click 👎 on first experience
5. Enter reason, submit
6. Check: `JSON.parse(localStorage.getItem('aiParsingFeedback'))`

## 📚 Documentation Files

- **Overview**: `/docs/FEEDBACK_SYSTEM.md`
- **Implementation**: `/docs/FEEDBACK_IMPLEMENTATION_SUMMARY.md`
- **Testing**: `/docs/FEEDBACK_TESTING_GUIDE.md`
- **Visual Guide**: `/docs/FEEDBACK_VISUAL_GUIDE.md`
- **Placement**: `/docs/FEEDBACK_PLACEMENT_UPDATE.md`

## 🎯 Key Changes

| Item | Before | After |
|------|--------|-------|
| **Location** | Bottom of page (centralized) | Inside each section |
| **Experience** | 1 button for all experiences | 1 button per experience |
| **Education** | 1 button for all education | 1 button per education |
| **Handler** | No parameters | Accepts `sectionId` |
| **Storage** | Current section only | Specific item IDs |

## 🔍 Common Issues

| Issue | Solution |
|-------|----------|
| Buttons not showing | Check FeedbackButtons is imported and placed correctly |
| Same feedback for all items | Ensure unique sectionId for each item |
| Dialog not opening | Verify handleThumbsDown sets currentFeedbackSection |
| Feedback not storing | Check localStorage permissions |

## 🚀 AI Integration

On next resume upload:
```
📊 Using 5 previous feedback items to improve parsing
Success rate: 80.0%
```

Backend receives:
```json
{
  "resumeText": "...",
  "feedbackGuidance": "Based on previous feedback, pay attention to: email parsing (2 reports)"
}
```

## ✅ Success Criteria

- [x] No centralized feedback section
- [x] Feedback in every section
- [x] Multiple buttons for multi-item sections
- [x] Unique IDs for each feedback
- [x] Dialog works for negative feedback
- [x] localStorage stores all feedback
- [x] AI uses feedback on next upload

---

**Quick Check Command:**
```javascript
// Count total feedback
JSON.parse(localStorage.getItem('aiParsingFeedback')||'[]').length

// View all
console.table(JSON.parse(localStorage.getItem('aiParsingFeedback')||'[]'))
```
