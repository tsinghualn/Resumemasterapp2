import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { FileText, ArrowLeft, ArrowRight, User, Briefcase, GraduationCap, Lightbulb, FileCheck, Award, Trophy, Users, Heart, FolderKanban, Edit2, Trash2, Camera, ChevronDown, Phone, Mail, MapPin, Linkedin, Globe } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { AddSectionDialog } from './AddSectionDialog';
import { PersonalDetailsForm } from './PersonalDetailsForm';

interface ParsedResumeEditorProps {
  content: string;
  fileName: string;
  onChange: (content: string) => void;
  onBack: () => void;
  onContinue: () => void;
  isEditMode?: boolean;
  cachedData?: ResumeData | null;
  onDataChange?: (data: ResumeData) => void;
}

interface ResumeData {
  name: string;
  nameTitle?: string;
  // Personal Details - structured fields
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  nationality?: string;
  driversLicense?: string;
  birthDate?: string;
  photoUrl?: string;
  personalDetailsTitle?: string;
  // Contact Information
  contact: string;
  contactTitle?: string;
  personalInfoTitle?: string;
  summary: string;
  summaryTitle?: string;
  experience: string;
  experienceTitle?: string;
  education: string;
  educationTitle?: string; // Dynamic title like "Education & Courses"
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
  customSections?: Array<{ id: string; title: string; content: string; icon: any }>;
}

