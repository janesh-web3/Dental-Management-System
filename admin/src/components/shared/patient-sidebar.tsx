"use client";
import DashboardNav from "@/components/shared/dashboard-nav";
import { patientNavItems } from "@/constants/patientNavData";
import { useSidebar } from "@/hooks/use-sidebar";
import { cn } from "@/lib/utils";
import { ChevronsLeft, User } from "lucide-react";
import { useState, useEffect } from "react";
import { usePatientAuthContext } from "@/contexts/patientAuthContext";

type PatientSidebarProps = {
  className?: string;
};

export default function PatientSidebar({ className }: PatientSidebarProps) {
  const { isMinimized, toggle } = useSidebar();
  const [status, setStatus] = useState(false);
  const { patientDetails, isAuthenticated } = usePatientAuthContext();
  const [mounted, setMounted] = useState(false);

  // Use useEffect to handle client-side rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggle = () => {
    setStatus(true);
    toggle();
    setTimeout(() => setStatus(false), 500);
  };

  return (
    <nav
      className={cn(
        `relative z-10 hidden h-screen flex-none px-3 md:block`,
        status && "duration-500",
        !isMinimized ? "w-60" : "w-[80px]",
        className
      )}
    >
      <div
        className={cn(
          "flex items-center px-0 py-5 md:px-2",
          isMinimized ? "justify-center " : "justify-between"
        )}
      >
        {!isMinimized && (
          <div className="flex flex-col">
            <span className="text-lg font-bold">Dental Clinic</span>
            <span className="text-sm text-muted-foreground">Patient Portal</span>
          </div>
        )}
        <ChevronsLeft
          className={cn(
            "size-8 cursor-pointer rounded-full border bg-background text-foreground",
            isMinimized && "rotate-180"
          )}
          onClick={handleToggle}
        />
      </div>
      
      {/* Patient info section */}
      {!isMinimized && mounted && isAuthenticated && (
        <div className="mb-4 p-3 border rounded-md bg-background">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="font-bold text-primary">
                {patientDetails?.name?.charAt(0) || <User className="h-5 w-5" />}
              </span>
            </div>
            <div className="overflow-hidden">
              <p className="font-medium text-sm truncate">{patientDetails?.name || "Patient"}</p>
              <p className="text-xs text-muted-foreground truncate">{patientDetails?.email || "Loading..."}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="py-4 space-y-4">
        <div className="px-2 py-2">
          <div className="mt-3 space-y-1">
            <DashboardNav items={patientNavItems} />
          </div>
        </div>
      </div>
    </nav>
  );
}
