/**
 * Feedback Learning Dashboard
 * 
 * Displays how the system is learning from user feedback and improving parsing accuracy
 */

import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { createClient } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface FeedbackStats {
  total: number;
  positive: number;
  negative: number;
  success_rate: number;
  by_section: Record<string, {
    total: number;
    positive: number;
    negative: number;
    success_rate: number;
  }>;
  period_days: number;
}

interface ImprovementMetric {
  date: string;
  before_application: {
    total_feedback: number;
    negative_feedback: number;
    success_rate: number;
  };
  after_application: {
    total_feedback: number;
    negative_feedback: number;
    success_rate: number;
  };
  improvement_percentage: number;
  calculated_at: string;
}

interface PendingAnalysis {
  id: string;
  analysis_date: string;
  feedback_count: number;
  comments_analyzed: number;
  common_issues: Array<{
    category: string;
    count: number;
    severity: 'high' | 'medium' | 'low';
  }>;
  recommendations: Array<{
    issue: string;
    current_problem: string;
    suggested_fix: string;
  }>;
  summary: string;
  status: string;
}

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-bc1c5df9`;

// Helper to get auth token
async function getAuthToken(): Promise<string> {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || publicAnonKey;
  } catch {
    return publicAnonKey;
  }
}

export function FeedbackLearningDashboard() {
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [improvements, setImprovements] = useState<ImprovementMetric[]>([]);
  const [pendingAnalyses, setPendingAnalyses] = useState<PendingAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [runningAnalysis, setRunningAnalysis] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<PendingAnalysis | null>(null);
  const [latestAnalysis, setLatestAnalysis] = useState<PendingAnalysis | null>(null);
  const [analysisNotification, setAnalysisNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [reviewNotification, setReviewNotification] = useState<{ analysisId: string; text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Load feedback statistics
      const statsResponse = await fetch(`${BASE_URL}/feedback-stats?daysBack=30`, { headers });
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.stats);
      }

      // Load improvement metrics
      const metricsResponse = await fetch(`${BASE_URL}/improvement-metrics`, { headers });
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setImprovements(metricsData.metrics || []);
      }

      // Load pending analyses (if admin)
      const pendingResponse = await fetch(`${BASE_URL}/admin/pending-analyses`, { headers });
      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json();
        setPendingAnalyses(pendingData.analyses || []);
      }

      // Load latest analysis
      const latestResponse = await fetch(`${BASE_URL}/latest-analysis`, { headers });
      if (latestResponse.ok) {
        const latestData = await latestResponse.json();
        if (latestData.analysis) {
          setLatestAnalysis(latestData.analysis);
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateImprovement = async () => {
    try {
      setCalculating(true);
      const token = await getAuthToken();
      const response = await fetch(`${BASE_URL}/calculate-improvement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ daysBack: 7 })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAnalysisNotification({
            text: `Improvement calculated: ${data.metrics.improvement_percentage.toFixed(2)}%`,
            type: 'success'
          });
          await loadDashboardData();
        } else {
          setAnalysisNotification({
            text: data.message || 'Could not calculate improvement',
            type: 'error'
          });
        }
      }
    } catch (error) {
      console.error('Error calculating improvement:', error);
      setAnalysisNotification({
        text: 'Error calculating improvement',
        type: 'error'
      });
    } finally {
      setCalculating(false);
    }
  };

  const runAnalysisNow = async () => {
    try {
      setRunningAnalysis(true);
      const token = await getAuthToken();
      const response = await fetch(`${BASE_URL}/run-feedback-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ daysBack: 7 })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAnalysisNotification({
            text: `✅ Analysis completed! Feedback: ${data.feedback_analyzed}, Comments: ${data.comments_analyzed}, Issues: ${data.common_issues_count}, Recommendations: ${data.recommendations_count}`,
            type: 'success'
          });
          await loadDashboardData();
        } else {
          setAnalysisNotification({
            text: data.message || 'Analysis completed with no data',
            type: 'error'
          });
        }
      } else {
        const error = await response.json();
        setAnalysisNotification({
          text: error.error || 'Failed to run analysis',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error running analysis:', error);
      setAnalysisNotification({
        text: 'Error running analysis',
        type: 'error'
      });
    } finally {
      setRunningAnalysis(false);
    }
  };

  const reviewAnalysis = async (analysisId: string, action: 'approve' | 'reject' | 'apply', notes?: string) => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${BASE_URL}/admin/review-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ analysisId, action, notes })
      });

      if (response.ok) {
        const successMessage = `Analysis ${action}d successfully`;
        setReviewNotification({
          analysisId,
          text: successMessage,
          type: 'success'
        });
        await loadDashboardData();
        setSelectedAnalysis(null);
      } else {
        const error = await response.json();
        setReviewNotification({
          analysisId,
          text: error.error || 'Failed to review analysis',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error reviewing analysis:', error);
      setReviewNotification({
        analysisId,
        text: 'Error reviewing analysis',
        type: 'error'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600">Loading feedback learning dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">🧠 Feedback Learning Dashboard</h2>
        <div className="flex gap-2">
          <Button 
            onClick={runAnalysisNow}
            disabled={runningAnalysis}
            variant="default"
          >
            {runningAnalysis ? '🔄 Analyzing...' : '🚀 Run Analysis Now'}
          </Button>
          <Button 
            onClick={calculateImprovement}
            disabled={calculating}
            variant="outline"
          >
            {calculating ? 'Calculating...' : '📊 Calculate Improvement'}
          </Button>
        </div>
      </div>
      {analysisNotification && (
        <div
          className={`mt-3 text-sm ${
            analysisNotification.type === 'success' ? 'text-green-700 bg-green-50 border-green-200' : 'text-red-700 bg-red-50 border-red-200'
          } border rounded px-4 py-2`}
        >
          {analysisNotification.text}
        </div>
      )}

      {/* Overall Statistics */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">📊 Parsing Accuracy (Last 30 Days)</h3>
        {stats ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Feedback</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{stats.positive}</div>
              <div className="text-sm text-gray-600">Positive</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{stats.negative}</div>
              <div className="text-sm text-gray-600">Negative</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {stats.success_rate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>
          </div>
        ) : (
          <div className="text-gray-500">No feedback data available</div>
        )}
      </Card>

      {/* Section Breakdown */}
      {stats && Object.keys(stats.by_section).length > 0 && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">📋 Accuracy by Section</h3>
          <div className="space-y-3">
            {Object.entries(stats.by_section)
              .sort((a, b) => b[1].total - a[1].total)
              .map(([section, data]) => (
                <div key={section} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex-1">
                    <div className="font-medium capitalize">{section}</div>
                    <div className="text-sm text-gray-600">
                      {data.positive} positive / {data.negative} negative ({data.total} total)
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={data.success_rate >= 80 ? 'default' : data.success_rate >= 60 ? 'secondary' : 'destructive'}
                    >
                      {data.success_rate.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* Improvement Over Time */}
      {improvements.length > 0 && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">📈 Improvement Tracking</h3>
          <div className="space-y-4">
            {improvements.slice(0, 5).map((metric, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">{metric.date}</div>
                  <Badge 
                    variant={metric.improvement_percentage > 0 ? 'default' : 'destructive'}
                  >
                    {metric.improvement_percentage > 0 ? '+' : ''}
                    {metric.improvement_percentage.toFixed(2)}%
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Before: {metric.before_application.success_rate.toFixed(1)}%</div>
                    <div className="text-xs text-gray-500">
                      ({metric.before_application.total_feedback} feedback)
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">After: {metric.after_application.success_rate.toFixed(1)}%</div>
                    <div className="text-xs text-gray-500">
                      ({metric.after_application.total_feedback} feedback)
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Latest Analysis Results */}
      {latestAnalysis && (
        <Card className="p-6 border-2 border-purple-200 bg-purple-50">
          <h3 className="text-xl font-semibold mb-4">🔬 Latest AI Analysis Results</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Analysis Date</div>
                <div className="font-medium">{latestAnalysis.analysis_date}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Feedback Analyzed</div>
                <div className="font-medium">{latestAnalysis.feedback_count} items ({latestAnalysis.comments_analyzed} with comments)</div>
              </div>
              <Badge variant={latestAnalysis.status === 'applied' ? 'default' : latestAnalysis.status === 'pending_review' ? 'secondary' : 'outline'}>
                {latestAnalysis.status}
              </Badge>
            </div>

            {latestAnalysis.summary && (
              <div className="bg-white p-4 rounded-lg border">
                <div className="font-medium mb-2">📝 Summary</div>
                <p className="text-sm text-gray-700">{latestAnalysis.summary}</p>
              </div>
            )}

            {latestAnalysis.positive_feedback_count && latestAnalysis.positive_feedback_count > 0 && (
              <div className="bg-white p-4 rounded-lg border border-green-100">
                <div className="font-medium mb-2 text-green-700">👍 Positive Feedback Highlights ({latestAnalysis.positive_feedback_count})</div>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  {latestAnalysis.positive_examples?.length ? (
                    latestAnalysis.positive_examples.map((example, idx) => (
                      <li key={idx}>{example}</li>
                    ))
                  ) : (
                    <li>No specific positive comments stored yet.</li>
                  )}
                </ul>
              </div>
            )}

            {latestAnalysis.common_issues && latestAnalysis.common_issues.length > 0 && (
              <div className="bg-white p-4 rounded-lg border">
                <div className="font-medium mb-3">🔴 Common Issues Found ({latestAnalysis.common_issues.length})</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {latestAnalysis.common_issues.map((issue, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="font-medium capitalize">{issue.category}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">{issue.count} reports</span>
                        <Badge variant={
                          issue.severity === 'high' ? 'destructive' : 
                          issue.severity === 'medium' ? 'secondary' : 
                          'outline'
                        }>
                          {issue.severity}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {latestAnalysis.recommendations && latestAnalysis.recommendations.length > 0 && (
              <div className="bg-white p-4 rounded-lg border">
                <div className="font-medium mb-3">💡 AI Recommendations ({latestAnalysis.recommendations.length})</div>
                <div className="space-y-3">
                  {latestAnalysis.recommendations.map((rec, idx) => (
                    <div key={idx} className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="font-medium text-green-800">{rec.issue}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">Problem:</span> {rec.current_problem}
                      </div>
                      <div className="text-sm text-green-700 mt-1">
                        <span className="font-medium">Fix:</span> {rec.suggested_fix}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {latestAnalysis.status === 'pending_review' && (
              <div className="flex gap-2 pt-2">
                <Button 
                  onClick={() => reviewAnalysis(latestAnalysis.id, 'apply')}
                  className="flex-1"
                >
                  ✅ Apply Improvements
                </Button>
                <Button 
                  onClick={() => reviewAnalysis(latestAnalysis.id, 'approve')}
                  variant="outline"
                >
                  👍 Approve
                </Button>
                <Button 
                  onClick={() => reviewAnalysis(latestAnalysis.id, 'reject')}
                  variant="destructive"
                >
                  ❌ Reject
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Pending Analyses (Admin Only) */}
      {pendingAnalyses.length > 0 && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">⏳ Pending Analysis Reviews</h3>
          <div className="space-y-4">
            {pendingAnalyses.map((analysis) => (
              <div key={analysis.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-medium">{analysis.id}</div>
                    <div className="text-sm text-gray-600">
                      {analysis.feedback_count} feedback items analyzed
                    </div>
                  </div>
                  <Badge>{analysis.status}</Badge>
                </div>

                {selectedAnalysis?.id === analysis.id ? (
                  <div className="space-y-3">
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="font-medium mb-2">Summary</div>
                      <p className="text-sm">{analysis.summary}</p>
                    </div>

                    <div className="bg-gray-50 p-3 rounded">
                      <div className="font-medium mb-2">Common Issues</div>
                      <div className="space-y-2">
                        {analysis.common_issues.slice(0, 5).map((issue, idx) => (
                          <div key={idx} className="text-sm flex items-center justify-between">
                            <span>{issue.category}</span>
                            <Badge variant={
                              issue.severity === 'high' ? 'destructive' : 
                              issue.severity === 'medium' ? 'secondary' : 
                              'outline'
                            }>
                              {issue.severity} ({issue.count})
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded">
                      <div className="font-medium mb-2">Recommendations</div>
                      <div className="space-y-2">
                        {analysis.recommendations.slice(0, 3).map((rec, idx) => (
                          <div key={idx} className="text-sm">
                            <div className="font-medium">{rec.issue}</div>
                            <div className="text-gray-600">{rec.suggested_fix}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={() => reviewAnalysis(analysis.id, 'apply')}
                        className="flex-1"
                      >
                        ✅ Apply & Approve
                      </Button>
                      <Button 
                        onClick={() => reviewAnalysis(analysis.id, 'approve')}
                        variant="outline"
                      >
                        👍 Approve Only
                      </Button>
                      <Button 
                        onClick={() => reviewAnalysis(analysis.id, 'reject')}
                        variant="destructive"
                      >
                        ❌ Reject
                      </Button>
                      <Button 
                        onClick={() => setSelectedAnalysis(null)}
                        variant="ghost"
                      >
                        Cancel
                      </Button>
                    </div>
                    {reviewNotification?.analysisId === analysis.id && (
                      <div
                        className={`mt-2 text-sm ${
                          reviewNotification.type === 'success'
                            ? 'text-green-700 bg-green-50 border-green-200'
                            : 'text-red-700 bg-red-50 border-red-200'
                        } border rounded px-3 py-2`}
                      >
                        {reviewNotification.text}
                      </div>
                    )}
                  </div>
                ) : (
                  <Button 
                    onClick={() => setSelectedAnalysis(analysis)}
                    variant="outline"
                    size="sm"
                  >
                    Review Details
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* How It Works */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="text-xl font-semibold mb-3">🤖 How Feedback Learning Works</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <span className="font-bold">1.</span>
            <span>Users provide feedback (👍/👎) on parsed resume sections</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold">2.</span>
            <span>System analyzes negative feedback daily (6 PM PST) using AI</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold">3.</span>
            <span>Common issues are categorized and prioritized by severity</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold">4.</span>
            <span>AI generates specific improvements for parsing prompts</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold">5.</span>
            <span>Improvements are auto-applied to help future resume parsing</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold">6.</span>
            <span>System tracks success rates to measure improvement over time</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

