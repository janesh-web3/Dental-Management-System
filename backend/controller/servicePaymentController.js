const ServicePayment = require("../model/ServicePayment");
const Patient = require("../model/Patient");
const Income = require("../model/Income");

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

// Add new service payment
const addServicePayment = async (req, res) => {
  try {
    const { patientName, contactNumber, serviceType, description, amount, paymentMethod, patient } = req.body;
    
    // Validate required fields
    if (!patientName || !serviceType || !amount) {
      return res.status(400).json({
        success: false,
        message: "Patient name, service type, and amount are required",
      });
    }
    
    // Create new service payment
    const servicePayment = await ServicePayment.create({
      patientName,
      contactNumber,
      serviceType,
      description,
      amount,
      paymentMethod: paymentMethod || "Cash",
      createdBy: req.admin.id,
      patient: patient || null,
      date: new Date()
    });
    
    // Also record this as income for financial tracking
    await Income.create({
      title: `${serviceType} - ${patientName}`,
      amount,
      date: new Date(),
      category: serviceType === "X-Ray" ? "X-ray Fee" : 
                serviceType === "Medicine" ? "Dental Products" : 
                serviceType === "Consultation" ? "Consultation Fee" : "Other",
      notes: description || `Service payment for ${serviceType}`,
      createdBy: req.admin.id,
    });
    
    res.status(201).json({
      success: true,
      data: servicePayment,
      message: "Service payment added successfully",
    });
  } catch (error) {
    console.error("Error adding service payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add service payment",
      error: error.message,
    });
  }
};

// Get all service payments with optional filtering
const getServicePayments = async (req, res) => {
  try {
    const { startDate, endDate, patient, isWalkIn, page = 1, limit = 10, search = "" } = req.query;
    
    // Build query
    let query = {};
    
    // Apply date filter if provided
    if (startDate && endDate) {
      Object.assign(query, getDateFilter(startDate, endDate));
    }
    
    // Filter by patient if provided
    if (patient) {
      query.patient = patient;
    }
    
    // Filter by walk-in status if provided
    if (isWalkIn !== undefined) {
      query.isWalkIn = isWalkIn === 'true';
    }
    
    // Apply search if provided (search by patient name or service type)
    if (search) {
      query.$or = [
        { patientName: { $regex: search, $options: "i" } },
        { serviceType: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get service payments
    const servicePayments = await ServicePayment.find(query)
      .sort({ date: -1 }) // Sort by date (newest first)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("createdBy", "name email")
      .populate("patient", "personalDetails.name personalDetails.contactNumber");
    
    // Get total count
    const total = await ServicePayment.countDocuments(query);
    
    // Calculate total amount
    const totalAmount = await ServicePayment.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    
    // Calculate total pages
    const totalPages = Math.ceil(total / parseInt(limit));
    
    res.status(200).json({
      success: true,
      data: servicePayments,
      meta: {
        total,
        totalPages,
        currentPage: parseInt(page),
        totalAmount: totalAmount.length > 0 ? totalAmount[0].total : 0,
      },
    });
  } catch (error) {
    console.error("Error fetching service payments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch service payments",
      error: error.message,
    });
  }
};

// Get service payment by ID
const getServicePaymentById = async (req, res) => {
  try {
    const servicePayment = await ServicePayment.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("patient", "personalDetails.name personalDetails.contactNumber");
    
    if (!servicePayment) {
      return res.status(404).json({
        success: false,
        message: "Service payment not found",
      });
    }
    
    res.status(200).json({
      success: true,
      data: servicePayment,
    });
  } catch (error) {
    console.error("Error fetching service payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch service payment",
      error: error.message,
    });
  }
};

// Update service payment
const updateServicePayment = async (req, res) => {
  try {
    const { patientName, contactNumber, serviceType, description, amount, paymentMethod, patient } = req.body;
    
    // Find service payment
    let servicePayment = await ServicePayment.findById(req.params.id);
    
    if (!servicePayment) {
      return res.status(404).json({
        success: false,
        message: "Service payment not found",
      });
    }
    
    // Only allow admin, superadmin, or the user who created the record to update it
    if (
      req.admin.role !== "admin" &&
      req.admin.role !== "superadmin" &&
      servicePayment.createdBy.toString() !== req.admin.id
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this record",
      });
    }
    
    // Update service payment
    servicePayment = await ServicePayment.findByIdAndUpdate(
      req.params.id,
      {
        patientName: patientName || servicePayment.patientName,
        contactNumber: contactNumber || servicePayment.contactNumber,
        serviceType: serviceType || servicePayment.serviceType,
        description: description !== undefined ? description : servicePayment.description,
        amount: amount || servicePayment.amount,
        paymentMethod: paymentMethod || servicePayment.paymentMethod,
        patient: patient || servicePayment.patient,
        isWalkIn: !patient
      },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: servicePayment,
      message: "Service payment updated successfully",
    });
  } catch (error) {
    console.error("Error updating service payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update service payment",
      error: error.message,
    });
  }
};

