import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
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
  X
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
  cachedParsedData?: any;
}

export function AIRewritePanel({ 
  originalResume, 
  jobDescription, 
  onBack, 
  onNext,
  cachedParsedData
}: AIRewritePanelProps) {
  const [currentSection, setCurrentSection] = useState<SectionType>('personalDetails');
  const [industryTone, setIndustryTone] = useState<string>('');
  const [rewriteStyle, setRewriteStyle] = useState<string>('');
  const [showSettings, setShowSettings] = useState(true);
  const [showAdditionalDetails, setShowAdditionalDetails] = useState(false);
  const [showReorderDialog, setShowReorderDialog] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  
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
    links: [],
    customSections: []
  });

  const [sectionOrder, setSectionOrder] = useState<SectionOrder[]>([
    { id: 'personalDetails', type: 'personalDetails', label: 'Personal details', visible: true },
    { id: 'contact', type: 'contact', label: 'Contact information', visible: true },
    { id: 'summary', type: 'summary', label: 'Professional summary', visible: true },
    { id: 'experience', type: 'experience', label: 'Employment history', visible: true },
    { id: 'education', type: 'education', label: 'Education', visible: true },
    { id: 'skills', type: 'skills', label: 'Skills', visible: true },
    { id: 'links', type: 'links', label: 'Links', visible: false },
  ]);

  // Parse resume data on mount
  useEffect(() => {
    if (cachedParsedData) {
      parseResumeData(cachedParsedData);
    } else {
      parseResumeFromText(originalResume);
    }
  }, [originalResume, cachedParsedData]);

  // Auto-optimize with AI when settings change
  useEffect(() => {
    if (industryTone && rewriteStyle && resumeData.summary) {
      optimizeWithAI();
    }
  }, [industryTone, rewriteStyle]);

  const parseResumeData = (data: any) => {
    const parsed: ResumeData = {
      personalDetails: {
        firstName: data.firstName || '',
        lastName: data.lastName || '',
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
        website: extractWebsite(data.contact || '')
      },
      summary: data.summary || '',
      experience: parseExperience(data.experience || ''),
      education: parseEducation(data.education || ''),
      skills: parseSkills(data.skills || ''),
      links: [],
      customSections: []
    };

    setResumeData(parsed);
  };

  const parseResumeFromText = (text: string) => {
    const lines = text.split('\n');
    
    // Extract name from first line
    const firstName = lines[0]?.split(' ')[0] || '';
    const lastName = lines[0]?.split(' ').slice(1).join(' ') || '';

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
      summary: '',
      experience: parseExperience(text),
      education: parseEducation(text),
      skills: parseSkills(text),
      links: [],
      customSections: []
    };

    setResumeData(parsed);
  };

  // Helper functions for parsing
  const extractEmail = (text: string): string => {
    const match = text.match(/[\w\.-]+@[\w\.-]+\.\w+/);
    return match ? match[0] : '';
  };

  const extractPhone = (text: string): string => {
    const match = text.match(/(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/);
    return match ? match[0] : '';
  };

  const extractAddress = (text: string): string => {
    return '';
  };

  const extractLinkedIn = (text: string): string => {
    const match = text.match(/linkedin\.com\/in\/[\w-]+/);
    return match ? match[0] : '';
  };

  const extractWebsite = (text: string): string => {
    const match = text.match(/(https?:\/\/)?(www\.)?[\w-]+\.\w+/);
    return match && !match[0].includes('linkedin') && !match[0].includes('@') ? match[0] : '';
  };

  const parseExperience = (text: string): ResumeData['experience'] => {
    // Basic parsing - you can enhance this with AI
    return [];
  };

  const parseEducation = (text: string): ResumeData['education'] => {
    return [];
  };

  const parseSkills = (text: string): string[] => {
    const skillsMatch = text.match(/SKILLS[\s\S]*?(?=\n\n[A-Z]|\n\n$|$)/i);
    if (skillsMatch) {
      return skillsMatch[0]
        .replace(/SKILLS/i, '')
        .split(/[,\n•|]/)
        .map(s => s.trim())
        .filter(s => s && s.length > 1);
    }
    return [];
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
    const newSection = {
      id: `custom-${Date.now()}`,
      title: 'Custom Section',
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
    
    setCurrentSection('customSections');
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

  const handleNext = async () => {
    if (!industryTone || !rewriteStyle) {
      toast.error('Please select Industry Tone and Rewrite Style');
      setShowSettings(true);
      return;
    }

    const finalResume = generateResumeText(resumeData);
    onNext(finalResume);
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
      }
    });

    return text;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Settings Panel */}
      {showSettings && (!industryTone || !rewriteStyle) && (
        <div className="bg-white border-b shadow-sm p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <h2>AI Resume Optimization Settings</h2>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label htmlFor="industry-tone">Industry Tone</Label>
                <Select value={industryTone} onValueChange={setIndustryTone}>
                  <SelectTrigger id="industry-tone">
                    <SelectValue placeholder="Select industry tone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="creative">Creative</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="executive">Executive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="rewrite-style">Rewrite Style</Label>
                <Select value={rewriteStyle} onValueChange={setRewriteStyle}>
                  <SelectTrigger id="rewrite-style">
                    <SelectValue placeholder="Select rewrite style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="concise">Concise</SelectItem>
                    <SelectItem value="detailed">Detailed</SelectItem>
                    <SelectItem value="balanced">Balanced</SelectItem>
                    <SelectItem value="achievement">Achievement-focused</SelectItem>
                  </SelectContent>
                </Select>
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

      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Sidebar Navigation */}
        <div className="w-64 bg-white border-r">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-1">
              {getNavigationItems().map((item) => {
                const icons = {
                  personalDetails: User,
                  contact: Phone,
                  summary: FileText,
                  experience: Briefcase,
                  education: GraduationCap,
                  skills: Wrench,
                  links: Link2,
                  customSections: FileText
                };
                const Icon = icons[item.type];
                
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentSection(item.type)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      currentSection === item.type
                        ? 'bg-blue-50 text-blue-600'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{item.label}</span>
                  </button>
                );
              })}
              <Separator className="my-2" />
              <button
                onClick={addCustomSection}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-700"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">Additional section</span>
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
                    <Button variant="outline" className="w-full">
                      <Camera className="w-4 h-4 mr-2" />
                      Add photo
                    </Button>
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
                    <Label htmlFor="summary">Summary</Label>
                    <Textarea
                      id="summary"
                      value={resumeData.summary}
                      onChange={(e) => updateSummary(e.target.value)}
                      placeholder="Write a compelling professional summary..."
                      rows={6}
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
                          <Label>Description</Label>
                          <Textarea
                            value={exp.description}
                            onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                            placeholder="Describe your responsibilities and achievements..."
                            rows={4}
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
                          <Label>Details (GPA, honors, coursework)</Label>
                          <Textarea
                            value={edu.details}
                            onChange={(e) => updateEducation(edu.id, 'details', e.target.value)}
                            placeholder="GPA: 3.8/4.0, Dean's List..."
                            rows={3}
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
                      List your relevant skills and competencies (comma-separated).
                    </p>
                  </div>
                  <Textarea
                    value={resumeData.skills.join(', ')}
                    onChange={(e) => setResumeData(prev => ({
                      ...prev,
                      skills: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                    }))}
                    placeholder="JavaScript, React, Node.js, Python, SQL..."
                    rows={6}
                  />
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
            </Card>

            {/* Bottom Navigation */}
            <div className="flex items-center justify-between mt-6">
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              <Button variant="outline" onClick={() => setShowReorderDialog(true)}>
                <Menu className="w-4 h-4 mr-2" />
                Reorder sections
              </Button>

              <Button onClick={handleNext}>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
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
                          <h1 className="text-3xl">
                            {resumeData.personalDetails.firstName} {resumeData.personalDetails.lastName}
                          </h1>
                          {resumeData.personalDetails.jobTitle && (
                            <p className="text-gray-600 mt-2">{resumeData.personalDetails.jobTitle}</p>
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
                      return (
                        <div key={section.id}>
                          <h3 className="text-sm font-semibold mb-2 uppercase">Professional Summary</h3>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {resumeData.summary}
                          </p>
                        </div>
                      );

                    case 'experience':
                      if (resumeData.experience.length === 0) return null;
                      return (
                        <div key={section.id}>
                          <h3 className="text-sm font-semibold mb-3 uppercase">Employment History</h3>
                          {resumeData.experience.map((exp) => (
                            <div key={exp.id} className="mb-4">
                              <div className="font-medium text-sm">{exp.title}</div>
                              <div className="text-sm text-gray-600">
                                {exp.company}{exp.location && ` | ${exp.location}`}
                              </div>
                              <div className="text-xs text-gray-500 mb-2">
                                {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                              </div>
                              <p className="text-sm text-gray-700 whitespace-pre-line">{exp.description}</p>
                            </div>
                          ))}
                        </div>
                      );

                    case 'education':
                      if (resumeData.education.length === 0) return null;
                      return (
                        <div key={section.id}>
                          <h3 className="text-sm font-semibold mb-3 uppercase">Education</h3>
                          {resumeData.education.map((edu) => (
                            <div key={edu.id} className="mb-3">
                              <div className="font-medium text-sm">{edu.degree}</div>
                              <div className="text-sm text-gray-600">
                                {edu.institution}{edu.location && ` | ${edu.location}`}
                              </div>
                              <div className="text-xs text-gray-500">
                                {edu.startDate} - {edu.current ? 'Present' : edu.endDate}
                              </div>
                              {edu.details && (
                                <p className="text-sm text-gray-700 mt-1">{edu.details}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      );

                    case 'skills':
                      if (resumeData.skills.length === 0) return null;
                      return (
                        <div key={section.id}>
                          <h3 className="text-sm font-semibold mb-2 uppercase">Skills</h3>
                          <div className="text-sm text-gray-700">
                            {resumeData.skills.join(' • ')}
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
    </div>
  );
}
