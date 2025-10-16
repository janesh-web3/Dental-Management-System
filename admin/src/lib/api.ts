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
  // if (config.url?.startsWith("/doctor")) {
  //   const doctorToken = sessionStorage.getItem("doctorToken");
  //   if (doctorToken) {
  //     config.headers.Authorization = `Bearer ${doctorToken}`;
  //   }
  // } else {
    // }
    const token = sessionStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
      console.error(`API Error ${error.response.status} for ${method} ${url}:`, error.response.data);
      throw error.response.data;
    } else if (error.request) {
      // The request was made but no response was received
      console.error(`No response received for ${method} ${url}:`, error.request);
      throw new Error("No response received from server");
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error(`Error setting up request for ${method} ${url}:`, error.message);
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

export const updateServicePayment = async (
  id: string,
  data: Partial<ServicePayment>
) => {
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
  else if (startDate && endDate)
    url += `?startDate=${startDate}&endDate=${endDate}`;

  return await crudRequest<T>("GET", url);
};

// ********************* RECYCLE BIN API SERVICES *********************

export const getRecycleBinItems = async (
  type = "all",
  page = 1,
  limit = 10
) => {
  return await crudRequest(
    "GET",
    `/recycle-bin?type=${type}&page=${page}&limit=${limit}`
  );
};

export const getRecycleBinStats = async () => {
  return await crudRequest("GET", `/recycle-bin/stats`);
};

export const restoreRecycleBinItem = async (type: string, id: string) => {
  return await crudRequest("PUT", `/recycle-bin/restore/${type}/${id}`);
};

export const permanentlyDeleteRecycleBinItem = async (
  type: string,
  id: string
) => {
  return await crudRequest("DELETE", `/recycle-bin/permanent/${type}/${id}`);
};

export const emptyRecycleBin = async (type?: string) => {
  const url = type ? `/recycle-bin/empty?type=${type}` : `/recycle-bin/empty`;
  return await crudRequest("DELETE", url);
};

// ********************* PATIENT API SERVICES *********************

export const getPatients = async (
  page = 1,
  limit = 10,
  search = "",
  dateFilter = "all",
  startDate = "",
  endDate = "",
  followUpFilter = ""
) => {
  let url = `/patient/get-pagination-patient?page=${page}&limit=${limit}`;

  if (search) url += `&search=${search}`;
  if (dateFilter && dateFilter !== "all") url += `&dateFilter=${dateFilter}`;
  if (startDate && endDate) url += `&startDate=${startDate}&endDate=${endDate}`;
  if (followUpFilter) url += `&followUpFilter=${followUpFilter}`;

  return await crudRequest("GET", url);
};

export const getPatientById = async (id: string) => {
  return await crudRequest("GET", `/patient/get-single-patient/${id}`);
};

export const createPatient = async (data: any) => {
  return await crudRequest("POST", `/patient/add-patient`, data);
};

export const updatePatient = async (id: string, data: any) => {
  return await crudRequest("PUT", `/patient/update-patient/${id}`, data);
};

export const deletePatient = async (id: string) => {
  return await crudRequest("DELETE", `/patient/delete-patient/${id}`);
};

// ********************* DOCTOR API SERVICES *********************

export const getDoctors = async (page = 1, limit = 10, search = "") => {
  let url = `/doctor/get-doctors?page=${page}&limit=${limit}`;
  if (search) url += `&search=${search}`;
  return await crudRequest("GET", url);
};

export const getDoctorById = async (id: string) => {
  return await crudRequest("GET", `/doctor/get-doctor/${id}`);
};

export const createDoctor = async (data: any) => {
  return await crudRequest("POST", `/doctor/add-doctor`, data);
};

export const updateDoctor = async (id: string, data: any) => {
  return await crudRequest("PUT", `/doctor/update-doctor/${id}`, data);
};

export const deleteDoctor = async (id: string) => {
  return await crudRequest("DELETE", `/doctor/delete-doctor/${id}`);
};

// ********************* APPOINTMENT API SERVICES *********************

export const getAppointments = async (page = 1, limit = 10, search = "") => {
  let url = `/appointment/get-all-appointments?page=${page}&limit=${limit}`;
  if (search) url += `&search=${search}`;
  return await crudRequest("GET", url);
};

export const getAppointmentById = async (id: string) => {
  return await crudRequest("GET", `/appointment/get-appointment/${id}`);
};

export const createAppointment = async (data: any) => {
  return await crudRequest("POST", `/appointment/add-appointment`, data);
};

export const updateAppointment = async (id: string, data: any) => {
  return await crudRequest(
    "PUT",
    `/appointment/update-appointment/${id}`,
    data
  );
};

export const deleteAppointment = async (id: string) => {
  return await crudRequest("DELETE", `/appointment/delete-appointment/${id}`);
};

// ********************* SMS API SERVICES *********************

// Patient Groups
export const getPatientGroups = async () => {
  return await crudRequest("GET", `/patient-groups`);
};

export const createPatientGroup = async (data: any) => {
  return await crudRequest("POST", `/patient-groups`, data);
};

export const updatePatientGroup = async (id: string, data: any) => {
  return await crudRequest("PUT", `/patient-groups/${id}`, data);
};

export const deletePatientGroup = async (id: string) => {
  return await crudRequest("DELETE", `/patient-groups/${id}`);
};

export const getGroupPatients = async (id: string) => {
  return await crudRequest("GET", `/patient-groups/${id}/patients`);
};

export const filterPatientsForGroup = async (filters: any) => {
  return await crudRequest("POST", `/patient-groups/filter-patients`, filters);
};

// SMS Templates
export const getSMSTemplates = async () => {
  return await crudRequest("GET", `/sms/templates`);
};

export const createSMSTemplate = async (data: any) => {
  return await crudRequest("POST", `/sms/templates`, data);
};

export const updateSMSTemplate = async (id: string, data: any) => {
  return await crudRequest("PUT", `/sms/templates/${id}`, data);
};

export const deleteSMSTemplate = async (id: string) => {
  return await crudRequest("DELETE", `/sms/templates/${id}`);
};

// SMS Sending
export const sendBulkSMS = async (data: any) => {
  return await crudRequest("POST", `/sms/bulk`, data);
};

export const sendSingleSMS = async (data: any) => {
  return await crudRequest("POST", `/sms/single`, data);
};

export const sendSMSToGroup = async (groupId: string, data: any) => {
  return await crudRequest("POST", `/sms/group/${groupId}`, data);
};

// SMS History
export const getSMSHistory = async (params?: { page?: number; limit?: number; status?: string; search?: string }) => {
  let url = `/sms/history`;
  if (params) {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.status) queryParams.append('status', params.status);
    if (params.search) queryParams.append('search', params.search);
    if (queryParams.toString()) url += `?${queryParams.toString()}`;
  }
  return await crudRequest("GET", url);
};

