// Template optimization utilities for elegant, compact resume layouts
// Ensures resumes fit on 1-2 pages while maintaining professional appearance

export const compactStyles = {
  // Page padding - reduced from p-12 to p-8 or p-6
  pagePadding: {
    normal: 'p-8',      // Standard 8 units (32px)
    tight: 'p-6',       // Tighter 6 units (24px)
    minimal: 'p-4'      // Minimal 4 units (16px)
  },
  
  // Header spacing - reduced margins and padding
  header: {
    marginBottom: 'mb-5',     // Was mb-8 or mb-10
    paddingBottom: 'pb-3',    // Was pb-6
    nameSize: 'text-3xl',     // Was text-4xl or text-5xl
    contactSize: 'text-xs'    // Was text-sm
  },
  
  // Section spacing - tighter but still readable
  section: {
    marginBottom: 'mb-5',     // Was mb-8
    titleSize: 'text-base',   // Was text-xl or text-2xl
    titleMargin: 'mb-2',      // Was mb-3 or mb-4
    titlePadding: 'pb-1',     // Was pb-2
    contentSpacing: 'space-y-1.5'  // Was space-y-2 or space-y-3
  },
  
  // Content text - smaller but professional
  content: {
    normalText: 'text-sm',       // Was text-base
    smallText: 'text-xs',        // Was text-sm
    jobTitleSize: 'text-sm',     // Was text-lg
    jobDetailsSize: 'text-xs',   // Was text-sm
    lineHeight: 'leading-snug',  // Was leading-relaxed
    bulletIndent: 'ml-4',        // Was ml-6
    bulletGap: 'gap-2'           // Was gap-3
  },
  
  // Sidebar dimensions - more compact
  sidebar: {
    narrow: 'w-48',    // 192px - Was 200-250px
    normal: 'w-56',    // 224px - Was 256-280px
    wide: 'w-64'       // 256px - Was 280-320px
  },
  
  // Grid spacing - tighter gaps
  grid: {
    gap: 'gap-4',      // Was gap-6 or gap-8
    columnGap: 'gap-x-4',
    rowGap: 'gap-y-3'
  }
};

// Calculate if content will fit on specified pages
export const estimatePageCount = (content: string): number => {
  const lines = content.split('\n').filter(l => l.trim());
  const avgCharsPerLine = 80;
  const linesPerPage = 45; // Approximate with compact styling
  
  const estimatedLines = lines.reduce((acc, line) => {
    const lineLength = line.length;
    return acc + Math.ceil(lineLength / avgCharsPerLine);
  }, 0);
  
  return Math.ceil(estimatedLines / linesPerPage);
};

// Adjust spacing based on content length
export const getAdaptiveSpacing = (content: string) => {
  const pageCount = estimatePageCount(content);
  
  if (pageCount <= 1) {
    return {
      padding: compactStyles.pagePadding.normal,
      sectionMargin: 'mb-6',
      contentSpacing: 'space-y-2'
    };
  } else if (pageCount <= 2) {
    return {
      padding: compactStyles.pagePadding.tight,
      sectionMargin: 'mb-4',
      contentSpacing: 'space-y-1.5'
    };
  } else {
    return {
      padding: compactStyles.pagePadding.minimal,
      sectionMargin: 'mb-3',
      contentSpacing: 'space-y-1'
    };
  }
};

export default compactStyles;
