const Invoice = require("../model/Invoice");

// @desc    Create a new invoice
// @route   POST /api/invoices
// @access  Private/Admin
exports.createInvoice = async (req, res) => {
  try {
    const {
      paidAmount,
      paymentMethod,
      sourceType,
      sourceId,
      patientId,
      date
    } = req.body;

    // Validate required fields
    if (!paidAmount || !paymentMethod || !sourceType || !sourceId) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: paidAmount, paymentMethod, sourceType, sourceId"
      });
    }

    // Validate sourceType
    const validSourceTypes = ["Income", "Expenses", "Services Payment", "Patients"];
    if (!validSourceTypes.includes(sourceType)) {
      return res.status(400).json({
        success: false,
        error: "Invalid sourceType. Must be one of: " + validSourceTypes.join(", ")
      });
    }

    // Validate paymentMethod
    const validPaymentMethods = ["cash", "card", "bank", "upi"];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        error: "Invalid paymentMethod. Must be one of: " + validPaymentMethods.join(", ")
      });
    }

    // If sourceType is Patients, patientId is required
    if (sourceType === "Patients" && !patientId) {
      return res.status(400).json({
        success: false,
        error: "patientId is required when sourceType is 'Patients'"
      });
    }

    const invoice = new Invoice({
      paidAmount,
      paymentMethod,
      sourceType,
      sourceId,
      patientId: sourceType === "Patients" ? patientId : undefined,
      date: date ? new Date(date) : new Date(),
    });

    await invoice.save();

    res.status(201).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    console.error("Error creating invoice:", error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// @desc    Get all invoices with filtering
// @route   GET /api/invoices
// @access  Private/Admin
exports.getInvoices = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      patientId,
      sourceType,
      search,
      page = 1,
      limit = 10,
      sortBy = "date",
      sortOrder = "desc",
    } = req.query;

    const query = { isDeleted: { $ne: true } };

    // Add search functionality
    if (search) {
      query.invoiceNumber = { $regex: search, $options: 'i' };
    }

    // Date filtering
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Filter by patientId
    if (patientId) query.patientId = patientId;

    // Filter by sourceType
    if (sourceType) query.sourceType = sourceType;

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    // Count total documents
    const total = await Invoice.countDocuments(query);

    // Get invoices with population
    const invoices = await Invoice.find(query)
      .populate('patientId', 'personalDetails.name personalDetails.contactNumber')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .exec();

    res.json({
      success: true,
      count: invoices.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      data: invoices,
    });
  } catch (error) {
    console.error("Error getting invoices:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// @desc    Get single invoice
// @route   GET /api/invoices/:id
// @access  Private/Admin
exports.getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      isDeleted: { $ne: true },
    }).populate('patientId', 'personalDetails.name personalDetails.contactNumber personalDetails.email');

    if (!invoice) {
      return res
        .status(404)
        .json({ success: false, error: "Invoice not found" });
    }

    // Populate source data based on sourceType
    let sourceData = null;
    if (invoice.sourceType === "Income") {
      const Income = require("../model/Income");
      sourceData = await Income.findById(invoice.sourceId);
    } else if (invoice.sourceType === "Expenses") {
      const Expense = require("../model/Expense");
      sourceData = await Expense.findById(invoice.sourceId);
    } else if (invoice.sourceType === "Services Payment") {
      const ServicePayment = require("../model/ServicePayment");
      sourceData = await ServicePayment.findById(invoice.sourceId);
    } else if (invoice.sourceType === "Patients") {
      const Patient = require("../model/Patient");
      sourceData = await Patient.findById(invoice.sourceId);
    }

    // Add source data to the response
    const invoiceData = invoice.toObject();
    invoiceData.sourceData = sourceData;

    res.json({ success: true, data: invoiceData });
  } catch (error) {
    console.error("Error getting invoice:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// @desc    Download invoice as PDF
// @route   GET /api/invoices/:id/pdf
// @access  Private/Admin
exports.downloadInvoicePdf = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      isDeleted: { $ne: true },
    }).populate('patientId', 'personalDetails.name personalDetails.contactNumber personalDetails.email personalDetails.address');

    if (!invoice) {
      return res
        .status(404)
        .json({ success: false, error: "Invoice not found" });
    }

    // Generate a simple PDF (you can use a library like puppeteer or jsPDF)
    const pdfContent = `
      Invoice: ${invoice.invoiceNumber}
      Date: ${invoice.date.toLocaleDateString()}
      Amount: $${invoice.paidAmount}
      Payment Method: ${invoice.paymentMethod}
      Source Type: ${invoice.sourceType}
      ${invoice.patientId ? `Patient: ${invoice.patientId.personalDetails?.name || 'N/A'}` : ''}
    `;

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`,
    });

    // For now, return plain text (you should implement proper PDF generation)
    res.send(pdfContent);
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ success: false, error: "Error generating PDF" });
  }
};
