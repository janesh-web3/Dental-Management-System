import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NotificationSettings } from "@/components/shared/NotificationSettings";
import { Doctor } from "@/types/doctor";

interface NotificationPreferences {
  desktopNotifications: boolean;
  soundAlerts: boolean;
  appointmentNotifications: boolean;
  patientNotifications: boolean;
  treatmentNotifications: boolean;
  xrayNotifications: boolean;
  paymentNotifications: boolean;
  doctorNotifications: boolean;
  doctorAddedNotification: boolean;
  doctorUpdatedNotification: boolean;
  doctorDeletedNotification: boolean;
}

interface NotificationPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: Doctor;
  onSaved?: (preferences: any) => void;
}

const NotificationPreferencesModal: React.FC<
  NotificationPreferencesModalProps
> = ({ isOpen, onClose, doctor, onSaved }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Notification Preferences for {doctor.name}</DialogTitle>
        </DialogHeader>
        <NotificationSettings
          userId={doctor._id}
          userType="Doctor"
          // Option 1: Use type assertion to tell TypeScript you know what you're doing
          initialPreferences={
            (doctor.notificationPreferences as NotificationPreferences) || {
              desktopNotifications: true,
              soundAlerts: true,
              appointmentNotifications: true,
              patientNotifications: true,
              treatmentNotifications: true,
              xrayNotifications: true,
              paymentNotifications: true,
              doctorNotifications: true,
              doctorAddedNotification: true,
              doctorUpdatedNotification: true,
              doctorDeletedNotification: true,
            }
          }
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
