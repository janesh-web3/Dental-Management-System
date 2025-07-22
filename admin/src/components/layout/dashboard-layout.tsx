import { useState } from "react";
import EnhancedSidebar from "../shared/enhanced-sidebar";
import EnhancedMobileSidebar from "../shared/enhanced-mobile-sidebar";
import Header from "../shared/header";
import { Button } from "../ui/button";
import { MenuIcon } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  return (
    <div className="flex h-screen overflow-hidden bg-secondary/20">
      {/* Mobile Sidebar */}
      <EnhancedMobileSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Desktop Sidebar */}
      <EnhancedSidebar />
      
      {/* Main Content */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 border-b md:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
            className="h-9 w-9 p-0"
          >
            <MenuIcon className="h-5 w-5" />
            <span className="sr-only">Open sidebar</span>
          </Button>
          
          <div className="flex items-center gap-2">
            <img 
              src="/logoT.png" 
              alt="DMS" 
              className="h-6 w-6 brightness-125" 
            />
            <span className="text-sm font-semibold">DMS</span>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:block">
          <Header />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto bg-background">
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
