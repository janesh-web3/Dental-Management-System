import DashboardNav from '@/components/shared/dashboard-nav';
import { patientNavItems } from '@/constants/patientNavData';
import { usePatientAuthContext } from '@/contexts/patientAuthContext';
import { cn } from '@/lib/utils';

export default function PatientSidebar({ className }) {
  const { patientDetails } = usePatientAuthContext();

  return (
    <div className={cn("pb-12 hidden xl:block", className)}>
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
    </div>
  );
}
