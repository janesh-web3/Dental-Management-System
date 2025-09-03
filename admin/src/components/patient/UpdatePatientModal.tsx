import { useEffect, useState } from "react";
import { format } from "date-fns";
import { toast } from "react-toastify";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Plus, 
  User, 
  Activity, 
  Wallet, 
  FileDigit, 
  ChevronDown, 
  ChevronUp, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Heart, 
  Stethoscope, 
  AlertTriangle, 
  Info,
  Save,
  X,
  ArrowLeft,
  ArrowRight
} from "lucide-react";
import { crudRequest } from "@/lib/api";
import { useDoctorContext } from "@/contexts/DoctorContext";
import { getToothPosition, getToothSide } from "@/helper/PatientHelper";
import { Patient, ToothData, DailyTreatment } from "@/types/patient";
import { EnhancedTreatmentPlanCard } from "./EnhancedTreatmentPlanCard";
import { TreatmentSummary } from "./TreatmentSummary";
import { PaymentHistoryDialog } from "./PaymentHistoryDialog";
import { DocumentComparison } from "./DocumentComparison";
import { PatientDocumentUploadButton } from "./PatientDocumentUploadButton";
import { GroupTreatmentManager } from "./GroupTreatmentManager";
import { convertToNepaliDate, convertToEnglishDate } from "@/lib/utils";
import { NepaliDatePickerComponent } from "@/components/ui/nepali-date-picker";

interface UpdatePatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
}

