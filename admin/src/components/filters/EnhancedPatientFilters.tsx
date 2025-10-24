import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Slider } from "@/components/ui/slider";
import { crudRequest } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";
import {
  Filter,
  Search,
  Calendar as CalendarIcon,
  X,
  RotateCcw,
  Save,
  Bookmark,
  Eye,
  EyeOff
} from 'lucide-react';

export interface PatientFilterState {
  // Basic Info
  search: string;
  name: string;
  phoneNumber: string;
  email: string;

  // Demographics
  gender: string;
  patientStatus: string;
  ageRange: {
    min: number;
    max: number;
  };
  bloodGroup: string;
  maritalStatus: string;

  // Location
  address: string;
  city: string;
  district: string;

  // Dates
  registrationDateRange: {
    from: Date | null;
    to: Date | null;
  };
  followUpDateRange: {
    from: Date | null;
    to: Date | null;
  };
  lastVisitDateRange: {
    from: Date | null;
    to: Date | null;
  };

  // Medical
  treatmentStatus: string[];
  treatmentTypes: string[];
  treatmentProgress: string;
  hasAllergies: boolean | null;
  hasMedicalHistory: boolean | null;

  // Financial
  paymentStatus: string;
  totalDueRange: {
    min: number;
    max: number;
  };
  totalPaidRange: {
    min: number;
    max: number;
  };
  paymentMethods: string[];
  hasOutstandingBalance: boolean | null;

  // Doctor/Assignment
  assignedDoctor: string;
  treatedByDoctor: string[];

  // Status
  isActive: boolean | null;
  hasUpcomingAppointment: boolean | null;
  needsFollowUp: boolean | null;

  // Custom Groups
  customTags: string[];
  riskLevel: string;
  priority: string;

  // Communication
  hasValidPhone: boolean | null;
  hasValidEmail: boolean | null;
  smsOptOut: boolean | null;
  emailOptOut: boolean | null;

  // Advanced
  hasXRays: boolean | null;
  hasPrescriptions: boolean | null;
  hasDocuments: boolean | null;
  referralSource: string;
}

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface SavedFilter {
  id: string;
  name: string;
  filters: PatientFilterState;
  createdAt: string;
  isDefault?: boolean;
}

interface EnhancedPatientFiltersProps {
  onFilterChange: (filters: PatientFilterState) => void;
  onClearFilters: () => void;
  initialFilters?: Partial<PatientFilterState>;
  showAdvanced?: boolean;
  showSaveFilter?: boolean;
  className?: string;
}

