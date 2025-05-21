import { useState } from "react";
import Header from "@/components/shared/header";
import { MenuIcon } from "lucide-react";
import PatientSidebar from "@/components/shared/patient-sidebar";
import PatientMobileSidebar from "@/components/shared/patient-mobile-sidebar";

export default function PatientLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="relative z-20 flex flex-col flex-1">
        <PatientMobileSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
      </div>

      <PatientSidebar />
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
  );
}
