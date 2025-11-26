/**
 * Feedback Guidance Generator
 * 
 * Converts analyzed feedback into actionable parsing instructions
 * that can be injected into the resume parsing prompts to improve accuracy.
 * 
 * Updated to use Supabase tables instead of KV store.
 */

export interface CommonIssue {
  id?: string;
  analysis_id?: string;
  category: string;
  count: number;
  severity: 'high' | 'medium' | 'low';
  keywords?: string[];
  examples?: string[];
}

export interface Recommendation {
  id?: string;
  analysis_id?: string;
  issue: string;
  current_problem: string;
  suggested_fix: string;
}

export interface FeedbackAnalysis {
  id?: string;
  analysis_date: string;
  feedback_count: number;
  comments_analyzed: number;
  summary?: string;
  status: 'pending_review' | 'approved' | 'applied' | 'rejected';
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  applied_at?: string;
  created_at?: string;
  updated_at?: string;
  // Joined data
  common_issues?: CommonIssue[];
  recommendations?: Recommendation[];
  positive_feedback_count?: number;
  positive_examples?: string[];
  // Legacy fields (for backwards compatibility during migration)
  keyword_categorization?: Array<{
    category: string;
    count: number;
    examples: string[];
  }>;
  updated_prompt_sections?: {
    contact_info?: string;
    experience?: string;
    education?: string;
    skills?: string;
    projects?: string;
    certifications?: string;
    awards?: string;
  };
}

export interface ParsingGuidance {
  id?: string;
  guidance_text: string;
  priority_areas: string[];
  specific_instructions: string[];
  source_analysis_ids: string[];
  generated_at: string;
  confidence_score: number; // 0-100, based on feedback volume
}

/**
 * Generate parsing guidance from recent feedback analyses
 * @param analyses - Array of feedback analyses (usually last 7-30 days)
 * @param minSeverity - Minimum severity to include ('low', 'medium', 'high')
 * @returns Structured guidance for resume parsing
 */
