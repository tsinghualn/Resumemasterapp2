import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Sparkles, Target } from 'lucide-react';

interface StartFromScratchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectAIResumeBuilding: () => void;
  onSelectTailorForJob: () => void;
  onCancel?: () => void;
}

export function StartFromScratchDialog({
  open,
  onOpenChange,
  onSelectAIResumeBuilding,
  onSelectTailorForJob,
  onCancel,
}: StartFromScratchDialogProps) {
  
  const handleClose = () => {
    if (onCancel) {
      onCancel();
    }
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[50vw] max-w-[50vw] sm:w-[50vw] sm:max-w-[50vw]">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            Choose how you'd like to build your resume
          </DialogTitle>
          <DialogDescription>
            Select the method that best suits your needs to create a professional resume
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* AI Resume Building Option */}
          <button
            onClick={onSelectAIResumeBuilding}
            className="group relative bg-gradient-to-br from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 border-2 border-purple-200 hover:border-purple-400 rounded-xl p-6 transition-all duration-200 text-left"
          >
            <div className="flex items-start gap-4">
              <div className="bg-gradient-to-br from-purple-500 to-blue-600 p-3 rounded-lg shrink-0">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg mb-2 group-hover:text-purple-700 transition-colors">
                  AI Resume Building
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Create a professional resume from scratch using AI. Get HR best practices, industry-specific suggestions, and intelligent formatting without needing a job description.
                </p>
              </div>
            </div>
          </button>

          {/* Tailor for Job Option */}
          <button
            onClick={() => {
              // Clear cache when switching to Tailor for Job
              if (onCancel) {
                onCancel();
              }
              onSelectTailorForJob();
            }}
            className="group relative bg-gradient-to-br from-blue-50 to-green-50 hover:from-blue-100 hover:to-green-100 border-2 border-blue-200 hover:border-blue-400 rounded-xl p-6 transition-all duration-200 text-left"
          >
            <div className="flex items-start gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-green-600 p-3 rounded-lg shrink-0">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg mb-2 group-hover:text-blue-700 transition-colors">
                  Tailor for Job
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Have a specific job in mind? Start by entering the job description, and AI will help you build a resume optimized for that position.
                </p>
              </div>
            </div>
          </button>
        </div>

        <div className="pt-2 border-t">
          <Button
            variant="ghost"
            onClick={handleClose}
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}