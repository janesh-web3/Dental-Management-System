const Invoice = require("../model/Invoice");
const PaymentLog = require("../model/PaymentLog");
const { generatePDF } = require("../utils/pdfGenerator");
const { sendInvoiceEmail } = require("../utils/emailService");

// @desc    Create a new invoice
// @route   POST /api/invoices
// @access  Private/Admin
exports.createInvoice = async (req, res) => {
  try {
    const {
      patient,
      doctor,
      items,
      paymentMethod,
      notes,
      treatmentPlan,
      orthoGroupId,
      installmentNumber,
      totalInstallments,
    } = req.body;

    // Calculate totals
    const subtotal = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const total = subtotal - (req.body.discount || 0);

    const invoice = new Invoice({
      ...req.body,
      patientName: req.body.patientName || "Patient Name",
      doctorName: req.body.doctorName || "Doctor Name",
      subtotal,
      total,
      balance: total, // Initially, balance equals total
      status: "Draft",
      treatmentPlan,
      orthoGroupId,
      installmentNumber,
      totalInstallments,
    });

    await invoice.save();

    // If payment is made, process it
    if (req.body.amountPaid > 0) {
      await processPayment(
        invoice,
        req.body.amountPaid,
        paymentMethod,
        req.user._id,
        notes
      );
    }

    // Generate PDF
    const pdfBuffer = await generatePDF(invoice);

    // Send email if requested
    if (req.body.sendEmail) {
      await sendInvoiceEmail(invoice, pdfBuffer);
    }

    res.status(201).json({
      success: true,
      data: invoice,
      pdf: pdfBuffer.toString("base64"),
    });
  } catch (error) {
    console.error("Error creating invoice:", error);
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
      doctorId,
      status,
      treatmentType,
      page = 1,
      limit = 10,
      sortBy = "invoiceDate",
      sortOrder = "desc",
    } = req.query;

    const query = { isDeleted: { $ne: true } };

    if (startDate || endDate) {
      query.invoiceDate = {};
      if (startDate) query.invoiceDate.$gte = new Date(startDate);
      if (endDate) query.invoiceDate.$lte = new Date(endDate);
    }

    if (patientId) query.patient = patientId;
    if (doctorId) query.doctor = doctorId;
    if (status) query.status = status;
    if (treatmentType) query["items.treatmentType"] = treatmentType;

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const basePipeline = [
      { $match: query },
      {
        $lookup: {
          from: "patients",
          localField: "patient",
          foreignField: "_id",
          as: "patientData",
          pipeline: [{ $match: { isDeleted: { $ne: true } } }],
        },
      },
      {
        $lookup: {
          from: "doctors",
          localField: "doctor",
          foreignField: "_id",
          as: "doctorData",
          pipeline: [{ $project: { name: 1 } }],
        },
      },
      {
        $lookup: {
          from: "incomes",
          localField: "sourceId",
          foreignField: "_id",
          as: "incomeSource",
          pipeline: [{ $match: { isDeleted: { $ne: true } } }],
        },
      },
      {
        $lookup: {
          from: "expenses",
          localField: "sourceId",
          foreignField: "_id",
          as: "expenseSource",
          pipeline: [{ $match: { isDeleted: { $ne: true } } }],
        },
      },
      {
        $lookup: {
          from: "servicepayments",
          localField: "sourceId",
          foreignField: "_id",
          as: "servicePaymentSource",
          pipeline: [{ $match: { isDeleted: { $ne: true } } }],
        },
      },
      // Add a field to check if patient is valid (exists and not deleted)
      {
        $addFields: {
          hasValidPatient: {
            $cond: {
              if: { $eq: ["$patient", null] }, // If patient is null
              then: true, // Consider it valid (for income/expense invoices)
              else: { $gt: [{ $size: "$patientData" }, 0] }, // Check if patient exists and is not deleted
            },
          },
        },
      },
      {
        $match: {
          $or: [
            // Case 1: Invoices without patient reference (income/expense invoices)
            { patient: null },

            // Case 2: Invoices with valid patient reference
            { hasValidPatient: true },

            // Case 3: Income source invoices (with sourceType)
            {
              $and: [
                { sourceType: "Income" },
                { "incomeSource.0": { $exists: true } },
              ],
            },

            // Case 4: Expense source invoices (with sourceType)
            {
              $and: [
                { sourceType: "Expense" },
                { "expenseSource.0": { $exists: true } },
              ],
            },

            // Case 5: Service payment source invoices (with sourceType)
            {
              $and: [
                { sourceType: "ServicePayment" },
                { "servicePaymentSource.0": { $exists: true } },
              ],
            },
          ],
        },
      },
    ];

    const invoicePipeline = [
      ...basePipeline,
      {
        $project: {
          _id: 1,
          invoiceNumber: 1,
          invoiceDate: 1,
          dueDate: 1,
          patientName: 1,
          doctorName: 1,
          total: 1,
          amountPaid: 1,
          balance: 1,
          status: 1,
          paymentMethod: 1,
          notes: 1,
          sourceType: 1,
          sourceId: 1,
          patient: { $arrayElemAt: ["$patientData", 0] },
          doctor: { $arrayElemAt: ["$doctorData", 0] },
          createdAt: 1,
          updatedAt: 1,
        },
      },
      { $sort: sort },
      { $skip: skip },
      { $limit: Number(limit) },
    ];

    const countPipeline = [...basePipeline, { $count: "total" }];

    const [invoices, totalCountResult] = await Promise.all([
      Invoice.aggregate(invoicePipeline),
      Invoice.aggregate(countPipeline),
    ]);

    const total = totalCountResult[0]?.total || 0;

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
    })
      .populate("patient", "name email phone address")
      .populate("doctor", "name email phone")
      .populate("treatmentPlan", "name")
      .populate("orthoGroupId", "name")
      .populate("paymentLogs")
      .populate("patient", "personalDetails name email phone");

    console.log("Fetched invoice:", invoice);
    if (!invoice || !invoice.patient || invoice.patient.isDeleted) {
      return res
        .status(404)
        .json({ success: false, error: "Invoice or patient not found" });
    }

    res.json({ success: true, data: invoice });
  } catch (error) {
    console.error("Error getting invoice:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// @desc    Update invoice
// @route   PUT /api/invoices/:id
// @access  Private/Admin
exports.updateInvoice = async (req, res) => {
  try {
    const { items, paymentMethod, notes, ...updateData } = req.body;

    // Recalculate totals if items are updated
    if (items) {
      const subtotal = items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      );
      updateData.subtotal = subtotal;
      updateData.total = subtotal - (updateData.discount || 0);
      updateData.balance = updateData.total - (updateData.amountPaid || 0);
    }

    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, isDeleted: { $ne: true } },
      { ...updateData, $set: { items } },
      { new: true, runValidators: true }
    );

    if (!invoice) {
      return res
        .status(404)
        .json({ success: false, error: "Invoice not found" });
    }

    res.json({ success: true, data: invoice });
  } catch (error) {
    console.error("Error updating invoice:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// @desc    Delete invoice
// @route   DELETE /api/invoices/:id
// @access  Private/Admin
exports.deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, isDeleted: { $ne: true } },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );

    if (!invoice) {
      return res
        .status(404)
        .json({ success: false, error: "Invoice not found" });
    }

    // Also delete associated payment logs
    await PaymentLog.deleteMany({ invoice: invoice._id });

    res.json({ success: true, data: {} });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// @desc    Record payment for an invoice
