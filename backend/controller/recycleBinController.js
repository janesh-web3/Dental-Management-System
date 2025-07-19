const Patient = require("../model/Patient");
const Doctor = require("../model/Doctor");
const Income = require("../model/Income");
const Expense = require("../model/Expense");
const ServicePayment = require("../model/ServicePayment");
const Appointment = require("../model/Appointment");
const Invoice = require("../model/Invoice");

/**
 * Get all deleted records from recycle bin
 * @route GET /api/recycle-bin
 * @access Private (Admin only)
 */
const getRecycleBinItems = async (req, res) => {
  try {
    const { type, page = 1, limit = 10 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);
    
    let results = {};
    
    if (!type || type === 'all') {
      // Get deleted items from all collections
      const [patients, doctors, incomes, expenses, servicePayments, appointments, invoices] = await Promise.all([
        Patient.find({ isDeleted: true })
          .sort({ deletedAt: -1 })
          .limit(limitNum)
          .populate("deletedBy", "name email"),
        Doctor.find({ isDeleted: true })
          .sort({ deletedAt: -1 })
          .limit(limitNum)
          .populate("deletedBy", "name email"),
        Income.find({ isDeleted: true })
          .sort({ deletedAt: -1 })
          .limit(limitNum)
          .populate("deletedBy", "name email"),
        Expense.find({ isDeleted: true })
          .sort({ deletedAt: -1 })
          .limit(limitNum)
          .populate("deletedBy", "name email"),
        ServicePayment.find({ isDeleted: true })
          .sort({ deletedAt: -1 })
          .limit(limitNum)
          .populate("deletedBy", "name email"),
        Appointment.find({ isDeleted: true })
          .sort({ deletedAt: -1 })
          .limit(limitNum)
          .populate("deletedBy", "name email"),
        Invoice.find({ isDeleted: true })
          .sort({ deletedAt: -1 })
          .limit(limitNum)
          .populate("deletedBy", "name email")
      ]);
      
      results = {
        patients: patients.map(item => ({ ...item.toObject(), type: 'patient' })),
        doctors: doctors.map(item => ({ ...item.toObject(), type: 'doctor' })),
        incomes: incomes.map(item => ({ ...item.toObject(), type: 'income' })),
        expenses: expenses.map(item => ({ ...item.toObject(), type: 'expense' })),
        servicePayments: servicePayments.map(item => ({ ...item.toObject(), type: 'servicePayment' })),
        appointments: appointments.map(item => ({ ...item.toObject(), type: 'appointment' })),
        invoices: invoices.map(item => ({ ...item.toObject(), type: 'invoice' }))
      };
    } else {
      // Get deleted items from specific collection
      let Model;
      switch (type) {
        case 'patient':
          Model = Patient;
          break;
        case 'doctor':
          Model = Doctor;
          break;
        case 'income':
          Model = Income;
          break;
        case 'expense':
          Model = Expense;
          break;
        case 'servicePayment':
          Model = ServicePayment;
          break;
        case 'appointment':
          Model = Appointment;
          break;
        case 'invoice':
          Model = Invoice;
          break;
        default:
          return res.status(400).json({
            success: false,
            message: "Invalid type specified"
          });
      }
      
      const items = await Model.find({ isDeleted: true })
        .sort({ deletedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("deletedBy", "name email");
      
      const total = await Model.countDocuments({ isDeleted: true });
      
      results = {
        items: items.map(item => ({ ...item.toObject(), type })),
        pagination: {
          page: parseInt(page),
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      };
    }
    
    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error("Error fetching recycle bin items:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch recycle bin items",
      error: error.message
    });
  }
};

/**
 * Restore a deleted item from recycle bin
 * @route PUT /api/recycle-bin/restore/:type/:id
 * @access Private (Admin only)
 */
const restoreItem = async (req, res) => {
  try {
    const { type, id } = req.params;
    
    let Model;
    switch (type) {
      case 'patient':
        Model = Patient;
        break;
      case 'doctor':
        Model = Doctor;
        break;
      case 'income':
        Model = Income;
        break;
      case 'expense':
        Model = Expense;
        break;
      case 'servicePayment':
        Model = ServicePayment;
        break;
      case 'appointment':
        Model = Appointment;
        break;
      case 'invoice':
        Model = Invoice;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: "Invalid type specified"
        });
    }
    
    const item = await Model.findById(id);
    if (!item || !item.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Item not found in recycle bin"
      });
    }
    
    // If restoring a patient, also restore linked records
    if (type === 'patient') {
      await Promise.all([
        ServicePayment.updateMany(
          { patient: id, isDeleted: true },
          { 
            $unset: { isDeleted: "", deletedAt: "", deletedBy: "" }
          }
        ),
        Appointment.updateMany(
          { patientId: id.toString(), isDeleted: true },
          { 
            $unset: { isDeleted: "", deletedAt: "", deletedBy: "" }
          }
        ),
        Invoice.updateMany(
          { patient: id, isDeleted: true },
          { 
            $unset: { isDeleted: "", deletedAt: "", deletedBy: "" }
          }
        )
      ]);
    }
    
    // Restore the main item
    await Model.findByIdAndUpdate(id, {
      $unset: {
        isDeleted: "",
        deletedAt: "",
        deletedBy: ""
      }
    });
    
    res.status(200).json({
      success: true,
      message: `${type} restored successfully`
    });
  } catch (error) {
    console.error("Error restoring item:", error);
    res.status(500).json({
      success: false,
      message: "Failed to restore item",
      error: error.message
    });
  }
};

