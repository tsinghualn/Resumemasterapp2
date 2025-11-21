import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Initialize Supabase client with service role key
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Helper function to verify user authentication
async function verifyUser(authHeader: string | null) {
  if (!authHeader) {
    return { error: 'No authorization header', user: null };
  }
  
  const accessToken = authHeader.split(' ')[1];
  if (!accessToken) {
    return { error: 'Invalid authorization header', user: null };
  }

  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  
  if (error || !user) {
    return { error: 'Unauthorized: Invalid token', user: null };
  }
  
  return { error: null, user };
}

// Initialize storage bucket on startup
async function initializeStorage() {
  const bucketName = 'make-bc1c5df9-resumes';
  
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      await supabase.storage.createBucket(bucketName, {
        public: false,
        fileSizeLimit: 10485760, // 10MB
      });
      console.log(`Created bucket: ${bucketName}`);
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
}

// Initialize on startup
initializeStorage();

// Health check endpoint
app.get("/make-server-bc1c5df9/health", (c) => {
  return c.json({ status: "ok" });
});

// ============= AI RESUME PARSING ENDPOINT =============

// AI-powered resume parsing endpoint
app.post("/make-server-bc1c5df9/parse-resume", async (c) => {
  try {
    const { resumeText } = await c.req.json();

    if (!resumeText) {
      return c.json({ error: 'Resume text is required' }, 400);
    }

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiKey) {
      console.log('❌ OpenAI API key not found, using fallback parsing');
      return c.json({ 
        error: 'OpenAI API key not configured',
        fallback: true 
      }, 500);
    }

    console.log(`✅ Parsing resume with AI (text length: ${resumeText.length} chars)...`);

    const systemPrompt = `You are an expert resume parser that extracts content EXACTLY as written. You are a COPY MACHINE, not a writer.

MOST CRITICAL RULES - FOLLOW THESE FIRST:

WHITESPACE AND FORMATTING PRESERVATION (CRITICAL):
- **DO NOT add extra spaces** in names, titles, or any text
- **PRESERVE EXACT SPACING** as it appears in the original resume
- If the original says "John Smith" (no middle initial), output "John Smith" NOT "John  Smith" or "John Smith "
- If the original says "Software Engineer" output "Software Engineer" NOT "Software  Engineer"
- **NO EXTRA WHITESPACE**: Do not add spaces between words, before/after text, or anywhere else
- Copy text character-by-character exactly as it appears, including single spaces between words
- Exception: You may normalize multiple consecutive spaces (2+) to single spaces, but do not add extra spaces where none exist

UNIVERSAL CHRONOLOGICAL ORDERING (CRITICAL - APPLIES TO ALL DATE-CONTAINING SECTIONS):
- **GENERAL RULE**: For ANY section that contains dates/years, sort entries by MOST RECENT FIRST
- This applies to: EXPERIENCE, EDUCATION, PROJECTS, AWARDS, PUBLICATIONS, PATENTS, CERTIFICATIONS, PRESENTATIONS, and ANY other time-tracked section
- Extract all entries from the section, then REORDER them chronologically (newest to oldest)
- Parse the dates from each entry (look for years like "2024", "2020-2023", "Jan 2020 - Present", "Published 2022", "Awarded 2021", etc.)
- Sort by end date/year (or start date if still current/ongoing)
- Current/ongoing items (e.g., "Present", "Current", "Ongoing") should appear FIRST
- Example order: "2023-Present" → "2024" → "2023" → "2020-2023" → "2018-2020" → "2017"
- ONLY exception: Skills section (no dates) - preserve document order
- Within each entry: Preserve EXACT ORDER of bullet points/content as written

🚨 CRITICAL - KEEP ENTRIES INTACT WHEN SORTING (APPLIES TO ALL SECTIONS):
- When reordering by date, move the COMPLETE entry as ONE UNIT
- Each entry = [Title/Header/Name + Dates] + [ALL its associated content/bullets/description]
- DO NOT separate a title from its content
- DO NOT mix content from different entries
- Sort these COMPLETE UNITS by date, keeping each unit intact
- Examples:
  * Experience: "Google 2023-Present + its 5 bullets" BEFORE "Meta 2020-2023 + its 3 bullets"
  * Publications: "Paper Title (2024) + its description" BEFORE "Paper Title (2022) + its description"
  * Awards: "Best Paper Award 2023 + its details" BEFORE "Dean's List 2021 + its details"
  * Patents: "Patent #123 (Filed 2024) + its description" BEFORE "Patent #456 (Filed 2020) + its description"

SPECIFIC SECTION EXAMPLES:
- Experience/Education/Projects: Sort by employment/graduation/completion dates
- Awards/Honors: Sort by award date/year received
- Publications: Sort by publication date/year
- Patents: Sort by filing date or grant date (whichever is provided)
- Certifications: Sort by date obtained/issued
- Presentations: Sort by presentation date
- If dates are unclear or missing for an entry, place it at the end (after all dated entries)

SECTIONS THAT DO NOT GET SORTED (PRESERVE DOCUMENT ORDER):
- Skills: No dates, preserve order as listed
- Summary/Objective: Not applicable (single block of text)
- Languages: Typically no dates, preserve order
- Interests: Typically no dates, preserve order
- References: Not sorted

INLINE LABELS ARE NOT HEADERS (CRITICAL):
- "AI related:", "ML related:", "Data related:" are CONTENT labels, NOT section headers
- "Relevant coursework:", "Core courses:", "Related courses:" are CONTENT labels, NOT section headers  
- "Technical skills:", "Programming languages:" are CONTENT labels, NOT section headers
- When you see "AI related: TensorFlow, PyTorch, Keras" this is CONTENT to include, NOT a place to stop
- ONLY stop extracting when you see standalone MAJOR headers like "SKILLS", "EXPERIENCE", "AWARDS"

EXAMPLES OF INLINE LABELS (INCLUDE THESE AS CONTENT):
- "AI related: Machine Learning, Deep Learning" is Part of Education content
- "ML related: TensorFlow, PyTorch" is Part of Education content
- "Relevant coursework: CS101, CS102" is Part of Education content
- "Programming languages: Python, Java" is Part of Skills content

EXAMPLES OF REAL SECTION HEADERS (STOP HERE):
🛑 "SKILLS" on its own line
🛑 "EXPERIENCE" on its own line  
🛑 "AWARDS" on its own line
🛑 "PROJECTS" on its own line

CRITICAL INSTRUCTIONS:
- Parse the resume text and extract ALL sections that exist in the resume
- Return ONLY valid JSON with no additional text, commentary, or markdown formatting
- Do NOT wrap the JSON in code blocks or backticks
- COPY ALL TEXT EXACTLY AS WRITTEN - DO NOT paraphrase, reword, summarize, or modify ANYTHING
- PRESERVE EXACT WORDING - Copy text word-for-word, character-for-character
- UNIVERSAL CHRONOLOGICAL SORTING - For ALL date-containing sections (Experience, Education, Projects, Awards, Publications, Patents, Certifications, Presentations, etc.): Sort by date (MOST RECENT FIRST)
- PRESERVE ENTRY INTEGRITY - When sorting, keep each entry as ONE UNIT (title + dates + all content together)
- PRESERVE BULLET ORDER - Within each entry: Keep bullet points in their original order
- PRESERVE ALL FORMATTING - Keep bullet points, dashes, line breaks exactly as shown
- IMPORTANT: Only include sections that actually exist in the resume - if a section is missing, set it to empty string ""
- Identify section headers regardless of formatting (UPPERCASE, Title Case, etc.)
- EXTRACT COMPLETE CONTENT VERBATIM - every word must be an exact copy from the original

NAME AND CONTACT EXTRACTION (CRITICAL - AT THE TOP OF RESUME):
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
- Examples of CORRECT name extraction (maintaining exact order AND format):
  * If resume shows "John Smith" → name: "John Smith"
  * If resume shows "Smith, John" → name: "Smith, John" (keep comma format as-is)
  * If resume shows "Jane M. Doe" → name: "Jane M. Doe"
  * If resume shows "Doe, Jane M." → name: "Doe, Jane M." (keep comma format as-is)
  * If resume shows "Robert Johnson Jr." → name: "Robert Johnson Jr."
  * If resume shows "María García" → name: "María García"
  * If resume shows "García, María" → name: "García, María" (keep comma format as-is)
  * If resume shows "Na (Anna) Li" → name: "Na (Anna) Li" (keep parentheses as-is)
  * If resume shows "O'Brien, Patrick" → name: "O'Brien, Patrick" (keep apostrophe and comma as-is)
  * If resume shows "Mary-Jane Watson" → name: "Mary-Jane Watson" (keep hyphen as-is)
  * If resume shows "李明 (Li Ming)" → name: "李明 (Li Ming)" (keep exact format with parentheses)
- Examples of INCORRECT (do NOT do this):
  * If resume shows "John Smith | john@email.com" → name should be "John Smith" NOT "John Smith | john@email.com"
  * If resume shows "John  Smith" (two spaces) → name should be "John Smith" (normalize whitespace to single space)
  * If resume shows "Smith, John" → name should be "Smith, John" NOT "John Smith" (do NOT reorder)
  * If resume shows "Na (Anna) Li" → name should be "Na (Anna) Li" NOT "Na Li" or "Anna Li" (do NOT remove parentheses)

- **CONTACT FIELD**: Extract ALL contact information (email, phone, LinkedIn, address, etc.)
- Typically appears on the first 1-3 lines of the resume, near the name
- Include: email address, phone number, LinkedIn URL, GitHub URL, portfolio URL, address, city/state
- Copy EXACTLY as written, preserving the format
- If multiple contact items are on separate lines, combine them with " | " separator
- Example: "john@email.com | (555) 123-4567 | linkedin.com/in/johnsmith | New York, NY"
- Do NOT include the person's name in the contact field

YOU ARE NOT ALLOWED TO:
❌ Paraphrase or reword any text
❌ Summarize or shorten any descriptions  
❌ Add any new words or information
❌ Remove any existing words or details
❌ Mix bullet points from different jobs
❌ Separate a job title from its bullet points
❌ Modify formatting or structure
❌ Improve or enhance the writing
❌ Fix grammar or spelling errors
❌ Stop when you see inline labels with colons (like "AI related:")

YOU MUST:
✅ Copy every word EXACTLY as written
✅ Preserve every bullet point EXACTLY as shown
✅ Sort ALL date-containing sections by date (most recent first): Experience, Education, Projects, Awards, Publications, Patents, Certifications, Presentations, etc.
✅ Keep each entry as ONE UNIT (title + dates + all its content together)
✅ Maintain all formatting exactly as is
✅ Extract COMPLETE text with ZERO modifications
✅ Continue extracting when you see "AI related:", "ML related:" etc. - these are content, not boundaries

SECTION PARSING RULES - FOLLOW EXACTLY:

1. **Section Boundaries - CRITICAL**: Extract content ONLY between section headers. STOP IMMEDIATELY at the next section header.
   - SECTION HEADERS are standalone lines, typically in ALL CAPS or Title Case
   - SECTION HEADERS appear on their own line and mark major resume sections
   - If you see "EDUCATION" followed by content, then "AWARDS", STOP at "AWARDS" - do NOT include awards in education
   - If you see "EXPERIENCE" followed by content, then "EDUCATION", STOP at "EDUCATION"
   - ANY major section header terminates the previous section
   - Common section headers: EDUCATION, EXPERIENCE, SKILLS, PROJECTS, CERTIFICATIONS, AWARDS, HONORS, ACTIVITIES, PUBLICATIONS, PATENTS, PRESENTATIONS, LANGUAGES, INTERESTS, REFERENCES, SUMMARY, OBJECTIVE, COURSEWORK, COURSES
   
2. **What is NOT a Section Header - EXTREMELY IMPORTANT**:
   - "AI related:", "ML related:", "Tech related:" - these are INLINE LABELS, not section headers
   - "Relevant coursework:", "Related courses:", "Core courses:" - these are INLINE LABELS within the Education section
   - "Technical skills:", "Programming languages:" - these are INLINE CATEGORIES within the Skills section
   - Any text with a colon that appears inline within a section is NOT a section header
   - Only standalone lines that mark MAJOR resume sections are section headers
   - If it's part of a list or appears mid-content, it's NOT a section header - KEEP EXTRACTING
   
3. **Section Headers**: Only create separate sections if they have explicit headers in the resume
   - If resume has "PROJECTS" header then extract to "projects" field
   - If resume has "CERTIFICATIONS" header then extract to "certifications" field
   - If resume has "AWARDS" or "HONORS" header then extract to "awards" field
   - If projects/certifications/awards are listed under another section WITHOUT their own header then leave them there, set their field to ""
   
4. **Courses Handling**:
   - If courses are listed under "EDUCATION" section (no separate header) then include in "education" field, set "courses" to ""
   - If courses have their own section header like "RELEVANT COURSEWORK" or "COURSES" then extract to "courses" field
   
5. **Section Naming**:
   - Set "experienceTitle" to "Employment History" (always use this title for experience section)
   - If Education section contains coursework/courses then set "educationTitle" to "Education & Courses"
   - Otherwise then set "educationTitle" to "Education"
   - Set "skillsTitle" to "Skills" (always use this title for skills section)

EXTRACTION RULES - COPY TEXT EXACTLY, WORD-FOR-WORD:

- "experience": COPY VERBATIM - ZERO changes allowed:
  * Copy EVERY WORD exactly as written
  * Extract ALL jobs from the Experience section
  * REORDER jobs by date: MOST RECENT FIRST (descending chronological order)
  * Jobs with "Present" or "Current" should appear FIRST
  * Then sort by end year: 2024 before 2023, 2023 before 2022, etc.
  * Example order: "2023-Present" → "2021-2024" → "2019-2021" → "2017-2019"
  * Job titles, companies, dates - EXACT COPIES (only the ORDER changes)
  * ALL bullet points - COMPLETE, UNMODIFIED COPIES
  * Do NOT paraphrase, summarize, or shorten
  * STOP at next section header
  
  🚨 CRITICAL - KEEP JOB ENTRIES INTACT (EACH JOB = TITLE + ITS OWN BULLETS):
  * Each job entry has TWO parts: (1) Job Title/Company line (2) ALL its bullet points
  * When you see a job title/company, you MUST copy ALL its bullet points BEFORE moving to the next job
  * DO NOT mix bullet points from different jobs
  * DO NOT move bullet points from Job A to Job B
  * DO NOT separate a job title from its bullet points
  * STRUCTURE: [Job 1 Title + Job 1 Bullets] → [Job 2 Title + Job 2 Bullets] → [Job 3 Title + Job 3 Bullets]
  * How to identify where one job ends: Look for the next job title/company line OR the next section header
  * Example CORRECT:
    **Software Engineer | Google | 2020-2023**
    • Built microservices architecture
    • Led team of 5 developers
    **Data Analyst | Meta | 2018-2020**
    • Analyzed user behavior data
    • Created executive dashboards
  * Example WRONG (DO NOT DO THIS):
    **Software Engineer | Google | 2020-2023**
    • Analyzed user behavior data ❌ WRONG - this belongs to Data Analyst job
    • Created executive dashboards ❌ WRONG - this belongs to Data Analyst job
  * READING RULE: Start at job title → copy ALL content until you see NEXT job title or section header → that's ONE complete job entry
  
  SPECIAL CASE - Multiple Titles at One Company (Promotions/Role Changes):
  * If you see ONE COMPANY NAME followed by MULTIPLE JOB TITLES:
    Example pattern:
    Google
    Software Engineer | 2020-2022
    • Bullet points
    Senior Software Engineer | 2022-2024
    • Bullet points
    
  * Format it with bold markers for hierarchy:
    - Company name alone on a line becomes **Google**
    - Each job title line becomes **Software Engineer | 2020-2022**
    - Bullet points stay as-is (not bold)
  
  * Detection: A line with ONLY company name (no dates, no |) followed by multiple title lines
  
  * Example transformation:
    Input: "Google\nSoftware Engineer | 2020-2022\n• Led team\nSenior Engineer | 2023-Present\n• Managed dept"
    Output: "**Google**\n**Software Engineer | 2020-2022**\n• Led team\n**Senior Engineer | 2023-Present**\n• Managed dept"
  
- "education": COPY VERBATIM - ZERO changes allowed:
  * Extract ALL education entries from the section
  * REORDER entries by graduation/end date: MOST RECENT FIRST
  * Entries with "Expected" or "Present" should appear FIRST
  * Then sort by year: 2024 → 2023 → 2022, etc.
  * WITHIN each school entry: Copy content in its original order
  * Include ALL degrees, schools, dates, GPAs, honors, minors, concentrations - COMPLETE EXACT COPIES
  * If coursework/courses appear under Education (no separate COURSES header) - include EVERY SINGLE COURSE EXACTLY as listed
  * Copy ALL bullet points, ALL course names, ALL course codes, ALL descriptions - NOTHING can be left out
  * CRITICAL: "AI related:" and "ML related:" labels are followed by MULTIPLE LINES - copy ALL those lines completely
  * CRITICAL: After "AI related:" you may see projects, certifications, training spanning 3-5+ lines - copy EVERY LINE
  * Example: "AI related:\nLine 1: Self-driven project details...\nLine 2: AWS Certified course...\nLine 3: GitHub training" - copy ALL lines
  * Education sections are often VERY LONG with many courses - extract EVERYTHING word-for-word until the next section header
  * Do NOT truncate or summarize the course list - copy the COMPLETE list verbatim
  * Multi-line content after category labels MUST be included in full - scan ALL lines until the next major header
  * STOP ONLY when you see the next major section header (SKILLS, AWARDS, EXPERIENCE, PROJECTS, CERTIFICATIONS, etc.) on its own line
  
- "courses": ONLY if separate section header exists:
  * Copy COMPLETE course list EXACTLY as written - every single course with codes and names
  * Preserve exact order and formatting
  * If courses are under Education section (no separate header), leave this field as "" and include courses in "education" field instead
  
- "projects": ONLY if explicit "PROJECTS" header:
  * Extract ALL projects from the section
  * If projects have dates, REORDER by date: MOST RECENT FIRST
  * Projects with "Present" or "Ongoing" should appear FIRST
  * Then sort by end/completion date in descending order
  * Copy ALL project text EXACTLY as written
  * Do NOT paraphrase descriptions
  * Keep each project's title with its own description/bullets
  
- "skills": COPY VERBATIM:
  * Copy ALL skills exactly as listed
  * Preserve exact order and grouping
  * Do NOT reorganize or reorder
  
- "summary": COPY VERBATIM:
  * Copy every word exactly
  * Do NOT paraphrase or improve
  
- "certifications": ONLY if explicit "CERTIFICATIONS" header:
  * Extract ALL certifications from the section
  * If certifications have issue dates or expiration dates, REORDER by date: MOST RECENT FIRST
  * Look for date patterns like "Issued 2024", "Obtained 2023", "Expires 2025"
  * Copy ALL details exactly as written
  * Keep each certification's title with its own details/description
  
- "awards": ONLY if explicit "AWARDS"/"HONORS" header:
  * Extract ALL awards from the section
  * If awards have dates/years, REORDER by date: MOST RECENT FIRST
  * Look for date patterns like "2024", "Awarded 2023", "Received 2022"
  * Awards with more recent years should appear FIRST
  * Copy ALL award details exactly as written
  * Keep each award's title with its own details/description
  
- "publications": ONLY if explicit "PUBLICATIONS" header:
  * Extract ALL publications from the section
  * If publications have dates/years, REORDER by date: MOST RECENT FIRST
  * Look for date patterns like "2024", "Published 2023", "(2022)"
  * Copy ALL content EXACTLY as written
  * Keep each publication's title with its own authors/details/description
  
- "patents": ONLY if explicit "PATENTS" header:
  * Extract ALL patents from the section
  * If patents have dates, REORDER by date: MOST RECENT FIRST
  * Look for date patterns like "Filed 2024", "Granted 2023", "Pending 2024"
  * Copy ALL content EXACTLY as written
  * Keep each patent's title/number with its own details/description
  
- "presentations": ONLY if explicit "PRESENTATIONS" header:
  * Extract ALL presentations from the section
  * If presentations have dates, REORDER by date: MOST RECENT FIRST
  * Look for date patterns like "2024", "Presented 2023"
  * Copy ALL content EXACTLY as written
  * Keep each presentation's title with its own details/description
  
- "activities", "languages", "interests", "references":
  * ONLY if explicit section headers exist
  * Copy ALL content EXACTLY as written
  * Preserve document order (these typically don't have dates)

FORMATTING RULES FOR SUBHEADINGS (APPLY TO ALL SECTIONS):

1. **Bold Formatting for Subheadings**:
   - In EXPERIENCE section: Make company names and job titles bold by wrapping them with **text**
   - In PROJECTS section: Make project names/titles bold by wrapping them with **text**
   - In EDUCATION section: Make university names and degree titles bold by wrapping them with **text**
   - In AWARDS section: Make award titles/names bold by wrapping them with **text**
   - In PUBLICATIONS section: Make publication titles bold by wrapping them with **text**
   - In PATENTS section: Make patent titles/numbers bold by wrapping them with **text**
   - In CERTIFICATIONS section: Make certification names bold by wrapping them with **text**
   - In PRESENTATIONS section: Make presentation titles bold by wrapping them with **text**
   - In ANY section with subsections: Make subsection titles bold by wrapping them with **text**
   - Examples:
     * "Software Engineer | Google | 2020-2023" becomes "**Software Engineer | Google | 2020-2023**"
     * "E-commerce Platform" becomes "**E-commerce Platform**"
     * "Best Paper Award, 2023" becomes "**Best Paper Award, 2023**"
     * "AWS Certified Solutions Architect" becomes "**AWS Certified Solutions Architect**"
     * Company names: "Google" becomes "**Google**" (if it's a standalone line)
   - Apply bold ONLY to title/header lines, NOT to bullet points or descriptions
   - If a line looks like a title/header (company, job, project, award, publication name), wrap it with **

2. **Skills and Qualifications Deduplication**:
   - If resume has BOTH "Skills" and "Qualifications" sections:
     * Extract ALL unique items and consolidate into the "skills" field
     * Remove duplicates - if an item appears in both sections, include it only once
     * Merge the content intelligently: "Python, Java | Leadership, Communication" (from Skills) + "Python, Team Management" (from Qualifications) becomes "Python, Java, Leadership, Communication, Team Management"
   - If resume has only "Skills" OR only "Qualifications" then extract to "skills" field as-is
   - Set skillsTitle to "Skills & Qualifications" if both sections existed, otherwise keep original title

Required JSON structure (include ALL fields, use empty string "" if section doesn't exist):
{
  "name": "Full Name EXACTLY as written",
  "contact": "EXACT contact info from resume",
  "summary": "EXACT COPY of summary text word-for-word",
  "experience": "EXACT COPY of all experience content word-for-word",
  "experienceTitle": "Employment History",
  "education": "EXACT COPY of all education content word-for-word",
  "educationTitle": "Education & Courses" or "Education",
  "courses": "EXACT COPY if separate section exists",
  "skills": "EXACT COPY of all skills word-for-word",
  "skillsTitle": "Skills",
  "projects": "EXACT COPY if PROJECTS header exists",
  "certifications": "EXACT COPY if CERTIFICATIONS header exists",
  "publications": "EXACT COPY if PUBLICATIONS header exists",
  "patents": "EXACT COPY if PATENTS header exists",
  "presentations": "EXACT COPY if PRESENTATIONS header exists",
  "awards": "EXACT COPY if AWARDS header exists",
  "activities": "EXACT COPY if section exists",
  "languages": "EXACT COPY if LANGUAGES header exists",
  "interests": "EXACT COPY if section exists",
  "references": "EXACT COPY if REFERENCES header exists"
}

FINAL REMINDER: 
- You are a COPY MACHINE - copy text EXACTLY, word-for-word, character-for-character
- Return raw JSON only. No markdown, no code blocks, no explanations
- ZERO paraphrasing, ZERO summarizing, ZERO modifications - EXACT COPIES ONLY
- SORT ALL DATE-CONTAINING SECTIONS by date: MOST RECENT FIRST
- This applies to: Experience, Education, Projects, Awards, Publications, Patents, Certifications, Presentations, etc.
- Extract EVERYTHING under each section header, STOP at next section header
- Be EXTREMELY STRICT about section boundaries
- Only create separate sections if they have their own explicit headers
- 🚨 WHEN SORTING: Keep each entry as ONE UNIT (title + dates + all its content together)
- 🚨 DO NOT MIX CONTENT FROM DIFFERENT ENTRIES when reordering by date`;

    const userPrompt = `Parse this resume and return the structured JSON:

${resumeText}

🚨 CRITICAL RULES - FOLLOW EXACTLY:

📋 UNIVERSAL SORTING RULE - APPLIES TO ALL DATE-CONTAINING SECTIONS:
- **ANY section with dates/years: Sort by date with MOST RECENT FIRST**
- This includes: Experience, Education, Projects, Awards, Publications, Patents, Certifications, Presentations, and ANY other time-tracked section
- Current/ongoing entries ("Present", "Current", "Ongoing") appear FIRST
- Then sort by year in descending order: 2024 → 2023 → 2022 → 2021, etc.
- Examples by section:
  * Experience: Sort jobs by employment end date (most recent first)
  * Education: Sort schools by graduation date (most recent first)
  * Projects: Sort projects by completion date (most recent first)
  * Awards: Sort by award year/date received (most recent first)
  * Publications: Sort by publication year (most recent first)
  * Patents: Sort by filing/grant date (most recent first)
  * Certifications: Sort by issue date (most recent first)
  * Presentations: Sort by presentation date (most recent first)
- ONLY exception: Skills section (no dates) - keep in document order
- WITHIN each entry: Keep bullets/content in original order
- WHEN SORTING: Each entry = ONE UNIT (title + dates + ALL its content) that moves together as a block

⚠️ MOST COMMON MISTAKE TO AVOID - MIXING ENTRY CONTENT WHEN SORTING:
When sorting ANY section by date (most recent first), you MUST keep each entry with its own content!
Each entry = ONE UNIT (title + dates + ALL its bullets/description) that moves together when sorting.
Examples:
- Jobs: "Google 2018-2020" with 3 bullets, then "Meta 2023-Present" with 2 bullets
  → Output: Meta 2023-Present with its 2 bullets FIRST, then Google 2018-2020 with its 3 bullets
- Awards: "Best Paper 2019" with description, then "Dean's List 2023" with description
  → Output: Dean's List 2023 with its description FIRST, then Best Paper 2019 with its description
DO NOT mix the content when reordering by date!

RULE 1 - UNIVERSAL CHRONOLOGICAL SORTING (APPLIES TO ALL DATE-CONTAINING SECTIONS):
- **GENERAL PRINCIPLE**: If a section contains dates/years, sort entries by MOST RECENT FIRST
- Applies to: EXPERIENCE, EDUCATION, PROJECTS, AWARDS, PUBLICATIONS, PATENTS, CERTIFICATIONS, PRESENTATIONS, and ANY section with time information
- Current/ongoing entries (containing "Present", "Current", "Ongoing") should appear FIRST
- Then sort by end year/date in descending order: 2024 → 2023 → 2022 → 2021, etc.
- Example orderings:
  * Experience: "Software Engineer | 2023-Present" → "Data Analyst | 2021-2023" → "Intern | 2019-2021"
  * Awards: "Excellence Award 2024" → "Dean's List 2023" → "Honor Roll 2022"
  * Publications: "Paper Title (2024)" → "Paper Title (2022)" → "Paper Title (2020)"
- ONLY exception: Skills section (no dates) - preserve document order
- If Skills shows: "Python, Java, C++, JavaScript, SQL" → Keep as: "Python, Java, C++, JavaScript, SQL"
- WITHIN each entry: Keep bullet points/content in their original order

RULE 2 - INLINE LABELS ARE CONTENT, NOT BOUNDARIES:
- When you see "AI related: Machine Learning, Deep Learning, NLP" under EDUCATION
- This is EDUCATION CONTENT - include it in the education field
- DO NOT stop extraction - DO NOT treat it as a new section
- Same for "ML related:", "Relevant coursework:", "Core courses:", etc.
- These are INLINE CATEGORY LABELS within a section, not section headers

RULE 3 - EDUCATION SECTION EXTRACTION:
- Start at "EDUCATION" header
- Extract ALL education entries from the section
- REORDER entries by graduation/end date: MOST RECENT FIRST
- Entries with "Present" or "Expected" should appear FIRST
- Then sort by year: 2024 → 2023 → 2022 → 2021, etc.
- WITHIN each school entry: Keep content in its original order (university, then courses, then AI related, etc.)
- Include: university, degree, dates, GPA, honors, concentration, minor
- Include: ALL "AI related:" content - this can be MULTIPLE LINES with detailed descriptions
- Include: ALL "ML related:" content - this can be MULTIPLE LINES with detailed descriptions
- Include: ALL "Relevant coursework:" content with all the courses listed
- IMPORTANT: After "AI related:" or "ML related:", there may be 3-5+ lines of content (projects, certifications, training)
- Example of multi-line content to include:
  "AI related:
  Self-driven project: Build SysDesign Companion, an AI-powered assistant...
  Ultimate AWS Certified AI Practitioner AIF-C01 (Udemy)
  GitHub Copilot training"
  ALL these lines are part of Education - copy them ALL
- Include: EVERYTHING else until you hit "SKILLS", "AWARDS", "EXPERIENCE", etc.
- DO NOT stop early - extract the COMPLETE section including all multi-line content

RULE 4 - PROFESSIONAL EXPERIENCE SECTION EXTRACTION:
- Start at "EXPERIENCE" or "PROFESSIONAL EXPERIENCE" or "WORK EXPERIENCE" header
- Extract ALL job entries from the section
- Parse the date range for each job (look for patterns like "2020-2023", "Jan 2020 - Present", "2019-2021")
- REORDER jobs by end date: MOST RECENT FIRST (descending chronological order)
- Jobs with "Present", "Current", or "Ongoing" should appear FIRST
- Then sort by end year in descending order: 2024 → 2023 → 2022 → 2021, etc.
- Example order: "Software Engineer | 2023-Present" → "Data Analyst | 2020-2023" → "Intern | 2018-2020"

🚨🚨 CRITICAL - KEEP EACH JOB WITH ITS OWN BULLET POINTS WHEN SORTING:
- Each job is ONE COMPLETE UNIT: [Job Title/Company/Dates] + [ALL its bullet points]
- When reordering by date, move the ENTIRE job unit together
- DO NOT separate a job title from its bullet points
- DO NOT mix bullets from different jobs - Job A bullets stay with Job A, Job B bullets stay with Job B
- How to identify one complete job: Read job title → extract ALL content until you see NEXT job title OR section header
- Example structure (BEFORE sorting):
  [Job Title 1 | 2018-2020] + • Bullet 1 for Job 1 + • Bullet 2 for Job 1
  [Job Title 2 | 2023-Present] + • Bullet 1 for Job 2 + • Bullet 2 for Job 2
  [Job Title 3 | 2020-2023] + • Bullet 1 for Job 3 + • Bullet 2 for Job 3
- Example output (AFTER sorting by date):
  **Job Title 2 | 2023-Present**
  • Bullet 1 for Job 2
  • Bullet 2 for Job 2
  **Job Title 3 | 2020-2023**
  • Bullet 1 for Job 3
  • Bullet 2 for Job 3
  **Job Title 1 | 2018-2020**
  • Bullet 1 for Job 1
  • Bullet 2 for Job 1

- For each job: Copy company name, job title, dates, location, and ALL bullet points EXACTLY as written
- Preserve ALL bullet points in their original order WITH THEIR CORRECT JOB
- Extract EVERYTHING until you see the next MAJOR section header (EDUCATION, SKILLS, PROJECTS, etc.)
- Common mistake to AVOID: Do NOT mix bullet points from different jobs
- Common mistake to AVOID: Do NOT separate a job's title from its bullets when sorting

SPECIAL HANDLING - Multiple Roles at Same Company (Promotions):
When a resume shows ONE company with MULTIPLE job titles (promotions/role changes), format with bold hierarchy.

PATTERN TO DETECT:
Company name alone (no dates, no pipe) followed by job title with dates.
Example input:
  Google
  Software Engineer | 2020-2022
  • Developed features
  Senior Software Engineer | 2023-Present
  • Managed department

HOW TO FORMAT:
Make company name bold and each job title line bold. Keep bullet points normal.
Example output:
  **Google**
  **Software Engineer | 2020-2022**
  • Developed features
  **Senior Software Engineer | 2023-Present**
  • Managed department

DETECTION RULES:
- A line contains ONLY a company/organization name (no pipes, no dates)
- Followed by one or more lines with "Title | Dates" format
- This indicates multiple roles at the same employer
- Apply **bold markers** to company name and each title line for visual hierarchy

RULE 5 - SKILLS SECTION EXTRACTION:
- Copy skills in the EXACT ORDER they appear
- First skill listed is first skill extracted
- Last skill listed is last skill extracted
- NEVER reverse the sequence

RULE 6 - REAL SECTION BOUNDARIES:
These are the ONLY things that end a section (standalone on their own line):
- "SKILLS"
- "EXPERIENCE" / "PROFESSIONAL EXPERIENCE" / "WORK EXPERIENCE"
- "EDUCATION"
- "PROJECTS"
- "AWARDS" / "HONORS"
- "CERTIFICATIONS"
- "PUBLICATIONS"
- "PATENTS"
- "PRESENTATIONS"
- "ACTIVITIES"
- "LANGUAGES"
- "INTERESTS"
- "REFERENCES"
- Or any other major section header in ALL CAPS or Title Case on its own line

RULE 7 - WHAT TO INCLUDE IN EDUCATION (PRESERVE ORDER AS IT APPEARS):
The items below should be extracted IN THE ORDER THEY APPEAR in the original resume.
If the resume shows university first, then courses, then AI related THEN extract in that order.
If the resume shows AI related first, then university THEN extract in that order.

EXAMPLE CONTENT TO INCLUDE (order may vary):
✅ Stanford University, B.S. Computer Science
✅ GPA: 3.8/4.0
✅ Minor in Mathematics
✅ Relevant coursework: CS101, CS102, CS103, CS104
✅ AI related: [followed by multiple lines - appears AFTER coursework if that's the order in the document]
   Self-driven project: Build SysDesign Companion, an AI-powered assistant that automates and enhances system design documentation for software engineers; features multi-option support, seamless Confluence integration, and thorough content validation.
   Ultimate AWS Certified AI Practitioner AIF-C01 (Udemy)
   GitHub Copilot training
✅ ML related: TensorFlow, PyTorch, Keras, Scikit-learn [or multiple lines if present]
✅ ALL other content until you see "SKILLS" or another major header

CRITICAL: The above is just an example of what to include.
WITHIN each education entry: Preserve the order (if "AI related:" appears after coursework, keep it there).
BETWEEN education entries: Sort by graduation date (most recent school first).

RULE 8 - AWARDS, PUBLICATIONS, PATENTS, CERTIFICATIONS, PRESENTATIONS EXTRACTION:
These sections should follow the same chronological sorting rules as Experience/Education:
- Extract ALL entries from the section
- If entries have dates/years, REORDER by MOST RECENT FIRST
- Each entry = ONE UNIT (title/name + date + description/details) that moves together
- Look for date patterns:
  * Awards: "2024", "Awarded 2023", "Received December 2022"
  * Publications: "2024", "(2023)", "Published in 2022"
  * Patents: "Filed 2024", "Granted 2023", "Patent No. 123 (2022)"
  * Certifications: "Issued 2024", "Obtained 2023", "Valid 2022-2025"
  * Presentations: "2024", "Presented at Conference 2023"
- Sort by these dates: Most recent FIRST
- Example Award ordering: "Best Paper Award 2024 + details" → "Dean's List 2022 + details" → "Honor Roll 2020 + details"
- WITHIN each entry: Keep all description/details with its title
- Copy ALL content EXACTLY as written - no paraphrasing

RULE 9 - COMPLETE EXTRACTION:
- Extract EVERY WORD from each section
- Do NOT truncate, summarize, or shorten
- Do NOT paraphrase or modify
- COPY EXACTLY as written
- KEEP EACH ENTRY'S CONTENT TOGETHER - do not mix content between different entries
- Apply chronological sorting to ALL date-containing sections

COMPLETE EXAMPLE - Keeping Job Entries Intact (CORRECT vs WRONG):

❌ WRONG - Mixing content from different jobs OR not sorting by date:
INPUT (document order):
Software Engineer | Google | 2020-2023
• Built microservices
• Led 5 developers
Data Analyst | Meta | 2018-2020
• Analyzed user data
• Created dashboards

WRONG OUTPUT #1 - Mixed bullets (DO NOT DO THIS):
**Software Engineer | Google | 2020-2023**
• Analyzed user data ← WRONG! This is from Meta job
**Data Analyst | Meta | 2018-2020**
• Built microservices ← WRONG! This is from Google job

WRONG OUTPUT #2 - Not sorted by date (DO NOT DO THIS):
**Software Engineer | Google | 2020-2023**
• Built microservices
• Led 5 developers
**Data Analyst | Meta | 2018-2020** ← WRONG! Should come AFTER Google since 2018-2020 is older
• Analyzed user data
• Created dashboards

✅ CORRECT - Sorted by date (most recent first) AND each job with its own content:
**Software Engineer | Google | 2020-2023** ← First because 2023 > 2020
• Built microservices ← CORRECT! Stays with Google
• Led 5 developers ← CORRECT! Stays with Google
**Data Analyst | Meta | 2018-2020** ← Second because 2020 < 2023
• Analyzed user data ← CORRECT! Stays with Meta
• Created dashboards ← CORRECT! Stays with Meta

COMPLETE EXAMPLE - Multiple Roles at One Company:

INPUT: PROFESSIONAL EXPERIENCE section with Google company followed by two job titles
Google
Software Engineer | January 2020 - December 2022
• Developed microservices architecture
• Led team of 5 developers
Senior Software Engineer | January 2023 - Present
• Promoted to senior role
• Manage cross-functional team

OUTPUT: Apply bold markers to company and job titles
**Google**
**Software Engineer | January 2020 - December 2022**
• Developed microservices architecture
• Led team of 5 developers
**Senior Software Engineer | January 2023 - Present**
• Promoted to senior role
• Manage cross-functional team

NOTE: Company name stands alone (no dates) so it gets bold. Each role gets bold.

COMPLETE EXAMPLE - Sorting Awards Section by Date:

INPUT: AWARDS section (document order):
Honor Roll, 2019
Description of honor roll achievement
Best Paper Award, IEEE Conference 2023
Paper on machine learning won best paper
Dean's List, Fall 2020, Spring 2021
Consistent academic excellence

OUTPUT: Sorted by date (most recent first), each award with its description:
**Best Paper Award, IEEE Conference 2023**
Paper on machine learning won best paper
**Dean's List, Fall 2020, Spring 2021**
Consistent academic excellence
**Honor Roll, 2019**
Description of honor roll achievement

NOTE: 2023 appears first, then 2020-2021, then 2019. Each award stays with its own description.

🚨 FINAL REMINDER - NAME EXTRACTION:
- Extract the person's full name from the FIRST LINE or top of the resume
- The name is typically the largest text or appears alone on the first line
- **CRITICAL**: Copy the name EXACTLY as it appears - DO NOT reorder or rearrange
- **PRESERVE ALL FORMATTING**: Keep parentheses (), hyphens -, apostrophes ', commas, and all special characters
- If resume shows "Smith, John" keep it as "Smith, John" (do NOT change to "John Smith")
- If resume shows "Na (Anna) Li" keep it as "Na (Anna) Li" (do NOT remove parentheses)
- If resume shows "O'Brien" keep it as "O'Brien" (do NOT remove apostrophe)
- If resume shows "Mary-Jane" keep it as "Mary-Jane" (do NOT remove hyphen)
- Maintain the exact format from the original resume
- Do NOT include contact info in the name (no email, phone, LinkedIn in the name field)
- Do NOT add extra spaces between name parts (normalize to single space)
- Name should be JUST the person's name, nothing else
- If you see "John Smith | john@email.com" at the top, extract name as "John Smith" only

Return ONLY the JSON object with no additional formatting or text.`;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.0,
        max_tokens: 8000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ OpenAI API error:', errorData);
      
      if (errorData.error?.code === 'insufficient_quota') {
        return c.json({ 
          error: 'OpenAI API quota exceeded',
          fallback: true,
          errorCode: 'OPENAI_QUOTA_EXCEEDED'
        }, 402);
      }
      
      return c.json({ 
        error: `AI parsing failed: ${errorData.error?.message || 'Unknown error'}`,
        fallback: true 
      }, 500);
    }

    const data = await response.json();
    let parsedContent = data.choices[0]?.message?.content || '';
    
    console.log('📄 Raw AI response:', parsedContent.substring(0, 200) + '...');

    // Clean up the response - remove markdown code blocks if present
    parsedContent = parsedContent.trim();
    if (parsedContent.startsWith('```json')) {
      parsedContent = parsedContent.replace(/^```json\s*/, '').replace(/```\s*$/, '');
    } else if (parsedContent.startsWith('```')) {
      parsedContent = parsedContent.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }

    // Parse the JSON response
    let resumeData;
    try {
      resumeData = JSON.parse(parsedContent);
      console.log('✅ Successfully parsed resume with AI');
    } catch (parseError) {
      console.error('❌ Failed to parse AI response as JSON:', parseError);
      console.error('Raw response:', parsedContent);
      return c.json({ 
        error: 'Failed to parse AI response. Please try again.',
        fallback: true 
      }, 500);
    }

    return c.json({ 
      success: true,
      data: resumeData
    });

  } catch (error) {
    console.error('❌ Resume parsing error:', error);
    return c.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      fallback: true 
    }, 500);
  }
});

