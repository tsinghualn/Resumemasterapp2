# Indent Button Debugging Guide

## Enhanced Debugging System

I've added comprehensive logging throughout the system to help diagnose exactly what's happening when you use the "Increase Indent" button.

## How to Debug

### Step 1: Open Browser Console
1. Open the app in your browser
2. Press `F12` or right-click → "Inspect"
3. Go to the "Console" tab

### Step 2: Use the Indent Button
1. Type some text in the Summary or Experience section
2. Select the text
3. Click the "Increase Indent" button
4. Watch the console logs

### Step 3: Review the Logs

You should see detailed logs like this:

```
=== RICH TEXT EDITOR ===
Not in list, creating list first...
List created, now indenting...
Indent command result: true
After indent, captured content: <ul><li><ul><li>Your text here</li></ul></li></ul>
Content verified, calling onChange

=== processHTMLWithNesting START ===
Input HTML: <ul><li><ul><li>Your text here</li></ul></li></ul>
Detected list tags, using parseHTMLLists

=== PARSING HTML LISTS ===
Processing LI at indent 0...
  Processing nested list with 1 items
  Processing LI at indent 1...
  Adding content: Your text here at indent 1
=== PARSING COMPLETE ===
Processed items: [{type: 'bullet', content: 'Your text here', indent: 1, bulletStyle: 'hollow'}]

📄 SUMMARY PREVIEW - Raw HTML: <ul><li><ul><li>Your text here</li></ul></li></ul>
📄 SUMMARY PREVIEW - Processed items: [{...}]
📄 SUMMARY PREVIEW - Item count: 1
✅ Rendering item 0: {type: 'bullet', indent: 1, contentLength: 15, contentPreview: 'Your text here'}
```

## What Each Section Tells You

### 🔧 **RichTextEditor Logs**
- **"Not in list, creating list first"** - Text wasn't in a list, so creating one
- **"Indent command result: true"** - Browser successfully executed indent command
- **"After indent, captured content"** - Shows the HTML structure created
- **"Content verified, calling onChange"** - Content has text, proceeding to save

### 🔍 **HTML Processor Logs**
- **"processHTMLWithNesting START"** - Starting to process HTML
- **"Detected list tags"** - Found `<ul>` or `<ol>` tags
- **"parseHTMLLists result"** - Array of processed items

### 📊 **Preview Logs**
- **"SUMMARY PREVIEW - Raw HTML"** - What HTML the preview received
- **"SUMMARY PREVIEW - Processed items"** - What the parser extracted
- **"Item count"** - How many items to render
- **"Rendering item X"** - Details about each item being displayed

## Common Issues & Solutions

### Issue 1: "Content is empty after indent!"
**Symptoms:** Error message in console
**Cause:** Timeout too short, DOM hasn't updated
**Solution:** Already fixed - increased timeout to 100ms

### Issue 2: "Processed items: []" (empty array)
**Symptoms:** Parser returns no items
**Possible Causes:**
1. HTML structure not recognized
2. Content is in blockquote or styled div
3. Browser created unexpected structure

**What to Check:**
```javascript
// Look for the raw HTML in logs
📄 SUMMARY PREVIEW - Raw HTML: ???
```

**If you see blockquote:**
```html
<blockquote>Your text</blockquote>
```
✅ Already handled - new code detects blockquote and extracts with indent level 1

**If you see div with margin:**
```html
<div style="margin-left: 40px;">Your text</div>
```
✅ Already handled - code extracts margin-left value and calculates indent

### Issue 3: "Skipping empty item in preview"
**Symptoms:** Warning about empty items
**Cause:** Parser added item with no content
**Solution:** Parser now filters out empty items before adding

### Issue 4: Text appears in editor but not in preview
**Symptoms:** Text visible on left, missing on right
**Possible Causes:**

1. **Content filtered out** - Check for:
   ```
   ⚠️ Skipping empty item in preview: {content: "", ...}
   ```

2. **Not being processed** - Check if:
   ```
   Item count: 0
   ```

3. **Wrong HTML structure** - Check raw HTML:
   ```
   📄 SUMMARY PREVIEW - Raw HTML: <div>...</div>
   ```

## Testing Different Scenarios

