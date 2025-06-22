import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { PlusCircle, Trash2, Edit, Loader2 } from "lucide-react";
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
import { IncomeForm } from "@/components/finance/IncomeForm";
import { DateRangeFilter } from "@/components/finance/DateRangeFilter";
import { getIncomes, createIncome, updateIncome, deleteIncome } from "@/lib/api";
import { Income } from "@/types/finance";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    totalPages: number;
    totalAmount: number;
  };
}

export default function IncomePage() {
  const { toast } = useToast();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dateFilter, setDateFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState<Income | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchIncomes = async () => {
    setIsLoading(true);
    try {
      let startDate = "";
      let endDate = "";

      if (dateRange?.from && dateRange?.to) {
        startDate = format(dateRange.from, "yyyy-MM-dd");
        endDate = format(dateRange.to, "yyyy-MM-dd");
      }

      const response = await getIncomes(
        page,
        10,
        searchQuery,
        dateFilter === "custom" ? "all" : dateFilter,
        startDate,
        endDate
      ) as ApiResponse<Income[]>;

      if (response.success) {
        setIncomes(response.data);
        setTotalPages(response.meta?.totalPages || 1);
        setTotalIncome(response.meta?.totalAmount || 0);
      }
    } catch (error) {
      console.error("Error fetching incomes:", error);
      toast({
        title: "Error",
        description: "Failed to fetch income records",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomes();
  }, [page, dateFilter, dateRange, searchQuery]);

  const handleDateFilterChange = (filter: string, range?: DateRange) => {
    setDateFilter(filter);
    if (range) {
      setDateRange(range);
    }
    setPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const handleAddIncome = async (data: any) => {
    setIsSubmitting(true);
    try {
      const response = await createIncome({
        ...data,
        date: format(data.date, "yyyy-MM-dd"),
      }) as ApiResponse<Income>;

      if (response.success) {
        toast({
          title: "Success",
          description: "Income added successfully",
        });
        fetchIncomes();
        setIsAddDialogOpen(false);
      }
    } catch (error) {
      console.error("Error adding income:", error);
      toast({
        title: "Error",
        description: "Failed to add income",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditIncome = async (data: any) => {
    if (!selectedIncome) return;

    setIsSubmitting(true);
    try {
      const response = await updateIncome(selectedIncome._id, {
        ...data,
        date: format(data.date, "yyyy-MM-dd"),
      }) as ApiResponse<Income>;

      if (response.success) {
        toast({
          title: "Success",
          description: "Income updated successfully",
        });
        fetchIncomes();
        setIsEditDialogOpen(false);
        setSelectedIncome(null);
      }
    } catch (error) {
      console.error("Error updating income:", error);
      toast({
        title: "Error",
        description: "Failed to update income",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteIncome = async () => {
    if (!selectedIncome) return;

    setIsSubmitting(true);
    try {
      const response = await deleteIncome(selectedIncome._id) as ApiResponse<Income>;

      if (response.success) {
        toast({
          title: "Success",
          description: "Income deleted successfully",
        });
        fetchIncomes();
        setIsDeleteDialogOpen(false);
        setSelectedIncome(null);
      }
    } catch (error) {
      console.error("Error deleting income:", error);
      toast({
        title: "Error",
        description: "Failed to delete income",
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
          <h1 className="text-3xl font-bold tracking-tight">Income Management</h1>
          <p className="text-muted-foreground">
            Track and manage all income for your dental clinic
          </p>
        </motion.div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="mt-4 md:mt-0">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Income
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Income</DialogTitle>
              <DialogDescription>
                Enter the details for the new income record
              </DialogDescription>
            </DialogHeader>
            <IncomeForm
              onSubmit={handleAddIncome}
              onCancel={() => setIsAddDialogOpen(false)}
              isSubmitting={isSubmitting}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-background rounded-lg shadow-sm p-6">
        <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between">
          <DateRangeFilter
            onFilterChange={handleDateFilterChange}
            dateFilter={dateFilter}
            dateRange={dateRange}
          />
          <div className="w-full md:w-1/3">
            <Input
              placeholder="Search by title..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    <div className="flex justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : incomes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    <p className="text-muted-foreground">No income records found</p>
                    <Button
                      variant="link"
                      onClick={() => setIsAddDialogOpen(true)}
                    >
                      Add your first income record
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                incomes.map((income) => (
                  <TableRow key={income._id}>
                    <TableCell className="font-medium">{income.title}</TableCell>
                    <TableCell>{income.category}</TableCell>
                    <TableCell>{formatDate(income.date)}</TableCell>
                    <TableCell className="text-right font-medium">
                      Rs.{income.amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="flex justify-end space-x-2">
                      <Dialog open={isEditDialogOpen && selectedIncome?._id === income._id} onOpenChange={(open) => {
                        setIsEditDialogOpen(open);
                        if (!open) setSelectedIncome(null);
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setSelectedIncome(income);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                          <DialogHeader>
                            <DialogTitle>Edit Income</DialogTitle>
                            <DialogDescription>
                              Update the details of this income record
                            </DialogDescription>
                          </DialogHeader>
                          {selectedIncome && (
                            <IncomeForm
                              onSubmit={handleEditIncome}
                              onCancel={() => {
                                setIsEditDialogOpen(false);
                                setSelectedIncome(null);
                              }}
                              initialData={selectedIncome}
                              isSubmitting={isSubmitting}
                            />
                          )}
                        </DialogContent>
                      </Dialog>

                      <AlertDialog open={isDeleteDialogOpen && selectedIncome?._id === income._id} onOpenChange={(open) => {
                        setIsDeleteDialogOpen(open);
                        if (!open) setSelectedIncome(null);
                      }}>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-rose-500 hover:text-rose-600"
                          onClick={() => {
                            setSelectedIncome(income);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Income</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this income record? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDeleteIncome}
                              disabled={isSubmitting}
                              className="bg-rose-500 hover:bg-rose-600"
                            >
                              {isSubmitting ? "Deleting..." : "Delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center mt-4">
          <div className="text-sm text-muted-foreground">
            Showing page {page} of {totalPages}
          </div>
          <div className="flex items-center space-x-2 mt-4 md:mt-0">
            <Button
              variant="outline"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1 || isLoading}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages || isLoading}
            >
              Next
            </Button>
          </div>
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="font-medium">Total Income:</p>
            <p className="text-2xl font-bold text-emerald-600">Rs.{totalIncome.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  );
} 