import { NavItem } from "@/types";

export const doctorNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/doctor/dashboard",
    icon: "dashboard",
    label: "Dashboard",
  },
  {
    title: "Appointments",
    href: "/doctor/appointments",
    icon: "kanban", // Using kanban icon for appointments
    label: "Appointments",
  },
  {
    title: "Patients",
    href: "/doctor/patients",
    icon: "user",
    label: "Patients",
  },
  {
    title: "Prescriptions",
    href: "/doctor/prescriptions",
    icon: "post", // Using post icon for prescriptions
    label: "Prescriptions",
  },
  {
    title: "Treatments",
    href: "/doctor/treatments",
    icon: "media", // Using media icon for treatments
    label: "Treatments",
  },
  {
    title: "Analytics",
    href: "/doctor/analytics",
    icon: "arrowRight", // Temporarily using arrowRight icon for analytics until chart is properly configured
    label: "Analytics",
  },
  {
    title: "Notifications",
    href: "/doctor/notifications",
    icon: "bell", // Using bell icon for notifications
    label: "Notifications",
  },
  {
    title: "Billing",
    href: "/doctor/billing",
    icon: "billing", // Using billing icon for billing
    label: "Billing",
  },
  {
    title: "Profile",
    href: "/doctor/profile",
    icon: "profile",
    label: "Profile",
  },
];
