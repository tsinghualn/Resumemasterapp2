import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface PersonalDetailsDisplayProps {
  personalData: {
    firstName?: string;
    lastName?: string;
    jobTitle?: string;
    nationality?: string;
    driversLicense?: string;
    birthDate?: string;
    photoUrl?: string;
    contact?: string;
  };
  isEditing?: boolean;
  onUpdate?: (field: string, value: string) => void;
}

export function PersonalDetailsDisplay({
  personalData,
  isEditing = false,
  onUpdate = () => {}
}: PersonalDetailsDisplayProps) {
  const [isAdditionalDetailsOpen, setIsAdditionalDetailsOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* Personal Details Section */}
      <div>
        <h4 className="text-sm mb-3">Personal details</h4>
        
        {/* First Name and Last Name */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <Label htmlFor="firstName" className="text-xs text-gray-600">
              First name
            </Label>
            <Input
              id="firstName"
              value={personalData.firstName || ''}
              onChange={(e) => onUpdate('firstName', e.target.value)}
              placeholder="Na (Anna)"
              className="mt-1 text-sm"
              disabled={!isEditing}
            />
          </div>
          <div>
            <Label htmlFor="lastName" className="text-xs text-gray-600">
              Last name
            </Label>
            <Input
              id="lastName"
              value={personalData.lastName || ''}
              onChange={(e) => onUpdate('lastName', e.target.value)}
              placeholder="Li"
              className="mt-1 text-sm"
              disabled={!isEditing}
            />
          </div>
        </div>

        {/* Desired job title */}
        <div className="mb-3">
          <Label htmlFor="jobTitle" className="text-xs text-gray-600">
            Desired job title
          </Label>
          <Input
            id="jobTitle"
            value={personalData.jobTitle || ''}
            onChange={(e) => onUpdate('jobTitle', e.target.value)}
            placeholder="Product Designer"
            className="mt-1 text-sm"
            disabled={!isEditing}
          />
        </div>

        {/* Collapsible Additional Details */}
        <Collapsible open={isAdditionalDetailsOpen} onOpenChange={setIsAdditionalDetailsOpen}>
          <CollapsibleTrigger asChild>
            <button
              className="w-full text-left py-2 px-3 hover:bg-gray-100 rounded flex items-center gap-2 text-sm"
            >
              <div className="w-4 h-0.5 bg-gray-900" />
              <span className="flex-1">{isAdditionalDetailsOpen ? 'Hide' : 'Show'} additional details</span>
              <ChevronDown 
                className={`w-4 h-4 text-gray-600 transition-transform ${
                  isAdditionalDetailsOpen ? 'rotate-180' : ''
                }`} 
              />
            </button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-3 pt-3">
            {/* Nationality and Driver's License */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="nationality" className="text-xs text-gray-600">
                  Nationality
                </Label>
                <Input
                  id="nationality"
                  value={personalData.nationality || ''}
                  onChange={(e) => onUpdate('nationality', e.target.value)}
                  placeholder="American"
                  className="mt-1 text-sm"
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="driversLicense" className="text-xs text-gray-600">
                  Driver's License
                </Label>
                <Input
                  id="driversLicense"
                  value={personalData.driversLicense || ''}
                  onChange={(e) => onUpdate('driversLicense', e.target.value)}
                  placeholder="D74837465"
                  className="mt-1 text-sm"
                  disabled={!isEditing}
                />
              </div>
            </div>

            {/* Birth date */}
            <div>
              <Label htmlFor="birthDate" className="text-xs text-gray-600">
                Birth date
              </Label>
              <Input
                id="birthDate"
                value={personalData.birthDate || ''}
                onChange={(e) => onUpdate('birthDate', e.target.value)}
                placeholder="03 Feb 1996"
                className="mt-1 text-sm"
                disabled={!isEditing}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Contact Information Section */}
      <div className="pt-3 border-t border-gray-200">
        <h4 className="text-sm mb-3">Contact Information</h4>
        <div>
          <Label htmlFor="contact" className="text-xs text-gray-600">
            Contact details
          </Label>
          <Textarea
            id="contact"
            value={personalData.contact || ''}
            onChange={(e) => onUpdate('contact', e.target.value)}
            placeholder="Email: john@example.com&#10;Phone: (555) 123-4567&#10;Location: San Francisco, CA"
            className="mt-1 text-sm min-h-[100px] resize-none"
            disabled={!isEditing}
          />
        </div>
      </div>
    </div>
  );
}
