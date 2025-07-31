import { useState } from "react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface DateRangeFilterProps {
  onFilterChange: (filter: string, range?: DateRange) => void;
  dateFilter: string;
  dateRange: DateRange | undefined;
}

export function DateRangeFilter({
  onFilterChange,
  dateFilter,
  dateRange,
}: DateRangeFilterProps) {
  const [startDate, setStartDate] = useState(dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : "");
  const [endDate, setEndDate] = useState(dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : "");

  const handleFilterChange = (value: string) => {
    if (value !== "custom") {
      onFilterChange(value);
      setStartDate("");
      setEndDate("");
    }
  };

  const handleDateRangeChange = () => {
    if (startDate && endDate) {
      const range: DateRange = {
        from: new Date(startDate),
        to: new Date(endDate)
      };
      onFilterChange("custom", range);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-2 items-start md:items-center">
      <Select value={dateFilter} onValueChange={handleFilterChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by date" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Time</SelectItem>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="week">This Week</SelectItem>
          <SelectItem value="month">This Month</SelectItem>
          <SelectItem value="custom">Custom Range</SelectItem>
        </SelectContent>
      </Select>

      {dateFilter === "custom" && (
        <div className="flex flex-col md:flex-row gap-2 items-start md:items-center">
          <div className="flex flex-col">
            <label htmlFor="start-date" className="text-sm font-medium mb-1">From:</label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (e.target.value && endDate) {
                  setTimeout(handleDateRangeChange, 100);
                }
              }}
              className="w-full md:w-auto"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="end-date" className="text-sm font-medium mb-1">To:</label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                if (startDate && e.target.value) {
                  setTimeout(handleDateRangeChange, 100);
                }
              }}
              className="w-full md:w-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
} 