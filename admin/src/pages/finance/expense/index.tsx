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
import { ExpenseForm } from "@/components/finance/ExpenseForm";
import { DateRangeFilter } from "@/components/finance/DateRangeFilter";
import { getExpenses, createExpense, updateExpense, deleteExpense } from "@/lib/api";
import { Expense } from "@/types/finance";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    totalPages: number;
    totalAmount: number;
  };
}

export default function ExpensePage() {
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalExpense, setTotalExpense] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dateFilter, setDateFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      let startDate = "";
      let endDate = "";

      if (dateRange?.from && dateRange?.to) {
        startDate = format(dateRange.from, "yyyy-MM-dd");
        endDate = format(dateRange.to, "yyyy-MM-dd");
      }

      const response = await getExpenses(
        page,
        10,
        searchQuery,
        dateFilter === "custom" ? "all" : dateFilter,
        startDate,
        endDate
      );

      if (response.success) {
        const typedResponse = response as ApiResponse<Expense[]>;
        
        setExpenses(typedResponse.data);
        setTotalPages(typedResponse.meta?.totalPages || 1);
        setTotalExpense(typedResponse.meta?.totalAmount || 0);
      }
    } catch (error) {
      console.error("Error fetching expenses:", error);
      toast({
        title: "Error",
        description: "Failed to fetch expense records",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
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

  const handleAddExpense = async (data: any) => {
    setIsSubmitting(true);
    try {
      const response = await createExpense({
        ...data,
        date: format(data.date, "yyyy-MM-dd"),
      }) as ApiResponse<Expense>;

      if (response.success) {
        toast({
          title: "Success", 
          description: "Expense added successfully",
        });
        fetchExpenses();
        setIsAddDialogOpen(false);
      }
    } catch (error) {
      console.error("Error adding expense:", error);
      toast({
        title: "Error",
        description: "Failed to add expense",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditExpense = async (data: any) => {
    if (!selectedExpense) return;

    setIsSubmitting(true);
    try {
      const response = await updateExpense(selectedExpense._id, {
        ...data,
        date: format(data.date, "yyyy-MM-dd"),
      }) as ApiResponse<Expense>;

      if (response.success) {
        toast({
          title: "Success",
          description: "Expense updated successfully",
        });
        fetchExpenses();
        setIsEditDialogOpen(false);
        setSelectedExpense(null);
      }
    } catch (error) {
      console.error("Error updating expense:", error);
      toast({
        title: "Error",
        description: "Failed to update expense",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async () => {
    if (!selectedExpense) return;

    setIsSubmitting(true);
    try {
      const response = await deleteExpense(selectedExpense._id) as ApiResponse<Expense>;

      if (response.success) {
        toast({
          title: "Success",
          description: "Expense deleted successfully",
        });
        fetchExpenses();
        setIsDeleteDialogOpen(false);
        setSelectedExpense(null);
      }
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast({
        title: "Error",
        description: "Failed to delete expense",
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 px-4 ">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-3xl font-bold tracking-tight">Expense Management</h1>
          <p className="text-muted-foreground">
            Track and manage all expenses for your dental clinic
          </p>
        </motion.div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="mt-4 md:mt-0">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Expense</DialogTitle>
              <DialogDescription>
                Enter the details for the new expense record
              </DialogDescription>
            </DialogHeader>
            <ExpenseForm
              onSubmit={handleAddExpense}
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
              ) : expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    <p className="text-muted-foreground">No expense records found</p>
                    <Button
                      variant="link"
                      onClick={() => setIsAddDialogOpen(true)}
                    >
                      Add your first expense record
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                expenses.map((expense) => (
                  <TableRow key={expense._id}>
                    <TableCell className="font-medium">{expense.title}</TableCell>
                    <TableCell>{expense.category}</TableCell>
                    <TableCell>{formatDate(expense.date)}</TableCell>
                    <TableCell className="text-right font-medium">
                      ${expense.amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="flex justify-end space-x-2">
                      <Dialog open={isEditDialogOpen && selectedExpense?._id === expense._id} onOpenChange={(open) => {
                        setIsEditDialogOpen(open);
                        if (!open) setSelectedExpense(null);
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setSelectedExpense(expense);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                          <DialogHeader>
                            <DialogTitle>Edit Expense</DialogTitle>
                            <DialogDescription>
                              Update the details of this expense record
                            </DialogDescription>
                          </DialogHeader>
                          {selectedExpense && (
                            <ExpenseForm
                              onSubmit={handleEditExpense}
                              onCancel={() => {
                                setIsEditDialogOpen(false);
                                setSelectedExpense(null);
                              }}
                              initialData={selectedExpense}
                              isSubmitting={isSubmitting}
                            />
                          )}
                        </DialogContent>
                      </Dialog>

                      <AlertDialog open={isDeleteDialogOpen && selectedExpense?._id === expense._id} onOpenChange={(open) => {
                        setIsDeleteDialogOpen(open);
                        if (!open) setSelectedExpense(null);
                      }}>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-rose-500 hover:text-rose-600"
                          onClick={() => {
                            setSelectedExpense(expense);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this expense record? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDeleteExpense}
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
            <p className="font-medium">Total Expenses:</p>
            <p className="text-2xl font-bold text-rose-600">${totalExpense.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
