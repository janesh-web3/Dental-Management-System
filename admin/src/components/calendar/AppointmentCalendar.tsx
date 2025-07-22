import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Calendar, momentLocalizer, Views, Event } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  CalendarDays, 
  Filter,
  Plus,
  Search,
  RefreshCw,
  Settings,
  X,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { crudRequest } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import CalendarAppointmentModal from './CalendarAppointmentModal';
import MobileCalendarView from './MobileCalendarView';
import ViewPatientDrawer from '../patient/ViewPatientDrawer';
import ViewAppointmentDrawer from './ViewAppointmentDrawer';

// Setup moment localizer and drag-and-drop calendar
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const localizer = momentLocalizer(moment);
const DragAndDropCalendar = withDragAndDrop(Calendar);

// Define appointment interface for TypeScript
interface AppointmentEvent extends Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource?: {
    appointment: any;
    patient: {
      firstName: string;
      lastName: string;
      phoneNumber: string;
    };
    doctor: {
      name: string;
    };
    treatmentType: string;
    status: string;
    priority: string;
    paymentStatus: string;
    chair?: string;
    room?: string;
  };
}

interface AppointmentCalendarProps {
  isAdmin?: boolean;
}

const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({
  isAdmin = false
}) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentView, setCurrentView] = useState<string>(Views.MONTH);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Basic filter state
  const [selectedDoctor, setSelectedDoctor] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedTreatment, setSelectedTreatment] = useState<string>('all');
  
  // Advanced filter state
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  
  // Data state
  const [appointments, setAppointments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [dragging, setDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | undefined>();
  const [editingAppointment, setEditingAppointment] = useState<any>(null);
  
  // Patient modal state for follow-ups
  const [patientModalOpen, setPatientModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  
  // Appointment drawer state for regular appointments
  const [appointmentDrawerOpen, setAppointmentDrawerOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  
  // Drag restriction popup state
  const [dragRestrictionDialogOpen, setDragRestrictionDialogOpen] = useState(false);
  const [dragRestrictionMessage, setDragRestrictionMessage] = useState('');
  
  const { toast } = useToast();

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load data on component mount
  useEffect(() => {
    fetchAppointments();
    if (isAdmin) {
      fetchDoctors();
    }
  }, [isAdmin]);

  // Fetch appointments
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await crudRequest<any>("GET", "/appointment/get-appointments?calendar=true");
      if (response) {
        setAppointments(response);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast({
        title: "Error",
        description: "Failed to load appointments. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch doctors
  const fetchDoctors = async () => {
    try {
      const response = await crudRequest<any>("GET", "/doctor/get-doctor");
      if (response) {
        setDoctors(response);
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
    }
  };

  // Fetch patient details for follow-up events
  const fetchPatientDetails = useCallback(async (patientId: string) => {
    try {
      const response = await crudRequest<any>("GET", `/patient/get-patient/${patientId}`);
      if (response) {
        console.log("Fetched patient data from calander:", response.data);
        setSelectedPatient(response.data);
        setPatientModalOpen(true);
      }
    } catch (error) {
      console.error("Error fetching patient details:", error);
      toast({
        title: "Error",
        description: "Failed to load patient details. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Transform appointments data for React Big Calendar
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const events: AppointmentEvent[] = useMemo(() => {
    return appointments
      .filter(apt => {
        // Basic filters
        if (selectedDoctor !== 'all' && apt.doctor?._id !== selectedDoctor) return false;
        if (selectedStatus !== 'all' && apt.status !== selectedStatus) return false;
        if (selectedTreatment !== 'all' && apt.treatmentType !== selectedTreatment) return false;
        
        // Advanced filters
        if (selectedPriority !== 'all' && apt.priority !== selectedPriority) return false;
        if (paymentFilter !== 'all' && apt.paymentStatus !== paymentFilter) return false;
        
        // Search filter
        if (searchTerm) {
          const search = searchTerm.toLowerCase();
          const patientName = `${apt.firstName} ${apt.lastName}`.toLowerCase();
          const subject = (apt.subject || '').toLowerCase();
          const reason = (apt.reason || '').toLowerCase();
          
          if (!patientName.includes(search) && !subject.includes(search) && !reason.includes(search)) {
            return false;
          }
        }
        
        // Date range filter
        if (startDate || endDate) {
          const appointmentDate = new Date(apt.startDateTime || apt.appointmentDate);
          
          if (startDate && appointmentDate < new Date(startDate)) return false;
          if (endDate && appointmentDate > new Date(endDate)) return false;
        }
        
        return true;
      })
      .map(appointment => ({
        id: appointment._id,
        title: `${appointment.firstName} ${appointment.lastName}`,
        start: appointment.startDateTime ? new Date(appointment.startDateTime) : new Date(`${appointment.appointmentDate}T${appointment.appointmentTime}`),
        end: appointment.endDateTime ? new Date(appointment.endDateTime) : new Date(`${appointment.appointmentDate}T${appointment.appointmentTime}`),
        resource: {
          appointment,
          patient: {
            firstName: appointment.firstName,
            lastName: appointment.lastName,
            phoneNumber: appointment.phoneNumber
          },
          doctor: appointment.doctor || { name: 'Unassigned' },
          treatmentType: appointment.treatmentType || 'Consultation',
          status: appointment.status,
          priority: appointment.priority || 'standard',
          paymentStatus: appointment.paymentStatus || 'pending',
          chair: appointment.chair,
          room: appointment.room
        }
      }));
  }, [appointments, selectedDoctor, selectedStatus, selectedTreatment, selectedPriority, paymentFilter, searchTerm, startDate, endDate]);

  // Custom event style getter
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const eventStyleGetter = useCallback((event: AppointmentEvent) => {
    const { status, priority } = event.resource || {};
    const isFollowUp = event.resource?.appointment?.isFollowUp;
    
    let backgroundColor = '#3174ad';
    let borderColor = '#3174ad';
    
    // Follow-up specific styling
    if (isFollowUp || status === 'Follow-up') {
      backgroundColor = '#8b5cf6';
      borderColor = '#7c3aed';
    } else {
      // Status-based colors for regular appointments
      switch (status) {
        case 'Pending':
          backgroundColor = '#f59e0b';
          borderColor = '#d97706';
          break;
        case 'Accepted':
          backgroundColor = '#10b981';
          borderColor = '#059669';
          break;
        case 'Completed':
          backgroundColor = '#6366f1';
          borderColor = '#4f46e5';
          break;
        case 'Cancelled':
          backgroundColor = '#ef4444';
          borderColor = '#dc2626';
          break;
        case 'No-Show':
          backgroundColor = '#8b5cf6';
          borderColor = '#7c3aed';
          break;
        default:
          backgroundColor = '#6b7280';
          borderColor = '#4b5563';
      }
    }

    // Priority overlay
    if (priority === 'urgent') {
      borderColor = '#dc2626';
      // borderWidth is set in the returned style object below
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        borderWidth: priority === 'urgent' ? '3px' : '1px',
        borderRadius: '4px',
        opacity: isFollowUp ? 0.8 : 0.9, // Slightly more transparent for follow-ups
        color: 'white',
        border: 'none',
        display: 'block'
      }
    };
  }, []);

  // Custom event component
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const EventComponent = ({ event }: { event: AppointmentEvent }) => {
    const { treatmentType, priority, paymentStatus } = event.resource || {};
    
    return (
      <div className="text-xs p-1">
        <div className="font-medium truncate">{event.title}</div>
        <div className="flex items-center gap-1 mt-1">
          <Badge 
            variant={priority === 'urgent' ? 'destructive' : 'secondary'} 
            className="text-[10px] px-1 py-0"
          >
            {treatmentType}
          </Badge>
          {paymentStatus !== 'paid' && (
            <Badge variant="outline" className="text-[10px] px-1 py-0">
              ${paymentStatus}
            </Badge>
          )}
        </div>
      </div>
    );
  };

  // Handle view change
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleViewChange = useCallback((view: string) => {
    setCurrentView(view);
  }, []);

  // Handle navigation
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleNavigate = useCallback((date: Date) => {
    setCurrentDate(date);
  }, []);

  // Handle event selection (for viewing/editing)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSelectEvent = useCallback((event: AppointmentEvent) => {
    const appointment = event.resource?.appointment;
    
    // Check if this is a follow-up event
    if (appointment?.isFollowUp || event.resource?.status === 'Follow-up') {
      // For follow-up events, show patient details instead of appointment details
      const patientId = appointment?.patientId || event.resource?.appointment?.patientId;
      if (patientId) {
        fetchPatientDetails(patientId);
      }
    } else {
      // For regular appointments, show appointment drawer with status change capability
      setSelectedAppointment(appointment);
      setAppointmentDrawerOpen(true);
    }
  }, [fetchPatientDetails]);

  // Handle slot selection for new appointments
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSelectSlot = useCallback((slotInfo: { start: Date; end: Date; slots: Date[] }) => {
    setSelectedSlot({ start: slotInfo.start, end: slotInfo.end });
    setEditingAppointment(null);
    setModalMode('create');
    setModalOpen(true);
  }, []);

  // Handle appointment saved
  const handleAppointmentSaved = useCallback(() => {
    fetchAppointments(); // Refresh appointments
  }, []);

  // Handle status change for appointments
  const handleStatusChange = useCallback(async (appointmentId: string, newStatus: string) => {
    try {
      const response = await crudRequest(
        "PUT",
        `/appointment/update-appointment-status/${appointmentId}`,
        { status: newStatus }
      );

      if (response) {
        toast({
          title: "Status Updated",
          description: `Appointment status has been changed to ${newStatus}.`,
          variant: "default",
        });

        fetchAppointments(); // Refresh appointments
      }
    } catch (error) {
      console.error("Error updating appointment status:", error);
      toast({
        title: "Error",
        description: "Failed to update appointment status. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Handle appointment edit from drawer
  const handleAppointmentEdit = useCallback((appointment: any) => {
    setEditingAppointment(appointment);
    setModalMode('edit');
    setModalOpen(true);
    setAppointmentDrawerOpen(false);
  }, []);

  // Handle appointment delete from drawer
  const handleAppointmentDelete = useCallback(async (appointmentId: string) => {
    try {
      const response = await crudRequest("DELETE", `/appointment/delete-appointment/${appointmentId}`);
      
      if (response) {
        toast({
          title: "Appointment Deleted",
          description: "The appointment has been successfully deleted.",
          variant: "default",
        });

        fetchAppointments(); // Refresh appointments
        setAppointmentDrawerOpen(false);
      }
    } catch (error) {
      console.error("Error deleting appointment:", error);
      toast({
        title: "Error",
        description: "Failed to delete appointment. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Handle new appointment button
  const handleNewAppointment = useCallback(() => {
    setSelectedSlot(undefined);
    setEditingAppointment(null);
    setModalMode('create');
    setModalOpen(true);
  }, []);

  // Handle mobile calendar slot selection
  const handleMobileSlotSelect = useCallback((date: Date, time?: string) => {
    const slot = {
      start: time ? new Date(`${date.toISOString().split('T')[0]}T${time}`) : date,
      end: time ? new Date(`${date.toISOString().split('T')[0]}T${time}`) : date
    };
    setSelectedSlot(slot);
    setEditingAppointment(null);
    setModalMode('create');
    setModalOpen(true);
  }, []);

  // Handle mobile event selection
  const handleMobileEventSelect = useCallback((appointment: any) => {
    // Check if this is a follow-up event
    if (appointment?.isFollowUp || appointment?.status === 'Follow-up') {
      // For follow-up events, show patient details instead of appointment details
      const patientId = appointment?.patientId;
      if (patientId) {
        fetchPatientDetails(patientId);
      }
    } else {
      // For regular appointments, show appointment drawer with status change capability
      setSelectedAppointment(appointment);
      setAppointmentDrawerOpen(true);
    }
  }, [fetchPatientDetails]);

  // Check if an appointment can be dragged
  const canDragAppointment = useCallback((event: AppointmentEvent) => {
    const appointment = event.resource?.appointment;
    const status = appointment?.status || event.resource?.status;
    const isFollowUp = appointment?.isFollowUp || event.title.toLowerCase().includes('follow-up');
    
    // Prevent dragging of follow-up appointments
    if (isFollowUp || status === 'Follow-up') {
      return false;
    }
    
    // Prevent dragging of completed appointments
    if (status === 'Completed') {
      return false;
    }
    
    // Prevent dragging of cancelled appointments
    if (status === 'Cancelled' || status === 'No-Show') {
      return false;
    }
    
    return true;
  }, []);

  // Show drag restriction dialog
  const showDragRestrictionDialog = useCallback((_event: AppointmentEvent, reason: string) => {
    setDragRestrictionMessage(reason);
    setDragRestrictionDialogOpen(true);
  }, []);

  // Handle drag and drop events with restrictions
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onEventDrop = useCallback(async ({ event, start, end }: { event: AppointmentEvent; start: Date; end: Date }) => {
    // Check if this appointment can be dragged
    if (!canDragAppointment(event)) {
      const appointment = event.resource?.appointment;
      const status = appointment?.status || event.resource?.status;
      const isFollowUp = appointment?.isFollowUp || event.title.toLowerCase().includes('follow-up');
      
      let reason = '';
      if (isFollowUp || status === 'Follow-up') {
        reason = 'Follow-up appointments cannot be rescheduled by dragging. Please use the edit button to modify the follow-up date through the patient management system.';
      } else if (status === 'Completed') {
        reason = 'Completed appointments cannot be rescheduled. Please create a new appointment if needed.';
      } else if (status === 'Cancelled' || status === 'No-Show') {
        reason = 'Cancelled or No-Show appointments cannot be rescheduled by dragging. Please create a new appointment instead.';
      }
      
      showDragRestrictionDialog(event, reason);
      return;
    }

    try {
      setDragging(true);
      
      const response = await crudRequest("PUT", `/appointment/reschedule/${event.id}`, {
        startDateTime: start.toISOString(),
        endDateTime: end.toISOString()
      });

      if (response) {
        toast({
          title: "Appointment Rescheduled",
          description: `Appointment moved to ${start.toLocaleDateString()} at ${start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`,
          variant: "default",
        });
        
        fetchAppointments(); // Refresh appointments
      }
    } catch (error: any) {
      console.error("Error rescheduling appointment:", error);
      toast({
        title: "Rescheduling Failed",
        description: error.response?.data?.message || "Failed to reschedule appointment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDragging(false);
    }
  }, [toast, canDragAppointment, showDragRestrictionDialog]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onEventResize = useCallback(async ({ event, start, end }: { event: AppointmentEvent; start: Date; end: Date }) => {
    // Check if this appointment can be resized (same restrictions as dragging)
    if (!canDragAppointment(event)) {
      const appointment = event.resource?.appointment;
      const status = appointment?.status || event.resource?.status;
      const isFollowUp = appointment?.isFollowUp || event.title.toLowerCase().includes('follow-up');
      
      let reason = '';
      if (isFollowUp || status === 'Follow-up') {
        reason = 'Follow-up appointments cannot be resized. Please use the edit button to modify the follow-up duration through the patient management system.';
      } else if (status === 'Completed') {
        reason = 'Completed appointments cannot be modified. Please create a new appointment if needed.';
      } else if (status === 'Cancelled' || status === 'No-Show') {
        reason = 'Cancelled or No-Show appointments cannot be modified. Please create a new appointment instead.';
      }
      
      showDragRestrictionDialog(event, reason);
      return;
    }

    try {
      setDragging(true);
      
      const response = await crudRequest("PUT", `/appointment/reschedule/${event.id}`, {
        startDateTime: start.toISOString(),
        endDateTime: end.toISOString()
      });

      if (response) {
        toast({
          title: "Appointment Duration Updated",
          description: "Appointment duration has been updated successfully",
          variant: "default",
        });
        
        fetchAppointments(); // Refresh appointments
      }
    } catch (error: any) {
      console.error("Error resizing appointment:", error);
      toast({
        title: "Resize Failed",
        description: error.response?.data?.message || "Failed to resize appointment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDragging(false);
    }
  }, [toast, canDragAppointment, showDragRestrictionDialog]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSelectedDoctor('all');
    setSelectedStatus('all');
    setSelectedTreatment('all');
    setSelectedPriority('all');
    setPaymentFilter('all');
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
  }, []);

  // Show mobile view for small screens
  if (isMobile) {
    return (
      <div className="space-y-4">
        <MobileCalendarView
          appointments={appointments}
          onSelectEvent={handleMobileEventSelect}
          onSelectSlot={handleMobileSlotSelect}
          onCreateAppointment={handleNewAppointment}
          loading={loading}
        />
        
        {/* Appointment Modal */}
        <CalendarAppointmentModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onAppointmentSaved={handleAppointmentSaved}
          isAdmin={isAdmin}
          selectedSlot={selectedSlot}
          editingAppointment={editingAppointment}
          mode={modalMode}
        />

        {/* Patient Modal for Follow-ups */}
        {selectedPatient && (
          <ViewPatientDrawer
            isOpen={patientModalOpen}
            onClose={() => {
              setPatientModalOpen(false);
              setSelectedPatient(null);
            }}
            patient={selectedPatient}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with filters and controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-2xl flex items-center gap-2">
              <CalendarDays className="h-6 w-6" />
              Appointment Calendar
            </CardTitle>
            
            <div className="flex flex-wrap items-center gap-2">
              <Button 
                size="sm" 
                onClick={handleNewAppointment}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                New Appointment
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                {showAdvancedFilters ? 'Hide Filters' : 'Advanced Filters'}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={fetchAppointments}
                disabled={loading}
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                Refresh
              </Button>
              
              {(searchTerm || startDate || endDate || selectedPriority !== 'all' || paymentFilter !== 'all') && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={clearFilters}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search patients, subjects, or reasons..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Basic Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Doctor Filter */}
            <div>
              <label className="text-sm font-medium mb-1 block">Doctor</label>
              <select 
                value={selectedDoctor} 
                onChange={(e) => setSelectedDoctor(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-background"
              >
                <option value="all">All Doctors</option>
                {doctors.map(doctor => (
                  <option key={doctor._id} value={doctor._id}>
                    {doctor.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Status Filter */}
            <div>
              <label className="text-sm font-medium mb-1 block">Status</label>
              <select 
                value={selectedStatus} 
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-background"
              >
                <option value="all">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Accepted">Accepted</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
                <option value="No-Show">No-Show</option>
                <option value="Follow-up">Follow-up</option>
              </select>
            </div>
            
            {/* Treatment Type Filter */}
            <div>
              <label className="text-sm font-medium mb-1 block">Treatment</label>
              <select 
                value={selectedTreatment} 
                onChange={(e) => setSelectedTreatment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-background"
              >
                <option value="all">All Treatments</option>
                <option value="Consultation">Consultation</option>
                <option value="Cleaning">Cleaning</option>
                <option value="Extraction">Extraction</option>
                <option value="Root Canal">Root Canal</option>
                <option value="Filling">Filling</option>
                <option value="Emergency">Emergency</option>
                <option value="Follow-up">Follow-up</option>
              </select>
            </div>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="border-t pt-4 mt-4">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Advanced Filters
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Date Range */}
                <div>
                  <label className="text-sm font-medium mb-1 block">Start Date</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="text-sm"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">End Date</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="text-sm"
                  />
                </div>
                
                {/* Priority Filter */}
                <div>
                  <label className="text-sm font-medium mb-1 block">Priority</label>
                  <select 
                    value={selectedPriority} 
                    onChange={(e) => setSelectedPriority(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-background"
                  >
                    <option value="all">All Priorities</option>
                    <option value="low">Low</option>
                    <option value="standard">Standard</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                
                {/* Payment Status Filter */}
                <div>
                  <label className="text-sm font-medium mb-1 block">Payment Status</label>
                  <select 
                    value={paymentFilter} 
                    onChange={(e) => setPaymentFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-background"
                  >
                    <option value="all">All Payment Status</option>
                    <option value="pending">Pending</option>
                    <option value="partial">Partial</option>
                    <option value="paid">Paid</option>
                    <option value="unpaid">Unpaid</option>
                  </select>
                </div>
              </div>
              
              {/* Filter Summary */}
              <div className="mt-3 flex flex-wrap gap-2">
                {searchTerm && (
                  <Badge variant="secondary" className="text-xs">
                    Search: "{searchTerm}"
                  </Badge>
                )}
                {startDate && (
                  <Badge variant="secondary" className="text-xs">
                    From: {new Date(startDate).toLocaleDateString()}
                  </Badge>
                )}
                {endDate && (
                  <Badge variant="secondary" className="text-xs">
                    To: {new Date(endDate).toLocaleDateString()}
                  </Badge>
                )}
                {selectedPriority !== 'all' && (
                  <Badge variant="secondary" className="text-xs">
                    Priority: {selectedPriority}
                  </Badge>
                )}
                {paymentFilter !== 'all' && (
                  <Badge variant="secondary" className="text-xs">
                    Payment: {paymentFilter}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card>
        <CardContent className="p-0">
          <div className="h-[700px] p-4">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading appointments...</p>
                </div>
              </div>
            ) : (
              <DragAndDropCalendar
                localizer={localizer}
                events={events}
                startAccessor={(event: any) => (event as AppointmentEvent).start}
                endAccessor={(event: any) => (event as AppointmentEvent).end}
                onSelectEvent={(event: any) => handleSelectEvent(event as AppointmentEvent)}
                onSelectSlot={handleSelectSlot}
                onNavigate={handleNavigate}
                onView={handleViewChange}
                onEventDrop={(args: any) => onEventDrop({ event: args.event as AppointmentEvent, start: args.start, end: args.end })}
                onEventResize={(args: any) => onEventResize({ event: args.event as AppointmentEvent, start: args.start, end: args.end })}
                view={currentView as any}
                date={currentDate}
                selectable
                popup
                resizable
                eventPropGetter={(event: any) => eventStyleGetter(event as AppointmentEvent)}
                components={{
                  event: ({ event }: { event: any }) => EventComponent({ event: event as AppointmentEvent })
                }}
                className={cn("bg-white rounded-lg", dragging && "opacity-75")}
                style={{ height: '100%' }}
                formats={{
                  timeGutterFormat: 'HH:mm',
                  eventTimeRangeFormat: ({ start, end }, culture, localizer) =>
                    localizer?.format(start, 'HH:mm', culture) + ' - ' + localizer?.format(end, 'HH:mm', culture),
                  agendaTimeFormat: 'HH:mm',
                  agendaTimeRangeFormat: ({ start, end }, culture, localizer) =>
                    localizer?.format(start, 'HH:mm', culture) + ' - ' + localizer?.format(end, 'HH:mm', culture),
                }}
                views={['month', 'week', 'day', 'agenda']}
                step={15}
                timeslots={4}
                min={new Date(2023, 0, 1, 8, 0, 0)}
                max={new Date(2023, 0, 1, 18, 0, 0)}
                showMultiDayTimes
                draggableAccessor={(event: any) => canDragAppointment(event as AppointmentEvent)}
                resizableAccessor={(event: any) => canDragAppointment(event as AppointmentEvent)}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Legend & Drag Controls</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500 rounded cursor-move"></div>
                <span className="text-sm">Pending (Draggable)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded cursor-move"></div>
                <span className="text-sm">Accepted (Draggable)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded cursor-not-allowed"></div>
                <span className="text-sm">Completed (Cannot be dragged)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded cursor-not-allowed"></div>
                <span className="text-sm">Cancelled (Cannot be dragged)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-500 rounded cursor-not-allowed"></div>
                <span className="text-sm">No-Show (Cannot be dragged)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-600 opacity-80 rounded cursor-not-allowed"></div>
                <span className="text-sm">Follow-up (Cannot be dragged)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-red-600 rounded cursor-move"></div>
                <span className="text-sm">Urgent Priority (Draggable if status allows)</span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
              <strong>Tip:</strong> Drag appointments to reschedule them quickly. Follow-up appointments and completed/cancelled appointments cannot be moved via drag & drop - use the edit button instead.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointment Modal */}
      <CalendarAppointmentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onAppointmentSaved={handleAppointmentSaved}
        isAdmin={isAdmin}
        selectedSlot={selectedSlot}
        editingAppointment={editingAppointment}
        mode={modalMode}
      />

      {/* Patient Modal for Follow-ups */}
      {selectedPatient && (
        <ViewPatientDrawer
          isOpen={patientModalOpen}
          onClose={() => {
            setPatientModalOpen(false);
            setSelectedPatient(null);
          }}
          patient={selectedPatient}
        />
      )}

      {/* Appointment Drawer for Regular Appointments */}
      <ViewAppointmentDrawer
        isOpen={appointmentDrawerOpen}
        onClose={() => {
          setAppointmentDrawerOpen(false);
          setSelectedAppointment(null);
        }}
        appointment={selectedAppointment}
        onEdit={handleAppointmentEdit}
        onDelete={handleAppointmentDelete}
        onStatusChange={handleStatusChange}
      />
      
      {/* Drag Restriction Alert Dialog */}
      <AlertDialog open={dragRestrictionDialogOpen} onOpenChange={setDragRestrictionDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Cannot Move Appointment
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              {dragRestrictionMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction 
              onClick={() => setDragRestrictionDialogOpen(false)}
              className="bg-primary hover:bg-primary/90"
            >
              Got it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AppointmentCalendar;