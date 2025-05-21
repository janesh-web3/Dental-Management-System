import DashboardNav from '@/components/shared/dashboard-nav';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { doctorNavItems } from '@/constants/doctorNavData';
import { Dispatch, SetStateAction } from 'react';
import { useDoctorAuthContext } from '@/contexts/doctorAuthContext';

type DoctorMobileSidebarProps = {
  className?: string;
  setSidebarOpen: Dispatch<SetStateAction<boolean>>;
  sidebarOpen: boolean;
};

export default function DoctorMobileSidebar({
  setSidebarOpen,
  sidebarOpen
}: DoctorMobileSidebarProps) {
  const { doctorDetails } = useDoctorAuthContext();

  return (
    <>
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="bg-background !px-0">
          <div className="space-y-4 py-4">
            <div className="px-4 py-2">
              <div className="flex flex-col mb-6">
                <span className="text-lg font-bold">Dental Clinic</span>
                <span className="text-sm text-muted-foreground">Doctor Portal</span>
              </div>
              
              {/* Doctor info section */}
              <div className="mb-6 p-3 border rounded-md">
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
              
              <div className="space-y-1 px-2">
                <DashboardNav items={doctorNavItems} setOpen={setSidebarOpen} />
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
