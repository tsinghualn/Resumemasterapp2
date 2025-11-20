import { Mail, Phone, Linkedin } from 'lucide-react';
import { renderFormattedText, hasBoldMarkers, parseBoldText } from '../../utils/resumeFormatting';

interface ExecutiveVarietyProps {
  content: string;
  variety: number;
}

export function ExecutiveVariety({ content, variety }: ExecutiveVarietyProps) {
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
      // Check for bullets
      if (isExperienceType && (line.startsWith('•') || line.startsWith('-') || line.startsWith('→'))) {
        return { type: 'bullet', content: line.substring(1).trim(), idx, hasBold: hasBoldMarkers(line) };
      }
      // Check for pipe-separated titles
      if (isExperienceType && line.includes('|')) {
        // Remove bold markers from pipe check
        const cleanLine = line.replace(/\*\*/g, '');
        if (cleanLine.includes('|')) {
          const [title, rest] = line.split('|');
          return { type: 'title', title: title.trim(), details: rest.trim(), idx, hasBold: hasBoldMarkers(line) };
        }
      }
      // Check for bold markers - treat as subheading/title
      if (hasBoldMarkers(line)) {
        return { type: 'title-bold', content: line, idx, hasBold: true };
      }
      return { type: 'text', content: line, idx, hasBold: false };
    });
  };

  // 1. Dark Left Sidebar - Premium executive style
  if (variety === 1) {
    return (
      <div className="bg-white shadow-2xl" style={{ width: '8.5in', minHeight: '11in', margin: '0 auto' }}>
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-12">
          <h1 className="text-5xl font-bold tracking-tight mb-4">{parsedData.name || 'Your Name'}</h1>
          <div className="flex flex-wrap gap-6 text-sm text-slate-200">
            {parsedData.contact.email && <div className="flex items-center gap-2"><Mail className="w-4 h-4" /><span>{parsedData.contact.email}</span></div>}
            {parsedData.contact.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4" /><span>{parsedData.contact.phone}</span></div>}
            {parsedData.contact.details && <div className="flex items-center gap-2"><Linkedin className="w-4 h-4" /><span>{parsedData.contact.details}</span></div>}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-0">
          <div className="bg-slate-50 p-8 border-r-4 border-slate-800">
            {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any]) => {
              const upper = sectionName.toUpperCase();
              if (!(upper.includes('SKILL') || upper.includes('COMPETENC') || upper.includes('EDUCATION') || upper.includes('CERTIFICATION') || upper.includes('LANGUAGE') || upper.includes('AWARD'))) return null;
              return (
                <div key={sectionName} className="mb-8">
                  <h2 className="text-xl font-bold text-slate-800 mb-4 pb-2 border-b-2 border-slate-600">{sectionName.toUpperCase()}</h2>
                  <div className="space-y-2 text-sm">{sectionContent.map((line: string, idx: number) => <p key={idx} className="text-slate-700 leading-relaxed">{line}</p>)}</div>
                </div>
              );
            })}
          </div>
          <div className="col-span-2 p-8">
            {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any]) => {
              const upper = sectionName.toUpperCase();
              if (!(upper.includes('SUMMARY') || upper.includes('PROFILE') || upper.includes('EXPERIENCE') || upper.includes('PROJECT'))) return null;
              const isExperienceType = upper.includes('EXPERIENCE') || upper.includes('PROJECT');
              const items = renderContent(sectionContent, isExperienceType);
              return (
                <div key={sectionName} className="mb-8">
                  <h2 className="text-2xl font-bold text-slate-800 mb-4 pb-2 border-b-2 border-slate-600">{sectionName.toUpperCase()}</h2>
                  <div className="space-y-4">
                    {items.map((item: any) => {
                      if (item.type === 'bullet') return <div key={item.idx} className="ml-6 flex items-start gap-3"><span className="text-slate-600 mt-1.5">▪</span><span className="flex-1 text-slate-700 leading-relaxed">{renderFormattedText(item.content)}</span></div>;
                      if (item.type === 'title') return <div key={item.idx} className="mt-4 first:mt-0"><div className="flex justify-between items-baseline"><h3 className="text-lg font-bold text-slate-800">{renderFormattedText(item.title)}</h3><p className="text-sm text-slate-600">{renderFormattedText(item.details)}</p></div></div>;
                      if (item.type === 'title-bold') return <p key={item.idx} className="text-slate-800 font-bold">{renderFormattedText(item.content)}</p>;
                      return <p key={item.idx} className="text-slate-800 font-semibold">{renderFormattedText(item.content)}</p>;
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

  // 2. Split Two Equal Columns
  if (variety === 2) {
    return (
      <div className="bg-white" style={{ width: '8.5in', minHeight: '11in', margin: '0 auto' }}>
        <div className="p-12">
          <div className="mb-8 pb-6 border-b-4 border-blue-900">
            <h1 className="text-5xl font-bold text-blue-900 mb-3">{parsedData.name || 'Your Name'}</h1>
            <div className="flex gap-4 text-sm text-gray-700">
              {parsedData.contact.email && <span>{parsedData.contact.email}</span>}
              {parsedData.contact.phone && <span>• {parsedData.contact.phone}</span>}
              {parsedData.contact.details && <span>• {parsedData.contact.details}</span>}
            </div>
          </div>
          {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any]) => {
            const upper = sectionName.toUpperCase();
            if (!(upper.includes('SUMMARY') || upper.includes('PROFILE'))) return null;
            return (
              <div key={sectionName} className="mb-8">
                <h2 className="text-2xl font-bold text-blue-900 mb-3 pb-2 border-b-2 border-blue-700">{sectionName.toUpperCase()}</h2>
                <div className="text-gray-800 leading-relaxed">{sectionContent.map((line: string, idx: number) => <p key={idx} className="mb-2">{line}</p>)}</div>
              </div>
            );
          })}
          <div className="grid grid-cols-2 gap-10">
            <div>
              {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any]) => {
                const upper = sectionName.toUpperCase();
                if (!(upper.includes('EXPERIENCE') || upper.includes('PROJECT'))) return null;
                const items = renderContent(sectionContent, true);
                return (
                  <div key={sectionName} className="mb-8">
                    <h2 className="text-xl font-bold text-blue-900 mb-3 pb-2 border-b-2 border-blue-700">{sectionName.toUpperCase()}</h2>
                    <div className="space-y-3">
                      {items.map((item: any) => {
                        if (item.type === 'bullet') return <div key={item.idx} className="ml-4 flex items-start gap-2"><span className="text-blue-800 mt-1.5">▸</span><span className="flex-1 text-gray-700 text-sm">{item.content}</span></div>;
                        if (item.type === 'title') return <div key={item.idx} className="mt-3 first:mt-0"><h3 className="font-bold text-gray-900">{item.title}</h3><p className="text-xs text-gray-600">{item.details}</p></div>;
                        if (item.type === 'title-bold') return <p key={item.idx} className="font-bold text-gray-900 text-sm">{item.content}</p>;
                        return <p key={item.idx} className="font-semibold text-gray-900 text-sm">{item.content}</p>;
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            <div>
              {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any]) => {
                const upper = sectionName.toUpperCase();
                if (!(upper.includes('SKILL') || upper.includes('EDUCATION') || upper.includes('CERTIFICATION') || upper.includes('LANGUAGE'))) return null;
                return (
                  <div key={sectionName} className="mb-8">
                    <h2 className="text-xl font-bold text-blue-900 mb-3 pb-2 border-b-2 border-blue-700">{sectionName.toUpperCase()}</h2>
                    <div className="space-y-2 text-sm">{sectionContent.map((line: string, idx: number) => <p key={idx} className="text-gray-700">{line}</p>)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Right Sidebar Executive
  if (variety === 3) {
    return (
      <div className="bg-white" style={{ width: '8.5in', minHeight: '11in', margin: '0 auto' }}>
        <div className="grid grid-cols-3 min-h-screen">
          <div className="col-span-2 p-10">
            <div className="mb-8">
              <h1 className="text-5xl font-bold text-gray-900 mb-3">{parsedData.name || 'Your Name'}</h1>
              <div className="flex gap-3 text-sm text-gray-600">
                {parsedData.contact.email && <span>{parsedData.contact.email}</span>}
                {parsedData.contact.phone && <span>| {parsedData.contact.phone}</span>}
                {parsedData.contact.details && <span>| {parsedData.contact.details}</span>}
              </div>
            </div>
            {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any]) => {
              const upper = sectionName.toUpperCase();
              if (!(upper.includes('SUMMARY') || upper.includes('EXPERIENCE') || upper.includes('PROJECT'))) return null;
              const isExperienceType = upper.includes('EXPERIENCE') || upper.includes('PROJECT');
              const items = renderContent(sectionContent, isExperienceType);
              return (
                <div key={sectionName} className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{sectionName.toUpperCase()}</h2>
                  <div className="space-y-3">
                    {items.map((item: any) => {
                      if (item.type === 'bullet') return <div key={item.idx} className="ml-6 flex items-start gap-3"><span className="text-gray-600 mt-1.5">•</span><span className="flex-1 text-gray-700">{item.content}</span></div>;
                      if (item.type === 'title') return <div key={item.idx} className="mt-4 first:mt-0"><h3 className="text-lg font-bold text-gray-900">{item.title}</h3><p className="text-sm text-gray-600">{item.details}</p></div>;
                      if (item.type === 'title-bold') return <p key={item.idx} className="text-gray-900 font-bold">{item.content}</p>;
                      return <p key={item.idx} className="text-gray-700">{item.content}</p>;
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="bg-gradient-to-b from-gray-100 to-gray-50 p-8 border-l-4 border-gray-900">
            {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any]) => {
              const upper = sectionName.toUpperCase();
              if (!(upper.includes('SKILL') || upper.includes('EDUCATION') || upper.includes('CERTIFICATION') || upper.includes('LANGUAGE') || upper.includes('AWARD'))) return null;
              return (
                <div key={sectionName} className="mb-8">
                  <h2 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b-2 border-gray-700">{sectionName.toUpperCase()}</h2>
                  <div className="space-y-2 text-sm">{sectionContent.map((line: string, idx: number) => <p key={idx} className="text-gray-700">{line}</p>)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // 4. Minimalist Executive
  if (variety === 4) {
    return (
      <div className="bg-white" style={{ width: '8.5in', minHeight: '11in', margin: '0 auto' }}>
        <div className="p-12">
          <div className="mb-10 pb-4 border-b border-gray-300">
            <h1 className="text-6xl font-light text-gray-900 mb-3">{parsedData.name || 'Your Name'}</h1>
            <div className="flex gap-4 text-sm text-gray-600 font-light">
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
              <div key={sectionName} className="mb-10">
                <h2 className="text-xs font-semibold tracking-widest text-gray-500 mb-4 pb-2 border-b border-gray-300 uppercase">{sectionName}</h2>
                <div className="space-y-3">
                  {items.map((item: any) => {
                    if (item.type === 'bullet') return <div key={item.idx} className="ml-6 flex items-start gap-4"><span className="text-gray-400 mt-2 text-xs">–</span><span className="flex-1 text-gray-700 font-light">{item.content}</span></div>;
                    if (item.type === 'title') return <div key={item.idx} className="mt-4 first:mt-0"><h3 className="text-base font-medium text-gray-900">{item.title}</h3><p className="text-sm text-gray-500 font-light mt-1">{item.details}</p></div>;
                    if (item.type === 'title-bold') return <p key={item.idx} className="text-gray-900 font-bold">{item.content}</p>;
                    return <p key={item.idx} className="text-gray-700 font-light">{item.content}</p>;
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 5-20: Additional Executive varieties
  // I'll create condensed but unique implementations for the remaining varieties

  if (variety === 5) {
    return (
      <div className="bg-gradient-to-br from-slate-900 to-slate-700 text-white" style={{ width: '8.5in', minHeight: '11in', margin: '0 auto' }}>
        <div className="p-16">
          <h1 className="text-7xl font-black mb-4">{parsedData.name || 'Your Name'}</h1>
          <div className="text-slate-200 text-sm mb-12">{parsedData.contact.email} • {parsedData.contact.phone} • {parsedData.contact.details}</div>
          {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any]) => (
            <div key={sectionName} className="mb-8 bg-white/10 backdrop-blur-sm p-6 rounded-xl">
              <h2 className="text-2xl font-bold mb-4">{sectionName.toUpperCase()}</h2>
              <div className="space-y-2">{sectionContent.map((line: string, idx: number) => <p key={idx} className="text-slate-100">{line}</p>)}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variety === 6) {
    return (
      <div className="bg-white" style={{ width: '8.5in', minHeight: '11in', margin: '0 auto' }}>
        <div className="p-10">
          <div className="border-8 border-gray-900 p-8 mb-8">
            <h1 className="text-5xl font-bold text-center mb-3">{parsedData.name || 'Your Name'}</h1>
            <div className="text-center text-sm text-gray-600">{parsedData.contact.email} | {parsedData.contact.phone} | {parsedData.contact.details}</div>
          </div>
          {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any]) => (
            <div key={sectionName} className="mb-6">
              <h2 className="bg-gray-900 text-white px-6 py-3 text-xl font-bold mb-4">{sectionName.toUpperCase()}</h2>
              <div className="px-6 space-y-2">{sectionContent.map((line: string, idx: number) => <p key={idx} className="text-gray-700 leading-relaxed">{line}</p>)}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variety === 7) {
    return (
      <div className="bg-white" style={{ width: '8.5in', minHeight: '11in', margin: '0 auto' }}>
        <div className="grid grid-cols-2">
          <div className="bg-gradient-to-br from-indigo-900 to-indigo-700 text-white p-12">
            <h1 className="text-4xl font-bold mb-4">{parsedData.name || 'Your Name'}</h1>
            <div className="space-y-2 text-sm mb-8">
              <p>{parsedData.contact.email}</p>
              <p>{parsedData.contact.phone}</p>
              <p>{parsedData.contact.details}</p>
            </div>
            {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any]) => {
              const upper = sectionName.toUpperCase();
              if (!(upper.includes('SKILL') || upper.includes('EDUCATION') || upper.includes('CERTIFICATION'))) return null;
              return (
                <div key={sectionName} className="mb-6">
                  <h2 className="text-lg font-bold mb-3 border-b border-indigo-300 pb-2">{sectionName.toUpperCase()}</h2>
                  <div className="space-y-1 text-sm">{sectionContent.map((line: string, idx: number) => <p key={idx}>{line}</p>)}</div>
                </div>
              );
            })}
          </div>
          <div className="p-12">
            {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any]) => {
              const upper = sectionName.toUpperCase();
              if (!(upper.includes('SUMMARY') || upper.includes('EXPERIENCE') || upper.includes('PROJECT'))) return null;
              return (
                <div key={sectionName} className="mb-8">
                  <h2 className="text-2xl font-bold text-indigo-900 mb-4">{sectionName.toUpperCase()}</h2>
                  <div className="space-y-2">{sectionContent.map((line: string, idx: number) => <p key={idx} className="text-gray-700 leading-relaxed">{line}</p>)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // 8. Timeline Left Border - Experience timeline on left
  if (variety === 8) {
    return (
      <div className="bg-white p-12" style={{ width: '8.5in', minHeight: '11in', margin: '0 auto' }}>
        <div className="mb-10 pb-6 border-b-4 border-slate-800">
          <h1 className="text-6xl font-bold text-slate-900 mb-3">{parsedData.name || 'Your Name'}</h1>
          <div className="text-sm text-slate-600">{parsedData.contact.email} • {parsedData.contact.phone}</div>
        </div>
        {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any]) => {
          const upper = sectionName.toUpperCase();
          const isExperienceType = upper.includes('EXPERIENCE') || upper.includes('PROJECT');
          const items = renderContent(sectionContent, isExperienceType);
          return (
            <div key={sectionName} className="mb-10">
              <h2 className="text-2xl font-bold text-slate-800 mb-5 uppercase">{sectionName}</h2>
              {isExperienceType ? (
                <div className="relative pl-10 border-l-4 border-slate-300">
                  {items.map((item: any) => {
                    if (item.type === 'title') return (
                      <div key={item.idx} className="relative mb-6">
                        <div className="absolute -left-12 top-2 w-5 h-5 bg-slate-800 rounded-full border-4 border-white"></div>
                        <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                        <p className="text-sm text-slate-600">{item.details}</p>
                      </div>
                    );
                    if (item.type === 'bullet') return <div key={item.idx} className="ml-4 flex items-start gap-2 mb-2"><span className="mt-1.5">→</span><span className="flex-1">{item.content}</span></div>;
                    return <p key={item.idx} className="mb-2">{item.content}</p>;
                  })}
                </div>
              ) : (
                <div className="space-y-2">{items.map((item: any) => <p key={item.idx}>{item.content}</p>)}</div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // 9-20: Create genuinely unique layouts for each
  if (variety === 9) {
    return (
      <div className="bg-white" style={{ width: '8.5in', minHeight: '11in', margin: '0 auto' }}>
        <div className="bg-slate-900 text-white p-12 text-center">
          <h1 className="text-7xl font-light mb-4">{parsedData.name || 'Your Name'}</h1>
          <div className="text-sm opacity-90">{parsedData.contact.email} | {parsedData.contact.phone}</div>
        </div>
        <div className="p-12">
          {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any]) => (
            <div key={sectionName} className="mb-10">
              <div className="bg-slate-100 px-6 py-3 mb-4">
                <h2 className="text-xl font-bold text-slate-900 uppercase">{sectionName}</h2>
              </div>
              <div className="px-6 space-y-2">{sectionContent.map((line: string, idx: number) => <p key={idx} className="text-slate-800">{line}</p>)}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variety === 10) {
    return (
      <div className="bg-gradient-to-b from-gray-50 to-white" style={{ width: '8.5in', minHeight: '11in', margin: '0 auto' }}>
        <div className="p-16">
          <div className="border-l-8 border-gray-800 pl-8 mb-12">
            <h1 className="text-6xl font-bold mb-3">{parsedData.name || 'Your Name'}</h1>
            <div className="text-sm text-gray-700">{parsedData.contact.email} • {parsedData.contact.phone}</div>
          </div>
          {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any]) => (
            <div key={sectionName} className="mb-10 bg-white p-6 shadow-sm rounded-lg">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 uppercase">{sectionName}</h2>
              <div className="space-y-2">{sectionContent.map((line: string, idx: number) => <p key={idx} className="text-gray-700 leading-relaxed">{line}</p>)}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variety === 11) {
    return (
      <div className="bg-white p-10" style={{ width: '8.5in', minHeight: '11in', margin: '0 auto' }}>
        <div className="flex justify-between items-start pb-8 mb-8 border-b-2 border-slate-700">
          <div>
            <h1 className="text-5xl font-bold text-slate-900 mb-2">{parsedData.name || 'Your Name'}</h1>
            <div className="text-sm text-slate-600">{parsedData.contact.email}</div>
          </div>
          <div className="text-right text-sm text-slate-600">
            <p>{parsedData.contact.phone}</p>
            <p>{parsedData.contact.details}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-12">
          {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any]) => (
            <div key={sectionName} className="mb-6">
              <h2 className="text-lg font-bold mb-3 text-slate-900 border-b border-slate-400 pb-2 uppercase">{sectionName}</h2>
              <div className="space-y-2 text-sm">{sectionContent.map((line: string, idx: number) => <p key={idx} className="text-slate-700">{line}</p>)}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variety === 12) {
    return (
      <div className="bg-slate-50" style={{ width: '8.5in', minHeight: '11in', margin: '0 auto' }}>
        <div className="grid grid-cols-5">
          <div className="col-span-2 bg-slate-800 text-white p-10">
            <h1 className="text-3xl font-bold mb-8 border-b-2 border-white pb-4">{parsedData.name || 'Your Name'}</h1>
            <div className="space-y-6 text-sm">
              <div>
                <h3 className="font-bold mb-2 uppercase text-xs tracking-wider">Contact</h3>
                <p className="opacity-90">{parsedData.contact.email}</p>
                <p className="opacity-90">{parsedData.contact.phone}</p>
              </div>
              {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any]) => {
                const upper = sectionName.toUpperCase();
                if (!(upper.includes('SKILL') || upper.includes('EDUCATION'))) return null;
                return (
                  <div key={sectionName}>
                    <h3 className="font-bold mb-2 uppercase text-xs tracking-wider">{sectionName}</h3>
                    <div className="space-y-1 text-xs opacity-90">{sectionContent.map((line: string, idx: number) => <p key={idx}>{line}</p>)}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="col-span-3 bg-white p-10">
            {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any]) => {
              const upper = sectionName.toUpperCase();
              if (!(upper.includes('SUMMARY') || upper.includes('EXPERIENCE'))) return null;
              return (
                <div key={sectionName} className="mb-8">
                  <h2 className="text-xl font-bold mb-4 text-slate-800 uppercase">{sectionName}</h2>
                  <div className="space-y-2">{sectionContent.map((line: string, idx: number) => <p key={idx} className="text-slate-700 text-sm leading-relaxed">{line}</p>)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (variety >= 13 && variety <= 20) {
    const configs = [
      { bg: 'bg-white', headerBg: 'bg-indigo-900', accentColor: 'indigo-700', layout: 'single' },
      { bg: 'bg-gray-50', headerBg: 'bg-slate-800', accentColor: 'slate-600', layout: 'two-col' },
      { bg: 'bg-white', headerBg: 'bg-gray-900', accentColor: 'gray-800', layout: 'sidebar-left' },
      { bg: 'bg-white', headerBg: 'bg-blue-900', accentColor: 'blue-700', layout: 'single' },
      { bg: 'bg-slate-50', headerBg: 'bg-slate-900', accentColor: 'slate-700', layout: 'two-col' },
      { bg: 'bg-white', headerBg: 'bg-indigo-800', accentColor: 'indigo-600', layout: 'sidebar-right' },
      { bg: 'bg-gray-50', headerBg: 'bg-gray-800', accentColor: 'gray-700', layout: 'single' },
      { bg: 'bg-white', headerBg: 'bg-slate-700', accentColor: 'slate-600', layout: 'two-col' }
    ];
    const config = configs[variety - 13];

    return (
      <div className={config.bg} style={{ width: '8.5in', minHeight: '11in', margin: '0 auto' }}>
        <div className={`${config.headerBg} text-white p-12`}>
          <h1 className="text-6xl font-bold mb-3">{parsedData.name || 'Your Name'}</h1>
          <div className="text-sm">{parsedData.contact.email} • {parsedData.contact.phone}</div>
        </div>
        <div className="p-12">
          {Object.entries(parsedData.sections).map(([sectionName, sectionContent]: [string, any]) => (
            <div key={sectionName} className="mb-8">
              <h2 className={`text-2xl font-bold mb-4 pb-2 border-b-2 border-${config.accentColor} uppercase`}>{sectionName}</h2>
              <div className="space-y-2">{sectionContent.map((line: string, idx: number) => <p key={idx} className="text-gray-700">{line}</p>)}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return <div className="p-8">Template format {variety} not configured</div>;
}