// @route   POST /api/invoices/:id/payments
// @access  Private/Admin
exports.recordPayment = async (req, res) => {
  try {
    const { amount, paymentMethod, transactionId, notes } = req.body;

    const invoice = await Invoice.findOne({
      _id: req.params.id,
      isDeleted: { $ne: true },
    });
    if (!invoice) {
      return res
        .status(404)
        .json({ success: false, error: "Invoice not found" });
    }

    await processPayment(
      invoice,
      amount,
      paymentMethod,
      req.user._id,
      notes,
      transactionId
    );

    // Refresh the invoice to get updated data
    const updatedInvoice = await Invoice.findOne({
      _id: req.params.id,
      isDeleted: { $ne: true },
    })
      .populate("paymentLogs")
      .populate("patient", "name email phone")
      .populate("doctor", "name");

    // Generate and send receipt if requested
    if (req.body.sendReceipt) {
      const pdfBuffer = await generatePDF(updatedInvoice);
      await sendInvoiceEmail(updatedInvoice, pdfBuffer, "payment_receipt");
    }

    res.json({ success: true, data: updatedInvoice });
  } catch (error) {
    console.error("Error recording payment:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// @desc    Get invoice PDF
// @route   GET /api/invoices/:id/pdf
// @access  Private/Admin
exports.getInvoicePdf = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      isDeleted: { $ne: true },
    })
      .populate("patient", "name email phone address")
      .populate("doctor", "name email phone")
      .populate("treatmentPlan", "name");

    if (!invoice) {
      return res
        .status(404)
        .json({ success: false, error: "Invoice not found" });
    }

    const pdfBuffer = await generatePDF(invoice);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`,
      "Content-Length": pdfBuffer.length,
    });

    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ success: false, error: "Error generating PDF" });
  }
};

// @desc    Send invoice email
// @route   POST /api/invoices/:id/email
// @access  Private/Admin
exports.sendInvoiceEmailPost = async (req, res) => {
  try {
    const { recipientEmail, subject, message } = req.body;

    const invoice = await Invoice.findOne({
      _id: req.params.id,
      isDeleted: { $ne: true },
    })
      .populate("patient", "name email phone address")
      .populate("doctor", "name email phone")
      .populate("treatmentPlan", "name");

    if (!invoice) {
      return res
        .status(404)
        .json({ success: false, error: "Invoice not found" });
    }

    // Use patient email if no recipient email provided
    const emailTo =
      recipientEmail || invoice.patient?.email || invoice.patientName;

    if (!emailTo) {
      return res.status(400).json({
        success: false,
        error: "No recipient email found. Please provide an email address.",
      });
    }

    // Generate PDF for attachment
    const pdfBuffer = await generatePDF(invoice);

    // Send email with invoice
    await sendInvoiceEmail(invoice, pdfBuffer, "invoice", {
      to: emailTo,
      subject: subject || `Invoice ${invoice.invoiceNumber}`,
      message:
        message ||
        `Please find attached your invoice ${invoice.invoiceNumber}.`,
    });

    res.json({
      success: true,
      message: `Invoice email sent successfully to ${emailTo}`,
    });
  } catch (error) {
    console.error("Error sending invoice email:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to send invoice email",
    });
  }
};

// Helper function to process payments
async function processPayment(
  invoice,
  amount,
  paymentMethod,
  processedById,
  notes,
  transactionId
) {
  // Create payment log
  const paymentLog = new PaymentLog({
    invoice: invoice._id,
    amount,
    paymentMethod,
    transactionId,
    notes,
    processedBy: processedById,
    status: "Completed",
  });

  await paymentLog.save();

  // Update invoice
  invoice.amountPaid = (invoice.amountPaid || 0) + amount;
  invoice.balance = invoice.total - invoice.amountPaid;

  // Update status based on payment
  if (invoice.balance <= 0) {
    invoice.status = "Paid";
  } else if (invoice.amountPaid > 0) {
    invoice.status = "Partially Paid";
  }

  await invoice.save();

  return invoice;
}
