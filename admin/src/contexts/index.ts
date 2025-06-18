// Export all contexts from a single file to simplify imports
export { default as AdminProvider } from "./adminContext";
export { DoctorProvider } from "./DoctorContext";
export { default as DoctorAuthProvider } from "./doctorAuthContext";
export { default as PatientAuthProvider } from "./patientAuthContext";
export { default as SocketProvider } from "./socketContext";
export { useSocket } from "./socketContext";
export { useDoctorContext } from "./DoctorContext";
export { useAdminContext } from "./adminContext";
export { useDoctorAuthContext } from "./doctorAuthContext";
export { usePatientAuthContext } from "./patientAuthContext";
