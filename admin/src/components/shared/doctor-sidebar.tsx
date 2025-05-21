"use client";
import DashboardNav from "@/components/shared/dashboard-nav";
import { doctorNavItems } from "@/constants/doctorNavData";
import { useSidebar } from "@/hooks/use-sidebar";
import { cn } from "@/lib/utils";
import { ChevronsLeft } from "lucide-react";
import { useState } from "react";
import { useDoctorAuthContext } from "@/contexts/doctorAuthContext";

type DoctorSidebarProps = {
  className?: string;
};

export default function DoctorSidebar({ className }: DoctorSidebarProps) {
  const { isMinimized, toggle } = useSidebar();
  const [status, setStatus] = useState(false);
  const { doctorDetails } = useDoctorAuthContext();

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
            <span className="text-sm text-muted-foreground">Doctor Portal</span>
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
      
      {/* Doctor info section */}
      {!isMinimized && (
        <div className="mb-4 p-3 border rounded-md bg-background">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="font-bold text-primary">
                {doctorDetails.name?.charAt(0) || "D"}
              </span>
            </div>
            <div>
              <p className="font-medium text-sm">{doctorDetails.name}</p>
              <p className="text-xs text-muted-foreground">{doctorDetails.specialization || "Dentist"}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="py-4 space-y-4">
        <div className="px-2 py-2">
          <div className="mt-3 space-y-1">
            <DashboardNav items={doctorNavItems} />
          </div>
        </div>
      </div>
    </nav>
  );
}
