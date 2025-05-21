import { NavItem } from "@/types";

export const patientNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/patient/dashboard",
    icon: "dashboard",
    label: "Dashboard",
  },
  {
    title: "Appointments",
    href: "/patient/appointments",
    icon: "kanban", // Using kanban icon for appointments
    label: "Appointments",
  },
  {
    title: "Treatments",
    href: "/patient/treatments",
    icon: "media", // Using media icon for treatments
    label: "Treatments",
  },
  {
    title: "Bills",
    href: "/patient/bills",
    icon: "billing", // Using billing icon for bills
    label: "Bills",
  },
  {
    title: "Profile",
    href: "/patient/profile",
    icon: "profile",
    label: "Profile",
  },
];
