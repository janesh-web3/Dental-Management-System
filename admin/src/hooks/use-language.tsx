import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

export function useLanguage() {
  const { i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get current language
  const currentLanguage = i18n.language;

  // Change language locally and in user preferences if logged in
  const changeLanguage = async (language: string) => {
    setLoading(true);
    setError(null);

    try {
      // Change language locally
      await i18n.changeLanguage(language);
      
      // Store in localStorage
      localStorage.setItem('userLanguage', language);
      
      // If user is logged in, update their preference in backend
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      if (token && userId) {
        await axios.put(
          `/api/users/update-language/${userId}`,
          { language },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }
    } catch (err) {
      console.error('Error changing language:', err);
      setError('Failed to update language preference');
      toast.error('Failed to update language preference');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Update document attributes when language changes
    const direction = i18n.language === 'ne' ? 'auto' : 'ltr';
    document.documentElement.setAttribute('dir', direction);
    document.documentElement.setAttribute('lang', i18n.language);
  }, [i18n.language]);

  return {
    currentLanguage,
    changeLanguage,
    loading,
    error,
    isNepali: currentLanguage === 'ne',
    isEnglish: currentLanguage === 'en'
  };
} 