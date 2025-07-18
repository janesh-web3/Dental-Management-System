import { AdminProvider, DoctorAuthProvider, DoctorProvider, PatientAuthProvider, SocketProvider, NotificationProvider } from "./contexts";
import AppProvider from "./providers";
import AppRouter from "./routes";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { NotificationCenter } from "./components/notifications/NotificationCenter";
import { Toaster } from "./components/ui/toaster";
import { NotificationInitializer } from "./components/shared/NotificationInitializer";
import { VoiceInputProvider } from "./contexts/VoiceInputContext";
import { TooltipProvider } from "@/components/ui/tooltip";


export default function App() {
  return (
    <AppProvider>
      <DoctorAuthProvider>
        <PatientAuthProvider>
          <AdminProvider>
            <DoctorProvider>
              <NotificationProvider>
                <SocketProvider>
                  <VoiceInputProvider>
                    <NotificationInitializer />
                    <ToastContainer
                      position="top-right"
                      autoClose={3000}
                      hideProgressBar={false}
                      newestOnTop={true}
                      closeOnClick
                      rtl={false}
                      pauseOnFocusLoss
                      draggable
                      pauseOnHover
                      theme="light"
                    />
                    <TooltipProvider>
                      <AppRouter />
                      <NotificationCenter />
                      <Toaster />
                      {/* <AuthDebugger /> */}
                    </TooltipProvider>
                  </VoiceInputProvider>
                </SocketProvider>
              </NotificationProvider>
            </DoctorProvider>
          </AdminProvider>
        </PatientAuthProvider>
      </DoctorAuthProvider>
    </AppProvider>
  );
}

