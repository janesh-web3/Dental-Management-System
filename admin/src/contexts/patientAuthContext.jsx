import React, { createContext, useContext, useEffect, useState } from "react";
import { patientLogin, getCurrentPatient } from "@/utils/patientAuth";

// Define the initial state for the patient
const initialState = {
  role: "patient",
  name: "",
  _id: "",
  email: "",
  phoneNumber: "",
  address: "",
};

// Define the shape of the context
const PatientAuthContext = createContext(undefined);

export function PatientAuthProvider({ children }) {
  const [patientDetails, setPatientDetails] = useState(initialState);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPatientDetails = async () => {
    try {
      const token = localStorage.getItem("patientToken");
      if (!token) {
        setIsAuthenticated(false);
        return;
      }

      // Use real API call to get patient details
      const response = await getCurrentPatient(token);
      
      if (response.success && response.patient) {
        setPatientDetails(response.patient);
        setIsAuthenticated(true);
      } else {
        // Token invalid or expired
        console.error("Failed to fetch patient details:", response.message);
        setIsAuthenticated(false);
        localStorage.removeItem("patientToken");
      }
    } catch (error) {
      console.error("Failed to fetch patient details:", error);
      setIsAuthenticated(false);
      localStorage.removeItem("patientToken");
    }
  };

  const login = async (email, password) => {
    try {
      // Use real API call to authenticate patient
      const response = await patientLogin(email, password);
      
      if (response.success && response.token && response.patient) {
        localStorage.setItem("patientToken", response.token);
        setPatientDetails(response.patient);
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
    localStorage.removeItem("patientToken");
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
export function usePatientAuthContext() {
  const context = useContext(PatientAuthContext);
  if (!context) {
    throw new Error("usePatientAuthContext must be used within a PatientAuthProvider");
  }
  return context;
}
