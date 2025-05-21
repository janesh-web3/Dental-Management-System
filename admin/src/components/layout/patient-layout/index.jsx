import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { usePatientAuthContext } from "@/contexts/patientAuthContext";
import {
  LayoutDashboard,
  Calendar,
  FileText,
  CreditCard,
  User,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const PatientLayout = ({ children }) => {
  const { patientDetails, logout } = usePatientAuthContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    {
      name: "Dashboard",
      href: "/patient/dashboard",
      icon: LayoutDashboard,
      current: location.pathname === "/patient/dashboard",
    },
    {
      name: "Appointments",
      href: "/patient/appointments",
      icon: Calendar,
      current: location.pathname === "/patient/appointments",
    },
    {
      name: "Treatments",
      href: "/patient/treatments",
      icon: FileText,
      current: location.pathname === "/patient/treatments",
    },
    {
      name: "Bills",
      href: "/patient/bills",
      icon: CreditCard,
      current: location.pathname === "/patient/bills",
    },
    {
      name: "Profile",
      href: "/patient/profile",
      icon: User,
      current: location.pathname === "/patient/profile",
    },
  ];

  const handleLogout = () => {
    logout();
    navigate("/patient/login");
  };

  // Get initials for avatar fallback
  const getInitials = (name) => {
    if (!name) return "P";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar for desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-white border-r">
          <div className="flex items-center flex-shrink-0 px-4">
            <img
              className="h-8 w-auto"
              src="/crown.jpg"
              alt="Crown Mantra Dental"
            />
            <span className="ml-2 text-xl font-semibold">Patient Portal</span>
          </div>
          <div className="mt-6 flex flex-col flex-1">
            <nav className="flex-1 px-2 pb-4 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    item.current
                      ? "bg-primary text-white"
                      : "text-gray-600 hover:bg-gray-100",
                    "group flex items-center px-2 py-2 text-sm font-medium rounded-md"
                  )}
                >
                  <item.icon
                    className={cn(
                      item.current
                        ? "text-white"
                        : "text-gray-400 group-hover:text-gray-500",
                      "mr-3 flex-shrink-0 h-5 w-5"
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              ))}
            </nav>
            <div className="p-4 border-t">
              <div className="flex items-center">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" alt={patientDetails.name} />
                  <AvatarFallback>
                    {getInitials(patientDetails.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">
                    {patientDetails.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {patientDetails.email}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full mt-4 flex items-center justify-center"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="md:hidden fixed inset-0 flex z-40">
        <div
          className={`fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity ${
            mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setMobileMenuOpen(false)}
        ></div>

        <div
          className={`relative flex-1 flex flex-col max-w-xs w-full bg-white transition ease-in-out duration-300 transform ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="sr-only">Close sidebar</span>
              <X className="h-6 w-6 text-white" aria-hidden="true" />
            </button>
          </div>

          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <img
                className="h-8 w-auto"
                src="/crown.jpg"
                alt="Crown Mantra Dental"
              />
              <span className="ml-2 text-xl font-semibold">Patient Portal</span>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    item.current
                      ? "bg-primary text-white"
                      : "text-gray-600 hover:bg-gray-100",
                    "group flex items-center px-2 py-2 text-base font-medium rounded-md"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon
                    className={cn(
                      item.current
                        ? "text-white"
                        : "text-gray-400 group-hover:text-gray-500",
                      "mr-4 flex-shrink-0 h-5 w-5"
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center">
              <Avatar className="h-10 w-10">
                <AvatarImage src="" alt={patientDetails.name} />
                <AvatarFallback>
                  {getInitials(patientDetails.name)}
                </AvatarFallback>
              </Avatar>
              <div className="ml-3">
                <p className="text-base font-medium text-gray-700">
                  {patientDetails.name}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {patientDetails.email}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full mt-4 flex items-center justify-center"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white border-b border-gray-200 md:hidden">
          <button
            type="button"
            className="px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary md:hidden"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="flex-1 flex justify-between px-4">
            <div className="flex-1 flex items-center">
              <h1 className="text-lg font-semibold">Patient Portal</h1>
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              <Avatar className="h-8 w-8">
                <AvatarImage src="" alt={patientDetails.name} />
                <AvatarFallback>
                  {getInitials(patientDetails.name)}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>

        <main className="flex-1 relative overflow-y-auto focus:outline-none bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
};

export default PatientLayout;
