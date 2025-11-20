import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Button } from './ui/button';
import { AlertCircle, ExternalLink, X } from 'lucide-react';

export function OpenAIStatusBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<string>('');

  useEffect(() => {
    // Listen for OpenAI quota errors
    const handleQuotaError = () => {
      setShowBanner(true);
      setBannerMessage('OpenAI API quota exceeded');
    };

    // You can trigger this from other components when quota errors occur
    window.addEventListener('openai-quota-error', handleQuotaError);

    return () => {
      window.removeEventListener('openai-quota-error', handleQuotaError);
    };
  }, []);

  if (!showBanner) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl px-4">
      <Alert variant="destructive" className="border-red-500 bg-red-50 dark:bg-red-950">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle className="flex items-center justify-between">
          <span>OpenAI API Credits Depleted</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setShowBanner(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </AlertTitle>
        <AlertDescription className="mt-2">
          <p className="mb-3">
            Your OpenAI API key has run out of credits. AI features are temporarily using fallback methods.
          </p>
          <div className="space-y-2">
            <p className="text-sm font-medium">To restore full AI functionality:</p>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>
                Visit{' '}
                <a
                  href="https://platform.openai.com/settings/organization/billing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center underline hover:no-underline"
                >
                  OpenAI Billing Settings
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </li>
              <li>Add credits to your OpenAI account ($5-10 is usually sufficient)</li>
              <li>Or upload a new API key with available credits in the environment variables</li>
            </ol>
          </div>
          <div className="mt-3 pt-3 border-t border-red-300 dark:border-red-700">
            <p className="text-xs text-red-800 dark:text-red-200">
              💡 <strong>Note:</strong> The app will continue to work with fallback optimization, but AI-powered features will be limited.
            </p>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