### Test 1: Plain Text → Indent
```
1. Type: "This is a test"
2. Select all
3. Click Indent
4. Expected HTML: <ul><li><ul><li>This is a test</li></ul></li></ul>
5. Expected indent: 1
6. Expected bullet: ○ (hollow)
```

### Test 2: Bullet List → Indent
```
1. Type: "Test"
2. Click "Bullet List"
3. Click Indent
4. Expected HTML: <ul><li><ul><li>Test</li></ul></li></ul>
5. Expected indent: 1
6. Expected bullet: ○ (hollow)
```

### Test 3: Multiple Lines → Indent
```
1. Type several lines with bullets
2. Select all
3. Click Indent
4. All should shift right by 24px
```

## Enhanced Features

### ✅ Blockquote Detection
If browser creates `<blockquote>`, the parser will:
- Detect it automatically
- Extract content with indent = 1
- Display with 24px margin

### ✅ Styled Div Detection
If browser creates `<div style="margin-left: 40px;">`, the parser will:
- Extract margin-left value
- Calculate indent level (40px = 1 level)
- Display with appropriate margin

### ✅ Nested List Detection
Standard nested list structure is fully supported:
```html
<ul>
  <li>Main item
    <ul>
      <li>Sub item</li>
    </ul>
  </li>
</ul>
```

## Manual Testing Checklist

Use this checklist to test the indent button:

- [ ] **Plain text indent**
  - Type text → Select → Click Indent
  - ✓ Text visible in editor
  - ✓ Text visible in preview with indentation
  - ✓ Console shows parsed items

- [ ] **Bullet list indent**
  - Create bullet → Click Indent
  - ✓ Bullet changes from • to ○
  - ✓ Indentation increases by 24px
  - ✓ No empty items in console

- [ ] **Multiple indent levels**
  - Indent once → Indent again
  - ✓ Each click increases indent
  - ✓ Bullet style changes (• → ○ → □)
  - ✓ Margin increases (0 → 24px → 48px)

- [ ] **Mixed content**
  - Some bullets, some text
  - ✓ All content preserved
  - ✓ Indentation applies to all
  - ✓ No content lost

## Advanced Debugging

### Check HTML Structure
```javascript
// In console, after clicking indent:
const editor = document.querySelector('[contenteditable]');
console.log('Editor HTML:', editor.innerHTML);
```

### Check Preview Rendering
```javascript
// Look for rendered items
const previewItems = document.querySelectorAll('.flex.items-start.gap-2');
console.log('Preview items count:', previewItems.length);
```

### Force Re-render
If preview doesn't update, try:
1. Click elsewhere in the editor
2. Click back
3. Preview should refresh

## If Problem Persists

### Collect This Information:

1. **Browser & Version:**
   - Chrome 120+
   - Firefox 120+
   - Safari 17+
   - Edge 120+

2. **Console Logs:**
   ```
   Copy all logs from:
   === processHTMLWithNesting START ===
   to
   === PARSING COMPLETE ===
   ```

3. **HTML Before/After:**
   ```
   Raw HTML: <before>
   After indent: <after>
   ```

4. **Processed Items:**
   ```
   Processed items: [...]
   Item count: X
   ```

5. **Visual Result:**
   - Screenshot of editor (left side)
   - Screenshot of preview (right side)

## Code Changes Summary

### Files Modified:
1. ✅ `/utils/htmlBulletProcessor.ts`
   - Added comprehensive logging
   - Enhanced blockquote detection
   - Added margin-left extraction
   - Improved indent calculation

2. ✅ `/components/AIRewritePanel.tsx`
   - Added preview logging
   - Enhanced empty item filtering
   - Better debugging output

3. ✅ `/components/RichTextEditor.tsx`
   - Increased timeouts (100ms)
   - Added content verification
   - Better error logging

## Next Steps

With all this logging in place, you should be able to see exactly what's happening at each step. If text still doesn't appear in the preview:

1. **Check the console logs** - They'll tell you exactly where the problem is
2. **Look for "Skipping empty item"** - This means content is empty
3. **Check "Raw HTML"** - See what structure was created
4. **Verify "Processed items"** - See if parsing worked
5. **Look for "Rendering item"** - See if rendering happened

The comprehensive logging will pinpoint the exact issue! 🎯
