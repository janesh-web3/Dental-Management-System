import DashboardNav from '@/components/shared/dashboard-nav';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { patientNavItems } from '@/constants/patientNavData';
import { Dispatch, SetStateAction, useState, useEffect } from 'react';
import { usePatientAuthContext } from '@/contexts/patientAuthContext';
import { User } from 'lucide-react';

type PatientMobileSidebarProps = {
  className?: string;
  setSidebarOpen: Dispatch<SetStateAction<boolean>>;
  sidebarOpen: boolean;
};

export default function PatientMobileSidebar({
  setSidebarOpen,
  sidebarOpen
}: PatientMobileSidebarProps) {
  const { patientDetails, isAuthenticated } = usePatientAuthContext();
  const [mounted, setMounted] = useState(false);
  
  // Use useEffect to handle client-side rendering
  useEffect(() => {
    setMounted(true);
  }, []);
  return (
    <>
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="bg-background !px-0">
          <div className="space-y-4 py-4">
            <div className="px-4 py-2">
              <div className="flex flex-col mb-6">
                <span className="text-lg font-bold">Dental Clinic</span>
                <span className="text-sm text-muted-foreground">Patient Portal</span>
              </div>
              
              {/* Patient info section */}
              {mounted && isAuthenticated && (
                <div className="mb-6 p-3 border rounded-md">
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
              
              <div className="space-y-1 px-2">
                <DashboardNav items={patientNavItems} setOpen={setSidebarOpen} />
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
