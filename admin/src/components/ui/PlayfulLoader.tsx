import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface PlayfulLoaderProps {
  isLoading: boolean;
  customMessages?: string[];
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const defaultMessages = [
  "Mixing dental magic...",
  "Polishing your data...",
  "Checking teeth alignment...",
  "Brewing your appointment...",
  "Flossing through records...",
  "Whitening your experience...",
  "Drilling into details...",
  "Brushing up the interface...",
  "Extracting the good stuff...",
  "Cleaning up the results...",
  "Scheduling some awesomeness...",
  "Filling in the gaps...",
  "Crown-ing your request...",
  "Root-ing for success...",
  "Molar-ing over your data...",
  "Canine believe how fast this is?",
  "Incisor-ing some fun...",
  "Wisdom tooth says: be patient...",
  "Cavity searching for results...",
  "Orthodontically organizing...",
];

const PlayfulLoader: React.FC<PlayfulLoaderProps> = ({
  isLoading,
  customMessages,
  size = 'md',
  showIcon = true
}) => {
  const [currentMessage, setCurrentMessage] = useState('');
  const messages = customMessages || defaultMessages;

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24
  };

  useEffect(() => {
    if (isLoading) {
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      setCurrentMessage(randomMessage);
      
      // Change message every 3 seconds if still loading
      const interval = setInterval(() => {
        const newMessage = messages[Math.floor(Math.random() * messages.length)];
        setCurrentMessage(newMessage);
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [isLoading, messages]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-center gap-3 p-4"
        >
          {showIcon && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 size={iconSizes[size]} className="text-blue-500" />
            </motion.div>
          )}
          <motion.p
            key={currentMessage}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5 }}
            className={`${sizeClasses[size]} text-gray-600 font-medium`}
          >
            {currentMessage}
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PlayfulLoader;