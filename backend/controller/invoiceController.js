const Invoice = require('../model/Invoice');
const PaymentLog = require('../model/PaymentLog');
const { generatePDF } = require('../utils/pdfGenerator');
const { sendInvoiceEmail } = require('../utils/emailService');

// @desc    Create a new invoice
// @route   POST /api/invoices
// @access  Private/Admin
exports.createInvoice = async (req, res) => {
  try {
    const { patient, doctor, items, paymentMethod, notes, treatmentPlan, orthoGroupId, installmentNumber, totalInstallments } = req.body;
    
    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const total = subtotal - (req.body.discount || 0);
    
    const invoice = new Invoice({
      ...req.body,
      patientName: req.body.patientName || 'Patient Name',
      doctorName: req.body.doctorName || 'Doctor Name',
      subtotal,
      total,
      balance: total, // Initially, balance equals total
      status: 'Draft',
      treatmentPlan,
      orthoGroupId,
      installmentNumber,
      totalInstallments
    });

    await invoice.save();
    
    // If payment is made, process it
    if (req.body.amountPaid > 0) {
      await processPayment(invoice, req.body.amountPaid, paymentMethod, req.user.id, notes);
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
      pdf: pdfBuffer.toString('base64')
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ success: false, error: 'Server error' });
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
      sortBy = 'invoiceDate',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};
    
    if (startDate || endDate) {
      query.invoiceDate = {};
      if (startDate) query.invoiceDate.$gte = new Date(startDate);
      if (endDate) query.invoiceDate.$lte = new Date(endDate);
    }
    
    if (patientId) query.patient = patientId;
    if (doctorId) query.doctor = doctorId;
    if (status) query.status = status;
    if (treatmentType) query['items.treatmentType'] = treatmentType;

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    
    const [invoices, total] = await Promise.all([
      Invoice.find(query)
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .populate('patient', 'name email phone')
        .populate('doctor', 'name')
        .lean(),
      Invoice.countDocuments(query)
    ]);

    res.json({
      success: true,
      count: invoices.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      data: invoices
    });
  } catch (error) {
    console.error('Error getting invoices:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Get single invoice
// @route   GET /api/invoices/:id
// @access  Private/Admin
exports.getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('patient', 'name email phone address')
      .populate('doctor', 'name email phone')
      .populate('treatmentPlan', 'name')
      .populate('orthoGroupId', 'name')
      .populate('paymentLogs');

    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    res.json({ success: true, data: invoice });
  } catch (error) {
    console.error('Error getting invoice:', error);
    res.status(500).json({ success: false, error: 'Server error' });
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
      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      updateData.subtotal = subtotal;
      updateData.total = subtotal - (updateData.discount || 0);
      updateData.balance = updateData.total - (updateData.amountPaid || 0);
    }
    
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      { ...updateData, $set: { items } },
      { new: true, runValidators: true }
    );

    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    res.json({ success: true, data: invoice });
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Delete invoice
// @route   DELETE /api/invoices/:id
// @access  Private/Admin
exports.deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }
    
    // Also delete associated payment logs
    await PaymentLog.deleteMany({ invoice: invoice._id });

    res.json({ success: true, data: {} });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Record payment for an invoice
// @route   POST /api/invoices/:id/payments
// @access  Private/Admin
exports.recordPayment = async (req, res) => {
  try {
    const { amount, paymentMethod, transactionId, notes } = req.body;
    
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }
    
    await processPayment(invoice, amount, paymentMethod, req.user.id, notes, transactionId);
    
    // Refresh the invoice to get updated data
    const updatedInvoice = await Invoice.findById(req.params.id)
      .populate('paymentLogs')
      .populate('patient', 'name email phone')
      .populate('doctor', 'name');
    
    // Generate and send receipt if requested
    if (req.body.sendReceipt) {
      const pdfBuffer = await generatePDF(updatedInvoice);
      await sendInvoiceEmail(updatedInvoice, pdfBuffer, 'payment_receipt');
    }
    
    res.json({ success: true, data: updatedInvoice });
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Get invoice PDF
// @route   GET /api/invoices/:id/pdf
// @access  Private/Admin
exports.getInvoicePdf = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('patient', 'name email phone address')
      .populate('doctor', 'name email phone')
      .populate('treatmentPlan', 'name');

    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    const pdfBuffer = await generatePDF(invoice);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`,
      'Content-Length': pdfBuffer.length
    });
    
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ success: false, error: 'Error generating PDF' });
  }
};

// Helper function to process payments
async function processPayment(invoice, amount, paymentMethod, processedById, notes, transactionId) {
  // Create payment log
  const paymentLog = new PaymentLog({
    invoice: invoice._id,
    amount,
    paymentMethod,
    transactionId,
    notes,
    processedBy: processedById,
    status: 'Completed'
  });
  
  await paymentLog.save();
  
  // Update invoice
  invoice.amountPaid = (invoice.amountPaid || 0) + amount;
  invoice.balance = invoice.total - invoice.amountPaid;
  
  // Update status based on payment
  if (invoice.balance <= 0) {
    invoice.status = 'Paid';
  } else if (invoice.amountPaid > 0) {
    invoice.status = 'Partially Paid';
  }
  
  await invoice.save();
  
  return invoice;
}
