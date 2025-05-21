import React, { createContext, useContext, useEffect, useState } from "react";
import { patientLogin, getCurrentPatient } from "@/utils/patientAuth.ts";

interface PatientDetails {
  role: string;
  name: string;
  email: string;
  contactNumber: string;
  _id: string;
  gender?: string;
  address?: string;
  age?: string;
}

// Define the initial state for the patient
const initialState: PatientDetails = {
  role: "patient",
  contactNumber: "",
  name: "",
  _id: "",
  email: "",
  gender: "",
  address: "",
  age: "",
};

// Define the shape of the context
interface PatientAuthContextType {
  patientDetails: PatientDetails;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  fetchPatientDetails: () => Promise<void>;
}

// Create the context
const PatientAuthContext = createContext<PatientAuthContextType | undefined>(undefined);

type PatientAuthProviderProps = {
  children: React.ReactNode;
};

// Provider to fetch and store patient details
export default function PatientAuthProvider({ children }: PatientAuthProviderProps) {
  const [patientDetails, setPatientDetails] = useState<PatientDetails>(initialState);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPatientDetails = async () => {
    try {
      const token = sessionStorage.getItem("patientToken");
      if (!token) {
        setIsAuthenticated(false);
        return;
      }

      // Use real API call to get patient details
      const response = await getCurrentPatient(token);
      
      if (response.success && response.patient) {
        setPatientDetails(response.patient as PatientDetails);
        setIsAuthenticated(true);
      } else {
        // Token invalid or expired
        console.error("Failed to fetch patient details:", response.message);
        setIsAuthenticated(false);
        sessionStorage.removeItem("patientToken");
      }
    } catch (error) {
      console.error("Failed to fetch patient details:", error);
      setIsAuthenticated(false);
      sessionStorage.removeItem("patientToken");
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Use real API call to authenticate patient
      const response = await patientLogin(email, password);
      
      if (response.success && response.token && response.patient) {
        sessionStorage.setItem("patientToken", response.token);
        setPatientDetails(response.patient as PatientDetails);
        setIsAuthenticated(true);
        return true;
      }
      
      // If there's an error message from the API, log it
      if (response.message) {
        console.error("Login failed:", response.message);
      }
      
      return false;
    } catch (error) {
      console.error("Patient login failed:", error);
      return false;
    }
  };

  const logout = () => {
    sessionStorage.removeItem("patientToken");
    setPatientDetails(initialState);
    setIsAuthenticated(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await fetchPatientDetails();
      setIsLoading(false);
    };

    fetchData();
  }, []);

  return (
    <PatientAuthContext.Provider
      value={{
        patientDetails,
        isAuthenticated,
        isLoading,
        login,
        logout,
        fetchPatientDetails,
      }}
    >
      {children}
    </PatientAuthContext.Provider>
  );
}

// Custom hook for accessing the patient auth context
export const usePatientAuthContext = () => {
  const context = useContext(PatientAuthContext);
  if (!context) {
    throw new Error("usePatientAuthContext must be used within a PatientAuthProvider");
  }
  return context;
};
