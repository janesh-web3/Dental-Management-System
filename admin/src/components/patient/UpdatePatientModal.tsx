import { useEffect, useState } from "react";
import { format } from "date-fns";
import { toast } from "react-toastify";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, User, Activity, Wallet, FileDigit, File, Download, Stethoscope } from "lucide-react";
import { crudRequest } from "@/lib/api";
import { useDoctorContext } from "@/contexts/DoctorContext";
import { getToothPosition, getToothSide } from "@/helper/PatientHelper";
import { Patient, ToothData, DailyTreatment } from "@/types/patient";
import { EnhancedTreatmentPlanCard } from "./EnhancedTreatmentPlanCard";
import { TreatmentSummary } from "./TreatmentSummary";
import { PaymentHistoryDialog } from "./PaymentHistoryDialog";
import { DocumentComparison } from "./DocumentComparison";
import { PatientDocumentUploadButton } from "./PatientDocumentUploadButton";

interface UpdatePatientModalProps {
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

type MedicalHistory = {
  bloodPressure: string;
  diabetes: boolean;
  thyroid: boolean;
  bleedingDisorder: boolean;
  pregnancy: boolean;
  asthma: boolean;
  allergies: string;
  otherConditions: string;
  noMedicalIssues: boolean; // Add this field
};

type FormData = {
  personalDetails: {
    name: string;
    contactNumber: string;
    emailAddress: string;
    address: string;
    sn: string;
    age: number;
    gender: string;
    checkUpDate: string;
    referredBy: string;
  };
  medicalDetails: {
    followUpDate: string;
    diagnosis: string;
    investigation: {
      blood: string;
      xray: string;
    };
    patientType: "Child" | "Adult";
    medicalHistory: MedicalHistory;
    treatmentPlanning: TreatmentPlan[];
    chiefComplaint?: string;
  };
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

const UpdatePatientModal: React.FC<UpdatePatientModalProps> = ({
  isOpen,
  onClose,
  patient,
}) => {
  const [activeTab, setActiveTab] = useState("personal");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { doctors } = useDoctorContext();
  const [focusedTab, setFocusedTab] = useState<"personal" | "medical" | "financial" | "documents">(
    "personal"
  );
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    personalDetails: {
      name: "",
      contactNumber: "",
      gender: "Male",
      sn: "",
      address: "",
      age: 0,
      emailAddress: "",
      referredBy: "",
      checkUpDate: format(new Date(), "yyyy-MM-dd"),
    },
    medicalDetails: {
      followUpDate: "",
      diagnosis: "",
      investigation: {
        blood: "",
        xray: "",
      },
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
        noMedicalIssues: false, // Add default value
      },
      treatmentPlanning: [],
      chiefComplaint: "",
    },
  });

  useEffect(() => {
    if (patient) {
      setFormData({
        personalDetails: {
          name: patient.personalDetails.name,
          contactNumber: patient.personalDetails.contactNumber,
          gender: patient.personalDetails.gender,
          sn: patient.personalDetails.sn,
          address: patient.personalDetails.address,
          age: Number(patient.personalDetails.age),
          emailAddress: patient.personalDetails.emailAddress,
          referredBy: patient.personalDetails.referredBy,
          checkUpDate: formatSafeDate(patient.personalDetails.checkUpDate),
        },
        medicalDetails: {
          chiefComplaint: patient.medicalDetails[0]?.chiefComplaint || "",
          followUpDate: formatSafeDate(patient.medicalDetails[0]?.followUpDate),
          diagnosis: patient.medicalDetails[0]?.diagnosis || "",
          investigation: {
            blood: patient.medicalDetails[0]?.investigation?.blood || "",
            xray: patient.medicalDetails[0]?.investigation?.xray || "",
          },
          patientType: patient.medicalDetails[0]?.patientType || "Adult",
          medicalHistory: patient.medicalDetails[0]?.medicalHistory || {
            bloodPressure: "",
            diabetes: false,
            thyroid: false,
            bleedingDisorder: false,
            pregnancy: false,
            asthma: false,
            allergies: "",
            otherConditions: "",
            noMedicalIssues: patient.medicalDetails[0]?.medicalHistory?.noMedicalIssues || false,
          },
          treatmentPlanning:
            patient.medicalDetails[0]?.treatmentPlanning?.map((plan) => ({
              ...plan,
              treatmentAmount: plan.treatmentAmount?.toString() || "0",
              advancedAmount: plan.advancedAmount?.toString() || "0",
              balanceAmount: plan.balanceAmount?.toString() || "0",
              treatedByDoctor: plan.treatedByDoctor?._id || "", // Assuming treatedByDoctor is a Doctor object,
              selectedTeethDetails: plan.selectedTeethDetails?.map(tooth => ({
                ...tooth,
                dailyTreatments: tooth.dailyTreatments?.map(dt => ({
                  _id: dt._id || "",
                  date: dt.date ? format(new Date(dt.date), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
                  treatmentAmount: Number(dt.treatmentAmount) || 0,
                  paidAmount: Number(dt.paidAmount) || 0,
                  remainingAmount: Number(dt.remainingAmount) || 0,
                  treatedByDoctor: dt.treatedByDoctor || null,
                  procedure: dt.procedure || "",
                  notes: dt.notes || "", // Ensure notes is always a string
                  isCompleted: dt.isCompleted || false,
                })) || []
              })) || []
            })) || [],
        },
      });
    }
  }, [patient]);

  const [selectedTeethMaps, setSelectedTeethMaps] = useState<
    Record<string, Record<string, ToothData>>
  >(() => {
    const initialTeethMaps: Record<string, Record<string, ToothData>> = {};

    patient.medicalDetails[0]?.treatmentPlanning.forEach((plan, planIndex) => {
      if (plan.selectedTeethDetails) {
        const mapKey = `0-${planIndex}`;
        initialTeethMaps[mapKey] = plan.selectedTeethDetails.reduce(
          (acc, tooth) => ({
            ...acc,
            [tooth.number]: {
              number: tooth.number,
              details: tooth.details || "",
              procedure: tooth.procedure || "",
              position: tooth.position || "",
              side: tooth.side || "",
              // _id: tooth._id || "", // Add this
              treatmentId: "", // Add this for treatment identification
              // isCompleted: tooth.isCompleted || false,
              dailyTreatments:
                tooth.dailyTreatments?.map((dt: any) => ({
                  _id: dt._id || "",
                  date: dt.date
                    ? format(new Date(dt.date), "yyyy-MM-dd")
                    : format(new Date(), "yyyy-MM-dd"),
                  treatmentAmount: Number(dt.treatmentAmount) || 0,
                  paidAmount: Number(dt.paidAmount) || 0,
                  remainingAmount: Number(dt.remainingAmount) || 0,
                  treatedByDoctor: dt.treatedByDoctor || null,
                  procedure: dt.procedure || "",
                  notes: dt.notes || "",
                  isCompleted: dt.isCompleted || false,
                })) || [],
              totalTreatmentAmount: tooth.totalTreatmentAmount || 0,
              totalPaidAmount: tooth.totalPaidAmount || 0,
              totalRemainingAmount: tooth.totalRemainingAmount || 0,
            },
          }),
          {}
        );
      }
    });

    return initialTeethMaps;
  });

  const handlePersonalChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      personalDetails: {
        ...prev.personalDetails,
        [field]: value,
      },
    }));
  };

  const handleMedicalChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      medicalDetails: {
        ...prev.medicalDetails,
        [field]: value,
      },
    }));
  };

  const handleMedicalHistoryChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      medicalDetails: {
        ...prev.medicalDetails,
        medicalHistory: {
          ...prev.medicalDetails.medicalHistory,
          [field]: value,
        },
      },
    }));
  };

  const handleInvestigationChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      medicalDetails: {
        ...prev.medicalDetails,
        investigation: {
          ...prev.medicalDetails.investigation,
          [field]: value,
        },
      },
    }));
  };

  const addTreatmentPlan = () => {
    setFormData((prev) => ({
      ...prev,
      medicalDetails: {
        ...prev.medicalDetails,
        treatmentPlanning: [
          ...prev.medicalDetails.treatmentPlanning,
          {
            treatmentDate: formatSafeDate(new Date().toISOString()),
            treatmentDetails: "",
            treatmentFindings: "",
            treatedByDoctor: "",
            treatmentAmount: "",
            advancedAmount: "",
            balanceAmount: "",
            teethNumber: "",
            clinicalFindings: [],
            otherFindings: "",
            selectedTeethDetails: [],
            treatmentDocuments: [],
            isCompleted: false,
          },
        ],
      },
    }));

    const newTreatmentId = `treatment-0-${formData.medicalDetails.treatmentPlanning.length}`;

    setTimeout(() => {
      const newTreatmentElement = document.getElementById(newTreatmentId);
      if (newTreatmentElement) {
        newTreatmentElement.scrollIntoView({
          behavior: "smooth",
          block: "center", // Changed from "start" to "center" for better visibility
          inline: "nearest",
        });
      }
    }, 200); // Increased from 100 to 200 for better reliability on mobile
  };

  const formatDataForBackend = (data: FormData) => {
    return {
      personalDetails: {
        ...data.personalDetails,
        checkUpDate: formatSafeDate(data.personalDetails.checkUpDate),
        updatedAt: new Date().toISOString(),
      },
      medicalDetails: [
        {
          chiefComplaint: data.medicalDetails.chiefComplaint,
          diagnosis: data.medicalDetails.diagnosis,
          investigation: {
            blood: formData.medicalDetails.investigation.blood,
            xray: formData.medicalDetails.investigation.xray,
          },
          patientType: data.medicalDetails.patientType,
          medicalHistory: data.medicalDetails.medicalHistory,
          followUpDate: data.medicalDetails.followUpDate
            ? formatSafeDate(data.medicalDetails.followUpDate)
            : undefined,
          treatmentPlanning: data.medicalDetails.treatmentPlanning.map(
            (plan, planIndex) => {
              // Get the corresponding teeth data for this treatment plan
              const mapKey = `0-${planIndex}`;
              const teethMap = selectedTeethMaps[mapKey] || {};

              // Format teeth data for backend
              const selectedTeethDetails = Object.entries(teethMap).map(
                ([number, toothData]) => {
                  // Handle dailyTreatments - ensure dates are formatted correctly
                  const formattedDailyTreatments =
                    toothData.dailyTreatments?.map((treatment) => ({
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
                }
              );

              // IMPORTANT: Don't modify the plan's treatmentDocuments field at all
              // Just pass the original _id to ensure document references are preserved
              return {
                ...plan,
                treatmentDate: formatSafeDate(plan.treatmentDate.toString()),
                treatmentAmount: Number(plan.treatmentAmount) || 0,
                advancedAmount: Number(plan.advancedAmount) || 0,
                balanceAmount: Number(plan.balanceAmount) || 0,
                selectedTeethDetails,
                followUpDate: plan.followUpDate
                  ? formatSafeDate(plan.followUpDate)
                  : undefined,
                isCompleted: plan.isCompleted,
                // Remove this line - don't try to modify treatmentDocuments at all
                // treatmentDocuments: plan.treatmentDocuments || [],
              };
            }
          ),
        },
      ],
    };
  };

  const removeTreatmentPlan = (treatmentIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      medicalDetails: {
        ...prev.medicalDetails,
        treatmentPlanning: prev.medicalDetails.treatmentPlanning.filter(
          (_, tIndex) => tIndex !== treatmentIndex
        ),
      },
    }));
  };

  const handleTreatmentChange = (
    treatmentIndex: number,
    field: string,
    value: any
  ) => {
    setFormData((prev) => {
      const currentPlan = prev.medicalDetails.treatmentPlanning[treatmentIndex];
      let updatedPlan = { ...currentPlan };

      if (field === "treatmentAmount" || field === "advancedAmount") {
        const treatmentAmount =
          field === "treatmentAmount"
            ? parseFloat(value) || 0
            : parseFloat(currentPlan.treatmentAmount.toString()) || 0;

        let advancedAmount =
          field === "advancedAmount"
            ? parseFloat(value) || 0
            : parseFloat(currentPlan.advancedAmount.toString()) || 0;

        if (field === "advancedAmount" && advancedAmount > treatmentAmount) {
          advancedAmount = treatmentAmount;
          toast.warning("Advanced amount cannot exceed treatment amount");
        }

        const balanceAmount = treatmentAmount - advancedAmount;

        updatedPlan = {
          ...currentPlan,
          treatmentAmount: treatmentAmount.toString(),
          advancedAmount: advancedAmount.toString(),
          balanceAmount: balanceAmount.toString(),
        };
      } else {
        updatedPlan = { ...currentPlan, [field]: value };
      }

      return {
        ...prev,
        medicalDetails: {
          ...prev.medicalDetails,
          treatmentPlanning: prev.medicalDetails.treatmentPlanning.map(
            (plan, tIndex) => (tIndex === treatmentIndex ? updatedPlan : plan)
          ),
        },
      };
    });
  };

  const updatePatient = async () => {
    try {
      setIsSubmitting(true);

      const formattedData = formatDataForBackend(formData);

      // Send the API request
      await crudRequest(
        "PUT",
        `/patient/update-patient/${patient._id}`,
        formattedData
      );

      // Handle success
      toast.success("Patient updated successfully!");
      onClose();
      window.location.reload(); // Reload the page to reflect changes
    } catch (error) {
      toast.error("Failed to update patient");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    updatePatient();
  };

  const handleToothSelect = (planIndex: number, toothNumber: string) => {
    setSelectedTeethMaps((prev) => {
      const mapKey = `0-${planIndex}`;
      const currentPlanTeeth = prev[mapKey] || {};

      let updatedPlanTeeth: Record<string, ToothData>;
      if (currentPlanTeeth[toothNumber]) {
        // Create a new object without this tooth
        const { [toothNumber]: _, ...rest } = currentPlanTeeth;
        updatedPlanTeeth = rest;
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

        updatedPlanTeeth = {
          ...currentPlanTeeth,
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

      // Return the updated teeth maps
      return {
        ...prev,
        [mapKey]: updatedPlanTeeth,
      };
    });

    // Step 2: After updating teeth map, update form data in a separate effect
    setTimeout(() => {
      setFormData((prevForm) => {
        const updatedPlanTeeth = selectedTeethMaps[`0-${planIndex}`] || {};

        return {
          ...prevForm,
          medicalDetails: {
            ...prevForm.medicalDetails,
            treatmentPlanning: prevForm.medicalDetails.treatmentPlanning.map(
              (plan, tIndex) => {
                if (tIndex === planIndex) {
                  // Convert the teeth data to the expected format with explicit type
                  const selectedTeethArray: ToothData[] = Object.entries(
                    updatedPlanTeeth
                  ).map(([number, data]) => ({
                    number,
                    details: data.details || "",
                    procedure: data.procedure || "",
                    position: getToothPosition(number),
                    side: getToothSide(number),
                    dailyTreatments: data.dailyTreatments.map((dt) => ({
                      _id: dt._id,
                      date: dt.date,
                      treatmentAmount: dt.treatmentAmount,
                      paidAmount: dt.paidAmount,
                      remainingAmount: dt.remainingAmount,
                      treatedByDoctor: dt.treatedByDoctor,
                      procedure: dt.procedure || "",
                      notes: dt.notes || "",
                      isCompleted: dt.isCompleted,
                    })),
                    totalTreatmentAmount: data.totalTreatmentAmount,
                    totalPaidAmount: data.totalPaidAmount,
                    totalRemainingAmount: data.totalRemainingAmount,
                  }));

                  return {
                    ...plan,
                    teethNumber: selectedTeethArray
                      .map((t) => t.number)
                      .join(", "),
                    selectedTeethDetails: selectedTeethArray,
                  } as TreatmentPlan; // Force type as TreatmentPlan
                }
                return plan;
              }
            ),
          },
        };
      });
    }, 0);
  };

  const handleToothDetailsChange = (
    mapKey: string,
    toothNumber: string,
    details: string
  ) => {
    setSelectedTeethMaps((prev) => ({
      ...prev,
      [mapKey]: {
        ...(prev[mapKey] || {}),
        [toothNumber]: {
          ...(prev[mapKey]?.[toothNumber] || {}),
          details,
        },
      },
    }));
  };

  const handleToothProcedureChange = (
    mapKey: string,
    toothNumber: string,
    procedure: string
  ) => {
    setSelectedTeethMaps((prev) => ({
      ...prev,
      [mapKey]: {
        ...(prev[mapKey] || {}),
        [toothNumber]: {
          ...(prev[mapKey]?.[toothNumber] || {}),
          procedure,
        },
      },
    }));
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();

      if (focusedTab === "personal") {
        setActiveTab("medical");
        setFocusedTab("medical");

        const medicalTab = document.querySelector('[value="medical"]');
        if (medicalTab instanceof HTMLElement) {
          medicalTab.focus();
        }
      } else {
        setActiveTab("personal");
        setFocusedTab("personal");

        const personalTab = document.querySelector('[value="personal"]');
        if (personalTab instanceof HTMLElement) {
          personalTab.focus();
        }
      }
    }
  };

  const handleDailyTreatmentAdd = (
    mapKey: string,
    toothNumber: string,
    treatment: DailyTreatment
  ) => {
    setSelectedTeethMaps((prev) => {
      // Create deep copies to avoid reference issues
      const prevMapCopy = JSON.parse(JSON.stringify(prev)) as Record<
        string,
        Record<string, ToothData>
      >;

      // Ensure the mapKey and tooth exist
      if (!prevMapCopy[mapKey]) {
        prevMapCopy[mapKey] = {};
      }

      if (!prevMapCopy[mapKey][toothNumber]) {
        // Initialize with default values if tooth doesn't exist
        prevMapCopy[mapKey][toothNumber] = {
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

      const currentTooth = prevMapCopy[mapKey][toothNumber];

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

  const handlePaymentUpdate = (
    mapKey: string,
    toothNumber: string,
    treatmentIndex: number,
    newPaidAmount: number
  ) => {
    setSelectedTeethMaps((prev) => {
      // Create deep copy to avoid reference issues
      const prevMapCopy = JSON.parse(JSON.stringify(prev)) as Record<
        string,
        Record<string, ToothData>
      >;

      if (!prevMapCopy[mapKey] || !prevMapCopy[mapKey][toothNumber]) {
        return prevMapCopy;
      }

      const tooth = prevMapCopy[mapKey][toothNumber];
      const treatments = tooth.dailyTreatments || [];

      if (treatmentIndex >= 0 && treatmentIndex < treatments.length) {
        const treatment = treatments[treatmentIndex];
        const treatmentAmount = Number(treatment.treatmentAmount) || 0;

        // Update paid amount and recalculate remaining
        treatment.paidAmount = newPaidAmount;
        treatment.remainingAmount = treatmentAmount - newPaidAmount;

        // IMPORTANT: Recalculate all tooth totals from dailyTreatments
        tooth.totalTreatmentAmount = treatments.reduce(
          (sum, t) => sum + (Number(t.treatmentAmount) || 0),
          0
        );

        tooth.totalPaidAmount = treatments.reduce(
          (sum, t) => sum + (Number(t.paidAmount) || 0),
          0
        );

        tooth.totalRemainingAmount = Math.max(
          0,
          tooth.totalTreatmentAmount - tooth.totalPaidAmount
        );

        // Calculate plan totals here using the updated data
        const planIndex = parseInt(mapKey.split("-")[1]);

        // Use the updated tooth data to calculate new plan totals
        let planTreatmentAmount = 0;
        let planPaidAmount = 0;

        Object.values(prevMapCopy[mapKey]).forEach((t) => {
          planTreatmentAmount += t.totalTreatmentAmount || 0;
          planPaidAmount += t.totalPaidAmount || 0;
        });

        // Update formData right away in this same update cycle
        setTimeout(() => {
          setFormData((prevForm) => {
            const updatedPlanning = [
              ...prevForm.medicalDetails.treatmentPlanning,
            ];
            if (updatedPlanning[planIndex]) {
              updatedPlanning[planIndex] = {
                ...updatedPlanning[planIndex],
                treatmentAmount: planTreatmentAmount.toString(),
                advancedAmount: planPaidAmount.toString(),
                balanceAmount: Math.max(
                  0,
                  planTreatmentAmount - planPaidAmount
                ).toString(),
              };
            }

            return {
              ...prevForm,
              medicalDetails: {
                ...prevForm.medicalDetails,
                treatmentPlanning: updatedPlanning,
              },
            };
          });
        }, 0);
      }

      return prevMapCopy;
    });
  };

  // Get all treatment documents
  const allTreatmentDocuments = patient.medicalDetails.flatMap((record) =>
    record.treatmentPlanning.flatMap(
      (treatment) => treatment.treatmentDocuments || []
    )
  );
  
  // Get general patient documents
  const patientDocuments = patient.documents || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-screen h-[100dvh] max-w-none m-0 p-0 rounded-none border-none bg-background/95 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/60 overflow-hidden">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex flex-col h-[calc(100vh-5rem)]"
        >
          <TabsList
            className="grid w-full grid-cols-3 gap-2 px-2 py-1 text-center bg-muted/40 sticky z-40"
            onKeyDown={handleKeyPress}
          >
            <TabsTrigger
              value="personal"
              className="flex items-center justify-center gap-1 text-sm sm:text-base sm:gap-2 transition-all duration-200 hover:bg-accent data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              onFocus={() => setFocusedTab("personal")}
              autoFocus
            >
              <User className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Personal Info</span>
            </TabsTrigger>
            <TabsTrigger
              value="medical"
              className="flex items-center justify-center gap-1 text-sm sm:text-base sm:gap-2 transition-all duration-200 hover:bg-accent data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              onFocus={() => setFocusedTab("medical")}
            >
              <Activity className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Treatment Details</span>
            </TabsTrigger>
            <TabsTrigger
              value="documents"
              className="flex items-center justify-center gap-1 text-sm sm:text-base sm:gap-2 transition-all duration-200 hover:bg-accent data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <FileDigit className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Documents</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto px-2 py-2">
            <TabsContent
              value="personal"
              className="mt-0 focus-visible:outline-none focus-visible:ring-0"
            >
              <Card className="border-none shadow-none">
                <CardContent className="p-4">
                  <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-primary">
                      Personal Information
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 p-2">
                    <div className="space-y-3">
                      <Label htmlFor="sn" className="text-sm font-medium">
                        S.N
                      </Label>
                      <Input
                        id="sn"
                        type="sn"
                        value={formData.personalDetails.sn}
                        onChange={(e) =>
                          handlePersonalChange("sn", e.target.value)
                        }
                        className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="name" className="text-sm font-medium">
                        Full Name
                      </Label>
                      <Input
                        id="name"
                        value={formData.personalDetails.name}
                        onChange={(e) =>
                          handlePersonalChange("name", e.target.value)
                        }
                        className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label
                        htmlFor="contactNumber"
                        className="text-sm font-medium"
                      >
                        Contact Number
                      </Label>
                      <Input
                        id="contactNumber"
                        value={formData.personalDetails.contactNumber}
                        onChange={(e) =>
                          handlePersonalChange("contactNumber", e.target.value)
                        }
                        className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="email" className="text-sm font-medium">
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.personalDetails.emailAddress}
                        onChange={(e) =>
                          handlePersonalChange("emailAddress", e.target.value)
                        }
                        className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="age" className="text-sm font-medium">
                        Age
                      </Label>
                      <Input
                        id="age"
                        type="number"
                        value={formData.personalDetails.age}
                        onChange={(e) =>
                          handlePersonalChange("age", Number(e.target.value))
                        }
                        className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="gender" className="text-sm font-medium">
                        Gender
                      </Label>
                      <Select
                        value={formData.personalDetails.gender}
                        onValueChange={(value) =>
                          handlePersonalChange("gender", value)
                        }
                      >
                        <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label
                        htmlFor="checkUpDate"
                        className="text-sm font-medium"
                      >
                        Check-up Date
                      </Label>
                      <Input
                        id="checkUpDate"
                        type="date"
                        value={formData.personalDetails.checkUpDate}
                        onChange={(e) =>
                          handlePersonalChange("checkUpDate", e.target.value)
                        }
                        className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    <div className="space-y-3 col">
                      <Label htmlFor="address" className="text-sm font-medium">
                        Address
                      </Label>
                      <Textarea
                        id="address"
                        value={formData.personalDetails.address}
                        onChange={(e) =>
                          handlePersonalChange("address", e.target.value)
                        }
                        className="min-h-[100px] transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  {/* Add Chief Complaint Section */}
                  <div className="mt-6 border-t pt-4">
                    <h3 className="text-lg font-semibold text-primary mb-3">
                      Chief Complaint
                    </h3>
                    <div className="space-y-2">
                      <Label htmlFor="chiefComplaint">
                        Patient's Main Concern
                      </Label>
                      <Textarea
                        id="chiefComplaint"
                        placeholder="Enter patient's chief complaint"
                        className="min-h-[120px] transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                        value={formData.medicalDetails.chiefComplaint || ""}
                        onChange={(e) =>
                          handleMedicalChange("chiefComplaint", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardContent className="p-4">
                  <div className="space-y-6">
                    <div className="border-b pb-4">
                      <h3 className="text-lg font-semibold text-primary">
                        Medical History
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Blood Pressure</Label>
                        <Input
                          value={
                            formData.medicalDetails.medicalHistory.bloodPressure
                          }
                          onChange={(e) =>
                            handleMedicalHistoryChange(
                              "bloodPressure",
                              e.target.value
                            )
                          }
                          placeholder="e.g. 120/80"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Allergies</Label>
                        <Input
                          value={
                            formData.medicalDetails.medicalHistory.allergies
                          }
                          onChange={(e) =>
                            handleMedicalHistoryChange(
                              "allergies",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Other Conditions</Label>
                        <Textarea
                          value={
                            formData.medicalDetails.medicalHistory
                              .otherConditions
                          }
                          onChange={(e) =>
                            handleMedicalHistoryChange(
                              "otherConditions",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <div className="col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="diabetes"
                            checked={
                              formData.medicalDetails.medicalHistory.diabetes
                            }
                            onCheckedChange={(checked) =>
                              handleMedicalHistoryChange("diabetes", checked)
                            }
                          />
                          <Label htmlFor="diabetes">Diabetes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="thyroid"
                            checked={
                              formData.medicalDetails.medicalHistory.thyroid
                            }
                            onCheckedChange={(checked) =>
                              handleMedicalHistoryChange("thyroid", checked)
                            }
                          />
                          <Label htmlFor="thyroid">Thyroid</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="bleedingDisorder"
                            checked={
                              formData.medicalDetails.medicalHistory
                                .bleedingDisorder
                            }
                            onCheckedChange={(checked) =>
                              handleMedicalHistoryChange(
                                "bleedingDisorder",
                                checked
                              )
                            }
                          />
                          <Label htmlFor="bleedingDisorder">
                            Bleeding Disorder
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="pregnancy"
                            checked={
                              formData.medicalDetails.medicalHistory.pregnancy
                            }
                            onCheckedChange={(checked) =>
                              handleMedicalHistoryChange("pregnancy", checked)
                            }
                          />
                          <Label htmlFor="pregnancy">Pregnancy</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="asthma"
                            checked={
                              formData.medicalDetails.medicalHistory.asthma
                            }
                            onCheckedChange={(checked) =>
                              handleMedicalHistoryChange("asthma", checked)
                            }
                          />
                          <Label htmlFor="asthma">Asthma</Label>
                        </div>
                      </div>
                    </div>

                    {/* Add this checkbox prominently at the top of the medical history section: */}
                    <div className="col-span-2 flex items-center gap-2 p-3 border rounded-md bg-muted/30 mb-4">
                      <Checkbox
                        id="noMedicalIssues"
                        checked={
                          formData.medicalDetails.medicalHistory.noMedicalIssues
                        }
                        onCheckedChange={(checked) => {
                          if (checked) {
                            // Clear all other medical history fields when this is checked
                            setFormData((prev) => ({
                              ...prev,
                              medicalDetails: {
                                ...prev.medicalDetails,
                                medicalHistory: {
                                  bloodPressure: "",
                                  diabetes: false,
                                  thyroid: false,
                                  bleedingDisorder: false,
                                  pregnancy: false,
                                  asthma: false,
                                  allergies: "",
                                  otherConditions: "",
                                  noMedicalIssues: true,
                                },
                              },
                            }));
                          } else {
                            handleMedicalHistoryChange(
                              "noMedicalIssues",
                              checked
                            );
                          }
                        }}
                      />
                      <Label htmlFor="noMedicalIssues" className="font-medium">
                        No Medical Issues
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent
              value="medical"
              className="mt-0 focus-visible:outline-none focus-visible:ring-0"
            >
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-4 space-y-6">
                    {/* Medical Information Section */}
                    <div className="grid gap-6">
                      <div className="space-y-2">
                        <h3 className="text-lg font-medium">
                          Medical Information
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Patient Type</Label>
                            <Select
                              value={formData.medicalDetails.patientType}
                              onValueChange={(value: "Adult" | "Child") =>
                                handleMedicalChange("patientType", value)
                              }
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
                            <Label>Follow-up Date</Label>
                            <Input
                              type="date"
                              value={formData.medicalDetails.followUpDate}
                              onChange={(e) =>
                                handleMedicalChange(
                                  "followUpDate",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Blood Investigation</Label>
                            <Textarea
                              value={
                                formData.medicalDetails.investigation.blood
                              }
                              onChange={(e) =>
                                handleInvestigationChange(
                                  "blood",
                                  e.target.value
                                )
                              }
                              className="min-h-[100px]"
                              placeholder="Enter blood investigation details"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>X-ray Investigation</Label>
                            <Textarea
                              value={formData.medicalDetails.investigation.xray}
                              onChange={(e) =>
                                handleInvestigationChange(
                                  "xray",
                                  e.target.value
                                )
                              }
                              className="min-h-[100px]"
                              placeholder="Enter x-ray investigation details"
                            />
                          </div>

                          <div className="space-y-2 col-span-2">
                            <Label>Diagnosis</Label>
                            <Textarea
                              className="min-h-[100px]"
                              value={formData.medicalDetails.diagnosis}
                              onChange={(e) =>
                                handleMedicalChange("diagnosis", e.target.value)
                              }
                              placeholder="Enter diagnosis details"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                {/* Treatment Plans Section */}
                <div className="m-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">X-Ray Plans</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-6">
                      <Button
                        className="flex items-center gap-2 text-xs sm:text-sm"
                        onClick={addTreatmentPlan}
                        size="sm"
                        variant={"default"}
                      >
                        <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> Add
                        X-Ray Plan
                      </Button>

                      {formData.medicalDetails.treatmentPlanning.length > 0 && (
                        <Button
                          variant="default"
                          size={"sm"}
                          onClick={() => setShowPaymentHistory(true)}
                          className="flex items-center gap-2 text-xs sm:text-sm whitespace-nowrap"
                        >
                          <Wallet className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">
                            Edit Payment History
                          </span>
                          <span className="sm:hidden">Payments</span>
                        </Button>
                      )}
                    </div>
                  </div>

                  {formData.medicalDetails.treatmentPlanning.length === 0 ? (
                    <div className="text-center p-8 border border-dashed rounded-lg">
                      <h4 className="text-muted-foreground mb-2">
                        No X-ray Plans
                      </h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Add a X-ray plan to start tracking patient treatments
                      </p>

                      <Button onClick={addTreatmentPlan}>
                        <Plus className="h-4 w-4 mr-1" /> Add X-Ray Plan
                      </Button>
                    </div>
                  ) : (
                    formData.medicalDetails.treatmentPlanning.map(
                      (plan, index) => (
                        <EnhancedTreatmentPlanCard
                          key={index}
                          treatmentIndex={index}
                          plan={plan}
                          selectedTeethMap={
                            selectedTeethMaps[`0-${index}`] || {}
                          }
                          patientId={patient._id}
                          medicalDetailId={patient.medicalDetails[0]?._id || ""}
                          patientType={formData.medicalDetails.patientType}
                          doctors={doctors}
                          onRemove={() => removeTreatmentPlan(index)}
                          onTreatmentChange={(field, value) =>
                            handleTreatmentChange(index, field, value)
                          }
                          onToothSelect={(toothNumber) =>
                            handleToothSelect(index, toothNumber)
                          }
                          onToothDetailsChange={(toothNumber, details) =>
                            handleToothDetailsChange(
                              `0-${index}`,
                              toothNumber,
                              details
                            )
                          }
                          onToothProcedureChange={(toothNumber, procedure) =>
                            handleToothProcedureChange(
                              `0-${index}`,
                              toothNumber,
                              procedure
                            )
                          }
                          onDailyTreatmentAdd={(toothNumber, treatment) =>
                            handleDailyTreatmentAdd(
                              `0-${index}`,
                              toothNumber,
                              treatment
                            )
                          }
                        />
                      )
                    )
                  )}
                </div>

                {/* Treatment Summary */}
                {formData.medicalDetails.treatmentPlanning.length > 0 && (
                  <TreatmentSummary
                    plans={formData.medicalDetails.treatmentPlanning}
                    selectedTeethMaps={selectedTeethMaps}
                  />
                )}
                {/* Add the dialog component just before the closing </div> tag of the medical tabscontent */}
                <PaymentHistoryDialog
                  isOpen={showPaymentHistory}
                  onClose={() => setShowPaymentHistory(false)}
                  selectedTeethMaps={selectedTeethMaps}
                  onPaymentUpdate={handlePaymentUpdate}
                  patientId={patient._id}
                  medicalDetailId={patient.medicalDetails[0]?._id || ""}
                  patient={patient} // Pass the patient object
                />
              </div>
            </TabsContent>

            <TabsContent
              value="documents"
              className="mt-0 focus-visible:outline-none focus-visible:ring-0"
            >
              <Card className="border-none shadow-none">
                <CardHeader className="px-4 py-2">
                  <CardTitle className="text-lg">Patient Documents</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {patientDocuments.length === 0 && allTreatmentDocuments.length === 0 ? (
                    <div className="text-center p-4 border rounded-md bg-muted/20">
                      <p className="text-muted-foreground">No documents uploaded for this patient.</p>
                    </div>
                  ) : (
                    <DocumentComparison 
                      documents={allTreatmentDocuments} 
                      patientDocuments={patientDocuments} 
                    />
                  )}
                  
                  {/* Button to upload new documents */}
                  <div className="flex justify-end mt-4">
                    <PatientDocumentUploadButton
                      patientId={patient._id}
                      medicalDetailId={patient.medicalDetails[0]?._id}
                      onSuccess={(updatedPatient) => {
                        // Refresh patient data if needed
                        toast.success("Documents uploaded successfully");
                        onClose();
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Upload New Documents
                    </PatientDocumentUploadButton>
                  </div>
                </CardContent>
              </Card>
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
          {activeTab === "personal" && (
            <Button
              onClick={() => setActiveTab("medical")}
              className="min-w-[80px] sm:min-w-[100px] text-xs sm:text-sm"
            >
              Next
            </Button>
          )}
          {activeTab === "medical" && (
            <Button
              onClick={() => setActiveTab("personal")}
              className="min-w-[80px] sm:min-w-[100px] text-xs sm:text-sm"
            >
              Previous
            </Button>
          )}
          <Button 
            onClick={handleFormSubmit}
            disabled={isSubmitting}
            className="min-w-[80px] sm:min-w-[100px] text-xs sm:text-sm"
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpdatePatientModal;
