// Job Matching Score Calculator
// Implements weighted scoring: Skills (40%), Experience (25%), Education (15%), Achievements (10%), Soft Skills (10%)

export const calculateMatchScoreHandler = async (c: any) => {
  try {
    console.log('📊 Calculate-match-score endpoint called');
    const { resumeData, jobDescription } = await c.req.json();

    if (!resumeData || !jobDescription) {
      return c.json({ error: 'Resume data and job description are required' }, 400);
    }

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiKey) {
      return c.json({ 
        error: 'OpenAI API key not configured. Please add your OPENAI_API_KEY in the environment variables.' 
      }, 500);
    }
    
    if (!openaiKey.startsWith('sk-')) {
      return c.json({ 
        error: 'OpenAI API key appears invalid. Please check your OPENAI_API_KEY value.' 
      }, 500);
    }

    // Build resume context for analysis
    const resumeContext = `
CONTACT INFORMATION:
Name: ${resumeData.personalDetails?.firstName || ''} ${resumeData.personalDetails?.lastName || ''}
Job Title: ${resumeData.personalDetails?.jobTitle || ''}
Email: ${resumeData.contact?.email || ''}
Phone: ${resumeData.contact?.phone || ''}
Location: ${resumeData.contact?.address || resumeData.contact?.location || ''}
LinkedIn: ${resumeData.contact?.linkedin || ''}
Website: ${resumeData.contact?.website || ''}

PROFESSIONAL SUMMARY:
${resumeData.summary || 'Not provided'}

WORK EXPERIENCE:
${resumeData.experience?.map((exp: any, idx: number) => `
Experience ${idx + 1}:
- Job Title: ${exp.title}
- Company: ${exp.company}
- Location: ${exp.location || 'Not specified'}
- Duration: ${exp.startDate} to ${exp.endDate}
- Description: ${exp.description || ''}
${exp.achievements && exp.achievements.length > 0 ? `- Achievements:\n${exp.achievements.map((a: string) => `  • ${a}`).join('\n')}` : ''}
`).join('\n') || 'Not provided'}

EDUCATION:
${resumeData.education?.map((edu: any) => `
- Degree: ${edu.degree}
- Field of Study: ${edu.field}
- Institution: ${edu.institution}
- Graduation: ${edu.graduationDate}
${edu.gpa ? `- GPA: ${edu.gpa}` : ''}
${edu.achievements ? `- Achievements: ${edu.achievements}` : ''}
`).join('\n') || 'Not provided'}

SKILLS:
${resumeData.skills?.join(', ') || 'Not provided'}

CERTIFICATIONS:
${resumeData.certifications?.map((cert: any) => `
- ${cert.name} - ${cert.issuer} (${cert.date})
${cert.description ? `  Description: ${cert.description}` : ''}
`).join('\n') || 'Not provided'}

LINKS & PORTFOLIO:
${resumeData.links?.map((link: any) => `${link.platform}: ${link.url}`).join('\n') || 'Not provided'}

CUSTOM SECTIONS:
${resumeData.customSections?.map((section: any) => `
${section.title}:
${section.content}
`).join('\n') || 'Not provided'}
`.trim();

    const systemPrompt = `You are an expert ATS (Applicant Tracking System) and HR professional specializing in resume-job matching analysis.

Your task is to analyze how well a resume matches a job description using a weighted scoring framework:

SCORING DIMENSIONS & WEIGHTS:
1. Skills Match (40%) - Hard skills, tools, frameworks, technologies, certifications
2. Experience Match (25%) - Years of experience, industry relevance, role similarity
3. Education (15%) - Degree requirements, field of study, academic credentials
4. Achievements (10%) - Quantifiable impact, metrics, accomplishments that align with role goals
5. Soft Skills (10%) - Leadership, teamwork, communication, adaptability, culture fit

ANALYSIS METHODOLOGY:

**1. SKILLS MATCH (40%)**
- Extract all hard skills from resume and job description
- Identify REQUIRED skills vs PREFERRED skills from job description
- Calculate keyword overlap (exact matches)
- Consider semantic similarity (e.g., "ML" = "Machine Learning", "ETL pipelines" = "data ingestion")
- Normalize terms and check for synonyms
- Weight required skills higher than preferred skills
- Score based on: (matched required skills / total required skills) * 0.7 + (matched preferred skills / total preferred skills) * 0.3

**2. EXPERIENCE MATCH (25%)**
- Compare years of experience: required vs actual
- Evaluate industry/domain relevance (e.g., healthcare, finance, SaaS, tech)
- Assess role similarity (e.g., current role vs target role alignment)
- Consider seniority level (entry, mid, senior, lead, executive)
- Score progression and career trajectory

**3. EDUCATION (15%)**
- Check if required degree is present (BS, MS, PhD)
- Verify field of study alignment (Computer Science, Engineering, Business, etc.)
- Evaluate certifications (AWS, PMP, Google Cloud, etc.)
- Give full credit for meeting requirements, partial for related fields
- Preferred qualifications add bonus but aren't mandatory

**4. ACHIEVEMENTS (10%)**
- Identify quantifiable metrics in resume (%, $, time saved, growth numbers)
- Match achievements to job description goals and KPIs
- Look for impact statements: "increased X by Y%", "reduced Z by N%", "managed team of M"
- Evaluate relevance of achievements to target role responsibilities

**5. SOFT SKILLS (10%)**
- Extract soft skills mentioned: leadership, teamwork, communication, problem-solving
- Match against job description's cultural values and team dynamics
- Look for evidence (e.g., "led cross-functional team" shows leadership)
- Consider work environment fit (remote, collaborative, fast-paced, etc.)

OUTPUT FORMAT (JSON only):
{
  "overallScore": <0-100 number>,
  "dimensionScores": {
    "skills": <0-100 number>,
    "experience": <0-100 number>,
    "education": <0-100 number>,
    "achievements": <0-100 number>,
    "softSkills": <0-100 number>
  },
  "strengths": [
    "First strength (specific skill/experience that matches)",
    "Second strength (another key match)",
    "Third strength (additional positive match)"
  ],
  "gaps": [
    "First gap (specific missing skill or qualification)",
    "Second gap (another area for improvement)",
    "Third gap (additional missing element)"
  ],
  "matchedSkills": [
    "Python", "SQL", "Project Management" (list of matched skills)
  ],
  "missingSkills": [
    "AWS", "Docker", "Kubernetes" (list of missing required/preferred skills)
  ],
  "experienceAnalysis": {
    "yearsRequired": "3-5 years",
    "yearsInResume": "5 years",
    "industryMatch": "Strong - Both in tech/SaaS",
    "roleAlignment": "High - Direct experience in similar position"
  },
  "summary": "Brief 2-3 sentence summary of overall fit and recommendation",
  "improvementSuggestions": [
    "First professional HR suggestion based on job description match",
    "Second actionable recommendation from HR perspective",
    "Third specific improvement area",
    "Fourth optimization suggestion",
    "Fifth strategic enhancement"
  ]
}

SCORING CALIBRATION:
- 90-100%: Exceptional match - Exceeds requirements, strong hire
- 80-89%: Strong match - Meets all core requirements, recommended
- 70-79%: Good match - Meets most requirements, worth interviewing
- 60-69%: Fair match - Meets some requirements, has potential with development
- 50-59%: Weak match - Significant gaps, may not be suitable
- Below 50%: Poor match - Does not meet core requirements

IMPORTANT:
- Be realistic and objective in scoring
- A score of 80%+ indicates a strong match
- Consider both exact keyword matches AND semantic similarity
- Normalize all terms (e.g., "ML" → "Machine Learning", "JS" → "JavaScript")
- Weight REQUIRED skills more heavily than PREFERRED skills
- Provide actionable insights in strengths and gaps
- Keep strengths/gaps concise but specific (not generic)

**IMPROVEMENT SUGGESTIONS (Professional HR Perspective):**
- Generate 5 specific, actionable suggestions to improve the resume
- If job description is provided: Base suggestions on improving the match for this specific job (e.g., "Add experience with Docker to meet containerization requirements", "Quantify your project management achievements with metrics")
- If no job description or it's vague: Provide general professional HR best practices based on the resume content (e.g., "Add metrics to quantify achievements in your latest role", "Strengthen your professional summary by highlighting your unique value proposition")
- Suggestions should be:
  * Specific and actionable (not generic advice like "improve your resume")
  * Based on missing skills, weak areas, or industry best practices
  * Prioritized by impact (most important improvements first)
  * Professional and constructive in tone
  * Focused on content, not formatting

Return ONLY valid JSON, no additional text.`;

    const userPrompt = `
JOB DESCRIPTION:
${jobDescription}

===

RESUME:
${resumeContext}

===

Analyze the match between this resume and job description. Use the weighted scoring framework to calculate scores for each dimension, then provide the overall match score, strengths, gaps, and detailed analysis in JSON format.`;

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
        temperature: 0.3,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      
      if (errorData.error?.code === 'insufficient_quota') {
        return c.json({
          error: 'OpenAI API quota exceeded',
          details: 'Please add credits at https://platform.openai.com/settings/organization/billing',
          errorCode: 'OPENAI_QUOTA_EXCEEDED'
        }, 402);
      }
      
      return c.json({ error: `Match score calculation failed: ${errorData.error?.message || 'Unknown error'}` }, 500);
    }

    const data = await response.json();
    const matchResult = JSON.parse(data.choices[0]?.message?.content || '{}');
    
    console.log('✅ Match score calculated successfully:', {
      overallScore: matchResult.overallScore,
      dimensions: matchResult.dimensionScores
    });

    return c.json({ 
      success: true,
      matchResult
    });
  } catch (error) {
    console.error('Error calculating match score:', error);
    return c.json({ error: `Match score calculation failed: ${error.message}` }, 500);
  }
};