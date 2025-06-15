// Global type declarations for third-party modules without TypeScript definitions

declare module 'nepali-date-picker' {
  interface NepaliDatePickerOptions {
    input: HTMLInputElement | null;
    onChange?: (date: string) => void;
    dateFormat?: string;
    language?: 'en' | 'ne';
    theme?: 'light' | 'dark';
    placeholder?: string;
    disabled?: boolean;
    minDate?: string;
    maxDate?: string;
  }

  class NepaliDatePicker {
    constructor(options: NepaliDatePickerOptions);
    destroy(): void;
    getValue(): string;
    setValue(date: string): void;
    enable(): void;
    disable(): void;
  }

  export { NepaliDatePicker, NepaliDatePickerOptions };
}
