// Shared resume parsing utility for all templates

export interface ParsedResumeData {
  name: string;
  contact: {
    email?: string;
    phone?: string;
    details?: string;
  };
  sections: Record<string, string[]>;
}

export function parseResumeContent(content: string, sectionHeaders: string[]): ParsedResumeData {
  const lines = content.split('\n');
  let currentSection = '';
  const parsedData: ParsedResumeData = { name: '', contact: {}, sections: {} };
  
  console.log(`📋 Parsing resume with ${lines.length} lines`);
  
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    const upperLine = trimmed.toUpperCase();
    
    // Capture name from first few lines
    if (!parsedData.name && trimmed && idx < 3) {
      parsedData.name = trimmed;
      console.log(`👤 Found name: ${trimmed}`);
      return;
    }
    
    // Check for section header match
    const matchedSection = sectionHeaders.find(header => 
      upperLine === header || upperLine.startsWith(header)
    );
    
    if (matchedSection) {
      currentSection = matchedSection;
      parsedData.sections[currentSection] = [];
      console.log(`✅ Section found: "${matchedSection}" at line ${idx}`);
    } else if (currentSection) {
      // Add line to current section
      if (trimmed) parsedData.sections[currentSection].push(trimmed);
    } else if (trimmed && !parsedData.name) {
      // Another chance to capture name
      parsedData.name = trimmed;
    } else if (trimmed && !currentSection) {
      // Parse contact info before first section
      if (trimmed.includes('@')) parsedData.contact.email = trimmed;
      else if (trimmed.match(/\d{3}/)) parsedData.contact.phone = trimmed;
      else if (!parsedData.contact.details) parsedData.contact.details = trimmed;
    }
  });
  
  console.log('🎯 Final parsed sections:', Object.keys(parsedData.sections));
  console.log('📊 Items per section:', Object.entries(parsedData.sections).map(([k, v]) => `${k}: ${v.length}`).join(', '));
  
  return parsedData;
}

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

export function isSidebarSection(sectionName: string): boolean {
  const upper = sectionName.toUpperCase();
  return upper.includes('SKILL') || upper.includes('COMPETENC') || 
         upper.includes('EDUCATION') || upper.includes('ACADEMIC') || 
         upper.includes('CERTIFICATION') || upper.includes('LICENSE') ||
         upper.includes('LANGUAGE') || upper.includes('AWARD') ||
         upper.includes('HONOR');
}

export function isMainContentSection(sectionName: string): boolean {
  const upper = sectionName.toUpperCase();
  return upper.includes('SUMMARY') || upper.includes('PROFILE') || upper.includes('OBJECTIVE') ||
         upper.includes('EXPERIENCE') || upper.includes('EMPLOYMENT') ||
         upper.includes('PROJECT');
}
