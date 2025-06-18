import { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAdminContext } from './adminContext';
import { useDoctorAuthContext } from './doctorAuthContext';
import { usePatientAuthContext } from './patientAuthContext';
import { toast } from 'react-toastify';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  userRole: string | null;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  userRole: null,
});

export const useSocket = () => useContext(SocketContext);

const SOCKET_SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [_connectionAttempts, setConnectionAttempts] = useState(0);
  const MAX_RECONNECTION_ATTEMPTS = 5;
  
  // Get authentication tokens from various contexts
  const { adminDetails } = useAdminContext();
  const { doctorDetails, token: doctorToken } = useDoctorAuthContext();
  const { patientDetails, token: patientToken } = usePatientAuthContext();

  useEffect(() => {
    // Determine which token to use based on available contexts
    let authToken = null;
    
    if (adminDetails?._id) {
      // Admin is logged in - use admin token from session storage
      authToken = sessionStorage.getItem('adminToken');
      setUserRole(adminDetails.role || 'admin');
    } else if (doctorToken && doctorDetails?._id) {
      // Doctor is logged in
      authToken = doctorToken;
      setUserRole('doctor');
    } else if (patientToken && patientDetails?._id) {
      // Patient is logged in
      authToken = patientToken;
      setUserRole('patient');
    } else {
      // No authenticated user, set role to null
      setUserRole(null);
    }
    
    // Don't connect if no token is available
    if (!authToken) {
      console.log('No authentication token available for Socket.IO connection');
      return;
    }

    // Initialize socket connection with auth token
    const socketInstance = io(SOCKET_SERVER_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECTION_ATTEMPTS,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      auth: {
        token: authToken,
      },
    });

    // Set up event listeners
    socketInstance.on('connect', () => {
      console.log('Socket connected with ID:', socketInstance.id);
      setIsConnected(true);
      setConnectionAttempts(0); // Reset connection attempts on successful connection
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
      
      // Handle reconnection based on reason
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect
        socketInstance.connect();
      }
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
      
      // Increment connection attempts
      setConnectionAttempts(prev => {
        const newAttempts = prev + 1;
        if (newAttempts >= MAX_RECONNECTION_ATTEMPTS) {
          toast.error('Failed to connect to server after multiple attempts. Please refresh the page.');
        } else {
          toast.warning(`Connection attempt ${newAttempts}/${MAX_RECONNECTION_ATTEMPTS} failed. Retrying...`);
        }
        return newAttempts;
      });
    });
    
    // Role-specific socket event listeners
    if (userRole === 'doctor') {
      // Doctor-specific listeners
      socketInstance.on('appointment_notification', (data) => {
        toast.info(`New appointment: ${data.firstName} ${data.lastName}`);
      });
      
      socketInstance.on('treatment_updated', (data) => {
        toast.info(`Treatment updated: ${data.patientName || 'Unknown patient'}`);
      });
      
      socketInstance.on('xray_uploaded', (data) => {
        toast.info(`New X-Ray uploaded: ${data.patientName || 'Unknown patient'}`);
      });
    } else if (userRole === 'reception') {
      // Reception-specific listeners
      socketInstance.on('appointment_notification', (data) => {
        toast.info(`New appointment: ${data.firstName} ${data.lastName}`);
      });
      
      socketInstance.on('patient_notification', (data) => {
        toast.info(`New patient registered: ${data.personalDetails?.name || 'Unknown'}`);
      });
      
      socketInstance.on('payment_received', (data) => {
        toast.success(`Payment received: ${data.amount} for ${data.patientName || 'Unknown patient'}`);
      });
    } else if (userRole === 'admin') {
      // Admin sees all notifications
      socketInstance.on('appointment_notification', (data) => {
        toast.info(`New appointment: ${data.firstName} ${data.lastName}`);
      });
      
      socketInstance.on('patient_notification', (data) => {
        toast.info(`New patient registered: ${data.personalDetails?.name || 'Unknown'}`);
      });
      
      socketInstance.on('treatment_updated', (data) => {
        toast.info(`Treatment updated: ${data.patientName || 'Unknown patient'}`);
      });
      
      socketInstance.on('xray_uploaded', (data) => {
        toast.info(`New X-Ray uploaded: ${data.patientName || 'Unknown patient'}`);
      });
      
      socketInstance.on('payment_received', (data) => {
        toast.success(`Payment received: ${data.amount} for ${data.patientName || 'Unknown patient'}`);
      });
    }

    // Save the socket instance
    setSocket(socketInstance);

    // Clean up on unmount
    return () => {
      // Remove all listeners to prevent memory leaks
      socketInstance.off('appointment_notification');
      socketInstance.off('patient_notification');
      socketInstance.off('treatment_updated');
      socketInstance.off('xray_uploaded');
      socketInstance.off('payment_received');
      
      socketInstance.disconnect();
    };
  }, [adminDetails, doctorDetails, doctorToken, patientDetails, patientToken, userRole]);

  // Provide the socket instance to components
  return (
    <SocketContext.Provider value={{ socket, isConnected, userRole }}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider; 