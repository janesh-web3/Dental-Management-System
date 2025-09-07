import React, { useEffect, useState } from 'react';
import { X, AlertCircle, Calendar, CreditCard, Bell, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTheme } from '@/providers/theme-provider';
import { PopupBannerProps } from '@/types/popup';

const typeConfig = {
  'Notice': {
    icon: Bell,
    colors: {
      light: 'bg-blue-50/90 border-blue-200 text-blue-900 backdrop-blur-sm',
      dark: 'bg-blue-950/90 border-blue-800 text-blue-100 backdrop-blur-sm',
      badge: {
        light: 'bg-blue-100 text-blue-800 border-blue-300',
        dark: 'bg-blue-900 text-blue-200 border-blue-700'
      },
      gradient: 'from-blue-600/20 via-blue-500/10 to-transparent',
      shadow: 'shadow-blue-500/20'
    }
  },
  'Event': {
    icon: Calendar,
    colors: {
      light: 'bg-green-50/90 border-green-200 text-green-900 backdrop-blur-sm',
      dark: 'bg-green-950/90 border-green-800 text-green-100 backdrop-blur-sm',
      badge: {
        light: 'bg-green-100 text-green-800 border-green-300',
        dark: 'bg-green-900 text-green-200 border-green-700'
      },
      gradient: 'from-green-600/20 via-green-500/10 to-transparent',
      shadow: 'shadow-green-500/20'
    }
  },
  'Payment Reminder': {
    icon: CreditCard,
    colors: {
      light: 'bg-amber-50/90 border-amber-200 text-amber-900 backdrop-blur-sm',
      dark: 'bg-amber-950/90 border-amber-800 text-amber-100 backdrop-blur-sm',
      badge: {
        light: 'bg-amber-100 text-amber-800 border-amber-300',
        dark: 'bg-amber-900 text-amber-200 border-amber-700'
      },
      gradient: 'from-amber-600/20 via-amber-500/10 to-transparent',
      shadow: 'shadow-amber-500/20'
    }
  },
  'Alert': {
    icon: AlertCircle,
    colors: {
      light: 'bg-red-50/90 border-red-200 text-red-900 backdrop-blur-sm',
      dark: 'bg-red-950/90 border-red-800 text-red-100 backdrop-blur-sm',
      badge: {
        light: 'bg-red-100 text-red-800 border-red-300',
        dark: 'bg-red-900 text-red-200 border-red-700'
      },
      gradient: 'from-red-600/20 via-red-500/10 to-transparent',
      shadow: 'shadow-red-500/20'
    }
  }
};

export const PopupBanner: React.FC<PopupBannerProps> = ({
  popup,
  position = 'top',
  onView,
  onDismiss,
  onActionClick
}) => {
  const { theme } = useTheme();
  const [isVisible, setIsVisible] = useState(true);
  const [hasViewed, setHasViewed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
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

  useEffect(() => {
    if (!hasViewed) {
      onView(popup._id);
      setHasViewed(true);
    }
  }, [hasViewed, popup._id, onView]);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss(popup._id);
  };

  const handleActionClick = (action: any) => {
    if (action.action === 'close') {
      handleDismiss();
    } else {
      onActionClick(action);
    }
  };

  if (!isVisible) return null;

  const isLongMessage = popup.message.length > 100;
  const displayMessage = isExpanded ? popup.message : popup.message.slice(0, 100) + (isLongMessage ? '...' : '');

  return (
    <div
      className={cn(
        'fixed left-0 right-0 z-40 border-b transition-all duration-300',
        position === 'top' ? 'top-0 animate-in slide-in-from-top-2' : 'bottom-0 animate-in slide-in-from-bottom-2',
        config.colors[currentTheme],
        config.colors.shadow,
        'shadow-lg'
      )}
    >
      {/* Gradient background */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-r opacity-30",
        config.colors.gradient
      )} />
      
      <div className="relative max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Icon */}
            <div className={cn(
              "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5",
              config.colors.badge[currentTheme]
            )}>
              <IconComponent className="w-4 h-4" />
            </div>
            
            <div className="flex-1 min-w-0">
              {/* Title and Badge */}
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
              
              {/* Message */}
              <div className="text-xs text-foreground/80 leading-relaxed">
                {displayMessage.split('\n').map((line, index) => (
                  <div key={index} className={index > 0 ? 'mt-1' : ''}>
                    {line}
                  </div>
                ))}
              </div>
              
              {/* Expand button for long messages */}
              {isLongMessage && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 mt-1 text-xs font-medium hover:bg-transparent"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  <span className="flex items-center gap-1">
                    {isExpanded ? 'Show less' : 'Read more'}
                    {isExpanded ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </span>
                </Button>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {popup.actions
              .filter(action => action.action !== 'close')
              .slice(0, 2) // Limit to 2 main actions for banner
              .map((action, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className={cn(
                  "text-xs px-3 py-1 h-auto font-medium transition-all duration-200",
                  "hover:shadow-md backdrop-blur-sm",
                  currentTheme === 'dark' 
                    ? 'border-white/20 hover:border-white/40 hover:bg-white/10' 
                    : 'border-black/20 hover:border-black/40 hover:bg-white/60'
                )}
                onClick={() => handleActionClick(action)}
              >
                {action.label}
              </Button>
            ))}
            
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-7 w-7 rounded-full shrink-0 transition-all duration-200",
                "hover:bg-black/10 dark:hover:bg-white/10"
              )}
              onClick={handleDismiss}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Subtle bottom border accent */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r opacity-60",
        config.colors.gradient
      )} />
    </div>
  );
};