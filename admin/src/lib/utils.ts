import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, isValid, parseISO } from 'date-fns';

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
