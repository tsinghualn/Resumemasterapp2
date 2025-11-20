import { Button } from './ui/button';
import { Mail, CheckCircle } from 'lucide-react';

interface EmailVerificationInfoProps {
  email: string;
  onClose: () => void;
  onSignInNow?: () => void;
}

export function EmailVerificationInfo({ email, onClose, onSignInNow }: EmailVerificationInfoProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8">
        <div className="text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-full inline-block mb-4">
            <Mail className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl mb-2">Verify Your Email</h2>
          <p className="text-gray-600 mb-6">
            We've sent a verification link to:
          </p>
          <p className="font-medium text-gray-900 mb-6 bg-gray-100 p-3 rounded-lg">
            {email}
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-700">
                <p className="font-medium mb-2">Next Steps:</p>
                <ol className="list-decimal list-inside space-y-1 text-gray-600">
                  <li>Check your email inbox (and spam folder)</li>
                  <li>Click the verification link in the email</li>
                  <li>You'll be redirected to the sign in page</li>
                  <li>Sign in with your username and password</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={onSignInNow}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Sign in now
            </Button>
            <Button 
              onClick={onClose}
              variant="ghost"
              className="w-full"
            >
              I'll sign in later
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}