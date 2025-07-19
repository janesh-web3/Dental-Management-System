const Income = require("../model/Income");
const Expense = require("../model/Expense");
const ServicePayment = require("../model/ServicePayment");
const { createAndEmitNotification } = require("./notificationCtrl");
const { getIO } = require("../socket");
const { createIncomeInvoice, createExpenseInvoice } = require("../utils/invoiceGenerator");

// Helper function to get date filter
const getDateFilter = (startDate, endDate) => {
  if (startDate && endDate) {
    return {
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    };
  }
  
  return {};
};

// Helper function for predefined date filters
const getPredefinedDateFilter = (filter) => {
  const now = new Date();
  
  switch (filter) {
    case 'today': {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      return {
        date: {
          $gte: today,
          $lt: tomorrow
        }
      };
    }
    
    case 'week': {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay()); // Start of current week (Sunday)
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7); // End of current week (next Sunday)
      
      return {
        date: {
          $gte: startOfWeek,
          $lt: endOfWeek
        }
      };
    }
    
    case 'month': {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);
      
      return {
        date: {
          $gte: startOfMonth,
          $lte: endOfMonth
        }
      };
    }
    
    default:
      return {};
  }
};

// ********************* INCOME CONTROLLERS *********************

// Add new income
const addIncome = async (req, res) => {
  try {
    const { title, amount, date, category, notes } = req.body;
    
    // Validate required fields
    if (!title || !amount || !category) {
      return res.status(400).json({
        success: false,
        message: "Title, amount, and category are required",
      });
    }
      // Create new income
    const income = await Income.create({
      title,
      amount,
      date: date || new Date(),
      category,
      notes,
      createdBy: req.admin.id,
    });
    
    // Generate invoice for this income entry
    try {
      const invoice = await createIncomeInvoice(income, req.admin.id);
      console.log(`Invoice ${invoice.invoiceNumber} generated for income ${income._id}`);
    } catch (invoiceError) {
      console.error("Error generating invoice for income:", invoiceError);
      // Don't fail the income creation if invoice generation fails
    }
    
    // Create notification for all admin users
    await createAndEmitNotification({
      title: "New Income Added",
      message: `${title} - ${amount} was added as income in category ${category}`,
      type: "success",
      sourceId: income._id.toString(),
      sourceType: "Income",
      targetRoles: ["admin", "superadmin"],
      createdBy: req.admin.id,
      createdByType: "User",
      link: `/finance/income/${income._id}`,
      soundEnabled: true
    });
    
    // Also emit notification sound directly
    const io = getIO();
    if (io) {
      // Emit notification sound event
      io.to('admin').emit('notification:sound', { type: 'success' });
      
      // Also emit the income:added event
      io.emit('income:added', {
        id: income._id,
        title,
        amount,
        category,
        timestamp: new Date(),
        soundEnabled: true
      });
    }
    
    res.status(201).json({
      success: true,
      data: income,
      message: "Income added successfully",
    });
  } catch (error) {
    console.error("Error adding income:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add income",
      error: error.message,
    });
  }
};

// Get all income records with optional filtering
const getIncomes = async (req, res) => {
  try {
    const { startDate, endDate, dateFilter, page = 1, limit = 10, search = "" } = req.query;
    
    // Build query - exclude soft deleted records
    let query = { isDeleted: { $ne: true } };
    
    // Apply date filter if provided
    if (dateFilter && dateFilter !== "all") {
      Object.assign(query, getPredefinedDateFilter(dateFilter));
    } else if (startDate && endDate) {
      Object.assign(query, getDateFilter(startDate, endDate));
    }
    
    // Apply search if provided
    if (search) {
      query.title = { $regex: search, $options: "i" };
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get income records (excluding soft deleted)
    const incomes = await Income.find(query)
      .sort({ date: -1 }) // Sort by date (newest first)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("createdBy", "name email");
    
    // Get total count
    const total = await Income.countDocuments(query);
    
    // Calculate total income (excluding soft deleted)
    const totalIncome = await Income.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    
    // Calculate total pages
    const totalPages = Math.ceil(total / parseInt(limit));
    
    res.status(200).json({
      success: true,
      data: incomes,
      meta: {
        total,
        totalPages,
        currentPage: parseInt(page),
        totalAmount: totalIncome.length > 0 ? totalIncome[0].total : 0,
      },
    });
  } catch (error) {
    console.error("Error fetching incomes:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch income records",
      error: error.message,
    });
  }
};