// ============= AUTH ROUTES =============

// Sign up new user
app.post("/make-server-bc1c5df9/auth/signup", async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    // Validate password
    if (password.length < 8) {
      return c.json({ error: 'Password must be at least 8 characters' }, 400);
    }
    if (!/[0-9]/.test(password)) {
      return c.json({ error: 'Password must include at least one number' }, 400);
    }
    if (!/[a-zA-Z]/.test(password)) {
      return c.json({ error: 'Password must include at least one letter' }, 400);
    }

    // Check if email already exists in users table
    const { data: existingUserByEmail, error: emailCheckError } = await supabase
      .from('users')
      .select('email, id')
      .eq('email', email)
      .maybeSingle();

    if (existingUserByEmail) {
      return c.json({ 
        error: 'An account with this email already exists. Please sign in instead or use a different email.',
        errorCode: 'EMAIL_EXISTS'
      }, 400);
    }

    // Create user with Supabase Auth
    console.log(`Creating user account for: ${email}`);
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: {},
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.error('Signup error from Supabase Auth:', error);
      
      // Handle specific error cases with user-friendly messages
      if (error.message.includes('already been registered') || error.code === 'email_exists') {
        // User exists in Auth but maybe not in users table - try to sync
        console.log('⚠️ User exists in Auth, checking if they need to be synced to users table...');
        
        // Try to get the existing auth user
        const { data: { users: authUsers }, error: listError } = await supabase.auth.admin.listUsers();
        
        if (!listError && authUsers) {
          const existingAuthUser = authUsers.find(u => u.email === email);
          
          if (existingAuthUser) {
            // Check if this user exists in the users table
            const { data: dbUser } = await supabase
              .from('users')
              .select('id')
              .eq('id', existingAuthUser.id)
              .maybeSingle();
            
            if (!dbUser) {
              // User exists in Auth but not in users table - sync them
              console.log('📝 Syncing existing auth user to users table...');
              
              try {
                const { error: syncError } = await supabase
                  .from('users')
                  .insert({
                    id: existingAuthUser.id,
                    email: existingAuthUser.email
                  });
                
                if (!syncError) {
                  console.log('✅ Successfully synced user to database');
                  return c.json({ 
                    error: 'Your account was found and synced. Please try signing in instead.',
                    errorCode: 'ACCOUNT_SYNCED'
                  }, 400);
                } else {
                  console.error('❌ Failed to sync user:', syncError);
                }
              } catch (syncErr) {
                console.error('❌ Error during sync:', syncErr);
              }
            }
          }
        }
        
        return c.json({ 
          error: 'An account with this email already exists. Please sign in instead or use a different email.',
          errorCode: 'EMAIL_EXISTS'
        }, 400);
      }
      
      if (error.message.includes('email') && error.message.includes('invalid')) {
        return c.json({ error: 'Invalid email address. Please check and try again.' }, 400);
      }
      
      return c.json({ error: `Signup failed: ${error.message}` }, 400);
    }

    if (!data.user) {
      console.error('No user data returned from Supabase Auth');
      return c.json({ error: 'Signup failed: No user data returned' }, 500);
    }

    console.log(`✅ User created successfully in Supabase Auth with ID: ${data.user.id}`);
    
    // Insert user data into the users table
    try {
      console.log(`Inserting user into users table: ${email}`);
      const { data: insertedUser, error: insertError } = await supabase
        .from('users')
        .insert({
          id: data.user.id, // Use the same UUID from Supabase Auth
          email: email
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Failed to insert user into users table:', insertError);
        
        // Critical error - delete the auth user to maintain consistency
        console.log('🗑️ Cleaning up auth user due to database insert failure...');
        try {
          await supabase.auth.admin.deleteUser(data.user.id);
          console.log('✅ Auth user cleaned up');
        } catch (deleteErr) {
          console.error('❌ Failed to clean up auth user:', deleteErr);
        }
        
        return c.json({ 
          error: `Signup failed: ${insertError.message}. Please try again.`,
          details: insertError.hint || 'Database error'
        }, 500);
      }

      console.log('✅ User inserted into users table successfully:', insertedUser);
    } catch (dbError) {
      console.error('❌ Database error while inserting user:', dbError);
      
      // Critical error - delete the auth user to maintain consistency
      console.log('🗑️ Cleaning up auth user due to database error...');
      try {
        await supabase.auth.admin.deleteUser(data.user.id);
        console.log('✅ Auth user cleaned up');
      } catch (deleteErr) {
        console.error('❌ Failed to clean up auth user:', deleteErr);
      }
      
      return c.json({ 
        error: `Failed to save user profile: ${dbError.message}`,
        details: 'Please try again.'
      }, 500);
    }

    console.log('✅ Signup process completed successfully');
    
    return c.json({ 
      user: data.user, 
      message: 'Account created successfully! Please check your email to verify your account before signing in.' 
    });
  } catch (error) {
    console.error('Signup error:', error);
    return c.json({ error: `Signup error: ${error.message}` }, 500);
  }
});

