import { Card } from './ui/card';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Button } from './ui/button';
import { CheckCircle2, ExternalLink, Sparkles, DollarSign, Key, TestTube } from 'lucide-react';

export function OpenAIConnectionGuide() {
  return (
    <div className="space-y-4">
      <Alert className="border-blue-500 bg-blue-50">
        <Sparkles className="h-4 w-4 text-blue-600" />
        <AlertTitle>OpenAI Integration Active</AlertTitle>
        <AlertDescription>
          Your resume optimization app is now connected to OpenAI GPT-4o-mini for AI-powered resume enhancement.
        </AlertDescription>
      </Alert>

      <Card className="p-6">
        <h3 className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <span>Connection Checklist</span>
        </h3>
        
        <div className="space-y-4">
          {/* Step 1 */}
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <Key className="w-4 h-4 text-green-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm mb-1">1. API Key Configured</h4>
              <p className="text-xs text-gray-600">
                Your OPENAI_API_KEY environment variable is set up in Supabase
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm mb-1">2. Credits Available</h4>
              <p className="text-xs text-gray-600 mb-2">
                Your OpenAI account has sufficient credits for API calls
              </p>
              <a
                href="https://platform.openai.com/settings/organization/billing"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-xs text-blue-600 hover:text-blue-700"
              >
                Check your billing
                <ExternalLink className="ml-1 w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
              <TestTube className="w-4 h-4 text-purple-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm mb-1">3. Test the Connection</h4>
              <p className="text-xs text-gray-600 mb-2">
                Verify everything is working with a quick test
              </p>
              <p className="text-xs text-gray-500">
                Click the "Test AI" button in the navigation bar to run a diagnostic test
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50">
        <h3 className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-green-600" />
          <span>AI Features Available</span>
        </h3>
        
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">✓</span>
            <span>Resume section optimization with customizable tone (Professional, Creative, Technical, Executive)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">✓</span>
            <span>Rewrite styles (Concise, Detailed, Balanced, Achievement-Focused)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">✓</span>
            <span>AI-powered job match scoring and analysis</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">✓</span>
            <span>Intelligent keyword optimization for ATS systems</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">✓</span>
            <span>Contextual suggestions and recommendations</span>
          </li>
        </ul>
      </Card>

      <div className="text-center text-xs text-gray-500 space-y-1">
        <p>
          Using <strong>GPT-4o-mini</strong> model for cost-effective, high-quality optimization
        </p>
        <p>
          Estimated cost: ~$0.01-0.03 per full resume optimization
        </p>
      </div>
    </div>
  );
}
