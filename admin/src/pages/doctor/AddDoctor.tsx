import React, { useState } from "react";
import Heading from "@/components/shared/heading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { crudRequest } from "@/lib/api";
import { toast } from "react-toastify";
import { Textarea } from "@/components/ui/textarea";
import { showDoctorAddedNotification } from "@/utils/doctorNotifications";

const convertTo12Hour = (time24: string) => {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

interface Availability {
  day: string;
  startTime: string;
  endTime: string;
}

interface FormData {
  name: string;
  email: string;
  password: string;
  age: string;
  contactNumber: string;
  address: string;
  specialization: string;
  qualifications: string[];
  experienceYears: string;
  description: string;
  nmcNumber: string;
  availability: Availability[];
  isActive: boolean;
  image?: File;
  totalPatients : string;
  totalRating : string;
}

interface AddDoctorProps {
  modalClose: () => void;
}

const AddDoctor: React.FC<AddDoctorProps> = ({ modalClose }) => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    age: "",
    contactNumber: "",
    address: "",
    description: "",
    specialization: "",
    qualifications: [],
    totalPatients : "",
    nmcNumber : "",
    totalRating : "",
    image : undefined,
    experienceYears: "",
    availability: [
      { day: "Sunday", startTime: "", endTime: "" },
      { day: "Monday", startTime: "", endTime: "" },
      { day: "Tuesday", startTime: "", endTime: "" },
      { day: "Wednesday", startTime: "", endTime: "" },
      { day: "Thursday", startTime: "", endTime: "" },
      { day: "Friday", startTime: "", endTime: "" },
      { day: "Saturday", startTime: "", endTime: "" },
    ],
    isActive: false,
  });

  const [imagePreview, setImagePreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | ''>('');

  const checkPasswordStrength = (password: string) => {
    if (!password) {
      setPasswordStrength('');
      return;
    }
    
    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLongEnough = password.length >= 8;
    
    const score = [hasLowerCase, hasUpperCase, hasNumbers, hasSpecialChars, isLongEnough].filter(Boolean).length;
    
    if (score <= 2) setPasswordStrength('weak');
    else if (score <= 4) setPasswordStrength('medium');
    else setPasswordStrength('strong');
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type, checked } = target;

    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
      
      if (name === 'password') {
        checkPasswordStrength(value);
      }
    }
  };

  const handleSelectQualifications = (value: string | string[]) => {
    setFormData((prev) => ({
      ...prev,
      qualifications: Array.isArray(value) ? value : [value],
    }));
  };

  const handleAvailabilityChange = (
    _day: string,
    time: "startTime" | "endTime",
    value: string,
    index: number
  ) => {
    const updatedAvailability = [...formData.availability];
    updatedAvailability[index] = {
      ...updatedAvailability[index],
      [time]: value,
    };
    setFormData((prev) => ({ ...prev, availability: updatedAvailability }));
  };

  const handleCheckboxChange = (day: string, index: number, checked: boolean) => {
    const updatedAvailability = [...formData.availability];
    if (checked) {
      updatedAvailability[index] = {
        day,
        startTime: updatedAvailability[index]?.startTime || "",
        endTime: updatedAvailability[index]?.endTime || "",
      };
    } else {
      updatedAvailability[index] = { day: "", startTime: "", endTime: "" };
    }
    setFormData((prev) => ({
      ...prev,
      availability: updatedAvailability,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFormData(prev => ({...prev, image: e.target.files![0]}));
      setImagePreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const data = {
      name : formData.name,
      email : formData.email,
      password : formData.password,
      age : formData.age,
      contactNumber : formData.contactNumber,
      address : formData.address,
      totalPatientChecked : formData.totalPatients,
      totalRating : formData.totalRating,
      nmcNumber : formData.nmcNumber,
      description : formData.description,
      specialization : formData.specialization,
      qualifications : formData.qualifications,
      experienceYears : formData.experienceYears,
      image : formData.image,
      availability : formData.availability,
    }

    try {
      await crudRequest("POST", "/doctor/add-doctor", data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success("Doctor added successfully");
      
      // Show notification
      showDoctorAddedNotification(formData.name);
      
      window.location.reload();
      modalClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Heading
        title="Add New Doctor"
        description="Enter the doctor's information to create a new profile"
        className="mb-8"
      />
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Personal Information Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Name *
              </label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email *
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">
                Password *
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
              />
              {passwordStrength && (
                <div className="mt-1">
                  <div className="text-xs">Password strength: 
                    <span className={`font-medium ${
                      passwordStrength === 'weak' ? 'text-red-500' : 
                      passwordStrength === 'medium' ? 'text-yellow-500' : 
                      'text-green-500'
                    }`}>
                      {passwordStrength}
                    </span>
                  </div>
                  <div className="h-1 w-full bg-gray-200 mt-1 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${
                        passwordStrength === 'weak' ? 'w-1/3 bg-red-500' : 
                        passwordStrength === 'medium' ? 'w-2/3 bg-yellow-500' : 
                        'w-full bg-green-500'
                      }`}
                    />
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Age</label>
              <Input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                className="w-full"
                placeholder="35"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Contact Number</label>
              <Input
                type="text"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
                className="w-full"
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">NMC Number</label>
              <Input
                type="text"
                name="nmcNumber"
                value={formData.nmcNumber}
                onChange={handleChange}
                className="w-full"
                placeholder="1234567890"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Address</label>
              <Input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full"
                placeholder="123 Main St, City, Country"
              />
            </div>

            <div className="space-y-2"> 
              <label className="text-sm font-medium">Total Patients</label>
              <Input
                type="text"
                name="totalPatients"
                value={formData.totalPatients}
                onChange={handleChange}
                className="w-full"
                placeholder="150"
              />
            </div>

            <div className="space-y-2"> 
              <label className="text-sm font-medium">Total Rating</label>
              <Input
                type="text"
                name="totalRating"
                value={formData.totalRating}
                onChange={handleChange}
                className="w-full"
                placeholder="9.8"
              />
            </div>

          </div>
        </div>

        {/* Professional Information Section */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold border-b pb-2">Professional Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Specialization</label>
              <Input
                type="text"
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                className="w-full"
                placeholder="Cardiology"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Qualifications</label>
              <Select onValueChange={handleSelectQualifications}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select qualifications" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BDS (Dental Surgeon)">BDS (Dental Surgeon)</SelectItem>
                  <SelectItem value="MDS (Orthodonist)">MDS (Orthodonist)</SelectItem>
                  <SelectItem value="MDS (Oral Maxillofacial Surgeon)">MDS (Oral Maxillofacial Surgeon)</SelectItem>
                  <SelectItem value="MDS (Prosthodontist)">MDS (Prosthodontist)</SelectItem>
                  <SelectItem value="MDS (Pediatric Dentistry)">MDS (Pediatric Dentistry)</SelectItem>
                  <SelectItem value="MDS (Periodontist)">MDS (Periodontist)</SelectItem>
                  <SelectItem value="MDS (Conservative Dentistry)">MDS (Conservative Dentistry)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Experience (Years)</label>
              <Input
                type="text"
                name="experienceYears"
                value={formData.experienceYears}
                onChange={handleChange}
                className="w-full"
                placeholder="10"
              />
            </div>

            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full min-h-[100px]"
                placeholder="Brief description about the doctor's expertise and background..."
              />
            </div>
          </div>
        </div>

        {/* Profile Image Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Profile Image</h3>
          <div className="flex items-center gap-6">
            <div className="flex-1">
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full"
              />
            </div>
            {imagePreview && (
              <div className="flex-shrink-0">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-24 h-24 object-cover rounded-full border-2 border-gray-200"
                />
              </div>
            )}
          </div>
        </div>

        {/* Availability Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Weekly Availability</h3>
          <div className="space-y-4">
            {formData.availability.map((availability, index) => (
              <div key={availability.day} className="flex flex-wrap items-center gap-4 p-3 rounded-lg ">
                <div className="flex items-center gap-2 min-w-[150px]">
                  <Checkbox
                    id={`day-${index}`}
                    checked={!!formData.availability[index]?.startTime}
                    onCheckedChange={(checked: boolean) =>
                      handleCheckboxChange(availability.day, index, checked)
                    }
                  />
                  <label htmlFor={`day-${index}`} className="font-medium">
                    {availability.day}
                  </label>
                </div>
                
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={formData.availability[index]?.startTime || ""}
                      className="w-32"
                      onChange={(e) => {
                        handleAvailabilityChange(
                          availability.day,
                          "startTime",
                          e.target.value,
                          index
                        );
                      }}
                    />
                    <span className="text-sm text-gray-500">
                      {convertTo12Hour(formData.availability[index]?.startTime)}
                    </span>
                  </div>
                  <span>to</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={formData.availability[index]?.endTime || ""}
                      className="w-32"
                      onChange={(e) => {
                        handleAvailabilityChange(
                          availability.day,
                          "endTime",
                          e.target.value,
                          index
                        );
                      }}
                    />
                    <span className="text-sm text-gray-500">
                      {convertTo12Hour(formData.availability[index]?.endTime)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button 
            type="button" 
            variant="outline"
            onClick={modalClose}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="bg-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Add Doctor"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddDoctor;