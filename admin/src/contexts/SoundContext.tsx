import React, { createContext, useContext, useEffect } from 'react';
import useSoundEffects from '@/hooks/useSoundEffects';

interface SoundContextType {
  playSound: (soundName: string, config?: any) => void;
  stopSound: (soundName: string) => void;
  setMasterVolume: (volume: number) => void;
  preloadSounds: (soundNames: string[]) => void;
  isSoundEnabled: boolean;
  toggleSound: () => void;
}

const SoundContext = createContext<SoundContextType | null>(null);

export const useSounds = () => {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error('useSounds must be used within a SoundProvider');
  }
  return context;
};

interface SoundProviderProps {
  children: React.ReactNode;
}

export const SoundProvider: React.FC<SoundProviderProps> = ({ children }) => {
  const soundEffects = useSoundEffects();

  // Preload common sounds on mount
  useEffect(() => {
    const commonSounds = ['click', 'success', 'notification', 'error', 'whoosh', 'pop'];
    soundEffects.preloadSounds(commonSounds);
  }, [soundEffects]);

  return (
    <SoundContext.Provider value={soundEffects}>
      {children}
    </SoundContext.Provider>
  );
};

// Convenience hook for common sound patterns
export const useCommonSounds = () => {
  const { playSound, isSoundEnabled } = useSounds();

  return {
    playSuccessSound: () => isSoundEnabled && playSound('success', { volume: 0.6 }),
    playClickSound: () => isSoundEnabled && playSound('click', { volume: 0.4 }),
    playErrorSound: () => isSoundEnabled && playSound('error', { volume: 0.7 }),
    playNotificationSound: () => isSoundEnabled && playSound('notification', { volume: 0.5 }),
    playWhooshSound: () => isSoundEnabled && playSound('whoosh', { volume: 0.5 }),
    playPopSound: () => isSoundEnabled && playSound('pop', { volume: 0.6 }),
    playCelebrationSound: () => isSoundEnabled && playSound('celebrate', { volume: 0.8 }),
    playConfirmSound: () => isSoundEnabled && playSound('confirm', { volume: 0.5 })
  };
};