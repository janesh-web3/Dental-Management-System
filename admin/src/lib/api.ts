import { server } from "@/server";
import axios, { AxiosRequestConfig, Method } from "axios";

// Create axios instance without default headers
const axiosInstance = axios.create({
  baseURL: server,
  timeout: 50000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to dynamically set auth token
axiosInstance.interceptors.request.use((config) => {
  // Check for doctor routes and use doctor token if available
  if (config.url?.startsWith('/doctor')) {
    const doctorToken = sessionStorage.getItem("doctorToken");
    if (doctorToken) {
      config.headers.Authorization = `Bearer ${doctorToken}`;
    }
  } else {
    // For admin/other routes, use the regular token
    const token = sessionStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export const crudRequest = async <T>(
  method: Method,
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> => {
  try {
    const response = await axiosInstance.request<T>({
      method,
      url,
      data,
      ...config,
    });
    return response.data;
  } catch (error: any) {
    // Improved error handling
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      throw error.response.data;
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error('No response received from server');
    } else {
      // Something happened in setting up the request that triggered an Error
      throw new Error(error.message);
    }
  }
};