export function generateParsingGuidance(
  analyses: FeedbackAnalysis[],
  minSeverity: 'low' | 'medium' | 'high' = 'medium'
): ParsingGuidance | null {
  if (!analyses || analyses.length === 0) {
    return null;
  }

  const severityScores = { low: 1, medium: 2, high: 3 };
  const minScore = severityScores[minSeverity];

  // Aggregate all issues across analyses
  const issueMap = new Map<string, {
    count: number;
    severity: 'high' | 'medium' | 'low';
    examples: string[];
    fixes: string[];
  }>();

  const analysisIds: string[] = [];
  let totalFeedbackCount = 0;

  analyses.forEach(analysis => {
    analysisIds.push(analysis.id || analysis.analysis_date);
    totalFeedbackCount += analysis.feedback_count;

    // Process common issues (now from joined table)
    analysis.common_issues?.forEach(issue => {
      if (severityScores[issue.severity] >= minScore) {
        const existing = issueMap.get(issue.category) || {
          count: 0,
          severity: issue.severity,
          examples: [],
          fixes: []
        };

        existing.count += issue.count;
        if (issue.examples) {
          existing.examples.push(...issue.examples.slice(0, 2)); // Top 2 examples
        }
        
        // Update severity if this one is higher
        if (severityScores[issue.severity] > severityScores[existing.severity]) {
          existing.severity = issue.severity;
        }

        issueMap.set(issue.category, existing);
      }
    });

    // Process recommendations (now from joined table)
    analysis.recommendations?.forEach(rec => {
      const category = rec.issue.toLowerCase().includes('date') ? 'dates' :
                      rec.issue.toLowerCase().includes('company') ? 'company' :
                      rec.issue.toLowerCase().includes('skill') ? 'skills' :
                      rec.issue.toLowerCase().includes('contact') ? 'contact' :
                      rec.issue.toLowerCase().includes('name') ? 'name' :
                      rec.issue.toLowerCase().includes('experience') ? 'experience' :
                      rec.issue.toLowerCase().includes('education') ? 'education' :
                      'general';

      const existing = issueMap.get(category);
      if (existing) {
        existing.fixes.push(rec.suggested_fix);
      } else {
        issueMap.set(category, {
          count: 1,
          severity: 'medium',
          examples: [rec.current_problem],
          fixes: [rec.suggested_fix]
        });
      }
    });
  });

  if (issueMap.size === 0) {
    return null;
  }

  // Sort issues by severity and count
  const sortedIssues = Array.from(issueMap.entries())
    .sort((a, b) => {
      const severityDiff = severityScores[b[1].severity] - severityScores[a[1].severity];
      if (severityDiff !== 0) return severityDiff;
      return b[1].count - a[1].count;
    });

  // Build guidance text
  const guidanceLines: string[] = [
    '🔍 CRITICAL AREAS BASED ON USER FEEDBACK:',
    '',
  ];

  const priorityAreas: string[] = [];
  const specificInstructions: string[] = [];

  sortedIssues.forEach(([category, data], index) => {
    const severityEmoji = data.severity === 'high' ? '🔴' : 
                          data.severity === 'medium' ? '🟡' : '🟢';
    
    priorityAreas.push(category);
    
    guidanceLines.push(`${severityEmoji} **${category.toUpperCase()}** (${data.count} issues reported)`);
    
    // Add specific fixes
    if (data.fixes.length > 0) {
      const uniqueFixes = [...new Set(data.fixes)];
      uniqueFixes.slice(0, 2).forEach(fix => { // Top 2 fixes
        guidanceLines.push(`   • ${fix}`);
        specificInstructions.push(`${category}: ${fix}`);
      });
    }
    
    // Add example if available
    if (data.examples.length > 0 && index < 3) { // Only top 3 categories
      guidanceLines.push(`   Example issue: "${data.examples[0].substring(0, 100)}..."`);
    }
    
    guidanceLines.push('');
  });

  guidanceLines.push('⚠️ Please pay EXTRA attention to these areas to avoid repeating past mistakes.');

  // Calculate confidence score based on feedback volume
  // More feedback = higher confidence in the guidance
  const confidenceScore = Math.min(100, Math.floor((totalFeedbackCount / 10) * 100));

  return {
    guidance_text: guidanceLines.join('\n'),
    priority_areas: priorityAreas,
    specific_instructions: specificInstructions,
    source_analysis_ids: analysisIds,
    generated_at: new Date().toISOString(),
    confidence_score: confidenceScore
  };
}

/**
 * Generate severity-specific guidance (for high-priority issues only)
 */
export function generateHighPriorityGuidance(analyses: FeedbackAnalysis[]): ParsingGuidance | null {
  return generateParsingGuidance(analyses, 'high');
}

/**
 * Get raw feedback data from resume_feedback table
 * This fetches the actual user feedback (👍👎 + comments)
 */
export async function getRecentRawFeedback(
  supabaseClient: any,
  daysBack: number = 7,
  onlyNegative: boolean = true
): Promise<any[]> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    let query = supabaseClient
      .from('resume_feedback')
      .select('*')
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: false });

    // Optionally filter to only negative feedback
    if (onlyNegative) {
      query = query.eq('is_positive', false);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching raw feedback:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getRecentRawFeedback:', error);
    return [];
  }
}

/**
 * Get the most recent feedback ANALYSES from feedback_analyses table
 * These are the results of daily AI analysis, not the raw feedback
 * Now uses the new relational tables instead of KV store
 */
