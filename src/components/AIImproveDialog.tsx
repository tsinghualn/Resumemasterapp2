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
  const [skippedIndices, setSkippedIndices] = useState<Set<number>>(new Set());

  // Parse content into bullet points when dialog opens
  useEffect(() => {
    if (open && isList && content) {
      const parsed = processHTMLWithNesting(content);
      setBulletItems(parsed);
      setOriginalBullets(parsed.map(item => item.content)); // Use 'content' property
      setImprovedBullets(new Array(parsed.length).fill(''));
      setCurrentBulletIndex(0);
      setSkippedIndices(new Set());
      
      // Start improving the first bullet
      if (parsed.length > 0) {
        improveBullet(parsed[0].content, 0); // Use 'content' property
      }
    } else if (open && !isList && content) {
      // Improve entire content
      improveEntireContent();
    }
  }, [open, content, isList]);

  // Helper function to filter out headers/sub-headers (bold text) from content
  const filterHeaders = (htmlContent: string): string => {
    // Create a temporary div to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    // Remove all <strong> and <b> tags (headers/sub-headers)
    const strongElements = tempDiv.querySelectorAll('strong, b');
    strongElements.forEach(el => el.remove());
    
    const filtered = tempDiv.innerHTML.trim();
    
    // Also check if the remaining text is very short (likely just a header with colon)
    const textContent = tempDiv.textContent?.trim() || '';
    if (textContent.length < 5 || textContent.endsWith(':')) {
      return ''; // Treat as header-only content
    }
    
    return filtered;
  };

  const improveBullet = async (bulletText: string, index: number) => {
    setIsLoading(true);
    console.log('🔧 [AIImproveDialog] Improving bullet:', {
      bulletText,
      index,
      sectionType,
      industryTone,
      rewriteStyle,
      hasJobDescription: !!jobDescription
    });
    
    // Check if this is a header/sub-header (contains <strong> or <b> tags)
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = bulletText;
    const hasHeaderTags = tempDiv.querySelectorAll('strong, b').length > 0;
    
    // Filter out headers before sending to AI
    const filteredText = filterHeaders(bulletText);
    
    // If after filtering there's no content (header-only), preserve the original formatting
    if (!filteredText || !filteredText.trim()) {
      console.log('⚠️ [AIImproveDialog] Header-only content detected, preserving original with formatting');
      // Use functional state update to ensure we have the latest state
      setImprovedBullets(prev => {
        const improved = [...prev];
        // Keep the original text with HTML formatting (bold tags) intact
        tempDiv.innerHTML = originalBullets[index];
        improved[index] = tempDiv.textContent || originalBullets[index];
        return improved;
      });
      setIsLoading(false);
      return;
    }
    
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
            content: filteredText,
            sectionType,
            industryTone,
            rewriteStyle,
            jobDescription,
            isBulletPoint: true,
          })
        }
      );

      const result = await response.json();
      console.log('✅ [AIImproveDialog] API Response:', result);

      if (response.ok && result.success) {
        // Use functional state update to ensure we have the latest state
        setImprovedBullets(prev => {
          const improved = [...prev];
          improved[index] = result.improvedContent;
          return improved;
        });
        console.log('✅ [AIImproveDialog] Updated improved bullets for index:', index);
      } else {
        console.error('❌ [AIImproveDialog] Failed to improve content:', result);
        toast.error(result.error || 'Failed to improve content');
      }
    } catch (error) {
      console.error('❌ [AIImproveDialog] Error improving bullet:', error);
      toast.error('Failed to improve content');
    } finally {
      setIsLoading(false);
    }
  };

  const improveEntireContent = async () => {
    setIsLoading(true);
    
    // Filter out headers before sending to AI
    const filteredContent = filterHeaders(content);
    
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
            content: filteredContent,
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
    // Update the improved bullets array with the current state immediately
    const updatedImprovedBullets = [...improvedBullets];
    
    // Combine processed bullets with unprocessed original bullets
    // Use improved version for bullets at or before current index, original for the rest
    const combinedContent = bulletItems
      .map((item, idx) => {
        let bulletText;
        
        if (idx <= currentBulletIndex) {
          // Use improved version for processed bullets
          bulletText = updatedImprovedBullets[idx];
        } else {
          // Use original version for unprocessed bullets
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = originalBullets[idx];
          bulletText = tempDiv.textContent || originalBullets[idx];
        }
        
        if (!bulletText || !bulletText.trim()) return null; // Skip empty bullets
        const indent = item.indent || 0;
        const spaces = '  '.repeat(indent);
        return `${spaces}• ${bulletText}`;
      })
      .filter(Boolean) // Remove null entries
      .join('\n');
    
    // Update the section immediately with all content (processed + unprocessed)
    onAccept(combinedContent);
    
    if (currentBulletIndex < bulletItems.length - 1) {
      // Move to next bullet
      const nextIndex = currentBulletIndex + 1;
      setCurrentBulletIndex(nextIndex);
      improveBullet(bulletItems[nextIndex].content, nextIndex); // Use 'content' property
    } else {
      // All bullets processed
      onClose();
      toast.success('Content improved successfully!');
    }
  };

  const handleSkipBullet = () => {
    // Keep original - preserve HTML tags and formatting exactly as it was
    const improved = [...improvedBullets];
    const originalText = originalBullets[currentBulletIndex];
    
    // Store the original HTML to preserve all formatting (bold, italic, etc.)
    improved[currentBulletIndex] = originalText;
    setImprovedBullets(improved);
    setSkippedIndices(prev => new Set([...prev, currentBulletIndex]));

    // Combine processed bullets with unprocessed original bullets
    // Use improved/skipped version for bullets at or before current index, original for the rest
    const combinedContent = bulletItems
      .map((item, idx) => {
        let bulletText;
        let bulletHtml;
        const wasSkipped = skippedIndices.has(idx) || idx === currentBulletIndex;
        
        if (idx <= currentBulletIndex) {
          // Use improved/skipped version for processed bullets
          bulletHtml = improved[idx];
        } else {
          // Use original version for unprocessed bullets
          bulletHtml = originalBullets[idx];
        }
        
        // Extract text content for processing
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = bulletHtml;
        bulletText = tempDiv.textContent || bulletHtml;
        
        if (!bulletText || !bulletText.trim()) return null; // Skip empty bullets
        
        // Check if this is a header/subheader type (from ProcessedContent)
        const isHeaderType = item.type === 'header' || item.type === 'subheader' || item.isHeader;
        
        // For headers/subheaders that were skipped, preserve the original HTML formatting
        if (wasSkipped && isHeaderType) {
          // Check if original has HTML formatting (bold, italic, etc.)
          const hasBold = tempDiv.querySelectorAll('strong, b').length > 0;
          const hasItalic = tempDiv.querySelectorAll('em, i').length > 0;
          
          if (hasBold || hasItalic) {
            // Convert HTML to markdown syntax to preserve formatting
            let formatted = bulletText;
            
            // Extract and preserve bold
            tempDiv.querySelectorAll('strong, b').forEach(el => {
              const boldText = el.textContent || '';
              if (boldText && formatted.includes(boldText)) {
                formatted = formatted.replace(boldText, `**${boldText}**`);
              }
            });
            
            // Extract and preserve italic
            tempDiv.querySelectorAll('em, i').forEach(el => {
              const italicText = el.textContent || '';
              if (italicText && formatted.includes(italicText) && !formatted.includes(`**${italicText}**`)) {
                formatted = formatted.replace(italicText, `*${italicText}*`);
              }
            });
            
            return formatted;
          }
          
          // No formatting, just return text
          return bulletText;
        }
        
        // For skipped regular bullets, preserve formatting but add bullet point
        if (wasSkipped) {
          const hasBold = tempDiv.querySelectorAll('strong, b').length > 0;
          const hasItalic = tempDiv.querySelectorAll('em, i').length > 0;
          
          if (hasBold || hasItalic) {
            // Convert HTML to markdown
            let formatted = bulletText;
            
            tempDiv.querySelectorAll('strong, b').forEach(el => {
              const boldText = el.textContent || '';
              if (boldText && formatted.includes(boldText)) {
                formatted = formatted.replace(boldText, `**${boldText}**`);
              }
            });
            
            tempDiv.querySelectorAll('em, i').forEach(el => {
              const italicText = el.textContent || '';
              if (italicText && formatted.includes(italicText) && !formatted.includes(`**${italicText}**`)) {
                formatted = formatted.replace(italicText, `*${italicText}*`);
              }
            });
            
            const indent = item.indent || 0;
            const spaces = '  '.repeat(indent);
            return `${spaces}• ${formatted}`;
          }
        }
        
        // For AI-improved bullets or non-formatted text, add bullet point
        const indent = item.indent || 0;
        const spaces = '  '.repeat(indent);
        return `${spaces}• ${bulletText}`;
      })
      .filter(Boolean) // Remove null entries
      .join('\n');
    
    // Update the section immediately with all content (processed + unprocessed)
    onAccept(combinedContent);

    if (currentBulletIndex < bulletItems.length - 1) {
      // Move to next bullet
      const nextIndex = currentBulletIndex + 1;
      setCurrentBulletIndex(nextIndex);
      improveBullet(bulletItems[nextIndex].content, nextIndex); // Use 'content' property
    } else {
      // All bullets processed
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