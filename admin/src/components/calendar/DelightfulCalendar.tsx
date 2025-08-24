import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  Clock,
  User,
  Stethoscope,
  MapPin,
  Phone,
  CheckCircle,
  XCircle,
  Edit,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import AccessibleDelightfulButton from '@/components/ui/AccessibleDelightfulButton';
import ConfettiCelebration from '@/components/ui/ConfettiCelebration';
import { useCommonSounds } from '@/contexts/SoundContext';
import { cn } from '@/lib/utils';

interface Appointment {
  _id: string;
  patientName: string;
  doctorName: string;
  appointmentType: string;
  date: string;
  time: string;
  duration: number;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  notes?: string;
}

interface DelightfulCalendarProps {
  appointments: Appointment[];
  onAppointmentClick?: (appointment: Appointment) => void;
  onAddAppointment?: (date: Date) => void;
  onUpdateStatus?: (appointmentId: string, status: string) => void;
  onEditAppointment?: (appointment: Appointment) => void;
  onDeleteAppointment?: (appointmentId: string) => void;
}

const statusColors = {
  scheduled: 'bg-blue-100 text-blue-800 border-blue-300',
  confirmed: 'bg-green-100 text-green-800 border-green-300',
  completed: 'bg-gray-100 text-gray-800 border-gray-300',
  cancelled: 'bg-red-100 text-red-800 border-red-300'
};

const statusEmojis = {
  scheduled: '📅',
  confirmed: '✅',
  completed: '✔️',
  cancelled: '❌'
};

const priorityColors = {
  low: 'border-l-green-400',
  normal: 'border-l-blue-400',
  high: 'border-l-yellow-400',
  urgent: 'border-l-red-400'
};

const appointmentTypeEmojis: Record<string, string> = {
  consultation: '💬',
  cleaning: '🦷',
  filling: '🔧',
  extraction: '🦷',
  'root-canal': '🔧',
  crown: '👑',
  orthodontics: '😬',
  surgery: '🔪',
  emergency: '🚨',
  'follow-up': '📋'
};

