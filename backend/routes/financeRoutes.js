const express = require("express");
const { protectAdminRoute } = require("../middleware/adminAuthMiddleware");
const { 
  authenticateUser, 
  authorizePermission, 
  staffOrAdmin 
} = require("../middleware/rbacMiddleware");
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

// ********************* INCOME ROUTES WITH RBAC *********************
router.post("/income", authenticateUser, authorizePermission('income', 'create'), addIncome);
router.get("/income", authenticateUser, authorizePermission('income', 'read'), getIncomes);
router.get("/income/:id", authenticateUser, authorizePermission('income', 'read'), getIncomeById);
router.put("/income/:id", authenticateUser, authorizePermission('income', 'update'), updateIncome);
router.delete("/income/:id", authenticateUser, authorizePermission('income', 'delete'), deleteIncome);

// ********************* EXPENSE ROUTES WITH RBAC *********************
router.post("/expense", authenticateUser, authorizePermission('expenses', 'create'), addExpense);
router.get("/expense", authenticateUser, authorizePermission('expenses', 'read'), getExpenses);
router.get("/expense/:id", authenticateUser, authorizePermission('expenses', 'read'), getExpenseById);
router.put("/expense/:id", authenticateUser, authorizePermission('expenses', 'update'), updateExpense);
router.delete("/expense/:id", authenticateUser, authorizePermission('expenses', 'delete'), deleteExpense);

// ********************* FINANCIAL SUMMARY ROUTE WITH RBAC *********************
router.get("/summary", authenticateUser, staffOrAdmin, getFinancialSummary);

module.exports = router; 