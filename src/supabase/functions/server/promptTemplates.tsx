/**
 * Resume Parsing Prompt Template Management
 * 
 * This file contains the prompt template system that can be updated
 * based on feedback analysis from users.
 */

import * as kv from './kv_store.tsx';

export interface PromptTemplate {
  version: string;
  lastUpdated: string;
  sections: {
    contactInfo: string;
    experience: string;
    education: string;
    skills: string;
    projects: string;
    certifications: string;
    awards: string;
    general: string;
  };
  keywords: string[];
  appliedFeedback: string[];
}

// Default base prompt template (v1.0)
export const DEFAULT_PROMPT_TEMPLATE: PromptTemplate = {
  version: '1.0',
  lastUpdated: new Date().toISOString(),
  sections: {
    contactInfo: `NAME AND CONTACT EXTRACTION (CRITICAL - AT THE TOP OF RESUME):
- **NAME FIELD**: Extract the person's full name from the very top/header of the resume
- The name is typically the FIRST LINE or LARGEST TEXT at the top of the resume
- Look for a line that appears to be a person's name (e.g., "John Smith", "Jane M. Doe", "Robert Johnson Jr.")
- **CRITICAL**: Copy the name EXACTLY in the same order as it appears in the resume
- **DO NOT reorder or rearrange** - if the resume shows "Smith, John" keep it as "Smith, John"
- **DO NOT normalize format** - maintain the exact format from the original resume
- **PRESERVE ALL SPECIAL CHARACTERS AND FORMATTING** - keep parentheses (), hyphens -, apostrophes ', and all other characters
- Do NOT include titles (Mr., Ms., Dr.) unless they are part of how the name is written
- Do NOT include contact information in the name field (no emails, phones, addresses in name)
- The name should be JUST THE NAME - nothing else
- **CONTACT FIELD**: Extract ALL contact information (email, phone, LinkedIn, address, etc.)
- Typically appears on the first 1-3 lines of the resume, near the name
- Include: email address, phone number, LinkedIn URL, GitHub URL, portfolio URL, address, city/state
- Copy EXACTLY as written, preserving the format
- If multiple contact items are on separate lines, combine them with " | " separator
- Example: "john@email.com | (555) 123-4567 | linkedin.com/in/johnsmith | New York, NY"
- Do NOT include the person's name in the contact field`,

    experience: `EXPERIENCE SECTION RULES:
- Sort entries by MOST RECENT FIRST (current/present jobs first, then by end date)
- Extract job title, company name, dates, and location EXACTLY as written
- Include ALL bullet points for each role in EXACT order
- Do NOT paraphrase or summarize - copy word-for-word
- Preserve all formatting, dashes, and special characters
- If multiple roles at same company, treat each as separate entry with proper dates
- Look for dates in formats like "Jan 2020 - Present", "2020-2023", "Summer 2022"
- Current/ongoing roles (with "Present", "Current") should appear FIRST`,

    education: `EDUCATION SECTION RULES:
- Sort entries by graduation date (MOST RECENT FIRST)
- Extract degree type, major, university name, dates, and location EXACTLY as written
- Include GPA if present (preserve exact format: "3.8/4.0" or "GPA: 3.8")
- Include honors/distinctions EXACTLY as written (e.g., "magna cum laude", "Dean's List")
- If coursework is listed under education (not separate section), include it completely
- Look for inline labels like "Relevant coursework:" - these are CONTENT, not section headers
- Extract all courses listed, preserving exact names
- Do NOT stop at inline labels - continue until you hit a major section header`,

    skills: `SKILLS SECTION RULES:
- Preserve EXACT order as listed in the resume (do NOT sort alphabetically)
- Copy skill names EXACTLY as written - do NOT normalize or standardize
- Preserve any categories/groupings (e.g., "Programming:", "Languages:", "Tools:")
- If skills are comma-separated, keep them comma-separated
- If skills are in separate lines/bullets, preserve that structure
- Include ALL skills mentioned - do not filter or prioritize
- Preserve version numbers (e.g., "Python 3.9", "React 18")
- Keep proficiency levels if stated (e.g., "Python (Expert)", "Spanish (Fluent)")`,

    projects: `PROJECTS SECTION RULES:
- Sort by MOST RECENT FIRST (by completion date or latest work date)
- Extract project title, dates, and technologies EXACTLY as written
- Include ALL description bullets in exact order
- Copy technical details word-for-word (frameworks, tools, languages)
- Preserve links to GitHub, live demos, or portfolios exactly
- If project has no date, place it at the end (after dated projects)
- Do NOT summarize - copy complete descriptions`,

    certifications: `CERTIFICATIONS SECTION RULES:
- Sort by date obtained (MOST RECENT FIRST)
- Extract certification name, issuing organization, and date EXACTLY as written
- Include credential IDs if present
- Preserve expiration dates if mentioned
- Copy the full official name of the certification
- If certification is still valid, note it if stated
- If no date available, place at the end`,

    awards: `AWARDS/HONORS SECTION RULES:
- Sort by date received (MOST RECENT FIRST)
- Extract award name and date EXACTLY as written
- Include awarding organization/institution if present
- Copy any description or achievement details completely
- Preserve context (e.g., "Top 5% of class", "1st place out of 100")
- If no date available, place at the end`,

    general: `GENERAL RULES FOR ALL SECTIONS:
- You are a COPY MACHINE - extract text EXACTLY as written
- DO NOT paraphrase, summarize, reword, or modify ANY text
- PRESERVE exact spacing, formatting, and special characters
- DO NOT add extra whitespace between words
- Sort date-containing sections by MOST RECENT FIRST
- Keep each entry as ONE UNIT (title + dates + all content together)
- Preserve bullet point order within each entry
- Only extract sections that actually exist in the resume
- Stop extracting when you hit the next major section header
- Inline labels (e.g., "AI related:", "Coursework:") are CONTENT, not boundaries`
  },
  keywords: [
    'missing date', 'wrong date', 'incorrect date', 'date error',
    'wrong company', 'company name', 'missing company', 'incorrect company',
    'wrong skill', 'missing skill', 'skill error', 'incorrect skills',
    'email error', 'phone error', 'contact info', 'missing contact',
    'wrong title', 'job title', 'incorrect title',
    'missing bullet', 'lost information', 'truncated', 'incomplete',
    'wrong order', 'chronological', 'sorting', 'order error',
    'name error', 'wrong name', 'missing name',
    'GPA missing', 'GPA wrong', 'degree error',
    'project missing', 'lost project',
    'certification missing', 'award missing',
    'extra space', 'spacing', 'whitespace',
    'duplicate', 'repeated', 'duplicated'
  ],
  appliedFeedback: []
};

