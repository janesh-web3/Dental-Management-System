import React, { useEffect, useState } from 'react';
import { X, AlertCircle, Calendar, CreditCard, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTheme } from '@/providers/theme-provider';
import { PopupModalProps } from '@/types/popup';
import { BlockingModal } from '@/components/ui/enhanced-popup';

const typeConfig = {
  'Notice': {
    icon: Bell,
    colors: {
      light: 'bg-blue-50 text-blue-900 border-blue-200',
      dark: 'bg-blue-950 text-blue-100 border-blue-800',
      badge: {
        light: 'bg-blue-100 text-blue-800 border-blue-300',
        dark: 'bg-blue-900 text-blue-200 border-blue-700'
      },
      gradient: 'from-blue-500/20 to-blue-600/20'
    }
  },
  'Event': {
    icon: Calendar,
    colors: {
      light: 'bg-green-50 text-green-900 border-green-200',
      dark: 'bg-green-950 text-green-100 border-green-800',
      badge: {
        light: 'bg-green-100 text-green-800 border-green-300',
        dark: 'bg-green-900 text-green-200 border-green-700'
      },
      gradient: 'from-green-500/20 to-green-600/20'
    }
  },
  'Payment Reminder': {
    icon: CreditCard,
    colors: {
      light: 'bg-amber-50 text-amber-900 border-amber-200',
      dark: 'bg-amber-950 text-amber-100 border-amber-800',
      badge: {
        light: 'bg-amber-100 text-amber-800 border-amber-300',
        dark: 'bg-amber-900 text-amber-200 border-amber-700'
      },
      gradient: 'from-amber-500/20 to-amber-600/20'
    }
  },
  'Alert': {
    icon: AlertCircle,
    colors: {
      light: 'bg-red-50 text-red-900 border-red-200',
      dark: 'bg-red-950 text-red-100 border-red-800',
      badge: {
        light: 'bg-red-100 text-red-800 border-red-300',
        dark: 'bg-red-900 text-red-200 border-red-700'
      },
      gradient: 'from-red-500/20 to-red-600/20'
    }
  }
};

export const PopupModal: React.FC<PopupModalProps> = ({
  popup,
  isOpen,
  onClose,
  onView,
  onDismiss,
  onActionClick
}) => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

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
    if (isOpen && popup) {
      onView(popup._id);
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, popup, onView]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Block all escape methods
      if (e.key === 'Escape' ||
          e.key === 'F5' ||
          (e.ctrlKey && e.key === 'r') ||
          (e.altKey && e.key === 'F4')) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'You must complete the required action before leaving.';
      return 'You must complete the required action before leaving.';
    };

    // Use capture phase to ensure we catch all events
    document.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isOpen]);

  if (!isOpen || !popup) return null;

  // Use BlockingModal for critical Alert type popups
  if (popup.type === 'Alert' && popup.actions.length === 1 && popup.actions[0].action === 'close') {
    return (
      <BlockingModal
        isOpen={isOpen}
        onConfirm={async () => {
          await onDismiss(popup._id);
          onClose();
        }}
        title={popup.title}
        description={popup.message}
        confirmLabel={popup.actions[0].label || 'Acknowledge'}
      />
    );
  }

  const handleActionClick = (action: any) => {
    if (action.action === 'close') {
      onDismiss(popup._id);
      onClose();
    } else {
      onActionClick(action);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Prevent backdrop clicks from closing modal
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      {/* Blocking backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Main modal */}
      <Card className={cn(
        "relative w-full max-w-md mx-auto shadow-2xl border-0 overflow-hidden",
        "animate-in fade-in-0 zoom-in-95 duration-300",
        isAnimating && "scale-110 duration-150"
      )}>
        {/* Gradient header background */}
        <div className={cn(
          "absolute top-0 left-0 right-0 h-32 bg-gradient-to-br opacity-20",
          config.colors.gradient
        )} />
        
        <CardHeader className="relative pb-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className={cn(
                "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                config.colors[currentTheme]
              )}>
                <IconComponent className="w-5 h-5" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <CardTitle className="text-lg font-bold truncate">
                    {popup.title}
                  </CardTitle>
                </div>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-xs font-medium",
                    config.colors.badge[currentTheme]
                  )}
                >
                  {popup.type}
                </Badge>
              </div>
            </div>
            
            {/* Hide close button for Alert type popups to force interaction */}
            {popup.type !== 'Alert' && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-muted/80 flex-shrink-0"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="pt-2 space-y-4">
          {/* Alert type blocking warning */}
          {popup.type === 'Alert' && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-red-800">
                  <p className="font-medium">⚠️ System Locked</p>
                  <p className="mt-1">You must acknowledge this alert before continuing. All other actions are disabled.</p>
                </div>
              </div>
            </div>
          )}

          {/* Message with better typography */}
          <div className="text-sm leading-relaxed text-foreground/90">
            {popup.message.split('\n').map((line, index) => (
              <p key={index} className={index > 0 ? 'mt-2' : ''}>
                {line}
              </p>
            ))}
          </div>

          {/* Timing info with better styling */}
          {popup.startTime && (
            <div className={cn(
              "text-xs p-3 rounded-lg border",
              currentTheme === 'dark' 
                ? 'bg-muted/50 border-muted text-muted-foreground'
                : 'bg-muted/30 border-muted text-muted-foreground'
            )}>
              <div className="flex items-center gap-1 mb-1">
                <Calendar className="w-3 h-3" />
                <span className="font-medium">Schedule</span>
              </div>
              <div>
                <strong>Active from:</strong>{' '}
                {new Date(popup.startTime).toLocaleString()}
              </div>
              {popup.endTime && (
                <div>
                  <strong>Until:</strong>{' '}
                  {new Date(popup.endTime).toLocaleString()}
                </div>
              )}
            </div>
          )}

          {/* Action buttons with modern styling */}
          <div className="flex flex-col gap-2 pt-2">
            {popup.actions.map((action, index) => (
              <Button
                key={index}
                variant={action.action === 'close' ? 'outline' : 'default'}
                size="sm"
                className={cn(
                  "w-full font-medium transition-all duration-200",
                  action.action !== 'close' && "shadow-sm hover:shadow-md"
                )}
                onClick={() => handleActionClick(action)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </CardContent>

        {/* Subtle bottom accent */}
        <div className={cn(
          "h-1 bg-gradient-to-r",
          config.colors.gradient
        )} />
      </Card>
    </div>
  );
};