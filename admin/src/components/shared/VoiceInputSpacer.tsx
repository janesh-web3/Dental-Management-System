import { useVoiceInput } from '@/contexts/VoiceInputContext';

interface VoiceInputSpacerProps {
  className?: string;
}

/**
 * A component that serves as a placeholder for the VoiceInputButton when voice input is disabled.
 * This ensures that the form layout remains consistent regardless of whether voice input is enabled.
 */
export function VoiceInputSpacer({ className = "" }: VoiceInputSpacerProps) {
  const { isVoiceInputEnabled } = useVoiceInput();
  
  // Only render the spacer when voice input is disabled
  if (isVoiceInputEnabled) {
    return null;
  }
  
  return (
    <div className={`h-8 w-8 invisible ${className}`} aria-hidden="true" />
  );
}
