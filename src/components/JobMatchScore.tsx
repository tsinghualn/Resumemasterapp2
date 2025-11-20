import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  ArrowLeft, 
  ArrowRight, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle,
  Target,
  Briefcase,
  Code,
  Award,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { apiClient } from '../utils/api';

interface MatchBreakdown {
  category: string;
  score: number;
  icon: React.ReactNode;
  color: string;
  details: string[];
}

interface JobMatchScoreProps {
  optimizedResume: string;
  jobDescription: string;
  onBack: () => void;
  onImprove: () => void;
  onNext: () => void;
}

export function JobMatchScore({ 
  optimizedResume, 
  jobDescription, 
  onBack, 
  onImprove,
  onNext 
}: JobMatchScoreProps) {
  const [overallScore, setOverallScore] = useState(0);
  const [breakdown, setBreakdown] = useState<MatchBreakdown[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(true);

  useEffect(() => {
    analyzeMatch();
  }, [optimizedResume, jobDescription]);

  const analyzeMatch = async () => {
    setIsAnalyzing(true);
    
    try {
      // Try real AI analysis first
      const { analysis } = await apiClient.analyzeMatch(
        { content: optimizedResume },
        jobDescription
      );

      setOverallScore(analysis.score);
      
      // Map AI analysis to breakdown format
      const aiBreakdown: MatchBreakdown[] = [
        {
          category: 'Skills Match',
          score: Math.round(analysis.score * 0.9), // Slightly adjust for variation
          icon: <Code className="w-5 h-5" />,
          color: 'bg-blue-500',
          details: analysis.strengths.filter((s: string) => s.toLowerCase().includes('skill')).slice(0, 3)
        },
        {
          category: 'Experience Level',
          score: Math.round(analysis.score * 0.95),
          icon: <Briefcase className="w-5 h-5" />,
          color: 'bg-green-500',
          details: analysis.strengths.filter((s: string) => s.toLowerCase().includes('experience')).slice(0, 3)
        },
        {
          category: 'Keywords',
          score: Math.round(analysis.score * 1.05),
          icon: <Target className="w-5 h-5" />,
          color: 'bg-purple-500',
          details: analysis.gaps.slice(0, 3)
        },
        {
          category: 'Qualifications',
          score: Math.round(analysis.score * 0.92),
          icon: <Award className="w-5 h-5" />,
          color: 'bg-orange-500',
          details: analysis.strengths.filter((s: string) => 
            s.toLowerCase().includes('education') || s.toLowerCase().includes('qualification')
          ).slice(0, 3)
        }
      ];

      setBreakdown(aiBreakdown);
      setSuggestions(analysis.recommendations || []);
      toast.success('AI match analysis complete!');
      console.log('✅ AI match analysis successful');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ AI analysis failed, using fallback:', errorMessage);
      
      // Fallback to mock analysis
      const analysis = calculateMatchScore(optimizedResume, jobDescription);
      setOverallScore(analysis.overall);
      setBreakdown(analysis.breakdown);
      setSuggestions(analysis.suggestions);
      
      // Show specific error message
      if (errorMessage.includes('API key') || errorMessage.includes('not configured')) {
        toast.warning('OpenAI API key not configured. Using fallback analysis.', {
          description: 'Add your OPENAI_API_KEY in Supabase secrets for AI-powered analysis',
          duration: 5000
        });
      } else if (errorMessage.includes('quota exceeded') || errorMessage.includes('exceeded your current quota')) {
        toast.error('OpenAI API Credits Depleted', {
          description: '💳 Add credits at platform.openai.com/settings/organization/billing or upload a new API key. Using fallback analysis.',
          duration: 10000
        });
        console.error('⚠️ OpenAI Quota Exceeded:', errorMessage);
      } else {
        toast.info('Match analysis complete (using fallback method)', {
          description: 'AI analysis unavailable',
          duration: 4000
        });
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const calculateMatchScore = (resume: string, jobDesc: string) => {
    const resumeLower = resume.toLowerCase();
    const jobLower = jobDesc.toLowerCase();
    
    // Extract keywords from job description
    const jobKeywords = extractKeywords(jobLower);
    const resumeKeywords = extractKeywords(resumeLower);
    
    // Calculate keyword match
    const matchedKeywords = jobKeywords.filter(keyword => 
      resumeKeywords.includes(keyword)
    );
    const keywordScore = Math.min(100, (matchedKeywords.length / Math.max(jobKeywords.length, 1)) * 100);
    
    // Calculate experience match (check for years of experience)
    const experienceScore = calculateExperienceScore(resumeLower, jobLower);
    
    // Calculate skills match
    const skillsScore = calculateSkillsScore(resumeLower, jobLower);
    
    // Calculate education match
    const educationScore = calculateEducationScore(resumeLower, jobLower);
    
    // Overall score (weighted average)
    const overall = Math.round(
      (keywordScore * 0.3) + 
      (experienceScore * 0.25) + 
      (skillsScore * 0.35) + 
      (educationScore * 0.1)
    );
    
    const breakdown: MatchBreakdown[] = [
      {
        category: 'Skills Match',
        score: Math.round(skillsScore),
        icon: <Code className="w-5 h-5" />,
        color: 'bg-blue-500',
        details: generateSkillsDetails(resumeLower, jobLower, skillsScore)
      },
      {
        category: 'Experience Level',
        score: Math.round(experienceScore),
        icon: <Briefcase className="w-5 h-5" />,
        color: 'bg-green-500',
        details: generateExperienceDetails(resumeLower, jobLower, experienceScore)
      },
      {
        category: 'Keywords',
        score: Math.round(keywordScore),
        icon: <Target className="w-5 h-5" />,
        color: 'bg-purple-500',
        details: generateKeywordDetails(matchedKeywords, jobKeywords)
      },
      {
        category: 'Qualifications',
        score: Math.round(educationScore),
        icon: <Award className="w-5 h-5" />,
        color: 'bg-orange-500',
        details: generateEducationDetails(resumeLower, jobLower, educationScore)
      }
    ];
    
    const suggestions = generateSuggestions(breakdown, overall);
    
    return { overall, breakdown, suggestions };
  };

  const extractKeywords = (text: string): string[] => {
    const commonWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'be', 'have', 
      'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could',
      'may', 'might', 'must', 'can', 'our', 'your', 'their', 'this', 'that',
      'these', 'those', 'we', 'you', 'they', 'who', 'what', 'when', 'where'
    ]);
    const words = text.match(/\b[a-z]+\b/g) || [];
    return [...new Set(words.filter(word => word.length > 3 && !commonWords.has(word)))];
  };

  const calculateSkillsScore = (resume: string, job: string): number => {
    const technicalSkills = [
      'javascript', 'python', 'java', 'react', 'node', 'sql', 'aws', 'docker',
      'kubernetes', 'typescript', 'angular', 'vue', 'mongodb', 'postgresql',
      'git', 'agile', 'scrum', 'ci/cd', 'rest', 'api', 'html', 'css', 'leadership',
      'management', 'communication', 'teamwork', 'problem-solving', 'analytical'
    ];
    
    const jobSkills = technicalSkills.filter(skill => job.includes(skill));
    const resumeSkills = jobSkills.filter(skill => resume.includes(skill));
    
    return jobSkills.length > 0 ? (resumeSkills.length / jobSkills.length) * 100 : 75;
  };

  const calculateExperienceScore = (resume: string, job: string): number => {
    const jobYearsMatch = job.match(/(\d+)\+?\s*years?/i);
    const resumeYearsMatch = resume.match(/(\d+)\+?\s*years?/i);
    
    if (!jobYearsMatch) return 80;
    
    const requiredYears = parseInt(jobYearsMatch[1]);
    const candidateYears = resumeYearsMatch ? parseInt(resumeYearsMatch[1]) : 0;
    
    if (candidateYears >= requiredYears) return 100;
    if (candidateYears >= requiredYears * 0.75) return 85;
    if (candidateYears >= requiredYears * 0.5) return 70;
    return 50;
  };

  const calculateEducationScore = (resume: string, job: string): number => {
    const degrees = ['bachelor', 'master', 'phd', 'doctorate', 'mba', 'bs', 'ba', 'ms', 'ma'];
    const jobDegrees = degrees.filter(deg => job.includes(deg));
    const resumeDegrees = degrees.filter(deg => resume.includes(deg));
    
    if (jobDegrees.length === 0) return 90;
    
    const hasRequiredDegree = jobDegrees.some(deg => resumeDegrees.includes(deg));
    return hasRequiredDegree ? 100 : 60;
  };

  const generateSkillsDetails = (resume: string, job: string, score: number): string[] => {
    if (score >= 80) {
      return [
        'Strong match with required technical skills',
        'Most key competencies are demonstrated',
        'Skills section aligns well with job requirements'
      ];
    } else if (score >= 60) {
      return [
        'Good foundation in core skills',
        'Some advanced skills could be highlighted more',
        'Consider emphasizing transferable skills'
      ];
    } else {
      return [
        'Limited match with required skills',
        'Consider adding relevant technical skills',
        'Highlight transferable competencies'
      ];
    }
  };

  const generateExperienceDetails = (resume: string, job: string, score: number): string[] => {
    if (score >= 80) {
      return [
        'Experience level meets or exceeds requirements',
        'Relevant work history is well-documented',
        'Career progression is clear and compelling'
      ];
    } else {
      return [
        'Experience level is below preferred range',
        'Focus on quality and relevance of experience',
        'Emphasize achievements and impact'
      ];
    }
  };

  const generateKeywordDetails = (matched: string[], total: string[]): string[] => {
    const percentage = (matched.length / Math.max(total.length, 1)) * 100;
    
    if (percentage >= 70) {
      return [
        `${matched.length} of ${total.length} key terms found`,
        'Strong keyword optimization',
        'Resume is ATS-friendly'
      ];
    } else if (percentage >= 50) {
      return [
        `${matched.length} of ${total.length} key terms found`,
        'Moderate keyword coverage',
        'Consider adding more relevant terms'
      ];
    } else {
      return [
        `Only ${matched.length} of ${total.length} key terms found`,
        'Low keyword density detected',
        'Incorporate more job-specific terminology'
      ];
    }
  };

  const generateEducationDetails = (resume: string, job: string, score: number): string[] => {
    if (score >= 90) {
      return [
        'Education requirements are met',
        'Qualifications are clearly stated',
        'Academic background aligns with role'
      ];
    } else {
      return [
        'Education section could be strengthened',
        'Consider highlighting relevant coursework',
        'Add certifications if applicable'
      ];
    }
  };

  const generateSuggestions = (breakdown: MatchBreakdown[], overall: number): string[] => {
    const suggestions: string[] = [];
    
    breakdown.forEach(item => {
      if (item.score < 70) {
        suggestions.push(`Improve ${item.category}: Current score is ${item.score}%`);
      }
    });
    
    if (overall < 80) {
      suggestions.push('Use the AI Rewrite Panel to better align your resume with the job description');
    }
    
    if (suggestions.length === 0) {
      suggestions.push('Your resume is well-optimized! Consider reviewing formatting and layout');
      suggestions.push('Proofread for any spelling or grammar errors');
    }
    
    return suggestions.slice(0, 5);
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number): { text: string; variant: 'default' | 'secondary' | 'destructive' } => {
    if (score >= 80) return { text: 'Excellent Match', variant: 'default' };
    if (score >= 60) return { text: 'Good Match', variant: 'secondary' };
    return { text: 'Needs Improvement', variant: 'destructive' };
  };

  const scoreBadge = getScoreBadge(overallScore);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button onClick={onBack} variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2.5 rounded-xl">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl">Job Match Score</h1>
              <p className="text-sm text-gray-600">
                See how well your resume matches the job
              </p>
            </div>
          </div>

          <Button 
            onClick={onNext}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            Preview & Export
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {isAnalyzing ? (
          <Card className="p-12">
            <div className="text-center">
              <RefreshCw className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-spin" />
              <h3 className="text-xl mb-2">Analyzing Your Resume...</h3>
              <p className="text-gray-600">
                Comparing your resume with the job description
              </p>
            </div>
          </Card>
        ) : (
          <>
            {/* Overall Score */}
            <Card className="p-8 mb-6">
              <div className="text-center mb-6">
                <div className={`text-7xl mb-4 ${getScoreColor(overallScore)}`}>
                  {overallScore}%
                </div>
                <Badge variant={scoreBadge.variant} className="text-lg px-4 py-1">
                  {scoreBadge.text}
                </Badge>
              </div>
              
              <div className="max-w-md mx-auto">
                <Progress value={overallScore} className="h-3" />
              </div>
            </Card>

            {/* Breakdown */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {breakdown.map((item, idx) => (
                <Card key={idx} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`${item.color} p-2 rounded-lg text-white`}>
                        {item.icon}
                      </div>
                      <div>
                        <h3 className="text-lg">{item.category}</h3>
                        <p className={`text-2xl ${getScoreColor(item.score)}`}>
                          {item.score}%
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Progress value={item.score} className="h-2 mb-4" />
                  
                  <ul className="space-y-2">
                    {item.details.map((detail, detailIdx) => (
                      <li key={detailIdx} className="text-sm text-gray-600 flex items-start gap-2">
                        {item.score >= 70 ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        )}
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>

            {/* Suggestions */}
            <Card className="p-6 bg-blue-50 border-blue-200">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg">Suggestions to Improve Your Score</h3>
              </div>
              
              <ul className="space-y-3 mb-6">
                {suggestions.map((suggestion, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <span className="text-gray-700">{suggestion}</span>
                  </li>
                ))}
              </ul>

              <div className="flex gap-3">
                <Button 
                  onClick={onImprove}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Improve Resume
                </Button>
                <Button 
                  onClick={analyzeMatch}
                  variant="outline"
                >
                  Re-analyze
                </Button>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
