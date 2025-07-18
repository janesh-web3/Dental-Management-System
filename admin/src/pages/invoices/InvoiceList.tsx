import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  IconButton, 
  TablePagination,
  Chip,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Box,
  Typography,
  Button
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Print as PrintIcon,
  Email as EmailIcon,
  Download as DownloadIcon,
  FilterList as FilterListIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import axios from 'axios';

// Use environment variable or default to localhost
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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
}

const InvoiceList: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(0);
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
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString(),
        search: searchTerm,
        status: statusFilter !== 'all' ? statusFilter : '',
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });

      const response = await axios.get(`${API_BASE_URL}/api/v1/invoices?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setInvoices(response.data.data);
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

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleStatusFilterChange = (event: any) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
    setPage(0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'success';
      case 'Partially Paid':
        return 'warning';
      case 'Overdue':
        return 'error';
      case 'Sent':
        return 'info';
      case 'Draft':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100); // Assuming amounts are stored in cents
  };

  return (
    <div style={{ padding: '24px' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Invoices
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          component={Link}
          to="/invoices/new"
        >
          New Invoice
        </Button>
      </Box>

      <Paper elevation={3} style={{ marginBottom: '24px', padding: '16px' }}>
        <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
          <TextField
            variant="outlined"
            size="small"
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            style={{ minWidth: '250px' }}
          />
          
          <FormControl variant="outlined" size="small" style={{ minWidth: '200px' }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              label="Status"
            >
              {statusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="From"
            type="date"
            size="small"
            InputLabelProps={{
              shrink: true,
            }}
            value={dateRange.startDate}
            onChange={(e) => handleDateChange('startDate', e.target.value)}
          />

          <TextField
            label="To"
            type="date"
            size="small"
            InputLabelProps={{
              shrink: true,
            }}
            value={dateRange.endDate}
            onChange={(e) => handleDateChange('endDate', e.target.value)}
          />
        </Box>
      </Paper>

      <Paper elevation={3}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Invoice #</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Patient</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="right">Paid</TableCell>
                <TableCell align="right">Balance</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    No invoices found
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice) => (
                  <TableRow key={invoice._id} hover>
                    <TableCell>
                      <Link to={`/invoices/${invoice._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        {invoice.invoiceNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {format(new Date(invoice.invoiceDate), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>{invoice.patientName}</TableCell>
                    <TableCell align="right">{formatCurrency(invoice.total)}</TableCell>
                    <TableCell align="right">{formatCurrency(invoice.amountPaid)}</TableCell>
                    <TableCell align="right">{formatCurrency(invoice.balance)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={invoice.status} 
                        color={getStatusColor(invoice.status) as any} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        size="small" 
                        component={Link} 
                        to={`/invoices/${invoice._id}`}
                        title="View"
                      >
                        <SearchIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        href={`${API_BASE_URL}/api/v1/invoices/${invoice._id}/pdf`}
                        target="_blank"
                        title="Download PDF"
                      >
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        title="Email"
                        // Add email functionality
                      >
                        <EmailIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalInvoices}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </div>
  );
};

export default InvoiceList;
