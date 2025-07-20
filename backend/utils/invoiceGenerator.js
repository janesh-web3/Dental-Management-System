const Invoice = require("../model/Invoice");
const Patient = require("../model/Patient");
const Doctor = require("../model/Doctor");

/**
 * Generate unique invoice number
 */
const generateInvoiceNumber = async () => {
  try {
    const year = new Date().getFullYear().toString().substr(-2);
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const prefix = `INV-${year}${month}-`;
    
    // Find the highest existing invoice number for this month
    const existingInvoices = await Invoice.find({
      invoiceNumber: { $regex: `^${prefix}` }
    }).sort({ invoiceNumber: -1 }).limit(1);
    
    let nextNumber = 1;
    if (existingInvoices.length > 0) {
      const lastInvoiceNumber = existingInvoices[0].invoiceNumber;
      const lastNumber = parseInt(lastInvoiceNumber.split('-').pop());
      nextNumber = lastNumber + 1;
    }
    
    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
  } catch (error) {
    console.error("Error generating invoice number:", error);
    // Fallback to timestamp-based number
    return `INV-${Date.now()}`;
  }
};


/**
 * Create invoice for treatment payment
 */
const createTreatmentPaymentInvoice = async (patientId, doctorId, treatmentDetails, paymentDetails, createdBy) => {
  try {
    console.log(`Creating treatment payment invoice for patient: ${patientId}, doctor: ${doctorId}`);
    
    const patient = await Patient.findById(patientId);
    const doctor = await Doctor.findById(doctorId);
    
    if (!patient) {
      console.error(`Patient not found with ID: ${patientId}`);
      throw new Error(`Patient not found with ID: ${patientId}`);
    }

    console.log(`Patient found: ${patient.personalDetails?.name || 'Unknown'}`);
    console.log(`Doctor found: ${doctor?.name || 'Unknown'}`);
    console.log(`Treatment details count: ${Array.isArray(treatmentDetails) ? treatmentDetails.length : 1}`);
    console.log(`Payment details:`, paymentDetails);

    const items = [];
    let subtotal = 0;

    // Process treatment details
    if (Array.isArray(treatmentDetails)) {
      treatmentDetails.forEach(treatment => {
        const itemTotal = (treatment.treatmentAmount || 0);
        items.push({
          description: treatment.procedure || treatment.treatmentName || "Treatment",
          quantity: 1,
          unitPrice: itemTotal,
          discount: treatment.discount || 0,
          total: itemTotal - (treatment.discount || 0),
          treatmentType: treatment.treatmentType || 'general',
          treatmentModel: 'Treatment',
          teethNumbers: treatment.teethNumbers || [],
          notes: treatment.notes || ""
        });
        subtotal += itemTotal - (treatment.discount || 0);
      });
    } else if (treatmentDetails) {
      const itemTotal = treatmentDetails.treatmentAmount || treatmentDetails.amount || 0;
      items.push({
        description: treatmentDetails.procedure || treatmentDetails.treatmentName || "Treatment",
        quantity: 1,
        unitPrice: itemTotal,
        discount: treatmentDetails.discount || 0,
        total: itemTotal - (treatmentDetails.discount || 0),
        treatmentType: treatmentDetails.treatmentType || 'general',
        treatmentModel: 'Treatment',
        teethNumbers: treatmentDetails.teethNumbers || [],
        notes: treatmentDetails.notes || ""
      });
      subtotal = itemTotal - (treatmentDetails.discount || 0);
    }

    const totalDiscount = paymentDetails.discount || 0;
    const finalTotal = subtotal - totalDiscount;
    const amountPaid = paymentDetails.paidAmount || paymentDetails.amount || 0;

    const invoiceData = {
      patient: patientId,
      patientName: patient.personalDetails?.name || "Unknown Patient",
      doctor: doctorId,
      doctorName: doctor?.name || "Unknown Doctor",
      invoiceNumber: await generateInvoiceNumber(),
      invoiceDate: new Date(),
      dueDate: paymentDetails.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      items: items,
      subtotal: subtotal,
      tax: 0,
      taxRate: 0,
      discount: totalDiscount,
      total: finalTotal,
      amountPaid: amountPaid,
      balance: finalTotal - amountPaid,
      status: amountPaid >= finalTotal ? "Paid" : (amountPaid > 0 ? "Partially Paid" : "Sent"),
      paymentMethod: paymentDetails.paymentMethod || "Cash",
      notes: paymentDetails.notes || "Automatically generated invoice for treatment payment"
    };

    const invoice = await Invoice.create(invoiceData);
    return invoice;
  } catch (error) {
    console.error("Error creating treatment payment invoice:", error);
    throw error;
  }
};

/**
 * Create invoice for service payment
 */
