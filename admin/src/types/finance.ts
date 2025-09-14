import { User } from "./user";
import { Patient } from "./patient";

// Finance Types
export interface Income {
  _id: string;
  title: string;
  amount: number;
  date: string | Date;
  category: IncomeCategory;
  paymentMethod?: string;
  notes?: string;
  createdBy: string | User;
  createdAt: string;
  updatedAt: string;
}

export type IncomeCategory =
  | "Patient Registration"
  | "Consultation Fee"
  | "Treatment Fee"
  | "X-ray Fee"
  | "Dental Products"
  | "Other";

export interface Expense {
  _id: string;
  title: string;
  amount: number;
  date: string | Date;
  category: ExpenseCategory;
  paymentMethod?: string;
  notes?: string;
  createdBy: string | User;
  createdAt: string;
  updatedAt: string;
}

export type ExpenseCategory =
  | "Rent"
  | "Electricity Bill"
  | "Water Bill"
  | "Internet Bill"
  | "Staff Salary"
  | "Dental Supplies"
  | "Equipment"
  | "Marketing"
  | "Maintenance"
  | "Office Supplies"
  | "Other";

export type ServiceType =
  | "X-Ray"
  | "Consultation"
  | "Medicine"
  | "Lab Test"
  | "Cleaning"
  | "Other";

export type PaymentMethod =
  | "Cash"
  | "Credit Card"
  | "Debit Card"
  | "Insurance"
  | "Bank Transfer"
  | "Other";

export interface ServicePayment {
  _id: string;
  patient?: string | Patient;
  patientName: string;
  contactNumber?: string;
  serviceType: ServiceType;
  description?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  createdBy: string | User;
  date: string;
  isWalkIn: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialSummary {
  summary: {
    income: number;
    expense: number;
    balance: number;
    servicePayment: number;
  };
  incomeByCategory: {
    _id: IncomeCategory;
    total: number;
  }[];
  expenseByCategory: {
    _id: ExpenseCategory;
    total: number;
  }[];
  serviceByType: {
    _id: ServiceType;
    total: number;
  }[];
  recentIncome: Income[];
  recentExpenses: Expense[];
  recentServicePayments: ServicePayment[];
}