// Delete service payment
const deleteServicePayment = async (req, res) => {
  try {
    const servicePayment = await ServicePayment.findById(req.params.id);
    
    if (!servicePayment) {
      return res.status(404).json({
        success: false,
        message: "Service payment not found",
      });
    }
    
    // Only allow admin, superadmin, or the user who created the record to delete it
    if (
      req.admin.role !== "admin" &&
      req.admin.role !== "superadmin" &&
      servicePayment.createdBy.toString() !== req.admin.id
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this record",
      });
    }
    
    await ServicePayment.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: "Service payment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting service payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete service payment",
      error: error.message,
    });
  }
};

// Get service payments by patient
const getPatientServicePayments = async (req, res) => {
  try {
    const patientId = req.params.patientId;
    
    // Validate patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }
    
    // Get all service payments for this patient
    const servicePayments = await ServicePayment.find({ patient: patientId })
      .sort({ date: -1 })
      .populate("createdBy", "name email");
    
    // Calculate total amount
    const totalAmount = await ServicePayment.aggregate([
      { $match: { patient: mongoose.Types.ObjectId(patientId) } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    
    res.status(200).json({
      success: true,
      data: servicePayments,
      meta: {
        total: servicePayments.length,
        totalAmount: totalAmount.length > 0 ? totalAmount[0].total : 0,
      },
    });
  } catch (error) {
    console.error("Error fetching patient service payments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch patient service payments",
      error: error.message,
    });
  }
};

// Get service payment summary
const getServicePaymentSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Build query
    let query = {};
    
    // Apply date filter if provided
    if (startDate && endDate) {
      Object.assign(query, getDateFilter(startDate, endDate));
    }
    
    // Get total service payment amount
    const totalAmount = await ServicePayment.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    
    // Get service payments by type
    const byServiceType = await ServicePayment.aggregate([
      { $match: query },
      { $group: { _id: "$serviceType", total: { $sum: "$amount" } } },
      { $sort: { total: -1 } },
    ]);
    
    // Get walk-in vs registered patient payments
    const byPatientType = await ServicePayment.aggregate([
      { $match: query },
      { $group: { _id: "$isWalkIn", total: { $sum: "$amount" } } },
      { $project: {
          _id: 0,
          type: { $cond: { if: "$_id", then: "Walk-in", else: "Registered" } },
          total: 1
        }
      }
    ]);
    
    // Get recent service payments (last 5)
    const recentPayments = await ServicePayment.find(query)
      .sort({ date: -1 })
      .limit(5)
      .populate("createdBy", "name")
      .populate("patient", "personalDetails.name");
    
    res.status(200).json({
      success: true,
      data: {
        totalAmount: totalAmount.length > 0 ? totalAmount[0].total : 0,
        byServiceType,
        byPatientType,
        recentPayments,
      },
    });
  } catch (error) {
    console.error("Error fetching service payment summary:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch service payment summary",
      error: error.message,
    });
  }
};

module.exports = {
  addServicePayment,
  getServicePayments,
  getServicePaymentById,
  updateServicePayment,
  deleteServicePayment,
  getPatientServicePayments,
  getServicePaymentSummary,
}; 