// Get income by ID
const getIncomeById = async (req, res) => {
  try {
    const income = await Income.findOne({ _id: req.params.id, isDeleted: { $ne: true } }).populate(
      "createdBy",
      "name email"
    );
    
    if (!income) {
      return res.status(404).json({
        success: false,
        message: "Income record not found",
      });
    }
    
    res.status(200).json({
      success: true,
      data: income,
    });
  } catch (error) {
    console.error("Error fetching income:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch income record",
      error: error.message,
    });
  }
};

// Update income
const updateIncome = async (req, res) => {
  try {
    const { title, amount, date, category, notes } = req.body;
    
    // Find income
    let income = await Income.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    
    if (!income) {
      return res.status(404).json({
        success: false,
        message: "Income record not found",
      });
    }
    
    // Only allow admin, superadmin, or the user who created the record to update it
    if (
      req.admin.role !== "admin" &&
      req.admin.role !== "superadmin" &&
      income.createdBy.toString() !== req.admin.id
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this record",
      });
    }
    
    // Update income
    income = await Income.findByIdAndUpdate(
      req.params.id,
      {
        title,
        amount,
        date: date || income.date,
        category,
        notes,
      },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: income,
      message: "Income updated successfully",
    });
  } catch (error) {
    console.error("Error updating income:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update income record",
      error: error.message,
    });
  }
};

// Soft delete income
const deleteIncome = async (req, res) => {
  try {
    const income = await Income.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    
    if (!income || income.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Income record not found",
      });
    }
    
    // Only allow admin, superadmin, or the user who created the record to delete it
    if (
      req.admin.role !== "admin" &&
      req.admin.role !== "superadmin" &&
      income.createdBy.toString() !== req.admin.id
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this record",
      });
    }
    
    // Soft delete instead of hard delete
    await Income.findByIdAndUpdate(req.params.id, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: req.admin.id
    });
    
    res.status(200).json({
      success: true,
      message: "Income record deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting income:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete income record",
      error: error.message,
    });
  }
};

// ********************* EXPENSE CONTROLLERS *********************

// Add new expense
const addExpense = async (req, res) => {
  try {
    const { title, amount, date, category, notes } = req.body;
    
    // Validate required fields
    if (!title || !amount || !category) {
      return res.status(400).json({
        success: false,
        message: "Title, amount, and category are required",
      });
    }
      // Create new expense
    const expense = await Expense.create({
      title,
      amount,
      date: date || new Date(),
      category,
      notes,
      createdBy: req.admin.id,
    });
    
    // Generate invoice/receipt for this expense entry
    try {
      const invoice = await createExpenseInvoice(expense, req.admin.id);
      console.log(`Expense receipt ${invoice.invoiceNumber} generated for expense ${expense._id}`);
    } catch (invoiceError) {
      console.error("Error generating invoice for expense:", invoiceError);
      // Don't fail the expense creation if invoice generation fails
    }
    
    // Create notification for all admin users
    await createAndEmitNotification({
      title: "New Expense Added",
      message: `${title} - ${amount} was added as expense in category ${category}`,
      type: "info",
      sourceId: expense._id.toString(),
      sourceType: "Expense",
      targetRoles: ["admin", "superadmin"],
      createdBy: req.admin.id,
      createdByType: "User",
      link: `/finance/expense/${expense._id}`,
      soundEnabled: true
    });
    
    // Also emit notification sound directly
    const io = getIO();
    if (io) {
      // Emit notification sound event
      io.to('admin').emit('notification:sound', { type: 'info' });
      
      // Also emit the expense:added event
      io.emit('expense:added', {
        id: expense._id,
        title,
        amount,
        category,
        timestamp: new Date(),
        soundEnabled: true
      });
    }
    
    res.status(201).json({
      success: true,
      data: expense,
      message: "Expense added successfully",
    });
  } catch (error) {
    console.error("Error adding expense:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add expense",
      error: error.message,
    });
  }
};

