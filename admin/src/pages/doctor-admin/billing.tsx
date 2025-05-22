import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  Loader2,
  Search,
  Download,
  FileText,
  DollarSign,
  Calendar,
  User,
} from "lucide-react";
import { useDoctorAuthContext } from "@/contexts/doctorAuthContext";

interface BillingProps {
  doctorId: string;
}

interface Patient {
  _id: string;
  personalDetails: {
    name: string;
  };
}

interface Invoice {
  _id: string;
  patient: Patient;
  doctor: {
    _id: string;
    name: string;
  };
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  amountPaid: number;
  balance: number;
  status:
    | "Draft"
    | "Sent"
    | "Paid"
    | "Partially Paid"
    | "Overdue"
    | "Cancelled";
  paymentMethod: string;
  notes?: string;
  treatmentPlan?: string;
}

const Billing: React.FC = () => {
  const { doctorDetails, isLoading } = useDoctorAuthContext();

  // Get the doctor ID from the auth context
  const doctorId = doctorDetails?._id || "";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading doctor panel...</span>
      </div>
    );
  }
  const [loading, setLoading] = useState<boolean>(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [patientFilter, setPatientFilter] = useState<string>("all");
  const [isViewDialogOpen, setIsViewDialogOpen] = useState<boolean>(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchInvoices();
    fetchPatients();
  }, [doctorId, currentPage, statusFilter, patientFilter]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      // This would be replaced with an actual API call in a real implementation
      // For now, we'll simulate the data
      setTimeout(() => {
        setInvoices([
          {
            _id: "1",
            patient: {
              _id: "101",
              personalDetails: {
                name: "John Doe",
              },
            },
            doctor: {
              _id: doctorId,
              name: "Dr. Smith",
            },
            invoiceNumber: "INV-2305-0001",
            invoiceDate: "2025-05-15",
            dueDate: "2025-06-15",
            items: [
              {
                description: "Dental Examination",
                quantity: 1,
                unitPrice: 100,
                discount: 0,
                total: 100,
              },
              {
                description: "X-Ray",
                quantity: 2,
                unitPrice: 50,
                discount: 0,
                total: 100,
              },
              {
                description: "Cavity Filling",
                quantity: 1,
                unitPrice: 150,
                discount: 0,
                total: 150,
              },
            ],
            subtotal: 350,
            tax: 0,
            discount: 0,
            total: 350,
            amountPaid: 350,
            balance: 0,
            status: "Paid",
            paymentMethod: "Cash",
            notes: "Payment received in full",
          },
          {
            _id: "2",
            patient: {
              _id: "102",
              personalDetails: {
                name: "Jane Smith",
              },
            },
            doctor: {
              _id: doctorId,
              name: "Dr. Smith",
            },
            invoiceNumber: "INV-2305-0002",
            invoiceDate: "2025-05-18",
            dueDate: "2025-06-18",
            items: [
              {
                description: "Root Canal Treatment",
                quantity: 1,
                unitPrice: 500,
                discount: 0,
                total: 500,
              },
              {
                description: "Medication",
                quantity: 1,
                unitPrice: 50,
                discount: 0,
                total: 50,
              },
            ],
            subtotal: 550,
            tax: 0,
            discount: 0,
            total: 550,
            amountPaid: 200,
            balance: 350,
            status: "Partially Paid",
            paymentMethod: "Credit Card",
            notes: "Partial payment received",
          },
        ]);
        setTotalPages(1);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load invoices",
      });
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      // This would be replaced with an actual API call in a real implementation
      // For now, we'll simulate the data
      setTimeout(() => {
        setPatients([
          {
            _id: "101",
            personalDetails: {
              name: "John Doe",
            },
          },
          {
            _id: "102",
            personalDetails: {
              name: "Jane Smith",
            },
          },
        ]);
      }, 500);
    } catch (error) {
      console.error("Error fetching patients:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load patients",
      });
    }
  };

  const viewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsViewDialogOpen(true);
  };

  const downloadInvoice = (invoice: Invoice) => {
    // In a real implementation, this would generate a PDF or call an API endpoint
    // For now, we'll just show a toast
    toast({
      title: "Download Started",
      description: `Downloading invoice ${invoice.invoiceNumber}`,
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Paid":
        return "default";
      case "Partially Paid":
        return "secondary";
      case "Overdue":
        return "destructive";
      case "Cancelled":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Billing Overview</CardTitle>
              <CardDescription>View invoices for your patients</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                <SelectItem value="Overdue">Overdue</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Sent">Sent</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={patientFilter} onValueChange={setPatientFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by patient" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Patients</SelectItem>
                {patients.map((patient) => (
                  <SelectItem key={patient._id} value={patient._id}>
                    {patient.personalDetails.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.length > 0 ? (
                      invoices.map((invoice) => (
                        <TableRow key={invoice._id}>
                          <TableCell className="font-medium">
                            {invoice.invoiceNumber}
                          </TableCell>
                          <TableCell>
                            {invoice.patient.personalDetails.name}
                          </TableCell>
                          <TableCell>
                            {new Date(invoice.invoiceDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>${invoice.total.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge
                              variant={getStatusBadgeVariant(invoice.status)}
                            >
                              {invoice.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => viewInvoice(invoice)}
                              >
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => downloadInvoice(invoice)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          No invoices found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center mt-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* View Invoice Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          {selectedInvoice && (
            <>
              <DialogHeader>
                <DialogTitle>Invoice Details</DialogTitle>
                <DialogDescription>
                  Invoice #{selectedInvoice.invoiceNumber}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>Patient</span>
                    </div>
                    <p className="font-medium">
                      {selectedInvoice.patient.personalDetails.name}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Invoice Date</span>
                    </div>
                    <p className="font-medium">
                      {new Date(
                        selectedInvoice.invoiceDate
                      ).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Due Date</span>
                    </div>
                    <p className="font-medium">
                      {new Date(selectedInvoice.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Invoice Items</h3>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">
                            Unit Price
                          </TableHead>
                          <TableHead className="text-right">Discount</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedInvoice.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.description}</TableCell>
                            <TableCell className="text-right">
                              {item.quantity}
                            </TableCell>
                            <TableCell className="text-right">
                              ${item.unitPrice.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              ${item.discount.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              ${item.total.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div className="flex justify-between items-start">
                  <div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <span>Status</span>
                      </div>
                      <Badge
                        variant={getStatusBadgeVariant(selectedInvoice.status)}
                      >
                        {selectedInvoice.status}
                      </Badge>
                    </div>

                    {selectedInvoice.paymentMethod && (
                      <div className="mt-3">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <span>Payment Method</span>
                        </div>
                        <p>{selectedInvoice.paymentMethod}</p>
                      </div>
                    )}

                    {selectedInvoice.notes && (
                      <div className="mt-3">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <span>Notes</span>
                        </div>
                        <p>{selectedInvoice.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 text-right">
                    <div>
                      <span className="text-sm text-muted-foreground">
                        Subtotal:
                      </span>
                      <p className="font-medium">
                        ${selectedInvoice.subtotal.toFixed(2)}
                      </p>
                    </div>

                    {selectedInvoice.tax > 0 && (
                      <div>
                        <span className="text-sm text-muted-foreground">
                          Tax:
                        </span>
                        <p className="font-medium">
                          ${selectedInvoice.tax.toFixed(2)}
                        </p>
                      </div>
                    )}

                    {selectedInvoice.discount > 0 && (
                      <div>
                        <span className="text-sm text-muted-foreground">
                          Discount:
                        </span>
                        <p className="font-medium">
                          -${selectedInvoice.discount.toFixed(2)}
                        </p>
                      </div>
                    )}

                    <div className="border-t pt-2">
                      <span className="text-sm text-muted-foreground">
                        Total:
                      </span>
                      <p className="font-medium">
                        ${selectedInvoice.total.toFixed(2)}
                      </p>
                    </div>

                    <div>
                      <span className="text-sm text-muted-foreground">
                        Amount Paid:
                      </span>
                      <p className="font-medium">
                        ${selectedInvoice.amountPaid.toFixed(2)}
                      </p>
                    </div>

                    <div>
                      <span className="text-sm text-muted-foreground">
                        Balance:
                      </span>
                      <p className="font-medium">
                        ${selectedInvoice.balance.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => downloadInvoice(selectedInvoice)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Invoice
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Billing;
