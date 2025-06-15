import React from "react";
import { cn } from "@/lib/utils";

interface NepaliDatePickerProps {
  value: string;
  onChange: (date: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function NepaliDatePickerComponent({
  value,
  onChange,
  className,
  placeholder = "Select date",
  disabled = false,
}: NepaliDatePickerProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (inputRef.current) {
      // Dynamically import the Nepali date picker
      import("nepali-date-picker").then((module: any) => {
        const { NepaliDatePicker } = module;
        const datePicker = new NepaliDatePicker({
          input: inputRef.current,
          onChange: (date: string) => {
            onChange(date);
          },
          dateFormat: "YYYY-MM-DD",
          language: "en",
          theme: "light",
          placeholder: placeholder,
          disabled: disabled,
        });

        return () => {
          datePicker.destroy();
        };
      });
    }
  }, [onChange, placeholder, disabled]);

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
} 