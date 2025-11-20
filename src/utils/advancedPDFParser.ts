/**
 * Advanced PDF Parser for Resumes
 * Handles different resume layouts and intelligently extracts sections
 * regardless of their position in the document
 */

export interface ParsedResumeData {
  name: string;
  contact: string;
  summary: string;
  experience: string;
  education: string;
  skills: string;
  projects: string;
  certifications: string;
  awards: string;
  activities: string;
  interests: string;
  languages: string;
}

// Section headers we look for (case-insensitive, flexible matching)
const SECTION_PATTERNS = {
  summary: [
    /(?:^|\n)\s*(PROFESSIONAL SUMMARY|SUMMARY|PROFILE|OBJECTIVE|CAREER OBJECTIVE|PROFESSIONAL PROFILE)\s*(?:\n|:)/i,
  ],
  experience: [
    /(?:^|\n)\s*(PROFESSIONAL EXPERIENCE|WORK EXPERIENCE|EXPERIENCE|EMPLOYMENT HISTORY|WORK HISTORY|CAREER HISTORY)\s*(?:\n|:)/i,
  ],
  education: [
    /(?:^|\n)\s*(EDUCATION|ACADEMIC BACKGROUND|ACADEMIC CREDENTIALS|QUALIFICATIONS)\s*(?:\n|:)/i,
  ],
  skills: [
    /(?:^|\n)\s*(SKILLS|TECHNICAL SKILLS|CORE COMPETENCIES|CORE SKILLS|KEY SKILLS|EXPERTISE|TECHNICAL EXPERTISE)\s*(?:\n|:)/i,
  ],
  projects: [
    /(?:^|\n)\s*(PROJECTS|PROJECT EXPERIENCE|ACADEMIC PROJECTS|PERSONAL PROJECTS|KEY PROJECTS|NOTABLE PROJECTS)\s*(?:\n|:)/i,
  ],
  certifications: [
    /(?:^|\n)\s*(CERTIFICATIONS|CERTIFICATES|PROFESSIONAL CERTIFICATIONS|LICENSES AND CERTIFICATIONS|LICENSES|CREDENTIALS)\s*(?:\n|:)/i,
  ],
  awards: [
    /(?:^|\n)\s*(AWARDS|HONORS|HONORS AND AWARDS|ACHIEVEMENTS|RECOGNITION|AWARDS AND HONORS)\s*(?:\n|:)/i,
  ],
  activities: [
    /(?:^|\n)\s*(ACTIVITIES|VOLUNTEER EXPERIENCE|VOLUNTEER WORK|EXTRACURRICULAR ACTIVITIES|COMMUNITY INVOLVEMENT|VOLUNTEERING)\s*(?:\n|:)/i,
  ],
  interests: [
    /(?:^|\n)\s*(HOBBIES|INTERESTS|HOBBIES AND INTERESTS|PERSONAL INTERESTS)\s*(?:\n|:)/i,
  ],
  languages: [
    /(?:^|\n)\s*(LANGUAGES|LANGUAGE PROFICIENCY|LANGUAGE SKILLS)\s*(?:\n|:)/i,
  ],
};

/**
 * Extracts name from resume text
 * Looks for the first prominent text at the beginning
 */
function extractName(text: string): string {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  // Name is typically the first non-empty line
  // It's usually short and doesn't contain common header words
  for (const line of lines.slice(0, 5)) {
    // Skip if it looks like a section header
    if (/^(RESUME|CV|CURRICULUM VITAE|CONTACT|EMAIL|PHONE)/i.test(line)) {
      continue;
    }
    
    // Skip if too long (likely not a name)
    if (line.length > 50) {
      continue;
    }
    
    // Skip if it contains email or phone
    if (/@|phone|tel:|linkedin|github/i.test(line)) {
      continue;
    }
    
    // This is likely the name
    return line;
  }
  
  return '';
}

/**
 * Extracts contact information
 * Looks for email, phone, LinkedIn, etc.
 */
function extractContact(text: string): string {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const contactParts: string[] = [];
  
  // Look for contact info in the first 10 lines
  for (const line of lines.slice(0, 10)) {
    // Email
    const emailMatch = line.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch && !contactParts.some(p => p.includes(emailMatch[1]))) {
      contactParts.push(`Email: ${emailMatch[1]}`);
    }
    
    // Phone
    const phoneMatch = line.match(/(?:Phone|Tel|Mobile|Cell)?:?\s*(\+?[\d\s\-\(\)]{10,})/i);
    if (phoneMatch && !contactParts.some(p => p.includes('Phone'))) {
      contactParts.push(`Phone: ${phoneMatch[1].trim()}`);
    }
    
    // LinkedIn
    const linkedInMatch = line.match(/(linkedin\.com\/in\/[\w\-]+|linkedin\.com\/[\w\-]+)/i);
    if (linkedInMatch && !contactParts.some(p => p.includes('linkedin'))) {
      contactParts.push(`LinkedIn: ${linkedInMatch[1]}`);
    }
    
    // GitHub
    const githubMatch = line.match(/(github\.com\/[\w\-]+)/i);
    if (githubMatch && !contactParts.some(p => p.includes('github'))) {
      contactParts.push(`GitHub: ${githubMatch[1]}`);
    }
    
    // Location
    const locationMatch = line.match(/(?:Location|Address|City)?:?\s*([A-Z][a-z]+(?:,\s*[A-Z]{2})?(?:,\s*\d{5})?)/);
    if (locationMatch && !contactParts.some(p => p.includes('Location')) && locationMatch[1].length < 50) {
      contactParts.push(`Location: ${locationMatch[1]}`);
    }
  }
  
  return contactParts.join(' | ');
}

