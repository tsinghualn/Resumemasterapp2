# Feedback Buttons Placement Update

## Summary

Feedback buttons have been moved **inside each resume section** instead of being placed centrally at the bottom. This provides more granular feedback for each specific item.

## Changes Made

### 1. **Component Import**
- Added `FeedbackButtons` component import to `AIRewritePanel.tsx`

### 2. **Feedback Button Placement**

#### **Single-Item Sections** (Feedback at bottom of section)
- ✅ **Personal Details** - After all personal detail fields
- ✅ **Contact Information** - After all contact fields
- ✅ **Professional Summary** - After summary textarea
- ✅ **Skills** - After skills textarea
- ✅ **Links** - After "Add link" button

#### **Multi-Item Sections** (Feedback after EACH item)
- ✅ **Employment History** - After description textarea **for each experience**
- ✅ **Education** - After details textarea **for each education**
- ✅ **Custom Sections** - After content textarea **for each custom section**

### 3. **Handler Functions Updated**

**Before:**
```typescript
const handleThumbsUp = () => {
  setSectionFeedback(prev => ({ ...prev, [currentSection]: 'up' }));
  // ... store feedback using currentSection
};

const handleThumbsDown = () => {
  setSectionFeedback(prev => ({ ...prev, [currentSection]: 'down' }));
  setShowFeedbackDialog(true);
};
```

**After:**
```typescript
const handleThumbsUp = (sectionId: string) => {
  setSectionFeedback(prev => ({ ...prev, [sectionId]: 'up' }));
  // ... store feedback using specific sectionId
};

const handleThumbsDown = (sectionId: string) => {
  setSectionFeedback(prev => ({ ...prev, [sectionId]: 'down' }));
  setCurrentFeedbackSection(sectionId);
  setShowFeedbackDialog(true);
};
```

### 4. **Section IDs for Multi-Item Sections**

- **Experience items**: `experience-${exp.id}`
- **Education items**: `education-${edu.id}`
- **Custom sections**: `${section.id}`

### 5. **Centralized Feedback Section Removed**

The old centralized feedback section that appeared at the bottom of the card has been completely removed.

## Visual Example

### Before:
```
┌─────────────────────────────────────┐
│  Professional Summary               │
│  ┌──────────────────────────────┐  │
│  │ [Summary textarea]           │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Employment History                 │
│  ┌──────────────────────────────┐  │
│  │ Experience 1                 │  │
│  │ [Description textarea]       │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │ Experience 2                 │  │
│  │ [Description textarea]       │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Help us improve AI. Parsed correctly?│
│  [👍] [👎]                          │
└─────────────────────────────────────┘
```

### After:
```
┌─────────────────────────────────────┐
│  Professional Summary               │
│  ┌──────────────────────────────┐  │
│  │ [Summary textarea]           │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │ Help us improve AI.          │  │
│  │ Parsed correctly? [👍] [👎]  │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Employment History                 │
│  ┌──────────────────────────────┐  │
│  │ Experience 1                 │  │
│  │ [Description textarea]       │  │
│  │ ┌──────────────────────────┐ │  │
│  │ │ Help us improve AI.      │ │  │
│  │ │ Parsed correctly? [👍] [👎]│ │  │
│  │ └──────────────────────────┘ │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │ Experience 2                 │  │
│  │ [Description textarea]       │  │
│  │ ┌──────────────────────────┐ │  │
│  │ │ Help us improve AI.      │ │  │
│  │ │ Parsed correctly? [👍] [👎]│ │  │
│  │ └──────────────────────────┘ │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
```

## Benefits

1. **More Granular Feedback**: Users can provide feedback for each specific experience or education entry
2. **Better Context**: Feedback is collected right where the user is reviewing the content
3. **Clearer Attribution**: No ambiguity about which item the feedback refers to
4. **Improved UX**: Users don't have to scroll to find the feedback buttons

## Data Storage

Feedback is stored with specific IDs:
```json
[
  {
    "section": "summary",
    "type": "positive",
    "timestamp": 1700000000000
  },
  {
    "section": "experience-exp-123",
    "type": "negative",
    "reason": "Job title was parsed incorrectly",
    "timestamp": 1700000001000
  },
  {
    "section": "education-edu-456",
    "type": "positive",
    "timestamp": 1700000002000
  }
]
```

## Testing

To verify the changes work correctly:

1. **Upload a resume**
2. **Navigate to Professional Summary**
   - You should see feedback buttons at the bottom of the section
3. **Navigate to Employment History**
   - You should see feedback buttons after EACH experience's description
4. **Navigate to Education**
   - You should see feedback buttons after EACH education's details
5. **Click thumbs down** on any section
   - Dialog should open asking for feedback reason
   - Submit feedback and verify it's stored in localStorage
6. **Check localStorage**
   ```javascript
   JSON.parse(localStorage.getItem('aiParsingFeedback'))
   ```
   - You should see feedback with specific section IDs

## Files Modified

- `/components/AIRewritePanel.tsx` - Main changes for feedback placement
- `/components/FeedbackButtons.tsx` - Component used in each section
