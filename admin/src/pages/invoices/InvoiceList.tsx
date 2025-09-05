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
  date: string;
  paidAmount: number;
  paymentMethod: string;
  sourceType: "Income" | "Expenses" | "Services Payment" | "Patients";
  sourceId: string;
  patientId?: {
    _id: string;
    personalDetails: {
      name: string;
      contactNumber: string;
      email?: string;
    };
  };
  sourceData?: any;
}

const InvoiceList: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [totalInvoices, setTotalInvoices] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sourceTypeFilter, setSourceTypeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{
    startDate: string;
    endDate: string;
  }>({
    startDate: '',
    endDate: ''
  });

  const sourceTypeOptions = [
    { value: 'all', label: 'All Sources' },
    { value: 'Income', label: 'Income' },
    { value: 'Expenses', label: 'Expenses' },
    { value: 'Services Payment', label: 'Services Payment' },
    { value: 'Patients', label: 'Patients' },
  ];

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: rowsPerPage.toString(),
        search: searchTerm,
        sourceType: sourceTypeFilter !== 'all' ? sourceTypeFilter : '',
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });

      const response = await crudRequest<any>("GET",`${server}/invoices?${params}`);
      setInvoices(response.data || []);
      setTotalInvoices(response.total || 0);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [page, rowsPerPage, sourceTypeFilter, searchTerm, dateRange]);

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

  const handleSourceTypeFilterChange = (value: string) => {
    setSourceTypeFilter(value);
    setPage(1);
  };

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
    setPage(1);
  };

  const getSourceTypeVariant = (sourceType: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (sourceType) {
      case 'Income':
        return 'default';
      case 'Expenses':
        return 'destructive';
      case 'Services Payment':
        return 'secondary';
      case 'Patients':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
    }).format(amount);
  };

  const getAmountColor = (sourceType: string) => {
    switch (sourceType) {
      case 'Income':
        return 'text-green-600 font-medium';
      case 'Expenses':
        return 'text-red-600 font-medium';
      case 'Services Payment':
        return 'text-blue-600 font-medium';
      case 'Patients':
        return 'text-purple-600 font-medium';
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
        .patient-amount { color: #007bff; font-weight: bold; }
        .payment-amount { color: #6f42c1; font-weight: bold; }
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
                ${invoice.patientId ? `
                <div class="info-line"><strong>Patient:</strong> ${invoice.patientId.personalDetails?.name || 'Unknown'}</div>
                ${invoice.patientId.personalDetails?.contactNumber ? `<div class="info-line">Contact: ${invoice.patientId.personalDetails.contactNumber}</div>` : ''}
                ` : `
                <div class="info-line"><strong>Source ID:</strong> ${invoice.sourceId}</div>
                `}
                <div class="info-line"><strong>Source Type:</strong> ${invoice.sourceType}</div>
            </div>
            
            <div class="invoice-info">
                <div class="section-title">Invoice Information:</div>
                <div class="info-line"><strong>Invoice #:</strong> ${invoice.invoiceNumber}</div>
                <div class="info-line"><strong>Date:</strong> ${format(new Date(invoice.date), 'MMM dd, yyyy')}</div>
                <div class="info-line"><strong>Payment Method:</strong> ${invoice.paymentMethod?.toUpperCase()}</div>
            </div>
        </div>

        <!-- Amount Display -->
        <div style="text-align: center; margin: 30px 0; padding: 30px; background-color: #f8f9fa; border-radius: 8px; border-left: 4px solid #0066cc;">
            <div style="font-size: 16px; color: #666; margin-bottom: 10px;">Amount Paid</div>
            <div style="font-size: 32px; font-weight: bold; color: ${
              invoice.sourceType === 'Income' ? '#28a745' : 
              invoice.sourceType === 'Expenses' ? '#dc3545' : 
              invoice.sourceType === 'Services Payment' ? '#6f42c1' : 
              '#007bff'
            };">
                ${formatCurrency(invoice.paidAmount)}
            </div>
        </div>


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
              <Label htmlFor="sourceType">Source Type</Label>
              <Select value={sourceTypeFilter} onValueChange={handleSourceTypeFilterChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source type" />
                </SelectTrigger>
                <SelectContent>
                  {sourceTypeOptions.map((option) => (
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
                <TableHead>Patient/Source</TableHead>
                <TableHead>Source Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <span className="ml-2">Loading...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
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
                      {format(new Date(invoice.date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell className="font-medium">
                      {invoice.patientId ? (
                        <div>
                          <div>{invoice.patientId.personalDetails?.name || 'Unknown Patient'}</div>
                          <div className="text-sm text-muted-foreground">
                            {invoice.patientId.personalDetails?.contactNumber || ''}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Source ID: {invoice.sourceId}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getSourceTypeVariant(invoice.sourceType)}>
                        {invoice.sourceType}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-right ${getAmountColor(invoice.sourceType)}`}>
                      {formatCurrency(invoice.paidAmount)}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm capitalize">
                        {invoice.paymentMethod || 'N/A'}
                      </span>
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