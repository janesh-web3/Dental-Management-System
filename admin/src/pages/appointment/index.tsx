
import React, { useState } from 'react';
import PageHead from "@/components/shared/page-head";
import AppointmentTable from "./AppointmentTable";
import AppointmentCalendar from "@/components/calendar/AppointmentCalendar";
import CalendarManagement from "./CalendarManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Table, Settings } from "lucide-react";

const Appointment = () => {
  const [activeView, setActiveView] = useState<"table" | "calendar" | "management">("table");

  return (
    <div>
      <PageHead title="Appointments"/>
      
      <div className="mt-5">
        <Tabs value={activeView} onValueChange={(value) => setActiveView(value as "table" | "calendar" | "management")}>
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="table" className="flex items-center gap-2">
              <Table className="h-4 w-4" />
              <span className="hidden sm:inline">Table View</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Calendar</span>
            </TabsTrigger>
            <TabsTrigger value="management" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Management</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="table" className="mt-5">
            <AppointmentTable/>
          </TabsContent>
          
          <TabsContent value="calendar" className="mt-5">
            <AppointmentCalendar isAdmin={true} />
          </TabsContent>

          <TabsContent value="management" className="mt-5">
            <CalendarManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Appointment;
