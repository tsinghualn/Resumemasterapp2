import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Loader2, Sparkles, Check, X, ArrowRight } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { processHTMLWithNesting, ProcessedContent } from '../utils/htmlBulletProcessor';

interface AIImproveDialogProps {
  open: boolean;
  onClose: () => void;
  content: string;
  sectionType: 'summary' | 'experience' | 'education' | 'skills' | 'custom';
  industryTone: string;
  rewriteStyle: string;
  jobDescription?: string;
  onAccept: (improvedContent: string) => void;
  isList?: boolean; // If true, process one bullet point at a time
}

export function AIImproveDialog({
  open,
  onClose,
  content,
  sectionType,
  industryTone,
  rewriteStyle,
  jobDescription = '',
  onAccept,
  isList = false,
}: AIImproveDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedContent, setSuggestedContent] = useState('');
  const [bulletItems, setBulletItems] = useState<ProcessedContent[]>([]);
  const [currentBulletIndex, setCurrentBulletIndex] = useState(0);
  const [improvedBullets, setImprovedBullets] = useState<string[]>([]);
  const [originalBullets, setOriginalBullets] = useState<string[]>([]);

  // Parse content into bullet points when dialog opens
  useEffect(() => {
    if (open && isList && content) {
      const parsed = processHTMLWithNesting(content);
      setBulletItems(parsed);
      setOriginalBullets(parsed.map(item => item.content)); // Use 'content' property
      setImprovedBullets(new Array(parsed.length).fill(''));
      setCurrentBulletIndex(0);
      
      // Start improving the first bullet
      if (parsed.length > 0) {
        improveBullet(parsed[0].content, 0); // Use 'content' property
      }
    } else if (open && !isList && content) {
      // Improve entire content
      improveEntireContent();
    }
  }, [open, content, isList]);

  const improveBullet = async (bulletText: string, index: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-bc1c5df9/improve-content`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            content: bulletText,
            sectionType,
            industryTone,
            rewriteStyle,
            jobDescription,
            isBulletPoint: true,
          })
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        const improved = [...improvedBullets];
        improved[index] = result.improvedContent;
        setImprovedBullets(improved);
      } else {
        toast.error('Failed to improve content');
      }
    } catch (error) {
      console.error('Error improving bullet:', error);
      toast.error('Failed to improve content');
    } finally {
      setIsLoading(false);
    }
  };

  const improveEntireContent = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-bc1c5df9/improve-content`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            content,
            sectionType,
            industryTone,
            rewriteStyle,
            jobDescription,
            isBulletPoint: false,
          })
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        setSuggestedContent(result.improvedContent);
      } else {
        toast.error('Failed to improve content');
      }
    } catch (error) {
      console.error('Error improving content:', error);
      toast.error('Failed to improve content');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptBullet = () => {
    if (currentBulletIndex < bulletItems.length - 1) {
      // Move to next bullet
      const nextIndex = currentBulletIndex + 1;
      setCurrentBulletIndex(nextIndex);
      improveBullet(bulletItems[nextIndex].content, nextIndex); // Use 'content' property
    } else {
      // All bullets processed, combine and return
      const combinedContent = improvedBullets
        .map((bullet, idx) => {
          const indent = bulletItems[idx].indent || 0;
          const spaces = '  '.repeat(indent);
          return `${spaces}• ${bullet}`;
        })
        .join('\n');
      onAccept(combinedContent);
      onClose();
      toast.success('Content improved successfully!');
    }
  };

  const handleSkipBullet = () => {
    // Keep original
    const improved = [...improvedBullets];
    improved[currentBulletIndex] = originalBullets[currentBulletIndex];
    setImprovedBullets(improved);

    if (currentBulletIndex < bulletItems.length - 1) {
      // Move to next bullet
      const nextIndex = currentBulletIndex + 1;
      setCurrentBulletIndex(nextIndex);
      improveBullet(bulletItems[nextIndex].content, nextIndex); // Use 'content' property
    } else {
      // All bullets processed
      const combinedContent = improved
        .map((bullet, idx) => {
          const indent = bulletItems[idx].indent || 0;
          const spaces = '  '.repeat(indent);
          return `${spaces}• ${bullet}`;
        })
        .join('\n');
      onAccept(combinedContent);
      onClose();
      toast.success('Content updated!');
    }
  };

  const handleAcceptAll = () => {
    onAccept(suggestedContent);
    onClose();
    toast.success('Content improved successfully!');
  };

  const currentBullet = bulletItems[currentBulletIndex];
  const currentImprovement = improvedBullets[currentBulletIndex];

  // Highlight matched keywords from job description
  const highlightKeywords = (text: string) => {
    if (!jobDescription || !text) return text;
    
    // Extract keywords from job description (simple word extraction)
    const jobKeywords = jobDescription
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3) // Only words longer than 3 chars
      .filter(word => !/^(the|and|for|with|that|this|from|have|been|will|your|our|are|was)$/.test(word));
    
    let highlighted = text;
    const uniqueKeywords = [...new Set(jobKeywords)];
    
    uniqueKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b(${keyword})\\b`, 'gi');
      highlighted = highlighted.replace(regex, '<mark class="bg-yellow-200 px-1">$1</mark>');
    });
    
    return highlighted;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI Content Improvement
          </DialogTitle>
          <DialogDescription>
            {isList
              ? `Reviewing bullet point ${currentBulletIndex + 1} of ${bulletItems.length}`
              : 'Review and apply the AI-suggested improvements'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              <span className="ml-3 text-gray-600">AI is improving your content...</span>
            </div>
          ) : isList ? (
            // Show one bullet at a time
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Original</h3>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-800">• {currentBullet?.content}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">AI Suggestion (Editable)</h3>
                <Textarea
                  value={currentImprovement}
                  onChange={(e) => {
                    const updated = [...improvedBullets];
                    updated[currentBulletIndex] = e.target.value;
                    setImprovedBullets(updated);
                  }}
                  className="min-h-[100px] bg-purple-50 border-purple-200 focus:border-purple-400"
                  placeholder="AI suggestion will appear here..."
                />
                {jobDescription && (
                  <p className="text-xs text-gray-500 mt-2">
                    💡 You can edit the suggestion before accepting
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-4">
                <span className="text-sm text-gray-600">
                  {currentBulletIndex + 1} of {bulletItems.length}
                </span>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleSkipBullet}>
                    <X className="w-4 h-4 mr-2" />
                    Skip
                  </Button>
                  <Button onClick={handleAcceptBullet}>
                    <Check className="w-4 h-4 mr-2" />
                    {currentBulletIndex < bulletItems.length - 1 ? 'Accept & Next' : 'Accept & Finish'}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            // Show entire content comparison
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Original</h3>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 max-h-48 overflow-y-auto">
                  <div
                    className="text-sm text-gray-800"
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">AI Suggestion (Editable)</h3>
                <Textarea
                  value={suggestedContent}
                  onChange={(e) => setSuggestedContent(e.target.value)}
                  className="min-h-[200px] bg-purple-50 border-purple-200 focus:border-purple-400"
                  placeholder="AI suggestion will appear here..."
                />
                {jobDescription && (
                  <p className="text-xs text-gray-500 mt-2">
                    💡 You can edit the suggestion before accepting • <mark className="bg-yellow-200 px-1">Highlighted</mark> words match your job description
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {!isLoading && !isList && (
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleAcceptAll}>
              <Check className="w-4 h-4 mr-2" />
              Apply Improvements
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}