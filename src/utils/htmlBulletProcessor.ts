// Utility to process HTML content and extract bullet points for proper rendering

export interface ProcessedContent {
  type: "bullet" | "text" | "html" | "header" | "subheader";
  content: string;
  indent?: number; // Indentation level for nested lists
  bulletStyle?: "filled" | "hollow" | "number"; // Bullet style for rendering
  isHeader?: boolean; // True if this is a header (bold text at start of line)
  headerLevel?: number; // 1 for main header, 2 for subheader
}

/**
 * Detects if a line is a header based on formatting patterns
 * Headers are typically:
 * - Entirely bold (**text** or <strong>text</strong>)
 * - Bold text followed by colon (**Header:** or <strong>Header:</strong>)
 * - All caps text
 */
function detectHeaderType(line: string): { isHeader: boolean; headerLevel: number; content: string } {
  const trimmedLine = line.trim();
  
  // Check for markdown bold header: **Header Text** or **Header:**
  const markdownBoldPattern = /^\*\*([^*]+)\*\*:?\s*$/;
  const markdownBoldMatch = trimmedLine.match(markdownBoldPattern);
  if (markdownBoldMatch) {
    return { isHeader: true, headerLevel: 1, content: markdownBoldMatch[1].trim() };
  }
  
  // Check for HTML bold header: <strong>Header</strong> or <strong>Header:</strong>
  const htmlBoldPattern = /^<strong>([^<]+)<\/strong>:?\s*$/i;
  const htmlBoldMatch = trimmedLine.match(htmlBoldPattern);
  if (htmlBoldMatch) {
    return { isHeader: true, headerLevel: 1, content: htmlBoldMatch[1].trim() };
  }
  
  // Check for bold text at start followed by content: **Header:** description
  // This is a subheader pattern
  const boldStartPattern = /^\*\*([^*]+)\*\*:?\s+(.+)$/;
  const boldStartMatch = trimmedLine.match(boldStartPattern);
  if (boldStartMatch) {
    // This is a subheader with content following
    return { isHeader: true, headerLevel: 2, content: trimmedLine };
  }
  
  // Check for HTML bold at start: <strong>Header:</strong> description
  const htmlBoldStartPattern = /^<strong>([^<]+)<\/strong>:?\s+(.+)$/i;
  const htmlBoldStartMatch = trimmedLine.match(htmlBoldStartPattern);
  if (htmlBoldStartMatch) {
    return { isHeader: true, headerLevel: 2, content: trimmedLine };
  }
  
  // Check for ALL CAPS header (at least 3 characters, mostly uppercase)
  const allCapsPattern = /^[A-Z][A-Z\s&\-]+$/;
  if (allCapsPattern.test(trimmedLine) && trimmedLine.length >= 3) {
    return { isHeader: true, headerLevel: 1, content: trimmedLine };
  }
  
  return { isHeader: false, headerLevel: 0, content: trimmedLine };
}

/**
 * Converts markdown-style bold (**text**) to HTML bold (<strong>text</strong>)
 * Also handles *text* for italic
 */
export function convertMarkdownToHTML(text: string): string {
  if (!text) return text;
  
  // Convert **text** to <strong>text</strong> (bold)
  let result = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  
  // Convert __text__ to <strong>text</strong> (bold alternative)
  result = result.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  
  // Convert *text* to <em>text</em> (italic) - but not if it's part of **
  // Only match single asterisks that aren't adjacent to other asterisks
  result = result.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  
  // Convert _text_ to <em>text</em> (italic alternative)
  result = result.replace(/(?<!_)_([^_]+)_(?!_)/g, '<em>$1</em>');
  
  return result;
}

/**
 * NEW: Processes HTML content preserving nested list structure
 * Handles <ul>, <ol>, nested lists with proper indentation
 * Also converts markdown bold/italic to HTML
 */
export function processHTMLWithNesting(
  htmlContent: string,
): ProcessedContent[] {
  if (!htmlContent) return [];

  console.log("=== processHTMLWithNesting START ===");
  console.log("Input HTML:", htmlContent);

  // First, convert any markdown-style formatting to HTML
  const convertedContent = convertMarkdownToHTML(htmlContent);
  console.log("After markdown conversion:", convertedContent);

  // Check if content has proper HTML list tags (<ul>, <ol>)
  const hasListTags = /<ul|<ol/i.test(convertedContent);

  if (hasListTags) {
    console.log("Detected list tags, using parseHTMLLists");
    // Parse HTML and preserve list structure
    const result = parseHTMLLists(convertedContent);
    console.log("parseHTMLLists result:", result);
    return result;
  } else {
    console.log(
      "No list tags, using processHTMLBulletsWithFormatting",
    );
    // Fallback to line-by-line processing for plain text with bullets
    const result =
      processHTMLBulletsWithFormatting(convertedContent);
    console.log(
      "processHTMLBulletsWithFormatting result:",
      result,
    );
    return result;
  }
}

