interface MinimalistVarietyProps {
  content: string;
  variety: number;
}

export function MinimalistVariety({ content, variety }: MinimalistVarietyProps) {
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

  // Varieties 1-4: Ultra Clean Single Column (different font weights and spacing)
  if (variety >= 1 && variety <= 4) {
    const configs = [
      { nameSize: 'text-6xl', nameWeight: 'font-light', padding: 'p-16', margin: 'mb-12', spacing: 'space-y-4', headerSize: 'text-xs', borderStyle: 'border-b border-gray-300' },
      { nameSize: 'text-7xl', nameWeight: 'font-extralight', padding: 'p-20', margin: 'mb-16', spacing: 'space-y-6', headerSize: 'text-2xl', borderStyle: 'border-b border-gray-200' },
      { nameSize: 'text-5xl', nameWeight: 'font-normal', padding: 'p-12', margin: 'mb-10', spacing: 'space-y-3', headerSize: 'text-sm', borderStyle: 'border-b-2 border-gray-400' },
      { nameSize: 'text-8xl', nameWeight: 'font-thin', padding: 'p-24', margin: 'mb-20', spacing: 'space-y-8', headerSize: 'text-lg', borderStyle: 'border-b border-gray-300' }
    ];
    const config = configs[variety - 1];
    
    return (
      <div className="bg-white" style={{ width: '8.5in', minHeight: '11in', margin: '0 auto' }}>
        <div className={config.padding}>
          <div className={`${config.margin} pb-6 ${config.borderStyle}`}>
            <h1 className={`${config.nameSize} ${config.nameWeight} text-gray-900 mb-4 tracking-tight`}>{parsedData.name || 'Your Name'}</h1>
            <div className="flex gap-5 text-sm text-gray-600 font-light">
              {parsedData.contact.email && <span>{parsedData.contact.email}</span>}
              {parsedData.contact.phone && <span>{parsedData.contact.phone}</span>}
              {parsedData.contact.details && <span>{parsedData.contact.details}</span>}
            </div>
          </div>
          {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any]) => {
            const upper = sectionName.toUpperCase();
            const isExperienceType = upper.includes('EXPERIENCE') || upper.includes('PROJECT');
            const items = renderContent(sectionContent, isExperienceType);
            return (
              <div key={sectionName} className={config.margin}>
                <h2 className={`${config.headerSize} font-semibold tracking-widest text-gray-500 mb-6 pb-2 ${config.borderStyle} uppercase`}>{sectionName}</h2>
                <div className={config.spacing}>
                  {items.map((item: any) => {
                    if (item.type === 'bullet') return <div key={item.idx} className="ml-8 flex items-start gap-4"><span className="text-gray-400 mt-2 text-xs">–</span><span className="flex-1 text-gray-700 leading-relaxed font-light">{item.content}</span></div>;
                    if (item.type === 'title') return <div key={item.idx} className="mt-6 first:mt-0"><h3 className="text-base font-medium text-gray-900">{item.title}</h3><p className="text-sm text-gray-500 font-light mt-1">{item.details}</p></div>;
                    return <p key={item.idx} className="text-gray-700 leading-relaxed font-light">{item.content}</p>;
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Varieties 5-8: Two Equal Columns Layout
  if (variety >= 5 && variety <= 8) {
    const configs = [
      { nameSize: 'text-5xl', nameWeight: 'font-light', borderStyle: 'border-b border-gray-400', headerSize: 'text-xs' },
      { nameSize: 'text-4xl', nameWeight: 'font-normal', borderStyle: 'border-b-2 border-gray-500', headerSize: 'text-sm' },
      { nameSize: 'text-6xl', nameWeight: 'font-extralight', borderStyle: 'border-b border-gray-300', headerSize: 'text-xs' },
      { nameSize: 'text-5xl', nameWeight: 'font-medium', borderStyle: 'border-b-2 border-gray-600', headerSize: 'text-base' }
    ];
    const config = configs[variety - 5];
    
    return (
      <div className="bg-white" style={{ width: '8.5in', minHeight: '11in', margin: '0 auto' }}>
        <div className="p-12">
          <div className={`mb-10 pb-6 ${config.borderStyle}`}>
            <h1 className={`${config.nameSize} ${config.nameWeight} text-gray-900 mb-3`}>{parsedData.name || 'Your Name'}</h1>
            <div className="flex gap-4 text-xs text-gray-600">
              {parsedData.contact.email && <span>{parsedData.contact.email}</span>}
              {parsedData.contact.phone && <span>• {parsedData.contact.phone}</span>}
              {parsedData.contact.details && <span>• {parsedData.contact.details}</span>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-12">
            <div>
              {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any]) => {
                const upper = sectionName.toUpperCase();
                if (!(upper.includes('SKILL') || upper.includes('EDUCATION') || upper.includes('CERTIFICATION') || upper.includes('LANGUAGE'))) return null;
                return (
                  <div key={sectionName} className="mb-10">
                    <h2 className={`${config.headerSize} font-semibold tracking-widest text-gray-500 uppercase mb-4 pb-2 ${config.borderStyle}`}>{sectionName}</h2>
                    <div className="space-y-3 text-sm font-light">{sectionContent.map((line: string, idx: number) => <p key={idx} className="text-gray-600 leading-relaxed">{line}</p>)}</div>
                  </div>
                );
              })}
            </div>
            <div>
              {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any]) => {
                const upper = sectionName.toUpperCase();
                if (!(upper.includes('SUMMARY') || upper.includes('EXPERIENCE') || upper.includes('PROJECT'))) return null;
                const isExperienceType = upper.includes('EXPERIENCE') || upper.includes('PROJECT');
                const items = renderContent(sectionContent, isExperienceType);
                return (
                  <div key={sectionName} className="mb-10">
                    <h2 className={`${config.headerSize} font-semibold tracking-widest text-gray-500 uppercase mb-4 pb-2 ${config.borderStyle}`}>{sectionName}</h2>
                    <div className="space-y-4 text-sm font-light">
                      {items.map((item: any) => {
                        if (item.type === 'bullet') return <div key={item.idx} className="ml-6 flex items-start gap-4"><span className="text-gray-400 mt-2 text-xs">–</span><span className="flex-1 text-gray-600 leading-relaxed">{item.content}</span></div>;
                        if (item.type === 'title') return <div key={item.idx} className="mt-5 first:mt-0"><h3 className="text-base font-medium text-gray-900">{item.title}</h3><p className="text-xs text-gray-500 mt-1">{item.details}</p></div>;
                        return <p key={item.idx} className="text-gray-600 leading-relaxed">{item.content}</p>;
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

  // Varieties 9-12: Left Accent Bar
  if (variety >= 9 && variety <= 12) {
    const configs = [
      { barWidth: 'w-2', barColor: 'from-gray-800 to-gray-600', nameSize: 'text-6xl', nameWeight: 'font-bold', borderWidth: 'border-b-2', borderColor: 'border-gray-800' },
      { barWidth: 'w-1', barColor: 'from-slate-700 to-slate-500', nameSize: 'text-5xl', nameWeight: 'font-semibold', borderWidth: 'border-b', borderColor: 'border-slate-700' },
      { barWidth: 'w-3', barColor: 'from-gray-900 to-gray-700', nameSize: 'text-7xl', nameWeight: 'font-extrabold', borderWidth: 'border-b-4', borderColor: 'border-gray-900' },
      { barWidth: 'w-1', barColor: 'from-zinc-800 to-zinc-600', nameSize: 'text-5xl', nameWeight: 'font-medium', borderWidth: 'border-b-2', borderColor: 'border-zinc-800' }
    ];
    const config = configs[variety - 9];
    
    return (
      <div className="bg-white relative" style={{ width: '8.5in', minHeight: '11in', margin: '0 auto' }}>
        <div className={`absolute left-0 top-0 bottom-0 ${config.barWidth} bg-gradient-to-b ${config.barColor}`}></div>
        <div className="pl-16 pr-12 py-12">
          <div className={`mb-10 pb-4 ${config.borderWidth} ${config.borderColor}`}>
            <h1 className={`${config.nameSize} ${config.nameWeight} text-gray-900 mb-3`}>{parsedData.name || 'Your Name'}</h1>
            <div className="flex gap-4 text-sm text-gray-600">
              {parsedData.contact.email && <span>{parsedData.contact.email}</span>}
              {parsedData.contact.phone && <span>| {parsedData.contact.phone}</span>}
              {parsedData.contact.details && <span>| {parsedData.contact.details}</span>}
            </div>
          </div>
          {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any]) => {
            const upper = sectionName.toUpperCase();
            const isExperienceType = upper.includes('EXPERIENCE') || upper.includes('PROJECT');
            const items = renderContent(sectionContent, isExperienceType);
            return (
              <div key={sectionName} className="mb-10">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-0.5 bg-gradient-to-r ${config.barColor}`}></div>
                  <h2 className="text-sm font-bold tracking-wider text-gray-800 uppercase">{sectionName}</h2>
                </div>
                <div className="pl-16 space-y-3">
                  {items.map((item: any) => {
                    if (item.type === 'bullet') return <div key={item.idx} className="ml-4 flex items-start gap-3"><span className="text-gray-600 mt-1.5">▸</span><span className="flex-1 text-gray-700 leading-relaxed">{item.content}</span></div>;
                    if (item.type === 'title') return <div key={item.idx} className="mt-4 first:mt-0"><h3 className="text-base font-bold text-gray-900">{item.title}</h3><p className="text-sm text-gray-600 mt-1">{item.details}</p></div>;
                    return <p key={item.idx} className="text-gray-700 leading-relaxed">{item.content}</p>;
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Varieties 13-16: Spaced Sections with Maximum White Space
  if (variety >= 13 && variety <= 16) {
    const configs = [
      { nameSize: 'text-7xl', nameWeight: 'font-extralight', padding: 'p-20', margin: 'mb-16', spacing: 'space-y-6', headerSize: 'text-2xl', headerWeight: 'font-extralight' },
      { nameSize: 'text-8xl', nameWeight: 'font-thin', padding: 'p-24', margin: 'mb-20', spacing: 'space-y-8', headerSize: 'text-3xl', headerWeight: 'font-thin' },
      { nameSize: 'text-6xl', nameWeight: 'font-light', padding: 'p-16', margin: 'mb-12', spacing: 'space-y-5', headerSize: 'text-xl', headerWeight: 'font-light' },
      { nameSize: 'text-7xl', nameWeight: 'font-extralight', padding: 'p-20', margin: 'mb-14', spacing: 'space-y-6', headerSize: 'text-2xl', headerWeight: 'font-extralight' }
    ];
    const config = configs[variety - 13];
    
    return (
      <div className="bg-white" style={{ width: '8.5in', minHeight: '11in', margin: '0 auto' }}>
        <div className={config.padding}>
          <div className={config.margin}>
            <h1 className={`${config.nameSize} ${config.nameWeight} text-gray-900 mb-6 tracking-tight`}>{parsedData.name || 'Your Name'}</h1>
            <div className="flex gap-6 text-sm text-gray-500 font-light">
              {parsedData.contact.email && <span>{parsedData.contact.email}</span>}
              {parsedData.contact.phone && <span>{parsedData.contact.phone}</span>}
              {parsedData.contact.details && <span>{parsedData.contact.details}</span>}
            </div>
          </div>
          {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any]) => {
            const upper = sectionName.toUpperCase();
            const isExperienceType = upper.includes('EXPERIENCE') || upper.includes('PROJECT');
            const items = renderContent(sectionContent, isExperienceType);
            return (
              <div key={sectionName} className={config.margin}>
                <h2 className={`${config.headerSize} ${config.headerWeight} text-gray-400 mb-8 uppercase tracking-widest`}>{sectionName}</h2>
                <div className={config.spacing}>
                  {items.map((item: any) => {
                    if (item.type === 'bullet') return <div key={item.idx} className="ml-10 flex items-start gap-6"><span className="text-gray-300 mt-2">•</span><span className="flex-1 text-gray-600 leading-loose font-light text-lg">{item.content}</span></div>;
                    if (item.type === 'title') return <div key={item.idx} className="mt-8 first:mt-0"><h3 className="text-xl font-light text-gray-900 mb-2">{item.title}</h3><p className="text-base text-gray-500 font-light">{item.details}</p></div>;
                    return <p key={item.idx} className="text-gray-600 leading-loose font-light text-lg">{item.content}</p>;
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Varieties 17-20: Mixed Styles with Different Approaches
  if (variety >= 17 && variety <= 20) {
    const configs = [
      { layout: 'centered', nameSize: 'text-5xl', nameWeight: 'font-normal', borderStyle: 'border-b border-gray-300', textAlign: 'text-center' },
      { layout: 'left', nameSize: 'text-4xl', nameWeight: 'font-semibold', borderStyle: 'border-b-2 border-gray-700', textAlign: 'text-left' },
      { layout: 'centered', nameSize: 'text-6xl', nameWeight: 'font-light', borderStyle: 'border-b border-gray-400', textAlign: 'text-center' },
      { layout: 'left', nameSize: 'text-5xl', nameWeight: 'font-medium', borderStyle: 'border-b-2 border-gray-600', textAlign: 'text-left' }
    ];
    const config = configs[variety - 17];
    
    return (
      <div className="bg-white" style={{ width: '8.5in', minHeight: '11in', margin: '0 auto' }}>
        <div className="p-14">
          <div className={`mb-12 pb-6 ${config.borderStyle} ${config.textAlign}`}>
            <h1 className={`${config.nameSize} ${config.nameWeight} text-gray-900 mb-4`}>{parsedData.name || 'Your Name'}</h1>
            <div className={`flex ${config.layout === 'centered' ? 'justify-center' : ''} gap-4 text-sm text-gray-600`}>
              {parsedData.contact.email && <span>{parsedData.contact.email}</span>}
              {parsedData.contact.phone && <span>• {parsedData.contact.phone}</span>}
              {parsedData.contact.details && <span>• {parsedData.contact.details}</span>}
            </div>
          </div>
          {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any]) => {
            const upper = sectionName.toUpperCase();
            const isExperienceType = upper.includes('EXPERIENCE') || upper.includes('PROJECT');
            const items = renderContent(sectionContent, isExperienceType);
            return (
              <div key={sectionName} className="mb-10">
                <h2 className={`text-lg font-semibold text-gray-800 mb-4 pb-2 ${config.borderStyle} uppercase tracking-wide`}>{sectionName}</h2>
                <div className="space-y-3">
                  {items.map((item: any) => {
                    if (item.type === 'bullet') return <div key={item.idx} className="ml-6 flex items-start gap-3"><span className="text-gray-500 mt-1.5">•</span><span className="flex-1 text-gray-700 leading-relaxed">{item.content}</span></div>;
                    if (item.type === 'title') return <div key={item.idx} className="mt-4 first:mt-0"><h3 className="text-base font-semibold text-gray-900">{item.title}</h3><p className="text-sm text-gray-600 mt-1">{item.details}</p></div>;
                    return <p key={item.idx} className="text-gray-700 leading-relaxed">{item.content}</p>;
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return <div className="p-8">Template format {variety} not configured</div>;
}
