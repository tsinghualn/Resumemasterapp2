import { Mail, Phone, MapPin, Linkedin, Github, Globe, Sparkles } from 'lucide-react';

interface CreativeTemplateProps {
  content: string;
}

export function CreativeTemplate({ content }: CreativeTemplateProps) {
  const lines = content.split('\n');
  let currentSection = '';
  const parsedData: any = { name: '', contact: {}, sections: {} };
  
  const sectionHeaders = ['PROFESSIONAL SUMMARY', 'SUMMARY', 'PROFILE', 'EXPERIENCE', 'WORK EXPERIENCE', 
                          'PROFESSIONAL EXPERIENCE', 'EDUCATION', 'SKILLS', 'TECHNICAL SKILLS', 
                          'CERTIFICATIONS', 'PROJECTS', 'ACHIEVEMENTS', 'AWARDS'];
  
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
    <div className="bg-gradient-to-br from-white via-purple-50 to-pink-50 shadow-2xl max-w-full w-full mx-auto overflow-hidden" style={{ maxWidth: '8.5in' }}>
      {/* Artistic Header */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 opacity-90"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
                           radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)`
        }}></div>
        
        <div className="relative p-12 text-white">
          <div className="flex items-center gap-4 mb-4">
            <Sparkles className="w-8 h-8" />
            <div className="h-1 flex-1 bg-gradient-to-r from-white/50 to-transparent rounded-full"></div>
          </div>
          <h1 className="text-6xl font-extrabold mb-4 tracking-tight">
            {parsedData.name || 'Your Name'}
          </h1>
          <div className="flex flex-wrap gap-6 text-base">
            {parsedData.contact.email && (
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <Mail className="w-4 h-4" />
                <span>{parsedData.contact.email}</span>
              </div>
            )}
            {parsedData.contact.phone && (
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <Phone className="w-4 h-4" />
                <span>{parsedData.contact.phone}</span>
              </div>
            )}
            {parsedData.contact.details && (
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <Linkedin className="w-4 h-4" />
                <span>{parsedData.contact.details}</span>
              </div>
            )}
          </div>
          <div className="mt-6 flex items-center gap-4">
            <div className="h-1 flex-1 bg-gradient-to-r from-transparent to-white/50 rounded-full"></div>
            <Sparkles className="w-8 h-8" />
          </div>
        </div>
      </div>

      <div className="p-12">
        {/* Professional Summary */}
        {(parsedData.sections['PROFESSIONAL SUMMARY'] || parsedData.sections['SUMMARY'] || parsedData.sections['PROFILE']) && (
          <div className="mb-10">
            <div className="relative mb-6">
              <h2 className="text-3xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent inline-block">
                About Me
              </h2>
              <div className="absolute -bottom-2 left-0 w-24 h-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full"></div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border-l-4 border-purple-600">
              <div className="space-y-3 text-gray-700 leading-relaxed text-lg">
                {(parsedData.sections['PROFESSIONAL SUMMARY'] || parsedData.sections['SUMMARY'] || parsedData.sections['PROFILE']).map((line: string, idx: number) => (
                  <p key={idx}>{line}</p>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-8">
          {/* Main Content - 2 columns */}
          <div className="col-span-2 space-y-10">
            {/* Experience */}
            {(parsedData.sections['EXPERIENCE'] || parsedData.sections['WORK EXPERIENCE'] || parsedData.sections['PROFESSIONAL EXPERIENCE']) && (
              <div>
                <div className="relative mb-6">
                  <h2 className="text-3xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent inline-block">
                    Experience
                  </h2>
                  <div className="absolute -bottom-2 left-0 w-24 h-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full"></div>
                </div>
                <div className="space-y-6">
                  {(parsedData.sections['EXPERIENCE'] || parsedData.sections['WORK EXPERIENCE'] || parsedData.sections['PROFESSIONAL EXPERIENCE']).map((line: string, idx: number) => {
                    if (line.startsWith('•') || line.startsWith('-')) {
                      return (
                        <div key={idx} className="ml-6 flex items-start gap-3">
                          <div className="w-3 h-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="flex-1 text-gray-700 leading-relaxed">{line.substring(1).trim()}</span>
                        </div>
                      );
                    }
                    if (line.includes('|')) {
                      const [title, rest] = line.split('|');
                      return (
                        <div key={idx} className="mt-6 first:mt-0 bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border-l-4 border-purple-500">
                          <h3 className="text-xl font-bold text-gray-800">{title.trim()}</h3>
                          <p className="text-sm font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            {rest.trim()}
                          </p>
                        </div>
                      );
                    }
                    return <p key={idx} className="text-gray-800 font-bold text-lg mt-4 first:mt-0">{line}</p>;
                  })}
                </div>
              </div>
            )}

            {/* Projects */}
            {parsedData.sections['PROJECTS'] && (
              <div>
                <div className="relative mb-6">
                  <h2 className="text-3xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent inline-block">
                    Projects
                  </h2>
                  <div className="absolute -bottom-2 left-0 w-24 h-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full"></div>
                </div>
                <div className="space-y-4">
                  {parsedData.sections['PROJECTS'].map((line: string, idx: number) => (
                    <div key={idx} className="bg-white/80 p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                      <p className="text-gray-700 leading-relaxed">{line}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - 1 column */}
          <div className="space-y-8">
            {/* Skills */}
            {parsedData.sections['SKILLS'] && (
              <div>
                <div className="relative mb-6">
                  <h2 className="text-2xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent inline-block">
                    Skills
                  </h2>
                  <div className="absolute -bottom-2 left-0 w-16 h-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full"></div>
                </div>
                <div className="space-y-4">
                  {parsedData.sections['SKILLS'].map((line: string, idx: number) => {
                    if (line.includes(':')) {
                      const [category, skills] = line.split(':');
                      return (
                        <div key={idx} className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border-l-4 border-purple-500">
                          <p className="font-bold text-purple-700 text-sm mb-2">{category.trim()}</p>
                          <p className="text-sm text-gray-700">{skills.trim()}</p>
                        </div>
                      );
                    }
                    return (
                      <div key={idx} className="bg-white/80 px-4 py-2 rounded-full shadow-sm text-center">
                        <p className="text-sm text-gray-700 font-medium">{line}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Education */}
            {parsedData.sections['EDUCATION'] && (
              <div>
                <div className="relative mb-6">
                  <h2 className="text-2xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent inline-block">
                    Education
                  </h2>
                  <div className="absolute -bottom-2 left-0 w-16 h-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full"></div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-xl shadow-md border-l-4 border-pink-500">
                  <div className="space-y-2 text-sm">
                    {parsedData.sections['EDUCATION'].map((line: string, idx: number) => (
                      <p key={idx} className="text-gray-700 leading-relaxed">{line}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Certifications */}
            {parsedData.sections['CERTIFICATIONS'] && (
              <div>
                <div className="relative mb-6">
                  <h2 className="text-2xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent inline-block">
                    Certifications
                  </h2>
                  <div className="absolute -bottom-2 left-0 w-16 h-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full"></div>
                </div>
                <div className="space-y-3">
                  {parsedData.sections['CERTIFICATIONS'].map((line: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mt-2"></div>
                      <span className="text-sm text-gray-700">{line}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Achievements */}
            {parsedData.sections['ACHIEVEMENTS'] && (
              <div>
                <div className="relative mb-6">
                  <h2 className="text-2xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent inline-block">
                    Awards
                  </h2>
                  <div className="absolute -bottom-2 left-0 w-16 h-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full"></div>
                </div>
                <div className="space-y-3">
                  {parsedData.sections['ACHIEVEMENTS'].map((line: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 bg-white/60 p-3 rounded-lg">
                      <span className="text-amber-500 text-lg">★</span>
                      <span className="text-sm text-gray-700">{line}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
