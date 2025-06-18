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
  token: string | null;
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
  const [token, setToken] = useState<string | null>(null);

  const fetchPatientDetails = async () => {
    try {
      // Get token from localStorage
      const storedToken = localStorage.getItem("patientToken");

      if (!storedToken) {
        setIsAuthenticated(false);
        return;
      }

      setToken(storedToken);
      const response = await getCurrentPatient(storedToken);
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
            setToken(null);
          } else {
          }
        }
      } catch (apiError) {}

      setIsAuthenticated(false);
      setIsLoading(false);
    } catch (error) {
      console.error("Unexpected error in fetchPatientDetails:", error);
      setIsAuthenticated(false);
      setToken(null);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const checkAuthentication = () => {
      const storedToken = localStorage.getItem("patientToken");

      if (storedToken) {
        setToken(storedToken);
        setIsLoading(true);
        fetchPatientDetails();
      } else {
        setToken(null);
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    };

    checkAuthentication();

    const intervalId = setInterval(() => {
      const storedToken = localStorage.getItem("patientToken");
      if (storedToken && !isAuthenticated) {
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
      setIsLoading(true);

      const response = await patientLogin(email, password);

      if (response.success && response.token && response.patient) {
        if (!response.token.trim()) {
          setIsLoading(false);
          return false;
        }
        localStorage.removeItem("patientToken");
        localStorage.setItem("patientToken", response.token);
        setToken(response.token);
        setPatientDetails(response.patient as PatientDetails);
        setIsAuthenticated(true);
        setIsLoading(false);

        return true;
      }

      // Login failed, remove any existing token
      localStorage.removeItem("patientToken");
      setToken(null);
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
      setToken(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("patientToken");
    setToken(null);
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
        token,
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
