import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Clock, Play, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { projectId } from '../utils/supabase/info.tsx';
import { toast } from 'sonner@2.0.3';

interface AnalysisStatus {
  is_running: boolean;
  started_at?: string;
  completed_at?: string;
  error?: boolean;
  error_message?: string;
}

interface AnalysisResult {
  analysis_date: string;
  feedback_count: number;
  comments_analyzed: number;
  summary: string;
  status: string;
  keyword_categorization?: Array<{
    category: string;
    count: number;
    examples: string[];
  }>;
}

export function FeedbackAnalysisStatus() {
  const [status, setStatus] = useState<AnalysisStatus | null>(null);
  const [latestAnalysis, setLatestAnalysis] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTriggeringManual, setIsTriggeringManual] = useState(false);

  useEffect(() => {
    checkStatus();
    checkLatestAnalysis();
    
    // Poll every 10 seconds
    const interval = setInterval(() => {
      checkStatus();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const checkStatus = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/analyze-feedback/status`);
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Error checking status:', error);
    }
  };

  const checkLatestAnalysis = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-bc1c5df9/latest-analysis`);
      if (response.ok) {
        const data = await response.json();
        if (data.analysis) {
          setLatestAnalysis(data.analysis);
        }
      }
    } catch (error) {
      console.error('Error fetching latest analysis:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerManualAnalysis = async () => {
    setIsTriggeringManual(true);
    try {
      toast.info('Starting feedback analysis...', {
        description: 'This may take 30-60 seconds'
      });

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/analyze-feedback/analyze-feedback-now`
      );
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        toast.success('Analysis completed!', {
          description: `Analyzed ${result.feedback_analyzed || 0} feedback entries`
        });
        
        // Refresh status and latest analysis
        await checkStatus();
        await checkLatestAnalysis();
      } else {
        toast.error('Analysis failed', {
          description: result.message || result.error || 'Unknown error'
        });
      }
    } catch (error) {
      console.error('Error triggering analysis:', error);
      toast.error('Failed to trigger analysis', {
        description: error instanceof Error ? error.message : 'Network error'
      });
    } finally {
      setIsTriggeringManual(false);
    }
  };

  const getStatusBadge = () => {
    if (!status) {
      return <Badge variant="secondary">Unknown</Badge>;
    }
    
    if (status.is_running) {
      return (
        <Badge variant="default" className="bg-blue-500">
          <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
          Running
        </Badge>
      );
    }
    
    if (status.error) {
      return (
        <Badge variant="destructive">
          <AlertCircle className="w-3 h-3 mr-1" />
          Error
        </Badge>
      );
    }
    
    return (
      <Badge variant="secondary" className="bg-green-500/10 text-green-700">
        <CheckCircle className="w-3 h-3 mr-1" />
        Idle
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Daily Feedback Analysis Status</CardTitle>
              <CardDescription>
                Automated analysis runs daily at 10:00 PM PST
              </CardDescription>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Status */}
          <div className="space-y-2">
            {status?.is_running && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Analysis in progress...</span>
                {status.started_at && (
                  <span className="text-gray-500">
                    Started {formatDate(status.started_at)}
                  </span>
                )}
              </div>
            )}
            
            {status?.completed_at && !status.is_running && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>Last completed: {formatDate(status.completed_at)}</span>
              </div>
            )}
            
            {status?.error && status.error_message && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span>{status.error_message}</span>
              </div>
            )}
          </div>

          {/* Manual Trigger */}
          <div className="pt-4 border-t">
            <Button
              onClick={triggerManualAnalysis}
              disabled={isTriggeringManual || status?.is_running}
              className="w-full"
              variant="outline"
            >
              {isTriggeringManual ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Run Analysis Now
                </>
              )}
            </Button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Manually trigger analysis to test the system
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Latest Analysis Results */}
      {latestAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle>Latest Analysis</CardTitle>
            <CardDescription>
              {formatDate(latestAnalysis.analysis_date)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold">{latestAnalysis.feedback_count}</div>
                <div className="text-xs text-gray-500">Total Feedback</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{latestAnalysis.comments_analyzed}</div>
                <div className="text-xs text-gray-500">Comments Analyzed</div>
              </div>
            </div>

            {latestAnalysis.summary && (
              <div className="pt-4 border-t">
                <div className="text-sm font-medium mb-2">Summary</div>
                <div className="text-sm text-gray-600">{latestAnalysis.summary}</div>
              </div>
            )}

            {latestAnalysis.keyword_categorization && latestAnalysis.keyword_categorization.length > 0 && (
              <div className="pt-4 border-t">
                <div className="text-sm font-medium mb-2">Issue Categories</div>
                <div className="space-y-2">
                  {latestAnalysis.keyword_categorization.map((cat, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 capitalize">{cat.category}</span>
                      <Badge variant="secondary">{cat.count} issues</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t">
              <Badge variant={latestAnalysis.status === 'pending_review' ? 'default' : 'secondary'}>
                {latestAnalysis.status === 'pending_review' ? 'Pending Review' : latestAnalysis.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="text-sm space-y-2">
            <div className="font-medium text-blue-900">📋 Setup Required</div>
            <div className="text-blue-700">
              To enable automatic daily analysis at 10 PM PST:
            </div>
            <ol className="list-decimal list-inside space-y-1 text-blue-700 ml-2">
              <li>Deploy Edge Functions to Supabase</li>
              <li>Configure cron job in Supabase Dashboard</li>
              <li>Set schedule: <code className="bg-blue-100 px-1 rounded">0 6 * * *</code> (6 AM UTC)</li>
            </ol>
            <div className="text-xs text-blue-600 mt-2">
              See <code>/docs/SETUP_FEEDBACK_CRON.md</code> for detailed instructions
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
