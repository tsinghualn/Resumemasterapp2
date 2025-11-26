// Improved education parsing utility

export interface Education {
  id: string;
  degree: string;
  institution: string;
  location: string;
  startDate: string;
  endDate: string;
  details: string;
  current: boolean;
}

/**
 * Converts markdown-style bold (**text**) to HTML bold (<strong>text</strong>)
 */
function convertMarkdownToHTML(text: string): string {
  if (!text) return text;
  
  // Convert **text** to <strong>text</strong> (bold)
  let result = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  
  // Convert __text__ to <strong>text</strong> (bold alternative)
  result = result.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  
  // Convert *text* to <em>text</em> (italic) - but not if it's part of **
  result = result.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  
  // Convert _text_ to <em>text</em> (italic alternative)
  result = result.replace(/(?<!_)_([^_]+)_(?!_)/g, '<em>$1</em>');
  
  return result;
}

// Helper function to parse dates in various formats
function parseDate(dateStr: string): { start: string; end: string; current: boolean } {
  if (!dateStr) return { start: '', end: '', current: false };
  
  // Clean up the date string
  const cleanDate = dateStr.trim();
  
  // Check for current/present/ongoing/expected
  const isCurrent = /current|present|ongoing|expected/i.test(cleanDate);
  
  // Pattern 1: MM/YYYY - MM/YYYY or MM/YYYY - current
  const mmyyyyPattern = /(\d{1,2}\/\d{4})\s*[-–—to]*\s*(\d{1,2}\/\d{4}|current|present|ongoing|expected)?/i;
  const mmyyyyMatch = cleanDate.match(mmyyyyPattern);
  if (mmyyyyMatch) {
    const start = mmyyyyMatch[1];
    const end = mmyyyyMatch[2] || '';
    return {
      start: formatDate(start),
      end: isCurrent ? '' : formatDate(end),
      current: isCurrent
    };
  }
  
  // Pattern 2: Mon. YYYY or Month YYYY
  const monthYearPattern = /(\w{3,9}\.?\s+\d{4})\s*[-–—to]*\s*(\w{3,9}\.?\s+\d{4}|current|present|ongoing|expected)?/i;
  const monthYearMatch = cleanDate.match(monthYearPattern);
  if (monthYearMatch) {
    const start = monthYearMatch[1];
    const end = monthYearMatch[2] || '';
    return {
      start: formatDate(start),
      end: isCurrent ? '' : formatDate(end),
      current: isCurrent
    };
  }
  
  // Pattern 3: Just year(s) with a range separator or "current"
  const yearRangePattern = /(\d{4})\s*[-–—to]+(\d{4}|current|present|ongoing|expected)/i;
  const yearRangeMatch = cleanDate.match(yearRangePattern);
  if (yearRangeMatch) {
    const start = yearRangeMatch[1];
    const end = yearRangeMatch[2] || '';
    return {
      start,
      end: isCurrent ? '' : end,
      current: isCurrent
    };
  }
  
  // Pattern 4: Single date (just end date, like "Dec. 2020" or "2020")
  // This should match when there's NO range separator
  const singleDatePattern = /^(\w{3,9}\.?\s+\d{4}|\d{1,2}\/\d{4}|\d{4})$/i;
  const singleMatch = cleanDate.match(singleDatePattern);
  if (singleMatch && !cleanDate.includes('-') && !cleanDate.includes('–') && !cleanDate.includes('—') && !/to/i.test(cleanDate)) {
    // Single date without "current/present/expected" or range indicators = graduation/end date
    return {
      start: '',
      end: formatDate(singleMatch[1]),
      current: false
    };
  }
  
  return { start: '', end: '', current: false };
}