/**
 * Parses HTML lists and returns items with indentation levels
 */
function parseHTMLLists(
  htmlContent: string,
  currentIndent: number = 0,
): ProcessedContent[] {
  const processed: ProcessedContent[] = [];

  // Create a temporary DOM element to parse HTML
  const temp = document.createElement("div");
  try {
    temp.innerHTML = htmlContent;
  } catch (error) {
    console.error("Error parsing HTML:", error);
    // Fallback to plain text processing
    return processHTMLBulletsWithFormatting(htmlContent);
  }

  console.log("=== PARSING HTML LISTS ===");
  console.log("Raw HTML:", htmlContent);
  console.log("Temp innerHTML:", temp.innerHTML);
  console.log("Temp children:", temp.children);

  function traverseListItem(
    li: HTMLElement,
    indent: number,
    isOrdered: boolean,
  ) {
    console.log(
      `Processing LI at indent ${indent}, isOrdered: ${isOrdered}`,
      li.outerHTML,
    );

    // Determine bullet style based on indent level
    let bulletStyle: "filled" | "hollow" | "number" = "filled";
    if (isOrdered) {
      bulletStyle = "number";
    } else if (indent === 0) {
      bulletStyle = "filled"; // Main level: filled circle
    } else {
      bulletStyle = "hollow"; // Sub-level: hollow circle
    }

    // Extract text content from li, but stop at nested lists
    let content = "";
    let hasNestedList = false;

    console.log("  Child nodes:", li.childNodes);

    for (const child of Array.from(li.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        const textContent = child.textContent || "";
        content += textContent;
        console.log("  Added text:", textContent);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as HTMLElement;
        const tag = el.tagName.toLowerCase();
        console.log("  Found element:", tag, el.outerHTML);

        if (tag === "ul" || tag === "ol") {
          hasNestedList = true;
          // Found nested list - process nested list items with increased indent
          console.log(
            "  Processing nested list with",
            el.children.length,
            "items",
          );
          Array.from(el.children).forEach((nestedLi) => {
            if (nestedLi.tagName.toLowerCase() === "li") {
              traverseListItem(
                nestedLi as HTMLElement,
                indent + 1,
                tag === "ol",
              );
            }
          });
        } else if (tag === "br") {
          // Skip br tags but add space if needed
          if (content && !content.endsWith(" ")) {
            content += " ";
          }
        } else {
          // Inline formatting (strong, em, b, i, span, etc.) - preserve HTML
          content += el.outerHTML;
          console.log("  Added HTML:", el.outerHTML);
        }
      }
    }

    // CRITICAL FIX: Add content only if it's not just whitespace
    // This prevents empty parent LIs from adding blank entries
    const trimmedContent = content.trim();
    if (trimmedContent) {
      // Convert markdown to HTML in the content
      const convertedContent = convertMarkdownToHTML(trimmedContent);
      
      console.log(
        "  Adding content:",
        convertedContent,
        "at indent",
        indent,
      );
      processed.push({
        type: "bullet",
        content: convertedContent,
        indent,
        bulletStyle,
      });
    } else if (!hasNestedList) {
      // If there's no content AND no nested list, this might be an empty LI
      // This shouldn't normally happen, but log it for debugging
      console.warn(
        "  Empty LI with no nested list detected:",
        li.outerHTML,
      );
    }

    console.log(
      "  LI processing complete. hasNestedList:",
      hasNestedList,
      "content added:",
      !!trimmedContent,
    );
  }

  function traverseNode(node: Node, indent: number = 0) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      const tagName = element.tagName.toLowerCase();

      if (tagName === "ul" || tagName === "ol") {
        // Process all direct li children
        Array.from(element.children).forEach((child) => {
          if (child.tagName.toLowerCase() === "li") {
            traverseListItem(
              child as HTMLElement,
              indent,
              tagName === "ol",
            );
          }
        });
      } else if (tagName === "blockquote") {
        // Blockquote adds one level of indentation
        console.log("Found blockquote, increasing indent");
        Array.from(element.childNodes).forEach((child) =>
          traverseNode(child, indent + 1),
        );
      } else if (tagName === "p" || tagName === "div") {
        // Process block elements - recurse through children
        Array.from(element.childNodes).forEach((child) =>
          traverseNode(child, indent),
        );
      } else if (tagName === "br") {
        // Skip br tags
      }
    } else if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) {
        // Convert markdown to HTML
        const convertedText = convertMarkdownToHTML(text);
        
        console.log(
          "Adding text node:",
          convertedText.substring(0, 50),
          "at indent",
          indent,
        );
        processed.push({
          type: "text",
          content: convertedText,
          indent: indent,
        });
      }
    }
  }

  // Start traversal
  Array.from(temp.childNodes).forEach((node) =>
    traverseNode(node, currentIndent),
  );

  console.log("=== PARSING COMPLETE ===");
  console.log("Processed items:", processed);
  console.log("========================");

  return processed;
}