export const EnhancedPatientFilters: React.FC<EnhancedPatientFiltersProps> = ({
  onFilterChange,
  onClearFilters,
  initialFilters = {},
  showAdvanced = true,
  showSaveFilter = true,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [filterName, setFilterName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Default filter state
  const defaultFilters: PatientFilterState = {
    search: '',
    name: '',
    phoneNumber: '',
    email: '',
    gender: 'all',
    patientStatus: 'all',
    ageRange: { min: 0, max: 100 },
    bloodGroup: 'all',
    maritalStatus: 'all',
    address: '',
    city: '',
    district: 'all',
    registrationDateRange: { from: null, to: null },
    followUpDateRange: { from: null, to: null },
    lastVisitDateRange: { from: null, to: null },
    treatmentStatus: [],
    treatmentTypes: [],
    treatmentProgress: 'all',
    hasAllergies: null,
    hasMedicalHistory: null,
    paymentStatus: 'all',
    totalDueRange: { min: 0, max: 100000 },
    totalPaidRange: { min: 0, max: 100000 },
    paymentMethods: [],
    hasOutstandingBalance: null,
    assignedDoctor: 'all',
    treatedByDoctor: [],
    isActive: null,
    hasUpcomingAppointment: null,
    needsFollowUp: null,
    customTags: [],
    riskLevel: 'all',
    priority: 'all',
    hasValidPhone: null,
    hasValidEmail: null,
    smsOptOut: null,
    emailOptOut: null,
    hasXRays: null,
    hasPrescriptions: null,
    hasDocuments: null,
    referralSource: 'all',
    ...initialFilters
  };

  const [filters, setFilters] = useState<PatientFilterState>(defaultFilters);

  // Fetch filter options data
  const { data: filterOptions } = useQuery({
    queryKey: ['patient-filter-options'],
    queryFn: async () => {
      const response = await crudRequest<{
        doctors: FilterOption[];
        treatmentTypes: FilterOption[];
        paymentMethods: FilterOption[];
        districts: FilterOption[];
        cities: FilterOption[];
        referralSources: FilterOption[];
        tags: FilterOption[];
      }>('GET', '/patients/filter-options');
      return response;
    },
  });

  // Load saved filters
  useEffect(() => {
    const loadSavedFilters = async () => {
      try {
        const response = await crudRequest<{ data: SavedFilter[] }>('GET', '/patients/saved-filters');
        setSavedFilters(response.data || []);
      } catch (error) {
        console.error('Failed to load saved filters:', error);
      }
    };
    loadSavedFilters();
  }, []);

  // Notify parent of filter changes
  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const updateFilter = <K extends keyof PatientFilterState>(
    key: K,
    value: PatientFilterState[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters(defaultFilters);
    onClearFilters();
  };

  const saveFilter = async () => {
    if (!filterName.trim()) return;

    try {
      const response = await crudRequest<{ data: SavedFilter }>('POST', '/patients/saved-filters', {
        name: filterName,
        filters
      });

      setSavedFilters(prev => [...prev, response.data]);
      setFilterName('');
      setShowSaveDialog(false);
    } catch (error) {
      console.error('Failed to save filter:', error);
    }
  };

  const loadFilter = (savedFilter: SavedFilter) => {
    setFilters(savedFilter.filters);
  };

  const deleteFilter = async (filterId: string) => {
    try {
      await crudRequest('DELETE', `/patients/saved-filters/${filterId}`);
      setSavedFilters(prev => prev.filter(f => f.id !== filterId));
    } catch (error) {
      console.error('Failed to delete filter:', error);
    }
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.gender !== 'all') count++;
    if (filters.patientStatus !== 'all') count++;
    if (filters.paymentStatus !== 'all') count++;
    if (filters.assignedDoctor !== 'all') count++;
    if (filters.treatmentStatus.length > 0) count++;
    if (filters.treatmentTypes.length > 0) count++;
    if (filters.registrationDateRange.from || filters.registrationDateRange.to) count++;
    if (filters.followUpDateRange.from || filters.followUpDateRange.to) count++;
    if (filters.isActive !== null) count++;
    if (filters.hasOutstandingBalance !== null) count++;
    return count;
  };

  const renderDateRangePicker = (
    label: string,
    value: { from: Date | null; to: Date | null },
    onChange: (range: { from: Date | null; to: Date | null }) => void
  ) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start text-left font-normal">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value.from ? (
              value.to ? (
                `${format(value.from, "LLL dd")} - ${format(value.to, "LLL dd")}`
              ) : (
                format(value.from, "LLL dd, y")
              )
            ) : (
              "Pick a date range"
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={{ from: value.from!, to: value.to! }}
            onSelect={(range) => onChange({ from: range?.from || null, to: range?.to || null })}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <CardTitle>Patient Filters</CardTitle>
            {getActiveFilterCount() > 0 && (
              <Badge variant="secondary">
                {getActiveFilterCount()} active
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {showSaveFilter && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSaveDialog(true)}
                disabled={getActiveFilterCount() === 0}
              >
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              disabled={getActiveFilterCount() === 0}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Clear
            </Button>
            {showAdvanced && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quick Search */}
        <div className="space-y-2">
          <Label htmlFor="search">Quick Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search by name, phone, or email..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Quick Filters */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="space-y-2">
            <Label>Gender</Label>
            <Select value={filters.gender} onValueChange={(value) => updateFilter('gender', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Patient Status</Label>
            <Select value={filters.patientStatus} onValueChange={(value) => updateFilter('patientStatus', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Patients</SelectItem>
                <SelectItem value="New">New Patients</SelectItem>
                <SelectItem value="Old">Returning Patients</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Payment Status</Label>
            <Select value={filters.paymentStatus} onValueChange={(value) => updateFilter('paymentStatus', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="paid">Fully Paid</SelectItem>
                <SelectItem value="partial">Partially Paid</SelectItem>
                <SelectItem value="due">Has Due</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Doctor</Label>
            <Select value={filters.assignedDoctor} onValueChange={(value) => updateFilter('assignedDoctor', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Doctors</SelectItem>
                {filterOptions?.doctors.map(doctor => (
                  <SelectItem key={doctor.value} value={doctor.value}>
                    {doctor.label}
                    {doctor.count && ` (${doctor.count})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={filters.isActive === null ? 'all' : filters.isActive ? 'active' : 'inactive'}
              onValueChange={(value) => updateFilter('isActive', value === 'all' ? null : value === 'active')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Saved Filters */}
        {savedFilters.length > 0 && (
          <div className="space-y-2">
            <Label>Saved Filters</Label>
            <div className="flex flex-wrap gap-2">
              {savedFilters.map(savedFilter => (
                <div key={savedFilter.id} className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadFilter(savedFilter)}
                    className="text-xs"
                  >
                    <Bookmark className="mr-1 h-3 w-3" />
                    {savedFilter.name}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteFilter(savedFilter.id)}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Advanced Filters */}
        {isExpanded && showAdvanced && (
          <div className="space-y-4 pt-4 border-t">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="medical">Medical</TabsTrigger>
                <TabsTrigger value="financial">Financial</TabsTrigger>
                <TabsTrigger value="dates">Dates</TabsTrigger>
                <TabsTrigger value="communication">Communication</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Age Range</Label>
                    <div className="space-y-2">
                      <Slider
                        value={[filters.ageRange.min, filters.ageRange.max]}
                        onValueChange={([min, max]) => updateFilter('ageRange', { min, max })}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{filters.ageRange.min} years</span>
                        <span>{filters.ageRange.max} years</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Marital Status</Label>
                    <Select value={filters.maritalStatus} onValueChange={(value) => updateFilter('maritalStatus', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="married">Married</SelectItem>
                        <SelectItem value="divorced">Divorced</SelectItem>
                        <SelectItem value="widowed">Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>District</Label>
                    <Select value={filters.district} onValueChange={(value) => updateFilter('district', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Districts</SelectItem>
                        {filterOptions?.districts.map(district => (
                          <SelectItem key={district.value} value={district.value}>
                            {district.label}
                            {district.count && ` (${district.count})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Referral Source</Label>
                    <Select value={filters.referralSource} onValueChange={(value) => updateFilter('referralSource', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sources</SelectItem>
                        {filterOptions?.referralSources.map(source => (
                          <SelectItem key={source.value} value={source.value}>
                            {source.label}
                            {source.count && ` (${source.count})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="medical" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Treatment Progress</Label>
                    <Select value={filters.treatmentProgress} onValueChange={(value) => updateFilter('treatmentProgress', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Progress</SelectItem>
                        <SelectItem value="not_started">Not Started</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="on_hold">On Hold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Risk Level</Label>
                    <Select value={filters.riskLevel} onValueChange={(value) => updateFilter('riskLevel', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Risk Levels</SelectItem>
                        <SelectItem value="low">Low Risk</SelectItem>
                        <SelectItem value="medium">Medium Risk</SelectItem>
                        <SelectItem value="high">High Risk</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label>Medical Conditions</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={filters.hasAllergies === true}
                          onCheckedChange={(checked) => updateFilter('hasAllergies', checked ? true : null)}
                        />
                        <label className="text-sm">Has Allergies</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={filters.hasMedicalHistory === true}
                          onCheckedChange={(checked) => updateFilter('hasMedicalHistory', checked ? true : null)}
                        />
                        <label className="text-sm">Has Medical History</label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Documents & Records</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={filters.hasXRays === true}
                          onCheckedChange={(checked) => updateFilter('hasXRays', checked ? true : null)}
                        />
                        <label className="text-sm">Has X-Rays</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={filters.hasPrescriptions === true}
                          onCheckedChange={(checked) => updateFilter('hasPrescriptions', checked ? true : null)}
                        />
                        <label className="text-sm">Has Prescriptions</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={filters.hasDocuments === true}
                          onCheckedChange={(checked) => updateFilter('hasDocuments', checked ? true : null)}
                        />
                        <label className="text-sm">Has Documents</label>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="financial" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Outstanding Balance</Label>
                    <Select
                      value={filters.hasOutstandingBalance === null ? 'all' : filters.hasOutstandingBalance ? 'yes' : 'no'}
                      onValueChange={(value) => updateFilter('hasOutstandingBalance', value === 'all' ? null : value === 'yes')}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Patients</SelectItem>
                        <SelectItem value="yes">Has Outstanding Balance</SelectItem>
                        <SelectItem value="no">No Outstanding Balance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Total Due Range</Label>
                      <div className="space-y-2">
                        <Slider
                          value={[filters.totalDueRange.min, filters.totalDueRange.max]}
                          onValueChange={([min, max]) => updateFilter('totalDueRange', { min, max })}
                          max={100000}
                          step={1000}
                          className="w-full"
                        />
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>NPR {filters.totalDueRange.min.toLocaleString()}</span>
                          <span>NPR {filters.totalDueRange.max.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Total Paid Range</Label>
                      <div className="space-y-2">
                        <Slider
                          value={[filters.totalPaidRange.min, filters.totalPaidRange.max]}
                          onValueChange={([min, max]) => updateFilter('totalPaidRange', { min, max })}
                          max={100000}
                          step={1000}
                          className="w-full"
                        />
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>NPR {filters.totalPaidRange.min.toLocaleString()}</span>
                          <span>NPR {filters.totalPaidRange.max.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="dates" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {renderDateRangePicker(
                    'Registration Date',
                    filters.registrationDateRange,
                    (range) => updateFilter('registrationDateRange', range)
                  )}
                  {renderDateRangePicker(
                    'Follow-up Date',
                    filters.followUpDateRange,
                    (range) => updateFilter('followUpDateRange', range)
                  )}
                  {renderDateRangePicker(
                    'Last Visit Date',
                    filters.lastVisitDateRange,
                    (range) => updateFilter('lastVisitDateRange', range)
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={filters.hasUpcomingAppointment === true}
                      onCheckedChange={(checked) => updateFilter('hasUpcomingAppointment', checked ? true : null)}
                    />
                    <label className="text-sm">Has Upcoming Appointment</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={filters.needsFollowUp === true}
                      onCheckedChange={(checked) => updateFilter('needsFollowUp', checked ? true : null)}
                    />
                    <label className="text-sm">Needs Follow-up</label>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="communication" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label>Contact Validation</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={filters.hasValidPhone === true}
                          onCheckedChange={(checked) => updateFilter('hasValidPhone', checked ? true : null)}
                        />
                        <label className="text-sm">Has Valid Phone</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={filters.hasValidEmail === true}
                          onCheckedChange={(checked) => updateFilter('hasValidEmail', checked ? true : null)}
                        />
                        <label className="text-sm">Has Valid Email</label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Communication Preferences</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={filters.smsOptOut === false}
                          onCheckedChange={(checked) => updateFilter('smsOptOut', checked ? false : null)}
                        />
                        <label className="text-sm">SMS Allowed</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={filters.emailOptOut === false}
                          onCheckedChange={(checked) => updateFilter('emailOptOut', checked ? false : null)}
                        />
                        <label className="text-sm">Email Allowed</label>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Save Filter Dialog */}
        {showSaveDialog && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <div className="space-y-2">
              <Label htmlFor="filter-name">Filter Name</Label>
              <Input
                id="filter-name"
                placeholder="Enter a name for this filter..."
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" size="sm" onClick={() => setShowSaveDialog(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={saveFilter} disabled={!filterName.trim()}>
                Save Filter
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedPatientFilters;