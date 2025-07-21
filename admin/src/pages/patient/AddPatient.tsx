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
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "react-toastify";
import { crudRequest } from "@/lib/api";
import { format } from "date-fns";
import { Plus, Trash2, ChevronRight, ChevronLeft, CheckCircle, AlertCircle, User, FileText, Heart, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import DentalChart from "@/components/DentalChart";
import SelectedTeethList from "@/components/SelectedTeethList";
import { getToothPosition, getToothSide } from "@/helper/PatientHelper";
import { convertToNepaliDate, convertToEnglishDate } from "@/lib/utils";
import {
  FormData,
  ToothData,
  ClinicalFinding,
  DailyTreatment,
} from "@/types/patient";
import { ServiceType, PaymentMethod } from "@/types/finance";
import ChildDentalChart from "@/components/ChildDentalChart";
import { useDoctorContext } from "@/contexts/DoctorContext";
import { useVoiceInput } from "@/contexts/VoiceInputContext";
import { Checkbox } from "@/components/ui/checkbox";
import { NepaliDatePickerComponent } from "@/components/ui/nepali-date-picker";
import VoiceInputButton from "@/components/shared/VoiceInputButton";
import { v4 as uuidv4 } from "uuid";

type AddPatientProps = {
  modalClose: () => void;
};

const AddPatient: React.FC<AddPatientProps> = ({ modalClose }) => {
  const { doctors } = useDoctorContext();
  const { isVoiceInputEnabled } = useVoiceInput();
  const [activeTab, setActiveTab] = useState("personal");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const steps = [
    { id: 'personal', label: 'Personal Info', icon: User, tab: 'personal' },
    { id: 'complaint', label: 'Chief Complaint', icon: FileText, tab: 'complaint' },
    { id: 'medical', label: 'Medical History', icon: Heart, tab: 'medical' },
    { id: 'dental', label: 'Dental Treatment', icon: Activity, tab: 'dental' }
  ];

  const getStepProgress = () => {
    return ((currentStep + 1) / steps.length) * 100;
  };
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
      checkUpDateNp: convertToNepaliDate(format(new Date(), "yyyy-MM-dd")),
    },
    medicalDetails: {
      chiefComplaint: "",
      diagnosis: "",
      investigation: {
        blood: "",
        xray: "",
      },
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
    treatmentPlans: [
      {
        patientType: "Adult",
        advancedAmount: "",
        balanceAmount: "",
        treatmentDate: format(new Date(), "yyyy-MM-dd"),
        treatmentDateNp: convertToNepaliDate(format(new Date(), "yyyy-MM-dd")),
        treatmentDetails: "",
        treatmentAmount: "",
        treatedByDoctor: "",
        treatmentFindings: "",
        teethNumber: "",
        clinicalFindings: [],
        otherFindings: "",
        followUpDate: "",
        followUpDateNp: "",
        completionDate: "",
        completionDateNp: "",
      },
    ],
  });

  // Add state for service payment
  const [includeServicePayment, setIncludeServicePayment] = useState(false);

  const validateCurrentStep = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    
    switch (currentStep) {
      case 0: // Personal Info
        if (!formData.personalDetails.name.trim()) {
          newErrors.name = "Patient name is required";
        }
        if (!formData.personalDetails.gender) {
          newErrors.gender = "Gender is required";
        }
        break;
      case 1: // Chief Complaint - Optional validation
        break;
      case 2: // Medical History - Optional validation
        break;
      case 3: // Dental Treatment - Optional validation
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep]);
      }
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
        setActiveTab(steps[currentStep + 1].tab);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setActiveTab(steps[currentStep - 1].tab);
    }
  };

  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
    setActiveTab(steps[stepIndex].tab);
  };
  const [servicePayment, setServicePayment] = useState({
    serviceType: "Consultation" as ServiceType,
    amount: "",
    description: "",
    paymentMethod: "Cash" as PaymentMethod,
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

  // Update the handlePersonalChange function
  const handlePersonalChange = (field: string, value: any) => {
    setFormData((prev) => {
      const newData = {
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

  // Add handler for service payment changes
  const handleServicePaymentChange = (field: string, value: any) => {
    setServicePayment((prev) => ({
      ...prev,
      [field]: value,
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

  const removeTreatmentPlan = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      treatmentPlans: prev.treatmentPlans.filter((_, i) => i !== index),
    }));
  };

  // Update the handleTreatmentPlanChange function
  const handleTreatmentPlanChange = (
    index: number,
    field: string,
    value: any
  ) => {
    setFormData((prev) => {
      const newTreatmentPlans = [...prev.treatmentPlans];
      newTreatmentPlans[index] = {
        ...newTreatmentPlans[index],
        [field]: value,
      };

      // Auto-convert dates
      if (field === "treatmentDate") {
        newTreatmentPlans[index].treatmentDateNp = convertToNepaliDate(value);
      } else if (field === "treatmentDateNp") {
        const englishDate = convertToEnglishDate(value);
        newTreatmentPlans[index].treatmentDate = englishDate;
      } else if (field === "followUpDate") {
        newTreatmentPlans[index].followUpDateNp = convertToNepaliDate(value);
      } else if (field === "followUpDateNp") {
        const englishDate = convertToEnglishDate(value);
        newTreatmentPlans[index].followUpDate = englishDate;
      } else if (field === "completionDate") {
        newTreatmentPlans[index].completionDateNp = convertToNepaliDate(value);
      } else if (field === "completionDateNp") {
        const englishDate = convertToEnglishDate(value);
        newTreatmentPlans[index].completionDate = englishDate;
      }

      return {
        ...prev,
        treatmentPlans: newTreatmentPlans,
      };
    });
  };

  // Add state for group treatment details
  const [groupTreatmentDetails, setGroupTreatmentDetails] = useState<
    GroupTreatmentDetail[]
  >([
    {
      id: uuidv4(),
      procedure: "",
      totalTreatmentAmount: "",
      totalPaidAmount: "",
      totalRemainingAmount: "0",
      startDate: format(new Date(), "yyyy-MM-dd"),
      followUpDate: "",
      completionDate: "",
      treatedByDoctor: "",
      isCompleted: false,
      dailyTreatments: [],
    },
  ]);

  // Function to add a new daily treatment to a group treatment
  const addDailyTreatment = (groupTreatmentId: string) => {
    setGroupTreatmentDetails((prev) =>
      prev.map((gt) => {
        if (gt.id === groupTreatmentId) {
          // Prefill from group treatment if values exist, else empty string/0
          const treatmentAmount = gt.totalTreatmentAmount !== undefined && gt.totalTreatmentAmount !== "" ? gt.totalTreatmentAmount : "";
          const paidAmount = gt.totalPaidAmount !== undefined && gt.totalPaidAmount !== "" ? gt.totalPaidAmount : "";
          const remainingAmount = gt.totalRemainingAmount !== undefined && gt.totalRemainingAmount !== "" ? gt.totalRemainingAmount : "0";
          return {
            ...gt,
            dailyTreatments: [
              ...gt.dailyTreatments,
              {
                id: uuidv4(),
                date: format(new Date(), "yyyy-MM-dd"),
                procedure: gt.procedure || "", // Inherit procedure from group treatment
                treatmentAmount,
                paidAmount,
                remainingAmount,
                paymentDate: format(new Date(), "yyyy-MM-dd"), // Default to today's date
                notes: "",
                treatedByDoctor: gt.treatedByDoctor || "",
                isCompleted: false,
              },
            ],
          };
        }
        return gt;
      })
    );
  };

  // Function to remove a daily treatment from a group treatment
  const removeDailyTreatment = (groupTreatmentId: string, dailyTreatmentId: string) => {
    setGroupTreatmentDetails((prev) =>
      prev.map((gt) =>
        gt.id === groupTreatmentId
          ? {
              ...gt,
              dailyTreatments: gt.dailyTreatments.filter(
                (dt) => dt.id !== dailyTreatmentId
              ),
            }
          : gt
      )
    );

    // Recalculate totals after removing daily treatment
    setTimeout(() => calculateGroupTreatmentTotals(groupTreatmentId), 0);
  };

  // Function to update a daily treatment in a group treatment
  const updateDailyTreatment = (
    groupTreatmentId: string,
    dailyTreatmentId: string,
    field: keyof GroupDailyTreatment,
    value: any
  ) => {
    setGroupTreatmentDetails((prev) =>
      prev.map((gt) =>
        gt.id === groupTreatmentId
          ? {
              ...gt,
              dailyTreatments: gt.dailyTreatments.map((dt) =>
                dt.id === dailyTreatmentId
                  ? {
                      ...dt,
                      [field]: value,
                      // Auto-calculate remaining amount when treatment amount or paid amount changes
                      ...(field === "treatmentAmount" || field === "paidAmount"
                        ? {
                            remainingAmount: (
                              parseFloat(
                                field === "treatmentAmount" ? (value || "0") : (dt.treatmentAmount || "0")
                              ) -
                              parseFloat(field === "paidAmount" ? (value || "0") : (dt.paidAmount || "0"))
                            ).toString()
                          }
                        : {}),
                    }
                  : dt
              ),
            }
          : gt
      )
    );

    // Calculate group totals after updating daily treatment (only if the change affects amounts)
    if (field === "treatmentAmount" || field === "paidAmount") {
      setTimeout(() => calculateGroupTreatmentTotals(groupTreatmentId), 0);
    }
  };

  // Function to update a group treatment detail
  const updateGroupTreatment = (
    groupTreatmentId: string,
    field: keyof GroupTreatmentDetail,
    value: any
  ) => {
    setGroupTreatmentDetails((prev) =>
      prev.map((gt) => {
        if (gt.id === groupTreatmentId) {
          return {
            ...gt,
            [field]: value,
            // Auto-calculate remaining amount when total treatment amount or total paid amount changes
            ...(field === "totalTreatmentAmount" || field === "totalPaidAmount"
              ? {
                  totalRemainingAmount: (
                    parseFloat(
                      field === "totalTreatmentAmount" ? value : gt.totalTreatmentAmount || "0"
                    ) -
                    parseFloat(field === "totalPaidAmount" ? value : gt.totalPaidAmount || "0")
                  ).toString()
                }
              : {}),
          };
        }
        return gt;
      })
    );
  };

  // Function to calculate totals for a group treatment based on daily treatments
  const calculateGroupTreatmentTotals = (groupTreatmentId: string) => {
    setGroupTreatmentDetails((prev) => {
      const updatedDetails = [...prev];
      const groupIndex = updatedDetails.findIndex(
        (gt) => gt.id === groupTreatmentId
      );

      if (groupIndex !== -1) {
        const group = updatedDetails[groupIndex];
        const dailyTreatments = group.dailyTreatments || [];

        // Only recalculate totals if there are daily treatments
        if (dailyTreatments.length > 0) {
          // Calculate total treatment amount and total paid amount from daily treatments
          let totalTreatmentAmount = 0;
          let totalPaidAmount = 0;

          dailyTreatments.forEach((dt) => {
            totalTreatmentAmount += parseFloat(dt.treatmentAmount) || 0;
            totalPaidAmount += parseFloat(dt.paidAmount) || 0;
          });

          // Calculate remaining amount
          const totalRemainingAmount = totalTreatmentAmount - totalPaidAmount;

          // Update the group treatment with calculated totals
          updatedDetails[groupIndex] = {
            ...group,
            totalTreatmentAmount: totalTreatmentAmount.toString(),
            totalPaidAmount: totalPaidAmount.toString(),
            totalRemainingAmount: totalRemainingAmount.toString(),
            // Check if treatment is completed
            isCompleted: dailyTreatments.length > 0 && dailyTreatments.every(dt => dt.isCompleted),
          };
        }
        // If no daily treatments, preserve the manually entered totals and just recalculate remaining amount
        else {
          const totalTreatmentAmount = parseFloat(group.totalTreatmentAmount) || 0;
          const totalPaidAmount = parseFloat(group.totalPaidAmount) || 0;
          const totalRemainingAmount = totalTreatmentAmount - totalPaidAmount;

          updatedDetails[groupIndex] = {
            ...group,
            totalRemainingAmount: totalRemainingAmount.toString(),
          };
        }
      }

      return updatedDetails;
    });
  };

  // Function to add a new group treatment
  const addGroupTreatment = () => {
    setGroupTreatmentDetails((prev) => [
      ...prev,
      {
        id: uuidv4(),
        procedure: "",
        totalTreatmentAmount: "",
        totalPaidAmount: "",
        totalRemainingAmount: "0",
        startDate: format(new Date(), "yyyy-MM-dd"),
        followUpDate: "",
        completionDate: "",
        treatedByDoctor: "",
        isCompleted: false,
        dailyTreatments: [],
      },
    ]);
  };

  // Function to remove a group treatment
  const removeGroupTreatment = (groupTreatmentId: string) => {
    setGroupTreatmentDetails((prev) =>
      prev.filter((gt) => gt.id !== groupTreatmentId)
    );
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
              paymentDate: treatment.paymentDate 
                ? format(new Date(treatment.paymentDate), "yyyy-MM-dd") 
                : null,
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

        // Format group treatment details for backend
        const formattedGroupTreatmentDetails = groupTreatmentDetails
          .filter(groupTreatment => 
            // Only include group treatments that have some meaningful data
            groupTreatment.procedure || 
            Number(groupTreatment.totalTreatmentAmount) > 0 || 
            Number(groupTreatment.totalPaidAmount) > 0 ||
            groupTreatment.dailyTreatments.length > 0
          )
          .map(groupTreatment => {
            // Process daily treatments
            const formattedDailyTreatments = groupTreatment.dailyTreatments
              .filter(dt => 
                // Only include daily treatments with meaningful data
                dt.procedure || 
                Number(dt.treatmentAmount) > 0 || 
                Number(dt.paidAmount) > 0 ||
                dt.notes
              )
              .map(treatment => ({
                date: format(new Date(treatment.date), "yyyy-MM-dd"),
                treatmentAmount: Number(treatment.treatmentAmount) || 0,
                paidAmount: Number(treatment.paidAmount) || 0,
                remainingAmount: Number(treatment.remainingAmount) || 0,
                paymentDate: treatment.paymentDate 
                  ? format(new Date(treatment.paymentDate), "yyyy-MM-dd") 
                  : null,
                procedure: treatment.procedure || groupTreatment.procedure || "",
                notes: treatment.notes || "",
                treatedByDoctor: treatment.treatedByDoctor || null,
                isCompleted: treatment.isCompleted || false
              }));

            return {
              groupName: data.medicalDetails.group || "General",
              procedure: groupTreatment.procedure || "",
              totalTreatmentAmount: Number(groupTreatment.totalTreatmentAmount) || 0,
              totalPaidAmount: Number(groupTreatment.totalPaidAmount) || 0,
              totalRemainingAmount: Number(groupTreatment.totalRemainingAmount) || 0,
              startDate: groupTreatment.startDate ? format(new Date(groupTreatment.startDate), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
              followUpDate: groupTreatment.followUpDate ? format(new Date(groupTreatment.followUpDate), "yyyy-MM-dd") : undefined,
              completionDate: groupTreatment.completionDate ? format(new Date(groupTreatment.completionDate), "yyyy-MM-dd") : undefined,
              treatedByDoctor: groupTreatment.treatedByDoctor || null,
              isCompleted: groupTreatment.isCompleted || false,
              dailyTreatments: formattedDailyTreatments
            };
          });

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
          // Include group treatment details for all groups, not just Ortho
          groupTreatmentDetails: formattedGroupTreatmentDetails,
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
          group: data.medicalDetails.group,
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
    // if (formData.treatmentPlans.length > 0) {
    //   let hasSelectedTeeth = false;
    //   Object.values(selectedTeethMaps).forEach((teethMap) => {
    //     if (Object.keys(teethMap).length > 0) {
    //       hasSelectedTeeth = true;
    //     }
    //   });

    //   if (!hasSelectedTeeth && activeTab === "dental") {
    //     errors.push("Please select at least one tooth for treatment");
    //   }
    // }

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
      const response = await crudRequest<{
        data?: { _id: string };
        _id?: string;
      }>("POST", "/patient/add-patient", formattedData);

      toast.success("Patient added successfully");

      if (
        includeServicePayment &&
        servicePayment.amount &&
        parseFloat(servicePayment.amount) > 0
      ) {
        try {
          const patientId = response.data?._id || response._id;

          if (!patientId) {
            console.error("No patient ID returned from patient creation");
            toast.error(
              "Patient added but failed to add service payment: Missing patient ID"
            );
            return;
          }

          const servicePaymentData = {
            patientName: formData.personalDetails.name,
            contactNumber: formData.personalDetails.contactNumber,
            serviceType: servicePayment.serviceType,
            description: servicePayment.description,
            amount: parseFloat(servicePayment.amount),
            paymentMethod: servicePayment.paymentMethod,
            date: format(new Date(), "yyyy-MM-dd"),
            patient: patientId,
            isWalkIn: false,
          };

          await crudRequest("POST", "/service-payment", servicePaymentData);
          toast.success("Service payment added successfully");
        } catch (error: any) {
          console.error("Error adding service payment:", error);
          toast.error("Patient added but failed to add service payment");
        }
      }

      modalClose();
      setTimeout(() => {
        window.location.reload();
      }, 1000);
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

      // Add group treatment amounts (for Ortho and other group treatments)
      groupTreatmentDetails.forEach((groupTreatment) => {
        // If there are daily treatments, sum them up
        if (groupTreatment.dailyTreatments && groupTreatment.dailyTreatments.length > 0) {
          groupTreatment.dailyTreatments.forEach((treatment) => {
            total += Number(treatment.treatmentAmount) || 0;
          });
        } else {
          // Otherwise use the total treatment amount
          total += Number(groupTreatment.totalTreatmentAmount) || 0;
        }
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

      // Add group treatment paid amounts (for Ortho and other group treatments)
      groupTreatmentDetails.forEach((groupTreatment) => {
        // If there are daily treatments, sum them up
        if (groupTreatment.dailyTreatments && groupTreatment.dailyTreatments.length > 0) {
          groupTreatment.dailyTreatments.forEach((treatment) => {
            total += Number(treatment.paidAmount) || 0;
          });
        } else {
          // Otherwise use the total paid amount
          total += Number(groupTreatment.totalPaidAmount) || 0;
        }
      });
    } catch (error) {
      console.error("Error calculating paid amount:", error);
    }

    return total;
  };

  return (
    <div className="flex flex-col h-[92vh] max-w-6xl mx-auto">
      {/* Compact Header with Progress */}
      <motion.div 
        className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-3 py-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <h1 className="text-base md:text-lg font-bold text-foreground">
              Add Patient
            </h1>
            <Badge variant="outline" className="text-xs">
              {currentStep + 1}/{steps.length}: {steps[currentStep].label}
            </Badge>
          </div>
          <Button
            variant="outline"
            onClick={() => modalClose()}
            size="sm"
            className="text-xs hover:bg-destructive hover:text-destructive-foreground transition-colors h-7 px-3"
          >
            Cancel
          </Button>
        </div>
        
        {/* Compact Progress Bar */}
        <div className="space-y-2">
          <Progress value={getStepProgress()} className="h-1.5" />
          
          {/* Compact Step Indicators */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isCompleted = completedSteps.includes(index);
              const isCurrent = currentStep === index;
              const isAccessible = index <= currentStep || completedSteps.includes(index);
              
              return (
                <button
                  key={step.id}
                  onClick={() => isAccessible && goToStep(index)}
                  disabled={!isAccessible}
                  className={`flex items-center space-x-1 px-2 py-1 rounded-md transition-all duration-200 ${
                    isCurrent 
                      ? 'bg-primary text-primary-foreground shadow-sm' 
                      : isCompleted 
                        ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                        : isAccessible
                          ? 'text-muted-foreground hover:bg-muted'
                          : 'text-muted-foreground/50 cursor-not-allowed'
                  }`}
                >
                  <div className="relative">
                    <StepIcon className="w-4 h-4" />
                    {isCompleted && (
                      <CheckCircle className="w-2.5 h-2.5 absolute -top-1 -right-1 text-green-600" />
                    )}
                  </div>
                  <span className="text-xs font-medium hidden md:block">
                    {step.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Form Content */}
      <ScrollArea className="flex-1 px-3">
        <Tabs value={activeTab} onValueChange={(value) => {
          setActiveTab(value);
          const stepIndex = steps.findIndex(step => step.tab === value);
          if (stepIndex !== -1) setCurrentStep(stepIndex);
        }} className="w-full">

        {/* Personal Details Step */}
        <TabsContent value="personal" className="mt-4 mb-4">
          <AnimatePresence mode="wait">
            <motion.div
              key="personal"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-3 md:p-4 border border-muted-foreground/20 transition-colors">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <User className="w-4 h-4 text-primary" />
                    <h3 className="text-base font-semibold">Personal Information</h3>
                    <Badge variant="outline" className="ml-auto text-xs">
                      Required *
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="checkUpDate" className="text-sm font-medium flex items-center">
                  Check-up Date 
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  id="checkUpDate"
                  type="date"
                  value={formData.personalDetails.checkUpDate}
                  onChange={(e) =>
                    handlePersonalChange("checkUpDate", e.target.value)
                  }
                  className="transition-colors focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkUpDateNp" className="text-sm font-medium">
                  Check-up Date (Nepali)
                </Label>
                <NepaliDatePickerComponent
                  value={formData.personalDetails.checkUpDateNp}
                  onChange={(date) =>
                    handlePersonalChange("checkUpDateNp", date)
                  }
                  placeholder="Select Nepali date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sn" className="text-sm font-medium text-muted-foreground">
                  S.N (Auto-generated)
                </Label>
                <Input
                  id="sn"
                  type="text"
                  value={
                    isLoadingSN ? "Loading..." : formData.personalDetails.sn
                  }
                  readOnly
                  className={`bg-muted/50 cursor-not-allowed ${isLoadingSN ? "animate-pulse" : ""}`}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="name">Full Name *</Label>
                {isVoiceInputEnabled ? (
                  <div className="flex space-x-2">
                    <Input
                      id="name"
                      value={formData.personalDetails.name}
                      onChange={(e) =>
                        handlePersonalChange("name", e.target.value)
                      }
                      required
                      className="flex-1"
                    />{" "}
                    <VoiceInputButton
                      fieldId="name"
                      onTranscriptReceived={(transcript) =>
                        handlePersonalChange("name", transcript)
                      }
                      listenMode="single"
                      fieldLabel="Full Name"
                    />
                  </div>
                ) : (
                  <Input
                    id="name"
                    value={formData.personalDetails.name}
                    onChange={(e) =>
                      handlePersonalChange("name", e.target.value)
                    }
                    required
                  />
                )}
              </div>{" "}
              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium">Address</Label>
                {isVoiceInputEnabled ? (
                  <div className="flex space-x-2">
                    <Input
                      id="address"
                      value={formData.personalDetails.address}
                      onChange={(e) =>
                        handlePersonalChange("address", e.target.value)
                      }
                      className="flex-1 transition-colors focus:ring-2 focus:ring-primary/20"
                      placeholder="Enter address"
                    />
                    <VoiceInputButton
                      fieldId="address"
                      onTranscriptReceived={(transcript) =>
                        handlePersonalChange("address", transcript)
                      }
                      listenMode="single"
                      fieldLabel="Address"
                    />
                  </div>
                ) : (
                  <Input
                    id="address"
                    value={formData.personalDetails.address}
                    onChange={(e) =>
                      handlePersonalChange("address", e.target.value)
                    }
                  />
                )}
              </div>{" "}
              <div className="space-y-1">
                <Label htmlFor="age">Age</Label>
                {isVoiceInputEnabled ? (
                  <div className="flex space-x-2">
                    <Input
                      id="age"
                      type="text"
                      value={formData.personalDetails.age}
                      onChange={(e) =>
                        handlePersonalChange("age", e.target.value)
                      }
                      className="flex-1"
                    />{" "}
                    <VoiceInputButton
                      fieldId="age"
                      onTranscriptReceived={(transcript) => {
                        // Extract just the number from the spoken text
                        const ageMatch = transcript.match(/\d+/);
                        if (ageMatch) {
                          handlePersonalChange("age", ageMatch[0]);
                        }
                      }}
                      listenMode="single"
                      fieldLabel="Age"
                    />
                  </div>
                ) : (
                  <Input
                    id="age"
                    type="text"
                    value={formData.personalDetails.age}
                    onChange={(e) =>
                      handlePersonalChange("age", e.target.value)
                    }
                  />
                )}
              </div>{" "}
              <div className="space-y-2">
                <Label htmlFor="gender" className="text-sm font-medium flex items-center">
                  Gender 
                  <span className="text-destructive ml-1">*</span>
                  {errors.gender && <AlertCircle className="w-4 h-4 text-destructive ml-2" />}
                </Label>
                {isVoiceInputEnabled ? (
                  <div className="flex space-x-2">
                    <Select
                      value={formData.personalDetails.gender}
                      onValueChange={(value) => {
                        handlePersonalChange("gender", value);
                        if (errors.gender) setErrors(prev => ({ ...prev, gender: '' }));
                      }}
                    >
                      <SelectTrigger className={`flex-1 transition-colors ${
                        errors.gender ? 'border-destructive focus:border-destructive' : ''
                      }`}>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <VoiceInputButton
                      fieldId="gender"
                      onTranscriptReceived={(transcript) => {
                        const normalizedTranscript = transcript
                          .toLowerCase()
                          .trim();

                        if (
                          normalizedTranscript.includes("male") &&
                          !normalizedTranscript.includes("female")
                        ) {
                          handlePersonalChange("gender", "Male");
                          if (errors.gender) setErrors(prev => ({ ...prev, gender: '' }));
                        } else if (normalizedTranscript.includes("female")) {
                          handlePersonalChange("gender", "Female");
                          if (errors.gender) setErrors(prev => ({ ...prev, gender: '' }));
                        } else if (normalizedTranscript.includes("other")) {
                          handlePersonalChange("gender", "Other");
                          if (errors.gender) setErrors(prev => ({ ...prev, gender: '' }));
                        }
                      }}
                      listenMode="single"
                      fieldLabel="Gender"
                    />
                  </div>
                ) : (
                  <Select
                    value={formData.personalDetails.gender}
                    onValueChange={(value) => {
                      handlePersonalChange("gender", value);
                      if (errors.gender) setErrors(prev => ({ ...prev, gender: '' }));
                    }}
                  >
                    <SelectTrigger className={`transition-colors ${
                      errors.gender ? 'border-destructive focus:border-destructive' : ''
                    }`}>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                {errors.gender && (
                  <p className="text-sm text-destructive mt-1">{errors.gender}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="contactNumber">Contact Number</Label>
                {isVoiceInputEnabled ? (
                  <div className="flex space-x-2">
                    <Input
                      id="contactNumber"
                      value={formData.personalDetails.contactNumber}
                      onChange={(e) =>
                        handlePersonalChange("contactNumber", e.target.value)
                      }
                      required
                      className="flex-1"
                    />{" "}
                    <VoiceInputButton
                      fieldId="contactNumber"
                      onTranscriptReceived={(transcript) => {
                        // Clean up the transcript to only include numbers
                        const numbersOnly = transcript.replace(/\D/g, "");
                        handlePersonalChange("contactNumber", numbersOnly);
                      }}
                      listenMode="single"
                      fieldLabel="Contact Number"
                    />
                  </div>
                ) : (
                  <Input
                    id="contactNumber"
                    value={formData.personalDetails.contactNumber}
                    onChange={(e) =>
                      handlePersonalChange("contactNumber", e.target.value)
                    }
                    required
                  />
                )}
              </div>{" "}
              <div className="space-y-1">
                <Label htmlFor="emailAddress">Email Address</Label>
                {isVoiceInputEnabled ? (
                  <div className="flex space-x-2">
                    <Input
                      id="emailAddress"
                      type="email"
                      value={formData.personalDetails.emailAddress}
                      onChange={(e) =>
                        handlePersonalChange("emailAddress", e.target.value)
                      }
                      className="flex-1"
                    />{" "}
                    <VoiceInputButton
                      fieldId="emailAddress"
                      onTranscriptReceived={(transcript) => {
                        // Format the transcript as an email address
                        // Remove spaces and convert to lowercase
                        const formattedEmail = transcript
                          .toLowerCase()
                          .replace(/\s+/g, "");
                        handlePersonalChange("emailAddress", formattedEmail);
                      }}
                      listenMode="single"
                      fieldLabel="Email Address"
                    />
                  </div>
                ) : (
                  <Input
                    id="emailAddress"
                    type="email"
                    value={formData.personalDetails.emailAddress}
                    onChange={(e) =>
                      handlePersonalChange("emailAddress", e.target.value)
                    }
                  />
                )}
              </div>
            </div>

            <div className="mt-4">
              <Card className="mb-3 p-3 border border-dashed">
                <div className="flex items-center space-x-2 mb-3">
                  <Checkbox
                    id="includeServicePayment"
                    checked={includeServicePayment}
                    onCheckedChange={() =>
                      setIncludeServicePayment(!includeServicePayment)
                    }
                  />
                  <Label
                    htmlFor="includeServicePayment"
                    className="font-medium"
                  >
                    Add Service Payment
                  </Label>
                </div>

                {includeServicePayment && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="serviceType">Service Type</Label>
                        <Select
                          value={servicePayment.serviceType}
                          onValueChange={(value) =>
                            handleServicePaymentChange("serviceType", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select service type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="X-Ray">X-Ray</SelectItem>
                            <SelectItem value="Consultation">
                              Consultation
                            </SelectItem>
                            <SelectItem value="Medicine">Medicine</SelectItem>
                            <SelectItem value="Lab Test">Lab Test</SelectItem>
                            <SelectItem value="Cleaning">Cleaning</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="amount">Amount (Rs)</Label>
                        <Input
                          id="amount"
                          type="number"
                          min="0"
                          value={servicePayment.amount}
                          onChange={(e) =>
                            handleServicePaymentChange("amount", e.target.value)
                          }
                          placeholder="Enter amount"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="paymentMethod">Payment Method</Label>
                        <Select
                          value={servicePayment.paymentMethod}
                          onValueChange={(value) =>
                            handleServicePaymentChange("paymentMethod", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Cash">Cash</SelectItem>
                            <SelectItem value="Credit Card">
                              Credit Card
                            </SelectItem>
                            <SelectItem value="Debit Card">
                              Debit Card
                            </SelectItem>
                            <SelectItem value="Insurance">Insurance</SelectItem>
                            <SelectItem value="Bank Transfer">
                              Bank Transfer
                            </SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">
                          Description (Optional)
                        </Label>
                        <Input
                          id="description"
                          value={servicePayment.description}
                          onChange={(e) =>
                            handleServicePaymentChange(
                              "description",
                              e.target.value
                            )
                          }
                          placeholder="Enter description"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </Card>

                </div>
                </div>
              </Card>
            </motion.div>
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="complaint" className="mt-4 mb-4">
          <AnimatePresence mode="wait">
            <motion.div
              key="complaint"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-3 md:p-4 border border-muted-foreground/20 transition-colors">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <FileText className="w-4 h-4 text-primary" />
                    <h3 className="text-base font-semibold">Chief Complaint</h3>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      Optional
                    </Badge>
                  </div>
              <div className="space-y-2">
                <Label htmlFor="chiefComplaint">
                  What brought the patient in today?
                </Label>
                {isVoiceInputEnabled ? (
                  <div className="flex space-x-2 items-start">
                    <Textarea
                      id="chiefComplaint"
                      placeholder="Enter patient's main concern or complaint"
                      className="min-h-[120px] flex-1"
                      value={formData.medicalDetails.chiefComplaint}
                      onChange={(e) =>
                        handleChiefComplaintChange(e.target.value)
                      }
                    />{" "}
                    <VoiceInputButton
                      fieldId="chiefComplaint"
                      onTranscriptReceived={(transcript) => {
                        handleChiefComplaintChange(transcript);
                      }}
                      className="mt-1"
                      fieldLabel="Chief Complaint"
                    />
                  </div>
                ) : (
                  <Textarea
                    id="chiefComplaint"
                    placeholder="Enter patient's main concern or complaint"
                    className="min-h-[120px]"
                    value={formData.medicalDetails.chiefComplaint}
                    onChange={(e) => handleChiefComplaintChange(e.target.value)}
                  />
                )}
              </div>
                </div>
              </Card>
            </motion.div>
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="medical" className="mt-4 mb-4">
          <AnimatePresence mode="wait">
            <motion.div
              key="medical"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-3 md:p-4 border border-muted-foreground/20 transition-colors">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-3">
                <Heart className="w-4 h-4 text-primary" />
                <h3 className="text-base font-semibold">Medical History</h3>
                <Badge variant="secondary" className="ml-auto text-xs">
                  Optional
                </Badge>
              </div>

              {/* No Medical Issues Checkbox - Compact */}
              <div className="col-span-2 flex items-center gap-2 p-2 border rounded-md bg-muted mb-3">
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

              {/* Medical Conditions Grid - Compact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                </div>{" "}
                <div className="space-y-1">
                  <Label htmlFor="allergies" className="text-xs md:text-sm">
                    Allergies
                  </Label>
                  {isVoiceInputEnabled ? (
                    <div className="flex space-x-2">
                      <Input
                        id="allergies"
                        value={formData.medicalDetails.medicalHistory.allergies}
                        onChange={(e) =>
                          handleMedicalHistoryChange(
                            "allergies",
                            e.target.value
                          )
                        }
                        placeholder="List any allergies"
                        className="h-9 md:h-10 flex-1"
                      />{" "}
                      <VoiceInputButton
                        fieldId="allergies"
                        onTranscriptReceived={(transcript) => {
                          handleMedicalHistoryChange("allergies", transcript);
                        }}
                        listenMode="single"
                        className="h-9 md:h-10"
                        fieldLabel="Allergies"
                      />
                    </div>
                  ) : (
                    <Input
                      id="allergies"
                      value={formData.medicalDetails.medicalHistory.allergies}
                      onChange={(e) =>
                        handleMedicalHistoryChange("allergies", e.target.value)
                      }
                      placeholder="List any allergies"
                      className="h-9 md:h-10"
                    />
                  )}
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
                {/* Other conditions - Full width on all screens */}{" "}
                <div className="col-span-1 md:col-span-2 mt-2">
                  {" "}
                  <Label
                    htmlFor="otherConditions"
                    className="text-xs md:text-sm"
                  >
                    Other Medical Conditions
                  </Label>
                  {isVoiceInputEnabled ? (
                    <div className="flex space-x-2 items-start">
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
                        className="min-h-[60px] md:min-h-[80px] flex-1" // Compact on mobile
                      />{" "}
                      <VoiceInputButton
                        fieldId="otherConditions"
                        onTranscriptReceived={(transcript) => {
                          handleMedicalHistoryChange(
                            "otherConditions",
                            transcript
                          );
                        }}
                        className="mt-1"
                        fieldLabel="Other Medical Conditions"
                      />
                    </div>
                  ) : (
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
                      className="min-h-[60px] md:min-h-[80px]" // Compact on mobile
                    />
                  )}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>
        </TabsContent>

        <TabsContent value="dental" className="mt-4 mb-4">
          <AnimatePresence mode="wait">
            <motion.div
              key="dental"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-3 md:p-4 border border-muted-foreground/20 transition-colors">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-3">
                <Activity className="w-4 h-4 text-primary" />
                <h3 className="text-base font-semibold">Dental Treatment</h3>
                <Badge variant="secondary" className="ml-auto text-xs">
                  Optional
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4 mb-6">
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

                <div className="space-y-1">
                  <Label htmlFor="group">Patient Treatment Group</Label>
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

              {/* Conditional rendering based on group type */}
              {formData.medicalDetails.group === "Ortho" ? (
                // Group Treatment UI for Ortho
                <div className="border rounded-lg p-4 bg-background">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-primary text-lg">Orthodontic Treatment Plan</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addGroupTreatment}
                      className="flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Treatment</span>
                    </Button>
                  </div>

                  {/* Group Treatment Cards */}
                  {groupTreatmentDetails.map((groupTreatment, index) => (
                    <Card
                      key={groupTreatment.id}
                      className="p-4 mb-4 border border-foreground/50"
                    >
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <h5 className="font-medium">
                            Ortho Plan {index + 1}
                          </h5>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeGroupTreatment(groupTreatment.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`procedure-${groupTreatment.id}`}>Procedure</Label>
                            <Input
                              id={`procedure-${groupTreatment.id}`}
                              value={groupTreatment.procedure}
                              onChange={(e) => updateGroupTreatment(groupTreatment.id, 'procedure', e.target.value)}
                              placeholder="E.g. Orthodontic Braces, Invisalign"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`treatedByDoctor-${groupTreatment.id}`}>Treated By Doctor</Label>
                            <Select
                              value={groupTreatment.treatedByDoctor}
                              onValueChange={(value) => updateGroupTreatment(groupTreatment.id, 'treatedByDoctor', value)}
                            >
                              <SelectTrigger id={`treatedByDoctor-${groupTreatment.id}`}>
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
                            <Label htmlFor={`startDate-${groupTreatment.id}`}>Start Date</Label>
                            <Input
                              id={`startDate-${groupTreatment.id}`}
                              type="date"
                              value={groupTreatment.startDate}
                              onChange={(e) => updateGroupTreatment(groupTreatment.id, 'startDate', e.target.value)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`followUpDate-${groupTreatment.id}`}>Follow-up Date</Label>
                            <Input
                              id={`followUpDate-${groupTreatment.id}`}
                              type="date"
                              value={groupTreatment.followUpDate}
                              onChange={(e) => updateGroupTreatment(groupTreatment.id, 'followUpDate', e.target.value)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`totalTreatmentAmount-${groupTreatment.id}`}>Total Treatment Amount</Label>
                            <Input
                              id={`totalTreatmentAmount-${groupTreatment.id}`}
                              type="number"
                              value={groupTreatment.totalTreatmentAmount}
                              onChange={(e) => updateGroupTreatment(groupTreatment.id, 'totalTreatmentAmount', e.target.value)}
                              placeholder="0.00"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`totalPaidAmount-${groupTreatment.id}`}>Total Paid Amount</Label>
                            <Input
                              id={`totalPaidAmount-${groupTreatment.id}`}
                              type="number"
                              value={groupTreatment.totalPaidAmount}
                              onChange={(e) => updateGroupTreatment(groupTreatment.id, 'totalPaidAmount', e.target.value)}
                              placeholder="0.00"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`totalRemainingAmount-${groupTreatment.id}`}>Remaining Amount</Label>
                            <Input
                              id={`totalRemainingAmount-${groupTreatment.id}`}
                              type="number"
                              value={groupTreatment.totalRemainingAmount}
                              readOnly
                              className="bg-muted/50"
                            />
                          </div>

                          <div className="flex items-center space-x-2 pt-7">
                            <Checkbox
                              id={`isCompleted-${groupTreatment.id}`}
                              checked={groupTreatment.isCompleted}
                              onCheckedChange={(checked) => 
                                updateGroupTreatment(
                                  groupTreatment.id, 
                                  'isCompleted', 
                                  checked === true
                                )
                              }
                            />
                            <Label htmlFor={`isCompleted-${groupTreatment.id}`}>Mark as Completed</Label>
                          </div>

                          {/* Daily Treatment Section */}
                          <div className="col-span-1 md:col-span-2 mt-2">
                            <div className="flex justify-between items-center mb-2">
                              <h6 className="font-medium">Daily Treatments</h6>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => addDailyTreatment(groupTreatment.id)}
                                className="flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Add Treatment Entry</span>
                              </Button>
                            </div>

                            {/* Daily Treatment Grid View */}
                            <div className="space-y-4">
                              {groupTreatment.dailyTreatments.length === 0 ? (
                                <Card className="p-8">
                                  <div className="text-center text-sm text-muted-foreground">
                                    <div className="mb-4">
                                      <svg
                                        className="mx-auto h-12 w-12 text-gray-300"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        aria-hidden="true"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={1}
                                          d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                                        />
                                      </svg>
                                    </div>
                                    <h3 className="text-sm font-medium text-gray-900 mb-1">No Daily Treatments</h3>
                                    <p>No daily treatments added yet. Click "Add Treatment Entry" to add one.</p>
                                  </div>
                                </Card>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {groupTreatment.dailyTreatments.map((treatment) => (
                                    <Card key={treatment.id} className="p-4 border border-gray-200 hover:shadow-md transition-shadow">
                                      <div className="space-y-4">
                                        {/* Header with date and completion status */}
                                        <div className="flex justify-between items-start">
                                          <div className="space-y-1 flex-1">
                                            <Label className="text-xs font-medium text-gray-600">Treatment Date</Label>
                                            <Input
                                              type="date"
                                              value={treatment.date}
                                              onChange={(e) => 
                                                updateDailyTreatment(
                                                  groupTreatment.id, 
                                                  treatment.id, 
                                                  'date', 
                                                  e.target.value
                                                )
                                              }
                                              className="h-8"
                                            />
                                          </div>
                                          <div className="flex items-center gap-2 ml-3">
                                            <Checkbox
                                              checked={treatment.isCompleted}
                                              onCheckedChange={(checked) => 
                                                updateDailyTreatment(
                                                  groupTreatment.id, 
                                                  treatment.id, 
                                                  'isCompleted', 
                                                  checked === true
                                                )
                                              }
                                            />
                                            <Label className="text-xs">Done</Label>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              onClick={() => removeDailyTreatment(groupTreatment.id, treatment.id)}
                                              className="h-8 w-8 text-red-500 hover:text-red-700"
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </Button>
                                          </div>
                                        </div>

                                        {/* Procedure */}
                                        <div className="space-y-1">
                                          <Label className="text-xs font-medium text-gray-600">Procedure</Label>
                                          <Input
                                            value={treatment.procedure || ""}
                                            onChange={(e) => 
                                              updateDailyTreatment(
                                                groupTreatment.id, 
                                                treatment.id, 
                                                'procedure', 
                                                e.target.value
                                              )
                                            }
                                            placeholder="Enter procedure name"
                                            className="h-8"
                                          />
                                        </div>

                                        {/* Daily Notes */}
                                        <div className="space-y-1">
                                          <Label className="text-xs font-medium text-gray-600">Daily Notes & Observations</Label>
                                          <Textarea
                                            value={treatment.notes || ""}
                                            onChange={(e) => {
                                              const value = e.target.value;
                                              // Limit to 500 characters
                                              if (value.length <= 500) {
                                                updateDailyTreatment(
                                                  groupTreatment.id, 
                                                  treatment.id, 
                                                  'notes', 
                                                  value
                                                );
                                              }
                                            }}
                                            placeholder="Enter daily notes: pain level, wire change, aligner number, patient response, observations..."
                                            className="h-16 text-xs resize-none border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                            rows={3}
                                            maxLength={500}
                                          />
                                          <div className="text-xs text-gray-500">
                                            {(treatment.notes || "").length}/500 characters
                                          </div>
                                        </div>

                                        {/* Payment Information Grid */}
                                        <div className="grid grid-cols-2 gap-3">
                                          <div className="space-y-1">
                                            <Label className="text-xs font-medium text-gray-600">Treatment Amount</Label>
                                            <Input
                                              type="number"
                                              value={treatment.treatmentAmount === "0" ? "" : treatment.treatmentAmount || ""}
                                              onChange={(e) => {
                                                const value = e.target.value;
                                                // Validate non-negative numbers
                                                if (value === "" || (parseFloat(value) >= 0 && !isNaN(parseFloat(value)))) {
                                                  updateDailyTreatment(
                                                    groupTreatment.id, 
                                                    treatment.id, 
                                                    'treatmentAmount', 
                                                    value || "0"
                                                  );
                                                }
                                              }}
                                              placeholder="0.00"
                                              className="h-8"
                                              min="0"
                                              step="0.01"
                                            />
                                          </div>
                                          <div className="space-y-1">
                                            <Label className="text-xs font-medium text-gray-600">Paid Amount</Label>
                                            <Input
                                              type="number"
                                              value={treatment.paidAmount === "0" ? "" : treatment.paidAmount || ""}
                                              onChange={(e) => {
                                                const value = e.target.value;
                                                const treatmentAmt = parseFloat(treatment.treatmentAmount) || 0;
                                                const paidAmt = parseFloat(value) || 0;
                                                
                                                // Validate non-negative and not exceeding treatment amount
                                                if (value === "" || (paidAmt >= 0 && paidAmt <= treatmentAmt && !isNaN(paidAmt))) {
                                                  updateDailyTreatment(
                                                    groupTreatment.id, 
                                                    treatment.id, 
                                                    'paidAmount', 
                                                    value || "0"
                                                  );
                                                }
                                              }}
                                              placeholder="0.00"
                                              className="h-8"
                                              min="0"
                                              max={treatment.treatmentAmount || undefined}
                                              step="0.01"
                                            />
                                          </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                          <div className="space-y-1">
                                            <Label className="text-xs font-medium text-gray-600">Payment Date</Label>
                                            <Input
                                              type="date"
                                              value={treatment.paymentDate || ""}
                                              onChange={(e) => {
                                                const selectedDate = new Date(e.target.value);
                                                const today = new Date();
                                                today.setHours(23, 59, 59, 999); // End of today
                                                
                                                // Validate payment date is not in the future
                                                if (selectedDate <= today) {
                                                  updateDailyTreatment(
                                                    groupTreatment.id, 
                                                    treatment.id, 
                                                    'paymentDate', 
                                                    e.target.value
                                                  );
                                                } else {
                                                  toast.error("Payment date cannot be in the future");
                                                }
                                              }}
                                              placeholder="Payment date"
                                              className="h-8"
                                              max={format(new Date(), "yyyy-MM-dd")}
                                            />
                                          </div>
                                          <div className="space-y-1">
                                            <Label className="text-xs font-medium text-gray-600">Remaining Amount</Label>
                                            <Input
                                              type="number"
                                              value={treatment.remainingAmount === "0" ? "" : treatment.remainingAmount || ""}
                                              readOnly
                                              placeholder="0.00"
                                              className="h-8 bg-muted/50"
                                            />
                                          </div>
                                        </div>

                                        {/* Doctor Selection */}
                                        <div className="space-y-1">
                                          <Label className="text-xs font-medium text-gray-600">Treated by Doctor</Label>
                                          <Select
                                            value={treatment.treatedByDoctor}
                                            onValueChange={(value) => 
                                              updateDailyTreatment(
                                                groupTreatment.id, 
                                                treatment.id, 
                                                'treatedByDoctor', 
                                                value
                                              )
                                            }
                                          >
                                            <SelectTrigger className="h-8">
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
                                    </Card>
                                  ))}
                                </div>
                              )}
                          </div>
                        </div>

                        </div>
                      </div>
                    </Card>
                  ))
                }
                </div>
              ) : (
                // Regular Tooth-based Treatment UI
                formData.treatmentPlans.map((plan, index: number) => (
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
                                readOnly={false}
                              />
                            ) : (
                              <ChildDentalChart
                                selectedTeeth={selectedTeethMaps[index] || {}}
                                onToothSelect={(toothNumber) =>
                                  handleToothSelect(index, toothNumber)
                                }
                                readOnly={false}
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
                              handleTreatmentPlanChange(
                                index,
                                "treatmentDate",
                                e.target.value
                              )
                            }
                          />
                        </div>

                        <div className="space-y-3">
                          <Label
                            htmlFor="treatmentDateNp"
                            className="text-sm font-medium"
                          >
                            Treatment Date (Nepali)
                          </Label>
                          <NepaliDatePickerComponent
                            value={plan.treatmentDateNp}
                            onChange={(date) =>
                              handleTreatmentPlanChange(
                                index,
                                "treatmentDateNp",
                                date
                              )
                            }
                            placeholder="Select Nepali date"
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
                              handleTreatmentPlanChange(
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
                          <Label>Treatment Procedure</Label>{" "}
                          <Textarea
                            value={plan.treatmentFindings}
                            onChange={(e) =>
                              handleTreatmentPlanChange(
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
                              handleTreatmentPlanChange(
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
                              handleTreatmentPlanChange(
                                index,
                                "followUpDate",
                                e.target.value
                              )
                            }
                          />
                        </div>

                        <div className="space-y-3">
                          <Label
                            htmlFor="followUpDateNp"
                            className="text-sm font-medium"
                          >
                            Follow-up Date (Nepali)
                          </Label>
                          <NepaliDatePickerComponent
                            value={plan.followUpDateNp}
                            onChange={(date) =>
                              handleTreatmentPlanChange(
                                index,
                                "followUpDateNp",
                                date
                              )
                            }
                            placeholder="Select Nepali date"
                          />
                        </div>

                        <div className="space-y-1 col-span-3 md:col-span-1">
                          <Label>Completion Date</Label>
                          <Input
                            type="date"
                            value={plan.completionDate}
                            onChange={(e) =>
                              handleTreatmentPlanChange(
                                index,
                                "completionDate",
                                e.target.value
                              )
                            }
                          />
                        </div>

                        <div className="space-y-3">
                          <Label
                            htmlFor="completionDateNp"
                            className="text-sm font-medium"
                          >
                            Completion Date (Nepali)
                          </Label>
                          <NepaliDatePickerComponent
                            value={plan.completionDateNp}
                            onChange={(date) =>
                              handleTreatmentPlanChange(
                                index,
                                "completionDateNp",
                                date
                              )
                            }
                            placeholder="Select Nepali date"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  </Card>
                ))
              )}

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

            </div>
          </Card>
        </motion.div>
      </AnimatePresence>
        </TabsContent>
      </Tabs>
      
      {/* Compact Sticky Footer with Navigation */}
      <motion.div 
        className="sticky bottom-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t px-4 py-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Progress value={getStepProgress()} className="w-16 h-1.5" />
            <span className="text-xs text-muted-foreground">
              {currentStep + 1}/{steps.length}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              size="sm"
              className="flex items-center gap-1 h-8 px-3"
            >
              <ChevronLeft className="w-3 h-3" />
              <span className="hidden sm:inline">Previous</span>
            </Button>
            
            {currentStep < steps.length - 1 ? (
              <Button
                onClick={nextStep}
                size="sm"
                className="flex items-center gap-1 bg-primary hover:bg-primary/90 h-8 px-3"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-3 h-3" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting}
                size="sm"
                className="flex items-center gap-1 bg-green-600 hover:bg-green-700 h-8 px-3"
              >
                {isSubmitting ? (
                  <>
                    <motion.div 
                      className="w-3 h-3 border-2 border-white border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <span className="hidden sm:inline">Adding...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3 h-3" />
                    <span className="hidden sm:inline">Add Patient</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </motion.div>
      </ScrollArea>
    </div>
  );
};

export default AddPatient;

// Types for daily treatment in group treatments
type GroupDailyTreatment = {
  id: string;
  date: string;
  procedure: string;
  treatmentAmount: string;
  paidAmount: string;
  remainingAmount: string;
  paymentDate?: string; // Add payment date field
  notes: string;
  treatedByDoctor: string;
  isCompleted: boolean;
};

// Types for group treatment details
type GroupTreatmentDetail = {
  id: string;
  procedure: string;
  totalTreatmentAmount: string;
  totalPaidAmount: string;
  totalRemainingAmount: string;
  startDate: string;
  followUpDate: string;
  completionDate: string;
  treatedByDoctor: string;
  isCompleted: boolean;
  dailyTreatments: GroupDailyTreatment[];
};

// Include groupTreatmentDetails in FormData type