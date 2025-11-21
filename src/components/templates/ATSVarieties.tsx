interface ATSVarietyProps {
  content: string;
  variety: number;
}

export function ATSVariety({ content, variety }: ATSVarietyProps) {
  const lines = content.split('\n');
  let currentSection = '';
  const parsedData: any = { name: '', contact: {}, sections: {} };
  
  const sectionHeaders = [
    'PROFESSIONAL SUMMARY', 'SUMMARY', 'PROFILE', 'OBJECTIVE', 'CAREER OBJECTIVE',
    'EXPERIENCE', 'WORK EXPERIENCE', 'PROFESSIONAL EXPERIENCE', 'EMPLOYMENT HISTORY',
    'EDUCATION', 'ACADEMIC BACKGROUND',
    'SKILLS', 'TECHNICAL SKILLS', 'CORE COMPETENCIES', 'CORE SKILLS', 'KEY SKILLS',
    'PROJECTS', 'KEY PROJECTS', 'NOTABLE PROJECTS',
    'CERTIFICATIONS', 'CERTIFICATES', 'PROFESSIONAL CERTIFICATIONS', 'LICENSES AND CERTIFICATIONS',
    'ACHIEVEMENTS', 'AWARDS', 'HONORS', 'HONORS AND AWARDS', 'RECOGNITION',
    'ACTIVITIES', 'VOLUNTEER EXPERIENCE', 'VOLUNTEER WORK', 'EXTRACURRICULAR ACTIVITIES', 'COMMUNITY INVOLVEMENT',
    'HOBBIES', 'INTERESTS', 'HOBBIES AND INTERESTS', 'PERSONAL INTERESTS',
    'LANGUAGES',
    'PUBLICATIONS', 'RESEARCH', 'CONFERENCES',
    'PROFESSIONAL AFFILIATIONS', 'MEMBERSHIPS'
  ];
  
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
      if (trimmed) parsedData.sections[currentSection].push(trimmed);
    } else if (trimmed && !parsedData.name) {
      parsedData.name = trimmed;
    } else if (trimmed && !currentSection) {
      if (trimmed.includes('@')) parsedData.contact.email = trimmed;
      else if (trimmed.match(/\d{3}/)) parsedData.contact.phone = trimmed;
      else if (!parsedData.contact.details) parsedData.contact.details = trimmed;
    }
  });

  const renderBulletContent = (line: string, isExperienceType: boolean) => {
    if (isExperienceType && (line.startsWith('•') || line.startsWith('-') || line.startsWith('→'))) {
      return { isBullet: true, content: line.substring(1).trim() };
    }
    return { isBullet: false, content: line };
  };

  const renderJobTitle = (line: string, isExperienceType: boolean) => {
    if (isExperienceType && line.includes('|')) {
      const [title, rest] = line.split('|');
      return { isTitle: true, title: title.trim(), details: rest.trim() };
    }
    return { isTitle: false, content: line };
  };

  // 1. Classic Centered - Traditional ATS format
  if (variety === 1) {
    return (
      <div className="bg-white max-w-full w-full mx-auto overflow-hidden" style={{ maxWidth: '8.5in' }}>
        <div className="p-12">
          <div className="text-center mb-8 pb-6 border-b-2 border-gray-900">
            <h1 className="text-4xl font-bold uppercase tracking-wide mb-3">{parsedData.name || 'Your Name'}</h1>
            <div className="flex justify-center gap-4 text-sm text-gray-700">
              {parsedData.contact.email && <span>{parsedData.contact.email}</span>}
              {parsedData.contact.email && parsedData.contact.phone && <span>|</span>}
              {parsedData.contact.phone && <span>{parsedData.contact.phone}</span>}
              {parsedData.contact.phone && parsedData.contact.details && <span>|</span>}
              {parsedData.contact.details && <span>{parsedData.contact.details}</span>}
            </div>
          </div>
          {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any]) => {
            const upper = sectionName.toUpperCase();
            const isExperienceType = upper.includes('EXPERIENCE') || upper.includes('EMPLOYMENT') || upper.includes('PROJECT');
            const isSkillsType = upper.includes('SKILLS') || upper.includes('COMPETENCIES');
            return (
              <div key={sectionName} className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-3 pb-1 border-b-2 border-gray-800 uppercase">{sectionName}</h2>
                <div className="space-y-2">
                  {sectionContent.map((line: string, idx: number) => {
                    const bullet = renderBulletContent(line, isExperienceType);
                    const title = renderJobTitle(line, isExperienceType);
                    if (bullet.isBullet) {
                      return (
                        <div key={idx} className="ml-6 flex items-start gap-3">
                          <span className="text-gray-800 mt-1.5">•</span>
                          <span className="flex-1 text-gray-800 leading-relaxed">{bullet.content}</span>
                        </div>
                      );
                    }
                    if (title.isTitle) {
                      return (
                        <div key={idx} className="mt-4 first:mt-0">
                          <div className="flex justify-between items-baseline">
                            <h3 className="text-lg font-bold text-gray-900">{title.title}</h3>
                            <p className="text-sm text-gray-700">{title.details}</p>
                          </div>
                        </div>
                      );
                    }
                    // Special handling for skills with categories (containing ":")
                    if (isSkillsType && line.includes(':')) {
                      const [category, skills] = line.split(':');
                      return (
                        <div key={idx} className="mb-3">
                          <p className="font-semibold text-gray-900">{category.trim()}</p>
                          <p className="text-gray-800 leading-relaxed ml-2">{skills.trim()}</p>
                        </div>
                      );
                    }
                    return <p key={idx} className="text-gray-800 leading-relaxed">{line}</p>;
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 2. Left Aligned Compact - Professional compact style
  if (variety === 2) {
    return (
      <div className="bg-white max-w-full w-full mx-auto overflow-hidden" style={{ maxWidth: '8.5in' }}>
        <div className="p-10">
          <div className="mb-6 pb-4 border-b-4 border-gray-900">
            <h1 className="text-5xl font-extrabold uppercase mb-2">{parsedData.name || 'Your Name'}</h1>
            <div className="flex gap-4 text-sm text-gray-700">
              {parsedData.contact.email && <span>{parsedData.contact.email}</span>}
              {parsedData.contact.phone && <span>| {parsedData.contact.phone}</span>}
              {parsedData.contact.details && <span>| {parsedData.contact.details}</span>}
            </div>
          </div>
          {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any]) => {
            const upper = sectionName.toUpperCase();
            const isExperienceType = upper.includes('EXPERIENCE') || upper.includes('EMPLOYMENT') || upper.includes('PROJECT');
            return (
              <div key={sectionName} className="mb-6">
                <h2 className="text-lg font-bold text-gray-900 mb-2 pb-1 border-b-2 border-gray-900 uppercase">{sectionName}</h2>
                <div className="space-y-2 text-sm">
                  {sectionContent.map((line: string, idx: number) => {
                    const bullet = renderBulletContent(line, isExperienceType);
                    const title = renderJobTitle(line, isExperienceType);
                    if (bullet.isBullet) {
                      return (
                        <div key={idx} className="ml-4 flex items-start gap-2">
                          <span className="text-gray-800 mt-1">■</span>
                          <span className="flex-1 text-gray-800 leading-relaxed">{bullet.content}</span>
                        </div>
                      );
                    }
                    if (title.isTitle) {
                      return (
                        <div key={idx} className="mt-3 first:mt-0">
                          <h3 className="font-bold text-gray-900">{title.title}</h3>
                          <p className="text-xs text-gray-600">{title.details}</p>
                        </div>
                      );
                    }
                    return <p key={idx} className="text-gray-800 leading-relaxed">{line}</p>;
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 3. Left Sidebar - Skills and education on left
  if (variety === 3) {
    return (
      <div className="bg-white max-w-full w-full mx-auto overflow-hidden" style={{ maxWidth: '8.5in' }}>
        <div className="grid grid-cols-3 min-h-screen">
          <div className="col-span-1 bg-gray-100 p-8 border-r-4 border-gray-900">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{parsedData.name || 'Your Name'}</h1>
              <div className="space-y-2 text-xs text-gray-700">
                {parsedData.contact.email && <p className="break-all">{parsedData.contact.email}</p>}
                {parsedData.contact.phone && <p>{parsedData.contact.phone}</p>}
                {parsedData.contact.details && <p>{parsedData.contact.details}</p>}
              </div>
            </div>
            {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any]) => {
              const upper = sectionName.toUpperCase();
              const isSidebarSection = upper.includes('SKILL') || upper.includes('COMPETENC') || 
                                       upper.includes('EDUCATION') || upper.includes('ACADEMIC') || 
                                       upper.includes('CERTIFICATION') || upper.includes('LICENSE') ||
                                       upper.includes('LANGUAGE');
              if (!isSidebarSection) return null;
              return (
                <div key={sectionName} className="mb-8">
                  <h2 className="text-sm font-bold text-gray-900 mb-3 pb-2 border-b-2 border-gray-700 uppercase">{sectionName}</h2>
                  <div className="space-y-2 text-xs">
                    {sectionContent.map((line: string, idx: number) => (
                      <p key={idx} className="text-gray-700 leading-relaxed">{line}</p>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="col-span-2 p-8">
            {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any]) => {
              const upper = sectionName.toUpperCase();
              const isMainSection = upper.includes('SUMMARY') || upper.includes('PROFILE') || upper.includes('OBJECTIVE') ||
                                   upper.includes('EXPERIENCE') || upper.includes('EMPLOYMENT') || upper.includes('PROJECT');
              if (!isMainSection) return null;
              const isExperienceType = upper.includes('EXPERIENCE') || upper.includes('EMPLOYMENT') || upper.includes('PROJECT');
              return (
                <div key={sectionName} className="mb-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-900 uppercase">{sectionName}</h2>
                  <div className="space-y-3">
                    {sectionContent.map((line: string, idx: number) => {
                      const bullet = renderBulletContent(line, isExperienceType);
                      const title = renderJobTitle(line, isExperienceType);
                      if (bullet.isBullet) {
                        return (
                          <div key={idx} className="ml-6 flex items-start gap-3">
                            <span className="text-gray-800 mt-1.5">•</span>
                            <span className="flex-1 text-gray-800 leading-relaxed">{bullet.content}</span>
                          </div>
                        );
                      }
                      if (title.isTitle) {
                        return (
                          <div key={idx} className="mt-4 first:mt-0">
                            <h3 className="text-lg font-bold text-gray-900">{title.title}</h3>
                            <p className="text-sm text-gray-600">{title.details}</p>
                          </div>
                        );
                      }
                      return <p key={idx} className="text-gray-800 leading-relaxed">{line}</p>;
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // 4. Compact Two-Column - Maximum info density
  if (variety === 4) {
    return (
      <div className="bg-white max-w-full w-full mx-auto overflow-hidden" style={{ maxWidth: '8.5in' }}>
        <div className="p-10">
          <div className="mb-6 pb-4 border-b border-gray-400">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{parsedData.name || 'Your Name'}</h1>
            <div className="flex flex-wrap gap-3 text-xs text-gray-600">
              {parsedData.contact.email && <span>{parsedData.contact.email}</span>}
              {parsedData.contact.phone && <span>• {parsedData.contact.phone}</span>}
              {parsedData.contact.details && <span>• {parsedData.contact.details}</span>}
            </div>
          </div>
          {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any]) => {
            const upper = sectionName.toUpperCase();
            if (!(upper.includes('SUMMARY') || upper.includes('PROFILE') || upper.includes('OBJECTIVE'))) return null;
            return (
              <div key={sectionName} className="mb-6">
                <h2 className="text-lg font-bold text-gray-900 mb-2 uppercase">{sectionName}</h2>
                <div className="text-sm text-gray-700 leading-relaxed">
                  {sectionContent.map((line: string, idx: number) => (
                    <p key={idx} className="mb-1">{line}</p>
                  ))}
                </div>
              </div>
            );
          })}
          <div className="grid grid-cols-2 gap-8">
            <div>
              {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any]) => {
                const upper = sectionName.toUpperCase();
                const isLeftColumn = upper.includes('SKILL') || upper.includes('COMPETENC') || 
                                    upper.includes('CERTIFICATION') || upper.includes('LICENSE') ||
                                    upper.includes('LANGUAGE');
                if (!isLeftColumn) return null;
                return (
                  <div key={sectionName} className="mb-6">
                    <h2 className="text-sm font-bold text-gray-900 mb-3 pb-1 border-b border-gray-600 uppercase">{sectionName}</h2>
                    <div className="space-y-1.5 text-sm">
                      {sectionContent.map((line: string, idx: number) => (
                        <p key={idx} className="text-gray-700 leading-relaxed">{line}</p>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div>
              {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any]) => {
                const upper = sectionName.toUpperCase();
                const isRightColumn = upper.includes('EXPERIENCE') || upper.includes('EMPLOYMENT') ||
                                     upper.includes('EDUCATION') || upper.includes('ACADEMIC') ||
                                     upper.includes('PROJECT');
                if (!isRightColumn) return null;
                const isExperienceType = upper.includes('EXPERIENCE') || upper.includes('EMPLOYMENT') || upper.includes('PROJECT');
                return (
                  <div key={sectionName} className="mb-6">
                    <h2 className="text-sm font-bold text-gray-900 mb-3 pb-1 border-b border-gray-600 uppercase">{sectionName}</h2>
                    <div className="space-y-2 text-sm">
                      {sectionContent.map((line: string, idx: number) => {
                        const bullet = renderBulletContent(line, isExperienceType);
                        const title = renderJobTitle(line, isExperienceType);
                        if (bullet.isBullet) {
                          return (
                            <div key={idx} className="ml-4 flex items-start gap-2">
                              <span className="text-gray-700 mt-1">•</span>
                              <span className="flex-1 text-gray-700 leading-relaxed">{bullet.content}</span>
                            </div>
                          );
                        }
                        if (title.isTitle) {
                          return (
                            <div key={idx} className="mt-3 first:mt-0">
                              <h3 className="font-bold text-gray-900">{title.title}</h3>
                              <p className="text-xs text-gray-600">{title.details}</p>
                            </div>
                          );
                        }
                        return <p key={idx} className="text-gray-700 leading-relaxed">{line}</p>;
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 5. Timeline Style - Visual career progression
  if (variety === 5) {
    return (
      <div className="bg-white" style={{ width: '8.5in', minHeight: '11in', margin: '0 auto' }}>
        <div className="p-12">
          <div className="mb-8 pb-6 border-b-4 border-gray-900">
            <h1 className="text-5xl font-extrabold text-gray-900 mb-2 uppercase">{parsedData.name || 'Your Name'}</h1>
            <div className="flex gap-4 text-sm text-gray-700">
              {parsedData.contact.email && <span>{parsedData.contact.email}</span>}
              {parsedData.contact.phone && <span>| {parsedData.contact.phone}</span>}
              {parsedData.contact.details && <span>| {parsedData.contact.details}</span>}
            </div>
          </div>
          {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any]) => {
            const upper = sectionName.toUpperCase();
            const isExperienceType = upper.includes('EXPERIENCE') || upper.includes('EMPLOYMENT') || upper.includes('PROJECT');
            return (
              <div key={sectionName} className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-900 uppercase">{sectionName}</h2>
                {isExperienceType ? (
                  <div className="relative pl-8 border-l-4 border-gray-300">
                    <div className="space-y-6">
                      {sectionContent.map((line: string, idx: number) => {
                        const bullet = renderBulletContent(line, isExperienceType);
                        const title = renderJobTitle(line, isExperienceType);
                        if (bullet.isBullet) {
                          return (
                            <div key={idx} className="ml-4 flex items-start gap-2">
                              <span className="text-gray-700 mt-1.5">■</span>
                              <span className="flex-1 text-gray-800 leading-relaxed">{bullet.content}</span>
                            </div>
                          );
                        }
                        if (title.isTitle) {
                          return (
                            <div key={idx} className="relative">
                              <div className="absolute -left-10 top-1 w-4 h-4 bg-gray-900 rounded-full border-4 border-white"></div>
                              <h3 className="text-lg font-bold text-gray-900">{title.title}</h3>
                              <p className="text-sm font-semibold text-gray-600 mb-2">{title.details}</p>
                            </div>
                          );
                        }
                        return <p key={idx} className="font-semibold text-gray-900 mt-4">{line}</p>;
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sectionContent.map((line: string, idx: number) => (
                      <p key={idx} className="text-gray-800 leading-relaxed">{line}</p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Continue with varieties 6-20...
  // For brevity, I'll show the pattern for a few more and then indicate the rest

  // 6. Right Sidebar
  if (variety === 6) {
    return (
      <div className="bg-white" style={{ width: '8.5in', minHeight: '11in', margin: '0 auto' }}>
        <div className="grid grid-cols-3 min-h-screen">
          <div className="col-span-2 p-10">
            <div className="mb-8">
              <h1 className="text-5xl font-bold text-gray-900 mb-3">{parsedData.name || 'Your Name'}</h1>
              <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                {parsedData.contact.email && <span>{parsedData.contact.email}</span>}
                {parsedData.contact.phone && <span>| {parsedData.contact.phone}</span>}
                {parsedData.contact.details && <span>| {parsedData.contact.details}</span>}
              </div>
            </div>
            {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any]) => {
              const upper = sectionName.toUpperCase();
              const isMainSection = upper.includes('SUMMARY') || upper.includes('PROFILE') || upper.includes('OBJECTIVE') ||
                                   upper.includes('EXPERIENCE') || upper.includes('EMPLOYMENT') || upper.includes('PROJECT');
              if (!isMainSection) return null;
              const isExperienceType = upper.includes('EXPERIENCE') || upper.includes('EMPLOYMENT') || upper.includes('PROJECT');
              return (
                <div key={sectionName} className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{sectionName.toUpperCase()}</h2>
                  <div className="space-y-3">
                    {sectionContent.map((line: string, idx: number) => {
                      const bullet = renderBulletContent(line, isExperienceType);
                      const title = renderJobTitle(line, isExperienceType);
                      if (bullet.isBullet) {
                        return (
                          <div key={idx} className="ml-6 flex items-start gap-3">
                            <span className="text-gray-600 mt-1.5">•</span>
                            <span className="flex-1 text-gray-700 leading-relaxed">{bullet.content}</span>
                          </div>
                        );
                      }
                      if (title.isTitle) {
                        return (
                          <div key={idx} className="mt-4 first:mt-0">
                            <h3 className="text-lg font-bold text-gray-900">{title.title}</h3>
                            <p className="text-sm text-gray-600">{title.details}</p>
                          </div>
                        );
                      }
                      return <p key={idx} className="text-gray-700 leading-relaxed">{line}</p>;
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="bg-gray-50 p-8 border-l-4 border-gray-900">
            {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any]) => {
              const upper = sectionName.toUpperCase();
              const isSidebarSection = upper.includes('SKILL') || upper.includes('COMPETENC') || 
                                       upper.includes('EDUCATION') || upper.includes('ACADEMIC') || 
                                       upper.includes('CERTIFICATION') || upper.includes('LICENSE') ||
                                       upper.includes('LANGUAGE') || upper.includes('AWARD') || upper.includes('HONOR');
              if (!isSidebarSection) return null;
              return (
                <div key={sectionName} className="mb-8">
                  <h2 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b-2 border-gray-700">{sectionName.toUpperCase()}</h2>
                  <div className="space-y-2 text-sm">
                    {sectionContent.map((line: string, idx: number) => (
                      <p key={idx} className="text-gray-700 leading-relaxed">{line}</p>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Varieties 7-20 - I'll create condensed versions for space
  // Each will have unique layouts

  // 7. Three Column Layout
  if (variety === 7) {
    return (
      <div className="bg-white" style={{ width: '8.5in', minHeight: '11in', margin: '0 auto' }}>
        <div className="p-8">
          <div className="text-center mb-6 pb-4 border-b border-gray-400">
            <h1 className="text-4xl font-bold mb-2">{parsedData.name || 'Your Name'}</h1>
            <div className="text-xs text-gray-600 space-x-3">
              {parsedData.contact.email && <span>{parsedData.contact.email}</span>}
              {parsedData.contact.phone && <span>{parsedData.contact.phone}</span>}
              {parsedData.contact.details && <span>{parsedData.contact.details}</span>}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6">
            {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any], index) => {
              const upper = sectionName.toUpperCase();
              const isExperienceType = upper.includes('EXPERIENCE') || upper.includes('EMPLOYMENT') || upper.includes('PROJECT');
              return (
                <div key={sectionName} className={index === 0 ? 'col-span-3' : 'col-span-1'}>
                  <h2 className="text-sm font-bold mb-2 pb-1 border-b border-gray-600 uppercase">{sectionName}</h2>
                  <div className="space-y-1.5 text-xs">
                    {sectionContent.map((line: string, idx: number) => {
                      const bullet = renderBulletContent(line, isExperienceType);
                      const title = renderJobTitle(line, isExperienceType);
                      if (bullet.isBullet) {
                        return (
                          <div key={idx} className="ml-3 flex items-start gap-1.5">
                            <span className="mt-1">•</span>
                            <span className="flex-1 leading-relaxed">{bullet.content}</span>
                          </div>
                        );
                      }
                      if (title.isTitle) {
                        return (
                          <div key={idx} className="mt-2">
                            <h3 className="font-bold">{title.title}</h3>
                            <p className="text-[10px] text-gray-600">{title.details}</p>
                          </div>
                        );
                      }
                      return <p key={idx} className="leading-relaxed">{line}</p>;
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // For varieties 8-20, I'll provide more condensed implementations
  // 8. Bold Header Underline
  if (variety === 8) {
    return (
      <div className="bg-white p-12" style={{ width: '8.5in', minHeight: '11in', margin: '0 auto' }}>
        <div className="mb-8">
          <h1 className="text-6xl font-black mb-3">{parsedData.name || 'Your Name'}</h1>
          <div className="h-1 w-32 bg-gray-900 mb-4"></div>
          <div className="text-sm text-gray-600 space-x-4">
            {parsedData.contact.email && <span>{parsedData.contact.email}</span>}
            {parsedData.contact.phone && <span>{parsedData.contact.phone}</span>}
            {parsedData.contact.details && <span>{parsedData.contact.details}</span>}
          </div>
        </div>
        {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any]) => (
          <div key={sectionName} className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-xl font-bold uppercase">{sectionName}</h2>
              <div className="flex-1 h-0.5 bg-gray-800"></div>
            </div>
            <div className="space-y-2">
              {sectionContent.map((line: string, idx: number) => (
                <p key={idx} className="text-gray-700 leading-relaxed">{line}</p>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 9-20: Additional varieties with unique layouts
  // I'll implement these with different approaches for variety

  if (variety === 9) {
    return (
      <div className="bg-gray-50 p-12" style={{ width: '8.5in', minHeight: '11in', margin: '0 auto' }}>
        <div className="bg-white p-10 shadow-lg">
          <div className="border-4 border-gray-900 p-6 mb-8">
            <h1 className="text-4xl font-bold text-center mb-2">{parsedData.name || 'Your Name'}</h1>
            <div className="text-center text-sm text-gray-600">
              {parsedData.contact.email} • {parsedData.contact.phone} • {parsedData.contact.details}
            </div>
          </div>
          {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any]) => (
            <div key={sectionName} className="mb-6">
              <h2 className="bg-gray-900 text-white px-4 py-2 font-bold uppercase mb-3">{sectionName}</h2>
              <div className="px-4 space-y-2">
                {sectionContent.map((line: string, idx: number) => (
                  <p key={idx} className="text-gray-700 leading-relaxed">{line}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variety === 10) {
    return (
      <div className="bg-white p-10" style={{ width: '8.5in', minHeight: '11in', margin: '0 auto' }}>
        <div className="border-l-8 border-gray-900 pl-8">
          <h1 className="text-5xl font-bold mb-3">{parsedData.name || 'Your Name'}</h1>
          <div className="text-sm text-gray-600 mb-8">
            {parsedData.contact.email} | {parsedData.contact.phone} | {parsedData.contact.details}
          </div>
          {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any]) => (
            <div key={sectionName} className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-900">{sectionName.toUpperCase()}</h2>
              <div className="space-y-2 pl-4">
                {sectionContent.map((line: string, idx: number) => (
                  <p key={idx} className="text-gray-700 leading-relaxed">{line}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 11. Double Border Header - Professional with double borders
  if (variety === 11) {
    return (
      <div className="bg-white p-12" style={{ width: '8.5in', minHeight: '11in', margin: '0 auto' }}>
        <div className="border-t-4 border-b-4 border-gray-900 py-6 mb-10">
          <h1 className="text-5xl font-bold text-center mb-3">{parsedData.name || 'Your Name'}</h1>
          <div className="text-center text-sm text-gray-600">
            {parsedData.contact.email} • {parsedData.contact.phone} • {parsedData.contact.details}
          </div>
        </div>
        {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any]) => {
          const upper = sectionName.toUpperCase();
          const isExperienceType = upper.includes('EXPERIENCE') || upper.includes('EMPLOYMENT') || upper.includes('PROJECT');
          return (
            <div key={sectionName} className="mb-8">
              <h2 className="text-lg font-bold mb-3 pb-2 border-b-4 border-double border-gray-800 uppercase">{sectionName}</h2>
              <div className="space-y-2">
                {sectionContent.map((line: string, idx: number) => {
                  const bullet = renderBulletContent(line, isExperienceType);
                  const title = renderJobTitle(line, isExperienceType);
                  if (bullet.isBullet) return <div key={idx} className="ml-6 flex items-start gap-3"><span className="mt-1.5">▫</span><span className="flex-1">{bullet.content}</span></div>;
                  if (title.isTitle) return <div key={idx} className="mt-4"><h3 className="font-bold text-gray-900">{title.title}</h3><p className="text-sm text-gray-600">{title.details}</p></div>;
                  return <p key={idx}>{line}</p>;
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // 12. Indented Right Margin - Content pushed to left
  if (variety === 12) {
    return (
      <div className="bg-white p-12 pr-32" style={{ width: '8.5in', minHeight: '11in', margin: '0 auto' }}>
        <div className="mb-8 pb-4 border-b-2 border-gray-800">
          <h1 className="text-4xl font-bold mb-2">{parsedData.name || 'Your Name'}</h1>
          <div className="text-sm text-gray-600">{parsedData.contact.email} | {parsedData.contact.phone}</div>
        </div>
        {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any]) => {
          const upper = sectionName.toUpperCase();
          const isExperienceType = upper.includes('EXPERIENCE') || upper.includes('EMPLOYMENT') || upper.includes('PROJECT');
          return (
            <div key={sectionName} className="mb-7">
              <h2 className="text-base font-bold mb-3 uppercase tracking-wide">{sectionName}</h2>
              <div className="space-y-2 text-sm">
                {sectionContent.map((line: string, idx: number) => {
                  const bullet = renderBulletContent(line, isExperienceType);
                  const title = renderJobTitle(line, isExperienceType);
                  if (bullet.isBullet) return <div key={idx} className="ml-4 flex items-start gap-2"><span className="mt-1">•</span><span className="flex-1">{bullet.content}</span></div>;
                  if (title.isTitle) return <div key={idx} className="mt-3"><h3 className="font-bold">{title.title}</h3><p className="text-xs text-gray-600">{title.details}</p></div>;
                  return <p key={idx}>{line}</p>;
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // 13. Narrow Left Column - Dense sidebar layout
  if (variety === 13) {
    return (
      <div className="bg-white" style={{ width: '8.5in', minHeight: '11in', margin: '0 auto' }}>
        <div className="grid" style={{ gridTemplateColumns: '200px 1fr' }}>
          <div className="bg-gray-900 text-white p-6">
            <h1 className="text-xl font-bold mb-4 break-words">{parsedData.name || 'Your Name'}</h1>
            <div className="space-y-2 text-xs mb-6">
              {parsedData.contact.email && <p className="break-all">{parsedData.contact.email}</p>}
              {parsedData.contact.phone && <p>{parsedData.contact.phone}</p>}
            </div>
            {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any]) => {
              const upper = sectionName.toUpperCase();
              if (!(upper.includes('SKILL') || upper.includes('EDUCATION') || upper.includes('CERTIFICATION'))) return null;
              return (
                <div key={sectionName} className="mb-6">
                  <h2 className="text-xs font-bold mb-2 border-b border-white pb-1 uppercase">{sectionName}</h2>
                  <div className="space-y-1 text-xs">{sectionContent.map((line: string, idx: number) => <p key={idx} className="leading-tight">{line}</p>)}</div>
                </div>
              );
            })}
          </div>
          <div className="p-10">
            {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any]) => {
              const upper = sectionName.toUpperCase();
              if (!(upper.includes('SUMMARY') || upper.includes('EXPERIENCE') || upper.includes('PROJECT'))) return null;
              const isExperienceType = upper.includes('EXPERIENCE') || upper.includes('PROJECT');
              return (
                <div key={sectionName} className="mb-8">
                  <h2 className="text-xl font-bold mb-4 uppercase">{sectionName}</h2>
                  <div className="space-y-3">
                    {sectionContent.map((line: string, idx: number) => {
                      const bullet = renderBulletContent(line, isExperienceType);
                      const title = renderJobTitle(line, isExperienceType);
                      if (bullet.isBullet) return <div key={idx} className="ml-4 flex items-start gap-2"><span className="mt-1.5">•</span><span className="flex-1">{bullet.content}</span></div>;
                      if (title.isTitle) return <div key={idx} className="mt-4"><h3 className="text-lg font-bold">{title.title}</h3><p className="text-sm text-gray-600">{title.details}</p></div>;
                      return <p key={idx}>{line}</p>;
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // 14. Stacked Boxes - Each section in its own box
  if (variety === 14) {
    return (
      <div className="bg-gray-100 p-10" style={{ width: '8.5in', minHeight: '11in', margin: '0 auto' }}>
        <div className="bg-white p-8 mb-6 shadow">
          <h1 className="text-5xl font-bold mb-3">{parsedData.name || 'Your Name'}</h1>
          <div className="text-sm text-gray-600">{parsedData.contact.email} • {parsedData.contact.phone}</div>
        </div>
        {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any]) => {
          const upper = sectionName.toUpperCase();
          const isExperienceType = upper.includes('EXPERIENCE') || upper.includes('EMPLOYMENT') || upper.includes('PROJECT');
          return (
            <div key={sectionName} className="bg-white p-8 mb-4 shadow">
              <h2 className="text-xl font-bold mb-4 uppercase border-b-2 border-gray-800 pb-2">{sectionName}</h2>
              <div className="space-y-2">
                {sectionContent.map((line: string, idx: number) => {
                  const bullet = renderBulletContent(line, isExperienceType);
                  const title = renderJobTitle(line, isExperienceType);
                  if (bullet.isBullet) return <div key={idx} className="ml-4 flex items-start gap-3"><span className="mt-1.5">▪</span><span className="flex-1">{bullet.content}</span></div>;
                  if (title.isTitle) return <div key={idx} className="mt-3"><h3 className="font-bold">{title.title}</h3><p className="text-sm text-gray-600">{title.details}</p></div>;
                  return <p key={idx}>{line}</p>;
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // 15. Alternating Indent - Sections alternate indentation
  if (variety === 15) {
    return (
      <div className="bg-white p-12" style={{ width: '8.5in', minHeight: '11in', margin: '0 auto' }}>
        <div className="mb-10 text-center pb-6 border-b border-gray-400">
          <h1 className="text-5xl font-bold mb-3">{parsedData.name || 'Your Name'}</h1>
          <div className="text-sm text-gray-600">{parsedData.contact.email} | {parsedData.contact.phone}</div>
        </div>
        {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any], sectionIdx) => {
          const upper = sectionName.toUpperCase();
          const isExperienceType = upper.includes('EXPERIENCE') || upper.includes('EMPLOYMENT') || upper.includes('PROJECT');
          const isEven = sectionIdx % 2 === 0;
          return (
            <div key={sectionName} className={`mb-8 ${isEven ? 'pr-12' : 'pl-12'}`}>
              <h2 className={`text-lg font-bold mb-3 pb-2 border-b-2 border-gray-700 uppercase ${isEven ? 'text-left' : 'text-right'}`}>{sectionName}</h2>
              <div className="space-y-2">
                {sectionContent.map((line: string, idx: number) => {
                  const bullet = renderBulletContent(line, isExperienceType);
                  const title = renderJobTitle(line, isExperienceType);
                  if (bullet.isBullet) return <div key={idx} className="ml-4 flex items-start gap-3"><span className="mt-1.5">→</span><span className="flex-1">{bullet.content}</span></div>;
                  if (title.isTitle) return <div key={idx} className="mt-3"><h3 className="font-bold">{title.title}</h3><p className="text-sm text-gray-600">{title.details}</p></div>;
                  return <p key={idx}>{line}</p>;
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // 16. Wide Header Banner - Full-width gray banner
  if (variety === 16) {
    return (
      <div className="bg-white" style={{ width: '8.5in', minHeight: '11in', margin: '0 auto' }}>
        <div className="bg-gray-800 text-white p-10 mb-8">
          <h1 className="text-6xl font-bold mb-3">{parsedData.name || 'Your Name'}</h1>
          <div className="text-sm">{parsedData.contact.email} • {parsedData.contact.phone} • {parsedData.contact.details}</div>
        </div>
        <div className="px-12 pb-12">
          {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any]) => {
            const upper = sectionName.toUpperCase();
            const isExperienceType = upper.includes('EXPERIENCE') || upper.includes('EMPLOYMENT') || upper.includes('PROJECT');
            return (
              <div key={sectionName} className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-16 h-1 bg-gray-800"></div>
                  <h2 className="text-xl font-bold uppercase">{sectionName}</h2>
                </div>
                <div className="space-y-2 pl-20">
                  {sectionContent.map((line: string, idx: number) => {
                    const bullet = renderBulletContent(line, isExperienceType);
                    const title = renderJobTitle(line, isExperienceType);
                    if (bullet.isBullet) return <div key={idx} className="ml-4 flex items-start gap-3"><span className="mt-1.5">•</span><span className="flex-1">{bullet.content}</span></div>;
                    if (title.isTitle) return <div key={idx} className="mt-3"><h3 className="font-bold">{title.title}</h3><p className="text-sm text-gray-600">{title.details}</p></div>;
                    return <p key={idx}>{line}</p>;
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 17. Minimal Dots - Section markers with dots
  if (variety === 17) {
    return (
      <div className="bg-white p-14" style={{ width: '8.5in', minHeight: '11in', margin: '0 auto' }}>
        <div className="mb-10 pb-4">
          <h1 className="text-6xl font-bold mb-2">{parsedData.name || 'Your Name'}</h1>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>{parsedData.contact.email}</span>
            <span className="w-1.5 h-1.5 bg-gray-600 rounded-full"></span>
            <span>{parsedData.contact.phone}</span>
            <span className="w-1.5 h-1.5 bg-gray-600 rounded-full"></span>
            <span>{parsedData.contact.details}</span>
          </div>
        </div>
        {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any]) => {
          const upper = sectionName.toUpperCase();
          const isExperienceType = upper.includes('EXPERIENCE') || upper.includes('EMPLOYMENT') || upper.includes('PROJECT');
          return (
            <div key={sectionName} className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 bg-gray-800 rounded-full"></div>
                <h2 className="text-2xl font-bold uppercase">{sectionName}</h2>
              </div>
              <div className="space-y-3 ml-6">
                {sectionContent.map((line: string, idx: number) => {
                  const bullet = renderBulletContent(line, isExperienceType);
                  const title = renderJobTitle(line, isExperienceType);
                  if (bullet.isBullet) return <div key={idx} className="ml-4 flex items-start gap-3"><span className="mt-1.5">•</span><span className="flex-1">{bullet.content}</span></div>;
                  if (title.isTitle) return <div key={idx} className="mt-4"><h3 className="text-lg font-bold">{title.title}</h3><p className="text-sm text-gray-600">{title.details}</p></div>;
                  return <p key={idx}>{line}</p>;
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // 18. Top and Bottom Borders - Framed content
  if (variety === 18) {
    return (
      <div className="bg-white p-10" style={{ width: '8.5in', minHeight: '11in', margin: '0 auto' }}>
        <div className="border-t-8 border-b-8 border-gray-900 py-8 px-6 mb-10">
          <h1 className="text-5xl font-bold text-center mb-3">{parsedData.name || 'Your Name'}</h1>
          <div className="text-center text-sm text-gray-600">{parsedData.contact.email} | {parsedData.contact.phone} | {parsedData.contact.details}</div>
        </div>
        <div className="px-6">
          {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any]) => {
            const upper = sectionName.toUpperCase();
            const isExperienceType = upper.includes('EXPERIENCE') || upper.includes('EMPLOYMENT') || upper.includes('PROJECT');
            return (
              <div key={sectionName} className="mb-8 pb-6 border-b border-gray-300 last:border-0">
                <h2 className="text-xl font-bold mb-4 uppercase">{sectionName}</h2>
                <div className="space-y-2">
                  {sectionContent.map((line: string, idx: number) => {
                    const bullet = renderBulletContent(line, isExperienceType);
                    const title = renderJobTitle(line, isExperienceType);
                    if (bullet.isBullet) return <div key={idx} className="ml-4 flex items-start gap-3"><span className="mt-1.5">▸</span><span className="flex-1">{bullet.content}</span></div>;
                    if (title.isTitle) return <div key={idx} className="mt-3"><h3 className="font-bold">{title.title}</h3><p className="text-sm text-gray-600">{title.details}</p></div>;
                    return <p key={idx}>{line}</p>;
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 19. Condensed Professional - Tight spacing
  if (variety === 19) {
    return (
      <div className="bg-white p-10" style={{ width: '8.5in', minHeight: '11in', margin: '0 auto' }}>
        <div className="mb-6 pb-3 border-b-3 border-gray-900">
          <h1 className="text-4xl font-bold mb-2">{parsedData.name || 'Your Name'}</h1>
          <div className="text-xs text-gray-600">{parsedData.contact.email} • {parsedData.contact.phone}</div>
        </div>
        {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any]) => {
          const upper = sectionName.toUpperCase();
          const isExperienceType = upper.includes('EXPERIENCE') || upper.includes('EMPLOYMENT') || upper.includes('PROJECT');
          return (
            <div key={sectionName} className="mb-5">
              <h2 className="text-sm font-bold mb-2 pb-1 border-b border-gray-600 uppercase">{sectionName}</h2>
              <div className="space-y-1 text-sm">
                {sectionContent.map((line: string, idx: number) => {
                  const bullet = renderBulletContent(line, isExperienceType);
                  const title = renderJobTitle(line, isExperienceType);
                  if (bullet.isBullet) return <div key={idx} className="ml-3 flex items-start gap-2"><span className="mt-1">•</span><span className="flex-1 text-xs">{bullet.content}</span></div>;
                  if (title.isTitle) return <div key={idx} className="mt-2"><h3 className="text-sm font-bold">{title.title}</h3><p className="text-xs text-gray-600">{title.details}</p></div>;
                  return <p key={idx} className="text-xs">{line}</p>;
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // 20. Corner Name - Name in top right corner
  if (variety === 20) {
    return (
      <div className="bg-white p-12" style={{ width: '8.5in', minHeight: '11in', margin: '0 auto' }}>
        <div className="flex justify-between items-start mb-10 pb-6 border-b-2 border-gray-800">
          <div>
            <div className="text-sm text-gray-600 mb-2">Contact Information</div>
            <div className="space-y-1 text-sm">
              <p>{parsedData.contact.email}</p>
              <p>{parsedData.contact.phone}</p>
              <p>{parsedData.contact.details}</p>
            </div>
          </div>
          <div className="text-right">
            <h1 className="text-5xl font-bold">{parsedData.name || 'Your Name'}</h1>
          </div>
        </div>
        {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any]) => {
          const upper = sectionName.toUpperCase();
          const isExperienceType = upper.includes('EXPERIENCE') || upper.includes('EMPLOYMENT') || upper.includes('PROJECT');
          return (
            <div key={sectionName} className="mb-8">
              <h2 className="text-xl font-bold mb-3 pb-2 border-b border-gray-600 uppercase">{sectionName}</h2>
              <div className="space-y-2">
                {sectionContent.map((line: string, idx: number) => {
                  const bullet = renderBulletContent(line, isExperienceType);
                  const title = renderJobTitle(line, isExperienceType);
                  if (bullet.isBullet) return <div key={idx} className="ml-6 flex items-start gap-3"><span className="mt-1.5">•</span><span className="flex-1">{bullet.content}</span></div>;
                  if (title.isTitle) return <div key={idx} className="mt-4"><h3 className="font-bold">{title.title}</h3><p className="text-sm text-gray-600">{title.details}</p></div>;
                  return <p key={idx}>{line}</p>;
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return <div className="p-8">Template format {variety} not configured</div>;
}