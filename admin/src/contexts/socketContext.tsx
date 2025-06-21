import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useRef,
  useState,
  ReactNode,
} from "react";
import { io, type Socket } from "socket.io-client";
import { useAdminContext } from "./adminContext";
import { useDoctorAuthContext } from "./doctorAuthContext";
import { usePatientAuthContext } from "./patientAuthContext";
import { useNotifications } from "./NotificationContext";
import { toast } from "react-toastify";
import { socket } from "@/server";

// Types for socket events
interface PatientEvent {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  timestamp: Date;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connectionAttempts: number;
  userRole: string | null;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  connectionAttempts: 0,
  userRole: null,
});

export const useSocket = () => useContext(SocketContext);

const SOCKET_SERVER_URL = socket;
const MAX_RECONNECTION_ATTEMPTS = 5;

interface SocketProviderProps {
  children: ReactNode;
}

const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  // State
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Refs
  const socketRef = useRef<Socket | null>(null);

  // Hooks
  const { addNotification } = useNotifications();
  const { adminDetails } = useAdminContext();
  const { doctorDetails, token: doctorToken } = useDoctorAuthContext();
  const { patientDetails, token: patientToken } = usePatientAuthContext();

  // Get current user role
  const getCurrentRole = useCallback((): string => {
    if (adminDetails?._id) return "admin";
    if (doctorDetails?._id) return "doctor";
    if (patientDetails?._id) return "patient";
    return "";
  }, [adminDetails, doctorDetails, patientDetails]);

  // Set up socket connection and event handlers
  useEffect(() => {
    const role = getCurrentRole();
    setUserRole(role);

    // Only proceed if we have a valid role
    if (!role) return;

    // Get the appropriate auth token
    let authToken = "";
    if (adminDetails?._id) {
      authToken = sessionStorage.getItem("token") || "";
    } else if (doctorToken) {
      authToken = doctorToken;
    } else if (patientToken) {
      authToken = patientToken;
    }

    // Disconnect existing socket if any
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    // Only connect if we have a token
    if (!authToken) return;

    console.log("Initializing socket connection with role:", role);

    const socketInstance = io(SOCKET_SERVER_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECTION_ATTEMPTS,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      auth: { token: authToken },
      autoConnect: true,
    });

    socketRef.current = socketInstance;
    setSocket(socketInstance);

    // Connection event handler
    const onConnect = () => {
      console.log("Socket connected with ID:", socketInstance.id);
      setIsConnected(true);
      setConnectionAttempts(0);

      // Join role-based rooms for admin and superadmin
      if (["admin", "superadmin", "doctor", "patient"].includes(role)) {
        console.log(`Joining rooms for role: ${role}`);
        socketInstance.emit("joinRoleRoom", role);
      }

      // Join user-specific channel for personal notifications
      if (role === "admin" && adminDetails?._id) {
        console.log(`Joining user channel for admin: ${adminDetails._id}`);
        socketInstance.emit("joinUserChannel", {
          userId: adminDetails._id,
          userType: "User",
        });
      } else if (role === "doctor" && doctorDetails?._id) {
        console.log(`Joining user channel for doctor: ${doctorDetails._id}`);
        socketInstance.emit("joinUserChannel", {
          userId: doctorDetails._id,
          userType: "Doctor",
        });
      } else if (role === "patient" && patientDetails?._id) {
        console.log(`Joining user channel for patient: ${patientDetails._id}`);
        socketInstance.emit("joinUserChannel", {
          userId: patientDetails._id,
          userType: "Patient",
        });
      }

      // Join user-specific channel based on user type
      if (role === "admin" && adminDetails?._id) {
        socketInstance.emit("joinUserChannel", {
          userId: adminDetails._id,
          userType: "User",
        });
        console.log(`Joined user channel for admin: User:${adminDetails._id}`);
      } else if (role === "doctor" && doctorDetails?._id) {
        socketInstance.emit("joinUserChannel", {
          userId: doctorDetails._id,
          userType: "Doctor",
        });
        console.log(
          `Joined user channel for doctor: Doctor:${doctorDetails._id}`
        );
      } else if (role === "patient" && patientDetails?._id) {
        socketInstance.emit("joinUserChannel", {
          userId: patientDetails._id,
          userType: "Patient",
        });
        console.log(
          `Joined user channel for patient: Patient:${patientDetails._id}`
        );
      }
    };

    // Disconnect handler
    const onDisconnect = (reason: string) => {
      console.log("Socket disconnected:", reason);
      setIsConnected(false);

      // Handle reconnection based on reason
      if (reason === "io server disconnect") {
        console.log("Server disconnected, attempting to reconnect...");
        socketInstance.connect();
      }
    };

    // Connection error handler
    const onConnectError = (error: Error) => {
      console.error("Socket connection error:", error);
      setIsConnected(false);

      // Increment connection attempts counter
      setConnectionAttempts((prev) => {
        const newAttempts = prev + 1;

        // Show toast notification on connection error
        if (newAttempts >= MAX_RECONNECTION_ATTEMPTS) {
          toast.error(
            "Failed to connect to the server. Please check your internet connection and refresh the page."
          );
        } else {
          toast.warning(
            `Connection attempt ${newAttempts}/${MAX_RECONNECTION_ATTEMPTS}...`
          );
        }

        return newAttempts;
      });
    };

    // Patient event handlers
    const handlePatientAdded = (data: PatientEvent) => {
      console.log("New patient added:", data);
      addNotification({
        type: "success",
        title: "New Patient Added",
        message: `${data.name} has been added to the system`,
        autoClose: 5000,
      });
    };

    // Set up event listeners
    socketInstance.on("connect", onConnect);
    socketInstance.on("disconnect", onDisconnect);
    socketInstance.on("connect_error", onConnectError);
    socketInstance.on("patient:added", handlePatientAdded);

    // Cleanup function
    return () => {
      console.log("Cleaning up socket connection");
      socketInstance.off("connect", onConnect);
      socketInstance.off("disconnect", onDisconnect);
      socketInstance.off("connect_error", onConnectError);
      socketInstance.off("patient:added");
      socketInstance.disconnect();
    };
  }, [
    adminDetails,
    doctorToken,
    doctorDetails,
    patientToken,
    patientDetails,
    addNotification,
    getCurrentRole,
  ]);

  // Context value
  const contextValue = {
    socket,
    isConnected,
    connectionAttempts,
    userRole,
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;