/**
 * Permanently delete an item from recycle bin
 * @route DELETE /api/recycle-bin/permanent/:type/:id
 * @access Private (Admin only)
 */
const permanentlyDeleteItem = async (req, res) => {
  try {
    const { type, id } = req.params;
    
    let Model;
    switch (type) {
      case 'patient':
        Model = Patient;
        break;
      case 'doctor':
        Model = Doctor;
        break;
      case 'income':
        Model = Income;
        break;
      case 'expense':
        Model = Expense;
        break;
      case 'servicePayment':
        Model = ServicePayment;
        break;
      case 'appointment':
        Model = Appointment;
        break;
      case 'invoice':
        Model = Invoice;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: "Invalid type specified"
        });
    }
    
    const item = await Model.findById(id);
    if (!item || !item.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Item not found in recycle bin"
      });
    }
    
    // If permanently deleting a patient, also delete linked records
    if (type === 'patient') {
      await Promise.all([
        ServicePayment.deleteMany({ patient: id, isDeleted: true }),
        Appointment.deleteMany({ patientId: id.toString(), isDeleted: true }),
        Invoice.deleteMany({ patient: id, isDeleted: true })
      ]);
    }
    
    // Permanently delete the main item
    await Model.findByIdAndDelete(id);
    
    res.status(200).json({
      success: true,
      message: `${type} permanently deleted`
    });
  } catch (error) {
    console.error("Error permanently deleting item:", error);
    res.status(500).json({
      success: false,
      message: "Failed to permanently delete item",
      error: error.message
    });
  }
};

/**
 * Empty recycle bin (permanently delete all items)
 * @route DELETE /api/recycle-bin/empty
 * @access Private (Admin only)
 */
const emptyRecycleBin = async (req, res) => {
  try {
    const { type } = req.query;
    
    if (type && type !== 'all') {
      // Empty specific type
      let Model;
      switch (type) {
        case 'patient':
          Model = Patient;
          break;
        case 'doctor':
          Model = Doctor;
          break;
        case 'income':
          Model = Income;
          break;
        case 'expense':
          Model = Expense;
          break;
        case 'servicePayment':
          Model = ServicePayment;
          break;
        case 'appointment':
          Model = Appointment;
          break;
        case 'invoice':
          Model = Invoice;
          break;
        default:
          return res.status(400).json({
            success: false,
            message: "Invalid type specified"
          });
      }
      
      await Model.deleteMany({ isDeleted: true });
    } else {
      // Empty entire recycle bin
      await Promise.all([
        Patient.deleteMany({ isDeleted: true }),
        Doctor.deleteMany({ isDeleted: true }),
        Income.deleteMany({ isDeleted: true }),
        Expense.deleteMany({ isDeleted: true }),
        ServicePayment.deleteMany({ isDeleted: true }),
        Appointment.deleteMany({ isDeleted: true }),
        Invoice.deleteMany({ isDeleted: true })
      ]);
    }
    
    res.status(200).json({
      success: true,
      message: "Recycle bin emptied successfully"
    });
  } catch (error) {
    console.error("Error emptying recycle bin:", error);
    res.status(500).json({
      success: false,
      message: "Failed to empty recycle bin",
      error: error.message
    });
  }
};

/**
 * Get recycle bin statistics
 * @route GET /api/recycle-bin/stats
 * @access Private (Admin only)
 */
const getRecycleBinStats = async (req, res) => {
  try {
    const [
      patientsCount,
      doctorsCount,
      incomesCount,
      expensesCount,
      servicePaymentsCount,
      appointmentsCount,
      invoicesCount
    ] = await Promise.all([
      Patient.countDocuments({ isDeleted: true }),
      Doctor.countDocuments({ isDeleted: true }),
      Income.countDocuments({ isDeleted: true }),
      Expense.countDocuments({ isDeleted: true }),
      ServicePayment.countDocuments({ isDeleted: true }),
      Appointment.countDocuments({ isDeleted: true }),
      Invoice.countDocuments({ isDeleted: true })
    ]);
    
    const total = patientsCount + doctorsCount + incomesCount + expensesCount + 
                  servicePaymentsCount + appointmentsCount + invoicesCount;
    
    res.status(200).json({
      success: true,
      data: {
        total,
        breakdown: {
          patients: patientsCount,
          doctors: doctorsCount,
          incomes: incomesCount,
          expenses: expensesCount,
          servicePayments: servicePaymentsCount,
          appointments: appointmentsCount,
          invoices: invoicesCount
        }
      }
    });
  } catch (error) {
    console.error("Error fetching recycle bin stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch recycle bin statistics",
      error: error.message
    });
  }
};

module.exports = {
  getRecycleBinItems,
  restoreItem,
  permanentlyDeleteItem,
  emptyRecycleBin,
  getRecycleBinStats
};