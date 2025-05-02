import React, { Suspense, lazy } from "react";
import { Navigate, Outlet, useRoutes } from "react-router-dom";
import PrivateRoute from "./PrivateRoute";

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

  const publicRoutes = [
    { path: "/login", element: <SignInPage />, index: true },
    { path: "/404", element: <NotFound /> },
    { path: "*", element: <Navigate to="/404" replace /> },
  ];

  const routes = useRoutes([...dashboardRoutes, ...publicRoutes]);

  return routes;
};

export default AppRouter;
