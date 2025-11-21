// Improved experience parsing utility

export interface Experience {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
  current: boolean;
}

// Helper function to parse dates in various formats
function parseDate(dateStr: string): { start: string; end: string; current: boolean } {
  if (!dateStr) return { start: '', end: '', current: false };
  
  // Clean up the date string
  const cleanDate = dateStr.trim();
  
  // Check for current/present/ongoing
  const isCurrent = /current|present|ongoing/i.test(cleanDate);
  
  // Pattern 1: MM/YYYY - MM/YYYY or MM/YYYY - current
  // Example: "04/2024 - current" or "01/2023 - 12/2024"
  const mmyyyyPattern = /(\d{1,2}\/\d{4})\s*[-–—to]*\s*(\d{1,2}\/\d{4}|current|present|ongoing)?/i;
  const mmyyyyMatch = cleanDate.match(mmyyyyPattern);
  if (mmyyyyMatch) {
    const start = mmyyyyMatch[1]; // "04/2024"
    const end = mmyyyyMatch[2] || '';
    return {
      start: formatDate(start),
      end: isCurrent ? '' : formatDate(end),
      current: isCurrent
    };
  }
  
  // Pattern 2: Mon. YYYY or Month YYYY
  // Example: "Apr. 2024", "April 2024", "Dec. 2020"
  const monthYearPattern = /(\w{3,9}\.?\s+\d{4})\s*[-–—to]*\s*(\w{3,9}\.?\s+\d{4}|current|present|ongoing)?/i;
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
  
  // Pattern 3: Just year(s)
  // Example: "2020 - 2024" or "2023-current"
  const yearPattern = /(\d{4})\s*[-–—to]*\s*(\d{4}|current|present|ongoing)?/i;
  const yearMatch = cleanDate.match(yearPattern);
  if (yearMatch) {
    const start = yearMatch[1];
    const end = yearMatch[2] || '';
    return {
      start,
      end: isCurrent ? '' : end,
      current: isCurrent
    };
  }
  
  return { start: '', end: '', current: false };
}

