import React from 'react';
import { Loader2 } from 'lucide-react';
import { useDoctorAuthContext } from '@/contexts/doctorAuthContext';
import NotificationsPage from '@/pages/NotificationsPage';

const DoctorNotifications: React.FC = () => {
  const { isLoading } = useDoctorAuthContext();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading notifications...</span>
      </div>
    );
  }
  
  return <NotificationsPage />;
};

export default DoctorNotifications;