// Get all expense records with optional filtering
const getExpenses = async (req, res) => {
  try {
    const { startDate, endDate, dateFilter, page = 1, limit = 10, search = "" } = req.query;
    
    // Build query - exclude soft deleted records
    let query = { isDeleted: { $ne: true } };
    
    // Apply date filter if provided
    if (dateFilter && dateFilter !== "all") {
      Object.assign(query, getPredefinedDateFilter(dateFilter));
    } else if (startDate && endDate) {
      Object.assign(query, getDateFilter(startDate, endDate));
    }
    
    // Apply search if provided
    if (search) {
      query.title = { $regex: search, $options: "i" };
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get expense records
    const expenses = await Expense.find(query)
      .sort({ date: -1 }) // Sort by date (newest first)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("createdBy", "name email");
    
    // Get total count
    const total = await Expense.countDocuments(query);
    
    // Calculate total expense
    const totalExpense = await Expense.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    
    // Calculate total pages
    const totalPages = Math.ceil(total / parseInt(limit));
    
    res.status(200).json({
      success: true,
      data: expenses,
      meta: {
        total,
        totalPages,
        currentPage: parseInt(page),
        totalAmount: totalExpense.length > 0 ? totalExpense[0].total : 0,
      },
    });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch expense records",
      error: error.message,
    });
  }
};

// Get expense by ID
const getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, isDeleted: { $ne: true } }).populate(
      "createdBy",
      "name email"
    );
    
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense record not found",
      });
    }
    
    res.status(200).json({
      success: true,
      data: expense,
    });
  } catch (error) {
    console.error("Error fetching expense:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch expense record",
      error: error.message,
    });
  }
};

// Update expense
const updateExpense = async (req, res) => {
  try {
    const { title, amount, date, category, notes } = req.body;
    
    // Find expense
    let expense = await Expense.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense record not found",
      });
    }
    
    // Only allow admin, superadmin, or the user who created the record to update it
    if (
      req.admin.role !== "admin" &&
      req.admin.role !== "superadmin" &&
      expense.createdBy.toString() !== req.admin.id
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this record",
      });
    }
    
    // Update expense
    expense = await Expense.findByIdAndUpdate(
      req.params.id,
      {
        title,
        amount,
        date: date || expense.date,
        category,
        notes,
      },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: expense,
      message: "Expense updated successfully",
    });
  } catch (error) {
    console.error("Error updating expense:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update expense record",
      error: error.message,
    });
  }
};

// Soft delete expense
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    
    if (!expense || expense.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Expense record not found",
      });
    }
    
    // Only allow admin, superadmin, or the user who created the record to delete it
    if (
      req.admin.role !== "admin" &&
      req.admin.role !== "superadmin" &&
      expense.createdBy.toString() !== req.admin.id
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this record",
      });
    }
    
    // Soft delete instead of hard delete
    await Expense.findByIdAndUpdate(req.params.id, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: req.admin.id
    });
    
    res.status(200).json({
      success: true,
      message: "Expense record deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete expense record",
      error: error.message,
    });
  }
};

// ********************* FINANCIAL SUMMARY *********************

