import { useState } from "react";
import { format } from "date-fns";
import { toast } from "react-toastify";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { crudRequest } from "@/lib/api";
import { useDoctorContext } from "@/contexts/DoctorContext";
import { getToothPosition, getToothSide } from "@/helper/PatientHelper";
import { Patient, ToothData, DailyTreatment } from "@/types/patient";
import { EnhancedTreatmentPlanCard } from "./EnhancedTreatmentPlanCard";

interface AddXRayPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
}

type TreatmentPlan = {
  _id?: string;
  treatmentDate: string;
  treatmentDetails: string;
  treatmentFindings: string;
  treatmentAmount: string;
  advancedAmount: string;
  balanceAmount: string;
  teethNumber: string;
  treatedByDoctor: string;
  isCompleted?: boolean;
  clinicalFindings: string[];
  otherFindings: string;
  followUpDate?: string;
  treatmentDocuments?: Array<{
    fileName: string;
    fileUrl: string;
    uploadDate: string;
    publicId: string;
    description: string;
  }>;
  selectedTeethDetails?: Array<{
    number: string;
    details: string;
    procedure: string;
    dailyTreatments: Array<{
      date: string;
      treatmentAmount: number;
      paidAmount: number;
      remainingAmount: number;
      treatedByDoctor: string | null;
      notes: string;
      procedure: string;
    }>;
    totalTreatmentAmount: number;
    totalPaidAmount: number;
    totalRemainingAmount: number;
  }>;
};

const formatSafeDate = (dateString: string | undefined | null) => {
  if (!dateString) return format(new Date(), "yyyy-MM-dd");
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return format(new Date(), "yyyy-MM-dd");
    }
    return format(date, "yyyy-MM-dd");
  } catch {
    return format(new Date(), "yyyy-MM-dd");
  }
};

