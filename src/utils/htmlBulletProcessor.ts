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
  
  // Check if content has proper HTML list tags (<ul>, <ol>)
  const hasListTags = /<ul|<ol/i.test(htmlContent);
  
  if (hasListTags) {
    // Parse HTML and preserve list structure
    return parseHTMLLists(htmlContent);
  } else {
    // Fallback to line-by-line processing for plain text with bullets
    return processHTMLBulletsWithFormatting(htmlContent);
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
          // Found nested list - first add current content if any, then process nested list
          if (content.trim()) {
            console.log('  Adding content before nested list:', content.trim());
            processed.push({
              type: 'bullet',
              content: content.trim(),
              indent,
              bulletStyle
            });
            content = '';
          }
          
          // Process nested list items with increased indent
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
    
    // Add remaining content if any
    // Important: Even if hasNestedList is true, still add content if it exists
    // This handles cases where an item has both text and nested items
    if (content.trim()) {
      console.log('  Adding final content:', content.trim());
      processed.push({
        type: 'bullet',
        content: content.trim(),
        indent,
        bulletStyle
      });
    }
    console.log('  LI processing complete. hasNestedList:', hasNestedList, 'final content:', content);
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
 */
export function processHTMLBulletsWithFormatting(htmlContent: string): ProcessedContent[] {
  if (!htmlContent) return [];
  
  // Replace line break tags with newlines but keep formatting tags
  let content = htmlContent
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<p>/gi, '')
    .replace(/<div>/gi, '');
  
  // Split by lines
  const lines = content.split('\n');
  const processed: ProcessedContent[] = [];
  
  // Bullet patterns
  const bulletPattern = /^[\s]*(●|•|○|o|■|□|▪|▫|➤|→|➔|➢|➣|➥|⇒|⇨|-|–|—|\*|\d+\.)\s*(.+)$/;
  
  for (const line of lines) {
    // Strip outer HTML tags but keep inline formatting
    const stripped = line.replace(/^<[^>]+>|<\/[^>]+>$/g, '').trim();
    if (!stripped) continue;
    
    // Detect indentation from the ORIGINAL line (before trimming)
    // Count leading spaces/whitespace
    const leadingWhitespace = line.match(/^(\s*)/)?.[1] || '';
    const spaceCount = leadingWhitespace.length;
    
    // Calculate indent level (every 4 spaces = 1 indent level)
    // Also check for &nbsp; entities which are often used for indentation
    const nbspCount = (leadingWhitespace.match(/&nbsp;/g) || []).length;
    const totalIndent = Math.floor((spaceCount + nbspCount * 6) / 4);
    
    // Check if line starts with a bullet (even if bullet is inside HTML)
    const plainText = stripped.replace(/<[^>]+>/g, '');
    const match = plainText.match(bulletPattern);
    
    if (match) {
      // Extract content after bullet, preserving HTML formatting
      const bulletChar = match[1];
      // Find the bullet character in the stripped HTML and extract content after it
      const bulletIndex = stripped.indexOf(bulletChar);
      let bulletContent = '';
      if (bulletIndex !== -1) {
        // Extract everything after the bullet character, preserving HTML
        bulletContent = stripped.substring(bulletIndex + bulletChar.length).trim();
      } else {
        // Fallback to plain text extraction
        bulletContent = match[2];
      }
      
      // Determine bullet style based on character and indent level
      let bulletStyle: 'filled' | 'hollow' | 'number' = 'filled';
      if (bulletChar === '○' || bulletChar === 'o') {
        bulletStyle = 'hollow';
      } else if (/\d+\./.test(bulletChar)) {
        bulletStyle = 'number';
      } else if (totalIndent > 0) {
        // If indented, use hollow circles for sub-items
        bulletStyle = 'hollow';
      }
      
      processed.push({
        type: 'bullet',
        content: bulletContent.trim(),
        indent: totalIndent,
        bulletStyle
      });
    } else {
      // Regular text with formatting preserved
      processed.push({
        type: 'text',
        content: stripped,
        indent: totalIndent
      });
    }
  }
  
  return processed;
}