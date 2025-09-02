import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import useAccessibility from '@/hooks/useAccessibility';
import { useSounds } from '@/contexts/SoundContext';

interface AccessibleDelightfulButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'success';
  size?: 'sm' | 'md' | 'lg';
  animation?: 'bounce' | 'pulse' | 'scale' | 'wobble' | 'shake' | 'glow';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  playful?: boolean;
  soundEffect?: string;
  successMessage?: string;
  children: React.ReactNode;
}

const buttonVariants = {
  primary: 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl',
  secondary: 'bg-gray-500 hover:bg-gray-600 text-white shadow-lg hover:shadow-xl',
  outline: 'border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white shadow-lg hover:shadow-xl',
  ghost: 'hover:bg-gray-100 text-gray-700 hover:text-gray-900',
  destructive: 'bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl',
  success: 'bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl'
};

const highContrastVariants = {
  primary: 'bg-black text-white border-2 border-white',
  secondary: 'bg-gray-800 text-white border-2 border-white',
  outline: 'border-4 border-black text-black bg-white',
  ghost: 'hover:bg-black hover:text-white border-2 border-transparent hover:border-white',
  destructive: 'bg-red-800 text-white border-2 border-white',
  success: 'bg-green-800 text-white border-2 border-white'
};

const sizeVariants = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2 text-base rounded-lg',
  lg: 'px-6 py-3 text-lg rounded-xl'
};

const animationVariants = {
  bounce: {
    hover: { y: -2, transition: { type: "spring", stiffness: 400, damping: 17 } },
    tap: { y: 0, scale: 0.98 }
  },
  pulse: {
    hover: { scale: 1.05, transition: { type: "spring", stiffness: 400, damping: 17 } },
    tap: { scale: 0.95 }
  },
  scale: {
    hover: { scale: 1.1, transition: { type: "spring", stiffness: 400, damping: 17 } },
    tap: { scale: 0.9 }
  },
  wobble: {
    hover: { 
      rotate: [0, -5, 5, -5, 0],
      transition: { duration: 0.5, repeat: Infinity, repeatDelay: 2 }
    },
    tap: { rotate: 0, scale: 0.95 }
  },
  shake: {
    hover: { 
      x: [0, -2, 2, -2, 0],
      transition: { duration: 0.3, repeat: Infinity, repeatDelay: 1 }
    },
    tap: { x: 0, scale: 0.95 }
  },
  glow: {
    hover: { 
      boxShadow: "0 0 20px rgba(59, 130, 246, 0.5)",
      transition: { duration: 0.3 }
    },
    tap: { scale: 0.98 }
  }
};

const AccessibleDelightfulButton: React.FC<AccessibleDelightfulButtonProps> = ({
  variant = 'primary',
  size = 'md',
  animation = 'bounce',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  playful = false,
  soundEffect = 'click',
  successMessage,
  className,
  children,
  onClick,
  disabled,
  'aria-label': ariaLabel,
  ...props
}) => {
  const [clickMessage, setClickMessage] = useState<string>('');
  const [showMessage, setShowMessage] = useState(false);
  
  const { 
    prefersReducedMotion, 
    prefersHighContrast,
    respectMotionPreference,
    respectSoundPreference,
    announceToScreenReader 
  } = useAccessibility();
  
  const { playSound } = useSounds();

  const playfulMessages = [
    "Clicked!",
    "Nice!",
    "Great!",
    "Sweet!",
    "Awesome!",
    "Perfect!",
    "Excellent!",
    "Well done!"
  ];

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Play sound effect with accessibility consideration
    respectSoundPreference(() => {
      playSound(soundEffect, { volume: 0.4 });
    });

    // Show visual feedback if playful mode is enabled and motion is allowed
    if (playful && !prefersReducedMotion && !loading && !disabled) {
      const message = successMessage || playfulMessages[Math.floor(Math.random() * playfulMessages.length)];
      setClickMessage(message);
      setShowMessage(true);
      
      setTimeout(() => {
        setShowMessage(false);
      }, 1000);
      
      // Announce success to screen readers
      announceToScreenReader(`Button activated: ${message}`, 'polite');
    } else if (successMessage) {
      // Always announce important messages to screen readers
      announceToScreenReader(successMessage, 'polite');
    }
    
    onClick?.(e);
  };

  // Choose appropriate animations based on accessibility preferences
  const motionVariants = respectMotionPreference(
    animationVariants[animation],
    {} // No animation for reduced motion
  );

  // Choose appropriate colors based on accessibility preferences
  const baseStyles = prefersHighContrast 
    ? highContrastVariants[variant] 
    : buttonVariants[variant];

  return (
    <div className="relative inline-block">
      <motion.button
        {...(props as any)}
        className={cn(
          'relative font-medium transition-all duration-200 focus:outline-none',
          'focus:ring-4 focus:ring-offset-2 focus:ring-blue-500',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          // Enhanced focus for better accessibility
          prefersHighContrast && 'focus:ring-white focus:ring-offset-black',
          baseStyles,
          sizeVariants[size],
          className
        )}
        variants={motionVariants}
        whileHover={!disabled && !loading && !prefersReducedMotion ? "hover" : undefined}
        whileTap={!disabled && !loading && !prefersReducedMotion ? "tap" : undefined}
        onClick={handleClick}
        disabled={disabled || loading}
        aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
        aria-pressed={false}
        aria-busy={loading}
        role="button"
      >
        <div className="flex items-center justify-center gap-2">
          {Icon && iconPosition === 'left' && (
            <motion.div
              animate={loading ? { rotate: 360 } : {}}
              transition={loading ? { 
                duration: 1, 
                repeat: Infinity, 
                ease: "linear" 
              } : {}}
              aria-hidden="true"
            >
              <Icon 
                size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20}
                aria-hidden="true"
              />
            </motion.div>
          )}
          
          <motion.span
            initial={{ opacity: 1 }}
            animate={{ opacity: loading ? 0.7 : 1 }}
          >
            {children}
          </motion.span>
          
          {Icon && iconPosition === 'right' && (
            <motion.div
              animate={loading ? { rotate: 360 } : {}}
              transition={loading ? { 
                duration: 1, 
                repeat: Infinity, 
                ease: "linear" 
              } : {}}
              aria-hidden="true"
            >
              <Icon 
                size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20}
                aria-hidden="true"
              />
            </motion.div>
          )}
        </div>

        {/* Loading indicator */}
        {loading && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute bottom-0 left-0 h-0.5 bg-white/30 rounded-full"
            aria-hidden="true"
          />
        )}
        
        {/* Screen reader only status */}
        <span className="sr-only">
          {loading && "Loading"}
          {disabled && "Disabled"}
        </span>
      </motion.button>

      {/* Playful click message - only shown if motion is not reduced */}
      {showMessage && playful && !prefersReducedMotion && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.8 }}
          animate={{ opacity: 1, y: -20, scale: 1 }}
          exit={{ opacity: 0, y: -40, scale: 0.6 }}
          className="absolute -top-8 left-1/2 transform -translate-x-1/2 pointer-events-none z-10"
          aria-hidden="true"
        >
          <div className={cn(
            "px-3 py-1 rounded-full text-sm font-bold shadow-lg",
            prefersHighContrast 
              ? "bg-black text-white border-2 border-white"
              : "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
          )}>
            {clickMessage}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AccessibleDelightfulButton;