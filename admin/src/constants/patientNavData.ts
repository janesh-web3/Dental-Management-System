import { NavItem } from "@/types";

export const patientNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/patient/dashboard",
    icon: "dashboard",
    label: "Dashboard",
    description: "Overview of your appointments, treatments, and bills"
  },
  {
    title: "Appointments",
    href: "/patient/appointments",
    icon: "calendar", // Using calendar icon for appointments
    label: "Appointments",
    description: "View and manage your dental appointments"
  },
  {
    title: "Treatments",
    href: "/patient/treatments",
    icon: "tooth", // Using tooth icon for treatments
    label: "Treatments",
    description: "View your treatment history and plans"
  },
  {
    title: "Prescriptions",
    href: "/patient/prescriptions",
    icon: "pill", // Using pill icon for prescriptions
    label: "Prescriptions",
    description: "View your medication prescriptions"
  },
  {
    title: "Bills",
    href: "/patient/bills",
    icon: "billing", // Using billing icon for bills
    label: "Bills",
    description: "View and pay your dental bills"
  },
  {
    title: "Messages",
    href: "/patient/messages",
    icon: "message", // Using message icon for messages
    label: "Messages",
    description: "View messages from your dentist and clinic"
  },
  {
    title: "Profile",
    href: "/patient/profile",
    icon: "profile",
    label: "Profile",
    description: "Manage your personal information"
  },
];
