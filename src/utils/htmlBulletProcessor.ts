// Utility to process HTML content and extract bullet points for proper rendering

export interface ProcessedContent {
  type: 'bullet' | 'text' | 'html';
  content: string;
  indent?: number; // Indentation level for nested lists
  bulletStyle?: 'filled' | 'hollow' | 'number'; // Bullet style for rendering
}

/**
 * NEW: Processes HTML content preserving nested list structure
 * Handles <ul>, <ol>, nested lists with proper indentation
 */
export function processHTMLWithNesting(htmlContent: string): ProcessedContent[] {
  if (!htmlContent) return [];
  
  console.log('=== processHTMLWithNesting START ===');
  console.log('Input HTML:', htmlContent);
  
  // Check if content has proper HTML list tags (<ul>, <ol>)
  const hasListTags = /<ul|<ol/i.test(htmlContent);
  
  if (hasListTags) {
    console.log('Detected list tags, using parseHTMLLists');
    // Parse HTML and preserve list structure
    const result = parseHTMLLists(htmlContent);
    console.log('parseHTMLLists result:', result);
    return result;
  } else {
    console.log('No list tags, using processHTMLBulletsWithFormatting');
    // Fallback to line-by-line processing for plain text with bullets
    const result = processHTMLBulletsWithFormatting(htmlContent);
    console.log('processHTMLBulletsWithFormatting result:', result);
    return result;
  }
}

/**
 * Parses HTML lists and returns items with indentation levels
 */
function parseHTMLLists(htmlContent: string, currentIndent: number = 0): ProcessedContent[] {
  const processed: ProcessedContent[] = [];
  
  // Create a temporary DOM element to parse HTML
  const temp = document.createElement('div');
  try {
    temp.innerHTML = htmlContent;
  } catch (error) {
    console.error('Error parsing HTML:', error);
    // Fallback to plain text processing
    return processHTMLBulletsWithFormatting(htmlContent);
  }
  
  console.log('=== PARSING HTML LISTS ===');
  console.log('Raw HTML:', htmlContent);
  console.log('Temp innerHTML:', temp.innerHTML);
  console.log('Temp children:', temp.children);
  
  function traverseListItem(li: HTMLElement, indent: number, isOrdered: boolean) {
    console.log(`Processing LI at indent ${indent}, isOrdered: ${isOrdered}`, li.outerHTML);
    
    // Determine bullet style based on indent level
    let bulletStyle: 'filled' | 'hollow' | 'number' = 'filled';
    if (isOrdered) {
      bulletStyle = 'number';
    } else if (indent === 0) {
      bulletStyle = 'filled'; // Main level: filled circle
    } else {
      bulletStyle = 'hollow'; // Sub-level: hollow circle
    }
    
    // Extract text content from li, but stop at nested lists
    let content = '';
    let hasNestedList = false;
    
    console.log('  Child nodes:', li.childNodes);
    
    for (const child of Array.from(li.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        const textContent = child.textContent || '';
        content += textContent;
        console.log('  Added text:', textContent);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as HTMLElement;
        const tag = el.tagName.toLowerCase();
        console.log('  Found element:', tag, el.outerHTML);
        
        if (tag === 'ul' || tag === 'ol') {
          hasNestedList = true;
          // Found nested list - process nested list items with increased indent
          console.log('  Processing nested list with', el.children.length, 'items');
          Array.from(el.children).forEach(nestedLi => {
            if (nestedLi.tagName.toLowerCase() === 'li') {
              traverseListItem(nestedLi as HTMLElement, indent + 1, tag === 'ol');
            }
          });
        } else if (tag === 'br') {
          // Skip br tags but add space if needed
          if (content && !content.endsWith(' ')) {
            content += ' ';
          }
        } else {
          // Inline formatting (strong, em, b, i, span, etc.) - preserve HTML
          content += el.outerHTML;
          console.log('  Added HTML:', el.outerHTML);
        }
      }
    }
    
    // CRITICAL FIX: Add content only if it's not just whitespace
    // This prevents empty parent LIs from adding blank entries
    const trimmedContent = content.trim();
    if (trimmedContent) {
      console.log('  Adding content:', trimmedContent, 'at indent', indent);
      processed.push({
        type: 'bullet',
        content: trimmedContent,
        indent,
        bulletStyle
      });
    } else if (!hasNestedList) {
      // If there's no content AND no nested list, this might be an empty LI
      // This shouldn't normally happen, but log it for debugging
      console.warn('  Empty LI with no nested list detected:', li.outerHTML);
    }
    
    console.log('  LI processing complete. hasNestedList:', hasNestedList, 'content added:', !!trimmedContent);
  }
  
  function traverseNode(node: Node, indent: number = 0) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      const tagName = element.tagName.toLowerCase();
      
      if (tagName === 'ul' || tagName === 'ol') {
        // Process all direct li children
        Array.from(element.children).forEach(child => {
          if (child.tagName.toLowerCase() === 'li') {
            traverseListItem(child as HTMLElement, indent, tagName === 'ol');
          }
        });
      } else if (tagName === 'p' || tagName === 'div') {
        // Process block elements - recurse through children
        Array.from(element.childNodes).forEach(child => traverseNode(child, indent));
      } else if (tagName === 'br') {
        // Skip br tags
      }
    } else if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) {
        processed.push({
          type: 'text',
          content: text,
          indent: indent
        });
      }
    }
  }
  
  // Start traversal
  Array.from(temp.childNodes).forEach(node => traverseNode(node, currentIndent));
  
  console.log('=== PARSING COMPLETE ===');
  console.log('Processed items:', processed);
  console.log('========================');
  
  return processed;
}

