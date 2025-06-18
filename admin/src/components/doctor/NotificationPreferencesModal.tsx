import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NotificationSettings } from "@/components/shared/NotificationSettings";
import { Doctor } from "@/types/doctor";

interface NotificationPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: Doctor;
  onSaved?: (preferences: any) => void;
}

const NotificationPreferencesModal: React.FC<NotificationPreferencesModalProps> = ({
  isOpen,
  onClose,
  doctor,
  onSaved
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Notification Preferences for {doctor.name}</DialogTitle>
        </DialogHeader>
        <NotificationSettings
          userId={doctor._id}
          userType="Doctor"
          initialPreferences={doctor.notificationPreferences || {
            desktopNotifications: true,
            soundAlerts: true,
            appointmentNotifications: true,
            patientNotifications: true,
            treatmentNotifications: true,
            xrayNotifications: true,
            paymentNotifications: true
          }}
          onSaved={(prefs) => {
            if (onSaved) {
              onSaved(prefs);
            }
            onClose();
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

export default NotificationPreferencesModal;