/**
 * Processes HTML content to extract bullets (●, •, o, -, →) and text content
 * Returns an array of processed items that can be rendered as separate lines
 */
export function processHTMLBullets(
  htmlContent: string,
): ProcessedContent[] {
  if (!htmlContent) return [];

  // Strip HTML tags but preserve line breaks
  const withLineBreaks = htmlContent
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n");

  // Remove all other HTML tags
  const plainText = withLineBreaks.replace(/<[^>]+>/g, "");

  // Decode HTML entities
  const decoded = plainText
    .replace(/&nbsp;/g, " ")
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Split by lines
  const lines = decoded.split("\n");
  const processed: ProcessedContent[] = [];

  // Bullet patterns to detect
  const bulletPattern =
    /^[\s]*(●|•|○|o|■|□|▪|▫|➤|→|➔|➢|➣|➥|⇒|⇨|-|–|—|\*|\d+\.)\s+(.+)$/;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const match = trimmed.match(bulletPattern);
    if (match) {
      // This line starts with a bullet
      processed.push({
        type: "bullet",
        content: match[2].trim(),
      });
    } else {
      // Regular text
      processed.push({
        type: "text",
        content: trimmed,
      });
    }
  }

  return processed;
}

/**
 * Alternative version that keeps some HTML formatting (bold, italic, etc.)
 * ENHANCED: Now handles blockquote and elements with margin-left styling
 * FIXED: Properly splits content by line breaks and bullet points
 */
