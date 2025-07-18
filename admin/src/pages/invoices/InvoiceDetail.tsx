import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Grid, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  TextField, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  DialogContentText, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Card,
  CardContent,
  Chip
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon, 
  Print as PrintIcon, 
  Email as EmailIcon, 
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  AttachMoney as AttachMoneyIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import axios from 'axios';

// Use environment variable or default to localhost
const API_BASE_URL = process.env.REACT_APP_API_URL || process.env.REACT_APP_API_URL_DEV || 'http://localhost:5000/api';
import { toast } from 'react-toastify';

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  treatmentType: string;
  teethNumbers?: string[];
  notes?: string;
}

interface PaymentLog {
  _id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  transactionId?: string;
  notes?: string;
  status: string;
}

interface Invoice {
  _id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  patient: {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  doctor: {
    _id: string;
    name: string;
  };
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  amountPaid: number;
  balance: number;
  status: string;
  paymentMethod?: string;
  notes?: string;
  paymentLogs: PaymentLog[];
  createdAt: string;
  updatedAt: string;
}

const InvoiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [openPaymentDialog, setOpenPaymentDialog] = useState<boolean>(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'Credit Card',
    transactionId: '',
    notes: ''
  });
  const [processing, setProcessing] = useState<boolean>(false);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/v1/invoices/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setInvoice(data.data);
    } catch (error) {
      console.error('Error fetching invoice:', error);
      toast.error('Failed to load invoice details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchInvoice();
    }
  }, [id]);

  const handlePaymentSubmit = async () => {
    try {
      setProcessing(true);
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/api/v1/invoices/${id}/payments`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: parseFloat(paymentData.amount) * 100, // Convert to cents
          paymentMethod: paymentData.paymentMethod,
          transactionId: paymentData.transactionId,
          notes: paymentData.notes,
          sendReceipt: true
        })
      });
      
      toast.success('Payment recorded successfully');
      setOpenPaymentDialog(false);
      fetchInvoice(); // Refresh invoice data
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
    } finally {
      setProcessing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    window.open(`${API_BASE_URL}/api/v1/invoices/${id}/pdf`, '_blank');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Paid':
        return <CheckCircleIcon color="success" />;
      case 'Partially Paid':
        return <ScheduleIcon color="warning" />;
      case 'Overdue':
        return <ErrorIcon color="error" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <AttachMoneyIcon />
      </Box>
    );
  }

  if (!invoice) {
    return (
      <Box textAlign="center" p={4}>
        <Typography variant="h6">Invoice not found</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mt: 2 }}
        >
          Back to Invoices
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }} className="print-content">
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          className="no-print"
        >
          Back to Invoices
        </Button>
        <Box className="no-print">
          <Button
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            title="Print"
          >
            Print
          </Button>
          <Button
            startIcon={<DownloadIcon />}
            onClick={handleDownloadPdf}
            title="Download PDF"
          >
            Download PDF
          </Button>
          <Button
            startIcon={<EmailIcon />}
            title="Email"
          >
            Email
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AttachMoneyIcon />}
            onClick={() => setOpenPaymentDialog(true)}
            disabled={invoice.status === 'Paid' || invoice.status === 'Cancelled'}
            sx={{ ml: 1 }}
          >
            Record Payment
          </Button>
        </Box>
      </Box>

      {/* Invoice Header */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h4" gutterBottom>
              {process.env.REACT_APP_CLINIC_NAME || 'Dental Clinic'}
            </Typography>
            <Typography>{process.env.REACT_APP_CLINIC_ADDRESS || '123 Dental Street'}</Typography>
            <Typography>Phone: {process.env.REACT_APP_CLINIC_PHONE || '(123) 456-7890'}</Typography>
            <Typography>Email: {process.env.REACT_APP_CLINIC_EMAIL || 'info@dentalclinic.com'}</Typography>
          </Grid>
          <Grid item xs={12} md={6} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Typography variant="h4" gutterBottom>
              INVOICE
            </Typography>
            <Typography><strong>Invoice #:</strong> {invoice.invoiceNumber}</Typography>
            <Typography><strong>Date:</strong> {format(new Date(invoice.invoiceDate), 'MMM dd, yyyy')}</Typography>
            <Typography><strong>Due Date:</strong> {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</Typography>
            <Box mt={1}>
              <Chip
                icon={getStatusIcon(invoice.status)}
                label={invoice.status}
                color={
                  invoice.status === 'Paid' ? 'success' :
                  invoice.status === 'Partially Paid' ? 'warning' :
                  invoice.status === 'Overdue' ? 'error' : 'default'
                }
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Bill To & Doctor Info */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Bill To</Typography>
            <Typography><strong>{invoice.patient.name}</strong></Typography>
            {invoice.patient.address && <Typography>{invoice.patient.address}</Typography>}
            {invoice.patient.email && <Typography>Email: {invoice.patient.email}</Typography>}
            {invoice.patient.phone && <Typography>Phone: {invoice.patient.phone}</Typography>}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Doctor</Typography>
            <Typography><strong>{invoice.doctor.name}</strong></Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Invoice Items */}
      <Paper elevation={3} sx={{ mb: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Description</TableCell>
                <TableCell align="right">Unit Price</TableCell>
                <TableCell align="center">Qty</TableCell>
                <TableCell align="right">Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoice.items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Typography>{item.description}</Typography>
                    {item.notes && (
                      <Typography variant="body2" color="textSecondary">
                        {item.notes}
                      </Typography>
                    )}
                    {item.teethNumbers && item.teethNumbers.length > 0 && (
                      <Typography variant="body2" color="textSecondary">
                        Teeth: {item.teethNumbers.join(', ')}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
                  <TableCell align="center">{item.quantity}</TableCell>
                  <TableCell align="right">{formatCurrency(item.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Totals */}
      <Grid container justifyContent="flex-end" spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell><strong>Subtotal</strong></TableCell>
                  <TableCell align="right">{formatCurrency(invoice.subtotal)}</TableCell>
                </TableRow>
                {invoice.tax > 0 && (
                  <TableRow>
                    <TableCell><strong>Tax</strong></TableCell>
                    <TableCell align="right">{formatCurrency(invoice.tax)}</TableCell>
                  </TableRow>
                )}
                {invoice.discount > 0 && (
                  <TableRow>
                    <TableCell><strong>Discount</strong></TableCell>
                    <TableCell align="right">-{formatCurrency(invoice.discount)}</TableCell>
                  </TableRow>
                )}
                <TableRow>
                  <TableCell><strong>Total</strong></TableCell>
                  <TableCell align="right">{formatCurrency(invoice.total)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><strong>Amount Paid</strong></TableCell>
                  <TableCell align="right">{formatCurrency(invoice.amountPaid)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><strong>Balance Due</strong></TableCell>
                  <TableCell align="right">
                    <Typography variant="h6" color={invoice.balance > 0 ? 'error' : 'success'}>
                      {formatCurrency(invoice.balance)}
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Paper>
        </Grid>
      </Grid>

      {/* Payment History */}
      {invoice.paymentLogs && invoice.paymentLogs.length > 0 && (
        <Box mt={4}>
          <Typography variant="h6" gutterBottom>Payment History</Typography>
          <Paper elevation={3}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Payment Method</TableCell>
                    <TableCell>Transaction ID</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Notes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoice.paymentLogs.map((payment, index) => (
                    <TableRow key={index}>
                      <TableCell>{format(new Date(payment.paymentDate), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{payment.paymentMethod}</TableCell>
                      <TableCell>{payment.transactionId || 'N/A'}</TableCell>
                      <TableCell>{formatCurrency(payment.amount)}</TableCell>
                      <TableCell>
                        <Chip 
                          label={payment.status} 
                          size="small"
                          color={
                            payment.status === 'Completed' ? 'success' :
                            payment.status === 'Failed' ? 'error' : 'default'
                          }
                        />
                      </TableCell>
                      <TableCell>{payment.notes || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      )}

      {/* Notes */}
      {invoice.notes && (
        <Box mt={3}>
          <Typography variant="subtitle1">Notes</Typography>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography>{invoice.notes}</Typography>
          </Paper>
        </Box>
      )}

      {/* Payment Dialog */}
      <Dialog open={openPaymentDialog} onClose={() => setOpenPaymentDialog(false)}>
        <DialogTitle>Record Payment</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Amount"
                type="number"
                value={paymentData.amount}
                onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                disabled={processing}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  value={paymentData.paymentMethod}
                  label="Payment Method"
                  onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                  disabled={processing}
                >
                  <MenuItem value="Cash">Cash</MenuItem>
                  <MenuItem value="Credit Card">Credit Card</MenuItem>
                  <MenuItem value="Debit Card">Debit Card</MenuItem>
                  <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                  <MenuItem value="Check">Check</MenuItem>
                  <MenuItem value="Insurance">Insurance</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Transaction ID (Optional)"
                value={paymentData.transactionId}
                onChange={(e) => setPaymentData({ ...paymentData, transactionId: e.target.value })}
                disabled={processing}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes (Optional)"
                multiline
                rows={3}
                value={paymentData.notes}
                onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                disabled={processing}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPaymentDialog(false)} disabled={processing}>
            Cancel
          </Button>
          <Button 
            onClick={handlePaymentSubmit} 
            variant="contained" 
            color="primary"
            disabled={!paymentData.amount || processing}
          >
            {processing ? <AttachMoneyIcon /> : 'Record Payment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Print Styles */}
      <style>{`
        @page {
          size: A4;
          margin: 2cm;
        }
        @media print {
          body * {
            visibility: hidden;
          }
          .print-content, .print-content * {
            visibility: visible;
          }
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </Box>
  );
};

export default InvoiceDetail;
