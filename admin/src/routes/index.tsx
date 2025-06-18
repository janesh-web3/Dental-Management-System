import React, { Suspense, lazy } from "react";
import { Navigate, Outlet, useRoutes } from "react-router-dom";
import PrivateRoute from "./PrivateRoute";
import PatientProtectedRoute from "./PatientProtectedRoute.tsx";
import AdminOrDoctorRoute from "./AdminOrDoctorRoute";

import Loading from "@/pages/not-found/loading";
import Doctor from "@/pages/doctor";
import Patient from "@/pages/patient";
import Appointment from "@/pages/appointment";
import User from "@/pages/user";
import Setting from "@/pages/setting";
import Dashboard from "@/pages/dashboard";
import Testimonials from "@/pages/testimonials";
import Contacts from "@/pages/contact";
import LandingPage from "@/pages/landing";
import TermsOfServicePage from "@/pages/legal/terms";
import PrivacyPolicyPage from "@/pages/legal/privacy";
import SMS from "@/pages/SMS";
import { ScanPatient } from "@/pages/patient/ScanPatient";

// Finance pages
import IncomePage from "@/pages/finance/income";
import ExpensePage from "@/pages/finance/expense";
import FinanceSummary from "@/pages/finance/summary";

// Lazy-loaded components
const DashboardLayout = lazy(
  () => import("@/components/layout/dashboard-layout")
);
const SignInPage = lazy(() => import("@/pages/auth/signin/modern-signin"));
const NotificationsPage = lazy(() => import("@/pages/notifications"));
const NotFound = lazy(() => import("@/pages/not-found"));

const AppRouter: React.FC = () => {
  const dashboardRoutes = [
    {
      path: "/",
      element: (
        <PrivateRoute>
          <DashboardLayout>
            <Suspense
              fallback={
                <div>
                  <Loading />
                </div>
              }
            >
              <Outlet />
            </Suspense>
          </DashboardLayout>
        </PrivateRoute>
      ),
      children: [
        { path: "/", element: <Dashboard />, index: true },
        { path: "/patients", element: <Patient /> },
        { path: "/scan-patient", element: <ScanPatient /> },
        { path: "/doctors", element: <Doctor /> },
        { path: "/appointment", element: <Appointment /> },
        { path: "/user", element: <User /> },
        { path: "/settings", element: <Setting /> },
        { path: "/testimonials", element: <Testimonials /> },
        { path: "/contacts", element: <Contacts /> },
        { path: "/sms", element: <SMS /> },
        { path: "/notifications", element: <NotificationsPage /> },
        // Finance routes
        { path: "/finance/income", element: <IncomePage /> },
        { path: "/finance/expense", element: <ExpensePage /> },
        { path: "/finance/summary", element: <FinanceSummary /> },
        // Standalone Income and Expense routes
        { path: "/income", element: <IncomePage /> },
        { path: "/expense", element: <ExpensePage /> },
      ],
    },
  ];

  // Import doctor pages and layout components
  const DoctorDashboard = lazy(() => import("@/pages/doctor-admin/dashboard.tsx"));
  const AppointmentDashboard = lazy(() => import("@/pages/doctor-admin/appointments.tsx"));
  const PatientsDashboard = lazy(() => import("@/pages/doctor-admin/patients.tsx"));
  const TreatmentsDashboard = lazy(() => import("@/pages/doctor-admin/treatments.tsx"));
  const PrescriptionsDashboard = lazy(() => import("@/pages/doctor-admin/prescriptions.tsx"));
  const BillingDashboard = lazy(() => import("@/pages/doctor-admin/billing.tsx"));
  const AnalyticsDashboard = lazy(() => import("@/pages/doctor-admin/analytics.tsx"));
  const NotificationsDashboard = lazy(() => import("@/pages/doctor-admin/notifications.tsx"));
  const DoctorLayout = lazy(() => import("@/components/layout/doctor-layout.tsx"));
  const ProfileDashboard = lazy(() => import("@/pages/doctor-admin/profile.tsx"));

  // Import patient pages and layout components
  const PatientDashboard = lazy(() => import("@/pages/patient-admin/dashboard.tsx"));
  const PatientAppointments = lazy(() => import("@/pages/patient-admin/appointments.tsx"));
  const PatientTreatments = lazy(() => import("@/pages/patient-admin/treatments.tsx"));
  const PatientBills = lazy(() => import("@/pages/patient-admin/bills.tsx"));
  const PatientProfile = lazy(() => import("@/pages/patient-admin/profile.tsx"));
  const PatientMessages = lazy(() => import("@/pages/patient-admin/messages.tsx"));
  const PatientLayout = lazy(() => import("@/components/layout/patient-layout.tsx"));
  const PatientPrescriptions = lazy(() => import("@/pages/patient-admin/prescriptions.tsx"));

  const doctorRoutes = [
    {
      path: "/doctor",
      element: (
        <AdminOrDoctorRoute>
          <Suspense fallback={<Loading />}>
            <DoctorLayout>
              <Outlet />
            </DoctorLayout>
          </Suspense>
        </AdminOrDoctorRoute>
      ),
      children: [
        // Redirect from /doctor to /doctor/dashboard
        { path: "", element: <Navigate to="/doctor/dashboard" replace /> },
        { 
          path: "dashboard", 
          element: <DoctorDashboard />
        },
        { 
          path: "patients", 
          element: <PatientsDashboard />
        },
        { 
          path: "appointments", 
          element: <AppointmentDashboard />
        },
        { 
          path: "treatments", 
          element: <TreatmentsDashboard />
        },
        { 
          path: "prescriptions", 
          element: <PrescriptionsDashboard />
        },
        { 
          path: "billing", 
          element: <BillingDashboard />
        },
        { 
          path: "analytics", 
          element: <AnalyticsDashboard />
        },
        { 
          path: "notifications", 
          element: <NotificationsDashboard />
        },
        { 
          path: "profile", 
          element: <ProfileDashboard /> 
        },
      ],
    },
  ];

  // Patient routes
  const patientRoutes = [
    {
      path: "/patient",
      element: (
        <PatientProtectedRoute>
          <Suspense fallback={<Loading />}>
            <PatientLayout>
              <Outlet />
            </PatientLayout>
          </Suspense>
        </PatientProtectedRoute>
      ),
      children: [
        // Redirect from /patient to /patient/dashboard
        { path: "", element: <Navigate to="/patient/dashboard" replace /> },
        { 
          path: "dashboard", 
          element: <PatientDashboard />
        },
        { 
          path: "appointments", 
          element: <PatientAppointments /> 
        },
        { 
          path: "treatments", 
          element: <PatientTreatments /> 
        },
        { 
          path: "prescriptions", 
          element: <PatientPrescriptions /> 
        },
        { 
          path: "bills", 
          element: <PatientBills /> 
        },
        { 
          path: "profile", 
          element: <PatientProfile /> 
        },
        { 
          path: "messages", 
          element: <PatientMessages /> 
        },
      ],
    },
  ];

  const publicRoutes = [
    { path: "/home", element: <LandingPage />, index: true },
    { path: "/login", element: <SignInPage /> },
    { path: "/terms", element: <TermsOfServicePage /> },
    { path: "/privacy", element: <PrivacyPolicyPage /> },
    { path: "/404", element: <NotFound /> },
    { path: "*", element: <Navigate to="/404" replace /> },
  ];

  const routes = useRoutes([...dashboardRoutes, ...doctorRoutes, ...patientRoutes, ...publicRoutes]);

  return routes;
};

export default AppRouter;