export async function getRecentFeedbackAnalyses(
  supabaseClient: any,
  daysBack: number = 7
): Promise<FeedbackAnalysis[]> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    // Query the new feedback_analyses table with joined data
    const { data, error } = await supabaseClient
      .from('feedback_analyses')
      .select(`
        *,
        common_issues:analysis_common_issues(*),
        recommendations:analysis_recommendations(*)
      `)
      .gte('analysis_date', cutoffDate.toISOString().split('T')[0])
      .order('analysis_date', { ascending: false });

    if (error) {
      console.warn('Error fetching feedback analyses:', error);
      return [];
    }

    if (!data || data.length === 0) {
      console.log('No feedback analyses found in the specified period');
      return [];
    }

    // Map to FeedbackAnalysis interface
    const analyses: FeedbackAnalysis[] = data.map((record: any) => ({
      id: record.id,
      analysis_date: record.analysis_date,
      feedback_count: record.feedback_count,
      comments_analyzed: record.comments_analyzed,
      summary: record.summary,
      status: record.status,
      reviewed_by: record.reviewed_by,
      reviewed_at: record.reviewed_at,
      review_notes: record.review_notes,
      applied_at: record.applied_at,
      created_at: record.created_at,
      updated_at: record.updated_at,
      common_issues: record.common_issues || [],
      recommendations: record.recommendations || []
    }));

    return analyses;
  } catch (error) {
    console.error('Error fetching feedback analyses:', error);
    return [];
  }
}

/**
 * Generate guidance directly from raw feedback (without waiting for daily analysis)
 * This is useful for real-time guidance generation
 */
export async function generateGuidanceFromRawFeedback(
  supabaseClient: any,
  daysBack: number = 7
): Promise<ParsingGuidance | null> {
  try {
    // Fetch raw negative feedback
    const rawFeedback = await getRecentRawFeedback(supabaseClient, daysBack, true);

    if (rawFeedback.length === 0) {
      console.log('No negative feedback found for guidance generation');
      return null;
    }

    // Extract comments
    const comments = rawFeedback
      .map(f => f.comment)
      .filter(comment => comment && comment.trim().length > 0);

    if (comments.length === 0) {
      console.log('No comments in negative feedback');
      return null;
    }

    // Categorize by keywords (simple pattern matching)
    const issueMap = new Map<string, {
      count: number;
      severity: 'high' | 'medium' | 'low';
      examples: string[];
      fixes: string[];
    }>();

    // Define issue patterns
    const patterns: Record<string, { keywords: string[]; severity: 'high' | 'medium' | 'low' }> = {
      'dates': {
        keywords: ['missing date', 'wrong date', 'incorrect date', 'date error', 'date parse', 'dates are wrong', 'no dates'],
        severity: 'high'
      },
      'contact': {
        keywords: ['email error', 'phone error', 'contact info', 'missing contact', 'phone number', 'email address', 'linkedin'],
        severity: 'high'
      },
      'company': {
        keywords: ['wrong company', 'company name', 'missing company', 'incorrect company', 'employer name'],
        severity: 'medium'
      },
      'skills': {
        keywords: ['wrong skill', 'missing skill', 'skill error', 'incorrect skills', 'skills not', 'lost skills'],
        severity: 'medium'
      },
      'name': {
        keywords: ['name error', 'wrong name', 'missing name', 'name format', 'full name'],
        severity: 'high'
      },
      'experience': {
        keywords: ['experience error', 'job missing', 'position not', 'work history'],
        severity: 'medium'
      },
      'education': {
        keywords: ['GPA missing', 'GPA wrong', 'degree error', 'university', 'graduation', 'school name'],
        severity: 'medium'
      }
    };

    // Categorize each comment
    comments.forEach(comment => {
      const lowerComment = comment.toLowerCase();
      
      for (const [category, config] of Object.entries(patterns)) {
        if (config.keywords.some(keyword => lowerComment.includes(keyword))) {
          const existing = issueMap.get(category) || {
            count: 0,
            severity: config.severity,
            examples: [],
            fixes: []
          };
          
          existing.count++;
          if (existing.examples.length < 3) {
            existing.examples.push(comment);
          }
          
          issueMap.set(category, existing);
        }
      }
    });

    if (issueMap.size === 0) {
      console.log('No categorized issues found');
      return null;
    }

    // Build guidance
    const guidanceLines: string[] = [
      '🔍 RECENT USER-REPORTED ISSUES (based on raw feedback):',
      '',
    ];

    const priorityAreas: string[] = [];
    const specificInstructions: string[] = [];

    // Sort by severity and count
    const severityScores = { high: 3, medium: 2, low: 1 };
    const sortedIssues = Array.from(issueMap.entries())
      .sort((a, b) => {
        const severityDiff = severityScores[b[1].severity] - severityScores[a[1].severity];
        if (severityDiff !== 0) return severityDiff;
        return b[1].count - a[1].count;
      });

    sortedIssues.forEach(([category, data]) => {
      const severityEmoji = data.severity === 'high' ? '🔴' : 
                            data.severity === 'medium' ? '🟡' : '🟢';
      
      priorityAreas.push(category);
      
      guidanceLines.push(`${severityEmoji} **${category.toUpperCase()}** (${data.count} issues reported)`);
      
      // Add example
      if (data.examples.length > 0) {
        const example = data.examples[0].substring(0, 80);
        guidanceLines.push(`   Example: "${example}${example.length === 80 ? '...' : ''}"`);
        specificInstructions.push(`${category}: Pay extra attention based on ${data.count} reports`);
      }
      
      guidanceLines.push('');
    });

    guidanceLines.push('⚠️ These issues were reported by users. Please be extra careful in these areas.');

    // Calculate confidence based on feedback volume
    const confidenceScore = Math.min(100, Math.floor((rawFeedback.length / 10) * 100));

    return {
      guidance_text: guidanceLines.join('\n'),
      priority_areas: priorityAreas,
      specific_instructions: specificInstructions,
      source_analysis_ids: ['raw_feedback'],
      generated_at: new Date().toISOString(),
      confidence_score: confidenceScore
    };
  } catch (error) {
    console.error('Error generating guidance from raw feedback:', error);
    return null;
  }
}

