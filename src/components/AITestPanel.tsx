import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { CheckCircle2, XCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { apiClient } from '../utils/api';

export function AITestPanel() {
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testResult, setTestResult] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const runTest = async () => {
    setTestStatus('testing');
    setTestResult('');
    setErrorMessage('');
    setSuggestions([]);
    
    console.log('🧪 Starting OpenAI API test with Professional tone and Balanced style...');
    
    try {
      const response = await apiClient.optimizeSection(
        'Senior Software Engineer with 5 years of experience',
        'Looking for a Senior Software Engineer with strong leadership skills',
        'Professional Summary',
        'professional',
        'balanced'
      );
      
      setTestStatus('success');
      setTestResult(response.optimizedText || 'Success! But no optimized text returned.');
      setSuggestions(response.suggestions || []);
      console.log('✅ OpenAI API test successful!');
      console.log('Response:', response);
    } catch (error) {
      setTestStatus('error');
      const message = error instanceof Error ? error.message : String(error);
      setErrorMessage(message);
      console.error('❌ OpenAI API test failed:', message);
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl">AI Connection Test</h3>
        <Button 
          onClick={runTest} 
          disabled={testStatus === 'testing'}
          variant="outline"
        >
          {testStatus === 'testing' && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
          {testStatus !== 'testing' && <RefreshCw className="w-4 h-4 mr-2" />}
          Test Connection
        </Button>
      </div>
      
      <div className="space-y-4">
        {/* Status Badge */}
        {testStatus !== 'idle' && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Status:</span>
            {testStatus === 'testing' && (
              <Badge variant="outline" className="gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Testing...
              </Badge>
            )}
            {testStatus === 'success' && (
              <Badge variant="outline" className="gap-1 border-green-500 text-green-700">
                <CheckCircle2 className="w-3 h-3" />
                Connection Successful
              </Badge>
            )}
            {testStatus === 'error' && (
              <Badge variant="outline" className="gap-1 border-red-500 text-red-700">
                <XCircle className="w-3 h-3" />
                Connection Failed
              </Badge>
            )}
          </div>
        )}
        
        {/* Error Message */}
        {testStatus === 'error' && errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm mb-2">
                  <strong>Error:</strong> {errorMessage}
                </p>
                {errorMessage.includes('API key') && (
                  <div className="text-xs text-red-800 space-y-1 mt-2">
                    <p><strong>To fix this:</strong></p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Make sure you've added your OpenAI API key via the Supabase secrets modal</li>
                      <li>Your API key should start with "sk-"</li>
                      <li>Wait a few seconds after adding the key, then refresh and try again</li>
                    </ol>
                  </div>
                )}
                {(errorMessage.includes('quota') || errorMessage.includes('exceeded')) && (
                  <div className="text-xs text-red-800 space-y-1 mt-2">
                    <p><strong>💳 Quota Issue Detected:</strong></p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Visit <a href="https://platform.openai.com/settings/organization/billing" target="_blank" rel="noopener noreferrer" className="underline">OpenAI Billing Settings</a></li>
                      <li>Add credits to your OpenAI account ($5-10 recommended)</li>
                      <li>Wait 1-2 minutes for the credits to be available</li>
                      <li>Click "Test Connection" again to verify</li>
                    </ol>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Success Result */}
        {testStatus === 'success' && testResult && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm mb-2">
              <strong>✅ Success!</strong> OpenAI API is working correctly.
            </p>
            <p className="text-xs text-green-700 mb-2">
              Test used: <strong>Professional</strong> tone with <strong>Balanced</strong> style
            </p>
            <details className="mt-2">
              <summary className="text-xs text-green-800 cursor-pointer">
                View optimized test response
              </summary>
              <Textarea
                value={testResult}
                readOnly
                className="mt-2 h-32 text-xs bg-white"
              />
            </details>
            {suggestions.length > 0 && (
              <details className="mt-2">
                <summary className="text-xs text-green-800 cursor-pointer">
                  View AI suggestions
                </summary>
                <ul className="mt-2 space-y-1 text-xs bg-white p-2 rounded border">
                  {suggestions.map((suggestion, i) => (
                    <li key={i}>• {suggestion}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
        
        {/* Instructions */}
        <div className="text-xs text-gray-600 space-y-2">
          <p>
            <strong>What this test does:</strong> Sends a test request to the OpenAI API 
            through your backend to verify the connection is working.
          </p>
          <p>
            <strong>Check the browser console</strong> (press F12) for detailed logs.
          </p>
        </div>
      </div>
    </Card>
  );
}
