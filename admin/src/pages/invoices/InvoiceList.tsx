import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  Search, 
  Mail,
  Download,
  Filter,
  Plus,
  Eye
} from 'lucide-react';

// ShadCN UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { server, dentalName, dentalAddress } from '@/server';
import { crudRequest } from '@/lib/api';

// Use environment variable or default to localhost
interface Invoice {
  _id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  patientName: string;
  total: number;
  amountPaid: number;
  balance: number;
  status: string;
  paymentMethod?: string;
  sourceType?: string; // Income, Expense, ServicePayment, etc.
}

const InvoiceList: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [totalInvoices, setTotalInvoices] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{
    startDate: string;
    endDate: string;
  }>({
    startDate: '',
    endDate: ''
  });

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'Draft', label: 'Draft' },
    { value: 'Sent', label: 'Sent' },
    { value: 'Paid', label: 'Paid' },
    { value: 'Partially Paid', label: 'Partially Paid' },
    { value: 'Overdue', label: 'Overdue' },
    { value: 'Cancelled', label: 'Cancelled' },
  ];

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: rowsPerPage.toString(),
        search: searchTerm,
        status: statusFilter !== 'all' ? statusFilter : '',
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });

      const response = await crudRequest<any>("GET",`${server}/invoices?${params}`);
      setInvoices(response.data);
      setTotalInvoices(response.data.total || 0);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [page, rowsPerPage, statusFilter, searchTerm, dateRange]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (value: string) => {
    setRowsPerPage(parseInt(value, 10));
    setPage(1);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(1);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
    setPage(1);
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
      case 'Draft':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
    }).format(amount); // Assuming amounts are stored in cents
  };

  const getAmountColor = (sourceType?: string) => {
    switch (sourceType) {
      case 'Income':
        return 'text-green-600 font-medium';
      case 'Expense':
        return 'text-red-600 font-medium';
      default:
        return 'font-medium';
    }
  };

  const handleDownloadPDF = async (invoiceId: string, invoiceNumber: string) => {
    try {
      // First fetch the invoice details
      const invoiceResponse = await crudRequest<any>('GET', `${server}/invoices/${invoiceId}`);
      const invoice = invoiceResponse.data;

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Generate PDF content
      const generateInvoicePDF = () => {
        // Create a new window for printing
        const printWindow = window.open('', '_blank');
        
        if (!printWindow) {
          throw new Error('Could not open print window');
        }

        const logoUrl = '/logo.jpg'; // Logo from public folder
        
        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invoiceNumber}</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: white;
            color: #333;
        }
        .invoice-container { 
            max-width: 800px; 
            margin: 0 auto; 
            border: 1px solid #ddd;
            padding: 30px;
        }
        .header { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin-bottom: 30px;
            border-bottom: 2px solid #0066cc;
            padding-bottom: 20px;
        }
        .clinic-info { 
            flex: 1; 
        }
        .clinic-name { 
            font-size: 24px; 
            font-weight: bold; 
            color: #0066cc;
            margin-bottom: 5px;
        }
        .clinic-address { 
            color: #666; 
            font-size: 14px;
        }
        .logo { 
            width: 80px; 
            height: 80px; 
            object-fit: contain;
        }
        .invoice-title { 
            text-align: center; 
            font-size: 28px; 
            font-weight: bold; 
            color: #0066cc;
            margin: 20px 0;
        }
        .invoice-details { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 30px;
        }
        .bill-to, .invoice-info { 
            flex: 1; 
        }
        .bill-to { 
            margin-right: 30px; 
        }
        .section-title { 
            font-weight: bold; 
            color: #0066cc;
            margin-bottom: 10px;
            border-bottom: 1px solid #eee;
            padding-bottom: 5px;
        }
        .info-line { 
            margin-bottom: 5px; 
        }
        .items-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 30px;
        }
        .items-table th, .items-table td { 
            border: 1px solid #ddd; 
            padding: 12px; 
            text-align: left;
        }
        .items-table th { 
            background-color: #f8f9fa; 
            font-weight: bold;
            color: #0066cc;
        }
        .text-right { 
            text-align: right; 
        }
        .totals { 
            margin-left: auto; 
            width: 300px;
        }
        .total-row { 
            display: flex; 
            justify-content: space-between; 
            padding: 8px 0;
        }
        .total-row.final { 
            border-top: 2px solid #0066cc; 
            font-weight: bold; 
            font-size: 18px;
            color: #0066cc;
            margin-top: 10px;
            padding-top: 10px;
        }
        .payment-info { 
            margin-top: 20px; 
            padding: 15px; 
            background-color: #f8f9fa;
            border-left: 4px solid #0066cc;
        }
        .status-badge { 
            display: inline-block; 
            padding: 4px 8px; 
            border-radius: 4px; 
            font-size: 12px; 
            font-weight: bold;
        }
        .status-paid { background-color: #d4edda; color: #155724; }
        .status-partial { background-color: #fff3cd; color: #856404; }
        .status-unpaid { background-color: #f8d7da; color: #721c24; }
        .income-amount { color: #28a745; font-weight: bold; }
        .expense-amount { color: #dc3545; font-weight: bold; }
        .footer { 
            margin-top: 30px; 
            text-align: center; 
            font-size: 12px; 
            color: #666;
            border-top: 1px solid #eee;
            padding-top: 15px;
        }
        
        @media print {
            body { margin: 0; }
            .invoice-container { border: none; }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <!-- Header -->
        <div class="header">
            <div class="clinic-info">
                <div class="clinic-name">${dentalName}</div>
                <div class="clinic-address">${dentalAddress}</div>
            </div>
            <img src="${logoUrl}" alt="Clinic Logo" class="logo" onerror="this.style.display='none'">
        </div>

        <!-- Invoice Title -->
        <div class="invoice-title">INVOICE</div>

        <!-- Invoice Details -->
        <div class="invoice-details">
            <div class="bill-to">
                <div class="section-title">Bill To:</div>
                <div class="info-line"><strong>${invoice.patientName}</strong></div>
                ${invoice.patient?.personalDetails?.email ? `<div class="info-line">Email: ${invoice.patient.personalDetails.email}</div>` : ''}
                ${invoice.patient?.personalDetails?.phone ? `<div class="info-line">Phone: ${invoice.patient.personalDetails.phone}</div>` : ''}
                ${invoice.patient?.personalDetails?.address ? `<div class="info-line">Address: ${invoice.patient.personalDetails.address}</div>` : ''}
                ${invoice.sourceType ? `<div class="info-line"><em>Type: ${invoice.sourceType}</em></div>` : ''}
            </div>
            
            <div class="invoice-info">
                <div class="section-title">Invoice Information:</div>
                <div class="info-line"><strong>Invoice #:</strong> ${invoice.invoiceNumber}</div>
                <div class="info-line"><strong>Date:</strong> ${format(new Date(invoice.invoiceDate), 'MMM dd, yyyy')}</div>
                <div class="info-line"><strong>Due Date:</strong> ${format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</div>
                <div class="info-line">
                    <strong>Status:</strong> 
                    <span class="status-badge ${invoice.status === 'Paid' ? 'status-paid' : invoice.status === 'Partially Paid' ? 'status-partial' : 'status-unpaid'}">
                        ${invoice.status}
                    </span>
                </div>
                ${invoice.doctor?.name || invoice.doctorName ? `<div class="info-line"><strong>Doctor:</strong> ${invoice.doctor?.name || invoice.doctorName}</div>` : ''}
            </div>
        </div>

        <!-- Items Table -->
        <table class="items-table">
            <thead>
                <tr>
                    <th>Description</th>
                    <th class="text-right">Unit Price</th>
                    <th class="text-right">Qty</th>
                    <th class="text-right">Total</th>
                </tr>
            </thead>
            <tbody>
                ${invoice.items.map(item => `
                <tr>
                    <td>
                        <strong>${item.description}</strong>
                        ${item.notes ? `<br><small style="color: #666;">${item.notes}</small>` : ''}
                        ${item.teethNumbers && item.teethNumbers.length > 0 ? `<br><small style="color: #666;">Teeth: ${item.teethNumbers.join(', ')}</small>` : ''}
                    </td>
                    <td class="text-right">${formatCurrency(item.unitPrice)}</td>
                    <td class="text-right">${item.quantity}</td>
                    <td class="text-right ${invoice.sourceType === 'Income' ? 'income-amount' : invoice.sourceType === 'Expense' ? 'expense-amount' : ''}">${formatCurrency(item.total)}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>

        <!-- Totals -->
        <div class="totals">
            <div class="total-row">
                <span>Subtotal:</span>
                <span class="${invoice.sourceType === 'Income' ? 'income-amount' : invoice.sourceType === 'Expense' ? 'expense-amount' : ''}">${formatCurrency(invoice.subtotal)}</span>
            </div>
            ${invoice.tax > 0 ? `
            <div class="total-row">
                <span>Tax:</span>
                <span>${formatCurrency(invoice.tax)}</span>
            </div>` : ''}
            ${invoice.discount > 0 ? `
            <div class="total-row">
                <span>Discount:</span>
                <span>-${formatCurrency(invoice.discount)}</span>
            </div>` : ''}
            <div class="total-row final">
                <span>Total:</span>
                <span class="${invoice.sourceType === 'Income' ? 'income-amount' : invoice.sourceType === 'Expense' ? 'expense-amount' : ''}">${formatCurrency(invoice.total)}</span>
            </div>
            <div class="total-row">
                <span>Amount Paid:</span>
                <span class="${invoice.sourceType === 'Income' ? 'income-amount' : invoice.sourceType === 'Expense' ? 'expense-amount' : ''}">${formatCurrency(invoice.amountPaid)}</span>
            </div>
        </div>

        <!-- Payment Information -->
        ${invoice.paymentMethod ? `
        <div class="payment-info">
            <strong>Payment Method:</strong> ${invoice.paymentMethod}
        </div>` : ''}

        <!-- Notes -->
        ${invoice.notes ? `
        <div style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 4px;">
            <strong>Notes:</strong><br>
            ${invoice.notes}
        </div>` : ''}

        <!-- Footer -->
        <div class="footer">
            <p>Thank you for choosing ${dentalName}</p>
            <p>This is a computer-generated invoice.</p>
        </div>
    </div>
    
    <script>
        window.onload = function() {
            window.print();
            window.onafterprint = function() {
                window.close();
            };
        };
    </script>
</body>
</html>`;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
      };

      generateInvoicePDF();

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate invoice PDF. Please try again.');
    }
  };

  const handleSendEmail = async (invoiceId: string, invoiceNumber: string) => {
    const recipientEmail = prompt(`Enter email address to send invoice ${invoiceNumber}:`);
    
    if (!recipientEmail) {
      return; // User cancelled
    }

    if (!recipientEmail.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }

    try {
      const response = await crudRequest<any>("POST", `/invoices/${invoiceId}/email`, {
        recipientEmail,
        subject: `Invoice ${invoiceNumber}`,
        message: `Please find attached your invoice ${invoiceNumber}.`
      });

      if (response.success) {
        alert(`Invoice sent successfully to ${recipientEmail}`);
      } else {
        throw new Error(response.error || 'Failed to send email');
      }
    } catch (error: any) {
      console.error('Error sending invoice email:', error);
      alert(`Failed to send email: ${error.message || 'Unknown error'}`);
    }
  };

  const totalPages = Math.ceil(totalInvoices / rowsPerPage);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">Manage and track all your invoices</p>
        </div>
        <Button asChild>
          <Link to="/finance/invoices/new">
            <Plus className="mr-2 h-4 w-4" />
            New Invoice
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">From Date</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">To Date</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <span className="ml-2">Loading...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="text-muted-foreground">
                      No invoices found
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice) => (
                  <TableRow key={invoice._id} className="hover:bg-muted/50">
                    <TableCell>
                      <Link 
                        to={`/finance/invoices/${invoice._id}`} 
                        className="text-primary hover:underline font-medium"
                      >
                        {invoice.invoiceNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {format(new Date(invoice.invoiceDate), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell className="font-medium">{invoice.patientName}</TableCell>
                    <TableCell className={`text-right ${getAmountColor(invoice.sourceType)}`}>
                      {formatCurrency(invoice.total)}
                    </TableCell>
                    <TableCell className={`text-right ${getAmountColor(invoice.sourceType)}`}>
                      {formatCurrency(invoice.amountPaid)}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {invoice.paymentMethod || 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(invoice.status)}>
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/finance/invoices/${invoice._id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDownloadPDF(invoice._id, invoice.invoiceNumber)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleSendEmail(invoice._id, invoice.invoiceNumber)}
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label>Rows per page:</Label>
            <Select value={rowsPerPage.toString()} onValueChange={handleRowsPerPageChange}>
              <SelectTrigger className="w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              Showing {((page - 1) * rowsPerPage) + 1} to {Math.min(page * rowsPerPage, totalInvoices)} of {totalInvoices} results
            </span>
          </div>
          
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => page > 1 && handlePageChange(page - 1)}
                  className={page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNumber = i + 1;
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      onClick={() => handlePageChange(pageNumber)}
                      isActive={page === pageNumber}
                      className="cursor-pointer"
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              {totalPages > 5 && <PaginationEllipsis />}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => page < totalPages && handlePageChange(page + 1)}
                  className={page >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default InvoiceList;