// Get email by username (for username-based login)
app.get("/make-server-bc1c5df9/auth/username/:username", async (c) => {
  try {
    const username = c.req.param('username');
    
    console.log(`🔍 Looking up email for username: ${username}`);
    
    // First, try to get email from users table
    const { data: user, error: dbError } = await supabase
      .from('users')
      .select('email, id')
      .eq('username', username)
      .maybeSingle();
    
    if (user && user.email) {
      console.log(`✅ Found user by username in database: ${username} -> ${user.email}`);
      
      // Check if this user exists in Supabase Auth
      try {
        const { data: authData, error: authError } = await supabase.auth.admin.getUserById(user.id);
        if (authData?.user) {
          console.log(`✅ User exists in Supabase Auth with email: ${authData.user.email}`);
          console.log(`   Email confirmed: ${authData.user.email_confirmed_at ? 'YES' : 'NO'}`);
          console.log(`   Created at: ${authData.user.created_at}`);
        } else {
          console.log(`⚠️ User found in database but NOT in Supabase Auth!`);
        }
      } catch (authCheckError) {
        console.error('Error checking auth user:', authCheckError);
      }
      
      return c.json({ email: user.email });
    }
    
    if (dbError) {
      console.error('❌ Database error during username lookup:', dbError);
    }
    
    // Fallback to KV store
    console.log('⚠️ User not found in database, checking KV store...');
    const email = await kv.get(`username:${username.toLowerCase()}`);
    
    if (!email) {
      console.log(`❌ User not found: ${username}`);
      return c.json({ error: 'User not found' }, 404);
    }
    
    console.log(`✅ Found user by username in KV store: ${username} -> ${email}`);
    return c.json({ email });
  } catch (error) {
    console.error('Username lookup error:', error);
    return c.json({ error: `Username lookup failed: ${error.message}` }, 500);
  }
});

