import React, { useState, useEffect, ReactNode } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  X,
  AlertTriangle,
  HelpCircle,
  MessageSquare,
  Trash2,
  Save,
} from 'lucide-react';

// Types
export type PopupVariant = 'info' | 'success' | 'warning' | 'error' | 'question' | 'custom';
export type PopupSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';

export interface PopupButton {
  label: string;
  variant?: ButtonVariant;
  onClick?: () => void | Promise<void>;
  loading?: boolean;
  disabled?: boolean;
  autoClose?: boolean;
  icon?: ReactNode;
}

export interface PopupProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  content?: ReactNode;
  variant?: PopupVariant;
  size?: PopupSize;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  preventClose?: boolean;
  buttons?: PopupButton[];
  footer?: ReactNode;
  icon?: ReactNode;
  badge?: string;
  autoCloseDelay?: number;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  footerClassName?: string;
  animated?: boolean;
}

// Variant configurations
const variantConfig = {
  info: {
    icon: Info,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    alertVariant: 'default'
  },
  success: {
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    alertVariant: 'default'
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    alertVariant: 'default'
  },
  error: {
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    alertVariant: 'destructive'
  },
  question: {
    icon: HelpCircle,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    alertVariant: 'default'
  },
  custom: {
    icon: MessageSquare,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    alertVariant: 'default'
  }
} as const;

// Size configurations
const sizeConfig = {
  sm: 'sm:max-w-[400px]',
  md: 'sm:max-w-[500px]',
  lg: 'sm:max-w-[700px]',
  xl: 'sm:max-w-[900px]',
  full: 'sm:max-w-[95vw] max-h-[95vh]'
};

