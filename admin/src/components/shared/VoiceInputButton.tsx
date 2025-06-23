import React, { useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { useVoiceInput } from '@/contexts/VoiceInputContext';
import { toast } from 'react-toastify';

interface VoiceInputButtonProps {
  fieldId: string;
  onTranscriptReceived: (transcript: string) => void;
  className?: string;
  listenMode?: 'continuous' | 'single';
  disabled?: boolean;
  fieldLabel?: string; // Add a label for better user feedback
}

const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({ 
  fieldId, 
  onTranscriptReceived, 
  className = "", 
  listenMode = 'continuous',
  disabled = false,
  fieldLabel = "this field" // Default generic label
}) => {
  const { 
    activeFieldId, 
    setActiveFieldId, 
    stopAllListening,
    setFieldLabel,
    isVoiceInputEnabled
  } = useVoiceInput();
  
  const isActiveField = activeFieldId === fieldId;
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  // Register the field label when the component mounts
  useEffect(() => {
    setFieldLabel(fieldId, fieldLabel);
  }, [fieldId, fieldLabel, setFieldLabel]);
  
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable
  } = useSpeechRecognition({
    clearTranscriptOnListen: true
  });
  // Process transcript for the active field
  useEffect(() => {
    if (isActiveField && !listening && transcript) {
      // Dismiss the listening toast first
      toast.dismiss(`voice-${fieldId}`);
      
      // Process the transcript
      onTranscriptReceived(transcript);
      resetTranscript();
      setActiveFieldId(null); // Clear active field after receiving transcript
      
      // Show success toast
      toast.success(`Voice input for ${fieldLabel} received`, {
        autoClose: 2000,
      });
    }
  }, [listening, transcript, onTranscriptReceived, resetTranscript, isActiveField, setActiveFieldId, fieldId, fieldLabel]);
  // Stop listening if another field becomes active
  useEffect(() => {
    // If this field was listening but is no longer the active field, stop it
    if (listening && activeFieldId !== fieldId && activeFieldId !== null) {
      stopThisField();
    }
    
    // Cleanup function to ensure toast is dismissed when component unmounts
    return () => {
      if (isActiveField) {
        toast.dismiss(`voice-${fieldId}`);
      }
    };
  }, [activeFieldId, fieldId, listening, isActiveField]);

  // Add a click outside listener to stop listening when clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isActiveField && 
        listening && 
        buttonRef.current && 
        !buttonRef.current.contains(event.target as Node)
      ) {
        // If we're the active field and user clicked outside, stop listening
        stopThisField();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isActiveField, listening]);  // If voice input is disabled or browser doesn't support speech recognition, return null instead of a spacer
  // This allows the input fields to take up the full width of their container when voice input is disabled
  if (!isVoiceInputEnabled || !browserSupportsSpeechRecognition) {
    return null;
  }

  const stopThisField = () => {
    if (isActiveField) {
      SpeechRecognition.stopListening();
      setActiveFieldId(null);
      
      // Always dismiss the toast when stopping this field
      toast.dismiss(`voice-${fieldId}`);
    }
  };

  const startListening = () => {
    // Stop any other active field before starting this one
    stopAllListening();
    
    // Set this field as active and start listening
    setActiveFieldId(fieldId);
    resetTranscript();
    SpeechRecognition.startListening({ 
      continuous: listenMode === 'continuous' 
    });
    
    // Show toast notification
    toast.info(`Listening for ${fieldLabel}...`, {
      autoClose: false,
      toastId: `voice-${fieldId}`,
    });
  };

  const toggleListening = () => {
    if (listening && isActiveField) {
      stopThisField();
    } else {
      startListening();
    }
  };
  return (
    <Button
      ref={buttonRef}
      type="button"
      variant={isActiveField && listening ? "default" : "outline"}
      size="icon"
      className={`h-8 w-8 min-w-[2rem] ${className} ${
        isActiveField && listening 
          ? 'bg-red-500 text-white hover:bg-red-600 ring-2 ring-red-300 ring-offset-2' 
          : ''
      }`}
      onClick={toggleListening}
      disabled={disabled || !isMicrophoneAvailable || (listening && !isActiveField)}
      aria-label={isActiveField && listening ? "Stop voice input" : "Start voice input"}
      title={isActiveField && listening ? "Stop voice input" : "Start voice input"}
    >
      <Mic className={`h-4 w-4 ${isActiveField && listening ? 'animate-pulse' : ''}`} />
    </Button>  );
};

export default VoiceInputButton;
