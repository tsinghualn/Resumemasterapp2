import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { ArrowLeft, ArrowRight, FileText, Link as LinkIcon, Sparkles } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface JobDescriptionScreenProps {
  onBack: () => void;
  onNext: (jobDescription: string) => void;
  initialValue?: string;
}

export function JobDescriptionScreen({ 
  onBack, 
  onNext,
  initialValue = '' 
}: JobDescriptionScreenProps) {
  const [jobDescription, setJobDescription] = useState(initialValue);

  const handleImportFromLinkedIn = () => {
    toast.info('LinkedIn import feature coming soon!', {
      description: 'This will allow you to import job descriptions directly from LinkedIn.'
    });
  };

  const handleUseSample = () => {
    const sampleJobDescription = `Senior Full Stack Developer

We are seeking an experienced Full Stack Developer to join our growing team. The ideal candidate will have strong expertise in modern web technologies and a passion for building scalable applications.

Key Responsibilities:
• Design and develop responsive web applications using React and Node.js
• Build and maintain RESTful APIs and microservices
• Collaborate with product managers and designers to implement new features
• Write clean, maintainable code with comprehensive test coverage
• Participate in code reviews and mentor junior developers
• Optimize application performance and scalability

Required Skills:
• 5+ years of experience in full stack development
• Expert knowledge of JavaScript/TypeScript, React, and Node.js
• Experience with cloud platforms (AWS, Azure, or GCP)
• Strong understanding of database design (SQL and NoSQL)
• Familiarity with containerization (Docker, Kubernetes)
• Excellent problem-solving and communication skills

Preferred Qualifications:
• Experience with CI/CD pipelines
• Knowledge of GraphQL
• Contributions to open-source projects
• Bachelor's degree in Computer Science or related field`;

    setJobDescription(sampleJobDescription);
    toast.success('Sample job description loaded!');
  };

  const handleNext = () => {
    if (jobDescription.trim()) {
      onNext(jobDescription);
    } else {
      toast.error('Please enter a job description');
    }
  };

  const wordCount = jobDescription.trim().split(/\s+/).filter(w => w).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button onClick={onBack} variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2.5 rounded-xl">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl">Job Description</h1>
              <p className="text-sm text-gray-600">Paste the job you're targeting</p>
            </div>
          </div>

          <Button 
            onClick={handleNext}
            disabled={!jobDescription.trim()}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Info Banner */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-purple-900">Your resume will be optimized for this job</p>
              <p className="text-sm text-purple-700">
                Our AI will analyze the job requirements and tailor your resume to match the position.
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl">Enter Job Description</h2>
            <Badge variant="secondary">
              {wordCount} {wordCount === 1 ? 'word' : 'words'}
            </Badge>
          </div>

          <Textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the job description here...

Include:
• Job title and company
• Key responsibilities
• Required qualifications and skills
• Preferred qualifications

The more details you provide, the better we can optimize your resume!"
            className="min-h-[400px] resize-none mb-4"
          />

          <div className="flex gap-2">
            <Button
              onClick={handleImportFromLinkedIn}
              variant="outline"
              className="flex-1"
            >
              <LinkIcon className="w-4 h-4 mr-2" />
              Import from LinkedIn
            </Button>
            
            <Button
              onClick={handleUseSample}
              variant="outline"
              className="flex-1"
            >
              <FileText className="w-4 h-4 mr-2" />
              Use Sample
            </Button>
          </div>

          {jobDescription.trim() && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                ✓ Job description ready! Click "Next" to proceed with optimization.
              </p>
            </div>
          )}
        </Card>

        {/* Tips Card */}
        <Card className="p-6 mt-6 bg-blue-50 border-blue-200">
          <h3 className="text-lg mb-3 text-blue-900">💡 Tips for best results</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>Include the complete job posting for better keyword matching</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>Make sure technical requirements and skills are clearly listed</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>Don't forget to include company culture and values if mentioned</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
