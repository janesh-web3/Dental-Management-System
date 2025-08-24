import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Stethoscope, Mail, Phone, Award, UserPlus, MapPin, Calendar } from 'lucide-react';
import DelightfulForm from '@/components/ui/DelightfulForm';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { crudRequest } from '@/lib/api';

interface DelightfulDoctorFormProps {
  onSuccess?: (doctor: any) => void;
  editingDoctor?: any;
  modalClose?: () => void;
}

const specializations = [
  { value: 'general', label: 'General Dentistry', emoji: '🦷', color: 'bg-blue-100 text-blue-800' },
  { value: 'orthodontics', label: 'Orthodontics', emoji: '😬', color: 'bg-purple-100 text-purple-800' },
  { value: 'periodontics', label: 'Periodontics', emoji: '🔬', color: 'bg-green-100 text-green-800' },
  { value: 'endodontics', label: 'Endodontics', emoji: '🔧', color: 'bg-red-100 text-red-800' },
  { value: 'oral-surgery', label: 'Oral Surgery', emoji: '🔪', color: 'bg-orange-100 text-orange-800' },
  { value: 'prosthodontics', label: 'Prosthodontics', emoji: '👑', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'pediatric', label: 'Pediatric Dentistry', emoji: '👶', color: 'bg-pink-100 text-pink-800' },
  { value: 'cosmetic', label: 'Cosmetic Dentistry', emoji: '✨', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'maxillofacial', label: 'Maxillofacial Surgery', emoji: '🏥', color: 'bg-gray-100 text-gray-800' }
];

const workingDays = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' }
];