const DelightfulCalendar: React.FC<DelightfulCalendarProps> = ({
  appointments = [],
  onAppointmentClick,
  onAddAppointment,
  onUpdateStatus,
  onEditAppointment,
  onDeleteAppointment
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiMessage, setConfettiMessage] = useState('');
  const [hoveredAppointment, setHoveredAppointment] = useState<string | null>(null);

  const {
    playSuccessSound,
    playClickSound,
    playCelebrationSound,
    playPopSound
  } = useCommonSounds();

  // Get appointments for a specific date
  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return aptDate.toDateString() === date.toDateString();
    });
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDateObj = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDateObj));
      currentDateObj.setDate(currentDateObj.getDate() + 1);
    }
    
    return days;
  };

  const handleStatusUpdate = async (appointmentId: string, newStatus: string) => {
    try {
      await onUpdateStatus?.(appointmentId, newStatus);
      
      if (newStatus === 'completed') {
        setConfettiMessage('🎉 Appointment completed successfully!');
        setShowConfetti(true);
        playCelebrationSound();
        setTimeout(() => setShowConfetti(false), 100);
      } else {
        playSuccessSound();
      }
    } catch (error) {
      console.error('Failed to update appointment status:', error);
    }
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    playClickSound();
    onAddAppointment?.(date);
  };

  const handleAppointmentAction = (action: string, appointment?: Appointment) => {
    playPopSound();
    
    switch (action) {
      case 'edit':
        if (appointment) onEditAppointment?.(appointment);
        break;
      case 'delete':
        if (appointment) onDeleteAppointment?.(appointment._id);
        break;
      case 'view':
        if (appointment) onAppointmentClick?.(appointment);
        break;
    }
  };

  const calendarDays = generateCalendarDays();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
    playClickSound();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  return (
    <div className="space-y-6">
      <ConfettiCelebration
        trigger={showConfetti}
        message={confettiMessage}
        colors={['#10b981', '#3b82f6', '#8b5cf6']}
      />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <CalendarIcon className="text-blue-500" size={32} />
          </motion.div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">📅 Appointment Calendar</h2>
            <p className="text-gray-600">Manage your dental appointments with style</p>
          </div>
        </div>
        
        <AccessibleDelightfulButton
          variant="primary"
          animation="bounce"
          icon={Plus}
          playful={true}
          onClick={() => onAddAppointment?.(new Date())}
        >
          New Appointment
        </AccessibleDelightfulButton>
      </motion.div>

      <Card className="p-6">
        {/* Calendar Navigation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-between mb-6"
        >
          <AccessibleDelightfulButton
            variant="ghost"
            animation="scale"
            icon={ChevronLeft}
            onClick={() => navigateMonth('prev')}
            className="p-2"
          />
          
          <motion.h3
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 12, stiffness: 300 }}
            className="text-xl font-semibold text-gray-900"
          >
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </motion.h3>
          
          <AccessibleDelightfulButton
            variant="ghost"
            animation="scale"
            icon={ChevronRight}
            onClick={() => navigateMonth('next')}
            className="p-2"
          />
        </motion.div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="p-2 text-center font-medium text-gray-500 text-sm">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          <AnimatePresence>
            {calendarDays.map((date, index) => {
              const dayAppointments = getAppointmentsForDate(date);
              const isCurrentMonthDate = isCurrentMonth(date);
              const isTodayDate = isToday(date);
              
              return (
                <motion.div
                  key={date.toISOString()}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.01 }}
                  whileHover={{ scale: 1.02 }}
                  className={cn(
                    "min-h-[100px] p-2 border rounded-lg cursor-pointer transition-all duration-200",
                    isCurrentMonthDate ? "bg-white hover:bg-blue-50" : "bg-gray-50 text-gray-400",
                    isTodayDate && "ring-2 ring-blue-500 bg-blue-50",
                    dayAppointments.length > 0 && "border-blue-300"
                  )}
                  onClick={() => handleDateClick(date)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={cn(
                      "text-sm font-medium",
                      isTodayDate && "text-blue-600"
                    )}>
                      {date.getDate()}
                    </span>
                    {dayAppointments.length > 0 && (
                      <Badge variant="secondary" className="text-xs px-1">
                        {dayAppointments.length}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    {dayAppointments.slice(0, 2).map((appointment, aptIndex) => (
                      <motion.div
                        key={appointment._id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * aptIndex }}
                        whileHover={{ scale: 1.05 }}
                        onHoverStart={() => setHoveredAppointment(appointment._id)}
                        onHoverEnd={() => setHoveredAppointment(null)}
                        className={cn(
                          "p-1 rounded text-xs border-l-2 cursor-pointer",
                          statusColors[appointment.status],
                          priorityColors[appointment.priority],
                          hoveredAppointment === appointment._id && "shadow-md"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAppointmentClick?.(appointment);
                        }}
                      >
                        <div className="flex items-center gap-1">
                          <span>{appointmentTypeEmojis[appointment.appointmentType] || '📅'}</span>
                          <span className="truncate">{appointment.time}</span>
                        </div>
                        <div className="truncate font-medium">
                          {appointment.patientName}
                        </div>
                      </motion.div>
                    ))}
                    
                    {dayAppointments.length > 2 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-gray-500 text-center"
                      >
                        +{dayAppointments.length - 2} more
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </Card>

      {/* Today's Appointments */}
      <Card className="p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2">
            <Clock className="text-green-500" size={20} />
            <h3 className="text-lg font-semibold text-gray-900">Today's Appointments</h3>
            <Badge className="bg-green-100 text-green-800">
              {getAppointmentsForDate(new Date()).length} appointments
            </Badge>
          </div>

          {getAppointmentsForDate(new Date()).length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <CalendarIcon className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600 mb-4">No appointments scheduled for today</p>
              <AccessibleDelightfulButton
                variant="outline"
                animation="pulse"
                icon={Plus}
                onClick={() => onAddAppointment?.(new Date())}
              >
                Schedule an Appointment
              </AccessibleDelightfulButton>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {getAppointmentsForDate(new Date())
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((appointment, index) => (
                <motion.div
                  key={appointment._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className={cn(
                    "p-4 border rounded-lg border-l-4",
                    priorityColors[appointment.priority],
                    "hover:shadow-md transition-all duration-200"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">
                        {appointmentTypeEmojis[appointment.appointmentType] || '📅'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900">{appointment.patientName}</h4>
                          <Badge className={statusColors[appointment.status]}>
                            {statusEmojis[appointment.status]} {appointment.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {appointment.time} ({appointment.duration} min)
                          </span>
                          <span className="flex items-center gap-1">
                            <Stethoscope size={14} />
                            {appointment.doctorName}
                          </span>
                          <span className="capitalize">{appointment.appointmentType}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {appointment.status === 'scheduled' && (
                        <AccessibleDelightfulButton
                          variant="outline"
                          size="sm"
                          animation="pulse"
                          icon={CheckCircle}
                          onClick={() => handleStatusUpdate(appointment._id, 'confirmed')}
                        >
                          Confirm
                        </AccessibleDelightfulButton>
                      )}
                      
                      {appointment.status === 'confirmed' && (
                        <AccessibleDelightfulButton
                          variant="success"
                          size="sm"
                          animation="bounce"
                          icon={CheckCircle}
                          onClick={() => handleStatusUpdate(appointment._id, 'completed')}
                        >
                          Complete
                        </AccessibleDelightfulButton>
                      )}

                      <AccessibleDelightfulButton
                        variant="ghost"
                        size="sm"
                        animation="scale"
                        icon={Edit}
                        onClick={() => handleAppointmentAction('edit', appointment)}
                        className="h-8 w-8 p-0"
                      />
                      
                      <AccessibleDelightfulButton
                        variant="ghost"
                        size="sm"
                        animation="shake"
                        icon={Trash2}
                        onClick={() => handleAppointmentAction('delete', appointment)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </Card>
    </div>
  );
};

export default DelightfulCalendar;