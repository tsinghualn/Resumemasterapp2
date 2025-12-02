import React, { useEffect, useState } from 'react';
import { Sparkles, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Button } from './ui/button';

interface AIHRSuggestionsResult {
  generalSuggestions: string[];
}

interface AIHRSuggestionsProps {
  resumeData: any;
  isExpanded: boolean;
  onToggle: () => void;
  cachedSuggestions: AIHRSuggestionsResult | null;
  onSuggestionsGenerated: (suggestions: AIHRSuggestionsResult) => void;
  forceRegenerate: boolean;
}

export function AIHRSuggestions({ 
  resumeData, 
  isExpanded, 
  onToggle, 
  cachedSuggestions, 
  onSuggestionsGenerated,
  forceRegenerate 
}: AIHRSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<AIHRSuggestionsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (resumeData && isExpanded) {
      // If we have cached suggestions and not forcing regenerate, use cache
      if (cachedSuggestions && !forceRegenerate) {
        console.log('💡 AIHRSuggestions: Using cached suggestions');
        setSuggestions(cachedSuggestions);
      } else {
        // Otherwise fetch new suggestions
        console.log('💡 AIHRSuggestions: Fetching new suggestions');
        fetchSuggestions();
      }
    }
  }, [resumeData, isExpanded, forceRegenerate]);

  const fetchSuggestions = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('💡 AIHRSuggestions: Analyzing current resume preview');
      console.log('📊 Resume data being analyzed:', {
        hasPersonalDetails: !!resumeData.personalDetails,
        hasSummary: !!resumeData.summary,
        experienceCount: resumeData.experience?.length || 0,
        educationCount: resumeData.education?.length || 0,
        customSectionsCount: resumeData.customSections?.length || 0
      });

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-bc1c5df9/ai-hr-suggestions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            resumeData,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch AI HR suggestions');
      }

      const data = await response.json();
      setSuggestions(data.suggestions);
      // Cache the suggestions
      onSuggestionsGenerated(data.suggestions);
    } catch (err: any) {
      console.error('Error fetching AI HR suggestions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Collapsed state - return null since button will be in sidebar
  if (!isExpanded) {
    return null;
  }

  // Expanded state - show as floating overlay
  return (
    <>
      {/* Overlay backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onToggle}
      />
      
      {/* Floating panel */}
      <div className="fixed inset-x-0 top-0 bottom-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center p-12">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-6 h-6 text-purple-600 animate-pulse" />
                <div className="flex items-center space-x-1">
                  <span className="text-purple-600 font-medium text-lg">Analyzing your resume with our AI HR</span>
                  <span className="flex space-x-0.5">
                    <span className="text-purple-600 animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                    <span className="text-purple-600 animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                    <span className="text-purple-600 animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                  </span>
                </div>
              </div>
            </div>
          ) : error || !suggestions ? (
            <div className="flex-1 flex items-center justify-center p-12">
              <div className="text-center">
                <p className="text-red-600 mb-4">Failed to load suggestions</p>
                <Button onClick={fetchSuggestions} variant="outline">
                  Try Again
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-6 h-6 text-white" />
                  <h3 className="text-xl text-white">AI HR Suggestions</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchSuggestions}
                    disabled={loading}
                    className="text-white hover:bg-white/20 h-8"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onToggle}
                    className="text-white hover:bg-white/20 h-8"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Content - scrollable */}
              <div className="flex-1 overflow-y-auto p-6">
                {suggestions.generalSuggestions && suggestions.generalSuggestions.length > 0 && (
                  <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                      <h4 className="font-medium text-base text-gray-900">Our AI HR's Suggestions to Improve Your Resume</h4>
                    </div>
                    <div className="space-y-3">
                      {suggestions.generalSuggestions.map((suggestion, idx) => {
                        // Remove AI's numbering (e.g., "1. ", "2. ", etc.) from the start of suggestions
                        const cleanedSuggestion = suggestion.replace(/^\d+\.\s*/, '');
                        
                        return (
                          <div key={idx} className="flex items-start gap-3 bg-white p-4 rounded-lg shadow-sm">
                            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center mt-0.5">
                              <span className="text-sm font-medium text-white">{idx + 1}</span>
                            </div>
                            <span className="flex-1 text-sm text-gray-700 leading-relaxed">{cleanedSuggestion}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t px-6 py-4 bg-gray-50 flex justify-end">
                <Button
                  onClick={onToggle}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}