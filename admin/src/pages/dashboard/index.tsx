import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import {
  Users,
  Calendar,
  DollarSign,
  Activity,
  User,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { crudRequest } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAdminContext } from "@/contexts/adminContext";
import { RecentTransactions } from "./RecentTransactions";
import { useTranslation } from "react-i18next";

interface DoctorAnalysis {
  _id: string;
  name: string;
  specialization?: string;
  image?: string;
  totalAppointments: number;
  completedAppointments: number;
  todayAppointments: number;
  performanceRate: number;
  patientsCount: number; // Add this
  treatmentsCompleted: number; // Add this
  revenue: number; // Add this
}

interface TreatmentDocument {
  fileName: string;
  fileUrl: string;
  uploadDate: Date;
}

interface RecentTreatment {
  patientName: string;
  treatment: string;
  date: Date;
  amount: number;
  documents?: TreatmentDocument[];
}

const Dashboard = () => {
  const { adminDetails } = useAdminContext();
  const { t } = useTranslation();

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await crudRequest("GET", "/user/dashboard");
        setDashboardData(response);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setDashboardData({
          overview: {
            totalPatients: 0,
            totalDoctors: 0,
            monthlyPatients: 0,
            todayAppointmentsCount: 0,
          },
          appointments: {
            today: [],
            upcoming: [],
          },
          analytics: {
            topTreatments: [],
            recentTreatments: [],
            financialAnalysis: {
              daily: 0,
              weekly: 0,
              monthly: 0,
              total: 0,
            },
            doctorAnalysis: [],
          },
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Safe access to nested properties
  const doctorAnalysis = dashboardData?.analytics?.doctorAnalysis || [];
  const appointments = dashboardData?.appointments || {};
  const overview = dashboardData?.overview || {};
  const analytics = dashboardData?.analytics || {};

  const renderOverviewCards = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <Card className="bg-dashboard1">
        <Link to="/patient">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.totalPatients")}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalPatients}</div>
            <p className="text-xs text-muted-foreground">
              +{overview.monthlyPatients} {t("dashboard.thisMonth")}
            </p>
          </CardContent>
        </Link>
      </Card>

      <Card className="bg-dashboard2">
        <Link to="/doctor">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.totalDoctors")}
            </CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalDoctors}</div>
          </CardContent>
        </Link>
      </Card>

      <Card className="bg-dashboard3">
        <Link to="/appointment">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.todayAppointments")}
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview.todayAppointmentsCount}
            </div>
          </CardContent>
        </Link>
      </Card>

      {adminDetails.role === "admin" && (
        <Card className="bg-dashboard4">
          <Link to="/revenue">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{analytics?.financialAnalysis?.total || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                ₹{analytics?.financialAnalysis?.monthly || 0} this month
              </p>
            </CardContent>
          </Link>
        </Card>
      )}

      <Card className="bg-dashboard8">
        <Link to="/appointment">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Appointment Status
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Pending</span>
                <span className="font-medium">
                  {overview.appointmentStats?.pending || 0}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Accepted</span>
                <span className="font-medium text-green-600">
                  {overview.appointmentStats?.accepted || 0}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Rejected</span>
                <span className="font-medium text-red-600">
                  {overview.appointmentStats?.rejected || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Link>
      </Card>
    </div>
  );

  const renderDoctorCards = () => {
    if (!doctorAnalysis.length) {
      return (
        <div className="col-span-full text-center py-4 text-muted-foreground">
          {t("dashboard.noDoctorData")}
        </div>
      );
    }

    return doctorAnalysis.map((doctor: DoctorAnalysis) => (
      <Card
        key={doctor._id}
        className="overflow-hidden hover:shadow-md transition-shadow"
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2 bg-muted/20">
          <div className="flex items-center space-x-2">
            <Avatar className="h-10 w-10 bg-primary/10">
              <User className="h-5 w-5" />
            </Avatar>
            <div>
              <CardTitle className="text-md font-medium">
                Dr. {doctor.name || t("dashboard.unknown")}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {doctor.specialization || t("dashboard.generalDentist")}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col p-3 rounded-lg bg-muted/10">
                <span className="text-xs text-muted-foreground mb-1">
                  {t("dashboard.patients")}
                </span>
                <span className="text-xl font-semibold">
                  {doctor.patientsCount || 0}
                </span>
              </div>
              <div className="flex flex-col p-3 rounded-lg bg-muted/10">
                <span className="text-xs text-muted-foreground mb-1">
                  {t("dashboard.treatmentsDone")}
                </span>
                <span className="text-xl font-semibold">
                  {doctor.treatmentsCompleted || 0}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t("dashboard.performance")}
                </span>
                <span className="text-sm font-medium">
                  {(doctor.performanceRate || 0).toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={doctor.performanceRate} 
                className={`h-2 ${
                  doctor.performanceRate > 75
                    ? "bg-green-500"
                    : doctor.performanceRate > 50
                    ? "bg-amber-500"
                    : "bg-red-500"
                }`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="border rounded-md p-2 text-center">
                <p className="text-xs text-muted-foreground mb-1">
                  {t("dashboard.appointmentsCompleted")}
                </p>
                <p className="font-medium">
                  {doctor.completedAppointments || 0}/{doctor.totalAppointments || 0}
                </p>
              </div>
              <div className="border rounded-md p-2 text-center">
                <p className="text-xs text-muted-foreground mb-1">
                  {t("dashboard.avgTreatmentsPerPatient")}
                </p>
                <p className="font-medium">
                  {doctor.patientsCount ? (doctor.treatmentsCompleted / doctor.patientsCount).toFixed(1) : 0}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-border">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {t("dashboard.todayAppointments")}
                </span>
                <Badge
                  variant={doctor.todayAppointments > 0 ? "default" : "outline"}
                >
                  {doctor.todayAppointments}
                </Badge>
              </div>

              {doctor.revenue > 0 && adminDetails.role === "admin" && (
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-muted-foreground">
                    {t("dashboard.revenue")}
                  </span>
                  <span className="text-sm font-medium text-green-600">
                    ₹{doctor.revenue?.toLocaleString("en-IN") || 0}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    ));
  };

  const renderTreatmentDocuments = () => (
    <Card>
      <CardHeader>
        <CardTitle>Recent Treatment Documents</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          {!analytics.recentTreatments ||
          analytics.recentTreatments.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No recent documents available
            </div>
          ) : (
            analytics.recentTreatments.map(
              (treatment: RecentTreatment, treatmentIndex: number) => (
                <div key={treatmentIndex}>
                  {treatment.documents && treatment.documents.length > 0 ? (
                    treatment.documents.map(
                      (doc: TreatmentDocument, idx: number) => (
                        <div
                          key={`${treatmentIndex}-${idx}`}
                          className="flex items-center space-x-4 p-4 border-b last:border-0 hover:bg-muted/50"
                        >
                          <FileText className="h-4 w-4 text-blue-500" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {doc.fileName || "Unnamed Document"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Patient: {treatment.patientName} •{" "}
                              {treatment.date
                                ? format(
                                    new Date(treatment.date),
                                    "MMM d, yyyy"
                                  )
                                : "No date"}
                            </p>
                          </div>
                          {doc.fileUrl && (
                            <Button variant="outline" size="sm" asChild>
                              <a
                                href={doc.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                View
                              </a>
                            </Button>
                          )}
                        </div>
                      )
                    )
                  ) : (
                    <div className="text-center py-2 text-muted-foreground">
                      No documents for this treatment
                    </div>
                  )}
                </div>
              )
            )
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );

  const renderFinancialOverview = () => (
    <Card>
      <CardHeader>
        <CardTitle>Financial Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
          <div className="p-4 bg-muted/10 rounded-lg space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Daily Revenue
            </p>
            <p className="text-lg md:text-xl font-bold text-green-500">
              ₹
              {analytics?.financialAnalysis?.daily?.toLocaleString("en-IN") ||
                0}
            </p>
          </div>
          <div className="p-4 bg-muted/10 rounded-lg space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Weekly Revenue
            </p>
            <p className="text-lg md:text-xl font-bold text-green-500">
              ₹
              {analytics?.financialAnalysis?.weekly?.toLocaleString("en-IN") ||
                0}
            </p>
          </div>
          <div className="p-4 bg-muted/10 rounded-lg space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Monthly Revenue
            </p>
            <p className="text-lg md:text-xl font-bold text-green-500">
              ₹
              {analytics?.financialAnalysis?.monthly?.toLocaleString("en-IN") ||
                0}
            </p>
          </div>
          <div className="p-4 bg-muted/10 rounded-lg space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </p>
            <p className="text-lg md:text-xl font-bold text-green-500">
              ₹
              {analytics?.financialAnalysis?.total?.toLocaleString("en-IN") ||
                0}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderRecentTreatments = () => (
    <Card>
      <CardHeader>
        <CardTitle>Recent Treatments</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          {analytics.recentTreatments?.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No recent treatments available
            </div>
          ) : (
            analytics.recentTreatments?.map(
              (treatment: RecentTreatment, index: number) => (
                <div
                  key={index}
                  className="flex items-center space-x-4 p-4 border-b last:border-0 hover:bg-muted/50"
                >
                  <Activity className="h-4 w-4 text-blue-500" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">
                      {treatment.patientName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {treatment.treatment}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      ₹{treatment.amount?.toLocaleString("en-IN")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(treatment.date), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
              )
            )
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );

  const renderAppointments = () => (
    <Card>
      <CardHeader>
        <CardTitle>Today's Appointments</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          {appointments.today?.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No appointments scheduled for today
            </div>
          ) : (
            appointments.today?.map((apt: any) => (
              <div
                key={apt._id}
                className="flex items-center space-x-4 p-4 border-b last:border-0 hover:bg-muted/50"
              >
                <CheckCircle2
                  className={cn(
                    "h-4 w-4",
                    apt.hasVisited ? "text-green-500" : "text-yellow-500"
                  )}
                />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">
                    {apt.firstName} {apt.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    with Dr. {apt?.doctor?.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{apt.subject}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {format(
                      new Date(`${apt.appointmentDate} ${apt.appointmentTime}`),
                      "hh:mm a"
                    )}
                  </p>
                  <Badge variant={apt.hasVisited ? "default" : "secondary"}>
                    {apt.hasVisited ? "Completed" : "Pending"}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          {t("dashboard.title")}
        </h2>
      </div>

      {renderOverviewCards()}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            {t("dashboard.tabs.overview")}
          </TabsTrigger>
          <TabsTrigger value="analytics">
            {t("dashboard.tabs.analytics")}
          </TabsTrigger>
          <TabsTrigger value="appointments">
            {t("dashboard.tabs.appointments")}
          </TabsTrigger>
          <TabsTrigger value="doctors">
            {t("dashboard.tabs.doctors")}
          </TabsTrigger>
          <TabsTrigger value="transactions">
            {t("dashboard.tabs.transactions")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {renderTreatmentDocuments()}
            {adminDetails.role === "admin" && renderFinancialOverview()}
          </div>
        </TabsContent>
        <TabsContent value="analytics">
          <div className="space-y-4">
            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle>Doctor Performance</CardTitle>
                <Link to="/doctor" className="text-sm text-primary hover:underline">
                  View All Doctors
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {doctorAnalysis.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      {t('dashboard.noDoctorData')}
                    </div>
                  ) : (
                    doctorAnalysis.map((doctor: DoctorAnalysis) => (
                      <div key={doctor._id} className="space-y-3 pb-5 border-b last:border-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Avatar>
                              <User className="h-4 w-4" />
                            </Avatar>
                            <div>
                              <span className="font-medium">Dr. {doctor.name}</span>
                              <p className="text-xs text-muted-foreground">
                                {doctor.specialization || t('dashboard.generalDentist')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-medium">
                              {doctor.completedAppointments} / {doctor.totalAppointments}
                            </span>
                            <p className="text-xs text-muted-foreground">{t('dashboard.appointmentsCompleted')}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-2 my-2">
                          <div className="p-2 bg-muted/10 rounded text-center">
                            <p className="text-xs text-muted-foreground">{t('dashboard.patients')}</p>
                            <p className="text-lg font-semibold">{doctor.patientsCount || 0}</p>
                          </div>
                          <div className="p-2 bg-muted/10 rounded text-center">
                            <p className="text-xs text-muted-foreground">{t('dashboard.treatmentsDone')}</p>
                            <p className="text-lg font-semibold">{doctor.treatmentsCompleted || 0}</p>
                          </div>
                          <div className="p-2 bg-muted/10 rounded text-center">
                            <p className="text-xs text-muted-foreground">{t('dashboard.avgPerPatient')}</p>
                            <p className="text-lg font-semibold">
                              {doctor.patientsCount ? (doctor.treatmentsCompleted / doctor.patientsCount).toFixed(1) : "0"}
                            </p>
                          </div>
                          {adminDetails.role === "admin" && (
                            <div className="p-2 bg-muted/10 rounded text-center">
                              <p className="text-xs text-muted-foreground">{t('dashboard.revenue')}</p>
                              <p className="text-lg font-semibold text-green-600">
                                ₹{doctor.revenue?.toLocaleString("en-IN") || 0}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              {t('dashboard.performance')}
                            </span>
                            <span className="text-sm font-medium">
                              {(doctor.performanceRate || 0).toFixed(1)}%
                            </span>
                          </div>
                          <Progress 
                            value={doctor.performanceRate} 
                            className={`h-2 ${
                              doctor.performanceRate > 75 ? "bg-green-500" : 
                              doctor.performanceRate > 50 ? "bg-amber-500" : "bg-red-500"
                            }`}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* You can add more analytics cards here */}
          </div>
        </TabsContent>

        <TabsContent value="appointments">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {renderAppointments()}

            {adminDetails.role === "admin" && renderRecentTreatments()}
          </div>
        </TabsContent>

        <TabsContent value="doctors" className="space-y-4">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {renderDoctorCards()}
          </div>
        </TabsContent>
        <TabsContent value="transactions" className="space-y-4">
          <RecentTransactions />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
