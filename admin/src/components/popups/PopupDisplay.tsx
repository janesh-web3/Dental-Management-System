import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PopupModal } from './PopupModal';
import { PopupBanner } from './PopupBanner';
import { PopupToast } from './PopupToast';
import { getActivePopupsForUser, markAsViewed, dismissPopup } from '@/services/popupService';
import { Popup, PopupAction } from '@/types/popup';

interface PopupDisplayProps {
  className?: string;
}

export const PopupDisplay: React.FC<PopupDisplayProps> = ({ className }) => {
  const [popups, setPopups] = useState<Popup[]>([]);
  const [currentModal, setCurrentModal] = useState<Popup | null>(null);
  const [bannerPopup, setBannerPopup] = useState<Popup | null>(null);
  const [toastPopups, setToastPopups] = useState<Popup[]>([]);
  const navigate = useNavigate();

  // Fetch active popups
  const fetchActivePopups = useCallback(async () => {
    try {
      const response = await getActivePopupsForUser();
      if (response.success) {
        const activePopups = response.data;
        setPopups(activePopups);

        // Separate popups by display type
        const modal = activePopups.find(p => p.displayType === 'Modal');
        const banner = activePopups.find(p => p.displayType === 'Banner');
        const toasts = activePopups.filter(p => p.displayType === 'Toast');

        setCurrentModal(modal || null);
        setBannerPopup(banner || null);
        setToastPopups(toasts);
      }
    } catch (error) {
      console.error('Failed to fetch active popups:', error);
    }
  }, []);

  useEffect(() => {
    fetchActivePopups();

    // Set up polling to check for new popups every 5 minutes
    const interval = setInterval(fetchActivePopups, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchActivePopups]);

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
    </div>
  );
};