const createServicePaymentInvoice = async (servicePaymentData, createdBy) => {
  try {
    let patient = null;
    let patientName = servicePaymentData.patientName;

    // Try to get patient details if patient ID is provided
    if (servicePaymentData.patient && servicePaymentData.patient !== 'null') {
      patient = await Patient.findById(servicePaymentData.patient);
      if (patient) {
        patientName = patient.personalDetails?.name || patientName;
      }
    }

    const invoiceData = {
      patient: patient?._id || null,
      patientName: patientName,
      doctor: null, // Service payments may not have specific doctor
      doctorName: "Service",
      invoiceNumber: await generateInvoiceNumber(),
      invoiceDate: new Date(),
      dueDate: new Date(), // Service payments are immediate
      items: [{
        description: `${servicePaymentData.serviceType}${servicePaymentData.description ? ` - ${servicePaymentData.description}` : ''}`,
        quantity: 1,
        unitPrice: servicePaymentData.amount,
        discount: 0,
        total: servicePaymentData.amount,
        treatmentType: 'general',
        treatmentModel: 'Treatment',
        notes: servicePaymentData.description || ""
      }],
      subtotal: servicePaymentData.amount,
      tax: 0,
      taxRate: 0,
      discount: 0,
      total: servicePaymentData.amount,
      amountPaid: servicePaymentData.amount,
      balance: 0,
      status: "Paid",
      paymentMethod: servicePaymentData.paymentMethod || "Cash",
      notes: servicePaymentData.isWalkIn ? 
        "Walk-in service payment - automatically generated invoice" :
        "Service payment - automatically generated invoice",
      sourceType: "ServicePayment",
      sourceId: servicePaymentData._id
    };

    const invoice = await Invoice.create(invoiceData);
    return invoice;
  } catch (error) {
    console.error("Error creating service payment invoice:", error);
    throw error;
  }
};

/**
 * Create invoice for income entry
 */
const createIncomeInvoice = async (incomeData, createdBy) => {
  try {
    const invoiceData = {
      patient: null,
      patientName: "General Income",
      doctor: null,
      doctorName: "Admin",
      invoiceNumber: await generateInvoiceNumber(),
      invoiceDate: new Date(),
      dueDate: new Date(),
      items: [{
        description: `Income - ${incomeData.category}: ${incomeData.title}`,
        quantity: 1,
        unitPrice: incomeData.amount,
        discount: 0,
        total: incomeData.amount,
        treatmentType: 'other',
        treatmentModel: 'Treatment',
        notes: incomeData.notes || ""
      }],
      subtotal: incomeData.amount,
      tax: 0,
      taxRate: 0,
      discount: 0,
      total: incomeData.amount,
      amountPaid: incomeData.amount,
      balance: 0,
      status: "Paid",
      paymentMethod: "Cash",
      notes: `Income entry - ${incomeData.category} - automatically generated invoice`,
      sourceType: "Income",
      sourceId: incomeData._id
    };

    const invoice = await Invoice.create(invoiceData);
    return invoice;
  } catch (error) {
    console.error("Error creating income invoice:", error);
    throw error;
  }
};

/**
 * Create invoice for expense entry (receipt)
 */
const createExpenseInvoice = async (expenseData, createdBy) => {
  try {
    const invoiceData = {
      patient: null,
      patientName: "Expense/Receipt",
      doctor: null,
      doctorName: "Admin",
      invoiceNumber: await generateInvoiceNumber(),
      invoiceDate: new Date(),
      dueDate: new Date(),
      items: [{
        description: `Expense - ${expenseData.category}: ${expenseData.title}`,
        quantity: 1,
        unitPrice: expenseData.amount,
        discount: 0,
        total: expenseData.amount,
        treatmentType: 'other',
        treatmentModel: 'Treatment',
        notes: expenseData.notes || ""
      }],
      subtotal: expenseData.amount,
      tax: 0,
      taxRate: 0,
      discount: 0,
      total: expenseData.amount,
      amountPaid: expenseData.amount,
      balance: 0,
      status: "Paid",
      paymentMethod: "Cash",
      notes: `Expense receipt - ${expenseData.category} - automatically generated`,
      sourceType: "Expense",
      sourceId: expenseData._id
    };

    const invoice = await Invoice.create(invoiceData);
    return invoice;
  } catch (error) {
    console.error("Error creating expense invoice:", error);
    throw error;
  }
};

/**
 * Update existing invoice (create revised version)
 */
const createRevisedInvoice = async (originalInvoiceId, updatedData, createdBy, reason) => {
  try {
    const originalInvoice = await Invoice.findById(originalInvoiceId);
    if (!originalInvoice) {
      throw new Error("Original invoice not found");
    }

    // Mark original invoice as revised
    await Invoice.findByIdAndUpdate(originalInvoiceId, {
      status: "Cancelled",
      notes: `${originalInvoice.notes || ""}\n\nREVISED: ${reason || 'Updated by admin'} on ${new Date().toISOString()}`
    });

    // Create new invoice with updated data
    const revisedInvoiceData = {
      ...originalInvoice.toObject(),
      _id: undefined,
      invoiceNumber: await generateInvoiceNumber(),
      invoiceDate: new Date(),
      ...updatedData,
      notes: `REVISED INVOICE (Original: ${originalInvoice.invoiceNumber})\nReason: ${reason || 'Updated by admin'}\n${updatedData.notes || originalInvoice.notes || ""}`
    };

    const revisedInvoice = await Invoice.create(revisedInvoiceData);
    return revisedInvoice;
  } catch (error) {
    console.error("Error creating revised invoice:", error);
    throw error;
  }
};

module.exports = {
  generateInvoiceNumber,
  createTreatmentPaymentInvoice,
  createServicePaymentInvoice,
  createIncomeInvoice,
  createExpenseInvoice,
  createRevisedInvoice
};