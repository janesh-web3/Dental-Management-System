import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Save, Send } from 'lucide-react';
import PlayfulLoader from './PlayfulLoader';
import ConfettiCelebration from './ConfettiCelebration';
import AccessibleDelightfulButton from './AccessibleDelightfulButton';
import { useCommonSounds } from '@/contexts/SoundContext';
import { cn } from '@/lib/utils';

interface DelightfulFormProps {
  onSubmit: (formData: FormData | any) => Promise<void>;
  children: React.ReactNode;
  title?: string;
  submitLabel?: string;
  loadingMessages?: string[];
  successMessage?: string;
  submitIcon?: React.ComponentType<{ size?: number; className?: string }>;
  className?: string;
  celebrateOnSuccess?: boolean;
  playfulFeedback?: boolean;
  formType?: 'patient' | 'doctor' | 'appointment' | 'financial' | 'general';
}

const formTypeMessages = {
  patient: [
    "Creating patient magic...",
    "Polishing dental records...",
    "Preparing the perfect smile...",
    "Scheduling oral health success...",
    "Building patient happiness..."
  ],
  doctor: [
    "Welcoming our new dental hero...",
    "Setting up the perfect workspace...",
    "Preparing dental excellence...",
    "Creating treatment mastery...",
    "Building medical expertise..."
  ],
  appointment: [
    "Scheduling dental success...",
    "Coordinating the perfect time...",
    "Preparing the dental chair...",
    "Organizing oral care...",
    "Planning smile improvements..."
  ],
  financial: [
    "Calculating dental economics...",
    "Processing payment magic...",
    "Organizing financial wellness...",
    "Balancing the books...",
    "Managing monetary success..."
  ],
  general: [
    "Processing your request...",
    "Making things happen...",
    "Organizing the details...",
    "Preparing the results...",
    "Finalizing everything..."
  ]
};

const successMessages = {
  patient: "🦷 Patient record created successfully! Ready for dental care!",
  doctor: "👨‍⚕️ Doctor added successfully! Welcome to the team!",
  appointment: "📅 Appointment scheduled successfully! See you soon!",
  financial: "💰 Financial record updated successfully! Money matters managed!",
  general: "✨ Operation completed successfully! You're awesome!"
};

const DelightfulForm: React.FC<DelightfulFormProps> = ({
  onSubmit,
  children,
  title,
  submitLabel = "Save",
  loadingMessages,
  successMessage,
  submitIcon: SubmitIcon = Save,
  className,
  celebrateOnSuccess = true,
  playfulFeedback = true,
  formType = 'general'
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string>('');
  const [showConfetti, setShowConfetti] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  
  const {
    playSuccessSound,
    playCelebrationSound,
    playErrorSound,
    playClickSound
  } = useCommonSounds();

  const getLoadingMessages = () => {
    return loadingMessages || formTypeMessages[formType];
  };

  const getSuccessMessage = () => {
    return successMessage || successMessages[formType];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setIsSuccess(false);
    
    playClickSound();

    try {
      const formData = new FormData(formRef.current!);
      
      // Convert FormData to plain object if needed
      const formObject: any = {};
      formData.forEach((value, key) => {
        formObject[key] = value;
      });

      await onSubmit(formObject);
      
      setIsLoading(false);
      setIsSuccess(true);
      
      if (celebrateOnSuccess) {
        setShowConfetti(true);
        playCelebrationSound();
        setTimeout(() => setShowConfetti(false), 100);
      } else {
        playSuccessSound();
      }
      
      // Reset form after success
      setTimeout(() => {
        setIsSuccess(false);
        if (formRef.current) {
          formRef.current.reset();
        }
      }, 3000);
      
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || 'Something went wrong. Please try again.');
      playErrorSound();
    }
  };

  return (
    <div className={cn("max-w-2xl mx-auto", className)}>
      {/* Confetti Effect */}
      <ConfettiCelebration
        trigger={showConfetti}
        message={getSuccessMessage()}
        onComplete={() => console.log('Form success celebration complete!')}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-xl shadow-lg p-6 space-y-6"
      >
        {/* Title */}
        {title && (
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold text-gray-900 mb-6"
          >
            {title}
          </motion.h2>
        )}

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          {/* Form Content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            {children}
          </motion.div>

          {/* Loading State */}
          <PlayfulLoader
            isLoading={isLoading}
            customMessages={getLoadingMessages()}
            size="lg"
          />

          {/* Success State */}
          <AnimatePresence>
            {isSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                transition={{ type: "spring", damping: 15, stiffness: 300 }}
                className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", damping: 12, stiffness: 400 }}
                >
                  <CheckCircle className="text-green-500" size={24} />
                </motion.div>
                <div className="flex-1">
                  <motion.p
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-green-800 font-medium"
                  >
                    {getSuccessMessage()}
                  </motion.p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error State */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                transition={{ type: "spring", damping: 15, stiffness: 300 }}
                className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3"
              >
                <AlertCircle className="text-red-500" size={24} />
                <p className="text-red-800 font-medium">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex justify-end space-x-4 pt-4"
          >
            <AccessibleDelightfulButton
              type="submit"
              variant="primary"
              size="lg"
              animation="bounce"
              icon={SubmitIcon}
              loading={isLoading}
              playful={playfulFeedback}
              soundEffect="success"
              successMessage="Form submitted!"
              disabled={isLoading}
              className="min-w-[120px]"
            >
              {isLoading ? 'Saving...' : submitLabel}
            </AccessibleDelightfulButton>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
};

export default DelightfulForm;