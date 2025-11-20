import { Mail, Phone, MapPin, Linkedin, Globe, Award, Briefcase } from 'lucide-react';

interface ModernTwoColumnTemplateProps {
  content: string;
}

export function ModernTwoColumnTemplate({ content }: ModernTwoColumnTemplateProps) {
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
    <div className="bg-white shadow-xl max-w-full w-full mx-auto overflow-hidden" style={{ maxWidth: '8.5in' }}>
      <div className="grid grid-cols-5 min-h-full">
        {/* Left Sidebar - Teal Accent */}
        <div className="col-span-2 bg-gradient-to-b from-teal-600 to-teal-700 text-white p-8">
          {/* Profile Section */}
          <div className="mb-8">
            <div className="w-32 h-32 bg-white rounded-full mx-auto mb-6 flex items-center justify-center">
              <div className="w-28 h-28 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center">
                <span className="text-4xl font-bold text-white">
                  {parsedData.name?.charAt(0) || 'A'}
                </span>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-center mb-2">{parsedData.name || 'Your Name'}</h1>
            <div className="h-1 w-20 bg-white mx-auto mb-6"></div>
          </div>

          {/* Contact */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5" />
              CONTACT
            </h2>
            <div className="space-y-3 text-sm">
              {parsedData.contact.email && (
                <div className="flex items-start gap-2">
                  <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span className="break-all">{parsedData.contact.email}</span>
                </div>
              )}
              {parsedData.contact.phone && (
                <div className="flex items-start gap-2">
                  <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{parsedData.contact.phone}</span>
                </div>
              )}
              {parsedData.contact.details && (
                <div className="flex items-start gap-2">
                  <Linkedin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span className="break-all">{parsedData.contact.details}</span>
                </div>
              )}
            </div>
          </div>

          {/* Skills */}
          {parsedData.sections['SKILLS'] && (
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">SKILLS</h2>
              <div className="space-y-3">
                {parsedData.sections['SKILLS'].map((line: string, idx: number) => {
                  // Parse skill categories
                  if (line.includes(':')) {
                    const [category, skills] = line.split(':');
                    return (
                      <div key={idx}>
                        <p className="font-semibold text-sm mb-1">{category.trim()}</p>
                        <p className="text-sm text-teal-100">{skills.trim()}</p>
                      </div>
                    );
                  }
                  return <p key={idx} className="text-sm text-teal-50">{line}</p>;
                })}
              </div>
            </div>
          )}

          {/* Education */}
          {parsedData.sections['EDUCATION'] && (
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">EDUCATION</h2>
              <div className="space-y-3 text-sm">
                {parsedData.sections['EDUCATION'].map((line: string, idx: number) => (
                  <p key={idx} className="text-teal-50 leading-relaxed">{line}</p>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {parsedData.sections['CERTIFICATIONS'] && (
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Award className="w-5 h-5" />
                CERTIFICATIONS
              </h2>
              <div className="space-y-2 text-sm">
                {parsedData.sections['CERTIFICATIONS'].map((line: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-teal-200 mt-1">●</span>
                    <span className="text-teal-50">{line}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {parsedData.sections['LANGUAGES'] && (
            <div>
              <h2 className="text-xl font-bold mb-4">LANGUAGES</h2>
              <div className="space-y-2 text-sm">
                {parsedData.sections['LANGUAGES'].map((line: string, idx: number) => (
                  <p key={idx} className="text-teal-50">{line}</p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="col-span-3 p-10 bg-white">
          {/* Professional Summary */}
          {(parsedData.sections['PROFESSIONAL SUMMARY'] || parsedData.sections['SUMMARY'] || parsedData.sections['PROFILE']) && (
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-10 bg-gradient-to-b from-teal-600 to-teal-400 rounded-full"></div>
                <h2 className="text-2xl font-bold text-gray-800">PROFESSIONAL SUMMARY</h2>
              </div>
              <div className="pl-5 space-y-2 text-gray-700 leading-relaxed border-l-2 border-teal-200">
                {(parsedData.sections['PROFESSIONAL SUMMARY'] || parsedData.sections['SUMMARY'] || parsedData.sections['PROFILE']).map((line: string, idx: number) => (
                  <p key={idx}>{line}</p>
                ))}
              </div>
            </div>
          )}

          {/* Experience */}
          {(parsedData.sections['EXPERIENCE'] || parsedData.sections['WORK EXPERIENCE'] || parsedData.sections['PROFESSIONAL EXPERIENCE']) && (
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-10 bg-gradient-to-b from-teal-600 to-teal-400 rounded-full"></div>
                <h2 className="text-2xl font-bold text-gray-800">EXPERIENCE</h2>
              </div>
              <div className="pl-5 border-l-2 border-teal-200">
                <div className="space-y-5">
                  {(parsedData.sections['EXPERIENCE'] || parsedData.sections['WORK EXPERIENCE'] || parsedData.sections['PROFESSIONAL EXPERIENCE']).map((line: string, idx: number) => {
                    if (line.startsWith('•') || line.startsWith('-')) {
                      return (
                        <div key={idx} className="ml-4 flex items-start gap-3">
                          <span className="text-teal-600 font-bold mt-1.5 text-sm">▸</span>
                          <span className="flex-1 text-gray-700 leading-relaxed">{line.substring(1).trim()}</span>
                        </div>
                      );
                    }
                    // Job titles and companies
                    if (line.includes('|')) {
                      const [title, rest] = line.split('|');
                      return (
                        <div key={idx} className="mt-5 first:mt-0">
                          <h3 className="text-lg font-bold text-gray-800">{title.trim()}</h3>
                          <p className="text-sm text-teal-600 font-medium">{rest.trim()}</p>
                        </div>
                      );
                    }
                    return <p key={idx} className="text-gray-800 font-semibold mt-4 first:mt-0">{line}</p>;
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Projects */}
          {parsedData.sections['PROJECTS'] && (
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-10 bg-gradient-to-b from-teal-600 to-teal-400 rounded-full"></div>
                <h2 className="text-2xl font-bold text-gray-800">PROJECTS</h2>
              </div>
              <div className="pl-5 border-l-2 border-teal-200 space-y-3">
                {parsedData.sections['PROJECTS'].map((line: string, idx: number) => (
                  <p key={idx} className="text-gray-700 leading-relaxed">{line}</p>
                ))}
              </div>
            </div>
          )}

          {/* Achievements */}
          {parsedData.sections['ACHIEVEMENTS'] && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-10 bg-gradient-to-b from-teal-600 to-teal-400 rounded-full"></div>
                <h2 className="text-2xl font-bold text-gray-800">ACHIEVEMENTS</h2>
              </div>
              <div className="pl-5 border-l-2 border-teal-200 space-y-2">
                {parsedData.sections['ACHIEVEMENTS'].map((line: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span className="text-teal-600 font-bold mt-1">★</span>
                    <span className="text-gray-700 leading-relaxed">{line}</span>
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
