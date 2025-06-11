import { useState, useEffect } from "react";
import { format } from "date-fns";
import { toast } from "react-toastify";
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogFooter } from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { crudRequest } from "@/lib/api";
import { getToothPosition, getToothSide } from "@/helper/PatientHelper";
import { Patient, ToothData, DailyTreatment, TreatmentPlan as PatientTreatmentPlan } from "@/types/patient";
import DentalChart from "../DentalChart";
import ChildDentalChart from "../ChildDentalChart";
import { DailyTreatmentManager } from "./DailyTreatmentManager";
import { Loader2, FileText, PlusCircle, Save } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TreatmentFileUpload } from "./TreatmentFileUpload";

interface AddXRayPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
}

// Define TreatmentPlan type for cleaner code
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
  selectedTeethDetails?: Array<ToothData>;
};

// Add a type interface for the API response
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
}

// Define doctor type
type Doctor = {
  _id: string;
  name: string;
  specialization: string;
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
  const [activeTab, setActiveTab] = useState("existing");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [existingTreatmentPlans, setExistingTreatmentPlans] = useState<TreatmentPlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [selectedExistingPlan, setSelectedExistingPlan] = useState<TreatmentPlan | null>(null);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Initialize with a single empty treatment plan for new plans
  const [newTreatmentPlan, setNewTreatmentPlan] = useState<TreatmentPlan>({
    treatmentDate: formatSafeDate(new Date().toISOString()),
    treatmentDetails: "X-Ray Plan",
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

  // Selected teeth maps for both existing and new plans
  const [selectedTeethMap, setSelectedTeethMap] = useState<Record<string, ToothData>>({});
  const [existingTeethMap, setExistingTeethMap] = useState<Record<string, ToothData>>({});

  // Fetch doctors and existing plans when component mounts
  useEffect(() => {
    if (isOpen) {
      fetchDoctors();
      fetchExistingTreatmentPlans();
    }
  }, [isOpen, patient._id, refreshTrigger]);

  const fetchDoctors = async () => {
    try {
      const response = await crudRequest("GET", "/doctor/get-doctor");
      if (response && Array.isArray(response)) {
        setDoctors(response);
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
      toast.error("Failed to load doctors");
    }
  };

  const fetchExistingTreatmentPlans = async () => {
    if (!patient._id || !patient.medicalDetails?.[0]?._id) {
      console.log("Cannot fetch treatment plans: Missing patient ID or medical detail ID");
      return;
    }
    
    setIsLoadingPlans(true);
    try {
      // Use the type interface for the API response
      const response = await crudRequest<ApiResponse<TreatmentPlan[]>>(
        "GET", 
        `/patient/get-treatment-plans/${patient._id}/${patient.medicalDetails[0]._id}`
      );
      
      // Handle the response
      if (response && response.success && Array.isArray(response.data)) {
        setExistingTreatmentPlans(response.data);
        console.log(`Fetched ${response.data.length} treatment plans successfully`);
      } else {
        console.error("Error fetching treatment plans: Unexpected response format", response);
        setExistingTreatmentPlans([]);
      }
    } catch (error) {
      console.error("Error fetching treatment plans:", error);
      toast.error(typeof error === 'object' && error !== null && 'message' in error 
        ? (error as {message: string}).message 
        : "Failed to load existing treatment plans");
      setExistingTreatmentPlans([]);
    } finally {
      setIsLoadingPlans(false);
    }
  };

  // Select an existing plan for viewing/editing
  const handleSelectExistingPlan = (plan: TreatmentPlan) => {
    setSelectedExistingPlan(plan);
    
    // Create teeth map from the selected plan
    const teethMap: Record<string, ToothData> = {};
    if (plan.selectedTeethDetails && plan.selectedTeethDetails.length > 0) {
      plan.selectedTeethDetails.forEach(tooth => {
        teethMap[tooth.number] = tooth;
      });
    }
    setExistingTeethMap(teethMap);
  };

  // Functions for new plan tab
  const handleTreatmentChange = (field: string, value: any) => {
    setNewTreatmentPlan((prev) => {
      let updatedPlan = { ...prev };

      if (field === "treatmentAmount" || field === "advancedAmount") {
        const treatmentAmount = field === "treatmentAmount" ? parseFloat(value) || 0 : parseFloat(prev.treatmentAmount) || 0;
        let advancedAmount = field === "advancedAmount" ? parseFloat(value) || 0 : parseFloat(prev.advancedAmount) || 0;

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

  const handleToothSelect = (toothNumber: string, forExisting: boolean = false) => {
    const setTeethMap = forExisting ? setExistingTeethMap : setSelectedTeethMap;
    
    setTeethMap((prev) => {
      const currentTeeth = { ...prev };

      if (currentTeeth[toothNumber]) {
        const { [toothNumber]: _, ...rest } = currentTeeth;
        return rest;
      } else {
        const today = format(new Date(), "yyyy-MM-dd");
        const defaultTreatment: DailyTreatment = {
          date: today,
          treatmentAmount: 100, 
          paidAmount: 0,
          remainingAmount: 100,
          treatedByDoctor: "", 
          procedure: "RVG X-Ray",
          notes: "Initial X-Ray assessment",
        };

        return {
          ...currentTeeth,
          [toothNumber]: {
            number: toothNumber,
            details: "",
            procedure: "RVG X-Ray",
            position: getToothPosition(toothNumber),
            side: getToothSide(toothNumber),
            dailyTreatments: [defaultTreatment],
            totalTreatmentAmount: 100,
            totalPaidAmount: 0,
            totalRemainingAmount: 100,
          },
        };
      }
    });

    // Update treatment plan with selected teeth
    setTimeout(() => {
      if (forExisting) {
        updateExistingTeethInPlan();
      } else {
        updateSelectedTeethInPlan();
      }
    }, 0);
  };

  const updateSelectedTeethInPlan = () => {
    const selectedTeethArray = Object.entries(selectedTeethMap).map(([number, data]) => {
      // Deep clone the dailyTreatments array to avoid reference issues
      const dailyTreatmentsCopy = data.dailyTreatments ? 
        JSON.parse(JSON.stringify(data.dailyTreatments)) : [];
      
      // Log the treatments being added to the plan
      console.log(`Updating plan for tooth ${number} with ${dailyTreatmentsCopy.length} daily treatments:`, 
        dailyTreatmentsCopy);
      
      return {
        number,
        details: data.details || "",
        procedure: data.procedure || "RVG X-Ray",
        position: getToothPosition(number),
        side: getToothSide(number),
        dailyTreatments: dailyTreatmentsCopy,
        totalTreatmentAmount: data.totalTreatmentAmount || 0,
        totalPaidAmount: data.totalPaidAmount || 0,
        totalRemainingAmount: data.totalRemainingAmount || 0,
      };
    });

    setNewTreatmentPlan(prev => ({
      ...prev,
      teethNumber: selectedTeethArray.map(t => t.number).join(", "),
      selectedTeethDetails: selectedTeethArray,
    }));
  };

  const updateExistingTeethInPlan = () => {
    if (!selectedExistingPlan) return;

    const teethArray = Object.entries(existingTeethMap).map(([number, data]) => {
      // Deep clone the dailyTreatments array to avoid reference issues
      const dailyTreatmentsCopy = data.dailyTreatments ? 
        JSON.parse(JSON.stringify(data.dailyTreatments)) : [];
      
      // Log the treatments being added to the existing plan
      console.log(`Updating existing plan for tooth ${number} with ${dailyTreatmentsCopy.length} daily treatments:`, 
        dailyTreatmentsCopy);
      
      return {
        number,
        details: data.details || "",
        procedure: data.procedure || "RVG X-Ray",
        position: getToothPosition(number),
        side: getToothSide(number),
        dailyTreatments: dailyTreatmentsCopy,
        totalTreatmentAmount: data.totalTreatmentAmount || 0,
        totalPaidAmount: data.totalPaidAmount || 0,
        totalRemainingAmount: data.totalRemainingAmount || 0,
      };
    });

    setSelectedExistingPlan(prev => {
      if (!prev) return null;
      return {
        ...prev,
        teethNumber: teethArray.map(t => t.number).join(", "),
        selectedTeethDetails: teethArray,
      };
    });
  };

  const handleDailyTreatmentAdd = async (toothNumber: string, treatment: DailyTreatment, forExisting: boolean = false) => {
    const setTeethMap = forExisting ? setExistingTeethMap : setSelectedTeethMap;
    
    // Make sure procedure is not empty
    if (!treatment.procedure) {
      treatment.procedure = "RVG X-Ray";
    }
    
    // Generate a temporary ID if one doesn't exist to help with tracking
    if (!treatment._id) {
      treatment._id = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    console.log("Adding daily treatment:", { 
      toothNumber, 
      treatment,
      forExisting,
      existingTreatmentsCount: forExisting ? 
        existingTeethMap[toothNumber]?.dailyTreatments?.length || 0 : 
        selectedTeethMap[toothNumber]?.dailyTreatments?.length || 0
    });
    
    setTeethMap((prev) => {
      // Make a deep copy of the previous state to avoid reference issues
      const prevMapCopy = JSON.parse(JSON.stringify(prev)) as Record<string, ToothData>;

      if (!prevMapCopy[toothNumber]) {
        prevMapCopy[toothNumber] = {
          number: toothNumber,
          details: "",
          procedure: "RVG X-Ray",
          position: getToothPosition(toothNumber),
          side: getToothSide(toothNumber),
          dailyTreatments: [],
          totalTreatmentAmount: 0,
          totalPaidAmount: 0,
          totalRemainingAmount: 0,
        };
      }

      // Add new treatment to the tooth's dailyTreatments array
      const updatedDailyTreatments = [...(prevMapCopy[toothNumber].dailyTreatments || [])];
      
      if (treatment._id) {
        // If treatment has an ID, it's an update to an existing treatment
        const index = updatedDailyTreatments.findIndex(t => t._id === treatment._id);
        if (index !== -1) {
          console.log(`Updating existing treatment at index ${index}`, treatment);
          updatedDailyTreatments[index] = { ...treatment };
        } else {
          console.log(`Adding new treatment with ID ${treatment._id}`, treatment);
          updatedDailyTreatments.push({ ...treatment });
        }
      } else {
        // New treatment
        console.log(`Adding brand new treatment`, treatment);
        updatedDailyTreatments.push({ ...treatment });
      }

      console.log(`Total treatments for tooth ${toothNumber} after update: ${updatedDailyTreatments.length}`);

      // Recalculate totals
      const totalTreatmentAmount = updatedDailyTreatments.reduce(
        (sum, t) => sum + (typeof t.treatmentAmount === 'number' ? t.treatmentAmount : 0), 
        0
      );
      
      const totalPaidAmount = updatedDailyTreatments.reduce(
        (sum, t) => sum + (typeof t.paidAmount === 'number' ? t.paidAmount : 0), 
        0
      );

      // Update the tooth with new treatment and recalculated totals
      prevMapCopy[toothNumber] = {
        ...prevMapCopy[toothNumber],
        dailyTreatments: updatedDailyTreatments,
        totalTreatmentAmount,
        totalPaidAmount,
        totalRemainingAmount: totalTreatmentAmount - totalPaidAmount,
      };

      return prevMapCopy;
    });

    // Update treatment plan with updated teeth
    setTimeout(async () => {
      if (forExisting) {
        updateExistingTeethInPlan();
        
        // Auto-save existing plan after adding a daily treatment
        if (selectedExistingPlan && selectedExistingPlan._id) {
          // Only attempt to save if we're not already submitting and have a valid plan ID
          if (!isSubmitting) {
            try {
              // Set submitting state to prevent double submissions
              setIsSubmitting(true);
              
              // Small delay to ensure state updates are complete
              await new Promise(resolve => setTimeout(resolve, 100));
              
              const medicalDetailId = patient.medicalDetails[0]?._id;
              if (!medicalDetailId) {
                toast.error("Medical detail ID is missing");
                setIsSubmitting(false);
                return;
              }
              
              // Create a deep copy of the plan to avoid reference issues
              const updatedPlan = JSON.parse(JSON.stringify(selectedExistingPlan));
              
              // Create payload for the update
              const payload = {
                ...updatedPlan,
                patientType: patient.medicalDetails[0]?.patientType || "Adult",
              };
              
              // Ensure each daily treatment has a procedure value
              if (payload.selectedTeethDetails && payload.selectedTeethDetails.length > 0) {
                payload.selectedTeethDetails.forEach((tooth: ToothData) => {
                  if (tooth.dailyTreatments) {
                    tooth.dailyTreatments = tooth.dailyTreatments.map((t: DailyTreatment) => ({
                      ...t,
                      procedure: t.procedure || "RVG X-Ray"
                    }));
                  }
                });
              }
              
              // Log the payload for debugging
              console.log("Auto-saving X-Ray plan after adding daily treatment - payload:", JSON.stringify(payload, null, 2));
              
              // Ensure all daily treatments have needed properties
                             if (payload.selectedTeethDetails) {
                payload.selectedTeethDetails = payload.selectedTeethDetails.map((tooth: ToothData) => {
                  if (tooth.dailyTreatments) {
                    // Add required properties to each daily treatment
                    tooth.dailyTreatments = tooth.dailyTreatments.map((treatment: DailyTreatment) => ({
                      date: treatment.date || format(new Date(), "yyyy-MM-dd"),
                      treatmentAmount: typeof treatment.treatmentAmount === 'number' ? treatment.treatmentAmount : Number(treatment.treatmentAmount) || 0,
                      paidAmount: typeof treatment.paidAmount === 'number' ? treatment.paidAmount : Number(treatment.paidAmount) || 0,
                      remainingAmount: typeof treatment.remainingAmount === 'number' ? treatment.remainingAmount : Number(treatment.remainingAmount) || 0,
                      procedure: treatment.procedure || "RVG X-Ray",
                      notes: treatment.notes || "",
                      treatedByDoctor: treatment.treatedByDoctor || null,
                      isCompleted: Boolean(treatment.isCompleted),
                      _id: treatment._id // Keep the ID if it exists
                    }));
                  }
                  return tooth;
                });
              }
              
              console.log("Final cleaned payload:", JSON.stringify(payload, null, 2));
              
              // Update the plan in the database
              const response = await crudRequest<ApiResponse<any>>(
                "PUT",
                `/patient/update-treatment-plan/${patient._id}/${medicalDetailId}/${selectedExistingPlan._id}`,
                payload
              );
              
              if (response && response.success) {
                toast.success("Daily treatment saved to database");
                // No need to refresh or reset - we want to keep editing
              } else {
                toast.error(response?.message || "Failed to save daily treatment to database");
              }
            } catch (error) {
              console.error("Error auto-saving X-Ray Plan:", error);
              toast.error(typeof error === 'object' && error !== null && 'message' in error 
                ? (error as {message: string}).message 
                : "Failed to save daily treatment to database");
            } finally {
              setIsSubmitting(false);
            }
          } else {
            // We're already submitting, just update the state
            toast.info("Treatment added locally, will be saved when you click Save Changes");
          }
        }
      } else {
        updateSelectedTeethInPlan();
      }
      
      // Log the current state after update to verify
      setTimeout(() => {
        const currentMap = forExisting ? existingTeethMap : selectedTeethMap;
        console.log(`Verification after update - Tooth ${toothNumber} has ${currentMap[toothNumber]?.dailyTreatments?.length || 0} daily treatments:`, 
          currentMap[toothNumber]?.dailyTreatments);
      }, 0);
    }, 0);
  };

  // Function to update an existing plan
  const handleUpdateExistingPlan = async () => {
    if (!selectedExistingPlan || !selectedExistingPlan._id) {
      toast.error("No plan selected for update");
      return;
    }

    setIsSubmitting(true);

    try {
      const medicalDetailId = patient.medicalDetails[0]?._id;
      if (!medicalDetailId) {
        toast.error("Medical detail ID is missing");
        setIsSubmitting(false);
        return;
      }

      // Create a deep copy of the plan to avoid reference issues
      const updatedPlan = JSON.parse(JSON.stringify(selectedExistingPlan));
      
      // Create payload for the update
      const payload = {
        ...updatedPlan,
        patientType: patient.medicalDetails[0]?.patientType || "Adult",
      };
      
      // Verify daily treatments data
      if (payload.selectedTeethDetails && payload.selectedTeethDetails.length > 0) {
        // Log each tooth's daily treatments for debugging
        payload.selectedTeethDetails.forEach((tooth: ToothData) => {
          console.log(`Tooth ${tooth.number} has ${tooth.dailyTreatments?.length || 0} daily treatments:`, 
            tooth.dailyTreatments);
        });
        
        // Ensure all daily treatments have required properties
        payload.selectedTeethDetails = payload.selectedTeethDetails.map((tooth: ToothData) => {
          if (tooth.dailyTreatments && tooth.dailyTreatments.length > 0) {
            // Add required properties to each daily treatment
            tooth.dailyTreatments = tooth.dailyTreatments.map((treatment: DailyTreatment) => ({
              date: treatment.date || format(new Date(), "yyyy-MM-dd"),
              treatmentAmount: typeof treatment.treatmentAmount === 'number' ? treatment.treatmentAmount : Number(treatment.treatmentAmount) || 0,
              paidAmount: typeof treatment.paidAmount === 'number' ? treatment.paidAmount : Number(treatment.paidAmount) || 0,
              remainingAmount: typeof treatment.remainingAmount === 'number' ? treatment.remainingAmount : Number(treatment.remainingAmount) || 0,
              procedure: treatment.procedure || "RVG X-Ray",
              notes: treatment.notes || "",
              treatedByDoctor: treatment.treatedByDoctor || null,
              isCompleted: Boolean(treatment.isCompleted),
              _id: treatment._id // Keep the ID if it exists
            }));
          }
          return tooth;
        });
      }

      console.log("Updating X-Ray plan with payload:", payload);

      // Update the plan
      const response = await crudRequest<ApiResponse<any>>(
        "PUT",
        `/patient/update-treatment-plan/${patient._id}/${medicalDetailId}/${selectedExistingPlan._id}`,
        payload
      );

      if (response && response.success) {
        toast.success("X-Ray Plan updated successfully");
        setRefreshTrigger(prev => prev + 1);
        setSelectedExistingPlan(null);
      } else {
        toast.error(response?.message || "Failed to update X-Ray Plan");
      }
    } catch (error) {
      console.error("Error updating X-Ray Plan:", error);
      toast.error(typeof error === 'object' && error !== null && 'message' in error 
        ? (error as {message: string}).message 
        : "Failed to update X-Ray Plan");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to save a new treatment plan
  const handleSubmitNewPlan = async () => {
    if (Object.keys(selectedTeethMap).length === 0) {
      toast.error("Please select at least one tooth for the X-Ray plan");
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare data for submission
      const medicalDetailId = patient.medicalDetails[0]?._id;

      if (!medicalDetailId) {
        toast.error("Medical detail ID is missing");
        setIsSubmitting(false);
        return;
      }

      // Create payload with updated treatment plan
      const payload = {
        ...newTreatmentPlan,
        patientType: patient.medicalDetails[0]?.patientType || "Adult",
      };

      // Verify daily treatments data for new plan
      if (payload.selectedTeethDetails && payload.selectedTeethDetails.length > 0) {
        // Log each tooth's daily treatments for debugging
        payload.selectedTeethDetails.forEach(tooth => {
          console.log(`New plan - Tooth ${tooth.number} has ${tooth.dailyTreatments?.length || 0} daily treatments:`, 
            tooth.dailyTreatments);
          
          // Ensure each daily treatment has a procedure value
          if (tooth.dailyTreatments) {
            tooth.dailyTreatments = tooth.dailyTreatments.map(treatment => ({
              ...treatment,
              procedure: treatment.procedure || "RVG X-Ray"
            }));
          }
        });
      }

      console.log("Adding new X-Ray plan with payload:", payload);

      // Use the type interface for the API response
      const response = await crudRequest<ApiResponse<any>>(
        "POST",
        `/patient/add-treatment-plan/${patient._id}/${medicalDetailId}`,
        payload
      );

      if (response && response.success) {
        toast.success("X-Ray Plan added successfully");
        setRefreshTrigger(prev => prev + 1);
        setActiveTab("existing");
      } else {
        toast.error(response?.message || "Failed to add X-Ray Plan");
      }
    } catch (error) {
      console.error("Error adding X-Ray Plan:", error);
      toast.error(typeof error === 'object' && error !== null && 'message' in error 
        ? (error as {message: string}).message 
        : "Failed to add X-Ray Plan");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">X-Ray Plans for {patient.personalDetails.name}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="existing" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="existing" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Existing X-Ray Plans
              {isLoadingPlans && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            </TabsTrigger>
            <TabsTrigger value="new" className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              Create New X-Ray Plan
            </TabsTrigger>
          </TabsList>

          {/* Existing Plans Tab */}
          <TabsContent value="existing" className="space-y-4">
            {isLoadingPlans ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            ) : existingTreatmentPlans.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8 border border-dashed rounded-lg">
                    <FileText className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="mt-2 text-muted-foreground">
                      No existing X-Ray plans found for this patient.
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setActiveTab("new")}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Create New X-Ray Plan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Plan Selection Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Select an X-Ray Plan</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[200px]">
                      <div className="px-4 pb-4">
                        {existingTreatmentPlans.map((plan, index) => (
                          <div 
                            key={plan._id} 
                            className={`border rounded-lg p-3 mb-3 cursor-pointer transition-colors
                              ${selectedExistingPlan?._id === plan._id 
                                ? 'border-primary bg-primary/5' 
                                : 'hover:border-primary/50 hover:bg-muted/50'}`}
                            onClick={() => handleSelectExistingPlan(plan)}
                          >
                            <div className="flex justify-between items-center">
                              <h4 className="text-base font-medium flex items-center gap-2">
                                <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">
                                  {index + 1}
                                </span>
                                {plan.treatmentDetails || `X-Ray Plan ${index + 1}`}
                              </h4>
                              <Badge variant={plan.isCompleted ? "default" : "outline"}>
                                {plan.isCompleted ? "Completed" : "In Progress"}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                              <div>
                                <span className="text-muted-foreground">Date: </span>
                                {formatSafeDate(plan.treatmentDate)}
                              </div>
                              <div>
                                <span className="text-muted-foreground">Teeth: </span>
                                {plan.teethNumber || "None"}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Selected Plan Details */}
                {selectedExistingPlan ? (
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">Plan Details: {selectedExistingPlan.treatmentDetails}</CardTitle>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setShowFileUpload(true)}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Upload Files
                          </Button>
                          <Button 
                            size="sm"
                            onClick={handleUpdateExistingPlan}
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                                Updating...
                              </>
                            ) : (
                              <>
                                <Save className="mr-1 h-4 w-4" />
                                Save Changes
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="chart">
                        <TabsList className="mb-4">
                          <TabsTrigger value="chart">Dental Chart</TabsTrigger>
                          <TabsTrigger value="details">Plan Information</TabsTrigger>
                          <TabsTrigger value="files">
                            Files ({selectedExistingPlan.treatmentDocuments?.length || 0})
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="chart">
                          <div className="space-y-4">
                            <div className="border rounded-lg p-4 overflow-x-auto">
                              <div className="min-width-full w-full max-w-[800px] mx-auto">
                                {patient.medicalDetails[0]?.patientType === "Child" ? (
                                  <ChildDentalChart
                                    selectedTeeth={existingTeethMap}
                                    onToothSelect={(tooth) => handleToothSelect(tooth, true)}
                                    readOnly={false}
                                  />
                                ) : (
                                  <DentalChart
                                    selectedTeeth={existingTeethMap}
                                    onToothSelect={(tooth) => handleToothSelect(tooth, true)}
                                    readOnly={false}
                                  />
                                )}
                              </div>
                            </div>

                            <div className="mb-3">
                              <h3 className="text-lg font-medium flex items-center gap-2">
                                Selected Teeth 
                                <Badge variant="outline" className="ml-2">
                                  {Object.keys(existingTeethMap).length} teeth
                                </Badge>
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Click on teeth in the chart to add or remove them
                              </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                              {Object.entries(existingTeethMap).map(([number, toothData]) => (
                                                          <DailyTreatmentManager
                            key={number}
                            toothNumber={number}
                            toothData={{
                              ...toothData,
                              _id: toothData._id || number,
                              treatmentId: selectedExistingPlan?._id || ''
                            }}
                            doctors={doctors}
                            onAddTreatment={(toothNumber, treatment) => 
                              handleDailyTreatmentAdd(toothNumber, treatment, true)
                            }
                            patientId={patient._id}
                            medicalDetailId={patient.medicalDetails[0]?._id || ""}
                          />
                              ))}
                            </div>

                            {Object.keys(existingTeethMap).length === 0 && (
                              <div className="text-center py-8 border border-dashed rounded-lg">
                                <FileText className="h-8 w-8 mx-auto text-muted-foreground" />
                                <p className="mt-2 text-muted-foreground">
                                  No teeth selected. Click on teeth in the dental chart above.
                                </p>
                              </div>
                            )}
                          </div>
                        </TabsContent>

                        <TabsContent value="details">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Treatment Date</Label>
                              <Input
                                type="date"
                                value={selectedExistingPlan.treatmentDate}
                                onChange={(e) => 
                                  setSelectedExistingPlan(prev => 
                                    prev ? {...prev, treatmentDate: e.target.value} : null
                                  )
                                }
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Doctor</Label>
                              <Select
                                value={selectedExistingPlan.treatedByDoctor}
                                onValueChange={(value) => 
                                  setSelectedExistingPlan(prev => 
                                    prev ? {...prev, treatedByDoctor: value} : null
                                  )
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

                            <div className="space-y-2">
                              <Label>X-Ray Type/Details</Label>
                              <Input
                                value={selectedExistingPlan.treatmentDetails}
                                onChange={(e) => 
                                  setSelectedExistingPlan(prev => 
                                    prev ? {...prev, treatmentDetails: e.target.value} : null
                                  )
                                }
                                placeholder="X-Ray Plan"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Clinical Findings</Label>
                              <Select
                                value={selectedExistingPlan.clinicalFindings[0] || ""}
                                onValueChange={(value) =>
                                  setSelectedExistingPlan(prev => {
                                    if (!prev) return null;
                                    const findings = prev.clinicalFindings.includes(value)
                                      ? prev.clinicalFindings.filter((v) => v !== value)
                                      : [...prev.clinicalFindings, value];
                                    return {...prev, clinicalFindings: findings};
                                  })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select findings" />
                                </SelectTrigger>
                                <SelectContent>
                                  {[
                                    "Caries",
                                    "Decayed",
                                    "Missing",
                                    "Crowding",
                                    "Impaction",
                                    "Pericoronitis",
                                    "Food Lodgment",
                                  ].map((finding) => (
                                    <SelectItem key={finding} value={finding}>
                                      {finding}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2 col-span-2">
                              <Label>Treatment Findings</Label>
                              <Textarea
                                value={selectedExistingPlan.treatmentFindings}
                                onChange={(e) => 
                                  setSelectedExistingPlan(prev => 
                                    prev ? {...prev, treatmentFindings: e.target.value} : null
                                  )
                                }
                                placeholder="Enter X-Ray findings here"
                                className="min-h-[100px]"
                              />
                            </div>

                            <div className="space-y-2 col-span-2">
                              <Label>Other Notes</Label>
                              <Textarea
                                value={selectedExistingPlan.otherFindings}
                                onChange={(e) => 
                                  setSelectedExistingPlan(prev => 
                                    prev ? {...prev, otherFindings: e.target.value} : null
                                  )
                                }
                                placeholder="Any additional notes"
                                className="min-h-[100px]"
                              />
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="files">
                          <div className="space-y-4">
                            {(!selectedExistingPlan.treatmentDocuments ||
                              selectedExistingPlan.treatmentDocuments.length === 0) ? (
                              <div className="text-center py-8 border border-dashed rounded-lg">
                                <FileText className="h-8 w-8 mx-auto text-muted-foreground" />
                                <p className="mt-2 text-muted-foreground">No documents yet</p>
                                <Button
                                  variant="outline"
                                  className="mt-4"
                                  onClick={() => setShowFileUpload(true)}
                                >
                                  <FileText className="h-4 w-4 mr-2" /> Upload Files
                                </Button>
                              </div>
                            ) : (
                              <div className="grid gap-2">
                                {selectedExistingPlan.treatmentDocuments.map((doc, idx) => (
                                  <a
                                    key={idx}
                                    href={doc.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 p-3 border rounded hover:bg-accent/20"
                                  >
                                    <FileText className="h-5 w-5 text-blue-500" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">
                                        {doc.fileName}
                                      </p>
                                      {doc.description && (
                                        <p className="text-xs text-muted-foreground truncate">
                                          {doc.description}
                                        </p>
                                      )}
                                    </div>
                                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                                      {format(new Date(doc.uploadDate), "dd MMM yyyy")}
                                    </p>
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center bg-muted/20 rounded-lg border">
                    <FileText className="h-12 w-12 text-muted-foreground mb-3" />
                    <h3 className="text-lg font-medium">No Plan Selected</h3>
                    <p className="text-sm text-muted-foreground max-w-md mt-1">
                      Select an X-Ray plan from above to view and edit its details
                    </p>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* New Plan Tab */}
          <TabsContent value="new" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Create New X-Ray Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="teeth">
                  <TabsList className="mb-4">
                    <TabsTrigger value="teeth">Select Teeth</TabsTrigger>
                    <TabsTrigger value="details">Plan Details</TabsTrigger>
                  </TabsList>

                  <TabsContent value="teeth">
                    <div className="space-y-4">
                      <div className="border rounded-lg p-4 overflow-x-auto">
                        <div className="min-width-full w-full max-w-[800px] mx-auto">
                          {patient.medicalDetails[0]?.patientType === "Child" ? (
                            <ChildDentalChart
                              selectedTeeth={selectedTeethMap}
                              onToothSelect={handleToothSelect}
                              readOnly={false}
                            />
                          ) : (
                            <DentalChart
                              selectedTeeth={selectedTeethMap}
                              onToothSelect={handleToothSelect}
                              readOnly={false}
                            />
                          )}
                        </div>
                      </div>

                      <div className="mb-3">
                        <h3 className="text-lg font-medium flex items-center gap-2">
                          Selected Teeth 
                          <Badge variant="outline" className="ml-2">
                            {Object.keys(selectedTeethMap).length} selected
                          </Badge>
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Click on teeth in the chart to select them for X-Ray
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(selectedTeethMap).map(([number, toothData]) => (
                          <DailyTreatmentManager
                            key={number}
                            toothNumber={number}
                            toothData={{
                              ...toothData,
                              _id: toothData._id || number,
                              treatmentId: newTreatmentPlan._id || 'new_plan'
                            }}
                            doctors={doctors}
                            onAddTreatment={handleDailyTreatmentAdd}
                            patientId={patient._id}
                            medicalDetailId={patient.medicalDetails[0]?._id || ""}
                          />
                        ))}
                      </div>

                      {Object.keys(selectedTeethMap).length === 0 && (
                        <div className="text-center py-8 border border-dashed rounded-lg">
                          <FileText className="h-8 w-8 mx-auto text-muted-foreground" />
                          <p className="mt-2 text-muted-foreground">
                            No teeth selected. Click on teeth in the dental chart above.
                          </p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="details">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Treatment Date</Label>
                        <Input
                          type="date"
                          value={newTreatmentPlan.treatmentDate}
                          onChange={(e) => handleTreatmentChange("treatmentDate", e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Doctor</Label>
                        <Select
                          value={newTreatmentPlan.treatedByDoctor}
                          onValueChange={(value) => handleTreatmentChange("treatedByDoctor", value)}
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
                        <Label>X-Ray Type/Details</Label>
                        <Input
                          value={newTreatmentPlan.treatmentDetails}
                          onChange={(e) => handleTreatmentChange("treatmentDetails", e.target.value)}
                          placeholder="X-Ray Plan"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Clinical Findings</Label>
                        <Select
                          value={newTreatmentPlan.clinicalFindings[0] || ""}
                          onValueChange={(value) =>
                            handleTreatmentChange(
                              "clinicalFindings",
                              newTreatmentPlan.clinicalFindings.includes(value)
                                ? newTreatmentPlan.clinicalFindings.filter((v) => v !== value)
                                : [...newTreatmentPlan.clinicalFindings, value]
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select findings" />
                          </SelectTrigger>
                          <SelectContent>
                            {[
                              "Caries",
                              "Decayed",
                              "Missing",
                              "Crowding",
                              "Impaction",
                              "Pericoronitis",
                              "Food Lodgment",
                            ].map((finding) => (
                              <SelectItem key={finding} value={finding}>
                                {finding}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2 col-span-2">
                        <Label>Treatment Findings</Label>
                        <Textarea
                          value={newTreatmentPlan.treatmentFindings}
                          onChange={(e) => handleTreatmentChange("treatmentFindings", e.target.value)}
                          placeholder="Enter X-Ray findings here"
                          className="min-h-[100px]"
                        />
                      </div>

                      <div className="space-y-2 col-span-2">
                        <Label>Other Notes</Label>
                        <Textarea
                          value={newTreatmentPlan.otherFindings}
                          onChange={(e) => handleTreatmentChange("otherFindings", e.target.value)}
                          placeholder="Any additional notes"
                          className="min-h-[100px]"
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Document Upload Dialog */}
        <Dialog open={showFileUpload} onOpenChange={setShowFileUpload}>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <TreatmentFileUpload
              patientId={patient._id}
              medicalDetailId={patient.medicalDetails[0]?._id || ""}
              treatmentId={selectedExistingPlan?._id || ""}
              onClose={() => setShowFileUpload(false)}
              onSuccess={() => {
                setShowFileUpload(false);
                setRefreshTrigger(prev => prev + 1);
              }}
            />
          </DialogContent>
        </Dialog>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          {activeTab === "new" ? (
            <Button onClick={handleSubmitNewPlan} disabled={isSubmitting || Object.keys(selectedTeethMap).length === 0}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Save X-Ray Plan
                </>
              )}
            </Button>
          ) : selectedExistingPlan ? (
            <Button onClick={handleUpdateExistingPlan} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddXRayPlanModal; 