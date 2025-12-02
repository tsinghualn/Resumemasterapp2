import React, { useEffect, useState } from 'react';
import { Briefcase, Award, Target, FileText, TrendingUp, CheckCircle2, AlertCircle, Sparkles, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Button } from './ui/button';

interface MatchResult {
  overallScore: number;
  dimensionScores: {
    skills: number;
    experience: number;
    education: number;
    achievements: number;
    softSkills: number;
  };
  strengths: string[];
  gaps: string[];
  matchedSkills: string[];
  missingSkills: string[];
  experienceAnalysis: {
    yearsRequired: string;
    yearsInResume: string;
    industryMatch: string;
    roleAlignment: string;
  };
  summary: string;
  improvementSuggestions?: string[];
}

interface JobMatchScoreProps {
  resumeData: any;
  jobDescription: string;
  isExpanded?: boolean;
  onToggle?: () => void;
  cachedMatchResult?: MatchResult | null;
  onMatchResultGenerated?: (result: MatchResult) => void;
  forceRegenerate?: boolean;
}

export function JobMatchScore({ 
  resumeData, 
  jobDescription,
  isExpanded: externalIsExpanded,
  onToggle,
  cachedMatchResult,
  onMatchResultGenerated,
  forceRegenerate
}: JobMatchScoreProps) {
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [internalIsExpanded, setInternalIsExpanded] = useState(false);

  // Use external expand state if provided, otherwise use internal
  const isExpanded = externalIsExpanded !== undefined ? externalIsExpanded : internalIsExpanded;
  const handleToggle = onToggle || (() => setInternalIsExpanded(!internalIsExpanded));

  useEffect(() => {
    if (resumeData && jobDescription && isExpanded) {
      // If we have cached result and not forcing regenerate, use cache
      if (cachedMatchResult && !forceRegenerate) {
        console.log('🎯 JobMatchScore: Using cached match result');
        setMatchResult(cachedMatchResult);
      } else {
        // Otherwise fetch new result
        console.log('🎯 JobMatchScore: Fetching new match result');
        calculateMatchScore();
      }
    }
  }, [resumeData, jobDescription, isExpanded, forceRegenerate]);

  const calculateMatchScore = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🎯 JobMatchScore: Analyzing current resume preview');
      console.log('📊 Resume data being analyzed:', {
        hasPersonalDetails: !!resumeData.personalDetails,
        hasSummary: !!resumeData.summary,
        experienceCount: resumeData.experience?.length || 0,
        educationCount: resumeData.education?.length || 0,
        customSectionsCount: resumeData.customSections?.length || 0
      });

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-bc1c5df9/calculate-match-score`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            resumeData,
            jobDescription,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to calculate match score');
      }

      const data = await response.json();
      setMatchResult(data.matchResult);
      // Cache the result
      if (onMatchResultGenerated) {
        onMatchResultGenerated(data.matchResult);
      }
    } catch (err: any) {
      console.error('Error calculating match score:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!jobDescription) return null;

  // Collapsed state - show as button
  if (!isExpanded) {
    // When controlled externally and collapsed, return null
    if (externalIsExpanded !== undefined) {
      return null;
    }
    
    return (
      <div className="mt-8">
        <Button
          onClick={handleToggle}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-6 text-base shadow-lg"
        >
          <Sparkles className="w-5 h-5 mr-2" />
          Analyze job match with our AI HR
          <ChevronDown className="w-5 h-5 ml-2" />
        </Button>
        <p className="text-xs text-gray-500 text-center mt-2">
          AI will analyze your current resume preview shown on the right
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mt-8 bg-white border border-gray-200 rounded-lg p-8 mb-4">
        <div className="flex items-center justify-center space-x-2">
          <Sparkles className="w-5 h-5 text-blue-600 animate-pulse" />
          <div className="flex items-center space-x-1">
            <span className="text-blue-600 font-medium">Analyzing job match with AI</span>
            <span className="flex space-x-0.5">
              <span className="text-blue-600 animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
              <span className="text-blue-600 animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
              <span className="text-blue-600 animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !matchResult) {
    return (
      <div className="mt-8">
        <Button
          onClick={handleToggle}
          variant="outline"
          className="w-full py-4"
        >
          <ChevronUp className="w-4 h-4 mr-2" />
          Hide job match analysis
        </Button>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-50';
    if (score >= 70) return 'bg-blue-50';
    if (score >= 60) return 'bg-yellow-50';
    return 'bg-red-50';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return { text: 'Exceptional Match', color: 'bg-green-600' };
    if (score >= 80) return { text: 'Strong Match', color: 'bg-green-500' };
    if (score >= 70) return { text: 'Good Match', color: 'bg-blue-600' };
    if (score >= 60) return { text: 'Fair Match', color: 'bg-yellow-500' };
    if (score >= 50) return { text: 'Weak Match', color: 'bg-orange-500' };
    return { text: 'Poor Match', color: 'bg-red-600' };
  };

  const badge = getScoreBadge(matchResult.overallScore);

  return (
    <div className="mt-8">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-4 shadow-sm">
        {/* Header with Overall Score */}
        <div className={`${getScoreBg(matchResult.overallScore)} px-6 py-4 border-b border-gray-200`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="text-xs uppercase tracking-wide text-gray-600">Job Match Score</div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={calculateMatchScore}
                  disabled={loading}
                  className="h-6 px-2"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              <div className="flex items-baseline gap-2">
                <div className={`text-5xl ${getScoreColor(matchResult.overallScore)}`}>
                  {matchResult.overallScore}%
                </div>
                <div className={`${badge.color} text-white px-2.5 py-1 rounded text-xs font-medium`}>
                  {badge.text}
                </div>
              </div>
            </div>
            <TrendingUp className={`w-12 h-12 ${getScoreColor(matchResult.overallScore)} opacity-20`} />
          </div>
        </div>

        {/* Dimension Scores - All on One Line */}
        <div className="p-6 bg-white">
          <div className="flex items-start gap-6">
            <DimensionScore
              label="Skills"
              score={matchResult.dimensionScores.skills}
              color="blue"
            />
            <DimensionScore
              label="Experience"
              score={matchResult.dimensionScores.experience}
              color="green"
            />
            <DimensionScore
              label="Education"
              score={matchResult.dimensionScores.education}
              color="purple"
            />
            <DimensionScore
              label="Achievements"
              score={matchResult.dimensionScores.achievements}
              color="orange"
            />
            <DimensionScore
              label="Soft Skills"
              score={matchResult.dimensionScores.softSkills}
              color="pink"
            />
          </div>
        </div>

        {/* Strengths and Gaps - Side by Side */}
        <div className="grid grid-cols-2 gap-4 p-4 border-t border-gray-200">
          {/* Strengths */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <h4 className="font-medium text-sm text-gray-900">Key Strengths</h4>
            </div>
            <div className="space-y-2">
              {matchResult.strengths.slice(0, 3).map((strength, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-gray-700">
                  <div className="w-1 h-1 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                  <span className="flex-1">{strength}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Gaps */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-orange-600" />
              <h4 className="font-medium text-sm text-gray-900">Areas to Improve</h4>
            </div>
            <div className="space-y-2">
              {matchResult.gaps.slice(0, 3).map((gap, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-gray-700">
                  <div className="w-1 h-1 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                  <span className="flex-1">{gap}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Skills Match Details - Compact */}
        <div className="px-4 pb-4 grid grid-cols-2 gap-4">
          {/* Matched Skills */}
          {matchResult.matchedSkills && matchResult.matchedSkills.length > 0 && (
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-xs font-medium text-green-900 mb-2">
                ✓ Matched Skills ({matchResult.matchedSkills.length})
              </div>
              <div className="flex flex-wrap gap-1">
                {matchResult.matchedSkills.slice(0, 6).map((skill, idx) => (
                  <span key={idx} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                    {skill}
                  </span>
                ))}
                {matchResult.matchedSkills.length > 6 && (
                  <span className="text-xs text-green-600 px-2 py-0.5">
                    +{matchResult.matchedSkills.length - 6} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Missing Skills */}
          {matchResult.missingSkills && matchResult.missingSkills.length > 0 && (
            <div className="bg-orange-50 rounded-lg p-3">
              <div className="text-xs font-medium text-orange-900 mb-2">
                ⚠ Missing Skills ({matchResult.missingSkills.length})
              </div>
              <div className="flex flex-wrap gap-1">
                {matchResult.missingSkills.slice(0, 6).map((skill, idx) => (
                  <span key={idx} className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                    {skill}
                  </span>
                ))}
                {matchResult.missingSkills.length > 6 && (
                  <span className="text-xs text-orange-600 px-2 py-0.5">
                    +{matchResult.missingSkills.length - 6} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* AI Improvement Suggestions */}
        {matchResult.improvementSuggestions && matchResult.improvementSuggestions.length > 0 && (
          <div className="px-4 pb-4 border-t border-gray-200 pt-4">
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <h4 className="font-medium text-sm text-gray-900">Our AI HR's Suggestions to Improve Your Resume</h4>
              </div>
              <div className="space-y-2.5">
                {matchResult.improvementSuggestions.map((suggestion, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center mt-0.5">
                      <span className="text-xs font-medium text-purple-600">{idx + 1}</span>
                    </div>
                    <span className="flex-1 text-sm text-gray-700 leading-relaxed">{suggestion}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Collapse Button */}
      <Button
        onClick={handleToggle}
        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white"
      >
        <ChevronUp className="w-4 h-4 mr-2" />
        Hide job match analysis
      </Button>
    </div>
  );
}

interface DimensionScoreProps {
  label: string;
  score: number;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'pink';
}

function DimensionScore({ label, score, color }: DimensionScoreProps) {
  const colorClasses = {
    blue: { text: 'text-blue-600', bar: 'bg-blue-500', barBg: 'bg-blue-100' },
    green: { text: 'text-green-600', bar: 'bg-green-500', barBg: 'bg-green-100' },
    purple: { text: 'text-purple-600', bar: 'bg-purple-500', barBg: 'bg-purple-100' },
    orange: { text: 'text-orange-600', bar: 'bg-orange-500', barBg: 'bg-orange-100' },
    pink: { text: 'text-pink-600', bar: 'bg-pink-500', barBg: 'bg-pink-100' },
  };

  const colors = colorClasses[color];

  return (
    <div className="flex-1 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-700">{label}</span>
        <span className={`text-sm font-medium ${colors.text}`}>{score}%</span>
      </div>
      <div className={`w-full ${colors.barBg} rounded-full h-2`}>
        <div
          className={`${colors.bar} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}