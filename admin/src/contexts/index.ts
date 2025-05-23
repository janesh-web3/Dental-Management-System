// Export all contexts from a single file to simplify imports
export { default as AdminProvider, useAdminContext } from './adminContext';
export { default as DoctorAuthProvider, useDoctorAuthContext } from './doctorAuthContext';
export { default as PatientAuthProvider, usePatientAuthContext } from './patientAuthContext.tsx';
export { DoctorProvider, useDoctorContext } from './DoctorContext';
