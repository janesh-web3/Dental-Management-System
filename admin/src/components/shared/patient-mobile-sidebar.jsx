import DashboardNav from '@/components/shared/dashboard-nav';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { patientNavItems } from '@/constants/patientNavData';
import { Dispatch, SetStateAction } from 'react';
import { usePatientAuthContext } from '@/contexts/patientAuthContext';

const PatientMobileSidebar = ({
  open,
  setOpen,
}) => {
  const { patientDetails } = usePatientAuthContext();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="left" className="!px-0">
        <div className="space-y-4 py-4">
          <div className="px-3 py-2">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold tracking-tight">
                Patient Portal
              </h2>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-3">
              <div className="flex items-center gap-2">
                <div className="rounded-full w-8 h-8 bg-primary flex items-center justify-center text-white">
                  {patientDetails?.name?.charAt(0) || "P"}
                </div>
                <div>
                  <p className="text-sm font-medium leading-none">
                    {patientDetails?.name || "Patient"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {patientDetails?.email || "patient@example.com"}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="px-3 py-2">
            <DashboardNav items={patientNavItems} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PatientMobileSidebar;
