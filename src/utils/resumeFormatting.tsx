/**
 * Utility functions for resume content formatting
 */

/**
 * Parses text with **bold** markers and returns an array of text segments
 * Each segment has: { text: string, bold: boolean }
 */
export function parseBoldText(text: string): Array<{ text: string; bold: boolean }> {
  const segments: Array<{ text: string; bold: boolean }> = [];
  const regex = /\*\*(.*?)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the bold marker
    if (match.index > lastIndex) {
      segments.push({
        text: text.substring(lastIndex, match.index),
        bold: false
      });
    }
    
    // Add the bold text
    segments.push({
      text: match[1],
      bold: true
    });
    
    lastIndex = regex.lastIndex;
  }
  
  // Add remaining text after last bold marker
  if (lastIndex < text.length) {
    segments.push({
      text: text.substring(lastIndex),
      bold: false
    });
  }
  
  // If no bold markers found, return the whole text as non-bold
  if (segments.length === 0) {
    segments.push({
      text: text,
      bold: false
    });
  }
  
  return segments;
}

/**
 * Checks if a line has bold markers
 */
export function hasBoldMarkers(text: string): boolean {
  return /\*\*.*?\*\*/.test(text);
}

/**
 * Renders a line with bold formatting support
 * Returns JSX with proper bold spans
 */
export function renderFormattedText(text: string, className?: string): JSX.Element {
  const segments = parseBoldText(text);
  
  return (
    <>
      {segments.map((segment, idx) => 
        segment.bold ? (
          <strong key={idx} className="font-bold">{segment.text}</strong>
        ) : (
          <span key={idx}>{segment.text}</span>
        )
      )}
    </>
  );
}
