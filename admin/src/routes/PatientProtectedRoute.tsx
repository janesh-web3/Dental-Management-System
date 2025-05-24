import React, { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { usePatientAuthContext } from "@/contexts/patientAuthContext";

// Type definition for component props
interface PatientProtectedRouteProps {
  children: ReactNode;
}

const PatientProtectedRoute: React.FC<PatientProtectedRouteProps> = ({
  children,
}) => {
  const { isAuthenticated, isLoading } = usePatientAuthContext();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Verifying your session...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/home" replace />;
};

export default PatientProtectedRoute;
