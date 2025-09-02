import React, { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Trash2, Edit, Plus, Eye } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import ConfettiCelebration from './ConfettiCelebration';
import PlayfulLoader from './PlayfulLoader';
import AccessibleDelightfulButton from './AccessibleDelightfulButton';
import { useCommonSounds } from '@/contexts/SoundContext';
import { toast } from 'react-toastify';

type ActionType = 'create' | 'read' | 'update' | 'delete' | 'custom';

interface DelightfulActionConfig {
  type: ActionType;
  entityName: string; // e.g., 'patient', 'appointment', 'doctor'
  actionName?: string; // custom action name
  confirmMessage?: string;
  successMessage?: string;
  loadingMessages?: string[];
  dangerousAction?: boolean;
  celebrateOnSuccess?: boolean;
  playSound?: boolean;
}

interface DelightfulActionWrapperProps {
  config: DelightfulActionConfig;
  onAction: () => Promise<any>;
  trigger: ReactNode;
  disabled?: boolean;
  children?: ReactNode;
}

const actionIcons = {
  create: Plus,
  read: Eye,
  update: Edit,
  delete: Trash2,
  custom: CheckCircle
};

const actionColors = {
  create: 'text-green-500',
  read: 'text-blue-500',
  update: 'text-orange-500',
  delete: 'text-red-500',
  custom: 'text-purple-500'
};

const getDefaultMessages = (type: ActionType, entityName: string) => {
  switch (type) {
    case 'create':
      return {
        confirm: `Are you sure you want to create this ${entityName}?`,
        success: `🎉 ${entityName} created successfully!`,
        loading: [
          `Creating your ${entityName}...`,
          `Preparing the magic...`,
          `Making it awesome...`,
          `Almost there...`
        ]
      };
    case 'update':
      return {
        confirm: `Are you sure you want to update this ${entityName}?`,
        success: `✨ ${entityName} updated successfully!`,
        loading: [
          `Updating your ${entityName}...`,
          `Applying changes...`,
          `Making improvements...`,
          `Polishing details...`
        ]
      };
    case 'delete':
      return {
        confirm: `Are you sure you want to delete this ${entityName}? This action cannot be undone.`,
        success: `🗑️ ${entityName} deleted successfully!`,
        loading: [
          `Removing ${entityName}...`,
          `Cleaning up data...`,
          `Processing deletion...`,
          `Finalizing changes...`
        ]
      };
    case 'read':
      return {
        confirm: `Load ${entityName} details?`,
        success: `📄 ${entityName} loaded successfully!`,
        loading: [
          `Loading ${entityName}...`,
          `Fetching details...`,
          `Gathering information...`,
          `Almost ready...`
        ]
      };
    default:
      return {
        confirm: `Proceed with this action on ${entityName}?`,
        success: `✅ Action completed successfully!`,
        loading: [
          `Processing ${entityName}...`,
          `Working on it...`,
          `Making progress...`,
          `Nearly done...`
        ]
      };
  }
};

const DelightfulActionWrapper: React.FC<DelightfulActionWrapperProps> = ({
  config,
  onAction,
  trigger,
  disabled = false,
  children
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [error, setError] = useState<string>('');
  
  const {
    playSuccessSound,
    playErrorSound,
    playClickSound,
    playCelebrationSound
  } = useCommonSounds();

  const defaultMessages = getDefaultMessages(config.type, config.entityName);
  const ActionIcon = actionIcons[config.type];
  const iconColor = actionColors[config.type];

  const handleTriggerClick = () => {
    if (disabled) return;
    
    playClickSound();
    
    if (config.dangerousAction || config.type === 'delete') {
      setShowConfirm(true);
    } else {
      executeAction();
    }
  };

  const executeAction = async () => {
    setIsLoading(true);
    setError('');
    setShowConfirm(false);

    try {
      const result = await onAction();
      
      setIsLoading(false);
      
      const successMessage = config.successMessage || defaultMessages.success;
      
      if (config.celebrateOnSuccess !== false && (config.type === 'create' || config.type === 'update')) {
        setShowConfetti(true);
        playCelebrationSound();
        setTimeout(() => setShowConfetti(false), 100);
      } else {
        playSuccessSound();
      }
      
      toast.success(successMessage);
      
      return result;
    } catch (err: any) {
      setIsLoading(false);
      const errorMessage = err.message || `Failed to ${config.actionName || config.type} ${config.entityName}`;
      setError(errorMessage);
      playErrorSound();
      toast.error(errorMessage);
      throw err;
    }
  };

  return (
    <>
      <ConfettiCelebration
        trigger={showConfetti}
        message={config.successMessage || defaultMessages.success}
        onComplete={() => console.log('Action celebration complete!')}
      />

      {/* Trigger Element */}
      <div onClick={handleTriggerClick} className={disabled ? 'pointer-events-none opacity-50' : 'cursor-pointer'}>
        {trigger}
      </div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-8 shadow-2xl max-w-md w-full mx-4"
            >
              <PlayfulLoader
                isLoading={true}
                customMessages={config.loadingMessages || defaultMessages.loading}
                size="lg"
                showIcon={true}
              />
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-4 text-center"
              >
                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <ActionIcon className={iconColor} size={20} />
                  <span className="font-medium">
                    {config.actionName || `${config.type}ing`} {config.entityName}...
                  </span>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ActionIcon className={iconColor} size={24} />
              Confirm {config.actionName || config.type}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {config.confirmMessage || defaultMessages.confirm}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => playClickSound()}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeAction}
              className={config.type === 'delete' ? 'bg-red-500 hover:bg-red-600' : ''}
            >
              {config.actionName || `${config.type} ${config.entityName}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg z-50 max-w-md"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="text-red-500" size={24} />
              <div>
                <h4 className="font-medium text-red-900">Action Failed</h4>
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <AccessibleDelightfulButton
                variant="ghost"
                size="sm"
                onClick={() => setError('')}
                className="ml-auto"
              >
                ✕
              </AccessibleDelightfulButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {children}
    </>
  );
};

export default DelightfulActionWrapper;

// Convenience hook for common actions
export const useDelightfulActions = () => {
  return {
    createAction: (entityName: string, customMessages?: Partial<DelightfulActionConfig>) => ({
      type: 'create' as ActionType,
      entityName,
      celebrateOnSuccess: true,
      playSound: true,
      ...customMessages
    }),
    
    updateAction: (entityName: string, customMessages?: Partial<DelightfulActionConfig>) => ({
      type: 'update' as ActionType,
      entityName,
      celebrateOnSuccess: true,
      playSound: true,
      ...customMessages
    }),
    
    deleteAction: (entityName: string, customMessages?: Partial<DelightfulActionConfig>) => ({
      type: 'delete' as ActionType,
      entityName,
      dangerousAction: true,
      celebrateOnSuccess: false,
      playSound: true,
      ...customMessages
    }),
    
    readAction: (entityName: string, customMessages?: Partial<DelightfulActionConfig>) => ({
      type: 'read' as ActionType,
      entityName,
      celebrateOnSuccess: false,
      playSound: true,
      ...customMessages
    }),
    
    customAction: (entityName: string, actionName: string, customMessages?: Partial<DelightfulActionConfig>) => ({
      type: 'custom' as ActionType,
      entityName,
      actionName,
      celebrateOnSuccess: true,
      playSound: true,
      ...customMessages
    })
  };
};