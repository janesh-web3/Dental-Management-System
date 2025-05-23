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

// Lazy-loaded components
const DashboardLayout = lazy(
  () => import("@/components/layout/dashboard-layout")
);
const SignInPage = lazy(() => import("@/pages/auth/signin"));

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
        { path: "/doctors", element: <Doctor /> },
        { path: "/appointment", element: <Appointment /> },
        { path: "/user", element: <User /> },
        { path: "/settings", element: <Setting /> },
        { path: "/revenue", element: <h1>Revenue Details (Working...)</h1> },
        { path: "/testimonials", element: <Testimonials /> },
        { path: "/contacts", element: <Contacts /> },
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
  const DoctorLayout = lazy(() => import("@/components/layout/doctor-layout"));
  const ProfileDashboard = lazy(() => import("@/pages/doctor-admin/profile.tsx"));

  // Import patient pages and layout components
  const PatientDashboard = lazy(() => import("@/pages/patient-admin/dashboard"));
  const PatientAppointments = lazy(() => import("@/pages/patient-admin/appointments"));
  const PatientTreatments = lazy(() => import("@/pages/patient-admin/treatments"));
  const PatientBills = lazy(() => import("@/pages/patient-admin/bills"));
  const PatientProfile = lazy(() => import("@/pages/patient-admin/profile"));
  const PatientMessages = lazy(() => import("@/pages/patient-admin/messages"));
  const PatientLoginPage = lazy(() => import("@/pages/patient-admin/login"));
  const PatientLayout = lazy(() => import("@/components/layout/patient-layout"));

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
    { path: "/login", element: <SignInPage />, index: true },
    { path: "/doctor/login", element: <SignInPage /> },
    { path: "/patient/login", element: <PatientLoginPage /> },
    { path: "/404", element: <NotFound /> },
    { path: "*", element: <Navigate to="/404" replace /> },
  ];

  const routes = useRoutes([...dashboardRoutes, ...doctorRoutes, ...patientRoutes, ...publicRoutes]);

  return routes;
};

export default AppRouter;
