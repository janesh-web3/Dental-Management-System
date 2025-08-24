import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Edit, 
  Trash2, 
  Eye, 
  Phone, 
  Mail, 
  Calendar,
  UserPlus,
  Search,
  Filter,
  MoreVertical,
  Heart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import AccessibleDelightfulButton from '@/components/ui/AccessibleDelightfulButton';
import ConfettiCelebration from '@/components/ui/ConfettiCelebration';
import { useCommonSounds } from '@/contexts/SoundContext';
import { cn } from '@/lib/utils';

interface Patient {
  _id: string;
  name: string;
  email?: string;
  phone: string;
  age: number;
  gender: string;
  address?: string;
  lastVisit?: string;
  status?: 'active' | 'inactive';
  treatmentProgress?: number;
}

interface DelightfulPatientTableProps {
  patients: Patient[];
  onEdit: (patient: Patient) => void;
  onDelete: (patientId: string) => Promise<void>;
  onView: (patient: Patient) => void;
  onAdd: () => void;
  isLoading?: boolean;
}

const DelightfulPatientTable: React.FC<DelightfulPatientTableProps> = ({
  patients,
  onEdit,
  onDelete,
  onView,
  onAdd,
  isLoading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [showDeleteConfetti, setShowDeleteConfetti] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const {
    playSuccessSound,
    playErrorSound,
    playClickSound,
    playPopSound
  } = useCommonSounds();

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone.includes(searchTerm) ||
    patient.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteClick = (patient: Patient) => {
    setPatientToDelete(patient);
    setDeleteDialogOpen(true);
    playPopSound();
  };

  const handleDeleteConfirm = async () => {
    if (patientToDelete) {
      try {
        await onDelete(patientToDelete._id);
        setDeleteDialogOpen(false);
        setPatientToDelete(null);
        setShowDeleteConfetti(true);
        playSuccessSound();
        setTimeout(() => setShowDeleteConfetti(false), 100);
      } catch (error) {
        playErrorSound();
      }
    }
  };

  const handleActionClick = (action: string, patient?: Patient) => {
    playClickSound();
    switch (action) {
      case 'add':
        onAdd();
        break;
      case 'edit':
        if (patient) onEdit(patient);
        break;
      case 'view':
        if (patient) onView(patient);
        break;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const rowVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 }
  };

  const hoverVariants = {
    hover: {
      scale: 1.02,
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
      transition: { duration: 0.2 }
    }
  };

  return (
    <div className="space-y-6">
      <ConfettiCelebration
        trigger={showDeleteConfetti}
        message="🗑️ Patient record archived successfully!"
        colors={['#ef4444', '#f97316', '#eab308']}
        particleCount={50}
      />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h2 className="text-2xl font-bold text-gray-900">👥 Patients</h2>
          <p className="text-gray-600">Manage your dental patients with care</p>
        </div>
        
        <AccessibleDelightfulButton
          variant="primary"
          size="lg"
          animation="bounce"
          icon={UserPlus}
          playful={true}
          soundEffect="success"
          onClick={() => handleActionClick('add')}
        >
          Add Patient
        </AccessibleDelightfulButton>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            type="text"
            placeholder="Search patients by name, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Button variant="outline" className="flex items-center gap-2">
          <Filter size={16} />
          Filters
        </Button>
      </motion.div>

      {/* Patient Cards for Mobile */}
      <div className="block lg:hidden space-y-4">
        <AnimatePresence>
          {filteredPatients.map((patient, index) => (
            <motion.div
              key={patient._id}
              variants={rowVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ delay: index * 0.1 }}
              whileHover="hover"
              className="bg-white rounded-lg shadow-md p-4 space-y-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{patient.name}</h3>
                  <p className="text-gray-600">{patient.age} years • {patient.gender}</p>
                </div>
                
                <Badge className={getStatusColor(patient.status || 'active')}>
                  {patient.status || 'Active'}
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Phone size={14} />
                  {patient.phone}
                </span>
                {patient.email && (
                  <span className="flex items-center gap-1">
                    <Mail size={14} />
                    {patient.email}
                  </span>
                )}
              </div>

              <div className="flex justify-between items-center pt-2 border-t">
                <div className="flex gap-2">
                  <AccessibleDelightfulButton
                    variant="outline"
                    size="sm"
                    animation="scale"
                    icon={Eye}
                    onClick={() => handleActionClick('view', patient)}
                  >
                    View
                  </AccessibleDelightfulButton>
                  
                  <AccessibleDelightfulButton
                    variant="outline"
                    size="sm"
                    animation="pulse"
                    icon={Edit}
                    onClick={() => handleActionClick('edit', patient)}
                  >
                    Edit
                  </AccessibleDelightfulButton>
                </div>

                <AccessibleDelightfulButton
                  variant="destructive"
                  size="sm"
                  animation="shake"
                  icon={Trash2}
                  onClick={() => handleDeleteClick(patient)}
                >
                  Delete
                </AccessibleDelightfulButton>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Desktop Table */}
      <Card className="hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-4 font-medium text-gray-900">Patient</th>
                <th className="text-left p-4 font-medium text-gray-900">Contact</th>
                <th className="text-left p-4 font-medium text-gray-900">Age/Gender</th>
                <th className="text-left p-4 font-medium text-gray-900">Status</th>
                <th className="text-left p-4 font-medium text-gray-900">Last Visit</th>
                <th className="text-right p-4 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredPatients.map((patient, index) => (
                  <motion.tr
                    key={patient._id}
                    variants={rowVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ delay: index * 0.05 }}
                    whileHover={hoverVariants.hover}
                    onHoverStart={() => setHoveredRow(patient._id)}
                    onHoverEnd={() => setHoveredRow(null)}
                    className={cn(
                      "border-b transition-colors",
                      hoveredRow === patient._id && "bg-blue-50"
                    )}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold"
                        >
                          {patient.name.charAt(0).toUpperCase()}
                        </motion.div>
                        <div>
                          <p className="font-medium text-gray-900">{patient.name}</p>
                          {patient.treatmentProgress && (
                            <div className="flex items-center gap-2 mt-1">
                              <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                                <motion.div
                                  className="h-full bg-green-500"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${patient.treatmentProgress}%` }}
                                  transition={{ delay: 0.5, duration: 1 }}
                                />
                              </div>
                              <span className="text-xs text-gray-500">{patient.treatmentProgress}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Phone size={14} className="text-gray-400" />
                          <span className="text-sm">{patient.phone}</span>
                        </div>
                        {patient.email && (
                          <div className="flex items-center gap-2">
                            <Mail size={14} className="text-gray-400" />
                            <span className="text-sm">{patient.email}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td className="p-4">
                      <div>
                        <span className="font-medium">{patient.age}</span>
                        <span className="text-gray-500 ml-1">years</span>
                      </div>
                      <div className="text-sm text-gray-600 capitalize">{patient.gender}</div>
                    </td>
                    
                    <td className="p-4">
                      <Badge className={getStatusColor(patient.status || 'active')}>
                        {patient.status || 'Active'}
                      </Badge>
                    </td>
                    
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400" />
                        <span className="text-sm">
                          {patient.lastVisit 
                            ? new Date(patient.lastVisit).toLocaleDateString()
                            : 'No visits yet'
                          }
                        </span>
                      </div>
                    </td>
                    
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <AccessibleDelightfulButton
                          variant="ghost"
                          size="sm"
                          animation="scale"
                          icon={Eye}
                          onClick={() => handleActionClick('view', patient)}
                          className="h-8 w-8 p-0"
                        />
                        
                        <AccessibleDelightfulButton
                          variant="ghost"
                          size="sm"
                          animation="pulse"
                          icon={Edit}
                          onClick={() => handleActionClick('edit', patient)}
                          className="h-8 w-8 p-0"
                        />
                        
                        <AccessibleDelightfulButton
                          variant="ghost"
                          size="sm"
                          animation="shake"
                          icon={Trash2}
                          onClick={() => handleDeleteClick(patient)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        />
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {filteredPatients.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Heart className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No patients found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ? 'Try adjusting your search criteria' : 'Start by adding your first patient'}
            </p>
            {!searchTerm && (
              <AccessibleDelightfulButton
                variant="primary"
                animation="bounce"
                icon={UserPlus}
                playful={true}
                onClick={() => handleActionClick('add')}
              >
                Add Your First Patient
              </AccessibleDelightfulButton>
            )}
          </motion.div>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>🗑️ Archive Patient Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive <strong>{patientToDelete?.name}</strong>'s record? 
              This will move their data to the recycle bin where it can be restored later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => playPopSound()}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-500 hover:bg-red-600"
            >
              Archive Patient
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DelightfulPatientTable;