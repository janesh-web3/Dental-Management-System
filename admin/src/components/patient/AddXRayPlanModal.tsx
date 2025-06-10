import { useState, useEffect } from "react";
import { format } from "date-fns";
import { toast } from "react-toastify";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import DentalChart from "../DentalChart";
import ChildDentalChart from "../ChildDentalChart";
import { crudRequest } from "@/lib/api";
import { useDoctorContext } from "@/contexts/DoctorContext";
import { getToothPosition, getToothSide } from "@/helper/PatientHelper";
import { Patient, ToothData, DailyTreatment } from "@/types/patient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface AddXRayPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  onSuccess?: () => void;
}

const AddXRayPlanModal = ({
  isOpen,
  onClose,
  patient,
  onSuccess,
}: AddXRayPlanModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { doctors } = useDoctorContext();
  const [selectedTeeth, setSelectedTeeth] = useState<Record<string, ToothData>>({});
  const [activeTab, setActiveTab] = useState<string>("details");
  const [patientType, setPatientType] = useState<"Adult" | "Child">(
    patient.medicalDetails[0]?.patientType || "Adult"
  );

  // Form state
  const [treatmentPlan, setTreatmentPlan] = useState({
    treatmentDate: format(new Date(), "yyyy-MM-dd"),
    treatmentDetails: "",
    treatmentFindings: "",
    treatedByDoctor: "",
    clinicalFindings: [] as string[],
    otherFindings: "",
    followUpDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"), // Default to 1 week later
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedTeeth({});
      setTreatmentPlan({
        treatmentDate: format(new Date(), "yyyy-MM-dd"),
        treatmentDetails: "",
        treatmentFindings: "",
        treatedByDoctor: "",
        clinicalFindings: [],
        otherFindings: "",
        followUpDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
      });
      
      // Set patient type from patient data
      if (patient.medicalDetails && patient.medicalDetails.length > 0) {
        setPatientType(patient.medicalDetails[0].patientType || "Adult");
      }
    }
  }, [isOpen, patient]);

  const handleToothSelect = (toothNumber: string) => {
    setSelectedTeeth((prev) => {
      if (prev[toothNumber]) {
        // Remove tooth if already selected
        const { [toothNumber]: _, ...rest } = prev;
        return rest;
      } else {
        // Add tooth with default values
        const today = format(new Date(), "yyyy-MM-dd");
        const defaultTreatment: DailyTreatment = {
          date: today,
          treatmentAmount: 0,
          paidAmount: 0,
          remainingAmount: 0,
          treatedByDoctor: "",
          procedure: "",
          notes: "",
        };

        return {
          ...prev,
          [toothNumber]: {
            number: toothNumber,
            details: "",
            procedure: "",
            position: getToothPosition(toothNumber),
            side: getToothSide(toothNumber),
            dailyTreatments: [defaultTreatment],
            totalTreatmentAmount: 0,
            totalPaidAmount: 0,
            totalRemainingAmount: 0,
          },
        };
      }
    });
  };

  const handleInputChange = (field: string, value: any) => {
    setTreatmentPlan((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleClinicalFindingChange = (value: string) => {
    setTreatmentPlan((prev) => {
      const findings = [...prev.clinicalFindings];
      
      if (findings.includes(value)) {
        return {
          ...prev,
          clinicalFindings: findings.filter(f => f !== value),
        };
      } else {
        return {
          ...prev,
          clinicalFindings: [...findings, value],
        };
      }
    });
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      if (Object.keys(selectedTeeth).length === 0) {
        toast.warning("Please select at least one tooth");
        setIsSubmitting(false);
        return;
      }

      // Format the selected teeth for the API
      const selectedTeethDetails = Object.entries(selectedTeeth).map(([number, toothData]) => ({
        number,
        details: toothData.details || "",
        position: getToothPosition(number),
        side: getToothSide(number),
        procedure: toothData.procedure || "",
        dailyTreatments: toothData.dailyTreatments.map(dt => ({
          date: dt.date,
          treatmentAmount: Number(dt.treatmentAmount) || 0,
          paidAmount: Number(dt.paidAmount) || 0,
          remainingAmount: Number(dt.remainingAmount) || 0,
          treatedByDoctor: dt.treatedByDoctor || null,
          procedure: dt.procedure || "",
          notes: dt.notes || "",
          isCompleted: dt.isCompleted || false,
        })),
        totalTreatmentAmount: toothData.totalTreatmentAmount || 0,
        totalPaidAmount: toothData.totalPaidAmount || 0,
        totalRemainingAmount: toothData.totalRemainingAmount || 0,
      }));

      // Create new treatment plan data
      const newTreatmentPlan = {
        treatmentDate: treatmentPlan.treatmentDate,
        treatmentDetails: treatmentPlan.treatmentDetails || "X-Ray Plan",
        treatmentFindings: treatmentPlan.treatmentFindings,
        treatedByDoctor: treatmentPlan.treatedByDoctor,
        treatmentAmount: "0", // Default to 0
        advancedAmount: "0", // Default to 0
        balanceAmount: "0", // Default to 0
        teethNumber: Object.keys(selectedTeeth).join(", "),
        clinicalFindings: treatmentPlan.clinicalFindings,
        otherFindings: treatmentPlan.otherFindings,
        followUpDate: treatmentPlan.followUpDate,
        selectedTeethDetails,
        isCompleted: false,
      };

      // Get the current patient data
      const existingPatient = await crudRequest<Patient>("GET", `/patient/get-single-patient/${patient._id}`);
      
      if (!existingPatient || !existingPatient.medicalDetails || existingPatient.medicalDetails.length === 0) {
        throw new Error("Patient data not found");
      }

      // Add the new treatment plan to the existing ones
      const updatedMedicalDetails = {
        ...existingPatient.medicalDetails[0],
        patientType: patientType,
        treatmentPlanning: [
          ...existingPatient.medicalDetails[0].treatmentPlanning,
          newTreatmentPlan
        ]
      };

      // Update the patient with the new treatment plan
      await crudRequest("PUT", `/patient/update-patient/${patient._id}`, {
        personalDetails: existingPatient.personalDetails,
        medicalDetails: [updatedMedicalDetails]
      });

      toast.success("X-ray plan added successfully");
      
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (error) {
      console.error("Error adding X-ray plan:", error);
      toast.error("Failed to add X-ray plan");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Add X-Ray Plan for {patient.personalDetails.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Plan Details</TabsTrigger>
            <TabsTrigger value="teeth">
              Select Teeth ({Object.keys(selectedTeeth).length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Patient Type</Label>
                <Select
                  value={patientType}
                  onValueChange={(value: "Adult" | "Child") => setPatientType(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select patient type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Adult">Adult</SelectItem>
                    <SelectItem value="Child">Child</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Treatment Date</Label>
                <Input
                  type="date"
                  value={treatmentPlan.treatmentDate}
                  onChange={(e) => handleInputChange("treatmentDate", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Doctor</Label>
                <Select
                  value={treatmentPlan.treatedByDoctor}
                  onValueChange={(value) => handleInputChange("treatedByDoctor", value)}
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

              <div className="space-y-2">
                <Label>Follow-up Date</Label>
                <Input
                  type="date"
                  value={treatmentPlan.followUpDate}
                  onChange={(e) => handleInputChange("followUpDate", e.target.value)}
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label>Clinical Findings</Label>
                <div className="flex flex-wrap gap-2 mt-2">
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
                    <Badge
                      key={finding}
                      variant={treatmentPlan.clinicalFindings.includes(finding) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleClinicalFindingChange(finding)}
                    >
                      {finding}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2 col-span-2">
                <Label>Treatment Procedure</Label>
                <Textarea
                  value={treatmentPlan.treatmentFindings}
                  onChange={(e) => handleInputChange("treatmentFindings", e.target.value)}
                  className="min-h-[100px]"
                  placeholder="Enter treatment procedure details"
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label>Other Findings</Label>
                <Textarea
                  value={treatmentPlan.otherFindings}
                  onChange={(e) => handleInputChange("otherFindings", e.target.value)}
                  className="min-h-[100px]"
                  placeholder="Enter any other findings"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="teeth" className="space-y-4 pt-4">
            <div className="border rounded-lg p-4 overflow-x-auto">
              <div className="min-width-full w-full max-w-[800px] mx-auto">
                {patientType === "Child" ? (
                  <ChildDentalChart
                    selectedTeeth={selectedTeeth}
                    onToothSelect={handleToothSelect}
                    readOnly={false}
                  />
                ) : (
                  <DentalChart
                    selectedTeeth={selectedTeeth}
                    onToothSelect={handleToothSelect}
                    readOnly={false}
                  />
                )}
              </div>
            </div>

            {Object.keys(selectedTeeth).length > 0 && (
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Selected Teeth</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(selectedTeeth).map(([number, _]) => (
                    <Badge key={number} variant="secondary">
                      Tooth {number}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save X-Ray Plan"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddXRayPlanModal; 