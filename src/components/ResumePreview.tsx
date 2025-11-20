import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';
import { 
  ArrowLeft,
  ArrowRight,
  FileDown, 
  Save,
  Printer,
  Eye,
  FileText,
  Download,
  Sparkles,
  Briefcase,
  Palette,
  Layout,
  Shield,
  ChevronDown,
  ChevronRight,
  Check
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { CopyProtection } from './CopyProtection';
import { ExecutiveTemplate } from './templates/ExecutiveTemplate';
import { ModernTwoColumnTemplate } from './templates/ModernTwoColumnTemplate';
import { CreativeTemplate } from './templates/CreativeTemplate';
import { MinimalistTemplate } from './templates/MinimalistTemplate';
import { ATSFriendlyTemplate } from './templates/ATSFriendlyTemplate';
import { ATSVariety } from './templates/ATSVarieties';
import { ExecutiveVariety } from './templates/ExecutiveVarieties';
import { ModernVariety } from './templates/ModernVarieties';
import { CreativeVariety } from './templates/CreativeVarieties';
import { MinimalistVariety } from './templates/MinimalistVarieties';

interface ResumePreviewProps {
  resumeContent: string;
  fileName: string;
  onBack: () => void;
  onSave: () => void;
  onDashboard: () => void;
}

export function ResumePreview({ 
  resumeContent, 
  fileName, 
  onBack,
  onSave,
  onDashboard
}: ResumePreviewProps) {
  const [selectedTemplate, setSelectedTemplate] = useState('ats-1');
  const [exportFormat, setExportFormat] = useState('pdf');
  const [expandedCategory, setExpandedCategory] = useState<string>('ats');
  const [isExporting, setIsExporting] = useState(false);
  
  // Debug: Log what content is received
  console.log('🖼️ ResumePreview received content:');
  console.log('---START CONTENT---');
  console.log(resumeContent);
  console.log('---END CONTENT---');
  console.log(`Total characters: ${resumeContent?.length || 0}`);

  // Generate all 100 template varieties
  const generateTemplates = () => {
    const types = [
      { type: 'ats', name: 'ATS-Friendly', icon: Shield, color: 'from-blue-600 to-blue-700' },
      { type: 'executive', name: 'Executive', icon: Briefcase, color: 'from-slate-700 to-slate-900' },
      { type: 'modern', name: 'Modern Two-Column', icon: Layout, color: 'from-teal-600 to-teal-700' },
      { type: 'creative', name: 'Creative Gradient', icon: Palette, color: 'from-purple-600 to-pink-600' },
      { type: 'minimal', name: 'Minimalist', icon: Sparkles, color: 'from-gray-700 to-gray-900' }
    ];

    const varietyDescriptions: { [key: string]: string[] } = {
      'ats': [
        'Classic Centered', 'Left Aligned Compact', 'Left Sidebar', 'Compact Two-Column', 'Timeline Style',
        'Right Sidebar', 'Three Column Layout', 'Bold Header Underline', 'Boxed Header', 'Left Accent Bar',
        'Double Border Header', 'Indented Right Margin', 'Narrow Left Column', 'Stacked Boxes', 'Alternating Indent',
        'Wide Header Banner', 'Minimal Dots', 'Top Bottom Borders', 'Condensed Professional', 'Corner Name'
      ],
      'executive': [
        'Dark Left Sidebar', 'Split Two Columns', 'Right Sidebar', 'Minimalist Executive', 'Bold Header Banner',
        'Corporate Layout', 'Professional Split', 'Timeline Left Border', 'Centered Header Banner', 'Gradient Cards',
        'Split Contact Info', 'Wide Left Sidebar', 'Indigo Professional', 'Slate Corporate', 'Gray Executive',
        'Blue Leadership', 'Slate Premium', 'Indigo Elite', 'Gray Senior', 'Slate Professional'
      ],
      'modern': [
        'Blue Left Sidebar', 'Teal Right Cards', 'Purple Split Screen', 'Orange Rounded Header', 'Green Grid Cards',
        'Indigo Header Bar', 'Pink Header Bar', 'Cyan Header Bar', 'Red Split Modern', 'Emerald Split Modern',
        'Violet Split Modern', 'Rose Grid Cards', 'Sky Grid Cards', 'Amber Grid Cards', 'Lime Timeline',
        'Fuchsia Timeline', 'Yellow Timeline', 'Slate Asymmetric', 'Gray Asymmetric', 'Zinc Asymmetric'
      ],
      'creative': [
        'Pink-Purple Gradient', 'Blue Gradient Boxes', 'Emerald Top Banner', 'Diagonal Rose Split', 'Ocean Gradient',
        'Sunset Colors', 'Forest Tones', 'Sky Blue Creative', 'Vibrant Multi', 'Bold Gradients',
        'Artistic Layout', 'Creative Grid', 'Designer Style', 'Portfolio Format', 'Colorful Sections',
        'Visual Impact', 'Creative Boxes', 'Gradient Flow', 'Artistic Grid', 'Bold Creative'
      ],
      'minimal': [
        'Ultra Clean Single', 'Two Equal Columns', 'Left Accent Bar', 'Spaced Sections', 'Light & Airy',
        'Minimalist Grid', 'Simple Clean', 'Modern Minimal', 'Clean Lines', 'White Space',
        'Elegant Minimal', 'Pure Simple', 'Subtle Layout', 'Clean Grid', 'Minimal Professional',
        'Simple Structure', 'Clean Format', 'Minimal Design', 'Pure Layout', 'Essential Style'
      ]
    };

    const allTemplates: any[] = [];
    
    types.forEach(({ type, name, icon, color }) => {
      for (let i = 1; i <= 20; i++) {
        allTemplates.push({
          id: `${type}-${i}`,
          type: type,
          variety: i,
          name: `${name} ${i}`,
          description: varietyDescriptions[type][i - 1],
          icon: icon,
          color: color
        });
      }
    });

    return allTemplates;
  };

  const templates = generateTemplates();

  const handleExport = async (format: string) => {
    // Prevent multiple simultaneous exports
    if (isExporting) {
      toast.warning('Export already in progress. Please wait...');
      return;
    }

    // Get the current template name
    const template = templates.find(t => t.id === selectedTemplate);
    const templateName = template ? template.description : 'Selected Template';
    
    // Remove any existing extension from fileName
    const baseFileName = fileName 
      ? fileName.replace(/\.(pdf|docx?|txt)$/i, '') 
      : 'resume';
    
    // Set loading state immediately
    setIsExporting(true);
    toast.info(`Preparing to export as ${format.toUpperCase()}...`);
    
    // Defer the heavy processing to allow UI to update
    setTimeout(async () => {
      try {
        if (format === 'pdf') {
          // Find the rendered template element
          const templateElement = document.querySelector('[data-resume-template]') as HTMLElement;
          
          if (!templateElement) {
            console.error('Template element not found in DOM');
            throw new Error('Template not found. Please try again.');
          }

          // Check if template has content
          const hasContent = templateElement.children.length > 0;
          console.log('Template element found', { 
            hasContent, 
            childrenCount: templateElement.children.length,
            width: templateElement.offsetWidth,
            height: templateElement.offsetHeight
          });

          if (!hasContent) {
            throw new Error('Template is empty. Please ensure your resume content is loaded.');
          }

          console.log('Starting PDF generation...', { templateName, fileName: baseFileName });
          toast.info(`Generating PDF with ${templateName} styling...`, { duration: 10000 });

          try {
            // Verify html2canvas is available
            if (typeof html2canvas === 'undefined') {
              throw new Error('PDF library not loaded. Please refresh the page and try again.');
            }

            // Use html2canvas to capture the resume as an image
            console.log('Capturing resume with html2canvas...');
            const canvas = await html2canvas(templateElement, {
              scale: 2, // Higher quality
              useCORS: true,
              logging: false, // Disable logging for cleaner console
              backgroundColor: '#ffffff',
              windowWidth: 816, // 8.5 inches at 96 DPI
              width: 816
            });

            console.log('Canvas created successfully', { width: canvas.width, height: canvas.height });

            // Verify canvas has content
            if (canvas.width === 0 || canvas.height === 0) {
              throw new Error('Canvas rendering failed - dimensions are zero');
            }

            // Calculate PDF dimensions
            const imgWidth = 210; // A4 width in mm (8.5 inches)
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            console.log('Creating PDF...', { imgWidth, imgHeight });
            
            // Create PDF
            const pdf = new jsPDF({
              orientation: 'portrait',
              unit: 'mm',
              format: 'letter'
            });

            // Add the canvas image to PDF
            console.log('Converting canvas to image...');
            const imgData = canvas.toDataURL('image/jpeg', 0.98);
            
            if (!imgData || imgData.length < 100) {
              throw new Error('Failed to convert canvas to image');
            }
            
            console.log('Adding image to PDF...');
            pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);

            // Save the PDF
            console.log('Saving PDF file...');
            pdf.save(`${baseFileName}.pdf`);
            
            console.log('PDF saved successfully');
            toast.success(`Resume exported as PDF with ${templateName} styling!`);
          } catch (pdfError) {
            console.error('PDF generation error:', pdfError);
            throw new Error(`Failed to generate PDF: ${pdfError instanceof Error ? pdfError.message : 'Unknown error'}`);
          }
        } else if (format === 'txt') {
          // Plain text export
          const blob = new Blob([resumeContent], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${baseFileName}.txt`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          toast.success(`Resume exported as TXT!`);
        } else if (format === 'docx') {
          // For DOCX, download as text with .docx extension as a placeholder
          // In production, you would use a library like docx to create proper Word documents
          const blob = new Blob([resumeContent], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${baseFileName}.docx`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          toast.success(`Resume exported as DOCX!`);
        }
      } catch (error) {
        console.error('Export error:', error);
        toast.error(`Failed to export resume: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        // Always reset loading state
        setIsExporting(false);
      }
    }, 100); // Small delay to allow UI to update
  };

  const handleSaveVersion = () => {
    onSave();
    toast.success('Resume version saved to dashboard!');
  };

  const handlePrint = () => {
    const template = templates.find(t => t.id === selectedTemplate);
    const templateName = template ? template.description : 'Selected Template';
    toast.info(`Printing resume with ${templateName}...`);
    
    // Give browser time to render before printing
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const renderTemplate = () => {
    const template = templates.find(t => t.id === selectedTemplate);
    if (!template) return <ATSVariety content={resumeContent} variety={1} />;

    switch (template.type) {
      case 'executive':
        return <ExecutiveVariety content={resumeContent} variety={template.variety} />;
      case 'modern':
        return <ModernVariety content={resumeContent} variety={template.variety} />;
      case 'creative':
        return <CreativeVariety content={resumeContent} variety={template.variety} />;
      case 'minimal':
        return <MinimalistVariety content={resumeContent} variety={template.variety} />;
      case 'ats':
      default:
        return <ATSVariety content={resumeContent} variety={template.variety} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative">
      {/* Loading Overlay */}
      {isExporting && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 shadow-2xl flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-center">
              <p className="text-xl font-semibold text-gray-900">Generating PDF...</p>
              <p className="text-sm text-gray-600 mt-2">This may take a few seconds</p>
              <p className="text-xs text-gray-500 mt-1">Please wait while we create your beautiful resume</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button onClick={onBack} variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2.5 rounded-xl">
              <Eye className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl">Resume Preview & Export</h1>
              <p className="text-sm text-gray-600">
                Choose a template and export your resume
              </p>
            </div>
          </div>

          <Button 
            onClick={onDashboard}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            Go to Dashboard
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Controls Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Template Selector */}
            <Card className="p-6">
              <h3 className="mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Choose Template
              </h3>
              
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-2">
                  {[
                    { type: 'ats', name: 'ATS-Friendly', icon: Shield, color: 'from-blue-600 to-blue-700', desc: 'Optimized for applicant tracking systems' },
                    { type: 'executive', name: 'Executive', icon: Briefcase, color: 'from-slate-700 to-slate-900', desc: 'Premium dark header with sidebar' },
                    { type: 'modern', name: 'Modern Two-Column', icon: Layout, color: 'from-teal-600 to-teal-700', desc: 'Colorful side profile layout' },
                    { type: 'creative', name: 'Creative Gradient', icon: Palette, color: 'from-purple-600 to-pink-600', desc: 'Bold colors and artistic design' },
                    { type: 'minimal', name: 'Minimalist', icon: Sparkles, color: 'from-gray-700 to-gray-900', desc: 'Ultra-clean spacious layout' }
                  ].map(category => {
                    const Icon = category.icon;
                    const categoryTemplates = templates.filter(t => t.type === category.type);
                    const isExpanded = expandedCategory === category.type;
                    const hasSelected = categoryTemplates.some(t => t.id === selectedTemplate);
                    
                    return (
                      <Collapsible
                        key={category.type}
                        open={isExpanded}
                        onOpenChange={(open) => {
                          setExpandedCategory(open ? category.type : '');
                          // Auto-select first template when expanding category
                          if (open && categoryTemplates.length > 0) {
                            setSelectedTemplate(categoryTemplates[0].id);
                          }
                        }}
                      >
                        <CollapsibleTrigger className="w-full">
                          <div className={`w-full p-4 rounded-xl border-2 transition-all ${
                            hasSelected 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}>
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg bg-gradient-to-br ${category.color} flex-shrink-0`}>
                                <Icon className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1 text-left">
                                <div className="font-semibold flex items-center gap-2">
                                  {category.name}
                                  {hasSelected && <Check className="w-4 h-4 text-blue-600" />}
                                </div>
                                <p className="text-xs text-gray-600">{category.desc}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">20</Badge>
                                {isExpanded ? (
                                  <ChevronDown className="w-5 h-5 text-gray-500" />
                                ) : (
                                  <ChevronRight className="w-5 h-5 text-gray-500" />
                                )}
                              </div>
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent>
                          <div className="mt-2 ml-4 pl-4 border-l-2 border-gray-200 space-y-1 pb-2">
                            {categoryTemplates.map(template => (
                              <button
                                key={template.id}
                                onClick={() => {
                                  setSelectedTemplate(template.id);
                                  setExpandedCategory(category.type);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-lg transition-all text-sm ${
                                  selectedTemplate === template.id
                                    ? 'bg-blue-600 text-white font-medium'
                                    : 'hover:bg-gray-100 text-gray-700'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span>{template.description}</span>
                                  {selectedTemplate === template.id && (
                                    <Check className="w-4 h-4" />
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
                </div>
              </ScrollArea>
            </Card>

            {/* Export Options */}
            <Card className="p-6">
              <h3 className="mb-4 flex items-center gap-2">
                <Download className="w-5 h-5" />
                Export Options
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm mb-2 block">Format</label>
                  <Select value={exportFormat} onValueChange={setExportFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF Document</SelectItem>
                      <SelectItem value="docx">Word Document (.docx)</SelectItem>
                      <SelectItem value="txt">Plain Text (.txt)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={() => handleExport(exportFormat)}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileDown className="w-4 h-4 mr-2" />
                      Export as {exportFormat.toUpperCase()}
                    </>
                  )}
                </Button>

                <Button 
                  onClick={handlePrint}
                  variant="outline"
                  className="w-full"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print Resume
                </Button>

                <Button 
                  onClick={handleSaveVersion}
                  variant="outline"
                  className="w-full"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save to Dashboard
                </Button>
              </div>
            </Card>

            {/* Quick Stats */}
            <Card className="p-6 bg-purple-50 border-purple-200">
              <h3 className="mb-3 text-purple-900">Resume Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-purple-700">Word Count:</span>
                  <span className="text-purple-900">
                    {resumeContent.split(/\s+/).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700">Characters:</span>
                  <span className="text-purple-900">
                    {resumeContent.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700">Sections:</span>
                  <span className="text-purple-900">
                    {resumeContent.match(/^[A-Z\s]+$/gm)?.length || 4}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700">Template:</span>
                  <span className="text-purple-900 capitalize">
                    {selectedTemplate}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Preview */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl">Live Preview</h3>
                <Badge variant="secondary" className="capitalize">{selectedTemplate} template</Badge>
              </div>

              <Tabs defaultValue="formatted" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="formatted">Formatted</TabsTrigger>
                  <TabsTrigger value="raw">Raw Text</TabsTrigger>
                </TabsList>

                <TabsContent value="formatted">
                  <CopyProtection>
                    <ScrollArea className="h-[800px] w-full">
                      <div className="bg-gray-100 p-8">
                        <div data-resume-template>
                          {renderTemplate()}
                        </div>
                      </div>
                    </ScrollArea>
                  </CopyProtection>
                </TabsContent>

                <TabsContent value="raw">
                  <CopyProtection>
                    <ScrollArea className="h-[800px] w-full rounded-lg border p-6 bg-gray-50">
                      <pre className="whitespace-pre-wrap text-sm">
                        {resumeContent}
                      </pre>
                    </ScrollArea>
                  </CopyProtection>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
