import { useState, useEffect } from 'react';
import { createClient } from './utils/supabase/client';
import { apiClient } from './utils/api';
import { projectId } from './utils/supabase/info.tsx';
import { toast } from 'sonner@2.0.3';
import { isAdminUser } from './utils/adminConfig';
import { FileText, Home, LogOut, Settings } from 'lucide-react';
import { Button } from './components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './components/ui/dialog';
import { LandingPage } from './components/LandingPage';
import { ResumeUploader } from './components/ResumeUploader';
import { AuthDialog } from './components/AuthDialog';
import { AIRewritePanel } from './components/AIRewritePanel';
import { JobDescriptionScreen } from './components/JobDescriptionScreen';
import { JobMatchScore } from './components/JobMatchScore';
import { ResumePreview } from './components/ResumePreview';
import { Dashboard } from './components/Dashboard';
import { SystemStatus } from './components/SystemStatus';
import { AITestPanel } from './components/AITestPanel';
import { EmailVerificationInfo } from './components/EmailVerificationInfo';
import { FeedbackLearningDashboard } from './components/FeedbackLearningDashboard';
import { StartFromScratchDialog } from './components/StartFromScratchDialog';

type Screen = 'landing' | 'upload' | 'jobdesc' | 'optimize' | 'matchscore' | 'preview' | 'dashboard' | 'parsed' | 'admin-feedback';
type AuthMode = 'signin' | 'signup';

interface ResumeData {
  name: string;
  nameTitle?: string;
  contact: string;
  contactTitle?: string;
  personalInfoTitle?: string;
  summary: string;
  summaryTitle?: string;
  experience: string;
  experienceTitle?: string;
  education: string;
  educationTitle?: string;
  courses: string;
  coursesTitle?: string;
  skills: string;
  skillsTitle?: string;
  projects: string;
  projectsTitle?: string;
  certifications: string;
  certificationsTitle?: string;
  publications: string;
  publicationsTitle?: string;
  patents: string;
  patentsTitle?: string;
  presentations: string;
  presentationsTitle?: string;
  awards: string;
  awardsTitle?: string;
  activities: string;
  activitiesTitle?: string;
  languages: string;
  languagesTitle?: string;
  interests: string;
  interestsTitle?: string;
  references: string;
  referencesTitle?: string;
  customSections?: Array<{ id: string; title: string; content: string }>;
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('landing');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [startMode, setStartMode] = useState<'upload' | 'scratch'>('upload');
  const [isEditMode, setIsEditMode] = useState(false); // Track if user is editing existing resume
  const [optimizationFlow, setOptimizationFlow] = useState<'direct' | 'withJob'>('direct'); // Track if user came directly or via job description
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [parseResumeDialogOpen, setParseResumeDialogOpen] = useState(false);
  const [isFeedbackAnalysisRunning, setIsFeedbackAnalysisRunning] = useState(false);
  const [startFromScratchDialogOpen, setStartFromScratchDialogOpen] = useState(false);
  
  const [resumeContent, setResumeContent] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [jobDescription, setJobDescription] = useState<string>('');
  const [modifiedResume, setModifiedResume] = useState<string>('');
  
  // Cache for parsed resume data to avoid re-parsing
  const [cachedResumeData, setCachedResumeData] = useState<ResumeData | null>(null);
  
  // Cache for resume changes when navigating back from AI Resume Optimization
  const [cachedResumeChanges, setCachedResumeChanges] = useState<any>(null);
  
  // Cache for original resume content string (needed to restore AIRewritePanel)
  const [cachedResumeContent, setCachedResumeContent] = useState<string>('');
  
  // Loading state to ensure data is ready before navigation
  const [isRestoringCache, setIsRestoringCache] = useState(false);
  
  // Track previous screen for dashboard "Go Back" button
  const [previousScreen, setPreviousScreen] = useState<Screen>('landing');
  
  // TODO: Cache for AI-generated optimization data (for future use)
  // const [cachedOptimizedResume, setCachedOptimizedResume] = useState<string>('');
  // const [cachedMatchScore, setCachedMatchScore] = useState<number | null>(null);
  // const [cachedMatchStats, setCachedMatchStats] = useState<any>(null);

  // Check for existing session on mount
  useEffect(() => {
    checkSession();
  }, []);
  
  // Handle restoration of cached resume data (with proper state synchronization)
  useEffect(() => {
    if (isRestoringCache && resumeContent && cachedResumeData) {
      console.log('✅ [useEffect] Resume data fully restored, navigating to optimize screen');
      console.log('  - resumeContent length:', resumeContent.length);
      console.log('  - cachedResumeData exists:', !!cachedResumeData);
      
      // Clear the cache AFTER state is confirmed ready
      setCachedResumeChanges(null);
      setCachedResumeContent('');
      
      setIsRestoringCache(false);
      setCurrentScreen('optimize');
      setOptimizationFlow('direct');
    }
  }, [isRestoringCache, resumeContent, cachedResumeData]);

  // Determine if current user is admin (checks role from database)
  const isAdmin = isAdminUser(currentUser);
  
  // Debug logging for admin detection
  useEffect(() => {
    console.log('🔍 Admin check running...');
    console.log('currentUser:', currentUser);
    console.log('currentUser.role:', currentUser?.role);
    console.log('isAdmin result:', isAdmin);
  }, [currentUser, isAdmin]);

