import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered,
  IndentDecrease,
  IndentIncrease
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

export function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = 'Enter text...', 
  className = '',
  minHeight = '100px'
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const isUpdatingRef = useRef(false);

  // Initialize content
  useEffect(() => {
    if (editorRef.current && !isFocused && !isUpdatingRef.current) {
      // Only update if content actually changed
      const currentHTML = editorRef.current.innerHTML;
      if (currentHTML !== value) {
        console.log('Initializing editor with value:', value);
        editorRef.current.innerHTML = value || '';
        
        // Verify content was set correctly
        if (value && value.trim() && !editorRef.current.innerHTML) {
          console.error('ERROR: Failed to set editor content!');
          console.error('Value:', value);
          console.error('Editor innerHTML after set:', editorRef.current.innerHTML);
        }
      }
    }
  }, [value, isFocused]);

  const handleInput = () => {
    if (editorRef.current && !isUpdatingRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, commandValue?: string) => {
    if (!editorRef.current) return;
    
    // Save selection
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      editorRef.current.focus();
      return;
    }

    // Prevent update loop
    isUpdatingRef.current = true;
    
    try {
      // For indent/outdent commands
      if (command === 'indent' || command === 'outdent') {
        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;
        const parentElement = container.nodeType === Node.TEXT_NODE 
          ? container.parentElement 
          : container as HTMLElement;
        
        // Check if we're inside a list item
        const listItem = parentElement?.closest('li');
        console.log('Indent/Outdent command:', command, 'In list:', !!listItem);
    
        // Allow indent regardless of list context - browser will handle it
        // (creates blockquote for non-list text, nested list for list items)
      }
      
      // Execute command
      const success = document.execCommand(command, false, commandValue);
      
      if (!success) {
        console.warn(`Command ${command} failed`);
      }
      
      console.log(`Command ${command} executed`);
      
      // Trigger onChange with new content - add delay to ensure DOM updates
      setTimeout(() => {
        if (editorRef.current) {
          const content = editorRef.current.innerHTML;
          console.log('After command, content:', content);
          onChange(content);
        }
        isUpdatingRef.current = false;
      }, 100); // Increased from 50 to 100ms for better reliability
    } catch (error) {
      console.error('Error executing command:', error);
      isUpdatingRef.current = false;
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    handleInput();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b') {
        e.preventDefault();
        execCommand('bold');
      } else if (e.key === 'i') {
        e.preventDefault();
        execCommand('italic');
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    // Allow default drop behavior but trigger input to save changes
    setTimeout(() => {
      handleInput();
    }, 50);
  };

  const handleDragEnd = () => {
    // Trigger input after drag operation completes
    setTimeout(() => {
      handleInput();
    }, 50);
  };

  return (
    <div className={`border rounded-md ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b bg-gray-50">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onMouseDown={(e) => {
            e.preventDefault(); // Prevent losing focus
            execCommand('bold');
          }}
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onMouseDown={(e) => {
            e.preventDefault();
            execCommand('italic');
          }}
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onMouseDown={(e) => {
            e.preventDefault();
            execCommand('insertUnorderedList');
          }}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onMouseDown={(e) => {
            e.preventDefault();
            execCommand('insertOrderedList');
          }}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onMouseDown={(e) => {
            e.preventDefault();
            execCommand('outdent');
          }}
          title="Decrease Indent"
        >
          <IndentDecrease className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onMouseDown={(e) => {
            e.preventDefault();
            execCommand('indent');
          }}
          title="Increase Indent"
        >
          <IndentIncrease className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          // Save on blur
          handleInput();
        }}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        onDrop={handleDrop}
        onDragEnd={handleDragEnd}
        className="p-3 focus:outline-none text-sm"
        style={{ minHeight }}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />

      <style>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          cursor: text;
        }
        [contenteditable] {
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        [contenteditable] ul,
        [contenteditable] ol {
          margin-left: 20px;
          margin-top: 4px;
          margin-bottom: 4px;
          padding-left: 20px;
          display: block;
        }
        [contenteditable] li {
          margin-bottom: 2px;
          display: list-item;
        }
        /* Main level bullets - filled circles */
        [contenteditable] > ul > li {
          list-style-type: disc !important;
        }
        /* Second level bullets - hollow circles */
        [contenteditable] ul ul > li {
          list-style-type: circle !important;
        }
        /* Third level bullets - squares */
        [contenteditable] ul ul ul > li {
          list-style-type: square !important;
        }
        /* Main level ordered list - numbers */
        [contenteditable] > ol > li {
          list-style-type: decimal !important;
        }
        /* Second level ordered list - lowercase letters */
        [contenteditable] ol ol > li {
          list-style-type: lower-alpha !important;
        }
        /* Third level ordered list - lowercase roman numerals */
        [contenteditable] ol ol ol > li {
          list-style-type: lower-roman !important;
        }
        /* Ensure numbers/bullets are visible */
        [contenteditable] ol {
          list-style-position: outside;
        }
        [contenteditable] ul {
          list-style-position: outside;
        }
        /* Nested lists spacing */
        [contenteditable] li > ul,
        [contenteditable] li > ol {
          margin-top: 2px;
        }
        [contenteditable] b,
        [contenteditable] strong {
          font-weight: 600;
        }
        [contenteditable] i,
        [contenteditable] em {
          font-style: italic;
        }
      `}</style>
    </div>
  );
}