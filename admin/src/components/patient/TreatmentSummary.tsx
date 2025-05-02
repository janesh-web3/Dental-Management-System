import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TreatmentPlan } from "@/types/patient";

interface TreatmentSummaryProps {
  plans: TreatmentPlan[];
  selectedTeethMaps: Record<string, Record<string, any>>;
}

export function TreatmentSummary({ plans, selectedTeethMaps }: TreatmentSummaryProps) {
  // Calculate totals
  let totalTreatmentAmount = 0;
  let totalPaidAmount = 0;
  let totalRemainingAmount = 0;
  let totalTeethSelected = 0;
  let totalTeethCompleted = 0;
  let hasValidToothData = false;
  
  // First, count teeth and calculate tooth-level metrics
  Object.keys(selectedTeethMaps).forEach(mapKey => {
    const teethMap = selectedTeethMaps[mapKey];
    const teethCount = Object.keys(teethMap).length;
    totalTeethSelected += teethCount;
    
    if (teethCount) {
      // Process each tooth's data
      Object.values(teethMap).forEach(tooth => {
        // Check if this tooth has any treatment data
        if (tooth.dailyTreatments && tooth.dailyTreatments.length > 0) {
          hasValidToothData = true;
          
          // Calculate totals directly from dailyTreatments to ensure accuracy
            const toothTreatmentAmount = tooth.dailyTreatments.reduce(
            (sum: number, dt: { treatmentAmount: number | string }): number => 
              sum + (Number(dt.treatmentAmount) || 0), 
            0
            );
            const toothPaidAmount = tooth.dailyTreatments.reduce(
            (sum: number, dt: { paidAmount: number | string }): number => 
              sum + (Number(dt.paidAmount) || 0), 
            0
            );
          
          // Add to overall totals - use calculated values, not stored values
          totalTreatmentAmount += toothTreatmentAmount;
          totalPaidAmount += toothPaidAmount;
          
          // Count completed teeth - a tooth is completed if all its treatments are completed
          const allTreatmentsCompleted = 
            tooth.dailyTreatments.length > 0 && 
            tooth.dailyTreatments.every((dt: { isCompleted: boolean }) => dt.isCompleted === true);
            
          if (allTreatmentsCompleted) {
            totalTeethCompleted++;
          }
        }
      });
    }
  });
  
  // Round the totals to avoid floating point precision issues
  totalTreatmentAmount = Math.round(totalTreatmentAmount * 100) / 100;
  totalPaidAmount = Math.round(totalPaidAmount * 100) / 100;
  
  // Special handling for fully paid treatments
  if (Math.abs(totalTreatmentAmount - totalPaidAmount) < 0.01 && totalTreatmentAmount > 0) {
    totalPaidAmount = totalTreatmentAmount;
  }
  
  // Calculate remaining amount after rounding
  totalRemainingAmount = Math.max(0, totalTreatmentAmount - totalPaidAmount);
  
  // Only use plan-level data if there's no valid tooth data
  if (!hasValidToothData) {
    const manualTotals = plans.reduce((acc, plan) => {
      return {
        treatment: acc.treatment + (Number(plan.treatmentAmount) || 0),
        paid: acc.paid + (Number(plan.advancedAmount) || 0),
        remaining: acc.remaining + (Number(plan.balanceAmount) || 0)
      };
    }, { treatment: 0, paid: 0, remaining: 0 });
    
    totalTreatmentAmount = Math.round(manualTotals.treatment * 100) / 100;
    totalPaidAmount = Math.round(manualTotals.paid * 100) / 100;
    
    // Same special handling for plan-level data
    if (Math.abs(totalTreatmentAmount - totalPaidAmount) < 0.01 && totalTreatmentAmount > 0) {
      totalPaidAmount = totalTreatmentAmount;
    }
    
    totalRemainingAmount = Math.max(0, totalTreatmentAmount - totalPaidAmount);
  }
  
  // Calculate progress percentages more accurately
  let progressPercentage = 0;
  if (totalTeethSelected > 0) {
    progressPercentage = Math.round((totalTeethCompleted / totalTeethSelected) * 100);
  } else {
    // Fallback to plan-based calculation
    const completedPlans = plans.filter(plan => plan.isCompleted).length;
    progressPercentage = plans.length > 0 
      ? Math.round((completedPlans / plans.length) * 100) 
      : 0;
  }
  
  // Calculate payment progress - ensure we don't divide by zero
  const paymentPercentage = totalTreatmentAmount > 0 
    ? Math.min(100, Math.round((totalPaidAmount / totalTreatmentAmount) * 100))
    : 0;
  
  // Get actual number of completed plans for display
  const completedPlans = plans.filter(plan => plan.isCompleted).length;
  
  // Ensure we never display NaN or undefined in the UI
  const displayTreatmentAmount = totalTreatmentAmount || 0;
  const displayPaidAmount = totalPaidAmount || 0;
  const displayRemainingAmount = totalRemainingAmount || 0;
  
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Treatment Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">Treatment Progress</span>
                <span className="text-sm font-medium">{progressPercentage}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Plans: {plans.length}</span>
                <span>Completed Plans: {completedPlans}</span>
                <span>Teeth: {totalTeethSelected}</span>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">Payment Progress</span>
                <span className="text-sm font-medium">{paymentPercentage}%</span>
              </div>
              <Progress value={paymentPercentage} className="h-2" />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Treatment Amount</span>
              <p className="text-xl font-semibold">₹{displayTreatmentAmount}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Paid</span>
              <p className="text-xl font-semibold text-green-600">₹{displayPaidAmount}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Balance</span>
              <p className="text-xl font-semibold text-red-600">₹{displayRemainingAmount}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}