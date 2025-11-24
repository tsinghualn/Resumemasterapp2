/**
 * Feedback Viewer Component
 * 
 * This component displays all collected feedback about AI parsing accuracy.
 * Useful for developers and admins to analyze user feedback patterns.
 */
import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { 
  getAllFeedback, 
  getFeedbackStats, 
  getCommonIssues,
  generateParsingGuidance,
  clearAllFeedback,
  exportFeedback,
  ParseFeedback 
} from '../utils/feedbackAnalyzer';
import { Download, Trash2, TrendingUp, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { ScrollArea } from './ui/scroll-area';

export function FeedbackViewer() {
  const [feedback, setFeedback] = useState<ParseFeedback[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [commonIssues, setCommonIssues] = useState<any[]>([]);
  const [guidance, setGuidance] = useState<string>('');

  useEffect(() => {
    loadFeedback();
  }, []);

  const loadFeedback = () => {
    const allFeedback = getAllFeedback();
    const feedbackStats = getFeedbackStats();
    const issues = getCommonIssues();
    const parsingGuidance = generateParsingGuidance();

    setFeedback(allFeedback);
    setStats(feedbackStats);
    setCommonIssues(issues);
    setGuidance(parsingGuidance);
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all feedback? This cannot be undone.')) {
      clearAllFeedback();
      loadFeedback();
    }
  };

  const handleExport = () => {
    const data = exportFeedback();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `parsing-feedback-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">AI Parsing Feedback</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={handleClearAll}>
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Statistics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-gray-500">Total Feedback</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{stats.positive}</div>
              <div className="text-sm text-gray-500">Positive</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{stats.negative}</div>
              <div className="text-sm text-gray-500">Negative</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.withReasons}</div>
              <div className="text-sm text-gray-500">With Reasons</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</div>
              <div className="text-sm text-gray-500">Success Rate</div>
            </div>
          </div>
        </Card>
      )}

      {/* Common Issues */}
      {commonIssues.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            Common Issues
          </h3>
          <div className="space-y-2">
            {commonIssues.map((issue, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="capitalize">{issue.issue}</span>
                <span className="text-sm text-gray-500">{issue.count} reports</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Parsing Guidance */}
      {guidance && (
        <Alert>
          <AlertDescription>
            <h4 className="font-semibold mb-2">Generated Parsing Guidance:</h4>
            <pre className="text-sm whitespace-pre-wrap">{guidance}</pre>
          </AlertDescription>
        </Alert>
      )}

      {/* Feedback List */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">All Feedback ({feedback.length})</h3>
        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {feedback.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No feedback collected yet
              </div>
            ) : (
              feedback.map((item, index) => (
                <div 
                  key={index} 
                  className={`p-4 rounded border ${
                    item.type === 'positive' 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        item.type === 'positive' 
                          ? 'bg-green-200 text-green-800' 
                          : 'bg-red-200 text-red-800'
                      }`}>
                        {item.type}
                      </span>
                      <span className="font-medium">{item.section}</span>
                    </div>
                    <span className="text-xs text-gray-500">{formatDate(item.timestamp)}</span>
                  </div>
                  {item.reason && (
                    <div className="text-sm text-gray-700 mt-2">
                      <strong>Reason:</strong> {item.reason}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}
