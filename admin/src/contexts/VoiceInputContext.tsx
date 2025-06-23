import React, { createContext, useContext, useState, useEffect } from 'react';
import SpeechRecognition from 'react-speech-recognition';
import { toast } from 'react-toastify';
import { getVoiceInputSettings, saveVoiceInputSettings } from '@/utils/voiceInputSettings';

type VoiceInputContextType = {
  activeFieldId: string | null;
  setActiveFieldId: (id: string | null) => void;
  stopAllListening: () => void;
  fieldLabels: Record<string, string>;
  setFieldLabel: (fieldId: string, label: string) => void;
  isVoiceInputEnabled: boolean;
  setVoiceInputEnabled: (enabled: boolean) => void;
};

const VoiceInputContext = createContext<VoiceInputContextType>({
  activeFieldId: null,
  setActiveFieldId: () => {},
  stopAllListening: () => {},
  fieldLabels: {},
  setFieldLabel: () => {},
  isVoiceInputEnabled: false,
  setVoiceInputEnabled: () => {},
});

export const VoiceInputProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [fieldLabels, setFieldLabels] = useState<Record<string, string>>({});
  const [isVoiceInputEnabled, setIsVoiceInputEnabled] = useState<boolean>(() => {
    // Initialize from localStorage
    return getVoiceInputSettings().enabled;
  });

  // Save the enabled state to localStorage when it changes
  useEffect(() => {
    saveVoiceInputSettings({ enabled: isVoiceInputEnabled });
  }, [isVoiceInputEnabled]);

  const setFieldLabel = (fieldId: string, label: string) => {
    setFieldLabels(prev => ({
      ...prev,
      [fieldId]: label
    }));
  };

  const stopAllListening = () => {
    SpeechRecognition.stopListening();
    // Dismiss any active toast notifications
    if (activeFieldId) {
      toast.dismiss(`voice-${activeFieldId}`);
    }
    setActiveFieldId(null);
  };

  // Set voice input enabled/disabled
  const setVoiceInputEnabled = (enabled: boolean) => {
    setIsVoiceInputEnabled(enabled);
    if (!enabled) {
      // Stop any active listening when disabling
      stopAllListening();
    }
  };

  // Global event listener to stop listening when user clicks elsewhere
  useEffect(() => {
    const handleGlobalClick = () => {
      // We don't stop here, we let the individual components handle this
      // but this is a good place to add additional global handlers if needed
    };

    document.addEventListener('click', handleGlobalClick);
    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  return (
    <VoiceInputContext.Provider value={{ 
      activeFieldId, 
      setActiveFieldId, 
      stopAllListening,
      fieldLabels,
      setFieldLabel,
      isVoiceInputEnabled,
      setVoiceInputEnabled
    }}>
      {children}
    </VoiceInputContext.Provider>
  );
};

export const useVoiceInput = () => useContext(VoiceInputContext);
