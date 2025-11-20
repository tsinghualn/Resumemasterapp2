import { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { CheckCircle2, XCircle, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

export function SystemStatus() {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [aiStatus, setAiStatus] = useState<'checking' | 'ready' | 'error' | 'unconfigured'>('checking');
  const [aiErrorMessage, setAiErrorMessage] = useState<string>('');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkBackendHealth = async () => {
    setBackendStatus('checking');
    try {
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-bc1c5df9/health`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          signal: controller.signal,
        }
      );
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        setBackendStatus('online');
        console.log('✅ Backend health check passed');
      } else {
        console.warn('⚠️ Backend responded with non-OK status:', response.status);
        setBackendStatus('offline');
      }
    } catch (error) {
      console.error('Backend health check failed:', error);
      // Check if it's a timeout or network error
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.error('❌ Health check timed out after 5 seconds');
        } else {
          console.error('❌ Network error:', error.message);
        }
      }
      setBackendStatus('offline');
    }
    setLastChecked(new Date());
  };

  const checkAIStatus = async () => {
    setAiStatus('checking');
    try {
      // Test the optimize endpoint with minimal data
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-bc1c5df9/optimize`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            resumeSection: 'Test resume content',
            jobDescription: 'Test job description',
            sectionType: 'Test'
          })
        }
      );

      const data = await response.json();
      
      if (response.ok) {
        setAiStatus('ready');
        setAiErrorMessage('');
        console.log('✅ AI service is working correctly');
      } else {
        // Check if it's a configuration error
        if (data.error && data.error.includes('API key')) {
          setAiStatus('unconfigured');
          setAiErrorMessage(data.error);
          console.error('⚠️ OpenAI API key not configured:', data.error);
        } else if (data.error && (data.error.includes('quota') || data.error.includes('exceeded') || data.errorCode === 'OPENAI_QUOTA_EXCEEDED')) {
          setAiStatus('error');
          setAiErrorMessage('💳 OpenAI quota exceeded. Add credits at platform.openai.com/settings/organization/billing');
          console.error('⚠️ OpenAI quota exceeded:', data.error);
        } else {
          setAiStatus('error');
          setAiErrorMessage(data.error || 'Unknown error');
          console.error('❌ AI service error:', data.error);
        }
      }
    } catch (error) {
      console.error('AI status check failed:', error);
      setAiStatus('error');
      setAiErrorMessage(error instanceof Error ? error.message : 'Connection failed');
    }
  };

  const checkAllSystems = () => {
    checkBackendHealth();
    checkAIStatus();
  };

  useEffect(() => {
    checkAllSystems();
  }, []);

  return (
    <TooltipProvider>
      <div className="flex items-center gap-4 text-xs">
        {/* Backend Status */}
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Backend:</span>
          {backendStatus === 'checking' && (
            <Badge variant="outline" className="gap-1">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Checking...
            </Badge>
          )}
          {backendStatus === 'online' && (
            <Badge variant="outline" className="gap-1 border-green-500 text-green-700">
              <CheckCircle2 className="w-3 h-3" />
              Online
            </Badge>
          )}
          {backendStatus === 'offline' && (
            <Badge variant="outline" className="gap-1 border-red-500 text-red-700">
              <XCircle className="w-3 h-3" />
              Offline
            </Badge>
          )}
        </div>

        {/* AI Status */}
        <div className="flex items-center gap-2">
          <span className="text-gray-500">AI:</span>
          {aiStatus === 'checking' && (
            <Badge variant="outline" className="gap-1">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Checking...
            </Badge>
          )}
          {aiStatus === 'ready' && (
            <Badge variant="outline" className="gap-1 border-green-500 text-green-700">
              <Sparkles className="w-3 h-3" />
              Ready
            </Badge>
          )}
          {aiStatus === 'unconfigured' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-700 cursor-help">
                  <AlertCircle className="w-3 h-3" />
                  Not Configured
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">{aiErrorMessage}</p>
              </TooltipContent>
            </Tooltip>
          )}
          {aiStatus === 'error' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="gap-1 border-red-500 text-red-700 cursor-help">
                  <XCircle className="w-3 h-3" />
                  Error
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">{aiErrorMessage}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Refresh Button */}
        {lastChecked && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 px-2"
            onClick={checkAllSystems}
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
        )}
      </div>
    </TooltipProvider>
  );
}