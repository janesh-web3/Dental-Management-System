import { useState, useEffect } from 'react';

/**
 * Custom hook for detecting media query matches
 * @param query - CSS media query string
 * @returns boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    // Check if window is available (for SSR)
    if (typeof window === 'undefined') {
      return;
    }

    const media = window.matchMedia(query);
    
    // Set initial value
    setMatches(media.matches);

    // Define listener function
    const listener = () => {
      setMatches(media.matches);
    };

    // Add listener
    media.addEventListener('change', listener);

    // Remove listener on cleanup
    return () => {
      media.removeEventListener('change', listener);
    };
  }, [query]);

  return matches;
}
