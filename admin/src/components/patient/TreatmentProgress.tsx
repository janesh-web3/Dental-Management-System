import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle, PieChart, Wallet } from "lucide-react";
import { TreatmentPlanning } from "@/types/patient";
import { Separator } from "@/components/ui/separator";

interface TreatmentProgressProps {
  treatments: Array<TreatmentPlanning>;
  totalAmount: number;
  paidAmount: number;
  compact?: boolean;
}

export function TreatmentProgress({ 
  treatments, 
  totalAmount, 
  paidAmount, 
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
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Treatment Progress</span>
          <span>{Math.round(progressPercentage)}%</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>
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
                <p className="font-medium text-green-700">₹{paidAmount}</p>
              </div>
            </div>
            <div className="bg-card rounded-md p-3 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-xs text-muted-foreground">Balance Amount</p>
                <p className="font-medium text-orange-700">₹{totalAmount - paidAmount}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t">
          <div className="flex justify-between font-medium bg-primary/5 p-3 rounded-md">
            <span className="text-primary">Total Treatment Cost</span>
            <span className="font-semibold text-lg">₹{totalAmount}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 