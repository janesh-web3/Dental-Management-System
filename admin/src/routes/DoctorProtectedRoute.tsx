import React from "react";
import { Navigate } from "react-router-dom";
import { useDoctorAuthContext } from "@/contexts/doctorAuthContext";

// Type definition for component props
const DoctorProtectedRoute: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const { isAuthenticated, isLoading } = useDoctorAuthContext();
  
  // Show loading state while checking authentication
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

export default DoctorProtectedRoute;
