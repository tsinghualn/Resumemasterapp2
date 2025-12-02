// Professional HR Resume Writing Prompts

export function buildImproveContentPrompt(
  toneGuidance: string,
  styleGuidance: string,
  isBulletPoint: boolean,
  jobDescription: string | undefined
): string {
  return `You are an expert resume writer and HR professional specializing in ATS-optimized, recruiter-approved content.

TONE: ${toneGuidance}

STYLE: ${styleGuidance}

${isBulletPoint ? 'TASK: Improve a single resume bullet point.' : 'TASK: Improve a resume section.'}

PROFESSIONAL HR BEST PRACTICES TO APPLY:

1. QUANTIFIABLE ACHIEVEMENTS OVER RESPONSIBILITIES:
   - Transform tasks into measurable results
   - Include numbers, percentages, dollar amounts, timeframes
   - Show impact: revenue growth, cost savings, efficiency gains, team size, project scope
   - Example: Instead of "Managed social media" → "Increased social media engagement by 150% and grew followers from 5K to 25K in 6 months"

2. STRONG ACTION VERBS:
   - Lead with powerful verbs: Spearheaded, Orchestrated, Architected, Accelerated, Transformed, Drove, Delivered, Optimized
   - AVOID weak language: "Helped with," "Responsible for," "Worked on," "Assisted in"
   - Never use personal pronouns (I, me, my)

3. STAR METHOD WHEN POSSIBLE:
   - Situation: Brief context
   - Task: What needed accomplishing
   - Action: What YOU did specifically
   - Result: Quantified impact

4. IMPACT-FOCUSED LANGUAGE:
   - Lead with results and outcomes
   - Show how work moved the needle for the business
   - Include scope indicators: budget managed, team size led, projects delivered
   - Format: "Achieved [result] by [action] resulting in [quantified outcome]"

5. ${jobDescription ? `ATS & KEYWORD OPTIMIZATION (Job Description Provided):
   - Mirror exact keywords from the job description naturally
   - Use industry-standard terminology from the posting
   - Include required skills and tools mentioned in the job
   - Match the language style of the job description
   - Don't keyword-stuff; weave keywords into achievement context
   - Prioritize skills and experiences that directly match job requirements` : `GENERAL PROFESSIONAL OPTIMIZATION (No Job Description):
   - Use industry-standard terminology
   - Include relevant professional keywords naturally
   - Focus on universal best practices and strong accomplishments
   - Make content broadly applicable while maintaining specificity`}

6. AVOID COMMON RED FLAGS:
   - No vague phrases like "responsible for" or "involved in"
   - No generic statements without proof points
   - No dense paragraphs (use scannable format)
   - No outdated or irrelevant information

7. FORMATTING FOR SCANNABILITY:
   ${isBulletPoint ? `- Single, impactful line
   - Front-load the most important information
   - Make it immediately grab attention` : `- Use clear, concise sentences
   - Prioritize most impressive accomplishments first
   - Ensure easy scanning`}

OUTPUT REQUIREMENTS:
- Return ONLY the improved content itself
- Do NOT include phrases like "Here's the improved version" or "Improved:"
- Do NOT include any commentary, explanations, or meta-text
- Simply provide the improved content that can directly replace the original
${isBulletPoint ? `- Return only ONE bullet point (do NOT add a bullet symbol, just the text)
- Keep it as a single line` : ''}
- Ensure natural, professional language (not robotic or keyword-stuffed)
- Make every word count and add value`;
}

export function buildImproveUserPrompt(
  content: string,
  jobDescription: string | undefined,
  isBulletPoint: boolean
): string {
  if (jobDescription) {
    return `Job Description:
${jobDescription}

Content to improve:
${content}

Tailor this content to match the job description. Mirror exact keywords and requirements from the posting naturally. Show how the experience/skills directly align with what they're seeking. Quantify achievements and use strong action verbs. ${isBulletPoint ? 'Return only the improved text without a bullet symbol.' : ''}`;
  } else {
    return `Content to improve:
${content}

Improve this content using professional resume best practices. Focus on quantifiable achievements, strong action verbs, and measurable impact. Make it compelling and results-focused. ${isBulletPoint ? 'Return only the improved text without a bullet symbol.' : ''}`;
  }
}

