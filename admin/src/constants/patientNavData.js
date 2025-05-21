import {
  LayoutDashboard,
  CalendarClock,
  Stethoscope,
  Receipt,
  UserCircle,
} from "lucide-react";

export const patientNavItems = [
  {
    title: "Dashboard",
    href: "/patient/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
  },
  {
    title: "Appointments",
    href: "/patient/appointments",
    icon: CalendarClock,
    label: "Appointments",
  },
  {
    title: "Treatments",
    href: "/patient/treatments",
    icon: Stethoscope,
    label: "Treatments",
  },
  {
    title: "Bills",
    href: "/patient/bills",
    icon: Receipt,
    label: "Bills",
  },
  {
    title: "Profile",
    href: "/patient/profile",
    icon: UserCircle,
    label: "Profile",
  },
];
