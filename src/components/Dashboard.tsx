import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { 
  FileText, 
  Briefcase, 
  TrendingUp,
  Plus,
  Search,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Download,
  Copy,
  Clock,
  Target,
  LogOut,
  Home,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import jsPDF from 'jspdf';

interface SavedResume {
  id: string;
  name: string;
  jobTitle: string;
  lastModified: string;
  matchScore: number;
  version: number;
}

interface SavedJob {
  id: string;
  company: string;
  position: string;
  dateAdded: string;
  matchScore: number;
  status: 'active' | 'applied' | 'archived';
}

interface MatchHistory {
  id: string;
  resumeName: string;
  jobTitle: string;
  score: number;
  date: string;
}

interface DashboardProps {
  onNewResume: () => void;
  onEditResume: (resumeId: string) => void;
  onViewResume: (resumeId: string) => void;
  onSignOut: () => void;
  onBackToHome: () => void;
  onBack: () => void; // New prop for Go Back functionality
  isAuthenticated: boolean;
}

export function Dashboard({ 
  onNewResume, 
  onEditResume, 
  onViewResume,
  onSignOut,
  onBackToHome,
  onBack,
  isAuthenticated 
}: DashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('resumes');

  // Mock data - in production, this would come from Supabase
  const [resumes, setResumes] = useState<SavedResume[]>([
    {
      id: '1',
      name: 'Software Engineer Resume',
      jobTitle: 'Senior Software Engineer',
      lastModified: '2024-11-03',
      matchScore: 87,
      version: 3
    },
    {
      id: '2',
      name: 'Product Manager Resume',
      jobTitle: 'Product Manager',
      lastModified: '2024-11-01',
      matchScore: 92,
      version: 2
    },
    {
      id: '3',
      name: 'Data Analyst Resume',
      jobTitle: 'Data Analyst',
      lastModified: '2024-10-28',
      matchScore: 78,
      version: 1
    }
  ]);

  const [jobs, setJobs] = useState<SavedJob[]>([
    {
      id: '1',
      company: 'TechCorp Inc.',
      position: 'Senior Software Engineer',
      dateAdded: '2024-11-02',
      matchScore: 87,
      status: 'active'
    },
    {
      id: '2',
      company: 'InnovateLabs',
      position: 'Product Manager',
      dateAdded: '2024-10-30',
      matchScore: 92,
      status: 'applied'
    },
    {
      id: '3',
      company: 'DataFlow Systems',
      position: 'Data Analyst',
      dateAdded: '2024-10-25',
      matchScore: 78,
      status: 'archived'
    }
  ]);

  const [matchHistory, setMatchHistory] = useState<MatchHistory[]>([
    {
      id: '1',
      resumeName: 'Software Engineer Resume v3',
      jobTitle: 'Senior Software Engineer at TechCorp',
      score: 87,
      date: '2024-11-03'
    },
    {
      id: '2',
      resumeName: 'Product Manager Resume v2',
      jobTitle: 'Product Manager at InnovateLabs',
      score: 92,
      date: '2024-11-01'
    },
    {
      id: '3',
      resumeName: 'Data Analyst Resume v1',
      jobTitle: 'Data Analyst at DataFlow',
      score: 78,
      date: '2024-10-28'
    }
  ]);

  const handleDeleteResume = (id: string) => {
    setResumes(resumes.filter(r => r.id !== id));
    toast.success('Resume deleted successfully');
  };

  const handleDuplicateResume = (id: string) => {
    const resume = resumes.find(r => r.id === id);
    if (resume) {
      const newResume = {
        ...resume,
        id: String(Date.now()),
        name: `${resume.name} (Copy)`,
        version: 1
      };
      setResumes([newResume, ...resumes]);
      toast.success('Resume duplicated successfully');
    }
  };

  const handleDownloadResume = (id: string, format: 'pdf' | 'docx') => {
    const resume = resumes.find(r => r.id === id);
    if (!resume) return;

    toast.success(`Generating ${format.toUpperCase()}...`);

    // Generate mock resume content based on the resume data
    const generateResumeContent = (resume: SavedResume): string => {
      return `JOHN DOE
Email: john.doe@email.com | Phone: (555) 123-4567 | LinkedIn: linkedin.com/in/johndoe

PROFESSIONAL SUMMARY
${resume.jobTitle} with ${resume.version + 2} years of experience in technology and innovation. Proven track record of delivering high-impact solutions and driving results in fast-paced environments.

EXPERIENCE

${resume.jobTitle}
TechCorp Solutions | 2022 - Present
• Led cross-functional teams to deliver complex projects on time and under budget
• Improved system performance by 40% through strategic optimizations
• Mentored junior team members and conducted code reviews
• Collaborated with stakeholders to define product roadmap and priorities

Senior Associate
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
• Google Cloud Professional

Version: ${resume.version} | Last Modified: ${new Date(resume.lastModified).toLocaleDateString()}`;
    };

    const fileName = resume.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');

    setTimeout(() => {
      const content = generateResumeContent(resume);

      if (format === 'pdf') {
        // Generate PDF
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        const maxWidth = pageWidth - (margin * 2);
        let yPosition = margin;

        // Split content into lines
        const lines = content.split('\n');

        lines.forEach((line) => {
          const trimmed = line.trim();

          // Check if we need a new page
          if (yPosition > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
          }

          // Check if line is a section header
          const sectionHeaders = ['PROFESSIONAL SUMMARY', 'SUMMARY', 'EXPERIENCE', 'WORK EXPERIENCE', 
                                  'EDUCATION', 'SKILLS', 'PROJECTS', 'CERTIFICATIONS', 'ACHIEVEMENTS'];
          const isHeader = sectionHeaders.some(header => 
            trimmed.toUpperCase() === header || trimmed.toUpperCase().startsWith(header)
          );

          // Check if it's the name (first line)
          const isName = trimmed === trimmed.toUpperCase() && yPosition === margin && trimmed.length > 0 && !trimmed.includes('|');

          if (isName && trimmed.length < 50) {
            // Name header
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text(trimmed, pageWidth / 2, yPosition, { align: 'center' });
            yPosition += 10;
          } else if (isHeader) {
            // Section headers
            yPosition += 5;
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(trimmed, margin, yPosition);
            doc.setLineWidth(0.5);
            doc.line(margin, yPosition + 2, pageWidth - margin, yPosition + 2);
            yPosition += 10;
          } else if (trimmed) {
            // Regular content
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');

            // Handle bullet points
            if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('→')) {
              const bulletText = trimmed.substring(1).trim();
              const splitText = doc.splitTextToSize(bulletText, maxWidth - 10);
              doc.text('•', margin + 5, yPosition);
              doc.text(splitText, margin + 10, yPosition);
              yPosition += splitText.length * 5;
            } else {
              // Regular text
              const splitText = doc.splitTextToSize(trimmed, maxWidth);
              doc.text(splitText, margin, yPosition);
              yPosition += splitText.length * 5;
            }
          } else {
            // Empty line
            yPosition += 5;
          }
        });

        // Save the PDF
        doc.save(`${fileName}_v${resume.version}.pdf`);
        toast.success('Resume downloaded as PDF!');
      } else if (format === 'docx') {
        // Generate Word document (as plain text for now)
        // In production, you would use a library like docx to create proper Word documents
        const blob = new Blob([content], { 
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${fileName}_v${resume.version}.docx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('Resume downloaded as Word document!');
      }
    }, 500);
  };

  const handleDeleteJob = (id: string) => {
    setJobs(jobs.filter(j => j.id !== id));
    toast.success('Job description deleted');
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number): 'default' | 'secondary' | 'destructive' => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { text: string; variant: 'default' | 'secondary' | 'outline' }> = {
      active: { text: 'Active', variant: 'default' },
      applied: { text: 'Applied', variant: 'secondary' },
      archived: { text: 'Archived', variant: 'outline' }
    };
    return variants[status] || variants.active;
  };

  const filteredResumes = resumes.filter(resume =>
    resume.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resume.jobTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredJobs = jobs.filter(job =>
    job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button 
            onClick={onBack}
            variant="ghost"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-xl">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-3xl">Resume Dashboard</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              onClick={onBackToHome}
              variant="outline"
              size="sm"
            >
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
            <Button onClick={onSignOut} variant="ghost" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <FileText className="w-8 h-8 text-blue-600" />
              <Badge variant="secondary">{resumes.length}</Badge>
            </div>
            <h3 className="text-2xl mb-1">{resumes.length}</h3>
            <p className="text-sm text-gray-600">Total Resumes</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Briefcase className="w-8 h-8 text-green-600" />
              <Badge variant="secondary">{jobs.filter(j => j.status === 'active').length}</Badge>
            </div>
            <h3 className="text-2xl mb-1">{jobs.filter(j => j.status === 'active').length}</h3>
            <p className="text-sm text-gray-600">Active Jobs</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-8 h-8 text-purple-600" />
              <Badge variant="secondary">{jobs.filter(j => j.status === 'applied').length}</Badge>
            </div>
            <h3 className="text-2xl mb-1">{jobs.filter(j => j.status === 'applied').length}</h3>
            <p className="text-sm text-gray-600">Applications</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-orange-600" />
              <Badge variant="secondary">
                {Math.round(resumes.reduce((acc, r) => acc + r.matchScore, 0) / resumes.length)}%
              </Badge>
            </div>
            <h3 className="text-2xl mb-1">
              {Math.round(resumes.reduce((acc, r) => acc + r.matchScore, 0) / resumes.length)}%
            </h3>
            <p className="text-sm text-gray-600">Avg Match Score</p>
          </Card>
        </div>

        {/* Search and New Resume */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search resumes and jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Button 
            onClick={onNewResume}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Resume
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="resumes">
              <FileText className="w-4 h-4 mr-2" />
              Resumes
            </TabsTrigger>
            <TabsTrigger value="jobs">
              <Briefcase className="w-4 h-4 mr-2" />
              Job Descriptions
            </TabsTrigger>
            <TabsTrigger value="history">
              <Clock className="w-4 h-4 mr-2" />
              Match History
            </TabsTrigger>
          </TabsList>

          {/* Resumes Tab */}
          <TabsContent value="resumes">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Resume Name</TableHead>
                    <TableHead>Target Role</TableHead>
                    <TableHead>Last Modified</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Match Score</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResumes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No resumes found. Click "New Resume" to get started!
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredResumes.map((resume) => (
                      <TableRow key={resume.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-500" />
                            {resume.name}
                          </div>
                        </TableCell>
                        <TableCell>{resume.jobTitle}</TableCell>
                        <TableCell>{new Date(resume.lastModified).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline">v{resume.version}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getScoreBadgeVariant(resume.matchScore)}>
                            {resume.matchScore}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onViewResume(resume.id)}>
                                <Eye className="w-4 h-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onEditResume(resume.id)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDuplicateResume(resume.id)}>
                                <Copy className="w-4 h-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                  <Download className="w-4 h-4 mr-2" />
                                  Download
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                  <DropdownMenuItem onClick={() => handleDownloadResume(resume.id, 'pdf')}>
                                    <FileText className="w-4 h-4 mr-2" />
                                    PDF Document
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDownloadResume(resume.id, 'docx')}>
                                    <FileText className="w-4 h-4 mr-2" />
                                    Word Document (.docx)
                                  </DropdownMenuItem>
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteResume(resume.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Jobs Tab */}
          <TabsContent value="jobs">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Date Added</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Match Score</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJobs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No job descriptions saved yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredJobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-gray-500" />
                            {job.company}
                          </div>
                        </TableCell>
                        <TableCell>{job.position}</TableCell>
                        <TableCell>{new Date(job.dateAdded).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadge(job.status).variant}>
                            {getStatusBadge(job.status).text}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getScoreBadgeVariant(job.matchScore)}>
                            {job.matchScore}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => toast.info('View feature coming soon')}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast.info('Edit feature coming soon')}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteJob(job.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Resume</TableHead>
                    <TableHead>Job Title</TableHead>
                    <TableHead>Match Score</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matchHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No match history available yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    matchHistory.map((match) => (
                      <TableRow key={match.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-500" />
                            {match.resumeName}
                          </div>
                        </TableCell>
                        <TableCell>{match.jobTitle}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant={getScoreBadgeVariant(match.score)}>
                              {match.score}%
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>{new Date(match.date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => toast.info('View details coming soon')}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}