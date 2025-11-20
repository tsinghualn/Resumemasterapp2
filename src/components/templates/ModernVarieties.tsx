import { Mail, Phone, Linkedin } from 'lucide-react';

interface ModernVarietyProps {
  content: string;
  variety: number;
}

export function ModernVariety({ content, variety }: ModernVarietyProps) {
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

  const renderContent = (sectionContent: any[], isExperienceType: boolean) => {
    return sectionContent.map((line: string, idx: number) => {
      if (isExperienceType && (line.startsWith('•') || line.startsWith('-') || line.startsWith('→'))) {
        return { type: 'bullet', content: line.substring(1).trim(), idx };
      }
      if (isExperienceType && line.includes('|')) {
        const [title, rest] = line.split('|');
        return { type: 'title', title: title.trim(), details: rest.trim(), idx };
      }
      return { type: 'text', content: line, idx };
    });
  };

  // Each variety now has its own unique layout
  const varietyConfigs = [
    { color: 'blue', gradient: 'from-blue-600 to-blue-800' },
    { color: 'teal', gradient: 'from-teal-600 to-teal-800' },
    { color: 'purple', gradient: 'from-purple-600 to-purple-800' },
    { color: 'orange', gradient: 'from-orange-500 to-orange-700' },
    { color: 'green', gradient: 'from-green-600 to-green-800' },
    { color: 'indigo', gradient: 'from-indigo-600 to-indigo-800' },
    { color: 'pink', gradient: 'from-pink-600 to-pink-800' },
    { color: 'cyan', gradient: 'from-cyan-600 to-cyan-800' },
    { color: 'red', gradient: 'from-red-600 to-red-800' },
    { color: 'emerald', gradient: 'from-emerald-600 to-emerald-800' },
    { color: 'violet', gradient: 'from-violet-600 to-violet-800' },
    { color: 'rose', gradient: 'from-rose-600 to-rose-800' },
    { color: 'sky', gradient: 'from-sky-600 to-sky-800' },
    { color: 'amber', gradient: 'from-amber-500 to-amber-700' },
    { color: 'lime', gradient: 'from-lime-600 to-lime-800' },
    { color: 'fuchsia', gradient: 'from-fuchsia-600 to-fuchsia-800' },
    { color: 'yellow', gradient: 'from-yellow-500 to-yellow-700' },
    { color: 'slate', gradient: 'from-slate-600 to-slate-800' },
    { color: 'gray', gradient: 'from-gray-600 to-gray-800' },
    { color: 'zinc', gradient: 'from-zinc-600 to-zinc-800' }
  ];

  const config = varietyConfigs[variety - 1];

  // 1. Blue Left Sidebar
  if (variety === 1) {
    return (
      <div className="bg-white shadow-lg" style={{ width: '8.5in', minHeight: '11in', margin: '0 auto' }}>
        <div className="grid grid-cols-4">
          <div className={`bg-gradient-to-b ${config.gradient} text-white p-8`}>
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">CONTACT</h2>
              <div className="space-y-3 text-sm">
                {parsedData.contact.email && <p className="break-all">{parsedData.contact.email}</p>}
                {parsedData.contact.phone && <p>{parsedData.contact.phone}</p>}
              </div>
            </div>
            {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any]) => {
              const upper = sectionName.toUpperCase();
              if (!(upper.includes('SKILL') || upper.includes('EDUCATION'))) return null;
              return (
                <div key={sectionName} className="mb-8">
                  <h2 className="text-lg font-bold mb-3">{sectionName.toUpperCase()}</h2>
                  <div className="space-y-2 text-sm">{sectionContent.map((line: string, idx: number) => <p key={idx}>{line}</p>)}</div>
                </div>
              );
            })}
          </div>
          <div className="col-span-3 p-10">
            <h1 className="text-5xl font-bold mb-10">{parsedData.name || 'Your Name'}</h1>
            {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any]) => {
              const upper = sectionName.toUpperCase();
              if (!(upper.includes('SUMMARY') || upper.includes('EXPERIENCE'))) return null;
              return (
                <div key={sectionName} className="mb-8">
                  <h2 className="text-2xl font-bold mb-4">{sectionName.toUpperCase()}</h2>
                  <div className="space-y-2">{sectionContent.map((line: string, idx: number) => <p key={idx}>{line}</p>)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // 2. Teal Right Sidebar with Cards
  if (variety === 2) {
    return (
      <div className="bg-gray-50" style={{ width: '8.5in', minHeight: '11in', margin: '0 auto' }}>
        <div className="grid grid-cols-4 min-h-screen">
          <div className="col-span-3 p-10">
            <h1 className="text-6xl font-bold mb-4">{parsedData.name || 'Your Name'}</h1>
            <div className="text-sm text-gray-600 mb-10">{parsedData.contact.email} • {parsedData.contact.phone}</div>
            {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any]) => {
              const upper = sectionName.toUpperCase();
              if (!(upper.includes('SUMMARY') || upper.includes('EXPERIENCE'))) return null;
              return (
                <div key={sectionName} className="mb-8 bg-white p-6 rounded-lg shadow">
                  <h2 className={`text-2xl font-bold mb-4 text-${config.color}-700`}>{sectionName.toUpperCase()}</h2>
                  <div className="space-y-2">{sectionContent.map((line: string, idx: number) => <p key={idx}>{line}</p>)}</div>
                </div>
              );
            })}
          </div>
          <div className={`bg-gradient-to-b ${config.gradient} text-white p-8`}>
            {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any]) => {
              const upper = sectionName.toUpperCase();
              if (!(upper.includes('SKILL') || upper.includes('EDUCATION'))) return null;
              return (
                <div key={sectionName} className="mb-8">
                  <h2 className="text-lg font-bold mb-3">{sectionName.toUpperCase()}</h2>
                  <div className="space-y-2 text-sm">{sectionContent.map((line: string, idx: number) => <p key={idx}>{line}</p>)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // 3-20: Create unique layouts for each
  if (variety === 3) {
    return (
      <div className="bg-white" style={{ width: '8.5in', minHeight: '11in', margin: '0 auto' }}>
        <div className={`bg-gradient-to-r ${config.gradient} text-white p-10 text-center`}>
          <h1 className="text-6xl font-bold mb-3">{parsedData.name || 'Your Name'}</h1>
          <p className="text-sm">{parsedData.contact.email} | {parsedData.contact.phone}</p>
        </div>
        <div className="grid grid-cols-2 gap-8 p-10">
          {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any]) => (
            <div key={sectionName} className={`${sectionName.toUpperCase().includes('SUMMARY') ? 'col-span-2' : ''}`}>
              <h2 className={`text-xl font-bold mb-3 pb-2 border-b-2 border-${config.color}-500`}>{sectionName.toUpperCase()}</h2>
              <div className="space-y-2 text-sm">{sectionContent.map((line: string, idx: number) => <p key={idx}>{line}</p>)}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variety === 4) {
    return (
      <div className="bg-white" style={{ width: '8.5in', minHeight: '11in', margin: '0 auto' }}>
        <div className="p-12">
          <div className={`bg-gradient-to-r ${config.gradient} text-white px-8 py-6 rounded-xl mb-8`}>
            <h1 className="text-5xl font-bold mb-2">{parsedData.name || 'Your Name'}</h1>
            <p className="text-sm">{parsedData.contact.email} • {parsedData.contact.phone}</p>
          </div>
          {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any]) => (
            <div key={sectionName} className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-3 h-8 bg-gradient-to-b ${config.gradient} rounded-full`}></div>
                <h2 className="text-2xl font-bold">{sectionName.toUpperCase()}</h2>
              </div>
              <div className="pl-6 space-y-2">{sectionContent.map((line: string, idx: number) => <p key={idx}>{line}</p>)}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variety === 5) {
    return (
      <div className="bg-gray-50" style={{ width: '8.5in', minHeight: '11in', margin: '0 auto' }}>
        <div className="p-10">
          <div className="bg-white p-8 rounded-lg shadow-lg mb-8">
            <h1 className={`text-6xl font-bold text-${config.color}-700 mb-3`}>{parsedData.name || 'Your Name'}</h1>
            <div className="text-sm text-gray-600">{parsedData.contact.email} • {parsedData.contact.phone}</div>
          </div>
          <div className="grid grid-cols-3 gap-6">
            {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any], index) => (
              <div key={sectionName} className={`bg-white p-6 rounded-lg shadow ${index === 0 ? 'col-span-3' : ''}`}>
                <h2 className={`text-lg font-bold mb-3 text-${config.color}-700`}>{sectionName.toUpperCase()}</h2>
                <div className="space-y-2 text-sm">{sectionContent.map((line: string, idx: number) => <p key={idx}>{line}</p>)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Varieties 6-20 with more unique layouts
  if (variety >= 6 && variety <= 20) {
    const layouts = [
      'header-bar', 'split-modern', 'floating', 'minimal-sidebar', 'accent-top',
      'boxed-sections', 'timeline', 'grid-cards', 'wide-header', 'asymmetric',
      'compact-dense', 'large-name', 'center-focus', 'diagonal', 'layered'
    ];
    const layout = layouts[variety - 6];

    // Header Bar Style (6-8)
    if (variety >= 6 && variety <= 8) {
      return (
        <div className="bg-white" style={{ width: '8.5in', minHeight: '11in', margin: '0 auto' }}>
          <div className={`bg-gradient-to-r ${config.gradient} text-white p-12`}>
            <h1 className="text-7xl font-bold mb-3">{parsedData.name || 'Your Name'}</h1>
            <p className="text-sm">{parsedData.contact.email} • {parsedData.contact.phone}</p>
          </div>
          <div className="p-12">
            {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any]) => (
              <div key={sectionName} className="mb-8">
                <h2 className={`text-2xl font-bold mb-4 text-${config.color}-700`}>{sectionName.toUpperCase()}</h2>
                <div className="space-y-2">{sectionContent.map((line: string, idx: number) => <p key={idx}>{line}</p>)}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Split Modern (9-11)
    if (variety >= 9 && variety <= 11) {
      return (
        <div className="bg-white" style={{ width: '8.5in', minHeight: '11in', margin: '0 auto' }}>
          <div className="p-10">
            <div className={`mb-8 pb-6 border-b-4 border-${config.color}-600`}>
              <h1 className={`text-5xl font-bold text-${config.color}-900 mb-3`}>{parsedData.name || 'Your Name'}</h1>
              <p className="text-sm text-gray-600">{parsedData.contact.email} • {parsedData.contact.phone}</p>
            </div>
            <div className="grid grid-cols-2 gap-10">
              {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any], index) => (
                <div key={sectionName} className={index === 0 ? 'col-span-2' : ''}>
                  <div className={`bg-${config.color}-600 text-white px-4 py-2 mb-3`}>
                    <h2 className="text-lg font-bold">{sectionName.toUpperCase()}</h2>
                  </div>
                  <div className="space-y-2 text-sm">{sectionContent.map((line: string, idx: number) => <p key={idx}>{line}</p>)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // Grid Cards (12-14)
    if (variety >= 12 && variety <= 14) {
      return (
        <div className="bg-gray-100 p-10" style={{ width: '8.5in', minHeight: '11in', margin: '0 auto' }}>
          <div className="bg-white p-8 rounded-lg shadow-lg mb-6">
            <h1 className={`text-6xl font-bold text-${config.color}-700 mb-3`}>{parsedData.name || 'Your Name'}</h1>
            <p className="text-sm text-gray-600">{parsedData.contact.email} • {parsedData.contact.phone}</p>
          </div>
          <div className="grid grid-cols-2 gap-6">
            {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any], index) => (
              <div key={sectionName} className={`bg-white p-6 rounded-lg shadow ${index === 0 ? 'col-span-2' : ''}`}>
                <h2 className={`text-xl font-bold mb-3 text-${config.color}-700 border-b-2 border-${config.color}-400 pb-2`}>{sectionName.toUpperCase()}</h2>
                <div className="space-y-2 text-sm">{sectionContent.map((line: string, idx: number) => <p key={idx}>{line}</p>)}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Timeline/Layered (15-17)
    if (variety >= 15 && variety <= 17) {
      return (
        <div className="bg-white p-12" style={{ width: '8.5in', minHeight: '11in', margin: '0 auto' }}>
          <div className="mb-10 pb-6 border-b-4 border-gray-800">
            <h1 className="text-6xl font-bold mb-3">{parsedData.name || 'Your Name'}</h1>
            <p className="text-sm text-gray-600">{parsedData.contact.email} • {parsedData.contact.phone}</p>
          </div>
          {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any]) => (
            <div key={sectionName} className="mb-8 relative pl-8 border-l-4 border-gray-300">
              <div className={`absolute -left-3 top-2 w-5 h-5 bg-${config.color}-600 rounded-full`}></div>
              <h2 className="text-2xl font-bold mb-4">{sectionName.toUpperCase()}</h2>
              <div className="space-y-2">{sectionContent.map((line: string, idx: number) => <p key={idx}>{line}</p>)}</div>
            </div>
          ))}
        </div>
      );
    }

    // Asymmetric/Modern (18-20)
    return (
      <div className="bg-white" style={{ width: '8.5in', minHeight: '11in', margin: '0 auto' }}>
        <div className="grid" style={{ gridTemplateColumns: '2fr 3fr' }}>
          <div className={`bg-gradient-to-b ${config.gradient} text-white p-10`}>
            <h1 className="text-3xl font-bold mb-8">{parsedData.name || 'Your Name'}</h1>
            <div className="space-y-6 text-sm">
              <div>
                <h3 className="font-bold mb-2">CONTACT</h3>
                <p>{parsedData.contact.email}</p>
                <p>{parsedData.contact.phone}</p>
              </div>
              {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any]) => {
                const upper = sectionName.toUpperCase();
                if (!(upper.includes('SKILL') || upper.includes('EDUCATION'))) return null;
                return (
                  <div key={sectionName}>
                    <h3 className="font-bold mb-2">{sectionName.toUpperCase()}</h3>
                    <div className="space-y-1 text-xs">{sectionContent.map((line: string, idx: number) => <p key={idx}>{line}</p>)}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="p-10">
            {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any]) => {
              const upper = sectionName.toUpperCase();
              if (!(upper.includes('SUMMARY') || upper.includes('EXPERIENCE'))) return null;
              return (
                <div key={sectionName} className="mb-8">
                  <h2 className="text-2xl font-bold mb-4">{sectionName.toUpperCase()}</h2>
                  <div className="space-y-2">{sectionContent.map((line: string, idx: number) => <p key={idx}>{line}</p>)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return <div className="p-8">Template format {variety} not configured</div>;
}
