import React, { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, startOfWeek, endOfWeek } from 'date-fns';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  List,
  Grid3X3
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface MobileCalendarViewProps {
  appointments: any[];
  onSelectEvent?: (event: any) => void;
  onSelectSlot?: (date: Date, time?: string) => void;
  onCreateAppointment?: () => void;
  loading?: boolean;
}

interface DayAppointment {
  _id: string;
  firstName: string;
  lastName: string;
  appointmentTime: string;
  treatmentType: string;
  status: string;
  priority: string;
  doctor: {
    name: string;
  };
  startDateTime?: string;
}

const MobileCalendarView: React.FC<MobileCalendarViewProps> = ({
  appointments = [],
  onSelectEvent,
  onSelectSlot,
  onCreateAppointment,
  loading = false
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'agenda'>('month');

  // Get appointments for a specific date
  const getAppointmentsForDate = (date: Date): DayAppointment[] => {
    return appointments.filter(apt => {
      const appointmentDate = apt.startDateTime 
        ? new Date(apt.startDateTime)
        : new Date(`${apt.appointmentDate}T${apt.appointmentTime || '00:00'}`);
      return isSameDay(appointmentDate, date);
    }).sort((a, b) => {
      const timeA = a.appointmentTime || a.startDateTime;
      const timeB = b.appointmentTime || b.startDateTime;
      return timeA.localeCompare(timeB);
    });
  };

  // Get all days in the current month
  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate));
    const end = endOfWeek(endOfMonth(currentDate));
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // Get appointments for the next 7 days (agenda view)
  const upcomingAppointments = useMemo(() => {
    const next7Days = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dayAppointments = getAppointmentsForDate(date);
      if (dayAppointments.length > 0 || i === 0) { // Always include today
        next7Days.push({
          date,
          appointments: dayAppointments
        });
      }
    }
    
    return next7Days;
  }, [appointments]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(currentDate.getMonth() - 1);
    } else {
      newDate.setMonth(currentDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Accepted': return 'bg-green-100 text-green-800';
      case 'Completed': return 'bg-blue-100 text-blue-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityIndicator = (priority: string) => {
    if (priority === 'urgent') {
      return <div className="w-2 h-2 bg-red-500 rounded-full" />;
    }
    return null;
  };

  const hasAppointments = (date: Date) => {
    return getAppointmentsForDate(date).length > 0;
  };

  const getAppointmentCount = (date: Date) => {
    return getAppointmentsForDate(date).length;
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Calendar
            </CardTitle>
            <Button size="sm" onClick={onCreateAppointment}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* View Toggle */}
      <Tabs value={view} onValueChange={(value: any) => setView(value)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="month" className="flex items-center gap-2">
            <Grid3X3 className="h-4 w-4" />
            Month
          </TabsTrigger>
          <TabsTrigger value="agenda" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Agenda
          </TabsTrigger>
        </TabsList>

        {/* Month View */}
        <TabsContent value="month">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h3 className="font-semibold">
                  {format(currentDate, 'MMMM yyyy')}
                </h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigateMonth('next')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-px bg-gray-200">
                {/* Day Headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="bg-gray-50 p-2 text-center text-xs font-medium text-gray-500">
                    {day}
                  </div>
                ))}
                
                {/* Calendar Days */}
                {monthDays.map((day, index) => {
                  const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                  const isDayToday = isToday(day);
                  const isSelected = isSameDay(day, selectedDate);
                  const dayHasAppointments = hasAppointments(day);
                  const appointmentCount = getAppointmentCount(day);
                  
                  return (
                    <div
                      key={index}
                      className={cn(
                        "bg-white p-2 min-h-[48px] flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors",
                        !isCurrentMonth && "text-gray-400 bg-gray-50",
                        isDayToday && "bg-blue-50 text-blue-900 font-semibold",
                        isSelected && "bg-blue-100 ring-2 ring-blue-500"
                      )}
                      onClick={() => {
                        setSelectedDate(day);
                        if (onSelectSlot) {
                          onSelectSlot(day);
                        }
                      }}
                    >
                      <span className="text-sm">{format(day, 'd')}</span>
                      {dayHasAppointments && (
                        <div className="flex items-center gap-1 mt-1">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                          {appointmentCount > 1 && (
                            <span className="text-xs text-blue-600 font-medium">
                              {appointmentCount}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Selected Date Appointments */}
          {selectedDate && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {format(selectedDate, 'EEEE, MMMM d')}
                  {isToday(selectedDate) && (
                    <Badge variant="secondary" className="ml-2 text-xs">Today</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <AppointmentsList 
                    appointments={getAppointmentsForDate(selectedDate)}
                    onSelectEvent={onSelectEvent}
                    emptyMessage={`No appointments on ${format(selectedDate, 'MMM d')}`}
                  />
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Agenda View */}
        <TabsContent value="agenda">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Upcoming Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {upcomingAppointments.map(({ date, appointments: dayAppointments }) => (
                    <div key={date.toISOString()}>
                      <div className="flex items-center gap-2 mb-3">
                        <h4 className="font-medium text-sm">
                          {format(date, 'EEEE, MMM d')}
                        </h4>
                        {isToday(date) && (
                          <Badge variant="secondary" className="text-xs">Today</Badge>
                        )}
                        <div className="flex-1 h-px bg-gray-200" />
                      </div>
                      
                      <AppointmentsList 
                        appointments={dayAppointments}
                        onSelectEvent={onSelectEvent}
                        emptyMessage="No appointments"
                        compact
                      />
                    </div>
                  ))}
                  
                  {upcomingAppointments.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No upcoming appointments</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Appointments List Component
interface AppointmentsListProps {
  appointments: DayAppointment[];
  onSelectEvent?: (event: any) => void;
  emptyMessage?: string;
  compact?: boolean;
}

const AppointmentsList: React.FC<AppointmentsListProps> = ({
  appointments,
  onSelectEvent,
  emptyMessage = "No appointments",
  compact = false
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Accepted': return 'bg-green-100 text-green-800';
      case 'Completed': return 'bg-blue-100 text-blue-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityIndicator = (priority: string) => {
    if (priority === 'urgent') {
      return <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />;
    }
    return null;
  };

  if (appointments.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500 text-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", compact && "space-y-1")}>
      {appointments.map((appointment) => (
        <div
          key={appointment._id}
          className={cn(
            "p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors",
            compact && "p-2"
          )}
          onClick={() => onSelectEvent?.(appointment)}
        >
          <div className="flex items-start gap-3">
            {getPriorityIndicator(appointment.priority)}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={cn("font-medium", compact ? "text-sm" : "text-base")}>
                  {appointment.firstName} {appointment.lastName}
                </span>
                <Badge className={cn("text-xs", getStatusColor(appointment.status))}>
                  {appointment.status}
                </Badge>
              </div>
              
              <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                <Clock className="h-3 w-3" />
                <span>{appointment.appointmentTime}</span>
                {appointment.treatmentType && (
                  <>
                    <span>•</span>
                    <span>{appointment.treatmentType}</span>
                  </>
                )}
              </div>
              
              {appointment.doctor && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <User className="h-3 w-3" />
                  <span>Dr. {appointment.doctor.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MobileCalendarView;