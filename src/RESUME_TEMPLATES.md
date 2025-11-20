# Resume Templates Guide

## Overview

The Resume Preview now features **4 distinct visual templates** that transform the AI-generated resume content into different professional styles. Each template has unique typography, spacing, colors, and visual elements.

---

## 📋 Template Styles

### 1. **CLASSIC** Template (Default)
*Traditional and Professional*

**Visual Style:**
- Clean, traditional resume layout
- Black borders and headers
- Professional serif-like appearance
- Conservative spacing

**Design Elements:**
```
Section Headers:
- Uppercase text
- Bold font weight
- 2px solid black underline
- Wide letter spacing (tracking-wide)

Job Titles:
- Semibold, 18px
- Gray-800 color
- Standard spacing

Bullet Points:
- Standard bullet (•)
- Gray-800 color
- Left margin: 5 units

Body Text:
- Gray-700 color
- Relaxed line height
- Small contact info (14px)
```

**Best For:**
- Corporate positions
- Finance/Banking/Legal
- Executive roles
- Traditional industries
- Conservative companies

**Color Palette:**
- Headers: Gray-900 (#111827)
- Text: Gray-700 (#374151)
- Contact: Gray-600 (#4B5563)
- Accent: Black border

---

### 2. **MODERN** Template
*Clean with Accent Colors*

**Visual Style:**
- Blue accent colors throughout
- Left border accent (8px blue stripe)
- Gradient elements
- Contemporary feel

**Design Elements:**
```
Container:
- 8px blue-600 left border
- Extra shadow (shadow-xl)
- Clean rounded corners

Section Headers:
- 24px bold text
- Blue gradient underline
- Vertical blue bar accent (2px wide, 8px tall)
- Gradient from blue-600 to blue-400

Job Titles:
- Blue dot bullet (•)
- Semibold, 18px
- Aligned with dot

Bullet Points:
- Blue right arrow (▸)
- Blue-600 color
- 6 units left margin

Body Text:
- Gray-700 color
- Relaxed leading
- Blue-600 contact info
```

**Best For:**
- Tech industry
- Startups
- Creative tech roles
- Digital marketing
- Modern companies
- Design positions

**Color Palette:**
- Primary: Blue-600 (#2563EB)
- Secondary: Blue-400 (#60A5FA)
- Text: Gray-700
- Gradients: Blue-600 → Blue-300

---

### 3. **MINIMAL** Template
*Simple and Elegant*

**Visual Style:**
- Ultra-clean design
- Minimal borders
- Subtle gray accents
- Maximum whitespace
- Thin typography

**Design Elements:**
```
Container:
- Thin gray-300 border
- Light shadow (shadow-sm)
- Extra padding (10 units)

Section Headers:
- Uppercase with wide tracking (tracking-widest)
- Semibold, 18px
- Gray-400 border bottom
- Smaller, understated

Job Titles:
- Semibold, 16px
- Gray-700 color
- Minimal spacing

Bullet Points:
- Em dash (–) instead of bullet
- Gray-500 color
- No left margin
- Smaller text (14px)

Body Text:
- Gray-600 color
- Smaller font (14px)
- Extra small contact (12px)
- Relaxed line height
```

**Best For:**
- Design portfolios
- Architecture
- Minimalist brands
- Academic positions
- Research roles
- Consulting

**Color Palette:**
- Headers: Gray-800 (#1F2937)
- Text: Gray-600 (#4B5563)
- Borders: Gray-400 (#9CA3AF)
- Accent: Gray-500 (#6B7280)

---

### 4. **CREATIVE** Template
*Bold and Unique*

**Visual Style:**
- Vibrant gradient colors
- Gradient background
- Bold, eye-catching headers
- Purple/pink/indigo color scheme
- Skewed underlines

**Design Elements:**
```
Container:
- Gradient background (indigo-50 → white → purple-50)
- Extra large shadow (shadow-2xl)
- Large rounded corners (rounded-2xl)

Section Headers:
- 24px extrabold
- Gradient text (indigo → purple → pink)
- Skewed gradient underline bar
- Transform: -skew-x-12
- Height: 4px gradient bar

Job Titles:
- Bold, 18px
- Indigo-700 color
- Standout styling

Bullet Points:
- Filled circle (●)
- Purple-600 color
- Bold weight
- 6 units margin

Body Text:
- Gray-700 color
- Indigo-600 contact info
- Medium font weight for contact
```

**Best For:**
- Creative industries
- Marketing roles
- Advertising
- Media & Entertainment
- Graphic design
- Brand strategists
- Content creators

**Color Palette:**
- Primary: Indigo-600 (#4F46E5)
- Secondary: Purple-600 (#9333EA)
- Accent: Pink-600 (#DB2777)
- Gradients: Multi-color
- Background: Indigo-50 → Purple-50

---

## 🎨 Visual Comparison

### Section Header Styles

**CLASSIC:**
```
━━━━━━━━━━━━━━━━━━━
PROFESSIONAL SUMMARY
━━━━━━━━━━━━━━━━━━━
```

**MODERN:**
```
┃  PROFESSIONAL SUMMARY
┃  ━━━━━━━━━━━━━━━━━━━ (blue gradient)
```

**MINIMAL:**
```
PROFESSIONAL SUMMARY
───────────────────── (thin gray line)
```

**CREATIVE:**
```
PROFESSIONAL SUMMARY (gradient text)
    ╱╱╱╱╱╱╱╱╱╱╱╱╱╱ (skewed gradient bar)
```

---

### Bullet Point Styles

| Template | Bullet | Color | Style |
|----------|--------|-------|-------|
| Classic | • | Black | Standard |
| Modern | ▸ | Blue | Right arrow |
| Minimal | – | Gray | Em dash |
| Creative | ● | Purple | Filled circle |

---

### Job Title Styles

**CLASSIC:**
```
Senior Software Engineer | Google | 2020-2023
```

**MODERN:**
```
• Senior Software Engineer | Google | 2020-2023
  (blue dot)
```

**MINIMAL:**
```
Senior Software Engineer | Google | 2020-2023
(smaller, gray text)
```

**CREATIVE:**
```
Senior Software Engineer | Google | 2020-2023
(bold, indigo color)
```

---

## 📐 Spacing & Layout

### Container Padding

| Template | Padding | Shadow | Border |
|----------|---------|--------|--------|
| Classic | 10 units | Large | None |
| Modern | 8 units | Extra Large | 8px left blue |
| Minimal | 10 units | Small | 1px gray all |
| Creative | 8 units | 2XL | None (gradient bg) |

### Section Spacing

| Template | Top Margin | Bottom Margin |
|----------|------------|---------------|
| Classic | 7 units | 3 units |
| Modern | 8 units | 4 units |
| Minimal | 8 units | 4 units |
| Creative | 8 units | 4 units |

---

## 🔧 Technical Implementation

### Template Rendering Functions

Each template has 4 custom rendering functions:

1. **`renderSectionHeader(text, idx)`**
   - Renders section titles (EXPERIENCE, EDUCATION, etc.)
   - Different styling per template

2. **`renderJobTitle(text, idx)`**
   - Renders job positions and dates
   - Template-specific formatting

3. **`renderBulletPoint(text, idx)`**
   - Renders bullet point lists
   - Custom bullet styles per template

4. **`renderRegularText(text, idx)`**
   - Renders body text and contact info
   - Conditional styling for contact lines

### Container Styles Function

```typescript
getTemplateContainerStyles() {
  switch (selectedTemplate) {
    case 'modern':
      return 'p-8 bg-white shadow-xl rounded-lg border-l-8 border-blue-600';
    case 'minimal':
      return 'p-10 bg-white shadow-sm border border-gray-300';
    case 'creative':
      return 'p-8 bg-gradient-to-br from-indigo-50 via-white to-purple-50 shadow-2xl rounded-2xl';
    default: // classic
      return 'p-10 bg-white shadow-lg';
  }
}
```

---

## 💡 Template Selection UI

### Visual Template Selector

Users can switch templates in real-time:

```
┌─────────────────────────────────┐
│ Choose Template                  │
├─────────────────────────────────┤
│ ✓ Classic              [Active] │
│   Traditional and professional   │
├─────────────────────────────────┤
│   Modern                         │
│   Clean with accent colors       │
├─────────────────────────────────┤
│   Minimal                        │
│   Simple and elegant            │
├─────────────────────────────────┤
│   Creative                       │
│   Bold and unique               │
└─────────────────────────────────┘
```

**Features:**
- Live preview updates instantly
- Selected template highlighted in blue
- "Active" badge on current selection
- Hover effects on unselected templates
- Template description shown

---

## 📊 Template Statistics

Resume Stats panel shows:
- Word Count
- Character Count
- Number of Sections
- **Current Template** (displays selected template name)

---

## 🎯 Use Cases by Template

### When to Recommend Each Template

**1. CLASSIC - Recommend for:**
- First-time job seekers
- Career changers entering traditional fields
- Senior executives
- Legal, finance, government roles
- When company culture is unknown
- ATS-heavy application processes

**2. MODERN - Recommend for:**
- Tech industry applications
- Startup environments
- Digital marketing roles
- Product management
- UX/UI designers
- Data scientists
- Software engineers

**3. MINIMAL - Recommend for:**
- Academic positions
- Research roles
- Architecture/Design portfolios
- Consulting positions
- When less is more
- International applications
- Scandinavian companies

**4. CREATIVE - Recommend for:**
- Advertising agencies
- Creative agencies
- Marketing roles
- Content creators
- Brand managers
- Media companies
- Entertainment industry
- When personality matters

---

## 🚀 Features

### Live Preview
- ✅ Real-time template switching
- ✅ Instant visual updates
- ✅ No page reload required
- ✅ Smooth transitions

### Copy Protection
- ✅ All templates are copy-protected
- ✅ "🔒 Protected" watermark on all views
- ✅ Users must use Export to download

### Export Compatibility
- ✅ PDF export works with all templates
- ✅ DOCX export supported
- ✅ TXT export available
- ✅ Print preview matches template

### Responsive Design
- ✅ All templates responsive
- ✅ Mobile-friendly layouts
- ✅ Proper scaling on all devices

---

## 📋 Template Checklist

Before publishing, verify each template handles:

- [x] **Section Headers** - All caps, proper formatting
- [x] **Job Titles** - With dates and company names
- [x] **Bullet Points** - Lists under job descriptions
- [x] **Contact Information** - Email, phone, location
- [x] **Regular Text** - Paragraphs and descriptions
- [x] **Empty Lines** - Proper spacing
- [x] **Long Text** - Text wrapping works
- [x] **Special Characters** - Bullets, symbols display
- [x] **Name/Header** - Top of resume styled
- [x] **Multiple Sections** - Education, Skills, etc.

---

## 🎨 Color Reference

### CLASSIC
```css
--header: #111827 (gray-900)
--text: #374151 (gray-700)
--contact: #4B5563 (gray-600)
--border: #000000 (black)
```

### MODERN
```css
--primary: #2563EB (blue-600)
--secondary: #60A5FA (blue-400)
--text: #374151 (gray-700)
--gradient: linear-gradient(blue-600, blue-300)
```

### MINIMAL
```css
--header: #1F2937 (gray-800)
--text: #4B5563 (gray-600)
--border: #9CA3AF (gray-400)
--bullet: #6B7280 (gray-500)
```

### CREATIVE
```css
--primary: #4F46E5 (indigo-600)
--secondary: #9333EA (purple-600)
--accent: #DB2777 (pink-600)
--bg: linear-gradient(indigo-50, purple-50)
```

---

## 🔄 Migration Notes

### Changes from Previous Version

**Before:**
- All templates looked identical
- Only container styling differed slightly
- No visual distinction between templates

**After:**
- Each template has unique visual identity
- Custom rendering for all content types
- Template-specific colors, spacing, typography
- Professional, differentiated designs

### Breaking Changes

**None!** 
- All existing functionality preserved
- Export still works the same
- Copy protection still active
- No API changes

---

## ✨ Summary

**4 Distinct Templates:**
1. **Classic** - Traditional, conservative, professional
2. **Modern** - Blue accents, contemporary, tech-focused
3. **Minimal** - Clean, simple, understated elegance
4. **Creative** - Vibrant gradients, bold, eye-catching

**Key Features:**
- ✅ Real-time template switching
- ✅ Unique visual styling per template
- ✅ Template-specific typography
- ✅ Custom bullet points and headers
- ✅ Professional color schemes
- ✅ Copy protection on all templates
- ✅ Full export compatibility

**Impact:**
- Users now have meaningful template choices
- Visual differentiation helps target different industries
- Professional output for all career levels
- Increased user satisfaction and engagement