/**
 * Get the current prompt template from KV store or return default
 */
export async function getCurrentPromptTemplate(): Promise<PromptTemplate> {
  try {
    const stored = await kv.get('resume_parsing_prompt_template');
    if (stored) {
      return stored as PromptTemplate;
    }
  } catch (error) {
    console.error('Error fetching prompt template:', error);
  }
  
  return DEFAULT_PROMPT_TEMPLATE;
}

/**
 * Save a new prompt template version
 */
export async function savePromptTemplate(template: PromptTemplate): Promise<boolean> {
  try {
    await kv.set('resume_parsing_prompt_template', template);
    console.log('✅ Prompt template saved, version:', template.version);
    return true;
  } catch (error) {
    console.error('❌ Error saving prompt template:', error);
    return false;
  }
}

/**
 * Build the full system prompt from template sections
 */
export function buildSystemPrompt(template: PromptTemplate, feedbackGuidance?: string): string {
  const feedbackSection = feedbackGuidance 
    ? `\n🔍 IMPORTANT FEEDBACK FROM PREVIOUS USERS:\n${feedbackGuidance}\nPlease pay special attention to these areas based on user feedback.\n\n`
    : '';

  return `You are an expert resume parser that extracts content EXACTLY as written. You are a COPY MACHINE, not a writer.

${feedbackSection}${template.sections.general}

${template.sections.contactInfo}

${template.sections.experience}

${template.sections.education}

${template.sections.skills}

${template.sections.projects}

${template.sections.certifications}

${template.sections.awards}

WHITESPACE AND FORMATTING PRESERVATION (CRITICAL):
- **DO NOT add extra spaces** in names, titles, or any text
- **PRESERVE EXACT SPACING** as it appears in the original resume
- If the original says "John Smith" (no middle initial), output "John Smith" NOT "John  Smith" or "John Smith "
- **NO EXTRA WHITESPACE**: Do not add spaces between words, before/after text, or anywhere else
- Copy text character-by-character exactly as it appears, including single spaces between words

YOU ARE NOT ALLOWED TO:
❌ Paraphrase or reword any text
❌ Summarize or shorten any descriptions  
❌ Add any new words or information
❌ Remove any existing words or details
❌ Mix bullet points from different jobs
❌ Separate a job title from its bullet points
❌ Modify formatting or structure

YOU MUST:
✅ Copy every word EXACTLY as written
✅ Preserve every bullet point EXACTLY as shown
✅ Sort ALL date-containing sections by date (most recent first)
✅ Keep each entry as ONE UNIT (title + dates + all its content together)
✅ Maintain all formatting exactly as is

CRITICAL INSTRUCTIONS:
- Parse the resume text and extract ALL sections that exist in the resume
- Return ONLY valid JSON with no additional text, commentary, or markdown formatting
- Do NOT wrap the JSON in code blocks or backticks
- COPY ALL TEXT EXACTLY AS WRITTEN - DO NOT paraphrase, reword, summarize, or modify ANYTHING`;
}

/**
 * Apply feedback-based improvements to the prompt template
 */
export async function applyFeedbackToPromptTemplate(
  recommendations: Array<{
    issue: string;
    current_problem: string;
    suggested_fix: string;
  }>,
  updatedSections: {
    contact_info?: string;
    experience?: string;
    education?: string;
    skills?: string;
    projects?: string;
    certifications?: string;
    awards?: string;
  },
  analysisId: string
): Promise<PromptTemplate> {
  const currentTemplate = await getCurrentPromptTemplate();
  
  // Increment version
  const versionParts = currentTemplate.version.split('.');
  const newVersion = `${versionParts[0]}.${parseInt(versionParts[1]) + 1}`;
  
  // Update sections that have new instructions
  const newTemplate: PromptTemplate = {
    ...currentTemplate,
    version: newVersion,
    lastUpdated: new Date().toISOString(),
    sections: {
      ...currentTemplate.sections,
      ...(updatedSections.contact_info && { contactInfo: updatedSections.contact_info }),
      ...(updatedSections.experience && { experience: updatedSections.experience }),
      ...(updatedSections.education && { education: updatedSections.education }),
      ...(updatedSections.skills && { skills: updatedSections.skills }),
      ...(updatedSections.projects && { projects: updatedSections.projects }),
      ...(updatedSections.certifications && { certifications: updatedSections.certifications }),
      ...(updatedSections.awards && { awards: updatedSections.awards }),
    },
    appliedFeedback: [
      ...currentTemplate.appliedFeedback,
      `${analysisId}: ${recommendations.map(r => r.issue).join('; ')}`
    ]
  };
  
  return newTemplate;
}
