import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface Expense {
  _id: string;
  title: string;
  amount: number;
  date: string;
  notes: string;
  category: string;
}

export default function ExpensePage() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  });
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchExpenses = async (startDate: Date, endDate: Date) => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/finance/expense?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        {
          credentials: "include",
        }
      );
      const data = await response.json();
      if (response.ok) {
        setExpenses(data.data);
      }
    } catch (error) {
      console.error("Error fetching expenses:", error);
      toast({
        title: "Error",
        description: "Failed to fetch expense records",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (filter: string) => {
    const today = new Date();
    let startDate = new Date();
    let endDate = new Date();

    switch (filter) {
      case "today":
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "week":
        startDate.setDate(today.getDate() - today.getDay());
        endDate.setDate(startDate.getDate() + 6);
        break;
      case "month":
        startDate.setDate(1);
        endDate.setMonth(today.getMonth() + 1);
        endDate.setDate(0);
        break;
      default:
        if (date?.from && date?.to) {
          startDate = date.from;
          endDate = date.to;
        }
    }

    fetchExpenses(startDate, endDate);
  };

  const handleDelete = async () => {
    if (!selectedExpense) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/finance/expense/${selectedExpense._id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (response.ok) {
        setExpenses(expenses.filter((expense) => expense._id !== selectedExpense._id));
        toast({
          title: "Success",
          description: "Expense record deleted successfully",
        });
      } else {
        throw new Error("Failed to delete expense record");
      }
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast({
        title: "Error",
        description: "Failed to delete expense record",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedExpense(null);
    }
  };

  const handleEdit = (expense: Expense) => {
    // TODO: Implement edit functionality
    console.log("Edit expense:", expense);
  };

  const isAdmin = user?.role === "admin" || user?.role === "superadmin";

  return (
    <div className="container mx-auto py-6">
      <Card className="bg-background border-border">
        <CardHeader>
          <CardTitle>Expense Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Button variant="outline" onClick={() => handleFilter("today")}>
              Today
            </Button>
            <Button variant="outline" onClick={() => handleFilter("week")}>
              This Week
            </Button>
            <Button variant="outline" onClick={() => handleFilter("month")}>
              This Month
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "LLL dd, y")} -{" "}
                        {format(date.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(date.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Custom Range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
                />
                <div className="p-3 border-t">
                  <Button
                    className="w-full"
                    onClick={() => handleFilter("custom")}
                  >
                    Apply Filter
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Notes</TableHead>
                {isAdmin && <TableHead className="w-[100px]">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 5 : 4} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 5 : 4} className="text-center">
                    No expense records found
                  </TableCell>
                </TableRow>
              ) : (
                expenses.map((expense) => (
                  <TableRow key={expense._id}>
                    <TableCell>{expense.title}</TableCell>
                    <TableCell>₹{expense.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      {new Date(expense.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{expense.notes}</TableCell>
                    {isAdmin && (
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(expense)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedExpense(expense);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setSelectedExpense(null);
        }}
        onConfirm={handleDelete}
        title="Delete Expense Record"
        description="Are you sure you want to delete this expense record? This action cannot be undone."
        confirmText="Delete"
      />
    </div>
  );
} 