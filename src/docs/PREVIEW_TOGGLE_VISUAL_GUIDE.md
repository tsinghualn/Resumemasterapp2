# Preview Toggle - Visual Guide 🎨

## Button Appearance

### In Preview Visible State:
```
┌────────────────────────────────────────┐
│ Resume Editor                          │
│                                        │
│                  ┌──────────────────┐  │
│                  │ ╳  Hide Preview  │  │ ← Button (right-aligned)
│                  └──────────────────┘  │
│ ┌────────────────────────────────────┐ │
│ │                                    │ │
│ │  Personal Details Form             │ │
│ │                                    │ │
│ │  [First Name] [Last Name]          │ │
│ │  [Job Title]                       │ │
│ │  ...                               │ │
│ │                                    │ │
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
```

### In Preview Hidden State:
```
┌──────────────────────────────────────────────────────────┐
│ Resume Editor (Now Wider!)                               │
│                                                          │
│                                   ┌──────────────────┐   │
│                                   │ ▤  Show Preview  │   │ ← Button
│                                   └──────────────────┘   │
│ ┌──────────────────────────────────────────────────────┐ │
│ │                                                      │ │
│ │  Personal Details Form (More Space!)                │ │
│ │                                                      │ │
│ │  [First Name]           [Last Name]                 │ │
│ │  [Job Title]                                        │ │
│ │  ...                                                │ │
│ │                                                      │ │
│ └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

---

## Full Page Layout

### DEFAULT: Preview Visible (1:3:2)
```
┌────────────────────────────────────────────────────────────────────────────────┐
│ AI Resume Optimization                                                         │
├──────┬─────────────────────────────────────────────┬───────────────────────────┤
│      │                                             │                           │
│ Nav  │              Resume Editor                  │      Live Preview         │
│      │                                             │                           │
│ ┌──┐ │                      ┌──────────────────┐   │  ┌─────────────────────┐  │
│ │●│ │ │                      │ ╳  Hide Preview  │   │  │ John Doe            │  │
│ └──┘ │                      └──────────────────┘   │  │ Software Engineer   │  │
│ ┌──┐ │ ┌──────────────────────────────────────┐   │  │                     │  │
│ │●│ │ │                                      │   │  │ Experience:         │  │
│ └──┘ │ │   Personal Details                   │   │  │ • ...               │  │
│ ┌──┐ │ │                                      │   │  │ • ...               │  │
│ │●│ │ │   [First Name]  [Last Name]          │   │  │                     │  │
│ └──┘ │ │                                      │   │  │ Education:          │  │
│ ┌──┐ │ │   [Job Title]                        │   │  │ • ...               │  │
│ │●│ │ │                                      │   │  │                     │  │
│ └──┘ │ │   ...                                │   │  │ Skills:             │  │
│      │ │                                      │   │  │ • ...               │  │
│      │ └──────────────────────────────────────┘   │  └─────────────────────┘  │
│      │                                             │                           │
├──────┼─────────────────────────────────────────────┼───────────────────────────┤
│ 17%  │                     50%                     │           33%             │
└──────┴─────────────────────────────────────────────┴───────────────────────────┘
   1                          3                                  2
```

### COLLAPSED: Preview Hidden (1:5:0)
```
┌────────────────────────────────────────────────────────────────────────────────┐
│ AI Resume Optimization                                                         │
├──────┬─────────────────────────────────────────────────────────────────────────┤
│      │                                                                         │
│ Nav  │                       Resume Editor (Expanded!)                        │
│      │                                                                         │
│ ┌──┐ │                                             ┌──────────────────┐        │
│ │●│ │ │                                             │ ▤  Show Preview  │        │
│ └──┘ │                                             └──────────────────┘        │
│ ┌──┐ │ ┌─────────────────────────────────────────────────────────────────┐    │
│ │●│ │ │                                                                 │    │
│ └──┘ ��� │   Personal Details (More Breathing Room!)                       │    │
│ ┌──┐ │ │                                                                 │    │
│ │●│ │ │   [First Name]                [Last Name]                       │    │
│ └──┘ │ │                                                                 │    │
│ ┌──┐ │ │   [Job Title]                                                   │    │
│ │●│ │ │                                                                 │    │
│ └──┘ │ │   [Email]                     [Phone]                           │    │
│      │ │                                                                 │    │
│      │ │   [Address]                                                     │    │
│      │ │                                                                 │    │
│      │ │   ...                                                           │    │
│      │ │                                                                 │    │
│      │ └─────────────────────────────────────────────────────────────────┘    │
│      │                                                                         │
├──────┼─────────────────────────────────────────────────────────────────────────┤
│ 17%  │                                83%                                      │
└──────┴─────────────────────────────────────────────────────────────────────────┘
   1                                     5
