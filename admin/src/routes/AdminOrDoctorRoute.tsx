import React from "react";
import { Navigate } from "react-router-dom";
import { useDoctorAuthContext } from "@/contexts/doctorAuthContext";

// Type definition for component props
const AdminOrDoctorRoute: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const { isAuthenticated: isDoctorAuthenticated, isLoading: isDoctorLoading } = useDoctorAuthContext();
  const adminToken = sessionStorage.getItem("token");
  const isAdminAuthenticated = !!adminToken;
  
  // Show loading state while checking doctor authentication
  if (isDoctorLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  // Allow access if either admin or doctor is authenticated
  if (isAdminAuthenticated || isDoctorAuthenticated) {
    return <>{children}</>;
  }
  
  // If not authenticated as either, redirect to login
  return <Navigate to="/login" replace />;
};

export default AdminOrDoctorRoute;