// Helper to format dates consistently
function formatDate(dateStr: string): string {
  if (!dateStr || /current|present|ongoing/i.test(dateStr)) return '';
  
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

export function parseExperience(text: string): Experience[] {
  const experiences: Experience[] = [];
  
  if (!text || text.trim() === '') return experiences;
  
  // Split by bold markdown patterns that start at beginning of line (job entries from AI parser)
  // Pattern: **Job Title | Company | Dates** or **Company** followed by **Title | Dates**
  // Important: Only split on lines that START with **, not bullets with bold text (• **text**)
  const lines = text.split('\n');
  const jobBlocks: string[] = [];
  let currentBlock = '';
  
  for (const line of lines) {
    const trimmed = line.trim();
    // Check if this line starts a new job entry (starts with ** but NOT a bullet point)
    if (trimmed.startsWith('**') && !trimmed.startsWith('• **') && !trimmed.startsWith('* **') && !trimmed.startsWith('- **')) {
      // This is a new job header
      if (currentBlock) {
        jobBlocks.push(currentBlock);
      }
      currentBlock = line;
    } else {
      // This is part of the current job description
      currentBlock += (currentBlock ? '\n' : '') + line;
    }
  }
  // Don't forget the last block
  if (currentBlock) {
    jobBlocks.push(currentBlock);
  }
  
  let currentCompany = ''; // Track company for multiple roles at same company
  
  jobBlocks.forEach((block, index) => {
    if (!block.trim()) return;
    
    const lines = block.trim().split('\n').filter(line => line.trim());
    if (lines.length === 0) return;
    
    // First line contains the header (usually bold with **)
    const headerLine = lines[0].replace(/\*\*/g, '').trim();
    
    // Check if this is a standalone company name (no pipes, no dates, no commas)
    // Pattern: **Google** (company only, followed by job titles in subsequent blocks)
    const hasNoPipe = !headerLine.includes('|');
    const hasNoComma = !headerLine.includes(',');
    const hasNoDate = !headerLine.match(/\d{4}/) && !headerLine.match(/\d{1,2}\/\d{4}/);
    
    if (hasNoPipe && hasNoComma && hasNoDate && lines.length === 1) {
      // This is just a company name header for multiple roles
      currentCompany = headerLine;
      return; // Skip to next block which should contain the job title
    }
    
    // Parse the header line
    let title = '';
    let company = currentCompany; // Use tracked company if available
    let location = '';
    let startDate = '';
    let endDate = '';
    let current = false;
    
    // First, try to extract date range from anywhere in the header
    const dateResult = parseDate(headerLine);
    if (dateResult.start) {
      startDate = dateResult.start;
      endDate = dateResult.end;
      current = dateResult.current;
      
      // Remove the date portion from the header for easier parsing
      let headerWithoutDate = headerLine
        .replace(/\d{1,2}\/\d{4}\s*[-–—to]*\s*(\d{1,2}\/\d{4}|current|present|ongoing)?/gi, '')
        .replace(/\w{3,9}\.?\s+\d{4}\s*[-–—to]*\s*(\w{3,9}\.?\s+\d{4}|current|present|ongoing)?/gi, '')
        .replace(/\d{4}\s*[-–—to]*\s*(\d{4}|current|present|ongoing)?/gi, '')
        .trim();
      
      // Clean up extra commas and pipes
      headerWithoutDate = headerWithoutDate.replace(/,\s*,/g, ',').replace(/\|\s*\|/g, '|');
      headerWithoutDate = headerWithoutDate.replace(/,\s*$/g, '').replace(/\|\s*$/g, '');
      headerWithoutDate = headerWithoutDate.replace(/^,\s*/g, '').replace(/^\|\s*/g, '');
      
      // Now parse the remaining parts
      if (headerWithoutDate.includes('|')) {
        const parts = headerWithoutDate.split('|').map(p => p.trim()).filter(p => p);
        title = parts[0] || '';
        if (!company) company = parts[1] || '';
        location = parts[2] || '';
      } else if (headerWithoutDate.includes(',')) {
        const parts = headerWithoutDate.split(',').map(p => p.trim()).filter(p => p);
        title = parts[0] || '';
        if (!company) company = parts[1] || '';
        location = parts[2] || '';
      } else {
        // Just the title
        title = headerWithoutDate;
      }
    } else {
      // No dates found in header, parse normally
      if (headerLine.includes('|')) {
        const parts = headerLine.split('|').map(p => p.trim());
        title = parts[0] || '';
        if (!company) company = parts[1] || '';
        location = parts[2] || '';
      } else if (headerLine.includes(',')) {
        const parts = headerLine.split(',').map(p => p.trim());
        title = parts[0] || '';
        if (!company) company = parts[1] || '';
        location = parts[2] || '';
      } else {
        title = headerLine;
      }
    }
    
    // Look for dates and location in subsequent lines if not found in header
    if (!startDate || !location) {
      for (let i = 1; i < Math.min(lines.length, 3); i++) {
        const line = lines[i].trim().replace(/\*\*/g, '');
        
        // Check for date
        if (!startDate) {
          const dateResult = parseDate(line);
          if (dateResult.start) {
            startDate = dateResult.start;
            endDate = dateResult.end;
            current = dateResult.current;
            continue;
          }
        }
        
        // Check for location pattern (City, ST or City, State or just City)
        if (!location) {
          // Match patterns like: "Seattle, WA", "New York, NY", "San Francisco, CA", "Remote", "Seattle"
          const locationPattern = /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:,\s*[A-Z]{2,})?|Remote|Hybrid)$/;
          if (locationPattern.test(line)) {
            location = line;
            continue;
          }
        }
      }
    }
    
    // Rest of the lines are description (skip header, date, and location lines)
    const descriptionLines = lines.slice(1).filter(line => {
      const l = line.trim().replace(/\*\*/g, '');
      
      // Skip if this line only contains dates
      const dateOnlyPattern = /^(\d{1,2}\/\d{4}|\w{3,9}\.?\s+\d{4}|\d{4})\s*[-–—to]*\s*(\d{1,2}\/\d{4}|\w{3,9}\.?\s+\d{4}|\d{4}|current|present|ongoing)?\s*$/i;
      if (dateOnlyPattern.test(l)) return false;
      
      // Skip if this is the location we already extracted
      if (location && l === location) return false;
      
      // Skip if it looks like a location
      const locationPattern = /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:,\s*[A-Z]{2,})?|Remote|Hybrid)$/;
      if (locationPattern.test(l) && !location) {
        location = l;
        return false;
      }
      
      return true;
    });
    const description = descriptionLines.join('\n').trim();
    
    if (title || company || description) {
      experiences.push({
        id: `exp-${Date.now()}-${index}-${Math.random()}`,
        title: title || 'Untitled Position',
        company: company || '',
        location: location || '',
        startDate: startDate || '',
        endDate: endDate || '',
        description: description || '',
        current
      });
    }
  });
  
  return experiences;
}