import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Patient, ToothData } from "@/types/patient";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";
import { crudRequest } from "@/lib/api";

interface PaymentHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTeethMaps: Record<string, Record<string, ToothData>>;
  groupTreatmentMaps?: Record<string, any[]>; // Add group treatment maps
  onPaymentUpdate: (
    mapKey: string,
    toothNumber: string,
    treatmentIndex: number,
    newPaidAmount: number
  ) => void;
  onGroupPaymentUpdate?: (
    mapKey: string,
    groupIndex: number,
    treatmentIndex: number,
    newPaidAmount: number
  ) => void; // Add group payment update callback
  patientId: string;
  medicalDetailId: string;
  patient: Patient; // Add the patient prop
}

export function PaymentHistoryDialog({
  isOpen,
  onClose,
  selectedTeethMaps,
  groupTreatmentMaps = {},
  onPaymentUpdate,
  onGroupPaymentUpdate,
  patientId,
  medicalDetailId,
  patient
}: PaymentHistoryDialogProps) {
  const [newPayments, setNewPayments] = useState<Record<string, number>>({});
  const [paymentMethods, setPaymentMethods] = useState<Record<string, string>>({});
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);

  const paymentMethodOptions = ["Cash", "Bank Transfer", "E-sewa", "Khalti", "Credit Card", "Debit Card", "Other"];

  // Prepare data for display - treatments with remaining balances
  const treatmentsWithBalance: {
    type: 'tooth' | 'group';
    mapKey: string;
    toothNumber?: string;
    groupIndex?: number;
    treatmentIndex: number;
    date: string;
    tooth?: ToothData;
    groupTreatment?: any;
    treatment: {
      _id?: string;
      date: string;
      treatmentAmount: number;
      paidAmount: number;
      remainingAmount: number;
      treatedByDoctor?: string | null;
      procedure?: string;
      notes?: string;
    };
  }[] = [];

  // Extract tooth-based treatments with remaining amounts
  Object.entries(selectedTeethMaps).forEach(([mapKey, teeth]) => {
    Object.entries(teeth).forEach(([toothNumber, tooth]) => {
      tooth.dailyTreatments?.forEach((treatment, index) => {
        if (treatment.remainingAmount > 0) {
          treatmentsWithBalance.push({
            type: 'tooth',
            mapKey,
            toothNumber,
            treatmentIndex: index,
            date: treatment.date,
            tooth,
            treatment: {
              ...treatment,
              _id: treatment._id
            },
          });
        }
      });
    });
  });

  // Extract group-based treatments with remaining amounts
  Object.entries(groupTreatmentMaps).forEach(([mapKey, groupTreatments]) => {
    groupTreatments?.forEach((groupTreatment, groupIndex) => {
      groupTreatment.dailyTreatments?.forEach((treatment: any, treatmentIndex: number) => {
        if (treatment.remainingAmount > 0) {
          treatmentsWithBalance.push({
            type: 'group',
            mapKey,
            groupIndex,
            treatmentIndex,
            date: treatment.date,
            groupTreatment,
            treatment: {
              ...treatment,
              _id: treatment._id
            },
          });
        }
      });
    });
  });

  const handlePaymentChange = (key: string, value: string, remainingAmount: number) => {
    // Allow string input for better user experience and precision
    if (value === "" || /^(\d+\.?\d*|\.\d+)$/.test(value)) {
      // Ensure the input doesn't exceed the remaining amount
      const numValue = value === "" ? 0 : parseFloat(value);
      const limitedValue = Math.min(numValue, remainingAmount);
      
      if (numValue > remainingAmount) {
        toast.warning("Payment cannot exceed the remaining balance");
      }
      
      // Store as number with 2 decimal places for precision
      setNewPayments((prev) => ({ ...prev, [key]: parseFloat(limitedValue.toFixed(2)) }));
    }
  };

  const handleToothPaymentSubmit = async (
    mapKey: string,
    toothNumber: string,
    treatmentIndex: number,
    currentPaid: number,
    treatmentAmount: number,
    dailyTreatmentId?: string
  ) => {
    const key = `tooth-${mapKey}-${toothNumber}-${treatmentIndex}`;
    
    if (processingPayment === key) return;
    
    const newAmount = newPayments[key] || 0;
    const remainingAmount = treatmentAmount - currentPaid;
    
    if (newAmount <= 0) {
      toast.error("Please enter a valid payment amount");
      return;
    }
    
    if (newAmount > remainingAmount) {
      toast.error("Payment cannot exceed the remaining balance of ₹" + remainingAmount);
      return;
    }
    
    try {
      setProcessingPayment(key);
      
      // Extract treatment ID from mapKey
      // mapKey format is "medicalDetailIndex-treatmentIndex"
      // For example: "0-0"
      const [_, treatmentPlanIndex] = mapKey.split("-");
      
      // Get the treatment ID directly from formData using treatmentPlanIndex
      const treatmentId = patient.medicalDetails[0]?.treatmentPlanning[parseInt(treatmentPlanIndex)]?._id;
      
      if (!dailyTreatmentId || !treatmentId) {
        toast.error(`Missing required treatment information: ${!dailyTreatmentId ? 'Treatment Entry ID' : 'Treatment Plan ID'}`);
        console.error("Missing IDs:", { dailyTreatmentId, treatmentId, mapKey, toothNumber });
        return;
      }
      
      const paymentMethod = paymentMethods[key] || "Cash";
      
      // Call backend API to update payment
      await crudRequest(
        "PATCH",
        `/patient/update-payment/${patientId}/${medicalDetailId}/${treatmentId}/${toothNumber}/${dailyTreatmentId}`,
        { 
          paidAmount: currentPaid + newAmount,
          paymentMethod: paymentMethod,
          paymentDate: new Date().toISOString()
        }
      );

      // Create invoice via centralized API
      try {
        // Normalize payment method to match backend enum
        const normalizePaymentMethod = (method: string) => {
          if (!method) return "cash";
          const methodLower = method.toLowerCase();
          
          // Handle specific payment methods
          if (methodLower.includes("khalti") || methodLower.includes("esewa") || methodLower.includes("e-sewa") || methodLower.includes("upi")) return "upi";
          if (methodLower.includes("bank") || methodLower.includes("transfer")) return "bank";
          if (methodLower.includes("card") || methodLower.includes("credit") || methodLower.includes("debit")) return "card";
          if (methodLower.includes("cash")) return "cash";
          
          return "cash";
        };

        const invoiceResponse = await crudRequest<{ success: boolean; data: { invoiceNumber: string } }>(
          "POST",
          "/invoices",
          {
            paidAmount: newAmount,
            paymentMethod: normalizePaymentMethod(paymentMethod),
            sourceType: "Patients",
            sourceId: treatmentId,
            patientId: patientId,
            date: new Date().toISOString()
          }
        );

        if (invoiceResponse.success) {
          toast.success(`Payment updated successfully. Invoice ${invoiceResponse.data.invoiceNumber} generated.`);
        } else {
          toast.warn("Payment updated successfully, but invoice generation failed");
        }
      } catch (invoiceError) {
        console.warn("Invoice generation failed:", invoiceError);
        toast.warn("Payment updated successfully, but invoice generation failed");
      }
      
      // Update UI state via parent component
      const totalPaid = currentPaid + newAmount;
      onPaymentUpdate(mapKey, toothNumber, treatmentIndex, totalPaid);
      
      // Clear this entry from newPayments
      setNewPayments((prev) => {
        const { [key]: _, ...rest } = prev;
        return rest;
      });
    } catch (error) {
      console.error("Payment update error:", error);
      toast.error("Failed to update payment: " + (error as Error).message);
    } finally {
      setProcessingPayment(null);
    }
  };

  const handleGroupPaymentSubmit = async (
    mapKey: string,
    groupIndex: number,
    treatmentIndex: number,
    currentPaid: number,
    treatmentAmount: number,
    dailyTreatmentId?: string
  ) => {
    const key = `group-${mapKey}-${groupIndex}-${treatmentIndex}`;
    
    if (processingPayment === key) return;
    
    const newAmount = newPayments[key] || 0;
    const remainingAmount = treatmentAmount - currentPaid;
    
    if (newAmount <= 0) {
      toast.error("Please enter a valid payment amount");
      return;
    }
    
    if (newAmount > remainingAmount) {
      toast.error("Payment cannot exceed the remaining balance of ₹" + remainingAmount);
      return;
    }
    
    try {
      setProcessingPayment(key);
      
      // Extract treatment ID from mapKey
      const [_, treatmentPlanIndex] = mapKey.split("-");
      
      // Get the treatment ID directly from patient data
      const treatmentId = patient.medicalDetails[0]?.treatmentPlanning[parseInt(treatmentPlanIndex)]?._id;
      
      if (!dailyTreatmentId || !treatmentId) {
        toast.error(`Missing required treatment information: ${!dailyTreatmentId ? 'Treatment Entry ID' : 'Treatment Plan ID'}`);
        console.error("Missing IDs:", { dailyTreatmentId, treatmentId, mapKey, groupIndex });
        return;
      }
      
      const paymentMethod = paymentMethods[key] || "Cash";
      
      // Call backend API to update group treatment payment
      await crudRequest(
        "PATCH",
        `/patient/update-group-payment/${patientId}/${medicalDetailId}/${treatmentId}/${groupIndex}/${dailyTreatmentId}`,
        { 
          paidAmount: currentPaid + newAmount,
          paymentMethod: paymentMethod,
          paymentDate: new Date().toISOString()
        }
      );

      // Create invoice via centralized API
      try {
        // Normalize payment method to match backend enum
        const normalizePaymentMethod = (method: string) => {
          if (!method) return "cash";
          const methodLower = method.toLowerCase();
          
          // Handle specific payment methods
          if (methodLower.includes("khalti") || methodLower.includes("esewa") || methodLower.includes("e-sewa") || methodLower.includes("upi")) return "upi";
          if (methodLower.includes("bank") || methodLower.includes("transfer")) return "bank";
          if (methodLower.includes("card") || methodLower.includes("credit") || methodLower.includes("debit")) return "card";
          if (methodLower.includes("cash")) return "cash";
          
          return "cash";
        };

        const invoiceResponse = await crudRequest<{ success: boolean; data: { invoiceNumber: string } }>(
          "POST",
          "/invoices",
          {
            paidAmount: newAmount,
            paymentMethod: normalizePaymentMethod(paymentMethod),
            sourceType: "Patients",
            sourceId: treatmentId,
            patientId: patientId,
            date: new Date().toISOString()
          }
        );

        if (invoiceResponse.success) {
          toast.success(`Group payment updated successfully. Invoice ${invoiceResponse.data.invoiceNumber} generated.`);
        } else {
          toast.warn("Group payment updated successfully, but invoice generation failed");
        }
      } catch (invoiceError) {
        console.warn("Invoice generation failed:", invoiceError);
        toast.warn("Group payment updated successfully, but invoice generation failed");
      }
      
      // Update UI state via parent component
      const totalPaid = currentPaid + newAmount;
      if (onGroupPaymentUpdate) {
        onGroupPaymentUpdate(mapKey, groupIndex, treatmentIndex, totalPaid);
      }
      
      // Clear this entry from newPayments
      setNewPayments((prev) => {
        const { [key]: _, ...rest } = prev;
        return rest;
      });
    } catch (error) {
      console.error("Group payment update error:", error);
      toast.error("Failed to update group payment: " + (error as Error).message);
    } finally {
      setProcessingPayment(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Edit Treatment Payments</DialogTitle>
        </DialogHeader>

        {treatmentsWithBalance.length === 0 ? (
          <div className="py-8 text-center">
            <p>No treatments with remaining balances found.</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            {treatmentsWithBalance.map((item, _index) => {
              const key = item.type === 'tooth' 
                ? `tooth-${item.mapKey}-${item.toothNumber}-${item.treatmentIndex}`
                : `group-${item.mapKey}-${item.groupIndex}-${item.treatmentIndex}`;
              
              return (
                <Card key={key} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium">
                          {item.type === 'tooth' 
                            ? `Tooth ${item.toothNumber} Treatment`
                            : `${item.groupTreatment?.groupName || 'Group'} Treatment - ${item.groupTreatment?.procedure || 'Treatment'}`
                          }
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Date: {format(new Date(item.treatment.date), "PP")}
                        </p>
                        {item.type === 'tooth' && item.tooth?.procedure && (
                          <p className="text-sm">
                            Procedure: {item.tooth.procedure}
                          </p>
                        )}
                        {item.type === 'group' && item.treatment.procedure && (
                          <p className="text-sm">
                            Procedure: {item.treatment.procedure}
                          </p>
                        )}
                        {item.treatment.notes && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Notes: {item.treatment.notes}
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Total</p>
                            <p className="font-medium">
                              ₹{Number(item.treatment.treatmentAmount).toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Paid</p>
                            <p className="font-medium text-green-600">
                              ₹{Number(item.treatment.paidAmount).toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Due</p>
                            <p className="font-medium text-red-600">
                              ₹{Number(item.treatment.remainingAmount).toFixed(2)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              type="text" // Change to text for better user experience
                              inputMode="decimal" // Show decimal keyboard on mobile
                              placeholder="Add payment"
                              value={newPayments[key] || ""}
                              onChange={(e) => handlePaymentChange(key, e.target.value, item.treatment.remainingAmount)}
                              max={item.treatment.remainingAmount}
                              step="0.01" // Allow decimal inputs
                            />
                            <Select
                              value={paymentMethods[key] || "Cash"}
                              onValueChange={(value) => {
                                setPaymentMethods(prev => ({ ...prev, [key]: value }));
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Payment method" />
                              </SelectTrigger>
                              <SelectContent>
                                {paymentMethodOptions.map((method) => (
                                  <SelectItem key={method} value={method}>
                                    {method}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Button 
                            onClick={() => {
                              if (item.type === 'tooth' && item.toothNumber) {
                                handleToothPaymentSubmit(
                                  item.mapKey, 
                                  item.toothNumber, 
                                  item.treatmentIndex,
                                  item.treatment.paidAmount,
                                  item.treatment.treatmentAmount,
                                  item.treatment._id
                                );
                              } else if (item.type === 'group' && item.groupIndex !== undefined) {
                                handleGroupPaymentSubmit(
                                  item.mapKey,
                                  item.groupIndex,
                                  item.treatmentIndex,
                                  item.treatment.paidAmount,
                                  item.treatment.treatmentAmount,
                                  item.treatment._id
                                );
                              }
                            }}
                            disabled={!newPayments[key] || processingPayment === key}
                            className="w-full"
                          >
                            {processingPayment === key ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : "Pay"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div className="flex justify-end mt-4">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}