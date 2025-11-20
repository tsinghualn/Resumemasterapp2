/**
 * Compact Template Styles for 1-2 Page Resume Fit
 * 
 * This utility provides optimized Tailwind classes for all resume templates
 * to ensure they fit elegantly on 1-2 pages while maintaining professional appearance.
 */

export const compact = {
  // Page-level padding - reduced from p-10/p-12/p-16
  page: 'p-6',
  pageLoose: 'p-8', // For minimalist templates that need more breathing room
  
  // Header section
  header: {
    container: 'mb-4 pb-2',
    containerLoose: 'mb-5 pb-3',
    name: 'text-2xl', // Down from text-4xl/text-5xl
    nameLarge: 'text-3xl', // For executive/creative templates
    contact: 'text-xs', // Down from text-sm
    spacing: 'gap-2',
  },
  
  // Section headers
  section: {
    container: 'mb-3',
    containerLoose: 'mb-4',
    title: 'text-sm', // Down from text-xl/text-2xl
    titleLarge: 'text-base', // For emphasis
    marginBottom: 'mb-2',
    paddingBottom: 'pb-1',
  },
  
  // Content
  content: {
    spacing: 'space-y-1', // Down from space-y-2/space-y-3
    spacingLoose: 'space-y-1.5',
    text: 'text-sm', // Standard body text
    textSmall: 'text-xs', // For details/meta
    jobTitle: 'text-sm', // Down from text-lg
    jobDetails: 'text-xs', // Down from text-sm
    lineHeight: 'leading-snug', // Down from leading-relaxed
    lineHeightTight: 'leading-tight', // For very compact layouts
  },
  
  // Bullets and indentation
  bullets: {
    indent: 'ml-4', // Down from ml-6
    gap: 'gap-2', // Down from gap-3
    marker: 'text-xs mt-1',
  },
  
  // Grid layouts
  grid: {
    gap: 'gap-3', // Down from gap-6/gap-8
    gapSmall: 'gap-2',
    columnGap: 'gap-x-3',
    rowGap: 'gap-y-2',
  },
  
  // Sidebar dimensions
  sidebar: {
    narrow: 'w-48', // 192px
    normal: 'w-56', // 224px  
    wide: 'w-64', // 256px
    padding: 'p-6', // Down from p-8/p-10
  },
  
  // Cards and boxes
  card: {
    padding: 'p-4', // Down from p-6/p-8
    paddingSmall: 'p-3',
    margin: 'mb-3',
  },
};

// Helper function to get adaptive spacing based on content length
export function getAdaptiveCompactStyles(contentLength: number) {
  if (contentLength < 800) {
    // Short resume - can afford slightly more spacing
    return {
      page: 'p-6',
      sectionMargin: 'mb-4',
      contentSpacing: 'space-y-1.5',
    };
  } else if (contentLength < 1500) {
    // Medium resume - standard compact
    return {
      page: 'p-6',
      sectionMargin: 'mb-3',
      contentSpacing: 'space-y-1',
    };
  } else {
    // Long resume - maximum compact
    return {
      page: 'p-5',
      sectionMargin: 'mb-2',
      contentSpacing: 'space-y-0.5',
    };
  }
}

// Quick reference for manual replacement
export const replacements = {
  // Padding
  'p-16': 'p-6',
  'p-14': 'p-6',
  'p-12': 'p-6',
  'p-10': 'p-6',
  
  // Font sizes - Names
  'text-7xl': 'text-2xl',
  'text-6xl': 'text-2xl',
  'text-5xl': 'text-2xl',
  'text-4xl': 'text-2xl',
  'text-3xl': 'text-xl',
  
  // Font sizes - Headers
  'text-2xl': 'text-base',
  'text-xl': 'text-sm',
  'text-lg': 'text-sm',
  
  // Margins
  'mb-12': 'mb-4',
  'mb-10': 'mb-4',
  'mb-8': 'mb-3',
  'mb-6': 'mb-3',
  
  // Padding bottom
  'pb-8': 'pb-2',
  'pb-6': 'pb-2',
  'pb-4': 'pb-2',
  
  // Spacing
  'space-y-6': 'space-y-1.5',
  'space-y-5': 'space-y-1.5',
  'space-y-4': 'space-y-1.5',
  'space-y-3': 'space-y-1.5',
  'space-y-2': 'space-y-1',
  
  // Gaps
  'gap-8': 'gap-3',
  'gap-6': 'gap-3',
  'gap-5': 'gap-3',
  'gap-4': 'gap-2',
  
  // Line height
  'leading-relaxed': 'leading-snug',
  'leading-loose': 'leading-tight',
  
  // Indents
  'ml-8': 'ml-4',
  'ml-6': 'ml-4',
  'pl-8': 'pl-4',
  'pl-6': 'pl-4',
};

export default compact;
