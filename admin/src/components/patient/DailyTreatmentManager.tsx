import { useState } from "react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import { DailyTreatment, ToothData } from "@/types/patient";
import { procedureColors } from "../DentalChart";
import { Checkbox } from "../ui/checkbox";
import { crudRequest } from "@/lib/api";
import { toast } from "react-toastify";
import { Textarea } from "@/components/ui/textarea";

export type Doctor = {
  _id: string;
  name: string;
  // other fields...
};

interface DailyTreatmentManagerProps {
  toothNumber: string;
  toothData: ToothData;
  doctors: Doctor[];
  onAddTreatment: (toothNumber: string, treatment: DailyTreatment) => void;
  patientId: string; // Add these two required props
  medicalDetailId: string;
}

export function DailyTreatmentManager({
  toothNumber,
  toothData,
  doctors,
  onAddTreatment,
  patientId,
  medicalDetailId,
}: DailyTreatmentManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newTreatment, setNewTreatment] = useState<DailyTreatment>({
    date: format(new Date(), "yyyy-MM-dd"),
    treatmentAmount: 0,
    paidAmount: 0,
    remainingAmount: 0,
    treatedByDoctor: "",
    procedure: "RVG X-Ray",
    notes: "",
    isCompleted: false,
  });

  const [updatingTreatmentId, setUpdatingTreatmentId] = useState<string | null>(
    null
  );

  const handleChange = (field: keyof DailyTreatment, value: any) => {
    setNewTreatment((prev) => {
      const updated = { ...prev, [field]: value };

      // Automatically calculate remaining amount when treatment or paid amount changes
      if (field === "treatmentAmount" || field === "paidAmount") {
        const treatmentAmount =
          field === "treatmentAmount" ? Number(value) : prev.treatmentAmount;
        const paidAmount =
          field === "paidAmount" ? Number(value) : prev.paidAmount;
        updated.remainingAmount = treatmentAmount - paidAmount;
      }

      return updated;
    });
  };

  const handleAddTreatment = () => {
    // Ensure we have a procedure - set default to RVG X-Ray if not specified
    if (!newTreatment.procedure) {
      newTreatment.procedure = "RVG X-Ray";
    }
    
    // Create a deep clone of the treatment to avoid reference issues
    const treatmentClone = JSON.parse(JSON.stringify(newTreatment));
    
    // Ensure numeric fields are actually numbers
    treatmentClone.treatmentAmount = Number(treatmentClone.treatmentAmount);
    treatmentClone.paidAmount = Number(treatmentClone.paidAmount);
    treatmentClone.remainingAmount = Number(treatmentClone.remainingAmount);
    
    // Add a temporary ID to help track this treatment
    if (!treatmentClone._id) {
      treatmentClone._id = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    console.log("Adding treatment in DailyTreatmentManager:", {
      toothNumber,
      treatment: treatmentClone,
      existingTreatments: toothData.dailyTreatments?.length || 0
    });
    
    // Call the parent component's callback with the cloned treatment
    onAddTreatment(toothNumber, treatmentClone);

    // Reset form with today's date but keep the doctor selected
    setNewTreatment({
      date: format(new Date(), "yyyy-MM-dd"),
      treatmentAmount: 0,
      paidAmount: 0,
      remainingAmount: 0,
      treatedByDoctor: newTreatment.treatedByDoctor,
      procedure: "RVG X-Ray", // Default to RVG X-Ray
      notes: "",
      isCompleted: false,
    });

    // Add this to provide user feedback
    toast.success("Treatment entry added successfully");
    
    // Set the collapsible closed to show the treatment history
    setIsOpen(false);
  };

  const handleTreatmentStatusChange = async (
    dailyTreatmentId: string,
    isCompleted: boolean
  ) => {
    try {
      setUpdatingTreatmentId(dailyTreatmentId);

      const treatmentId = toothData.treatmentId || "";
      const toothNumber = toothData.number;

      // Improved validation with better error message
      if (!toothNumber || !dailyTreatmentId) {
        console.error("Missing required IDs:", { treatmentId, toothNumber, dailyTreatmentId });
        toast.error("Cannot update treatment: Missing tooth number or treatment ID");
        return;
      }
      
      // Check if treatmentId is missing or temporary
      if (!treatmentId || treatmentId === 'new_plan' || treatmentId.startsWith('temp_')) {
        console.log("Skipping status update - treatment ID is temporary:", treatmentId);
        toast.info("This treatment must be saved first before status can be updated");
        return;
      }

      console.log("Updating treatment status with:", {
        patientId,
        medicalDetailId,
        treatmentId,
        toothNumber,
        dailyTreatmentId,
        isCompleted
      });

      const response: { success: boolean; message?: string } = await crudRequest(
        "PATCH",
        `/patient/tooth-status/${patientId}/${medicalDetailId}/${treatmentId}/${toothNumber}/${dailyTreatmentId}`,
        { isCompleted }
      );

      if (response?.success) {
        // Success case handling
        toast.success(response.message || `Treatment ${isCompleted ? "completed" : "marked as pending"} successfully`);
        
        // Find the specific treatment that was changed
        const changedTreatmentIndex = toothData.dailyTreatments.findIndex(t => t._id === dailyTreatmentId);
        
        if (changedTreatmentIndex !== -1) {
          // Create a deep copy of the treatment to avoid reference issues
          const updatedTreatment = JSON.parse(JSON.stringify(toothData.dailyTreatments[changedTreatmentIndex]));
          
          // Update the completed status
          updatedTreatment.isCompleted = isCompleted;
          
          console.log("Found treatment to update:", {
            index: changedTreatmentIndex,
            originalTreatment: toothData.dailyTreatments[changedTreatmentIndex],
            updatedTreatment
          });
          
          // Use the onAddTreatment callback to update the parent state with the updated treatment
          onAddTreatment(toothNumber, updatedTreatment);
          
          // Also update the local state for immediate UI feedback
          const updatedTreatments = [...toothData.dailyTreatments];
          updatedTreatments[changedTreatmentIndex] = updatedTreatment;
          toothData.dailyTreatments = updatedTreatments;
        } else {
          console.error("Could not find treatment with ID:", dailyTreatmentId);
          toast.warning("Treatment status updated on server but UI may be out of sync. Please refresh.");
        }
      } else {
        throw new Error(response?.message || "Failed to update treatment status");
      }
    } catch (error) {
      console.error("Error updating treatment status:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error("Failed to update treatment status: " + errorMessage);
    } finally {
      setUpdatingTreatmentId(null);
    }
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-medium">Tooth {toothNumber} Treatment</h3>
          <div className="text-sm font-normal opacity-95">
            <span className="mr-2">
              Total: ₹{toothData.totalTreatmentAmount || 0}
            </span>
            <span className="text-green-600 mr-2">
              Paid: ₹{toothData.totalPaidAmount || 0}
            </span>
            <span className="text-red-600">
              Due: ₹{toothData.totalRemainingAmount || 0}
            </span>
          </div>
        </div>

        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="default" size="sm" className="w-full mb-3">
              <div className="flex justify-between items-center w-full">
                <span>Add Daily Treatment</span>
                {!isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </div>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 border rounded-md mb-3">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={newTreatment.date}
                  onChange={(e) => handleChange("date", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Doctor</Label>
                <Select
                  value={newTreatment.treatedByDoctor || ""}
                  onValueChange={(value) =>
                    handleChange("treatedByDoctor", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor._id} value={doctor._id}>
                        {doctor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Procedure</Label>
                <Select
                  value={newTreatment.procedure || ""}
                  onValueChange={(value) => handleChange("procedure", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select procedure" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(procedureColors).map(
                      ([proc, { color }]) => (
                        <SelectItem key={proc} value={proc}>
                          <div className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${color}`} />
                            <span>{proc}</span>
                          </div>
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Treatment Amount (₹)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newTreatment.treatmentAmount || ""}
                  onChange={(e) =>
                    handleChange("treatmentAmount", Number(e.target.value))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Paid Amount (₹)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newTreatment.paidAmount || ""}
                  onChange={(e) =>
                    handleChange("paidAmount", Number(e.target.value))
                  }
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Treatment notes"
                  value={newTreatment.notes || ""}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  className="min-h-[100px] resize-y"
                />
              </div>
              <div className="col-span-2">
                <Button
                  onClick={handleAddTreatment}
                  className="w-full"
                  disabled={!newTreatment.date || !newTreatment.treatmentAmount}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Treatment Entry
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {toothData.dailyTreatments && toothData.dailyTreatments.length > 0 && (
          <div className="border rounded-md overflow-hidden">
            <div className="bg-muted/30 p-2">
              <h4 className="text-sm font-medium">
                Treatment History ({toothData.dailyTreatments.length} entries)
              </h4>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Procedure</TableHead> {/* Add this new column */}
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Remaining</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Completed</TableHead> {/* Add this new column */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {toothData.dailyTreatments.map((treatment, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      {format(new Date(treatment.date), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>
                      {treatment.treatedByDoctor &&
                      typeof treatment.treatedByDoctor === "object" &&
                      "name" in treatment.treatedByDoctor
                        ? (treatment.treatedByDoctor as Doctor).name
                        : doctors.find(
                            (d) => d._id === treatment.treatedByDoctor
                          )?.name || "Unknown"}
                    </TableCell>
                    <TableCell>{treatment.procedure || "-"}</TableCell>
                    <TableCell className="text-right">
                      ₹{treatment.treatmentAmount}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      ₹{treatment.paidAmount}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      ₹{treatment.remainingAmount}
                    </TableCell>
                    <TableCell
                      className="truncate max-w-[120px]"
                      title={treatment.notes}
                    >
                      {treatment.notes || "-"}
                    </TableCell>
                    <TableCell>
                      <Checkbox
                        checked={treatment.isCompleted || false}
                        onCheckedChange={(checked) => {
                          handleTreatmentStatusChange(
                            treatment._id || "",
                            !!checked
                          );
                        }}
                        disabled={updatingTreatmentId === treatment._id}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
