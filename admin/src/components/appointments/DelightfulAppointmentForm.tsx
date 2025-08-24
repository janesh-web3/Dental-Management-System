import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, Stethoscope, FileText, CalendarPlus } from 'lucide-react';
import DelightfulForm from '@/components/ui/DelightfulForm';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { crudRequest } from '@/lib/api';

interface Patient {
  _id: string;
  name: string;
  phone: string;
  email?: string;
}

interface Doctor {
  _id: string;
  name: string;
  specialization?: string;
}

interface DelightfulAppointmentFormProps {
  onSuccess?: (appointment: any) => void;
  editingAppointment?: any;
  patients?: Patient[];
  doctors?: Doctor[];
  modalClose?: () => void;
}

const appointmentTypes = [
  { value: 'consultation', label: 'Consultation', emoji: '💬', color: 'bg-blue-100 text-blue-800' },
  { value: 'cleaning', label: 'Cleaning', emoji: '🦷', color: 'bg-green-100 text-green-800' },
  { value: 'filling', label: 'Filling', emoji: '🔧', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'extraction', label: 'Extraction', emoji: '🦷', color: 'bg-red-100 text-red-800' },
  { value: 'root-canal', label: 'Root Canal', emoji: '🔧', color: 'bg-purple-100 text-purple-800' },
  { value: 'crown', label: 'Crown/Bridge', emoji: '👑', color: 'bg-amber-100 text-amber-800' },
  { value: 'orthodontics', label: 'Orthodontics', emoji: '😬', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'surgery', label: 'Surgery', emoji: '🔪', color: 'bg-red-100 text-red-800' },
  { value: 'emergency', label: 'Emergency', emoji: '🚨', color: 'bg-red-100 text-red-800' },
  { value: 'follow-up', label: 'Follow-up', emoji: '📋', color: 'bg-gray-100 text-gray-800' }
];

const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
];

const DelightfulAppointmentForm: React.FC<DelightfulAppointmentFormProps> = ({
  onSuccess,
  editingAppointment,
  patients = [],
  doctors = [],
  modalClose
}) => {
  const [selectedAppointmentType, setSelectedAppointmentType] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  useEffect(() => {
    if (editingAppointment) {
      setSelectedAppointmentType(editingAppointment.appointmentType || '');
    }
  }, [editingAppointment]);

  const handleSubmit = async (formData: any) => {
    try {
      const appointmentData = {
        patientId: formData.patientId,
        doctorId: formData.doctorId,
        appointmentType: formData.appointmentType,
        date: formData.date,
        time: formData.time,
        duration: parseInt(formData.duration) || 30,
        notes: formData.notes,
        priority: formData.priority || 'normal',
        status: 'scheduled'
      };

      const endpoint = editingAppointment 
        ? `/appointment/${editingAppointment._id}`
        : '/appointment';
      
      const method = editingAppointment ? 'put' : 'post';
      
      const response = await crudRequest(method, endpoint, appointmentData);
      
      if (response.success) {
        onSuccess?.(response.data);
        modalClose?.();
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to save appointment');
    }
  };

  const getAppointmentTypeInfo = (type: string) => {
    return appointmentTypes.find(t => t.value === type);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-4xl mx-auto"
      >
        <DelightfulForm
          onSubmit={handleSubmit}
          title={editingAppointment ? "📅 Update Appointment" : "📅 Schedule New Appointment"}
          submitLabel={editingAppointment ? "Update Appointment" : "Schedule Appointment"}
          formType="appointment"
          submitIcon={CalendarPlus}
          celebrateOnSuccess={true}
          playfulFeedback={true}
          className="w-full max-w-none"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Basic Details */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <User className="text-blue-500" size={20} />
                <h3 className="font-semibold text-gray-900">Patient & Doctor</h3>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Label htmlFor="patientId" className="text-sm font-medium">Patient *</Label>
                <Select 
                  name="patientId" 
                  required
                  onValueChange={(value) => {
                    const patient = patients.find(p => p._id === value);
                    setSelectedPatient(patient || null);
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient._id} value={patient._id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{patient.name}</span>
                          <span className="text-sm text-gray-500 ml-2">{patient.phone}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {selectedPatient && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-2 p-2 bg-blue-50 rounded-lg"
                  >
                    <p className="text-sm text-blue-800">
                      📞 {selectedPatient.phone}
                      {selectedPatient.email && ` • 📧 ${selectedPatient.email}`}
                    </p>
                  </motion.div>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Label htmlFor="doctorId" className="text-sm font-medium">Doctor *</Label>
                <Select 
                  name="doctorId" 
                  required
                  onValueChange={(value) => {
                    const doctor = doctors.find(d => d._id === value);
                    setSelectedDoctor(doctor || null);
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor._id} value={doctor._id}>
                        <div className="flex items-center gap-2">
                          <Stethoscope size={16} className="text-blue-500" />
                          <span>{doctor.name}</span>
                          {doctor.specialization && (
                            <Badge variant="secondary" className="text-xs">
                              {doctor.specialization}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Label htmlFor="appointmentType" className="text-sm font-medium">Appointment Type *</Label>
                <Select 
                  name="appointmentType" 
                  required
                  onValueChange={setSelectedAppointmentType}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select appointment type" />
                  </SelectTrigger>
                  <SelectContent>
                    {appointmentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <span>{type.emoji}</span>
                          <span>{type.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {selectedAppointmentType && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-2"
                  >
                    {(() => {
                      const typeInfo = getAppointmentTypeInfo(selectedAppointmentType);
                      return typeInfo && (
                        <Badge className={typeInfo.color}>
                          {typeInfo.emoji} {typeInfo.label}
                        </Badge>
                      );
                    })()}
                  </motion.div>
                )}
              </motion.div>
            </Card>

            {/* Right Column - Date & Time */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="text-green-500" size={20} />
                <h3 className="font-semibold text-gray-900">Date & Time</h3>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Label htmlFor="date" className="text-sm font-medium">Appointment Date *</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="mt-1"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Label htmlFor="time" className="text-sm font-medium">Time *</Label>
                <Select name="time" required>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select time slot" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-blue-500" />
                          <span>{time}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Label htmlFor="duration" className="text-sm font-medium">Duration (minutes)</Label>
                <Select name="duration">
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Label htmlFor="priority" className="text-sm font-medium">Priority</Label>
                <Select name="priority">
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">🟢 Low Priority</SelectItem>
                    <SelectItem value="normal">🟡 Normal Priority</SelectItem>
                    <SelectItem value="high">🟠 High Priority</SelectItem>
                    <SelectItem value="urgent">🔴 Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </motion.div>
            </Card>
          </div>

          {/* Notes Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="text-purple-500" size={20} />
                <h3 className="font-semibold text-gray-900">Additional Notes</h3>
              </div>
              
              <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Add any special instructions, symptoms, or notes about this appointment..."
                rows={4}
                className="mt-1"
              />
            </Card>
          </motion.div>
        </DelightfulForm>
      </motion.div>
    </div>
  );
};

export default DelightfulAppointmentForm;