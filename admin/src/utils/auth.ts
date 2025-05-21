// Real JWT auth utilities for the Dental Management System
import { server } from '@/server';
import axios from 'axios';

// API base URL
const API_BASE_URL = server; // Adjust this to match your backend URL
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
    const token = sessionStorage.getItem('doctorToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Doctor login with real API
export const doctorLogin = async (email: string, password: string): Promise<{ success: boolean; token?: string; doctor?: any; message?: string }> => {
  try {
    const response = await api.post('/doctor/login', { email, password });
    const data = response.data;
    
    if (data.success && data.token && data.doctor) {
      return {
        success: true,
        token: data.token,
        doctor: {
          ...data.doctor,
          contact: data.doctor.contactNumber, // Map contactNumber to contact for frontend compatibility
        }
      };
    } else {
      return { 
        success: false, 
        message: data.message || 'Login failed' 
      };
    }
  } catch (error: any) {
    console.error('Doctor login error:', error);
    
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

// Update doctor password with real API
export const updateDoctorPassword = async (doctorId: string, newPassword: string): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await api.put(`/doctor/update-password/${doctorId}`, { newPassword });
    const data = response.data;
    
    return {
      success: data.success,
      message: data.message
    };
  } catch (error: any) {
    console.error('Update password error:', error);
    
    if (error.response) {
      const message = error.response.data?.message || 'Failed to update password';
      return { success: false, message };
    } else if (error.request) {
      return { success: false, message: 'No response from server. Please check your connection.' };
    } else {
      return { success: false, message: 'Error setting up request' };
    }
  }
};

// Get current doctor with real API
export const getCurrentDoctor = async (token: string): Promise<{ success: boolean; doctor?: any; message?: string }> => {
  try {
    // Set the authorization header for this specific request
    const response = await api.get('/doctor/get-current-doctor', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    const data = response.data;
    
    if (data) {
      return {
        success: true,
        doctor: {
          ...data,
          contact: data.contactNumber, // Map contactNumber to contact for frontend compatibility
          role: 'doctor' // Ensure role is set for frontend compatibility
        }
      };
    } else {
      return { success: false, message: 'Failed to get doctor details' };
    }
  } catch (error: any) {
    console.error('Get current doctor error:', error);
    
    if (error.response) {
      // Check if token is invalid or expired
      if (error.response.status === 401) {
        return { success: false, message: 'Session expired. Please login again.' };
      }
      const message = error.response.data?.message || 'Failed to get doctor details';
      return { success: false, message };
    } else if (error.request) {
      return { success: false, message: 'No response from server. Please check your connection.' };
    } else {
      return { success: false, message: 'Error setting up request' };
    }
  }
};
