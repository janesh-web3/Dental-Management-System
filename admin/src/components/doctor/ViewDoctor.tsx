import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Doctor } from "@/types/doctor";


interface ViewDoctorProps {
  doctor: Doctor;
  isOpen: boolean;
  onClose: () => void;
}

const ViewDoctor = ({ doctor, isOpen, onClose }: ViewDoctorProps) => {
  return (
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
      </DialogContent>
    </Dialog>
  );
};

export default ViewDoctor;