// Helper to format dates consistently
function formatDate(dateStr: string): string {
  if (!dateStr || /current|present|ongoing|expected/i.test(dateStr)) return '';
  
  // If MM/YYYY format, convert to "Mon YYYY"
  const mmyyyyMatch = dateStr.match(/(\d{1,2})\/(\d{4})/);
  if (mmyyyyMatch) {
    const month = parseInt(mmyyyyMatch[1]);
    const year = mmyyyyMatch[2];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    if (month >= 1 && month <= 12) {
      return `${monthNames[month - 1]} ${year}`;
    }
  }
  
  // If "Mon. YYYY" or "Month YYYY", normalize it
  const monthYearMatch = dateStr.match(/(\w{3,9})\.?\s+(\d{4})/i);
  if (monthYearMatch) {
    let month = monthYearMatch[1];
    const year = monthYearMatch[2];
    
    // Normalize month names
    const monthMap: { [key: string]: string } = {
      'jan': 'Jan', 'january': 'Jan',
      'feb': 'Feb', 'february': 'Feb',
      'mar': 'Mar', 'march': 'Mar',
      'apr': 'Apr', 'april': 'Apr',
      'may': 'May',
      'jun': 'Jun', 'june': 'Jun',
      'jul': 'Jul', 'july': 'Jul',
      'aug': 'Aug', 'august': 'Aug',
      'sep': 'Sep', 'sept': 'Sep', 'september': 'Sep',
      'oct': 'Oct', 'october': 'Oct',
      'nov': 'Nov', 'november': 'Nov',
      'dec': 'Dec', 'december': 'Dec'
    };
    
    const normalizedMonth = monthMap[month.toLowerCase().replace('.', '')] || month;
    return `${normalizedMonth} ${year}`;
  }
  
  // Just return as-is if we can't parse
  return dateStr.trim();
}

