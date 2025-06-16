import React from "react";
import $ from "jquery";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Import nepali-date-picker CSS only (JS will be loaded dynamically)
import "nepali-date-picker/dist/nepaliDatePicker.min.css";

// Declare jQuery on window object for TypeScript
declare global {
  interface Window {
    $: JQueryStatic;
    jQuery: JQueryStatic;
  }
  interface JQuery {
    nepaliDatePicker: (options?: NepaliDatePickerOptions | string) => JQuery;
  }
}

// Define NepaliDatePickerOptions type
interface NepaliDatePickerOptions {
  onChange?: (date: string) => void;
  dateFormat?: string;
  ndpYear?: boolean;
  ndpMonth?: boolean;
  ndpYearCount?: number;
  disableBefore?: string | null;
  disableAfter?: string | null;
  readOnlyInput?: boolean;
}

// Make jQuery available globally for plugins that expect it
if (typeof window !== "undefined") {
  window.$ = window.jQuery = $;
}

interface NepaliDatePickerProps {
  value?: string;
  onChange: (date: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function NepaliDatePickerComponent({
  value = "",
  onChange,
  placeholder = "Select date",
  disabled = false,
  className = "",
}: NepaliDatePickerProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = React.useState(value);
  const [isPluginLoaded, setIsPluginLoaded] = React.useState(false);

  React.useEffect(() => {
    setInputValue(value);
  }, [value]);

  React.useEffect(() => {
    if (inputRef.current) {
      // Dynamically import the nepali date picker JS after jQuery is available
      import("nepali-date-picker/dist/nepaliDatePicker.min.js" as any).then(() => {
        // Initialize the nepali date picker using jQuery plugin syntax
        if (inputRef.current && typeof $.fn.nepaliDatePicker === 'function') {
          try {
            // Clear any existing value that might cause "Invalid nepali number" error
            $(inputRef.current).val('');
            
            $(inputRef.current).nepaliDatePicker({
              onChange: (date: string) => {
                setInputValue(date);
                onChange(date);
              },
              dateFormat: "%y-%m-%d",  // Format as YYYY-MM-DD
              ndpYear: true,
              ndpMonth: true,
              ndpYearCount: 10,
              disableBefore: null,
              disableAfter: null,
              readOnlyInput: disabled
            } as NepaliDatePickerOptions);

            // Set the value after initialization if we have one
            if (value && inputRef.current) {
              $(inputRef.current).val(value);
              setInputValue(value);
            }
            
            setIsPluginLoaded(true);
          } catch (error) {
            console.error('Error initializing nepali date picker:', error);
          }
        }
      }).catch((error) => {
        console.error('Error loading nepali date picker:', error);
      });

      // Clean up function
      return () => {
        // Remove the date picker when component unmounts
        if (inputRef.current && typeof $.fn.nepaliDatePicker === 'function') {
          try {
            $(inputRef.current).nepaliDatePicker('remove');
          } catch (e) {
            console.error('Error removing nepali date picker', e);
          }
        }
      };
    }
  }, [disabled]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "bg-background",
          !isPluginLoaded && "animate-pulse",
          className
        )}
        readOnly={false}
      />
      {!isPluginLoaded && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}