// SMS Dashboard
export const getSMSDashboardStats = async () => {
  return await crudRequest("GET", `/sms-dashboard/stats`);
};

export const getSMSDashboardHistory = async (params?: { page?: number; limit?: number; status?: string; search?: string }) => {
  let url = `/sms-dashboard/history`;
  if (params) {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.status) queryParams.append('status', params.status);
    if (params.search) queryParams.append('search', params.search);
    if (queryParams.toString()) url += `?${queryParams.toString()}`;
  }
  return await crudRequest("GET", url);
};

export const getSMSTemplateAnalytics = async () => {
  return await crudRequest("GET", `/sms-dashboard/analytics/templates`);
};

export const getSMSCostAnalytics = async () => {
  return await crudRequest("GET", `/sms-dashboard/analytics/costs`);
};

// SMS Scheduling
export const scheduleSMS = async (data: any) => {
  return await crudRequest("POST", `/sms-schedule`, data);
};

export const getScheduledSMS = async () => {
  return await crudRequest("GET", `/sms-schedule`);
};

export const cancelScheduledSMS = async (id: string) => {
  return await crudRequest("DELETE", `/sms-schedule/${id}`);
};

// SMS Credit
export const getSMSCredit = async () => {
  return await crudRequest("GET", `/sms/credit`);
};

export const getDetailedSMSCredit = async () => {
  return await crudRequest("GET", `/sms/credit/detailed`);
};

// SMS Campaigns
export const getSMSCampaigns = async () => {
  return await crudRequest("GET", `/sms/campaigns`);
};

// ********************* INVOICE API SERVICES *********************

export const getInvoices = async (
  page = 1,
  limit = 10,
  search = "",
  status = ""
) => {
  let url = `/v1/invoices?page=${page}&limit=${limit}`;
  if (search) url += `&search=${search}`;
  if (status) url += `&status=${status}`;
  return await crudRequest("GET", url);
};

export const getInvoiceById = async (id: string) => {
  return await crudRequest("GET", `/v1/invoices/${id}`);
};

export const createInvoice = async (data: any) => {
  return await crudRequest("POST", `/v1/invoices`, data);
};

export const updateInvoice = async (id: string, data: any) => {
  return await crudRequest("PUT", `/v1/invoices/${id}`, data);
};

export const deleteInvoice = async (id: string) => {
  return await crudRequest("DELETE", `/v1/invoices/${id}`);
};