/**
 * Find all section headers in the text with their positions
 */
function findSectionHeaders(text: string): Array<{ type: string; position: number; header: string }> {
  const sections: Array<{ type: string; position: number; header: string }> = [];
  
  for (const [sectionType, patterns] of Object.entries(SECTION_PATTERNS)) {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match.index !== undefined) {
        sections.push({
          type: sectionType,
          position: match.index,
          header: match[1],
        });
        break; // Found this section, move to next type
      }
    }
  }
  
  // Sort by position in document
  sections.sort((a, b) => a.position - b.position);
  
  return sections;
}

/**
 * Extract content between two section headers
 */
function extractSectionContent(text: string, startPos: number, endPos: number, headerText: string): string {
  let content = text.substring(startPos, endPos);
  
  // Remove the header itself
  content = content.replace(new RegExp(`^.*?${headerText}.*?(?:\n|:)`, 'i'), '');
  
  // Clean up
  content = content.trim();
  
  return content;
}

/**
 * Main parsing function - intelligently extracts sections regardless of order
 */
export function parseResumeAdvanced(text: string): ParsedResumeData {
  console.log('🔍 Advanced PDF Parser: Starting intelligent parse...');
  
  const data: ParsedResumeData = {
    name: '',
    contact: '',
    summary: '',
    experience: '',
    education: '',
    skills: '',
    projects: '',
    certifications: '',
    awards: '',
    activities: '',
    interests: '',
    languages: '',
  };
  
  // Extract name and contact (these are usually at the top)
  data.name = extractName(text);
  data.contact = extractContact(text);
  
  console.log('📝 Extracted name:', data.name);
  console.log('📞 Extracted contact:', data.contact);
  
  // Find all section headers
  const sections = findSectionHeaders(text);
  console.log('📋 Found sections:', sections.map(s => `${s.type} at pos ${s.position}`));
  
  // Extract content for each section
  for (let i = 0; i < sections.length; i++) {
    const currentSection = sections[i];
    const nextSection = sections[i + 1];
    
    // End position is either the next section or end of text
    const endPos = nextSection ? nextSection.position : text.length;
    
    // Extract content
    const content = extractSectionContent(text, currentSection.position, endPos, currentSection.header);
    
    // Assign to appropriate field
    const sectionType = currentSection.type as keyof ParsedResumeData;
    if (sectionType in data) {
      data[sectionType] = content;
      console.log(`✅ Extracted ${sectionType}: ${content.substring(0, 100)}...`);
    }
  }
  
  // Fallback: If major sections are missing, try simple extraction
  if (!data.experience && !data.education && !data.skills) {
    console.log('⚠️ Major sections missing, attempting fallback parsing...');
    return fallbackParsing(text, data.name, data.contact);
  }
  
  console.log('✅ Advanced PDF parsing complete!');
  return data;
}

/**
 * Fallback parsing for when structured sections aren't clearly identified
 */
function fallbackParsing(text: string, name: string, contact: string): ParsedResumeData {
  const data: ParsedResumeData = {
    name,
    contact,
    summary: '',
    experience: '',
    education: '',
    skills: '',
    projects: '',
    certifications: '',
    awards: '',
    activities: '',
    interests: '',
    languages: '',
  };
  
  // Try to extract key information even without clear headers
  const lines = text.split('\n');
  
  // Look for bullet points and dates (likely experience)
  const experienceLines = lines.filter(line => 
    /^[•\-\*]/.test(line.trim()) || /\d{4}\s*[-–]\s*(?:\d{4}|Present)/i.test(line)
  );
  if (experienceLines.length > 0) {
    data.experience = experienceLines.join('\n');
  }
  
  // Look for degree keywords (likely education)
  const educationLines = lines.filter(line =>
    /(Bachelor|Master|PhD|B\.S\.|M\.S\.|B\.A\.|M\.A\.|University|College|Institute)/i.test(line)
  );
  if (educationLines.length > 0) {
    data.education = educationLines.join('\n');
  }
  
  // Look for technical terms (likely skills)
  const skillKeywords = /(JavaScript|Python|Java|React|Node|SQL|AWS|Azure|GCP|Docker|Kubernetes|Git)/i;
  const skillLines = lines.filter(line => skillKeywords.test(line));
  if (skillLines.length > 0) {
    data.skills = skillLines.join('\n');
  }
  
  console.log('📦 Fallback parsing complete');
  return data;
}

/**
 * Clean and format extracted text
 */
export function cleanExtractedText(text: string): string {
  return text
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive newlines
    .trim();
}
