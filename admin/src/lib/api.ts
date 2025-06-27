import { server } from "@/server";
import axios, { AxiosRequestConfig, Method } from "axios";
import { Expense, ServicePayment } from "@/types/finance";

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

// ********************* FINANCE API SERVICES *********************

// Income API
export const createIncome = async (data: any) => {
  return await crudRequest("POST", `/finance/income`, data);
};

export const getIncomes = async (
  page = 1,
  limit = 10,
  search = "",
  dateFilter = "all",
  startDate = "",
  endDate = ""
) => {
  let url = `/finance/income?page=${page}&limit=${limit}`;
  
  if (search) url += `&search=${search}`;
  if (dateFilter && dateFilter !== "all") url += `&dateFilter=${dateFilter}`;
  if (startDate && endDate) url += `&startDate=${startDate}&endDate=${endDate}`;
  
  return await crudRequest("GET", url);
};

export const getIncomeById = async (id: string) => {
  return await crudRequest("GET", `/finance/income/${id}`);
};

export const updateIncome = async (id: string, data: any) => {
  return await crudRequest("PUT", `/finance/income/${id}`, data);
};

export const deleteIncome = async (id: string) => {
  return await crudRequest("DELETE", `/finance/income/${id}`);
};

// Expense API
export const createExpense = async (data: Partial<Expense>) => {
  return await crudRequest("POST", `/finance/expense`, data);
};

interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    totalPages: number;
    totalAmount: number;
  };
}

export const getExpenses = async (
  page: number,
  limit: number,
  search: string,
  dateFilter: string,
  startDate: string,
  endDate: string
): Promise<ApiResponse<Expense[]>> => {
  let url = `/finance/expense?page=${page}&limit=${limit}`;
  
  if (search) url += `&search=${search}`;
  if (dateFilter && dateFilter !== "all") url += `&dateFilter=${dateFilter}`;
  if (startDate && endDate) url += `&startDate=${startDate}&endDate=${endDate}`;
  
  return await crudRequest("GET", url);
};

export const getExpenseById = async (id: string) => {
  return await crudRequest("GET", `/finance/expense/${id}`);
};

export const updateExpense = async (id: string, data: Partial<Expense>) => {
  return await crudRequest("PUT", `/finance/expense/${id}`, data);
};

export const deleteExpense = async (id: string) => {
  return await crudRequest("DELETE", `/finance/expense/${id}`);
};

// Service Payment API
export const createServicePayment = async (data: Partial<ServicePayment>) => {
  return await crudRequest("POST", `/service-payment`, data);
};

export const getServicePayments = async (
  page = 1,
  limit = 10,
  search = "",
  startDate = "",
  endDate = "",
  patient = "",
  isWalkIn?: boolean
): Promise<ApiResponse<ServicePayment[]>> => {
  let url = `/service-payment?page=${page}&limit=${limit}`;
  
  if (search) url += `&search=${search}`;
  if (startDate && endDate) url += `&startDate=${startDate}&endDate=${endDate}`;
  if (patient) url += `&patient=${patient}`;
  if (isWalkIn !== undefined) url += `&isWalkIn=${isWalkIn}`;
  
  return await crudRequest("GET", url);
};

export const getServicePaymentById = async (id: string) => {
  return await crudRequest("GET", `/service-payment/${id}`);
};

export const updateServicePayment = async (id: string, data: Partial<ServicePayment>) => {
  return await crudRequest("PUT", `/service-payment/${id}`, data);
};

export const deleteServicePayment = async (id: string) => {
  return await crudRequest("DELETE", `/service-payment/${id}`);
};

export const getServicePaymentSummary = async () => {
  return await crudRequest("GET", `/service-payment/summary`);
};

export const getPatientServicePayments = async (patientId: string) => {
  return await crudRequest("GET", `/service-payment/patient/${patientId}`);
};

// Financial Summary API
export const getFinancialSummary = async <T>(
  dateFilter = "all",
  startDate = "",
  endDate = ""
): Promise<T> => {
  let url = `/finance/summary`;
  
  if (dateFilter && dateFilter !== "all") url += `?dateFilter=${dateFilter}`;
  else if (startDate && endDate) url += `?startDate=${startDate}&endDate=${endDate}`;
  
  return await crudRequest<T>("GET", url);
};