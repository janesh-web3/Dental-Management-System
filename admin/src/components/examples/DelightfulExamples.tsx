import React, { useState } from 'react';
import { Save, Send, CheckCircle, AlertCircle, Star, Heart } from 'lucide-react';
import PlayfulLoader from '@/components/ui/PlayfulLoader';
import ConfettiCelebration from '@/components/ui/ConfettiCelebration';
import AccessibleDelightfulButton from '@/components/ui/AccessibleDelightfulButton';
import DelightfulButton from '@/components/ui/DelightfulButton';
import { useCommonSounds } from '@/contexts/SoundContext';

const DelightfulExamples: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [confettiTrigger, setConfettiTrigger] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  
  const {
    playSuccessSound,
    playClickSound,
    playErrorSound,
    playCelebrationSound,
    playPopSound
  } = useCommonSounds();

  const handleFormSubmit = async () => {
    setIsLoading(true);
    setFormSubmitted(false);
    playClickSound();
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setIsLoading(false);
    setFormSubmitted(true);
    setConfettiTrigger(true);
    playSuccessSound();
    playCelebrationSound();
    
    setTimeout(() => setConfettiTrigger(false), 100);
  };

  const handlePlayfulClick = (soundType: string) => {
    switch(soundType) {
      case 'pop':
        playPopSound();
        break;
      case 'success':
        playSuccessSound();
        break;
      case 'error':
        playErrorSound();
        break;
      default:
        playClickSound();
    }
  };

  const loadingMessages = [
    "Polishing your dental data...",
    "Cleaning up the records...",
    "Brushing through appointments...",
    "Flossing through the database...",
    "Whitening your experience..."
  ];

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🎉 Delightful UI Examples
        </h1>
        <p className="text-lg text-gray-600">
          Interactive components that make your dental management system fun and engaging!
        </p>
      </div>

      {/* Confetti Component */}
      <ConfettiCelebration 
        trigger={confettiTrigger}
        onComplete={() => console.log('Confetti complete!')}
        message="🦷 Patient saved successfully!"
      />

      {/* Form Submission Example */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">
          📝 Form Submission with Delightful Feedback
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Patient Name
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter patient name..."
              disabled={isLoading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Treatment Notes
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Enter treatment details..."
              disabled={isLoading}
            />
          </div>

          {/* Loading State */}
          <PlayfulLoader 
            isLoading={isLoading} 
            customMessages={loadingMessages}
            size="md"
          />
          
          {/* Success Message */}
          {formSubmitted && !isLoading && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-2">
              <CheckCircle className="text-green-500" size={20} />
              <span className="text-green-800 font-medium">
                🎊 Fantastic! Patient record saved successfully!
              </span>
            </div>
          )}

          <div className="flex space-x-4">
            <AccessibleDelightfulButton
              variant="primary"
              size="lg"
              animation="bounce"
              icon={Save}
              loading={isLoading}
              playful={true}
              soundEffect="success"
              successMessage="Patient saved!"
              onClick={handleFormSubmit}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Patient'}
            </AccessibleDelightfulButton>
            
            <DelightfulButton
              variant="outline"
              size="lg"
              animation="pulse"
              icon={Send}
              playful={true}
              onClick={() => handlePlayfulClick('pop')}
            >
              Send Reminder
            </DelightfulButton>
          </div>
        </div>
      </div>

      {/* Button Variations */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">
          🎯 Interactive Button Variations
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Animation Types */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-700">Animation Types</h3>
            
            <DelightfulButton
              variant="primary"
              animation="bounce"
              playful={true}
              onClick={() => handlePlayfulClick('click')}
            >
              Bounce Effect
            </DelightfulButton>
            
            <DelightfulButton
              variant="secondary"
              animation="pulse"
              playful={true}
              onClick={() => handlePlayfulClick('pop')}
            >
              Pulse Effect
            </DelightfulButton>
            
            <DelightfulButton
              variant="outline"
              animation="wobble"
              playful={true}
              onClick={() => handlePlayfulClick('success')}
            >
              Wobble Effect
            </DelightfulButton>
            
            <DelightfulButton
              variant="ghost"
              animation="shake"
              playful={true}
              onClick={() => handlePlayfulClick('click')}
            >
              Shake Effect
            </DelightfulButton>
          </div>

          {/* Button Variants */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-700">Button Variants</h3>
            
            <DelightfulButton
              variant="success"
              icon={CheckCircle}
              animation="scale"
              playful={true}
              onClick={() => handlePlayfulClick('success')}
            >
              Success Action
            </DelightfulButton>
            
            <DelightfulButton
              variant="destructive"
              icon={AlertCircle}
              animation="shake"
              playful={true}
              onClick={() => handlePlayfulClick('error')}
            >
              Delete Item
            </DelightfulButton>
            
            <DelightfulButton
              variant="outline"
              icon={Star}
              iconPosition="right"
              animation="glow"
              playful={true}
              onClick={() => handlePlayfulClick('pop')}
            >
              Rate Experience
            </DelightfulButton>
          </div>

          {/* Accessibility Features */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-700">Accessibility Features</h3>
            
            <AccessibleDelightfulButton
              variant="primary"
              icon={Heart}
              animation="pulse"
              playful={true}
              soundEffect="success"
              successMessage="Added to favorites!"
              onClick={() => handlePlayfulClick('success')}
              aria-label="Add patient to favorites"
            >
              Add to Favorites
            </AccessibleDelightfulButton>
            
            <p className="text-sm text-gray-600">
              ✨ This button respects user preferences for:
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Reduced motion settings</li>
              <li>• Sound preferences</li>
              <li>• High contrast mode</li>
              <li>• Screen reader compatibility</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Loading States */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">
          ⏳ Loading States & Messages
        </h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="font-medium text-gray-700 mb-3">Dental-themed Loading Messages</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <PlayfulLoader 
                isLoading={true} 
                size="lg"
                customMessages={[
                  "Scheduling your smile makeover...",
                  "Preparing the dental chair...",
                  "Sterilizing instruments...",
                  "Checking insurance coverage...",
                  "Optimizing your oral health plan..."
                ]}
              />
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-700 mb-3">General System Messages</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <PlayfulLoader 
                isLoading={true} 
                size="md"
                customMessages={[
                  "Brewing your data...",
                  "Chasing digital butterflies...",
                  "Counting pixels...",
                  "Organizing the chaos...",
                  "Making magic happen..."
                ]}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4 text-blue-900">
          📚 How to Use These Components
        </h2>
        
        <div className="space-y-4 text-blue-800">
          <div>
            <h3 className="font-semibold">1. Import Components</h3>
            <code className="block bg-white p-2 rounded mt-1 text-sm">
              import PlayfulLoader from '@/components/ui/PlayfulLoader';<br/>
              import ConfettiCelebration from '@/components/ui/ConfettiCelebration';<br/>
              import AccessibleDelightfulButton from '@/components/ui/AccessibleDelightfulButton';
            </code>
          </div>
          
          <div>
            <h3 className="font-semibold">2. Wrap Your App with Sound Provider</h3>
            <code className="block bg-white p-2 rounded mt-1 text-sm">
              import &#123; SoundProvider &#125; from '@/contexts/SoundContext';<br/>
              <br/>
              &lt;SoundProvider&gt;<br/>
              &nbsp;&nbsp;&lt;YourApp /&gt;<br/>
              &lt;/SoundProvider&gt;
            </code>
          </div>
          
          <div>
            <h3 className="font-semibold">3. Add Sound Files</h3>
            <p>Place the required sound files in <code>public/sounds/</code> directory. See SOUND_README.md for details.</p>
          </div>
          
          <div>
            <h3 className="font-semibold">4. Configure User Preferences</h3>
            <p>Set up the backend API endpoints to store user surprise preferences in MongoDB.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DelightfulExamples;