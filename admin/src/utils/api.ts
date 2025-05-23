// API utility functions for the Dental Management System
import { server } from '@/server';
import axios, { AxiosRequestConfig } from 'axios';

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
    // Check for patient token first, then doctor token
    const patientToken = localStorage.getItem('patientToken');
    const doctorToken = localStorage.getItem('doctorToken');
    const token = patientToken || doctorToken;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Generic CRUD request function
export const crudRequest = async <T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<{ success: boolean; data?: T; message?: string }> => {
  try {
    let response;
    
    switch (method) {
      case 'GET':
        response = await api.get(endpoint, config);
        break;
      case 'POST':
        response = await api.post(endpoint, data, config);
        break;
      case 'PUT':
        response = await api.put(endpoint, data, config);
        break;
      case 'DELETE':
        response = await api.delete(endpoint, config);
        break;
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
    
    // Check if response has data
    if (response.data) {
      return {
        success: true,
        data: response.data
      };
    } else {
      return { 
        success: false, 
        message: 'No data returned from server' 
      };
    }
  } catch (error: any) {
    console.error(`API ${method} request error:`, error);
    
    // Handle different types of errors
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const message = error.response.data?.message || `${method} request failed`;
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

// Export the api instance for direct use if needed
export { api };
