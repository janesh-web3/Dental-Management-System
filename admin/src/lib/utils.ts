import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, isValid, parseISO } from 'date-fns';
import NepaliDate from 'nepali-date-converter';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatSafeDate(dateString?: string | Date | null): string {
  if (!dateString) return "-";
  
  try {
    // If it's already a Date object
    const date = dateString instanceof Date 
      ? dateString 
      : parseISO(dateString);
    
    if (!isValid(date)) return "-";
    
    return format(date, "dd MMM yyyy");
  } catch (error) {
    console.error("Invalid date format:", dateString);
    return "-";
  }
}

/**
 * Converts an English date to Nepali date
 * @param englishDate - Date in YYYY-MM-DD format
 * @returns Nepali date in YYYY-MM-DD format
 */
export function convertToNepaliDate(englishDate: string): string {
  if (!englishDate) return "";

  try {
    const date = new Date(englishDate);
    const nepaliDate = new NepaliDate(date);
    return nepaliDate.format('YYYY-MM-DD');
  } catch (error) {
    console.error("Error converting date:", error);
    return "";
  }
}

/**
 * Converts a Nepali date to English date
 * @param nepaliDate - Date in YYYY-MM-DD format
 * @returns English date in YYYY-MM-DD format
 */
export function convertToEnglishDate(nepaliDate: string): string {
  if (!nepaliDate) return "";

  try {
    const [year, month, day] = nepaliDate.split('-').map(Number);
    const nepaliDateObj = new NepaliDate(year, month - 1, day);
    const englishDate = nepaliDateObj.toJsDate();
    return englishDate.toISOString().split('T')[0];
  } catch (error) {
    console.error("Error converting date:", error);
    return "";
  }
}
