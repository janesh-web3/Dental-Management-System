const express = require('express');
const { 
  authenticateUser, 
  authorizePermission, 
  staffOrAdmin 
} = require("../middleware/rbacMiddleware");
const {
  createInvoice,
  getInvoices,
  getInvoice,
  updateInvoice,
  deleteInvoice,
  recordPayment,
  getInvoicePdf,
  sendInvoiceEmailPost
} = require('../controller/invoiceController');

const router = express.Router();

// Routes for invoices
router
  .route('/')
  .get(authenticateUser, authorizePermission('invoices', 'read'), getInvoices)
  .post(authenticateUser, authorizePermission('invoices', 'create'), createInvoice);

router
  .route('/:id')
  .get(authenticateUser, authorizePermission('invoices', 'read'), getInvoice)
  .put(authenticateUser, authorizePermission('invoices', 'update'), updateInvoice)
  .delete(authenticateUser, authorizePermission('invoices', 'delete'), deleteInvoice);

// Payment related routes
router.post('/:id/payments', authenticateUser, authorizePermission('invoices', 'update'), recordPayment);

// PDF generation
router.get('/:id/pdf', authenticateUser, authorizePermission('invoices', 'read'), getInvoicePdf);

// Email sending
router.post('/:id/email', authenticateUser, authorizePermission('invoices', 'update'), sendInvoiceEmailPost);

// Statistics and reports
router.get('/stats/overview', authenticateUser, staffOrAdmin, async (req, res) => {
  // Implementation for invoice statistics
  res.json({ success: true, data: {} });
});

module.exports = router;
