# Quick Reference: 1:3:2 Fixed Ratio Layout 🎯

## The Change:

All three columns now use **flex ratios** instead of fixed widths.

---

## Visual Layout:

```
┌──────────┬────────────────────────────────┬────────────────────┐
│          │                                │                    │
│   Left   │          Middle                │       Right        │
│   Nav    │          Editor                │      Preview       │
│          │                                │                    │
│  flex-1  │         flex-[3]               │      flex-[2]      │
│          │                                │                    │
│  16.67%  │           50%                  │      33.33%        │
│          │                                │                    │
└──────────┴────────────────────────────────┴────────────────────┘

Ratio: 1 : 3 : 2
```

---

## Code Changes:

### 1. Left Sidebar (was w-72):
```tsx
<div className="flex-1 bg-white border-r">
```
**Percentage:** 1/6 = **16.67%**

### 2. Middle Editor (was flex-[1.3]):
```tsx
<div className="flex-[3] overflow-auto">
```
**Percentage:** 3/6 = **50%**

### 3. Right Preview (was flex-1 with min/max):
```tsx
<div className="flex-[2] bg-gray-50 border-l overflow-auto">
```
**Percentage:** 2/6 = **33.33%**

---

## Width Examples:

| Screen | Left (17%) | Middle (50%) | Right (33%) |
|--------|------------|--------------|-------------|
| 1440px | 187px | 560px | 373px |
| 1920px | 251px | 752px | 501px |
| 2560px | 336px | 1008px | 672px |
| 3840px | 507px | 1520px | 1013px |

**Note:** All columns scale proportionally! 📈

---

## Key Benefits:

✅ **Consistent** - Same proportions everywhere  
✅ **Simple** - No min/max constraints  
✅ **Scalable** - Works on any screen size  
✅ **Balanced** - Editor gets 50%, perfect for forms  
✅ **Clean** - Pure flexbox, no calculations  

---

## The Math:

```
Total flex units: 1 + 3 + 2 = 6

Left:   1/6 = 0.1667 = 16.67%
Middle: 3/6 = 0.5000 = 50%
Right:  2/6 = 0.3333 = 33.33%
              ─────────────────
              Total:    100%
```

---

## Customization:

Want different ratio? Change the flex values:

| Ratio | Left | Middle | Right | Use Case |
|-------|------|--------|-------|----------|
| **1:3:2** | `flex-1` | `flex-[3]` | `flex-[2]` | **Current (balanced)** |
| 1:2:2 | `flex-1` | `flex-[2]` | `flex-[2]` | Wider preview |
| 1:4:1 | `flex-1` | `flex-[4]` | `flex-1` | Max editor space |
| 1:2:3 | `flex-1` | `flex-[2]` | `flex-[3]` | Focus on preview |

---

## Test It:

1. Open AI Optimization page
2. Resize browser window
3. Watch all three columns **scale together**
4. Notice: **Ratio always stays 1:3:2** 🎯

---

## Files Changed:

- `/components/AIRewritePanel.tsx`
  - Line ~1453: Left sidebar
  - Line ~1567: Middle editor
  - Line ~2321: Right preview

---

## That's It! 🎉

**Three simple flex values = Perfect 1:3:2 ratio on any screen!**
