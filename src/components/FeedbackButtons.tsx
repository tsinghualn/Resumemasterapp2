import { Button } from './ui/button';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

interface FeedbackButtonsProps {
  sectionId: string;
  currentFeedback?: 'up' | 'down';
  onThumbsUp: (sectionId: string) => void;
  onThumbsDown: (sectionId: string) => void;
  className?: string;
}

export function FeedbackButtons({ 
  sectionId, 
  currentFeedback, 
  onThumbsUp, 
  onThumbsDown,
  className = ''
}: FeedbackButtonsProps) {
  return (
    <div className={`p-4 bg-gray-50 rounded-lg border ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">
          Help us improve AI. Parsed correctly?
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className={currentFeedback === 'up' ? 'border-green-500 bg-green-50' : ''}
            onClick={() => onThumbsUp(sectionId)}
          >
            <ThumbsUp className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={currentFeedback === 'down' ? 'border-red-500 bg-red-50' : ''}
            onClick={() => onThumbsDown(sectionId)}
          >
            <ThumbsDown className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
