import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Heart, Calendar, FileText, UserPlus } from 'lucide-react';
import DelightfulForm from '@/components/ui/DelightfulForm';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { crudRequest } from '@/lib/api';
import { toast } from 'react-toastify';

interface DelightfulAddPatientProps {
  onSuccess?: (patient: any) => void;
  modalClose?: () => void;
}

const DelightfulAddPatient: React.FC<DelightfulAddPatientProps> = ({
  onSuccess,
  modalClose
}) => {
  const [activeTab, setActiveTab] = useState('personal');

  const handleSubmit = async (formData: any) => {
    try {
      const patientData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        age: parseInt(formData.age),
        gender: formData.gender,
        emergencyContact: {
          name: formData.emergencyContactName,
          phone: formData.emergencyContactPhone,
          relationship: formData.emergencyContactRelationship
        },
        medicalHistory: {
          allergies: formData.allergies?.split(',').map((a: string) => a.trim()).filter(Boolean) || [],
          medications: formData.medications?.split(',').map((m: string) => m.trim()).filter(Boolean) || [],
          medicalConditions: formData.medicalConditions?.split(',').map((c: string) => c.trim()).filter(Boolean) || [],
          previousSurgeries: formData.previousSurgeries?.split(',').map((s: string) => s.trim()).filter(Boolean) || []
        },
        dentalHistory: {
          lastVisit: formData.lastVisit,
          chiefComplaint: formData.chiefComplaint,
          previousTreatments: formData.previousTreatments?.split(',').map((t: string) => t.trim()).filter(Boolean) || []
        }
      };

      const response = await crudRequest('post', '/patient', patientData);
      
      if (response.success) {
        onSuccess?.(response.data);
        modalClose?.();
        toast.success('🦷 Patient added successfully! Welcome to our dental family!');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to add patient');
    }
  };

  const tabVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <DelightfulForm
          onSubmit={handleSubmit}
          title="🦷 Add New Patient"
          submitLabel="Add Patient"
          formType="patient"
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
              <TabsTrigger value="contact" className="flex items-center gap-2">
                <Calendar size={16} />
                Contact
              </TabsTrigger>
              <TabsTrigger value="medical" className="flex items-center gap-2">
                <Heart size={16} />
                Medical
              </TabsTrigger>
              <TabsTrigger value="dental" className="flex items-center gap-2">
                <FileText size={16} />
                Dental
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
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Label htmlFor="name" className="text-sm font-medium">Full Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Enter patient's full name"
                      required
                      className="mt-1"
                    />
                  </motion.div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Label htmlFor="age" className="text-sm font-medium">Age *</Label>
                      <Input
                        id="age"
                        name="age"
                        type="number"
                        placeholder="Enter age"
                        required
                        min="1"
                        max="120"
                        className="mt-1"
                      />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Label htmlFor="gender" className="text-sm font-medium">Gender *</Label>
                      <Select name="gender" required>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </motion.div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="contact">
                <Card className="p-6 space-y-4">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Label htmlFor="phone" className="text-sm font-medium">Phone Number *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="Enter phone number"
                      required
                      className="mt-1"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter email address"
                      className="mt-1"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Label htmlFor="address" className="text-sm font-medium">Address</Label>
                    <Textarea
                      id="address"
                      name="address"
                      placeholder="Enter full address"
                      rows={3}
                      className="mt-1"
                    />
                  </motion.div>

                  <div className="border-t pt-4 mt-6">
                    <h4 className="font-medium text-gray-900 mb-4">Emergency Contact</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        <Label htmlFor="emergencyContactName" className="text-sm font-medium">Contact Name</Label>
                        <Input
                          id="emergencyContactName"
                          name="emergencyContactName"
                          placeholder="Emergency contact name"
                          className="mt-1"
                        />
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                      >
                        <Label htmlFor="emergencyContactPhone" className="text-sm font-medium">Contact Phone</Label>
                        <Input
                          id="emergencyContactPhone"
                          name="emergencyContactPhone"
                          type="tel"
                          placeholder="Emergency contact phone"
                          className="mt-1"
                        />
                      </motion.div>
                    </div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="mt-4"
                    >
                      <Label htmlFor="emergencyContactRelationship" className="text-sm font-medium">Relationship</Label>
                      <Input
                        id="emergencyContactRelationship"
                        name="emergencyContactRelationship"
                        placeholder="e.g., Spouse, Parent, Sibling"
                        className="mt-1"
                      />
                    </motion.div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="medical">
                <Card className="p-6 space-y-4">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Label htmlFor="allergies" className="text-sm font-medium">Allergies</Label>
                    <Textarea
                      id="allergies"
                      name="allergies"
                      placeholder="Enter allergies (separated by commas)"
                      rows={2}
                      className="mt-1"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Label htmlFor="medications" className="text-sm font-medium">Current Medications</Label>
                    <Textarea
                      id="medications"
                      name="medications"
                      placeholder="Enter current medications (separated by commas)"
                      rows={2}
                      className="mt-1"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Label htmlFor="medicalConditions" className="text-sm font-medium">Medical Conditions</Label>
                    <Textarea
                      id="medicalConditions"
                      name="medicalConditions"
                      placeholder="Enter medical conditions (separated by commas)"
                      rows={2}
                      className="mt-1"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Label htmlFor="previousSurgeries" className="text-sm font-medium">Previous Surgeries</Label>
                    <Textarea
                      id="previousSurgeries"
                      name="previousSurgeries"
                      placeholder="Enter previous surgeries (separated by commas)"
                      rows={2}
                      className="mt-1"
                    />
                  </motion.div>
                </Card>
              </TabsContent>

              <TabsContent value="dental">
                <Card className="p-6 space-y-4">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Label htmlFor="chiefComplaint" className="text-sm font-medium">Chief Complaint</Label>
                    <Textarea
                      id="chiefComplaint"
                      name="chiefComplaint"
                      placeholder="What brings you to our dental clinic today?"
                      rows={3}
                      className="mt-1"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Label htmlFor="lastVisit" className="text-sm font-medium">Last Dental Visit</Label>
                    <Input
                      id="lastVisit"
                      name="lastVisit"
                      type="date"
                      className="mt-1"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Label htmlFor="previousTreatments" className="text-sm font-medium">Previous Dental Treatments</Label>
                    <Textarea
                      id="previousTreatments"
                      name="previousTreatments"
                      placeholder="Enter previous dental treatments (separated by commas)"
                      rows={3}
                      className="mt-1"
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

export default DelightfulAddPatient;