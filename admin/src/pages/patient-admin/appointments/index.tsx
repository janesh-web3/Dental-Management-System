import React, { useState } from "react";
import { usePatientAuthContext } from "@/contexts/patientAuthContext";
import { motion, AnimatePresence } from "framer-motion";
import AddAppointmentForm from "./AddAppointmentForm";
import AppointmentsTable from "./AppointmentsTable";

const PatientAppointments = () => {
  const { patientDetails } = usePatientAuthContext();
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);

  const handleAddAppointment = () => {
    setIsAddFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsAddFormOpen(false);
  };

  const handleAppointmentSuccess = () => {
    // This will be called after successful appointment creation
    // The table component will handle its own data refresh
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
          <p className="text-muted-foreground mt-2">
            Schedule and manage your dental appointments
          </p>
        </div>

        <AppointmentsTable onAddAppointment={handleAddAppointment} />

        <AnimatePresence>
          {isAddFormOpen && (
            <AddAppointmentForm
              isOpen={isAddFormOpen}
              onClose={handleCloseForm}
              onSuccess={handleAppointmentSuccess}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default PatientAppointments;
