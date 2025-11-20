import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Download, Copy, Loader2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface ResumeEditorProps {
  content: string;
  onChange: (content: string) => void;
  isProcessing?: boolean;
}

export function ResumeEditor({ content, onChange, isProcessing }: ResumeEditorProps) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success('Resume copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'optimized-resume.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Resume downloaded!');
  };

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <Loader2 className="w-12 h-12 animate-spin mb-4 text-purple-600" />
        <p className="text-gray-600">Optimizing your resume with AI...</p>
        <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Textarea
        value={content}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[500px] resize-none font-mono text-sm"
        placeholder="Your resume content will appear here..."
      />
      
      <div className="flex gap-2">
        <Button onClick={handleCopy} variant="outline" size="sm" className="flex-1">
          <Copy className="w-4 h-4 mr-2" />
          Copy
        </Button>
        <Button onClick={handleDownload} variant="outline" size="sm" className="flex-1">
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>
      </div>
    </div>
  );
}
