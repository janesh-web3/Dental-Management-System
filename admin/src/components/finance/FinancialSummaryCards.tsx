import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FinancialSummaryCardsProps {
  income: number;
  expense: number;
  balance: number;
}

export function FinancialSummaryCards({
  income,
  expense,
  balance,
}: FinancialSummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ scale: 1.02 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <ArrowUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${income.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              All income received to date
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        whileHover={{ scale: 1.02 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <ArrowDown className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${expense.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              All expenses to date
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        whileHover={{ scale: 1.02 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
            <DollarSign className={`h-4 w-4 ${balance >= 0 ? "text-emerald-500" : "text-rose-500"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              ${balance.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Income minus expenses
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
} 