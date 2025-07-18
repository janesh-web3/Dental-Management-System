import { crudRequest } from "@/lib/api";
import React, { createContext, useContext, useEffect, useState } from "react";

interface Permission {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
}

interface Permissions {
  dashboard: {
    fullAccess: boolean;
    basicAccess: boolean;
    analytics: boolean;
    reports: boolean;
  };
  users: Permission;
  patients: Permission;
  doctors: Permission;
  appointments: Permission;
  income: Permission;
  expenses: Permission;
  contacts: Permission;
  settings: {
    access: boolean;
    configure: boolean;
  };
}

interface AdminDetails {
  notificationPreferences: { desktopNotifications: boolean; soundAlerts: boolean; appointmentNotifications: boolean; patientNotifications: boolean; treatmentNotifications: boolean; paymentNotifications: boolean; xrayNotifications: boolean; };
  role: string;
  name: string;
  email : string;
  contact : string;
  _id: string;
  permissions?: Permissions;
  isActive?: boolean;
  lastLogin?: string;
}

// Define the initial state for the basic plan
const initialState: AdminDetails = {
  role: "staff",
  contact: "",
  name: "",
  _id: "",
  email: "",
  permissions: {
    dashboard: { fullAccess: false, basicAccess: true, analytics: false, reports: false },
    users: { create: false, read: false, update: false, delete: false },
    patients: { create: true, read: true, update: true, delete: false },
    doctors: { create: false, read: true, update: false, delete: false },
    appointments: { create: true, read: true, update: true, delete: false },
    income: { create: true, read: true, update: true, delete: false },
    expenses: { create: true, read: true, update: true, delete: false },
    contacts: { create: true, read: true, update: true, delete: false },
    settings: { access: false, configure: false },
  },
  isActive: true,
  notificationPreferences: {
    desktopNotifications: false,
    soundAlerts: false,
    appointmentNotifications: false,
    patientNotifications: false,
    treatmentNotifications: false,
    paymentNotifications: false,
    xrayNotifications: false
  }
};

// Define the shape of the context
interface AdminContextType {
  adminDetails: AdminDetails;
  isLoading: boolean;
  fetchAdminDetails: () => Promise<void>;
  hasPermission: (entity: string, action: string) => boolean;
  isAdmin: () => boolean;
  isStaff: () => boolean;
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

  // Permission checking functions
  const hasPermission = (entity: string, action: string): boolean => {
    if (!adminDetails.permissions) return false;
    
    // Admin users have all permissions
    if (adminDetails.role === 'admin') return true;
    
    // Check specific permission
    const entityPermissions = adminDetails.permissions[entity as keyof Permissions];
    if (!entityPermissions) return false;
    
    // Handle dashboard permissions
    if (entity === 'dashboard') {
      const dashboardPerms = entityPermissions as Permissions['dashboard'];
      return dashboardPerms[action as keyof Permissions['dashboard']] || false;
    }
    
    // Handle settings permissions
    if (entity === 'settings') {
      const settingsPerms = entityPermissions as Permissions['settings'];
      return settingsPerms[action as keyof Permissions['settings']] || false;
    }
    
    // Handle CRUD permissions
    const crudPerms = entityPermissions as Permission;
    return crudPerms[action as keyof Permission] || false;
  };

  const isAdmin = (): boolean => {
    return adminDetails.role === 'admin';
  };

  const isStaff = (): boolean => {
    return adminDetails.role === 'staff';
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
        hasPermission,
        isAdmin,
        isStaff,
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
