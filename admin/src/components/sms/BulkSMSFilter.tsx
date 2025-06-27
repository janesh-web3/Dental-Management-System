import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Filter, X } from "lucide-react";
import { format } from 'date-fns';
import { cn } from "@/lib/utils";

// Define DateRange interface locally since it's not in @/types
export interface DateRange {
  from?: Date;
  to?: Date;
}

interface BulkSMSFilters {
  treatmentStatus: string;
  procedures: string[];
  group: string;
  dateRange: DateRange;
  gender: string;
}

interface BulkSMSFilterProps {
  onFilter: (filters: Omit<BulkSMSFilters, 'dateRange'> & { dateRange: { from: string; to: string } }) => void;
  onReset: () => void;
  procedureGroups: Array<{ _id: string; name: string }>;
  loading?: boolean;
}

export function BulkSMSFilter({ 
  onFilter, 
  onReset, 
  procedureGroups = [],
  loading = false
}: BulkSMSFilterProps) {
  const [filters, setFilters] = useState<BulkSMSFilters>({
    treatmentStatus: '',
    procedures: [],
    group: '',
    dateRange: {
      from: undefined,
      to: undefined,
    },
    gender: '',
  });

  const handleFilter = () => {
    const { dateRange, ...restFilters } = filters;
    onFilter({
      ...restFilters,
      dateRange: {
        from: dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : '',
        to: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : ''
      }
    });
  };

  const handleReset = () => {
    setFilters({
      treatmentStatus: '',
      procedures: [],
      group: '',
      dateRange: { from: undefined, to: undefined },
      gender: ''
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Treatment Status */}
        <div className="space-y-2">
          <Label htmlFor="treatmentStatus">Treatment Status</Label>
          <Select 
            value={filters.treatmentStatus}
            onValueChange={(value) => setFilters({...filters, treatmentStatus: value})}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="complete">Complete</SelectItem>
              <SelectItem value="incomplete">Incomplete</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Gender */}
        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Select 
            value={filters.gender}
            onValueChange={(value) => setFilters({...filters, gender: value})}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Procedure Group */}
        <div className="space-y-2">
          <Label htmlFor="group">Procedure Group</Label>
          <Select 
            value={filters.group}
            onValueChange={(value) => setFilters({...filters, group: value})}
            disabled={loading || procedureGroups.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select group" />
            </SelectTrigger>
            <SelectContent>
              {procedureGroups.map((group) => (
                <SelectItem key={group._id} value={group._id}>
                  {group.name}
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
                id="date"
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
                      {format(filters.dateRange.from, "LLL dd, y")} -{" "}
                      {format(filters.dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(filters.dateRange.from, "LLL dd, y")
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
                defaultMonth={filters.dateRange.from}
                selected={{
                  from: filters.dateRange.from,
                  to: filters.dateRange.to,
                }}
                onSelect={(range) => 
                  setFilters({
                    ...filters,
                    dateRange: {
                      from: range?.from,
                      to: range?.to
                    }
                  })
                }
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={handleFilter}
          disabled={loading}
        >
          {loading ? 'Applying Filters...' : 'Apply Filters'}
        </Button>
      </div>
    </div>
  );
}
