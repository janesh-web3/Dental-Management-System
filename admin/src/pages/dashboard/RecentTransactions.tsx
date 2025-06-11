import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { IndianRupee } from "lucide-react";
import { crudRequest } from "@/lib/api";
import { server } from "@/server";

interface Transaction {
  _id: string;
  patientName: string;
  treatmentDetails: string;
  amount: string;
  date: string;
  status: boolean;
}

export function RecentTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await crudRequest(
          "GET",
          `${server}/patient/recent-transactions`
        );
        if (response && typeof response === "object" && "data" in response) {
          setTransactions(response.data as Transaction[]);
          console.log("Fetched transactions:", response.data);
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
    <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 shadow-sm hover:shadow-md transition-all">
      <CardHeader>
        <CardTitle className="text-blue-800 dark:text-blue-300">Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          {transactions.length === 0 ? (
            <div className="text-center py-4 text-blue-600 dark:text-blue-400">
              No recent transactions
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div
                  key={transaction._id}
                  className="flex items-center space-x-4 rounded-lg bg-white dark:bg-blue-900 border border-blue-100 dark:border-blue-700 p-4 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none text-blue-900 dark:text-blue-100">
                      {transaction.patientName}
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {transaction.treatmentDetails}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center text-sm font-medium text-blue-600 dark:text-blue-300">
                      <IndianRupee className="mr-1 h-4 w-4" />
                      {parseInt(transaction.amount).toLocaleString("en-IN")}
                    </div>
                    <Badge
                      variant={transaction.status ? "default" : "secondary"}
                      className={transaction.status ? "bg-green-500 hover:bg-green-600" : ""}
                    >
                      {transaction.status ? "Completed" : "Pending"}
                    </Badge>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      {format(new Date(transaction.date), "MMM d, yyyy")}
                    </p>
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