import { Button } from './ui/button';
import { FileText, Sparkles, Zap, Shield, TrendingUp, LayoutDashboard, User, Loader2 } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: (mode: 'upload' | 'scratch') => void;
  onSignIn: () => void;
  onSignUp: () => void;
  onDashboard: () => void;
  isAuthenticated?: boolean;
  email?: string;
  onSignOut?: () => void;
  isUpdating?: boolean; // New prop for feedback analysis status
}

export function LandingPage({ 
  onGetStarted, 
  onSignIn, 
  onSignUp, 
  onDashboard,
  isAuthenticated = false,
  email,
  onSignOut,
  isUpdating = false
}: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2.5 rounded-xl">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl">ResumeAI</span>
          </div>
          
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Button onClick={onDashboard} variant="outline">
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                  <User className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-gray-700">{email}</span>
                </div>
                <Button onClick={onSignOut} variant="ghost">
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                {/* Show "Updating" message only for non-authenticated users */}
                {isUpdating && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg mr-2">
                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                    <span className="text-sm text-blue-700">Updating...</span>
                  </div>
                )}
                <Button onClick={onSignIn} variant="ghost">
                  Sign In
                </Button>
                <Button onClick={onSignUp} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 px-4 py-2 rounded-full mb-6 border border-purple-200">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span className="text-sm">AI-Powered Resume Optimization</span>
            <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">OpenAI GPT-4o</span>
          </div>
          
          <h1 className="text-6xl mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Land Your Dream Job
          </h1>
          
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Transform your resume with AI. Tailor it perfectly to any job description in seconds and stand out from the competition.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
            <Button 
              onClick={() => onGetStarted('upload')}
              size="lg"
              className="text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <FileText className="w-5 h-5 mr-2" />
              Upload Resume
            </Button>
            <Button 
              onClick={() => onGetStarted('scratch')}
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 border-2"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Start from Scratch
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mt-20">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
              <div className="bg-blue-100 w-14 h-14 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Zap className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl mb-3">Lightning Fast</h3>
              <p className="text-gray-600">
                Optimize your resume in seconds with cutting-edge AI technology
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
              <div className="bg-purple-100 w-14 h-14 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Shield className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-xl mb-3">100% Private</h3>
              <p className="text-gray-600">
                Your data is secure and never shared with third parties
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
              <div className="bg-green-100 w-14 h-14 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <TrendingUp className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-xl mb-3">Better Results</h3>
              <p className="text-gray-600">
                Match job descriptions perfectly and increase your interview rate
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-20 border-t border-gray-200">
        <div className="text-center text-gray-600 text-sm">
          <p>© 2025 ResumeAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}