import { User } from "./user";

// Finance Types
export interface Income {
  _id: string;
  title: string;
  amount: number;
  date: string;
  category: IncomeCategory;
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
  date: string;
  category: ExpenseCategory;
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

export interface FinancialSummary {
  summary: {
    income: number;
    expense: number;
    balance: number;
  };
  incomeByCategory: {
    _id: IncomeCategory;
    total: number;
  }[];
  expenseByCategory: {
    _id: ExpenseCategory;
    total: number;
  }[];
  recentIncome: Income[];
  recentExpenses: Expense[];
} 