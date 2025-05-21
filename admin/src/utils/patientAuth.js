import axios from "axios";
import { server } from "@/server";

// Mock patient data for simulated authentication
const MOCK_PATIENTS = [
  {
    _id: "p1",
    name: "John Doe",
    email: "patient@example.com",
    password: "password123",
    phoneNumber: "123-456-7890",
    address: "123 Main St, City",
    appointments: [
      { 
        _id: "a1", 
        date: "2025-06-01T10:00:00", 
        doctorName: "Dr. Smith", 
        status: "upcoming", 
        type: "Check-up" 
      },
      { 
        _id: "a2", 
        date: "2025-05-15T14:30:00", 
        doctorName: "Dr. Johnson", 
        status: "completed", 
        type: "Cleaning" 
      }
    ],
    treatments: [
      {
        _id: "t1",
        name: "Root Canal",
        doctorName: "Dr. Smith",
        startDate: "2025-05-10",
        status: "in-progress",
        description: "Treatment for infected tooth pulp"
      }
    ],
    bills: [
      {
        _id: "b1",
        invoiceNumber: "INV-2025-001",
        date: "2025-05-15",
        amount: 150.00,
        status: "paid",
        description: "Dental Cleaning"
      },
      {
        _id: "b2",
        invoiceNumber: "INV-2025-002",
        date: "2025-05-10",
        amount: 500.00,
        status: "pending",
        description: "Root Canal Treatment - Initial"
      }
    ]
  },
  {
    _id: "p2",
    name: "Jane Smith",
    email: "jane@example.com",
    password: "jane123",
    phoneNumber: "987-654-3210",
    address: "456 Oak Ave, Town",
    appointments: [],
    treatments: [],
    bills: []
  }
];

// Simulate patient login API
export const patientLogin = async (email, password) => {
  try {
    // In a real app, this would be an API call
    // return await axios.post(`${server}/api/patient/login`, { email, password });
    
    // Simulated API response
    const patient = MOCK_PATIENTS.find(
      (p) => p.email === email && p.password === password
    );

    if (patient) {
      // Create a mock token
      const token = `patient-token-${patient._id}-${Date.now()}`;
      
      // Remove sensitive data
      const { password, ...patientWithoutPassword } = patient;
      
      return {
        success: true,
        token,
        patient: patientWithoutPassword,
        message: "Login successful"
      };
    }
    
    return {
      success: false,
      message: "Invalid email or password"
    };
  } catch (error) {
    console.error("Patient login error:", error);
    return {
      success: false,
      message: "An error occurred during login"
    };
  }
};

// Simulate getting current patient from token
export const getCurrentPatient = async (token) => {
  try {
    // In a real app, this would be an API call with the token in headers
    // return await axios.get(`${server}/api/patient/me`, {
    //   headers: { Authorization: `Bearer ${token}` }
    // });
    
    // Simulated API response
    if (!token || !token.startsWith("patient-token-")) {
      return {
        success: false,
        message: "Invalid token"
      };
    }
    
    // Extract patient ID from token (in a real app, this would be done by verifying JWT)
    const patientIdMatch = token.match(/patient-token-(p\d+)-/);
    if (!patientIdMatch) {
      return {
        success: false,
        message: "Invalid token format"
      };
    }
    
    const patientId = patientIdMatch[1];
    const patient = MOCK_PATIENTS.find(p => p._id === patientId);
    
    if (!patient) {
      return {
        success: false,
        message: "Patient not found"
      };
    }
    
    // Remove sensitive data
    const { password, ...patientWithoutPassword } = patient;
    
    return {
      success: true,
      patient: patientWithoutPassword
    };
  } catch (error) {
    console.error("Get current patient error:", error);
    return {
      success: false,
      message: "Failed to fetch patient details"
    };
  }
};

// Get patient appointments
export const getPatientAppointments = async (patientId) => {
  try {
    // In a real app, this would be an API call
    // return await axios.get(`${server}/api/patient/${patientId}/appointments`);
    
    // Simulated API response
    const patient = MOCK_PATIENTS.find(p => p._id === patientId);
    
    if (!patient) {
      return {
        success: false,
        message: "Patient not found"
      };
    }
    
    return {
      success: true,
      appointments: patient.appointments || []
    };
  } catch (error) {
    console.error("Get patient appointments error:", error);
    return {
      success: false,
      message: "Failed to fetch appointments"
    };
  }
};

// Get patient treatments
export const getPatientTreatments = async (patientId) => {
  try {
    // In a real app, this would be an API call
    // return await axios.get(`${server}/api/patient/${patientId}/treatments`);
    
    // Simulated API response
    const patient = MOCK_PATIENTS.find(p => p._id === patientId);
    
    if (!patient) {
      return {
        success: false,
        message: "Patient not found"
      };
    }
    
    return {
      success: true,
      treatments: patient.treatments || []
    };
  } catch (error) {
    console.error("Get patient treatments error:", error);
    return {
      success: false,
      message: "Failed to fetch treatments"
    };
  }
};

// Get patient bills
export const getPatientBills = async (patientId) => {
  try {
    // In a real app, this would be an API call
    // return await axios.get(`${server}/api/patient/${patientId}/bills`);
    
    // Simulated API response
    const patient = MOCK_PATIENTS.find(p => p._id === patientId);
    
    if (!patient) {
      return {
        success: false,
        message: "Patient not found"
      };
    }
    
    return {
      success: true,
      bills: patient.bills || []
    };
  } catch (error) {
    console.error("Get patient bills error:", error);
    return {
      success: false,
      message: "Failed to fetch bills"
    };
  }
};

// Get patient dashboard overview
export const getPatientDashboardOverview = async (patientId) => {
  try {
    // In a real app, this would be an API call
    // return await axios.get(`${server}/api/patient/${patientId}/dashboard`);
    
    // Simulated API response
    const patient = MOCK_PATIENTS.find(p => p._id === patientId);
    
    if (!patient) {
      return {
        success: false,
        message: "Patient not found"
      };
    }
    
    // Get next upcoming appointment
    const upcomingAppointments = patient.appointments?.filter(
      a => a.status === "upcoming"
    ).sort((a, b) => new Date(a.date) - new Date(b.date)) || [];
    
    const nextAppointment = upcomingAppointments[0] || null;
    
    // Get active treatments
    const activeTreatments = patient.treatments?.filter(
      t => t.status === "in-progress"
    ) || [];
    
    // Get pending bills
    const pendingBills = patient.bills?.filter(
      b => b.status === "pending"
    ) || [];
    
    // Calculate total pending amount
    const totalPendingAmount = pendingBills.reduce(
      (total, bill) => total + bill.amount, 
      0
    );
    
    return {
      success: true,
      overview: {
        nextAppointment,
        activeTreatmentsCount: activeTreatments.length,
        pendingBillsCount: pendingBills.length,
        totalPendingAmount
      }
    };
  } catch (error) {
    console.error("Get patient dashboard overview error:", error);
    return {
      success: false,
      message: "Failed to fetch dashboard overview"
    };
  }
};
