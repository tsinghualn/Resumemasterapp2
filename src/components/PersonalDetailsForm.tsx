import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { User, ChevronDown, Camera } from 'lucide-react';

interface PersonalDetailsFormProps {
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  nationality?: string;
  driversLicense?: string;
  birthDate?: string;
  photoUrl?: string;
  onUpdate: (field: string, value: string) => void;
}

export function PersonalDetailsForm({
  firstName = '',
  lastName = '',
  jobTitle = '',
  nationality = '',
  driversLicense = '',
  birthDate = '',
  photoUrl = '',
  onUpdate
}: PersonalDetailsFormProps) {
  const [isAdditionalDetailsOpen, setIsAdditionalDetailsOpen] = useState(false);

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <User className="w-5 h-5 text-blue-600" />
        <h2 className="text-xl flex-1">Personal details</h2>
      </div>
      
      <p className="text-sm text-gray-600 mb-6">
        Personal details such as name and job title are essential in a resume to give the recruiter a quick overview of the candidate.
      </p>

      <div className="space-y-4">
        {/* First Name and Last Name */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName" className="text-sm text-gray-600">
              First name
            </Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => onUpdate('firstName', e.target.value)}
              placeholder="Na (Anna)"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="lastName" className="text-sm text-gray-600">
              Last name
            </Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => onUpdate('lastName', e.target.value)}
              placeholder="Li"
              className="mt-1.5"
            />
          </div>
        </div>

        {/* Desired job title and Add photo */}
        <div className="grid grid-cols-[1fr_auto] gap-4 items-end">
          <div>
            <Label htmlFor="jobTitle" className="text-sm text-gray-600">
              Desired job title
            </Label>
            <Input
              id="jobTitle"
              value={jobTitle}
              onChange={(e) => onUpdate('jobTitle', e.target.value)}
              placeholder="Product Designer"
              className="mt-1.5"
            />
          </div>
          <Button variant="outline" className="h-10 px-6 bg-gray-50">
            <Camera className="w-4 h-4 mr-2" />
            Add photo
          </Button>
        </div>

        {/* Hide additional details collapsible */}
        <Collapsible open={isAdditionalDetailsOpen} onOpenChange={setIsAdditionalDetailsOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start text-left h-auto py-3 px-4 hover:bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-2 w-full">
                <div className="w-6 h-0.5 bg-gray-900" />
                <span className="flex-1">{isAdditionalDetailsOpen ? 'Hide' : 'Show'} additional details</span>
                <ChevronDown 
                  className={`w-4 h-4 text-gray-600 transition-transform ${
                    isAdditionalDetailsOpen ? 'rotate-180' : ''
                  }`} 
                />
              </div>
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-4 pt-4">
            {/* Nationality and Driver's License */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nationality" className="text-sm text-gray-600">
                  Nationality
                </Label>
                <Input
                  id="nationality"
                  value={nationality}
                  onChange={(e) => onUpdate('nationality', e.target.value)}
                  placeholder="American"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="driversLicense" className="text-sm text-gray-600">
                  Driver's License
                </Label>
                <Input
                  id="driversLicense"
                  value={driversLicense}
                  onChange={(e) => onUpdate('driversLicense', e.target.value)}
                  placeholder="D74837465"
                  className="mt-1.5"
                />
              </div>
            </div>

            {/* Birth date */}
            <div>
              <Label htmlFor="birthDate" className="text-sm text-gray-600">
                Birth date
              </Label>
              <Input
                id="birthDate"
                value={birthDate}
                onChange={(e) => onUpdate('birthDate', e.target.value)}
                placeholder="03 Feb 1996"
                className="mt-1.5"
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </Card>
  );
}
