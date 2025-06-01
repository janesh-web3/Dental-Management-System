// Patient JWT auth utilities for the Dental Management System
import { server } from '@/server';
import axios from 'axios';

// API base URL
const API_BASE_URL = server;

// Setup axios instance for API calls
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add axios interceptor to include auth token in requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('patientToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Patient login with real API
export const patientLogin = async (email: string, password: string): Promise<{ success: boolean; token?: string; patient?: any; message?: string }> => {
  try {
    const response = await api.post('/patient/login', { email, password });
    const data = response.data;
    
    if (data.success && data.token && data.patient) {
      return {
        success: true,
        token: data.token,
        patient: {
          ...data.patient,
          role: 'patient', 
        }
      };
    } else {
      return { 
        success: false, 
        message: data.message || 'Login failed' 
      };
    }
  } catch (error: any) {
    console.error('Patient login error:', error);
    
    // Handle different types of errors
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const message = error.response.data?.message || 'Authentication failed';
      return { success: false, message };
    } else if (error.request) {
      // The request was made but no response was received
      return { success: false, message: 'No response from server. Please check your connection.' };
    } else {
      // Something happened in setting up the request that triggered an Error
      return { success: false, message: 'Error setting up request' };
    }
  }
};

// Get current patient with real API
export const getCurrentPatient = async (token: string): Promise<{ success: boolean; patient?: any; message?: string }> => {
  try {
    // Set the authorization header for this specific request
    const response = await api.get('/patient/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    const data = response.data;
    
    if (data) {
      return {
        success: true,
        patient: {
          ...data,
          role: 'patient' // Ensure role is set for frontend compatibility
        }
      };
    } else {
      return { success: false, message: 'Failed to get patient details' };
    }
  } catch (error: any) {
    console.error('Get current patient error:', error);
    
    if (error.response) {
      // Only return session expired message for specific 401 errors related to token
      if (error.response.status === 401 && 
          (error.response.data?.message?.includes('token') || 
           error.response.data?.message?.includes('Token') || 
           error.response.data?.message?.includes('authentication') || 
           error.response.data?.message?.includes('Authentication'))) {
        return { success: false, message: 'Session expired. Please login again.' };
      }
      
      // For other errors, return the error message but don't indicate session expiry
      const message = error.response.data?.message || 'Failed to get patient details';
      return { success: false, message };
    } else if (error.request) {
      // Network error - server didn't respond
      return { success: false, message: 'No response from server. Please check your connection.' };
    } else {
      // Something happened in setting up the request
      return { success: false, message: 'Error setting up request' };
    }
  }
};

// Get patient appointments
export const getPatientAppointments = async (patientId: string): Promise<{ success: boolean; appointments?: any[]; message?: string }> => {
  try {
    const response = await api.get(`/patient/${patientId}/appointments`);
    const data = response.data;
    if (data.success && data.appointments) {
      return {
        success: true,
        appointments: data.appointments
      };
    } else {
      return { 
        success: false, 
        message: data.message || 'Failed to fetch appointments' 
      };
    }
  } catch (error: any) {
    console.error('Get patient appointments error:', error);
    
    if (error.response) {
      const message = error.response.data?.message || 'Failed to fetch appointments';
      return { success: false, message };
    } else if (error.request) {
      return { success: false, message: 'No response from server. Please check your connection.' };
    } else {
      return { success: false, message: 'Error setting up request' };
    }
  }
};

// Get patient bills
export const getPatientBills = async (patientId: string): Promise<{ success: boolean; bills?: any[]; message?: string }> => {
  try {
    const response = await api.get(`/patient/${patientId}/bills`);
    const data = response.data;
    
    if (data.success && data.bills) {
      return {
        success: true,
        bills: data.bills
      };
    } else {
      return { 
        success: false, 
        message: data.message || 'Failed to fetch bills' 
      };
    }
  } catch (error: any) {
    console.error('Get patient bills error:', error);
    
    if (error.response) {
      const message = error.response.data?.message || 'Failed to fetch bills';
      return { success: false, message };
    } else if (error.request) {
      return { success: false, message: 'No response from server. Please check your connection.' };
    } else {
      return { success: false, message: 'Error setting up request' };
    }
  }
};

// Get patient messages
export const getPatientMessages = async (patientId: string): Promise<{ success: boolean; messages?: any[]; message?: string }> => {
  try {
    const response = await api.get(`/patient/${patientId}/messages`);
    const data = response.data;
    
    if (data.success && data.messages) {
      return {
        success: true,
        messages: data.messages
      };
    } else {
      return { 
        success: false, 
        message: data.message || 'Failed to fetch messages' 
      };
    }
  } catch (error: any) {
    console.error('Get patient messages error:', error);
    
    if (error.response) {
      const message = error.response.data?.message || 'Failed to fetch messages';
      return { success: false, message };
    } else if (error.request) {
      return { success: false, message: 'No response from server. Please check your connection.' };
    } else {
      return { success: false, message: 'Error setting up request' };
    }
  }
};
