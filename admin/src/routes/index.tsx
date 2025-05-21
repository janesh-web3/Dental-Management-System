import React, { Suspense, lazy } from "react";
import { Navigate, Outlet, useRoutes } from "react-router-dom";
import PrivateRoute from "./PrivateRoute";
import DoctorProtectedRoute from "./DoctorProtectedRoute";

import Loading from "@/pages/not-found/loading";
import Doctor from "@/pages/doctor";
import Patient from "@/pages/patient";
import Appointment from "@/pages/appointment";
import User from "@/pages/user";
import Setting from "@/pages/setting";
import Dashboard from "@/pages/dashboard";
import Testimonials from "@/pages/testimonials";
import Contacts from "@/pages/contact";
import DoctorAdmin from "@/pages/doctor-admin";

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
        { path: "/patient", element: <Patient /> },
        { path: "/doctor", element: <Doctor /> },
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
  const DoctorDashboard = lazy(() => import("@/pages/doctor/dashboard"));
  const DoctorPatients = lazy(() => import("@/pages/doctor/patients"));
  const DoctorLayout = lazy(() => import("@/components/layout/doctor-layout"));

  const doctorRoutes = [
    {
      path: "/doctor",
      element: (
        <DoctorProtectedRoute>
          <Suspense fallback={<Loading />}>
            <DoctorLayout>
              <Outlet />
            </DoctorLayout>
          </Suspense>
        </DoctorProtectedRoute>
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
          element: <DoctorPatients /> 
        },
        { 
          path: "appointments", 
          element: <h1 className="p-6 text-2xl">Appointments Page (Coming Soon)</h1> 
        },
        { 
          path: "treatments", 
          element: <h1 className="p-6 text-2xl">Treatments Page (Coming Soon)</h1> 
        },
        { 
          path: "prescriptions", 
          element: <h1 className="p-6 text-2xl">Prescriptions Page (Coming Soon)</h1> 
        },
        { 
          path: "profile", 
          element: <h1 className="p-6 text-2xl">Doctor Profile Page (Coming Soon)</h1> 
        },
      ],
    },
  ];

  const publicRoutes = [
    { path: "/login", element: <SignInPage />, index: true },
    { path: "/doctor/login", element: <SignInPage /> },
    { path: "/404", element: <NotFound /> },
    { path: "*", element: <Navigate to="/404" replace /> },
  ];

  const routes = useRoutes([...dashboardRoutes, ...doctorRoutes, ...publicRoutes]);

  return routes;
};

export default AppRouter;
