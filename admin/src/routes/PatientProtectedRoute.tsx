import React, { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { usePatientAuthContext } from "@/contexts";

// Type definition for component props
interface PatientProtectedRouteProps {
  children: ReactNode;
}

const PatientProtectedRoute: React.FC<PatientProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = usePatientAuthContext();
  
  // Show loading state while checking authentication
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/patient/login" replace />;
};

export default PatientProtectedRoute;
