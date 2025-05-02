import AdminProvider from "./contexts/adminContext";
import { DoctorProvider } from "./contexts/DoctorContext";
import AppProvider from "./providers";
import AppRouter from "./routes";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
export default function App() {
  return (
    <AppProvider>
      <DoctorProvider>
        <AdminProvider>
          <ToastContainer
            position="top-right"
            autoClose={2000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="dark"
          />
          <AppRouter />
        </AdminProvider>
      </DoctorProvider>
    </AppProvider>
  );
}