export const EnhancedPopup: React.FC<PopupProps> = ({
  isOpen,
  onClose,
  title,
  description,
  content,
  variant = 'info',
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  preventClose = false,
  buttons = [],
  footer,
  icon,
  badge,
  autoCloseDelay,
  className,
  headerClassName,
  contentClassName,
  footerClassName,
  animated = true
}) => {
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const config = variantConfig[variant];
  const VariantIcon = icon ? () => icon : config.icon;

  // Auto close functionality
  useEffect(() => {
    if (autoCloseDelay && isOpen) {
      setCountdown(autoCloseDelay);
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev && prev <= 1) {
            onClose();
            return null;
          }
          return prev ? prev - 1 : null;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [autoCloseDelay, isOpen, onClose]);

  const handleButtonClick = async (button: PopupButton) => {
    if (button.loading) return;

    setLoading(true);
    try {
      if (button.onClick) {
        await button.onClick();
      }
      if (button.autoClose !== false) {
        onClose();
      }
    } catch (error) {
      console.error('Button click error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (preventClose || loading) return;
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={closeOnOverlayClick ? handleClose : undefined}>
      <DialogContent
        className={cn(
          sizeConfig[size],
          'overflow-hidden',
          animated && 'animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2',
          className
        )}
        onPointerDownOutside={(e) => {
          if (!closeOnOverlayClick || preventClose) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader className={cn('space-y-3', headerClassName)}>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className={cn(
                'flex-shrink-0 p-2 rounded-full',
                config.bgColor,
                config.borderColor,
                'border'
              )}>
                <VariantIcon className={cn('h-5 w-5', config.color)} />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <DialogTitle className="text-lg font-semibold">
                    {title}
                  </DialogTitle>
                  {badge && (
                    <Badge variant="secondary" className="text-xs">
                      {badge}
                    </Badge>
                  )}
                  {countdown && (
                    <Badge variant="outline" className="text-xs">
                      Auto-close in {countdown}s
                    </Badge>
                  )}
                </div>
                {description && (
                  <DialogDescription className="mt-1 text-sm text-muted-foreground">
                    {description}
                  </DialogDescription>
                )}
              </div>
            </div>
            {showCloseButton && !preventClose && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-full"
                onClick={handleClose}
                disabled={loading}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogHeader>

        {content && (
          <div className={cn('py-4', contentClassName)}>
            {typeof content === 'string' ? (
              <Alert variant={config.alertVariant} className={cn(config.bgColor, config.borderColor)}>
                <VariantIcon className="h-4 w-4" />
                <AlertTitle>Message</AlertTitle>
                <AlertDescription>{content}</AlertDescription>
              </Alert>
            ) : (
              content
            )}
          </div>
        )}

        {(buttons.length > 0 || footer) && (
          <div className={cn('space-y-4', footerClassName)}>
            {buttons.length > 0 && (
              <div className="flex justify-end space-x-2">
                {buttons.map((button, index) => (
                  <Button
                    key={index}
                    variant={button.variant || 'default'}
                    onClick={() => handleButtonClick(button)}
                    disabled={button.disabled || loading}
                    className="flex items-center space-x-2"
                  >
                    {button.loading && loading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        <span>Loading...</span>
                      </>
                    ) : (
                      <>
                        {button.icon && <span className="h-4 w-4">{button.icon}</span>}
                        <span>{button.label}</span>
                      </>
                    )}
                  </Button>
                ))}
              </div>
            )}
            {footer && (
              <>
                {buttons.length > 0 && <Separator />}
                <div>{footer}</div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Pre-built popup types for common use cases
interface ConfirmPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'warning' | 'error' | 'question';
  destructive?: boolean;
  loading?: boolean;
}

export const ConfirmPopup: React.FC<ConfirmPopupProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'question',
  destructive = false,
  loading = false
}) => {
  return (
    <EnhancedPopup
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      variant={variant}
      size="sm"
      buttons={[
        {
          label: cancelLabel,
          variant: 'outline',
          onClick: onClose
        },
        {
          label: confirmLabel,
          variant: destructive ? 'destructive' : 'default',
          onClick: onConfirm,
          loading,
          icon: destructive ? <Trash2 className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />
        }
      ]}
    />
  );
};

interface AlertPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  variant?: PopupVariant;
  buttonLabel?: string;
  autoClose?: number;
}

export const AlertPopup: React.FC<AlertPopupProps> = ({
  isOpen,
  onClose,
  title,
  message,
  variant = 'info',
  buttonLabel = 'OK',
  autoClose
}) => {
  return (
    <EnhancedPopup
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      content={message}
      variant={variant}
      size="sm"
      autoCloseDelay={autoClose}
      buttons={[
        {
          label: buttonLabel,
          variant: 'default',
          onClick: onClose
        }
      ]}
    />
  );
};

interface LoadingPopupProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  progress?: number;
  showProgress?: boolean;
}

export const LoadingPopup: React.FC<LoadingPopupProps> = ({
  isOpen,
  title = 'Loading',
  message = 'Please wait...',
  progress,
  showProgress = false
}) => {
  return (
    <EnhancedPopup
      isOpen={isOpen}
      onClose={() => {}}
      title={title}
      variant="info"
      size="sm"
      preventClose={true}
      showCloseButton={false}
      closeOnOverlayClick={false}
      content={
        <div className="flex flex-col items-center space-y-4 py-6">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">{message}</p>
          {showProgress && typeof progress === 'number' && (
            <div className="w-full space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      }
    />
  );
};

interface FormPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void | Promise<void>;
  title: string;
  description?: string;
  children: ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  size?: PopupSize;
}

export const FormPopup: React.FC<FormPopupProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  description,
  children,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  loading = false,
  size = 'md'
}) => {
  // Wrapper function to match PopupButton's onClick signature
  const handleSubmit = () => {
    // Call onSubmit with no parameters since we don't have form data in this context
    return onSubmit(undefined);
  };

  return (
    <EnhancedPopup
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      variant="custom"
      size={size}
      content={children}
      buttons={[
        {
          label: cancelLabel,
          variant: 'outline',
          onClick: onClose
        },
        {
          label: submitLabel,
          variant: 'default',
          onClick: handleSubmit,
          loading,
          icon: <Save className="h-4 w-4" />
        }
      ]}
    />
  );
};

// Hook for managing popup state
export const usePopup = (initialOpen = false) => {
  const [isOpen, setIsOpen] = useState(initialOpen);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen(!isOpen);

  return {
    isOpen,
    open,
    close,
    toggle,
    setIsOpen
  };
};

// Context for global popup management
export interface PopupContextValue {
  showAlert: (props: Omit<AlertPopupProps, 'isOpen' | 'onClose'>) => void;
  showConfirm: (props: Omit<ConfirmPopupProps, 'isOpen' | 'onClose'>) => Promise<boolean>;
  showLoading: (props?: Omit<LoadingPopupProps, 'isOpen'>) => () => void;
}

const PopupContext = React.createContext<PopupContextValue | null>(null);

export const usePopupContext = () => {
  const context = React.useContext(PopupContext);
  if (!context) {
    throw new Error('usePopupContext must be used within PopupProvider');
  }
  return context;
};

interface PopupProviderProps {
  children: ReactNode;
}

// Blocking Modal Component - Prevents all user interactions
interface BlockingModalProps {
  isOpen: boolean;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  confirmLabel?: string;
  loading?: boolean;
  className?: string;
}

export const BlockingModal: React.FC<BlockingModalProps> = ({
  isOpen,
  onConfirm,
  title = "System Notice",
  description = "You must complete this action before continuing in the system.",
  confirmLabel = "Confirm",
  loading = false,
  className
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
    } catch (error) {
      console.error('Blocking modal confirm error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Prevent all escape methods
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent Escape key
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
      }
      // Prevent F5/Ctrl+R refresh
      if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
        e.preventDefault();
        e.stopPropagation();
      }
      // Prevent Alt+F4
      if (e.altKey && e.key === 'F4') {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'You must complete the required action before leaving.';
      return 'You must complete the required action before leaving.';
    };

    document.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isButtonLoading = loading || isLoading;

  return (
    <Dialog open={true} modal={true}>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999]" />
      <div className="fixed top-1/2 left-1/2 w-[90%] max-w-md -translate-x-1/2 -translate-y-1/2 z-[10000]">
        <div className={cn(
          "rounded-2xl bg-white p-6 shadow-lg focus:outline-none",
          "animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2",
          className
        )}>
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-2">
              <div className="flex-shrink-0 p-2 rounded-full bg-red-50 border border-red-200">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                {title}
              </h2>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              {description}
            </p>
          </div>

          {/* Content Warning */}
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-amber-800">
                <p className="font-medium">Important Notice:</p>
                <p className="mt-1">This action is required to continue. The system is temporarily locked until you complete this step.</p>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleConfirm}
              disabled={isButtonLoading}
              className="w-full font-medium bg-red-600 hover:bg-red-700 text-white"
              size="lg"
            >
              {isButtonLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{confirmLabel}</span>
                </div>
              )}
            </Button>
          </div>

          {/* Footer Notice */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              No other actions are available until this is completed
            </p>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

// Full Screen Popup Component
interface FullScreenPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  content?: ReactNode;
  actions?: Array<{
    label: string;
    variant?: ButtonVariant;
    onClick: () => void;
  }>;
}

export const FullScreenPopup: React.FC<FullScreenPopupProps> = ({
  isOpen,
  onClose,
  title,
  description,
  content,
  actions = []
}) => {
  return (
    <EnhancedPopup
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      content={content}
      variant="custom"
      size="full"
      buttons={actions.map(action => ({
        label: action.label,
        variant: action.variant || 'default',
        onClick: action.onClick
      }))}
    />
  );
};

export const PopupProvider: React.FC<PopupProviderProps> = ({ children }) => {
  const [alerts, setAlerts] = useState<Array<AlertPopupProps & { id: string; resolve?: () => void }>>([]);
  const [confirms, setConfirms] = useState<Array<ConfirmPopupProps & { id: string; resolve?: (value: boolean) => void }>>([]);
  const [loading, setLoading] = useState<LoadingPopupProps | null>(null);

  const showAlert = (props: Omit<AlertPopupProps, 'isOpen' | 'onClose'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setAlerts(prev => [...prev, { ...props, id, isOpen: true, onClose: () => removeAlert(id) }]);
  };

  const showConfirm = (props: Omit<ConfirmPopupProps, 'isOpen' | 'onClose'>): Promise<boolean> => {
    return new Promise((resolve) => {
      const id = Math.random().toString(36).substr(2, 9);
      setConfirms(prev => [...prev, {
        ...props,
        id,
        isOpen: true,
        onClose: () => {
          removeConfirm(id);
          resolve(false);
        },
        onConfirm: async () => {
          if (props.onConfirm) {
            await props.onConfirm();
          }
          removeConfirm(id);
          resolve(true);
        },
        resolve
      }]);
    });
  };

  const showLoading = (props?: Omit<LoadingPopupProps, 'isOpen'>) => {
    setLoading({ ...props, isOpen: true });
    return () => setLoading(null);
  };

  const removeAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const removeConfirm = (id: string) => {
    setConfirms(prev => prev.filter(confirm => confirm.id !== id));
  };

  return (
    <PopupContext.Provider value={{ showAlert, showConfirm, showLoading }}>
      {children}
      {alerts.map(alert => (
        <AlertPopup key={alert.id} {...alert} />
      ))}
      {confirms.map(confirm => (
        <ConfirmPopup key={confirm.id} {...confirm} />
      ))}
      {loading && <LoadingPopup {...loading} />}
    </PopupContext.Provider>
  );
};