interface TreatmentPlan {
  _id?: string;
  treatmentDate: string;
  treatmentDateNp: string; // Add Nepali date field
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
  followUpDateNp?: string; // Add Nepali date field
  completionDate?: string;
  completionDateNp?: string; // Add Nepali date field
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
      paymentDate?: string; // Add payment date field
      treatedByDoctor: string | null;
      notes: string;
      procedure: string;
    }>;
    totalTreatmentAmount: number;
    totalPaidAmount: number;
    totalRemainingAmount: number;
  }>;
  groupTreatmentDetails?: Array<{
    _id?: string;
    groupName: "Ortho" | "Endo" | "Perio" | "Prostho" | "Surgery" | "General" | "Other";
    procedure: string;
    totalTreatmentAmount: number;
    totalPaidAmount: number;
    totalRemainingAmount: number;
    startDate?: string;
    followUpDate?: string;
    followUpDateNp?: string;
    completionDate?: string;
    completionDateNp?: string;
    treatedByDoctor: string | null;
    isCompleted: boolean;
    dailyTreatments: Array<{
      _id?: string;
      date: string;
      treatmentAmount: number;
      paidAmount: number;
      remainingAmount: number;
      paymentDate?: string; // Add payment date field
      treatedByDoctor: string | null;
      notes: string;
      procedure: string;
      isCompleted: boolean;
    }>;
  }>;
}

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
    checkUpDateNp: string; // Add Nepali date field
    referredBy: string;
  };
  medicalDetails: {
    followUpDate: string;
    followUpDateNp: string; // Add Nepali date field
    diagnosis: string;
    investigation: {
      blood: string;
      xray: string;
    };
    patientType: "Child" | "Adult";
    group?: "Ortho" | "Endo" | "Perio" | "Prostho" | "Surgery" | "General" | "Other";
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
  console.log("UpdatePatientModal patient:", patient);
  const [activeTab, setActiveTab] = useState("personal");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { doctors } = useDoctorContext();
  const [focusedTab, setFocusedTab] = useState<"personal" | "medical" | "financial" | "documents">(
    "personal"
  );
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    personalInfo: true,
    medicalHistory: true,
    treatmentPlans: true,
    groupTreatments: false
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

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
      checkUpDateNp: "", // Add Nepali date field
    },
    medicalDetails: {
      chiefComplaint: "",
      followUpDate: "",
      followUpDateNp: "", // Add Nepali date field
      diagnosis: "",
      investigation: {
        blood: "",
        xray: "",
      },
      patientType: "Adult",
      group: "General",
      medicalHistory: {
        bloodPressure: "",
        diabetes: false,
        thyroid: false,
        bleedingDisorder: false,
        pregnancy: false,
        asthma: false,
        allergies: "",
        otherConditions: "",
        noMedicalIssues: false,
      },
      treatmentPlanning: [],
    },
  });

  useEffect(() => {
    if (patient && patient.personalDetails && patient.medicalDetails?.[0]) {
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
          checkUpDateNp: convertToNepaliDate(formatSafeDate(patient.personalDetails.checkUpDate)),
        },
        medicalDetails: {
          chiefComplaint: patient.medicalDetails[0]?.chiefComplaint || "",
          followUpDate: formatSafeDate(patient.medicalDetails[0]?.followUpDate),
          followUpDateNp: convertToNepaliDate(formatSafeDate(patient.medicalDetails[0]?.followUpDate)),
          diagnosis: patient.medicalDetails[0]?.diagnosis || "",
          investigation: {
            blood: patient.medicalDetails[0]?.investigation?.blood || "",
            xray: patient.medicalDetails[0]?.investigation?.xray || "",
          },
          patientType: patient.medicalDetails[0]?.patientType || "Adult",
          group: patient.medicalDetails[0]?.group || "General",
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
              treatmentDate: formatSafeDate(plan.treatmentDate),
              treatmentDateNp: convertToNepaliDate(formatSafeDate(plan.treatmentDate)),
              completionDate: formatSafeDate(plan.completionDate),
              completionDateNp: plan.completionDate ? convertToNepaliDate(formatSafeDate(plan.completionDate)) : "",
              treatmentAmount: plan.totalPlanAmount?.toString() || "0",
              advancedAmount: plan.totalPaidAmount?.toString() || "0",
              balanceAmount: plan.totalRemainingAmount?.toString() || "0",
              treatedByDoctor: plan.treatedByDoctor?._id || "",
              selectedTeethDetails: plan.selectedTeethDetails?.map(tooth => ({
                ...tooth,
                dailyTreatments: tooth.dailyTreatments?.map(dt => ({
                  _id: dt._id || "",
                  date: dt.date ? format(new Date(dt.date), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
                  treatmentAmount: Number(dt.treatmentAmount) || 0,
                  paidAmount: Number(dt.paidAmount) || 0,
                  remainingAmount: Number(dt.remainingAmount) || 0,
                  paymentDate: dt.paymentDate ? format(new Date(dt.paymentDate), "yyyy-MM-dd") : "",
                  treatedByDoctor: dt.treatedByDoctor || null,
                  procedure: dt.procedure || "",
                  notes: dt.notes || "",
                  isCompleted: dt.isCompleted || false,
                })) || []
              })) || [],
              groupTreatmentDetails: plan.groupTreatmentDetails?.map(group => ({
                _id: (group as any)._id || "",
                groupName: (group.groupName as "Ortho" | "Endo" | "Perio" | "Prostho" | "Surgery" | "General" | "Other") || "General",
                procedure: group.procedure || "",
                totalTreatmentAmount: Number(group.totalTreatmentAmount) || 0,
                totalPaidAmount: Number(group.totalPaidAmount) || 0,
                totalRemainingAmount: Number(group.totalRemainingAmount) || 0,
                startDate: group.startDate ? format(new Date(group.startDate), "yyyy-MM-dd") : "",
                followUpDate: group.followUpDate ? format(new Date(group.followUpDate), "yyyy-MM-dd") : "",
                followUpDateNp: group.followUpDate ? convertToNepaliDate(format(new Date(group.followUpDate), "yyyy-MM-dd")) : "",
                completionDate: group.completionDate ? format(new Date(group.completionDate), "yyyy-MM-dd") : "",
                completionDateNp: group.completionDate ? convertToNepaliDate(format(new Date(group.completionDate), "yyyy-MM-dd")) : "",
                treatedByDoctor: (group.treatedByDoctor as any)?._id || group.treatedByDoctor || null,
                isCompleted: group.isCompleted || false,
                dailyTreatments: group.dailyTreatments?.map(dt => ({
                  _id: (dt as any)._id || "",
                  date: dt.date ? format(new Date(dt.date), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
                  treatmentAmount: Number(dt.treatmentAmount) || 0,
                  paidAmount: Number(dt.paidAmount) || 0,
                  remainingAmount: Number(dt.remainingAmount) || 0,
                  paymentDate: (dt as any).paymentDate ? format(new Date((dt as any).paymentDate), "yyyy-MM-dd") : "",
                  treatedByDoctor: dt.treatedByDoctor || null,
                  procedure: dt.procedure || "",
                  notes: dt.notes || "",
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

    patient?.medicalDetails?.[0]?.treatmentPlanning?.forEach((plan, planIndex) => {
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

  const handlePersonalChange = (field: string, value: any): void => {
    setFormData((prev: FormData) => {
      const newData: FormData = {
        ...prev,
        personalDetails: {
          ...prev.personalDetails,
          [field]: value,
        },
      };

      // Auto-convert English date to Nepali date
      if (field === "checkUpDate") {
        newData.personalDetails.checkUpDateNp = convertToNepaliDate(value);
      } else if (field === "checkUpDateNp") {
        // Convert Nepali date to English date
        const englishDate = convertToEnglishDate(value);
        newData.personalDetails.checkUpDate = englishDate;
      }

      return newData;
    });
  };

  const handleMedicalChange = (field: string, value: any): void => {
    setFormData((prev: FormData) => {
      const newData: FormData = {
        ...prev,
        medicalDetails: {
          ...prev.medicalDetails,
          [field]: value,
        },
      };

      // Auto-convert English date to Nepali date
      if (field === "followUpDate") {
        newData.medicalDetails.followUpDateNp = convertToNepaliDate(value);
      } else if (field === "followUpDateNp") {
        const englishDate = convertToEnglishDate(value);
        newData.medicalDetails.followUpDate = englishDate;
      }

      return newData;
    });
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
            treatmentDateNp: "",
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
            groupTreatmentDetails: [],
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
          group: data.medicalDetails.group,
          medicalHistory: data.medicalDetails.medicalHistory,
          followUpDate: data.medicalDetails.followUpDate
            ? formatSafeDate(data.medicalDetails.followUpDate)
            : undefined,
          treatmentPlanning: data.medicalDetails.treatmentPlanning.map(
            (plan, planIndex) => {
              // Get the corresponding teeth data for this treatment plan
              const mapKey = `0-${planIndex}`;
              const teethMap = selectedTeethMaps[mapKey] || {};

              // Calculate plan-level totals directly from teeth data
              let planTotalTreatmentAmount = 0;
              let planTotalPaidAmount = 0;
              let planTotalRemainingAmount = 0;

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
                      paymentDate: treatment.paymentDate ? formatSafeDate(treatment.paymentDate) : null,
                      treatedByDoctor: treatment.treatedByDoctor || null,
                      notes: treatment.notes || "",
                      procedure: treatment.procedure || "",
                      isCompleted: treatment.isCompleted || false,
                    })) || [];

                  // Calculate tooth-level totals
                  const toothTreatmentAmount = formattedDailyTreatments.reduce(
                    (sum, dt) => sum + (Number(dt.treatmentAmount) || 0),
                    0
                  );
                  const toothPaidAmount = formattedDailyTreatments.reduce(
                    (sum, dt) => sum + (Number(dt.paidAmount) || 0),
                    0
                  );
                  const toothRemainingAmount = Math.max(0, toothTreatmentAmount - toothPaidAmount);

                  // Add to plan totals
                  planTotalTreatmentAmount += toothTreatmentAmount;
                  planTotalPaidAmount += toothPaidAmount;
                  planTotalRemainingAmount += toothRemainingAmount;

                  return {
                    number,
                    details: toothData.details || "",
                    position: getToothPosition(number),
                    side: getToothSide(number),
                    procedure: toothData.procedure || "",
                    dailyTreatments: formattedDailyTreatments,
                    totalTreatmentAmount: toothTreatmentAmount,
                    totalPaidAmount: toothPaidAmount,
                    totalRemainingAmount: toothRemainingAmount,
                  };
                }
              );

              // Format group treatment details for backend
              const formattedGroupTreatmentDetails = plan.groupTreatmentDetails?.map(group => {
                // Calculate group totals from daily treatments
                const groupTotalTreatmentAmount = group.dailyTreatments?.reduce(
                  (sum, dt) => sum + (Number(dt.treatmentAmount) || 0), 0
                ) || group.totalTreatmentAmount || 0;
                
                const groupTotalPaidAmount = group.dailyTreatments?.reduce(
                  (sum, dt) => sum + (Number(dt.paidAmount) || 0), 0
                ) || group.totalPaidAmount || 0;

                // Add group totals to plan totals
                planTotalTreatmentAmount += groupTotalTreatmentAmount;
                planTotalPaidAmount += groupTotalPaidAmount;
                planTotalRemainingAmount += (groupTotalTreatmentAmount - groupTotalPaidAmount);

                return {
                  _id: group._id,
                  groupName: group.groupName,
                  procedure: group.procedure || "",
                  totalTreatmentAmount: groupTotalTreatmentAmount,
                  totalPaidAmount: groupTotalPaidAmount,
                  totalRemainingAmount: groupTotalTreatmentAmount - groupTotalPaidAmount,
                  startDate: group.startDate ? formatSafeDate(group.startDate) : undefined,
                  followUpDate: group.followUpDate ? formatSafeDate(group.followUpDate) : undefined,
                  completionDate: group.completionDate ? formatSafeDate(group.completionDate) : undefined,
                  treatedByDoctor: group.treatedByDoctor || null,
                  isCompleted: group.isCompleted || false,
                  dailyTreatments: group.dailyTreatments?.map(dt => ({
                    _id: dt._id,
                    date: formatSafeDate(dt.date),
                    treatmentAmount: Number(dt.treatmentAmount) || 0,
                    paidAmount: Number(dt.paidAmount) || 0,
                    remainingAmount: Number(dt.remainingAmount) || 0,
                    paymentDate: dt.paymentDate ? formatSafeDate(dt.paymentDate) : null,
                    treatedByDoctor: dt.treatedByDoctor || null,
                    notes: dt.notes || "",
                    procedure: dt.procedure || "",
                    isCompleted: dt.isCompleted || false,
                  })) || []
                };
              }) || [];

              // IMPORTANT: Don't modify the plan's treatmentDocuments field at all
              // Just pass the original _id to ensure document references are preserved
              return {
                ...plan,
                treatmentDate: formatSafeDate(plan.treatmentDate.toString()),
                treatmentAmount: Number(plan.treatmentAmount) || 0,
                advancedAmount: Number(plan.advancedAmount) || 0,
                balanceAmount: Number(plan.balanceAmount) || 0,
                selectedTeethDetails,
                groupTreatmentDetails: formattedGroupTreatmentDetails,
                isCompleted: plan.isCompleted,
                // Explicitly set the calculated totals for the plan
                totalPlanAmount: planTotalTreatmentAmount,
                totalPaidAmount: planTotalPaidAmount,
                totalRemainingAmount: planTotalRemainingAmount,
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
        `/patient/update-patient/${patient?._id}`,
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

  const handleGroupTreatmentAdd = (
    treatmentIndex: number,
    groupTreatment: any
  ) => {
    setFormData((prev) => {
      const newPlanning = [...prev.medicalDetails.treatmentPlanning];
      if (!newPlanning[treatmentIndex].groupTreatmentDetails) {
        newPlanning[treatmentIndex].groupTreatmentDetails = [];
      }
      newPlanning[treatmentIndex].groupTreatmentDetails!.push(groupTreatment);
      
      return {
        ...prev,
        medicalDetails: {
          ...prev.medicalDetails,
          treatmentPlanning: newPlanning,
        },
      };
    });
  };

  const handleGroupTreatmentUpdate = (
    treatmentIndex: number,
    groupIndex: number,
    groupTreatment: any
  ) => {
    setFormData((prev) => {
      const newPlanning = [...prev.medicalDetails.treatmentPlanning];
      newPlanning[treatmentIndex].groupTreatmentDetails![groupIndex] = groupTreatment;
      
      return {
        ...prev,
        medicalDetails: {
          ...prev.medicalDetails,
          treatmentPlanning: newPlanning,
        },
      };
    });
  };

  const handleGroupTreatmentRemove = (
    treatmentIndex: number,
    groupIndex: number
  ) => {
    setFormData((prev) => {
      const newPlanning = [...prev.medicalDetails.treatmentPlanning];
      newPlanning[treatmentIndex].groupTreatmentDetails!.splice(groupIndex, 1);
      
      return {
        ...prev,
        medicalDetails: {
          ...prev.medicalDetails,
          treatmentPlanning: newPlanning,
        },
      };
    });
  };

  // Get all treatment documents
  const allTreatmentDocuments = patient?.medicalDetails?.flatMap((record) =>
    record?.treatmentPlanning?.flatMap(
      (treatment) => treatment?.treatmentDocuments || []
    )
  ) || [];
  
  // Get general patient documents
  const patientDocuments = patient?.documents || [];

  // Progress calculation
  const getTabProgress = () => {
    const requiredFields = {
      personal: ['name', 'contactNumber', 'age'],
      medical: ['patientType', 'group'],
      documents: []
    };
    
    const personalComplete = requiredFields.personal.every(field => 
      formData.personalDetails[field as keyof typeof formData.personalDetails]
    );
    const medicalComplete = requiredFields.medical.every(field => 
      formData.medicalDetails[field as keyof typeof formData.medicalDetails]
    );
    
    return {
      personal: personalComplete ? 100 : 70,
      medical: medicalComplete ? 100 : 60,
      documents: 100
    };
  };

  const progress = getTabProgress();
  const overallProgress = Math.round(
    (progress.personal + progress.medical + progress.documents) / 3
  );

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Early return if patient is not provided
  if (!patient) {
    return null;
  }

  return (
    <TooltipProvider>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-screen h-[100dvh] max-w-none m-0 p-0 rounded-none border-none bg-gradient-to-br from-background via-background/98 to-background/95 shadow-2xl backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 overflow-hidden">
          <DialogHeader className="sticky top-0 z-50 bg-gradient-to-r from-background/98 via-background/95 to-background/98 backdrop-blur-xl border-b border-border/50 shadow-lg">
            <div className="flex flex-col px-3 py-2">
              {/* Compact Header */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="relative flex-shrink-0">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 rounded-lg flex items-center justify-center ring-1 ring-primary/10">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border border-background"></div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <DialogTitle className="text-lg font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent leading-tight">
                      {formData.personalDetails.name || 'Unnamed Patient'}
                    </DialogTitle>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <Badge variant="outline" className="text-xs font-mono bg-muted/50 border-muted-foreground/30 px-1.5 py-0.5">
                        ID: {patient?._id?.slice(-8) || 'N/A'}
                      </Badge>
                      <Badge variant="default" className="text-xs font-medium px-1.5 py-0.5">
                        {formData.medicalDetails.group || 'General'}
                      </Badge>
                      {formData.personalDetails.age && (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                          Age: {formData.personalDetails.age}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="hidden lg:flex items-center gap-2 bg-muted/30 rounded-md px-2 py-1">
                    <span className="text-xs font-medium text-muted-foreground">Progress:</span>
                    <Progress value={overallProgress} className="w-16 h-1.5" />
                    <span className="text-xs font-bold text-foreground">{overallProgress}%</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={onClose} 
                    className="h-7 w-7 rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors duration-200"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              
              {/* Compact Mobile Progress */}
              <div className="lg:hidden mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-muted-foreground">Progress</span>
                  <span className="text-xs font-bold text-foreground">{overallProgress}%</span>
                </div>
                <Progress value={overallProgress} className="w-full h-1.5" />
              </div>
            </div>
          </DialogHeader>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex flex-col h-[calc(100vh-5rem)]"
          >
            <TabsList
              className="grid w-full grid-cols-3 gap-1 px-2 py-1.5 bg-gradient-to-r from-muted/40 via-muted/30 to-muted/40 backdrop-blur-xl sticky top-[4rem] z-40 border-b border-border/30 shadow-lg"
              onKeyDown={handleKeyPress}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger
                    value="personal"
                    className="relative flex flex-col items-center gap-0.5 text-xs transition-all duration-200 hover:bg-accent/80 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/90 data-[state=active]:text-primary-foreground p-1.5 rounded-lg border border-transparent data-[state=active]:border-primary/30 data-[state=active]:shadow-lg"
                    onFocus={() => setFocusedTab("personal")}
                    autoFocus
                  >
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-current/15 flex items-center justify-center">
                        <User className="w-2 h-2" />
                      </div>
                      <span className="font-medium text-xs">Personal</span>
                    </div>
                    <div className="w-full">
                      <Progress value={progress.personal} className="w-full h-0.5 bg-current/10" />
                      <span className="text-xs opacity-80">{progress.personal}%</span>
                    </div>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs p-1">
                  <p>Personal info</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger
                    value="medical"
                    className="relative flex flex-col items-center gap-1 text-xs transition-all duration-200 hover:bg-accent/80 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/90 data-[state=active]:text-primary-foreground p-2 rounded-lg border border-transparent data-[state=active]:border-primary/30 data-[state=active]:shadow-lg"
                    onFocus={() => setFocusedTab("medical")}
                  >
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 rounded-full bg-current/15 flex items-center justify-center">
                        <Activity className="w-2.5 h-2.5" />
                      </div>
                      <span className="font-medium text-xs">Medical</span>
                    </div>
                    <div className="w-full">
                      <Progress value={progress.medical} className="w-full h-1 bg-current/10" />
                      <span className="text-xs opacity-80">{progress.medical}%</span>
                    </div>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs p-1">
                  <p>Medical & treatments</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger
                    value="documents"
                    className="relative flex flex-col items-center gap-0.5 text-xs transition-all duration-200 hover:bg-accent/80 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/90 data-[state=active]:text-primary-foreground p-1.5 rounded-lg border border-transparent data-[state=active]:border-primary/30 data-[state=active]:shadow-lg"
                  >
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-current/15 flex items-center justify-center">
                        <FileDigit className="w-2 h-2" />
                      </div>
                      <span className="font-medium text-xs">Files</span>
                    </div>
                    <div className="w-full">
                      <Progress value={progress.documents} className="w-full h-0.5 bg-current/10" />
                      <span className="text-xs opacity-80">{progress.documents}%</span>
                    </div>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs p-1">
                  <p>Documents</p>
                </TooltipContent>
              </Tooltip>
          </TabsList>

          <ScrollArea className="flex-1 scroll-smooth">
            <TabsContent
              value="personal"
              className="mt-0 focus-visible:outline-none focus-visible:ring-0 space-y-3 p-2 sm:p-3"
            >
              {/* Basic Information Section */}
              <Collapsible 
                open={expandedSections.personalInfo} 
                onOpenChange={() => toggleSection('personalInfo')}
              >
                <Card className="border border-border/40 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-card via-card/95 to-card/90 backdrop-blur-sm ring-1 ring-border/20">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-gradient-to-r hover:from-muted/40 hover:to-muted/20 transition-all duration-300 p-3 sm:p-4 border-b border-border/30 group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 bg-gradient-to-br from-primary/25 via-primary/15 to-primary/10 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-primary/10 group-hover:ring-primary/20 transition-all duration-300">
                            <User className="h-5 w-5 text-primary drop-shadow-sm" />
                            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-gradient-to-br from-green-400 to-green-500 rounded-full border border-background shadow-sm"></div>
                          </div>
                          <div className="space-y-0.5">
                            <CardTitle className="text-lg sm:text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                              Basic Information
                            </CardTitle>
                            <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                              Personal details and contact information
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge 
                            variant={progress.personal === 100 ? "default" : "secondary"} 
                            className={`text-xs font-semibold px-3 py-1 ${
                              progress.personal === 100 
                                ? 'bg-green-500/90 text-white shadow-md' 
                                : 'bg-yellow-500/90 text-white shadow-md'
                            }`}
                          >
                            {progress.personal}%
                          </Badge>
                          <div className="p-1.5 rounded-full bg-muted/40 group-hover:bg-primary/10 transition-colors duration-200">
                            {expandedSections.personalInfo ? 
                              <ChevronUp className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" /> : 
                              <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            }
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="p-3 sm:p-4 pt-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
                        <div className="space-y-3 group">
                          <Label htmlFor="sn" className="text-sm font-semibold flex items-center gap-2 text-foreground group-hover:text-primary transition-colors">
                            Serial Number
                            <Badge variant="outline" className="text-xs px-2 py-0.5 bg-blue-50/50 text-blue-700 border-blue-200">Optional</Badge>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <p>Unique serial number for patient identification</p>
                              </TooltipContent>
                            </Tooltip>
                          </Label>
                          <div className="relative">
                            <Input
                              id="sn"
                              type="text"
                              value={formData.personalDetails.sn}
                              onChange={(e) => {
                                handlePersonalChange("sn", e.target.value);
                                setHasUnsavedChanges(true);
                              }}
                              className="h-12 transition-all duration-300 focus:ring-2 focus:ring-primary/30 focus:border-primary/50 hover:border-primary/30 border-border/60 bg-gradient-to-br from-background to-muted/5 shadow-sm focus:shadow-md pl-4 pr-10"
                              placeholder="e.g., P001, SN123"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-muted/30 rounded-full flex items-center justify-center">
                              <span className="text-xs font-mono text-muted-foreground">#</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3 group">
                          <Label htmlFor="name" className="text-sm font-semibold flex items-center gap-2 text-foreground group-hover:text-primary transition-colors">
                            Full Name
                            <Badge variant="destructive" className="text-xs px-2 py-0.5 bg-red-50/80 text-red-700 border-red-200 shadow-sm">Required</Badge>
                          </Label>
                          <div className="relative">
                            <Input
                              id="name"
                              value={formData.personalDetails.name}
                              onChange={(e) => {
                                handlePersonalChange("name", e.target.value);
                                setHasUnsavedChanges(true);
                                if (validationErrors.name) {
                                  setValidationErrors(prev => ({ ...prev, name: '' }));
                                }
                              }}
                              className={`h-12 transition-all duration-300 focus:ring-2 focus:ring-primary/30 focus:border-primary/50 hover:border-primary/30 border-border/60 bg-gradient-to-br from-background to-muted/5 shadow-sm focus:shadow-md pl-12 pr-4 ${
                                validationErrors.name ? 'border-destructive focus:ring-destructive/30 bg-red-50/20' : ''
                              }`}
                              placeholder="Enter patient's full name"
                              required
                            />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                              <User className="h-3.5 w-3.5 text-primary" />
                            </div>
                          </div>
                          {validationErrors.name && (
                            <div className="bg-red-50/50 border border-red-200/50 rounded-lg p-2">
                              <p className="text-xs text-red-700 font-medium flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                {validationErrors.name}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2 group">
                          <Label htmlFor="contactNumber" className="text-xs font-semibold flex items-center gap-2 text-foreground group-hover:text-primary transition-colors">
                            Contact Number
                            <Badge variant="destructive" className="text-xs px-1.5 py-0.5 bg-red-50/80 text-red-700 border-red-200 shadow-sm">Required</Badge>
                          </Label>
                          <div className="relative">
                            <Input
                              id="contactNumber"
                              type="tel"
                              value={formData.personalDetails.contactNumber}
                              onChange={(e) => {
                                handlePersonalChange("contactNumber", e.target.value);
                                setHasUnsavedChanges(true);
                              }}
                              className="h-12 transition-all duration-300 focus:ring-2 focus:ring-primary/30 focus:border-primary/50 hover:border-primary/30 border-border/60 bg-gradient-to-br from-background to-muted/5 shadow-sm focus:shadow-md pl-12 pr-4"
                              placeholder="Enter phone number"
                              required
                            />
                            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                              <Phone className="h-3 w-3 text-green-600" />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3 group">
                          <Label htmlFor="email" className="text-sm font-semibold flex items-center gap-2 text-foreground group-hover:text-primary transition-colors">
                            Email Address
                            <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-blue-50/50 text-blue-700 border-blue-200">Optional</Badge>
                          </Label>
                          <div className="relative">
                            <Input
                              id="email"
                              type="email"
                              value={formData.personalDetails.emailAddress}
                              onChange={(e) => {
                                handlePersonalChange("emailAddress", e.target.value);
                                setHasUnsavedChanges(true);
                              }}
                              className="h-12 transition-all duration-300 focus:ring-2 focus:ring-primary/30 focus:border-primary/50 hover:border-primary/30 border-border/60 bg-gradient-to-br from-background to-muted/5 shadow-sm focus:shadow-md pl-12 pr-4"
                              placeholder="Enter email address"
                            />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                              <Mail className="h-3.5 w-3.5 text-blue-600" />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3 group">
                          <Label htmlFor="age" className="text-sm font-semibold flex items-center gap-2 text-foreground group-hover:text-primary transition-colors">
                            Age
                            <Badge variant="destructive" className="text-xs px-2 py-0.5 bg-red-50/80 text-red-700 border-red-200 shadow-sm">Required</Badge>
                          </Label>
                          <div className="relative">
                            <Input
                              id="age"
                              type="number"
                              min="1"
                              max="120"
                              value={formData.personalDetails.age}
                              onChange={(e) => {
                                handlePersonalChange("age", Number(e.target.value));
                                setHasUnsavedChanges(true);
                              }}
                              className="h-12 transition-all duration-300 focus:ring-2 focus:ring-primary/30 focus:border-primary/50 hover:border-primary/30 border-border/60 bg-gradient-to-br from-background to-muted/5 shadow-sm focus:shadow-md pl-12 pr-4"
                              placeholder="Enter age"
                              required
                            />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                              <Calendar className="h-3.5 w-3.5 text-purple-600" />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3 group">
                          <Label htmlFor="gender" className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                            Gender
                          </Label>
                          <Select
                            value={formData.personalDetails.gender}
                            onValueChange={(value) => {
                              handlePersonalChange("gender", value);
                              setHasUnsavedChanges(true);
                            }}
                          >
                            <SelectTrigger className="h-12 transition-all duration-300 focus:ring-2 focus:ring-primary/30 focus:border-primary/50 hover:border-primary/30 border-border/60 bg-gradient-to-br from-background to-muted/5 shadow-sm focus:shadow-md">
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent className="bg-background/95 backdrop-blur-sm border border-border/50 shadow-xl">
                              <SelectItem value="Male" className="hover:bg-blue-50 hover:text-blue-900 transition-colors">👨 Male</SelectItem>
                              <SelectItem value="Female" className="hover:bg-pink-50 hover:text-pink-900 transition-colors">👩 Female</SelectItem>
                              <SelectItem value="Other" className="hover:bg-purple-50 hover:text-purple-900 transition-colors">⚧ Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-3 group">
                          <Label htmlFor="checkUpDate" className="text-sm font-semibold flex items-center gap-2 text-foreground group-hover:text-primary transition-colors">
                            Check-up Date
                          </Label>
                          <div className="relative">
                            <Input
                              id="checkUpDate"
                              type="date"
                              value={formData.personalDetails.checkUpDate}
                              onChange={(e) => {
                                handlePersonalChange("checkUpDate", e.target.value);
                                setHasUnsavedChanges(true);
                              }}
                              className="h-12 transition-all duration-300 focus:ring-2 focus:ring-primary/30 focus:border-primary/50 hover:border-primary/30 border-border/60 bg-gradient-to-br from-background to-muted/5 shadow-sm focus:shadow-md pl-12 pr-4"
                            />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                              <Calendar className="h-3.5 w-3.5 text-orange-600" />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3 group">
                          <Label htmlFor="checkUpDateNp" className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                            Check-up Date (Nepali)
                          </Label>
                          <div className="relative">
                            <NepaliDatePickerComponent
                              value={formData.personalDetails.checkUpDateNp}
                              onChange={(date: string) => {
                                handlePersonalChange("checkUpDateNp", date);
                                setHasUnsavedChanges(true);
                              }}
                              placeholder="Select Nepali date"
                            />
                          </div>
                        </div>

                        <div className="space-y-3 col-span-full group">
                          <Label htmlFor="address" className="text-sm font-semibold flex items-center gap-2 text-foreground group-hover:text-primary transition-colors">
                            Address
                          </Label>
                          <div className="relative">
                            <Textarea
                              id="address"
                              value={formData.personalDetails.address}
                              onChange={(e) => {
                                handlePersonalChange("address", e.target.value);
                                setHasUnsavedChanges(true);
                              }}
                              className="min-h-[100px] resize-none transition-all duration-300 focus:ring-2 focus:ring-primary/30 focus:border-primary/50 hover:border-primary/30 border-border/60 bg-gradient-to-br from-background to-muted/5 shadow-sm focus:shadow-md pl-12 pr-4 pt-4"
                              placeholder="Enter full address with area, city, and postal code..."
                            />
                            <div className="absolute left-3 top-4 w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                              <MapPin className="h-3.5 w-3.5 text-indigo-600" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Chief Complaint Section */}
              <Card className="border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="p-3 sm:p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Stethoscope className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base sm:text-lg">Chief Complaint</CardTitle>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        Patient's primary concern or reason for visit
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0">
                  <div className="space-y-2">
                    <Label htmlFor="chiefComplaint" className="text-sm font-medium">
                      Main Concern
                    </Label>
                    <Textarea
                      id="chiefComplaint"
                      placeholder="Describe the patient's main complaint or concern..."
                      className="min-h-[100px] resize-none transition-all duration-200 focus:ring-2 focus:ring-primary/20 hover:border-primary/30"
                      value={formData.medicalDetails.chiefComplaint || ""}
                      onChange={(e) => {
                        handleMedicalChange("chiefComplaint", e.target.value);
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Medical History Section */}
              <Collapsible 
                open={expandedSections.medicalHistory} 
                onOpenChange={() => toggleSection('medicalHistory')}
              >
                <Card className="border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors p-3 sm:p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-red-500/10 rounded-lg">
                            <Heart className="h-4 w-4 text-red-600" />
                          </div>
                          <div>
                            <CardTitle className="text-base sm:text-lg">Medical History</CardTitle>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                              Past medical conditions and health information
                            </p>
                          </div>
                        </div>
                        {expandedSections.medicalHistory ? 
                          <ChevronUp className="h-4 w-4" /> : 
                          <ChevronDown className="h-4 w-4" />
                        }
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="p-3 sm:p-4 pt-0">
                      <div className="space-y-6">

                        {/* Quick "No Medical Issues" Toggle */}
                        <div className="p-4 border-2 border-dashed border-muted-foreground/30 rounded-lg bg-muted/20">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              id="noMedicalIssues"
                              checked={formData.medicalDetails.medicalHistory.noMedicalIssues}
                              onCheckedChange={(checked) => {
                                if (checked) {
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
                                  handleMedicalHistoryChange("noMedicalIssues", checked);
                                }
                                setHasUnsavedChanges(true);
                              }}
                            />
                            <Label htmlFor="noMedicalIssues" className="font-medium flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-green-600" />
                              No Medical Issues
                            </Label>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2 ml-6">
                            Check this if the patient has no significant medical history
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Blood Pressure</Label>
                            <Input
                              value={formData.medicalDetails.medicalHistory.bloodPressure}
                              onChange={(e) => {
                                handleMedicalHistoryChange("bloodPressure", e.target.value);
                                setHasUnsavedChanges(true);
                              }}
                              placeholder="e.g. 120/80"
                              className="transition-all duration-200 focus:ring-2 focus:ring-primary/20 hover:border-primary/30"
                              disabled={formData.medicalDetails.medicalHistory.noMedicalIssues}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Allergies</Label>
                            <Input
                              value={formData.medicalDetails.medicalHistory.allergies}
                              onChange={(e) => {
                                handleMedicalHistoryChange("allergies", e.target.value);
                                setHasUnsavedChanges(true);
                              }}
                              placeholder="List any known allergies"
                              className="transition-all duration-200 focus:ring-2 focus:ring-primary/20 hover:border-primary/30"
                              disabled={formData.medicalDetails.medicalHistory.noMedicalIssues}
                            />
                          </div>

                          <div className="space-y-2 col-span-full md:col-span-1">
                            <Label className="text-sm font-medium">Other Conditions</Label>
                            <Textarea
                              value={formData.medicalDetails.medicalHistory.otherConditions}
                              onChange={(e) => {
                                handleMedicalHistoryChange("otherConditions", e.target.value);
                                setHasUnsavedChanges(true);
                              }}
                              placeholder="Describe any other medical conditions"
                              className="min-h-[80px] resize-none transition-all duration-200 focus:ring-2 focus:ring-primary/20 hover:border-primary/30"
                              disabled={formData.medicalDetails.medicalHistory.noMedicalIssues}
                            />
                          </div>
                        </div>

                        <Separator className="my-4" />
                        
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-muted-foreground">Medical Conditions</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                              <Checkbox
                                id="diabetes"
                                checked={formData.medicalDetails.medicalHistory.diabetes}
                                onCheckedChange={(checked) => {
                                  handleMedicalHistoryChange("diabetes", checked);
                                  setHasUnsavedChanges(true);
                                }}
                                disabled={formData.medicalDetails.medicalHistory.noMedicalIssues}
                              />
                              <Label htmlFor="diabetes" className="text-sm">Diabetes</Label>
                            </div>
                            <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                              <Checkbox
                                id="thyroid"
                                checked={formData.medicalDetails.medicalHistory.thyroid}
                                onCheckedChange={(checked) => {
                                  handleMedicalHistoryChange("thyroid", checked);
                                  setHasUnsavedChanges(true);
                                }}
                                disabled={formData.medicalDetails.medicalHistory.noMedicalIssues}
                              />
                              <Label htmlFor="thyroid" className="text-sm">Thyroid</Label>
                            </div>
                            <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                              <Checkbox
                                id="bleedingDisorder"
                                checked={formData.medicalDetails.medicalHistory.bleedingDisorder}
                                onCheckedChange={(checked) => {
                                  handleMedicalHistoryChange("bleedingDisorder", checked);
                                  setHasUnsavedChanges(true);
                                }}
                                disabled={formData.medicalDetails.medicalHistory.noMedicalIssues}
                              />
                              <Label htmlFor="bleedingDisorder" className="text-sm">Bleeding Disorder</Label>
                            </div>
                            <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                              <Checkbox
                                id="pregnancy"
                                checked={formData.medicalDetails.medicalHistory.pregnancy}
                                onCheckedChange={(checked) => {
                                  handleMedicalHistoryChange("pregnancy", checked);
                                  setHasUnsavedChanges(true);
                                }}
                                disabled={formData.medicalDetails.medicalHistory.noMedicalIssues}
                              />
                              <Label htmlFor="pregnancy" className="text-sm">Pregnancy</Label>
                            </div>
                            <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                              <Checkbox
                                id="asthma"
                                checked={formData.medicalDetails.medicalHistory.asthma}
                                onCheckedChange={(checked) => {
                                  handleMedicalHistoryChange("asthma", checked);
                                  setHasUnsavedChanges(true);
                                }}
                                disabled={formData.medicalDetails.medicalHistory.noMedicalIssues}
                              />
                              <Label htmlFor="asthma" className="text-sm">Asthma</Label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

            </TabsContent>

            <TabsContent
              value="medical"
              className="mt-0 focus-visible:outline-none focus-visible:ring-0 space-y-4 p-3 sm:p-4"
            >
              {/* Medical Information Section */}
              <Card className="border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="p-3 sm:p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Stethoscope className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base sm:text-lg">Medical Information</CardTitle>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        Basic medical details and patient classification
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0">
                  <div className="space-y-4">

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
                            <Label>Patient Group</Label>
                            <Select
                              value={formData.medicalDetails.group}
                              onValueChange={(value) =>
                                handleMedicalChange("group", value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select group" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="General">General</SelectItem>
                                <SelectItem value="Ortho">Ortho</SelectItem>
                                <SelectItem value="Endo">Endo</SelectItem>
                                <SelectItem value="Perio">Perio</SelectItem>
                                <SelectItem value="Prostho">Prostho</SelectItem>
                                <SelectItem value="Surgery">Surgery</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
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

                        <div className="space-y-3">
                          <Label htmlFor="followUpDateNp" className="text-sm font-medium">
                            Follow-up Date (Nepali)
                          </Label>
                          <NepaliDatePickerComponent
                            value={formData.medicalDetails.followUpDateNp}
                            onChange={(date: string) => handleMedicalChange("followUpDateNp", date)}
                            placeholder="Select Nepali date"
                          />
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

                        {/* Treatment Plans Section */}
                        <div className="mt-6">
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
                                  patientId={patient?._id || ""}
                                  medicalDetailId={patient?.medicalDetails?.[0]?._id || ""}
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

                {/* Group Treatment Management */}
                {formData.medicalDetails.treatmentPlanning.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium border-b pb-2">Group Treatment Management</h3>
                    {formData.medicalDetails.treatmentPlanning.map((plan, planIndex) => (
                      <div key={planIndex} className="space-y-4">
                        <h4 className="text-md font-medium text-muted-foreground">
                          Treatment Plan {planIndex + 1} - Group Treatments
                        </h4>
                        <GroupTreatmentManager
                          groupTreatments={plan.groupTreatmentDetails || []}
                          doctors={doctors}
                          onAddGroupTreatment={(groupTreatment) =>
                            handleGroupTreatmentAdd(planIndex, groupTreatment)
                          }
                          onUpdateGroupTreatment={(groupIndex, groupTreatment) => handleGroupTreatmentUpdate(planIndex, groupIndex, groupTreatment)}
                          onRemoveGroupTreatment={(groupIndex) =>
                            handleGroupTreatmentRemove(planIndex, groupIndex)
                          }
                        />
                      </div>
                    ))}
                  </div>
                )}
                </div>
              </CardContent>
            </Card>

        </TabsContent>

        <TabsContent
          value="documents"
          className="mt-0 focus-visible:outline-none focus-visible:ring-0 p-3 sm:p-4"
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
                  patientId={patient?._id || ""}
                  medicalDetailId={patient?.medicalDetails?.[0]?._id}
                  onSuccess={() => {
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
          </ScrollArea>
          
          {/* Compact Footer */}
          <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-r from-background/98 via-background/95 to-background/98 backdrop-blur-xl border-t border-border/40 shadow-lg z-50">
            {hasUnsavedChanges && (
              <div className="px-3 py-1.5 bg-gradient-to-r from-amber-50/80 via-yellow-50/80 to-amber-50/80 border-b border-amber-200/50">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="h-3 w-3 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-semibold text-amber-800">
                      Unsaved changes
                    </span>
                  </div>
                  <div className="animate-pulse w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                </div>
              </div>
            )}
            
            <div className="p-2">
              <div className="flex items-center justify-between gap-2">
                {/* Compact Navigation Buttons */}
                <div className="flex items-center gap-2 flex-1">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="flex items-center gap-1 h-7 px-2 text-xs font-semibold hover:bg-red-50 hover:text-red-600 transition-all duration-200"
                  >
                    <X className="h-3 w-3" />
                    <span className="hidden sm:inline">Cancel</span>
                  </Button>
                  
                  {activeTab === "personal" && (
                    <Button
                      onClick={() => setActiveTab("medical")}
                      className="flex items-center gap-1 h-7 px-2 text-xs font-semibold bg-gradient-to-r from-primary to-primary/90 transition-all duration-200"
                    >
                      <span className="hidden sm:inline">Next: Medical</span>
                      <span className="sm:hidden">Next</span>
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  )}
                  
                  {activeTab === "medical" && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => setActiveTab("personal")}
                        className="flex items-center gap-1 h-7 px-2 text-xs font-semibold hover:bg-muted/60 transition-all duration-200"
                      >
                        <ArrowLeft className="h-3 w-3" />
                        <span className="hidden sm:inline">Personal</span>
                        <span className="sm:hidden">Back</span>
                      </Button>
                      <Button
                        onClick={() => setActiveTab("documents")}
                        className="flex items-center gap-1 h-7 px-2 text-xs font-semibold bg-gradient-to-r from-primary to-primary/90 transition-all duration-200"
                      >
                        <span className="hidden sm:inline">Next: Documents</span>
                        <span className="sm:hidden">Next</span>
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                  
                  {activeTab === "documents" && (
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab("medical")}
                      className="flex items-center gap-1 h-7 px-2 text-xs font-semibold hover:bg-muted/60 transition-all duration-200"
                    >
                      <ArrowLeft className="h-3 w-3" />
                      <span className="hidden sm:inline">Medical</span>
                      <span className="sm:hidden">Back</span>
                    </Button>
                  )}
                </div>
                
                {/* Compact Progress and Save */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="hidden md:flex items-center gap-1 bg-muted/30 rounded-md px-1.5 py-0.5">
                    <div className="text-xs text-muted-foreground font-medium">
                      {activeTab === 'personal' ? '1' : activeTab === 'medical' ? '2' : '3'}/3
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3].map((step) => {
                        const isActive = (step === 1 && activeTab === 'personal') ||
                                        (step === 2 && activeTab === 'medical') ||
                                        (step === 3 && activeTab === 'documents');
                        const isCompleted = step < (activeTab === 'personal' ? 1 : activeTab === 'medical' ? 2 : 3);
                        
                        return (
                          <div
                            key={step}
                            className={`w-2 h-2 rounded-full transition-all duration-200 ${
                              isActive
                                ? 'bg-primary scale-110'
                                : isCompleted
                                ? 'bg-green-500'
                                : 'bg-muted border border-muted-foreground/30'
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleFormSubmit}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 h-9 px-4 text-xs font-bold bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin w-3 h-3 border-2 border-white/30 border-t-white rounded-full"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-3 w-3" />
                        <span>Save</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
    
    {/* Payment History Dialog */}
    <PaymentHistoryDialog
      isOpen={showPaymentHistory}
      onClose={() => setShowPaymentHistory(false)}
      selectedTeethMaps={selectedTeethMaps}
      onPaymentUpdate={handlePaymentUpdate}
      patientId={patient?._id || ""}
      medicalDetailId={patient?.medicalDetails?.[0]?._id || ""}
      patient={patient} // Pass the patient object
    />
  </TooltipProvider>
  );
};

export default UpdatePatientModal;