/**
 * Processes HTML content to extract bullets (●, •, o, -, →) and text content
 * Returns an array of processed items that can be rendered as separate lines
 */
export function processHTMLBullets(htmlContent: string): ProcessedContent[] {
  if (!htmlContent) return [];
  
  // Strip HTML tags but preserve line breaks
  const withLineBreaks = htmlContent
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n');
  
  // Remove all other HTML tags
  const plainText = withLineBreaks.replace(/<[^>]+>/g, '');
  
  // Decode HTML entities
  const decoded = plainText
    .replace(/&nbsp;/g, ' ')
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  
  // Split by lines
  const lines = decoded.split('\n');
  const processed: ProcessedContent[] = [];
  
  // Bullet patterns to detect
  const bulletPattern = /^[\s]*(●|•|○|o|■|□|▪|▫|➤|→|➔|➢|➣|➥|⇒|⇨|-|–|—|\*|\d+\.)\s+(.+)$/;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    const match = trimmed.match(bulletPattern);
    if (match) {
      // This line starts with a bullet
      processed.push({
        type: 'bullet',
        content: match[2].trim()
      });
    } else {
      // Regular text
      processed.push({
        type: 'text',
        content: trimmed
      });
    }
  }
  
  return processed;
}

/**
 * Alternative version that keeps some HTML formatting (bold, italic, etc.)
 * ENHANCED: Now handles blockquote and elements with margin-left styling
 */
export function processHTMLBulletsWithFormatting(htmlContent: string): ProcessedContent[] {
  if (!htmlContent) return [];
  
  console.log('=== processHTMLBulletsWithFormatting ===');
  console.log('Input:', htmlContent);
  
  // Create a temporary DOM element to parse HTML more accurately
  const temp = document.createElement('div');
  temp.innerHTML = htmlContent;
  
  const processed: ProcessedContent[] = [];
  
  // Helper function to extract indent from element
  function getIndentLevel(element: HTMLElement): number {
    // Check for blockquote (typically 1 indent level)
    if (element.tagName.toLowerCase() === 'blockquote') {
      return 1;
    }
    
    // Check for margin-left or padding-left in style
    const style = element.style;
    if (style.marginLeft) {
      const marginValue = parseInt(style.marginLeft);
      if (!isNaN(marginValue)) {
        // Each 40px of margin = 1 indent level (browser default)
        return Math.floor(marginValue / 40);
      }
    }
    if (style.paddingLeft) {
      const paddingValue = parseInt(style.paddingLeft);
      if (!isNaN(paddingValue)) {
        return Math.floor(paddingValue / 40);
      }
    }
    
    return 0;
  }
  
  // Process each child node
  function processNode(node: Node, currentIndent: number = 0): void {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) {
        console.log('  Text node:', text, 'indent:', currentIndent);
        processed.push({
          type: 'text',
          content: text,
          indent: currentIndent
        });
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      const tagName = element.tagName.toLowerCase();
      
      console.log('  Element:', tagName, 'indent:', currentIndent);
      
      // Calculate indent for this element
      const elementIndent = getIndentLevel(element);
      const totalIndent = currentIndent + elementIndent;
      
      // Handle different element types
      if (tagName === 'br') {
        // Skip br tags
        return;
      } else if (tagName === 'blockquote' || tagName === 'p' || tagName === 'div') {
        // Process content inside block elements
        const content = element.innerHTML;
        
        // Check if content has bullets
        const plainText = element.textContent?.trim() || '';
        const bulletPattern = /^[\\s]*(●|•|○|o|■|□|▪|▫|➤|→|➔|➢|➣|➥|⇒|⇨|-|–|—|\\*|\\d+\\.)\\s*(.+)$/;
        const match = plainText.match(bulletPattern);
        
        if (match && plainText) {
          // This is a bullet item
          const bulletChar = match[1];
          let bulletStyle: 'filled' | 'hollow' | 'number' = 'filled';
          
          if (bulletChar === '○' || bulletChar === 'o') {
            bulletStyle = 'hollow';
          } else if (/\\d+\\./.test(bulletChar)) {
            bulletStyle = 'number';
          } else if (totalIndent > 0) {
            bulletStyle = 'hollow';
          }
          
          // Extract content after bullet, preserving HTML
          const bulletIndex = content.indexOf(bulletChar);
          let bulletContent = '';
          if (bulletIndex !== -1) {
            bulletContent = content.substring(bulletIndex + bulletChar.length).trim();
          } else {
            bulletContent = match[2];
          }
          
          console.log('  Bullet found:', bulletChar, 'content:', bulletContent.substring(0, 30));
          processed.push({
            type: 'bullet',
            content: bulletContent,
            indent: totalIndent,
            bulletStyle
          });
        } else if (plainText) {
          // Regular text content
          console.log('  Text content:', content.substring(0, 30));
          processed.push({
            type: 'text',
            content: content,
            indent: totalIndent
          });
        }
      } else {
        // For other elements, process children
        Array.from(element.childNodes).forEach(child => processNode(child, totalIndent));
      }
    }
  }
  
  // Process all top-level nodes
  Array.from(temp.childNodes).forEach(node => processNode(node, 0));
  
  console.log('=== Processing complete ===');
  console.log('Result:', processed);
  
  return processed;
}