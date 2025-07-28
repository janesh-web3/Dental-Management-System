import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";
import { IndianRupee, Eye, FileText, Users, CreditCard, TrendingUp } from "lucide-react";
import { crudRequest } from "@/lib/api";
import { server } from "@/server";

interface Transaction {
  _id?: string;
  type: 'daily_treatment' | 'group_treatment' | 'service_payment' | 'income';
  patientId?: string;
  patientName: string;
  patientContact?: string;
  treatmentDetails: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  date: string;
  notes?: string;
  status: boolean;
  procedure?: string;
  toothNumber?: string;
  groupName?: string;
  serviceType?: string;
  paymentMethod?: string;
  isWalkIn?: boolean;
  category?: string;
  title?: string;
  paymentDate?: string;
}

interface TransactionSummary {
  totalTransactions: number;
  totalAmount: number;
  totalPaid: number;
  totalRemaining: number;
  typeBreakdown: {
    daily_treatment: number;
    group_treatment: number;
    service_payment: number;
    income: number;
  };
}

export function RecentTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await crudRequest(
          "GET",
          `${server}/patient/recent-transactions`
        );
        if (
          response &&
          typeof response === "object" &&
          "data" in response &&
          "summary" in response
        ) {
          const { data, summary } = response as { data: Transaction[]; summary: TransactionSummary };
          setTransactions(data);
          setSummary(summary);
          console.log("Fetched transactions:", data);
          console.log("Transaction summary:", summary);
        } else {
          throw new Error("Invalid response format");
        }
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'daily_treatment':
        return <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      case 'group_treatment':
        return <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />;
      case 'service_payment':
        return <CreditCard className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'income':
        return <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getTransactionColor = (type: Transaction['type']) => {
    switch (type) {
      case 'daily_treatment':
        return 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900';
      case 'group_treatment':
        return 'bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900';
      case 'service_payment':
        return 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900';
      case 'income':
        return 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900';
      default:
        return 'bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-900';
    }
  };

  const getTypeLabel = (type: Transaction['type']) => {
    switch (type) {
      case 'daily_treatment':
        return 'Treatment';
      case 'group_treatment':
        return 'Group Treatment';
      case 'service_payment':
        return 'Service Payment';
      case 'income':
        return 'Income';
      default:
        return 'Transaction';
    }
  };

  if (loading) {
    return (
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 shadow-sm hover:shadow-md transition-all">
        <CardHeader>
          <CardTitle className="text-blue-800 dark:text-blue-300">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 dark:border-blue-400"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-blue-800 dark:text-blue-300">Recent Transactions</CardTitle>
          {summary && (
            <div className="text-xs text-slate-600 dark:text-slate-400">
              {summary.totalTransactions} transactions
            </div>
          )}
        </div>
        {summary && (
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center p-2 bg-white dark:bg-slate-900 rounded">
              <div className="font-medium text-slate-900 dark:text-slate-100">
                रु{summary.totalAmount.toLocaleString("en-IN")}
              </div>
              <div className="text-slate-600 dark:text-slate-400">Total</div>
            </div>
            <div className="text-center p-2 bg-white dark:bg-slate-900 rounded">
              <div className="font-medium text-green-600 dark:text-green-400">
                रु{summary.totalPaid.toLocaleString("en-IN")}
              </div>
              <div className="text-slate-600 dark:text-slate-400">Paid</div>
            </div>
            <div className="text-center p-2 bg-white dark:bg-slate-900 rounded">
              <div className="font-medium text-red-600 dark:text-red-400">
                रु{summary.totalRemaining.toLocaleString("en-IN")}
              </div>
              <div className="text-slate-600 dark:text-slate-400">Remaining</div>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          {transactions.length === 0 ? (
            <div className="text-center py-4 text-blue-600 dark:text-blue-400">
              No recent transactions
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction, index) => (
                <div
                  key={transaction._id || index}
                  className={`flex items-center space-x-3 rounded-lg border p-3 shadow-sm hover:shadow-md transition-all ${getTransactionColor(transaction.type)}`}
                >
                  <div className="flex-shrink-0">
                    {getTransactionIcon(transaction.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                        {transaction.patientName}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {getTypeLabel(transaction.type)}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                      {transaction.treatmentDetails}
                    </p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-500">
                        {format(new Date(transaction.date), "MMM d, yyyy")}
                      </span>
                      {transaction.patientContact && (
                        <span className="text-slate-500 dark:text-slate-500">
                          {transaction.patientContact}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center text-sm font-medium text-slate-900 dark:text-slate-100">
                      <IndianRupee className="mr-1 h-3 w-3" />
                      {transaction.totalAmount.toLocaleString("en-IN")}
                    </div>
                    {transaction.remainingAmount > 0 && (
                      <div className="flex items-center text-xs text-red-600 dark:text-red-400">
                        <IndianRupee className="mr-1 h-3 w-3" />
                        {transaction.remainingAmount.toLocaleString("en-IN")} pending
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Badge
                        variant={transaction.status ? "default" : "secondary"}
                        className={`text-xs ${transaction.status ? "bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700" : ""}`}
                      >
                        {transaction.status ? "Completed" : "Pending"}
                      </Badge>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Eye className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              {getTransactionIcon(transaction.type)}
                              Transaction Details
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium text-sm text-slate-900 dark:text-slate-100">Patient Information</h4>
                              <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1 mt-1">
                                <p><span className="font-medium">Name:</span> {transaction.patientName}</p>
                                {transaction.patientContact && (
                                  <p><span className="font-medium">Contact:</span> {transaction.patientContact}</p>
                                )}
                              </div>
                            </div>

                            <div>
                              <h4 className="font-medium text-sm text-slate-900 dark:text-slate-100">Transaction Details</h4>
                              <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1 mt-1">
                                <p><span className="font-medium">Type:</span> {getTypeLabel(transaction.type)}</p>
                                <p><span className="font-medium">Description:</span> {transaction.treatmentDetails}</p>
                                {transaction.procedure && (
                                  <p><span className="font-medium">Procedure:</span> {transaction.procedure}</p>
                                )}
                                {transaction.toothNumber && (
                                  <p><span className="font-medium">Tooth:</span> #{transaction.toothNumber}</p>
                                )}
                                {transaction.groupName && (
                                  <p><span className="font-medium">Group:</span> {transaction.groupName}</p>
                                )}
                                {transaction.serviceType && (
                                  <p><span className="font-medium">Service:</span> {transaction.serviceType}</p>
                                )}
                                {transaction.paymentMethod && (
                                  <p><span className="font-medium">Payment Method:</span> {transaction.paymentMethod}</p>
                                )}
                                {transaction.notes && (
                                  <p><span className="font-medium">Notes:</span> {transaction.notes}</p>
                                )}
                              </div>
                            </div>

                            <div>
                              <h4 className="font-medium text-sm text-slate-900 dark:text-slate-100">Financial Details</h4>
                              <div className="grid grid-cols-2 gap-2 mt-2">
                                <div className="text-center p-2 bg-slate-100 dark:bg-slate-800 rounded">
                                  <div className="text-sm font-medium">रु{transaction.totalAmount.toLocaleString("en-IN")}</div>
                                  <div className="text-xs text-slate-600 dark:text-slate-400">Total</div>
                                </div>
                                <div className="text-center p-2 bg-green-100 dark:bg-green-900 rounded">
                                  <div className="text-sm font-medium text-green-700 dark:text-green-300">
                                    रु{transaction.paidAmount.toLocaleString("en-IN")}
                                  </div>
                                  <div className="text-xs text-slate-600 dark:text-slate-400">Paid</div>
                                </div>
                                {transaction.remainingAmount > 0 && (
                                  <div className="col-span-2 text-center p-2 bg-red-100 dark:bg-red-900 rounded">
                                    <div className="text-sm font-medium text-red-700 dark:text-red-300">
                                      रु{transaction.remainingAmount.toLocaleString("en-IN")}
                                    </div>
                                    <div className="text-xs text-slate-600 dark:text-slate-400">Remaining</div>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div>
                              <h4 className="font-medium text-sm text-slate-900 dark:text-slate-100">Status & Dates</h4>
                              <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1 mt-1">
                                <p>
                                  <span className="font-medium">Status:</span> 
                                  <Badge
                                    variant={transaction.status ? "default" : "secondary"}
                                    className={`ml-2 ${transaction.status ? "bg-green-500 dark:bg-green-600" : ""}`}
                                  >
                                    {transaction.status ? "Completed" : "Pending"}
                                  </Badge>
                                </p>
                                <p><span className="font-medium">Date:</span> {format(new Date(transaction.date), "PPP")}</p>
                                {transaction.paymentDate && (
                                  <p><span className="font-medium">Payment Date:</span> {format(new Date(transaction.paymentDate), "PPP")}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}