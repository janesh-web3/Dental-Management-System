import axios from 'axios';
import { server } from '@/server';

// Create axios instance with base URL
const api = axios.create({
  baseURL: server,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('doctorToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Types for doctor dashboard data
export interface DashboardOverview {
  todayAppointments: any[];
  upcomingAppointments: any[];
  patientSummary: {
    totalPatients: number;
    checkedPatients: number;
  };
  treatmentsInProgress: number;
  statistics: {
    totalAppointments: number;
    completedTreatments: number;
    appointmentsToday: number;
    upcomingAppointmentsCount: number;
  };
}

// Get doctor dashboard overview
export const getDoctorDashboardOverview = async (doctorId: string): Promise<DashboardOverview> => {
  try {
    const response = await api.get(`/doctor-admin/dashboard/${doctorId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching doctor dashboard data:', error);
    throw error;
  }
};

// Get doctor appointments
export const getDoctorAppointments = async (doctorId: string, params?: any) => {
  try {
    const response = await api.get(`/doctor-admin/appointments/${doctorId}`, { params });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching doctor appointments:', error);
    throw error;
  }
};

// Get doctor patients
export const getDoctorPatients = async (doctorId: string, params?: any) => {
  try {
    const response = await api.get(`/doctor-admin/patients/${doctorId}`, { params });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching doctor patients:', error);
    throw error;
  }
};

// Get doctor prescriptions
export const getDoctorPrescriptions = async (doctorId: string, params?: any) => {
  try {
    const response = await api.get(`/doctor-admin/prescriptions/${doctorId}`, { params });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching doctor prescriptions:', error);
    throw error;
  }
};

// Get doctor profile
export const getDoctorProfile = async () => {
  try {
    const response = await api.get(`/doctor/get-current-doctor`);
    return response.data;
  } catch (error) {
    console.error('Error fetching doctor profile:', error);
    throw error;
  }
};

// Update doctor profile
export const updateDoctorProfile = async (doctorId: string, data: any) => {
  try {
    const response = await api.put(`/doctor-admin/profile/${doctorId}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating doctor profile:', error);
    throw error;
  }
};

// Get doctor notifications
export const getDoctorNotifications = async (doctorId: string) => {
  try {
    const response = await api.get(`/doctor-admin/notifications/${doctorId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching doctor notifications:', error);
    throw error;
  }
};
