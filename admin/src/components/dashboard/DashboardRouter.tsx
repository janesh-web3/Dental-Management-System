import { useAdminContext } from "@/contexts/adminContext";
import AdminDashboard from "./AdminDashboard";
import StaffDashboard from "./StaffDashboard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

const DashboardRouter = () => {
  const { t } = useTranslation();
  const { adminDetails, isLoading, isAdmin, isStaff } = useAdminContext();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">{t("Loading dashboard...")}</p>
        </div>
      </div>
    );
  }

  // Show error state if user data is not available
  if (!adminDetails || !adminDetails.role) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t("Unable to load user information. Please try refreshing the page or contact support.")}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show inactive account message
  if (adminDetails.isActive === false) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t("Your account has been deactivated. Please contact your administrator for assistance.")}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Route to appropriate dashboard based on role
  if (isAdmin()) {
    return <AdminDashboard />;
  } else if (isStaff()) {
    return <StaffDashboard />;
  } else {
    // Handle other roles (dentist, doctor, reception)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t("Dashboard not available for your role: {{role}}. Please contact your administrator.", { role: adminDetails.role })}
          </AlertDescription>
        </Alert>
      </div>
    );
  }
};

export default DashboardRouter;