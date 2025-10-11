import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Filter, X } from "lucide-react";
import { format } from 'date-fns';
import { cn } from "@/lib/utils";
import { useQuery } from '@tanstack/react-query';
import { crudRequest } from '@/lib/api';

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
  dateRangePreset: string;
}

interface FilterPayload {
  treatmentStatus: string;
  gender: string;
  group: string;
  procedure: string;
  dateRange: { from: string; to: string };
  dateRangePreset: string;
}

interface BulkSMSFilterProps {
  onFilter: (filters: FilterPayload) => void;
  onReset: () => void;
  loading?: boolean;
}

interface Doctor {
  _id: string;
  name: string;
}

export function BulkSMSFilter({ 
  onFilter, 
  onReset, 
  loading = false
}: BulkSMSFilterProps) {
  const procedureOptions = [
    { value: 'RVG X-Ray', label: 'RVG X-Ray' },
    { value: 'Scaling', label: 'Scaling' },
    { value: 'GIC', label: 'GIC' },
    { value: 'Light Cure', label: 'Light Cure' },
    { value: 'Extraction', label: 'Tooth Extraction' },
    { value: 'DCM', label: 'DCM' },
    { value: 'RCT', label: 'Root Canal Treatment' },
    { value: 'RPD', label: 'Removable Partial Denture' },
    { value: 'Complete Denture', label: 'Complete Denture' },
    { value: 'Crown Bridge(Metal)', label: 'Crown Bridge (Metal)' },
    { value: 'Crown Bridge(Ceramic)', label: 'Crown Bridge (Ceramic)' },
    { value: 'Crown Bridge(Zirconia)', label: 'Crown Bridge (Zirconia)' },
    { value: 'Full Mouth Bridge', label: 'Full Mouth Bridge' },
    { value: 'Implant', label: 'Dental Implant' },
    { value: 'Orthodontics', label: 'Orthodontic Treatment' },
    { value: 'IMF', label: 'IMF' },
    { value: 'L.C', label: 'Light Cure' },
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
    { value: 'UCC 8', label: 'UCC 8' }
  ].sort((a, b) => a.label.localeCompare(b.label)); // Sort alphabetically

  // Date range presets
  const dateRangePresets = [
    { value: 'today', label: 'Today' },
    { value: 'thisWeek', label: 'This Week' },
    { value: 'thisMonth', label: 'This Month' },
    { value: 'thisYear', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const [filters, setFilters] = useState<BulkSMSFilters>({
    treatmentStatus: 'all',
    gender: 'all',
    group: 'all',
    procedure: 'all',
    dateRange: {
      from: null,
      to: null,
    },
    dateRangePreset: 'all'
  });

  const handleDateChange = (range: { from?: Date | null; to?: Date | null } | undefined) => {
    if (!range) return;
    
    setFilters({
      ...filters,
      dateRange: {
        from: range.from ?? null,
        to: range.to ?? null
      },
      dateRangePreset: 'custom' // Reset to custom when manually selecting dates
    });
  };

  const handleFilter = () => {
    const { dateRange, dateRangePreset, ...restFilters } = filters;
    
    // Handle preset date ranges
    let from = '';
    let to = '';
    
    if (dateRangePreset === 'custom' || dateRangePreset === 'all') {
      // For custom or all, use the selected date range or empty
      from = dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : '';
      to = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : '';
    } else {
      const now = new Date();
      
      switch (dateRangePreset) {
        case 'today':
          from = format(now, 'yyyy-MM-dd');
          to = format(now, 'yyyy-MM-dd');
          break;
        case 'thisWeek': {
          const firstDayOfWeek = new Date(now);
          firstDayOfWeek.setDate(now.getDate() - now.getDay());
          const lastDayOfWeek = new Date(now);
          lastDayOfWeek.setDate(now.getDate() + (6 - now.getDay()));
          from = format(firstDayOfWeek, 'yyyy-MM-dd');
          to = format(lastDayOfWeek, 'yyyy-MM-dd');
          break;
        }
        case 'thisMonth':
          from = format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd');
          to = format(new Date(now.getFullYear(), now.getMonth() + 1, 0), 'yyyy-MM-dd');
          break;
        case 'thisYear':
          from = format(new Date(now.getFullYear(), 0, 1), 'yyyy-MM-dd');
          to = format(new Date(now.getFullYear(), 11, 31), 'yyyy-MM-dd');
          break;
      }
    }

    // Create the filter payload with all required fields
    const filterPayload: FilterPayload = {
      ...restFilters,
      dateRange: { from, to },
      dateRangePreset
    };

    onFilter(filterPayload);
  };

  const handleReset = () => {
    const resetFilters: BulkSMSFilters = {
      treatmentStatus: 'all',
      gender: 'all',
      group: 'all',
      procedure: 'all',
      dateRange: { from: null, to: null },
      dateRangePreset: 'all'
    };
    setFilters(resetFilters);
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
        {/* Date Range Preset */}
        <div className="space-y-2">
          <Label>Date Range</Label>
          <Select 
            value={filters.dateRangePreset}
            onValueChange={(value) => setFilters({...filters, dateRangePreset: value})}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              {dateRangePresets.map((preset) => (
                <SelectItem key={preset.value} value={preset.value}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Custom Date Range */}
        {filters.dateRangePreset === 'custom' && (
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label>From</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.dateRange.from && "text-muted-foreground"
                    )}
                  >
                    {filters.dateRange.from ? (
                      format(new Date(filters.dateRange.from), "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dateRange.from || undefined}
                    onSelect={(date) => {
                      setFilters({
                        ...filters,
                        dateRange: {
                          ...filters.dateRange,
                          from: date ?? null
                        }
                      });
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>To</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.dateRange.to && "text-muted-foreground"
                    )}
                  >
                    {filters.dateRange.to ? (
                      format(new Date(filters.dateRange.to), "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dateRange.to || undefined}
                    onSelect={(date) => {
                      setFilters({
                        ...filters,
                        dateRange: {
                          ...filters.dateRange,
                          to: date ?? null
                        }
                      });
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}

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
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
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
