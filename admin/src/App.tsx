import { AdminProvider, DoctorAuthProvider, DoctorProvider, PatientAuthProvider, SocketProvider } from "./contexts";
import AppProvider from "./providers";
import AppRouter from "./routes";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function App() {
  return (
    <AppProvider>
      <DoctorAuthProvider>
        <PatientAuthProvider>
          <AdminProvider>
            <DoctorProvider>
              <SocketProvider>
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
                <AppRouter />
              </SocketProvider>
            </DoctorProvider>
          </AdminProvider>
        </PatientAuthProvider>
      </DoctorAuthProvider>
    </AppProvider>
  );
}
