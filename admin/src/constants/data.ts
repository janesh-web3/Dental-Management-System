import { NavItem } from "@/types";

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    title: "Overview",
    items: [
      {
        title: "Dashboard 1",
        href: "/",
        icon: "dashboard",
        label: "Dashboard",
        notificationEnabled: true,
      },
      {
        title: "Dashboard 2",
        href: "/advanced-dashboard",
        icon: "dashboard",
        label: "Dashboard 2",
        notificationEnabled: true,
      },
    ]
  },
  {
    title: "Management",
    items: [
      {
        title: "Patients",
        href: "/patients",
        icon: "user",
        label: "Patients",
        notificationEnabled: true,
      },
      {
        title: "Doctors",
        href: "/doctors",
        icon: "employee",
        label: "Doctors",
        notificationEnabled: true,
      },
      {
        title: "Appointments",
        href: "/appointment",
        icon: "kanban",
        label: "Appointments",
        notificationEnabled: true,
      },
      {
        title: "Calendar",
        href: "/calendar",
        icon: "calendar",
        label: "Calendar",
        notificationEnabled: true,
      },
    ]
  },
  {
    title: "Financial",
    items: [
      {
        title: "Income",
        href: "/income",
        icon: "arrowUp",
        label: "Income",
        notificationEnabled: true,
      },
      {
        title: "Expenses",
        href: "/expense",
        icon: "arrowDown",
        label: "Expenses",
        notificationEnabled: true,
      },
      {
        title: "Invoices",
        href: "/finance/invoices",
        icon: "receipt",
        label: "Invoices",
        notificationEnabled: true,
      },
    ]
  },
  {
    title: "Communication",
    items: [
      {
        title: "SMS",
        href: "/sms",
        icon: "message",
        label: "SMS",
        notificationEnabled: true,
      },
      {
        title: "Contacts",
        href: "/contacts",
        icon: "profile",
        label: "Contacts",
        notificationEnabled: true,
      },
      {
        title: "Testimonials",
        href: "/testimonials",
        icon: "kanban",
        label: "Testimonials",
        notificationEnabled: true,
      },
    ]
  },
  {
    title: "System",
    items: [
      {
        title: "Recycle Bin",
        href: "/recycle-bin",
        icon: "trash",
        label: "Recycle Bin",
        notificationEnabled: false,
      },
      {
        title: "Settings",
        href: "/settings",
        icon: "settings",
        label: "Settings",
        notificationEnabled: false,
      },
      
    ]
  }
];

// Keep the original navItems for backward compatibility
export const navItems: NavItem[] = navGroups.flatMap(group => group.items);

export const users = [
  {
    id: 1,
    name: "Candice Schiner",
    company: "Dell",
    role: "Frontend Developer",
    verified: false,
    status: "Active",
  },
  {
    id: 2,
    name: "John Doe",
    company: "TechCorp",
    role: "Backend Developer",
    verified: true,
    status: "Active",
  },
  {
    id: 3,
    name: "Alice Johnson",
    company: "WebTech",
    role: "UI Designer",
    verified: true,
    status: "Active",
  },
  {
    id: 4,
    name: "David Smith",
    company: "Innovate Inc.",
    role: "Fullstack Developer",
    verified: false,
    status: "Inactive",
  },
  {
    id: 5,
    name: "Emma Wilson",
    company: "TechGuru",
    role: "Product Manager",
    verified: true,
    status: "Active",
  },
  {
    id: 6,
    name: "James Brown",
    company: "CodeGenius",
    role: "QA Engineer",
    verified: false,
    status: "Active",
  },
  {
    id: 7,
    name: "Laura White",
    company: "SoftWorks",
    role: "UX Designer",
    verified: true,
    status: "Active",
  },
  {
    id: 8,
    name: "Michael Lee",
    company: "DevCraft",
    role: "DevOps Engineer",
    verified: false,
    status: "Active",
  },
  {
    id: 9,
    name: "Olivia Green",
    company: "WebSolutions",
    role: "Frontend Developer",
    verified: true,
    status: "Active",
  },
  {
    id: 10,
    name: "Robert Taylor",
    company: "DataTech",
    role: "Data Analyst",
    verified: false,
    status: "Active",
  },
];

export const dashboardCard = [
  {
    date: "Today",
    total: 2000,
    role: "Students",
    color: "bg-[#EC4D61] bg-opacity-40",
  },
  {
    date: "Today",
    total: 2000,
    role: "Teachers",
    color: "bg-[#FFEB95] bg-opacity-100",
  },
  {
    date: "Today",
    total: 2000,
    role: "Parents",
    color: "bg-[#84BD47] bg-opacity-30",
  },
  {
    date: "Today",
    total: 2000,
    role: "Schools",
    color: "bg-[#D289FF] bg-opacity-30",
  },
];

export type Employee = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  gender: string;
  date_of_birth: string; // Consider using a proper date type if possible
  street: string;
  city: string;
  state: string;
  country: string;
  zipcode: string;
  longitude?: number; // Optional field
  latitude?: number; // Optional field
  job: string;
  profile_picture?: string | null; // Profile picture can be a string (URL) or null (if no picture)
};
