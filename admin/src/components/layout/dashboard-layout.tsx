import { useState } from "react";
import Sidebar from "../shared/sidebar";
import Header from "../shared/header";
import MobileSidebar from "../shared/mobile-sidebar";
import { MenuIcon } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  return (
    <div className="flex h-screen overflow-hidden bg-secondary">
      <div className="overflow-auto">
        <MobileSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
      </div>

      <Sidebar />
      <div className="flex flex-col flex-1 w-0 overflow-auto">
        <div className="relative z-10 flex flex-shrink-0 h-12 ">
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