const DelightfulDoctorForm: React.FC<DelightfulDoctorFormProps> = ({
  onSuccess,
  editingDoctor,
  modalClose
}) => {
  const [activeTab, setActiveTab] = useState('personal');
  const [selectedSpecialization, setSelectedSpecialization] = useState('');

  const handleSubmit = async (formData: any) => {
    try {
      const doctorData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        specialization: formData.specialization,
        qualifications: formData.qualifications?.split(',').map((q: string) => q.trim()).filter(Boolean) || [],
        experience: parseInt(formData.experience) || 0,
        licenseNumber: formData.licenseNumber,
        address: formData.address,
        biography: formData.biography,
        workingHours: {
          startTime: formData.startTime,
          endTime: formData.endTime,
          workingDays: formData.workingDays?.split(',').map((d: string) => d.trim()).filter(Boolean) || []
        },
        consultationFee: parseFloat(formData.consultationFee) || 0,
        emergencyAvailable: formData.emergencyAvailable === 'true',
        languages: formData.languages?.split(',').map((l: string) => l.trim()).filter(Boolean) || ['English']
      };

      const endpoint = editingDoctor 
        ? `/doctor/${editingDoctor._id}`
        : '/doctor';
      
      const method = editingDoctor ? 'put' : 'post';
      
      const response = await crudRequest(method, endpoint, doctorData);
      
      if (response.success) {
        onSuccess?.(response.data);
        modalClose?.();
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to save doctor information');
    }
  };

  const getSpecializationInfo = (spec: string) => {
    return specializations.find(s => s.value === spec);
  };

  const tabVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-4xl mx-auto"
      >
        <DelightfulForm
          onSubmit={handleSubmit}
          title={editingDoctor ? "👨‍⚕️ Update Doctor Profile" : "👨‍⚕️ Add New Doctor"}
          submitLabel={editingDoctor ? "Update Doctor" : "Add Doctor"}
          formType="doctor"
          submitIcon={UserPlus}
          celebrateOnSuccess={true}
          playfulFeedback={true}
          className="w-full max-w-none"
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="personal" className="flex items-center gap-2">
                <User size={16} />
                Personal
              </TabsTrigger>
              <TabsTrigger value="professional" className="flex items-center gap-2">
                <Stethoscope size={16} />
                Professional
              </TabsTrigger>
              <TabsTrigger value="schedule" className="flex items-center gap-2">
                <Calendar size={16} />
                Schedule
              </TabsTrigger>
              <TabsTrigger value="additional" className="flex items-center gap-2">
                <Award size={16} />
                Additional
              </TabsTrigger>
            </TabsList>

            <motion.div
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <TabsContent value="personal">
                <Card className="p-6 space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="text-blue-500" size={20} />
                    <h3 className="font-semibold text-gray-900">Personal Information</h3>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Label htmlFor="name" className="text-sm font-medium">Full Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Dr. John Smith"
                      required
                      className="mt-1"
                      defaultValue={editingDoctor?.name}
                    />
                  </motion.div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Label htmlFor="email" className="text-sm font-medium">Email Address *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="doctor@example.com"
                          required
                          className="mt-1 pl-10"
                          defaultValue={editingDoctor?.email}
                        />
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Label htmlFor="phone" className="text-sm font-medium">Phone Number *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          placeholder="+1 234 567 8900"
                          required
                          className="mt-1 pl-10"
                          defaultValue={editingDoctor?.phone}
                        />
                      </div>
                    </motion.div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Label htmlFor="address" className="text-sm font-medium">Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 text-gray-400" size={16} />
                      <Textarea
                        id="address"
                        name="address"
                        placeholder="Enter full address"
                        rows={3}
                        className="mt-1 pl-10"
                        defaultValue={editingDoctor?.address}
                      />
                    </div>
                  </motion.div>
                </Card>
              </TabsContent>

              <TabsContent value="professional">
                <Card className="p-6 space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Stethoscope className="text-green-500" size={20} />
                    <h3 className="font-semibold text-gray-900">Professional Details</h3>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Label htmlFor="specialization" className="text-sm font-medium">Specialization *</Label>
                    <Select 
                      name="specialization" 
                      required
                      onValueChange={setSelectedSpecialization}
                      defaultValue={editingDoctor?.specialization}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select specialization" />
                      </SelectTrigger>
                      <SelectContent>
                        {specializations.map((spec) => (
                          <SelectItem key={spec.value} value={spec.value}>
                            <div className="flex items-center gap-2">
                              <span>{spec.emoji}</span>
                              <span>{spec.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {selectedSpecialization && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-2"
                      >
                        {(() => {
                          const specInfo = getSpecializationInfo(selectedSpecialization);
                          return specInfo && (
                            <Badge className={specInfo.color}>
                              {specInfo.emoji} {specInfo.label}
                            </Badge>
                          );
                        })()}
                      </motion.div>
                    )}
                  </motion.div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Label htmlFor="experience" className="text-sm font-medium">Years of Experience</Label>
                      <Input
                        id="experience"
                        name="experience"
                        type="number"
                        placeholder="5"
                        min="0"
                        max="50"
                        className="mt-1"
                        defaultValue={editingDoctor?.experience}
                      />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Label htmlFor="consultationFee" className="text-sm font-medium">Consultation Fee</Label>
                      <Input
                        id="consultationFee"
                        name="consultationFee"
                        type="number"
                        placeholder="150"
                        step="0.01"
                        min="0"
                        className="mt-1"
                        defaultValue={editingDoctor?.consultationFee}
                      />
                    </motion.div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Label htmlFor="licenseNumber" className="text-sm font-medium">License Number</Label>
                    <Input
                      id="licenseNumber"
                      name="licenseNumber"
                      placeholder="DEN-12345"
                      className="mt-1"
                      defaultValue={editingDoctor?.licenseNumber}
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Label htmlFor="qualifications" className="text-sm font-medium">Qualifications</Label>
                    <Textarea
                      id="qualifications"
                      name="qualifications"
                      placeholder="BDS, MDS, etc. (separated by commas)"
                      rows={2}
                      className="mt-1"
                      defaultValue={editingDoctor?.qualifications?.join(', ')}
                    />
                  </motion.div>
                </Card>
              </TabsContent>

              <TabsContent value="schedule">
                <Card className="p-6 space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="text-purple-500" size={20} />
                    <h3 className="font-semibold text-gray-900">Working Schedule</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <Label htmlFor="startTime" className="text-sm font-medium">Start Time</Label>
                      <Input
                        id="startTime"
                        name="startTime"
                        type="time"
                        className="mt-1"
                        defaultValue={editingDoctor?.workingHours?.startTime || "09:00"}
                      />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Label htmlFor="endTime" className="text-sm font-medium">End Time</Label>
                      <Input
                        id="endTime"
                        name="endTime"
                        type="time"
                        className="mt-1"
                        defaultValue={editingDoctor?.workingHours?.endTime || "17:00"}
                      />
                    </motion.div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Label htmlFor="workingDays" className="text-sm font-medium">Working Days</Label>
                    <Textarea
                      id="workingDays"
                      name="workingDays"
                      placeholder="Monday, Tuesday, Wednesday, Thursday, Friday (separated by commas)"
                      rows={2}
                      className="mt-1"
                      defaultValue={editingDoctor?.workingHours?.workingDays?.join(', ')}
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Label htmlFor="emergencyAvailable" className="text-sm font-medium">Emergency Availability</Label>
                    <Select name="emergencyAvailable" defaultValue={editingDoctor?.emergencyAvailable?.toString()}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Available for emergencies?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">🚨 Available for Emergencies</SelectItem>
                        <SelectItem value="false">⏰ Regular Hours Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </motion.div>
                </Card>
              </TabsContent>

              <TabsContent value="additional">
                <Card className="p-6 space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Award className="text-orange-500" size={20} />
                    <h3 className="font-semibold text-gray-900">Additional Information</h3>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Label htmlFor="biography" className="text-sm font-medium">Biography</Label>
                    <Textarea
                      id="biography"
                      name="biography"
                      placeholder="Brief professional biography..."
                      rows={4}
                      className="mt-1"
                      defaultValue={editingDoctor?.biography}
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Label htmlFor="languages" className="text-sm font-medium">Languages Spoken</Label>
                    <Textarea
                      id="languages"
                      name="languages"
                      placeholder="English, Spanish, French, etc. (separated by commas)"
                      rows={2}
                      className="mt-1"
                      defaultValue={editingDoctor?.languages?.join(', ')}
                    />
                  </motion.div>
                </Card>
              </TabsContent>
            </motion.div>
          </Tabs>
        </DelightfulForm>
      </motion.div>
    </div>
  );
};

export default DelightfulDoctorForm;