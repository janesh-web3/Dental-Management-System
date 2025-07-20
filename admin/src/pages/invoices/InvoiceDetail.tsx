import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { 
  ArrowLeft, 
  Mail, 
  Download,
  CheckCircle,
  AlertCircle,
  Clock,
  DollarSign,
  Loader2,
  PrinterIcon
} from 'lucide-react';

// ShadCN UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { server } from '@/server';
import { crudRequest } from '@/lib/api';

// Use environment variable or default to localhost

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
  patient?: {
    _id: string;
    personalDetails: {
      name: string;
      email?: string;
      phone?: string;
      address?: string;
    };
  } | null;
  patientName: string; // For invoices without patient reference
  doctor?: {
    _id: string;
    name: string;
  } | null;
  doctorName: string; // For invoices without doctor reference
  sourceType?: string; // Income, Expense, ServicePayment, etc.
  sourceData?: any; // Source data for income/expense invoices
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
      const response = await crudRequest<any>('GET', `${server}/invoices/${id}`);
      console.log('Fetched invoice:', response.data);
      setInvoice(response.data);
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
      await crudRequest('POST', `${server}/invoices/${id}/payments`, {
        amount: parseFloat(paymentData.amount) * 100, // Convert to cents
        paymentMethod: paymentData.paymentMethod,
        transactionId: paymentData.transactionId,
        notes: paymentData.notes,
        sendReceipt: true
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
    window.open(`${server}/invoices/${id}/pdf`, '_blank');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
    }).format(amount);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Paid':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'Partially Paid':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'Overdue':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'Paid':
        return 'default';
      case 'Partially Paid':
        return 'secondary';
      case 'Overdue':
        return 'destructive';
      case 'Sent':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading invoice...</span>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center p-8">
        <div className="mb-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
          <h2 className="text-xl font-semibold">Invoice not found</h2>
        </div>
        <Button onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Invoices
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 print-content">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 no-print">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Invoices
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <PrinterIcon className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" onClick={handleDownloadPdf}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          <Button variant="outline">
            <Mail className="mr-2 h-4 w-4" />
            Email
          </Button>
          <Button
            onClick={() => setOpenPaymentDialog(true)}
            disabled={invoice.status === 'Paid' || invoice.status === 'Cancelled'}
          >
            <DollarSign className="mr-2 h-4 w-4" />
            Record Payment
          </Button>
        </div>
      </div>

      {/* Invoice Header */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h1 className="text-2xl font-bold mb-2">
                {'Dental Clinic'}
              </h1>
              <div className="text-muted-foreground space-y-1">
                <p>{'123 Dental Street'}</p>
                <p>Phone: {'(123) 456-7890'}</p>
                <p>Email: {'info@dentalclinic.com'}</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-bold mb-4">INVOICE</h2>
              <div className="space-y-2">
                <p><strong>Invoice #:</strong> {invoice.invoiceNumber}</p>
                <p><strong>Date:</strong> {format(new Date(invoice.invoiceDate), 'MMM dd, yyyy')}</p>
                <p><strong>Due Date:</strong> {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</p>
                <div className="mt-2">
                  <Badge variant={getStatusVariant(invoice.status)} className="inline-flex items-center gap-1">
                    {getStatusIcon(invoice.status)}
                    {invoice.status}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bill To & Doctor Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>
              {invoice.sourceType ? `${invoice.sourceType} Details` : 'Bill To'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {invoice.patient ? (
                // Patient invoice
                <>
                  <p className="font-semibold">{invoice.patient.personalDetails?.name}</p>
                  {invoice.patient.personalDetails?.address && <p>{invoice.patient.personalDetails.address}</p>}
                  {invoice.patient.personalDetails?.email && <p>Email: {invoice.patient.personalDetails.email}</p>}
                  {invoice.patient.personalDetails?.phone && <p>Phone: {invoice.patient.personalDetails.phone}</p>}
                </>
              ) : (
                // Income/Expense/Service invoice
                <>
                  <p className="font-semibold">{invoice.patientName}</p>
                  {invoice.sourceType && (
                    <p className="text-sm text-muted-foreground">
                      Type: {invoice.sourceType}
                    </p>
                  )}
                  {invoice.sourceData && (
                    <>
                      {invoice.sourceData.category && (
                        <p className="text-sm">Category: {invoice.sourceData.category}</p>
                      )}
                      {invoice.sourceData.title && (
                        <p className="text-sm">Title: {invoice.sourceData.title}</p>
                      )}
                      {invoice.sourceData.description && (
                        <p className="text-sm">Description: {invoice.sourceData.description}</p>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Doctor</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold">
              {invoice.doctor?.name || invoice.doctorName || 'N/A'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Invoice Items */}
      <Card className="mb-6">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-center">Qty</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.description}</p>
                      {item.notes && (
                        <p className="text-sm text-muted-foreground">{item.notes}</p>
                      )}
                      {item.teethNumbers && item.teethNumbers.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          Teeth: {item.teethNumbers.join(', ')}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(item.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Totals */}
      <div className="flex justify-end mb-6">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Subtotal</TableCell>
                  <TableCell className="text-right">{formatCurrency(invoice.subtotal)}</TableCell>
                </TableRow>
                {invoice.tax > 0 && (
                  <TableRow>
                    <TableCell className="font-medium">Tax</TableCell>
                    <TableCell className="text-right">{formatCurrency(invoice.tax)}</TableCell>
                  </TableRow>
                )}
                {invoice.discount > 0 && (
                  <TableRow>
                    <TableCell className="font-medium">Discount</TableCell>
                    <TableCell className="text-right">-{formatCurrency(invoice.discount)}</TableCell>
                  </TableRow>
                )}
                <TableRow>
                  <TableCell className="font-semibold">Total</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(invoice.total)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Amount Paid</TableCell>
                  <TableCell className="text-right">{formatCurrency(invoice.amountPaid)}</TableCell>
                </TableRow>
                <TableRow className="border-t-2">
                  <TableCell className="font-bold">Balance Due</TableCell>
                  <TableCell className="text-right">
                    <span className={`text-lg font-bold ${invoice.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(invoice.balance)}
                    </span>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Payment History */}
      {invoice.paymentLogs && invoice.paymentLogs.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.paymentLogs.map((payment, index) => (
                  <TableRow key={index}>
                    <TableCell>{format(new Date(payment.paymentDate), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{payment.paymentMethod}</TableCell>
                    <TableCell>{payment.transactionId || 'N/A'}</TableCell>
                    <TableCell>{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          payment.status === 'Completed' ? 'default' :
                          payment.status === 'Failed' ? 'destructive' : 'secondary'
                        }
                      >
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{payment.notes || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {invoice.notes && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{invoice.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Payment Dialog */}
      <Dialog open={openPaymentDialog} onOpenChange={setOpenPaymentDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Enter payment details for invoice {invoice.invoiceNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-muted-foreground">$</span>
                <Input
                  id="amount"
                  type="number"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                  disabled={processing}
                  className="pl-8"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select
                value={paymentData.paymentMethod}
                onValueChange={(value) => setPaymentData({ ...paymentData, paymentMethod: value })}
                disabled={processing}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Credit Card">Credit Card</SelectItem>
                  <SelectItem value="Debit Card">Debit Card</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Check">Check</SelectItem>
                  <SelectItem value="Insurance">Insurance</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="transactionId">Transaction ID (Optional)</Label>
              <Input
                id="transactionId"
                value={paymentData.transactionId}
                onChange={(e) => setPaymentData({ ...paymentData, transactionId: e.target.value })}
                disabled={processing}
                placeholder="Enter transaction ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={paymentData.notes}
                onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                disabled={processing}
                placeholder="Add any notes about this payment"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setOpenPaymentDialog(false)} 
              disabled={processing}
            >
              Cancel
            </Button>
            <Button 
              onClick={handlePaymentSubmit}
              disabled={!paymentData.amount || processing}
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recording...
                </>
              ) : (
                'Record Payment'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
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
    </div>
  );
};

export default InvoiceDetail;