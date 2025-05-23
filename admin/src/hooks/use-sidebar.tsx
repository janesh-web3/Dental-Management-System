import React, { createContext, useContext, useState, useEffect } from 'react';

interface SidebarContextType {
  isMinimized: boolean;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
  isMinimized: false,
  toggle: () => {}
});

export const useSidebar = () => useContext(SidebarContext);

interface SidebarProviderProps {
  children: React.ReactNode;
  userType?: 'patient' | 'doctor' | 'admin';
}

export const SidebarProvider: React.FC<SidebarProviderProps> = ({
  children,
  userType = 'default'
}) => {
  // Use localStorage to persist sidebar state for different user types
  const storageKey = `sidebar_minimized_${userType}`;
  
  // Initialize state from localStorage or default to false (expanded)
  const [isMinimized, setIsMinimized] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : false;
  });

  // Save state changes to localStorage
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(isMinimized));
  }, [isMinimized, storageKey]);

  const toggle = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <SidebarContext.Provider value={{ isMinimized, toggle }}>
      {children}
    </SidebarContext.Provider>
  );
};
