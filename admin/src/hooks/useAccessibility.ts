import { useEffect, useState } from 'react';

interface AccessibilitySettings {
  prefersReducedMotion: boolean;
  prefersHighContrast: boolean;
  prefersReducedTransparency: boolean;
  prefersColorScheme: 'light' | 'dark' | 'no-preference';
  forcedColors: boolean;
}

interface AccessibilityHook extends AccessibilitySettings {
  respectMotionPreference: (defaultAnimation: any, reducedAnimation?: any) => any;
  respectSoundPreference: (callback: () => void) => void;
  getAccessibleColor: (color: string, highContrastAlternative: string) => string;
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;
}

const useAccessibility = (): AccessibilityHook => {
  const [accessibilitySettings, setAccessibilitySettings] = useState<AccessibilitySettings>({
    prefersReducedMotion: false,
    prefersHighContrast: false,
    prefersReducedTransparency: false,
    prefersColorScheme: 'no-preference',
    forcedColors: false
  });

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Check for high contrast preference
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
    
    // Check for reduced transparency preference
    const prefersReducedTransparency = window.matchMedia('(prefers-reduced-transparency: reduce)').matches;
    
    // Check for color scheme preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    let prefersColorScheme: 'light' | 'dark' | 'no-preference' = 'no-preference';
    if (prefersDark) prefersColorScheme = 'dark';
    else if (prefersLight) prefersColorScheme = 'light';
    
    // Check for forced colors (Windows High Contrast mode)
    const forcedColors = window.matchMedia('(forced-colors: active)').matches;

    setAccessibilitySettings({
      prefersReducedMotion,
      prefersHighContrast,
      prefersReducedTransparency,
      prefersColorScheme,
      forcedColors
    });

    // Create listeners for preference changes
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    const reducedTransparencyQuery = window.matchMedia('(prefers-reduced-transparency: reduce)');
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const forcedColorsQuery = window.matchMedia('(forced-colors: active)');

    const updateSettings = () => {
      setAccessibilitySettings(prev => ({
        ...prev,
        prefersReducedMotion: reducedMotionQuery.matches,
        prefersHighContrast: highContrastQuery.matches,
        prefersReducedTransparency: reducedTransparencyQuery.matches,
        prefersColorScheme: darkModeQuery.matches ? 'dark' : 'light',
        forcedColors: forcedColorsQuery.matches
      }));
    };

    // Add event listeners
    reducedMotionQuery.addEventListener('change', updateSettings);
    highContrastQuery.addEventListener('change', updateSettings);
    reducedTransparencyQuery.addEventListener('change', updateSettings);
    darkModeQuery.addEventListener('change', updateSettings);
    forcedColorsQuery.addEventListener('change', updateSettings);

    // Cleanup
    return () => {
      reducedMotionQuery.removeEventListener('change', updateSettings);
      highContrastQuery.removeEventListener('change', updateSettings);
      reducedTransparencyQuery.removeEventListener('change', updateSettings);
      darkModeQuery.removeEventListener('change', updateSettings);
      forcedColorsQuery.removeEventListener('change', updateSettings);
    };
  }, []);

  const respectMotionPreference = (defaultAnimation: any, reducedAnimation: any = {}) => {
    if (accessibilitySettings.prefersReducedMotion) {
      return reducedAnimation;
    }
    return defaultAnimation;
  };

  const respectSoundPreference = (callback: () => void) => {
    // Check if user has sound preferences disabled or device is muted
    const userSoundEnabled = localStorage.getItem('dms-sound-enabled');
    
    if (userSoundEnabled === 'false') {
      return; // Don't play sound
    }
    
    // Also check if device supports audio and is not muted
    if ('webkitAudioContext' in window || 'AudioContext' in window) {
      callback();
    }
  };

  const getAccessibleColor = (color: string, highContrastAlternative: string) => {
    if (accessibilitySettings.prefersHighContrast || accessibilitySettings.forcedColors) {
      return highContrastAlternative;
    }
    return color;
  };

  const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.setAttribute('class', 'sr-only');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';
    
    document.body.appendChild(announcement);
    
    // Set message after a brief delay to ensure screen reader picks it up
    setTimeout(() => {
      announcement.textContent = message;
    }, 100);
    
    // Remove the element after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  return {
    ...accessibilitySettings,
    respectMotionPreference,
    respectSoundPreference,
    getAccessibleColor,
    announceToScreenReader
  };
};

export default useAccessibility;