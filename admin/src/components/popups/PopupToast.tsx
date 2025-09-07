import React, { useEffect, useState, useCallback } from 'react';
import { X, AlertCircle, Calendar, CreditCard, Bell, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTheme } from '@/providers/theme-provider';
import { PopupToastProps } from '@/types/popup';

const typeConfig = {
  'Notice': {
    icon: Bell,
    colors: {
      light: 'bg-white/95 border-blue-200 text-blue-900 shadow-blue-500/20',
      dark: 'bg-gray-950/95 border-blue-800 text-blue-100 shadow-blue-500/20',
      badge: {
        light: 'bg-blue-100 text-blue-800 border-blue-300',
        dark: 'bg-blue-900 text-blue-200 border-blue-700'
      },
      gradient: 'from-blue-500/10 via-blue-400/5 to-transparent',
      accent: 'bg-blue-500'
    }
  },
  'Event': {
    icon: Calendar,
    colors: {
      light: 'bg-white/95 border-green-200 text-green-900 shadow-green-500/20',
      dark: 'bg-gray-950/95 border-green-800 text-green-100 shadow-green-500/20',
      badge: {
        light: 'bg-green-100 text-green-800 border-green-300',
        dark: 'bg-green-900 text-green-200 border-green-700'
      },
      gradient: 'from-green-500/10 via-green-400/5 to-transparent',
      accent: 'bg-green-500'
    }
  },
  'Payment Reminder': {
    icon: CreditCard,
    colors: {
      light: 'bg-white/95 border-amber-200 text-amber-900 shadow-amber-500/20',
      dark: 'bg-gray-950/95 border-amber-800 text-amber-100 shadow-amber-500/20',
      badge: {
        light: 'bg-amber-100 text-amber-800 border-amber-300',
        dark: 'bg-amber-900 text-amber-200 border-amber-700'
      },
      gradient: 'from-amber-500/10 via-amber-400/5 to-transparent',
      accent: 'bg-amber-500'
    }
  },
  'Alert': {
    icon: AlertCircle,
    colors: {
      light: 'bg-white/95 border-red-200 text-red-900 shadow-red-500/20',
      dark: 'bg-gray-950/95 border-red-800 text-red-100 shadow-red-500/20',
      badge: {
        light: 'bg-red-100 text-red-800 border-red-300',
        dark: 'bg-red-900 text-red-200 border-red-700'
      },
      gradient: 'from-red-500/10 via-red-400/5 to-transparent',
      accent: 'bg-red-500'
    }
  }
};

const positionClasses = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4'
};

export const PopupToast: React.FC<PopupToastProps> = ({
  popup,
  duration = 8000,
  position = 'top-right',
  onView,
  onDismiss,
  onActionClick
}) => {
  const { theme } = useTheme();
  const [isVisible, setIsVisible] = useState(true);
  const [hasViewed, setHasViewed] = useState(false);
  const [progress, setProgress] = useState(100);
  const [isHovered, setIsHovered] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Get current theme (handle system theme)
  const getCurrentTheme = () => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
  };

  const currentTheme = mounted ? getCurrentTheme() : 'light';
  const config = typeConfig[popup.type];
  const IconComponent = config.icon;

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    onDismiss(popup._id);
  }, [popup._id, onDismiss]);

  useEffect(() => {
    if (!hasViewed) {
      onView(popup._id);
      setHasViewed(true);
    }
  }, [hasViewed, popup._id, onView]);

  useEffect(() => {
    if (duration > 0) {
      const interval = setInterval(() => {
        setProgress(prev => {
          // Pause progress when hovered
          if (isHovered) return prev;
          
          const newProgress = prev - (100 / (duration / 100));
          if (newProgress <= 0) {
            handleDismiss();
            return 0;
          }
          return newProgress;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [duration, handleDismiss, isHovered]);

  const handleActionClick = (action: any) => {
    if (action.action === 'close') {
      handleDismiss();
    } else {
      onActionClick(action);
    }
  };

  if (!isVisible) return null;

  const getAnimationDirection = () => {
    if (position.includes('right')) return 'animate-in slide-in-from-right-2 fade-in-0';
    if (position.includes('left')) return 'animate-in slide-in-from-left-2 fade-in-0';
    return 'animate-in slide-in-from-top-2 fade-in-0';
  };

  return (
    <div
      className={cn(
        'fixed z-50 w-80 duration-300 transform transition-all',
        positionClasses[position],
        getAnimationDirection(),
        isHovered && 'scale-105'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={cn(
          'relative border rounded-xl shadow-2xl overflow-hidden backdrop-blur-sm',
          config.colors[currentTheme],
          'transition-all duration-200'
        )}
      >
        {/* Gradient background */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-50",
          config.colors.gradient
        )} />
        
        {/* Left accent bar */}
        <div className={cn(
          "absolute left-0 top-0 bottom-0 w-1",
          config.colors.accent
        )} />

        {/* Progress bar */}
        {duration > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10 dark:bg-white/10">
            <div
              className={cn(
                "h-full transition-all duration-100 ease-linear",
                config.colors.accent
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <div className="relative p-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {/* Icon */}
              <div className={cn(
                "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
                config.colors.badge[currentTheme]
              )}>
                <IconComponent className="w-4 h-4" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="font-semibold text-sm truncate">
                    {popup.title}
                  </div>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      'text-xs font-medium shrink-0',
                      config.colors.badge[currentTheme]
                    )}
                  >
                    {popup.type}
                  </Badge>
                </div>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full shrink-0 opacity-70 hover:opacity-100 transition-opacity"
              onClick={handleDismiss}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Message */}
          <div className="text-xs text-foreground/90 mb-3 leading-relaxed line-clamp-3">
            {popup.message.split('\n').map((line, index) => (
              <div key={index} className={index > 0 ? 'mt-1' : ''}>
                {line}
              </div>
            ))}
          </div>

          {/* Actions */}
          {popup.actions.length > 0 && (
            <div className="flex gap-2 mb-2">
              {popup.actions.slice(0, 2).map((action, index) => (
                <Button
                  key={index}
                  variant={action.action === 'close' ? 'outline' : 'default'}
                  size="sm"
                  className={cn(
                    "text-xs px-3 py-1 h-auto flex-1 font-medium",
                    "transition-all duration-200 hover:shadow-md"
                  )}
                  onClick={() => handleActionClick(action)}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}

          {/* Timestamp */}
          {popup.startTime && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground opacity-60">
              <Clock className="w-3 h-3" />
              <span>{new Date(popup.startTime).toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};