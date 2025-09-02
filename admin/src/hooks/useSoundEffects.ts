import { useCallback, useRef, useEffect } from 'react';

interface SoundConfig {
  volume?: number;
  playbackRate?: number;
  loop?: boolean;
}

interface SoundEffectsHook {
  playSound: (soundName: string, config?: SoundConfig) => void;
  stopSound: (soundName: string) => void;
  setMasterVolume: (volume: number) => void;
  preloadSounds: (soundNames: string[]) => void;
  isSoundEnabled: boolean;
  toggleSound: () => void;
}

const soundFiles: Record<string, string> = {
  success: '/sounds/success-chime.mp3',
  click: '/sounds/button-click.mp3',
  notification: '/sounds/gentle-notification.mp3',
  error: '/sounds/error-tone.mp3',
  whoosh: '/sounds/whoosh-transition.mp3',
  pop: '/sounds/pop-bubble.mp3',
  ding: '/sounds/ding-bell.mp3',
  confirm: '/sounds/confirm-beep.mp3',
  celebrate: '/sounds/celebration-fanfare.mp3',
  typing: '/sounds/keyboard-type.mp3',
  send: '/sounds/message-send.mp3',
  receive: '/sounds/message-receive.mp3'
};

const useSoundEffects = (): SoundEffectsHook => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBuffersRef = useRef<Map<string, AudioBuffer>>(new Map());
  const activeSourcesRef = useRef<Map<string, AudioBufferSourceNode[]>>(new Map());
  const masterVolumeRef = useRef<number>(0.3);
  const soundEnabledRef = useRef<boolean>(
    (() => {
      const saved = localStorage.getItem('dms-sound-enabled');
      return saved !== null ? JSON.parse(saved) : true;
    })()
  );

  // Initialize Web Audio Context
  useEffect(() => {
    const initAudioContext = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
    };

    // Initialize on first user interaction
    const handleFirstInteraction = () => {
      initAudioContext();
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
  }, []);

  // Load audio buffer from URL
  const loadAudioBuffer = useCallback(async (url: string): Promise<AudioBuffer | null> => {
    if (!audioContextRef.current) return null;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`Failed to load sound: ${url}`);
        return null;
      }
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      return audioBuffer;
    } catch (error) {
      console.warn(`Error loading sound ${url}:`, error);
      return null;
    }
  }, []);

  // Preload sounds
  const preloadSounds = useCallback(async (soundNames: string[]) => {
    for (const soundName of soundNames) {
      const url = soundFiles[soundName];
      if (url && !audioBuffersRef.current.has(soundName)) {
        const buffer = await loadAudioBuffer(url);
        if (buffer) {
          audioBuffersRef.current.set(soundName, buffer);
        }
      }
    }
  }, [loadAudioBuffer]);

  // Play sound effect
  const playSound = useCallback(async (soundName: string, config: SoundConfig = {}) => {
    if (!soundEnabledRef.current || !audioContextRef.current) return;

    const {
      volume = 1,
      playbackRate = 1,
      loop = false
    } = config;

    try {
      let audioBuffer = audioBuffersRef.current.get(soundName);
      
      // Load buffer if not cached
      if (!audioBuffer) {
        const url = soundFiles[soundName];
        if (!url) {
          console.warn(`Sound file not found: ${soundName}`);
          return;
        }
        const loadedBuffer = await loadAudioBuffer(url);
        if (loadedBuffer) {
          audioBuffer = loadedBuffer;
          audioBuffersRef.current.set(soundName, audioBuffer);
        } else {
          return;
        }
      }

      // Create and configure audio source
      const source = audioContextRef.current.createBufferSource();
      const gainNode = audioContextRef.current.createGain();
      
      source.buffer = audioBuffer;
      source.playbackRate.value = playbackRate;
      source.loop = loop;
      
      gainNode.gain.value = volume * masterVolumeRef.current;
      
      source.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      // Track active sources for cleanup
      if (!activeSourcesRef.current.has(soundName)) {
        activeSourcesRef.current.set(soundName, []);
      }
      activeSourcesRef.current.get(soundName)!.push(source);
      
      // Cleanup on end
      source.onended = () => {
        const sources = activeSourcesRef.current.get(soundName) || [];
        const index = sources.indexOf(source);
        if (index > -1) {
          sources.splice(index, 1);
        }
      };
      
      source.start(0);
    } catch (error) {
      console.warn(`Error playing sound ${soundName}:`, error);
    }
  }, [loadAudioBuffer]);

  // Stop specific sound
  const stopSound = useCallback((soundName: string) => {
    const sources = activeSourcesRef.current.get(soundName) || [];
    sources.forEach(source => {
      try {
        source.stop();
      } catch (error) {
        // Source may already be stopped
      }
    });
    activeSourcesRef.current.set(soundName, []);
  }, []);

  // Set master volume
  const setMasterVolume = useCallback((volume: number) => {
    masterVolumeRef.current = Math.max(0, Math.min(1, volume));
    localStorage.setItem('dms-master-volume', masterVolumeRef.current.toString());
  }, []);

  // Toggle sound on/off
  const toggleSound = useCallback(() => {
    soundEnabledRef.current = !soundEnabledRef.current;
    localStorage.setItem('dms-sound-enabled', JSON.stringify(soundEnabledRef.current));
  }, []);

  // Load saved volume on mount
  useEffect(() => {
    const savedVolume = localStorage.getItem('dms-master-volume');
    if (savedVolume) {
      masterVolumeRef.current = parseFloat(savedVolume);
    }
  }, []);

  return {
    playSound,
    stopSound,
    setMasterVolume,
    preloadSounds,
    isSoundEnabled: soundEnabledRef.current,
    toggleSound
  };
};

export default useSoundEffects;