export function ParsedResumeEditor({ 
  content, 
  fileName, 
  onChange, 
  onBack, 
  onContinue,
  isEditMode = false,
  cachedData = null,
  onDataChange = () => {}
}: ParsedResumeEditorProps) {
  const [resumeData, setResumeData] = useState<ResumeData>({
    name: '',
    nameTitle: 'Full Name',
    contact: '',
    contactTitle: 'Contact Information',
    personalInfoTitle: 'Personal Information',
    summary: '',
    summaryTitle: 'Professional Summary',
    experience: '',
    experienceTitle: 'Professional Experience',
    education: '',
    educationTitle: 'Education & Courses',
    courses: '',
    coursesTitle: 'Coursework',
    skills: '',
    skillsTitle: 'Skills',
    projects: '',
    projectsTitle: 'Projects',
    certifications: '',
    certificationsTitle: 'Certifications',
    publications: '',
    publicationsTitle: 'Publications',
    patents: '',
    patentsTitle: 'Patents',
    presentations: '',
    presentationsTitle: 'Presentations',
    awards: '',
    awardsTitle: 'Awards & Honors',
    activities: '',
    activitiesTitle: 'Activities & Volunteering',
    languages: '',
    languagesTitle: 'Languages',
    interests: '',
    interestsTitle: 'Hobbies & Interests',
    references: '',
    referencesTitle: 'References',
    customSections: []
  });
  const [isParsing, setIsParsing] = useState(false);
  const [usedAI, setUsedAI] = useState(false);
  const [editingHeaderKey, setEditingHeaderKey] = useState<string | null>(null);
  const [isAdditionalDetailsOpen, setIsAdditionalDetailsOpen] = useState(false);

  // Load data from cache or parse resume
  useEffect(() => {
    if (cachedData) {
      // Use cached data if available
      console.log('✨ Using cached resume data - skipping parse');
      setResumeData(cachedData);
      toast.success('Loaded saved sections!', { duration: 2000 });
    } else if (content) {
      // Parse from scratch if no cache
      parseResumeWithAI(content);
    }
  }, [content, cachedData]);

  // AI-powered parsing
  const parseResumeWithAI = async (text: string) => {
    setIsParsing(true);
    
    try {
      console.log('🤖 Parsing resume with AI...');
      toast.info('⏳ AI is parsing your resume. Please be patient...', {
        id: 'ai-parsing',
        duration: 15000,
        description: 'This may take a few moments. Your resume is being carefully analyzed.',
      });

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-bc1c5df9/parse-resume`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            resumeText: text
          })
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        console.log('✅ AI parsing successful!');
        setResumeData(result.data);
        setUsedAI(true);
        toast.success('Resume parsed successfully with AI!', {
          id: 'ai-parsing',
          duration: 3000,
        });
      } else {
        // Fallback to manual parsing if AI fails
        console.warn('⚠️ AI parsing failed, using fallback:', result.error);
        toast.warning('AI parsing unavailable. Using basic parsing...', {
          id: 'ai-parsing',
          duration: 3000,
        });
        const fallbackData = parseResumeFallback(text);
        setResumeData(fallbackData);
        setUsedAI(false);
      }
    } catch (error) {
      console.error('❌ AI parsing error:', error);
      toast.error('Failed to parse resume. Using basic parsing...', {
        id: 'ai-parsing',
        duration: 3000,
      });
      const fallbackData = parseResumeFallback(text);
      setResumeData(fallbackData);
      setUsedAI(false);
    } finally {
      setIsParsing(false);
    }
  };

  // Fallback parsing (simple extraction)
  const parseResumeFallback = (text: string): ResumeData => {
    console.log('📄 Using fallback parsing...');
    
    const data: ResumeData = {
      name: '',
      nameTitle: 'Full Name',
      contact: '',
      contactTitle: 'Contact Information',
      personalInfoTitle: 'Personal Information',
      summary: '',
      experience: '',
      education: '',
      educationTitle: 'Education & Courses',
      courses: '',
      coursesTitle: 'Coursework',
      skills: '',
      skillsTitle: 'Skills',
      projects: '',
      projectsTitle: 'Projects',
      certifications: '',
      certificationsTitle: 'Certifications',
      publications: '',
      publicationsTitle: 'Publications',
      patents: '',
      patentsTitle: 'Patents',
      presentations: '',
      presentationsTitle: 'Presentations',
      awards: '',
      awardsTitle: 'Awards & Honors',
      activities: '',
      activitiesTitle: 'Activities & Volunteering',
      languages: '',
      languagesTitle: 'Languages',
      interests: '',
      interestsTitle: 'Hobbies & Interests',
      references: '',
      referencesTitle: 'References',
      customSections: []
    };

    // Extract just the first few lines as name/contact
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length > 0) {
      data.name = lines[0].trim();
    }
    if (lines.length > 1) {
      data.contact = lines[1].trim();
    }

    // Simple section extraction using regex
    const summaryMatch = text.match(/(?:SUMMARY|PROFILE|OBJECTIVE)\s*:?\s*\n+([^]*?)(?=\n+(?:EXPERIENCE|EDUCATION|SKILLS)|$)/i);
    if (summaryMatch) data.summary = summaryMatch[1].trim();

    const experienceMatch = text.match(/(?:EXPERIENCE|WORK EXPERIENCE|EMPLOYMENT)\s*:?\s*\n+([^]*?)(?=\n+(?:EDUCATION|SKILLS|PROJECTS)|$)/i);
    if (experienceMatch) data.experience = experienceMatch[1].trim();

    const educationMatch = text.match(/(?:EDUCATION)\s*:?\s*\n+([^]*?)(?=\n+(?:SKILLS|PROJECTS|CERTIFICATIONS)|$)/i);
    if (educationMatch) data.education = educationMatch[1].trim();

    const coursesMatch = text.match(/(?:COURSES|COURSEWORK)\s*:?\s*\n+([^]*?)(?=\n+(?:SKILLS|PROJECTS|EDUCATION)|$)/i);
    if (coursesMatch) data.courses = coursesMatch[1].trim();

    const skillsMatch = text.match(/(?:SKILLS|TECHNICAL SKILLS)\s*:?\s*\n+([^]*?)(?=\n+(?:EXPERIENCE|PROJECTS|EDUCATION)|$)/i);
    if (skillsMatch) data.skills = skillsMatch[1].trim();

    return data;
  };

  const reconstructResume = (data: ResumeData): string => {
    let resume = '';
    
    if (data.name) resume += data.name + '\n';
    if (data.contact) resume += data.contact + '\n';
    
    if (data.summary) {
      const summaryHeader = data.summaryTitle || 'PROFESSIONAL SUMMARY';
      resume += '\n' + summaryHeader.toUpperCase() + '\n\n' + data.summary + '\n';
    }
    
    if (data.experience) {
      const experienceHeader = data.experienceTitle || 'PROFESSIONAL EXPERIENCE';
      resume += '\n' + experienceHeader.toUpperCase() + '\n\n' + data.experience + '\n';
    }
    
    if (data.education) {
      const educationHeader = data.educationTitle || 'EDUCATION';
      resume += '\n' + educationHeader.toUpperCase() + '\n\n' + data.education + '\n';
    }
    
    if (data.courses) {
      const coursesHeader = data.coursesTitle || 'COURSEWORK';
      resume += '\n' + coursesHeader.toUpperCase() + '\n\n' + data.courses + '\n';
    }
    
    if (data.skills) {
      const skillsHeader = data.skillsTitle || 'SKILLS';
      resume += '\n' + skillsHeader.toUpperCase() + '\n\n' + data.skills + '\n';
    }

    if (data.projects) {
      const projectsHeader = data.projectsTitle || 'PROJECTS';
      resume += '\n' + projectsHeader.toUpperCase() + '\n\n' + data.projects + '\n';
    }

    if (data.certifications) {
      const certificationsHeader = data.certificationsTitle || 'CERTIFICATIONS';
      resume += '\n' + certificationsHeader.toUpperCase() + '\n\n' + data.certifications + '\n';
    }

    if (data.publications) {
      const publicationsHeader = data.publicationsTitle || 'PUBLICATIONS';
      resume += '\n' + publicationsHeader.toUpperCase() + '\n\n' + data.publications + '\n';
    }

    if (data.patents) {
      const patentsHeader = data.patentsTitle || 'PATENTS';
      resume += '\n' + patentsHeader.toUpperCase() + '\n\n' + data.patents + '\n';
    }

    if (data.presentations) {
      const presentationsHeader = data.presentationsTitle || 'PRESENTATIONS';
      resume += '\n' + presentationsHeader.toUpperCase() + '\n\n' + data.presentations + '\n';
    }

    if (data.awards) {
      const awardsHeader = data.awardsTitle || 'AWARDS';
      resume += '\n' + awardsHeader.toUpperCase() + '\n\n' + data.awards + '\n';
    }

    if (data.activities) {
      const activitiesHeader = data.activitiesTitle || 'ACTIVITIES';
      resume += '\n' + activitiesHeader.toUpperCase() + '\n\n' + data.activities + '\n';
    }

    if (data.languages) {
      const languagesHeader = data.languagesTitle || 'LANGUAGES';
      resume += '\n' + languagesHeader.toUpperCase() + '\n\n' + data.languages + '\n';
    }

    if (data.interests) {
      const interestsHeader = data.interestsTitle || 'HOBBIES AND INTERESTS';
      resume += '\n' + interestsHeader.toUpperCase() + '\n\n' + data.interests + '\n';
    }

    if (data.references) {
      const referencesHeader = data.referencesTitle || 'REFERENCES';
      resume += '\n' + referencesHeader.toUpperCase() + '\n\n' + data.references + '\n';
    }

    // Add custom sections
    if (data.customSections && data.customSections.length > 0) {
      data.customSections.forEach(section => {
        if (section.content && section.content.trim()) {
          resume += '\n' + section.title.toUpperCase() + '\n\n' + section.content + '\n';
        }
      });
    }

    return resume;
  };

  const updateField = (field: keyof ResumeData, value: string) => {
    const newData = { ...resumeData, [field]: value };
    setResumeData(newData);
    onDataChange(newData); // Notify parent of data change for caching
  };

  // Add custom section
  const handleAddCustomSection = (title: string) => {
    const newSection = {
      id: `custom-${Date.now()}`,
      title: title,
      content: '',
      icon: getIconForSectionTitle(title) // Add icon based on title
    };
    const newData = {
      ...resumeData,
      customSections: [...(resumeData.customSections || []), newSection]
    };
    setResumeData(newData);
    onDataChange(newData); // Cache the updated data with custom section
    toast.success(`Added "${title}" section!`);
  };

  // Helper function to get appropriate icon for custom section
  const getIconForSectionTitle = (title: string): any => {
    const upperTitle = title.toUpperCase();
    
    // Map common section titles to appropriate icons
    if (upperTitle.includes('AWARD') || upperTitle.includes('HONOR') || upperTitle.includes('ACHIEVEMENT')) {
      return Trophy;
    }
    if (upperTitle.includes('CERTIF') || upperTitle.includes('LICENSE')) {
      return Award;
    }
    if (upperTitle.includes('VOLUNTEER') || upperTitle.includes('ACTIVITY') || upperTitle.includes('COMMUNIT')) {
      return Users;
    }
    if (upperTitle.includes('EDUCATION') || upperTitle.includes('COURSE') || upperTitle.includes('TRAINING')) {
      return GraduationCap;
    }
    if (upperTitle.includes('SKILL') || upperTitle.includes('COMPETENC') || upperTitle.includes('EXPERTISE')) {
      return Lightbulb;
    }
    if (upperTitle.includes('PROJECT')) {
      return FolderKanban;
    }
    if (upperTitle.includes('EXPERIENCE') || upperTitle.includes('WORK') || upperTitle.includes('EMPLOYMENT')) {
      return Briefcase;
    }
    if (upperTitle.includes('LANGUAGE')) {
      return FileText;
    }
    if (upperTitle.includes('INTEREST') || upperTitle.includes('HOBBIES') || upperTitle.includes('HOBBY')) {
      return Heart;
    }
    if (upperTitle.includes('PUBLICATION') || upperTitle.includes('RESEARCH') || upperTitle.includes('PAPER')) {
      return FileText;
    }
    if (upperTitle.includes('REFERENCE')) {
      return Users;
    }
    
    // Default icon for custom sections
    return FileText;
  };

  // Get icon color based on icon type
  const getIconColor = (IconComponent: any): string => {
    if (IconComponent === Trophy) return 'text-amber-600';
    if (IconComponent === Award) return 'text-blue-600';
    if (IconComponent === Users) return 'text-indigo-600';
    if (IconComponent === GraduationCap) return 'text-orange-600';
    if (IconComponent === Lightbulb) return 'text-yellow-600';
    if (IconComponent === FolderKanban) return 'text-purple-600';
    if (IconComponent === Briefcase) return 'text-green-600';
    if (IconComponent === Heart) return 'text-pink-600';
    return 'text-blue-600'; // default
  };

  // Update custom section content
  const updateCustomSection = (id: string, content: string) => {
    setResumeData(prev => ({
      ...prev,
      customSections: prev.customSections?.map(section =>
        section.id === id ? { ...section, content } : section
      )
    }));
  };

  // Update custom section title
  const updateCustomSectionTitle = (id: string, title: string) => {
    setResumeData(prev => ({
      ...prev,
      customSections: prev.customSections?.map(section =>
        section.id === id ? { ...section, title } : section
      )
    }));
  };

  // Delete custom section
  const deleteCustomSection = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      customSections: prev.customSections?.filter(section => section.id !== id)
    }));
    toast.success('Section deleted!');
  };

  // Delete standard section (clear content)
  const deleteStandardSection = (sectionKey: keyof ResumeData) => {
    const newData = { ...resumeData, [sectionKey]: '' };
    setResumeData(newData);
    onDataChange(newData);
    toast.success('Section deleted!');
  };

  const handleNext = () => {
    // Reconstruct and save the resume before continuing
    const reconstructed = reconstructResume(resumeData);
    onChange(reconstructed);
    toast.success('Resume sections saved!');
    onContinue();
  };

  // Define section configurations
  type SectionConfig = {
    key: keyof ResumeData;
    titleKey?: keyof ResumeData; // Key for the editable title
    title: string;
    icon: any;
    iconColor: string;
    placeholder: string;
    tip?: string;
    minHeight?: string;
    showCharCount?: boolean;
    showLineCount?: boolean;
    alwaysShow?: boolean; // Always show in edit form
  };

  const sectionConfigs: SectionConfig[] = [
    {
      key: 'summary',
      titleKey: 'summaryTitle',
      title: resumeData.summaryTitle || 'Professional Summary',
      icon: FileText,
      iconColor: 'text-purple-600',
      placeholder: 'Brief overview of your professional background and key qualifications...',
      minHeight: 'min-h-[120px]',
      showCharCount: true
    },
    {
      key: 'experience',
      titleKey: 'experienceTitle',
      title: resumeData.experienceTitle || 'Professional Experience',
      icon: Briefcase,
      iconColor: 'text-green-600',
      placeholder: 'List your work experience with job titles, companies, dates, responsibilities, and achievements...\n\nExample:\nSenior Software Engineer | TechCorp | 2020-2023\n• Led development of microservices architecture serving 1M+ users\n• Improved system performance by 40% through optimization\n• Mentored team of 5 junior developers',
      minHeight: 'min-h-[200px]',
      showLineCount: true,
      tip: 'Include complete details: job titles, companies, dates, responsibilities, and achievements with metrics'
    },
    {
      key: 'education',
      titleKey: 'educationTitle',
      title: resumeData.educationTitle || 'Education',
      icon: GraduationCap,
      iconColor: 'text-orange-600',
      placeholder: 'List your degrees, institutions, dates, and any honors...\n\nExample:\nMaster of Science in Computer Science | Stanford University | 2018-2020\n• GPA: 3.9/4.0\n• Thesis: Machine Learning Applications in Healthcare',
      minHeight: 'min-h-[100px]',
      tip: 'Include degrees, institutions, dates, GPAs, honors, and relevant coursework if listed here'
    },
    {
      key: 'courses',
      titleKey: 'coursesTitle',
      title: resumeData.coursesTitle || 'Coursework',
      icon: GraduationCap,
      iconColor: 'text-orange-600',
      placeholder: 'List relevant courses (only if listed separately from Education)...',
      minHeight: 'min-h-[100px]',
      tip: 'Only shown if courses are listed separately from Education section'
    },
    {
      key: 'skills',
      titleKey: 'skillsTitle',
      title: resumeData.skillsTitle || 'Skills',
      icon: Lightbulb,
      iconColor: 'text-yellow-600',
      placeholder: 'List your technical and soft skills...\n\nExample:\nProgramming Languages: Python, Java, JavaScript, TypeScript\nFrameworks: React, Node.js, Django, Spring Boot\nTools: Git, Docker, Kubernetes, AWS',
      minHeight: 'min-h-[120px]',
      tip: 'Group skills by category (e.g., Programming Languages, Frameworks, Tools)'
    },
    {
      key: 'projects',
      titleKey: 'projectsTitle',
      title: resumeData.projectsTitle || 'Projects',
      icon: FolderKanban,
      iconColor: 'text-purple-600',
      placeholder: 'List standalone projects NOT in work experience (academic, personal, side projects)...\n\nExample:\nE-Commerce Platform | Personal Project | 2023\n• Built full-stack app with React, Node.js, MongoDB\n• Implemented payment gateway integration with Stripe\n• Deployed on AWS with 99.9% uptime',
      minHeight: 'min-h-[150px]',
      showLineCount: true,
      tip: 'For projects outside of work: academic, personal, side projects, open-source. Great for students!'
    },
    {
      key: 'certifications',
      titleKey: 'certificationsTitle',
      title: resumeData.certificationsTitle || 'Certifications',
      icon: Award,
      iconColor: 'text-blue-600',
      placeholder: 'List your professional certifications and licenses...\n\nExample:\nAWS Certified Solutions Architect | Amazon Web Services | 2022\nCertified ScrumMaster (CSM) | Scrum Alliance | 2021',
      minHeight: 'min-h-[100px]',
      tip: 'Include certification name, issuing organization, date, and expiry if relevant'
    },
    {
      key: 'publications',
      titleKey: 'publicationsTitle',
      title: resumeData.publicationsTitle || 'Publications',
      icon: FileText,
      iconColor: 'text-gray-600',
      placeholder: 'List your publications with complete citations...\n\nExample:\nSmith, J., et al. "Machine Learning in Healthcare." Journal of AI Research, 2022.\nDOI: 10.1234/jair.2022.001',
      minHeight: 'min-h-[100px]',
      tip: 'Include full titles, authors, journals/conferences, dates, and DOIs'
    },
    {
      key: 'patents',
      titleKey: 'patentsTitle',
      title: resumeData.patentsTitle || 'Patents',
      icon: FileText,
      iconColor: 'text-gray-600',
      placeholder: 'List your patents with details...\n\nExample:\nMethod for Optimizing Database Queries | US Patent 10,123,456 | Granted 2021',
      minHeight: 'min-h-[100px]',
      tip: 'Include patent title, number, date, and status (filed/granted)'
    },
    {
      key: 'presentations',
      titleKey: 'presentationsTitle',
      title: resumeData.presentationsTitle || 'Presentations',
      icon: FileText,
      iconColor: 'text-gray-600',
      placeholder: 'List your conference talks and presentations...\n\nExample:\n"Scalable Microservices Architecture" | AWS re:Invent 2022 | Las Vegas, NV',
      minHeight: 'min-h-[100px]',
      tip: 'Include presentation title, event name, location, and date'
    },
    {
      key: 'awards',
      titleKey: 'awardsTitle',
      title: resumeData.awardsTitle || 'Awards & Honors',
      icon: Trophy,
      iconColor: 'text-amber-600',
      placeholder: 'List your awards, honors, and recognitions...\n\nExample:\nEmployee of the Year | TechCorp | 2022\nDean\'s List | University Name | 2017-2019',
      minHeight: 'min-h-[100px]',
      tip: 'Include award name, organization, date, and brief description if notable'
    },
    {
      key: 'activities',
      titleKey: 'activitiesTitle',
      title: resumeData.activitiesTitle || 'Activities & Volunteering',
      icon: Users,
      iconColor: 'text-indigo-600',
      placeholder: 'List your volunteer work and activities...\n\nExample:\nVolunteer Software Developer | Code for Good | 2021-Present\n• Developed web apps for non-profit organizations',
      minHeight: 'min-h-[100px]',
      tip: 'Include organization, role, dates, and description of activities'
    },
    {
      key: 'languages',
      titleKey: 'languagesTitle',
      title: resumeData.languagesTitle || 'Languages',
      icon: FileText,
      iconColor: 'text-gray-600',
      placeholder: 'List foreign languages with proficiency levels...\n\nExample:\nEnglish: Native\nSpanish: Fluent\nMandarin: Intermediate',
      minHeight: 'min-h-[100px]',
      tip: 'Include language name and proficiency (Native, Fluent, Intermediate, Basic)'
    },
    {
      key: 'interests',
      titleKey: 'interestsTitle',
      title: resumeData.interestsTitle || 'Hobbies & Interests',
      icon: Heart,
      iconColor: 'text-pink-600',
      placeholder: 'List your hobbies and personal interests (optional)...',
      minHeight: 'min-h-[80px]',
      tip: 'Keep brief and relevant to professional context'
    },
    {
      key: 'references',
      titleKey: 'referencesTitle',
      title: resumeData.referencesTitle || 'References',
      icon: FileText,
      iconColor: 'text-gray-600',
      placeholder: 'List your references or write "Available upon request"...\n\nExample:\nDr. Jane Smith | Professor | Stanford University | jsmith@stanford.edu',
      minHeight: 'min-h-[100px]',
      tip: 'Include name, title, organization, and contact information'
    }
  ];

  // Filter sections to show only those with content (or always shown)
  const sectionsToShow = sectionConfigs.filter(config => 
    config.alwaysShow || resumeData[config.key].trim().length > 0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Button onClick={onBack} variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {isEditMode ? 'Back to Dashboard' : 'Back'}
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2.5 rounded-xl">
              <FileCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl">Edit Resume Sections</h1>
              <p className="text-sm text-gray-600">{fileName}</p>
            </div>
          </div>

          <Button 
            onClick={handleNext}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Edit Mode Notice */}
        {isEditMode && (
          <div className="mb-6">
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm">
                    <span className="text-blue-900">Editing existing resume.</span> Make your changes below, then continue to rematch with new job descriptions.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Info Banner */}
        {isParsing ? (
          // Parsing Warning Banner
          <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-5 mb-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 p-2 rounded-lg">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-700"></div>
              </div>
              <div className="flex-1">
                <p className="text-yellow-900 font-semibold text-lg">⏳ AI is Parsing Your Resume</p>
                <p className="text-sm text-yellow-800 mt-1">
                  Please be patient while we analyze your resume. This may take a few moments. Do not refresh or navigate away.
                </p>
              </div>
              <Badge variant="outline" className="bg-yellow-100 border-yellow-400 text-yellow-800 font-medium">
                Parsing...
              </Badge>
            </div>
          </div>
        ) : (
          // Normal Info Banner
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-blue-900">Review and edit each section of your resume</p>
                <p className="text-sm text-blue-700">
                  Make sure all information is accurate before proceeding to optimization.
                </p>
              </div>
              {usedAI && (
                <Badge variant="outline" className="bg-purple-50 border-purple-300 text-purple-700">
                  🤖 AI Parsed
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left - Editable Sections */}
          <div className="space-y-6">
            {/* Personal Details - Hidden during parsing */}
            {!isParsing && (
              <PersonalDetailsForm
                firstName={resumeData.firstName}
                lastName={resumeData.lastName}
                jobTitle={resumeData.jobTitle}
                nationality={resumeData.nationality}
                driversLicense={resumeData.driversLicense}
                birthDate={resumeData.birthDate}
                photoUrl={resumeData.photoUrl}
                onUpdate={updateField}
              />
            )}
            
            {/* Contact Information - Hidden during parsing */}
            {!isParsing && (
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <h2 className="text-xl flex-1">Contact Information</h2>
                </div>
                
                <p className="text-sm text-gray-600 mb-6">
                  Contact information such as email, phone, and location help recruiters reach out to you.
                </p>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="contact" className="text-sm text-gray-600">
                      Contact details
                    </Label>
                    <Textarea
                      id="contact"
                      value={resumeData.contact}
                      onChange={(e) => updateField('contact', e.target.value)}
                      placeholder="Email: john@example.com\nPhone: (555) 123-4567\nLocation: San Francisco, CA\nLinkedIn: linkedin.com/in/johndoe\nWebsite: johndoe.com"
                      className="mt-1.5 min-h-[120px] resize-none"
                    />
                  </div>
                </div>
              </Card>
            )}
            
            {/* Editable Sections */}
            {sectionsToShow.map(config => (
              <Card key={config.key} className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <config.icon className={`w-5 h-5 ${config.iconColor}`} />
                  {config.titleKey && editingHeaderKey === config.key ? (
                    <Input
                      value={config.title}
                      onChange={(e) => updateField(config.titleKey!, e.target.value)}
                      onBlur={() => setEditingHeaderKey(null)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setEditingHeaderKey(null);
                      }}
                      className="text-xl h-8 px-2 py-1 flex-1"
                      autoFocus
                    />
                  ) : (
                    <>
                      <h2 className="text-xl flex-1">{config.title}</h2>
                      {config.titleKey && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingHeaderKey(config.key)}
                          className="h-8"
                          title="Edit section title"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      )}
                      {!config.alwaysShow && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteStandardSection(config.key)}
                          className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Delete section"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </>
                  )}
                  {config.showCharCount && (
                    <Badge variant="secondary">
                      {resumeData[config.key].length} chars
                    </Badge>
                  )}
                  {config.showLineCount && (
                    <Badge variant="secondary">
                      {resumeData[config.key].split('\n').filter(l => l.trim()).length} lines
                    </Badge>
                  )}
                </div>
                
                <Textarea
                  value={resumeData[config.key]}
                  onChange={(e) => updateField(config.key, e.target.value)}
                  placeholder={config.placeholder}
                  className={`${config.minHeight} resize-none ${config.key === 'skills' ? 'font-mono text-sm' : ''}`}
                />
                {config.tip && (
                  <p className="text-xs text-gray-500 mt-2">
                    Tip: {config.tip}
                  </p>
                )}
              </Card>
            ))}

            {/* Custom Sections */}
            {resumeData.customSections && resumeData.customSections.map((section) => (
              <Card key={section.id} className="p-6 border-2 border-dashed border-blue-300">
                <div className="flex items-center gap-2 mb-4">
                  <section.icon className="w-5 h-5 text-blue-600" />
                  {editingHeaderKey === section.id ? (
                    <Input
                      value={section.title}
                      onChange={(e) => updateCustomSectionTitle(section.id, e.target.value)}
                      onBlur={() => setEditingHeaderKey(null)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setEditingHeaderKey(null);
                      }}
                      className="text-xl h-8 px-2 py-1"
                      autoFocus
                    />
                  ) : (
                    <>
                      <h2 className="text-xl flex-1">{section.title}</h2>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingHeaderKey(section.id)}
                        className="h-8"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteCustomSection(section.id)}
                    className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                
                <Textarea
                  value={section.content}
                  onChange={(e) => updateCustomSection(section.id, e.target.value)}
                  placeholder="Add your custom content here..."
                  className="min-h-[150px] resize-none"
                />
              </Card>
            ))}

            {/* Add Section Button */}
            {!isParsing && <AddSectionDialog onAddSection={handleAddCustomSection} />}
          </div>

          {/* Right - Preview */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl">Resume Preview</h2>
                <Badge variant="outline">Live Preview</Badge>
              </div>
              
              <Separator className="mb-6" />
              
              <div className="space-y-6 max-h-[700px] overflow-y-auto pr-2">
                {/* Name and Contact */}
                {resumeData.name && (
                  <div className="text-center border-b border-gray-200 pb-4">
                    <h1 className="text-2xl text-gray-900 mb-2">{resumeData.name}</h1>
                    {resumeData.contact && (
                      <p className="text-sm text-gray-600">{resumeData.contact}</p>
                    )}
                  </div>
                )}

                {/* Summary */}
                {resumeData.summary && (
                  <div>
                    <h3 className="text-blue-600 mb-2">{(resumeData.summaryTitle || 'PROFESSIONAL SUMMARY').toUpperCase()}</h3>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {resumeData.summary}
                    </p>
                  </div>
                )}

                {/* Experience */}
                {resumeData.experience && (
                  <div>
                    <h3 className="text-blue-600 mb-2">{(resumeData.experienceTitle || 'PROFESSIONAL EXPERIENCE').toUpperCase()}</h3>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">
                      {resumeData.experience}
                    </div>
                  </div>
                )}

                {/* Education */}
                {resumeData.education && (
                  <div>
                    <h3 className="text-blue-600 mb-2">{(resumeData.educationTitle || 'EDUCATION').toUpperCase()}</h3>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">
                      {resumeData.education}
                    </div>
                  </div>
                )}

                {/* Courses */}
                {resumeData.courses && (
                  <div>
                    <h3 className="text-blue-600 mb-2">{(resumeData.coursesTitle || 'COURSEWORK').toUpperCase()}</h3>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">
                      {resumeData.courses}
                    </div>
                  </div>
                )}

                {/* Skills */}
                {resumeData.skills && (
                  <div>
                    <h3 className="text-blue-600 mb-2">{(resumeData.skillsTitle || 'SKILLS').toUpperCase()}</h3>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">
                      {resumeData.skills}
                    </div>
                  </div>
                )}

                {/* Projects */}
                {resumeData.projects && (
                  <div>
                    <h3 className="text-blue-600 mb-2">{(resumeData.projectsTitle || 'PROJECTS').toUpperCase()}</h3>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">
                      {resumeData.projects}
                    </div>
                  </div>
                )}

                {/* Certifications */}
                {resumeData.certifications && (
                  <div>
                    <h3 className="text-blue-600 mb-2">{(resumeData.certificationsTitle || 'CERTIFICATIONS').toUpperCase()}</h3>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">
                      {resumeData.certifications}
                    </div>
                  </div>
                )}

                {/* Publications */}
                {resumeData.publications && (
                  <div>
                    <h3 className="text-blue-600 mb-2">{(resumeData.publicationsTitle || 'PUBLICATIONS').toUpperCase()}</h3>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">
                      {resumeData.publications}
                    </div>
                  </div>
                )}

                {/* Patents */}
                {resumeData.patents && (
                  <div>
                    <h3 className="text-blue-600 mb-2">{(resumeData.patentsTitle || 'PATENTS').toUpperCase()}</h3>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">
                      {resumeData.patents}
                    </div>
                  </div>
                )}

                {/* Presentations */}
                {resumeData.presentations && (
                  <div>
                    <h3 className="text-blue-600 mb-2">{(resumeData.presentationsTitle || 'PRESENTATIONS').toUpperCase()}</h3>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">
                      {resumeData.presentations}
                    </div>
                  </div>
                )}

                {/* Awards */}
                {resumeData.awards && (
                  <div>
                    <h3 className="text-blue-600 mb-2">{(resumeData.awardsTitle || 'AWARDS & HONORS').toUpperCase()}</h3>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">
                      {resumeData.awards}
                    </div>
                  </div>
                )}

                {/* Activities */}
                {resumeData.activities && (
                  <div>
                    <h3 className="text-blue-600 mb-2">{(resumeData.activitiesTitle || 'ACTIVITIES & VOLUNTEERING').toUpperCase()}</h3>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">
                      {resumeData.activities}
                    </div>
                  </div>
                )}

                {/* Languages */}
                {resumeData.languages && (
                  <div>
                    <h3 className="text-blue-600 mb-2">{(resumeData.languagesTitle || 'LANGUAGES').toUpperCase()}</h3>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">
                      {resumeData.languages}
                    </div>
                  </div>
                )}

                {/* Hobbies & Interests */}
                {resumeData.interests && (
                  <div>
                    <h3 className="text-blue-600 mb-2">{(resumeData.interestsTitle || 'HOBBIES & INTERESTS').toUpperCase()}</h3>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">
                      {resumeData.interests}
                    </div>
                  </div>
                )}

                {/* References */}
                {resumeData.references && (
                  <div>
                    <h3 className="text-blue-600 mb-2">{(resumeData.referencesTitle || 'REFERENCES').toUpperCase()}</h3>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">
                      {resumeData.references}
                    </div>
                  </div>
                )}

                {/* Custom Sections */}
                {resumeData.customSections && resumeData.customSections.map((section) => section.content && (
                  <div key={section.id}>
                    <h3 className="text-blue-600 mb-2">{section.title.toUpperCase()}</h3>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">
                      {section.content}
                    </div>
                  </div>
                ))}

                {!resumeData.name && !resumeData.summary && !resumeData.experience && (
                  <div className="text-center py-16 text-gray-400">
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p>Start filling in your resume sections</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}