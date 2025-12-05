/**
 * AI Resume Parsing Feedback System
 * 
 * This component includes a feedback mechanism that allows users to rate the accuracy
 * of AI parsing results for each section of their resume.
 * 
 * How it works:
 * 1. Users see "Help us improve AI. Parsed correctly?" with thumbs up/down buttons
 * 2. Thumbs up: Positive feedback is stored, confirming current parsing works well
 * 3. Thumbs down: User is prompted to provide reasons for incorrect parsing
 * 4. Feedback is stored in localStorage under 'aiParsingFeedback' key
 * 5. For future resumes, feedback analysis can guide AI parsing improvements
 * 
 * Feedback data structure:
 * {
 *   section: string (e.g., 'personalDetails', 'experience'),
 *   type: 'positive' | 'negative',
 *   reason?: string (for negative feedback),
 *   timestamp: number
 * }
 * 
 * Future enhancement:
 * - The feedbackAnalyzer utility can analyze patterns in negative feedback
 * - Common issues are identified (e.g., "email parsing" mentioned 5 times)
 * - Guidance is generated and passed to AI parsing endpoint
 * - AI uses this guidance to improve parsing accuracy over time
 */
import { useState, useEffect, useRef } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { parseExperience } from '../utils/experienceParser';
import { parseEducation } from '../utils/educationParser';
import { RichTextEditor } from './RichTextEditor';
import { AIImproveDialog } from './AIImproveDialog';
import { FeedbackButtons } from './FeedbackButtons';
import { processHTMLBulletsWithFormatting, processHTMLWithNesting, convertMarkdownToHTML } from '../utils/htmlBulletProcessor';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { 
  ArrowLeft, 
  ArrowRight, 
  User,
  Phone,
  FileText,
  Briefcase,
  GraduationCap,
  Wrench,
  Link2,
  Plus,
  Menu,
  Camera,
  ChevronDown,
  ChevronUp,
  Save,
  Trash2,
  Sparkles,
  GripVertical,
  X,
  Info,
  Pencil,
  PanelRightClose,
  PanelRightOpen,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { apiClient } from '../utils/api';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { PhotoUploadDialog } from './PhotoUploadDialog';
import { AddSectionDialog } from './AddSectionDialog';
import { JobMatchScore } from './JobMatchScore';
import { AIHRSuggestions } from './AIHRSuggestions';

interface ResumeData {
  personalDetails: {
    firstName: string;
    lastName: string;
    jobTitle: string;
    nationality: string;
    driversLicense: string;
    birthDate: string;
    photoUrl: string;
  };
  contact: {
    email: string;
    phone: string;
    address: string;
    linkedin: string;
    website: string;
  };
  summary: string;
  experience: Array<{
    id: string;
    title: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string;
    description: string;
    current: boolean;
  }>;
  education: Array<{
    id: string;
    degree: string;
    institution: string;
    location: string;
    startDate: string;
    endDate: string;
    details: string;
    current: boolean;
  }>;
  skills: string[];
  skillsRichText?: string;
  links: Array<{
    id: string;
    label: string;
    url: string;
  }>;
  customSections: Array<{
    id: string;
    title: string;
    content: string;
  }>;
}

type SectionType = 'personalDetails' | 'contact' | 'summary' | 'experience' | 'education' | 'skills' | 'links' | 'customSections';

interface SectionOrder {
  id: string;
  type: SectionType;
  label: string;
  visible: boolean;
}

interface AIRewritePanelProps {
  originalResume: string;
  jobDescription: string;
  onBack: (currentResumeData?: any) => void;
  onNext: (optimizedResume: string) => void;
  onPreview: () => void;
  optimizationFlow: 'direct' | 'withJob';
  cachedParsedData?: any;
}

export function AIRewritePanel({ 
  originalResume, 
  jobDescription, 
  onBack, 
  onNext,
  onPreview,
  optimizationFlow,
  cachedParsedData
}: AIRewritePanelProps) {
  const [currentSection, setCurrentSection] = useState<SectionType>('personalDetails');
  const [industryTone, setIndustryTone] = useState<string>('');
  const [rewriteStyle, setRewriteStyle] = useState<string>('');
  const [showSettings, setShowSettings] = useState(true);
  const [showAdditionalDetails, setShowAdditionalDetails] = useState(false);
  const [showReorderDialog, setShowReorderDialog] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [highlightSettings, setHighlightSettings] = useState(false);
  const [isPreviewVisible, setIsPreviewVisible] = useState(true);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(false);
  
  // Refs for scrolling to settings
  const settingsRef = useRef<HTMLDivElement>(null);
  const industryToneRef = useRef<HTMLButtonElement>(null);
  const rewriteStyleRef = useRef<HTMLButtonElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [showPhotoDialog, setShowPhotoDialog] = useState(false);
  const [showAddSectionDialog, setShowAddSectionDialog] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingSectionName, setEditingSectionName] = useState<string>('');
  const [hoveredSectionId, setHoveredSectionId] = useState<string | null>(null);
  
  // AI HR Suggestions state
  const [showAIHRSuggestions, setShowAIHRSuggestions] = useState(false);
  const [cachedAISuggestions, setCachedAISuggestions] = useState<any>(null);
  const [forceRegenerateAI, setForceRegenerateAI] = useState(false);
  
  // Job Match Score state
  const [showJobMatchScore, setShowJobMatchScore] = useState(false);
  const [cachedJobMatchScore, setCachedJobMatchScore] = useState<any>(null);
  const [forceRegenerateMatch, setForceRegenerateMatch] = useState(false);
  
  // AI Improve dialog state
  const [improveDialogOpen, setImproveDialogOpen] = useState(false);
  
  // Feedback state
  const [sectionFeedback, setSectionFeedback] = useState<Record<string, 'up' | 'down' | null>>({});
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [feedbackReason, setFeedbackReason] = useState('');
  const [improveDialogContent, setImproveDialogContent] = useState('');
  const [improveDialogSectionType, setImproveDialogSectionType] = useState<'summary' | 'experience' | 'education' | 'skills' | 'custom'>('summary');
  const [improveDialogIsList, setImproveDialogIsList] = useState(false);
  const [improveDialogCallback, setImproveDialogCallback] = useState<((content: string) => void) | null>(null);
  
  // Loading state for AI summary generation
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  
  // Track original content before AI optimization for "Return to original" button
  const [originalSummary, setOriginalSummary] = useState<string>('');
  const [originalExperience, setOriginalExperience] = useState<Record<string, string>>({});
  const [originalEducation, setOriginalEducation] = useState<Record<string, string>>({});
  const [originalCustomSections, setOriginalCustomSections] = useState<Record<string, string>>({});
  
  const [resumeData, setResumeData] = useState<ResumeData>({
    personalDetails: {
      firstName: '',
      lastName: '',
      jobTitle: '',
      nationality: '',
      driversLicense: '',
      birthDate: '',
      photoUrl: ''
    },
    contact: {
      email: '',
      phone: '',
      address: '',
      linkedin: '',
      website: ''
    },
    summary: '',
    experience: [],
    education: [],
    skills: [],
    skillsRichText: '',
    links: [],
    customSections: []
  });

  const [sectionOrder, setSectionOrder] = useState<SectionOrder[]>([
    { id: 'personalDetails', type: 'personalDetails', label: 'Personal Details', visible: true },
    { id: 'contact', type: 'contact', label: 'Contact Information', visible: true },
    { id: 'summary', type: 'summary', label: 'Professional Summary', visible: true },
    { id: 'experience', type: 'experience', label: 'Employment History', visible: true },
    { id: 'education', type: 'education', label: 'Education', visible: true },
    { id: 'skills', type: 'skills', label: 'Skills', visible: true },
  ]);

  // Parse resume data on mount
  useEffect(() => {
    if (cachedParsedData) {
      parseResumeData(cachedParsedData);
    } else {
      // Check if this is a blank template (starting from scratch)
      const isBlankTemplate = !originalResume.trim() || 
        (originalResume.includes('YOUR NAME') && 
         originalResume.includes('[Add your professional summary here]') &&
         originalResume.includes('[Add your work experience here]'));
      
      if (isBlankTemplate) {
        // Starting from scratch - initialize with empty data, don't parse
        const emptyData: ResumeData = {
          personalDetails: {
            firstName: '',
            lastName: '',
            jobTitle: '',
            nationality: '',
            driversLicense: '',
            birthDate: '',
            photoUrl: ''
          },
          contact: {
            email: '',
            phone: '',
            address: '',
            linkedin: '',
            website: ''
          },
          summary: '',
          experience: [],
          education: [],
          skills: [],
          skillsRichText: '',
          links: [],
          customSections: []
        };
        
        setResumeData(emptyData);
        
        // Set up default 6 sections without parsing
        const defaultSections: SectionOrder[] = [
          { id: 'personalDetails', type: 'personalDetails', label: 'Personal Details', visible: true },
          { id: 'contact', type: 'contact', label: 'Contact Information', visible: true },
          { id: 'summary', type: 'summary', label: 'Professional Summary', visible: true },
          { id: 'experience', type: 'experience', label: 'Employment History', visible: true },
          { id: 'education', type: 'education', label: 'Education', visible: true },
          { id: 'skills', type: 'skills', label: 'Skills', visible: true },
        ];
        setSectionOrder(defaultSections);
      } else {
        // User uploaded a resume - parse it
        parseResumeFromText(originalResume);
      }
    }
  }, [originalResume, cachedParsedData]);

  // Scroll to settings section when panel opens and either field is not selected
  useEffect(() => {
    if (!industryTone || !rewriteStyle) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  // Auto-optimize with AI when settings change
  useEffect(() => {
    if (industryTone && rewriteStyle && resumeData.summary) {
      optimizeWithAI();
    }
  }, [industryTone, rewriteStyle]);

  // Handle preview scroll to show/hide scroll indicator
  const handlePreviewScroll = () => {
    if (previewContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = previewContainerRef.current;
      const hasMoreContent = scrollHeight > clientHeight;
      const atBottom = scrollTop + clientHeight >= scrollHeight - 50; // 50px threshold
      
      setShowScrollIndicator(hasMoreContent && !atBottom);
      setIsAtBottom(atBottom);
    }
  };

  // Check scroll indicator on content change
  useEffect(() => {
    handlePreviewScroll();
  }, [resumeData, sectionOrder, isPreviewVisible]);

  const scrollPreviewDown = () => {
    if (previewContainerRef.current) {
      previewContainerRef.current.scrollBy({
        top: 400,
        behavior: 'smooth'
      });
    }
  };

  const scrollPreviewUp = () => {
    if (previewContainerRef.current) {
      previewContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  const parseResumeData = (data: any) => {
    // Convert cached parsed data to ResumeData format
    const fullText = [data.name, data.contact, data.summary, data.experience, data.education, data.skills].join('\n');
    
    // Build custom sections from parsed data (awards, certifications, projects, etc.)
    const customSections: ResumeData['customSections'] = [];
    
    // Map of section fields to their titles
    const sectionMappings = [
      { field: 'projects', titleField: 'projectsTitle', defaultTitle: 'Projects' },
      { field: 'certifications', titleField: 'certificationsTitle', defaultTitle: 'Certifications' },
      { field: 'publications', titleField: 'publicationsTitle', defaultTitle: 'Publications' },
      { field: 'patents', titleField: 'patentsTitle', defaultTitle: 'Patents' },
      { field: 'presentations', titleField: 'presentationsTitle', defaultTitle: 'Presentations' },
      { field: 'awards', titleField: 'awardsTitle', defaultTitle: 'Awards' },
      { field: 'activities', titleField: 'activitiesTitle', defaultTitle: 'Activities' },
      { field: 'languages', titleField: 'languagesTitle', defaultTitle: 'Languages' },
      { field: 'interests', titleField: 'interestsTitle', defaultTitle: 'Interests' },
      { field: 'references', titleField: 'referencesTitle', defaultTitle: 'References' },
      { field: 'courses', titleField: 'coursesTitle', defaultTitle: 'Courses' },
    ];
    
    sectionMappings.forEach(({ field, titleField, defaultTitle }, index) => {
      const content = data[field];
      if (content && content.trim()) {
        customSections.push({
          id: `custom-${field}-${Date.now()}-${index}`,
          title: data[titleField] || defaultTitle,
          // Convert markdown to HTML for proper display
          content: convertMarkdownToHTML(content.trim())
        });
      }
    });
    
    // Also add any existing custom sections from the parsed data
    if (data.customSections && Array.isArray(data.customSections)) {
      data.customSections.forEach((section: any) => {
        if (section.content && section.content.trim()) {
          customSections.push({
            id: section.id || `custom-${Date.now()}-${customSections.length}`,
            title: section.title || 'Custom Section',
            // Convert markdown to HTML for proper display
            content: convertMarkdownToHTML(section.content.trim())
          });
        }
      });
    }
    
    // Convert markdown to HTML for summary and skills
    const convertedSummary = convertMarkdownToHTML(data.summary || '');
    const convertedSkills = convertMarkdownToHTML(data.skills || '');
    
    const parsed: ResumeData = {
      personalDetails: {
        firstName: data.firstName || extractFirstName(data.name || ''),
        lastName: data.lastName || extractLastName(data.name || ''),
        jobTitle: data.jobTitle || '',
        nationality: data.nationality || '',
        driversLicense: data.driversLicense || '',
        birthDate: data.birthDate || '',
        photoUrl: data.photoUrl || ''
      },
      contact: {
        email: extractEmail(data.contact || ''),
        phone: extractPhone(data.contact || ''),
        address: extractAddress(data.contact || ''),
        linkedin: extractLinkedIn(data.contact || ''),
        website: extractWebsite(fullText)
      },
      summary: convertedSummary,
      experience: parseExperience(data.experience || ''),
      education: parseEducation(data.education || ''),
      skills: parseSkills(data.skills || ''),
      skillsRichText: convertedSkills,
      links: parseLinks(fullText),
      customSections: customSections
    };

    setResumeData(parsed);
    
    // Update section order based on what sections have content
    updateSectionOrderFromData(parsed, data);
  };
  
  // Update section order to only show sections that have content
  const updateSectionOrderFromData = (parsed: ResumeData, originalData: any) => {
    const newSectionOrder: SectionOrder[] = [];
    
    // Always show these 6 default sections regardless of content
    newSectionOrder.push({ id: 'personalDetails', type: 'personalDetails', label: 'Personal Details', visible: true });
    newSectionOrder.push({ id: 'contact', type: 'contact', label: 'Contact Information', visible: true });
    newSectionOrder.push({ id: 'summary', type: 'summary', label: originalData.summaryTitle || 'Professional Summary', visible: true });
    newSectionOrder.push({ id: 'experience', type: 'experience', label: originalData.experienceTitle || 'Employment History', visible: true });
    newSectionOrder.push({ id: 'education', type: 'education', label: originalData.educationTitle || 'Education', visible: true });
    newSectionOrder.push({ id: 'skills', type: 'skills', label: originalData.skillsTitle || 'Skills', visible: true });
    
    // Links - only show if links exist
    if (parsed.links && parsed.links.length > 0) {
      newSectionOrder.push({ id: 'links', type: 'links', label: 'Links', visible: true });
    }
    
    // Add custom sections (awards, certifications, projects, etc.)
    parsed.customSections.forEach(section => {
      newSectionOrder.push({
        id: section.id,
        type: 'customSections',
        label: section.title,
        visible: true
      });
    });
    
    setSectionOrder(newSectionOrder);
  };

  const parseResumeFromText = (text: string) => {
    // TODO: Future enhancement - Use AI parsing with feedback guidance
    // import { generateParsingGuidance } from '../utils/feedbackAnalyzer';
    // const guidance = generateParsingGuidance();
    // if (guidance) {
    //   const aiParsed = await apiClient.parseResumeWithAI(text, guidance);
    //   // Use AI parsed results
    // }
    
    // Basic text parsing (current implementation)
    const lines = text.split('\n').filter(line => line.trim());
    
    // Extract name from first line
    const nameLine = lines[0] || '';
    const firstName = extractFirstName(nameLine);
    const lastName = extractLastName(nameLine);

    const parsed: ResumeData = {
      personalDetails: {
        firstName,
        lastName,
        jobTitle: '',
        nationality: '',
        driversLicense: '',
        birthDate: '',
        photoUrl: ''
      },
      contact: {
        email: extractEmail(text),
        phone: extractPhone(text),
        address: extractAddress(text),
        linkedin: extractLinkedIn(text),
        website: extractWebsite(text)
      },
      summary: extractSummary(text),
      experience: parseExperience(text),
      education: parseEducation(text),
      skills: parseSkills(text),
      skillsRichText: '',
      links: parseLinks(text),
      customSections: parseCustomSections(text)
    };

    setResumeData(parsed);
    
    // Update section order based on what sections have content (for text parsing)
    // Skip updating section order if starting from scratch (empty text)
    if (text.trim()) {
      updateSectionOrderFromParsedData(parsed);
    }
  };
  
  // Update section order for text-parsed data
  const updateSectionOrderFromParsedData = (parsed: ResumeData) => {
    const newSectionOrder: SectionOrder[] = [];
    
    // Always show these 6 default sections regardless of content
    newSectionOrder.push({ id: 'personalDetails', type: 'personalDetails', label: 'Personal Details', visible: true });
    newSectionOrder.push({ id: 'contact', type: 'contact', label: 'Contact Information', visible: true });
    newSectionOrder.push({ id: 'summary', type: 'summary', label: 'Professional Summary', visible: true });
    newSectionOrder.push({ id: 'experience', type: 'experience', label: 'Employment History', visible: true });
    newSectionOrder.push({ id: 'education', type: 'education', label: 'Education', visible: true });
    newSectionOrder.push({ id: 'skills', type: 'skills', label: 'Skills', visible: true });
    
    // Links - only show if links exist
    if (parsed.links && parsed.links.length > 0) {
      newSectionOrder.push({ id: 'links', type: 'links', label: 'Links', visible: true });
    }
    
    // Add custom sections (awards, certifications, projects, etc.)
    parsed.customSections.forEach(section => {
      newSectionOrder.push({
        id: section.id,
        type: 'customSections',
        label: section.title,
        visible: true
      });
    });
    
    setSectionOrder(newSectionOrder);
  };

  // Helper functions for parsing
  const extractFirstName = (text: string): string => {
    const parts = text.trim().split(/\s+/);
    return parts[0] || '';
  };

  const extractLastName = (text: string): string => {
    const parts = text.trim().split(/\s+/);
    return parts.slice(1).join(' ') || '';
  };

  const extractEmail = (text: string): string => {
    const match = text.match(/[\w\.-]+@[\w\.-]+\.\w+/);
    return match ? match[0] : '';
  };

  const extractPhone = (text: string): string => {
    const match = text.match(/(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/);
    return match ? match[0] : '';
  };

  const extractAddress = (text: string): string => {
    // Look for common address patterns
    // Pattern 1: City, State ZIP
    const pattern1 = text.match(/[A-Z][a-z]+(?:\s[A-Z][a-z]+)*,\s*[A-Z]{2}(?:\s+\d{5})?/);
    if (pattern1) return pattern1[0];
    
    // Pattern 2: Just City, State
    const pattern2 = text.match(/[A-Z][a-z]+(?:\s[A-Z][a-z]+)*,\s*[A-Z]{2}/);
    if (pattern2) return pattern2[0];
    
    // Pattern 3: Full street address
    const pattern3 = text.match(/\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd)[,\s]+[A-Z][a-z]+,\s*[A-Z]{2}/);
    if (pattern3) return pattern3[0];
    
    return '';
  };

  const extractLinkedIn = (text: string): string => {
    const match = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([\w-]+)/i);
    return match ? `linkedin.com/in/${match[1]}` : '';
  };

  const extractWebsite = (text: string): string => {
    // Look for GitHub first
    const githubMatch = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([\w-]+)/i);
    if (githubMatch) return `github.com/${githubMatch[1]}`;
    
    // Email domains to exclude
    const emailDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com', 'icloud.com', 'mail.com', 'protonmail.com'];
    
    // Look for other websites (exclude email domains and linkedin)
    const websiteMatch = text.match(/(?:https?:\/\/)?(?:www\.)?([\w-]+\.(?:com|net|org|io|dev|me|co)(?:\/[\w-]*)?)/i);
    if (websiteMatch) {
      const matchIndex = text.indexOf(websiteMatch[0]);
      const textBeforeMatch = text.substring(Math.max(0, matchIndex - 50), matchIndex);
      const domain = websiteMatch[1].toLowerCase();
      
      // Skip if this is part of an email address (@ appears right before the domain)
      if (textBeforeMatch.includes('@') && textBeforeMatch.lastIndexOf('@') > textBeforeMatch.length - 20) {
        return '';
      }
      
      // Skip if this is a common email domain
      if (emailDomains.some(emailDomain => domain.includes(emailDomain))) {
        return '';
      }
      
      // Skip if this is linkedin
      if (domain.includes('linkedin')) {
        return '';
      }
      
      return websiteMatch[1];
    }
    
    return '';
  };

  const extractSummary = (text: string): string => {
    // Look for summary section
    const summaryMatch = text.match(/(?:PROFESSIONAL\s+SUMMARY|SUMMARY|PROFILE|OBJECTIVE)[\s\n]+([\s\S]*?)(?=\n\n[A-Z]{2,}[A-Z\s]{8,}|\n[A-Z][A-Z\s]{10,}|$)/i);
    if (summaryMatch && summaryMatch[1]) {
      return summaryMatch[1].trim();
    }
    return '';
  };

  // Experience parsing moved to /utils/experienceParser.ts

  // Education parsing moved to /utils/educationParser.ts

  const parseSkills = (text: string): string[] => {
    if (!text || text.trim() === '') return [];
    
    // Split by newlines and bullets ONLY (not commas)
    // This preserves comma-separated skills within each bullet point
    const lines = text.split('\n');
    const skills: string[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      // Skip category headers (e.g., "Programming Languages:", "Tools:")
      if (trimmed.match(/^[A-Za-z\s&/]+:\s*$/)) continue;
      
      // Split by bullet points (•) only
      if (trimmed.includes('•')) {
        const bulletItems = trimmed.split('•');
        for (const item of bulletItems) {
          const cleaned = item
            .trim()
            .replace(/^[-–—]\s*/, '') // Remove leading dashes
            .replace(/^[A-Za-z\s&/]+:\s*/, ''); // Remove category prefixes
          
          if (cleaned && cleaned.length > 1 && !cleaned.match(/^[A-Z\s]{10,}$/)) {
            skills.push(cleaned);
          }
        }
      } else {
        // Single line without bullets - treat as one skill group
        const cleaned = trimmed
          .replace(/^[-–—]\s*/, '') // Remove leading dashes
          .replace(/^[A-Za-z\s&/]+:\s*/, ''); // Remove category prefixes
        
        if (cleaned && cleaned.length > 1 && !cleaned.match(/^[A-Z\s]{10,}$/)) {
          skills.push(cleaned);
        }
      }
    }
    
    // Remove duplicates (case-insensitive)
    const uniqueSkills: string[] = [];
    const seenSkills = new Set<string>();
    
    for (const skill of skills) {
      const lowerSkill = skill.toLowerCase();
      if (!seenSkills.has(lowerSkill)) {
        seenSkills.add(lowerSkill);
        uniqueSkills.push(skill);
      }
    }
    
    return uniqueSkills;
  };

  const parseLinks = (text: string): ResumeData['links'] => {
    const links: ResumeData['links'] = [];
    
    // Email domains to exclude
    const emailDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com', 'icloud.com', 'mail.com', 'protonmail.com'];
    
    // Check for GitHub
    const githubMatch = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([\w-]+)/i);
    if (githubMatch) {
      links.push({
        id: `link-github-${Date.now()}`,
        label: 'GitHub',
        url: `github.com/${githubMatch[1]}`
      });
    }
    
    // Check for Portfolio/Website (exclude LinkedIn, GitHub, and email)
    const websiteMatches = text.match(/(?:https?:\/\/)?(?:www\.)?([\w-]+\.(?:com|net|org|io|dev|me|co)(?:\/[\w-]*)?)/gi);
    if (websiteMatches) {
      websiteMatches.forEach((match, index) => {
        const cleanUrl = match.replace(/^https?:\/\//, '').replace(/^www\./, '').toLowerCase();
        const matchIndex = text.indexOf(match);
        const textBeforeMatch = text.substring(Math.max(0, matchIndex - 20), matchIndex);
        
        // Skip if part of email address
        const isEmail = textBeforeMatch.includes('@') || cleanUrl.includes('@');
        
        // Skip if common email domain
        const isEmailDomain = emailDomains.some(domain => cleanUrl.includes(domain));
        
        if (!cleanUrl.includes('linkedin') && 
            !isEmail &&
            !isEmailDomain &&
            !cleanUrl.includes('github') &&
            !links.find(l => l.url === cleanUrl)) {
          links.push({
            id: `link-website-${Date.now()}-${index}`,
            label: 'Website',
            url: cleanUrl
          });
        }
      });
    }
    
    return links;
  };

  const parseCustomSections = (text: string): ResumeData['customSections'] => {
    const customSections: ResumeData['customSections'] = [];
    
    // Common custom section headers
    const sectionHeaders = [
      'AWARDS', 'HONORS', 'ACHIEVEMENTS',
      'PATENTS', 'PUBLICATIONS', 'RESEARCH',
      'PROJECTS', 'PORTFOLIO', 'PERSONAL PROJECTS',
      'CERTIFICATIONS', 'CERTIFICATES', 'LICENSES',
      'VOLUNTEER', 'VOLUNTEERING', 'COMMUNITY',
      'LANGUAGES', 'LANGUAGE SKILLS',
      'INTERESTS', 'HOBBIES',
      'REFERENCES', 'PROFESSIONAL AFFILIATIONS'
    ];
    
    // Try to find sections in the text
    // Pattern: Section header followed by content until next section or end
    const lines = text.split('\n');
    let currentSection: { title: string; content: string[] } | null = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const upperLine = line.toUpperCase();
      
      // Check if this line is a section header
      const matchedHeader = sectionHeaders.find(header => {
        // Check for exact match or match with common variations
        return upperLine === header || 
               upperLine === `${header}:` ||
               upperLine.startsWith(`${header} `);
      });
      
      if (matchedHeader) {
        // Save previous section if exists
        if (currentSection && currentSection.content.length > 0) {
          customSections.push({
            id: `custom-${Date.now()}-${customSections.length}`,
            title: currentSection.title,
            content: currentSection.content.join('\n').trim()
          });
        }
        
        // Start new section
        currentSection = {
          title: line.replace(':', '').trim(),
          content: []
        };
      } else if (currentSection) {
        // Add line to current section
        // Stop if we hit another major section (EXPERIENCE, EDUCATION, SKILLS, SUMMARY)
        const majorSections = ['EXPERIENCE', 'WORK HISTORY', 'EMPLOYMENT', 'EDUCATION', 'SKILLS', 'SUMMARY', 'PROFILE', 'CONTACT'];
        const isMajorSection = majorSections.some(major => upperLine.includes(major));
        
        if (isMajorSection) {
          // Save current section and stop
          if (currentSection.content.length > 0) {
            customSections.push({
              id: `custom-${Date.now()}-${customSections.length}`,
              title: currentSection.title,
              content: currentSection.content.join('\n').trim()
            });
          }
          currentSection = null;
        } else if (line) {
          currentSection.content.push(line);
        }
      }
    }
    
    // Save last section
    if (currentSection && currentSection.content.length > 0) {
      customSections.push({
        id: `custom-${Date.now()}-${customSections.length}`,
        title: currentSection.title,
        content: currentSection.content.join('\n').trim()
      });
    }
    
    return customSections;
  };

  // AI Optimization
  const optimizeWithAI = async () => {
    if (!industryTone || !rewriteStyle) return;

    setIsOptimizing(true);
    try {
      // Optimize summary
      if (resumeData.summary) {
        const optimizedSummary = await apiClient.optimizeSection(
          resumeData.summary,
          jobDescription,
          'Professional Summary',
          industryTone,
          rewriteStyle
        );
        
        setResumeData(prev => ({
          ...prev,
          summary: optimizedSummary.optimizedText
        }));
      }

      // Optimize experience descriptions
      const optimizedExperience = await Promise.all(
        resumeData.experience.map(async (exp) => {
          if (exp.description) {
            const optimized = await apiClient.optimizeSection(
              exp.description,
              jobDescription,
              'Experience',
              industryTone,
              rewriteStyle
            );
            return { ...exp, description: optimized.optimizedText };
          }
          return exp;
        })
      );

      setResumeData(prev => ({
        ...prev,
        experience: optimizedExperience
      }));

      toast.success('Resume optimized with AI!', {
        description: `Applied ${industryTone} tone with ${rewriteStyle} style`,
        icon: <Sparkles className="w-4 h-4" />
      });
    } catch (error) {
      console.error('AI optimization error:', error);
      toast.error('AI optimization failed', {
        description: 'Using your original content'
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  // Update handlers
  const updatePersonalDetails = (field: keyof ResumeData['personalDetails'], value: string) => {
    setResumeData(prev => ({
      ...prev,
      personalDetails: {
        ...prev.personalDetails,
        [field]: value
      }
    }));
  };

  const updateContact = (field: keyof ResumeData['contact'], value: string) => {
    setResumeData(prev => ({
      ...prev,
      contact: {
        ...prev.contact,
        [field]: value
      }
    }));
  };

  const updateSummary = (value: string) => {
    setResumeData(prev => ({ ...prev, summary: value }));
  };

  // Experience handlers
  const addExperience = () => {
    const newExp = {
      id: `exp-${Date.now()}`,
      title: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      description: '',
      current: false
    };
    setResumeData(prev => ({
      ...prev,
      experience: [...prev.experience, newExp]
    }));
  };

  const updateExperience = (id: string, field: keyof ResumeData['experience'][0], value: string | boolean) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.map(exp =>
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const deleteExperience = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.filter(exp => exp.id !== id)
    }));
  };

  // Education handlers
  const addEducation = () => {
    const newEdu = {
      id: `edu-${Date.now()}`,
      degree: '',
      institution: '',
      location: '',
      startDate: '',
      endDate: '',
      details: '',
      current: false
    };
    setResumeData(prev => ({
      ...prev,
      education: [...prev.education, newEdu]
    }));
  };

  const updateEducation = (id: string, field: keyof ResumeData['education'][0], value: string | boolean) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.map(edu =>
        edu.id === id ? { ...edu, [field]: value } : edu
      )
    }));
  };

  const deleteEducation = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.filter(edu => edu.id !== id)
    }));
  };

  // Helper functions for "Return to original" functionality
  const saveOriginalSummary = () => {
    if (!originalSummary) {
      setOriginalSummary(resumeData.summary);
    }
  };

  const saveOriginalExperience = (id: string) => {
    if (!originalExperience[id]) {
      const exp = resumeData.experience.find(e => e.id === id);
      if (exp) {
        setOriginalExperience(prev => ({ ...prev, [id]: exp.description }));
      }
    }
  };

  const saveOriginalEducation = (id: string) => {
    if (!originalEducation[id]) {
      const edu = resumeData.education.find(e => e.id === id);
      if (edu) {
        setOriginalEducation(prev => ({ ...prev, [id]: edu.details }));
      }
    }
  };

  const saveOriginalCustomSection = (id: string) => {
    if (!originalCustomSections[id]) {
      const section = resumeData.customSections.find(s => s.id === id);
      if (section) {
        setOriginalCustomSections(prev => ({ ...prev, [id]: section.content }));
      }
    }
  };

  const restoreOriginalSummary = () => {
    if (originalSummary) {
      updateSummary(originalSummary);
      setOriginalSummary('');
      toast.success('Restored to original content');
    }
  };

  const restoreOriginalExperience = (id: string) => {
    if (originalExperience[id]) {
      updateExperience(id, 'description', originalExperience[id]);
      setOriginalExperience(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
      toast.success('Restored to original content');
    }
  };

  const restoreOriginalEducation = (id: string) => {
    if (originalEducation[id]) {
      updateEducation(id, 'details', originalEducation[id]);
      setOriginalEducation(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
      toast.success('Restored to original content');
    }
  };

  const restoreOriginalCustomSection = (id: string) => {
    if (originalCustomSections[id]) {
      updateCustomSection(id, 'content', originalCustomSections[id]);
      setOriginalCustomSections(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
      toast.success('Restored to original content');
    }
  };

  // Links handlers
  const addLink = () => {
    const newLink = {
      id: `link-${Date.now()}`,
      label: '',
      url: ''
    };
    setResumeData(prev => ({
      ...prev,
      links: [...prev.links, newLink]
    }));
  };

  const updateLink = (id: string, field: 'label' | 'url', value: string) => {
    setResumeData(prev => ({
      ...prev,
      links: prev.links.map(link =>
        link.id === id ? { ...link, [field]: value } : link
      )
    }));
  };

  const deleteLink = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      links: prev.links.filter(link => link.id !== id)
    }));
  };

  // Custom section handlers
  const addCustomSection = () => {
    setShowAddSectionDialog(true);
  };

  const handleAddSection = (sectionId: string, title: string) => {
    // Handle Professional Summary as a core section, not a custom section
    if (sectionId === 'summary') {
      // Check if summary section already exists in section order
      const summaryExists = sectionOrder.some(s => s.type === 'summary');
      
      if (summaryExists) {
        toast.info('Professional Summary section already exists');
        setCurrentSection('summary');
        return;
      }
      
      // Add summary section to section order (insert after contact or at position 2)
      const contactIndex = sectionOrder.findIndex(s => s.type === 'contact');
      const insertIndex = contactIndex >= 0 ? contactIndex + 1 : 2;
      
      setSectionOrder(prev => {
        const newOrder = [...prev];
        newOrder.splice(insertIndex, 0, {
          id: 'summary',
          type: 'summary',
          label: 'Professional Summary',
          visible: true
        });
        return newOrder;
      });
      
      setCurrentSection('summary');
      toast.success('Professional Summary section added!');
      return;
    }
    
    // Handle other sections as custom sections
    const newSection = {
      id: sectionId,
      title: title,
      content: ''
    };
    setResumeData(prev => ({
      ...prev,
      customSections: [...prev.customSections, newSection]
    }));
    
    // Add to section order
    setSectionOrder(prev => [...prev, {
      id: newSection.id,
      type: 'customSections',
      label: newSection.title,
      visible: true
    }]);
    
    setCurrentSection(newSection.id);
    toast.success(`${title} section added!`);
  };

  const updateCustomSection = (id: string, field: 'title' | 'content', value: string) => {
    setResumeData(prev => ({
      ...prev,
      customSections: prev.customSections.map(section =>
        section.id === id ? { ...section, [field]: value } : section
      )
    }));
    
    // Update section order label if title changed
    if (field === 'title') {
      setSectionOrder(prev => prev.map(section =>
        section.id === id ? { ...section, label: value } : section
      ));
    }
  };

  const deleteCustomSection = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      customSections: prev.customSections.filter(section => section.id !== id)
    }));
    
    // Remove from section order
    setSectionOrder(prev => prev.filter(section => section.id !== id));
    
    // Navigate to previous section
    setCurrentSection('links');
  };

  // Section name editing handlers
  const startEditingSection = (sectionId: string, currentLabel: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSectionId(sectionId);
    setEditingSectionName(currentLabel);
  };

  const saveEditingSection = () => {
    if (!editingSectionId || !editingSectionName.trim()) {
      setEditingSectionId(null);
      return;
    }

    // Update section order label
    setSectionOrder(prev => prev.map(section =>
      section.id === editingSectionId ? { ...section, label: editingSectionName } : section
    ));

    // If it's a custom section, also update the title in resumeData
    setResumeData(prev => ({
      ...prev,
      customSections: prev.customSections.map(section =>
        section.id === editingSectionId ? { ...section, title: editingSectionName } : section
      )
    }));

    setEditingSectionId(null);
    toast.success('Section name updated');
  };

  const handleDeleteSection = (sectionId: string, sectionType: SectionType, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Find the section label for the toast message
    const sectionToDelete = sectionOrder.find(s => s.id === sectionId);
    const sectionLabel = sectionToDelete?.label || sectionType;
    
    // Handle deletion based on section type
    if (sectionType === 'customSections') {
      // Delete custom section data
      deleteCustomSection(sectionId);
    } else if (sectionType === 'experience') {
      // Clear all experience entries
      setResumeData(prev => ({ ...prev, experience: [] }));
    } else if (sectionType === 'education') {
      // Clear all education entries
      setResumeData(prev => ({ ...prev, education: [] }));
    } else if (sectionType === 'skills') {
      // Clear skills
      setResumeData(prev => ({ ...prev, skills: [], skillsRichText: '' }));
    } else if (sectionType === 'links') {
      // Clear links
      setResumeData(prev => ({ ...prev, links: [] }));
    } else if (sectionType === 'summary') {
      // Clear summary
      setResumeData(prev => ({ ...prev, summary: '' }));
    } else if (sectionType === 'personalDetails') {
      // Clear personal details
      setResumeData(prev => ({
        ...prev,
        personalDetails: {
          firstName: '',
          lastName: '',
          jobTitle: '',
          nationality: '',
          driversLicense: '',
          birthDate: '',
          photoUrl: ''
        }
      }));
    } else if (sectionType === 'contact') {
      // Clear contact info
      setResumeData(prev => ({
        ...prev,
        contact: {
          email: '',
          phone: '',
          address: '',
          linkedin: '',
          website: ''
        }
      }));
    }
    
    // Remove from section order
    setSectionOrder(prev => prev.filter(s => s.id !== sectionId));
    
    // If the deleted section was the current section, navigate to the first available section
    const isCurrentSection = sectionType === 'customSections' 
      ? currentSection === sectionId 
      : currentSection === sectionType;
    
    if (isCurrentSection) {
      const remainingSections = sectionOrder.filter(s => s.id !== sectionId);
      if (remainingSections.length > 0) {
        const firstSection = remainingSections[0];
        setCurrentSection(firstSection.type === 'customSections' ? firstSection.id : firstSection.type);
      }
    }
    
    toast.success(`${sectionLabel} section deleted`);
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedItem(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === index) return;

    const newOrder = [...sectionOrder];
    const draggedSection = newOrder[draggedItem];
    newOrder.splice(draggedItem, 1);
    newOrder.splice(index, 0, draggedSection);
    
    setDraggedItem(index);
    setSectionOrder(newOrder);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  // Navigate to settings when AI button clicked without selections
  const navigateToSettings = () => {
    // Show settings section
    setShowSettings(true);
    
    // Scroll to settings
    setTimeout(() => {
      settingsRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
      
      // Highlight settings with animation
      setHighlightSettings(true);
      
      // Remove highlight after animation
      setTimeout(() => {
        setHighlightSettings(false);
      }, 2000);
      
      // Focus on the first missing field
      setTimeout(() => {
        if (!industryTone && industryToneRef.current) {
          industryToneRef.current.click();
        } else if (!rewriteStyle && rewriteStyleRef.current) {
          rewriteStyleRef.current.click();
        }
      }, 300);
    }, 100);
    
    // Show toast message
    toast.info('Please select Industry Tone and Rewrite Style', {
      description: 'These settings are required to use AI optimization',
      duration: 3000
    });
  };

  // AI Improve dialog handlers
  const openImproveDialog = (
    content: string,
    sectionType: 'summary' | 'experience' | 'education' | 'skills' | 'custom',
    isList: boolean,
    callback: (improvedContent: string) => void,
    sectionId?: string // Optional section ID for tracking original content
  ) => {
    // Save original content before AI optimization
    if (sectionType === 'summary') {
      saveOriginalSummary();
    } else if (sectionType === 'experience' && sectionId) {
      saveOriginalExperience(sectionId);
    } else if (sectionType === 'education' && sectionId) {
      saveOriginalEducation(sectionId);
    } else if (sectionType === 'custom' && sectionId) {
      saveOriginalCustomSection(sectionId);
    }
    
    setImproveDialogContent(content);
    setImproveDialogSectionType(sectionType);
    setImproveDialogIsList(isList);
    setImproveDialogCallback(() => callback);
    setImproveDialogOpen(true);
  };

  // Generate professional summary from resume content
  const generateSummaryFromResume = async () => {
    setIsGeneratingSummary(true);
    
    // Save original summary before generating new one
    saveOriginalSummary();
    
    try {
      // Build context from resume data
      const resumeContext = buildResumeContext();
      
      // Call the improve-content endpoint with the resume context
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-bc1c5df9/generate-summary`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            resumeContext,
            industryTone,
            rewriteStyle,
            jobDescription: jobDescription || '',
          })
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        updateSummary(result.summary);
        toast.success('Professional summary generated successfully!');
      } else {
        toast.error(result.error || 'Failed to generate summary');
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      toast.error('Failed to generate summary');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // Build resume context for AI summary generation
  const buildResumeContext = () => {
    const context: string[] = [];
    
    // Add personal details
    if (resumeData.personalDetails.jobTitle) {
      context.push(`Job Title: ${resumeData.personalDetails.jobTitle}`);
    }
    
    // Add experience
    if (resumeData.experience && resumeData.experience.length > 0) {
      context.push('\nExperience:');
      resumeData.experience.forEach(exp => {
        if (exp.title || exp.company) {
          context.push(`- ${exp.title}${exp.company ? ' at ' + exp.company : ''}`);
          if (exp.description) {
            // Strip HTML tags for context
            const plainText = exp.description.replace(/<[^>]*>/g, '').trim();
            context.push(`  ${plainText}`);
          }
        }
      });
    }
    
    // Add education
    if (resumeData.education && resumeData.education.length > 0) {
      context.push('\nEducation:');
      resumeData.education.forEach(edu => {
        if (edu.degree || edu.institution) {
          context.push(`- ${edu.degree}${edu.institution ? ' from ' + edu.institution : ''}`);
        }
      });
    }
    
    // Add skills
    if (resumeData.skills && resumeData.skills.length > 0) {
      context.push(`\nSkills: ${resumeData.skills.join(', ')}`);
    }
    
    return context.join('\n');
  };

  const toggleSectionVisibility = (id: string) => {
    setSectionOrder(prev =>
      prev.map(section =>
        section.id === id ? { ...section, visible: !section.visible } : section
      )
    );
  };

  // Navigation items based on section order
  const getNavigationItems = () => {
    return sectionOrder.filter(section => section.visible);
  };

  // Navigate to next section
  const handleNextSection = () => {
    const visibleSections = getNavigationItems();
    const currentIndex = visibleSections.findIndex(s => 
      s.type === 'customSections' ? s.id === currentSection : s.type === currentSection
    );
    if (currentIndex < visibleSections.length - 1) {
      const nextSection = visibleSections[currentIndex + 1];
      setCurrentSection(nextSection.type === 'customSections' ? nextSection.id : nextSection.type);
    }
  };

  // Navigate to previous section
  const handlePreviousSection = () => {
    const visibleSections = getNavigationItems();
    const currentIndex = visibleSections.findIndex(s => 
      s.type === 'customSections' ? s.id === currentSection : s.type === currentSection
    );
    if (currentIndex > 0) {
      const prevSection = visibleSections[currentIndex - 1];
      setCurrentSection(prevSection.type === 'customSections' ? prevSection.id : prevSection.type);
    }
  };

  // Track which section is being given feedback
  const [currentFeedbackSection, setCurrentFeedbackSection] = useState<string>('');
  const [isUpdatingFeedback, setIsUpdatingFeedback] = useState<boolean>(false);

  // Get or create feedback cache key for this session
  const getFeedbackCacheKey = () => {
    let sessionId = localStorage.getItem('feedbackSessionId');
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('feedbackSessionId', sessionId);
    }
    return `feedbackCache_${sessionId}`;
  };

  // Get cached feedback for a section
  const getCachedFeedback = (sectionId: string) => {
    const cacheKey = getFeedbackCacheKey();
    const cache = JSON.parse(localStorage.getItem(cacheKey) || '{}');
    return cache[sectionId] || null;
  };

  // Store feedback in cache
  const cacheFeedback = (sectionId: string, feedbackData: any) => {
    const cacheKey = getFeedbackCacheKey();
    const cache = JSON.parse(localStorage.getItem(cacheKey) || '{}');
    cache[sectionId] = feedbackData;
    localStorage.setItem(cacheKey, JSON.stringify(cache));
  };

  // Helper function to send feedback to backend
  const sendFeedbackToBackend = async (
    sectionId: string, 
    isPositive: boolean, 
    comment?: string
  ) => {
    try {
      // Extract section type from section_id
      // e.g., "experience-123" -> "experience", "summary" -> "summary"
      const sectionType = sectionId.includes('-') 
        ? sectionId.split('-')[0] 
        : sectionId;

      // Get parsed content for this section
      let parsedContent = null;
      if (sectionId === 'personalDetails') {
        parsedContent = resumeData.personalDetails;
      } else if (sectionId === 'contact') {
        parsedContent = resumeData.contact;
      } else if (sectionId === 'summary') {
        parsedContent = { summary: resumeData.summary };
      } else if (sectionId === 'skills') {
        parsedContent = { skills: resumeData.skills };
      } else if (sectionId.startsWith('experience-')) {
        const expId = sectionId.replace('experience-', '');
        parsedContent = resumeData.experience.find(exp => exp.id === expId);
      } else if (sectionId.startsWith('education-')) {
        const eduId = sectionId.replace('education-', '');
        parsedContent = resumeData.education.find(edu => edu.id === eduId);
      } else if (sectionId === 'projects') {
        parsedContent = { projects: resumeData.projects };
      } else if (sectionId === 'certifications') {
        parsedContent = { certifications: resumeData.certifications };
      } else if (sectionId === 'awards') {
        parsedContent = { awards: resumeData.awards };
      }

      // Get or create session ID
      let sessionId = localStorage.getItem('feedbackSessionId');
      if (!sessionId) {
        sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('feedbackSessionId', sessionId);
      }

      const feedbackData = {
        section_id: sectionId,
        section_type: sectionType,
        is_positive: isPositive,
        comment: comment || null,
        parsed_content: parsedContent,
        session_id: sessionId,
      };

      // Check if feedback already exists in cache (has dbId)
      const cachedFeedback = getCachedFeedback(sectionId);
      const existingDbId = cachedFeedback?.dbId;

      let response;
      
      if (existingDbId) {
        // UPDATE existing feedback
        console.log('📝 Updating existing feedback in backend:', existingDbId, feedbackData);
        response = await apiClient.updateFeedback(existingDbId, feedbackData);
      } else {
        // CREATE new feedback
        console.log('📤 Creating new feedback in backend:', feedbackData);
        response = await apiClient.submitFeedback(feedbackData);
      }

      console.log('📥 Backend response:', response);

      if (!response.success) {
        console.error('❌ Failed to save feedback to backend:', response.error);
        toast.error('Failed to save feedback to database');
        return false;
      }

      const actionVerb = existingDbId ? 'updated' : 'created';
      console.log(`✅ Feedback ${actionVerb} successfully`);
      
      // Cache the feedback with the response data
      cacheFeedback(sectionId, {
        ...feedbackData,
        timestamp: Date.now(),
        dbId: existingDbId || response.data?.[0]?.id
      });

      return true;
    } catch (error) {
      console.error('❌ Error sending feedback to backend:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to save feedback: ${errorMessage}`);
      return false;
    }
  };

  // Feedback handling
  const handleThumbsUp = async (sectionId: string) => {
    setSectionFeedback(prev => ({ ...prev, [sectionId]: 'up' }));
    
    // Send to backend and cache
    const success = await sendFeedbackToBackend(sectionId, true);
    
    if (success) {
      toast.success('Thank you for your feedback!');
    }
    
    // Store positive feedback in localStorage as backup
    const existingFeedback = JSON.parse(localStorage.getItem('aiParsingFeedback') || '[]');
    existingFeedback.push({
      section: sectionId,
      type: 'positive',
      timestamp: Date.now()
    });
    localStorage.setItem('aiParsingFeedback', JSON.stringify(existingFeedback));
  };

  const handleThumbsDown = (sectionId: string) => {
    setSectionFeedback(prev => ({ ...prev, [sectionId]: 'down' }));
    setCurrentFeedbackSection(sectionId);
    
    // Check if there's existing feedback for this section
    const cachedFeedback = getCachedFeedback(sectionId);
    if (cachedFeedback && !cachedFeedback.is_positive) {
      // User has already submitted negative feedback, load it
      setFeedbackReason(cachedFeedback.comment || '');
      setIsUpdatingFeedback(true);
      toast.info('Loading your previous feedback for this section');
    } else {
      setFeedbackReason('');
      setIsUpdatingFeedback(false);
    }
    
    setShowFeedbackDialog(true);
  };

  const submitFeedback = async () => {
    if (!feedbackReason.trim()) {
      toast.error('Please provide a reason for your feedback');
      return;
    }

    // Send to backend and cache
    const success = await sendFeedbackToBackend(currentFeedbackSection, false, feedbackReason);

    if (success) {
      if (isUpdatingFeedback) {
        toast.success('Your feedback has been updated!');
      } else {
        toast.success('Thank you for helping us improve!');
      }
    }

    // Store negative feedback with reason in localStorage as backup
    const existingFeedback = JSON.parse(localStorage.getItem('aiParsingFeedback') || '[]');
    existingFeedback.push({
      section: currentFeedbackSection,
      type: 'negative',
      reason: feedbackReason,
      timestamp: Date.now()
    });
    localStorage.setItem('aiParsingFeedback', JSON.stringify(existingFeedback));

    setShowFeedbackDialog(false);
    setFeedbackReason('');
    setCurrentFeedbackSection('');
    setIsUpdatingFeedback(false);
  };

  // Finalize and go to next screen
  const handleFinish = async () => {
    if (!industryTone || !rewriteStyle) {
      toast.error('Please select Industry Tone and Rewrite Style');
      setShowSettings(true);
      return;
    }

    const finalResume = generateResumeText(resumeData);
    onNext(finalResume);
  };

  // Check if we're on the first/last section
  const isFirstSection = () => {
    const visibleSections = getNavigationItems();
    const firstSection = visibleSections[0];
    if (!firstSection) return false;
    return firstSection.type === 'customSections' ? firstSection.id === currentSection : firstSection.type === currentSection;
  };

  const isLastSection = () => {
    const visibleSections = getNavigationItems();
    const lastSection = visibleSections[visibleSections.length - 1];
    if (!lastSection) return false;
    return lastSection.type === 'customSections' ? lastSection.id === currentSection : lastSection.type === currentSection;
  };

  const generateResumeText = (data: ResumeData): string => {
    let text = '';

    // Generate based on section order
    sectionOrder.forEach(section => {
      if (!section.visible) return;

      switch (section.type) {
        case 'personalDetails':
          text += `${data.personalDetails.firstName} ${data.personalDetails.lastName}\n`;
          if (data.personalDetails.jobTitle) {
            text += `${data.personalDetails.jobTitle}\n`;
          }
          // Add additional personal details if present
          const additionalDetails = [];
          if (data.personalDetails.nationality) additionalDetails.push(`Nationality: ${data.personalDetails.nationality}`);
          if (data.personalDetails.driversLicense) additionalDetails.push(`Driver's License: ${data.personalDetails.driversLicense}`);
          if (data.personalDetails.birthDate) additionalDetails.push(`Date of Birth: ${data.personalDetails.birthDate}`);
          if (additionalDetails.length > 0) {
            text += additionalDetails.join(' | ') + '\n';
          }
          text += '\n';
          break;

        case 'contact':
          const contactParts = [];
          if (data.contact.email) contactParts.push(data.contact.email);
          if (data.contact.phone) contactParts.push(data.contact.phone);
          if (data.contact.address) contactParts.push(data.contact.address);
          if (data.contact.linkedin) contactParts.push(data.contact.linkedin);
          if (data.contact.website) contactParts.push(data.contact.website);
          if (contactParts.length > 0) {
            text += contactParts.join(' | ') + '\n\n';
          }
          break;

        case 'summary':
          if (data.summary) {
            text += 'PROFESSIONAL SUMMARY\n';
            text += data.summary + '\n\n';
          }
          break;

        case 'experience':
          if (data.experience.length > 0) {
            text += 'EMPLOYMENT HISTORY\n\n';
            data.experience.forEach(exp => {
              text += `${exp.title}\n`;
              text += `${exp.company}`;
              if (exp.location) text += ` | ${exp.location}`;
              text += '\n';
              if (exp.startDate || exp.endDate) {
                text += `${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}\n`;
              }
              text += exp.description + '\n\n';
            });
          }
          break;

        case 'education':
          if (data.education.length > 0) {
            text += 'EDUCATION\n\n';
            data.education.forEach(edu => {
              text += `${edu.degree}\n`;
              text += `${edu.institution}`;
              if (edu.location) text += ` | ${edu.location}`;
              text += '\n';
              if (edu.startDate || edu.endDate) {
                text += `${edu.startDate} - ${edu.current ? 'Present' : edu.endDate}\n`;
              }
              if (edu.details) text += edu.details + '\n';
              text += '\n';
            });
          }
          break;

        case 'skills':
          if (data.skills.length > 0) {
            text += 'SKILLS\n';
            text += data.skills.join(', ') + '\n\n';
          }
          break;

        case 'links':
          if (data.links.length > 0) {
            text += 'LINKS\n';
            data.links.forEach(link => {
              text += `${link.label}: ${link.url}\n`;
            });
            text += '\n';
          }
          break;

        case 'customSections':
          // Find custom section by id
          const customSection = data.customSections.find(cs => cs.id === section.id);
          if (customSection && customSection.content) {
            text += customSection.title.toUpperCase() + '\n';
            // Strip HTML tags for plain text export
            const plainContent = customSection.content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
            text += plainContent + '\n\n';
          }
          break;
      }
    });

    return text;
  };

  // Helper function to render processed content items with proper header styling
  const renderProcessedItem = (item: any, idx: number, allItems: any[]) => {
    const indent = item.indent || 0;
    const marginLeft = indent * 24;
    
    // Skip items with no content
    if (!item.content || !item.content.trim()) {
      return null;
    }
    
    // Render headers with special styling
    if (item.type === 'header') {
      return (
        <div 
          key={idx} 
          className="font-semibold text-gray-900 mt-3 mb-1 text-sm" 
          style={{ marginLeft: `${marginLeft}px` }}
          dangerouslySetInnerHTML={{ __html: item.content }} 
        />
      );
    }
    
    if (item.type === 'subheader') {
      return (
        <div 
          key={idx} 
          className="text-sm text-gray-800 mb-1" 
          style={{ marginLeft: `${marginLeft}px` }}
          dangerouslySetInnerHTML={{ __html: item.content }} 
        />
      );
    }
    
    if (item.type === 'bullet') {
      // Determine bullet character based on style
      let bulletChar = '•';
      if (item.bulletStyle === 'number') {
        // Count how many numbered items at this indent level we've seen so far
        const numberedItemsBeforeThis = allItems
          .slice(0, idx)
          .filter(prevItem => 
            prevItem.type === 'bullet' && 
            prevItem.bulletStyle === 'number' && 
            (prevItem.indent || 0) === indent
          ).length;
        bulletChar = `${numberedItemsBeforeThis + 1}.`;
      } else if (item.bulletStyle === 'hollow') {
        bulletChar = '○';
      }
      
      // Apply header styling if this bullet is a header
      const bulletClasses = item.isHeader && item.headerLevel === 2 
        ? "flex items-start gap-2 mb-1" 
        : "flex items-start gap-2 mb-1";
      
      return (
        <div key={idx} className={bulletClasses} style={{ marginLeft: `${marginLeft}px` }}>
          <span className="text-gray-600 mt-0.5 min-w-[20px]">{bulletChar}</span>
          <span className="flex-1" dangerouslySetInnerHTML={{ __html: item.content }} />
        </div>
      );
    }
    
    // Regular text
    return (
      <div 
        key={idx} 
        className="mb-1" 
        style={{ marginLeft: `${marginLeft}px` }} 
        dangerouslySetInnerHTML={{ __html: item.content }} 
      />
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Settings Panel */}
      {showSettings && (
        <div 
          ref={settingsRef}
          className="bg-white border-b shadow-sm p-6"
        >
          {/* 90% width, centered - cross-browser compatible (Chrome, Safari, Firefox, Edge) */}
          <div style={{ width: '90%', maxWidth: '1800px', marginLeft: 'auto', marginRight: 'auto' }}>
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <Button onClick={() => onBack(resumeData)} variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                
                <div className="flex items-center gap-2">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl">AI Resume Optimization</h2>
                </div>
                
                <Button 
                  onClick={() => {
                    if (optimizationFlow === 'direct') {
                      onPreview();
                    } else {
                      // For 'withJob' flow, go to job description page
                      onBack();
                    }
                  }} 
                  variant="ghost" 
                  size="sm"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
              <p className="text-sm text-gray-600 text-center">Review and accept AI-generated improvements</p>
            </div>

            <div className={`grid grid-cols-2 gap-6 p-4 rounded-lg border-2 transition-all duration-500 ${
              highlightSettings ? 'border-amber-400 bg-amber-50 shadow-lg' : 'border-transparent'
            }`}>
              <div>
                <Label htmlFor="industry-tone" className="text-sm mb-2 inline-block">
                  Industry Tone <span className="text-red-500">*</span>
                </Label>
                <Select value={industryTone} onValueChange={setIndustryTone}>
                  <SelectTrigger 
                    ref={industryToneRef}
                    id="industry-tone"
                  >
                    <SelectValue placeholder="Select an industry tone..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="creative">Creative</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="executive">Executive</SelectItem>
                  </SelectContent>
                </Select>
                {!industryTone && (
                  <div className="flex items-start gap-2 mt-2 text-sm" style={{ color: '#ea580c' }}>
                    <span style={{ color: '#f97316' }}>⚠</span>
                    <span>Please select an industry tone to adjust the language style</span>
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="rewrite-style" className="text-sm mb-2 inline-block">
                  Rewrite Style <span className="text-red-500">*</span>
                </Label>
                <Select value={rewriteStyle} onValueChange={setRewriteStyle}>
                  <SelectTrigger 
                    ref={rewriteStyleRef}
                    id="rewrite-style"
                  >
                    <SelectValue placeholder="Select a rewrite style..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="concise">Concise</SelectItem>
                    <SelectItem value="detailed">Detailed</SelectItem>
                    <SelectItem value="balanced">Balanced</SelectItem>
                    <SelectItem value="achievement">Achievement-focused</SelectItem>
                  </SelectContent>
                </Select>
                {!rewriteStyle && (
                  <div className="flex items-start gap-2 mt-2 text-sm" style={{ color: '#ea580c' }}>
                    <span style={{ color: '#f97316' }}>⚠</span>
                    <span>Please select a rewrite style to determine the level of detail</span>
                  </div>
                )}
              </div>
            </div>

            {isOptimizing && (
              <div className="mt-4 flex items-center gap-2 text-blue-600">
                <Sparkles className="w-4 h-4 animate-pulse" />
                <span className="text-sm">AI is optimizing your resume...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main content container - 90% width, centered for all browsers (Chrome, Safari, Firefox, Edge) */}
      <div style={{ width: '90%', maxWidth: '1800px', marginLeft: 'auto', marginRight: 'auto', paddingLeft: '1rem', paddingRight: '1rem' }}>
        {/* Review Note */}
        <div className="py-3 flex items-center gap-2 text-blue-600">
          <FileText className="w-4 h-4" />
          <span className="text-sm">Review and edit each section of your resume. Make sure all information is accurate before proceeding to optimization.</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'row', height: 'calc(100vh - 80px)', width: '100%' }}>
        {/* Left Sidebar Navigation - ratio 1 (1:2.5:2.5 layout for all browsers: Chrome, Safari, Firefox, Edge) */}
        <div className="bg-white border-r" style={{ flex: '1 1 0%', minWidth: '180px', maxWidth: '280px' }}>
          <ScrollArea className="h-full">
            <div className="p-4 space-y-1">
              {getNavigationItems().map((item) => {
                const iconConfig = {
                  personalDetails: { Icon: User, color: 'text-blue-600 bg-blue-100' },
                  contact: { Icon: Phone, color: 'text-green-600 bg-green-100' },
                  summary: { Icon: FileText, color: 'text-purple-600 bg-purple-100' },
                  experience: { Icon: Briefcase, color: 'text-orange-600 bg-orange-100' },
                  education: { Icon: GraduationCap, color: 'text-indigo-600 bg-indigo-100' },
                  skills: { Icon: Wrench, color: 'text-red-600 bg-red-100' },
                  links: { Icon: Link2, color: 'text-teal-600 bg-teal-100' },
                  customSections: { Icon: FileText, color: 'text-pink-600 bg-pink-100' }
                };
                const { Icon, color } = iconConfig[item.type];
                const isEditing = editingSectionId === item.id;
                
                const isSelected = item.type === 'customSections' 
                  ? currentSection === item.id 
                  : currentSection === item.type;
                
                const isHovered = hoveredSectionId === item.id;
                const showButtons = isHovered && !isEditing;
                
                return (
                  <div
                    key={item.id}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg transition-colors ${
                      isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                    onMouseEnter={() => setHoveredSectionId(item.id)}
                    onMouseLeave={() => setHoveredSectionId(null)}
                  >
                    <button
                      onClick={() => {
                        if (!isEditing) {
                          // For custom sections, use the section ID, not the type
                          setCurrentSection(item.type === 'customSections' ? item.id : item.type);
                        }
                      }}
                      className="flex items-center gap-2 flex-1 min-w-0"
                    >
                      <div className={`p-1.5 rounded-md ${color} flex-shrink-0`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      {isEditing ? (
                        <Input
                          value={editingSectionName}
                          onChange={(e) => setEditingSectionName(e.target.value)}
                          onBlur={saveEditingSection}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              saveEditingSection();
                            } else if (e.key === 'Escape') {
                              setEditingSectionId(null);
                            }
                          }}
                          className="h-7 text-sm flex-1"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className={`text-sm truncate ${
                          isSelected ? 'text-blue-600' : 'text-gray-700'
                        }`}>
                          {item.label}
                        </span>
                      )}
                    </button>
                    {/* Edit and Delete buttons - only shown on hover */}
                    {showButtons && (
                      <div className="flex items-center gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={(e) => startEditingSection(item.id, item.label, e)}
                                className="p-1 hover:bg-gray-200 rounded"
                              >
                                <Pencil className="w-3 h-3 text-gray-500" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Edit section name</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={(e) => handleDeleteSection(item.id, item.type, e)}
                                className="p-1 hover:bg-red-100 rounded"
                              >
                                <Trash2 className="w-3 h-3 text-red-500" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Delete section</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    )}
                  </div>
                );
              })}
              <Separator className="my-2" />
              <button
                onClick={addCustomSection}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-700"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">Additional Section</span>
              </button>
              
              {/* AI HR Suggestions Button - Only show when NO job description */}
              {!jobDescription && (
                <div className="relative mt-2">
                  <button
                    onClick={() => setShowAIHRSuggestions(true)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-md pr-12"
                  >
                    <Sparkles className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm flex-1 text-left">Get AI HR suggestions</span>
                  </button>
                  {/* Regenerate button - positioned on the right */}
                  {cachedAISuggestions && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setForceRegenerateAI(true);
                        setShowAIHRSuggestions(true);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-white/20 rounded transition-colors"
                      title="Regenerate AI suggestions"
                    >
                      <RefreshCw className="w-4 h-4 text-white" />
                    </button>
                  )}
                </div>
              )}
              
              {/* Job Match Score Button - Only show when job description is provided */}
              {jobDescription && (
                <div className="relative mt-2">
                  <button
                    onClick={() => setShowJobMatchScore(true)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md pr-12"
                  >
                    <Sparkles className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm flex-1 text-left">Analyze job match with our AI HR</span>
                  </button>
                  {/* Regenerate button - positioned on the right */}
                  {cachedJobMatchScore && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setForceRegenerateMatch(true);
                        setShowJobMatchScore(true);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-white/20 rounded transition-colors"
                      title="Regenerate job match score"
                    >
                      <RefreshCw className="w-4 h-4 text-white" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Center - Editing Area - ratio 2.5 (or 5 when preview hidden) for all browsers: Chrome, Safari, Firefox, Edge */}
        <div className="overflow-auto" style={{ flex: isPreviewVisible ? '2.5 1 0%' : '5 1 0%' }}>
          <div className="px-8 pt-4 pb-8 max-w-none">
            {/* Toggle Preview Button */}
            <div className="flex justify-end mb-4">
              <Button
                variant="default"
                size="sm"
                onClick={() => setIsPreviewVisible(!isPreviewVisible)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md"
              >
                {isPreviewVisible ? (
                  <>
                    <PanelRightClose className="w-4 h-4" />
                    Hide Preview
                  </>
                ) : (
                  <>
                    <PanelRightOpen className="w-4 h-4" />
                    Show Preview
                  </>
                )}
              </Button>
            </div>

            <Card className="p-8">
              {/* Personal Details Section */}
              {currentSection === 'personalDetails' && (
                <div className="space-y-6">
                  <div>
                    <h2>Personal details</h2>
                    <p className="text-gray-600 mt-2">
                      Personal details such as name and job title are essential in a resume to
                      give the recruiter a quick overview of the candidate.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First name</Label>
                      <Input
                        id="firstName"
                        value={resumeData.personalDetails.firstName}
                        onChange={(e) => updatePersonalDetails('firstName', e.target.value)}
                        placeholder="e.g., John"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last name</Label>
                      <Input
                        id="lastName"
                        value={resumeData.personalDetails.lastName}
                        onChange={(e) => updatePersonalDetails('lastName', e.target.value)}
                        placeholder="e.g., Smith"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="jobTitle">Desired job title</Label>
                    <Input
                      id="jobTitle"
                      value={resumeData.personalDetails.jobTitle}
                      onChange={(e) => updatePersonalDetails('jobTitle', e.target.value)}
                      placeholder="e.g., Product Designer"
                    />
                  </div>

                  <div>
                    {resumeData.personalDetails.photoUrl ? (
                      <div className="space-y-2">
                        <div className="relative w-32 h-32 mx-auto">
                          <img
                            src={resumeData.personalDetails.photoUrl}
                            alt="Profile"
                            className="w-full h-full object-cover rounded-full border-4 border-gray-200"
                          />
                        </div>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => setShowPhotoDialog(true)}
                        >
                          <Camera className="w-4 h-4 mr-2" />
                          Change photo
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setShowPhotoDialog(true)}
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Add photo
                      </Button>
                    )}
                  </div>

                  <Separator />

                  <button
                    onClick={() => setShowAdditionalDetails(!showAdditionalDetails)}
                    className="flex items-center gap-2 text-sm hover:underline"
                  >
                    {showAdditionalDetails ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                    {showAdditionalDetails ? 'Hide' : 'Show'} additional details
                  </button>

                  {showAdditionalDetails && (
                    <div className="space-y-4 pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="nationality">Nationality</Label>
                          <Input
                            id="nationality"
                            value={resumeData.personalDetails.nationality}
                            onChange={(e) => updatePersonalDetails('nationality', e.target.value)}
                            placeholder="e.g., American"
                          />
                        </div>
                        <div>
                          <Label htmlFor="driversLicense">Driver's License</Label>
                          <Input
                            id="driversLicense"
                            value={resumeData.personalDetails.driversLicense}
                            onChange={(e) => updatePersonalDetails('driversLicense', e.target.value)}
                            placeholder="e.g., D74837465"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="birthDate">Birth date</Label>
                        <Input
                          id="birthDate"
                          value={resumeData.personalDetails.birthDate}
                          onChange={(e) => updatePersonalDetails('birthDate', e.target.value)}
                          placeholder="e.g., 03 Feb 1996"
                        />
                      </div>
                    </div>
                  )}
                  
                  <FeedbackButtons
                    sectionId="personalDetails"
                    currentFeedback={sectionFeedback['personalDetails'] as 'up' | 'down' | undefined}
                    onThumbsUp={handleThumbsUp}
                    onThumbsDown={handleThumbsDown}
                    className="mt-6"
                  />
                </div>
              )}

              {/* Contact Information Section */}
              {currentSection === 'contact' && (
                <div className="space-y-6">
                  <div>
                    <h2>Contact information</h2>
                    <p className="text-gray-600 mt-2">
                      Make sure your contact information is current and professional.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={resumeData.contact.email}
                      onChange={(e) => updateContact('email', e.target.value)}
                      placeholder="e.g., john.doe@email.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={resumeData.contact.phone}
                      onChange={(e) => updateContact('phone', e.target.value)}
                      placeholder="e.g., (555) 123-4567"
                    />
                  </div>

                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={resumeData.contact.address}
                      onChange={(e) => updateContact('address', e.target.value)}
                      placeholder="e.g., San Francisco, CA"
                    />
                  </div>

                  <div>
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <Input
                      id="linkedin"
                      value={resumeData.contact.linkedin}
                      onChange={(e) => updateContact('linkedin', e.target.value)}
                      placeholder="e.g., linkedin.com/in/johndoe"
                    />
                  </div>

                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={resumeData.contact.website}
                      onChange={(e) => updateContact('website', e.target.value)}
                      placeholder="e.g., www.johndoe.com"
                    />
                  </div>
                  
                  <FeedbackButtons
                    sectionId="contact"
                    currentFeedback={sectionFeedback['contact'] as 'up' | 'down' | undefined}
                    onThumbsUp={handleThumbsUp}
                    onThumbsDown={handleThumbsDown}
                    className="mt-6"
                  />
                </div>
              )}

              {/* Professional Summary Section */}
              {currentSection === 'summary' && (
                <div className="space-y-6">
                  <div>
                    <h2>Professional summary</h2>
                    <p className="text-gray-600 mt-2">
                      A brief overview of your professional background and key qualifications.
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="summary">Summary</Label>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                          onClick={() => {
                            if (industryTone && rewriteStyle) {
                              // Generate summary from entire resume if empty, otherwise improve existing
                              if (!resumeData.summary || !resumeData.summary.trim()) {
                                generateSummaryFromResume();
                              } else {
                                openImproveDialog(
                                  resumeData.summary,
                                  'summary',
                                  false,
                                  (improvedContent) => updateSummary(improvedContent)
                                );
                              }
                            } else {
                              navigateToSettings();
                            }
                          }}
                          disabled={isGeneratingSummary}
                        >
                          {isGeneratingSummary ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Generating AI suggestions...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              {!resumeData.summary || !resumeData.summary.trim() ? 'Generate with AI' : 'Improve with AI'}
                            </>
                          )}
                        </Button>
                        {originalSummary && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={restoreOriginalSummary}
                          >
                            Return to original
                          </Button>
                        )}
                      </div>
                    </div>
                    <RichTextEditor
                      value={resumeData.summary}
                      onChange={(value) => updateSummary(value)}
                      placeholder="e.g., Results-driven professional with 5+ years of experience in software development..."
                      minHeight="150px"
                    />
                    {industryTone && rewriteStyle && (
                      <p className="text-xs text-gray-500 mt-2">
                        AI will {!resumeData.summary || !resumeData.summary.trim() ? 'generate' : 'optimize'} this using {industryTone} tone with {rewriteStyle} style{jobDescription ? ' and job description' : ''}
                      </p>
                    )}
                    
                    <FeedbackButtons
                      sectionId="summary"
                      currentFeedback={sectionFeedback['summary'] as 'up' | 'down' | undefined}
                      onThumbsUp={handleThumbsUp}
                      onThumbsDown={handleThumbsDown}
                      className="mt-4"
                    />
                  </div>
                </div>
              )}

              {/* Experience Section */}
              {currentSection === 'experience' && (
                <div className="space-y-6">
                  <div>
                    <h2>Employment history</h2>
                    <p className="text-gray-600 mt-2">
                      List your work experience in reverse chronological order (most recent first).
                    </p>
                  </div>

                  {resumeData.experience.map((exp, index) => (
                    <Card key={exp.id} className="p-6 bg-gray-50">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium">Experience {index + 1}</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteExperience(exp.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label>Job title</Label>
                          <Input
                            value={exp.title}
                            onChange={(e) => updateExperience(exp.id, 'title', e.target.value)}
                            placeholder="e.g., Senior Software Engineer"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Company</Label>
                            <Input
                              value={exp.company}
                              onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                              placeholder="e.g., Tech Corp"
                            />
                          </div>
                          <div>
                            <Label>Location</Label>
                            <Input
                              value={exp.location}
                              onChange={(e) => updateExperience(exp.id, 'location', e.target.value)}
                              placeholder="e.g., San Francisco, CA"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Start date</Label>
                            <Input
                              value={exp.startDate}
                              onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                              placeholder="e.g., Jan 2020"
                            />
                          </div>
                          <div>
                            <Label>End date</Label>
                            <div className="space-y-2">
                              <Input
                                value={exp.endDate}
                                onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                                placeholder="e.g., Dec 2023"
                                disabled={exp.current}
                              />
                              <label className="flex items-center gap-2 text-sm">
                                <input
                                  type="checkbox"
                                  checked={exp.current}
                                  onChange={(e) => updateExperience(exp.id, 'current', e.target.checked)}
                                  className="rounded"
                                />
                                Currently working here
                              </label>
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label>Description</Label>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                                onClick={() => {
                                  if (!exp.description || !exp.description.trim()) {
                                    toast.warning('Please add some content first', {
                                      description: 'Add your job description before using AI improvement'
                                    });
                                    return;
                                  }
                                  if (industryTone && rewriteStyle) {
                                    // Check if description contains bullets
                                    const hasBullets = exp.description.includes('•') || exp.description.includes('<li>');
                                    openImproveDialog(
                                      exp.description,
                                      'experience',
                                      hasBullets,
                                      (improvedContent) => updateExperience(exp.id, 'description', improvedContent),
                                      exp.id
                                    );
                                  } else {
                                    navigateToSettings();
                                  }
                                }}
                              >
                                <Sparkles className="w-4 h-4 mr-2" />
                                Improve with AI
                              </Button>
                              {originalExperience[exp.id] && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => restoreOriginalExperience(exp.id)}
                                >
                                  Return to original
                                </Button>
                              )}
                            </div>
                          </div>
                          <RichTextEditor
                            value={exp.description}
                            onChange={(value) => updateExperience(exp.id, 'description', value)}
                            placeholder="e.g., • Led development of new features that increased user engagement by 30%&#10;• Managed team of 5 developers..."
                            minHeight="120px"
                          />
                        </div>
                        
                        <FeedbackButtons
                          sectionId={`experience-${exp.id}`}
                          currentFeedback={sectionFeedback[`experience-${exp.id}`] as 'up' | 'down' | undefined}
                          onThumbsUp={handleThumbsUp}
                          onThumbsDown={handleThumbsDown}
                        />
                      </div>
                    </Card>
                  ))}

                  <Button variant="outline" className="w-full" onClick={addExperience}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add experience
                  </Button>
                </div>
              )}

              {/* Education Section */}
              {currentSection === 'education' && (
                <div className="space-y-6">
                  <div>
                    <h2>Education</h2>
                    <p className="text-gray-600 mt-2">
                      Include your educational background and qualifications.
                    </p>
                  </div>

                  {resumeData.education.map((edu, index) => (
                    <Card key={edu.id} className="p-6 bg-gray-50">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium">Education {index + 1}</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteEducation(edu.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label>Degree</Label>
                          <Input
                            value={edu.degree}
                            onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                            placeholder="e.g., Bachelor of Science in Computer Science"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Institution</Label>
                            <Input
                              value={edu.institution}
                              onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                              placeholder="e.g., University of California"
                            />
                          </div>
                          <div>
                            <Label>Location</Label>
                            <Input
                              value={edu.location}
                              onChange={(e) => updateEducation(edu.id, 'location', e.target.value)}
                              placeholder="e.g., Berkeley, CA"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Start date</Label>
                            <Input
                              value={edu.startDate}
                              onChange={(e) => updateEducation(edu.id, 'startDate', e.target.value)}
                              placeholder="e.g., Sep 2016"
                            />
                          </div>
                          <div>
                            <Label>End date</Label>
                            <div className="space-y-2">
                              <Input
                                value={edu.endDate}
                                onChange={(e) => updateEducation(edu.id, 'endDate', e.target.value)}
                                placeholder="e.g., May 2020"
                                disabled={edu.current}
                              />
                              <label className="flex items-center gap-2 text-sm">
                                <input
                                  type="checkbox"
                                  checked={edu.current}
                                  onChange={(e) => updateEducation(edu.id, 'current', e.target.checked)}
                                  className="rounded"
                                />
                                Currently studying
                              </label>
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label>Details (GPA, honors, coursework)</Label>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                                onClick={() => {
                                  if (!edu.details || !edu.details.trim()) {
                                    toast.warning('Please add some content first', {
                                      description: 'Add education details before using AI improvement'
                                    });
                                    return;
                                  }
                                  if (industryTone && rewriteStyle) {
                                    const hasBullets = edu.details.includes('•') || edu.details.includes('<li>');
                                    openImproveDialog(
                                      edu.details,
                                      'education',
                                      hasBullets,
                                      (improvedContent) => updateEducation(edu.id, 'details', improvedContent),
                                      edu.id
                                    );
                                  } else {
                                    navigateToSettings();
                                  }
                                }}
                              >
                                <Sparkles className="w-4 h-4 mr-2" />
                                Improve with AI
                              </Button>
                              {originalEducation[edu.id] && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => restoreOriginalEducation(edu.id)}
                                >
                                  Return to original
                                </Button>
                              )}
                            </div>
                          </div>
                          <RichTextEditor
                            value={edu.details}
                            onChange={(value) => updateEducation(edu.id, 'details', value)}
                            placeholder="e.g., GPA: 3.8/4.0, Dean's List, Relevant coursework: Data Structures, Algorithms..."
                            minHeight="100px"
                          />
                        </div>
                        
                        <FeedbackButtons
                          sectionId={`education-${edu.id}`}
                          currentFeedback={sectionFeedback[`education-${edu.id}`] as 'up' | 'down' | undefined}
                          onThumbsUp={handleThumbsUp}
                          onThumbsDown={handleThumbsDown}
                        />
                      </div>
                    </Card>
                  ))}

                  <Button variant="outline" className="w-full" onClick={addEducation}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add education
                  </Button>
                </div>
              )}

              {/* Skills Section */}
              {currentSection === 'skills' && (
                <div className="space-y-6">
                  <div>
                    <h2>Skills</h2>
                    <p className="text-gray-600 mt-2">
                      List your relevant skills and competencies. You can use bullet points or organize by category.
                    </p>
                  </div>
                  <div>
                    <div className="flex justify-end mb-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                        onClick={() => {
                          if (!resumeData.skillsRichText || !resumeData.skillsRichText.trim()) {
                            toast.warning('Please add some content first', {
                              description: 'Add your skills before using AI improvement'
                            });
                            return;
                          }
                          if (industryTone && rewriteStyle) {
                            const hasBullets = resumeData.skillsRichText.includes('•') || resumeData.skillsRichText.includes('<li>');
                            openImproveDialog(
                              resumeData.skillsRichText,
                              'skills',
                              hasBullets,
                              (improvedContent) => setResumeData(prev => ({
                                ...prev,
                                skillsRichText: improvedContent
                              }))
                            );
                          } else {
                            navigateToSettings();
                          }
                        }}
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Improve with AI
                      </Button>
                    </div>
                    <RichTextEditor
                      value={typeof resumeData.skillsRichText === 'string' ? resumeData.skillsRichText : resumeData.skills.join('\n')}
                      onChange={(value) => setResumeData(prev => ({
                        ...prev,
                        skillsRichText: value
                      }))}
                      placeholder="e.g., • JavaScript, TypeScript, Python&#10;• React, Node.js, Express&#10;• SQL, MongoDB, PostgreSQL"
                      minHeight="200px"
                    />
                    
                    <FeedbackButtons
                      sectionId="skills"
                      currentFeedback={sectionFeedback['skills'] as 'up' | 'down' | undefined}
                      onThumbsUp={handleThumbsUp}
                      onThumbsDown={handleThumbsDown}
                      className="mt-4"
                    />
                  </div>
                </div>
              )}

              {/* Links Section */}
              {currentSection === 'links' && (
                <div className="space-y-6">
                  <div>
                    <h2>Links</h2>
                    <p className="text-gray-600 mt-2">
                      Add professional links like portfolio, GitHub, etc.
                    </p>
                  </div>

                  {resumeData.links.map((link, index) => (
                    <Card key={link.id} className="p-4 bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div className="flex-1 grid grid-cols-2 gap-4">
                          <Input
                            value={link.label}
                            onChange={(e) => updateLink(link.id, 'label', e.target.value)}
                            placeholder="e.g., Portfolio"
                          />
                          <Input
                            value={link.url}
                            onChange={(e) => updateLink(link.id, 'url', e.target.value)}
                            placeholder="e.g., https://yourportfolio.com"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteLink(link.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </Card>
                  ))}

                  <Button variant="outline" className="w-full" onClick={addLink}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add link
                  </Button>
                  
                  <FeedbackButtons
                    sectionId="links"
                    currentFeedback={sectionFeedback['links'] as 'up' | 'down' | undefined}
                    onThumbsUp={handleThumbsUp}
                    onThumbsDown={handleThumbsDown}
                    className="mt-6"
                  />
                </div>
              )}

              {/* Custom Sections */}
              {resumeData.customSections.map((section) => (
                currentSection === section.id && (
                  <div key={section.id} className="space-y-6">
                    <div>
                      <h2>{section.title || 'Custom Section'}</h2>
                      <p className="text-gray-600 mt-2">
                        Add content for this section. You can include bullet points, paragraphs, or any relevant information.
                      </p>
                    </div>

                    <div>
                      <Label>Section Title</Label>
                      <Input
                        value={section.title}
                        onChange={(e) => updateCustomSection(section.id, 'title', e.target.value)}
                        placeholder="e.g., Awards, Publications, Projects"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label>Content</Label>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                            onClick={() => {
                              if (!section.content || !section.content.trim()) {
                                toast.warning('Please add some content first', {
                                  description: 'Add content to this section before using AI improvement'
                                });
                                return;
                              }
                              if (industryTone && rewriteStyle) {
                                const hasBullets = section.content.includes('•') || section.content.includes('<li>');
                                openImproveDialog(
                                  section.content,
                                  'custom',
                                  hasBullets,
                                  (improvedContent) => updateCustomSection(section.id, 'content', improvedContent),
                                  section.id
                                );
                              } else {
                                navigateToSettings();
                              }
                            }}
                          >
                            <Sparkles className="w-4 h-4 mr-2" />
                            Improve with AI
                          </Button>
                          {originalCustomSections[section.id] && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => restoreOriginalCustomSection(section.id)}
                            >
                              Return to original
                            </Button>
                          )}
                        </div>
                      </div>
                      <RichTextEditor
                        value={section.content}
                        onChange={(value) => updateCustomSection(section.id, 'content', value)}
                        placeholder="e.g., • First achievement or item&#10;• Second achievement or item&#10;• Third achievement or item"
                        minHeight="150px"
                      />
                    </div>
                    
                    <FeedbackButtons
                      sectionId={section.id}
                      currentFeedback={sectionFeedback[section.id] as 'up' | 'down' | undefined}
                      onThumbsUp={handleThumbsUp}
                      onThumbsDown={handleThumbsDown}
                      className="mb-4"
                    />
                  </div>
                )
              ))}
            </Card>

            {/* Bottom Navigation */}
            <div className="flex items-center justify-between mt-6">
              {!isFirstSection() ? (
                <Button variant="outline" onClick={handlePreviousSection}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              ) : (
                <div></div>
              )}

              <Button variant="outline" onClick={() => setShowReorderDialog(true)}>
                <Menu className="w-4 h-4 mr-2" />
                Reorder sections
              </Button>

              {!isLastSection() && (
                <Button onClick={handleNextSection}>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>


          </div>
        </div>

        {/* Right - Live Preview - ratio 2.5 for all browsers: Chrome, Safari, Firefox, Edge */}
        {isPreviewVisible && (
        <div 
          className="bg-gray-50 border-l relative" 
          style={{ flex: '2.5 1 0%', height: '100%', overflow: 'hidden' }}
        >
          <div
            ref={previewContainerRef}
            onScroll={handlePreviewScroll}
            style={{ height: '100%', overflowY: 'auto' }}
          >
          <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <Save className="w-4 h-4 text-green-600" />
              <span className="text-sm text-gray-600">Auto-saved</span>
            </div>
            <div className="bg-gray-800 text-white px-3 py-1 rounded-full text-sm">
              Preview
            </div>
          </div>

          <div className="p-8">
            <div className="bg-white rounded-lg shadow-lg p-8 min-h-[1100px]">
              {/* Live Preview Content - Updates in real-time */}
              <div className="space-y-6">
                {sectionOrder.filter(s => s.visible).map(section => {
                  switch (section.type) {
                    case 'personalDetails':
                      return (
                        <div key={section.id} className="text-center border-b pb-6">
                          {resumeData.personalDetails.photoUrl && (
                            <div className="flex justify-center mb-4">
                              <img
                                src={resumeData.personalDetails.photoUrl}
                                alt="Profile"
                                className="w-24 h-24 object-cover rounded-full border-2 border-gray-300"
                              />
                            </div>
                          )}
                          <h1 className="text-3xl">
                            {resumeData.personalDetails.firstName} {resumeData.personalDetails.lastName}
                          </h1>
                          {resumeData.personalDetails.jobTitle && (
                            <p className="text-gray-600 mt-2">{resumeData.personalDetails.jobTitle}</p>
                          )}
                          {(resumeData.personalDetails.nationality || 
                            resumeData.personalDetails.driversLicense || 
                            resumeData.personalDetails.birthDate) && (
                            <div className="text-xs text-gray-500 mt-2">
                              {[
                                resumeData.personalDetails.nationality && `Nationality: ${resumeData.personalDetails.nationality}`,
                                resumeData.personalDetails.driversLicense && `Driver's License: ${resumeData.personalDetails.driversLicense}`,
                                resumeData.personalDetails.birthDate && `Date of Birth: ${resumeData.personalDetails.birthDate}`
                              ].filter(Boolean).join(' | ')}
                            </div>
                          )}
                        </div>
                      );

                    case 'contact':
                      if (!resumeData.contact.email && !resumeData.contact.phone) return null;
                      return (
                        <div key={section.id} className="text-center text-sm text-gray-600">
                          {[
                            resumeData.contact.email,
                            resumeData.contact.phone,
                            resumeData.contact.address,
                            resumeData.contact.linkedin,
                            resumeData.contact.website
                          ].filter(Boolean).join(' | ')}
                        </div>
                      );

                    case 'summary':
                      if (!resumeData.summary) return null;
                      console.log('📄 SUMMARY PREVIEW - Raw HTML:', resumeData.summary);
                      const processedSummary = processHTMLWithNesting(resumeData.summary);
                      console.log('📄 SUMMARY PREVIEW - Processed items:', processedSummary);
                      console.log('📄 SUMMARY PREVIEW - Item count:', processedSummary.length);
                      return (
                        <div key={section.id}>
                          <h3 className="text-base font-bold mb-3 uppercase tracking-wide text-gray-800 border-b border-gray-300 pb-1">Professional Summary</h3>
                          <div className="text-sm text-gray-700 leading-relaxed">
                            {processedSummary.map((item, idx) => renderProcessedItem(item, idx, processedSummary))}
                          </div>
                        </div>
                      );

                    case 'experience':
                      if (resumeData.experience.length === 0) return null;
                      return (
                        <div key={section.id}>
                          <h3 className="text-base font-bold mb-3 uppercase tracking-wide text-gray-800 border-b border-gray-300 pb-1">Employment History</h3>
                          {resumeData.experience.map((exp) => {
                            const processedContent = processHTMLWithNesting(exp.description);
                            return (
                              <div key={exp.id} className="mb-5">
                                <div className="font-semibold text-sm text-gray-900">{exp.title}</div>
                                <div className="text-sm text-gray-600 font-medium">
                                  {exp.company}{exp.location && ` | ${exp.location}`}
                                </div>
                                <div className="text-xs text-gray-500 mb-2 italic">
                                  {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                                </div>
                                <div className="text-sm text-gray-700">
                                  {processedContent.map((item, idx) => renderProcessedItem(item, idx, processedContent))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );

                    case 'education':
                      if (resumeData.education.length === 0) return null;
                      return (
                        <div key={section.id}>
                          <h3 className="text-base font-bold mb-3 uppercase tracking-wide text-gray-800 border-b border-gray-300 pb-1">Education</h3>
                          {resumeData.education.map((edu) => {
                            const processedDetails = edu.details ? processHTMLWithNesting(edu.details) : [];
                            return (
                              <div key={edu.id} className="mb-4">
                                <div className="font-semibold text-sm text-gray-900">{edu.degree}</div>
                                <div className="text-sm text-gray-600 font-medium">
                                  {edu.institution}{edu.location && ` | ${edu.location}`}
                                </div>
                                <div className="text-xs text-gray-500 italic">
                                  {edu.startDate} - {edu.current ? 'Present' : edu.endDate}
                                </div>
                                {processedDetails.length > 0 && (
                                  <div className="text-sm text-gray-700 mt-1">
                                    {processedDetails.map((item, idx) => renderProcessedItem(item, idx, processedDetails))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );

                    case 'skills':
                      const skillsContent = resumeData.skillsRichText || resumeData.skills.join('\n');
                      if (!skillsContent) return null;
                      const processedSkills = processHTMLWithNesting(skillsContent);
                      return (
                        <div key={section.id}>
                          <h3 className="text-base font-bold mb-3 uppercase tracking-wide text-gray-800 border-b border-gray-300 pb-1">Skills</h3>
                          <div className="text-sm text-gray-700">
                            {processedSkills.map((item, idx) => renderProcessedItem(item, idx, processedSkills))}
                          </div>
                        </div>
                      );

                    case 'links':
                      if (resumeData.links.length === 0) return null;
                      return (
                        <div key={section.id}>
                          <h3 className="text-base font-bold mb-3 uppercase tracking-wide text-gray-800 border-b border-gray-300 pb-1">Links</h3>
                          {resumeData.links.map((link) => (
                            <div key={link.id} className="text-sm text-blue-600">
                              <span className="font-medium">{link.label}:</span> {link.url}
                            </div>
                          ))}
                        </div>
                      );

                    case 'customSections':
                      // Find the custom section that matches this section.id
                      const customSection = resumeData.customSections.find(cs => cs.id === section.id);
                      if (!customSection || !customSection.content) return null;
                      const processedCustomContent = processHTMLWithNesting(customSection.content);
                      return (
                        <div key={section.id}>
                          <h3 className="text-base font-bold mb-3 uppercase tracking-wide text-gray-800 border-b border-gray-300 pb-1">{customSection.title}</h3>
                          <div className="text-sm text-gray-700">
                            {processedCustomContent.map((item, idx) => renderProcessedItem(item, idx, processedCustomContent))}
                          </div>
                        </div>
                      );

                    default:
                      return null;
                  }
                })}
              </div>
            </div>
          </div>
          </div>
          
          {/* Scroll indicator buttons - positioned absolute within preview container */}
          {showScrollIndicator && (
            <button
              onClick={scrollPreviewDown}
              className="absolute bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 animate-bounce z-20"
              title="Scroll down for more content"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          )}
          {isAtBottom && (
            <button
              onClick={scrollPreviewUp}
              className="absolute bottom-6 right-6 bg-gray-600 hover:bg-gray-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 z-20"
              title="Scroll back to top"
            >
              <ChevronUp className="w-5 h-5" />
            </button>
          )}
        </div>
        )}
      </div>
      </div> {/* End 80% width centered container */}

      {/* Reorder Dialog */}
      <Dialog open={showReorderDialog} onOpenChange={setShowReorderDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reorder Resume Sections</DialogTitle>
            <DialogDescription>
              Drag sections to reorder them. Toggle visibility with the checkbox.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            {sectionOrder.map((section, index) => (
              <div
                key={section.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-move ${
                  draggedItem === index ? 'opacity-50' : ''
                }`}
              >
                <GripVertical className="w-4 h-4 text-gray-400" />
                <input
                  type="checkbox"
                  checked={section.visible}
                  onChange={() => toggleSectionVisibility(section.id)}
                  className="rounded"
                />
                <span className="flex-1 text-sm">{section.label}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setShowReorderDialog(false)}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Photo Upload Dialog */}
      <PhotoUploadDialog
        open={showPhotoDialog}
        onClose={() => setShowPhotoDialog(false)}
        onPhotoSelected={(photoUrl) => {
          updatePersonalDetails('photoUrl', photoUrl);
          setShowPhotoDialog(false);
        }}
      />

      {/* Add Section Dialog */}
      <AddSectionDialog
        open={showAddSectionDialog}
        onClose={() => setShowAddSectionDialog(false)}
        onAddSection={handleAddSection}
      />

      {/* AI Improve Dialog */}
      <AIImproveDialog
        open={improveDialogOpen}
        onClose={() => setImproveDialogOpen(false)}
        content={improveDialogContent}
        sectionType={improveDialogSectionType}
        industryTone={industryTone}
        rewriteStyle={rewriteStyle}
        jobDescription={jobDescription}
        onAccept={(improvedContent) => {
          if (improveDialogCallback) {
            improveDialogCallback(improvedContent);
          }
        }}
        isList={improveDialogIsList}
      />

      {/* Feedback Dialog */}
      <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isUpdatingFeedback ? 'Update Your Feedback' : 'Help Us Improve'}
            </DialogTitle>
            <DialogDescription>
              {isUpdatingFeedback 
                ? 'You can update your previous feedback for this section.' 
                : 'Please tell us what went wrong with the parsing so we can improve it.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Textarea
              value={feedbackReason}
              onChange={(e) => setFeedbackReason(e.target.value)}
              placeholder="E.g., 'The email was parsed incorrectly' or 'Experience dates are wrong'"
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowFeedbackDialog(false);
                  setFeedbackReason('');
                }}
              >
                Cancel
              </Button>
              <Button onClick={submitFeedback}>
                Submit Feedback
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI HR Suggestions Floating Overlay */}
      {!jobDescription && (
        <AIHRSuggestions
          resumeData={resumeData}
          isExpanded={showAIHRSuggestions}
          onToggle={() => setShowAIHRSuggestions(!showAIHRSuggestions)}
          cachedSuggestions={cachedAISuggestions}
          onSuggestionsGenerated={(suggestions) => {
            setCachedAISuggestions(suggestions);
            setForceRegenerateAI(false);
          }}
          forceRegenerate={forceRegenerateAI}
        />
      )}
      
      {/* Job Match Score Floating Overlay */}
      {jobDescription && showJobMatchScore && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-semibold text-gray-900">Job Match Analysis</h3>
              <button
                onClick={() => setShowJobMatchScore(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <JobMatchScore
                resumeData={resumeData}
                jobDescription={jobDescription}
                isExpanded={true}
                onToggle={() => setShowJobMatchScore(false)}
                cachedMatchResult={cachedJobMatchScore}
                onMatchResultGenerated={(result) => {
                  setCachedJobMatchScore(result);
                  setForceRegenerateMatch(false);
                }}
                forceRegenerate={forceRegenerateMatch}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
