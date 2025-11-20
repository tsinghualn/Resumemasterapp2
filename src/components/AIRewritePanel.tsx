import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { 
  ArrowLeft, 
  ArrowRight, 
  Sparkles, 
  RefreshCw, 
  Check, 
  Edit3,
  FileText,
  Lightbulb,
  Target,
  TrendingUp,
  Info
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { apiClient } from '../utils/api';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { CopyProtection } from './CopyProtection';
import { PersonalDetailsDisplay } from './PersonalDetailsDisplay';

interface ResumeSection {
  id: string;
  title: string;
  original: string;
  optimized: string;
  suggestions: string[];
  status: 'pending' | 'accepted' | 'editing';
  // Structured data for Personal Information section
  personalData?: {
    firstName?: string;
    lastName?: string;
    jobTitle?: string;
    nationality?: string;
    driversLicense?: string;
    birthDate?: string;
    photoUrl?: string;
    contact?: string; // Contact info (email, phone, etc.)
  };
}

interface AIRewritePanelProps {
  originalResume: string;
  jobDescription: string;
  onBack: () => void;
  onNext: (optimizedResume: string) => void;
  cachedParsedData?: any; // Pre-parsed data from ResumeUploader
}

export function AIRewritePanel({ 
  originalResume, 
  jobDescription, 
  onBack, 
  onNext,
  cachedParsedData
}: AIRewritePanelProps) {
  // Debug: Log the props received
  console.log('🔍 [AIRewritePanel] Props received:', {
    hasOriginalResume: !!originalResume,
    originalResumeLength: originalResume?.length || 0,
    hasJobDescription: !!jobDescription,
    jobDescriptionLength: jobDescription?.length || 0,
    jobDescriptionPreview: jobDescription?.substring(0, 100) || 'EMPTY',
    hasCachedData: !!cachedParsedData
  });

  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [industryTone, setIndustryTone] = useState<string>('');
  const [rewriteStyle, setRewriteStyle] = useState<string>('');
  const [showAllSectionsAcceptedAlert, setShowAllSectionsAcceptedAlert] = useState(false);
  const [sections, setSections] = useState<ResumeSection[]>([]);

  // Check if job description is missing and show warning
  useEffect(() => {
    if (!jobDescription || jobDescription.trim() === '') {
      toast.error('Job description is missing!', {
        description: 'Please go back and provide a job description to continue.',
        duration: 8000
      });
      console.error('❌ [AIRewritePanel] Component loaded without job description');
    }
  }, [jobDescription]);

  // Parse resume into sections
  useEffect(() => {
    if (cachedParsedData) {
      // Use cached data if available
      const aiParsedSections = convertAIParsedDataToSections(cachedParsedData);
      console.log(`📄 [AIRewritePanel] Created ${aiParsedSections.length} sections from cached data:`, 
        aiParsedSections.map(s => s.title));
      
      setSections(aiParsedSections);
      if (aiParsedSections.length > 0) {
        setSelectedSectionId(aiParsedSections[0].id);
      }
    } else {
      // Otherwise, parse with AI
      parseResumeWithAI(originalResume);
    }
  }, [originalResume, cachedParsedData]);

  // AI-powered resume parsing
  const parseResumeWithAI = async (resumeText: string) => {
    console.log('🤖 [AIRewritePanel] Parsing resume with AI...');
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-bc1c5df9/parse-resume`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            resumeText: resumeText
          })
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        console.log('✅ [AIRewritePanel] AI parsing successful!');
        console.log('📋 [AIRewritePanel] PARSED DATA:', JSON.stringify(result.data, null, 2));
        
        // Convert AI-parsed structured data into sections
        const aiParsedSections = convertAIParsedDataToSections(result.data);
        console.log(`📄 [AIRewritePanel] Created ${aiParsedSections.length} sections from AI parsing:`, 
          aiParsedSections.map(s => s.title));
        
        setSections(aiParsedSections);
        if (aiParsedSections.length > 0) {
          setSelectedSectionId(aiParsedSections[0].id);
        }
      } else {
        console.warn('⚠️ [AIRewritePanel] AI parsing failed, using fallback text parsing:', result.error);
        // Fallback to text-based parsing
        const parsedSections = parseResumeIntoSections(resumeText);
        console.log(`📄 [AIRewritePanel] Fallback: Parsed ${parsedSections.length} sections:`, 
          parsedSections.map(s => s.title));
        setSections(parsedSections);
        if (parsedSections.length > 0) {
          setSelectedSectionId(parsedSections[0].id);
        }
      }
    } catch (error) {
      console.error('❌ [AIRewritePanel] AI parsing error:', error);
      // Fallback to text-based parsing
      const parsedSections = parseResumeIntoSections(resumeText);
      console.log(`📄 [AIRewritePanel] Fallback: Parsed ${parsedSections.length} sections:`, 
        parsedSections.map(s => s.title));
      setSections(parsedSections);
      if (parsedSections.length > 0) {
        setSelectedSectionId(parsedSections[0].id);
      }
    }
  };

  // Convert AI-parsed data structure to section format for UI
  const convertAIParsedDataToSections = (aiData: any): ResumeSection[] => {
    const sections: ResumeSection[] = [];
    let sectionIndex = 0;

    // Helper to add section if content exists
    const addSection = (title: string, content: string, customTitle?: string) => {
      if (content && content.trim()) {
        sections.push({
          id: `section-${sectionIndex++}`,
          title: customTitle || title,
          original: content.trim(),
          optimized: '',
          suggestions: [],
          status: 'pending'
        });
      }
    };

    // Personal Information (Name + Contact)
    const personalInfo = [];
    if (aiData.name) personalInfo.push(aiData.name);
    if (aiData.contact) personalInfo.push(aiData.contact);
    if (personalInfo.length > 0) {
      sections.push({
        id: `section-${sectionIndex++}`,
        title: 'Personal Information',
        original: personalInfo.join('\n'),
        optimized: '',
        suggestions: [],
        status: 'pending',
        // Store structured personal data
        personalData: {
          firstName: aiData.firstName || '',
          lastName: aiData.lastName || '',
          jobTitle: aiData.jobTitle || '',
          nationality: aiData.nationality || '',
          driversLicense: aiData.driversLicense || '',
          birthDate: aiData.birthDate || '',
          photoUrl: aiData.photoUrl || '',
          contact: aiData.contact || ''
        }
      });
    }

    // Summary/Profile
    addSection(aiData.summaryTitle || 'Professional Summary', aiData.summary);

    // Experience
    addSection(aiData.experienceTitle || 'Experience', aiData.experience);

    // Education
    addSection(aiData.educationTitle || 'Education', aiData.education);

    // Courses (if separate from education)
    if (aiData.courses && aiData.courses.trim() && aiData.courses !== aiData.education) {
      addSection(aiData.coursesTitle || 'Coursework', aiData.courses);
    }

    // Skills
    addSection(aiData.skillsTitle || 'Skills', aiData.skills);

    // Projects
    addSection(aiData.projectsTitle || 'Projects', aiData.projects);

    // Certifications
    addSection(aiData.certificationsTitle || 'Certifications', aiData.certifications);

    // Publications
    addSection(aiData.publicationsTitle || 'Publications', aiData.publications);

    // Patents
    addSection(aiData.patentsTitle || 'Patents', aiData.patents);

    // Presentations
    addSection(aiData.presentationsTitle || 'Presentations', aiData.presentations);

    // Awards
    addSection(aiData.awardsTitle || 'Awards', aiData.awards);

    // Activities
    addSection(aiData.activitiesTitle || 'Activities', aiData.activities);

    // Languages
    addSection(aiData.languagesTitle || 'Languages', aiData.languages);

    // Interests
    addSection(aiData.interestsTitle || 'Interests', aiData.interests);

    // References
    addSection(aiData.referencesTitle || 'References', aiData.references);

    // Custom sections
    if (aiData.customSections && Array.isArray(aiData.customSections)) {
      aiData.customSections.forEach((customSection: any) => {
        if (customSection.content && customSection.content.trim()) {
          addSection(customSection.title, customSection.content);
        }
      });
    }

    return sections;
  };

  // Validation function to check if settings are selected
  const validateSettings = (): boolean => {
    if (!industryTone || industryTone === 'none' || industryTone === '') {
      toast.warning('Please select an Industry Tone', {
        description: 'Select a tone before regenerating sections',
        duration: 4000
      });
      return false;
    }
    if (!rewriteStyle || rewriteStyle === 'none' || rewriteStyle === '') {
      toast.warning('Please select a Rewrite Style', {
        description: 'Select a style before regenerating sections',
        duration: 4000
      });
      return false;
    }
    return true;
  };

  // Generate optimized versions when tone or style changes
  useEffect(() => {
    if (sections.length > 0 && industryTone && rewriteStyle && industryTone !== 'none' && rewriteStyle !== 'none') {
      console.log(`🎨 Settings changed - Tone: ${industryTone}, Style: ${rewriteStyle}`);
      generateOptimizedSections();
    }
  }, [industryTone, rewriteStyle]);

  const parseResumeIntoSections = (resume: string): ResumeSection[] => {
    const lines = resume.split('\n');
    const parsedSections: ResumeSection[] = [];
    let currentSection = { id: '', title: '', content: '' };
    let headerContent = ''; // Capture name and contact before first section
    
    // Expanded list of known section headers to capture all resume sections
    const knownSectionHeaders = [
      'PROFESSIONAL SUMMARY', 
      'SUMMARY', 
      'PROFILE',
      'OBJECTIVE',
      'PROFESSIONAL EXPERIENCE',
      'WORK EXPERIENCE', 
      'EXPERIENCE', 
      'EMPLOYMENT HISTORY',
      'CAREER HISTORY',
      'EDUCATION',
      'EDUCATION & COURSES',
      'ACADEMIC BACKGROUND',
      'COURSEWORK',
      'COURSES',
      'RELEVANT COURSEWORK',
      'SKILLS', 
      'TECHNICAL SKILLS',
      'CORE COMPETENCIES',
      'CORE SKILLS',
      'KEY SKILLS',
      'PROJECTS', 
      'KEY PROJECTS',
      'NOTABLE PROJECTS',
      'PERSONAL PROJECTS',
      'ACADEMIC PROJECTS',
      'CERTIFICATIONS',
      'CERTIFICATES',
      'PROFESSIONAL CERTIFICATIONS',
      'LICENSES AND CERTIFICATIONS',
      'LICENSES',
      'AWARDS',
      'HONORS',
      'HONORS AND AWARDS',
      'HONORS & AWARDS',
      'AWARDS & HONORS',
      'ACHIEVEMENTS',
      'RECOGNITION',
      'ACTIVITIES',
      'VOLUNTEER EXPERIENCE',
      'VOLUNTEER WORK',
      'VOLUNTEERING',
      'ACTIVITIES & VOLUNTEERING',
      'EXTRACURRICULAR ACTIVITIES',
      'COMMUNITY INVOLVEMENT',
      'HOBBIES',
      'INTERESTS',
      'HOBBIES AND INTERESTS',
      'HOBBIES & INTERESTS',
      'PERSONAL INTERESTS',
      'LANGUAGES',
      'FOREIGN LANGUAGES',
      'PUBLICATIONS',
      'RESEARCH',
      'RESEARCH EXPERIENCE',
      'PATENTS',
      'PRESENTATIONS',
      'CONFERENCES',
      'SPEAKING ENGAGEMENTS',
      'PROFESSIONAL AFFILIATIONS',
      'MEMBERSHIPS',
      'PROFESSIONAL MEMBERSHIPS',
      'REFERENCES',
      'TEACHING',
      'TEACHING EXPERIENCE'
    ];
    
    // Helper function to check if a line is a section header
    const isSectionHeader = (line: string): boolean => {
      const upperLine = line.trim().toUpperCase();
      
      // Empty lines are not headers
      if (!upperLine) return false;
      
      // Check against known headers
      const isKnownHeader = knownSectionHeaders.some(header => {
        // Match exact header or header at start of line (with some tolerance)
        return upperLine === header || 
               (upperLine.startsWith(header) && upperLine.length < header.length + 10);
      });
      
      if (isKnownHeader) return true;
      
      // For custom sections: detect ALL CAPS lines that are short (likely headers)
      // and contain only letters, spaces, and common punctuation
      const isAllCaps = upperLine === line.trim();
      const isShort = upperLine.length >= 3 && upperLine.length <= 50;
      const hasOnlyHeaderChars = /^[A-Z\s&\-']+$/.test(upperLine);
      const notJustSpaces = upperLine.replace(/[\s&\-']/g, '').length >= 3;
      
      return isAllCaps && isShort && hasOnlyHeaderChars && notJustSpaces;
    };
    
    let foundFirstSection = false; // Track if we've found the first actual section
    
    lines.forEach((line, idx) => {
      const upperLine = line.trim().toUpperCase();
      const isKnownHeader = knownSectionHeaders.some(header => 
        upperLine === header || (upperLine.startsWith(header) && upperLine.length < header.length + 10)
      );
      
      // Only treat as header if we've found a known section, or if this IS a known section
      const isHeader = isKnownHeader || (foundFirstSection && isSectionHeader(line));
      
      if (isHeader && line.trim()) {
        foundFirstSection = true; // Mark that we've found the first section
        
        // If we have header content collected, create Personal Information section first
        if (headerContent.trim() && parsedSections.length === 0) {
          parsedSections.push({
            id: 'section-personal-info',
            title: 'Personal Information',
            original: headerContent.trim(),
            optimized: '',
            suggestions: [],
            status: 'pending'
          });
          headerContent = '';
        }
        
        // Save previous section if it has content
        if (currentSection.content.trim()) {
          parsedSections.push({
            id: currentSection.id,
            title: currentSection.title,
            original: currentSection.content.trim(),
            optimized: '',
            suggestions: [],
            status: 'pending'
          });
        }
        // Start new section
        currentSection = {
          id: `section-${parsedSections.length}`,
          title: line.trim(),
          content: ''
        };
      } else if (currentSection.title) {
        // Add line to current section
        currentSection.content += line + '\n';
      } else if (line.trim()) {
        // Before any section headers, collect as header content (name, contact, etc.)
        headerContent += line + '\n';
      }
    });
    
    // Handle any remaining header content
    if (headerContent.trim() && parsedSections.length === 0) {
      parsedSections.push({
        id: 'section-personal-info',
        title: 'Personal Information',
        original: headerContent.trim(),
        optimized: '',
        suggestions: [],
        status: 'pending'
      });
    }
    
    // Add the last section
    if (currentSection.content.trim()) {
      parsedSections.push({
        id: currentSection.id,
        title: currentSection.title,
        original: currentSection.content.trim(),
        optimized: '',
        suggestions: [],
        status: 'pending'
      });
    }

    // Now including Personal Information section and all custom sections
    console.log(`📋 Detected ${parsedSections.length} sections:`, parsedSections.map(s => s.title));
    return parsedSections;
  };

  const generateOptimizedSections = async () => {
    // Validate settings before regenerating all
    if (!validateSettings()) {
      return;
    }

    // Validate jobDescription exists
    if (!jobDescription || jobDescription.trim() === '') {
      toast.error('Job description is missing', {
        description: 'Please go back and provide a job description',
        duration: 5000
      });
      console.error('❌ Job description is empty or missing');
      return;
    }

    console.log('🚀 Starting optimization with:', {
      sectionsCount: sections.length,
      jobDescriptionLength: jobDescription.length,
      industryTone,
      rewriteStyle
    });

    setIsGenerating(true);
    setShowAllSectionsAcceptedAlert(false); // Hide alert when regenerating
    
    try {
      // Optimize each section with real AI
      let hasAnyAISuccess = false;
      let firstError: string | null = null;
      
      const optimizedSectionsPromises = sections.map(async (section) => {
        try {
          // Validate section has content
          if (!section.original || section.original.trim() === '') {
            console.warn(`⚠️ Skipping empty section: ${section.title}`);
            return section;
          }

          console.log(`📝 Optimizing section: ${section.title}, length: ${section.original.length}`);

          const { optimizedText, suggestions } = await apiClient.optimizeSection(
            section.original,
            jobDescription,
            section.title,
            industryTone,
            rewriteStyle
          );
          
          hasAnyAISuccess = true;
          return {
            ...section,
            optimized: optimizedText,
            suggestions: suggestions || generateSuggestions(section.title)
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`❌ Error optimizing section ${section.title}:`, errorMessage);
          
          // Capture first error for user feedback
          if (!firstError) {
            firstError = errorMessage;
          }
          
          // Fallback to mock optimization if API fails
          return {
            ...section,
            optimized: optimizeText(section.original, section.title),
            suggestions: generateSuggestions(section.title)
          };
        }
      });

      const optimizedSections = await Promise.all(optimizedSectionsPromises);
      setSections(optimizedSections);
      
      if (hasAnyAISuccess) {
        const toneLabel = industryTone.charAt(0).toUpperCase() + industryTone.slice(1);
        const styleLabel = rewriteStyle.charAt(0).toUpperCase() + rewriteStyle.slice(1);
        toast.success('Resume optimized with AI!', {
          description: `Tone: ${toneLabel} • Style: ${styleLabel}`
        });
        console.log('✅ AI optimization successful');
      } else {
        // Show specific error message
        if (firstError?.includes('API key') || firstError?.includes('not configured')) {
          toast.error('OpenAI API key not configured. Please add your OPENAI_API_KEY in Supabase secrets.', {
            duration: 6000
          });
          console.error('⚠️ API Key Issue:', firstError);
        } else if (firstError?.includes('quota exceeded') || firstError?.includes('exceeded your current quota')) {
          toast.error('OpenAI API Credits Depleted', {
            description: '💳 Add credits at platform.openai.com/settings/organization/billing or upload a new API key with credits.',
            duration: 10000
          });
          console.error('⚠️ OpenAI Quota Exceeded:', firstError);
        } else {
          toast.warning('AI optimization unavailable. Using fallback optimization.', {
            description: firstError || 'Check console for details',
            duration: 5000
          });
          console.error('⚠️ Fallback mode activated:', firstError);
        }
      }
    } catch (error) {
      console.error('Error generating optimized sections:', error);
      toast.error('Optimization failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const optimizeText = (text: string, sectionTitle: string): string => {
    // Mock AI optimization based on tone and style
    const jobKeywords = extractKeywords(jobDescription);
    const toneModifiers = {
      professional: 'utilizing industry-standard practices',
      creative: 'innovatively leveraging',
      technical: 'implementing advanced',
      executive: 'strategically directing'
    };
    
    const styleModifiers = {
      concise: 'Streamlined and focused: ',
      detailed: 'Comprehensive and thorough: ',
      balanced: 'Well-rounded: ',
      achievement: 'Results-driven: '
    };

    // Add some AI-like enhancements (without commentary)
    let optimized = text;
    
    if (sectionTitle.toUpperCase().includes('SUMMARY') || sectionTitle.toUpperCase().includes('PROFILE') || sectionTitle.toUpperCase().includes('OBJECTIVE')) {
      // Add style modifier at the beginning
      optimized = `${styleModifiers[rewriteStyle as keyof typeof styleModifiers]}${text}`;
    } else if (sectionTitle.toUpperCase().includes('EXPERIENCE')) {
      // Just use simple bullets
      optimized = text.replace(/•/g, '•').trim();
    } else if (sectionTitle.toUpperCase().includes('SKILLS')) {
      // Keep skills simple without commentary
      optimized = text.trim();
    } else {
      // For other sections, just clean up the text
      optimized = text.trim();
    }
    
    return optimized;
  };

  const generateSuggestions = (sectionTitle: string): string[] => {
    const suggestionMap: Record<string, string[]> = {
      'HEADER': [
        'AI made minimal formatting changes to preserve accuracy',
        'Verify contact information is current and professional',
        'Consider adding LinkedIn profile URL if missing'
      ],
      'CONTACT': [
        'AI made minimal formatting changes to preserve accuracy',
        'Verify contact information is current and professional',
        'Ensure phone number and email are easily readable'
      ],
      'PROFESSIONAL SUMMARY': [
        'Add quantifiable achievements to demonstrate impact',
        'Include 2-3 key skills from the job description',
        'Emphasize leadership and collaboration abilities'
      ],
      'SUMMARY': [
        'Add quantifiable achievements to demonstrate impact',
        'Include 2-3 key skills from the job description',
        'Emphasize leadership and collaboration abilities'
      ],
      'EXPERIENCE': [
        'Use action verbs to start each bullet point',
        'Quantify achievements with metrics (%, $, #)',
        'Highlight technologies and tools mentioned in job posting'
      ],
      'SKILLS': [
        'AI made minimal changes - only formatting improvements',
        'Consider adding skills from job description if you have them',
        'Remove any outdated skills or technologies'
      ],
      'TECHNICAL SKILLS': [
        'AI made minimal changes - only formatting improvements',
        'Consider adding skills from job description if you have them',
        'Remove any outdated skills or technologies'
      ],
      'EDUCATION': [
        'AI preserved all factual information (dates, degrees, GPA)',
        'Add relevant coursework if space allows',
        'Include academic honors if earned (Dean\'s List, etc.)'
      ],
      'ACADEMIC BACKGROUND': [
        'AI preserved all factual information (dates, degrees, GPA)',
        'Add relevant coursework if space allows',
        'Include academic honors if earned (Dean\'s List, etc.)'
      ],
      'CERTIFICATIONS': [
        'AI made minimal changes to preserve certification accuracy',
        'List most relevant certifications first',
        'Include expiration dates if applicable'
      ],
      'CERTIFICATES': [
        'AI made minimal changes to preserve certification accuracy',
        'List most relevant certifications first',
        'Include expiration dates if applicable'
      ],
      'LANGUAGES': [
        'AI preserved language proficiency levels accurately',
        'Consider adding proficiency levels (Fluent, Conversational, etc.)',
        'List languages relevant to the job first'
      ],
      'AWARDS': [
        'Quantify the achievement (e.g., top 5% of team)',
        'Include the awarding organization',
        'Explain the significance if not obvious'
      ],
      'ACTIVITIES': [
        'Highlight leadership roles',
        'Connect activities to job-relevant skills',
        'Show long-term commitment and impact'
      ],
      'HOBBIES': [
        'Choose interests that show relevant skills',
        'Avoid controversial topics',
        'Keep brief - 2-3 items maximum'
      ],
      'INTERESTS': [
        'Choose interests that show relevant skills',
        'Avoid controversial topics',
        'Keep brief - 2-3 items maximum'
      ]
    };

    // Try to find a matching key
    const key = Object.keys(suggestionMap).find(k => 
      sectionTitle.toUpperCase().includes(k)
    );
    
    return key ? suggestionMap[key] : [
      'Ensure content is relevant to the target role',
      'Use clear, concise language',
      'Highlight unique qualifications'
    ];
  };

  // Helper function to identify conservative sections
  const isConservativeSection = (sectionTitle: string): boolean => {
    const conservativeSections = [
      'HEADER', 'CONTACT', 'EDUCATION', 'ACADEMIC BACKGROUND',
      'SKILLS', 'TECHNICAL SKILLS', 'CORE COMPETENCIES', 'CORE SKILLS', 'KEY SKILLS',
      'CERTIFICATIONS', 'CERTIFICATES', 'PROFESSIONAL CERTIFICATIONS',
      'LICENSES AND CERTIFICATIONS', 'LANGUAGES'
    ];
    
    return conservativeSections.some(section => 
      sectionTitle.toUpperCase().includes(section) || section.includes(sectionTitle.toUpperCase())
    );
  };

  const extractKeywords = (text: string): string[] => {
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can', 'our', 'your', 'their']);
    const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
    const filtered = words.filter(word => word.length > 3 && !commonWords.has(word));
    const frequency: Record<string, number> = {};
    filtered.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });
    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([word]) => word);
  };

  const handleAcceptSection = (sectionId: string) => {
    setSections(prevSections =>
      prevSections.map(section =>
        section.id === sectionId
          ? { ...section, status: 'accepted' as const }
          : section
      )
    );
    toast.success('Changes accepted!');
    
    // Automatically move to the next section
    const currentIndex = sections.findIndex(s => s.id === sectionId);
    if (currentIndex < sections.length - 1) {
      // Move to next section
      const nextSection = sections[currentIndex + 1];
      setSelectedSectionId(nextSection.id);
      toast.info(`Moving to next section: ${nextSection.title === 'Personal Information' ? nextSection.title : nextSection.title}`, {
        duration: 2000
      });
    } else {
      // This was the last section - remind user to click Next
      toast.success('🎉 All sections reviewed!', {
        description: '👆 Click "Next: Match Score" above to continue',
        duration: 5000
      });
      setShowAllSectionsAcceptedAlert(true);
    }
  };

  const handleRegenerateSection = async (sectionId: string) => {
    // Validate settings before regenerating
    if (!validateSettings()) {
      return;
    }

    // Validate jobDescription exists
    if (!jobDescription || jobDescription.trim() === '') {
      toast.error('Job description is missing', {
        description: 'Please go back and provide a job description',
        duration: 5000
      });
      console.error('❌ Job description is empty or missing');
      return;
    }

    setIsGenerating(true);
    
    try {
      const section = sections.find(s => s.id === sectionId);
      if (!section) return;

      // Validate section has content
      if (!section.original || section.original.trim() === '') {
        toast.warning('Cannot regenerate empty section', {
          description: 'This section has no content to optimize',
          duration: 3000
        });
        setIsGenerating(false);
        return;
      }

      console.log(`📝 Regenerating section: ${section.title}, length: ${section.original.length}`);

      const { optimizedText, suggestions } = await apiClient.optimizeSection(
        section.original,
        jobDescription,
        section.title,
        industryTone,
        rewriteStyle
      );

      setSections(prevSections =>
        prevSections.map(s =>
          s.id === sectionId
            ? { 
                ...s, 
                optimized: optimizedText,
                suggestions: suggestions || s.suggestions,
                status: 'pending' as const
              }
            : s
        )
      );
      const toneLabel = industryTone.charAt(0).toUpperCase() + industryTone.slice(1);
      const styleLabel = rewriteStyle.charAt(0).toUpperCase() + rewriteStyle.slice(1);
      const displayTitle = section.title.toUpperCase() === 'HEADER' ? 'Contact Information' : section.title;
      toast.success(`Section "${displayTitle}" regenerated!`, {
        description: `Using ${toneLabel} tone & ${styleLabel} style`
      });
      console.log(`✅ Section "${displayTitle}" regenerated successfully with ${industryTone} tone and ${rewriteStyle} style`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Error regenerating section:`, errorMessage);
      
      const section = sections.find(s => s.id === sectionId);
      
      // Fallback to mock optimization
      setSections(prevSections =>
        prevSections.map(sec =>
          sec.id === sectionId
            ? { 
                ...sec, 
                optimized: optimizeText(sec.original, sec.title) + ' [Regenerated - Fallback]',
                status: 'pending' as const
              }
            : sec
        )
      );
      
      // Show specific error message
      if (errorMessage.includes('API key') || errorMessage.includes('not configured')) {
        toast.error('OpenAI API key not configured. Using fallback optimization.', {
          description: 'Add your OPENAI_API_KEY in Supabase secrets',
          duration: 5000
        });
      } else {
        toast.warning('AI regeneration failed, using fallback optimization', {
          description: errorMessage,
          duration: 5000
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditSection = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (section?.status === 'editing') {
      // Exit editing mode
      setSections(prevSections =>
        prevSections.map(s =>
          s.id === sectionId
            ? { ...s, status: 'pending' as const }
            : s
        )
      );
      toast.success('Changes saved!');
    } else {
      // Enter editing mode
      setSections(prevSections =>
        prevSections.map(s =>
          s.id === sectionId
            ? { ...s, status: 'editing' as const }
            : s
        )
      );
      toast.info('Editing mode enabled - modify the text below');
      setEditingContent(section?.optimized || '');
    }
  };

  const handleUpdateOptimizedText = (sectionId: string, newText: string) => {
    setSections(prevSections =>
      prevSections.map(section =>
        section.id === sectionId
          ? { ...section, optimized: newText }
          : section
      )
    );
  };

  const handleUpdateOriginalText = (sectionId: string, newText: string) => {
    setSections(prevSections =>
      prevSections.map(section =>
        section.id === sectionId
          ? { ...section, original: newText }
          : section
      )
    );
  };

  const handleNext = () => {
    // Build final resume from sections
    const finalResume = sections
      .map(section => {
        // Use optimized content if it exists and is not empty, otherwise use original
        const content = section.optimized && section.optimized.trim() !== '' 
          ? section.optimized 
          : section.original;
        
        // For Personal Information section, output content directly (name + contact) without the title
        if (section.title.toUpperCase() === 'PERSONAL INFORMATION' || 
            section.title.toUpperCase() === 'HEADER') {
          return content;
        }
        // For other sections, include the title
        return `${section.title}\n${content}`;
      })
      .join('\n\n');
    
    console.log('📋 Final resume built with sections:', sections.map(s => ({
      title: s.title,
      status: s.status,
      hasOptimized: !!s.optimized && s.optimized.trim() !== '',
      usingOptimized: s.optimized && s.optimized.trim() !== ''
    })));
    
    console.log('📄 Final resume content being passed to next screen:');
    console.log('---START RESUME---');
    console.log(finalResume);
    console.log('---END RESUME---');
    console.log(`Total characters: ${finalResume.length}`);
    
    onNext(finalResume);
  };

  const acceptedCount = sections.filter(s => s.status === 'accepted').length;
  const totalCount = sections.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button onClick={onBack} variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2.5 rounded-xl">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl">AI Resume Optimization</h1>
              <p className="text-sm text-gray-600">
                Review and accept AI-generated improvements
              </p>
            </div>
          </div>

          <Button 
            onClick={handleNext}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            Next: Match Score
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Controls */}
        <Card className="p-6 mb-6">
          <div className="mb-4 pb-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <h3 className="text-sm mb-1">AI Optimization Settings</h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-gray-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <p className="text-xs">
                      These settings control how AI optimizes your resume. 
                      Changes will automatically regenerate all sections.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-xs text-gray-600">
              Customize the AI writing style to match your target industry and preference
            </p>
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                💡 <strong>Smart Optimization:</strong> AI applies full optimization to Experience and Summary sections, 
                but makes minimal changes to Contact, Education, Skills, and Certifications to preserve accuracy.
              </p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm mb-2 block">
                Industry Tone <span className="text-red-500">*</span>
              </label>
              <Select value={industryTone} onValueChange={setIndustryTone}>
                <SelectTrigger className={!industryTone ? 'border-red-300' : ''}>
                  <SelectValue placeholder="Select an industry tone..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">
                    <div className="flex flex-col items-start">
                      <span>Professional & Formal</span>
                      <span className="text-xs text-gray-500">Business standard</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="creative">
                    <div className="flex flex-col items-start">
                      <span>Creative & Dynamic</span>
                      <span className="text-xs text-gray-500">Innovative & unique</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="technical">
                    <div className="flex flex-col items-start">
                      <span>Technical & Precise</span>
                      <span className="text-xs text-gray-500">Detailed & specific</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="executive">
                    <div className="flex flex-col items-start">
                      <span>Executive & Strategic</span>
                      <span className="text-xs text-gray-500">Leadership focused</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                {!industryTone && '⚠️ Please select an industry tone to begin optimization'}
                {industryTone === 'professional' && '📋 Standard business language with industry terminology'}
                {industryTone === 'creative' && '🎨 Innovative language showcasing unique value'}
                {industryTone === 'technical' && '⚙️ Precise technical terms and methodologies'}
                {industryTone === 'executive' && '👔 Strategic leadership and high-level impact'}
              </p>
            </div>

            <div>
              <label className="text-sm mb-2 block">
                Rewrite Style <span className="text-red-500">*</span>
              </label>
              <Select value={rewriteStyle} onValueChange={setRewriteStyle}>
                <SelectTrigger className={!rewriteStyle ? 'border-red-300' : ''}>
                  <SelectValue placeholder="Select a rewrite style..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="balanced">
                    <div className="flex flex-col items-start">
                      <span>Balanced</span>
                      <span className="text-xs text-gray-500">Recommended</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="concise">
                    <div className="flex flex-col items-start">
                      <span>Concise & Brief</span>
                      <span className="text-xs text-gray-500">Maximum brevity</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="detailed">
                    <div className="flex flex-col items-start">
                      <span>Detailed & Comprehensive</span>
                      <span className="text-xs text-gray-500">Full context</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="achievement">
                    <div className="flex flex-col items-start">
                      <span>Achievement-Focused</span>
                      <span className="text-xs text-gray-500">Results driven</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                {!rewriteStyle && '⚠️ Please select a rewrite style to begin optimization'}
                {rewriteStyle === 'concise' && '✂️ Brief and to-the-point with maximum clarity'}
                {rewriteStyle === 'detailed' && '📝 Comprehensive with full context and specifics'}
                {rewriteStyle === 'balanced' && '⚖️ Clear and informative without being verbose'}
                {rewriteStyle === 'achievement' && '🎯 Results-driven with quantified outcomes'}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">
                {acceptedCount} / {totalCount} sections accepted
              </Badge>
              {isGenerating && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Generating...
                </Badge>
              )}
              <Badge variant="outline" className={industryTone ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-red-50 text-red-700 border-red-200"}>
                Tone: {industryTone ? (industryTone.charAt(0).toUpperCase() + industryTone.slice(1)) : 'Not Selected'}
              </Badge>
              <Badge variant="outline" className={rewriteStyle ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-red-50 text-red-700 border-red-200"}>
                Style: {rewriteStyle ? (rewriteStyle.charAt(0).toUpperCase() + rewriteStyle.slice(1)) : 'Not Selected'}
              </Badge>
            </div>
            <Button
              onClick={generateOptimizedSections}
              variant="default"
              size="sm"
              disabled={isGenerating}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
              Regenerate All Sections
            </Button>
          </div>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Section List */}
          <div className="lg:col-span-1">
            <Card className="p-4">
              <h3 className="mb-4">Resume Sections</h3>
              <ScrollArea className="h-[600px]">
                <div className="space-y-2 pr-4">
                  {sections.map(section => (
                    <button
                      key={section.id}
                      onClick={() => setSelectedSectionId(section.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedSectionId === section.id
                          ? 'bg-blue-100 border-2 border-blue-500'
                          : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">
                          {section.title.toUpperCase() === 'HEADER' ? 'Contact Information' : section.title}
                        </span>
                        {section.status === 'accepted' && (
                          <Check className="w-4 h-4 text-green-600" />
                        )}
                        {section.status === 'editing' && (
                          <Edit3 className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      <div className="flex gap-1">
                        <div className="h-1 flex-1 bg-gray-200 rounded" />
                        <div className={`h-1 flex-1 rounded ${
                          section.status === 'accepted' ? 'bg-green-500' : 
                          section.status === 'editing' ? 'bg-blue-500' : 
                          'bg-gray-200'
                        }`} />
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </Card>

            {/* AI Suggestions */}
            {selectedSectionId && sections.find(s => s.id === selectedSectionId)?.suggestions.length > 0 && (
              <Card className="p-4 mt-4 bg-purple-50 border-purple-200">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-4 h-4 text-purple-600" />
                  <h4 className="text-sm text-purple-900">AI Suggestions</h4>
                </div>
                <ul className="space-y-2">
                  {sections
                    .find(s => s.id === selectedSectionId)
                    ?.suggestions.map((suggestion, idx) => (
                      <li key={idx} className="text-sm text-purple-800 flex items-start gap-2">
                        <Target className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span>{suggestion}</span>
                      </li>
                    ))}
                </ul>
              </Card>
            )}
          </div>

          {/* Comparison View */}
          <div className="lg:col-span-2">
            {selectedSectionId && (
              (() => {
                const currentSection = sections.find(s => s.id === selectedSectionId);
                const isAcceptDisabled = 
                  isGenerating || 
                  !industryTone || 
                  !rewriteStyle || 
                  currentSection?.status === 'editing';
                
                return (
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl">
                        {currentSection?.title.toUpperCase() === 'HEADER' ? 'Contact Information' : currentSection?.title}
                      </h3>
                      <div className="flex gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                <Button
                                  onClick={() => handleAcceptSection(selectedSectionId)}
                                  variant="default"
                                  size="sm"
                                  disabled={isAcceptDisabled}
                                  className={`${
                                    isAcceptDisabled 
                                      ? 'bg-gray-400 cursor-not-allowed hover:bg-gray-400' 
                                      : 'bg-green-600 hover:bg-green-700'
                                  }`}
                                >
                                  <Check className="w-4 h-4 mr-2" />
                                  Accept
                                </Button>
                              </span>
                            </TooltipTrigger>
                            {isAcceptDisabled && (
                              <TooltipContent>
                                <p className="text-xs">
                                  {currentSection?.status === 'editing' 
                                    ? 'Save your edits first before accepting' 
                                    : !industryTone || !rewriteStyle
                                    ? 'Select Industry Tone and Rewrite Style first'
                                    : 'Wait for AI to finish generating'}
                                </p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                        <Button
                          onClick={() => handleRegenerateSection(selectedSectionId)}
                          variant="outline"
                          size="sm"
                          disabled={isGenerating}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Regenerate
                        </Button>
                        <Button
                          onClick={() => handleEditSection(selectedSectionId)}
                          variant={currentSection?.status === 'editing' ? 'default' : 'outline'}
                          size="sm"
                          disabled={isGenerating}
                          className={currentSection?.status === 'editing' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                        >
                          {currentSection?.status === 'editing' ? (
                            <>
                              <Check className="w-4 h-4 mr-2" />
                              Save
                            </>
                          ) : (
                            <>
                              <Edit3 className="w-4 h-4 mr-2" />
                              Edit
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Alert when all sections accepted */}
                    {showAllSectionsAcceptedAlert && (
                      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-600" />
                          <p className="text-sm text-green-800">
                            <strong>All sections reviewed!</strong> Click <strong>"Next: Match Score"</strong> at the top right to continue.
                          </p>
                        </div>
                      </div>
                    )}

                    <Tabs defaultValue="compare" className="w-full">
                      <TabsList className="grid w-full grid-cols-3 mb-4">
                        <TabsTrigger value="original">Original</TabsTrigger>
                        <TabsTrigger value="compare">Side by Side</TabsTrigger>
                        <TabsTrigger value="optimized">Optimized</TabsTrigger>
                      </TabsList>

                      <TabsContent value="original">
                        <ScrollArea className="h-[500px] w-full rounded-lg border p-4 bg-gray-50">
                          <pre className="whitespace-pre-wrap text-sm">
                            {currentSection?.original}
                          </pre>
                        </ScrollArea>
                      </TabsContent>

                      <TabsContent value="compare">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="w-4 h-4 text-gray-600" />
                              <span className="text-sm">Original</span>
                              {currentSection?.status === 'editing' && (
                                <Badge variant="secondary" className="ml-auto">Editable</Badge>
                              )}
                            </div>
                            {currentSection?.status === 'editing' ? (
                              <Textarea
                                value={currentSection?.original || ''}
                                onChange={(e) => handleUpdateOriginalText(selectedSectionId, e.target.value)}
                                className="h-[500px] w-full rounded-lg border p-4 bg-blue-50 font-mono text-sm resize-none"
                                placeholder="Edit original text..."
                              />
                            ) : (
                              <ScrollArea className="h-[500px] w-full rounded-lg border p-4 bg-gray-50">
                                <pre className="whitespace-pre-wrap text-sm">
                                  {currentSection?.original}
                                </pre>
                              </ScrollArea>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <TrendingUp className="w-4 h-4 text-green-600" />
                              <span className="text-sm">Optimized</span>
                              {currentSection?.status === 'editing' && (
                                <Badge variant="secondary" className="ml-auto">Editable</Badge>
                              )}
                            </div>
                            {currentSection?.status === 'editing' ? (
                              <Textarea
                                value={currentSection?.optimized || ''}
                                onChange={(e) => handleUpdateOptimizedText(selectedSectionId, e.target.value)}
                                className="h-[500px] w-full rounded-lg border p-4 bg-green-50 font-mono text-sm resize-none"
                                placeholder="Edit optimized text..."
                              />
                            ) : (
                              <CopyProtection>
                                <ScrollArea className="h-[500px] w-full rounded-lg border p-4 bg-green-50">
                                  <pre className="whitespace-pre-wrap text-sm">
                                    {currentSection?.optimized || 'Generating optimized version...'}
                                  </pre>
                                </ScrollArea>
                              </CopyProtection>
                            )}
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="optimized">
                        {currentSection?.status === 'editing' ? (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary">Editing Mode</Badge>
                              <span className="text-sm text-gray-600">Make your changes below</span>
                            </div>
                            <Textarea
                              value={currentSection?.optimized || ''}
                              onChange={(e) => handleUpdateOptimizedText(selectedSectionId, e.target.value)}
                              className="h-[500px] w-full rounded-lg border p-4 bg-green-50 font-mono text-sm resize-none"
                              placeholder="Edit optimized text..."
                            />
                          </div>
                        ) : (
                          <CopyProtection>
                            <ScrollArea className="h-[500px] w-full rounded-lg border p-4 bg-green-50">
                              <pre className="whitespace-pre-wrap text-sm">
                                {currentSection?.optimized || 'Generating optimized version...'}
                              </pre>
                            </ScrollArea>
                          </CopyProtection>
                        )}
                      </TabsContent>
                    </Tabs>
                  </Card>
                );
              })()
            )}
          </div>
        </div>
      </div>
    </div>
  );
}