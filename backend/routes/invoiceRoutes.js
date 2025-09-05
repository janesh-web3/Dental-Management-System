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
  downloadInvoicePdf
} = require('../controller/invoiceController');

const router = express.Router();

// Routes for invoices
router
  .route('/')
  .get(authenticateUser, authorizePermission('invoices', 'read'), getInvoices)
  .post(authenticateUser, authorizePermission('invoices', 'create'), createInvoice);

router
  .route('/:id')
  .get(authenticateUser, authorizePermission('invoices', 'read'), getInvoice);

// PDF generation
router.get('/:id/pdf', authenticateUser, authorizePermission('invoices', 'read'), downloadInvoicePdf);

module.exports = router;
