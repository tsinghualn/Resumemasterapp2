// Helper function to determine section type for custom rendering
export function getSectionType(sectionName: string): 'summary' | 'skills' | 'experience' | 'education' | 'certifications' | 'projects' | 'generic' {
  const upper = sectionName.toUpperCase();
  
  if (upper.includes('SUMMARY') || upper.includes('PROFILE') || upper.includes('OBJECTIVE')) {
    return 'summary';
  }
  if (upper.includes('SKILL') || upper.includes('COMPETENC')) {
    return 'skills';
  }
  if (upper.includes('EXPERIENCE') || upper.includes('EMPLOYMENT')) {
    return 'experience';
  }
  if (upper.includes('EDUCATION') || upper.includes('ACADEMIC')) {
    return 'education';
  }
  if (upper.includes('CERTIFICATION') || upper.includes('LICENSE')) {
    return 'certifications';
  }
  if (upper.includes('PROJECT')) {
    return 'projects';
  }
  
  return 'generic';
}

// Helper to format section title for display
export function formatSectionTitle(sectionName: string): string {
  // Convert section names to title case and clean up
  return sectionName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
