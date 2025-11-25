import { createClient } from 'jsr:@supabase/supabase-js@2';
import { Hono } from 'npm:hono@4';
import { cors } from 'npm:hono/cors';

const app = new Hono();

app.use('*', cors());

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Common parsing issue keywords and patterns
const ISSUE_PATTERNS = {
  dates: ['missing date', 'wrong date', 'incorrect date', 'date error', 'date parse', 'dates are wrong', 'no dates'],
  company: ['wrong company', 'company name', 'missing company', 'incorrect company', 'employer name', 'organization'],
  skills: ['wrong skill', 'missing skill', 'skill error', 'incorrect skills', 'skills not', 'lost skills'],
  contact: ['email error', 'phone error', 'contact info', 'missing contact', 'phone number', 'email address', 'linkedin'],
  title: ['wrong title', 'job title', 'incorrect title', 'position title', 'role name'],
  bullets: ['missing bullet', 'lost information', 'truncated', 'incomplete', 'missing content', 'lost data'],
  order: ['wrong order', 'chronological', 'sorting', 'order error', 'sequence', 'not sorted'],
  name: ['name error', 'wrong name', 'missing name', 'name format', 'full name'],
  education: ['GPA missing', 'GPA wrong', 'degree error', 'university', 'graduation', 'school name'],
  projects: ['project missing', 'lost project', 'project not'],
  certifications: ['certification missing', 'cert not', 'license'],
  awards: ['award missing', 'honor not', 'achievement'],
  whitespace: ['extra space', 'spacing', 'whitespace', 'double space', 'spacing issue'],
  duplicates: ['duplicate', 'repeated', 'duplicated', 'twice', 'multiple times']
};

// Categorize feedback comments by issue type
function categorizeFeedback(comments: string[]): Record<string, string[]> {
  const categorized: Record<string, string[]> = {};
  
  comments.forEach(comment => {
    const lowerComment = comment.toLowerCase();
    
    for (const [category, keywords] of Object.entries(ISSUE_PATTERNS)) {
      if (keywords.some(keyword => lowerComment.includes(keyword))) {
        if (!categorized[category]) {
          categorized[category] = [];
        }
        categorized[category].push(comment);
      }
    }
  });
  
  return categorized;
}

