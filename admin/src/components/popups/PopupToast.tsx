import React, { useEffect, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PopupToastProps } from '@/types/popup';

const typeColors = {
  'Notice': 'bg-blue-50 border-blue-200 text-blue-900',
  'Event': 'bg-green-50 border-green-200 text-green-900',
  'Payment Reminder': 'bg-yellow-50 border-yellow-200 text-yellow-900',
  'Alert': 'bg-red-50 border-red-200 text-red-900'
};

const badgeColors = {
  'Notice': 'bg-blue-100 text-blue-800 border-blue-200',
  'Event': 'bg-green-100 text-green-800 border-green-200',
  'Payment Reminder': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Alert': 'bg-red-100 text-red-800 border-red-200'
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
  const [isVisible, setIsVisible] = useState(true);
  const [hasViewed, setHasViewed] = useState(false);
  const [progress, setProgress] = useState(100);

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
  }, [duration, handleDismiss]);

  const handleActionClick = (action: any) => {
    if (action.action === 'close') {
      handleDismiss();
    } else {
      onActionClick(action);
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'fixed z-50 w-80 animate-in slide-in-from-right-2 fade-in-0 duration-300',
        positionClasses[position]
      )}
    >
      <div
        className={cn(
          'relative bg-background border rounded-lg shadow-lg overflow-hidden',
          typeColors[popup.type]
        )}
      >
        {/* Progress bar */}
        {duration > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10">
            <div
              className="h-full bg-primary transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Badge 
                variant="outline" 
                className={cn(badgeColors[popup.type], 'shrink-0 text-xs')}
              >
                {popup.type}
              </Badge>
              <div className="font-medium text-sm truncate">
                {popup.title}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 rounded-full shrink-0"
              onClick={handleDismiss}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          <div className="text-xs text-muted-foreground mb-3 line-clamp-3">
            {popup.message}
          </div>

          {popup.actions.length > 0 && (
            <div className="flex gap-2">
              {popup.actions.slice(0, 2).map((action, index) => (
                <Button
                  key={index}
                  variant={action.action === 'close' ? 'outline' : 'default'}
                  size="sm"
                  className="text-xs px-2 py-1 h-auto flex-1"
                  onClick={() => handleActionClick(action)}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}

          {popup.startTime && (
            <div className="text-xs text-muted-foreground mt-2 opacity-70">
              {new Date(popup.startTime).toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};