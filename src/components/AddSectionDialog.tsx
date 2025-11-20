import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Plus, FileText, Briefcase, Award, Users, Globe, BookOpen, Presentation, LightbulbIcon } from 'lucide-react';
import { Card } from './ui/card';

interface AddSectionDialogProps {
  onAddSection: (title: string) => void;
}

export function AddSectionDialog({ onAddSection }: AddSectionDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Predefined section options
  const predefinedSections = [
    {
      title: 'Publications',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      borderColor: 'border-blue-200',
      description: 'Research papers, articles, books'
    },
    {
      title: 'Patents',
      icon: Award,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 hover:bg-purple-100',
      borderColor: 'border-purple-200',
      description: 'Granted patents and applications'
    },
    {
      title: 'Presentations',
      icon: Presentation,
      color: 'text-green-600',
      bgColor: 'bg-green-50 hover:bg-green-100',
      borderColor: 'border-green-200',
      description: 'Conference talks, seminars'
    },
    {
      title: 'Certifications',
      icon: Award,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 hover:bg-amber-100',
      borderColor: 'border-amber-200',
      description: 'Professional licenses and certs'
    },
    {
      title: 'Languages',
      icon: Globe,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50 hover:bg-teal-100',
      borderColor: 'border-teal-200',
      description: 'Language proficiencies'
    },
    {
      title: 'Volunteering',
      icon: Users,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50 hover:bg-pink-100',
      borderColor: 'border-pink-200',
      description: 'Community service, volunteer work'
    },
    {
      title: 'Courses',
      icon: BookOpen,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 hover:bg-indigo-100',
      borderColor: 'border-indigo-200',
      description: 'Relevant coursework'
    },
    {
      title: 'Research',
      icon: LightbulbIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 hover:bg-orange-100',
      borderColor: 'border-orange-200',
      description: 'Research projects and experience'
    },
    {
      title: 'Teaching',
      icon: Briefcase,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50 hover:bg-cyan-100',
      borderColor: 'border-cyan-200',
      description: 'Teaching experience'
    }
  ];

  const handleSelectPredefined = (title: string) => {
    onAddSection(title);
    setIsOpen(false);
  };

  const handleCustomSection = () => {
    if (customTitle.trim()) {
      onAddSection(customTitle.trim());
      setCustomTitle('');
      setShowCustomInput(false);
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full border-dashed border-2 border-blue-300 hover:border-blue-400 hover:bg-blue-50 text-blue-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Section
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Resume Section</DialogTitle>
          <DialogDescription>
            Choose from our predefined sections or create your own custom section
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Predefined Sections Grid */}
          <div className="grid grid-cols-2 gap-3">
            {predefinedSections.map((section) => {
              const Icon = section.icon;
              return (
                <Card
                  key={section.title}
                  className={`p-4 cursor-pointer transition-all ${section.bgColor} border-2 ${section.borderColor}`}
                  onClick={() => handleSelectPredefined(section.title)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg bg-white`}>
                      <Icon className={`w-5 h-5 ${section.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-medium ${section.color}`}>{section.title}</h3>
                      <p className="text-xs text-gray-600 mt-1">{section.description}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Custom Section */}
          <div className="border-t pt-4">
            {!showCustomInput ? (
              <Button
                variant="outline"
                className="w-full border-dashed border-2"
                onClick={() => setShowCustomInput(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your Own Section
              </Button>
            ) : (
              <div className="space-y-3">
                <Label htmlFor="customTitle">Custom Section Title</Label>
                <Input
                  id="customTitle"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g., Military Service, Honors, Licenses..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCustomSection();
                    }
                  }}
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button onClick={handleCustomSection} className="flex-1">
                    Add Section
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCustomInput(false);
                      setCustomTitle('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
