import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PopupModal } from './PopupModal';
import { PopupBanner } from './PopupBanner';
import { PopupToast } from './PopupToast';
import { FullScreenPopup } from '@/components/ui/enhanced-popup';
import { getActivePopupsForUser, markAsViewed, dismissPopup } from '@/services/popupService';
import { Popup, PopupAction } from '@/types/popup';
import { useSocket } from '@/contexts/SocketContext';

interface PopupDisplayProps {
  className?: string;
}

export const PopupDisplay: React.FC<PopupDisplayProps> = ({ className }) => {
  const [popups, setPopups] = useState<Popup[]>([]);
  const [currentModal, setCurrentModal] = useState<Popup | null>(null);
  const [bannerPopup, setBannerPopup] = useState<Popup | null>(null);
  const [toastPopups, setToastPopups] = useState<Popup[]>([]);
  const [fullScreenPopup, setFullScreenPopup] = useState<Popup | null>(null);
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();

  // Fetch active popups
  const fetchActivePopups = useCallback(async () => {
    try {
      console.log('🔍 Fetching active popups...');
      const response = await getActivePopupsForUser();
      console.log('📋 Popup response:', response);
      
      if (response.success) {
        const activePopups = response.data;
        console.log(`✅ Found ${activePopups.length} active popups:`, activePopups);
        setPopups(activePopups);

        // Separate popups by display type
        const modal = activePopups.find(p => p.displayType === 'Modal');
        const banner = activePopups.find(p => p.displayType === 'Banner');
        const toasts = activePopups.filter(p => p.displayType === 'Toast');
        const fullScreen = activePopups.find(p => p.displayType === 'FullScreen');

        console.log('🎭 Popup display breakdown:', {
          modal: modal?.title,
          banner: banner?.title,
          toasts: toasts.map(t => t.title),
          fullScreen: fullScreen?.title
        });

        setCurrentModal(modal || null);
        setBannerPopup(banner || null);
        setToastPopups(toasts);
        setFullScreenPopup(fullScreen || null);
      } else {
        console.warn('❌ Failed to fetch popups:', response);
      }
    } catch (error) {
      console.error('❌ Failed to fetch active popups:', error);
    }
  }, []);

  useEffect(() => {
    fetchActivePopups();

    // Set up polling to check for new popups more frequently (every 30 seconds)
    const interval = setInterval(fetchActivePopups, 30 * 1000);
    return () => clearInterval(interval);
  }, [fetchActivePopups]);

  // Listen for custom events to refresh popups immediately
  useEffect(() => {
    const handlePopupRefresh = () => {
      fetchActivePopups();
    };

    window.addEventListener('refresh-popups', handlePopupRefresh);
    return () => window.removeEventListener('refresh-popups', handlePopupRefresh);
  }, [fetchActivePopups]);

  // Listen for real-time popup events via socket
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewPopup = (popup: Popup) => {
      console.log('🚀 Real-time popup received:', popup);
      
      // Add to current popups if not already present
      setPopups(prev => {
        const exists = prev.some(p => p._id === popup._id);
        if (exists) return prev;
        return [popup, ...prev];
      });

      // Update display components based on type
      if (popup.displayType === 'Modal') {
        setCurrentModal(popup);
      } else if (popup.displayType === 'Banner') {
        setBannerPopup(popup);
      } else if (popup.displayType === 'Toast') {
        setToastPopups(prev => {
          const exists = prev.some(p => p._id === popup._id);
          if (exists) return prev;
          return [...prev, popup];
        });
      } else if (popup.displayType === 'FullScreen') {
        setFullScreenPopup(popup);
      }
    };

    const handlePopupCreated = (data: { popup: Popup; rolesVisibleTo: string[] }) => {
      console.log('📢 Popup created event received:', data);
      handleNewPopup(data.popup);
    };

    // Set up socket listeners
    socket.on('popup:new', handleNewPopup);
    socket.on('popup:created', handlePopupCreated);

    // Cleanup listeners
    return () => {
      socket.off('popup:new', handleNewPopup);
      socket.off('popup:created', handlePopupCreated);
    };
  }, [socket, isConnected]);

  const handleView = useCallback(async (popupId: string) => {
    try {
      await markAsViewed(popupId);
    } catch (error) {
      console.error('Failed to mark popup as viewed:', error);
    }
  }, []);

  const handleDismiss = useCallback(async (popupId: string) => {
    try {
      await dismissPopup(popupId);
      
      // Remove from local state
      setPopups(prev => prev.filter(p => p._id !== popupId));
      
      if (currentModal?._id === popupId) {
        setCurrentModal(null);
      }
      
      if (bannerPopup?._id === popupId) {
        setBannerPopup(null);
      }

      if (fullScreenPopup?._id === popupId) {
        setFullScreenPopup(null);
      }

      setToastPopups(prev => prev.filter(p => p._id !== popupId));
      
    } catch (error) {
      console.error('Failed to dismiss popup:', error);
    }
  }, [currentModal, bannerPopup]);

  const handleActionClick = useCallback((action: PopupAction) => {
    switch (action.action) {
      case 'redirect':
        if (action.url) {
          if (action.url.startsWith('http')) {
            window.open(action.url, '_blank');
          } else {
            navigate(action.url);
          }
        }
        break;
      case 'custom':
        if (action.customAction) {
          // Handle custom actions - could emit events or call custom functions
          window.dispatchEvent(new CustomEvent('popup-custom-action', {
            detail: { action: action.customAction, popup: currentModal }
          }));
        }
        break;
      case 'close':
        // Will be handled by the component
        break;
    }
  }, [navigate, currentModal]);

  const removeToast = useCallback((popupId: string) => {
    setToastPopups(prev => prev.filter(p => p._id !== popupId));
  }, []);

  return (
    <div className={className}>
      {/* Modal Popup */}
      {currentModal && (
        <PopupModal
          popup={currentModal}
          isOpen={!!currentModal}
          onClose={() => setCurrentModal(null)}
          onView={handleView}
          onDismiss={handleDismiss}
          onActionClick={handleActionClick}
        />
      )}

      {/* Banner Popup */}
      {bannerPopup && (
        <PopupBanner
          popup={bannerPopup}
          position="top"
          onView={handleView}
          onDismiss={handleDismiss}
          onActionClick={handleActionClick}
        />
      )}

      {/* Toast Popups */}
      {toastPopups.map((popup, index) => (
        <div
          key={popup._id}
          style={{
            zIndex: 50 - index,
            transform: `translateY(${index * 90}px)`
          }}
        >
          <PopupToast
            popup={popup}
            duration={popup.type === 'Alert' ? 0 : 8000} // Alerts don't auto-dismiss
            position="top-right"
            onView={handleView}
            onDismiss={(id) => {
              handleDismiss(id);
              removeToast(id);
            }}
            onActionClick={handleActionClick}
          />
        </div>
      ))}

      {/* Full Screen Popup */}
      {fullScreenPopup && (
        <FullScreenPopup
          isOpen={!!fullScreenPopup}
          onClose={() => setFullScreenPopup(null)}
          title={fullScreenPopup.title}
          description={fullScreenPopup.message}
          content={
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">{fullScreenPopup.title}</h2>
                <p className="text-gray-600 max-w-2xl mx-auto">{fullScreenPopup.message}</p>
              </div>

              <div className="flex justify-center">
                <div className="bg-blue-50 p-6 rounded-lg max-w-md">
                  <p className="text-sm text-blue-800">
                    <strong>Created:</strong> {new Date(fullScreenPopup.createdAt).toLocaleString()}
                  </p>
                  {fullScreenPopup.endTime && (
                    <p className="text-sm text-blue-800 mt-1">
                      <strong>Active until:</strong> {new Date(fullScreenPopup.endTime).toLocaleString()}
                    </p>
                  )}
                  <p className="text-sm text-blue-800 mt-1">
                    <strong>Type:</strong> {fullScreenPopup.type}
                  </p>
                </div>
              </div>
            </div>
          }
          actions={fullScreenPopup.actions.map(action => ({
            label: action.label,
            variant: action.action === 'close' ? 'default' : 'outline',
            onClick: () => {
              if (action.action === 'close') {
                handleDismiss(fullScreenPopup._id);
              } else {
                handleActionClick(action);
              }
            }
          }))}
        />
      )}
    </div>
  );
};