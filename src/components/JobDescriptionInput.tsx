import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Sparkles, Loader2 } from 'lucide-react';

interface JobDescriptionInputProps {
  onModify: (jobDescription: string) => void;
  disabled?: boolean;
  isProcessing?: boolean;
}

export function JobDescriptionInput({ onModify, disabled, isProcessing }: JobDescriptionInputProps) {
  const [jobDescription, setJobDescription] = useState('');

  const handleSubmit = () => {
    if (jobDescription.trim()) {
      onModify(jobDescription);
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
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl mb-4">Job Description</h2>
      
      <div className="space-y-4">
        <Textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the job description here..."
          className="min-h-[300px] resize-none"
          disabled={disabled}
        />
        
        <div className="flex gap-2">
          <Button
            onClick={handleSubmit}
            disabled={disabled || !jobDescription.trim() || isProcessing}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Optimizing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Optimize Resume
              </>
            )}
          </Button>
          
          <Button
            onClick={handleUseSample}
            variant="outline"
            disabled={disabled}
          >
            Use Sample
          </Button>
        </div>
        
        {disabled && (
          <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded border border-amber-200">
            Please upload a resume first
          </p>
        )}
      </div>
    </Card>
  );
}
