const express = require("express");
const { protectAdminRoute } = require("../middleware/adminAuthMiddleware");
const {
  // Income controllers
  addIncome,
  getIncomes,
  getIncomeById,
  updateIncome,
  deleteIncome,
  
  // Expense controllers
  addExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  
  // Financial summary
  getFinancialSummary,
} = require("../controller/financeController");

const router = express.Router();

// ********************* INCOME ROUTES *********************
router.post("/income", protectAdminRoute, addIncome);
router.get("/income", protectAdminRoute, getIncomes);
router.get("/income/:id", protectAdminRoute, getIncomeById);
router.put("/income/:id", protectAdminRoute, updateIncome);
router.delete("/income/:id", protectAdminRoute, deleteIncome);

// ********************* EXPENSE ROUTES *********************
router.post("/expense", protectAdminRoute, addExpense);
router.get("/expense", protectAdminRoute, getExpenses);
router.get("/expense/:id", protectAdminRoute, getExpenseById);
router.put("/expense/:id", protectAdminRoute, updateExpense);
router.delete("/expense/:id", protectAdminRoute, deleteExpense);

// ********************* FINANCIAL SUMMARY ROUTE *********************
router.get("/summary", protectAdminRoute, getFinancialSummary);

module.exports = router; 