const AddXRayPlanModal: React.FC<AddXRayPlanModalProps> = ({
  isOpen,
  onClose,
  patient,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { doctors } = useDoctorContext();
  const [activeTab, setActiveTab] = useState("details");

  // Initialize with a single empty treatment plan
  const [treatmentPlan, setTreatmentPlan] = useState<TreatmentPlan>({
    treatmentDate: formatSafeDate(new Date().toISOString()),
    treatmentDetails: "",
    treatmentFindings: "",
    treatedByDoctor: "",
    treatmentAmount: "0",
    advancedAmount: "0",
    balanceAmount: "0",
    teethNumber: "",
    clinicalFindings: [],
    otherFindings: "",
    selectedTeethDetails: [],
    treatmentDocuments: [],
    isCompleted: false,
  });

  const [selectedTeethMap, setSelectedTeethMap] = useState<Record<string, ToothData>>({});

  const handleTreatmentChange = (field: string, value: any) => {
    setTreatmentPlan((prev) => {
      let updatedPlan = { ...prev };

      if (field === "treatmentAmount" || field === "advancedAmount") {
        const treatmentAmount =
          field === "treatmentAmount"
            ? parseFloat(value) || 0
            : parseFloat(prev.treatmentAmount.toString()) || 0;

        let advancedAmount =
          field === "advancedAmount"
            ? parseFloat(value) || 0
            : parseFloat(prev.advancedAmount.toString()) || 0;

        if (field === "advancedAmount" && advancedAmount > treatmentAmount) {
          advancedAmount = treatmentAmount;
          toast.warning("Advanced amount cannot exceed treatment amount");
        }

        const balanceAmount = treatmentAmount - advancedAmount;

        updatedPlan = {
          ...prev,
          treatmentAmount: treatmentAmount.toString(),
          advancedAmount: advancedAmount.toString(),
          balanceAmount: balanceAmount.toString(),
        };
      } else {
        updatedPlan = { ...prev, [field]: value };
      }

      return updatedPlan;
    });
  };

  const handleToothSelect = (toothNumber: string) => {
    setSelectedTeethMap((prev) => {
      const currentTeeth = { ...prev };

      if (currentTeeth[toothNumber]) {
        // Create a new object without this tooth
        const { [toothNumber]: _, ...rest } = currentTeeth;
        return rest;
      } else {
        // Add a default daily treatment with a small amount when adding a new tooth
        const today = format(new Date(), "yyyy-MM-dd");
        const defaultTreatment: DailyTreatment = {
          date: today,
          treatmentAmount: 100, // Default amount
          paidAmount: 0,
          remainingAmount: 100,
          treatedByDoctor: "", // You might want to set a default doctor
          procedure: "",
          notes: "Initial treatment",
        };

        return {
          ...currentTeeth,
          [toothNumber]: {
            number: toothNumber,
            details: "",
            procedure: "",
            position: getToothPosition(toothNumber),
            side: getToothSide(toothNumber),
            dailyTreatments: [defaultTreatment], // Add the default treatment
            totalTreatmentAmount: 100, // Default treatment amount
            totalPaidAmount: 0,
            totalRemainingAmount: 100,
          },
        };
      }
    });

    // Update treatment plan with selected teeth
    setTimeout(() => {
      const selectedTeethArray = Object.entries(selectedTeethMap).map(([number, data]) => ({
        number,
        details: data.details || "",
        procedure: data.procedure || "",
        position: getToothPosition(number),
        side: getToothSide(number),
        dailyTreatments: data.dailyTreatments.map((dt) => ({
          date: dt.date,
          treatmentAmount: dt.treatmentAmount,
          paidAmount: dt.paidAmount,
          remainingAmount: dt.remainingAmount,
          treatedByDoctor: dt.treatedByDoctor,
          procedure: dt.procedure || "",
          notes: dt.notes || "",
        })),
        totalTreatmentAmount: data.totalTreatmentAmount,
        totalPaidAmount: data.totalPaidAmount,
        totalRemainingAmount: data.totalRemainingAmount,
      }));

      setTreatmentPlan(prev => ({
        ...prev,
        teethNumber: selectedTeethArray.map(t => t.number).join(", "),
        selectedTeethDetails: selectedTeethArray,
      }));
    }, 0);
  };

  const handleToothDetailsChange = (toothNumber: string, details: string) => {
    setSelectedTeethMap((prev) => ({
      ...prev,
      [toothNumber]: {
        ...(prev[toothNumber] || {}),
        details,
      },
    }));
  };

  const handleToothProcedureChange = (toothNumber: string, procedure: string) => {
    setSelectedTeethMap((prev) => ({
      ...prev,
      [toothNumber]: {
        ...(prev[toothNumber] || {}),
        procedure,
      },
    }));
  };

  const handleDailyTreatmentAdd = (toothNumber: string, treatment: DailyTreatment) => {
    setSelectedTeethMap((prev) => {
      // Create deep copies to avoid reference issues
      const prevMapCopy = JSON.parse(JSON.stringify(prev)) as Record<string, ToothData>;

      // Ensure the tooth exists
      if (!prevMapCopy[toothNumber]) {
        // Initialize with default values if tooth doesn't exist
        prevMapCopy[toothNumber] = {
          number: toothNumber,
          details: "",
          procedure: "",
          dailyTreatments: [],
          totalTreatmentAmount: 0,
          totalPaidAmount: 0,
          totalRemainingAmount: 0,
          isCompleted: false,
        };
      }

      const currentTooth = prevMapCopy[toothNumber];

      // Find if there's an existing treatment with the same date to update it
      const existingIndex = currentTooth.dailyTreatments.findIndex(
        (t) => t.date === treatment.date && t._id === treatment._id
      );

      if (existingIndex >= 0) {
        // Update existing treatment
        currentTooth.dailyTreatments[existingIndex] = treatment;
      } else {
        // Add new treatment
        currentTooth.dailyTreatments.push(treatment);
      }

      // Always recalculate totals after any change
      currentTooth.totalTreatmentAmount = currentTooth.dailyTreatments.reduce(
        (sum, t) => sum + (Number(t.treatmentAmount) || 0),
        0
      );
      currentTooth.totalPaidAmount = currentTooth.dailyTreatments.reduce(
        (sum, t) => sum + (Number(t.paidAmount) || 0),
        0
      );
      currentTooth.totalRemainingAmount = Math.max(
        0,
        currentTooth.totalTreatmentAmount - currentTooth.totalPaidAmount
      );

      return prevMapCopy;
    });
  };

  const formatDataForBackend = () => {
    // Get the current medical details array or initialize it if empty
    const currentMedicalDetails = patient.medicalDetails && patient.medicalDetails.length > 0 
      ? JSON.parse(JSON.stringify(patient.medicalDetails)) 
      : [{
          chiefComplaint: "",
          diagnosis: "",
          investigation: { blood: "", xray: "" },
          patientType: "Adult",
          medicalHistory: {
            bloodPressure: "",
            diabetes: false,
            thyroid: false,
            bleedingDisorder: false,
            pregnancy: false,
            asthma: false,
            allergies: "",
            otherConditions: "",
            noMedicalIssues: false
          },
          treatmentPlanning: []
        }];
    
    // Format the new treatment plan
    const formattedTreatmentPlan = {
      ...treatmentPlan,
      treatmentDate: formatSafeDate(treatmentPlan.treatmentDate),
      treatmentAmount: Number(treatmentPlan.treatmentAmount) || 0,
      advancedAmount: Number(treatmentPlan.advancedAmount) || 0,
      balanceAmount: Number(treatmentPlan.balanceAmount) || 0,
      followUpDate: treatmentPlan.followUpDate ? formatSafeDate(treatmentPlan.followUpDate) : undefined,
      selectedTeethDetails: Object.entries(selectedTeethMap).map(([number, toothData]) => {
        // Format dailyTreatments for each tooth
        const formattedDailyTreatments = toothData.dailyTreatments?.map((treatment) => ({
          date: formatSafeDate(treatment.date),
          treatmentAmount: Number(treatment.treatmentAmount) || 0,
          paidAmount: Number(treatment.paidAmount) || 0,
          remainingAmount: Number(treatment.remainingAmount) || 0,
          treatedByDoctor: treatment.treatedByDoctor || null,
          notes: treatment.notes || "",
          procedure: treatment.procedure || "",
          isCompleted: treatment.isCompleted || false,
        })) || [];

        return {
          number,
          details: toothData.details || "",
          position: getToothPosition(number),
          side: getToothSide(number),
          procedure: toothData.procedure || "",
          dailyTreatments: formattedDailyTreatments,
          totalTreatmentAmount: toothData.totalTreatmentAmount || 0,
          totalPaidAmount: toothData.totalPaidAmount || 0,
          totalRemainingAmount: toothData.totalRemainingAmount || 0,
        };
      }),
    };

    // Add the new treatment plan to the existing medical details
    // Use a type assertion to avoid TypeScript errors
    if (currentMedicalDetails[0].treatmentPlanning) {
      (currentMedicalDetails[0].treatmentPlanning as any[]).push(formattedTreatmentPlan);
    } else {
      currentMedicalDetails[0].treatmentPlanning = [formattedTreatmentPlan];
    }

    return {
      medicalDetails: currentMedicalDetails
    };
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      const formattedData = formatDataForBackend();

      // Send the API request to update the patient with the new treatment plan
      await crudRequest(
        "PUT",
        `/patient/update-patient/${patient._id}`,
        formattedData
      );

      // Handle success
      toast.success("X-Ray plan added successfully!");
      onClose();
      window.location.reload(); // Reload the page to reflect changes
    } catch (error) {
      toast.error("Failed to add X-Ray plan");
      console.error("Error adding X-Ray plan:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-screen h-[100dvh] max-w-none m-0 p-0 rounded-none border-none bg-background/95 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/60 overflow-hidden">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex flex-col h-[calc(100vh-5rem)]"
        >
          <TabsList className="grid w-full grid-cols-2 gap-2 px-2 py-1 text-center bg-muted/40 sticky z-40">
            <TabsTrigger
              value="details"
              className="flex items-center justify-center gap-1 text-sm sm:text-base sm:gap-2 transition-all duration-200 hover:bg-accent data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              X-Ray Plan Details
            </TabsTrigger>
            <TabsTrigger
              value="teeth"
              className="flex items-center justify-center gap-1 text-sm sm:text-base sm:gap-2 transition-all duration-200 hover:bg-accent data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Teeth Selection
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto px-2 py-2">
            <TabsContent
              value="details"
              className="mt-0 focus-visible:outline-none focus-visible:ring-0"
            >
              <Card className="border-none shadow-none">
                <CardContent className="p-4 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs sm:text-sm">Treatment Date</Label>
                      <Input
                        type="date"
                        value={treatmentPlan.treatmentDate}
                        onChange={(e) =>
                          handleTreatmentChange("treatmentDate", e.target.value)
                        }
                        className="text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs sm:text-sm">Clinical Findings</Label>
                      <Select
                        value={treatmentPlan.clinicalFindings[0] || ""}
                        onValueChange={(value) =>
                          handleTreatmentChange(
                            "clinicalFindings",
                            treatmentPlan.clinicalFindings.includes(value)
                              ? treatmentPlan.clinicalFindings.filter((v) => v !== value)
                              : [...treatmentPlan.clinicalFindings, value]
                          )
                        }
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Select findings" />
                        </SelectTrigger>
                        <SelectContent className="text-sm">
                          {[
                            "Caries",
                            "Decayed",
                            "Missing",
                            "Crowding",
                            "Swelling",
                            "Enlargement",
                            "Bleeding",
                            "Bad Breathing",
                            "Impaction",
                            "Pericoronitis",
                            "Food Lodgment",
                            "Attrition",
                            "Abrasion",
                          ].map((finding) => (
                            <SelectItem key={finding} value={finding}>
                              {finding}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs sm:text-sm">
                        Treatment Procedure
                      </Label>
                      <Textarea
                        value={treatmentPlan.treatmentFindings}
                        onChange={(e) =>
                          handleTreatmentChange("treatmentFindings", e.target.value)
                        }
                        className="min-h-[80px] sm:min-h-[100px] text-sm resize-y"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs sm:text-sm">Other Findings</Label>
                      <Textarea
                        value={treatmentPlan.otherFindings}
                        onChange={(e) =>
                          handleTreatmentChange("otherFindings", e.target.value)
                        }
                        className="min-h-[80px] sm:min-h-[100px] text-sm resize-y"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs sm:text-sm">Follow-up Date</Label>
                      <Input
                        type="date"
                        value={treatmentPlan.followUpDate}
                        onChange={(e) =>
                          handleTreatmentChange("followUpDate", e.target.value)
                        }
                        className="text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs sm:text-sm">Treated By Doctor</Label>
                      <Select
                        value={treatmentPlan.treatedByDoctor}
                        onValueChange={(value) =>
                          handleTreatmentChange("treatedByDoctor", value)
                        }
                      >
                        <SelectTrigger className="text-sm">
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
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="teeth">
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-4 space-y-6">
                    <EnhancedTreatmentPlanCard
                      treatmentIndex={0}
                      plan={treatmentPlan}
                      selectedTeethMap={selectedTeethMap}
                      patientId={patient._id}
                      medicalDetailId={patient.medicalDetails[0]?._id || ""}
                      patientType={patient.medicalDetails[0]?.patientType || "Adult"}
                      doctors={doctors}
                      onRemove={() => {}}  // We don't need remove functionality here
                      onTreatmentChange={handleTreatmentChange}
                      onToothSelect={handleToothSelect}
                      onToothDetailsChange={handleToothDetailsChange}
                      onToothProcedureChange={handleToothProcedureChange}
                      onDailyTreatmentAdd={handleDailyTreatmentAdd}
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </div>
        </Tabs>
        <div className="fixed bottom-0 left-0 right-0 p-2 bg-background/95 border-t flex justify-between sm:justify-end gap-2 sm:gap-4 z-50">
          <Button
            variant="outline"
            onClick={onClose}
            className="min-w-[80px] sm:min-w-[100px] text-xs sm:text-sm"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="min-w-[80px] sm:min-w-[100px] text-xs sm:text-sm"
          >
            {isSubmitting ? "Adding..." : "Add X-Ray Plan"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddXRayPlanModal; 