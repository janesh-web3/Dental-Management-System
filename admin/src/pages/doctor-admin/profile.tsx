import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter 
} from "@/components/ui/card";
import { 
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage 
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { 
  Loader2, Upload, Save, Clock, Plus, Trash
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useDoctorAuthContext } from '@/contexts/doctorAuthContext';

interface ProfileProps {
  doctorId: string;
}

interface Doctor {
  _id: string;
  name: string;
  email: string;
  age: string;
  contactNumber: string;
  nmcNumber: string;
  address: string;
  specialization: string;
  qualifications: string[];
  experienceYears: string;
  image: string;
  description: string;
  availability: Array<{
    day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
    startTime: string;
    endTime: string;
  }>;
}

// Form schema for doctor profile
const profileFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  age: z.string().min(1, "Age is required"),
  contactNumber: z.string().min(10, "Contact number must be at least 10 digits"),
  nmcNumber: z.string().optional(),
  address: z.string().min(1, "Address is required"),
  specialization: z.string().min(1, "Specialization is required"),
  qualifications: z.string().min(1, "Qualifications are required"),
  experienceYears: z.string().min(1, "Experience years are required"),
  description: z.string().min(1, "Description is required"),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

// Form schema for availability
const availabilityItemSchema = z.object({
  day: z.enum(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
});

const availabilityFormSchema = z.object({
  availability: z.array(availabilityItemSchema),
});

type AvailabilityFormValues = z.infer<typeof availabilityFormSchema>;

const Profile: React.FC = () => {
  const { doctorDetails, isLoading } = useDoctorAuthContext();
  
    // Get the doctor ID from the auth context
    const doctorId = doctorDetails?._id || "";
  
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading doctor panel...</span>
        </div>
      );
    }
  const [loading, setLoading] = useState<boolean>(true);
  const [imageLoading, setImageLoading] = useState<boolean>(false);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const { toast } = useToast();

  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      email: "",
      age: "",
      contactNumber: "",
      nmcNumber: "",
      address: "",
      specialization: "",
      qualifications: "",
      experienceYears: "",
      description: "",
    },
  });

  // Availability form
  const availabilityForm = useForm<AvailabilityFormValues>({
    resolver: zodResolver(availabilityFormSchema),
    defaultValues: {
      availability: [
        {
          day: "Monday",
          startTime: "09:00",
          endTime: "17:00",
        },
      ],
    },
  });

  useEffect(() => {
    fetchDoctorProfile();
  }, [doctorId]);

  useEffect(() => {
    // Update form values when doctor data is loaded
    if (doctor) {
      profileForm.reset({
        name: doctor.name,
        email: doctor.email || "",
        age: doctor.age || "",
        contactNumber: doctor.contactNumber,
        nmcNumber: doctor.nmcNumber || "",
        address: doctor.address || "",
        specialization: doctor.specialization || "",
        qualifications: doctor.qualifications?.join(", ") || "",
        experienceYears: doctor.experienceYears || "",
        description: doctor.description || "",
      });

      // Set profile image
      setProfileImage(doctor.image);

      // Set availability
      if (doctor.availability && doctor.availability.length > 0) {
        availabilityForm.setValue("availability", doctor.availability);
      }
    }
  }, [doctor, profileForm, availabilityForm]);

  const fetchDoctorProfile = async () => {
    try {
      setLoading(true);
      // This would be replaced with an actual API call in a real implementation
      // For now, we'll simulate the data
      setTimeout(() => {
        setDoctor({
          _id: doctorId,
          name: "Dr. John Smith",
          email: "dr.smith@example.com",
          age: "45",
          contactNumber: "1234567890",
          nmcNumber: "NMC123456",
          address: "123 Medical Center, New York",
          specialization: "Orthodontist",
          qualifications: ["BDS", "MDS in Orthodontics"],
          experienceYears: "15",
          image: "https://randomuser.me/api/portraits/men/32.jpg",
          description: "Experienced orthodontist specializing in braces and Invisalign treatments.",
          availability: [
            {
              day: "Monday",
              startTime: "09:00",
              endTime: "17:00",
            },
            {
              day: "Wednesday",
              startTime: "09:00",
              endTime: "17:00",
            },
            {
              day: "Friday",
              startTime: "09:00",
              endTime: "13:00",
            },
          ],
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching doctor profile:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load doctor profile",
      });
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (values: ProfileFormValues) => {
    try {
      setLoading(true);
      
      // Format the data for the API
      const formattedValues = {
        ...values,
        qualifications: values.qualifications.split(",").map(q => q.trim()),
      };

      // In a real implementation, this would be an API call
      console.log('Updating doctor profile:', formattedValues);
      
      // If there's an image file to upload
      if (imageFile) {
        // In a real implementation, this would be an API call to upload the image
        console.log('Uploading image file:', imageFile);
      }
      
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      
      // Refresh the doctor data
      fetchDoctorProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update profile",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAvailabilitySubmit = async (values: AvailabilityFormValues) => {
    try {
      setLoading(true);
      
      // In a real implementation, this would be an API call
      console.log('Updating doctor availability:', values);
      
      toast({
        title: "Success",
        description: "Availability updated successfully",
      });
      
      // Refresh the doctor data
      fetchDoctorProfile();
    } catch (error) {
      console.error('Error updating availability:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update availability",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onload = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addAvailabilitySlot = () => {
    const currentAvailability = availabilityForm.getValues("availability");
    availabilityForm.setValue("availability", [
      ...currentAvailability,
      {
        day: "Monday",
        startTime: "09:00",
        endTime: "17:00",
      },
    ]);
  };

  const removeAvailabilitySlot = (index: number) => {
    const currentAvailability = availabilityForm.getValues("availability");
    if (currentAvailability.length > 1) {
      availabilityForm.setValue(
        "availability",
        currentAvailability.filter((_, i) => i !== index)
      );
    }
  };

  if (loading && !doctor) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>Doctor Profile</CardTitle>
          <CardDescription>
            Update your personal and professional information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            {/* Profile Image */}
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-32 w-32">
                <AvatarImage src={profileImage || ""} alt="Profile" />
                <AvatarFallback>{doctor?.name?.charAt(0) || "D"}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-center">
                <label htmlFor="profile-image" className="cursor-pointer">
                  <div className="flex items-center space-x-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md">
                    <Upload className="h-4 w-4" />
                    <span>Upload Image</span>
                  </div>
                  <input
                    id="profile-image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  Recommended: 300x300px, max 2MB
                </p>
              </div>
            </div>
            
            {/* Profile Form */}
            <div className="flex-1">
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={profileForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Dr. John Smith" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="doctor@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={profileForm.control}
                      name="contactNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Contact Number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileForm.control}
                      name="age"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Age</FormLabel>
                          <FormControl>
                            <Input placeholder="Age" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={profileForm.control}
                      name="specialization"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Specialization</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Orthodontist" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileForm.control}
                      name="experienceYears"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Years of Experience</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 10" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={profileForm.control}
                    name="qualifications"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Qualifications</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., BDS, MDS in Orthodontics" {...field} />
                        </FormControl>
                        <FormDescription>
                          Separate multiple qualifications with commas
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={profileForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={profileForm.control}
                    name="nmcNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>NMC Number (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="NMC Number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={profileForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Professional Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Brief description of your professional background and expertise" 
                            className="resize-none h-24" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    Save Profile
                  </Button>
                </form>
              </Form>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Availability Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Availability Schedule</CardTitle>
          <CardDescription>
            Set your working hours for each day of the week
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...availabilityForm}>
            <form onSubmit={availabilityForm.handleSubmit(handleAvailabilitySubmit)} className="space-y-4">
              <div className="space-y-4">
                {availabilityForm.watch("availability").map((_, index) => (
                  <div key={index} className="flex items-center gap-4 border rounded-md p-4">
                    <FormField
                      control={availabilityForm.control}
                      name={`availability.${index}.day`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Day</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select day" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Monday">Monday</SelectItem>
                              <SelectItem value="Tuesday">Tuesday</SelectItem>
                              <SelectItem value="Wednesday">Wednesday</SelectItem>
                              <SelectItem value="Thursday">Thursday</SelectItem>
                              <SelectItem value="Friday">Friday</SelectItem>
                              <SelectItem value="Saturday">Saturday</SelectItem>
                              <SelectItem value="Sunday">Sunday</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={availabilityForm.control}
                      name={`availability.${index}.startTime`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Start Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={availabilityForm.control}
                      name={`availability.${index}.endTime`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>End Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {availabilityForm.watch("availability").length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="mt-6"
                        onClick={() => removeAvailabilitySlot(index)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={addAvailabilitySlot}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Availability Slot
                </Button>
              </div>
              
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Clock className="mr-2 h-4 w-4" />
                Save Availability
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