export function parseEducation(text: string): Education[] {
  const education: Education[] = [];
  
  if (!text || text.trim() === '') return education;
  
  // Split by bold markdown patterns OR by lines that start at the same indentation level
  // This handles both **University, Degree, Date** and same-level items like "AI Related:"
  // The pattern matches:
  // 1. Lines starting with ** (bold markdown for main entries)
  // 2. Lines starting with capital letter and ending with : (headers like "AI Related:")
  const eduBlocks = text.split(/(?=^\*\*[^\n]+\*\*)|(?=^[A-Z][\w\s]+:\s*$)/m);
  
  eduBlocks.forEach((block, index) => {
    if (!block.trim()) return;
    
    const lines = block.trim().split('\n').filter(line => line.trim());
    if (lines.length === 0) return;
    
    // First line contains the header
    const headerLine = lines[0].replace(/\*\*/g, '').trim();
    
    let degree = '';
    let institution = '';
    let location = '';
    let startDate = '';
    let endDate = '';
    let current = false;
    
    // Check if this is a special header (like "AI Related:")
    // These should be treated as degree titles
    if (headerLine.endsWith(':') && !headerLine.match(/\d{4}/)) {
      degree = headerLine.replace(':', '').trim();
      // Rest of the lines become details
      const detailsLines = lines.slice(1);
      const details = detailsLines.join('\n').trim();
      
      if (degree || details) {
        education.push({
          id: `edu-${Date.now()}-${index}-${Math.random()}`,
          degree: degree || 'Education',
          institution: '',
          location: '',
          startDate: '',
          endDate: '',
          // Convert markdown to HTML for proper display
          details: convertMarkdownToHTML(details) || '',
          current: false
        });
      }
      return;
    }
    
    // Parse dates from the header first
    const dateResult = parseDate(headerLine);
    if (dateResult.start || dateResult.end) {
      startDate = dateResult.start;
      endDate = dateResult.end;
      current = dateResult.current;
    }
    
    // Remove dates from header for easier parsing
    let headerWithoutDate = headerLine
      .replace(/\d{1,2}\/\d{4}\s*[-–—to]*\s*(\d{1,2}\/\d{4}|current|present|ongoing|expected)?/gi, '')
      .replace(/\w{3,9}\.?\s+\d{4}\s*[-–—to]*\s*(\w{3,9}\.?\s+\d{4}|current|present|ongoing|expected)?/gi, '')
      .replace(/\d{4}\s*[-–—to]*\s*(\d{4}|current|present|ongoing|expected)?/gi, '')
      .trim();
    
    // Clean up extra commas and pipes
    headerWithoutDate = headerWithoutDate.replace(/,\s*,/g, ',').replace(/\|\s*\|/g, '|');
    headerWithoutDate = headerWithoutDate.replace(/,\s*$/g, '').replace(/\|\s*$/g, '');
    headerWithoutDate = headerWithoutDate.replace(/^,\s*/g, '').replace(/^\|\s*/g, '');
    
    // Degree keywords for detection
    const degreeKeywords = /bachelor|master|phd|ph\.d|b\.s\.|m\.s\.|b\.a\.|m\.a\.|degree|diploma|certificate|associate|mba|msc|bsc|b\.sc|m\.sc/i;
    
    // Parse the header based on delimiters
    if (headerWithoutDate.includes('|')) {
      // Pipe-separated: could be "Degree | Institution" or "Institution | Degree"
      const parts = headerWithoutDate.split('|').map(p => p.trim()).filter(p => p);
      
      const firstHasDegree = degreeKeywords.test(parts[0]);
      const secondHasDegree = parts.length > 1 ? degreeKeywords.test(parts[1]) : false;
      
      if (firstHasDegree && !secondHasDegree) {
        degree = parts[0];
        institution = parts[1] || '';
        location = parts[2] || '';
      } else if (!firstHasDegree && secondHasDegree) {
        institution = parts[0];
        degree = parts[1] || '';
        location = parts[2] || '';
      } else {
        // Default: first is degree
        degree = parts[0];
        institution = parts[1] || '';
        location = parts[2] || '';
      }
    } else if (headerWithoutDate.includes(',')) {
      // Comma-separated: Format is typically "Institution, Degree, Location"
      // Example: "University of Wisconsin-Madison, M.S. in Computer Sciences"
      const parts = headerWithoutDate.split(',').map(p => p.trim()).filter(p => p);
      
      const firstHasDegree = degreeKeywords.test(parts[0]);
      const secondHasDegree = parts.length > 1 ? degreeKeywords.test(parts[1]) : false;
      
      if (!firstHasDegree && secondHasDegree) {
        // Format: Institution, Degree, Location
        institution = parts[0];
        degree = parts[1] || '';
        location = parts[2] || '';
      } else if (firstHasDegree && !secondHasDegree) {
        // Format: Degree, Institution, Location
        degree = parts[0];
        institution = parts[1] || '';
        location = parts[2] || '';
      } else {
        // Ambiguous - default to Institution, Degree, Location
        institution = parts[0];
        degree = parts[1] || '';
        location = parts[2] || '';
      }
    } else {
      // Single part - determine if it's degree or institution
      if (degreeKeywords.test(headerWithoutDate)) {
        degree = headerWithoutDate;
      } else {
        institution = headerWithoutDate;
      }
    }
    
    // Look for dates in subsequent lines if not found in header
    if (!startDate && !endDate) {
      for (let i = 1; i < Math.min(lines.length, 4); i++) {
        const dateLine = lines[i].trim();
        const dateResult = parseDate(dateLine);
        if (dateResult.start || dateResult.end) {
          startDate = dateResult.start;
          endDate = dateResult.end;
          current = dateResult.current;
          break;
        }
      }
    }
    
    // If we only have an end date and not currently studying, that's normal for graduations
    // If we have both start and end, or if current is true, keep both
    
    // Rest of the lines are details (GPA, honors, coursework, etc.)
    const detailsLines = lines.slice(1).filter(line => {
      const l = line.trim().replace(/\*\*/g, '');
      
      // Skip if it's the institution or degree line we already extracted
      if (institution && l === institution) return false;
      if (degree && l === degree) return false;
      
      // Skip if it's the location we already extracted
      if (location && l === location) return false;
      
      // Skip date-only lines
      const dateOnlyPattern = /^(\d{1,2}\/\d{4}|\w{3,9}\.?\s+\d{4}|\d{4})\s*[-–—to]*\s*(\d{1,2}\/\d{4}|\w{3,9}\.?\s+\d{4}|\d{4}|current|present|ongoing|expected)?\s*$/i;
      if (dateOnlyPattern.test(l)) return false;
      
      // Skip if it looks like a location (City, ST or City, State pattern)
      const locationPattern = /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:,\s*[A-Z]{2,})?|Remote|Hybrid)$/;
      if (locationPattern.test(l)) {
        // If we don't have a location yet, use this as location
        if (!location) {
          location = l;
        }
        return false;
      }
      
      return true;
    });
    
    const details = detailsLines.join('\n').trim();
    
    // Create entry if we have at least degree or institution or details
    if (degree || institution || details) {
      education.push({
        id: `edu-${Date.now()}-${index}-${Math.random()}`,
        degree: degree || 'Degree',
        institution: institution || '',
        location: location || '',
        startDate: startDate || '',
        endDate: endDate || '',
        // Convert markdown to HTML for proper display
        details: convertMarkdownToHTML(details) || '',
        current
      });
    }
  });
  
  return education;
}