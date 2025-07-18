const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  createInvoice,
  getInvoices,
  getInvoice,
  updateInvoice,
  deleteInvoice,
  recordPayment,
  getInvoicePdf
} = require('../controller/invoiceController');

const router = express.Router();

// Apply protect and admin authorization to all routes
router.use(protect);
router.use(authorize('admin', 'doctor'));

// Routes for invoices
router
  .route('/')
  .get(getInvoices)
  .post(createInvoice);

router
  .route('/:id')
  .get(getInvoice)
  .put(updateInvoice)
  .delete(deleteInvoice);

// Payment related routes
router.post('/:id/payments', recordPayment);

// PDF generation
router.get('/:id/pdf', getInvoicePdf);

// Statistics and reports
router.get('/stats/overview', async (req, res) => {
  // Implementation for invoice statistics
  res.json({ success: true, data: {} });
});

module.exports = router;