```

---

## Button States

### State 1: Preview Visible
```
┌──────────────────────┐
│                      │
│  ╳  Hide Preview     │  ← PanelRightClose icon
│                      │
└──────────────────────┘

Style: outline, small
Action: Hides the preview panel
Result: Editor expands from 50% to 83%
```

### State 2: Preview Hidden
```
┌──────────────────────┐
│                      │
│  ▤  Show Preview     │  ← PanelRightOpen icon
│                      │
└──────────────────────┘

Style: outline, small
Action: Shows the preview panel
Result: Editor shrinks from 83% to 50%
```

---

## Width Comparison

### On 1920px Screen:

#### Preview Visible:
```
Left:   251px  ████
Middle: 752px  ████████████████████████
Right:  501px  ████████████████
```

#### Preview Hidden:
```
Left:   251px  ████
Middle: 1253px ████████████████████████████████████████
Right:  0px    (removed)
```

**Gain:** 501px → **+66% more space!**

---

## User Flow

### Scenario: User Editing Long Experience Section

**Step 1:** Page loads (Preview Visible)
```
┌───┬────────────────┬──────┐
│Nav│  Experience    │ Live │
│   │  Section       │ View │
│   │  (Cramped)     │      │
└───┴────────────────┴──────┘
    Feeling tight...
```

**Step 2:** User clicks "Hide Preview"
```
┌───┬────────────────────────────┐
│Nav│  Experience Section        │
│   │  (So Much Space!)          │
│   │  [Show Preview] ───────►   │
└───┴────────────────────────────┘
    Ahh, much better!
```

**Step 3:** User finishes editing, clicks "Show Preview"
```
┌───┬────────────────┬──────┐
│Nav│  Experience    │ Live │
│   │  Section       │ View │
│   │  (Done!)       │  ✓   │
└───┴────────────────┴──────┘
    Verify the changes!
```

---

## Icon Legend

**PanelRightClose (╳):**
```
  ╔═══╗
  ║   ║ ╳
  ║   ║
  ╚═══╝
```
Indicates: "Close/hide the right panel"  
Used when: Preview is visible

**PanelRightOpen (▤):**
```
  ╔═══╗
  ║   ║ ▤
  ║   ║
  ╚═══╝
```
Indicates: "Open/show the right panel"  
Used when: Preview is hidden

---

## Flex Behavior

### Preview Visible:
```
Container flex layout:
┌───────────────────────────────────────┐
│ flex-1    flex-[3]       flex-[2]     │
│ ┌────┐   ┌──────────┐   ┌────────┐   │
│ │ L  │   │    M     │   │   R    │   │
│ │ e  │   │    i     │   │   i    │   │
│ │ f  │   │    d     │   │   g    │   │
│ │ t  │   │    d     │   │   h    │   │
│ │    │   │    l     │   │   t    │   │
│ │    │   │    e     │   │        │   │
│ └────┘   └──────────┘   └────────┘   │
│  1 unit    3 units        2 units     │
└───────────────────────────────────────┘
Total: 6 units
```

### Preview Hidden:
```
Container flex layout:
┌───────────────────────────────────────┐
│ flex-1         flex-[5]               │
│ ┌────┐   ┌────────────────────────┐   │
│ │ L  │   │           M            │   │
│ │ e  │   │           i            │   │
│ │ f  │   │           d            │   │
│ │ t  │   │           d            │   │
│ │    │   │           l            │   │
│ │    │   │           e            │   │
│ └────┘   └────────────────────────┘   │
│  1 unit         5 units                │
└───────────────────────────────────────┘
Total: 6 units (Right removed from DOM)
```

---

## Real Estate Comparison

### Small Laptop (1440px):

**Before Collapse:**
```
Nav:    187px  ████
Editor: 560px  ████████████
Preview: 373px ████████

