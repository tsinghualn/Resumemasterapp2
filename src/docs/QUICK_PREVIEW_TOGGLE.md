# Quick Guide: Collapsible Preview Toggle 🎯

## What Was Added:

A **toggle button** above the resume editor that lets users hide/show the preview panel.

---

## Visual Layout:

### Preview Visible (Default):
```
┌─────┬──────────────────┬─────────┐
│     │  [Hide Preview]  │         │
│ Nav │      Editor      │ Preview │
│ 17% │       50%        │   33%   │
└─────┴──────────────────┴─────────┘
Ratio: 1 : 3 : 2
```

### Preview Hidden:
```
┌─────┬─────────────────────────────┐
│     │     [Show Preview]          │
│ Nav │          Editor             │
│ 17% │           83%               │
└─────┴─────────────────────────────┘
Ratio: 1 : 5 : 0
```

---

## Key Changes:

### 1. New State:
```tsx
const [isPreviewVisible, setIsPreviewVisible] = useState(true);
```

### 2. Toggle Button (above Card):
```tsx
<div className="flex justify-end mb-4">
  <Button
    variant="outline"
    size="sm"
    onClick={() => setIsPreviewVisible(!isPreviewVisible)}
  >
    {isPreviewVisible ? "Hide Preview" : "Show Preview"}
  </Button>
</div>
```

### 3. Dynamic Middle Width:
```tsx
<div className={`${isPreviewVisible ? "flex-[3]" : "flex-[5]"} overflow-auto`}>
```
- Visible: 50% width (flex-[3])
- Hidden: 83% width (flex-[5])

### 4. Conditional Preview:
```tsx
{isPreviewVisible && (
  <div className="flex-[2] ...">
    {/* Preview content */}
  </div>
)}
```

---

## Space Gained:

| Screen | Middle (Visible) | Middle (Hidden) | **Gain** |
|--------|------------------|-----------------|----------|
| 1440px | 560px | 933px | **+373px** |
| 1920px | 752px | 1253px | **+501px** |
| 2560px | 1008px | 1680px | **+672px** |

**Result:** 66% more editing space! 🚀

---

## Button Features:

✅ Right-aligned above editor  
✅ Outline style (subtle, professional)  
✅ Dynamic icon (`PanelRightClose` / `PanelRightOpen`)  
✅ Clear label ("Hide Preview" / "Show Preview")  
✅ Small size (non-intrusive)  

---

## Files Changed:

**`/components/AIRewritePanel.tsx`:**
- Line ~51: Added icon imports (`PanelRightClose`, `PanelRightOpen`)
- Line ~174: Added state (`isPreviewVisible`)
- Line ~1571: Made middle width dynamic
- Line ~1573-1593: Added toggle button
- Line ~2347: Made preview conditional

---

## Testing:

1. Open AI Optimization page ✅
2. See preview visible (1:3:2 ratio) ✅
3. Click "Hide Preview" button ✅
4. Preview disappears, editor expands (1:5:0) ✅
5. Click "Show Preview" button ✅
6. Preview returns, layout restores (1:3:2) ✅

---

## Benefits:

🎯 **User Control** - Toggle anytime  
📏 **More Space** - 83% vs 50% when hidden  
⚡ **Better Performance** - Preview removed from DOM  
✨ **Smooth** - Instant flexbox transition  
👁️ **Clear Feedback** - Icon + label change  

---

## That's It! 🎉

**One button = 66% more editing space when you need it!**
