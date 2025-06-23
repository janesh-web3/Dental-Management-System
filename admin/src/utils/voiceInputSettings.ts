/**
 * Utility functions for managing voice input settings
 */

// Default settings
const defaultVoiceSettings = {
  enabled: false
};

/**
 * Save voice input settings to localStorage
 */
export const saveVoiceInputSettings = (settings: { enabled: boolean }) => {
  localStorage.setItem('voiceInputSettings', JSON.stringify(settings));
};

/**
 * Get voice input settings from localStorage
 */
export const getVoiceInputSettings = (): { enabled: boolean } => {
  try {
    const savedSettings = localStorage.getItem('voiceInputSettings');
    if (savedSettings) {
      return JSON.parse(savedSettings);
    }
  } catch (error) {
    console.error('Error retrieving voice input settings:', error);
  }
  
  // Return default settings if nothing is stored or an error occurs
  return defaultVoiceSettings;
};

/**
 * Update voice input enabled setting
 */
export const updateVoiceInputEnabled = (enabled: boolean) => {
  const settings = getVoiceInputSettings();
  settings.enabled = enabled;
  saveVoiceInputSettings(settings);
  return settings;
};
