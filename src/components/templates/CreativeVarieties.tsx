interface CreativeVarietyProps {
  content: string;
  variety: number;
}

export function CreativeVariety({ content, variety }: CreativeVarietyProps) {
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

  // Gradient configurations for each variety
  const gradientConfigs = [
    { header: 'from-pink-500 to-purple-600', sidebar: 'from-pink-50 to-purple-50', accent: 'from-pink-600 to-purple-600', bullet: 'from-pink-500 to-purple-600', border: 'border-purple-500' },
    { header: 'from-blue-500 via-indigo-500 to-purple-600', sidebar: 'from-blue-50 to-purple-50', accent: 'from-blue-600 to-purple-600', bullet: 'from-blue-500 to-indigo-600', border: 'border-indigo-600' },
    { header: 'from-emerald-500 via-teal-500 to-cyan-600', sidebar: 'from-emerald-50 to-cyan-50', accent: 'from-emerald-600 to-teal-700', bullet: 'from-emerald-500 to-teal-600', border: 'border-teal-600' },
    { header: 'from-rose-500 to-orange-600', sidebar: 'from-rose-50 to-orange-50', accent: 'from-rose-600 to-orange-700', bullet: 'from-rose-500 to-orange-600', border: 'border-orange-500' },
    { header: 'from-blue-400 to-teal-500', sidebar: 'from-blue-50 to-teal-50', accent: 'from-blue-500 to-teal-600', bullet: 'from-blue-400 to-teal-500', border: 'border-teal-500' },
    { header: 'from-orange-400 via-pink-500 to-purple-500', sidebar: 'from-orange-50 to-purple-50', accent: 'from-orange-500 to-purple-600', bullet: 'from-orange-400 to-pink-500', border: 'border-pink-500' },
    { header: 'from-green-600 to-emerald-700', sidebar: 'from-green-50 to-emerald-50', accent: 'from-green-600 to-emerald-700', bullet: 'from-green-500 to-emerald-600', border: 'border-emerald-600' },
    { header: 'from-sky-300 to-cyan-400', sidebar: 'from-sky-50 to-cyan-50', accent: 'from-sky-400 to-cyan-500', bullet: 'from-sky-300 to-cyan-400', border: 'border-cyan-400' },
    { header: 'from-violet-500 via-purple-500 to-fuchsia-600', sidebar: 'from-violet-50 to-fuchsia-50', accent: 'from-violet-600 to-fuchsia-700', bullet: 'from-violet-500 to-purple-600', border: 'border-purple-600' },
    { header: 'from-amber-500 to-red-600', sidebar: 'from-amber-50 to-red-50', accent: 'from-amber-600 to-red-700', bullet: 'from-amber-500 to-red-600', border: 'border-red-600' },
    { header: 'from-lime-500 to-green-600', sidebar: 'from-lime-50 to-green-50', accent: 'from-lime-600 to-green-700', bullet: 'from-lime-500 to-green-600', border: 'border-green-600' },
    { header: 'from-cyan-500 to-blue-600', sidebar: 'from-cyan-50 to-blue-50', accent: 'from-cyan-600 to-blue-700', bullet: 'from-cyan-500 to-blue-600', border: 'border-blue-600' },
    { header: 'from-fuchsia-500 to-pink-600', sidebar: 'from-fuchsia-50 to-pink-50', accent: 'from-fuchsia-600 to-pink-700', bullet: 'from-fuchsia-500 to-pink-600', border: 'border-pink-600' },
    { header: 'from-yellow-400 to-orange-500', sidebar: 'from-yellow-50 to-orange-50', accent: 'from-yellow-500 to-orange-600', bullet: 'from-yellow-400 to-orange-500', border: 'border-orange-500' },
    { header: 'from-teal-500 to-emerald-600', sidebar: 'from-teal-50 to-emerald-50', accent: 'from-teal-600 to-emerald-700', bullet: 'from-teal-500 to-emerald-600', border: 'border-emerald-600' },
    { header: 'from-indigo-500 to-blue-600', sidebar: 'from-indigo-50 to-blue-50', accent: 'from-indigo-600 to-blue-700', bullet: 'from-indigo-500 to-blue-600', border: 'border-blue-600' },
    { header: 'from-rose-400 to-pink-500', sidebar: 'from-rose-50 to-pink-50', accent: 'from-rose-500 to-pink-600', bullet: 'from-rose-400 to-pink-500', border: 'border-pink-500' },
    { header: 'from-slate-600 to-gray-700', sidebar: 'from-slate-50 to-gray-50', accent: 'from-slate-700 to-gray-800', bullet: 'from-slate-600 to-gray-700', border: 'border-gray-700' },
    { header: 'from-purple-600 to-indigo-700', sidebar: 'from-purple-50 to-indigo-50', accent: 'from-purple-700 to-indigo-800', bullet: 'from-purple-600 to-indigo-700', border: 'border-indigo-700' },
    { header: 'from-red-500 via-orange-500 to-yellow-500', sidebar: 'from-red-50 to-yellow-50', accent: 'from-red-600 to-yellow-700', bullet: 'from-red-500 to-orange-600', border: 'border-orange-600' }
  ];

  const config = gradientConfigs[(variety - 1) % 20];

  // Varieties 1-5: Gradient Sidebar with Rounded Sections
  if (variety >= 1 && variety <= 5) {
    return (
      <div className={`bg-gradient-to-br ${config.sidebar}`} style={{ width: '8.5in', minHeight: '11in', margin: '0 auto' }}>
        <div className="p-10">
          <div className={`bg-gradient-to-r ${config.header} text-white p-8 rounded-2xl shadow-2xl mb-8`}>
            <h1 className="text-5xl font-extrabold mb-3">{parsedData.name || 'Your Name'}</h1>
            <div className="flex flex-wrap gap-4 text-sm">
              {parsedData.contact.email && <span>✉ {parsedData.contact.email}</span>}
              {parsedData.contact.phone && <span>📱 {parsedData.contact.phone}</span>}
              {parsedData.contact.details && <span>🔗 {parsedData.contact.details}</span>}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-8">
            <div className="col-span-2 space-y-10">
              {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any]) => {
                const upper = sectionName.toUpperCase();
                if (!(upper.includes('SUMMARY') || upper.includes('EXPERIENCE') || upper.includes('PROJECT'))) return null;
                const isExperienceType = upper.includes('EXPERIENCE') || upper.includes('PROJECT');
                const items = renderContent(sectionContent, isExperienceType);
                return (
                  <div key={sectionName}>
                    <div className="relative mb-6">
                      <h2 className={`text-3xl font-extrabold bg-gradient-to-r ${config.accent} bg-clip-text text-transparent inline-block`}>{sectionName}</h2>
                      <div className={`absolute -bottom-2 left-0 w-24 h-1 bg-gradient-to-r ${config.accent} rounded-full`}></div>
                    </div>
                    <div className="space-y-6">
                      {items.map((item: any) => {
                        if (item.type === 'bullet') return <div key={item.idx} className="ml-6 flex items-start gap-3"><div className={`w-3 h-3 bg-gradient-to-br ${config.bullet} rounded-full mt-2 flex-shrink-0`}></div><span className="flex-1 text-gray-700 leading-relaxed">{item.content}</span></div>;
                        if (item.type === 'title') return <div key={item.idx} className={`mt-6 first:mt-0 bg-gradient-to-r ${config.sidebar} p-4 rounded-xl ${config.border} border-l-4`}><h3 className="text-xl font-bold text-gray-800">{item.title}</h3><p className={`text-sm font-semibold bg-gradient-to-r ${config.accent} bg-clip-text text-transparent`}>{item.details}</p></div>;
                        return <p key={item.idx} className="text-gray-800 font-bold text-lg mt-4 first:mt-0">{item.content}</p>;
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="space-y-8">
              {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any]) => {
                const upper = sectionName.toUpperCase();
                if (!(upper.includes('SKILL') || upper.includes('EDUCATION') || upper.includes('CERTIFICATION') || upper.includes('LANGUAGE') || upper.includes('AWARD'))) return null;
                return (
                  <div key={sectionName}>
                    <div className="relative mb-6">
                      <h2 className={`text-2xl font-extrabold bg-gradient-to-r ${config.accent} bg-clip-text text-transparent inline-block`}>{sectionName}</h2>
                      <div className={`absolute -bottom-2 left-0 w-16 h-1 bg-gradient-to-r ${config.accent} rounded-full`}></div>
                    </div>
                    <div className={`bg-gradient-to-br ${config.sidebar} p-5 rounded-xl shadow-md ${config.border} border-l-4`}>
                      <div className="space-y-2 text-sm">{sectionContent.map((line: string, idx: number) => <p key={idx} className="text-gray-700 leading-relaxed">{line}</p>)}</div>
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

  // Varieties 6-10: Boxed Sections with Gradients
  if (variety >= 6 && variety <= 10) {
    return (
      <div className="bg-white" style={{ width: '8.5in', minHeight: '11in', margin: '0 auto' }}>
        <div className="p-10">
          <div className={`bg-gradient-to-r ${config.header} text-white p-8 rounded-3xl shadow-2xl mb-8`}>
            <h1 className="text-6xl font-black mb-3">{parsedData.name || 'Your Name'}</h1>
            <div className="flex gap-5 text-sm font-medium">
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
              <div key={sectionName} className="mb-6">
                <div className={`bg-gradient-to-r ${config.sidebar} p-6 rounded-2xl shadow-lg ${config.border} border-l-8`}>
                  <h2 className={`text-2xl font-bold bg-gradient-to-r ${config.accent} bg-clip-text text-transparent mb-4`}>{sectionName.toUpperCase()}</h2>
                  <div className="space-y-3">
                    {items.map((item: any) => {
                      if (item.type === 'bullet') return <div key={item.idx} className="ml-4 flex items-start gap-3"><div className={`w-2 h-2 bg-gradient-to-br ${config.bullet} rounded-full mt-2`}></div><span className="flex-1 text-gray-700 leading-relaxed">{item.content}</span></div>;
                      if (item.type === 'title') return <div key={item.idx} className="mt-3 first:mt-0"><h3 className="text-lg font-bold text-gray-900">{item.title}</h3><p className={`text-sm font-semibold bg-gradient-to-r ${config.accent} bg-clip-text text-transparent`}>{item.details}</p></div>;
                      return <p key={item.idx} className="text-gray-700 leading-relaxed">{item.content}</p>;
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Varieties 11-15: Top Banner with Single Column
  if (variety >= 11 && variety <= 15) {
    return (
      <div className="bg-white" style={{ width: '8.5in', minHeight: '11in', margin: '0 auto' }}>
        <div className={`bg-gradient-to-br ${config.header} text-white p-16`}>
          <h1 className="text-7xl font-black mb-4 tracking-tight">{parsedData.name || 'Your Name'}</h1>
          <div className="flex flex-wrap gap-6 text-base font-medium">
            {parsedData.contact.email && <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">{parsedData.contact.email}</div>}
            {parsedData.contact.phone && <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">{parsedData.contact.phone}</div>}
            {parsedData.contact.details && <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">{parsedData.contact.details}</div>}
          </div>
        </div>
        <div className="p-12">
          {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any]) => {
            const upper = sectionName.toUpperCase();
            const isExperienceType = upper.includes('EXPERIENCE') || upper.includes('PROJECT');
            const items = renderContent(sectionContent, isExperienceType);
            return (
              <div key={sectionName} className="mb-10">
                <div className="flex items-center gap-4 mb-5">
                  <div className={`w-12 h-1 bg-gradient-to-r ${config.accent} rounded-full`}></div>
                  <h2 className={`text-3xl font-bold bg-gradient-to-r ${config.accent} bg-clip-text text-transparent`}>{sectionName.toUpperCase()}</h2>
                </div>
                <div className="space-y-3 pl-16">
                  {items.map((item: any) => {
                    if (item.type === 'bullet') return <div key={item.idx} className="flex items-start gap-3"><span className={`bg-gradient-to-r ${config.bullet} bg-clip-text text-transparent mt-1.5 font-bold`}>▸</span><span className="flex-1 text-gray-700 leading-relaxed">{item.content}</span></div>;
                    if (item.type === 'title') return <div key={item.idx} className="mt-4 first:mt-0"><h3 className="text-xl font-bold text-gray-900">{item.title}</h3><p className={`text-sm font-semibold bg-gradient-to-r ${config.accent} bg-clip-text text-transparent`}>{item.details}</p></div>;
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

  // Varieties 16-20: Diagonal Split Design
  if (variety >= 16 && variety <= 20) {
    return (
      <div className="bg-white relative overflow-hidden" style={{ width: '8.5in', minHeight: '11in', margin: '0 auto' }}>
        <div className={`absolute inset-0 bg-gradient-to-br ${config.header} transform -skew-y-6 origin-top-left`} style={{ height: '40%' }}></div>
        <div className="relative p-12">
          <div className="text-white mb-20">
            <h1 className="text-6xl font-black mb-4">{parsedData.name || 'Your Name'}</h1>
            <div className="flex gap-5 text-sm">
              {parsedData.contact.email && <span className="bg-white/20 px-3 py-1 rounded">{parsedData.contact.email}</span>}
              {parsedData.contact.phone && <span className="bg-white/20 px-3 py-1 rounded">{parsedData.contact.phone}</span>}
              {parsedData.contact.details && <span className="bg-white/20 px-3 py-1 rounded">{parsedData.contact.details}</span>}
            </div>
          </div>
          {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any]) => {
            const upper = sectionName.toUpperCase();
            const isExperienceType = upper.includes('EXPERIENCE') || upper.includes('PROJECT');
            const items = renderContent(sectionContent, isExperienceType);
            return (
              <div key={sectionName} className="mb-8">
                <h2 className={`text-2xl font-bold bg-gradient-to-r ${config.accent} bg-clip-text text-transparent mb-4 flex items-center gap-3`}>
                  <div className={`w-3 h-3 bg-gradient-to-br ${config.bullet} rounded-full`}></div>
                  {sectionName.toUpperCase()}
                </h2>
                <div className={`bg-white shadow-lg rounded-xl p-6 ${config.border} border-t-4`}>
                  <div className="space-y-3">
                    {items.map((item: any) => {
                      if (item.type === 'bullet') return <div key={item.idx} className="ml-4 flex items-start gap-3"><span className={`bg-gradient-to-r ${config.bullet} bg-clip-text text-transparent mt-1.5`}>■</span><span className="flex-1 text-gray-700 leading-relaxed">{item.content}</span></div>;
                      if (item.type === 'title') return <div key={item.idx} className="mt-3 first:mt-0"><h3 className="text-lg font-bold text-gray-900">{item.title}</h3><p className={`text-sm font-semibold bg-gradient-to-r ${config.accent} bg-clip-text text-transparent`}>{item.details}</p></div>;
                      return <p key={item.idx} className="text-gray-700 leading-relaxed">{item.content}</p>;
                    })}
                  </div>
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