Editor: 560px (workable but tight)
```

**After Collapse:**
```
Nav:    187px  ████
Editor: 933px  ████████████████████

Editor: 933px (comfortable!)
Gain: +373px (+66%)
```

### Large Monitor (2560px):

**Before Collapse:**
```
Nav:    336px  ████
Editor: 1008px ████████████
Preview: 672px █████████

Editor: 1008px (good)
```

**After Collapse:**
```
Nav:    336px  ████
Editor: 1680px ████████████████████████

Editor: 1680px (luxurious!)
Gain: +672px (+66%)
```

---

## Design Decisions

### Why Right-Aligned?
```
✗ Wrong (Left-aligned):
┌────────────────────────────┐
│ [Hide Preview]             │
│                            │
└────────────────────────────┘
Feels disconnected from preview

✓ Correct (Right-aligned):
┌────────────────────────────┐
│             [Hide Preview] │──► Controls this panel
│                            │
└────────────────────────────┘
Clear association with right side
```

### Why Above the Card?
```
✗ Wrong (Inside card):
┌────────────────────────────┐
│ Personal Details           │
│ [Hide Preview]             │ ← Confusing
│ [First Name] [Last Name]   │
└────────────────────────────┘
Buried in content

✓ Correct (Above card):
         [Hide Preview]       ← Clear control
┌────────────────────────────┐
│ Personal Details           │
│ [First Name] [Last Name]   │
└────────────────────────────┘
Separated, visible, accessible
```

### Why Outline Variant?
```
✗ Wrong (Primary):
┌────────────────────────────┐
│         [Hide Preview]     │ ← Too prominent
└────────────────────────────┘
Competes with main actions

✓ Correct (Outline):
┌────────────────────────────┐
│         [Hide Preview]     │ ← Subtle utility
└────────────────────────────┘
Secondary control, non-intrusive
```

---

## Animation Flow

### Click "Hide Preview":
```
Frame 1 (Before):          Frame 2 (Transition):      Frame 3 (After):
┌──┬────────┬────┐        ┌──┬──────────┬──┐        ┌──┬────────────┐
│ L│   M    │ R  │   →    │ L│    M     │R │   →    │ L│      M     │
└──┴────────┴────┘        └──┴──────────┴──┘        └──┴────────────┘
  1    3      2              1     4     1              1       5
                                  expanding             preview gone
```

**Duration:** Instant (flexbox reflow)  
**Smoothness:** Native browser optimization  
**No JavaScript animation needed!**

---

## Summary

### What the Button Does:

**Click 1:** Hide Preview
- Middle expands: 50% → 83%
- Preview disappears (removed from DOM)
- Button becomes "Show Preview"
- Icon changes to PanelRightOpen

**Click 2:** Show Preview
- Middle shrinks: 83% → 50%
- Preview reappears (added to DOM)
- Button becomes "Hide Preview"
- Icon changes to PanelRightClose

### Space Efficiency:

| State | Editor Width | Gain |
|-------|--------------|------|
| Default | 50% | Baseline |
| Collapsed | 83.33% | **+66%** 🚀 |

---

## 🎉 Visual Result

**A simple toggle button gives users 66% more editing space!**

```
Default:    [████████████████████]    50%
Collapsed:  [████████████████████████████]    83%
            ↑ Same space ↑ ↑ Extra space! ↑
```

**Professional, intuitive, and powerful!** ✨