/**
 * Create a concise guidance summary for injection into prompts
 * (shorter version for token efficiency)
 */
export function createConciseGuidance(guidance: ParsingGuidance): string {
  const lines: string[] = [
    '🔍 COMMON USER-REPORTED ISSUES (fix these first):',
    ''
  ];

  guidance.specific_instructions.slice(0, 5).forEach(instruction => {
    lines.push(`• ${instruction}`);
  });

  if (guidance.confidence_score < 50) {
    lines.push('');
    lines.push('(Low confidence - based on limited feedback)');
  }

  return lines.join('\n');
}

/**
 * Track improvement metrics by comparing feedback before and after applying guidance
 */
export interface ImprovementMetrics {
  id?: string;
  date_measured: string;
  guidance_applied_date: string;
  before_total_feedback: number;
  before_negative_feedback: number;
  before_success_rate: number;
  after_total_feedback: number;
  after_negative_feedback: number;
  after_success_rate: number;
  improvement_percentage: number;
  created_at?: string;
}

/**
 * Calculate improvement metrics
 */
export async function calculateImprovementMetrics(
  supabaseClient: any,
  guidanceAppliedDate: Date,
  measurementPeriodDays: number = 7
): Promise<ImprovementMetrics | null> {
  try {
    const beforeStart = new Date(guidanceAppliedDate);
    beforeStart.setDate(beforeStart.getDate() - measurementPeriodDays);
    
    const afterEnd = new Date(guidanceAppliedDate);
    afterEnd.setDate(afterEnd.getDate() + measurementPeriodDays);

    // Get feedback before guidance was applied
    const { data: beforeData } = await supabaseClient
      .from('resume_feedback')
      .select('is_positive')
      .gte('created_at', beforeStart.toISOString())
      .lt('created_at', guidanceAppliedDate.toISOString());

    // Get feedback after guidance was applied
    const { data: afterData } = await supabaseClient
      .from('resume_feedback')
      .select('is_positive')
      .gte('created_at', guidanceAppliedDate.toISOString())
      .lte('created_at', afterEnd.toISOString());

    if (!beforeData || !afterData || beforeData.length === 0 || afterData.length === 0) {
      return null;
    }

    const beforeTotal = beforeData.length;
    const beforeNegative = beforeData.filter(f => !f.is_positive).length;
    const beforeSuccessRate = ((beforeTotal - beforeNegative) / beforeTotal) * 100;

    const afterTotal = afterData.length;
    const afterNegative = afterData.filter(f => !f.is_positive).length;
    const afterSuccessRate = ((afterTotal - afterNegative) / afterTotal) * 100;

    const improvement = afterSuccessRate - beforeSuccessRate;

    return {
      date_measured: new Date().toISOString().split('T')[0],
      guidance_applied_date: guidanceAppliedDate.toISOString().split('T')[0],
      before_total_feedback: beforeTotal,
      before_negative_feedback: beforeNegative,
      before_success_rate: Math.round(beforeSuccessRate * 100) / 100,
      after_total_feedback: afterTotal,
      after_negative_feedback: afterNegative,
      after_success_rate: Math.round(afterSuccessRate * 100) / 100,
      improvement_percentage: Math.round(improvement * 100) / 100
    };
  } catch (error) {
    console.error('Error calculating improvement metrics:', error);
    return null;
  }
}

