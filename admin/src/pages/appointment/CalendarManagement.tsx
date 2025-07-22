import { useState } from 'react';
import PageHead from "@/components/shared/page-head";
import AppointmentCalendar from "@/components/calendar/AppointmentCalendar";
import FollowUpManager from "@/components/calendar/FollowUpManager";
import DoctorAvailabilityManager from "@/components/calendar/DoctorAvailabilityManager";
import TaskManager from "@/components/calendar/TaskManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
 
  CheckSquare,
  UserCheck,
  RefreshCw 
} from "lucide-react";

const CalendarManagement = () => {
  const [activeTab, setActiveTab] = useState<"calendar" | "followups" | "availability" | "tasks">("calendar");
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDataChanged = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div>
      <PageHead title="Calendar Management"/>
      
      <div className="mt-5">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full max-w-2xl grid-cols-4 mb-6">
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Calendar</span>
            </TabsTrigger>
            <TabsTrigger value="followups" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Follow-ups</span>
            </TabsTrigger>
            <TabsTrigger value="availability" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Availability</span>
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Tasks</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="calendar" className="mt-5">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">Appointment Calendar</h1>
                  <p className="text-muted-foreground">
                    Manage appointments with drag-and-drop scheduling, advanced filtering, and mobile-friendly views
                  </p>
                </div>
              </div>
              
              <AppointmentCalendar 
                key={`calendar-${refreshKey}`}
                isAdmin={true} 
              />
            </div>
          </TabsContent>
          
          <TabsContent value="followups" className="mt-5">
            <FollowUpManager 
              key={`followups-${refreshKey}`}
              onFollowUpCreated={handleDataChanged}
            />
          </TabsContent>
          
          <TabsContent value="availability" className="mt-5">
            <DoctorAvailabilityManager 
              key={`availability-${refreshKey}`}
              onAvailabilityChanged={handleDataChanged}
            />
          </TabsContent>
          
          <TabsContent value="tasks" className="mt-5">
            <TaskManager 
              key={`tasks-${refreshKey}`}
              onTaskUpdated={handleDataChanged}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CalendarManagement;