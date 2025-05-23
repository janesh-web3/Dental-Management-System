import { useState, useEffect } from "react";
import { usePatientAuthContext } from "@/contexts/patientAuthContext";
import { Menu, Bell, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/ui/icons";
import { patientNavItems } from "@/constants/patientNavData";
import { useTheme } from "@/providers/theme-provider";

interface PatientLayoutProps {
  children: React.ReactNode;
}

export default function PatientLayout({ children }: PatientLayoutProps) {
  const { patientDetails, isAuthenticated, logout, fetchPatientDetails } = usePatientAuthContext();
  const [isMounted, setIsMounted] = useState(false);
  const navigate = useNavigate();
  
  // Fetch patient details on initial mount
  useEffect(() => {
    setIsMounted(true);
    if (!isAuthenticated) {
      fetchPatientDetails();
    }
  }, [fetchPatientDetails, isAuthenticated]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getInitials = (name: string) => {
    if (!name) return "P";
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  const { setTheme } = useTheme();
  
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[240px] sm:w-[300px]">
            <nav className="grid gap-2 text-lg font-medium">
              <div className="flex items-center gap-2 py-4">
                <Icons.tooth className="h-6 w-6 text-primary" />
                <span className="font-semibold">Dental Clinic</span>
              </div>
              <Separator className="my-2" />
              {patientNavItems.map((item) => {
                const Icon = Icons[item.icon || "arrowRight"];
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground",
                      window.location.pathname === item.href && "bg-muted text-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <Icons.tooth className="h-6 w-6 text-primary hidden md:block" />
          <span className="font-semibold hidden md:block">Dental Management System</span>
        </div>
        <div className="flex-1"></div>
        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Notifications */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-primary"></span>
                  <span className="sr-only">Notifications</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Notifications</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar>
                  <AvatarImage src="" alt={patientDetails?.name || "Patient"} />
                  <AvatarFallback>{getInitials(patientDetails?.name || "")}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{patientDetails?.name || "Patient"}</p>
                  <p className="text-xs leading-none text-muted-foreground">{patientDetails?.email || ""}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/patient/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/patient/appointments">Appointments</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      
      {/* Main content */}
      <div className="flex-1 flex">
        {/* Sidebar (desktop only) */}
        <aside className="hidden border-r bg-muted/40 md:block md:w-64 lg:w-72">
          <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
              <Link to="/patient/dashboard" className="flex items-center gap-2 font-semibold">
                <Icons.dashboard className="h-6 w-6" />
                <span>Patient Dashboard</span>
              </Link>
            </div>
            <nav className="grid gap-1 px-2 py-4">
              {patientNavItems.map((item) => {
                const Icon = Icons[item.icon || "arrowRight"];
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground",
                      window.location.pathname === item.href && "bg-muted text-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="mt-auto p-4">
              {isMounted && isAuthenticated && (
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <Avatar>
                    <AvatarFallback>{getInitials(patientDetails?.name || "")}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{patientDetails?.name || "Patient"}</span>
                    <span className="text-xs text-muted-foreground">{patientDetails?.contactNumber || ""}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>
        
        {/* Main content area */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
