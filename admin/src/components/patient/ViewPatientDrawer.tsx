import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
} from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle,
  Calendar,
  CalendarCheck,
  CalendarPlus,
  CheckCircle,
  Clock,
  ClipboardList,
  Droplets,
  FileText,
  Heart,
  HeartPulse,
  Image as ImageIcon,
  Mail,
  MapPin,
  Microscope,
  Phone,
  Pill,
  Scan,
  Star,
  User,
  UserCheck,
  X,
  Users,
  Volume2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Custom icon components to replace missing lucide-react icons
const Globe = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const FileDigit = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <rect x="8" y="12" width="2" height="2" />
    <rect x="8" y="16" width="2" height="2" />
    <path d="M10 9h1v4h-1" />
    <path d="M14 9h2" />
    <path d="M14 12h2" />
    <path d="M14 15h1v2h-1" />
  </svg>
);

const Download = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);



const FolderOpen = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-2z" />
  </svg>
);

// Calendar alias for consistency
const CalendarDays = Calendar;

// Import components after custom icons to avoid circular dependencies
import { TreatmentProgress } from "./TreatmentProgress";
import { MedicalTimeline } from "./MedicalTimeline";
import { DocumentComparison } from "./DocumentComparison";
import { Patient, DailyTreatment, FollowUp } from "@/types/patient";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback } from "../ui/avatar";
import jsPDF from "jspdf";
import "jspdf-autotable";
import autoTable from "jspdf-autotable";
import { formatSafeDate } from "@/lib/utils";
import { crudRequest } from "@/lib/api";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "react-toastify";
import { PatientDocumentUploadButton } from "./PatientDocumentUploadButton";
import DentalChart from "@/components/DentalChart";
import ChildDentalChart from "@/components/ChildDentalChart";
import { ServicePayment } from "@/types/finance";
import { PaymentHistoryDialog } from "./PaymentHistoryDialog";

interface ViewPatientDrawerProps {
  patient: Patient;
  isOpen: boolean;
  onClose: () => void;
}

// Enhanced DateDisplay component with improved styling
const DateDisplay = ({
  englishDate,
  nepaliDate,
  label,
  icon: Icon = Calendar,
  color = "text-blue-500",
}: {
  englishDate?: string;
  nepaliDate?: string;
  label: string;
  icon?: any;
  color?: string;
}) => (
  <div className="flex items-start gap-2 p-2 rounded-lg bg-white/80 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700">
    <div className={`p-1 rounded-md ${color} bg-opacity-10 dark:bg-opacity-20`}>
      <Icon className="w-3 h-3" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium text-gray-700 dark:text-gray-200 mb-0.5">
        {label}
      </p>
      <div className="space-y-0.5">
        {englishDate && (
          <div className="flex items-center gap-1">
            <Globe className="w-2 h-2 text-green-600" />
            <span className="text-xs text-gray-900 dark:text-gray-100">
              {formatSafeDate(englishDate)}
            </span>
          </div>
        )}
        {nepaliDate && (
          <div className="flex items-center gap-1">
            <Star className="w-2 h-2 text-orange-600" />
            <span className="text-xs text-gray-900 dark:text-gray-100">
              {nepaliDate}
            </span>
          </div>
        )}
        {!englishDate && !nepaliDate && (
          <span className="text-xs text-gray-600 dark:text-gray-300">
            Not provided
          </span>
        )}
      </div>
    </div>
  </div>
);

