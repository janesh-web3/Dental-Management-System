import React, { createContext, useContext, useEffect, useState } from "react";
import { doctorLogin, getCurrentDoctor } from "@/utils/auth";

interface DoctorDetails {
  role: string;
  name: string;
  email: string;
  contact: string;
  _id: string;
  specialization?: string;
}

// Define the initial state for the doctor
const initialState: DoctorDetails = {
  role: "doctor",
  contact: "",
  name: "",
  _id: "",
  email: "",
  specialization: "",
};

// Define the shape of the context
interface DoctorAuthContextType {
  doctorDetails: DoctorDetails;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  fetchDoctorDetails: () => Promise<void>;
}

// Create the context
const DoctorAuthContext = createContext<DoctorAuthContextType | undefined>(undefined);

type DoctorAuthProviderProps = {
  children: React.ReactNode;
};

// Provider to fetch and store doctor details
export default function DoctorAuthProvider({ children }: DoctorAuthProviderProps) {
  const [doctorDetails, setDoctorDetails] = useState<DoctorDetails>(initialState);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  const fetchDoctorDetails = async () => {
    try {
      const storedToken = sessionStorage.getItem("doctorToken");
      if (!storedToken) {
        setIsAuthenticated(false);
        return;
      }

      setToken(storedToken);
      const response = await getCurrentDoctor(storedToken);
      
      if (response.success && response.doctor) {
        setDoctorDetails(response.doctor as DoctorDetails);
        setIsAuthenticated(true);
      } else {
        // Token invalid or expired
        console.error("Failed to fetch doctor details:", response.message);
        setIsAuthenticated(false);
        setToken(null);
        sessionStorage.removeItem("doctorToken");
      }
    } catch (error) {
      console.error("Failed to fetch doctor details:", error);
      setIsAuthenticated(false);
      setToken(null);
      sessionStorage.removeItem("doctorToken");
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Use real API call to authenticate doctor
      const response = await doctorLogin(email, password);
      
      if (response.success && response.token && response.doctor) {
        sessionStorage.setItem("doctorToken", response.token);
        setToken(response.token);
        setDoctorDetails(response.doctor as DoctorDetails);
        setIsAuthenticated(true);
        return true;
      }
      
      // If there's an error message from the API, log it
      if (response.message) {
        console.error("Login failed:", response.message);
      }
      
      return false;
    } catch (error) {
      console.error("Doctor login failed:", error);
      return false;
    }
  };

  const logout = () => {
    sessionStorage.removeItem("doctorToken");
    setToken(null);
    setDoctorDetails(initialState);
    setIsAuthenticated(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await fetchDoctorDetails();
      setIsLoading(false);
    };

    fetchData();
  }, []);

  return (
    <DoctorAuthContext.Provider
      value={{
        doctorDetails,
        isAuthenticated,
        isLoading,
        token,
        login,
        logout,
        fetchDoctorDetails,
      }}
    >
      {children}
    </DoctorAuthContext.Provider>
  );
}

// Custom hook for accessing the doctor auth context
export const useDoctorAuthContext = () => {
  const context = useContext(DoctorAuthContext);
  if (!context) {
    throw new Error("useDoctorAuthContext must be used within a DoctorAuthProvider");
  }
  return context;
};
