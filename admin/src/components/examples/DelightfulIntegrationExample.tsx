import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  UserPlus, 
  Calendar,
  DollarSign,
  Stethoscope,
  Edit,
  Trash2,
  Eye,
  Save,
  Plus
} from 'lucide-react';
import DelightfulActionWrapper, { useDelightfulActions } from '@/components/ui/DelightfulActionWrapper';
import AccessibleDelightfulButton from '@/components/ui/AccessibleDelightfulButton';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { crudRequest } from '@/lib/api';

const DelightfulIntegrationExample: React.FC = () => {
  const [patients, setPatients] = useState([
    { _id: '1', name: 'John Doe', phone: '123-456-7890', age: 30, lastVisit: '2024-01-15' },
    { _id: '2', name: 'Jane Smith', phone: '098-765-4321', age: 25, lastVisit: '2024-01-20' }
  ]);

  const actions = useDelightfulActions();

  // Example CRUD operations with delightful feedback
  const handleCreatePatient = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newPatient = {
      _id: Date.now().toString(),
      name: 'Alice Johnson',
      phone: '555-123-4567',
      age: 28,
      lastVisit: new Date().toISOString()
    };
    
    setPatients(prev => [...prev, newPatient]);
    return newPatient;
  };

  const handleUpdatePatient = async (patientId: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setPatients(prev => 
      prev.map(p => 
        p._id === patientId 
          ? { ...p, name: p.name + ' (Updated)', lastVisit: new Date().toISOString() }
          : p
      )
    );
    
    return { message: 'Patient updated successfully' };
  };

  const handleDeletePatient = async (patientId: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setPatients(prev => prev.filter(p => p._id !== patientId));
    return { message: 'Patient deleted successfully' };
  };

  const handleViewPatient = async (patientId: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const patient = patients.find(p => p._id === patientId);
    console.log('Viewing patient:', patient);
    return patient;
  };

  const handleScheduleAppointment = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1800));
    
    return { message: 'Appointment scheduled successfully' };
  };

  const handleCreateInvoice = async () => {
    // Simulate API call with potential failure
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Simulate random failure for demo
    if (Math.random() > 0.7) {
      throw new Error('Failed to create invoice. Please try again.');
    }
    
    return { message: 'Invoice created successfully', invoiceId: 'INV-001' };
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🎉 Delightful User Experience Integration
        </h1>
        <p className="text-lg text-gray-600">
          Every action in your Dental Management System is now delightful and engaging!
        </p>
      </motion.div>

      {/* Quick Actions Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          ⚡ Quick Actions
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <DelightfulActionWrapper
            config={actions.createAction('patient', {
              loadingMessages: [
                'Creating patient profile...',
                'Setting up dental records...',
                'Preparing welcome package...',
                'Almost ready!'
              ]
            })}
            onAction={handleCreatePatient}
            trigger={
              <AccessibleDelightfulButton
                variant="primary"
                animation="bounce"
                icon={UserPlus}
                playful={true}
                className="w-full"
              >
                Add New Patient
              </AccessibleDelightfulButton>
            }
          />

          <DelightfulActionWrapper
            config={actions.customAction('appointment', 'Schedule', {
              successMessage: '📅 Appointment scheduled perfectly!',
              loadingMessages: [
                'Finding the perfect time slot...',
                'Coordinating schedules...',
                'Preparing the dental chair...',
                'Confirming appointment!'
              ]
            })}
            onAction={handleScheduleAppointment}
            trigger={
              <AccessibleDelightfulButton
                variant="secondary"
                animation="pulse"
                icon={Calendar}
                playful={true}
                className="w-full"
              >
                Schedule Appointment
              </AccessibleDelightfulButton>
            }
          />

          <DelightfulActionWrapper
            config={actions.customAction('invoice', 'Create', {
              successMessage: '💰 Invoice created and ready!',
              loadingMessages: [
                'Calculating treatment costs...',
                'Applying insurance coverage...',
                'Generating invoice...',
                'Finalizing payment details...'
              ]
            })}
            onAction={handleCreateInvoice}
            trigger={
              <AccessibleDelightfulButton
                variant="outline"
                animation="glow"
                icon={DollarSign}
                playful={true}
                className="w-full"
              >
                Create Invoice
              </AccessibleDelightfulButton>
            }
          />

          <DelightfulActionWrapper
            config={actions.customAction('treatment', 'Plan', {
              successMessage: '🦷 Treatment plan optimized!',
              loadingMessages: [
                'Analyzing dental condition...',
                'Consulting best practices...',
                'Designing treatment plan...',
                'Ready for healthy smiles!'
              ]
            })}
            onAction={async () => {
              await new Promise(resolve => setTimeout(resolve, 2200));
              return { message: 'Treatment plan created' };
            }}
            trigger={
              <AccessibleDelightfulButton
                variant="success"
                animation="wobble"
                icon={Stethoscope}
                playful={true}
                className="w-full"
              >
                Plan Treatment
              </AccessibleDelightfulButton>
            }
          />
        </div>
      </Card>

      {/* Patient Management Example */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          👥 Patient Management with Delightful Actions
        </h2>
        
        <div className="space-y-4">
          {patients.map((patient, index) => (
            <motion.div
              key={patient._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-4">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold"
                >
                  {patient.name.charAt(0)}
                </motion.div>
                
                <div>
                  <h3 className="font-medium text-gray-900">{patient.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>📞 {patient.phone}</span>
                    <span>🎂 {patient.age} years</span>
                    <span>📅 Last visit: {new Date(patient.lastVisit).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <DelightfulActionWrapper
                  config={actions.readAction('patient details')}
                  onAction={() => handleViewPatient(patient._id)}
                  trigger={
                    <AccessibleDelightfulButton
                      variant="ghost"
                      size="sm"
                      animation="scale"
                      icon={Eye}
                      className="h-8 w-8 p-0"
                    />
                  }
                />

                <DelightfulActionWrapper
                  config={actions.updateAction('patient', {
                    confirmMessage: `Update ${patient.name}'s information?`,
                    successMessage: `✨ ${patient.name}'s profile updated successfully!`
                  })}
                  onAction={() => handleUpdatePatient(patient._id)}
                  trigger={
                    <AccessibleDelightfulButton
                      variant="ghost"
                      size="sm"
                      animation="pulse"
                      icon={Edit}
                      className="h-8 w-8 p-0"
                    />
                  }
                />

                <DelightfulActionWrapper
                  config={actions.deleteAction('patient', {
                    confirmMessage: `Are you sure you want to delete ${patient.name}'s record? This will archive their data and it can be restored later if needed.`,
                    successMessage: `🗑️ ${patient.name}'s record has been safely archived!`,
                    loadingMessages: [
                      'Archiving patient data...',
                      'Backing up medical records...',
                      'Moving to recycle bin...',
                      'Cleanup complete!'
                    ]
                  })}
                  onAction={() => handleDeletePatient(patient._id)}
                  trigger={
                    <AccessibleDelightfulButton
                      variant="ghost"
                      size="sm"
                      animation="shake"
                      icon={Trash2}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                    />
                  }
                />
              </div>
            </motion.div>
          ))}
        </div>

        {patients.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8"
          >
            <UserPlus className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600 mb-4">No patients found</p>
            <DelightfulActionWrapper
              config={actions.createAction('patient')}
              onAction={handleCreatePatient}
              trigger={
                <AccessibleDelightfulButton
                  variant="primary"
                  animation="bounce"
                  icon={UserPlus}
                  playful={true}
                >
                  Add Your First Patient
                </AccessibleDelightfulButton>
              }
            />
          </motion.div>
        )}
      </Card>

      {/* Features Overview */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">✨ Delightful Features Active</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="font-medium text-green-900 mb-2">🎉 Confetti Celebrations</h3>
            <p className="text-sm text-green-700">Success actions trigger celebratory confetti effects</p>
          </div>
          
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">🔊 Sound Feedback</h3>
            <p className="text-sm text-blue-700">Every interaction has appropriate sound feedback</p>
          </div>
          
          <div className="p-4 bg-purple-50 rounded-lg">
            <h3 className="font-medium text-purple-900 mb-2">⏳ Playful Loading</h3>
            <p className="text-sm text-purple-700">Loading states with engaging, context-aware messages</p>
          </div>
          
          <div className="p-4 bg-yellow-50 rounded-lg">
            <h3 className="font-medium text-yellow-900 mb-2">🎯 Smart Animations</h3>
            <p className="text-sm text-yellow-700">Contextual animations that respect accessibility</p>
          </div>
          
          <div className="p-4 bg-pink-50 rounded-lg">
            <h3 className="font-medium text-pink-900 mb-2">📱 Responsive Delight</h3>
            <p className="text-sm text-pink-700">Optimized delightful experiences across all devices</p>
          </div>
          
          <div className="p-4 bg-indigo-50 rounded-lg">
            <h3 className="font-medium text-indigo-900 mb-2">♿ Accessibility First</h3>
            <p className="text-sm text-indigo-700">All delightful features respect user preferences</p>
          </div>
        </div>
      </Card>

      {/* Usage Stats */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">📊 Delightful Interaction Stats</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">12</div>
            <div className="text-sm text-gray-600">Components Enhanced</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">8</div>
            <div className="text-sm text-gray-600">Sound Effects</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">6</div>
            <div className="text-sm text-gray-600">Animation Types</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">100%</div>
            <div className="text-sm text-gray-600">Accessibility Compliant</div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DelightfulIntegrationExample;