// Get financial summary (income, expense, balance)
const getFinancialSummary = async (req, res) => {
  try {
    const { startDate, endDate, dateFilter } = req.query;
    
    // Build query
    let query = {};
    
    // Apply date filter if provided
    if (dateFilter && dateFilter !== "all") {
      Object.assign(query, getPredefinedDateFilter(dateFilter));
    } else if (startDate && endDate) {
      Object.assign(query, getDateFilter(startDate, endDate));
    }
    
    // Get total income (excluding soft deleted)
    const incomeQuery = { ...query, isDeleted: { $ne: true } };
    const totalIncome = await Income.aggregate([
      { $match: incomeQuery },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    
    // Get total expense (excluding soft deleted)
    const expenseQuery = { ...query, isDeleted: { $ne: true } };
    const totalExpense = await Expense.aggregate([
      { $match: expenseQuery },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    
    // Get service payment revenue (excluding soft deleted)
    const servicePaymentQuery = { ...query, isDeleted: { $ne: true } };
    if (query.date) {
      servicePaymentQuery.date = query.date;
    }
    
    const totalServicePayment = await ServicePayment.aggregate([
      { $match: servicePaymentQuery },
      {
        $lookup: {
          from: "patients",
          localField: "patient",
          foreignField: "_id",
          as: "patientExists"
        }
      },
      {
        $match: {
          $and: [
            {
              $or: [
                { isWalkIn: true },
                { "patientExists.isDeleted": { $ne: true } }
              ]
            },
            { "patientExists": { $ne: [] } }
          ]
        }
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    
    // Calculate balance
    const incomeTotal = totalIncome.length > 0 ? totalIncome[0].total : 0;
    const expenseTotal = totalExpense.length > 0 ? totalExpense[0].total : 0;
    const servicePaymentTotal = totalServicePayment.length > 0 ? totalServicePayment[0].total : 0;
    const balance = incomeTotal - expenseTotal;
    
    // Get income by category (excluding soft deleted)
    const incomeByCategory = await Income.aggregate([
      { $match: incomeQuery },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
      { $sort: { total: -1 } },
    ]);
    
    // Get expense by category (excluding soft deleted)
    const expenseByCategory = await Expense.aggregate([
      { $match: expenseQuery },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
      { $sort: { total: -1 } },
    ]);
    
    // Get service payments by type - only include payments for existing patients
    const serviceByType = await ServicePayment.aggregate([
      { $match: servicePaymentQuery },
      {
        $lookup: {
          from: "patients",
          localField: "patient",
          foreignField: "_id",
          as: "patientExists"
        }
      },
      {
        $match: {
          $or: [
            { isWalkIn: true },
            { patientExists: { $ne: [] } }
          ]
        }
      },
      { $group: { _id: "$serviceType", total: { $sum: "$amount" } } },
      { $sort: { total: -1 } },
    ]);
    
    // Get recent income (last 5, excluding soft deleted)
    const recentIncome = await Income.find(incomeQuery)
      .sort({ date: -1 })
      .limit(5)
      .populate("createdBy", "name");
    
    // Get recent expenses (last 5, excluding soft deleted)
    const recentExpenses = await Expense.find(expenseQuery)
      .sort({ date: -1 })
      .limit(5)
      .populate("createdBy", "name");
    
    // Get recent service payments (last 5)
    const recentServicePayments = await ServicePayment.find(servicePaymentQuery)
      .sort({ date: -1 })
      .limit(5)
      .populate("createdBy", "name")
      .populate("patient", "personalDetails.name");
    
    res.status(200).json({
      success: true,
      data: {
        summary: {
          income: incomeTotal,
          expense: expenseTotal,
          balance,
          servicePayment: servicePaymentTotal
        },
        incomeByCategory,
        expenseByCategory,
        serviceByType,
        recentIncome,
        recentExpenses,
        recentServicePayments
      },
    });
  } catch (error) {
    console.error("Error fetching financial summary:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch financial summary",
      error: error.message,
    });
  }
};

module.exports = {
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
};
