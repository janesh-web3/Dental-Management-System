import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle, PieChart, Wallet } from "lucide-react";
import { TreatmentPlanning } from "@/types/patient";
import { Separator } from "@/components/ui/separator";

interface TreatmentProgressProps {
  treatments?: Array<TreatmentPlanning>;
  totalAmount: number;
  paidAmount: number;
  remainingAmount?: number;
  compact?: boolean;
}

export function TreatmentProgress({ 
  treatments = [], 
  totalAmount, 
  paidAmount, 
  remainingAmount, 
  compact = false 
}: TreatmentProgressProps) {
  const completedTreatments = treatments.filter(t => t.isCompleted).length;
  const progressPercentage = treatments.length > 0 
    ? (completedTreatments / treatments.length) * 100 
    : 0;
  const paymentPercentage = totalAmount > 0 
    ? (paidAmount / totalAmount) * 100 
    : 0;

  if (compact) {
    return (
      <Card className="border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-900/50 rounded-lg overflow-hidden">
        <CardHeader className="pb-2 border-b border-gray-100 dark:border-gray-800 p-2">
          <CardTitle className="text-sm flex items-center gap-2 text-gray-800 dark:text-gray-100">
            <div className="p-1 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
              <PieChart className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-semibold">Progress Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 space-y-3">
          {/* Treatment Progress */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-gray-700 dark:text-gray-300">Treatment Progress</span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-green-600" />
                {completedTreatments} done
              </span>
              <span className="flex items-center gap-1">
                <Circle className="w-3 h-3 text-orange-600" />
                {treatments.length - completedTreatments} pending
              </span>
            </div>
          </div>

          <Separator />

          {/* Payment Progress */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-gray-700 dark:text-gray-300">Payment Progress</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">{Math.round(paymentPercentage)}%</span>
            </div>
            <Progress value={paymentPercentage} className="h-2 [&>div]:bg-blue-500" />
            <div className="grid grid-cols-3 gap-1 text-xs">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-1 rounded text-center">
                <p className="text-blue-600 dark:text-blue-400 font-medium">
                  {new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'NPR',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(totalAmount)}
                </p>
                <p className="text-gray-600 dark:text-gray-400">Total</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-1 rounded text-center">
                <p className="text-green-600 dark:text-green-400 font-medium">
                  {new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'NPR',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(paidAmount)}
                </p>
                <p className="text-gray-600 dark:text-gray-400">Paid</p>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 p-1 rounded text-center">
                <p className="text-orange-600 dark:text-orange-400 font-medium">
                  {new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'NPR',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(remainingAmount !== undefined ? remainingAmount : totalAmount - paidAmount)}
                </p>
                <p className="text-gray-600 dark:text-gray-400">Due</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-sm bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <PieChart className="h-5 w-5 text-primary" />
          Treatment Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-muted-foreground">Overall Progress</span>
            <span className="font-semibold">{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2.5" />
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-muted/20 rounded-md p-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="font-medium">{completedTreatments} {completedTreatments === 1 ? "treatment" : "treatments"}</p>
              </div>
            </div>
            <div className="bg-muted/20 rounded-md p-3 flex items-center gap-2">
              <Circle className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="font-medium">{treatments.length - completedTreatments} {treatments.length - completedTreatments === 1 ? "treatment" : "treatments"}</p>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-muted-foreground">Payment Progress</span>
            <span className="font-semibold">{Math.round(paymentPercentage)}%</span>
          </div>
          <Progress value={paymentPercentage} className="h-2.5 bg-primary [&>div]:bg-blue-500" />
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-card rounded-md p-3 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">Paid Amount</p>
                <p className="font-medium text-green-700">{new Intl.NumberFormat('en-IN', {
                  style: 'currency',
                  currency: 'NPR',
                  minimumFractionDigits: 0
                }).format(paidAmount)}</p>
              </div>
            </div>
            <div className="bg-card rounded-md p-3 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-xs text-muted-foreground">Balance Amount</p>
                <p className="font-medium text-orange-700">{new Intl.NumberFormat('en-IN', {
                  style: 'currency',
                  currency: 'NPR',
                  minimumFractionDigits: 0
                }).format(remainingAmount !== undefined ? remainingAmount : totalAmount - paidAmount)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t">
          <div className="flex justify-between font-medium bg-primary/5 p-3 rounded-md">
            <span className="text-primary">Total Treatment Cost</span>
            <span className="font-semibold text-lg">{new Intl.NumberFormat('en-IN', {
              style: 'currency',
              currency: 'NPR',
              minimumFractionDigits: 0
            }).format(totalAmount)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 