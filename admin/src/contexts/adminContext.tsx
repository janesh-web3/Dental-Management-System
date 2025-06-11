import { crudRequest } from "@/lib/api";
import React, { createContext, useContext, useEffect, useState } from "react";

interface AdminDetails {
  role: string;
  name: string;
  email : string;
  contact : string;
  _id: string;
}

// Define the initial state for the basic plan
const initialState: AdminDetails = {
  role: "superadmin",
  contact: "",
  name: "",
  _id: "",
  email: "",
};

// Define the shape of the context
interface AdminContextType {
  adminDetails: AdminDetails;
  isLoading: boolean;
  fetchAdminDetails: () => Promise<void>; // Corrected type
}

// Create the context
const AdminContext = createContext<AdminContextType | undefined>(undefined);

type AdminProviderProps = {
  children: React.ReactNode;
};

// Provider to fetch and store admin details
export default function AdminProvider({ children }: AdminProviderProps) {
  const [adminDetails, setAdminDetails] = useState<AdminDetails>(initialState);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAdminDetails = async () => {
    try {
      const response = await crudRequest<AdminDetails>("GET", "/user/get-role");
      setAdminDetails(response);
    } catch (error) {
      console.error("Failed to fetch admin details:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await fetchAdminDetails();
      setIsLoading(false);
    };

    fetchData();
  }, []);

  return (
    <AdminContext.Provider
      value={{
        adminDetails,
        isLoading,
        fetchAdminDetails,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

// Custom hook for accessing the admin context
export const useAdminContext = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdminContext must be used within an AdminProvider");
  }
  return context;
};
