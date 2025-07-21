import React from 'react';
import PageHead from "@/components/shared/page-head";
import AppointmentCalendar from "@/components/calendar/AppointmentCalendar";

const Calendar = () => {
  return (
    <div>
      <PageHead title="Calendar" />
      
      <div className="mt-5">
        <AppointmentCalendar isAdmin={true} />
      </div>
    </div>
  );
};

export default Calendar;