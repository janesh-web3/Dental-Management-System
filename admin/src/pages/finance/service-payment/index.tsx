import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { PlusCircle, Trash2, Edit, Loader2, Filter } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ServicePaymentForm } from "@/components/finance/ServicePaymentForm";
import { DateRangeFilter } from "@/components/finance/DateRangeFilter";
import {
  getServicePayments,
  createServicePayment,
  updateServicePayment,
  deleteServicePayment,
} from "@/lib/api";
import { ServicePayment } from "@/types/finance";
import { Patient } from "@/types/patient";
// Import patient API functions
import { crudRequest } from "@/lib/api";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    totalPages: number;
    totalAmount: number;
  };
}

export default function ServicePaymentPage() {
  const { toast } = useToast();
  const [servicePayments, setServicePayments] = useState<ServicePayment[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<ServicePayment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [activeTab, setActiveTab] = useState("all");

  const fetchServicePayments = async () => {
    setIsLoading(true);
    try {
      let startDate = "";
      let endDate = "";

      if (dateRange?.from && dateRange?.to) {
        startDate = format(dateRange.from, "yyyy-MM-dd");
        endDate = format(dateRange.to, "yyyy-MM-dd");
      }

      // Determine if we need to filter by walk-in status
      let isWalkIn: boolean | undefined = undefined;
      if (activeTab === "walkin") {
        isWalkIn = true;
      } else if (activeTab === "registered") {
        isWalkIn = false;
      }

      const response = await getServicePayments(
        page,
        10,
        searchQuery,
        startDate,
        endDate,
        "",
        isWalkIn
      ) as ApiResponse<ServicePayment[]>;

      if (response.success) {
        setServicePayments(response.data);
        setTotalPages(response.meta?.totalPages || 1);
        setTotalAmount(response.meta?.totalAmount || 0);
      }
    } catch (error) {
      console.error("Error fetching service payments:", error);
      toast({
        title: "Error",
        description: "Failed to fetch service payment records",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await crudRequest<ApiResponse<Patient[]>>("GET", "/patient");
      if (response.success) {
        setPatients(response.data);
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
    }
  };

  useEffect(() => {
    fetchServicePayments();
  }, [page, dateRange, searchQuery, activeTab]);

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleDateRangeChange = (range?: DateRange) => {
    setDateRange(range);
    setPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const handleAddServicePayment = async (data: any) => {
    setIsSubmitting(true);
    try {
      const formattedData = {
        ...data,
        date: format(data.date, "yyyy-MM-dd"),
      };
      
      const response = await createServicePayment(formattedData) as ApiResponse<ServicePayment>;

      if (response.success) {
        toast({
          title: "Success",
          description: "Service payment added successfully",
        });
        fetchServicePayments();
        setIsAddDialogOpen(false);
      }
    } catch (error) {
      console.error("Error adding service payment:", error);
      toast({
        title: "Error",
        description: "Failed to add service payment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditServicePayment = async (data: any) => {
    if (!selectedPayment) return;

    setIsSubmitting(true);
    try {
      const formattedData = {
        ...data,
        date: format(data.date, "yyyy-MM-dd"),
      };
      
      const response = await updateServicePayment(selectedPayment._id, formattedData) as ApiResponse<ServicePayment>;

      if (response.success) {
        toast({
          title: "Success",
          description: "Service payment updated successfully",
        });
        fetchServicePayments();
        setIsEditDialogOpen(false);
        setSelectedPayment(null);
      }
    } catch (error) {
      console.error("Error updating service payment:", error);
      toast({
        title: "Error",
        description: "Failed to update service payment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteServicePayment = async () => {
    if (!selectedPayment) return;

    setIsSubmitting(true);
    try {
      const response = await deleteServicePayment(selectedPayment._id) as ApiResponse<ServicePayment>;

      if (response.success) {
        toast({
          title: "Success",
          description: "Service payment deleted successfully",
        });
        fetchServicePayments();
        setIsDeleteDialogOpen(false);
        setSelectedPayment(null);
      }
    } catch (error) {
      console.error("Error deleting service payment:", error);
      toast({
        title: "Error",
        description: "Failed to delete service payment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "PPP");
  };

  return (
    <div className="2xl:container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 px-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-3xl font-bold tracking-tight">Service Payments</h1>
          <p className="text-muted-foreground">
            Manage one-time service payments for walk-in and registered patients
          </p>
        </motion.div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="mt-4 md:mt-0">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Service Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Service Payment</DialogTitle>
              <DialogDescription>
                Enter the details for the new service payment
              </DialogDescription>
            </DialogHeader>
            <ServicePaymentForm
              onSubmit={handleAddServicePayment}
              onCancel={() => setIsAddDialogOpen(false)}
              isSubmitting={isSubmitting}
              patients={patients}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-background rounded-lg shadow-sm p-6">
        <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex flex-col sm:flex-row gap-4">
            <DateRangeFilter
              onFilterChange={(_, range) => handleDateRangeChange(range)}
              dateFilter="custom"
              dateRange={dateRange}
            />
            <div className="relative">
              <Input
                placeholder="Search payments..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full sm:w-64"
              />
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Amount</p>
            <p className="text-2xl font-bold">Rs. {totalAmount.toLocaleString()}</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">All Payments</TabsTrigger>
            <TabsTrigger value="walkin">Walk-in Patients</TabsTrigger>
            <TabsTrigger value="registered">Registered Patients</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : servicePayments.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground">No service payments found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Service Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {servicePayments.map((payment) => (
                  <TableRow key={payment._id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{payment.patientName}</p>
                        {payment.contactNumber && (
                          <p className="text-sm text-muted-foreground">
                            {payment.contactNumber}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{payment.serviceType}</TableCell>
                    <TableCell>Rs. {payment.amount.toLocaleString()}</TableCell>
                    <TableCell>{payment.paymentMethod}</TableCell>
                    <TableCell>{formatDate(payment.date)}</TableCell>
                    <TableCell>
                      <Badge variant={payment.isWalkIn ? "outline" : "default"}>
                        {payment.isWalkIn ? "Walk-in" : "Registered"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedPayment(payment);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedPayment(payment);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Service Payment</DialogTitle>
            <DialogDescription>
              Update the details for this service payment
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <ServicePaymentForm
              onSubmit={handleEditServicePayment}
              onCancel={() => setIsEditDialogOpen(false)}
              isSubmitting={isSubmitting}
              initialData={selectedPayment}
              patients={patients}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this service payment record. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteServicePayment}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 