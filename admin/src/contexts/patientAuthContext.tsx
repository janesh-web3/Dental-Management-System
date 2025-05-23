import React, { createContext, useContext, useEffect, useState } from "react";
import { patientLogin, getCurrentPatient } from "@/utils/patientAuth";

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

interface PatientAuthContextType {
  patientDetails: PatientDetails;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  fetchPatientDetails: () => Promise<void>;
}

const PatientAuthContext = createContext<PatientAuthContextType | undefined>(
  undefined
);

type PatientAuthProviderProps = {
  children: React.ReactNode;
};

export default function PatientAuthProvider({
  children,
}: PatientAuthProviderProps) {
  const [patientDetails, setPatientDetails] =
    useState<PatientDetails>(initialState);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPatientDetails = async () => {
    try {
      // Get token from localStorage
      const token = localStorage.getItem("patientToken");

      if (!token) {
        setIsAuthenticated(false);
        return;
      }

      const response = await getCurrentPatient(token);
      try {
        if (response.success && response.patient) {
          setPatientDetails(response.patient as PatientDetails);
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        } else {
          if (
            response.message &&
            (response.message.includes("expired") ||
              response.message.includes("invalid") ||
              response.message.includes("token") ||
              response.message.includes("Token") ||
              response.message.includes("unauthorized") ||
              response.message.includes("Authentication failed"))
          ) {
            // localStorage.removeItem("patientToken");
          } else {
          }
        }
      } catch (apiError) {}

      setIsAuthenticated(false);
      setIsLoading(false);
    } catch (error) {
      console.error("Unexpected error in fetchPatientDetails:", error);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const checkAuthentication = () => {
      const token = localStorage.getItem("patientToken");

      if (token) {
        setIsLoading(true);
        fetchPatientDetails();
      } else {
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    };

    checkAuthentication();

    const intervalId = setInterval(() => {
      const token = localStorage.getItem("patientToken");
      if (token && !isAuthenticated) {
        checkAuthentication();
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(intervalId);
  }, [isAuthenticated]); // Re-run if authentication state changes
  useEffect(() => {
    console.log("Authentication state changed:", {
      isAuthenticated,
      isLoading,
    });
  }, [isAuthenticated, isLoading]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log("Attempting patient login with email:", email);
      setIsLoading(true);

      const response = await patientLogin(email, password);
      console.log("Login response received:", {
        success: response.success,
        hasToken: !!response.token,
      });

      if (response.success && response.token && response.patient) {
        if (!response.token.trim()) {
          console.error("Received empty token from server");
          setIsLoading(false);
          return false;
        }

        console.log("Login successful, storing token");
        localStorage.removeItem("patientToken");
        localStorage.setItem("patientToken", response.token);
        setPatientDetails(response.patient as PatientDetails);
        setIsAuthenticated(true);
        setIsLoading(false);

        return true;
      }

      // Login failed, remove any existing token
      localStorage.removeItem("patientToken");
      setIsAuthenticated(false);
      setIsLoading(false);

      if (response.message) {
        console.error("Login failed:", response.message);
      } else {
        console.error("Login failed without specific error message");
      }

      return false;
    } catch (error) {
      console.error("Patient login failed with exception:", error);
      localStorage.removeItem("patientToken");
      setIsAuthenticated(false);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("patientToken");
    setPatientDetails(initialState);
    setIsAuthenticated(false);
    setIsLoading(true);
  };

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

export const usePatientAuthContext = () => {
  const context = useContext(PatientAuthContext);
  if (!context) {
    throw new Error(
      "usePatientAuthContext must be used within a PatientAuthProvider"
    );
  }
  return context;
};
