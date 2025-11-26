# Quick Test Guide - Preview Toggle 🧪

## 5-Minute Verification Test

---

## Step 1: Open the Page
```
Navigate to: AI Resume Optimization page
```

**Expected:** Page loads with 3 columns visible

---

## Step 2: Check Default State
```
Look at the layout
```

**Expected:**
- ✅ Left navigation visible (~17% width)
- ✅ Middle editor visible (~50% width)  
- ✅ Right preview visible (~33% width)
- ✅ Button above editor says "Hide Preview"
- ✅ Button has a close panel icon (╳)

---

## Step 3: Hide Preview
```
Click: "Hide Preview" button
```

**Expected:**
- ✅ Right preview disappears immediately
- ✅ Middle editor expands to take up space (~83% width)
- ✅ Button changes to "Show Preview"
- ✅ Button icon changes to open panel (▤)
- ✅ No lag or jank
- ✅ No console errors

---

## Step 4: Show Preview
```
Click: "Show Preview" button
```

**Expected:**
- ✅ Right preview reappears immediately
- ✅ Middle editor returns to normal width (~50%)
- ✅ Button changes to "Hide Preview"
- ✅ Button icon changes to close panel (╳)
- ✅ Layout looks the same as Step 2
- ✅ No console errors

---

## Step 5: Rapid Toggle
```
Click the button 5 times quickly
```

**Expected:**
- ✅ Toggles smoothly each time
- ✅ No lag or delay
- ✅ State updates correctly
- ✅ No visual glitches
- ✅ No console errors

---

## ✅ PASS Criteria

All of these must work:
- [ ] Button renders and is clickable
- [ ] Default state shows preview (1:3:2)
- [ ] Hide works (1:5:0 layout)
- [ ] Show works (1:3:2 layout)
- [ ] Toggle is smooth and instant
- [ ] No errors in console

---

## 🎯 Visual Confirmation

### Preview Visible:
```
┌──┬─────────────┬──────┐
│  │ [Hide Prev] │      │
│  │   Editor    │ View │
└──┴─────────────┴──────┘
```

### Preview Hidden:
```
┌──┬────────────────────┐
│  │   [Show Preview]   │
│  │      Editor        │
└──┴────────────────────┘
```

**Notice:** Editor is wider when preview hidden! ✅

---

## 🚨 If Something Fails

### Button doesn't appear:
- Check: Line ~1573-1593 in `/components/AIRewritePanel.tsx`
- Verify: Button code is above the Card

### Preview doesn't hide:
- Check: Line ~2347 in `/components/AIRewritePanel.tsx`
- Verify: `{isPreviewVisible &&` wraps the preview div

### Middle doesn't expand:
- Check: Line ~1571 in `/components/AIRewritePanel.tsx`
- Verify: `className={...isPreviewVisible ? "flex-[3]" : "flex-[5]"...}`

### Console errors:
- Check: Line ~73-74 imports
- Verify: `PanelRightClose` and `PanelRightOpen` imported
- Check: Line ~176 state
- Verify: `isPreviewVisible` state exists

---

## 📊 Quick Measurements

Want to verify space increase? Use browser DevTools:

### With Preview Visible:
```
1. Inspect middle section
2. Note width (should be ~50%)
```

### With Preview Hidden:
```
1. Click "Hide Preview"
2. Inspect middle section again
3. Note new width (should be ~83%)
```

**Calculation:**
```
Increase = (New Width - Old Width) / Old Width
Should be approximately 66%
```

---

## ⏱️ Performance Check

### Toggle Speed:
```
Open Console → Performance tab
Click button multiple times
```

**Expected:**
- Toggle time: < 1ms
- No layout thrashing
- Smooth reflow

---

## 🎉 Test Complete!

If all steps pass:
- ✅ Feature works correctly
- ✅ Ready for production
- ✅ Users will love the extra space!

If any step fails:
- ❌ Review the verification checklist
- ❌ Check code implementation
- ❌ Review documentation

---

## 💡 Pro Tips

### Test Different Sections:
Try hiding/showing preview while on:
- Personal Details
- Experience
- Education
- Skills
- Summary

**All should work the same way!**

### Test While Editing:
1. Start typing in a field
2. Hide preview
3. Keep typing
4. Show preview

**Editing should continue smoothly!**

### Test Auto-save:
1. Edit something
2. Hide preview
3. Wait for auto-save
4. Show preview

**Changes should be saved and visible!**

---

## 🎯 That's It!

**5 simple steps = Full verification!**

If everything passes, you're good to go! 🚀