  // Poll for feedback analysis status (ONLY for admin users)
  useEffect(() => {
    if (!isAdmin) {
      // Don't poll if user is NOT admin
      setIsFeedbackAnalysisRunning(false);
      return;
    }

    console.log('🔍 Admin detected - polling for feedback analysis status');

    const checkFeedbackStatus = async () => {
      try {
        const response = await fetch(`https://${projectId}.supabase.co/functions/v1/analyze-feedback/status`);
        const data = await response.json();
        console.log('📊 Feedback analysis status:', data);
        setIsFeedbackAnalysisRunning(data.is_running || false);
      } catch (error) {
        console.error('Error checking feedback status:', error);
        setIsFeedbackAnalysisRunning(false);
      }
    };

    // Check immediately
    checkFeedbackStatus();

    // Poll every 10 seconds
    const intervalId = setInterval(checkFeedbackStatus, 10000);

    return () => clearInterval(intervalId);
  }, [isAdmin]);

  const checkSession = async () => {
    try {
      const supabase = createClient();
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (session?.access_token) {
        apiClient.setAccessToken(session.access_token);
        setIsAuthenticated(true);
        
        // Fetch user profile with username and role
        try {
          console.log('🔍 Fetching user profile...');
          console.log('Session user ID:', session.user.id);
          console.log('Session user email:', session.user.email);
          
          const userProfile = await apiClient.getMe();
          console.log('User profile from API:', userProfile);
          
          // Fetch role directly from database (backend not updated yet)
          console.log('🔍 Fetching role from database...');
          console.log('Looking up user with ID:', session.user.id);
          console.log('Looking up user with email:', session.user.email);
          
          const supabase = createClient();
          
          // Query database for role only (username column may not exist)
          const { data: dbUser, error: dbError} = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();
          
          console.log('Database query returned:');
          console.log('  - data:', dbUser);
          console.log('  - error:', dbError);
          
          if (dbError) {
            console.error('❌ Database error:', dbError);
          } else {
            console.log('✅ User from database:', dbUser);
          }
          
          const finalRole = dbUser?.role || 'user';
          const finalUsername = userProfile.username || session.user.email?.split('@')[0];
          
          console.log('📊 Setting currentUser with:');
          console.log('  - username:', finalUsername);
          console.log('  - role:', finalRole);
          
          setCurrentUser({
            ...session.user,
            username: finalUsername,
            role: finalRole
          });
          
          console.log('✅ Current user set successfully!');
          console.log('🎯 Role is:', finalRole);
          
          if (finalRole === 'admin') {
            console.log('🎉 ADMIN USER DETECTED!');
          } else {
            console.log('⚠️ User is NOT admin, role is:', finalRole);
          }
        } catch (profileError) {
          console.error('❌ Error fetching user profile:', profileError);
          // Fallback to just the session user with default role
          setCurrentUser({
            ...session.user,
            username: session.user.email?.split('@')[0],
            role: 'user'  // Default role
          });
        }
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setIsCheckingSession(false);
    }
  };

  // Clear all cached data when starting fresh
  const clearAllCachedData = () => {
    console.log('🧹 Clearing all cached data...');
    setResumeContent('');
    setUploadedFileName('');
    setJobDescription('');
    setModifiedResume('');
    setCachedResumeData(null);
    setIsEditMode(false);
    setOptimizationFlow('direct');
  };

  const handleGetStarted = async (mode: 'upload' | 'scratch') => {
    setStartMode(mode);
    
    // Clear all cached data when starting fresh
    clearAllCachedData();
    
    if (mode === 'scratch') {
      // Show dialog to choose between AI Resume Building or Tailor for Job
      setStartFromScratchDialogOpen(true);
    } else {
      // Upload mode - open the dialog
      setParseResumeDialogOpen(true);
    }
  };

  const handleClearCachedChanges = () => {
    // Clear cached resume changes when user cancels or switches to Tailor for Job
    console.log('🧹 Clearing cached resume changes');
    setCachedResumeChanges(null);
  };

  const handleStartFromScratchAIBuilding = async () => {
    try {
      console.log('🎨 Starting AI Resume Building from scratch...');
      console.log('🔍 Checking for cached resume changes...');
      console.log('  - cachedResumeChanges exists:', !!cachedResumeChanges);
      console.log('  - cachedResumeContent exists:', !!cachedResumeContent);
      console.log('  - cachedResumeContent length:', cachedResumeContent?.length || 0);
      console.log('  - resumeContent exists:', !!resumeContent);
      console.log('  - resumeContent length:', resumeContent?.length || 0);
      
      setStartFromScratchDialogOpen(false);
      
      // If we have cached resume changes, restore them
      if (cachedResumeChanges && cachedResumeContent) {
        console.log('📥 Restoring cached resume changes');
        console.log('  - Cached form data structure:', Object.keys(cachedResumeChanges));
        console.log('  - Restoring resume content with length:', cachedResumeContent.length);
        
        // Set loading state
        setIsRestoringCache(true);
        
        // Restore the parsed form data
        setCachedResumeData(cachedResumeChanges);
        
        // Restore the original resume content (CRITICAL for AIRewritePanel)
        setResumeContent(cachedResumeContent);
        
        // DON'T clear the cache here - the useEffect will do it after state is ready
        // The useEffect hook will handle navigation once state is ready
        return;
      }
      
      console.log('📝 No cached changes found, creating blank template');
      
      // Create blank template with no pre-filled values so placeholders show properly
      const blankTemplate = `YOUR NAME

PROFESSIONAL SUMMARY

[Add your professional summary here]

EXPERIENCE

[Add your work experience here]

EDUCATION

[Add your education here]

SKILLS

[Add your skills here]`;
      
      setResumeContent(blankTemplate);
      setUploadedFileName('new-resume.txt');
      setJobDescription(''); // Clear job description
      setOptimizationFlow('direct');
      
      // Auto-save blank template if user is authenticated
      if (isAuthenticated && currentUser) {
        try {
          const resumeData = {
            name: 'New Resume',
            content: blankTemplate,
            originalContent: blankTemplate,
            fileName: 'new-resume.txt',
            jobDescription: '',
            matchScore: null,
            template: 'default',
            status: 'draft'
          };
          
          const result = await apiClient.createResume(resumeData);
          console.log('✅ Blank resume auto-saved:', result);
          toast.success('New resume created!', {
            description: 'Start building with AI assistance'
          });
        } catch (error) {
          console.error('Error auto-saving blank resume:', error);
        }
      }
      
      // Use setTimeout to ensure state updates complete before navigation
      setTimeout(() => {
        console.log('✅ Blank template created, navigating to optimize screen');
        setCurrentScreen('optimize');
      }, 50);
    } catch (error) {
      console.error('Error in handleStartFromScratchAIBuilding:', error);
      toast.error('Failed to start AI Resume Building', {
        description: 'Please try again'
      });
    }
  };

  const handleStartFromScratchTailorForJob = () => {
    try {
      console.log('🎯 Starting Tailor for Job from scratch...');
      setStartFromScratchDialogOpen(false);
      
      // If we're coming from the back button with cached changes, clear them
      // since user is switching to Tailor for Job flow
      if (cachedResumeChanges) {
        console.log('🧹 Clearing cached resume changes (switching to Tailor for Job)');
        setCachedResumeChanges(null);
      }
      
      // Navigate to Job Description page
      setCurrentScreen('jobdesc');
    } catch (error) {
      console.error('Error in handleStartFromScratchTailorForJob:', error);
      toast.error('Failed to start Tailor for Job', {
        description: 'Please try again'
      });
    }
  };

  const handleSignIn = () => {
    setAuthMode('signin');
    setAuthDialogOpen(true);
  };

  const handleSignUp = () => {
    setAuthMode('signup');
    setAuthDialogOpen(true);
  };

  const handleAuthSuccess = async () => {
    setIsAuthenticated(true);
    setAuthDialogOpen(false);
    await checkSession(); // Refresh session to get user data
    
    // Only navigate to landing page if user was on landing page
    // Otherwise, keep them on their current screen
    if (currentScreen === 'landing') {
      toast.success('Welcome! Your resumes are now being saved.');
    } else {
      toast.success('Signed in successfully! Your work will now be saved.');
    }
  };

  const handleSwitchAuthMode = () => {
    setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
  };

  const handleSignupSuccess = (email: string) => {
    setVerificationEmail(email);
    // Don't show the separate email verification component anymore
    // The AuthDialog handles the success message internally
  };

  const handleSignInNow = () => {
    // Close the email verification modal
    setShowEmailVerification(false);
    // Ensure we're in sign-in mode
    setAuthMode('signin');
    // Small delay to ensure state updates, then open the auth dialog
    setTimeout(() => {
      setAuthDialogOpen(true);
    }, 100);
  };

  const handleOpenSignIn = () => {
    // Make sure we're in sign-in mode and open the dialog
    setAuthMode('signin');
    setAuthDialogOpen(true);
  };

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      apiClient.setAccessToken(null);
      setIsAuthenticated(false);
      setCurrentUser(null);
      setCurrentScreen('landing');
      setResumeContent('');
      setJobDescription('');
      setModifiedResume('');
      toast.success('Successfully signed out');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
    }
  };

  const handleBackToHome = () => {
    setCurrentScreen('landing');
  };

  const handleResumeUpload = async (content: string, fileName: string, parsedData?: ResumeData) => {
    console.log('🔄 handleResumeUpload called with fileName:', fileName, 'content length:', content.length);
    console.log('📊 Current screen before navigation:', currentScreen);
    console.log('📦 Parsed data received:', parsedData ? 'Yes' : 'No');
    
    if (content) {
      console.log('✅ Content received, preparing to navigate...')
      
      // Store parsed data if provided
      if (parsedData) {
        console.log('💾 Storing parsed resume data in cache');
        setCachedResumeData(parsedData);
      }
      
      // Auto-save uploaded resume if user is authenticated
      if (isAuthenticated && currentUser) {
        try {
          const resumeData = {
            name: fileName.replace(/\.(txt|pdf|docx)$/i, ''),
            content: content,
            originalContent: content,
            fileName: fileName,
            jobDescription: '',
            matchScore: null,
            template: 'default',
            status: 'uploaded'
          };
          
          const result = await apiClient.createResume(resumeData);
          console.log('✅ Resume auto-saved:', result);
          // Don't show duplicate toast - ResumeUploader already shows success
        } catch (error) {
          console.error('Error auto-saving resume:', error);
          toast.warning('Resume uploaded but not saved', {
            description: 'Sign in to save your resumes permanently'
          });
        }
      }
      
      // Update state and navigate immediately for better UX
      console.log('✅ State updated, navigating to AI Resume optimization screen...');
      setResumeContent(content);
      setUploadedFileName(fileName);

      // Navigate directly to AI Resume optimization - skip parsed screen
      setCurrentScreen('optimize');
      setOptimizationFlow('direct');
      setJobDescription(''); // Clear job description when going direct to AI Resume Building
      console.log('🎯 Navigation complete - screen set to: jobdesc');
    } else {
      console.log('❌ No content provided, skipping navigation');
    }
  };

  const handleBackToUpload = () => {
    // If in edit mode, go back to dashboard instead of upload
    if (isEditMode) {
      setCurrentScreen('dashboard');
      setIsEditMode(false);
    } else {
      setCurrentScreen('upload');
    }
  };

  const handleContinueToJobDesc = () => {
    setCurrentScreen('jobdesc');
    // Clear edit mode when moving forward in the flow
    if (isEditMode) {
      setIsEditMode(false);
    }
  };

  const handleJobDescNext = (jobDesc: string) => {
    setJobDescription(jobDesc);
    setCurrentScreen('optimize');
    setOptimizationFlow('withJob');
  };

  const handleBackFromOptimize = (currentResumeData?: any) => {
    // Save resume changes to cache
    if (currentResumeData) {
      console.log('💾 Saving resume changes to cache before navigating back');
      console.log('💾 Saving data:', {
        hasFormData: !!currentResumeData,
        hasResumeContent: !!resumeContent,
        resumeContentLength: resumeContent?.length || 0
      });
      
      // Cache the form data (parsed resume sections)
      setCachedResumeChanges(currentResumeData);
      setCachedResumeData(currentResumeData);
      
      // Cache the original resume content string (critical for AIRewritePanel)
      setCachedResumeContent(resumeContent);
    }
    
    if (optimizationFlow === 'direct') {
      // Scenario 1 & 3: User came from AI Resume Building (Start from Scratch or Upload Resume)
      // Navigate to landing page first, then show the dialog
      console.log('🔙 Back from AI Resume Building - navigating to landing and showing dialog');
      setCurrentScreen('landing');
      // Use setTimeout to ensure the screen changes before opening the dialog
      setTimeout(() => {
        setStartFromScratchDialogOpen(true);
      }, 100);
    } else {
      // Scenario 2 & 4: User came from Tailor for Job -> Job Description
      // Navigate back to Job Description page
      console.log('🔙 Back to Job Description page');
      setCurrentScreen('jobdesc');
    }
  };

  const handleOptimizeNext = (optimizedResume: string) => {
    setModifiedResume(optimizedResume);
    setCurrentScreen('matchscore');
  };

  const handleBackToOptimize = () => {
    setCurrentScreen('optimize');
  };

  const handleMatchScoreNext = () => {
    setCurrentScreen('preview');
  };

  const handleBackToMatchScore = () => {
    setCurrentScreen('matchscore');
  };

  const handleSaveResume = async () => {
    if (!isAuthenticated || !currentUser) {
      toast.warning('Sign in to save your resume', {
        description: 'Create an account to store your resumes permanently'
      });
      setAuthDialogOpen(true);
      return;
    }

    try {
      const resumeData = {
        name: uploadedFileName.replace(/\.(txt|pdf|docx)$/i, ''),
        content: modifiedResume || resumeContent,
        originalContent: resumeContent,
        fileName: uploadedFileName,
        jobDescription: jobDescription,
        matchScore: null, // This could be calculated if needed
        template: 'default',
        status: 'completed'
      };
      
      const result = await apiClient.createResume(resumeData);
      console.log('✅ Resume saved successfully:', result);
      toast.success('Resume saved successfully!', {
        description: 'You can access it from your Dashboard'
      });
      setPreviousScreen('preview'); // Track that we came from preview
      setCurrentScreen('dashboard');
    } catch (error) {
      console.error('Error saving resume:', error);
      toast.error('Failed to save resume', {
        description: error instanceof Error ? error.message : 'Please try again'
      });
    }
  };

  const handleGoToDashboard = () => {
    setPreviousScreen(currentScreen); // Track where we're coming from
    setCurrentScreen('dashboard');
  };
  
  const handleBackFromDashboard = () => {
    // Go back to previous screen if it has resume data, otherwise go to landing
    if (previousScreen === 'preview' && (modifiedResume || resumeContent)) {
      setCurrentScreen('preview');
    } else if (previousScreen === 'landing' || !resumeContent) {
      setCurrentScreen('landing');
    } else {
      // If there's resume data but previous screen was something else, go to preview
      setCurrentScreen('preview');
    }
  };

  const handleNewResume = () => {
    setCurrentScreen('upload');
    setResumeContent('');
    setUploadedFileName('');
    setJobDescription('');
    setModifiedResume('');
    setIsEditMode(false);
  };

  const handleEditResume = (resumeId: string) => {
    // In production, load resume from Supabase
    // For now, generate mock resume content based on resumeId
    const mockResumes: Record<string, { content: string; fileName: string; jobDesc: string }> = {
      '1': {
        fileName: 'Software_Engineer_Resume_v3.txt',
        jobDesc: 'We are seeking a Senior Software Engineer with 5+ years of experience in full-stack development...',
        content: `JOHN DOE
Email: john.doe@email.com | Phone: (555) 123-4567 | LinkedIn: linkedin.com/in/johndoe

PROFESSIONAL SUMMARY
Senior Software Engineer with 5 years of experience in technology and innovation. Proven track record of delivering high-impact solutions and driving results in fast-paced environments.

EXPERIENCE

Senior Software Engineer
TechCorp Solutions | 2022 - Present
• Led cross-functional teams to deliver complex projects on time and under budget
• Improved system performance by 40% through strategic optimizations
• Mentored junior team members and conducted code reviews
• Collaborated with stakeholders to define product roadmap and priorities

Software Engineer
InnovateLabs Inc. | 2020 - 2022
• Developed and implemented innovative solutions that increased efficiency by 35%
 Managed multiple projects simultaneously with competing deadlines
• Presented technical concepts to non-technical stakeholders
• Contributed to company-wide best practices and documentation

EDUCATION

Bachelor of Science in Computer Science
University of Technology | 2016 - 2020
• GPA: 3.8/4.0
• Dean's List: All semesters
• Relevant Coursework: Data Structures, Algorithms, Software Engineering

SKILLS

Technical: JavaScript, Python, React, Node.js, SQL, AWS, Git
Soft Skills: Leadership, Communication, Problem Solving, Team Collaboration
Tools: Jira, Confluence, Figma, VS Code

CERTIFICATIONS

• AWS Certified Solutions Architect
• Certified Scrum Master (CSM)
• Google Cloud Professional`
      },
      '2': {
        fileName: 'Product_Manager_Resume_v2.txt',
        jobDesc: 'Looking for an experienced Product Manager to lead product strategy and development...',
        content: `JANE SMITH
Email: jane.smith@email.com | Phone: (555) 987-6543 | LinkedIn: linkedin.com/in/janesmith

PROFESSIONAL SUMMARY
Product Manager with 4 years of experience in technology and innovation. Proven track record of delivering high-impact products and driving results in fast-paced environments.

EXPERIENCE

Product Manager
InnovateLabs | 2022 - Present
• Led product strategy for flagship products serving 100K+ users
• Increased user engagement by 50% through data-driven feature prioritization
• Collaborated with engineering, design, and marketing teams
• Conducted user research and competitive analysis

Associate Product Manager
TechStartup Inc. | 2020 - 2022
• Managed product roadmap and backlog for mobile applications
• Launched 3 major features that increased revenue by 30%
• Analyzed metrics and user feedback to inform product decisions
• Worked closely with stakeholders to align on product vision

EDUCATION

Master of Business Administration
Business School | 2018 - 2020
• Concentration in Product Management and Strategy

Bachelor of Science in Marketing
State University | 2014 - 2018

SKILLS

Product: Roadmap Planning, User Research, Data Analysis, A/B Testing
Technical: SQL, Analytics Tools, Figma, Jira, Confluence
Soft Skills: Leadership, Communication, Stakeholder Management

CERTIFICATIONS

• Certified Scrum Product Owner (CSPO)
• Google Analytics Certification`
      },
      '3': {
        fileName: 'Data_Analyst_Resume_v1.txt',
        jobDesc: 'Seeking a Data Analyst with strong analytical skills and experience with SQL and Python...',
        content: `ALEX JOHNSON
Email: alex.johnson@email.com | Phone: (555) 456-7890 | LinkedIn: linkedin.com/in/alexjohnson

PROFESSIONAL SUMMARY
Data Analyst with 3 years of experience in technology and innovation. Proven track record of delivering high-impact insights and driving results in fast-paced environments.

EXPERIENCE

Data Analyst
DataFlow Systems | 2022 - Present
• Analyzed large datasets to identify trends and provide actionable insights
• Created dashboards and reports for executive leadership
• Improved data pipeline efficiency by 45%
• Collaborated with product and engineering teams on data-driven decisions

Junior Data Analyst
Analytics Co. | 2021 - 2022
• Performed statistical analysis on customer behavior data
• Built predictive models to forecast business metrics
• Automated reporting processes saving 10 hours per week
• Presented findings to stakeholders across the organization

EDUCATION

Bachelor of Science in Statistics
University of Data | 2017 - 2021
• GPA: 3.9/4.0
• Honors: Summa Cum Laude

SKILLS

Technical: Python, R, SQL, Tableau, Power BI, Excel
Statistical: Regression Analysis, Hypothesis Testing, Machine Learning
Soft Skills: Problem Solving, Communication, Critical Thinking

CERTIFICATIONS

• Tableau Desktop Specialist
• Google Data Analytics Professional Certificate`
      }
    };

    const resumeData = mockResumes[resumeId] || mockResumes['1'];
    
    setResumeContent(resumeData.content);
    setUploadedFileName(resumeData.fileName);
    setJobDescription(resumeData.jobDesc);
    setModifiedResume(''); // Reset modified resume
    setIsEditMode(true); // Set edit mode to true
    setCurrentScreen('parsed');
  };

  const handleViewResume = (resumeId: string) => {
    // In production, load resume from Supabase
    // For now, use the same mock data as edit
    const mockResumes: Record<string, { content: string; fileName: string }> = {
      '1': {
        fileName: 'Software_Engineer_Resume_v3.txt',
        content: `JOHN DOE
Email: john.doe@email.com | Phone: (555) 123-4567 | LinkedIn: linkedin.com/in/johndoe

PROFESSIONAL SUMMARY
Senior Software Engineer with 5 years of experience in technology and innovation. Proven track record of delivering high-impact solutions and driving results in fast-paced environments.

EXPERIENCE

Senior Software Engineer
TechCorp Solutions | 2022 - Present
• Led cross-functional teams to deliver complex projects on time and under budget
• Improved system performance by 40% through strategic optimizations
• Mentored junior team members and conducted code reviews
• Collaborated with stakeholders to define product roadmap and priorities

Software Engineer
InnovateLabs Inc. | 2020 - 2022
• Developed and implemented innovative solutions that increased efficiency by 35%
• Managed multiple projects simultaneously with competing deadlines
• Presented technical concepts to non-technical stakeholders
• Contributed to company-wide best practices and documentation

EDUCATION

Bachelor of Science in Computer Science
University of Technology | 2016 - 2020
• GPA: 3.8/4.0
• Dean's List: All semesters
• Relevant Coursework: Data Structures, Algorithms, Software Engineering

SKILLS

Technical: JavaScript, Python, React, Node.js, SQL, AWS, Git
Soft Skills: Leadership, Communication, Problem Solving, Team Collaboration
Tools: Jira, Confluence, Figma, VS Code

CERTIFICATIONS

• AWS Certified Solutions Architect
• Certified Scrum Master (CSM)
• Google Cloud Professional`
      },
      '2': {
        fileName: 'Product_Manager_Resume_v2.txt',
        content: `JANE SMITH
Email: jane.smith@email.com | Phone: (555) 987-6543 | LinkedIn: linkedin.com/in/janesmith

PROFESSIONAL SUMMARY
Product Manager with 4 years of experience in technology and innovation. Proven track record of delivering high-impact products and driving results in fast-paced environments.

EXPERIENCE

Product Manager
InnovateLabs | 2022 - Present
• Led product strategy for flagship products serving 100K+ users
• Increased user engagement by 50% through data-driven feature prioritization
• Collaborated with engineering, design, and marketing teams
• Conducted user research and competitive analysis

Associate Product Manager
TechStartup Inc. | 2020 - 2022
• Managed product roadmap and backlog for mobile applications
• Launched 3 major features that increased revenue by 30%
• Analyzed metrics and user feedback to inform product decisions
• Worked closely with stakeholders to align on product vision

EDUCATION

Master of Business Administration
Business School | 2018 - 2020
• Concentration in Product Management and Strategy

Bachelor of Science in Marketing
State University | 2014 - 2018

SKILLS

Product: Roadmap Planning, User Research, Data Analysis, A/B Testing
Technical: SQL, Analytics Tools, Figma, Jira, Confluence
Soft Skills: Leadership, Communication, Stakeholder Management

CERTIFICATIONS

• Certified Scrum Product Owner (CSPO)
• Google Analytics Certification`
      },
      '3': {
        fileName: 'Data_Analyst_Resume_v1.txt',
        content: `ALEX JOHNSON
Email: alex.johnson@email.com | Phone: (555) 456-7890 | LinkedIn: linkedin.com/in/alexjohnson

PROFESSIONAL SUMMARY
Data Analyst with 3 years of experience in technology and innovation. Proven track record of delivering high-impact insights and driving results in fast-paced environments.

EXPERIENCE

Data Analyst
DataFlow Systems | 2022 - Present
• Analyzed large datasets to identify trends and provide actionable insights
• Created dashboards and reports for executive leadership
• Improved data pipeline efficiency by 45%
• Collaborated with product and engineering teams on data-driven decisions

Junior Data Analyst
Analytics Co. | 2021 - 2022
• Performed statistical analysis on customer behavior data
• Built predictive models to forecast business metrics
• Automated reporting processes saving 10 hours per week
• Presented findings to stakeholders across the organization

EDUCATION

Bachelor of Science in Statistics
University of Data | 2017 - 2021
• GPA: 3.9/4.0
• Honors: Summa Cum Laude

SKILLS

Technical: Python, R, SQL, Tableau, Power BI, Excel
Statistical: Regression Analysis, Hypothesis Testing, Machine Learning
Soft Skills: Problem Solving, Communication, Critical Thinking

CERTIFICATIONS

• Tableau Desktop Specialist
• Google Data Analytics Professional Certificate`
      }
    };

    const resumeData = mockResumes[resumeId] || mockResumes['1'];
    
    setModifiedResume(resumeData.content);
    setUploadedFileName(resumeData.fileName);
    setCurrentScreen('preview');
  };

  if (currentScreen === 'landing') {
    return (
      <>
        <LandingPage
          onGetStarted={handleGetStarted}
          onSignIn={handleSignIn}
          onSignUp={handleSignUp}
          onDashboard={handleGoToDashboard}
          onAdminFeedback={() => setCurrentScreen('admin-feedback')}
          isAuthenticated={isAuthenticated}
          email={currentUser?.email}
          onSignOut={handleSignOut}
          isUpdating={isFeedbackAnalysisRunning}
          isAdmin={isAdmin}
        />
        <AuthDialog
          open={authDialogOpen}
          onClose={() => setAuthDialogOpen(false)}
          mode={authMode}
          onSuccess={handleAuthSuccess}
          onSwitchMode={handleSwitchAuthMode}
          onSignupSuccess={handleSignupSuccess}
          onOpenSignIn={handleOpenSignIn}
        />
        
        {/* Start from Scratch Dialog - Choose between AI Resume Building or Tailor for Job */}
        <StartFromScratchDialog
          open={startFromScratchDialogOpen}
          onOpenChange={setStartFromScratchDialogOpen}
          onSelectAIResumeBuilding={handleStartFromScratchAIBuilding}
          onSelectTailorForJob={handleStartFromScratchTailorForJob}
          onCancel={handleClearCachedChanges}
        />
        
        {/* Upload and Parse Resume Dialog */}
        <Dialog open={parseResumeDialogOpen} onOpenChange={setParseResumeDialogOpen}>
          <DialogContent className="w-[50vw] max-w-[50vw] sm:w-[50vw] sm:max-w-[50vw] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2.5 rounded-xl">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <DialogTitle className="text-2xl">Upload and Parse Resume</DialogTitle>
              </div>
              <DialogDescription>
                Upload your resume file and our AI will automatically parse and structure your information
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <ResumeUploader 
                key="resume-uploader-dialog" 
                onResumeUpload={(content, fileName, parsedData) => {
                  handleResumeUpload(content, fileName, parsedData);
                }}
                onNext={() => {
                  // Close upload dialog and show "Choose how you'd like to build your resume" dialog
                  setParseResumeDialogOpen(false);
                  setStartFromScratchDialogOpen(true);
                }}
                onNavigateToOptimize={() => {
                  setCurrentScreen('optimize');
                  setOptimizationFlow('direct');
                  setJobDescription(''); // Clear job description when going direct to AI Resume Building
                  setParseResumeDialogOpen(false);
                }}
                onNavigateToJobDesc={() => {
                  setCurrentScreen('jobdesc');
                  setParseResumeDialogOpen(false);
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  if (currentScreen === 'parsed') {
    return (
      <>
        <AIRewritePanel
          originalResume={resumeContent}
          jobDescription={jobDescription}
          onBack={handleBackToUpload}
          onNext={(optimizedResume) => {
            setModifiedResume(optimizedResume);
            handleContinueToJobDesc();
          }}
          onPreview={() => setCurrentScreen('preview')}
          optimizationFlow={'direct'}
          cachedParsedData={cachedResumeData}
        />
        <AuthDialog
          open={authDialogOpen}
          onClose={() => setAuthDialogOpen(false)}
          mode={authMode}
          onSuccess={handleAuthSuccess}
          onSwitchMode={handleSwitchAuthMode}
          onSignupSuccess={handleSignupSuccess}
        />
      </>
    );
  }

  if (currentScreen === 'jobdesc') {
    return (
      <>
        <JobDescriptionScreen
          onBack={handleBackToUpload}
          onNext={handleJobDescNext}
          initialValue={jobDescription}
        />
        <AuthDialog
          open={authDialogOpen}
          onClose={() => setAuthDialogOpen(false)}
          mode={authMode}
          onSuccess={handleAuthSuccess}
          onSwitchMode={handleSwitchAuthMode}
          onSignupSuccess={handleSignupSuccess}
        />
      </>
    );
  }

  if (currentScreen === 'optimize') {
    console.log('🔍 [App.tsx] Rendering AIRewritePanel with:', {
      hasResumeContent: !!resumeContent,
      resumeContentLength: resumeContent?.length || 0,
      hasJobDescription: !!jobDescription,
      jobDescriptionLength: jobDescription?.length || 0,
      jobDescriptionPreview: jobDescription?.substring(0, 100) || 'EMPTY'
    });

    // Guard: Don't render AIRewritePanel if resumeContent is empty
    if (!resumeContent) {
      console.error('❌ [App.tsx] Cannot render AIRewritePanel - resumeContent is empty!');
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
          <div className="text-center">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-xl inline-block mb-4">
              <FileText className="w-12 h-12 text-white animate-pulse" />
            </div>
            <p className="text-lg text-gray-600">Loading resume data...</p>
            <p className="text-sm text-gray-500 mt-2">If this persists, please go back and try again</p>
            <Button 
              onClick={() => setCurrentScreen('landing')} 
              className="mt-4"
              variant="outline"
            >
              Go Back to Home
            </Button>
          </div>
        </div>
      );
    }

    return (
      <>
        <AIRewritePanel
          originalResume={resumeContent}
          jobDescription={jobDescription}
          onBack={handleBackFromOptimize}
          onNext={handleOptimizeNext}
          onPreview={() => setCurrentScreen('preview')}
          optimizationFlow={optimizationFlow}
          cachedParsedData={cachedResumeData}
        />
        <AuthDialog
          open={authDialogOpen}
          onClose={() => setAuthDialogOpen(false)}
          mode={authMode}
          onSuccess={handleAuthSuccess}
          onSwitchMode={handleSwitchAuthMode}
          onSignupSuccess={handleSignupSuccess}
        />
      </>
    );
  }

  if (currentScreen === 'matchscore') {
    return (
      <>
        <JobMatchScore
          optimizedResume={modifiedResume || resumeContent}
          jobDescription={jobDescription}
          onBack={handleBackToOptimize}
          onImprove={handleBackToOptimize}
          onNext={handleMatchScoreNext}
        />
        <AuthDialog
          open={authDialogOpen}
          onClose={() => setAuthDialogOpen(false)}
          mode={authMode}
          onSuccess={handleAuthSuccess}
          onSwitchMode={handleSwitchAuthMode}
          onSignupSuccess={handleSignupSuccess}
        />
      </>
    );
  }

  if (currentScreen === 'preview') {
    return (
      <>
        <ResumePreview
          resumeContent={modifiedResume || resumeContent}
          fileName={uploadedFileName}
          onBack={handleBackToMatchScore}
          onSave={handleSaveResume}
          onDashboard={handleGoToDashboard}
        />
        <AuthDialog
          open={authDialogOpen}
          onClose={() => setAuthDialogOpen(false)}
          mode={authMode}
          onSuccess={handleAuthSuccess}
          onSwitchMode={handleSwitchAuthMode}
          onSignupSuccess={handleSignupSuccess}
        />
      </>
    );
  }

  if (currentScreen === 'dashboard') {
    return (
      <>
        <Dashboard
          onNewResume={handleNewResume}
          onEditResume={handleEditResume}
          onViewResume={handleViewResume}
          onSignOut={handleSignOut}
          onBackToHome={handleBackToHome}
          isAuthenticated={isAuthenticated}
          onBack={handleBackFromDashboard}
        />
        <AuthDialog
          open={authDialogOpen}
          onClose={() => setAuthDialogOpen(false)}
          mode={authMode}
          onSuccess={handleAuthSuccess}
          onSwitchMode={handleSwitchAuthMode}
          onSignupSuccess={handleSignupSuccess}
          onOpenSignIn={handleOpenSignIn}
        />
      </>
    );
  }

  // Admin Feedback Learning Dashboard
  if (currentScreen === 'admin-feedback') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between p-4 border-b bg-white/80 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => setCurrentScreen('landing')}
                className="flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                Back to Home
              </Button>
              <h1 className="text-xl font-bold text-gray-800">Admin: Feedback Analysis</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{currentUser?.email}</span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
          <FeedbackLearningDashboard />
        </div>
      </div>
    );
  }

  const getCurrentStep = () => {
    if (currentScreen === 'upload') return 1;
    if (currentScreen === 'parsed') return 2;
    if (currentScreen === 'jobdesc') return 3;
    if (currentScreen === 'optimize') return 4;
    if (currentScreen === 'matchscore') return 5;
    if (currentScreen === 'preview') return 6;
    return 1;
  };

  // Show loading state while checking session
  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-xl inline-block mb-4">
            <FileText className="w-12 h-12 text-white animate-pulse" />
          </div>
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Upload screen (default)
  return (
    <>
      {showEmailVerification && (
        <EmailVerificationInfo 
          email={verificationEmail}
          onClose={() => setShowEmailVerification(false)}
          onSignInNow={handleSignInNow}
        />
      )}
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-between mb-4">
              <Button onClick={handleBackToHome} variant="ghost" size="sm">
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
              
              <div className="flex items-center gap-3 flex-1 justify-center">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-xl">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-4xl">Upload and Parse Resume</h1>
              </div>

              <div className="flex items-center gap-2">
                {isAuthenticated && currentUser && (
                  <>
                    <span className="text-sm text-gray-600 mr-2">
                      {currentUser.email}
                    </span>
                    <Button onClick={handleSignOut} variant="ghost" size="sm">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </>
                )}
                {!isAuthenticated && (
                  <Button onClick={handleOpenSignIn} variant="ghost" size="sm">
                    Sign In
                  </Button>
                )}
              </div>
            </div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Upload your resume to get started
            </p>
            <div className="mt-4 flex justify-center items-center gap-4">
              <SystemStatus />
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    Test AI
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>AI Connection Diagnostics</DialogTitle>
                    <DialogDescription>
                      Test your OpenAI API connection and troubleshoot issues
                    </DialogDescription>
                  </DialogHeader>
                  <AITestPanel />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="mt-8">
            <ResumeUploader 
              key="resume-uploader" 
              onResumeUpload={handleResumeUpload}
              onNavigateToOptimize={() => {
                setCurrentScreen('optimize');
                setOptimizationFlow('direct');
                setJobDescription(''); // Clear job description when going direct to AI Resume Building
              }}
              onNavigateToJobDesc={() => setCurrentScreen('jobdesc')}
            />
          </div>
        </div>
      </div>
      <AuthDialog
        open={authDialogOpen}
        onClose={() => setAuthDialogOpen(false)}
        mode={authMode}
        onSuccess={handleAuthSuccess}
        onSwitchMode={handleSwitchAuthMode}
        onSignupSuccess={handleSignupSuccess}
        onOpenSignIn={handleOpenSignIn}
      />
    </>
  );
}