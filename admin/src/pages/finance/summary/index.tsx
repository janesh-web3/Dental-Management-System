import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { ChevronRight, Download, PieChart, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRangeFilter } from "@/components/finance/DateRangeFilter";
import { FinancialSummaryCards } from "@/components/finance/FinancialSummaryCards";
import { getFinancialSummary } from "@/lib/api";
import { FinancialSummary } from "@/types/finance";
import { Link } from "react-router-dom";

export default function FinancialSummaryPage() {
  const { toast } = useToast();
  const [financialData, setFinancialData] = useState<FinancialSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const fetchFinancialSummary = async () => {
    setIsLoading(true);
    try {
      let startDate = "";
      let endDate = "";

      if (dateRange?.from && dateRange?.to) {
        startDate = format(dateRange.from, "yyyy-MM-dd");
        endDate = format(dateRange.to, "yyyy-MM-dd");
      }

      interface ApiResponse {
        success: boolean;
        data: FinancialSummary;
      }

      const response = await getFinancialSummary<ApiResponse>(
        dateFilter === "custom" ? "all" : dateFilter,
        startDate,
        endDate
      );

      if (response.success) {
        setFinancialData(response.data);
      }
    } catch (error) {
      console.error("Error fetching financial summary:", error);
      toast({
        title: "Error",
        description: "Failed to fetch financial summary",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialSummary();
  }, [dateFilter, dateRange]);

  const handleDateFilterChange = (filter: string, range?: DateRange) => {
    setDateFilter(filter);
    if (range) {
      setDateRange(range);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "PPP");
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-3xl font-bold tracking-tight">Financial Summary</h1>
          <p className="text-muted-foreground">
            Overview of income, expenses, and financial health
          </p>
        </motion.div>

        <Button variant="outline" className="mt-4 md:mt-0">
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      <div className="mb-6">
        <DateRangeFilter
          onFilterChange={handleDateFilterChange}
          dateFilter={dateFilter}
          dateRange={dateRange}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : financialData ? (
        <>
          <FinancialSummaryCards
            income={financialData.summary.income}
            expense={financialData.summary.expense}
            balance={financialData.summary.balance}
            servicePayment={financialData.summary.servicePayment || 0}
          />

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-8">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Income by Category</CardTitle>
                <CardDescription>Distribution of income sources</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center">
                  <PieChart className="h-16 w-16 text-muted-foreground/70" />
                  <span className="ml-2 text-muted-foreground">Income distribution chart</span>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Percentage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {financialData.incomeByCategory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-6">
                          <p className="text-muted-foreground">No income data available</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      financialData.incomeByCategory.map((category) => {
                        const percentage = financialData.summary.income > 0
                          ? ((category.total / financialData.summary.income) * 100).toFixed(1)
                          : "0";
                          
                        return (
                          <TableRow key={category._id}>
                            <TableCell>{category._id}</TableCell>
                            <TableCell className="text-right">Rs. {category.total.toLocaleString()}</TableCell>
                            <TableCell className="text-right">{percentage}%</TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Service Payments by Type</CardTitle>
                <CardDescription>Distribution of service revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-center justify-center">
                  <PieChart className="h-16 w-16 text-muted-foreground/70" />
                  <span className="ml-2 text-muted-foreground">Service revenue distribution</span>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!financialData.serviceByType || financialData.serviceByType.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center py-6">
                          <p className="text-muted-foreground">No service payment data available</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      financialData.serviceByType.map((service) => (
                        <TableRow key={service._id}>
                          <TableCell>{service._id}</TableCell>
                          <TableCell className="text-right">Rs. {service.total.toLocaleString()}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-8">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Expense by Category</CardTitle>
                <CardDescription>Distribution of expenses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center">
                  <PieChart className="h-16 w-16 text-muted-foreground/70" />
                  <span className="ml-2 text-muted-foreground">Expense distribution chart</span>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {financialData.expenseByCategory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center py-6">
                          <p className="text-muted-foreground">No expense data available</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      financialData.expenseByCategory.map((category) => (
                        <TableRow key={category._id}>
                          <TableCell>{category._id}</TableCell>
                          <TableCell className="text-right">Rs. {category.total.toLocaleString()}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="income" className="mt-8">
            <TabsList>
              <TabsTrigger value="income">Recent Income</TabsTrigger>
              <TabsTrigger value="services">Service Payments</TabsTrigger>
              <TabsTrigger value="expense">Recent Expenses</TabsTrigger>
            </TabsList>
            <TabsContent value="income">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Recent Income</CardTitle>
                    <CardDescription>Latest income entries</CardDescription>
                  </div>
                  <Link to="/finance/income">
                    <Button variant="ghost" className="text-sm">
                      View All <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {financialData.recentIncome.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-6">
                            <p className="text-muted-foreground">No income records found</p>
                            <Link to="/finance/income">
                              <Button variant="link">Add your first income record</Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ) : (
                        financialData.recentIncome.map((income) => (
                          <TableRow key={income._id}>
                            <TableCell className="font-medium">{income.title}</TableCell>
                            <TableCell>{income.category}</TableCell>
                            <TableCell>{formatDate(income.date)}</TableCell>
                            <TableCell className="text-right">Rs. {income.amount.toLocaleString()}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="services">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Recent Service Payments</CardTitle>
                    <CardDescription>Latest service payment entries</CardDescription>
                  </div>
                  <Link to="/finance/service-payment">
                    <Button variant="ghost" className="text-sm">
                      View All <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>Service Type</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!financialData.recentServicePayments || financialData.recentServicePayments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-6">
                            <p className="text-muted-foreground">No service payment records found</p>
                            <Link to="/finance/service-payment">
                              <Button variant="link">Add your first service payment</Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ) : (
                        financialData.recentServicePayments.map((payment) => (
                          <TableRow key={payment._id}>
                            <TableCell className="font-medium">{payment.patientName}</TableCell>
                            <TableCell>{payment.serviceType}</TableCell>
                            <TableCell>{formatDate(payment.date)}</TableCell>
                            <TableCell className="text-right">Rs. {payment.amount.toLocaleString()}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="expense">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Recent Expenses</CardTitle>
                    <CardDescription>Latest expense entries</CardDescription>
                  </div>
                  <Link to="/finance/expense">
                    <Button variant="ghost" className="text-sm">
                      View All <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {financialData.recentExpenses.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-6">
                            <p className="text-muted-foreground">No expense records found</p>
                            <Link to="/finance/expense">
                              <Button variant="link">Add your first expense record</Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ) : (
                        financialData.recentExpenses.map((expense) => (
                          <TableRow key={expense._id}>
                            <TableCell className="font-medium">{expense.title}</TableCell>
                            <TableCell>{expense.category}</TableCell>
                            <TableCell>{formatDate(expense.date)}</TableCell>
                            <TableCell className="text-right">Rs. {expense.amount.toLocaleString()}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground text-lg mb-4">No financial data available</p>
          <div className="flex space-x-4">
            <Link to="/finance/income">
              <Button>Add Income</Button>
            </Link>
            <Link to="/finance/expense">
              <Button variant="outline">Add Expense</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