// Debug endpoint to check user data
app.get("/make-server-bc1c5df9/auth/debug/:emailOrUsername", async (c) => {
  try {
    const input = c.req.param('emailOrUsername');
    console.log(`🔍 Debug lookup for: ${input}`);
    
    let email = input;
    
    // Treat input as email directly (no username support)
    if (!input.includes('@')) {
      return c.json({
        error: 'Please provide an email address. Username login is no longer supported.'
      }, 400);
    }
    
    // Check database
    const { data: dbUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();
    
    // Check auth
    const { data: { users: authUsers }, error: listError } = await supabase.auth.admin.listUsers();
    const authUser = authUsers?.find(u => u.email === email);
    
    return c.json({
      input,
      database: dbUser ? {
        found: true,
        id: dbUser.id,
        email: dbUser.email
      } : { found: false },
      auth: authUser ? {
        found: true,
        id: authUser.id,
        email: authUser.email,
        emailConfirmed: authUser.email_confirmed_at ? true : false,
        confirmedAt: authUser.email_confirmed_at,
        createdAt: authUser.created_at
      } : { found: false }
    });
  } catch (error) {
    console.error('Debug check error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// List all users (DEBUG ONLY - remove in production)
app.get("/make-server-bc1c5df9/auth/list-users", async (c) => {
  try {
    console.log('📋 Listing all users...');
    
    // Get all users from database
    const { data: dbUsers } = await supabase
      .from('users')
      .select('id, email, created_at')
      .order('created_at', { ascending: false });
    
    // Get all users from Auth
    const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();
    
    return c.json({
      database: dbUsers || [],
      auth: authUsers?.map(u => ({
        id: u.id,
        email: u.email,
        emailConfirmed: !!u.email_confirmed_at,
        createdAt: u.created_at
      })) || [],
      count: {
        database: dbUsers?.length || 0,
        auth: authUsers?.length || 0
      }
    });
  } catch (error) {
    console.error('List users error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get current user info
app.get("/make-server-bc1c5df9/auth/me", async (c) => {
  const { error, user } = await verifyUser(c.req.header('Authorization'));
  
  if (error || !user) {
    return c.json({ error: error || 'Unauthorized' }, 401);
  }

  return c.json({ user });
});

// Reset password
app.post("/make-server-bc1c5df9/auth/reset-password", async (c) => {
  try {
    const { email } = await c.req.json();

    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }

    console.log(`🔐 Password reset requested for: ${email}`);

    // Generate a password reset link
    // NOTE: Since we don't have email configured, we'll generate a temporary password instead
    const tempPassword = `Temp${Math.random().toString(36).slice(2, 10)}1`;
    
    // Find the user in Auth
    const { data: { users: authUsers }, error: listError } = await supabase.auth.admin.listUsers();
    const authUser = authUsers?.find(u => u.email === email);
    
    if (!authUser) {
      console.log(`❌ User not found: ${email}`);
      // Don't reveal if user exists or not for security
      return c.json({ message: 'If an account exists with this email, a password reset link has been sent.' });
    }

    // Update user password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      authUser.id,
      { password: tempPassword }
    );

    if (updateError) {
      console.error('Error resetting password:', updateError);
      return c.json({ error: 'Failed to reset password. Please try again.' }, 500);
    }

    console.log(`✅ Password reset successfully for: ${email}`);
    console.log(`   Temporary password: ${tempPassword}`);
    
    // In production, this would send an email with a reset link
    // For now, we'll return the temp password in the response (NOT SECURE - for development only)
    return c.json({ 
      message: 'Your temporary password is: ' + tempPassword + ' - Please sign in and change it immediately.',
      tempPassword // REMOVE THIS IN PRODUCTION
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return c.json({ error: `Password reset failed: ${error.message}` }, 500);
  }
});

// Delete user account (ADMIN/DEBUG - should be protected in production)
app.delete("/make-server-bc1c5df9/auth/delete-user/:email", async (c) => {
  try {
    const email = c.req.param('email');
    
    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }

    console.log(`🗑️ Delete request for user: ${email}`);

    // Find the user in Auth
    const { data: { users: authUsers }, error: listError } = await supabase.auth.admin.listUsers();
    const authUser = authUsers?.find(u => u.email === email);
    
    if (!authUser) {
      console.log(`❌ User not found in Auth: ${email}`);
      return c.json({ error: 'User not found in Auth' }, 404);
    }

    const userId = authUser.id;
    console.log(`Found user with ID: ${userId}`);

    // Delete from database first
    try {
      const { error: dbError } = await supabase
        .from('users')
        .delete()
        .eq('email', email);
      
      if (dbError) {
        console.error('❌ Database delete error:', dbError);
      } else {
        console.log('✅ User deleted from database');
      }
    } catch (dbErr) {
      console.error('❌ Error deleting from database:', dbErr);
    }

    // Delete from Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    
    if (authError) {
      console.error('❌ Auth delete error:', authError);
      return c.json({ error: `Failed to delete user from Auth: ${authError.message}` }, 500);
    }

    console.log('✅ User deleted from Auth');

    // Clean up KV store
    try {
      // Get username from database first
      const { data: dbUser } = await supabase
        .from('users')
        .select('username')
        .eq('email', email)
        .maybeSingle();
      
      if (dbUser?.username) {
        await kv.del(`username:${dbUser.username.toLowerCase()}`);
        console.log(`✅ Deleted KV: username:${dbUser.username.toLowerCase()}`);
      }
      
      await kv.del(`user:${userId}:username`);
      console.log(`✅ Deleted KV: user:${userId}:username`);
      
      // Delete user's resumes
      const resumeIds = await kv.get(`user:${userId}:resumes`) || [];
      for (const resumeId of resumeIds) {
        await kv.del(`resume:${resumeId}`);
        console.log(`✅ Deleted resume: ${resumeId}`);
      }
      await kv.del(`user:${userId}:resumes`);
      console.log(`✅ Deleted user resumes list`);
      
    } catch (kvErr) {
      console.error('⚠️ Error cleaning up KV store:', kvErr);
    }

    console.log(`✅ User account completely deleted: ${email}`);
    
    return c.json({ 
      message: `User account ${email} has been completely deleted from Auth, database, and KV store.`,
      userId 
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return c.json({ error: `Failed to delete user: ${error.message}` }, 500);
  }
});

// ============= RESUME ROUTES =============

// Create new resume
app.post("/make-server-bc1c5df9/resumes", async (c) => {
  const { error, user } = await verifyUser(c.req.header('Authorization'));
  
  if (error || !user) {
    return c.json({ error: error || 'Unauthorized' }, 401);
  }

  try {
    const resumeData = await c.req.json();
    const resumeId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    const resume = {
      id: resumeId,
      userId: user.id,
      ...resumeData,
      createdAt: timestamp,
      updatedAt: timestamp,
      version: 1
    };

    // Store resume
    await kv.set(`resume:${resumeId}`, resume);
    
    // Add to user's resume list
    const userResumesKey = `user:${user.id}:resumes`;
    const existingResumes = await kv.get(userResumesKey) || [];
    await kv.set(userResumesKey, [...existingResumes, resumeId]);

    // Create initial version
    await kv.set(`resume:${resumeId}:version:1`, {
      version: 1,
      data: resumeData,
      timestamp,
      note: 'Initial upload'
    });

    return c.json({ resume, message: 'Resume created successfully' });
  } catch (error) {
    console.error('Error creating resume:', error);
    return c.json({ error: `Failed to create resume: ${error.message}` }, 500);
  }
});

// Get all resumes for user
app.get("/make-server-bc1c5df9/resumes", async (c) => {
  const { error, user } = await verifyUser(c.req.header('Authorization'));
  
  if (error || !user) {
    return c.json({ error: error || 'Unauthorized' }, 401);
  }

  try {
    const userResumesKey = `user:${user.id}:resumes`;
    const resumeIds = await kv.get(userResumesKey) || [];
    
    const resumeKeys = resumeIds.map(id => `resume:${id}`);
    const resumes = resumeKeys.length > 0 ? await kv.mget(resumeKeys) : [];

    return c.json({ resumes });
  } catch (error) {
    console.error('Error fetching resumes:', error);
    return c.json({ error: `Failed to fetch resumes: ${error.message}` }, 500);
  }
});

// Get specific resume
app.get("/make-server-bc1c5df9/resumes/:id", async (c) => {
  const { error, user } = await verifyUser(c.req.header('Authorization'));
  
  if (error || !user) {
    return c.json({ error: error || 'Unauthorized' }, 401);
  }

  try {
    const resumeId = c.req.param('id');
    const resume = await kv.get(`resume:${resumeId}`);

    if (!resume) {
      return c.json({ error: 'Resume not found' }, 404);
    }

    if (resume.userId !== user.id) {
      return c.json({ error: 'Unauthorized access to this resume' }, 403);
    }

    return c.json({ resume });
  } catch (error) {
    console.error('Error fetching resume:', error);
    return c.json({ error: `Failed to fetch resume: ${error.message}` }, 500);
  }
});

// Update resume
app.put("/make-server-bc1c5df9/resumes/:id", async (c) => {
  const { error, user } = await verifyUser(c.req.header('Authorization'));
  
  if (error || !user) {
    return c.json({ error: error || 'Unauthorized' }, 401);
  }

  try {
    const resumeId = c.req.param('id');
    const updates = await c.req.json();
    
    const resume = await kv.get(`resume:${resumeId}`);

    if (!resume) {
      return c.json({ error: 'Resume not found' }, 404);
    }

    if (resume.userId !== user.id) {
      return c.json({ error: 'Unauthorized access to this resume' }, 403);
    }

    const timestamp = new Date().toISOString();
    const newVersion = (resume.version || 1) + 1;

    const updatedResume = {
      ...resume,
      ...updates,
      updatedAt: timestamp,
      version: newVersion
    };

    await kv.set(`resume:${resumeId}`, updatedResume);

    // Save version history
    if (updates.saveVersion !== false) {
      await kv.set(`resume:${resumeId}:version:${newVersion}`, {
        version: newVersion,
        data: updates,
        timestamp,
        note: updates.versionNote || 'Update'
      });
    }

    return c.json({ resume: updatedResume, message: 'Resume updated successfully' });
  } catch (error) {
    console.error('Error updating resume:', error);
    return c.json({ error: `Failed to update resume: ${error.message}` }, 500);
  }
});

// Delete resume
app.delete("/make-server-bc1c5df9/resumes/:id", async (c) => {
  const { error, user } = await verifyUser(c.req.header('Authorization'));
  
  if (error || !user) {
    return c.json({ error: error || 'Unauthorized' }, 401);
  }

  try {
    const resumeId = c.req.param('id');
    const resume = await kv.get(`resume:${resumeId}`);

    if (!resume) {
      return c.json({ error: 'Resume not found' }, 404);
    }

    if (resume.userId !== user.id) {
      return c.json({ error: 'Unauthorized access to this resume' }, 403);
    }

    // Delete resume
    await kv.del(`resume:${resumeId}`);
    
    // Remove from user's resume list
    const userResumesKey = `user:${user.id}:resumes`;
    const resumeIds = await kv.get(userResumesKey) || [];
    await kv.set(userResumesKey, resumeIds.filter(id => id !== resumeId));

    // Delete all versions
    const versionKeys = await kv.getByPrefix(`resume:${resumeId}:version:`);
    if (versionKeys.length > 0) {
      await kv.mdel(versionKeys.map(v => v.key));
    }

    return c.json({ message: 'Resume deleted successfully' });
  } catch (error) {
    console.error('Error deleting resume:', error);
    return c.json({ error: `Failed to delete resume: ${error.message}` }, 500);
  }
});

// Get resume versions
app.get("/make-server-bc1c5df9/resumes/:id/versions", async (c) => {
  const { error, user } = await verifyUser(c.req.header('Authorization'));
  
  if (error || !user) {
    return c.json({ error: error || 'Unauthorized' }, 401);
  }

  try {
    const resumeId = c.req.param('id');
    const resume = await kv.get(`resume:${resumeId}`);

    if (!resume) {
      return c.json({ error: 'Resume not found' }, 404);
    }

    if (resume.userId !== user.id) {
      return c.json({ error: 'Unauthorized access to this resume' }, 403);
    }

    const versions = await kv.getByPrefix(`resume:${resumeId}:version:`);
    const sortedVersions = versions
      .map(v => v.value)
      .sort((a, b) => b.version - a.version);

    return c.json({ versions: sortedVersions });
  } catch (error) {
    console.error('Error fetching versions:', error);
    return c.json({ error: `Failed to fetch versions: ${error.message}` }, 500);
  }
});

// ============= AI OPTIMIZATION ROUTES =============

// Optimize resume section with AI (no auth required - public feature)
app.post("/make-server-bc1c5df9/optimize", async (c) => {
  try {
    console.log('📝 Optimize endpoint called - no auth required');
    const { resumeSection, jobDescription, sectionType, industryTone, rewriteStyle } = await c.req.json();

    if (!resumeSection || !jobDescription) {
      console.log('❌ Missing required fields');
      return c.json({ error: 'Resume section and job description are required' }, 400);
    }

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiKey) {
      console.log('❌ OpenAI API key not found in environment');
      return c.json({ 
        error: 'OpenAI API key not configured. Please add your OPENAI_API_KEY in the environment variables.' 
      }, 500);
    }
    
    if (!openaiKey.startsWith('sk-')) {
      console.log('⚠️ OpenAI API key appears invalid (does not start with sk-)');
      return c.json({ 
        error: 'OpenAI API key appears invalid. Please check your OPENAI_API_KEY value.' 
      }, 500);
    }
    
    console.log(`✅ API key found, optimizing section: ${sectionType} with tone: ${industryTone}, style: ${rewriteStyle}`);

    // Build dynamic prompt based on tone and style
    // These instructions are injected into the OpenAI prompt to customize the optimization
    const toneInstructions = {
      none: 'Use natural, professional language without any specific tone emphasis.',
      professional: 'Use professional and formal language. Focus on industry-standard terminology and maintain a business-appropriate tone.',
      creative: 'Use creative and dynamic language. Be innovative with word choice while staying professional. Showcase unique value and personality.',
      technical: 'Use technical and precise language. Include specific technical terms, methodologies, and quantifiable metrics. Be detailed and accurate.',
      executive: 'Use executive and strategic language. Focus on leadership, strategic impact, and high-level business outcomes. Emphasize vision and results.'
    };

    const styleInstructions = {
      none: 'Maintain a natural writing style without specific emphasis on length or structure.',
      concise: 'Keep the content concise and brief. Remove unnecessary words while retaining all key information. Aim for clarity and brevity.',
      detailed: 'Provide detailed and comprehensive descriptions. Expand on accomplishments with context and specifics.',
      balanced: 'Balance detail with brevity. Include enough context to be clear while remaining concise.',
      achievement: 'Focus heavily on achievements and measurable results. Lead with outcomes and quantify impact wherever possible.'
    };

    const toneGuidance = toneInstructions[industryTone as keyof typeof toneInstructions] || toneInstructions.none;
    const styleGuidance = styleInstructions[rewriteStyle as keyof typeof styleInstructions] || styleInstructions.none;

    // Determine if this is a factual/conservative section (Contact, Education, Skills)
    const conservativeSections = ['HEADER', 'CONTACT', 'EDUCATION', 'ACADEMIC BACKGROUND', 'SKILLS', 'TECHNICAL SKILLS', 'CORE COMPETENCIES', 'CORE SKILLS', 'KEY SKILLS', 'CERTIFICATIONS', 'CERTIFICATES', 'PROFESSIONAL CERTIFICATIONS', 'LICENSES AND CERTIFICATIONS', 'LANGUAGES'];
    const isConservativeSection = conservativeSections.some(section => 
      sectionType.toUpperCase().includes(section) || section.includes(sectionType.toUpperCase())
    );

    let systemPrompt;

    if (isConservativeSection) {
      // Conservative optimization for factual sections
      systemPrompt = `You are an expert resume writer specializing in ATS-optimized content. 

SECTION TYPE: ${sectionType} (FACTUAL/INFORMATIONAL)

IMPORTANT: This section contains factual information (contact details, education, skills, certifications, or languages). Make MINIMAL changes.

CONSERVATIVE OPTIMIZATION RULES:
- Preserve ALL factual information exactly as provided (names, dates, locations, degrees, skills, tools, contact info)
- Only make minor formatting improvements for consistency
- Fix obvious typos or formatting inconsistencies
- Ensure proper capitalization and punctuation
- Keep the same structure and organization
- Do NOT add skills, tools, or qualifications that aren't listed
- Do NOT embellish or exaggerate educational achievements
- Do NOT modify contact information
- Do NOT rewrite or rephrase - just clean up formatting

CRITICAL INSTRUCTIONS:
- Return ONLY the cleaned-up content itself
- Do NOT include any introductory phrases like "Here's the optimized version"
- Do NOT include any commentary, explanations, or meta-text
- Do NOT include section headers unless they were in the original
- Simply provide the minimally improved content that can directly replace the original text

Your task is to make minimal, conservative improvements to factual resume sections while preserving all original information.`;
    } else {
      // Regular optimization for experience/summary sections
      systemPrompt = `You are an expert resume writer specializing in ATS-optimized content. 

TONE: ${toneGuidance}

STYLE: ${styleGuidance}

CRITICAL INSTRUCTIONS:
- Return ONLY the optimized resume content itself
- Do NOT include any introductory phrases like "Here's the optimized version" or "Key strengths aligned with role:"
- Do NOT include any comparison text like "Highlighted skills matching job requirements:"
- Do NOT include any commentary, explanations, or meta-text
- Do NOT include section headers unless they were in the original
- Simply provide the improved content that can directly replace the original text

Your task is to optimize resume sections to better match job descriptions while maintaining the original format and structure. Use strong action verbs, quantify achievements where possible, and incorporate relevant keywords from the job description.`;
    }

    let userPrompt;
    
    if (isConservativeSection) {
      userPrompt = `Resume Section (${sectionType}):
${resumeSection}

This is a factual section containing ${sectionType.toLowerCase()}. Make ONLY minimal formatting improvements. Do NOT add, remove, or significantly modify any information. Fix typos and ensure consistent formatting. Return ONLY the cleaned-up content with no additional commentary or explanatory text.`;
    } else {
      userPrompt = `Job Description:
${jobDescription}

Resume Section (${sectionType}):
${resumeSection}

Optimize this resume section to better match the job description while following the specified tone and style guidelines. Return ONLY the optimized content with no additional commentary or explanatory text.`;
    }

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ OpenAI API error:', errorData);
      
      // Check for quota error specifically
      if (errorData.error?.code === 'insufficient_quota') {
        return c.json({ 
          error: 'OpenAI API quota exceeded',
          details: 'Your OpenAI API key has run out of credits. Please add credits at https://platform.openai.com/settings/organization/billing or upload a new API key with available credits.',
          errorCode: 'OPENAI_QUOTA_EXCEEDED'
        }, 402);
      }
      
      return c.json({ error: `AI optimization failed: ${errorData.error?.message || 'Unknown error'}` }, 500);
    }

    const data = await response.json();
    let optimizedText = data.choices[0]?.message?.content || resumeSection;
    
    // Clean up any commentary or meta-text that might have been included
    // Remove common introductory phrases
    const unwantedPhrases = [
      /^Here'?s? (the )?optimized (version|content|text|resume|section):?\s*/i,
      /^Optimized (version|content|text|resume|section):?\s*/i,
      /^Key strengths aligned with (the )?role:?\s*/i,
      /^Highlighted skills matching job requirements:?\s*/i,
      /^(The )?following is (the )?optimized:?\s*/i,
      /^This (version|section) (has been )?optimized:?\s*/i,
      /^Updated (version|content|text):?\s*/i,
      /^\*\*Optimized.*?\*\*:?\s*/i,
      /^Revised (version|content|text):?\s*/i
    ];
    
    for (const phrase of unwantedPhrases) {
      optimizedText = optimizedText.replace(phrase, '');
    }
    
    // Remove any leading/trailing whitespace
    optimizedText = optimizedText.trim();
    
    console.log('✅ AI optimization successful');

    // Generate context-aware suggestions based on tone and style
    const toneSuggestions = {
      professional: ['Ensure all language maintains professional standards', 'Use industry-standard terminology'],
      creative: ['Highlight unique approaches and innovative solutions', 'Showcase personality while staying professional'],
      technical: ['Include specific technical methodologies and tools', 'Quantify technical achievements with metrics'],
      executive: ['Emphasize strategic impact and leadership', 'Focus on business outcomes and vision']
    };

    const styleSuggestions = {
      concise: ['Remove redundant phrases for maximum brevity', 'Each word should add value'],
      detailed: ['Provide comprehensive context for achievements', 'Include specific examples and details'],
      balanced: ['Balance brevity with necessary context', 'Keep descriptions clear and informative'],
      achievement: ['Lead with measurable results', 'Quantify all achievements with numbers or percentages']
    };

    const suggestions = [
      toneSuggestions[industryTone as keyof typeof toneSuggestions]?.[0] || 'Maintain consistency with chosen tone',
      styleSuggestions[rewriteStyle as keyof typeof styleSuggestions]?.[0] || 'Follow the selected writing style',
      'Incorporate keywords from the job description naturally'
    ];

    return c.json({ 
      optimizedText,
      suggestions,
      message: 'Section optimized successfully'
    });
  } catch (error) {
    console.error('Error optimizing resume:', error);
    return c.json({ error: `Optimization failed: ${error.message}` }, 500);
  }
});

// Analyze job match score (no auth required - public feature)
app.post("/make-server-bc1c5df9/analyze-match", async (c) => {
  try {
    console.log('🎯 Analyze-match endpoint called - no auth required');
    const { resume, jobDescription } = await c.req.json();

    if (!resume || !jobDescription) {
      console.log('❌ Missing required fields for analysis');
      return c.json({ error: 'Resume and job description are required' }, 400);
    }

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiKey) {
      console.log('❌ OpenAI API key not found in environment');
      return c.json({ 
        error: 'OpenAI API key not configured. Please add your OPENAI_API_KEY in the environment variables.' 
      }, 500);
    }
    
    console.log('✅ Starting AI match analysis');

    // Combine resume sections into full text
    const resumeText = Object.entries(resume)
      .filter(([key]) => !['id', 'userId', 'createdAt', 'updatedAt', 'version'].includes(key))
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join('\n\n');

    // Call OpenAI API for analysis
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert ATS (Applicant Tracking System) analyzer. Analyze how well a resume matches a job description and provide a match score (0-100), key strengths, gaps, and recommendations. Return your response as JSON with this structure:
{
  "score": number (0-100),
  "strengths": [string array of 3-5 key strengths],
  "gaps": [string array of 3-5 missing elements],
  "recommendations": [string array of 3-5 specific improvements]
}`
          },
          {
            role: 'user',
            content: `Job Description:\n${jobDescription}\n\nResume:\n${resumeText}\n\nProvide a detailed match analysis.`
          }
        ],
        temperature: 0.5,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ OpenAI API error:', errorData);
      
      // Check for quota error specifically
      if (errorData.error?.code === 'insufficient_quota') {
        return c.json({ 
          error: 'OpenAI API quota exceeded',
          details: 'Your OpenAI API key has run out of credits. Please add credits at https://platform.openai.com/settings/organization/billing or upload a new API key with available credits.',
          errorCode: 'OPENAI_QUOTA_EXCEEDED'
        }, 402);
      }
      
      return c.json({ error: `Match analysis failed: ${errorData.error?.message || 'Unknown error'}` }, 500);
    }

    const data = await response.json();
    const analysisText = data.choices[0]?.message?.content || '{}';
    console.log('✅ AI match analysis successful');
    
    // Parse JSON response
    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch (parseError) {
      // If JSON parsing fails, return a default analysis
      analysis = {
        score: 75,
        strengths: ['Relevant experience', 'Strong technical skills', 'Good educational background'],
        gaps: ['Missing specific certifications', 'Could add more metrics', 'Limited industry-specific keywords'],
        recommendations: ['Add quantifiable achievements', 'Include relevant certifications', 'Tailor keywords to job description']
      };
    }

    return c.json({ 
      analysis,
      message: 'Match analysis completed'
    });
  } catch (error) {
    console.error('Error analyzing match:', error);
    return c.json({ error: `Match analysis failed: ${error.message}` }, 500);
  }
});

// Upload resume file to storage
app.post("/make-server-bc1c5df9/upload-file", async (c) => {
  const { error, user } = await verifyUser(c.req.header('Authorization'));
  
  if (error || !user) {
    return c.json({ error: error || 'Unauthorized' }, 401);
  }

  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`;
    const bucketName = 'make-bc1c5df9-resumes';

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return c.json({ error: `File upload failed: ${uploadError.message}` }, 500);
    }

    // Get signed URL for private access
    const { data: urlData } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(fileName, 3600); // 1 hour expiry

    return c.json({ 
      filePath: uploadData.path,
      signedUrl: urlData?.signedUrl,
      message: 'File uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return c.json({ error: `File upload failed: ${error.message}` }, 500);
  }
});

Deno.serve(app.fetch);