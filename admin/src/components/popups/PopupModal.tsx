import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PopupModalProps } from '@/types/popup';

const typeColors = {
  'Notice': 'bg-blue-100 text-blue-800 border-blue-200',
  'Event': 'bg-green-100 text-green-800 border-green-200',
  'Payment Reminder': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Alert': 'bg-red-100 text-red-800 border-red-200'
};

export const PopupModal: React.FC<PopupModalProps> = ({
  popup,
  isOpen,
  onClose,
  onView,
  onDismiss,
  onActionClick
}) => {
  useEffect(() => {
    if (isOpen && popup) {
      onView(popup._id);
    }
  }, [isOpen, popup, onView]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !popup) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleActionClick = (action: any) => {
    if (action.action === 'close') {
      onDismiss(popup._id);
      onClose();
    } else {
      onActionClick(action);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <Card className="w-full max-w-md mx-auto animate-in fade-in-0 zoom-in-95 duration-200">
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-semibold">
                {popup.title}
              </CardTitle>
              <Badge 
                variant="outline" 
                className={cn(typeColors[popup.type])}
              >
                {popup.type}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground whitespace-pre-wrap">
            {popup.message}
          </div>

          {popup.startTime && (
            <div className="text-xs text-muted-foreground">
              <strong>Active from:</strong>{' '}
              {new Date(popup.startTime).toLocaleString()}
              {popup.endTime && (
                <>
                  {' to '}
                  {new Date(popup.endTime).toLocaleString()}
                </>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2 pt-2">
            {popup.actions.map((action, index) => (
              <Button
                key={index}
                variant={action.action === 'close' ? 'outline' : 'default'}
                size="sm"
                className="w-full"
                onClick={() => handleActionClick(action)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};