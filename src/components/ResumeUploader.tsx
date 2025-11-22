import { useState, useRef } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Upload, FileText, Sparkles, Briefcase } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface ResumeUploaderProps {
  onResumeUpload: (content: string, fileName: string, parsedData?: ResumeData) => void;
  onNavigateToOptimize?: () => void;
  onNavigateToJobDesc?: () => void;
}

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
  customSections?: Array<{ id: string; title: string; content: string; icon: any }>;
}

export function ResumeUploader({ onResumeUpload, onNavigateToOptimize, onNavigateToJobDesc }: ResumeUploaderProps) {
  const [fileName, setFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // Combined processing state
  const [progress, setProgress] = useState(0); // Unified progress
  const [progressStage, setProgressStage] = useState<'uploading' | 'parsing' | 'finalizing'>('uploading');
  const [isComplete, setIsComplete] = useState(false);
  const [parsedData, setParsedData] = useState<ResumeData | null>(null);
  const [resumeContent, setResumeContent] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI-powered parsing
  const parseResumeWithAI = async (text: string) => {
    // Set parsing stage (30-90%)
    setProgressStage('parsing');
    setProgress(30);
    
    // Smooth progress animation for parsing (30% to 90%)
    const parsingInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 85) return prev; // Stop at 85%
        return prev + 2;
      });
    }, 200);
    
    try {
      console.log('🤖 [ResumeUploader] Parsing resume with AI...');

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

      clearInterval(parsingInterval);
      
      if (response.ok && result.success) {
        console.log('✅ [ResumeUploader] AI parsing successful!');
        console.log('📋 [ResumeUploader] PARSED RESUME DATA:', JSON.stringify(result.data, null, 2));
        
        setParsedData(result.data);
        
        // Move to finalizing stage (90-100%)
        setProgressStage('finalizing');
        setProgress(90);
        
        // Quick progress to 100%
        const finalizingInterval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 100) {
              clearInterval(finalizingInterval);
              // Set complete and show buttons
              setIsProcessing(false);
              setIsComplete(true);
              toast.success('Resume ready!', {
                description: 'You can now proceed to AI Resume Building or Tailor for Job',
                duration: 3000,
              });
              return 100;
            }
            return prev + 5;
          });
        }, 100);
      } else {
        console.warn('⚠️ [ResumeUploader] AI parsing failed:', result.error);
        toast.error('Failed to parse resume. Please try again.');
        setIsProcessing(false);
        setProgress(0);
        setIsComplete(false);
      }
    } catch (error) {
      console.error('❌ [ResumeUploader] AI parsing error:', error);
      clearInterval(parsingInterval);
      toast.error('Failed to parse resume. Please try again.');
      setIsProcessing(false);
      setProgress(0);
      setIsComplete(false);
    }
  };

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    // Check file type
    const validTypes = [
      'text/plain',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];

    if (!validTypes.includes(file.type) && !file.name.match(/\.(txt|pdf|doc|docx)$/i)) {
      toast.error('Please upload a valid resume file (TXT, PDF, DOC, DOCX)');
      return;
    }

    setFileName(file.name);
    setIsProcessing(true);
    setProgressStage('uploading');
    setProgress(0);

    // Smooth progress animation for upload (0-30%)
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 25) return prev; // Stop at 25%
        return prev + 2;
      });
    }, 100);

    // Add timeout to prevent indefinite hanging
    const timeoutId = setTimeout(() => {
      clearInterval(progressInterval);
      setIsProcessing(false);
      setProgress(0);
      toast.error('Upload timeout. Please try again or use a different file format.');
    }, 30000); // 30 second timeout

    // Read file content
    const reader = new FileReader();
    
    if (file.type === 'text/plain') {
      reader.onload = (e) => {
        const content = e.target?.result as string;
        
        // Complete the upload progress to 30%
        clearTimeout(timeoutId);
        clearInterval(progressInterval);
        setProgress(30);
        
        console.log('📄 TXT file loaded, content length:', content.length);
        
        // Store content for later use
        setResumeContent(content);
        
        // Show success message
        toast.success(`Uploaded "${file.name}" successfully!`, {
          description: 'AI is now parsing your resume...',
          duration: 3000,
        });

        // Start AI parsing
        parseResumeWithAI(content);
      };
      
      reader.onerror = () => {
        clearTimeout(timeoutId);
        clearInterval(progressInterval);
        setIsProcessing(false);
        setProgress(0);
        toast.error('Failed to read file. Please try again.');
      };
      
      reader.readAsText(file);
    } else if (file.type === 'application/pdf') {
      // For PDF files, read as text (basic extraction)
      reader.onload = async (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        
        try {
          console.log('📄 Starting PDF parsing...');
          
          // Import pdf.js dynamically from CDN
          const pdfjsLib = await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.149/pdf.min.mjs');
          
          // Set worker source
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.149/pdf.worker.min.mjs`;
          
          console.log('📦 PDF.js loaded, processing document...');
          
          // Load the PDF
          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          
          console.log(`📖 PDF loaded with ${pdf.numPages} pages`);
          
          let fullText = '';
          
          // Advanced PDF text extraction with multi-column and styled layout support
          for (let i = 1; i <= pdf.numPages; i++) {
            console.log(`📄 Processing page ${i}/${pdf.numPages}`);
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const viewport = page.getViewport({ scale: 1.0 });
            const pageHeight = viewport.height;
            const pageWidth = viewport.width;
            
            // Enhanced text item extraction with more metadata
            const textItems = textContent.items
              .map((item: any) => {
                const transform = item.transform || [1, 0, 0, 1, 0, 0];
                const x = transform[4];
                const y = transform[5];
                const fontSize = item.height || 12;
                const fontName = item.fontName || '';
                const isBold = fontName.toLowerCase().includes('bold') || fontName.toLowerCase().includes('black');
                
                return {
                  text: item.str,
                  x: x,
                  y: y,
                  width: item.width || 0,
                  height: fontSize,
                  fontSize: fontSize,
                  isBold: isBold,
                  // Normalize Y to top-to-bottom (PDF Y=0 is at bottom)
                  normalizedY: pageHeight - y
                };
              })
              .filter((item: any) => item.text.trim().length > 0); // Remove empty items
            
            // Detect columns by analyzing X positions
            const xPositions = textItems.map((item: any) => item.x).sort((a: number, b: number) => a - b);
            
            // Detect if this is a 2-column layout
            // Find a significant gap in X positions that indicates column break
            let columnBreakX = -1;
            const centerX = pageWidth / 2;
            const leftColumnItems = textItems.filter((item: any) => item.x < centerX);
            const rightColumnItems = textItems.filter((item: any) => item.x >= centerX);
            
            // Check if we have substantial content in both left and right halves
            const is2ColumnLayout = leftColumnItems.length > 10 && rightColumnItems.length > 10;
            
            if (is2ColumnLayout) {
              console.log(`📊 Detected 2-column layout on page ${i}`);
              
              // Process left column first (top to bottom)
              const leftColumnLines: Array<Array<any>> = [];
              const lineTolerance = 8;
              
              leftColumnItems.forEach((item: any) => {
                let foundLine = false;
                for (const line of leftColumnLines) {
                  if (line.length > 0) {
                    const lineY = line[0].normalizedY;
                    if (Math.abs(item.normalizedY - lineY) < lineTolerance) {
                      line.push(item);
                      foundLine = true;
                      break;
                    }
                  }
                }
                if (!foundLine) {
                  leftColumnLines.push([item]);
                }
              });
              
              // Sort left column lines top to bottom
              leftColumnLines.sort((a, b) => {
                const yA = a[0]?.normalizedY || 0;
                const yB = b[0]?.normalizedY || 0;
                return yB - yA; // Higher Y first (top of page)
              });
              
              // Sort items within each left column line by X position
              leftColumnLines.forEach(line => {
                line.sort((a, b) => a.x - b.x);
              });
              
              // Process right column (top to bottom)
              const rightColumnLines: Array<Array<any>> = [];
              
              rightColumnItems.forEach((item: any) => {
                let foundLine = false;
                for (const line of rightColumnLines) {
                  if (line.length > 0) {
                    const lineY = line[0].normalizedY;
                    if (Math.abs(item.normalizedY - lineY) < lineTolerance) {
                      line.push(item);
                      foundLine = true;
                      break;
                    }
                  }
                }
                if (!foundLine) {
                  rightColumnLines.push([item]);
                }
              });
              
              // Sort right column lines top to bottom
              rightColumnLines.sort((a, b) => {
                const yA = a[0]?.normalizedY || 0;
                const yB = b[0]?.normalizedY || 0;
                return yB - yA; // Higher Y first (top of page)
              });
              
              // Sort items within each right column line by X position
              rightColumnLines.forEach(line => {
                line.sort((a, b) => a.x - b.x);
              });
              
              // Combine: all left column content first, then all right column content
              const lines = [...leftColumnLines, ...rightColumnLines];
              
              // Reconstruct text with intelligent spacing and structure
              let pageText = '';
              let lastLineY = -1;
              const minLineHeight = 10;
              const paragraphGap = 20;
              
              for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
                const line = lines[lineIdx];
                if (line.length === 0) continue;
                
                const lineY = line[0].normalizedY;
                const lineText = line.map((item: any) => item.text).join(' ').trim();
                
                if (!lineText) continue;
                
                // Determine spacing
                if (lastLineY !== -1 && lineIdx < leftColumnLines.length) {
                  // Still in left column
                  const yDiff = lastLineY - lineY;
                  if (yDiff > paragraphGap) {
                    pageText += '\n\n';
                  } else if (yDiff > minLineHeight * 1.2) {
                    pageText += '\n';
                  } else if (yDiff > 0) {
                    pageText += ' ';
                  }
                } else if (lineIdx === leftColumnLines.length) {
                  // Transition from left to right column - add clear break
                  pageText += '\n\n';
                } else if (lineIdx > leftColumnLines.length) {
                  // In right column
                  const yDiff = lastLineY - lineY;
                  if (yDiff > paragraphGap) {
                    pageText += '\n\n';
                  } else if (yDiff > minLineHeight * 1.2) {
                    pageText += '\n';
                  } else if (yDiff > 0) {
                    pageText += ' ';
                  }
                }
                
                pageText += lineText;
                lastLineY = lineY;
              }
              
              // Clean up the extracted text
              pageText = pageText
                .replace(/\n{4,}/g, '\n\n\n')
                .replace(/[ \t]{2,}/g, ' ')
                .replace(/\n[ \t]+/g, '\n')
                .replace(/[ \t]+\n/g, '\n')
                .trim();
              
              fullText += pageText;
              if (i < pdf.numPages) {
                fullText += '\n\n';
              }
              
            } else {
              // Single column layout - use original logic
              console.log(`📄 Single column layout on page ${i}`);
              
              // Group text items into lines based on Y position
              const lineTolerance = 8; // Pixels tolerance for same line
              const lines: Array<Array<any>> = [];
              
              textItems.forEach((item: any) => {
                // Find existing line with similar Y position
                let foundLine = false;
                for (const line of lines) {
                  if (line.length > 0) {
                    const lineY = line[0].normalizedY;
                    if (Math.abs(item.normalizedY - lineY) < lineTolerance) {
                      line.push(item);
                      foundLine = true;
                      break;
                    }
                  }
                }
                
                if (!foundLine) {
                  lines.push([item]);
                }
              });
              
              // Sort lines by Y position (top to bottom)
              lines.sort((a, b) => {
                const yA = a[0]?.normalizedY || 0;
                const yB = b[0]?.normalizedY || 0;
                return yB - yA; // Higher Y first (top of page)
              });
              
              // Sort items within each line by X position (left to right)
              lines.forEach(line => {
                line.sort((a, b) => a.x - b.x);
              });
              
              // Reconstruct text with intelligent spacing and structure
              let pageText = '';
              let lastLineY = -1;
              let lastLineEndX = -1;
              const minLineHeight = 10;
              const paragraphGap = 20;
              
              for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
                const line = lines[lineIdx];
                if (line.length === 0) continue;
                
                const lineY = line[0].normalizedY;
                const lineText = line.map((item: any) => item.text).join(' ').trim();
                
                if (!lineText) continue;
                
                // Determine spacing
                if (lastLineY !== -1) {
                  const yDiff = lastLineY - lineY; // Positive = moving down
                  
                  if (yDiff > paragraphGap) {
                    // Large gap - likely new section or paragraph
                    pageText += '\n\n';
                  } else if (yDiff > minLineHeight * 1.2) {
                    // Normal line break
                    pageText += '\n';
                  } else if (yDiff > 0 && yDiff <= minLineHeight * 1.2) {
                    // Very small gap - might be same paragraph, check if multi-column
                    const firstItemX = line[0].x;
                    if (firstItemX > lastLineEndX + 50) {
                      // New column detected - add line break
                      pageText += '\n';
                    } else {
                      // Same line continuation - add space
                      pageText += ' ';
                    }
                  }
                }
                
                pageText += lineText;
                lastLineY = lineY;
                lastLineEndX = Math.max(...line.map((item: any) => item.x + item.width));
              }
              
              // Clean up the extracted text
              pageText = pageText
                .replace(/\n{4,}/g, '\n\n\n') // Max 3 consecutive line breaks
                .replace(/[ \t]{2,}/g, ' ') // Normalize multiple spaces/tabs
                .replace(/\n[ \t]+/g, '\n') // Remove spaces at start of lines
                .replace(/[ \t]+\n/g, '\n') // Remove spaces at end of lines
                .replace(/([.!?])\s*\n([A-Z])/g, '$1\n\n$2') // Better paragraph breaks after sentences
                .trim();
              
              fullText += pageText;
              if (i < pdf.numPages) {
                fullText += '\n\n'; // Add page break
              }
            }
          }
          
          // Final cleanup and structure enhancement
          fullText = fullText
            .replace(/\n{4,}/g, '\n\n\n') // Max 3 consecutive line breaks
            .replace(/[ \t]+/g, ' ') // Normalize all spaces
            .replace(/\n\s+/g, '\n') // Remove leading spaces on lines
            .replace(/\s+\n/g, '\n') // Remove trailing spaces on lines
            // Ensure section headers are properly formatted
            .replace(/\n([A-Z][A-Z\s&]+)\n([A-Z])/g, '\n$1\n\n$2') // Add space after headers
            .trim();
          
          console.log('✅ PDF parsing complete with advanced structure detection');
          
          // Complete the upload progress to 30%
          clearTimeout(timeoutId);
          clearInterval(progressInterval);
          setProgress(30);
          
          console.log('📄 PDF file loaded, content length:', fullText.trim().length);
          
          // Store content for later use
          setResumeContent(fullText.trim());
          
          // Show success message
          toast.success(`Uploaded "${file.name}\" successfully!`, {
            description: 'AI is now parsing your resume...',
            duration: 3000,
          });

          // Start AI parsing
          parseResumeWithAI(fullText.trim());
        } catch (error) {
          console.error('❌ Error parsing PDF:', error);
          clearTimeout(timeoutId);
          clearInterval(progressInterval);
          setIsProcessing(false);
          setProgress(0);
          toast.error('Failed to parse PDF. Please try a TXT file or different PDF.');
        }
      };
      
      reader.onerror = () => {
        clearTimeout(timeoutId);
        clearInterval(progressInterval);
        setIsProcessing(false);
        setProgress(0);
        toast.error('Failed to read PDF file. Please try again.');
      };
      
      reader.readAsArrayBuffer(file);
    } else {
      // For DOCX files, we'll need a library. For now, show a helpful message
      clearTimeout(timeoutId);
      clearInterval(progressInterval);
      setIsProcessing(false);
      setProgress(0);
      toast.warning('DOCX parsing not yet supported', {
        description: 'Please convert your resume to PDF or TXT format for now'
      });
      setFileName('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleNavigateToAIOptimization = () => {
    if (!parsedData || !resumeContent) {
      toast.error('Resume data not ready. Please wait for parsing to complete.');
      return;
    }
    
    // Verify that we have parsed data with sections
    console.log('🎯 [ResumeUploader] Navigating to AI Optimization with parsed data:', {
      hasParsedData: !!parsedData,
      hasResumeContent: !!resumeContent,
      resumeContentLength: resumeContent.length,
      parsedDataKeys: parsedData ? Object.keys(parsedData) : []
    });
    
    // Save the parsed data and content
    onResumeUpload(resumeContent, fileName, parsedData);
    // Navigate to AI optimization
    if (onNavigateToOptimize) {
      onNavigateToOptimize();
    }
  };

  const handleNavigateToJobDescription = () => {
    if (!parsedData || !resumeContent) {
      toast.error('Resume data not ready. Please wait for parsing to complete.');
      return;
    }
    
    // Verify that we have parsed data with sections
    console.log('🎯 [ResumeUploader] Navigating to Job Description with parsed data:', {
      hasParsedData: !!parsedData,
      hasResumeContent: !!resumeContent,
      resumeContentLength: resumeContent.length,
      parsedDataKeys: parsedData ? Object.keys(parsedData) : []
    });
    
    // Save the parsed data and content
    onResumeUpload(resumeContent, fileName, parsedData);
    // Navigate to job description
    if (onNavigateToJobDesc) {
      onNavigateToJobDesc();
    }
  };

  return (
    <Card className="p-6">
      {!fileName && !isProcessing && !isComplete ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="mb-2 text-gray-700">
            Drag and drop your resume here, or
          </p>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            accept=".txt,.pdf,.doc,.docx"
            className="hidden"
            id="resume-upload"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="mt-2"
          >
            Browse Files
          </Button>
          <p className="text-sm text-gray-500 mt-4">
            Supported formats: TXT, PDF, DOC, DOCX
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* File Info */}
          <div className="border border-blue-200 bg-blue-50 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-5 h-5 text-blue-600" />
              <p className="text-blue-900 font-medium">{fileName}</p>
            </div>

            {/* Upload Progress */}
            {isProcessing && progressStage === 'uploading' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-700 font-medium">Uploading...</span>
                  <span className="text-blue-900 font-semibold">{progress}%</span>
                </div>
                <Progress value={progress} className="h-3" />
              </div>
            )}

            {/* Parsing Progress */}
            {isProcessing && progressStage === 'parsing' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-purple-700 font-medium">
                    🤖 AI is parsing your resume...
                  </span>
                  <span className="text-purple-900 font-semibold">{progress}%</span>
                </div>
                <Progress value={progress} className="h-3 bg-purple-100" />
                <p className="text-xs text-purple-600 mt-2">
                  Please be patient. This may take a few moments.
                </p>
              </div>
            )}

            {/* Parsing Complete */}
            {isComplete && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-700">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-lg">✓</span>
                  </div>
                  <span className="font-medium">
                    Great! We have parsed your resume successfully.
                  </span>
                </div>
                
                <div className="pt-4 border-t border-blue-200">
                  <p className="text-sm text-gray-700 mb-4">
                    What would you like to do next?
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Button
                      onClick={handleNavigateToAIOptimization}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      AI Resume Building
                    </Button>
                    
                    <Button
                      onClick={handleNavigateToJobDescription}
                      className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white"
                    >
                      <Briefcase className="w-4 h-4 mr-2" />
                      Tailor for Job
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}