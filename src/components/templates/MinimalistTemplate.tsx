interface MinimalistTemplateProps {
  content: string;
}

export function MinimalistTemplate({ content }: MinimalistTemplateProps) {
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
    <div className="bg-white shadow-lg max-w-full w-full mx-auto overflow-hidden" style={{ maxWidth: '8.5in' }}>
      <div className="p-8">
        {/* Header - Ultra Minimal */}
        <div className="mb-5 pb-3 border-b border-gray-300">
          <h1 className="text-3xl font-light tracking-tight text-gray-900 mb-2">
            {parsedData.name || 'Your Name'}
          </h1>
          <div className="flex gap-3 text-xs text-gray-600 font-light">
            {parsedData.contact.email && <span>{parsedData.contact.email}</span>}
            {parsedData.contact.phone && <span>{parsedData.contact.phone}</span>}
            {parsedData.contact.details && <span>{parsedData.contact.details}</span>}
          </div>
        </div>

        {/* Professional Summary */}
        {(parsedData.sections['PROFESSIONAL SUMMARY'] || parsedData.sections['SUMMARY'] || parsedData.sections['PROFILE']) && (
          <div className="mb-4">
            <h2 className="text-xs font-semibold tracking-widest text-gray-500 uppercase mb-2 pb-1 border-b border-gray-200">
              Summary
            </h2>
            <div className="space-y-1 text-sm text-gray-700 leading-snug font-light">
              {(parsedData.sections['PROFESSIONAL SUMMARY'] || parsedData.sections['SUMMARY'] || parsedData.sections['PROFILE']).map((line: string, idx: number) => (
                <p key={idx}>{line}</p>
              ))}
            </div>
          </div>
        )}

        {/* Experience */}
        {(parsedData.sections['EXPERIENCE'] || parsedData.sections['WORK EXPERIENCE'] || parsedData.sections['PROFESSIONAL EXPERIENCE']) && (
          <div className="mb-4">
            <h2 className="text-xs font-semibold tracking-widest text-gray-500 uppercase mb-2 pb-1 border-b border-gray-200">
              Experience
            </h2>
            <div className="space-y-1.5">
              {(parsedData.sections['EXPERIENCE'] || parsedData.sections['WORK EXPERIENCE'] || parsedData.sections['PROFESSIONAL EXPERIENCE']).map((line: string, idx: number) => {
                if (line.startsWith('•') || line.startsWith('-')) {
                  return (
                    <div key={idx} className="ml-4 flex items-start gap-2">
                      <span className="text-gray-400 mt-1 text-xs">—</span>
                      <span className="flex-1 text-sm text-gray-600 leading-snug font-light">{line.substring(1).trim()}</span>
                    </div>
                  );
                }
                // Job titles with company/date
                if (line.includes('|')) {
                  const [title, rest] = line.split('|');
                  return (
                    <div key={idx} className="mt-2 first:mt-0">
                      <h3 className="text-sm font-medium text-gray-900">{title.trim()}</h3>
                      <p className="text-xs text-gray-500 font-light mt-0.5">{rest.trim()}</p>
                    </div>
                  );
                }
                return <p key={idx} className="text-sm text-gray-800 font-medium mt-2 first:mt-0">{line}</p>;
              })}
            </div>
          </div>
        )}

        {/* Two Column Layout for Education and Skills */}
        <div className="grid grid-cols-2 gap-3">
          {/* Education */}
          {parsedData.sections['EDUCATION'] && (
            <div className="mb-4">
              <h2 className="text-xs font-semibold tracking-widest text-gray-500 uppercase mb-2 pb-1 border-b border-gray-200">
                Education
              </h2>
              <div className="space-y-1 text-xs font-light">
                {parsedData.sections['EDUCATION'].map((line: string, idx: number) => (
                  <p key={idx} className="text-gray-600 leading-snug">{line}</p>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {parsedData.sections['SKILLS'] && (
            <div className="mb-4">
              <h2 className="text-xs font-semibold tracking-widest text-gray-500 uppercase mb-2 pb-1 border-b border-gray-200">
                Skills
              </h2>
              <div className="space-y-1 text-xs font-light">
                {parsedData.sections['SKILLS'].map((line: string, idx: number) => {
                  if (line.includes(':')) {
                    const [category, skills] = line.split(':');
                    return (
                      <div key={idx}>
                        <p className="font-medium text-gray-700 text-xs mb-0.5">{category.trim()}</p>
                        <p className="text-gray-600">{skills.trim()}</p>
                      </div>
                    );
                  }
                  return <p key={idx} className="text-gray-600">{line}</p>;
                })}
              </div>
            </div>
          )}
        </div>

        {/* Projects */}
        {parsedData.sections['PROJECTS'] && (
          <div className="mb-4">
            <h2 className="text-xs font-semibold tracking-widest text-gray-500 uppercase mb-2 pb-1 border-b border-gray-200">
              Projects
            </h2>
            <div className="space-y-1 text-xs font-light">
              {parsedData.sections['PROJECTS'].map((line: string, idx: number) => (
                <p key={idx} className="text-gray-600 leading-snug">{line}</p>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {parsedData.sections['CERTIFICATIONS'] && (
          <div className="mb-4">
            <h2 className="text-xs font-semibold tracking-widest text-gray-500 uppercase mb-2 pb-1 border-b border-gray-200">
              Certifications
            </h2>
            <div className="space-y-1 text-xs font-light">
              {parsedData.sections['CERTIFICATIONS'].map((line: string, idx: number) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-gray-400 text-xs mt-0.5">•</span>
                  <span className="text-gray-600">{line}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Achievements */}
        {parsedData.sections['ACHIEVEMENTS'] && (
          <div className="mb-4">
            <h2 className="text-xs font-semibold tracking-widest text-gray-500 uppercase mb-2 pb-1 border-b border-gray-200">
              Achievements
            </h2>
            <div className="space-y-1 text-xs font-light">
              {parsedData.sections['ACHIEVEMENTS'].map((line: string, idx: number) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-gray-400 text-xs mt-0.5">•</span>
                  <span className="text-gray-600">{line}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {parsedData.sections['LANGUAGES'] && (
          <div>
            <h2 className="text-xs font-semibold tracking-widest text-gray-500 uppercase mb-2 pb-1 border-b border-gray-200">
              Languages
            </h2>
            <div className="space-y-1 text-xs font-light">
              {parsedData.sections['LANGUAGES'].map((line: string, idx: number) => (
                <p key={idx} className="text-gray-600">{line}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
