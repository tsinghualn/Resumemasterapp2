import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  FileText,
  Award,
  Monitor,
  Medal,
  Globe,
  Users,
  BookOpen,
  Lightbulb,
  Briefcase,
  Plus,
  Sparkles,
} from "lucide-react";

interface PredefinedSection {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: {
    border: string;
    bg: string;
    text: string;
    iconBg: string;
  };
}

const predefinedSections: PredefinedSection[] = [
  {
    id: "summary",
    title: "Professional Summary",
    description: "Career overview and key qualifications",
    icon: Sparkles,
    color: {
      border: "border-rose-300",
      bg: "bg-rose-50",
      text: "text-rose-600",
      iconBg: "bg-rose-100",
    },
  },
  {
    id: "publications",
    title: "Publications",
    description: "Research papers, articles, books",
    icon: FileText,
    color: {
      border: "border-blue-300",
      bg: "bg-blue-50",
      text: "text-blue-600",
      iconBg: "bg-blue-100",
    },
  },
  {
    id: "patents",
    title: "Patents",
    description: "Granted patents and applications",
    icon: Award,
    color: {
      border: "border-purple-300",
      bg: "bg-purple-50",
      text: "text-purple-600",
      iconBg: "bg-purple-100",
    },
  },
  {
    id: "presentations",
    title: "Presentations",
    description: "Conference talks, seminars",
    icon: Monitor,
    color: {
      border: "border-teal-300",
      bg: "bg-teal-50",
      text: "text-teal-600",
      iconBg: "bg-teal-100",
    },
  },
  {
    id: "certifications",
    title: "Certifications",
    description: "Professional licenses and certs",
    icon: Medal,
    color: {
      border: "border-orange-300",
      bg: "bg-orange-50",
      text: "text-orange-600",
      iconBg: "bg-orange-100",
    },
  },
  {
    id: "languages",
    title: "Languages",
    description: "Language proficiencies",
    icon: Globe,
    color: {
      border: "border-cyan-300",
      bg: "bg-cyan-50",
      text: "text-cyan-600",
      iconBg: "bg-cyan-100",
    },
  },
  {
    id: "volunteering",
    title: "Volunteering",
    description: "Community service, volunteer work",
    icon: Users,
    color: {
      border: "border-pink-300",
      bg: "bg-pink-50",
      text: "text-pink-600",
      iconBg: "bg-pink-100",
    },
  },
  {
    id: "courses",
    title: "Courses",
    description: "Relevant coursework",
    icon: BookOpen,
    color: {
      border: "border-indigo-300",
      bg: "bg-indigo-50",
      text: "text-indigo-600",
      iconBg: "bg-indigo-100",
    },
  },
  {
    id: "research",
    title: "Research",
    description: "Research projects and experience",
    icon: Lightbulb,
    color: {
      border: "border-amber-300",
      bg: "bg-amber-50",
      text: "text-amber-600",
      iconBg: "bg-amber-100",
    },
  },
  {
    id: "teaching",
    title: "Teaching",
    description: "Teaching experience",
    icon: Briefcase,
    color: {
      border: "border-teal-300",
      bg: "bg-teal-50",
      text: "text-teal-600",
      iconBg: "bg-teal-100",
    },
  },
];

interface AddSectionDialogProps {
  open: boolean;
  onClose: () => void;
  onAddSection: (sectionId: string, title: string) => void;
}

export function AddSectionDialog({
  open,
  onClose,
  onAddSection,
}: AddSectionDialogProps) {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customTitle, setCustomTitle] = useState("");

  const handlePredefinedSelect = (
    section: PredefinedSection,
  ) => {
    onAddSection(section.id, section.title);
    onClose();
  };

  const handleCustomCreate = () => {
    if (customTitle.trim()) {
      onAddSection(`custom-${Date.now()}`, customTitle.trim());
      setCustomTitle("");
      setShowCustomInput(false);
      onClose();
    }
  };

  const handleClose = () => {
    setShowCustomInput(false);
    setCustomTitle("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Add New Resume Section
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Choose from our predefined sections or create your
            own custom section
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6">
          {/* Predefined Sections Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {predefinedSections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() =>
                    handlePredefinedSelect(section)
                  }
                  className={`
                    flex items-start gap-2 p-2.5 rounded-lg border-2 transition-all
                    hover:shadow-md hover:scale-[1.02]
                    ${section.color.border} ${section.color.bg}
                  `}
                >
                  <div
                    className={`p-1.5 rounded-md ${section.color.iconBg} flex-shrink-0`}
                  >
                    <Icon
                      className={`w-4 h-4 ${section.color.text}`}
                    />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <h3
                      className={`text-sm font-semibold mb-0.5 ${section.color.text}`}
                    >
                      {section.title}
                    </h3>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {section.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-dashed border-gray-300"></div>
            </div>
          </div>

          {/* Create Custom Section */}
          {!showCustomInput ? (
            <button
              onClick={() => setShowCustomInput(true)}
              className="w-full flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all"
            >
              <Plus className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-700">
                Create Your Own Section
              </span>
            </button>
          ) : (
            <div className="space-y-4 p-4 rounded-xl border-2 border-gray-300 bg-gray-50">
              <div>
                <Label
                  htmlFor="custom-section-title"
                  className="text-sm font-medium mb-2 block"
                >
                  Custom Section Title
                </Label>
                <Input
                  id="custom-section-title"
                  value={customTitle}
                  onChange={(e) =>
                    setCustomTitle(e.target.value)
                  }
                  placeholder="Enter section title (e.g., Awards, Activities, Hobbies)"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleCustomCreate();
                    }
                  }}
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleCustomCreate}
                  disabled={!customTitle.trim()}
                  className="flex-1"
                >
                  Add Section
                </Button>
                <Button
                  onClick={() => {
                    setShowCustomInput(false);
                    setCustomTitle("");
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}