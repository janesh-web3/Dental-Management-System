import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { Doctor } from "@/types/doctor";
import NotificationPreferencesModal from "./NotificationPreferencesModal";

interface ViewDoctorProps {
  doctor: Doctor;
  isOpen: boolean;
  onClose: () => void;
}

const ViewDoctor = ({ doctor, isOpen, onClose }: ViewDoctorProps) => {
  const [showNotificationPreferences, setShowNotificationPreferences] = useState(false);
  
  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[500px] overflow-auto">
          <DialogHeader>
            <DialogTitle>Doctor Details</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {doctor.image && (
              <img
                src={doctor.image.url}
                alt={doctor.name}
                className="w-32 h-32 mx-auto rounded-full"
              />
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-bold">Name:</p>
                <p>{doctor.name}</p>
              </div>
              <div>
                <p className="font-bold">Email:</p>
                <p>{doctor.email}</p>
              </div>
              <div>
                <p className="font-bold">Age:</p>
                <p>{doctor.age}</p>
              </div>
              <div>
                <p className="font-bold">Contact Number:</p>
                <p>{doctor.contactNumber}</p>
              </div>
              <div>
                <p className="font-bold">NMC Number:</p>
                <p>{doctor.nmcNumber}</p>
              </div>
              <div>
                <p className="font-bold">Address:</p>
                <p>{doctor.address}</p>
              </div>
              <div>
                <p className="font-bold">Specialization:</p>
                <p>{doctor.specialization}</p>
              </div>
              <div>
                <p className="font-bold">Experience Years:</p>
                <p>{doctor.experienceYears}</p>
              </div>
              <div className="col-span-2">
                <p className="font-bold">Qualifications:</p>
                <p>{doctor.qualifications.join(", ")}</p>
              </div>
              <div className="col-span-2">
                <p className="font-bold">Availability:</p>
                {doctor.availability.map((slot, index) => (
                  <p key={index}>
                    {slot.day}: {slot.startTime} - {slot.endTime}
                  </p>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => setShowNotificationPreferences(true)}
            >
              <Bell className="h-4 w-4" />
              Manage Notifications
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {showNotificationPreferences && (
        <NotificationPreferencesModal
          isOpen={showNotificationPreferences}
          onClose={() => setShowNotificationPreferences(false)}
          doctor={doctor}
        />
      )}
    </>
  );
};

export default ViewDoctor;