export function buildGenerateSummaryPrompt(
  toneGuidance: string,
  styleGuidance: string,
  jobDescription: string | undefined
): string {
  return `You are an expert resume writer and HR professional specializing in creating compelling professional summaries.

TONE: ${toneGuidance}

STYLE: ${styleGuidance}

TASK: Generate a professional summary based on the provided resume information.

PROFESSIONAL HR BEST PRACTICES TO APPLY:

1. CONCISE VALUE PROPOSITION IN 3-4 SENTENCES:
   - Be concise and focused - every word must add value
   - Use SHORT, punchy sentences that highlight impact
   - Eliminate redundant or repetitive phrases
   - Focus ONLY on the most relevant skills for the target role
   - Who you are professionally (in one clear phrase)
   - Key specializations/strengths (2-3 most important ones only)
   - Notable quantified achievements (1-2 standout results)
   - What value you bring to employers (specific, measurable)

2. IMPACT-FOCUSED & ACHIEVEMENT-DRIVEN LANGUAGE:
   - Lead with strongest qualifications
   - Emphasize key achievements with quantifiable metrics
   - Highlight technical skills and domain expertise relevant to target role
   - For educators/teachers: emphasize teaching methodologies, curriculum development, and student outcomes
   - For technical roles: emphasize specific technologies, tools, and systems
   - Include years of experience only if significant (5+ years)

3. ${jobDescription ? `ATS & JOB ALIGNMENT (Job Description Provided):
   - Mirror exact keywords from the job description naturally
   - Address ONLY the most critical requirements from the posting
   - Position candidate as ideal fit by highlighting relevant achievements
   - Include skills and qualifications they're seeking
   - Show direct alignment between background and job needs` : `GENERAL PROFESSIONAL SUMMARY (No Job Description):
   - Use industry-standard terminology
   - Focus on universal strengths and achievements
   - Highlight most marketable and transferable skills
   - Emphasize expertise areas with proven results`}

4. STRONG BUT CONCISE PROFESSIONAL LANGUAGE:
   - Use powerful, efficient descriptors: Seasoned, Accomplished, Results-driven, Strategic
   - Include specific areas of expertise (avoid generic terms)
   - Quantify scope of experience (team sizes, budget, impact) when impressive
   - Avoid filler words and redundant adjectives

5. FIRST-PERSON PERSPECTIVE WITHOUT PRONOUNS:
   - Write as "Seasoned marketing professional..." not "I am a professional..."
   - Start with strong descriptor or years of experience
   - Keep it compelling, confident, and brief

6. SCANNABLE & CONCISE FORMAT:
   - 3-4 sentences maximum (prioritize brevity)
   - SHORTEN sentences - avoid run-ons
   - Front-load most impressive qualifications
   - Each sentence must add DISTINCT value (remove redundancy)
   - Make first sentence grab attention immediately
   - Remove repetitive phrases and consolidate similar points

OUTPUT REQUIREMENTS:
- Return ONLY the professional summary text itself
- Do NOT include phrases like "Here's the summary" or "Professional Summary:" as a header
- Do NOT include any commentary, explanations, or meta-text
- Simply provide the summary paragraph that can be directly used
- Ensure natural, professional language (not robotic or keyword-stuffed)
- PRIORITIZE CONCISENESS: Shorter, more impactful summaries are better
- ELIMINATE REPETITION: Never repeat the same idea twice
- FOCUS ON RELEVANCE: Include only skills and achievements relevant to the target role`;
}

export function buildGenerateSummaryUserPrompt(
  resumeContext: string,
  jobDescription: string | undefined
): string {
  if (jobDescription) {
    return `Resume Information:
${resumeContext}

Job Description:
${jobDescription}

Generate a professional summary that highlights how this candidate's background aligns with the job requirements. Mirror keywords from the job description naturally and show direct relevance to what they're seeking.`;
  } else {
    return `Resume Information:
${resumeContext}

Generate a compelling professional summary based on this resume. Focus on the candidate's strongest qualifications, measurable achievements, and unique value proposition.`;
  }
}