export function processHTMLBulletsWithFormatting(
  htmlContent: string,
): ProcessedContent[] {
  if (!htmlContent) return [];

  console.log("=== processHTMLBulletsWithFormatting ===");
  console.log("Input:", htmlContent);

  const processed: ProcessedContent[] = [];
  
  // Bullet pattern to detect various bullet types
  const bulletPattern = /^[\s]*(●|•|○|o|■|□|▪|▫|➤|→|➔|➢|➣|➥|⇒|⇨|-|–|—|\*|\d+\.)\s*(.+)$/;

  // First, check if the content is plain text (no HTML tags except basic formatting)
  const hasBlockTags = /<(div|p|br|ul|ol|li|blockquote)[^>]*>/i.test(htmlContent);
  
  if (!hasBlockTags) {
    // Plain text content - split by newlines and process each line
    const lines = htmlContent.split(/\n|\r\n|\r/);
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      
      // First check if this is a header
      const headerInfo = detectHeaderType(trimmedLine);
      
      // Check for bullet pattern
      const match = trimmedLine.match(bulletPattern);
      
      if (match) {
        const bulletChar = match[1];
        let bulletStyle: "filled" | "hollow" | "number" = "filled";
        
        if (bulletChar === "○" || bulletChar === "o") {
          bulletStyle = "hollow";
        } else if (/\d+\./.test(bulletChar)) {
          bulletStyle = "number";
        }
        
        // Convert markdown in the bullet content
        const bulletContent = convertMarkdownToHTML(match[2].trim());
        
        // Check if the bullet content itself is a header (bold text)
        const bulletHeaderInfo = detectHeaderType(match[2].trim());
        
        processed.push({
          type: "bullet",
          content: bulletContent,
          indent: 0,
          bulletStyle,
          isHeader: bulletHeaderInfo.isHeader,
          headerLevel: bulletHeaderInfo.headerLevel,
        });
      } else if (headerInfo.isHeader) {
        // This is a header line
        const convertedContent = convertMarkdownToHTML(headerInfo.content);
        processed.push({
          type: headerInfo.headerLevel === 1 ? "header" : "subheader",
          content: convertedContent,
          indent: 0,
          isHeader: true,
          headerLevel: headerInfo.headerLevel,
        });
      } else {
        // Regular text
        const convertedLine = convertMarkdownToHTML(trimmedLine);
        processed.push({
          type: "text",
          content: convertedLine,
          indent: 0,
        });
      }
    }
    
    console.log("=== Plain text processing complete ===");
    console.log("Result:", processed);
    return processed;
  }

  // Create a temporary DOM element to parse HTML more accurately
  const temp = document.createElement("div");
  temp.innerHTML = htmlContent;

  // Helper function to extract indent from element
  function getIndentLevel(element: HTMLElement): number {
    // Check for blockquote (typically 1 indent level)
    if (element.tagName.toLowerCase() === "blockquote") {
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
  function processNode(
    node: Node,
    currentIndent: number = 0,
  ): void {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) {
        // Split text by newlines and process each line separately
        const lines = text.split(/\n|\r\n|\r/);
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;
          
          // Check for header pattern
          const headerInfo = detectHeaderType(trimmedLine);
          
          const match = trimmedLine.match(bulletPattern);
          if (match) {
            const bulletChar = match[1];
            let bulletStyle: "filled" | "hollow" | "number" = "filled";
            
            if (bulletChar === "○" || bulletChar === "o") {
              bulletStyle = "hollow";
            } else if (/\d+\./.test(bulletChar)) {
              bulletStyle = "number";
            } else if (currentIndent > 0) {
              bulletStyle = "hollow";
            }
            
            // Convert markdown in bullet content
            const bulletContent = convertMarkdownToHTML(match[2].trim());
            
            // Check if bullet content is a header
            const bulletHeaderInfo = detectHeaderType(match[2].trim());
            
            processed.push({
              type: "bullet",
              content: bulletContent,
              indent: currentIndent,
              bulletStyle,
              isHeader: bulletHeaderInfo.isHeader,
              headerLevel: bulletHeaderInfo.headerLevel,
            });
          } else if (headerInfo.isHeader) {
            // This is a header line
            const convertedContent = convertMarkdownToHTML(headerInfo.content);
            processed.push({
              type: headerInfo.headerLevel === 1 ? "header" : "subheader",
              content: convertedContent,
              indent: currentIndent,
              isHeader: true,
              headerLevel: headerInfo.headerLevel,
            });
          } else {
            // Regular text
            const convertedLine = convertMarkdownToHTML(trimmedLine);
            processed.push({
              type: "text",
              content: convertedLine,
              indent: currentIndent,
            });
          }
        }
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      const tagName = element.tagName.toLowerCase();

      console.log(
        "  Element:",
        tagName,
        "indent:",
        currentIndent,
      );

      // Calculate indent for this element
      const elementIndent = getIndentLevel(element);
      const totalIndent = currentIndent + elementIndent;

      // Handle different element types
      if (tagName === "br") {
        // BR tag creates a line break - skip but don't add content
        return;
      } else if (
        tagName === "blockquote" ||
        tagName === "p" ||
        tagName === "div"
      ) {
        // Process content inside block elements
        const plainText = element.textContent?.trim() || "";
        
        // Split by newlines and process each line
        const lines = plainText.split(/\n|\r\n|\r/);
        
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;
          
          // Check for header pattern
          const headerInfo = detectHeaderType(trimmedLine);
          
          const match = trimmedLine.match(bulletPattern);

          if (match) {
            // This is a bullet item
            const bulletChar = match[1];
            let bulletStyle: "filled" | "hollow" | "number" = "filled";

            if (bulletChar === "○" || bulletChar === "o") {
              bulletStyle = "hollow";
            } else if (/\d+\./.test(bulletChar)) {
              bulletStyle = "number";
            } else if (totalIndent > 0) {
              bulletStyle = "hollow";
            }

            // Convert markdown in bullet content
            const bulletContent = convertMarkdownToHTML(match[2].trim());
            
            // Check if bullet content is a header
            const bulletHeaderInfo = detectHeaderType(match[2].trim());

            processed.push({
              type: "bullet",
              content: bulletContent,
              indent: totalIndent,
              bulletStyle,
              isHeader: bulletHeaderInfo.isHeader,
              headerLevel: bulletHeaderInfo.headerLevel,
            });
          } else if (headerInfo.isHeader) {
            // This is a header line
            const convertedContent = convertMarkdownToHTML(headerInfo.content);
            processed.push({
              type: headerInfo.headerLevel === 1 ? "header" : "subheader",
              content: convertedContent,
              indent: totalIndent,
              isHeader: true,
              headerLevel: headerInfo.headerLevel,
            });
          } else {
            // Regular text content
            const convertedLine = convertMarkdownToHTML(trimmedLine);
            processed.push({
              type: "text",
              content: convertedLine,
              indent: totalIndent,
            });
          }
        }
      } else {
        // For other elements (span, strong, em, etc.), process children recursively
        Array.from(element.childNodes).forEach((child) =>
          processNode(child, totalIndent),
        );
      }
    }
  }

  // Process all top-level nodes
  Array.from(temp.childNodes).forEach((node) =>
    processNode(node, 0),
  );

  console.log("=== Processing complete ===");
  console.log("Result:", processed);

  return processed;
}