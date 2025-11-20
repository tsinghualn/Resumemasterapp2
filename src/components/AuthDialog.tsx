import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Progress } from './ui/progress';
import { toast } from 'sonner@2.0.3';
import { FileText, Mail } from 'lucide-react';
import { createClient } from '../utils/supabase/client';
import { apiClient } from '../utils/api';

interface AuthDialogProps {
  open: boolean;
  onClose: () => void;
  mode: 'signin' | 'signup';
  onSuccess: () => void;
  onSwitchMode: () => void;
  onSignupSuccess?: (email: string) => void;
  onOpenSignIn?: () => void;
}

export function AuthDialog({ open, onClose, mode, onSuccess, onSwitchMode, onSignupSuccess, onOpenSignIn }: AuthDialogProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [showEmailAlert, setShowEmailAlert] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [showResetSuccessDialog, setShowResetSuccessDialog] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');

  const validatePassword = (pwd: string): boolean => {
    if (pwd.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return false;
    }
    if (!/[0-9]/.test(pwd)) {
      setPasswordError('Password must include at least one number');
      return false;
    }
    if (!/[a-zA-Z]/.test(pwd)) {
      setPasswordError('Password must include at least one letter');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate password for both signup and signin
      if (mode === 'signup' && !validatePassword(password)) {
        setIsLoading(false);
        return;
      }

      const supabase = createClient();

      if (mode === 'signup') {
        // Sign up with backend API
        const { user, message } = await apiClient.signup(email, password);
        
        console.log('✅ Signup successful:', { user, message });
        
        // Store credentials for showing in success dialog
        setSignupEmail(email);
        
        // Show success alert dialog
        setShowSuccessAlert(true);
        
        // Close the main dialog
        handleClose();
        
        // Call onSignupSuccess if provided
        if (onSignupSuccess) {
          onSignupSuccess(email);
        }
      } else {
        // Sign in - use email only
        const loginEmail = email;
        
        // Always check if the account exists in Supabase Auth before attempting sign-in
        console.log('🔍 Checking if account exists for email:', loginEmail);
        try {
          const debugInfo = await apiClient.debugUser(loginEmail);
          console.log('📊 Debug info:', JSON.stringify(debugInfo, null, 2));
          
          if (!debugInfo.auth.found) {
            console.error('❌ Account not found in Supabase Auth');
            toast.error('Account not found. Please check your email or sign up for a new account.', {
              duration: 5000,
            });
            setIsLoading(false);
            return;
          }
          
          if (!debugInfo.auth.emailConfirmed) {
            console.error('❌ Email not confirmed');
            toast.error('Email not verified. Please check your email for the verification link.', {
              duration: 5000,
            });
            setIsLoading(false);
            return;
          }
          
          console.log('✅ Account exists and email is confirmed');
          console.log('✅ Final email for sign-in:', loginEmail);
          
        } catch (debugError) {
          console.error('❌ Debug check failed:', debugError);
          toast.error('Unable to verify account. Please try again.', {
            duration: 5000,
          });
          setIsLoading(false);
          return;
        }
        
        console.log('🔐 Attempting sign in with email:', loginEmail);
        console.log('🔐 Password length:', password.length);
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password,
        });

        if (error) {
          console.error('❌ Sign in error:', error);
          console.error('Error details:', {
            message: error.message,
            status: error.status,
            name: error.name
          });
          
          throw error;
        }
        
        console.log('✅ Sign in successful');
        
        // Set access token for API calls
        apiClient.setAccessToken(data.session.access_token);
        
        toast.success('Successfully signed in!');
        onSuccess();
        setEmail('');
        setPassword('');
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      
      // Handle specific error cases
      if (error.message.includes('already exists') || error.message.includes('EMAIL_EXISTS') || error.message.includes('already been registered')) {
        toast.error('This email is already registered.', {
          duration: 6000,
          action: {
            label: 'Sign In Instead',
            onClick: () => {
              onSwitchMode();
            },
          },
        });
      } else if (error.message.includes('Invalid login credentials')) {
        toast.error('Invalid email or password. Please check and try again.', {
          duration: 5000,
        });
      } else if (error.message.includes('Email not confirmed')) {
        toast.error('Please verify your email address before signing in. Check your inbox for the verification link.', {
          duration: 6000,
        });
      } else {
        toast.error(error.message || 'Authentication failed. Please try again.', {
          duration: 5000,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setPasswordError('');
    onClose();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <DialogTitle className="text-2xl">
                {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
              </DialogTitle>
            </div>
            <DialogDescription>
              {mode === 'signin'
                ? 'Sign in to access your saved resumes and continue optimizing'
                : 'Join thousands of job seekers who landed their dream jobs'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            )}

            {mode === 'signin' && (
              <div className="space-y-2">
                <Label htmlFor="email-signin">Email</Label>
                <Input
                  id="email-signin"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
              {mode === 'signup' && !passwordError && (
                <p className="text-gray-500 text-xs">At least 8 characters, including a number and letter</p>
              )}
              {mode === 'signin' && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="text-xs text-blue-600 hover:underline"
                    onClick={() => {
                      setShowResetDialog(true);
                    }}
                  >
                    Forgot Password?
                  </button>
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              disabled={isLoading}
            >
              {isLoading
                ? mode === 'signin'
                  ? 'Signing in...'
                  : 'Creating account...'
                : mode === 'signin'
                ? 'Sign In'
                : 'Create Account'}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">
                  {mode === 'signin' ? 'New to ResumeAI?' : 'Already have an account?'}
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={onSwitchMode}
            >
              {mode === 'signin' ? 'Create an account' : 'Sign in instead'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Email Verification Alert Dialog */}
      <AlertDialog open={showEmailAlert} onOpenChange={setShowEmailAlert}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-full">
                <Mail className="w-10 h-10 text-white" />
              </div>
            </div>
            <AlertDialogTitle className="text-center text-2xl">
              Check Your Email!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center space-y-4">
              <p className="text-base">
                We've sent a verification link to:
              </p>
              <p className="font-semibold text-gray-900 bg-gray-100 p-3 rounded-lg">
                {signupEmail}
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                <p className="font-medium text-gray-900 mb-2">Next Steps:</p>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                  <li>Check your email inbox (and spam folder)</li>
                  <li>Click the verification link in the email</li>
                  <li>Return here and sign in with your credentials</li>
                </ol>
              </div>
              <p className="text-sm text-gray-600">
                You must verify your email before you can sign in.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              Got it!
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Success Alert Dialog */}
      <AlertDialog open={showSuccessAlert} onOpenChange={setShowSuccessAlert}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-4 rounded-full">
                <Mail className="w-10 h-10 text-white" />
              </div>
            </div>
            <AlertDialogTitle className="text-center text-2xl">
              🎉 Account Created Successfully!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center space-y-4">
              <p className="text-base text-gray-700">
                Your account has been created for:
              </p>
              <p className="font-semibold text-gray-900 bg-gray-100 p-3 rounded-lg">
                {signupEmail}
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left">
                <p className="font-medium text-gray-900 mb-2">✅ You're all set!</p>
                <p className="text-sm text-gray-700">
                  Your email has been automatically verified. You can now sign in with your email and password to access all features.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction 
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              onClick={() => {
                setShowSuccessAlert(false);
                // Switch to signin mode and reopen the dialog
                onSwitchMode(); // This will switch to signin mode
                // The auth dialog should already be configured for signin mode
                // We don't call onClose() because we want the dialog to remain open
                // but it was already closed earlier, so we need to tell parent to reopen
                if (onOpenSignIn) {
                  setTimeout(() => {
                    onOpenSignIn();
                  }, 200);
                }
              }}
            >
              Sign In Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Password Reset Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-full">
                <Mail className="w-10 h-10 text-white" />
              </div>
            </div>
            <AlertDialogTitle className="text-center text-2xl">
              Reset Your Password
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center space-y-4">
              <p className="text-base">
                Enter your email to reset your password:
              </p>
              <Input
                id="reset-email"
                type="email"
                placeholder="you@example.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction 
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              onClick={async () => {
                setIsResetting(true);
                try {
                  const { message, tempPassword: newTempPassword } = await apiClient.resetPassword(resetEmail);
                  console.log('✅ Password reset response:', message);
                  setTempPassword(newTempPassword);
                  setShowResetDialog(false);
                  setShowResetSuccessDialog(true);
                } catch (error: any) {
                  console.error('Password reset error:', error);
                  toast.error(error.message || 'Failed to send password reset email.');
                  setShowResetDialog(false);
                } finally {
                  setIsResetting(false);
                }
              }}
              disabled={isResetting}
            >
              {isResetting ? 'Sending...' : 'Send Reset Email'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Password Reset Success Dialog */}
      <AlertDialog open={showResetSuccessDialog} onOpenChange={setShowResetSuccessDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-4 rounded-full">
                <Mail className="w-10 h-10 text-white" />
              </div>
            </div>
            <AlertDialogTitle className="text-center text-2xl">
              🎉 Password Reset Successful!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center space-y-4">
              <p className="text-base text-gray-700">
                Your password has been reset for:
              </p>
              <p className="font-semibold text-gray-900 bg-gray-100 p-3 rounded-lg">
                {resetEmail}
              </p>
              <p className="text-base text-gray-700">
                New Password: <span className="font-semibold">{tempPassword}</span>
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left">
                <p className="font-medium text-gray-900 mb-2">✅ You're all set!</p>
                <p className="text-sm text-gray-700">
                  Your password has been successfully reset. You can now sign in with your new password to access all features.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction 
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              onClick={() => {
                setShowResetSuccessDialog(false);
                // Open sign in dialog after success message
                onSwitchMode(); // This will switch to signin mode
                setTimeout(() => {
                  onClose(); // Close current dialog
                  // The parent will open the auth dialog in signin mode
                }, 100);
              }}
            >
              Sign In Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}