/**
 * Store improvement metrics in the new improvement_metrics table
 */
export async function storeImprovementMetrics(
  supabaseClient: any,
  metrics: ImprovementMetrics
): Promise<boolean> {
  try {
    const { error } = await supabaseClient
      .from('improvement_metrics')
      .upsert({
        date_measured: metrics.date_measured,
        guidance_applied_date: metrics.guidance_applied_date,
        before_total_feedback: metrics.before_total_feedback,
        before_negative_feedback: metrics.before_negative_feedback,
        before_success_rate: metrics.before_success_rate,
        after_total_feedback: metrics.after_total_feedback,
        after_negative_feedback: metrics.after_negative_feedback,
        after_success_rate: metrics.after_success_rate,
        improvement_percentage: metrics.improvement_percentage
      }, {
        onConflict: 'date_measured'
      });

    if (error) {
      console.error('Error storing improvement metrics:', error);
      return false;
    }

    console.log('✅ Improvement metrics stored for:', metrics.date_measured);
    return true;
  } catch (error) {
    console.error('Error in storeImprovementMetrics:', error);
    return false;
  }
}

/**
 * Store generated parsing guidance in the parsing_guidance table
 */
export async function storeParsingGuidance(
  supabaseClient: any,
  guidance: ParsingGuidance
): Promise<string | null> {
  try {
    const { data, error } = await supabaseClient
      .from('parsing_guidance')
      .insert({
        guidance_text: guidance.guidance_text,
        priority_areas: guidance.priority_areas,
        specific_instructions: guidance.specific_instructions,
        source_analysis_ids: guidance.source_analysis_ids,
        confidence_score: guidance.confidence_score,
        generated_at: guidance.generated_at
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error storing parsing guidance:', error);
      return null;
    }

    console.log('✅ Parsing guidance stored with ID:', data.id);
    return data.id;
  } catch (error) {
    console.error('Error in storeParsingGuidance:', error);
    return null;
  }
}

/**
 * Get the latest parsing guidance from the database
 */
export async function getLatestParsingGuidance(
  supabaseClient: any
): Promise<ParsingGuidance | null> {
  try {
    const { data, error } = await supabaseClient
      .from('parsing_guidance')
      .select('*')
      .order('generated_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      guidance_text: data.guidance_text,
      priority_areas: data.priority_areas || [],
      specific_instructions: data.specific_instructions || [],
      source_analysis_ids: data.source_analysis_ids || [],
      generated_at: data.generated_at,
      confidence_score: data.confidence_score
    };
  } catch (error) {
    console.error('Error getting latest parsing guidance:', error);
    return null;
  }
}