// Analyze feedback using OpenAI
async function analyzeFeedbackWithAI(feedbackComments: string[]): Promise<any> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openaiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const prompt = `You are a feedback analyzer for a resume parsing AI system. Below are negative feedback comments from users about parsing issues.

Your task:
1. Identify recurring themes and common parsing issues
2. Categorize issues (e.g., "missing dates", "incorrect company names", "wrong skills", "contact info errors", etc.)
3. Count frequency of each issue type
4. Suggest specific improvements to the parsing prompt
5. Provide updated prompt instructions to fix these issues

Feedback comments:
${feedbackComments.map((comment, i) => `${i + 1}. ${comment}`).join('\\n')}

Respond with JSON in this format:
{
  "total_feedback_analyzed": number,
  "common_issues": [
    {
      "category": "issue category name",
      "count": number,
      "severity": "high" | "medium" | "low",
      "examples": ["example feedback 1", "example feedback 2"],
      "keywords": ["keyword1", "keyword2"]
    }
  ],
  "recommendations": [
    {
      "issue": "issue description",
      "current_problem": "what's going wrong",
      "suggested_fix": "specific prompt instruction to add"
    }
  ],
  "updated_prompt_sections": {
    "contact_info": "updated instructions for parsing contact info",
    "experience": "updated instructions for parsing experience",
    "education": "updated instructions for parsing education",
    "skills": "updated instructions for parsing skills"
  },
  "summary": "brief summary of main issues and fixes"
}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at analyzing user feedback and improving AI prompts for resume parsing. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  const analysis = JSON.parse(data.choices[0].message.content);
  
  return analysis;
}

// Main cron job handler
app.post('/analyze-feedback-cron', async (c) => {
  try {
    console.log('🕐 Starting daily feedback analysis at', new Date().toISOString());

    // Get feedback from the last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { data: feedbackData, error: fetchError } = await supabase
      .from('resume_feedback')
      .select('*')
      .eq('is_positive', false) // Only negative feedback
      .gte('created_at', yesterday.toISOString())
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ Error fetching feedback:', fetchError);
      return c.json({ error: 'Failed to fetch feedback', details: fetchError.message }, 500);
    }

    if (!feedbackData || feedbackData.length === 0) {
      console.log('ℹ️ No negative feedback in the last 24 hours');
      return c.json({ 
        success: true, 
        message: 'No negative feedback to analyze',
        analyzed_count: 0 
      });
    }

    console.log(`📊 Found ${feedbackData.length} negative feedback entries`);

    // Extract comments (filter out null/empty comments)
    const comments = feedbackData
      .map(f => f.comment)
      .filter(comment => comment && comment.trim().length > 0);

    if (comments.length === 0) {
      console.log('ℹ️ No comments in negative feedback (all thumbs down without text)');
      return c.json({ 
        success: true, 
        message: 'No comments to analyze',
        analyzed_count: 0 
      });
    }

    console.log(`💬 Analyzing ${comments.length} feedback comments with AI...`);

    // Pre-categorize feedback by keywords
    const categorized = categorizeFeedback(comments);
    const categorySummary = Object.entries(categorized)
      .map(([category, items]) => `${category}: ${items.length} issues`)
      .join(', ');
    
    console.log(`📋 Keyword-based categorization: ${categorySummary}`);

    // Analyze with OpenAI
    const analysis = await analyzeFeedbackWithAI(comments);

    console.log('✅ Analysis complete:', analysis);

    // Add keyword-based categorization to analysis
    const keywordCategorization = Object.entries(categorized).map(([category, items]) => ({
      category,
      count: items.length,
      examples: items.slice(0, 3) // First 3 examples
    }));

    // Store analysis results in database (using a new table or KV store)
    const analysisRecord = {
      analysis_date: new Date().toISOString(),
      feedback_count: feedbackData.length,
      comments_analyzed: comments.length,
      keyword_categorization: keywordCategorization, // Add keyword-based analysis
      common_issues: analysis.common_issues || [],
      recommendations: analysis.recommendations || [],
      updated_prompt_sections: analysis.updated_prompt_sections || {},
      summary: analysis.summary || '',
      raw_analysis: analysis,
      status: 'pending_review', // Admin needs to review before applying
    };

    // Store in KV store for now (can be moved to dedicated table later)
    const analysisId = `feedback_analysis_${new Date().toISOString().split('T')[0]}`;
    
    // Using the existing kv_store approach
    const { error: storeError } = await supabase
      .from('kv_store_bc1c5df9')
      .upsert({
        key: analysisId,
        value: analysisRecord
      });

    if (storeError) {
      console.error('❌ Error storing analysis:', storeError);
      // Continue anyway - we have the analysis
    }

    console.log('💾 Analysis stored with ID:', analysisId);

    // Return the analysis
    return c.json({
      success: true,
      message: 'Feedback analysis completed',
      analysis_id: analysisId,
      feedback_analyzed: feedbackData.length,
      comments_analyzed: comments.length,
      analysis: analysis,
    });

  } catch (error) {
    console.error('❌ Error in feedback analysis cron:', error);
    return c.json({
      error: 'Failed to analyze feedback',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Manual trigger endpoint (for testing)
app.get('/analyze-feedback-now', async (c) => {
  console.log('🔧 Manual feedback analysis triggered');
  
  // Call the same handler as cron
  const request = new Request('http://localhost/analyze-feedback-cron', {
    method: 'POST',
  });
  
  return app.fetch(request);
});

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'feedback-analyzer' });
});

Deno.serve(app.fetch);