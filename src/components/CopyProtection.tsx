import { ReactNode, useEffect } from 'react';
import { toast } from 'sonner@2.0.3';

interface CopyProtectionProps {
  children: ReactNode;
  enabled?: boolean;
  message?: string;
  className?: string;
}

export function CopyProtection({ 
  children, 
  enabled = true,
  message = 'Content copying is disabled for AI-generated resumes',
  className = ''
}: CopyProtectionProps) {
  useEffect(() => {
    if (!enabled) return;

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      toast.error(message, {
        description: 'Please use the Export button to download your resume'
      });
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      toast.warning('Right-click is disabled', {
        description: 'Use the Export button to save your resume'
      });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent Ctrl+C, Cmd+C, Ctrl+A, Cmd+A
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C' || e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        toast.error('Keyboard shortcuts disabled', {
          description: 'Use the Export button to download your resume'
        });
      }
      
      // Prevent Print Screen (limited effectiveness)
      if (e.key === 'PrintScreen') {
        toast.warning('Screenshot detected', {
          description: 'Please respect content protection'
        });
      }
    };

    document.addEventListener('copy', handleCopy);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, message]);

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <div 
      className={`select-none relative ${className}`}
      style={{ 
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none'
      }}
      onCopy={(e) => {
        e.preventDefault();
        toast.error(message, {
          description: 'Please use the Export button to download your resume'
        });
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        toast.warning('Right-click is disabled', {
          description: 'Use the Export button to save your resume'
        });
      }}
      onDragStart={(e) => e.preventDefault()}
    >
      {children}
      {/* Subtle watermark indicator */}
      <div 
        className="absolute bottom-2 right-2 opacity-30 pointer-events-none text-xs text-gray-400"
        style={{ userSelect: 'none' }}
      >
        🔒 Protected
      </div>
    </div>
  );
}
