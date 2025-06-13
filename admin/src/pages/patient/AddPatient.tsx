import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "react-toastify";
import { crudRequest } from "@/lib/api";
import { format } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import DentalChart from "@/components/DentalChart";
import SelectedTeethList from "@/components/SelectedTeethList";
import { getToothPosition, getToothSide } from "@/helper/PatientHelper";
import {
  FormData,
  ToothData,
  ClinicalFinding,
  DailyTreatment,
} from "@/types/patient";
import ChildDentalChart from "@/components/ChildDentalChart";
import { useDoctorContext } from "@/contexts/DoctorContext";
import { Checkbox } from "@/components/ui/checkbox";

type AddPatientProps = {
  modalClose: () => void;
};

const AddPatient: React.FC<AddPatientProps> = ({ modalClose }) => {
  const { doctors } = useDoctorContext();
  const [activeTab, setActiveTab] = useState("personal");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    personalDetails: {
      name: "",
      contactNumber: "",
      gender: "Male",
      sn: "",
      address: "",
      age: "",
      emailAddress: "",
      referredBy: "",
      createdAt: new Date().toISOString(),
      checkUpDate: format(new Date(), "yyyy-MM-dd"),
    },
    medicalDetails: {
      chiefComplaint: "",
      diagnosis: "",
      investigation: {
        blood: "",
        xray: "",
      },
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
    },
    treatmentPlans: [
      {
        patientType: "Adult",
        advancedAmount: "",
        balanceAmount: "",
        treatmentDate: format(new Date(), "yyyy-MM-dd"),
        treatmentDetails: "",
        treatmentAmount: "",
        treatedByDoctor: "",
        treatmentFindings: "",
        teethNumber: "",
        clinicalFindings: [],
        otherFindings: "",
        followUpDate: "",
      },
    ],
  });
  const [selectedTeethMaps, setSelectedTeethMaps] = useState<{
    [planIndex: number]: { [key: string]: ToothData };
  }>({});

  // Add this state
  const [isLoadingSN, setIsLoadingSN] = useState(true);

  // Add this function to fetch the next S.N
  type NextSerialNumberResponse = {
    nextSerialNumber: string;
  };

  // Update the fetch function
  const fetchNextSerialNumber = async () => {
    setIsLoadingSN(true);
    try {
      const response: NextSerialNumberResponse = await crudRequest(
        "GET",
        "/patient/next-serial-number"
      );
      if (response && response.nextSerialNumber) {
        // Set the S.N in the form data
        handlePersonalChange("sn", response.nextSerialNumber);
      }
    } catch (error) {
      console.error("Failed to fetch next serial number:", error);
      // Set a placeholder if the API call fails
      handlePersonalChange("sn", "AUTO");
    } finally {
      setIsLoadingSN(false);
    }
  };

  // Call this function when the component mounts
  useEffect(() => {
    fetchNextSerialNumber();
  }, []);

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

  const handleChiefComplaintChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      medicalDetails: {
        ...prev.medicalDetails,
        chiefComplaint: value,
      },
    }));
  };

  const handleDailyTreatmentAdd = (
    planIndex: number,
    toothNumber: string,
    treatment: DailyTreatment
  ) => {
    setSelectedTeethMaps((prev) => {
      const currentTooth = prev[planIndex]?.[toothNumber] || {
        number: toothNumber,
        details: "",
        dailyTreatments: [],
      };

      const updatedDailyTreatments = [...(currentTooth.dailyTreatments || [])];

      const existingTreatmentIndex = updatedDailyTreatments.findIndex(
        (t) => t.date === treatment.date
      );

      if (existingTreatmentIndex >= 0) {
        updatedDailyTreatments[existingTreatmentIndex] = treatment;
      } else {
        updatedDailyTreatments.push(treatment);
      }

      const totalTreatmentAmount = updatedDailyTreatments.reduce(
        (sum, t) => sum + t.treatmentAmount,
        0
      );
      const totalPaidAmount = updatedDailyTreatments.reduce(
        (sum, t) => sum + t.paidAmount,
        0
      );
      const totalRemainingAmount = totalTreatmentAmount - totalPaidAmount;

      return {
        ...prev,
        [planIndex]: {
          ...(prev[planIndex] || {}),
          [toothNumber]: {
            ...currentTooth,
            dailyTreatments: updatedDailyTreatments,
            totalTreatmentAmount,
            totalPaidAmount,
            totalRemainingAmount,
          },
        },
      };
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

  const handlePatientTypeChange = (value: "Adult" | "Child") => {
    setFormData((prev) => ({
      ...prev,
      treatmentPlans: prev.treatmentPlans.map((plan) => ({
        ...plan,
        patientType: value,
      })),
    }));
  };

  const addTreatmentPlan = () => {
    setFormData((prev) => ({
      ...prev,
      treatmentPlans: [
        ...prev.treatmentPlans,
        {
          patientType: "Adult",
          treatmentDate: format(new Date(), "yyyy-MM-dd"),
          treatmentDetails: "",
          treatmentAmount: "",
          advancedAmount: "",
          treatedByDoctor: "",
          balanceAmount: "",
          treatmentFindings: "",
          teethNumber: "",
          clinicalFindings: [],
          otherFindings: "",
          followUpDate: "",
        },
      ],
    }));

    setTimeout(() => {
      const treatmentPlans = document.querySelectorAll(".p-2.md\\:p-4");
      const lastTreatmentPlan = treatmentPlans[treatmentPlans.length - 1];
      if (lastTreatmentPlan) {
        lastTreatmentPlan.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 100);
  };

  const removeTreatmentPlan = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      treatmentPlans: prev.treatmentPlans.filter((_, i) => i !== index),
    }));
  };

  const handleTreatmentChange = (index: number, field: string, value: any) => {
    setFormData((prev) => {
      const currentPlan = prev.treatmentPlans[index];
      let updatedPlan = { ...currentPlan };

      if (field === "treatmentAmount" || field === "advancedAmount") {
        const treatmentAmount =
          field === "treatmentAmount"
            ? parseFloat(value) || 0
            : parseFloat(currentPlan.treatmentAmount) || 0;

        let advancedAmount =
          field === "advancedAmount"
            ? parseFloat(value) || 0
            : parseFloat(currentPlan.advancedAmount) || 0;

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
        treatmentPlans: prev.treatmentPlans.map((plan, i) =>
          i === index ? updatedPlan : plan
        ),
      };
    });
  };

  const formatDataForBackend = (data: FormData) => {
    const treatmentPlansWithTeeth = data.treatmentPlans.map(
      (plan, planIndex) => {
        const selectedTeethDetails = Object.entries(
          selectedTeethMaps[planIndex] || {}
        ).map(([number, toothData]) => ({
          number,
          procedure: toothData.procedure || "",
          position: getToothPosition(number),
          side: getToothSide(number),
          dailyTreatments:
            toothData.dailyTreatments?.map((treatment) => ({
              ...treatment,
              treatedByDoctor: treatment.treatedByDoctor || null,
              date: format(new Date(treatment.date), "yyyy-MM-dd"),
              treatmentAmount: Number(treatment.treatmentAmount) || 0,
              paidAmount: Number(treatment.paidAmount) || 0,
              remainingAmount: Number(treatment.remainingAmount) || 0,
              notes: treatment.notes || "",
              procedure: toothData.procedure || "",
            })) || [],
          totalTreatmentAmount: toothData.totalTreatmentAmount || 0,
          totalPaidAmount: toothData.totalPaidAmount || 0,
          totalRemainingAmount: toothData.totalRemainingAmount || 0,
          startDate:
            toothData.dailyTreatments?.[0]?.date || new Date().toISOString(),
          isCompleted: false,
        }));

        return {
          patientType: plan.patientType,
          isCompleted: false,
          treatmentDate: format(new Date(plan.treatmentDate), "yyyy-MM-dd"),
          treatmentFindings: plan.treatmentFindings,
          teethNumber: plan.teethNumber,
          clinicalFindings: plan.clinicalFindings,
          otherFindings: plan.otherFindings,
          followUpDate: plan.followUpDate
            ? format(new Date(plan.followUpDate), "yyyy-MM-dd")
            : undefined,
          selectedTeethDetails: selectedTeethDetails,
          treatmentDocuments: [],
        };
      }
    );

    // Simply pass the personalDetails with dates formatted correctly
    const formattedPersonalDetails = {
      ...data.personalDetails,
      checkUpDate: format(
        new Date(data.personalDetails.checkUpDate),
        "yyyy-MM-dd"
      ),
      createdAt: new Date().toISOString(),
    };

    return {
      personalDetails: formattedPersonalDetails,
      medicalDetails: [
        {
          chiefComplaint: data.medicalDetails.chiefComplaint,
          diagnosis: data.medicalDetails.diagnosis,
          // Make sure to pass the investigation object correctly
          investigation: {
            blood: data.medicalDetails.investigation.blood,
            xray: data.medicalDetails.investigation.xray,
          },
          medicalHistory: data.medicalDetails.medicalHistory,
          treatmentPlanning: treatmentPlansWithTeeth,
        },
      ],
      // Email is passed along as is - no special handling
    };
  };

  const validateForm = () => {
    const errors: string[] = [];

    // Personal details validation
    const { name, gender } = formData.personalDetails;
    if (!name) errors.push("Patient name is required");
    if (!gender) errors.push("Gender is required");

    // If medical history issues isn't checked, validate some fields
    if (!formData.medicalDetails.medicalHistory.noMedicalIssues) {
      // No additional validation needed here, it's okay to leave medical history fields empty
    }

    // Validate that at least one tooth is selected if treatment plans exist
    if (formData.treatmentPlans.length > 0) {
      let hasSelectedTeeth = false;
      Object.values(selectedTeethMaps).forEach((teethMap) => {
        if (Object.keys(teethMap).length > 0) {
          hasSelectedTeeth = true;
        }
      });

      if (!hasSelectedTeeth && activeTab === "dental") {
        errors.push("Please select at least one tooth for treatment");
      }
    }

    if (errors.length > 0) {
      errors.forEach((error) => toast.error(error));
      return false;
    }

    return true;
  };

  // And update handleSubmit to use this validation:
  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      const formattedData = formatDataForBackend(formData);
      await crudRequest("POST", "/patient/add-patient", formattedData);

      toast.success("Patient added successfully");
      modalClose();
      window.location.reload();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || "Failed to add patient";
      toast.error(errorMessage);
      console.error("Error adding patient:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToothSelect = (planIndex: number, toothNumber: string) => {
    setSelectedTeethMaps((prev: any) => {
      const currentPlanTeeth = prev[planIndex] || {};

      let updatedPlanTeeth;
      if (currentPlanTeeth[toothNumber]) {
        const { [toothNumber]: _, ...rest } = currentPlanTeeth;
        updatedPlanTeeth = rest;
      } else {
        updatedPlanTeeth = {
          ...currentPlanTeeth,
          [toothNumber]: {
            number: toothNumber,
            details: "",
          },
        };
      }

      setFormData((prevForm) => ({
        ...prevForm,
        treatmentPlans: prevForm.treatmentPlans.map((plan, idx) => {
          if (idx === planIndex) {
            const selectedTeethArray = Object.entries(
              updatedPlanTeeth as { [key: string]: ToothData }
            ).map(([number, data]) => ({
              number,
              details: data.details,
              position: getToothPosition(number),
              side: getToothSide(number),
            }));

            return {
              ...plan,
              teethNumber: selectedTeethArray.map((t) => t.number).join(", "),
              selectedTeethDetails: selectedTeethArray,
            };
          }
          return plan;
        }),
      }));

      return {
        ...prev,
        [planIndex]: updatedPlanTeeth,
      };
    });
  };

  const handleToothDetailsChange = (
    planIndex: number,
    toothNumber: string,
    details: string
  ) => {
    setSelectedTeethMaps((prev) => ({
      ...prev,
      [planIndex]: {
        ...(prev[planIndex] || {}),
        [toothNumber]: {
          ...(prev[planIndex]?.[toothNumber] || {}),
          details,
        },
      },
    }));
  };

  const handleToothProcedureChange = (
    planIndex: number,
    toothNumber: string,
    procedure: string
  ) => {
    setSelectedTeethMaps((prev) => ({
      ...prev,
      [planIndex]: {
        ...(prev[planIndex] || {}),
        [toothNumber]: {
          ...(prev[planIndex]?.[toothNumber] || {}),
          procedure,
        },
      },
    }));
  };

  // Add these calculation functions

  const calculateTotalAmount = () => {
    let total = 0;

    try {
      // Sum up all treatment amounts from teeth
      Object.values(selectedTeethMaps).forEach((teethMap) => {
        Object.values(teethMap).forEach((tooth) => {
          if (tooth.dailyTreatments) {
            tooth.dailyTreatments.forEach((treatment) => {
              total += Number(treatment.treatmentAmount) || 0;
            });
          }
        });
      });
    } catch (error) {
      console.error("Error calculating total amount:", error);
    }

    return total;
  };

  const calculatePaidAmount = () => {
    let total = 0;

    try {
      // Sum up all paid amounts from teeth
      Object.values(selectedTeethMaps).forEach((teethMap) => {
        Object.values(teethMap).forEach((tooth) => {
          if (tooth.dailyTreatments) {
            tooth.dailyTreatments.forEach((treatment) => {
              total += Number(treatment.paidAmount) || 0;
            });
          }
        });
      });
    } catch (error) {
      console.error("Error calculating paid amount:", error);
    }

    return total;
  };

  return (
    <div className="mx-auto py-1 sm:py-2 space-y-1 sm:space-y-2">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-base md:text-lg lg:text-xl font-bold">
          Add New Patient
        </h1>
        <Button
          variant="outline"
          onClick={() => modalClose()}
          size="sm"
          className="text-xs md:text-sm"
        >
          Cancel
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-1 md:gap-2 h-auto">
          <TabsTrigger
            value="personal"
            className="text-xs md:text-sm py-1.5 md:py-2.5 px-1 md:px-2 data-[state=active]:font-medium h-auto flex items-center justify-center"
          >
            <span className="">Personal Details</span>
          </TabsTrigger>
          <TabsTrigger
            value="complaint"
            className="text-xs md:text-sm py-1.5 md:py-2.5 px-1 md:px-2 data-[state=active]:font-medium h-auto flex items-center justify-center"
          >
            <span className="">Chief Complaint</span>
          </TabsTrigger>
          <TabsTrigger
            value="medical"
            className="text-xs md:text-sm py-1.5 md:py-2.5 px-1 md:px-2 data-[state=active]:font-medium h-auto flex items-center justify-center"
          >
            <span className="">Medical History</span>
          </TabsTrigger>
          <TabsTrigger
            value="dental"
            className="text-xs md:text-sm py-1.5 md:py-2.5 px-1 md:px-2 data-[state=active]:font-medium h-auto flex items-center justify-center"
          >
            <span className="">Dental Treatment</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab content remains the same */}
        <TabsContent value="personal">
          <Card className="p-2 md:p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 md:gap-4">
              <div className="space-y-1">
                <Label htmlFor="checkUpDate">Check-up Date *</Label>
                <Input
                  id="checkUpDate"
                  type="date"
                  value={formData.personalDetails.checkUpDate}
                  onChange={(e) =>
                    handlePersonalChange("checkUpDate", e.target.value)
                  }
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="sn">S.N (Auto-generated)</Label>
                <Input
                  id="sn"
                  type="text"
                  value={
                    isLoadingSN ? "Loading..." : formData.personalDetails.sn
                  }
                  readOnly
                  className={`bg-muted/50 ${isLoadingSN ? "animate-pulse" : ""}`}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.personalDetails.name}
                  onChange={(e) => handlePersonalChange("name", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.personalDetails.address}
                  onChange={(e) =>
                    handlePersonalChange("address", e.target.value)
                  }
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="text"
                  value={formData.personalDetails.age}
                  onChange={(e) => handlePersonalChange("age", e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="gender">Gender *</Label>
                <Select
                  value={formData.personalDetails.gender}
                  onValueChange={(value) =>
                    handlePersonalChange("gender", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="contactNumber">Contact Number</Label>
                <Input
                  id="contactNumber"
                  value={formData.personalDetails.contactNumber}
                  onChange={(e) =>
                    handlePersonalChange("contactNumber", e.target.value)
                  }
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="emailAddress">Email Address</Label>
                <Input
                  id="emailAddress"
                  type="email"
                  value={formData.personalDetails.emailAddress}
                  onChange={(e) =>
                    handlePersonalChange("emailAddress", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={() => setActiveTab("complaint")}>
                Next: Chief Complaint
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="complaint">
          <Card className="p-2 md:p-4">
            <div className="space-y-4">
              <h3 className="text-base md:text-lg font-semibold">
                Patient's Chief Complaint
              </h3>
              <div className="space-y-2">
                <Label htmlFor="chiefComplaint">
                  What brought the patient in today?
                </Label>
                <Textarea
                  id="chiefComplaint"
                  placeholder="Enter patient's main concern or complaint"
                  className="min-h-[150px]"
                  value={formData.medicalDetails.chiefComplaint}
                  onChange={(e) => handleChiefComplaintChange(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-4 md:mt-6 flex flex-col sm:flex-row justify-end gap-2 sm:gap-4">
              <Button
                variant="outline"
                onClick={() => setActiveTab("complaint")}
                className="text-xs md:text-sm"
              >
                Back to Personal Details
              </Button>
              <Button
                onClick={() => setActiveTab("medical")}
                className="text-xs md:text-sm mt-2 sm:mt-0"
              >
                Next: Medical History
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="medical">
          <Card className="p-2 md:p-4">
            <div className="mt-3 md:mt-6 border-t pt-3 md:pt-6">
              <h3 className="text-sm md:text-base lg:text-lg font-semibold mb-2 md:mb-4">
                Medical History
              </h3>

              {/* No Medical Issues Checkbox - Make more touch-friendly */}
              <div className="col-span-2 flex items-center gap-2 p-2 md:p-3 border rounded-md bg-muted mb-3 md:mb-4">
                <Checkbox
                  id="noMedicalIssues"
                  checked={
                    formData.medicalDetails.medicalHistory.noMedicalIssues
                  }
                  onCheckedChange={(checked) => {
                    // When checked, clear all other medical history fields
                    if (checked) {
                      // Show confirmation toast
                      toast.info("All medical history fields will be cleared");

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
                  }}
                  className="h-5 w-5" // Slightly larger checkbox for easier mobile tapping
                />
                <Label
                  htmlFor="noMedicalIssues"
                  className="font-medium cursor-pointer text-sm md:text-base"
                >
                  No Medical Issues
                </Label>
              </div>

              {/* Medical Conditions Grid - Improved for mobile */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-1">
                  <Label htmlFor="bloodPressure" className="text-xs md:text-sm">
                    Blood Pressure
                  </Label>
                  <Input
                    id="bloodPressure"
                    value={formData.medicalDetails.medicalHistory.bloodPressure}
                    onChange={(e) =>
                      handleMedicalHistoryChange(
                        "bloodPressure",
                        e.target.value
                      )
                    }
                    placeholder="e.g. 120/80"
                    className="h-9 md:h-10" // Slightly smaller input height on mobile
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="allergies" className="text-xs md:text-sm">
                    Allergies
                  </Label>
                  <Input
                    id="allergies"
                    value={formData.medicalDetails.medicalHistory.allergies}
                    onChange={(e) =>
                      handleMedicalHistoryChange("allergies", e.target.value)
                    }
                    placeholder="List any allergies"
                    className="h-9 md:h-10"
                  />
                </div>

                {/* Medical conditions checkboxes - Make more mobile-friendly */}
                <div className="col-span-1 md:col-span-2">
                  <Label className="text-xs md:text-sm block mb-2">
                    Medical Conditions
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 md:gap-y-3 gap-x-1 md:gap-x-4 p-2 border rounded-md bg-background">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="diabetes"
                        checked={
                          formData.medicalDetails.medicalHistory.diabetes
                        }
                        onCheckedChange={(checked) =>
                          handleMedicalHistoryChange("diabetes", checked)
                        }
                        className="h-4 w-4 md:h-5 md:w-5"
                      />
                      <Label
                        htmlFor="diabetes"
                        className="text-xs md:text-sm cursor-pointer"
                      >
                        Diabetes
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="thyroid"
                        checked={formData.medicalDetails.medicalHistory.thyroid}
                        onCheckedChange={(checked) =>
                          handleMedicalHistoryChange("thyroid", checked)
                        }
                        className="h-4 w-4 md:h-5 md:w-5"
                      />
                      <Label
                        htmlFor="thyroid"
                        className="text-xs md:text-sm cursor-pointer"
                      >
                        Thyroid
                      </Label>
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
                        className="h-4 w-4 md:h-5 md:w-5"
                      />
                      <Label
                        htmlFor="bleedingDisorder"
                        className="text-xs md:text-sm cursor-pointer"
                      >
                        Bleeding
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
                        className="h-4 w-4 md:h-5 md:w-5"
                      />
                      <Label
                        htmlFor="pregnancy"
                        className="text-xs md:text-sm cursor-pointer"
                      >
                        Pregnancy
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="asthma"
                        checked={formData.medicalDetails.medicalHistory.asthma}
                        onCheckedChange={(checked) =>
                          handleMedicalHistoryChange("asthma", checked)
                        }
                        className="h-4 w-4 md:h-5 md:w-5"
                      />
                      <Label
                        htmlFor="asthma"
                        className="text-xs md:text-sm cursor-pointer"
                      >
                        Asthma
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Other conditions - Full width on all screens */}
                <div className="col-span-1 md:col-span-2 mt-2">
                  <Label
                    htmlFor="otherConditions"
                    className="text-xs md:text-sm"
                  >
                    Other Medical Conditions
                  </Label>
                  <Textarea
                    id="otherConditions"
                    value={
                      formData.medicalDetails.medicalHistory.otherConditions
                    }
                    onChange={(e) =>
                      handleMedicalHistoryChange(
                        "otherConditions",
                        e.target.value
                      )
                    }
                    placeholder="Describe any other medical conditions"
                    className="min-h-[80px] md:min-h-[120px]" // Shorter on mobile
                  />
                </div>
              </div>
            </div>

            {/* Navigation buttons - Stack on mobile */}
            <div className="mt-4 md:mt-6 flex flex-col sm:flex-row justify-end gap-2 sm:gap-4">
              <Button
                variant="outline"
                onClick={() => setActiveTab("complaint")}
                className="w-full sm:w-auto text-xs md:text-sm py-2"
              >
                Back to Chief Complaint
              </Button>
              <Button
                onClick={() => setActiveTab("dental")}
                className="w-full sm:w-auto text-xs md:text-sm py-2 mt-2 sm:mt-0"
              >
                Next: Dental Treatment
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="dental">
          <Card className="p-2 md:p-4">
            <div className="space-y-2 md:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
                <div className="space-y-1">
                  <Label htmlFor="patientType">Patient Type *</Label>
                  <Select
                    value={formData.treatmentPlans[0].patientType}
                    onValueChange={handlePatientTypeChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select patient type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Child">Child</SelectItem>
                      <SelectItem value="Adult">Adult</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bloodInvestigation">
                    Blood Investigation Details
                  </Label>
                  <Textarea
                    id="bloodInvestigation"
                    value={formData.medicalDetails.investigation.blood}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        medicalDetails: {
                          ...prev.medicalDetails,
                          investigation: {
                            ...prev.medicalDetails.investigation,
                            blood: e.target.value,
                          },
                        },
                      }))
                    }
                    placeholder="Enter blood investigation results and details"
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="xrayInvestigation">
                    X-Ray Investigation Notes
                  </Label>
                  <Textarea
                    id="xrayInvestigation"
                    value={formData.medicalDetails.investigation.xray}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        medicalDetails: {
                          ...prev.medicalDetails,
                          investigation: {
                            ...prev.medicalDetails.investigation,
                            xray: e.target.value,
                          },
                        },
                      }))
                    }
                    placeholder="Enter x-ray findings and observations"
                    className="min-h-[100px]"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center">
                <h3 className="text-base md:text-lg font-semibold text-primary">
                  X-Ray Plan
                </h3>
                <Button onClick={addTreatmentPlan} size={"sm"}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add X-Ray Plan
                </Button>
              </div>

              {formData.treatmentPlans.map((plan, index: number) => (
                <Card
                  key={index}
                  className="p-2 md:p-3 border border-foreground/50"
                >
                  <div className="space-y-2 md:space-y-3">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-primary">
                        X-Ray Plan {index + 1}
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTreatmentPlan(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="space-y-1">
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        <div className="border rounded-lg p-1 sm:p-2 bg-background col-span-3 overflow-x-auto">
                          <h5 className="text-xs sm:text-sm md:text-base font-medium mb-1 md:mb-2">
                            Selected Teeth
                          </h5>
                          <div className="min-w-[280px]">
                            {" "}
                            {/* Ensures minimum width for chart */}
                            {plan.patientType === "Adult" ? (
                              <DentalChart
                                selectedTeeth={selectedTeethMaps[index] || {}}
                                onToothSelect={(toothNumber) =>
                                  handleToothSelect(index, toothNumber)
                                }
                              />
                            ) : (
                              <ChildDentalChart
                                selectedTeeth={selectedTeethMaps[index] || {}}
                                onToothSelect={(toothNumber) =>
                                  handleToothSelect(index, toothNumber)
                                }
                              />
                            )}
                          </div>
                          <div className="mt-2 md:mt-4 overflow-x-auto">
                            <SelectedTeethList
                              selectedTeeth={selectedTeethMaps[index] || {}}
                              onDetailsChange={(toothNumber, details) =>
                                handleToothDetailsChange(
                                  index,
                                  toothNumber,
                                  details
                                )
                              }
                              onProcedureChange={(toothNumber, procedure) =>
                                handleToothProcedureChange(
                                  index,
                                  toothNumber,
                                  procedure
                                )
                              }
                              onDailyTreatmentAdd={(toothNumber, treatment) =>
                                handleDailyTreatmentAdd(
                                  index,
                                  toothNumber,
                                  treatment
                                )
                              }
                              doctors={doctors}
                            />
                          </div>
                        </div>

                        <div className="space-y-1 col-span-3 md:col-span-1">
                          <Label>Treatment Date</Label>
                          <Input
                            type="date"
                            value={plan.treatmentDate}
                            onChange={(e) =>
                              handleTreatmentChange(
                                index,
                                "treatmentDate",
                                e.target.value
                              )
                            }
                          />
                        </div>

                        <div className="space-y-1 col-span-3 md:col-span-1">
                          <Label>Selected Teeth</Label>
                          <Input value={plan.teethNumber} readOnly />
                        </div>

                        <div className="space-y-1 col-span-3 md:col-span-1">
                          <Label>Clinical Findings</Label>
                          <Select
                            value={plan.clinicalFindings[0] || ""}
                            onValueChange={(value: ClinicalFinding) =>
                              handleTreatmentChange(
                                index,
                                "clinicalFindings",
                                plan.clinicalFindings.includes(value)
                                  ? plan.clinicalFindings.filter(
                                      (v) => v !== value
                                    )
                                  : [...plan.clinicalFindings, value]
                              )
                            }
                          >
                            <SelectTrigger className="h-9 md:h-10 text-xs md:text-sm">
                              <SelectValue placeholder="Select findings" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px]">
                              {/* SelectItems with enhanced mobile styling */}
                              <div className="max-h-[40vh] overflow-y-auto">
                                <SelectItem
                                  value="Caries"
                                  className="text-xs md:text-sm py-1.5 md:py-2"
                                >
                                  Caries
                                </SelectItem>
                                <SelectItem
                                  value="Decayed"
                                  className="text-xs md:text-sm py-1.5 md:py-2"
                                >
                                  Decayed
                                </SelectItem>
                                <SelectItem
                                  value="Missing"
                                  className="text-xs md:text-sm py-1.5 md:py-2"
                                >
                                  Missing
                                </SelectItem>
                                <SelectItem
                                  value="Crowding"
                                  className="text-xs md:text-sm py-1.5 md:py-2"
                                >
                                  Crowding
                                </SelectItem>
                                <SelectItem
                                  value="Swelling"
                                  className="text-xs md:text-sm py-1.5 md:py-2"
                                >
                                  Swelling
                                </SelectItem>
                                <SelectItem
                                  value="Gingival Enlargement"
                                  className="text-xs md:text-sm py-1.5 md:py-2"
                                >
                                  Gingival Enlargement
                                </SelectItem>
                                <SelectItem
                                  value="Bleeding"
                                  className="text-xs md:text-sm py-1.5 md:py-2"
                                >
                                  Bleeding
                                </SelectItem>
                                <SelectItem
                                  value="Bad Breathing"
                                  className="text-xs md:text-sm py-1.5 md:py-2"
                                >
                                  Bad Breathing
                                </SelectItem>
                                <SelectItem
                                  value="Impaction"
                                  className="text-xs md:text-sm py-1.5 md:py-2"
                                >
                                  Impaction
                                </SelectItem>
                                <SelectItem
                                  value="Pericoronitis"
                                  className="text-xs md:text-sm py-1.5 md:py-2"
                                >
                                  Pericoronitis
                                </SelectItem>
                                <SelectItem
                                  value="Food Lodgment"
                                  className="text-xs md:text-sm py-1.5 md:py-2"
                                >
                                  Food Lodgment
                                </SelectItem>
                                <SelectItem
                                  value="Attrition"
                                  className="text-xs md:text-sm py-1.5 md:py-2"
                                >
                                  Attrition
                                </SelectItem>
                                <SelectItem
                                  value="Abrasion"
                                  className="text-xs md:text-sm py-1.5 md:py-2"
                                >
                                  Abrasion
                                </SelectItem>
                              </div>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1 col-span-3 md:col-span-1">
                          <Label>Treatment Procedure</Label>
                          <Textarea
                            value={plan.treatmentFindings}
                            onChange={(e) =>
                              handleTreatmentChange(
                                index,
                                "treatmentFindings",
                                e.target.value
                              )
                            }
                          />
                        </div>

                        <div className="space-y-1 col-span-3 md:col-span-1">
                          <Label>Other Findings</Label>
                          <Textarea
                            value={plan.otherFindings}
                            onChange={(e) =>
                              handleTreatmentChange(
                                index,
                                "otherFindings",
                                e.target.value
                              )
                            }
                            placeholder="Enter any other clinical findings not listed above"
                          />
                        </div>

                        <div className="space-y-1 col-span-3 md:col-span-1">
                          <Label>Follow-up Date</Label>
                          <Input
                            type="date"
                            value={plan.followUpDate}
                            onChange={(e) =>
                              handleTreatmentChange(
                                index,
                                "followUpDate",
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}

              {/* Diagnosis - Moved to the end */}
              <div className="mt-6">
                <div className="space-y-2">
                  <Label htmlFor="diagnosis">Final Advice</Label>
                  <Textarea
                    id="diagnosis"
                    value={formData.medicalDetails.diagnosis}
                    onChange={(e) =>
                      handleMedicalChange("diagnosis", e.target.value)
                    }
                    placeholder="Enter final advice based on all examinations and investigations"
                    className="min-h-[150px]"
                  />
                </div>
              </div>

              {/* Treatment Summary */}
              <div className="mt-4 md:mt-6 p-2 md:p-4 border rounded-lg bg-muted/10">
                <h3 className="text-sm md:text-base lg:text-lg font-semibold mb-2 md:mb-4">
                  Treatment Summary
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
                  <div className="p-3 border rounded-md">
                    <p className="text-sm text-muted-foreground">
                      Total Treatment Amount
                    </p>
                    <p className="text-lg font-semibold">
                      ₹{calculateTotalAmount()}
                    </p>
                  </div>

                  <div className="p-3 border rounded-md">
                    <p className="text-sm text-muted-foreground">
                      Total Paid Amount
                    </p>
                    <p className="text-lg font-semibold">
                      ₹{calculatePaidAmount()}
                    </p>
                  </div>

                  <div className="p-3 border rounded-md">
                    <p className="text-sm text-muted-foreground">
                      Total Remaining Amount
                    </p>
                    <p className="text-lg font-semibold text-primary">
                      ₹{calculateTotalAmount() - calculatePaidAmount()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <Button
                  variant="outline"
                  onClick={() => setActiveTab("medical")}
                >
                  Back to Medical Details
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? "Adding Patient..." : "Add Patient"}
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AddPatient;
