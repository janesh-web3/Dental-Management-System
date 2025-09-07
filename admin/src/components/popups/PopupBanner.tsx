import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PopupBannerProps } from '@/types/popup';

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

export const PopupBanner: React.FC<PopupBannerProps> = ({
  popup,
  position = 'top',
  onView,
  onDismiss,
  onActionClick
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [hasViewed, setHasViewed] = useState(false);

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

  return (
    <div
      className={cn(
        'fixed left-0 right-0 z-40 animate-in slide-in-from-top-2 duration-300',
        position === 'top' ? 'top-0' : 'bottom-0',
        typeColors[popup.type],
        'border-b px-4 py-3 shadow-sm'
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Badge 
            variant="outline" 
            className={cn(badgeColors[popup.type], 'shrink-0')}
          >
            {popup.type}
          </Badge>
          
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">
              {popup.title}
            </div>
            <div className="text-xs text-muted-foreground line-clamp-2">
              {popup.message}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {popup.actions
            .filter(action => action.action !== 'close')
            .slice(0, 2) // Limit to 2 main actions for banner
            .map((action, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="text-xs px-2 py-1 h-auto"
              onClick={() => handleActionClick(action)}
            >
              {action.label}
            </Button>
          ))}
          
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-full shrink-0"
            onClick={handleDismiss}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};