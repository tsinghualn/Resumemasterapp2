import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { ArrowLeft, ArrowRight, FileText, Link as LinkIcon, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { Input } from './ui/input';
import { projectId, publicAnonKey } from '../utils/supabase/info.tsx';

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
  const [linkedInUrl, setLinkedInUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const handleImportFromLinkedIn = async () => {
    if (!linkedInUrl.trim()) {
      toast.error('Please enter a URL');
      return;
    }
    
    setIsImporting(true);
    
    try {
      console.log('🔄 Starting import from URL:', linkedInUrl);
      
      // Call the backend endpoint to fetch job description
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-bc1c5df9/import-job`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({ url: linkedInUrl })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        
        // Check if this is a LinkedIn authentication error
        if (errorData.requiresManualCopy) {
          toast.error('LinkedIn Import Blocked', {
            description: errorData.message || 'Please copy the job description manually from your browser.'
          });
          return;
        }
        
        throw new Error(errorData.error || 'Failed to fetch job description');
      }

      const data = await response.json();
      console.log('✅ Received job description from server:', {
        length: data.jobDescription?.length,
        source: data.source,
        method: data.method
      });

      if (data.jobDescription) {
        setJobDescription(data.jobDescription);
        console.log('✅ Job description state updated');
        
        // Clear the URL input
        setLinkedInUrl('');
        
        toast.success('Job description imported successfully!', {
          description: `Imported from ${data.source}`
        });
      } else {
        throw new Error('No job description returned from server');
      }
      
    } catch (error) {
      console.error('❌ Import error:', error);
      toast.error('Failed to import job description', {
        description: error instanceof Error ? error.message : 'Please try again or paste the job description manually.'
      });
    } finally {
      setIsImporting(false);
    }
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

  const wordCount = jobDescription.trim() ? jobDescription.trim().split(/\s+/).filter(w => w).length : 0;

  console.log('📊 JobDescriptionScreen state:', {
    jobDescriptionLength: jobDescription.length,
    wordCount,
    linkedInUrl,
    isImporting
  });

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

        {/* LinkedIn Import Section - New Layout */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <LinkIcon className="w-4 h-4 text-blue-600" />
            <h3 className="text-lg">Import from Job URL</h3>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Try to automatically import the job description from a URL
          </p>
          
          {/* Warning about LinkedIn */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <div className="space-y-2">
              <p className="text-sm text-amber-800">
                <strong>⚠️ Automatic import may not work for all sites</strong>
              </p>
              <p className="text-sm text-amber-700">
                Sites like LinkedIn, Google Careers, and Indeed often use JavaScript to load content or require login. If import fails, follow these steps:
              </p>
              <ol className="text-sm text-amber-700 ml-4 space-y-1">
                <li>1. Open the job URL in your browser</li>
                <li>2. Select and copy the entire job description</li>
                <li>3. Paste it in the "Enter Job Description" field below</li>
              </ol>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="Paste the job URL here to try automatic import..."
              value={linkedInUrl}
              onChange={(e) => setLinkedInUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isImporting) {
                  handleImportFromLinkedIn();
                }
              }}
              disabled={isImporting}
              className="flex-1"
            />
            <Button
              onClick={handleImportFromLinkedIn}
              disabled={!linkedInUrl.trim() || isImporting}
              className="bg-blue-500 hover:bg-blue-600 text-white px-8"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                'Try Import'
              )}
            </Button>
          </div>
        </Card>

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