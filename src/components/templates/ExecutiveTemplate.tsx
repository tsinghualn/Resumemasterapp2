import { Mail, Phone, MapPin, Linkedin, Globe } from 'lucide-react';
import { renderFormattedText, hasBoldMarkers } from '../../utils/resumeFormatting';

interface ExecutiveTemplateProps {
  content: string;
}

export function ExecutiveTemplate({ content }: ExecutiveTemplateProps) {
  const lines = content.split('\n');
  let currentSection = '';
  const parsedData: any = { name: '', contact: {}, sections: {} };
  
  // Parse resume content
  const sectionHeaders = ['PROFESSIONAL SUMMARY', 'SUMMARY', 'PROFILE', 'EXPERIENCE', 'WORK EXPERIENCE', 
                          'PROFESSIONAL EXPERIENCE', 'EDUCATION', 'SKILLS', 'TECHNICAL SKILLS', 
                          'CERTIFICATIONS', 'PROJECTS', 'ACHIEVEMENTS', 'AWARDS'];
  
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    const upperLine = trimmed.toUpperCase();
    
    // First non-empty line is the name
    if (!parsedData.name && trimmed && idx < 3) {
      parsedData.name = trimmed;
      return;
    }
    
    // Check for section headers
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
      // Contact info
      if (trimmed.includes('@')) parsedData.contact.email = trimmed;
      else if (trimmed.match(/\d{3}/)) parsedData.contact.phone = trimmed;
      else if (!parsedData.contact.details) parsedData.contact.details = trimmed;
    }
  });

  return (
    <div className="bg-white shadow-2xl rounded-none max-w-full w-full mx-auto overflow-hidden" style={{ maxWidth: '8.5in' }}>
      {/* Header with Dark Background */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 text-white p-12">
        <h1 className="text-5xl font-bold tracking-tight mb-4">{parsedData.name || 'Your Name'}</h1>
        <div className="flex flex-wrap gap-6 text-sm text-slate-200">
          {parsedData.contact.email && (
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span>{parsedData.contact.email}</span>
            </div>
          )}
          {parsedData.contact.phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <span>{parsedData.contact.phone}</span>
            </div>
          )}
          {parsedData.contact.details && (
            <div className="flex items-center gap-2">
              <Linkedin className="w-4 h-4" />
              <span>{parsedData.contact.details}</span>
            </div>
          )}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-3 gap-0">
        {/* Left Sidebar - 1/3 width */}
        <div className="bg-slate-50 p-8 border-r-4 border-slate-700">
          {/* Skills */}
          {parsedData.sections['SKILLS'] && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-slate-800 mb-4 pb-2 border-b-2 border-slate-700">
                SKILLS
              </h2>
              <div className="space-y-2">
                {parsedData.sections['SKILLS'].map((line: string, idx: number) => (
                  <p key={idx} className="text-sm text-slate-700 leading-relaxed">{line}</p>
                ))}
              </div>
            </div>
          )}
          
          {/* Education */}
          {parsedData.sections['EDUCATION'] && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-slate-800 mb-4 pb-2 border-b-2 border-slate-700">
                EDUCATION
              </h2>
              <div className="space-y-3">
                {parsedData.sections['EDUCATION'].map((line: string, idx: number) => (
                  <p key={idx} className="text-sm text-slate-700 leading-relaxed">{line}</p>
                ))}
              </div>
            </div>
          )}
          
          {/* Certifications */}
          {parsedData.sections['CERTIFICATIONS'] && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-slate-800 mb-4 pb-2 border-b-2 border-slate-700">
                CERTIFICATIONS
              </h2>
              <div className="space-y-2">
                {parsedData.sections['CERTIFICATIONS'].map((line: string, idx: number) => (
                  <p key={idx} className="text-sm text-slate-700 leading-relaxed">{line}</p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Content - 2/3 width */}
        <div className="col-span-2 p-8">
          {/* Professional Summary */}
          {(parsedData.sections['PROFESSIONAL SUMMARY'] || parsedData.sections['SUMMARY']) && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-4 pb-2 border-b-2 border-slate-700">
                EXECUTIVE SUMMARY
              </h2>
              <div className="space-y-2 text-slate-700 leading-relaxed">
                {(parsedData.sections['PROFESSIONAL SUMMARY'] || parsedData.sections['SUMMARY']).map((line: string, idx: number) => (
                  <p key={idx}>{line}</p>
                ))}
              </div>
            </div>
          )}

          {/* Experience */}
          {(parsedData.sections['EXPERIENCE'] || parsedData.sections['WORK EXPERIENCE'] || parsedData.sections['PROFESSIONAL EXPERIENCE']) && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-4 pb-2 border-b-2 border-slate-700">
                PROFESSIONAL EXPERIENCE
              </h2>
              <div className="space-y-4">
                {(parsedData.sections['EXPERIENCE'] || parsedData.sections['WORK EXPERIENCE'] || parsedData.sections['PROFESSIONAL EXPERIENCE']).map((line: string, idx: number) => {
                  // Bullet points
                  if (line.startsWith('•') || line.startsWith('-')) {
                    return (
                      <div key={idx} className="ml-6 flex items-start gap-3">
                        <span className="text-slate-600 mt-1.5">▪</span>
                        <span className="flex-1 text-slate-700 leading-relaxed">{renderFormattedText(line.substring(1).trim())}</span>
                      </div>
                    );
                  }
                  // Lines with bold markers (company names, job titles)
                  if (hasBoldMarkers(line)) {
                    return <p key={idx} className="text-slate-800 font-bold mt-4 first:mt-0">{renderFormattedText(line)}</p>;
                  }
                  // Regular text lines
                  return <p key={idx} className="text-slate-800 font-semibold mt-4 first:mt-0">{renderFormattedText(line)}</p>;
                })}
              </div>
            </div>
          )}
          
          {/* Achievements */}
          {parsedData.sections['ACHIEVEMENTS'] && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-4 pb-2 border-b-2 border-slate-700">
                KEY ACHIEVEMENTS
              </h2>
              <div className="space-y-2">
                {parsedData.sections['ACHIEVEMENTS'].map((line: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span className="text-amber-600 mt-1.5 font-bold">★</span>
                    <span className="flex-1 text-slate-700 leading-relaxed">{line}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}