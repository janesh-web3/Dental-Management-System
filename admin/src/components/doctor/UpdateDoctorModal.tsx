import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { crudRequest } from "@/lib/api";
import { Doctor } from "@/types/doctor";
import { showDoctorUpdatedNotification } from "@/utils/doctorNotifications";

interface UpdateDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: Doctor;
}

const UpdateDoctorModal: React.FC<UpdateDoctorModalProps> = ({
  isOpen,
  onClose,
  doctor,
}) => {
  const [formData, setFormData] = useState({
    name: doctor.name,
    email: doctor.email,
    age: doctor.age,
    contactNumber: doctor.contactNumber,
    address: doctor.address,
    specialization: doctor.specialization,
    nmcNumber: doctor.nmcNumber,
    qualifications: doctor.qualifications,
    experienceYears: doctor.experienceYears,
    availability: doctor.availability,
    image: null as File | null,
  });

  const [imagePreview, setImagePreview] = useState(doctor.image);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFormData(prev => ({...prev, image: e.target.files![0]}));
      setImagePreview({ url: URL.createObjectURL(e.target.files[0]) });
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  setIsSubmitting(true);
    try {
      await crudRequest("PUT", `/doctor/update-doctor/${doctor._id}`, formData , {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success("Doctor updated successfully");
      
      // Show notification
      showDoctorUpdatedNotification(formData.name);
      
      onClose();
      window.location.reload();
    } catch (error) {
      toast.error("Failed to update doctor");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[80vh] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Doctor</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <div>
            <label>Name</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
            />
          </div>
          
          <div>
            <label>Email</label>
            <Input
              value={formData.email}
              onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
            />
          </div>

          <div>
            <label>Age</label>
            <Input
              value={formData.age}
              onChange={(e) => setFormData(prev => ({...prev, age: e.target.value}))}
            />
          </div>

          <div>
            <label>Contact Number</label>
            <Input
              value={formData.contactNumber}
              onChange={(e) => setFormData(prev => ({...prev, contactNumber: e.target.value}))}
            />
          </div>

          <div>
            <label>NMC Number</label>
            <Input
              value={formData.nmcNumber}
              onChange={(e) => setFormData(prev => ({...prev, nmcNumber: e.target.value}))}
            />
          </div>

          <div className="col-span-2">
            <label>Address</label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData(prev => ({...prev, address: e.target.value}))}
            />
          </div>

          <div>
            <label>Specialization</label>
            <Input
              value={formData.specialization}
              onChange={(e) => setFormData(prev => ({...prev, specialization: e.target.value}))}
            />
          </div>

          <div>
            <label>Experience Years</label>
            <Input
              value={formData.experienceYears}
              onChange={(e) => setFormData(prev => ({...prev, experienceYears: e.target.value}))}
            />
          </div>

          <div className="col-span-2">
            <label>Profile Image</label>
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="mb-2"
            />
            {imagePreview && (
              <img 
                src={imagePreview.url} 
                alt="Preview" 
                className="w-32 h-32 object-cover rounded-full mx-auto"
              />
            )}
          </div>

          <div className="col-span-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Doctor"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateDoctorModal;