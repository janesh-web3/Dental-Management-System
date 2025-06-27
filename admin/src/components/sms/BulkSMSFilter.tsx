import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Filter, X } from "lucide-react";
import { format } from 'date-fns';
import { cn } from "@/lib/utils";

interface DateRange {
  from: Date | null;
  to: Date | null;
}

interface BulkSMSFilters {
  treatmentStatus: string;
  gender: string;
  group: string;
  procedure: string;
  dateRange: DateRange;
}

interface BulkSMSFilterProps {
  onFilter: (filters: Omit<BulkSMSFilters, 'dateRange'> & { 
    dateRange: { from: string; to: string } 
  }) => void;
  onReset: () => void;
  loading?: boolean;
}

export function BulkSMSFilter({ 
  onFilter, 
  onReset, 
  loading = false
}: BulkSMSFilterProps) {
  const procedureOptions = [
    { value: 'all', label: 'All Procedures' },
    { value: 'RVG X-Ray', label: 'RVG X-Ray' },
    { value: 'Scaling', label: 'Scaling' },
    { value: 'GIC', label: 'GIC' },
    { value: 'Light Cure', label: 'Light Cure' },
    { value: 'Extraction', label: 'Tooth Extraction' },
    { value: 'DCM', label: 'DCM' },
    { value: 'RCT', label: 'RCT' },
    { value: 'RPD', label: 'RPD' },
    { value: 'Complete Denture', label: 'Complete Denture' },
    { value: 'Crown Bridge(Metal)', label: 'Crown Bridge (Metal)' },
    { value: 'Crown Bridge(Ceramic)', label: 'Crown Bridge (Ceramic)' },
    { value: 'Crown Bridge(Zirconia)', label: 'Crown Bridge (Zirconia)' },
    { value: 'Full Mouth Bridge', label: 'Full Mouth Bridge' },
    { value: 'Implant', label: 'Dental Implant' },
    { value: 'Orthodontics', label: 'Orthodontic Treatment' },
    { value: 'IMF', label: 'IMF' },
    { value: 'L.C', label: 'L.C' },
    { value: 'Composite Filling', label: 'Composite Filling' },
    { value: 'Restoration', label: 'Restoration' },
    { value: 'Pulpectomy', label: 'Pulpectomy' },
    { value: 'UCC 1', label: 'UCC 1' },
    { value: 'UCC 2', label: 'UCC 2' },
    { value: 'UCC 3', label: 'UCC 3' },
    { value: 'UCC 4', label: 'UCC 4' },
    { value: 'UCC 5', label: 'UCC 5' },
    { value: 'UCC 6', label: 'UCC 6' },
    { value: 'UCC 7', label: 'UCC 7' },
    { value: 'UCC 8', label: 'UCC 8' },
  ];

  const [filters, setFilters] = useState<BulkSMSFilters>({
    treatmentStatus: 'all',
    gender: 'all',
    group: 'all',
    procedure: 'all',
    dateRange: {
      from: null,
      to: null,
    }
  });

  const handleDateChange = (range: { from?: Date; to?: Date } | undefined) => {
    if (!range) return;
    
    setFilters(prev => ({
      ...prev,
      dateRange: {
        from: range.from || null,
        to: range.to || null
      }
    }));
  };

  const handleFilter = () => {
    const { dateRange, ...restFilters } = filters;
    
    onFilter({
      ...restFilters,
      dateRange: {
        from: dateRange.from ? format(new Date(dateRange.from), 'yyyy-MM-dd') : '',
        to: dateRange.to ? format(new Date(dateRange.to), 'yyyy-MM-dd') : ''
      }
    });
  };

  const handleReset = () => {
    setFilters({
      treatmentStatus: 'all',
      gender: 'all',
      group: 'all',
      procedure: 'all',
      dateRange: { from: null, to: null }
    });
    onReset();
  };

  return (
    <div className="space-y-4 bg-muted/50 p-4 rounded-lg">
      <div className="flex items-center justify-between">
        <h3 className="font-medium flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filter Patients
        </h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleReset}
          disabled={loading}
        >
          <X className="h-4 w-4 mr-1" />
          Reset
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Treatment Status */}
        <div className="space-y-2">
          <Label>Treatment Status</Label>
          <Select 
            value={filters.treatmentStatus}
            onValueChange={(value) => setFilters({...filters, treatmentStatus: value})}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="incomplete">Incomplete</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Gender */}
        <div className="space-y-2">
          <Label>Gender</Label>
          <Select 
            value={filters.gender}
            onValueChange={(value) => setFilters({...filters, gender: value})}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genders</SelectItem>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Department Group */}
        <div className="space-y-2">
          <Label>Department</Label>
          <Select 
            value={filters.group}
            onValueChange={(value) => setFilters({...filters, group: value})}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              <SelectItem value="Ortho">Orthodontics</SelectItem>
              <SelectItem value="Endo">Endodontics</SelectItem>
              <SelectItem value="Perio">Periodontics</SelectItem>
              <SelectItem value="Prostho">Prosthodontics</SelectItem>
              <SelectItem value="Surgery">Oral Surgery</SelectItem>
              <SelectItem value="General">General Dentistry</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Procedure */}
        <div className="space-y-2">
          <Label>Procedure</Label>
          <Select 
            value={filters.procedure}
            onValueChange={(value) => setFilters({...filters, procedure: value})}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select procedure" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px] overflow-y-auto">
              {procedureOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Range */}
        <div className="space-y-2">
          <Label>Registration Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !filters.dateRange.from && "text-muted-foreground"
                )}
                disabled={loading}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateRange.from ? (
                  filters.dateRange.to ? (
                    <>
                      {format(filters.dateRange.from, "MMM dd, yyyy")} -{" "}
                      {format(filters.dateRange.to, "MMM dd, yyyy")}
                    </>
                  ) : (
                    format(filters.dateRange.from, "MMM dd, yyyy")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={filters.dateRange?.from || new Date()}
                selected={{
                  from: filters.dateRange?.from || undefined,
                  to: filters.dateRange?.to || undefined
                }}
                onSelect={handleDateChange}
                numberOfMonths={2}
                disabled={loading}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex items-end gap-2">
        <Button 
          variant="outline"
          onClick={handleReset}
          className="flex-1"
          disabled={loading}
        >
          <X className="h-4 w-4 mr-2" />
          Clear All
        </Button>
        <Button 
          onClick={handleFilter} 
          className="flex-1"
          disabled={loading}
        >
          <Filter className="h-4 w-4 mr-2" />
          {loading ? 'Applying...' : 'Apply Filters'}
        </Button>
      </div>
    </div>
  );
}
