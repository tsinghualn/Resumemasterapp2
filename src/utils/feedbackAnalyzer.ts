/**
 * Feedback Analyzer
 * Analyzes collected user feedback about AI parsing to improve future parsing attempts
 */

export interface ParseFeedback {
  section: string;
  type: 'positive' | 'negative';
  reason?: string;
  timestamp: number;
}

/**
 * Get all stored feedback from localStorage
 */
export function getAllFeedback(): ParseFeedback[] {
  try {
    const feedback = localStorage.getItem('aiParsingFeedback');
    return feedback ? JSON.parse(feedback) : [];
  } catch (error) {
    console.error('Error reading feedback:', error);
    return [];
  }
}

/**
 * Get feedback for a specific section
 */
export function getFeedbackForSection(section: string): ParseFeedback[] {
  const allFeedback = getAllFeedback();
  return allFeedback.filter(f => f.section === section);
}

/**
 * Get common issues from negative feedback
 */
export function getCommonIssues(): { issue: string; count: number }[] {
  const allFeedback = getAllFeedback();
  const negativeFeedback = allFeedback.filter(f => f.type === 'negative' && f.reason);
  
  // Count similar issues (simple keyword matching)
  const issueCounts: Record<string, number> = {};
  
  negativeFeedback.forEach(f => {
    if (f.reason) {
      const lowerReason = f.reason.toLowerCase();
      
      // Categorize by keywords
      if (lowerReason.includes('email')) {
        issueCounts['email parsing'] = (issueCounts['email parsing'] || 0) + 1;
      }
      if (lowerReason.includes('phone')) {
        issueCounts['phone parsing'] = (issueCounts['phone parsing'] || 0) + 1;
      }
      if (lowerReason.includes('date')) {
        issueCounts['date parsing'] = (issueCounts['date parsing'] || 0) + 1;
      }
      if (lowerReason.includes('name')) {
        issueCounts['name parsing'] = (issueCounts['name parsing'] || 0) + 1;
      }
      if (lowerReason.includes('experience') || lowerReason.includes('job')) {
        issueCounts['experience parsing'] = (issueCounts['experience parsing'] || 0) + 1;
      }
      if (lowerReason.includes('education') || lowerReason.includes('degree')) {
        issueCounts['education parsing'] = (issueCounts['education parsing'] || 0) + 1;
      }
      if (lowerReason.includes('skill')) {
        issueCounts['skills parsing'] = (issueCounts['skills parsing'] || 0) + 1;
      }
      if (lowerReason.includes('format') || lowerReason.includes('layout')) {
        issueCounts['formatting issues'] = (issueCounts['formatting issues'] || 0) + 1;
      }
    }
  });
  
  return Object.entries(issueCounts)
    .map(([issue, count]) => ({ issue, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Generate parsing guidance based on feedback history
 * This can be used to adjust prompts or parsing logic
 */
export function generateParsingGuidance(): string {
  const commonIssues = getCommonIssues();
  
  if (commonIssues.length === 0) {
    return '';
  }
  
  let guidance = 'Based on previous feedback, pay special attention to:\n';
  
  commonIssues.forEach(({ issue, count }) => {
    guidance += `- ${issue} (${count} reports)\n`;
  });
  
  // Add specific guidance based on top issues
  if (commonIssues[0]?.issue.includes('email')) {
    guidance += '\nEmail parsing tips: Look for @ symbol and common email domains.\n';
  }
  if (commonIssues.some(i => i.issue.includes('date'))) {
    guidance += '\nDate parsing tips: Watch for various date formats (MM/YYYY, Month Year, etc.).\n';
  }
  if (commonIssues.some(i => i.issue.includes('experience'))) {
    guidance += '\nExperience parsing tips: Separate job title, company, dates, and description clearly.\n';
  }
  
  return guidance;
}

/**
 * Get feedback statistics
 */
export function getFeedbackStats(): {
  total: number;
  positive: number;
  negative: number;
  withReasons: number;
  successRate: number;
} {
  const allFeedback = getAllFeedback();
  const positive = allFeedback.filter(f => f.type === 'positive').length;
  const negative = allFeedback.filter(f => f.type === 'negative').length;
  const withReasons = allFeedback.filter(f => f.type === 'negative' && f.reason).length;
  
  return {
    total: allFeedback.length,
    positive,
    negative,
    withReasons,
    successRate: allFeedback.length > 0 ? (positive / allFeedback.length) * 100 : 0
  };
}

/**
 * Clear all feedback (useful for testing)
 */
export function clearAllFeedback(): void {
  localStorage.removeItem('aiParsingFeedback');
}

/**
 * Export feedback data (useful for analysis)
 */
export function exportFeedback(): string {
  const allFeedback = getAllFeedback();
  return JSON.stringify(allFeedback, null, 2);
}
