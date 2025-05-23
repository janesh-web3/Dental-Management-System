import { useState } from "react";
import Header from "@/components/shared/header";
import { MenuIcon } from "lucide-react";
import DoctorSidebar from "@/components/shared/doctor-sidebar";
import DoctorMobileSidebar from "@/components/shared/doctor-mobile-sidebar";
import { SidebarProvider } from "@/hooks/use-sidebar";

interface DoctorLayoutProps {
  children: React.ReactNode;
}

export default function DoctorLayout({ children }: DoctorLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  return (
    <SidebarProvider userType="doctor">
      <div className="flex h-screen overflow-hidden bg-secondary">
        <div className="overflow-auto">
          <DoctorMobileSidebar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />
        </div>

        <DoctorSidebar />
        <div className="flex flex-col flex-1 w-0 overflow-auto">
          <div className="relative z-10 flex flex-shrink-0 h-12">
            <button
              className="pl-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 xl:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <MenuIcon className="w-6 h-6" aria-hidden="true" />
            </button>
            <Header />
          </div>
          <main className="relative flex-1 overflow-auto rounded-l-xl bg-background focus:outline-none">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