// Follow-up Display Component
const FollowUpDisplay = ({ followUps }: { followUps: FollowUp[] }) => {
  if (!followUps || followUps.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No follow-ups scheduled</p>
      </div>
    );
  }

  const getTypeColor = (type: string) => {
    const colors = {
      "Treatment Review": "bg-blue-100 text-blue-800",
      "Orthodontic Check": "bg-purple-100 text-purple-800",
      "Pain Assessment": "bg-red-100 text-red-800",
      "Routine Check": "bg-green-100 text-green-800",
      "Post-Surgery": "bg-orange-100 text-orange-800",
      "Cleaning": "bg-cyan-100 text-cyan-800",
      "X-Ray Review": "bg-gray-100 text-gray-800",
      "Other": "bg-yellow-100 text-yellow-800"
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  // Sort follow-ups by date (upcoming first)
  const sortedFollowUps = [...followUps].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <div className="space-y-2 max-h-64 pr-1">
      {sortedFollowUps.map((followUp) => (
        <Card key={followUp._id} className="border-l-2 border-l-blue-500">
          <CardContent className="p-2">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-1">
                  <Badge className={cn(getTypeColor(followUp.type), "text-xs px-1 py-0")}>
                    {followUp.type}
                  </Badge>
                  {followUp.completed && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 text-xs px-1 py-0">
                      <CheckCircle className="w-2 h-2 mr-0.5" />
                      Completed
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {new Date(followUp.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>

                {followUp.reason && (
                  <p className="text-xs text-gray-700 dark:text-gray-200 font-medium truncate">{followUp.reason}</p>
                )}

                {followUp.notes && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic truncate">{followUp.notes}</p>
                )}

                {followUp.completedDate && (
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Completed on {new Date(followUp.completedDate).toLocaleDateString()}
                  </p>
                )}
              </div>

              <div className="ml-2">
                {new Date(followUp.date) > new Date() ? (
                  <Clock className="w-3.5 h-3.5 text-orange-500" />
                ) : followUp.completed ? (
                  <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export function ViewPatientDrawer({
  patient,
  isOpen,
  onClose,
}: ViewPatientDrawerProps) {
  console.log("Rendering ViewPatientDrawer for patient:", patient);
  const [localPatient, setLocalPatient] = useState<Patient>(patient);
  const [_selectedMedicalRecordId, setSelectedMedicalRecordId] = useState<
    string | null
  >(null);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loadingPrescriptions, setLoadingPrescriptions] =
    useState<boolean>(false);
  const [expandedPrescription, setExpandedPrescription] = useState<
    string | null
  >(null);
  const [servicePayments, setServicePayments] = useState<ServicePayment[]>([]);
  const [loadingServicePayments, setLoadingServicePayments] =
    useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  // Payment dialog state
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  // Patient status edit dialog state
  const [showStatusEditDialog, setShowStatusEditDialog] = useState(false);
  const [newPatientStatus, setNewPatientStatus] = useState<"New" | "Old">(
    localPatient.patientStatus || "New"
  );
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Get all treatments and their teeth details for calculations
  const allTreatments = localPatient.medicalDetails.flatMap(
    (record) => record.treatmentPlanning
  );

  // Get all daily treatments from all teeth across all treatment plans
  const allDailyTreatments = allTreatments.flatMap((treatment) =>
    treatment.selectedTeethDetails
      ? treatment.selectedTeethDetails.flatMap(
          (tooth) => (tooth.dailyTreatments || []) as DailyTreatment[]
        )
      : []
  );

  // Calculate totals based on daily treatments data from selected teeth
  const selectedTeethTotalAmount = allDailyTreatments.reduce(
    (sum, dailyTreatment: DailyTreatment) => {
      // Handle null, undefined, or non-numeric values
      const amount = dailyTreatment.treatmentAmount;
      if (amount === undefined || amount === null) return sum;

      // Ensure we're working with a number
      return sum + Number(amount);
    },
    0
  );

  const selectedTeethPaidAmount = allDailyTreatments.reduce(
    (sum, dailyTreatment: DailyTreatment) => {
      // Handle null, undefined, or non-numeric values
      const amount = dailyTreatment.paidAmount;
      if (amount === undefined || amount === null) return sum;

      // Ensure we're working with a number
      return sum + Number(amount);
    },
    0
  );

  // Calculate group treatment totals
  const groupTreatmentTotalAmount = allTreatments.reduce(
    (sum, treatment) => {
      if (treatment.groupTreatmentDetails) {
        return sum + treatment.groupTreatmentDetails.reduce(
          (groupSum, group) => groupSum + (group.totalTreatmentAmount || 0),
          0
        );
      }
      return sum;
    },
    0
  );

  const groupTreatmentPaidAmount = allTreatments.reduce(
    (sum, treatment) => {
      if (treatment.groupTreatmentDetails) {
        return sum + treatment.groupTreatmentDetails.reduce(
          (groupSum, group) => groupSum + (group.totalPaidAmount || 0),
          0
        );
      }
      return sum;
    },
    0
  );

  // Calculate service payments total
  const servicePaymentsTotalAmount = servicePayments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );

  // Calculate combined totals (selected teeth + group treatments + service payments)
  const totalAmount = selectedTeethTotalAmount + groupTreatmentTotalAmount + servicePaymentsTotalAmount;
  const paidAmount = selectedTeethPaidAmount + groupTreatmentPaidAmount + servicePaymentsTotalAmount;

  // Calculate remaining amount
  const remainingAmount = totalAmount - paidAmount;

  // Get all documents for comparison
  const allTreatmentDocuments = localPatient.medicalDetails.flatMap((record) =>
    record.treatmentPlanning.flatMap(
      (treatment) => treatment.treatmentDocuments || []
    )
  );

  // Get general patient documents
  const patientDocuments = localPatient.documents || [];

  // Combine all documents
  const allDocuments = [
    ...patientDocuments.map((doc) => ({
      ...doc,
      source: "patient", // Add a source field to identify patient documents
    })),
    ...allTreatmentDocuments.map((doc) => ({
      ...doc,
      source: "treatment", // Add a source field to identify treatment documents
    })),
  ];

  // Fetch patient prescriptions
  useEffect(() => {
    if (isOpen && patient._id) {
      fetchPatientPrescriptions(patient._id);
      fetchPatientServicePayments(patient._id);
    }
  }, [isOpen, patient._id]);

  const fetchPatientPrescriptions = async (patientId: string) => {
    try {
      setLoadingPrescriptions(true);
      const response = await crudRequest<{
        success: boolean;
        data?: any[];
        count?: number;
        message?: string;
      }>("GET", `/prescription/patient/${patientId}`);

      if (response.success && response.data) {
        setPrescriptions(response.data || []);
      } else {
        setPrescriptions([]);
        toast.error(response.message || "Failed to load prescriptions");
      }
    } catch (error) {
      console.error("Error fetching patient prescriptions:", error);
      setPrescriptions([]);
      toast.error("Failed to load prescriptions");
    } finally {
      setLoadingPrescriptions(false);
    }
  };

  const fetchPatientServicePayments = async (patientId: string) => {
    try {
      setLoadingServicePayments(true);
      const response = await crudRequest<{
        success: boolean;
        data?: ServicePayment[];
        count?: number;
        message?: string;
      }>("GET", `/service-payment/patient/${patientId}`);

      if (response.success && response.data) {
        setServicePayments(response.data || []);
      } else {
        setServicePayments([]);
        toast.error(response.message || "Failed to load service payments");
      }
    } catch (error) {
      console.error("Error fetching patient service payments:", error);
      setServicePayments([]);
      toast.error("Failed to load service payments");
    } finally {
      setLoadingServicePayments(false);
    }
  };

  // Update patient status
  const handleUpdatePatientStatus = async () => {
    try {
      setIsUpdatingStatus(true);

      const token = localStorage.getItem("token");
      const response = await fetch(`/api/patients/status/${localPatient._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ patientStatus: newPatientStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update patient status");
      }

      await response.json();

      // Update local patient data
      setLocalPatient(prev => ({
        ...prev,
        patientStatus: newPatientStatus
      }));

      setShowStatusEditDialog(false);
      toast.success(`Patient status updated to ${newPatientStatus}`);
    } catch (error) {
      console.error("Error updating patient status:", error);
      toast.error("Failed to update patient status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Cleanup speech synthesis on component unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Toggle speech for patient details
  const toggleSpeech = () => {
    if (isSpeaking) {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      return;
    }

    // Create speech synthesis utterance
    const speechText = generatePatientSpeechText();
    const utterance = new SpeechSynthesisUtterance(speechText);

    // Set voice properties
    utterance.rate = 0.9;
    utterance.pitch = 1;

    // Handle speech events
    utterance.onend = () => {
      setIsSpeaking(false);
      speechSynthesisRef.current = null;
    };

    utterance.onerror = (event) => {
      console.error("SpeechSynthesis error:", event);
      setIsSpeaking(false);
      toast.error("Error reading patient details");
    };

    // Start speaking
    try {
      window.speechSynthesis.speak(utterance);
      speechSynthesisRef.current = utterance;
      setIsSpeaking(true);
    } catch (error) {
      console.error("Error with speech synthesis:", error);
      toast.error("Speech synthesis not supported in this browser");
    }
  };

  // Generate speech text from patient details
  const generatePatientSpeechText = (): string => {
    const { personalDetails, medicalDetails } = localPatient;

    // Calculate total amounts from treatment plans
    let totalAmount = 0;
    let paidAmount = 0;
    let remainingAmount = 0;

    medicalDetails?.forEach((detail) => {
      detail.treatmentPlanning?.forEach((plan) => {
        totalAmount += Number(plan.totalPlanAmount) || 0;
        paidAmount += Number(plan.totalPaidAmount) || 0;
        remainingAmount += Number(plan.totalRemainingAmount) || 0;
      });
    });

    return `
      Patient Name: ${personalDetails?.name || "Not provided"}.\n
      Age: ${personalDetails?.age || "Not provided"}.\n
      Gender: ${personalDetails?.gender || "Not provided"}.\n
      Phone: ${personalDetails?.contactNumber || "Not provided"}.\n
      Email: ${personalDetails?.emailAddress || "Not provided"}.\n
      Address: ${personalDetails?.address || "Not provided"}.\n
      Total Treatment Amount: ${totalAmount}.\n
      Paid Amount: ${paidAmount}.\n
      Remaining Amount: ${remainingAmount}.
    `;
  };

  // Get patient initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };
  // Add this function to generate PDF
  const exportPatientPDF = () => {
    try {
      // Create a new document with explicit typing
      const doc = new jsPDF() as jsPDF & {
        previousAutoTable?: { finalY: number };
      };

      doc.setFontSize(18);
      doc.setTextColor(41, 128, 185); // Primary color
      doc.text("Crown Mantra Dental Clinic", 105, 20, { align: "center" });

      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text("Patient Details", 105, 30, { align: "center" }); // Patient info section
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text("Personal Information", 14, 45);
      // Add space between section title and content
      const startYPersonal = 50;

      // Personal details table - improved spacing and formatted data
      doc.setFontSize(10);
      // Fix spacing issue in the header text
      // Fix spacing issue in the header text
      const personalData = [
        ["Name", localPatient.personalDetails.name || "-"],
        [
          "Age/Gender",
          `${localPatient.personalDetails.age || "-"} / ${localPatient.personalDetails.gender || "-"}`,
        ],
        ["Contact", localPatient.personalDetails.contactNumber || "-"],
        ["Email", localPatient.personalDetails.emailAddress || "-"],
        ["Address", localPatient.personalDetails.address || "-"],
        ["Serial Number", localPatient.personalDetails.sn || "-"],
        ["Referred By", localPatient.personalDetails.referredBy || "-"],
        [
          "Check-up Date",
          formatSafeDate(localPatient.personalDetails.checkUpDate || ""),
        ],
      ]; // Use autoTable with improved styling and cell sizes
      autoTable(doc, {
        startY: startYPersonal,
        head: [],
        body: personalData,
        theme: "striped",
        styles: {
          cellPadding: 3,
          overflow: "linebreak",
          fontSize: 9,
          minCellHeight: 8,
          halign: "left",
          valign: "middle",
        },
        headStyles: { fillColor: [41, 128, 185] },
        columnStyles: {
          0: { cellWidth: 40, fontStyle: "bold" },
          1: { cellWidth: "auto", overflow: "linebreak" },
        },
        margin: { left: 14, right: 14 },
        tableWidth: "auto",
        didParseCell: function (data) {
          // Ensure text fits by adjusting font size if needed
          if (data.cell.text.length > 50) {
            data.cell.styles.fontSize = 8;
          }
        },
      });

      // Track vertical position with added space for separation
      let currentY = doc.previousAutoTable?.finalY || 50;
      currentY += 15; // Add space between sections

      // Medical History Section
      if (
        localPatient.medicalDetails &&
        localPatient.medicalDetails.length > 0
      ) {
        // Check if we need a page break
        if (currentY > 220) {
          doc.addPage();
          currentY = 20;
        } // Medical history header
        doc.setFontSize(14);
        doc.setTextColor(0);

        // Add background for the title
        doc.setFillColor(240, 240, 240); // Light gray background
        doc.rect(10, currentY - 5, 190, 10, "F"); // x, y, width, height, 'F' = Fill

        doc.text("Medical History", 14, currentY);
        currentY += 20; // Significantly increased spacing between title and content

        const medicalDetails = localPatient.medicalDetails[0];
        const medicalHistory = medicalDetails.medicalHistory || {};
        const medicalConditions = [];

        if (medicalHistory.noMedicalIssues) {
          medicalConditions.push(["Medical Status", "No Medical Issues"]);
        } else {
          if (medicalHistory.diabetes)
            medicalConditions.push(["Diabetes", "Yes"]);
          if (medicalHistory.thyroid)
            medicalConditions.push(["Thyroid", "Yes"]);
          if (medicalHistory.bleedingDisorder)
            medicalConditions.push(["Bleeding Disorder", "Yes"]);
          if (medicalHistory.pregnancy)
            medicalConditions.push(["Pregnancy", "Yes"]);
          if (medicalHistory.asthma) medicalConditions.push(["Asthma", "Yes"]);
          if (medicalHistory.bloodPressure)
            medicalConditions.push([
              "Blood Pressure",
              medicalHistory.bloodPressure,
            ]);
          if (medicalHistory.allergies)
            medicalConditions.push(["Allergies", medicalHistory.allergies]);
          if (medicalHistory.otherConditions)
            medicalConditions.push([
              "Other Conditions",
              medicalHistory.otherConditions,
            ]);
        }
        if (medicalConditions.length > 0) {
          autoTable(doc, {
            startY: currentY,
            head: [],
            body: medicalConditions,
            theme: "striped",
            styles: {
              cellPadding: 3,
              overflow: "linebreak",
              fontSize: 9,
              minCellHeight: 8,
              halign: "left",
              valign: "middle",
            },
            headStyles: { fillColor: [41, 128, 185] },
            columnStyles: {
              0: { cellWidth: 40, fontStyle: "bold" },
              1: { cellWidth: "auto", overflow: "linebreak" },
            },
            margin: { left: 14, right: 14 },
            tableWidth: "auto",
            didParseCell: function (data) {
              // Ensure text fits by adjusting font size if needed
              if (data.cell.text.length > 40) {
                data.cell.styles.fontSize = 8;
              }
            },
          });

          currentY = doc.previousAutoTable?.finalY || currentY;
          currentY += 15;
        } else {
          currentY += 10;
        }

        // Chief Complaint and Diagnosis Section
        if (currentY > 220) {
          doc.addPage();
          currentY = 20;
        }
        doc.setFontSize(14);
        doc.setTextColor(0);

        // Add background for the title
        doc.setFillColor(240, 240, 240); // Light gray background
        doc.rect(10, currentY - 5, 190, 10, "F"); // x, y, width, height, 'F' = Fill

        doc.text("Clinical Information", 14, currentY);
        currentY += 20; // Significantly increased spacing between title and content

        const clinicalData = localPatient.medicalDetails.map(
          (record, index) => [
            `Record #${index + 1}`,
            `Date: ${formatSafeDate(record.checkUpDate || "")}`,
          ]
        );
        autoTable(doc, {
          startY: currentY,
          head: [],
          body: clinicalData,
          theme: "striped",
          styles: {
            cellPadding: 3,
            overflow: "linebreak",
            fontSize: 9,
            minCellHeight: 8,
            halign: "left",
            valign: "middle",
          },
          headStyles: { fillColor: [41, 128, 185] },
          columnStyles: {
            0: { cellWidth: 40, fontStyle: "bold" },
            1: { cellWidth: "auto", overflow: "linebreak" },
          },
          margin: { left: 14, right: 14 },
          tableWidth: "auto",
        });

        currentY = doc.previousAutoTable?.finalY || currentY;
        currentY += 10; // Add each medical record's chief complaint and diagnosis
        localPatient.medicalDetails.forEach((record, index) => {
          if (currentY > 220) {
            doc.addPage();
            currentY = 20;
          }

          const recordData = [
            ["Chief Complaint", record.chiefComplaint || "-"],
            ["Diagnosis", record.diagnosis || "-"],
            [
              "Investigation",
              typeof record.investigation === "string"
                ? record.investigation
                : "-",
            ],
          ];
          doc.setFontSize(12);
          doc.setTextColor(41, 128, 185);

          // Add light background for subtitle
          doc.setFillColor(245, 245, 250); // Very light blue-gray
          doc.rect(10, currentY - 4, 100, 8, "F");

          doc.text(`Record #${index + 1} Details`, 14, currentY);
          currentY += 15; // Increased spacing between title and content

          autoTable(doc, {
            startY: currentY,
            head: [],
            body: recordData,
            theme: "striped",
            styles: {
              cellPadding: 3,
              overflow: "linebreak",
              fontSize: 9,
              minCellHeight: 8,
              halign: "left",
              valign: "middle",
            },
            headStyles: { fillColor: [41, 128, 185] },
            columnStyles: {
              0: { cellWidth: 40, fontStyle: "bold" },
              1: { cellWidth: "auto", overflow: "linebreak" },
            },
            margin: { left: 14, right: 14 },
            tableWidth: "auto",
            didParseCell: function (data) {
              // Ensure text fits by adjusting font size if needed
              if (data.cell.text.length > 60) {
                data.cell.styles.fontSize = 8;
              }
            },
          });

          currentY = doc.previousAutoTable?.finalY || currentY;
          currentY += 15;
        });

        // Treatment Plans Section
        if (currentY > 200) {
          doc.addPage();
          currentY = 20;
        }
        doc.setFontSize(14);
        doc.setTextColor(0);

        // Add background for the title
        doc.setFillColor(240, 240, 240); // Light gray background
        doc.rect(10, currentY - 5, 190, 10, "F"); // x, y, width, height, 'F' = Fill

        doc.text("Treatment Plans", 14, currentY);
        currentY += 20; // Significantly increased spacing between title and content

        // Collect all treatment plans across all medical records
        const allTreatmentPlans = localPatient.medicalDetails.flatMap(
          (record, recordIndex) =>
            record.treatmentPlanning.map((plan, planIndex) => ({
              ...plan,
              recordIndex,
              planIndex,
            }))
        );

        // Add each treatment plan details
        allTreatmentPlans.forEach((plan, index) => {
          if (currentY > 220) {
            doc.addPage();
            currentY = 20;
          }
          doc.setFontSize(12);
          doc.setTextColor(41, 128, 185);

          // Add light background for subtitle
          doc.setFillColor(245, 245, 250); // Very light blue-gray
          doc.rect(10, currentY - 4, 160, 8, "F");

          doc.text(
            `Plan ${index + 1}: ${plan.treatmentDetails || "Treatment Plan"}`,
            14,
            currentY
          );
          doc.setTextColor(0);
          currentY += 12;

          const treatmentData = [
            ["Date", formatSafeDate(plan.treatmentDate || "")],
            ["Amount", `Rs. ${plan.totalPlanAmount || 0}`],
            ["Paid", `Rs. ${plan.totalPaidAmount || 0}`],
            ["Balance", `Rs. ${plan.totalRemainingAmount || 0}`],
            ["Status", plan.isCompleted ? "Completed" : "In Progress"],
          ];

          // Add selected teeth information if available
          if (
            plan.selectedTeethDetails &&
            plan.selectedTeethDetails.length > 0
          ) {
            treatmentData.push([
              "Selected Teeth",
              plan.selectedTeethDetails.map((t) => t.number).join(", "),
            ]);
          }
          autoTable(doc, {
            startY: currentY,
            head: [],
            body: treatmentData,
            theme: "striped",
            styles: {
              cellPadding: 3,
              overflow: "linebreak",
              fontSize: 9,
              minCellHeight: 8,
              halign: "left",
              valign: "middle",
            },
            headStyles: { fillColor: [41, 128, 185] },
            columnStyles: {
              0: { cellWidth: 40, fontStyle: "bold" },
              1: { cellWidth: "auto", overflow: "linebreak" },
            },
            margin: { left: 14, right: 14 },
            tableWidth: "auto",
            didParseCell: function (data) {
              // Ensure text fits by adjusting font size if needed
              if (data.cell.text && data.cell.text.length > 40) {
                data.cell.styles.fontSize = 8;
              }
            },
          });

          currentY = doc.previousAutoTable?.finalY || currentY;
          currentY += 15;

          // Daily treatments table (if available)
          if (
            plan.selectedTeethDetails &&
            plan.selectedTeethDetails.length > 0
          ) {
            const dailyTreatments = plan.selectedTeethDetails.flatMap(
              (tooth) => (tooth.dailyTreatments || []) as DailyTreatment[]
            );

            if (dailyTreatments.length > 0) {
              if (currentY > 220) {
                doc.addPage();
                currentY = 20;
              }
              doc.setFontSize(11);
              doc.setTextColor(0);

              // Add light background for subtitle
              doc.setFillColor(245, 247, 250); // Very light blue-gray
              doc.rect(10, currentY - 4, 120, 8, "F");

              doc.text(`Daily Treatments for Plan ${index + 1}:`, 14, currentY);
              currentY += 15; // Increased spacing between title and content

              const dailyTreatmentData = dailyTreatments.map((dt) => [
                formatSafeDate(dt.date || ""),
                dt.procedure || "-",
                `Rs. ${dt.treatmentAmount || 0}`,
                `Rs. ${dt.paidAmount || 0}`,
                dt.notes || "-",
              ]);
              autoTable(doc, {
                startY: currentY,
                head: [["Date", "Procedure", "Amount", "Paid", "Notes"]],
                body: dailyTreatmentData,
                theme: "striped",
                styles: {
                  cellPadding: 2,
                  overflow: "linebreak",
                  fontSize: 8,
                  minCellHeight: 7,
                  halign: "left",
                  valign: "middle",
                },
                headStyles: {
                  fillColor: [41, 128, 185],
                  fontSize: 8,
                  fontStyle: "bold",
                  halign: "center",
                },
                columnStyles: {
                  0: { cellWidth: 30 }, // Date
                  1: { cellWidth: 50, overflow: "linebreak" }, // Procedure
                  2: { cellWidth: 25, halign: "right" }, // Amount
                  3: { cellWidth: 25, halign: "right" }, // Paid
                  4: { cellWidth: "auto", overflow: "linebreak" }, // Notes
                },
                margin: { left: 14, right: 14 },
                tableWidth: "auto",
                didParseCell: function (data) {
                  // Ensure text fits by adjusting font size if needed
                  if (
                    data.column.index === 4 &&
                    data.cell.text &&
                    data.cell.text.length > 30
                  ) {
                    data.cell.styles.fontSize = 7;
                  }
                },
              });

              currentY = doc.previousAutoTable?.finalY || currentY;
              currentY += 15;
            }
          }
        });
      }

      // Service Payments Section
      if (servicePayments && servicePayments.length > 0) {
        if (currentY > 200) {
          doc.addPage();
          currentY = 20;
        }
        doc.setFontSize(14);
        doc.setTextColor(0);

        // Add background for the title
        doc.setFillColor(240, 240, 240); // Light gray background
        doc.rect(10, currentY - 5, 190, 10, "F"); // x, y, width, height, 'F' = Fill

        doc.text("Service Payments", 14, currentY);
        currentY += 20; // Significantly increased spacing between title and content

        const servicePaymentData = servicePayments.map((payment) => [
          formatSafeDate(payment.date || ""),
          payment.serviceType || "-",
          `Rs. ${payment.amount || 0}`,
          payment.paymentMethod || "-",
          payment.description || "-",
        ]);
        autoTable(doc, {
          startY: currentY,
          head: [["Date", "Service", "Amount", "Payment Method", "Notes"]],
          body: servicePaymentData,
          theme: "striped",
          styles: {
            cellPadding: 2,
            overflow: "linebreak",
            fontSize: 8,
            minCellHeight: 7,
            halign: "left",
            valign: "middle",
          },
          headStyles: {
            fillColor: [41, 128, 185],
            fontSize: 8,
            fontStyle: "bold",
            halign: "center",
          },
          columnStyles: {
            0: { cellWidth: 25 }, // Date
            1: { cellWidth: 30, overflow: "linebreak" }, // Service Type
            2: { cellWidth: 25, halign: "right" }, // Amount
            3: { cellWidth: 30 }, // Payment Method
            4: { cellWidth: "auto", overflow: "linebreak" }, // Description
          },
          margin: { left: 14, right: 14 },
          tableWidth: "auto",
        });

        currentY = doc.previousAutoTable?.finalY || currentY;
        currentY += 15;
      }

      // Prescriptions Section
      if (prescriptions && prescriptions.length > 0) {
        if (currentY > 200) {
          doc.addPage();
          currentY = 20;
        }
        doc.setFontSize(14);
        doc.setTextColor(0);

        // Add background for the title
        doc.setFillColor(240, 240, 240); // Light gray background
        doc.rect(10, currentY - 5, 190, 10, "F"); // x, y, width, height, 'F' = Fill

        doc.text("Prescriptions", 14, currentY);
        currentY += 20; // Significantly increased spacing between title and content

        const prescriptionData = prescriptions.map((prescription) => [
          formatSafeDate(prescription.date || ""),
          prescription.diagnosis || "-",
          prescription.doctor?.name || "-",
        ]);
        autoTable(doc, {
          startY: currentY,
          head: [["Date", "Diagnosis", "Doctor"]],
          body: prescriptionData,
          theme: "striped",
          styles: {
            cellPadding: 2,
            overflow: "linebreak",
            fontSize: 8,
            minCellHeight: 7,
            halign: "left",
            valign: "middle",
          },
          headStyles: {
            fillColor: [41, 128, 185],
            fontSize: 8,
            fontStyle: "bold",
            halign: "center",
          },
          columnStyles: {
            0: { cellWidth: 25 }, // Date
            1: { cellWidth: "auto", overflow: "linebreak" }, // Diagnosis
            2: { cellWidth: 40 }, // Doctor
          },
          margin: { left: 14, right: 14 },
          tableWidth: "auto",
        });

        currentY = doc.previousAutoTable?.finalY || currentY;
        currentY += 15;

        // Detailed prescriptions with medications
        prescriptions.forEach((prescription, index) => {
          if (currentY > 220) {
            doc.addPage();
            currentY = 20;
          }
          if (prescription.medications && prescription.medications.length > 0) {
            doc.setFontSize(12);
            doc.setTextColor(41, 128, 185);

            // Add light background for subtitle
            doc.setFillColor(245, 245, 250); // Very light blue-gray
            doc.rect(10, currentY - 4, 150, 8, "F");

            doc.text(`Prescription #${index + 1} Medications:`, 14, currentY);
            currentY += 15; // Increased spacing between title and content

            const medicationData = prescription.medications.map((med: any) => [
              med.name || "-",
              med.dosage || "-",
              med.frequency || "-",
              med.duration || "-",
              med.instructions || "-",
            ]);
            autoTable(doc, {
              startY: currentY,
              head: [
                [
                  "Medication",
                  "Dosage",
                  "Frequency",
                  "Duration",
                  "Instructions",
                ],
              ],
              body: medicationData,
              theme: "striped",
              styles: {
                cellPadding: 2,
                overflow: "linebreak",
                fontSize: 8,
                minCellHeight: 7,
                halign: "left",
                valign: "middle",
              },
              headStyles: {
                fillColor: [41, 128, 185],
                fontSize: 8,
                fontStyle: "bold",
                halign: "center",
              },
              columnStyles: {
                0: { cellWidth: 35 }, // Medication
                1: { cellWidth: 25 }, // Dosage
                2: { cellWidth: 25 }, // Frequency
                3: { cellWidth: 25 }, // Duration
                4: { cellWidth: "auto", overflow: "linebreak" }, // Instructions
              },
              margin: { left: 14, right: 14 },
              tableWidth: "auto",
            });

            currentY = doc.previousAutoTable?.finalY || currentY;
            currentY += 15;
          }
        });
      }

      // Financial Summary Section
      if (currentY > 200) {
        doc.addPage();
        currentY = 20;
      }
      doc.setFontSize(14);
      doc.setTextColor(0);

      // Add background for the title
      doc.setFillColor(240, 240, 240); // Light gray background
      doc.rect(10, currentY - 5, 190, 10, "F"); // x, y, width, height, 'F' = Fill

      doc.text("Financial Summary", 14, currentY);
      currentY += 20; // Significantly increased spacing between title and content

      // Calculate service payments total
      const servicePaymentsTotal = servicePayments.reduce(
        (sum, payment) => sum + (payment.amount || 0),
        0
      );

      const financialData = [
        ["Treatment Total", `Rs. ${totalAmount || 0}`],
        ["Treatment Paid", `Rs. ${paidAmount || 0}`],
        ["Treatment Balance", `Rs. ${remainingAmount || 0}`],
        ["Service Payments", `Rs. ${servicePaymentsTotal || 0}`],
        ["Total Paid", `Rs. ${paidAmount + servicePaymentsTotal || 0}`],
      ];

      autoTable(doc, {
        startY: currentY,
        head: [],
        body: financialData,
        theme: "striped",
        styles: {
          cellPadding: 3,
          overflow: "linebreak",
          fontSize: 9,
          minCellHeight: 8,
          halign: "left",
          valign: "middle",
        },
        headStyles: { fillColor: [41, 128, 185] },
        columnStyles: {
          0: { cellWidth: 40, fontStyle: "bold" },
          1: { cellWidth: "auto", fontStyle: "bold", halign: "right" },
        },
        margin: { left: 14, right: 14 },
        tableWidth: "auto",
      });

      // Footer on each page
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Generated on ${new Date().toLocaleDateString()} - Page ${i} of ${pageCount}`,
          105,
          doc.internal.pageSize.height - 10,
          { align: "center" }
        );
      }

      // Save the PDF with a proper filename
      doc.save(`${localPatient.personalDetails.name}_medical_record.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF. Please try again.");
    }
  };
  return (
    <Drawer open={isOpen} onOpenChange={() => onClose()}>
      <DrawerContent className="h-[95vh] max-h-[95vh]">
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">
          <DrawerHeader className="border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-2">
            <div className="flex flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 border border-primary/20 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {getInitials(localPatient.personalDetails.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {localPatient.personalDetails.name}
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleSpeech}
                      className={`rounded-full w-6 h-6 ${isSpeaking ? "bg-blue-100 dark:bg-blue-900" : ""}`}
                      title={
                        isSpeaking ? "Stop reading" : "Read patient details"
                      }
                    >
                      <Volume2
                        className={`w-3 h-3 ${isSpeaking ? "text-blue-600 dark:text-blue-300" : "text-gray-500"}`}
                      />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    ID: {patient._id}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={exportPatientPDF}
                  className="h-8 px-2 text-xs bg-primary hover:bg-primary/90"
                >
                  <Download className="w-3 h-3 mr-1" />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="h-8 px-2 text-xs"
                >
                  <X className="w-3 h-3 mr-1" />
                  Close
                </Button>
              </div>
            </div>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto custom-scrollbar px-2 py-1">
            <Tabs defaultValue="overview" className="space-y-2">
              <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm py-1 -mx-2 px-2 border-b border-gray-100 dark:border-gray-800">
                <TabsList className="w-full h-auto grid grid-cols-5 bg-gray-100 dark:bg-gray-800/50 p-0.5 rounded-md gap-0.5">
                  <TabsTrigger
                    value="overview"
                    className="text-xs whitespace-nowrap px-1 py-1.5"
                  >
                    Overview
                  </TabsTrigger>
                  <TabsTrigger
                    value="timeline"
                    className="text-xs whitespace-nowrap px-1 py-1.5"
                  >
                    Timeline
                  </TabsTrigger>
                  <TabsTrigger
                    value="prescriptions"
                    className="text-xs whitespace-nowrap px-1 py-1.5"
                  >
                    Rx
                  </TabsTrigger>
                  <TabsTrigger
                    value="service-payments"
                    className="text-xs whitespace-nowrap px-1 py-1.5"
                  >
                    Payments
                  </TabsTrigger>
                  <TabsTrigger
                    value="documents"
                    className="text-xs whitespace-nowrap px-1 py-1.5"
                  >
                    Docs
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="overview" className="pb-3">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  {/* Left column - Personal Info and Treatment Progress (70-80% width) */}
                  <div className="lg:col-span-3 space-y-4">
                    {/* Enhanced Personal Information */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-900/50 rounded-lg overflow-hidden">
                        <CardHeader className="pb-2 border-b border-gray-100 dark:border-gray-800 p-3">
                          <CardTitle className="text-lg flex items-center gap-2 text-gray-800 dark:text-gray-100">
                            <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                              <User className="h-4 w-4" />
                            </div>
                            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent font-semibold">
                              Personal Information
                            </span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3">
                          {/* Personal Information Cards */}
                          <motion.div
                            className="grid grid-cols-2 lg:grid-cols-3 gap-2"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ staggerChildren: 0.05 }}
                          >
                            <motion.div
                              className="group border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                            >
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                                  <FileText className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Patient ID
                                  </p>
                                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                    {patient._id}
                                  </p>
                                </div>
                              </div>
                            </motion.div>

                            <motion.div
                              className="group border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.05 }}
                            >
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
                                  <UserCheck className="h-3 w-3 text-green-600 dark:text-green-400" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Full Name
                                  </p>
                                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                    {localPatient.personalDetails.name}
                                  </p>
                                </div>
                              </div>
                            </motion.div>

                            <motion.div
                              className="group border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.1 }}
                            >
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
                                  <Phone className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Contact
                                  </p>
                                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {localPatient.personalDetails.contactNumber}
                                  </p>
                                </div>
                              </div>
                            </motion.div>

                            <motion.div
                              className="group border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.15 }}
                            >
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-lg bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center">
                                  <Mail className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Email
                                  </p>
                                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                    {localPatient.personalDetails.emailAddress ||
                                      "Not provided"}
                                  </p>
                                </div>
                              </div>
                            </motion.div>

                            <motion.div
                              className="group border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.2 }}
                            >
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-lg bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
                                  <MapPin className="h-3 w-3 text-red-600 dark:text-red-400" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Address
                                  </p>
                                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                    {localPatient.personalDetails.address ||
                                      "Not provided"}
                                  </p>
                                </div>
                              </div>
                            </motion.div>

                            <motion.div
                              className="group border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}  
                              transition={{ delay: 0.25 }}
                            >
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center">
                                  <Users className="h-3 w-3 text-teal-600 dark:text-teal-400" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Demographics
                                  </p>
                                  <div className="flex flex-wrap gap-1 mt-0.5">
                                    <Badge
                                      variant="outline"
                                      className="bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 text-xs px-1 py-0.5 rounded"
                                    >
                                      {localPatient.personalDetails.gender ||
                                        "Not specified"}
                                    </Badge>
                                    <Badge
                                      variant="outline"
                                      className="bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 text-xs px-1 py-0.5 rounded"
                                    >
                                      {localPatient.personalDetails.age
                                        ? `Age: ${localPatient.personalDetails.age}`
                                        : "Adult"}
                                    </Badge>
                                    <div className="flex items-center gap-1">
                                      <Badge
                                        variant="outline"
                                        className={`text-xs px-1 py-0.5 rounded ${
                                          localPatient.patientStatus === 'New'
                                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
                                            : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                                        }`}
                                      >
                                        {localPatient.patientStatus || 'New'}
                                      </Badge>
                                      <button
                                        onClick={() => setShowStatusEditDialog(true)}
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                        title="Edit patient status"
                                      >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          </motion.div>
                        </CardContent>
                      </Card>
                    </motion.div>

                    {/* Compact Medical Information */}
                    {localPatient.medicalDetails.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.3 }}
                      >
                        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-900/50 rounded-lg overflow-hidden">
                          <CardHeader className="pb-2 border-b border-gray-100 dark:border-gray-800 p-3">
                            <CardTitle className="text-lg flex items-center gap-2 text-gray-800 dark:text-gray-100">
                              <div className="p-1.5 rounded-lg bg-gradient-to-br from-red-500 to-pink-600 text-white">
                                <Heart className="h-4 w-4" />
                              </div>
                              <span className="bg-gradient-to-r from-red-600 to-pink-600 dark:from-red-400 dark:to-pink-400 bg-clip-text text-transparent font-semibold">
                                Medical History
                              </span>
                              <Badge className="ml-auto bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 text-xs px-2 py-1">
                                {localPatient.medicalDetails.length} Record{localPatient.medicalDetails.length > 1 ? 's' : ''}
                              </Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardHeader className="pb-2 border-b border-gray-100 dark:border-gray-800 p-2">
                            <CardTitle className="text-sm flex items-center gap-2 text-gray-800 dark:text-gray-100">
                              <div className="p-1 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                                <ClipboardList className="h-3.5 w-3.5" />
                              </div>
                              <span className="text-sm font-semibold">Treatment Plans</span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-2 space-y-2">
                            {localPatient.medicalDetails.map((record, index) => (
                              <div key={record._id}>
                                {index > 0 && <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mb-2" />}

                                {/* Treatment Planning */}
                                {record.treatmentPlanning && record.treatmentPlanning.length > 0 && (
                                  <div className="space-y-3 pt-2">
                                    {record.treatmentPlanning.map((treatment, treatmentIndex) => {
                                      // Create a map of selected teeth for the dental chart
                                      const selectedTeethMap: Record<string, any> = {};
                                      if (treatment.selectedTeethDetails) {
                                        treatment.selectedTeethDetails.forEach((tooth) => {
                                          selectedTeethMap[tooth.number] = tooth;
                                        });
                                      }

                                      return (
                                        <div key={treatment._id} className="border border-indigo-200 dark:border-indigo-800/50 bg-indigo-50 dark:bg-indigo-900/10 p-2 rounded-md space-y-2">
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1">
                                              <ClipboardList className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                                              <h4 className="text-xs font-semibold text-indigo-800 dark:text-indigo-200">
                                                Treatment Plan #{treatmentIndex + 1}
                                              </h4>
                                            </div>
                                            {treatment.isCompleted && (
                                              <Badge className="bg-green-100 text-green-700 text-xs px-1.5 py-0">
                                                <CheckCircle className="w-2.5 h-2.5 mr-0.5" />
                                                Completed
                                              </Badge>
                                            )}
                                          </div>

                                          {/* Dental Chart */}
                                          {treatment.selectedTeethDetails && treatment.selectedTeethDetails.length > 0 && (
                                            <div className="bg-white dark:bg-gray-800 p-2 rounded border border-indigo-200 dark:border-indigo-800/30">
                                              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Dental Chart</p>
                                              <div className="scale-75 origin-top-left w-[133%]">
                                                {treatment.isChildDentition ? (
                                                  <ChildDentalChart
                                                    selectedTeeth={selectedTeethMap}
                                                    onToothSelect={() => {}}
                                                    readOnly={true}
                                                  />
                                                ) : (
                                                  <DentalChart
                                                    selectedTeeth={selectedTeethMap}
                                                    onToothSelect={() => {}}
                                                    readOnly={true}
                                                  />
                                                )}
                                              </div>

                                                  {/* Selected Teeth Details - Comprehensive */}
                                              <div className="mt-2 space-y-1.5">
                                                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Selected Teeth Details:</p>
                                                <div className="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar">
                                                  {treatment.selectedTeethDetails.map((tooth) => {
                                                    // Get all unique doctors from daily treatments
                                                    const doctors = tooth.dailyTreatments
                                                      ?.filter((dt: any) => dt.treatedByDoctor)
                                                      .map((dt: any) => dt.treatedByDoctor)
                                                      .filter((value: string, index: number, self: string[]) => self.indexOf(value) === index) || [];
                                                    // Get all notes from daily treatments
                                                    const allNotes = tooth.dailyTreatments
                                                      ?.filter((dt: any) => dt.notes)
                                                      .map((dt: any) => dt.notes) || [];

                                                    return (
                                                      <div key={tooth.number} className="bg-white dark:bg-gray-700 p-2 rounded border border-gray-200 dark:border-gray-600 space-y-1">
                                                        {/* Tooth Number, Position, Side */}
                                                        <div className="flex items-center justify-between">
                                                          <div className="flex items-center gap-1.5">
                                                            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">Tooth #{tooth.number}</span>
                                                            {tooth.position && (
                                                              <Badge variant="outline" className="text-xs px-1 py-0 bg-gray-100 dark:bg-gray-800">
                                                                {tooth.position}
                                                              </Badge>
                                                            )}
                                                          </div>
                                                          {tooth.side && (
                                                            <Badge variant="outline" className="text-xs px-1 py-0 bg-blue-50 dark:bg-blue-900/30">
                                                              {tooth.side}
                                                            </Badge>
                                                          )}
                                                        </div>

                                                        {/* Procedure */}
                                                        {tooth.procedure && (
                                                          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-1.5 rounded">
                                                            <span className="text-xs text-gray-500 dark:text-gray-400">Procedure: </span>
                                                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{tooth.procedure}</span>
                                                          </div>
                                                        )}

                                                        {/* Doctor(s) */}
                                                        {doctors && (
                                                          <div className="bg-green-50 dark:bg-green-900/20 p-1.5 rounded">
                                                            <div className="flex items-start gap-1">
                                                              <UserCheck className="w-3 h-3 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                                                              <div className="flex-1 min-w-0">
                                                                <span className="text-xs text-gray-500 dark:text-gray-400">Treated by: </span>
                                                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                                                  {doctors[0]?.name}
                                                                </span>
                                                              </div>
                                                            </div>
                                                          </div>
                                                        )}

                                                        {/* Financial Details */}
                                                        <div className="grid grid-cols-3 gap-1">
                                                          {tooth.totalTreatmentAmount !== undefined && (
                                                            <div className="bg-blue-50 dark:bg-blue-900/20 p-1.5 rounded">
                                                              <p className="text-xs text-blue-600 dark:text-blue-400 mb-0.5">Total</p>
                                                              <p className="text-xs font-bold text-blue-700 dark:text-blue-300">
                                                                Rs. {tooth.totalTreatmentAmount.toLocaleString()}
                                                              </p>
                                                            </div>
                                                          )}
                                                          {tooth.totalPaidAmount !== undefined && (
                                                            <div className="bg-green-50 dark:bg-green-900/20 p-1.5 rounded">
                                                              <p className="text-xs text-green-600 dark:text-green-400 mb-0.5">Paid</p>
                                                              <p className="text-xs font-bold text-green-700 dark:text-green-300">
                                                                Rs. {tooth.totalPaidAmount.toLocaleString()}
                                                              </p>
                                                            </div>
                                                          )}
                                                          {tooth.totalRemainingAmount !== undefined && (
                                                            <div className="bg-orange-50 dark:bg-orange-900/20 p-1.5 rounded">
                                                              <p className="text-xs text-orange-600 dark:text-orange-400 mb-0.5">Due</p>
                                                              <p className="text-xs font-bold text-orange-700 dark:text-orange-300">
                                                                Rs. {tooth.totalRemainingAmount.toLocaleString()}
                                                              </p>
                                                            </div>
                                                          )}
                                                        </div>

                                                        {/* Details/Notes */}
                                                        {tooth.details && (
                                                          <div className="bg-gray-50 dark:bg-gray-800/50 p-1.5 rounded border border-gray-200 dark:border-gray-700">
                                                            <span className="text-xs text-gray-600 dark:text-gray-400">Details: </span>
                                                            <span className="text-xs text-gray-700 dark:text-gray-300">{tooth.details}</span>
                                                          </div>
                                                        )}

                                                        {/* Treatment Notes */}
                                                        {allNotes.length > 0 && (
                                                          <div className="bg-yellow-50 dark:bg-yellow-900/10 p-1.5 rounded border border-yellow-200 dark:border-yellow-800/30">
                                                            <p className="text-xs font-medium text-yellow-700 dark:text-yellow-300 mb-0.5">Treatment Notes:</p>
                                                            <div className="space-y-0.5">
                                                              {allNotes.map((note: string, idx: number) => (
                                                                <p key={idx} className="text-xs text-gray-700 dark:text-gray-300">• {note}</p>
                                                              ))}
                                                            </div>
                                                          </div>
                                                        )}

                                                        {/* Daily Treatments Count */}
                                                        {tooth.dailyTreatments && tooth.dailyTreatments.length > 0 && (
                                                          <div className="pt-1 border-t border-gray-200 dark:border-gray-600">
                                                            <Badge variant="outline" className="text-xs">
                                                              {tooth.dailyTreatments.length} treatment session{tooth.dailyTreatments.length > 1 ? 's' : ''}
                                                            </Badge>
                                                          </div>
                                                        )}
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                              </div>
                                            </div>
                                          )}

                                          {/* Treatment Details */}
                                          {treatment.treatmentDetails && (
                                            <div className="bg-white dark:bg-gray-800 p-2 rounded border border-indigo-200 dark:border-indigo-800/30">
                                              <div>
                                                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Treatment Details:</p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{treatment.treatmentDetails}</p>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}

                    {/* Treatment Progress - Compact View */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.4 }}
                    >
                      <TreatmentProgress
                        totalAmount={totalAmount}
                        paidAmount={paidAmount}
                        remainingAmount={remainingAmount}
                        treatments={allTreatments}
                        compact={true}
                      />
                    </motion.div>
                  </div>

                  {/* Right column - Important Information (20-30% width) */}
                  <div className="lg:col-span-1 space-y-3">
                    {/* Important Dates Card */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                    >
                      <Card className="border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-900/50 rounded-lg overflow-hidden">
                        <CardHeader className="pb-2 border-b border-gray-100 dark:border-gray-800 p-2">
                          <CardTitle className="text-sm flex items-center gap-1.5 text-gray-800 dark:text-gray-100">
                            <div className="p-1 rounded-md bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                              <Calendar className="h-3.5 w-3.5" />
                            </div>
                            <span className="bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent font-semibold">
                              Important Dates
                            </span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 p-2">
                          <DateDisplay
                            englishDate={localPatient.personalDetails.dob}
                            nepaliDate=""
                            label="Date of Birth"
                            icon={CalendarDays}
                            color="text-purple-500"
                          />

                          <DateDisplay
                            englishDate={localPatient.personalDetails.checkUpDate}
                            nepaliDate={localPatient.personalDetails.checkUpDateNp}
                            label="First Check-up Date"
                            icon={CalendarCheck}
                            color="text-blue-500"
                          />

                          <DateDisplay
                            englishDate={localPatient.createdAt}
                            nepaliDate=""
                            label="Registration Date"
                            icon={CalendarPlus}
                            color="text-green-500"
                          />
                        </CardContent>
                      </Card>
                    </motion.div>

                    {/* Patient Group & Check-up Date */}
                    {localPatient.medicalDetails.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.15 }}
                      >
                        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-900/50 rounded-lg overflow-hidden">
                          <CardHeader className="pb-2 border-b border-gray-100 dark:border-gray-800 p-2">
                            <CardTitle className="text-sm flex items-center gap-1.5 text-gray-800 dark:text-gray-100">
                              <div className="p-1 rounded-md bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                                <Users className="h-3.5 w-3.5" />
                              </div>
                              <span className="text-sm font-semibold">Patient Info</span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-2 space-y-2">
                            {localPatient.medicalDetails[0] && (
                              <div className="border border-green-200 dark:border-green-800/50 bg-green-50 dark:bg-green-900/10 p-2 rounded-md">
                                <div className="flex items-center gap-1 mb-1">
                                  <Users className="w-3 h-3 text-green-600 dark:text-green-400" />
                                  <h4 className="text-xs font-medium text-green-800 dark:text-green-200">Patient Group</h4>
                                </div>
                                <p className="text-xs text-gray-700 dark:text-gray-300 font-semibold">
                                  {localPatient.medicalDetails[0].group || "General"}
                                </p>
                              </div>
                            )}
                            {localPatient.personalDetails.checkUpDate && (
                              <div className="border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-900/10 p-2 rounded-md">
                                <div className="flex items-center gap-1 mb-1">
                                  <CalendarCheck className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                  <h4 className="text-xs font-medium text-blue-800 dark:text-blue-200">Check-up Date</h4>
                                </div>
                                <p className="text-xs text-gray-700 dark:text-gray-300">
                                  {formatSafeDate(localPatient.personalDetails.checkUpDate)}
                                </p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}

                    {/* Chief Complaint & Diagnosis */}
                    {localPatient.medicalDetails.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.18 }}
                      >
                        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-900/50 rounded-lg overflow-hidden">
                          <CardHeader className="pb-2 border-b border-gray-100 dark:border-gray-800 p-2">
                            <CardTitle className="text-sm flex items-center gap-1.5 text-gray-800 dark:text-gray-100">
                              <div className="p-1 rounded-md bg-gradient-to-br from-yellow-500 to-orange-600 text-white">
                                <AlertTriangle className="h-3.5 w-3.5" />
                              </div>
                              <span className="text-sm font-semibold">Clinical Findings</span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-2 space-y-2">
                            {localPatient.medicalDetails.map((record, index) => (
                              <div key={`chief-right-${record._id}`} className="space-y-2">
                                {record.chiefComplaint && (
                                  <div className="border-l-4 border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/10 p-2 rounded">
                                    <div className="flex items-start gap-2">
                                      <AlertTriangle className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                                      <div className="flex-1 min-w-0">
                                        <h4 className="text-xs font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                                          Chief Complaint {localPatient.medicalDetails.length > 1 ? `#${index + 1}` : ''}
                                        </h4>
                                        <p className="text-xs text-gray-700 dark:text-gray-300">{record.chiefComplaint}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {record.diagnosis && (
                                  <div className="border-l-4 border-l-green-500 bg-green-50 dark:bg-green-900/10 p-2 rounded">
                                    <div className="flex items-start gap-2">
                                      <CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                                      <div className="flex-1 min-w-0">
                                        <h4 className="text-xs font-semibold text-green-800 dark:text-green-200 mb-1">
                                          Diagnosis {localPatient.medicalDetails.length > 1 ? `#${index + 1}` : ''}
                                        </h4>
                                        <p className="text-xs text-gray-700 dark:text-gray-300">{record.diagnosis}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}

                    {/* Investigation Details */}
                    {localPatient.medicalDetails.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                      >
                        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-900/50 rounded-lg overflow-hidden">
                          <CardHeader className="pb-2 border-b border-gray-100 dark:border-gray-800 p-2">
                            <CardTitle className="text-sm flex items-center gap-2 text-gray-800 dark:text-gray-100">
                              <div className="p-1 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
                                <Microscope className="h-3.5 w-3.5" />
                              </div>
                              <span className="text-sm font-semibold">Investigation Results</span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-2 space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
                            {localPatient.medicalDetails.map((record, index) => (
                              record.investigation && (
                                <div key={`investigation-right-${record._id}`} className="space-y-1.5">
                                  {index > 0 && <div className="border-t border-gray-200 dark:border-gray-700 pt-2" />}

                                  {record.investigation.blood && (
                                    <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-200 dark:border-red-800/30">
                                      <div className="flex items-center gap-1 mb-1">
                                        <Droplets className="w-3 h-3 text-red-600 dark:text-red-400" />
                                        <p className="text-xs font-semibold text-red-700 dark:text-red-300">Blood Test</p>
                                      </div>
                                      <p className="text-xs text-gray-700 dark:text-gray-300">{record.investigation.blood}</p>
                                      {record.investigation.bloodTestDate && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                          Date: {formatSafeDate(record.investigation.bloodTestDate)}
                                        </p>
                                      )}
                                    </div>
                                  )}

                                  {record.investigation.xray && (
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded border border-blue-200 dark:border-blue-800/30">
                                      <div className="flex items-center gap-1 mb-1">
                                        <Scan className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                        <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">X-Ray</p>
                                      </div>
                                      <p className="text-xs text-gray-700 dark:text-gray-300">{record.investigation.xray}</p>
                                      {record.investigation.xrayDate && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                          Date: {formatSafeDate(record.investigation.xrayDate)}
                                        </p>
                                      )}
                                      {record.investigation.xrayImages && record.investigation.xrayImages.length > 0 && (
                                        <div className="mt-1.5 flex flex-wrap gap-1">
                                          {record.investigation.xrayImages.map((img: any, idx: number) => (
                                            <a
                                              key={idx}
                                              href={img.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
                                            >
                                              <ImageIcon className="w-2.5 h-2.5" />
                                              Image {idx + 1}
                                            </a>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {record.investigation.otherTests && Array.isArray(record.investigation.otherTests) && record.investigation.otherTests.length > 0 && (
                                    <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded border border-purple-200 dark:border-purple-800/30">
                                      <div className="flex items-center gap-1 mb-1">
                                        <ClipboardList className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                                        <p className="text-xs font-semibold text-purple-700 dark:text-purple-300">Other Tests</p>
                                      </div>
                                      <div className="space-y-1">
                                        {record.investigation.otherTests.map((test: any, idx: number) => (
                                          <div key={idx} className="bg-white dark:bg-gray-800 p-1.5 rounded">
                                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{test.name}</p>
                                            {test.results && (
                                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{test.results}</p>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            ))}
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}

                    {/* Follow-ups Card */}
                    {localPatient.medicalDetails.length > 0 &&
                     localPatient.medicalDetails[0].treatmentPlanning.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                      >
                        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-900/50 rounded-lg overflow-hidden">
                          <CardHeader className="pb-2 border-b border-gray-100 dark:border-gray-800 p-2">
                            <CardTitle className="text-sm flex items-center gap-1">
                              <CalendarCheck className="w-3.5 h-3.5 text-blue-500" />
                              Follow-ups
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-2 max-h-64 overflow-y-auto custom-scrollbar">
                            <FollowUpDisplay
                              followUps={
                                localPatient.medicalDetails[0].treatmentPlanning
                                  .flatMap(plan => plan.followUps || [])
                              }
                            />
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}

                    {/* Medical Conditions Cards */}
                    {localPatient.medicalDetails.length > 0 && localPatient.medicalDetails.map((record, index) => (
                      record.medicalHistory && (
                        <motion.div
                          key={`medical-motion-${record._id}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                        >
                          <Card className="border-l-4 border-l-red-500 border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-900/50">
                            <CardHeader className="pb-2 pt-2 px-2 border-b border-gray-100 dark:border-gray-800">
                              <CardTitle className="text-sm flex items-center gap-1">
                                <HeartPulse className="w-3.5 h-3.5 text-red-500" />
                                Medical Conditions {localPatient.medicalDetails.length > 1 ? `#${index + 1}` : ''}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-2 space-y-1.5">
                              {record.medicalHistory.allergies && (
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-1.5 rounded border border-yellow-200 dark:border-yellow-800/30">
                                  <p className="text-xs font-medium text-yellow-700 dark:text-yellow-300">Allergies</p>
                                  <p className="text-xs text-gray-700 dark:text-gray-300">{record.medicalHistory.allergies}</p>
                                </div>
                              )}
                              {record.medicalHistory.bloodPressure && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-1.5 rounded border border-blue-200 dark:border-blue-800/30">
                                  <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Blood Pressure</p>
                                  <p className="text-xs text-gray-700 dark:text-gray-300">{record.medicalHistory.bloodPressure}</p>
                                </div>
                              )}
                              <div className="flex flex-wrap gap-1">
                                {record.medicalHistory.diabetes && (
                                  <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">Diabetes</Badge>
                                )}
                                {record.medicalHistory.thyroid && (
                                  <Badge variant="secondary" className="text-xs bg-indigo-100 text-indigo-700">Thyroid</Badge>
                                )}
                                {record.medicalHistory.bleedingDisorder && (
                                  <Badge variant="secondary" className="text-xs bg-red-100 text-red-700">Bleeding Disorder</Badge>
                                )}
                                {record.medicalHistory.asthma && (
                                  <Badge variant="secondary" className="text-xs bg-cyan-100 text-cyan-700">Asthma</Badge>
                                )}
                                {record.medicalHistory.pregnancy && (
                                  <Badge variant="secondary" className="text-xs bg-pink-100 text-pink-700">Pregnancy</Badge>
                                )}
                              </div>
                              {record.medicalHistory.otherConditions && (
                                <div className="bg-gray-50 dark:bg-gray-800/50 p-1.5 rounded border border-gray-200 dark:border-gray-700">
                                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Other Conditions</p>
                                  <p className="text-xs text-gray-600 dark:text-gray-400">{record.medicalHistory.otherConditions}</p>
                                </div>
                              )}
                              {record.medicalHistory.noMedicalIssues && (
                                <div className="bg-green-50 dark:bg-green-900/20 p-1.5 rounded border border-green-200 dark:border-green-800/30">
                                  <div className="flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3 text-green-600" />
                                    <p className="text-xs font-medium text-green-700 dark:text-green-300">No significant medical issues</p>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      )
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="timeline" className="pb-3">
                <Card className="border-none shadow-sm bg-card">
                  <CardHeader className="pb-2 p-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-primary" />
                      Medical History Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3">
                    <MedicalTimeline
                      medicalDetails={localPatient.medicalDetails}
                      onSelectRecord={(id) => {
                        setSelectedMedicalRecordId(id);
                        // Optionally switch to medical records tab to show details
                        const tabsList =
                          document.querySelector('[value="medical"]');
                        if (tabsList instanceof HTMLElement) {
                          tabsList.click();
                        }
                      }}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documents" className="pb-3">
                <Card className="border-none shadow-sm bg-card">
                  <CardHeader className="pb-2 p-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileDigit className="h-4 w-4 text-primary" />
                      Documents
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3">
                    {allDocuments.length === 0 &&
                    patientDocuments.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center bg-muted/30 rounded-lg">
                        <FileDigit className="h-12 w-12 text-muted-foreground mb-3" />
                        <h3 className="text-lg font-medium">No Documents</h3>
                        <p className="text-sm text-muted-foreground max-w-md mt-1">
                          This patient doesn't have any documents uploaded yet.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <DocumentComparison
                          documents={allTreatmentDocuments}
                          patientDocuments={patientDocuments}
                        />
                      </div>
                    )}

                    {/* Add upload button */}
                    <div className="flex justify-end mt-4">
                      <PatientDocumentUploadButton
                        patientId={localPatient._id}
                        medicalDetailId={localPatient.medicalDetails[0]?._id}
                        onSuccess={() => {
                          // We could refresh the patient data here if needed
                          toast.success("Documents uploaded successfully");
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="prescriptions" className="pb-3">
                <Card className="border-none shadow-sm bg-card">
                  <CardHeader className="pb-2 p-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Pill className="h-4 w-4 text-primary" />
                      Prescriptions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3">
                    {loadingPrescriptions ? (
                      <div className="flex justify-center items-center py-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : prescriptions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center bg-muted/30 rounded-lg">
                        <FileText className="h-12 w-12 text-muted-foreground mb-3" />
                        <h3 className="text-lg font-medium">
                          No Prescriptions
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-md mt-1">
                          This patient doesn't have any prescriptions yet.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Doctor</TableHead>
                              <TableHead>Diagnosis</TableHead>
                              <TableHead>Medications</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {prescriptions.map((prescription) => (
                              <React.Fragment key={prescription._id}>
                                <TableRow>
                                  <TableCell className="font-medium">
                                    {format(
                                      new Date(prescription.createdAt),
                                      "dd MMM yyyy"
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {prescription.doctor?.name || "Unknown"}
                                  </TableCell>
                                  <TableCell>
                                    {prescription.diagnosis || "N/A"}
                                  </TableCell>
                                  <TableCell>
                                    {prescription.medications?.length || 0}{" "}
                                    medications
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setExpandedPrescription(
                                          expandedPrescription ===
                                            prescription._id
                                            ? null
                                            : prescription._id
                                        );
                                      }}
                                    >
                                      <FileText className="h-4 w-4 mr-1" />
                                      {expandedPrescription === prescription._id
                                        ? "Hide"
                                        : "View"}
                                    </Button>
                                  </TableCell>
                                </TableRow>
                                {expandedPrescription === prescription._id && (
                                  <TableRow>
                                    <TableCell
                                      colSpan={5}
                                      className="p-0 border-t-0"
                                    >
                                      <div className="p-5 bg-white dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow duration-300">
                                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-3">
                                          <FolderOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                          Treatment Documents
                                        </h4>
                                        <div className="space-y-3">
                                          {prescription.medications &&
                                          prescription.medications.length >
                                            0 ? (
                                            <div className="space-y-2">
                                              {prescription.medications.map(
                                                (med: any, index: number) => (
                                                  <div
                                                    key={index}
                                                    className="bg-background p-3 rounded-md"
                                                  >
                                                    <div className="flex justify-between">
                                                      <p className="font-medium">
                                                        {med.name}
                                                      </p>
                                                      <p>{med.dosage}</p>
                                                    </div>
                                                    <div className="mt-1 text-sm">
                                                      <p>
                                                        Frequency:{" "}
                                                        {med.frequency}
                                                      </p>
                                                      <p>
                                                        Duration: {med.duration}
                                                      </p>
                                                      {med.notes && (
                                                        <p>
                                                          Notes: {med.notes}
                                                        </p>
                                                      )}
                                                    </div>
                                                  </div>
                                                )
                                              )}
                                            </div>
                                          ) : (
                                            <p className="text-sm text-muted-foreground">
                                              No medications listed
                                            </p>
                                          )}
                                        </div>

                                        {prescription.instructions && (
                                          <div className="mb-4">
                                            <h4 className="text-sm font-semibold mb-2">
                                              Instructions
                                            </h4>
                                            <p className="text-sm">
                                              {prescription.instructions}
                                            </p>
                                          </div>
                                        )}

                                        <div className="flex justify-between text-xs text-muted-foreground">
                                          <p>
                                            Doctor:{" "}
                                            {prescription.doctor?.name ||
                                              "Unknown"}
                                          </p>
                                          <p>
                                            Created:{" "}
                                            {format(
                                              new Date(prescription.createdAt),
                                              "dd MMM yyyy, HH:mm"
                                            )}
                                          </p>
                                        </div>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </React.Fragment>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="service-payments" className="pb-3">
                <Card className="border-none shadow-sm bg-card">
                  <CardHeader className="pb-2 p-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileDigit className="h-4 w-4 text-primary" />
                      Service Payments
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3">
                    {loadingServicePayments ? (
                      <div className="flex justify-center items-center py-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : servicePayments.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center bg-muted/30 rounded-lg">
                        <FileText className="h-12 w-12 text-muted-foreground mb-3" />
                        <h3 className="text-lg font-medium">
                          No Service Payments
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-md mt-1">
                          This patient doesn't have any service payments yet.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Service Type</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Payment Method</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {servicePayments.map((payment) => (
                              <TableRow key={payment._id}>
                                <TableCell className="font-medium">
                                  {formatSafeDate(payment.date)}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="bg-card">
                                    {payment.serviceType}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {payment.description || "N/A"}
                                </TableCell>
                                <TableCell className="font-medium">
                                  ₹{payment.amount}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "bg-card",
                                      payment.paymentMethod === "Cash" &&
                                        "border-green-200 text-green-700 dark:border-green-800 dark:text-green-300",
                                      payment.paymentMethod === "Credit Card" &&
                                        "border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-300",
                                      payment.paymentMethod === "Debit Card" &&
                                        "border-indigo-200 text-indigo-700 dark:border-indigo-800 dark:text-indigo-300",
                                      payment.paymentMethod === "Insurance" &&
                                        "border-purple-200 text-purple-700 dark:border-purple-800 dark:text-purple-300",
                                      payment.paymentMethod ===
                                        "Bank Transfer" &&
                                        "border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-300"
                                    )}
                                  >
                                    {payment.paymentMethod}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>

                        {/* Financial Summary */}
                        <div className="mt-6 p-4 bg-muted/10 rounded-md">
                          <h3 className="text-sm font-medium mb-3">
                            Service Payments Summary
                          </h3>
                          <div className="grid grid-cols-3 gap-4">
                            {(() => {
                              // Calculate totals
                              const totalAmount = servicePayments.reduce(
                                (sum, payment) => sum + payment.amount,
                                0
                              );
                              // Count by service type
                              const serviceTypeCounts = servicePayments.reduce(
                                (acc, payment) => {
                                  acc[payment.serviceType] =
                                    (acc[payment.serviceType] || 0) + 1;
                                  return acc;
                                },
                                {} as Record<string, number>
                              );

                              // Count payment methods but not using this yet - keeping for future use
                              /* const paymentMethodCounts = servicePayments.reduce((acc, payment) => {
                                acc[payment.paymentMethod] = (acc[payment.paymentMethod] || 0) + 1;
                                return acc;
                              }, {} as Record<string, number>); */

                              return (
                                <>
                                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                                    <p className="text-xs text-muted-foreground">
                                      Total Services
                                    </p>
                                    <p className="font-bold text-lg text-blue-600 dark:text-blue-400">
                                      {servicePayments.length}
                                    </p>
                                  </div>
                                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                                    <p className="text-xs text-muted-foreground">
                                      Total Amount
                                    </p>
                                    <p className="font-bold text-lg text-green-600 dark:text-green-400">
                                      ₹{totalAmount}
                                    </p>
                                  </div>
                                  <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-md">
                                    <p className="text-xs text-muted-foreground">
                                      Most Common Service
                                    </p>
                                    <p className="font-bold text-lg text-purple-600 dark:text-purple-400">
                                      {Object.entries(serviceTypeCounts).sort(
                                        (a, b) => b[1] - a[1]
                                      )[0]?.[0] || "N/A"}
                                    </p>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Total Treatment Cost Summary */}
                        <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10 rounded-lg border border-orange-200 dark:border-orange-800/50">
                          <h3 className="text-sm font-medium mb-4 text-orange-800 dark:text-orange-200 flex items-center gap-2">
                            <FileDigit className="h-4 w-4" />
                            Total Treatment Cost Breakdown
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {(() => {
                              // Calculate service payments total
                              const totalServicePayments = servicePayments.reduce(
                                (sum, payment) => sum + payment.amount,
                                0
                              );

                              // Calculate selected teeth treatment total
                              const totalSelectedTeethTreatment = localPatient.medicalDetails.reduce(
                                (medicalSum, medical) => {
                                  return medicalSum + medical.treatmentPlanning.reduce(
                                    (planSum, plan) => {
                                      return planSum + (plan.selectedTeethDetails || []).reduce(
                                        (teethSum, tooth) => {
                                          return teethSum + (tooth.totalTreatmentAmount || 0);
                                        },
                                        0
                                      );
                                    },
                                    0
                                  );
                                },
                                0
                              );

                              // Calculate group treatment total
                              const totalGroupTreatment = localPatient.medicalDetails.reduce(
                                (medicalSum, medical) => {
                                  return medicalSum + medical.treatmentPlanning.reduce(
                                    (planSum, plan) => {
                                      return planSum + (plan.groupTreatmentDetails || []).reduce(
                                        (groupSum, group) => {
                                          return groupSum + (group.totalTreatmentAmount || 0);
                                        },
                                        0
                                      );
                                    },
                                    0
                                  );
                                },
                                0
                              );

                              // Calculate grand total
                              const grandTotal = totalServicePayments + totalSelectedTeethTreatment + totalGroupTreatment;

                              return (
                                <>
                                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800/50">
                                    <p className="text-xs text-muted-foreground mb-1">
                                      Service Payments
                                    </p>
                                    <p className="font-bold text-lg text-blue-600 dark:text-blue-400">
                                      ₹{totalServicePayments}
                                    </p>
                                  </div>
                                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800/50">
                                    <p className="text-xs text-muted-foreground mb-1">
                                      Selected Teeth Treatment
                                    </p>
                                    <p className="font-bold text-lg text-green-600 dark:text-green-400">
                                      ₹{totalSelectedTeethTreatment}
                                    </p>
                                  </div>
                                  <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-md border border-purple-200 dark:border-purple-800/50">
                                    <p className="text-xs text-muted-foreground mb-1">
                                      Group Treatment
                                    </p>
                                    <p className="font-bold text-lg text-purple-600 dark:text-purple-400">
                                      ₹{totalGroupTreatment}
                                    </p>
                                  </div>
                                  <div className="text-center p-3 bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 rounded-md border-2 border-orange-300 dark:border-orange-700/50 shadow-md">
                                    <p className="text-xs text-muted-foreground mb-1 font-medium">
                                      Total Treatment Cost
                                    </p>
                                    <p className="font-bold text-xl text-orange-700 dark:text-orange-300">
                                      ₹{grandTotal}
                                    </p>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DrawerContent>
      
      {/* Payment History Dialog */}
      <PaymentHistoryDialog
        isOpen={isPaymentDialogOpen}
        onClose={() => setIsPaymentDialogOpen(false)}
        selectedTeethMaps={localPatient.medicalDetails.reduce(
          (acc, medicalDetail, medicalDetailIndex) => {
            medicalDetail.treatmentPlanning.forEach((plan, planIndex) => {
              const mapKey = `${medicalDetailIndex}-${planIndex}`;
              acc[mapKey] = {};

              if (plan.selectedTeethDetails) {
                plan.selectedTeethDetails.forEach((tooth) => {
                  acc[mapKey][tooth.number] = tooth;
                });
              }
            });
            return acc;
          },
          {} as Record<string, Record<string, any>>
        )}
        groupTreatmentMaps={localPatient.medicalDetails.reduce(
          (acc, medicalDetail, medicalDetailIndex) => {
            medicalDetail.treatmentPlanning.forEach((plan, planIndex) => {
              const mapKey = `${medicalDetailIndex}-${planIndex}`;
              
              if (plan.groupTreatmentDetails && plan.groupTreatmentDetails.length > 0) {
                acc[mapKey] = plan.groupTreatmentDetails;
              }
            });
            return acc;
          },
          {} as Record<string, any[]>
        )}
        onPaymentUpdate={(mapKey: string, toothNumber: string, treatmentIndex: number, newPaidAmount: number) => {
          // Update the local patient state
          setLocalPatient((prevPatient: Patient) => {
            const updatedPatient = { ...prevPatient };
            const [medicalDetailIndex, planIndex] = mapKey.split("-").map(Number);

            if (
              updatedPatient.medicalDetails[medicalDetailIndex]
                ?.treatmentPlanning[planIndex]?.selectedTeethDetails
            ) {
              const toothToUpdate = updatedPatient.medicalDetails[
                medicalDetailIndex
              ].treatmentPlanning[planIndex].selectedTeethDetails.find(
                (tooth: any) => tooth.number === toothNumber
              );

              if (
                toothToUpdate &&
                toothToUpdate.dailyTreatments &&
                toothToUpdate.dailyTreatments[treatmentIndex]
              ) {
                const treatment = toothToUpdate.dailyTreatments[treatmentIndex];
                treatment.paidAmount = newPaidAmount;
                treatment.remainingAmount = treatment.treatmentAmount - newPaidAmount;
              }
            }

            return updatedPatient;
          });
        }}
        onGroupPaymentUpdate={(mapKey: string, groupIndex: number, treatmentIndex: number, newPaidAmount: number) => {
          // Update the local patient state for group treatments
          setLocalPatient((prevPatient: Patient) => {
            const updatedPatient = { ...prevPatient };
            const [medicalDetailIndex, planIndex] = mapKey.split("-").map(Number);

            if (
              updatedPatient.medicalDetails[medicalDetailIndex]
                ?.treatmentPlanning[planIndex]?.groupTreatmentDetails &&
              updatedPatient.medicalDetails[medicalDetailIndex]
                .treatmentPlanning[planIndex].groupTreatmentDetails[groupIndex]
            ) {
              const groupTreatment = updatedPatient.medicalDetails[
                medicalDetailIndex
              ].treatmentPlanning[planIndex].groupTreatmentDetails[groupIndex];
              
              if (
                groupTreatment.dailyTreatments &&
                groupTreatment.dailyTreatments[treatmentIndex]
              ) {
                const treatment = groupTreatment.dailyTreatments[treatmentIndex];
                treatment.paidAmount = newPaidAmount;
                treatment.remainingAmount = treatment.treatmentAmount - newPaidAmount;
                
                // Update group totals
                const totalPaid = groupTreatment.dailyTreatments.reduce(
                  (sum: number, t: any) => sum + (t.paidAmount || 0), 0
                );
                const totalAmount = groupTreatment.dailyTreatments.reduce(
                  (sum: number, t: any) => sum + (t.treatmentAmount || 0), 0
                );
                
                groupTreatment.totalPaidAmount = totalPaid;
                groupTreatment.totalRemainingAmount = totalAmount - totalPaid;
              }
            }

            return updatedPatient;
          });
        }}
        patientId={patient._id}
        medicalDetailId={patient.medicalDetails[0]?._id || ""}
        patient={localPatient}
      />
      {/* Patient Status Edit Dialog */}
      {showStatusEditDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowStatusEditDialog(false)} />
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 mx-4 relative z-10 shadow-xl">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Update Patient Status
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Change the status for {localPatient.personalDetails.name}
            </p>

            <div className="space-y-3 mb-6">
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="patientStatus"
                  value="New"
                  checked={newPatientStatus === "New"}
                  onChange={(e) => setNewPatientStatus(e.target.value as "New" | "Old")}
                  className="text-green-600"
                />
                <div className="flex items-center space-x-2">
                  <Badge className="bg-green-50 border-green-200 text-green-700 text-xs px-2 py-1">
                    New
                  </Badge>
                  <span className="text-sm text-gray-700 dark:text-gray-300">New Patient</span>
                </div>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="patientStatus"
                  value="Old"
                  checked={newPatientStatus === "Old"}
                  onChange={(e) => setNewPatientStatus(e.target.value as "New" | "Old")}
                  className="text-blue-600"
                />
                <div className="flex items-center space-x-2">
                  <Badge className="bg-blue-50 border-blue-200 text-blue-700 text-xs px-2 py-1">
                    Old
                  </Badge>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Returning Patient</span>
                </div>
              </label>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowStatusEditDialog(false)}
                disabled={isUpdatingStatus}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdatePatientStatus}
                disabled={isUpdatingStatus}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isUpdatingStatus ? "Updating..." : "Update Status"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
}

export default ViewPatientDrawer;
