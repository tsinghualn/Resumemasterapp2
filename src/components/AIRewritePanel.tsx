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
import { processHTMLBulletsWithFormatting, processHTMLWithNesting } from '../utils/htmlBulletProcessor';
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
  Pencil
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { apiClient } from '../utils/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { PhotoUploadDialog } from './PhotoUploadDialog';
import { AddSectionDialog } from './AddSectionDialog';

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
  onBack: () => void;
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
  
  // Refs for scrolling to settings
  const settingsRef = useRef<HTMLDivElement>(null);
  const industryToneRef = useRef<HTMLButtonElement>(null);
  const rewriteStyleRef = useRef<HTMLButtonElement>(null);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [showPhotoDialog, setShowPhotoDialog] = useState(false);
  const [showAddSectionDialog, setShowAddSectionDialog] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingSectionName, setEditingSectionName] = useState<string>('');
  
  // AI Improve dialog state
  const [improveDialogOpen, setImproveDialogOpen] = useState(false);
  const [improveDialogContent, setImproveDialogContent] = useState('');
  const [improveDialogSectionType, setImproveDialogSectionType] = useState<'summary' | 'experience' | 'education' | 'skills' | 'custom'>('summary');
  const [improveDialogIsList, setImproveDialogIsList] = useState(false);
  const [improveDialogCallback, setImproveDialogCallback] = useState<((content: string) => void) | null>(null);
  
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
    { id: 'links', type: 'links', label: 'Links', visible: true },
  ]);

  // Parse resume data on mount
  useEffect(() => {
    if (cachedParsedData) {
      parseResumeData(cachedParsedData);
    } else {
      parseResumeFromText(originalResume);
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

  const parseResumeData = (data: any) => {
    // Convert cached parsed data to ResumeData format
    const fullText = [data.name, data.contact, data.summary, data.experience, data.education, data.skills].join('\n');
    
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
      summary: data.summary || '',
      experience: parseExperience(data.experience || ''),
      education: parseEducation(data.education || ''),
      skills: parseSkills(data.skills || ''),
      skillsRichText: data.skills || '',
      links: parseLinks(fullText),
      customSections: parseCustomSections(fullText)
    };

    setResumeData(parsed);
  };

  const parseResumeFromText = (text: string) => {
    // Basic text parsing
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
    
    // Prevent deletion of core sections
    const coreSections = ['personalDetails', 'contact', 'summary', 'experience', 'education', 'skills', 'links'];
    if (coreSections.includes(sectionType)) {
      toast.error('Cannot delete core resume sections');
      return;
    }

    // Delete custom section
    deleteCustomSection(sectionId);
    toast.success('Section deleted');
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
    callback: (improvedContent: string) => void
  ) => {
    setImproveDialogContent(content);
    setImproveDialogSectionType(sectionType);
    setImproveDialogIsList(isList);
    setImproveDialogCallback(() => callback);
    setImproveDialogOpen(true);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Settings Panel */}
      {showSettings && (
        <div 
          ref={settingsRef}
          className="bg-white border-b shadow-sm p-6"
        >
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <Button onClick={onBack} variant="ghost" size="sm">
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
                  <div className="flex items-start gap-2 mt-2 text-sm text-amber-700">
                    <span className="text-amber-500">⚠</span>
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
                  <div className="flex items-start gap-2 mt-2 text-sm text-amber-700">
                    <span className="text-amber-500">⚠</span>
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

      {/* Review Note */}
      <div className="px-6 py-3 flex items-center gap-2 text-blue-600">
        <FileText className="w-4 h-4" />
        <span className="text-sm">Review and edit each section of your resume. Make sure all information is accurate before proceeding to optimization.</span>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Sidebar Navigation */}
        <div className="w-72 bg-white border-r">
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
                
                return (
                  <div
                    key={item.id}
                    className={`group w-full flex items-center gap-2 px-3 py-2.5 rounded-lg transition-colors ${
                      (item.type === 'customSections' ? currentSection === item.id : currentSection === item.type)
                        ? 'bg-blue-50'
                        : 'hover:bg-gray-50'
                    }`}
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
                          currentSection === item.type ? 'text-blue-600' : 'text-gray-700'
                        }`}>
                          {item.label}
                        </span>
                      )}
                    </button>
                    {!isEditing && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                        {item.type === 'customSections' && (
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
                        )}
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
            </div>
          </ScrollArea>
        </div>

        {/* Center - Editing Area */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-3xl mx-auto p-8">
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
                        placeholder="First name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last name</Label>
                      <Input
                        id="lastName"
                        value={resumeData.personalDetails.lastName}
                        onChange={(e) => updatePersonalDetails('lastName', e.target.value)}
                        placeholder="Last name"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="jobTitle">Desired job title</Label>
                    <Input
                      id="jobTitle"
                      value={resumeData.personalDetails.jobTitle}
                      onChange={(e) => updatePersonalDetails('jobTitle', e.target.value)}
                      placeholder="Product Designer"
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
                            placeholder="American"
                          />
                        </div>
                        <div>
                          <Label htmlFor="driversLicense">Driver's License</Label>
                          <Input
                            id="driversLicense"
                            value={resumeData.personalDetails.driversLicense}
                            onChange={(e) => updatePersonalDetails('driversLicense', e.target.value)}
                            placeholder="D74837465"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="birthDate">Birth date</Label>
                        <Input
                          id="birthDate"
                          value={resumeData.personalDetails.birthDate}
                          onChange={(e) => updatePersonalDetails('birthDate', e.target.value)}
                          placeholder="03 Feb 1996"
                        />
                      </div>
                    </div>
                  )}
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
                      placeholder="your.email@example.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={resumeData.contact.phone}
                      onChange={(e) => updateContact('phone', e.target.value)}
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={resumeData.contact.address}
                      onChange={(e) => updateContact('address', e.target.value)}
                      placeholder="City, State"
                    />
                  </div>

                  <div>
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <Input
                      id="linkedin"
                      value={resumeData.contact.linkedin}
                      onChange={(e) => updateContact('linkedin', e.target.value)}
                      placeholder="linkedin.com/in/yourname"
                    />
                  </div>

                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={resumeData.contact.website}
                      onChange={(e) => updateContact('website', e.target.value)}
                      placeholder="www.yourwebsite.com"
                    />
                  </div>
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
                      {resumeData.summary && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                          onClick={() => {
                            if (industryTone && rewriteStyle) {
                              openImproveDialog(
                                resumeData.summary,
                                'summary',
                                false,
                                (improvedContent) => updateSummary(improvedContent)
                              );
                            } else {
                              navigateToSettings();
                            }
                          }}
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          Improve with AI
                        </Button>
                      )}
                    </div>
                    <RichTextEditor
                      value={resumeData.summary}
                      onChange={(value) => updateSummary(value)}
                      placeholder="Write a compelling professional summary..."
                      minHeight="150px"
                    />
                    {industryTone && rewriteStyle && (
                      <p className="text-xs text-gray-500 mt-2">
                        AI will optimize this using {industryTone} tone with {rewriteStyle} style
                      </p>
                    )}
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
                            placeholder="Senior Software Engineer"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Company</Label>
                            <Input
                              value={exp.company}
                              onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                              placeholder="Tech Corp"
                            />
                          </div>
                          <div>
                            <Label>Location</Label>
                            <Input
                              value={exp.location}
                              onChange={(e) => updateExperience(exp.id, 'location', e.target.value)}
                              placeholder="San Francisco, CA"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Start date</Label>
                            <Input
                              value={exp.startDate}
                              onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                              placeholder="Jan 2020"
                            />
                          </div>
                          <div>
                            <Label>End date</Label>
                            <div className="space-y-2">
                              <Input
                                value={exp.endDate}
                                onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                                placeholder="Dec 2023"
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
                            {exp.description && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                                onClick={() => {
                                  if (industryTone && rewriteStyle) {
                                    // Check if description contains bullets
                                    const hasBullets = exp.description.includes('•') || exp.description.includes('<li>');
                                    openImproveDialog(
                                      exp.description,
                                      'experience',
                                      hasBullets,
                                      (improvedContent) => updateExperience(exp.id, 'description', improvedContent)
                                    );
                                  } else {
                                    navigateToSettings();
                                  }
                                }}
                              >
                                <Sparkles className="w-4 h-4 mr-2" />
                                Improve with AI
                              </Button>
                            )}
                          </div>
                          <RichTextEditor
                            value={exp.description}
                            onChange={(value) => updateExperience(exp.id, 'description', value)}
                            placeholder="Describe your responsibilities and achievements..."
                            minHeight="120px"
                          />
                        </div>
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
                            placeholder="Bachelor of Science in Computer Science"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Institution</Label>
                            <Input
                              value={edu.institution}
                              onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                              placeholder="University of Technology"
                            />
                          </div>
                          <div>
                            <Label>Location</Label>
                            <Input
                              value={edu.location}
                              onChange={(e) => updateEducation(edu.id, 'location', e.target.value)}
                              placeholder="Boston, MA"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Start date</Label>
                            <Input
                              value={edu.startDate}
                              onChange={(e) => updateEducation(edu.id, 'startDate', e.target.value)}
                              placeholder="Sep 2016"
                            />
                          </div>
                          <div>
                            <Label>End date</Label>
                            <div className="space-y-2">
                              <Input
                                value={edu.endDate}
                                onChange={(e) => updateEducation(edu.id, 'endDate', e.target.value)}
                                placeholder="May 2020"
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
                            {edu.details && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                                onClick={() => {
                                  if (industryTone && rewriteStyle) {
                                    const hasBullets = edu.details.includes('•') || edu.details.includes('<li>');
                                    openImproveDialog(
                                      edu.details,
                                      'education',
                                      hasBullets,
                                      (improvedContent) => updateEducation(edu.id, 'details', improvedContent)
                                    );
                                  } else {
                                    navigateToSettings();
                                  }
                                }}
                              >
                                <Sparkles className="w-4 h-4 mr-2" />
                                        Improve with AI
                                      </Button>
                            )}
                          </div>
                          <RichTextEditor
                            value={edu.details}
                            onChange={(value) => updateEducation(edu.id, 'details', value)}
                            placeholder="GPA: 3.8/4.0, Dean's List..."
                            minHeight="100px"
                          />
                        </div>
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
                    {resumeData.skillsRichText && (
                      <div className="flex justify-end mb-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                          onClick={() => {
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
                    )}
                    <RichTextEditor
                      value={typeof resumeData.skillsRichText === 'string' ? resumeData.skillsRichText : resumeData.skills.join('\n')}
                      onChange={(value) => setResumeData(prev => ({
                        ...prev,
                        skillsRichText: value
                      }))}
                      placeholder="• JavaScript, TypeScript, Python\n• React, Node.js, Express\n• SQL, MongoDB, PostgreSQL"
                      minHeight="200px"
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
                            placeholder="Label (e.g., Portfolio)"
                          />
                          <Input
                            value={link.url}
                            onChange={(e) => updateLink(link.id, 'url', e.target.value)}
                            placeholder="URL"
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
                        {section.content && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                            onClick={() => {
                              if (industryTone && rewriteStyle) {
                                const hasBullets = section.content.includes('•') || section.content.includes('<li>');
                                openImproveDialog(
                                  section.content,
                                  'custom',
                                  hasBullets,
                                  (improvedContent) => updateCustomSection(section.id, 'content', improvedContent)
                                );
                              } else {
                                navigateToSettings();
                              }
                            }}
                          >
                            <Sparkles className="w-4 h-4 mr-2" />
                            Improve with AI
                          </Button>
                        )}
                      </div>
                      <RichTextEditor
                        value={section.content}
                        onChange={(value) => updateCustomSection(section.id, 'content', value)}
                        placeholder="Add your content here..."
                        minHeight="150px"
                      />
                    </div>

                    <Button
                      variant="outline"
                      className="w-full text-red-500 hover:text-red-600"
                      onClick={() => deleteCustomSection(section.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete this section
                    </Button>
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

              {!isLastSection() ? (
                <Button onClick={handleNextSection}>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleFinish}>
                  Finish
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Right - Live Preview */}
        <div className="w-[500px] bg-gray-50 border-l overflow-auto">
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
                      const processedSummary = processHTMLWithNesting(resumeData.summary);
                      return (
                        <div key={section.id}>
                          <h3 className="text-sm font-semibold mb-2 uppercase">Professional Summary</h3>
                          <div className="text-sm text-gray-700 leading-relaxed">
                            {processedSummary.map((item, idx) => {
                              const indent = item.indent || 0;
                              const marginLeft = indent * 24;
                              
                              if (item.type === 'bullet') {
                                // Determine bullet character based on style
                                let bulletChar = '•';
                                if (item.bulletStyle === 'number') {
                                  bulletChar = `${idx + 1}.`; // Use actual numbers for ordered lists
                                } else if (item.bulletStyle === 'hollow') {
                                  bulletChar = '○';
                                } else {
                                  bulletChar = '•';
                                }
                                return (
                                  <div key={idx} className="flex items-start gap-2 mb-1" style={{ marginLeft: `${marginLeft}px` }}>
                                    <span className="text-gray-600 mt-0.5 min-w-[20px]">{bulletChar}</span>
                                    <span className="flex-1" dangerouslySetInnerHTML={{ __html: item.content }} />
                                  </div>
                                );
                              } else {
                                return (
                                  <div key={idx} className="mb-1" style={{ marginLeft: `${marginLeft}px` }} dangerouslySetInnerHTML={{ __html: item.content }} />
                                );
                              }
                            })}
                          </div>
                        </div>
                      );

                    case 'experience':
                      if (resumeData.experience.length === 0) return null;
                      return (
                        <div key={section.id}>
                          <h3 className="text-sm font-semibold mb-3 uppercase">Employment History</h3>
                          {resumeData.experience.map((exp) => {
                            const processedContent = processHTMLWithNesting(exp.description);
                            return (
                              <div key={exp.id} className="mb-4">
                                <div className="font-medium text-sm">{exp.title}</div>
                                <div className="text-sm text-gray-600">
                                  {exp.company}{exp.location && ` | ${exp.location}`}
                                </div>
                                <div className="text-xs text-gray-500 mb-2">
                                  {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                                </div>
                                <div className="text-sm text-gray-700">
                                  {processedContent.map((item, idx) => {
                                    const indent = item.indent || 0;
                                    const marginLeft = indent * 24;
                                    
                                    if (item.type === 'bullet') {
                                      // Determine bullet character based on style
                                      let bulletChar = '•';
                                      if (item.bulletStyle === 'number') {
                                        bulletChar = `${idx + 1}.`; // Use actual numbers for ordered lists
                                      } else if (item.bulletStyle === 'hollow') {
                                        bulletChar = '○';
                                      } else {
                                        bulletChar = '•';
                                      }
                                      return (
                                        <div key={idx} className="flex items-start gap-2 mb-1" style={{ marginLeft: `${marginLeft}px` }}>
                                          <span className="text-gray-600 mt-0.5 min-w-[20px]">{bulletChar}</span>
                                          <span className="flex-1" dangerouslySetInnerHTML={{ __html: item.content }} />
                                        </div>
                                      );
                                    } else {
                                      return (
                                        <div key={idx} className="mb-1" style={{ marginLeft: `${marginLeft}px` }} dangerouslySetInnerHTML={{ __html: item.content }} />
                                      );
                                    }
                                  })}
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
                          <h3 className="text-sm font-semibold mb-3 uppercase">Education</h3>
                          {resumeData.education.map((edu) => {
                            const processedDetails = edu.details ? processHTMLWithNesting(edu.details) : [];
                            return (
                              <div key={edu.id} className="mb-3">
                                <div className="font-medium text-sm">{edu.degree}</div>
                                <div className="text-sm text-gray-600">
                                  {edu.institution}{edu.location && ` | ${edu.location}`}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {edu.startDate} - {edu.current ? 'Present' : edu.endDate}
                                </div>
                                {processedDetails.length > 0 && (
                                  <div className="text-sm text-gray-700 mt-1">
                                    {processedDetails.map((item, idx) => {
                                      const indent = item.indent || 0;
                                      const marginLeft = indent * 24;
                                      
                                      if (item.type === 'bullet') {
                                        // Determine bullet character based on style
                                        let bulletChar = '•';
                                        if (item.bulletStyle === 'number') {
                                          bulletChar = `${idx + 1}.`; // Use actual numbers for ordered lists
                                        } else if (item.bulletStyle === 'hollow') {
                                          bulletChar = '○';
                                        } else {
                                          bulletChar = '•';
                                        }
                                        return (
                                          <div key={idx} className="flex items-start gap-2 mb-1" style={{ marginLeft: `${marginLeft}px` }}>
                                            <span className="text-gray-600 mt-0.5 min-w-[20px]">{bulletChar}</span>
                                            <span className="flex-1" dangerouslySetInnerHTML={{ __html: item.content }} />
                                          </div>
                                        );
                                      } else {
                                        return (
                                          <div key={idx} className="mb-1" style={{ marginLeft: `${marginLeft}px` }} dangerouslySetInnerHTML={{ __html: item.content }} />
                                        );
                                      }
                                    })}
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
                          <h3 className="text-sm font-semibold mb-2 uppercase">Skills</h3>
                          <div className="text-sm text-gray-700">
                            {processedSkills.map((item, idx) => {
                              const indent = item.indent || 0;
                              const marginLeft = indent * 24; // 24px per indent level
                              
                              if (item.type === 'bullet') {
                                // Determine bullet character based on style
                                let bulletChar = '•';
                                if (item.bulletStyle === 'number') {
                                  bulletChar = `${idx + 1}.`; // Use actual numbers for ordered lists
                                } else if (item.bulletStyle === 'hollow') {
                                  bulletChar = '○'; // Hollow circle for sub-items
                                } else if (item.bulletStyle === 'filled') {
                                  bulletChar = '•'; // Filled circle for main items
                                }
                                
                                return (
                                  <div key={idx} className="flex items-start gap-2 mb-1" style={{ marginLeft: `${marginLeft}px` }}>
                                    <span className="text-gray-600 mt-0.5 min-w-[20px]">{bulletChar}</span>
                                    <span className="flex-1" dangerouslySetInnerHTML={{ __html: item.content }} />
                                  </div>
                                );
                              } else {
                                return (
                                  <div key={idx} className="mb-1" style={{ marginLeft: `${marginLeft}px` }} dangerouslySetInnerHTML={{ __html: item.content }} />
                                );
                              }
                            })}
                          </div>
                        </div>
                      );

                    case 'links':
                      if (resumeData.links.length === 0) return null;
                      return (
                        <div key={section.id}>
                          <h3 className="text-sm font-semibold mb-2 uppercase">Links</h3>
                          {resumeData.links.map((link) => (
                            <div key={link.id} className="text-sm text-blue-600">
                              {link.label}: {link.url}
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
                          <h3 className="text-sm font-semibold mb-2 uppercase">{customSection.title}</h3>
                          <div className="text-sm text-gray-700">
                            {processedCustomContent.map((item, idx) => {
                              const indent = item.indent || 0;
                              const marginLeft = indent * 24;
                              
                              if (item.type === 'bullet') {
                                // Determine bullet character based on style
                                let bulletChar = '•';
                                if (item.bulletStyle === 'number') {
                                  bulletChar = `${idx + 1}.`; // Use actual numbers for ordered lists
                                } else if (item.bulletStyle === 'hollow') {
                                  bulletChar = '○';
                                } else {
                                  bulletChar = '•';
                                }
                                return (
                                  <div key={idx} className="flex items-start gap-2 mb-1" style={{ marginLeft: `${marginLeft}px` }}>
                                    <span className="text-gray-600 mt-0.5 min-w-[20px]">{bulletChar}</span>
                                    <span className="flex-1" dangerouslySetInnerHTML={{ __html: item.content }} />
                                  </div>
                                );
                              } else {
                                return (
                                  <div key={idx} className="mb-1" style={{ marginLeft: `${marginLeft}px` }} dangerouslySetInnerHTML={{ __html: item.content }} />
                                );
                              }
                            })}
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
      </div>

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
    </div>
  );
}
