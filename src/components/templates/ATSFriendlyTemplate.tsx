interface ATSFriendlyTemplateProps {
  content: string;
}

export function ATSFriendlyTemplate({ content }: ATSFriendlyTemplateProps) {
  const lines = content.split('\n');
  let currentSection = '';
  const parsedData: any = { name: '', contact: {}, sections: {} };
  
  const sectionHeaders = ['PROFESSIONAL SUMMARY', 'SUMMARY', 'PROFILE', 'EXPERIENCE', 'WORK EXPERIENCE', 
                          'PROFESSIONAL EXPERIENCE', 'EDUCATION', 'SKILLS', 'TECHNICAL SKILLS', 
                          'CERTIFICATIONS', 'PROJECTS', 'ACHIEVEMENTS', 'AWARDS', 'LANGUAGES'];
  
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    const upperLine = trimmed.toUpperCase();
    
    if (!parsedData.name && trimmed && idx < 3) {
      parsedData.name = trimmed;
      return;
    }
    
    const matchedSection = sectionHeaders.find(header => 
      upperLine === header || upperLine.startsWith(header)
    );
    
    if (matchedSection) {
      currentSection = matchedSection;
      parsedData.sections[currentSection] = [];
    } else if (currentSection) {
      if (trimmed) {
        parsedData.sections[currentSection].push(trimmed);
      }
    } else if (trimmed && !parsedData.name) {
      parsedData.name = trimmed;
    } else if (trimmed && !currentSection) {
      if (trimmed.includes('@')) parsedData.contact.email = trimmed;
      else if (trimmed.match(/\d{3}/)) parsedData.contact.phone = trimmed;
      else if (!parsedData.contact.details) parsedData.contact.details = trimmed;
    }
  });

  return (
    <div className="bg-white max-w-full w-full mx-auto overflow-hidden" style={{ maxWidth: '8.5in' }}>
      <div className="p-6">
        {/* Header - Simple and ATS-Friendly */}
        <div className="text-center mb-4 pb-2 border-b-2 border-gray-900">
          <h1 className="text-2xl font-bold text-gray-900 mb-2 uppercase tracking-wide">
            {parsedData.name || 'Your Name'}
          </h1>
          <div className="flex justify-center gap-2 text-xs text-gray-700">
            {parsedData.contact.email && <span>{parsedData.contact.email}</span>}
            {parsedData.contact.email && parsedData.contact.phone && <span>|</span>}
            {parsedData.contact.phone && <span>{parsedData.contact.phone}</span>}
            {parsedData.contact.phone && parsedData.contact.details && <span>|</span>}
            {parsedData.contact.details && <span>{parsedData.contact.details}</span>}
          </div>
        </div>

        {/* Professional Summary */}
        {(parsedData.sections['PROFESSIONAL SUMMARY'] || parsedData.sections['SUMMARY'] || parsedData.sections['PROFILE']) && (
          <div className="mb-3">
            <h2 className="text-sm font-bold text-gray-900 mb-2 pb-1 border-b-2 border-gray-800 uppercase">
              Professional Summary
            </h2>
            <div className="space-y-1 text-sm text-gray-800 leading-snug">
              {(parsedData.sections['PROFESSIONAL SUMMARY'] || parsedData.sections['SUMMARY'] || parsedData.sections['PROFILE']).map((line: string, idx: number) => (
                <p key={idx}>{line}</p>
              ))}
            </div>
          </div>
        )}

        {/* Core Competencies / Skills - Prominent placement for ATS */}
        {parsedData.sections['SKILLS'] && (
          <div className="mb-3">
            <h2 className="text-sm font-bold text-gray-900 mb-2 pb-1 border-b-2 border-gray-800 uppercase">
              Core Competencies
            </h2>
            <div className="space-y-1">
              {parsedData.sections['SKILLS'].map((line: string, idx: number) => {
                if (line.includes(':')) {
                  const [category, skills] = line.split(':');
                  return (
                    <div key={idx} className="text-sm">
                      <span className="font-bold text-gray-900">{category.trim()}:</span>
                      <span className="text-gray-800 ml-2">{skills.trim()}</span>
                    </div>
                  );
                }
                return <p key={idx} className="text-sm text-gray-800">{line}</p>;
              })}
            </div>
          </div>
        )}

        {/* Professional Experience */}
        {(parsedData.sections['EXPERIENCE'] || parsedData.sections['WORK EXPERIENCE'] || parsedData.sections['PROFESSIONAL EXPERIENCE']) && (
          <div className="mb-3">
            <h2 className="text-sm font-bold text-gray-900 mb-2 pb-1 border-b-2 border-gray-800 uppercase">
              Professional Experience
            </h2>
            <div className="space-y-1.5">
              {(parsedData.sections['EXPERIENCE'] || parsedData.sections['WORK EXPERIENCE'] || parsedData.sections['PROFESSIONAL EXPERIENCE']).map((line: string, idx: number) => {
                if (line.startsWith('•') || line.startsWith('-')) {
                  return (
                    <div key={idx} className="ml-4 flex items-start gap-2">
                      <span className="text-gray-800 mt-1 text-xs">•</span>
                      <span className="flex-1 text-sm text-gray-800 leading-snug">{line.substring(1).trim()}</span>
                    </div>
                  );
                }
                // Job titles with company/date
                if (line.includes('|')) {
                  const [title, rest] = line.split('|');
                  return (
                    <div key={idx} className="mt-2 first:mt-0">
                      <div className="flex justify-between items-baseline">
                        <h3 className="text-sm font-bold text-gray-900">{title.trim()}</h3>
                        <p className="text-xs text-gray-700">{rest.trim()}</p>
                      </div>
                    </div>
                  );
                }
                return <p key={idx} className="text-gray-900 font-bold text-sm mt-2 first:mt-0">{line}</p>;
              })}
            </div>
          </div>
        )}

        {/* Education */}
        {parsedData.sections['EDUCATION'] && (
          <div className="mb-3">
            <h2 className="text-sm font-bold text-gray-900 mb-2 pb-1 border-b-2 border-gray-800 uppercase">
              Education
            </h2>
            <div className="space-y-1">
              {parsedData.sections['EDUCATION'].map((line: string, idx: number) => (
                <p key={idx} className="text-sm text-gray-800 leading-snug">{line}</p>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {parsedData.sections['CERTIFICATIONS'] && (
          <div className="mb-3">
            <h2 className="text-sm font-bold text-gray-900 mb-2 pb-1 border-b-2 border-gray-800 uppercase">
              Certifications
            </h2>
            <div className="space-y-1">
              {parsedData.sections['CERTIFICATIONS'].map((line: string, idx: number) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-xs text-gray-800">•</span>
                  <span className="text-sm text-gray-800">{line}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {parsedData.sections['PROJECTS'] && (
          <div className="mb-3">
            <h2 className="text-sm font-bold text-gray-900 mb-2 pb-1 border-b-2 border-gray-800 uppercase">
              Notable Projects
            </h2>
            <div className="space-y-1">
              {parsedData.sections['PROJECTS'].map((line: string, idx: number) => (
                <p key={idx} className="text-sm text-gray-800 leading-snug">{line}</p>
              ))}
            </div>
          </div>
        )}

        {/* Achievements */}
        {parsedData.sections['ACHIEVEMENTS'] && (
          <div className="mb-3">
            <h2 className="text-sm font-bold text-gray-900 mb-2 pb-1 border-b-2 border-gray-800 uppercase">
              Awards & Achievements
            </h2>
            <div className="space-y-1">
              {parsedData.sections['ACHIEVEMENTS'].map((line: string, idx: number) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-xs text-gray-800">•</span>
                  <span className="text-sm text-gray-800">{line}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {parsedData.sections['LANGUAGES'] && (
          <div>
            <h2 className="text-sm font-bold text-gray-900 mb-2 pb-1 border-b-2 border-gray-800 uppercase">
              Languages
            </h2>
            <div className="space-y-1">
              {parsedData.sections['LANGUAGES'].map((line: string, idx: number) => (
                <p key={idx} className="text-sm text-gray-800">{line}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
