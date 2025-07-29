import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle,
  Calendar,
  CalendarCheck,
  CalendarPlus,
  CalendarX,
  CheckCircle,
  Clock,
  ClipboardList,
  ClipboardX,
  Droplets,
  FileText,
  Heart,
  HeartPulse,
  Image as ImageIcon,
  Activity,
  Mail,
  MapPin,
  Microscope,
  Phone,
  Pill,
  Scan,
  Star,
  Info,
  TestTube2,
  Thermometer,
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

const XCircle = ({ className }: { className?: string }) => (
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
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
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
import { Patient, DailyTreatment } from "@/types/patient";
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
  <motion.div
    className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ scale: 1.01 }}
    transition={{ duration: 0.3 }}
  >
    <div
      className={`p-2 sm:p-2.5 rounded-xl ${color} bg-opacity-10 dark:bg-opacity-20`}
    >
      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
        {label}
      </p>
      <div className="space-y-1">
        {englishDate && (
          <div className="flex items-center gap-1 sm:gap-2">
            <Globe className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-600" />
            <span className="text-xs sm:text-sm text-gray-900 dark:text-gray-100 break-words">
              {formatSafeDate(englishDate)}
            </span>
          </div>
        )}
        {nepaliDate && (
          <div className="flex items-center gap-1 sm:gap-2">
            <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-orange-600" />
            <span className="text-xs sm:text-sm text-gray-900 dark:text-gray-100 break-words">
              {nepaliDate}
            </span>
          </div>
        )}
        {!englishDate && !nepaliDate && (
          <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
            Not provided
          </span>
        )}
      </div>
    </div>
  </motion.div>
);

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

  console.log("Treatment totals breakdown:", {
    selectedTeethTotalAmount,
    selectedTeethPaidAmount,
    groupTreatmentTotalAmount,
    groupTreatmentPaidAmount,
    servicePaymentsTotalAmount,
    totalAmount,
    paidAmount,
    remainingAmount,
    dailyTreatmentsCount: allDailyTreatments.length,
  });

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
            ["Follow-up Date", formatSafeDate(plan.followUpDate || "")],
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
      <DrawerContent className="h-[98vh] sm:h-[95vh] max-h-[98vh] sm:max-h-[95vh]">
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">
          <DrawerHeader className="border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="items-center gap-3 hidden md:flex">
                <Avatar className="h-12 w-12 sm:h-16 sm:w-16 border-2 border-primary/20 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-base sm:text-lg">
                    {getInitials(localPatient.personalDetails.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                      {localPatient.personalDetails.name}
                    </h2>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleSpeech}
                      className={`rounded-full w-8 h-8 ${isSpeaking ? "bg-blue-100 dark:bg-blue-900" : ""}`}
                      title={
                        isSpeaking ? "Stop reading" : "Read patient details"
                      }
                    >
                      <Volume2
                        className={`w-4 h-4 ${isSpeaking ? "text-blue-600 dark:text-blue-300" : "text-gray-500"}`}
                      />
                    </Button>
                  </div>
                  <DrawerTitle className="text-lg sm:text-xl font-bold truncate">
                    {localPatient.personalDetails.name}
                  </DrawerTitle>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1 text-muted-foreground text-xs sm:text-sm">
                    <div className="flex items-center gap-1">
                      <FileDigit className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      <span className="truncate">ID: {patient._id}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      <span className="truncate">
                        Added: {formatSafeDate(localPatient.createdAt)}
                      </span>
                    </div>
                    <div className="flex mt-1 sm:mt-0 gap-2">
                      {localPatient.personalDetails.gender && (
                        <Badge variant="outline" className="bg-card text-xs">
                          {localPatient.personalDetails.gender}
                        </Badge>
                      )}
                      {localPatient.personalDetails.age && (
                        <Badge variant="outline" className="bg-card text-xs">
                          {localPatient.personalDetails.age} years
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-2 sm:mt-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportPatientPDF}
                  className="flex items-center gap-1 text-xs h-8 px-2 sm:h-9 sm:px-3 sm:text-sm"
                >
                  <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="sm:inline">Export PDF</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="h-8 px-2 sm:h-9 sm:px-3 text-xs sm:text-sm"
                >
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="sm:inline">Close</span>
                </Button>
              </div>
            </div>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-2">
            <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
              <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm pt-1 pb-2 sm:pb-3 -mx-2 sm:-mx-4 px-2 sm:px-4 border-b border-gray-100 dark:border-gray-800">
                <TabsList className="w-full overflow-x-auto h-20 md:h-auto flex flex-wrap md:flex-nowrap sm:grid sm:grid-cols-6 bg-gray-100 dark:bg-gray-800/50 p-1 sm:p-1.5 rounded-lg gap-1">
                  <TabsTrigger
                    value="overview"
                    className="text-xs sm:text-sm whitespace-nowrap flex-1 px-2 py-1.5 sm:py-1.5 sm:px-3"
                  >
                    Overview
                  </TabsTrigger>
                  <TabsTrigger
                    value="medical"
                    className="text-xs sm:text-sm whitespace-nowrap flex-1 px-2 py-1.5 sm:py-1.5 sm:px-3"
                  >
                    Medical Records
                  </TabsTrigger>
                  <TabsTrigger
                    value="timeline"
                    className="text-xs sm:text-sm whitespace-nowrap flex-1 px-2 py-1.5 sm:py-1.5 sm:px-3"
                  >
                    Timeline
                  </TabsTrigger>
                  <TabsTrigger
                    value="documents"
                    className="text-xs sm:text-sm whitespace-nowrap flex-1 px-2 py-1.5 sm:py-1.5 sm:px-3"
                  >
                    Documents
                  </TabsTrigger>
                  <TabsTrigger
                    value="prescriptions"
                    className="text-xs sm:text-sm whitespace-nowrap flex-1 px-2 py-1.5 sm:py-1.5 sm:px-3"
                  >
                    Prescriptions
                  </TabsTrigger>
                  <TabsTrigger
                    value="service-payments"
                    className="text-xs sm:text-sm whitespace-nowrap flex-1 px-2 py-1.5 sm:py-1.5 sm:px-3"
                  >
                    Service Payments
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="overview" className="space-y-6 pb-6">
                {/* Enhanced Personal Information */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card className="border border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl overflow-hidden">
                    <CardHeader className="pb-4 border-b border-gray-100 dark:border-gray-800">
                      <CardTitle className="text-xl flex items-center gap-3 text-gray-800 dark:text-gray-100">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md">
                          <User className="h-5 w-5" />
                        </div>
                        <span className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                          Personal Information
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="gap-4 p-3 sm:p-6">
                      {/* Personal Information Cards */}
                      <motion.div
                        className="grid grid-cols-1 gap-3 sm:gap-4 min-[480px]:grid-cols-2 md:grid-cols-2 lg:grid-cols-3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ staggerChildren: 0.1 }}
                      >
                        <motion.div
                          className="group border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:border-blue-100 dark:hover:border-blue-900/50 hover:bg-blue-50/30 dark:hover:bg-blue-900/10"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileHover={{ scale: 1.02 }}
                          transition={{
                            duration: 0.3,
                            type: "spring",
                            stiffness: 200,
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                Patient ID
                              </p>
                              <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                                {patient._id}
                              </p>
                            </div>
                          </div>
                        </motion.div>

                        <motion.div
                          className="group border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:border-green-100 dark:hover:border-green-900/50 hover:bg-green-50/30 dark:hover:bg-green-900/10"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileHover={{ scale: 1.02 }}
                          transition={{
                            duration: 0.3,
                            type: "spring",
                            stiffness: 200,
                            delay: 0.1,
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center group-hover:bg-green-100 dark:group-hover:bg-green-900/50 transition-colors">
                              <UserCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                Full Name
                              </p>
                              <p className="font-semibold text-gray-900 dark:text-gray-100">
                                {localPatient.personalDetails.name}
                              </p>
                            </div>
                          </div>
                        </motion.div>

                        <motion.div
                          className="group border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:border-purple-100 dark:hover:border-purple-900/50 hover:bg-purple-50/30 dark:hover:bg-purple-900/10"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileHover={{ scale: 1.02 }}
                          transition={{
                            duration: 0.3,
                            type: "spring",
                            stiffness: 200,
                            delay: 0.2,
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center group-hover:bg-purple-100 dark:group-hover:bg-purple-900/50 transition-colors">
                              <Phone className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                Contact
                              </p>
                              <p className="font-semibold text-gray-900 dark:text-gray-100">
                                {localPatient.personalDetails.contactNumber}
                              </p>
                            </div>
                          </div>
                        </motion.div>

                        <motion.div
                          className="group border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:border-orange-100 dark:hover:border-orange-900/50 hover:bg-orange-50/30 dark:hover:bg-orange-900/10"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileHover={{ scale: 1.02 }}
                          transition={{
                            duration: 0.3,
                            type: "spring",
                            stiffness: 200,
                            delay: 0.3,
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center group-hover:bg-orange-100 dark:group-hover:bg-orange-900/50 transition-colors">
                              <Mail className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                Email
                              </p>
                              <p className="font-semibold text-gray-900 dark:text-gray-100">
                                {localPatient.personalDetails.emailAddress ||
                                  "Not provided"}
                              </p>
                            </div>
                          </div>
                        </motion.div>

                        <motion.div
                          className="group border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:border-red-100 dark:hover:border-red-900/50 hover:bg-red-50/30 dark:hover:bg-red-900/10"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileHover={{ scale: 1.02 }}
                          transition={{
                            duration: 0.3,
                            type: "spring",
                            stiffness: 200,
                            delay: 0.4,
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center group-hover:bg-red-100 dark:group-hover:bg-red-900/50 transition-colors">
                              <MapPin className="h-5 w-5 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                Address
                              </p>
                              <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                                {localPatient.personalDetails.address ||
                                  "Not provided"}
                              </p>
                            </div>
                          </div>
                        </motion.div>

                        <motion.div
                          className="group border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:border-teal-100 dark:hover:border-teal-900/50 hover:bg-teal-50/30 dark:hover:bg-teal-900/10"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileHover={{ scale: 1.02 }}
                          transition={{
                            duration: 0.3,
                            type: "spring",
                            stiffness: 200,
                            delay: 0.5,
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center group-hover:bg-teal-100 dark:group-hover:bg-teal-900/50 transition-colors">
                              <Users className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                Demographics
                              </p>
                              <div className="flex flex-wrap gap-2 mt-1">
                                <Badge
                                  variant="outline"
                                  className="bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/30 text-xs px-2 py-1 rounded-lg"
                                >
                                  {localPatient.personalDetails.gender ||
                                    "Not specified"}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className="bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/30 text-xs px-2 py-1 rounded-lg"
                                >
                                  {localPatient.personalDetails.age
                                    ? `Age: ${localPatient.personalDetails.age}`
                                    : "Adult"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Enhanced Date Information */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Card className="border border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl overflow-hidden">
                    <CardHeader className="pb-4 border-b border-gray-100 dark:border-gray-800">
                      <CardTitle className="text-xl flex items-center gap-3 text-gray-800 dark:text-gray-100">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-md">
                          <Calendar className="h-5 w-5" />
                        </div>
                        <span className="bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
                          Important Dates
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 min-[480px]:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 p-3 sm:p-6">
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

                      {localPatient.medicalDetails.length > 0 && (
                        <DateDisplay
                          englishDate={
                            localPatient.medicalDetails[0].treatmentPlanning[0]
                              .followUpDate
                          }
                          nepaliDate={
                            localPatient.medicalDetails[0].treatmentPlanning[0]
                              .followUpDateNp
                          }
                          label="Next Follow-up"
                          icon={CalendarX}
                          color="text-orange-500"
                        />
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Treatment Progress */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <TreatmentProgress
                    totalAmount={totalAmount}
                    paidAmount={paidAmount}
                    remainingAmount={remainingAmount}
                    treatments={allTreatments}
                  />
                </motion.div>
              </TabsContent>

              <TabsContent value="medical" className="pb-6">
                <motion.div
                  className="space-y-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  {/* Individual Medical Records */}
                  {localPatient.medicalDetails.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5 }}
                      className="text-center py-12"
                    >
                      <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <XCircle className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 text-lg font-medium">
                        No Medical Records
                      </p>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Medical records will appear here once added
                      </p>
                    </motion.div>
                  ) : (
                    localPatient.medicalDetails.map((record, index) => (
                      <motion.div
                        key={record._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      >
                        <Card className="border border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl overflow-hidden">
                          <CardHeader className="border-b border-gray-100 dark:border-gray-800">
                            <CardTitle className="flex items-center gap-3">
                              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md">
                                <Calendar className="h-5 w-5" />
                              </div>
                              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                                Medical Record #{index + 1}
                              </span>
                              <Badge className="ml-auto bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                                {formatSafeDate(record.checkUpDate)}
                              </Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-2 p-3 sm:p-6">
                            <div className="grid grid-cols-1 min-[480px]:grid-cols-2 gap-3 sm:gap-4">
                              <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3, delay: 0.1 }}
                                className="group border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="p-2 rounded-full bg-yellow-100 text-yellow-600">
                                    <AlertTriangle className="w-4 h-4" />
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                                      Chief Complaint
                                    </h4>
                                    <p className="text-gray-700 dark:text-gray-200 text-sm">
                                      {record.chiefComplaint || "Not provided"}
                                    </p>
                                  </div>
                                </div>
                              </motion.div>

                              <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3, delay: 0.2 }}
                                className="p-4 rounded-lg bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-white/20 dark:border-gray-700"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="p-2 rounded-full bg-green-100 text-green-600">
                                    <CheckCircle className="w-4 h-4" />
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                                      Diagnosis
                                    </h4>
                                    <p className="text-gray-700 dark:text-gray-200 text-sm">
                                      {record.diagnosis || "Not provided"}
                                    </p>
                                  </div>
                                </div>
                              </motion.div>
                            </div>

                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.3 }}
                              className="grid grid-cols-1 min-[480px]:grid-cols-2 gap-3 sm:gap-4"
                            >
                              {record.group === "Ortho" ? (
                                <DateDisplay
                                  englishDate={
                                    localPatient.personalDetails.checkUpDate
                                  }
                                  nepaliDate={
                                    localPatient.personalDetails.checkUpDateNp
                                  }
                                  label="Check-up Date"
                                  icon={CalendarCheck}
                                  color="text-blue-500"
                                />
                              ) : (
                                <DateDisplay
                                  englishDate={
                                    localPatient.personalDetails.checkUpDate
                                  }
                                  nepaliDate={
                                    localPatient.personalDetails.checkUpDateNp
                                  }
                                  label="Check-up Date"
                                  icon={CalendarCheck}
                                  color="text-blue-500"
                                />
                              )}

                              <motion.div
                                className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileHover={{ scale: 1.01 }}
                                transition={{ duration: 0.3 }}
                              >
                                <div className="p-2 rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                                  <User className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                    Patient Group
                                  </h4>
                                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                                    {record.group || "General"}
                                  </p>
                                </div>
                              </motion.div>

                              {record.group === "Ortho" ? (
                                <DateDisplay
                                  englishDate={
                                    record.treatmentPlanning[0]
                                      ?.groupTreatmentDetails[0]?.followUpDate
                                  }
                                  // nepaliDate={
                                  //   record.treatmentPlanning[0]?.followUpDateNp
                                  // }
                                  label="Follow-up Date"
                                  icon={CalendarCheck}
                                  color="text-blue-500"
                                />
                              ) : (
                                <DateDisplay
                                  englishDate={
                                    record.treatmentPlanning[0]?.followUpDate
                                  }
                                  nepaliDate={
                                    record.treatmentPlanning[0]?.followUpDateNp
                                  }
                                  label="Follow-up Date"
                                  icon={CalendarPlus}
                                  color="text-purple-500"
                                />
                              )}
                            </motion.div>

                            {/* Investigation Details */}
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.3, delay: 0.3 }}
                              className="space-y-4 col-span-2 mt-6"
                            >
                              <div className="flex items-center justify-between w-full pr-4">
                                <div className="flex items-center gap-2">
                                  <Microscope className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                  <span className="font-medium">
                                    Investigation & Test Results
                                  </span>
                                  {record.investigation && (
                                    <Badge
                                      variant="outline"
                                      className="ml-2 text-xs"
                                    >
                                      {
                                        Object.keys(
                                          record.investigation
                                        ).filter(
                                          (k) => record.investigation?.[k]
                                        ).length
                                      }{" "}
                                      Tests
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="space-y-6 ">
                                {record.investigation ? (
                                  <div className="grid md:grid-cols-3 gap-4">
                                    {/* Blood Test */}
                                    {record.investigation.blood && (
                                      <div className="bg-gradient-to-r from-red-50 to-red-50/50 dark:from-red-900/10 dark:to-red-900/5 p-4 rounded-lg border border-red-200 dark:border-red-800/50 shadow-sm">
                                        <div className="flex items-center gap-3 mb-3">
                                          <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300">
                                            <Droplets className="w-5 h-5" />
                                          </div>
                                          <h4 className="font-medium text-red-800 dark:text-red-100">
                                            Hematology Report
                                          </h4>
                                          <Badge
                                            variant="secondary"
                                            className="ml-auto bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200"
                                          >
                                            Blood Test
                                          </Badge>
                                        </div>
                                        <div className="bg-white dark:bg-gray-900/30 p-3 rounded border border-red-100 dark:border-red-900/50">
                                          <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans">
                                            {record.investigation.blood}
                                          </pre>
                                        </div>
                                        {record.investigation.bloodTestDate && (
                                          <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            Test Date:{" "}
                                            {formatSafeDate(
                                              record.investigation.bloodTestDate
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {/* X-Ray */}
                                    {record.investigation.xray && (
                                      <div className="bg-gradient-to-r from-blue-50 to-blue-50/50 dark:from-blue-900/10 dark:to-blue-900/5 p-4 rounded-lg border border-blue-200 dark:border-blue-800/50 shadow-sm">
                                        <div className="flex items-center gap-3 mb-3">
                                          <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300">
                                            <Scan className="w-5 h-5" />
                                          </div>
                                          <h4 className="font-medium text-blue-800 dark:text-blue-100">
                                            Radiology Report
                                          </h4>
                                          <Badge
                                            variant="secondary"
                                            className="ml-auto bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200"
                                          >
                                            X-Ray
                                          </Badge>
                                        </div>
                                        <div className="bg-white dark:bg-gray-900/30 p-3 rounded border border-blue-100 dark:border-blue-900/50">
                                          <p className="text-sm text-gray-700 dark:text-gray-300">
                                            {record.investigation.xray}
                                          </p>
                                          {record.investigation.xrayDate && (
                                            <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                                              <Calendar className="w-3 h-3" />
                                              Test Date:{" "}
                                              {formatSafeDate(
                                                record.investigation.xrayDate
                                              )}
                                            </div>
                                          )}
                                          {record.investigation.xrayImages &&
                                            record.investigation.xrayImages
                                              .length > 0 && (
                                              <div className="mt-3">
                                                <p className="text-xs font-medium text-muted-foreground mb-2">
                                                  Attached Images:
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                  {record.investigation.xrayImages.map(
                                                    (img, idx) => (
                                                      <a
                                                        key={idx}
                                                        href={img.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                                      >
                                                        <ImageIcon className="w-3 h-3" />
                                                        View Image {idx + 1}
                                                      </a>
                                                    )
                                                  )}
                                                </div>
                                              </div>
                                            )}
                                        </div>
                                      </div>
                                    )}

                                    {/* Other Tests */}
                                    {record.investigation.otherTests && (
                                      <div className="bg-gradient-to-r from-purple-50 to-purple-50/50 dark:from-purple-900/10 dark:to-purple-900/5 p-4 rounded-lg border border-purple-200 dark:border-purple-800/50 shadow-sm">
                                        <div className="flex items-center gap-3 mb-3">
                                          <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300">
                                            <ClipboardList className="w-5 h-5" />
                                          </div>
                                          <h4 className="font-medium text-purple-800 dark:text-purple-100">
                                            Additional Tests
                                          </h4>
                                        </div>
                                        <div className="space-y-3">
                                          {record.investigation.otherTests &&
                                            Array.isArray(
                                              record.investigation.otherTests
                                            ) &&
                                            record.investigation.otherTests.map(
                                              (test, idx) => (
                                                <div
                                                  key={idx}
                                                  className="bg-white dark:bg-gray-900/30 p-3 rounded border border-purple-100 dark:border-purple-900/50"
                                                >
                                                  <div className="flex justify-between items-start">
                                                    <div>
                                                      <h5 className="font-medium text-sm">
                                                        {test.name}
                                                      </h5>
                                                      {test.date && (
                                                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                                          <Calendar className="w-3 h-3" />
                                                          {formatSafeDate(
                                                            test.date
                                                          )}
                                                        </p>
                                                      )}
                                                    </div>
                                                    <Badge
                                                      variant="outline"
                                                      className="text-xs"
                                                    >
                                                      {test.type || "Test"}
                                                    </Badge>
                                                  </div>
                                                  {test.results && (
                                                    <div className="mt-2">
                                                      <p className="text-xs font-medium text-muted-foreground mb-1">
                                                        Results:
                                                      </p>
                                                      <p className="text-sm">
                                                        {test.results}
                                                      </p>
                                                    </div>
                                                  )}
                                                  {test.notes && (
                                                    <div className="mt-2">
                                                      <p className="text-xs font-medium text-muted-foreground mb-1">
                                                        Notes:
                                                      </p>
                                                      <p className="text-sm text-muted-foreground">
                                                        {test.notes}
                                                      </p>
                                                    </div>
                                                  )}
                                                </div>
                                              )
                                            )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-center py-6 text-muted-foreground">
                                    <TestTube2 className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                    <p>No investigation records found</p>
                                  </div>
                                )}
                              </div>
                            </motion.div>

                            {/* Medical History Overview */}
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.3, delay: 0.4 }}
                              className="col-span-2 mt-6"
                            >
                              <div className="flex items-center justify-between w-full pr-4">
                                <div className="flex items-center gap-2">
                                  <div className="p-2 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 text-white shadow-md">
                                    <Heart className="h-5 w-5" />
                                  </div>
                                  <span className="bg-gradient-to-r from-red-600 to-pink-600 dark:from-red-400 dark:to-pink-400 bg-clip-text text-transparent">
                                    Medical History Overview
                                  </span>
                                  {record.medicalHistory && (
                                    <Badge
                                      variant="outline"
                                      className="ml-2 text-xs"
                                    >
                                      {
                                        Object.keys(
                                          record.medicalHistory
                                        ).filter(
                                          (
                                            k
                                          ): k is keyof typeof record.medicalHistory =>
                                            k in record.medicalHistory &&
                                            Boolean(
                                              record.medicalHistory[
                                                k as keyof typeof record.medicalHistory
                                              ]
                                            )
                                        ).length
                                      }{" "}
                                      Records
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="space-y-4 mt-4">
                                {record.medicalHistory ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {/* Allergies */}
                                    {record.medicalHistory.allergies && (
                                      <div className="bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800/50">
                                        <div className="flex items-center gap-2 mb-2">
                                          <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                                          <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                                            Allergies
                                          </h4>
                                        </div>
                                        <p className="text-sm">
                                          {record.medicalHistory.allergies}
                                        </p>
                                      </div>
                                    )}

                                    {/* Blood Pressure */}
                                    {record.medicalHistory.bloodPressure && (
                                      <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-200 dark:border-blue-800/50">
                                        <div className="flex items-center gap-2 mb-2">
                                          <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                          <h4 className="font-medium text-blue-800 dark:text-blue-200">
                                            Blood Pressure
                                          </h4>
                                        </div>
                                        <p className="text-sm">
                                          {record.medicalHistory.bloodPressure}
                                        </p>
                                      </div>
                                    )}

                                    {/* Other Conditions */}
                                    {record.medicalHistory.otherConditions && (
                                      <div className="bg-purple-50 dark:bg-purple-900/10 p-3 rounded-lg border border-purple-200 dark:border-purple-800/50">
                                        <div className="flex items-center gap-2 mb-2">
                                          <ClipboardList className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                          <h4 className="font-medium text-purple-800 dark:text-purple-200">
                                            Other Conditions
                                          </h4>
                                        </div>
                                        <p className="text-sm">
                                          {
                                            record.medicalHistory
                                              .otherConditions
                                          }
                                        </p>
                                      </div>
                                    )}

                                    {/* Medical Conditions */}
                                    {(record.medicalHistory.diabetes ||
                                      record.medicalHistory.thyroid ||
                                      record.medicalHistory.bleedingDisorder ||
                                      record.medicalHistory.pregnancy ||
                                      record.medicalHistory.asthma) && (
                                      <div className="bg-green-50 dark:bg-green-900/10 p-3 rounded-lg border border-green-200 dark:border-green-800/50">
                                        <div className="flex items-center gap-2 mb-2">
                                          <HeartPulse className="w-4 h-4 text-green-600 dark:text-green-400" />
                                          <h4 className="font-medium text-green-800 dark:text-green-200">
                                            Medical Conditions
                                          </h4>
                                        </div>
                                        <div className="space-y-1">
                                          {record.medicalHistory.diabetes && (
                                            <p className="text-sm">
                                              • Diabetes
                                            </p>
                                          )}
                                          {record.medicalHistory.thyroid && (
                                            <p className="text-sm">
                                              • Thyroid Disorder
                                            </p>
                                          )}
                                          {record.medicalHistory
                                            .bleedingDisorder && (
                                            <p className="text-sm">
                                              • Bleeding Disorder
                                            </p>
                                          )}
                                          {record.medicalHistory.pregnancy && (
                                            <p className="text-sm">
                                              • Pregnancy
                                            </p>
                                          )}
                                          {record.medicalHistory.asthma && (
                                            <p className="text-sm">• Asthma</p>
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {/* Additional Notes */}
                                    {record.medicalHistory.otherConditions && (
                                      <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-200 dark:border-blue-800/50">
                                        <div className="flex items-center gap-2 mb-2">
                                          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                          <h4 className="font-medium text-blue-800 dark:text-blue-200">
                                            Additional Notes
                                          </h4>
                                        </div>
                                        <p className="text-sm">
                                          {
                                            record.medicalHistory
                                              .otherConditions
                                          }
                                        </p>
                                      </div>
                                    )}

                                    {/* No Medical Issues */}
                                    {record.medicalHistory.noMedicalIssues && (
                                      <div className="bg-green-50 dark:bg-green-900/10 p-3 rounded-lg border border-green-200 dark:border-green-800/50">
                                        <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                                          <CheckCircle className="w-4 h-4" />
                                          <span className="font-medium">
                                            No significant medical issues
                                            reported
                                          </span>
                                        </div>
                                      </div>
                                    )}

                                    {/* Additional medical information can be added here in the future */}

                                    {/* Additional Notes */}
                                    {record.medicalHistory.additionalNotes && (
                                      <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center gap-2 mb-2">
                                          <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                          <h4 className="font-medium text-gray-800 dark:text-gray-200">
                                            Additional Notes
                                          </h4>
                                        </div>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                          {
                                            record.medicalHistory
                                              .additionalNotes
                                          }
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-center py-6 text-muted-foreground">
                                    <ClipboardX className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                    <p>No medical history records found</p>
                                  </div>
                                )}
                              </div>
                            </motion.div>

                            {/* Treatment Planning */}
                            {record.treatmentPlanning &&
                              record.treatmentPlanning.length > 0 && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ duration: 0.3, delay: 0.4 }}
                                  className="col-span-2"
                                >
                                  <div className="space-y-4">
                                    {record.treatmentPlanning.map(
                                      (treatment, treatmentIndex) => {
                                        // Create a map of selected teeth for the dental chart
                                        const selectedTeethMap: Record<
                                          string,
                                          any
                                        > = {};
                                        if (treatment.selectedTeethDetails) {
                                          treatment.selectedTeethDetails.forEach(
                                            (tooth) => {
                                              selectedTeethMap[tooth.number] =
                                                tooth;
                                            }
                                          );
                                        }

                                        return (
                                          <motion.div
                                            key={treatment._id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{
                                              duration: 0.3,
                                              delay: treatmentIndex * 0.1,
                                            }}
                                            className="border rounded-lg overflow-hidden bg-card shadow-sm mb-4"
                                          >
                                            {/* Treatment Plan Header */}
                                            <div className="bg-muted/30 px-4 py-3 border-b">
                                              <div className="flex items-center justify-between w-full">
                                                <h5 className="font-medium text-sm flex items-center gap-2">
                                                  <span className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                                                    {treatmentIndex + 1}
                                                  </span>
                                                  Treatment Plan{" "}
                                                  {treatmentIndex + 1}:{" "}
                                                  {treatment.treatmentDetails ||
                                                    "General Treatment"}
                                                </h5>
                                                <Badge
                                                  variant={
                                                    treatment.isCompleted
                                                      ? "default"
                                                      : "outline"
                                                  }
                                                  className={
                                                    treatment.isCompleted
                                                      ? "bg-green-100 text-green-800 border-none dark:bg-green-900 dark:text-green-100"
                                                      : "border-orange-200 text-orange-800 dark:border-orange-800 dark:text-orange-200"
                                                  }
                                                >
                                                  {treatment.isCompleted
                                                    ? "Completed"
                                                    : "In Progress"}
                                                </Badge>
                                              </div>
                                            </div>
                                            <div className="p-0">
                                              {/* Treatment Details Summary */}
                                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 border-b bg-muted/10">
                                                <div>
                                                  <p className="text-xs text-muted-foreground font-medium">
                                                    Treatment Date
                                                  </p>
                                                  <p className="font-medium text-sm">
                                                    {formatSafeDate(
                                                      treatment.treatmentDate
                                                    )}
                                                  </p>
                                                </div>
                                                {treatment.treatedByDoctor && (
                                                  <div>
                                                    <p className="text-xs text-muted-foreground font-medium">
                                                      Treated By
                                                    </p>
                                                    <p className="font-medium text-sm">
                                                      {typeof treatment.treatedByDoctor ===
                                                        "object" &&
                                                      treatment.treatedByDoctor !==
                                                        null &&
                                                      "name" in
                                                        treatment.treatedByDoctor
                                                        ? (
                                                            treatment.treatedByDoctor as {
                                                              name: string;
                                                            }
                                                          ).name
                                                        : typeof treatment.treatedByDoctor ===
                                                            "string"
                                                          ? treatment.treatedByDoctor
                                                          : "N/A"}
                                                    </p>
                                                  </div>
                                                )}
                                                {treatment.completionDate && (
                                                  <div>
                                                    <p className="text-xs text-muted-foreground font-medium">
                                                      Completion Date
                                                    </p>
                                                    <p className="font-medium text-sm">
                                                      {formatSafeDate(
                                                        treatment.completionDate
                                                      )}
                                                    </p>
                                                  </div>
                                                )}
                                                <div>
                                                  <p className="text-xs text-muted-foreground font-medium">
                                                    Amount
                                                  </p>
                                                  <p className="font-medium text-sm">
                                                    ₹
                                                    {treatment.totalPlanAmount ||
                                                      0}
                                                  </p>
                                                </div>
                                              </div>

                                              {/* Treatment Details */}
                                              {record.group !== "Ortho" && (
                                                <div className="p-4 border-b">
                                                  <p className="text-xs text-muted-foreground font-medium mb-2">
                                                    Treatment Details
                                                  </p>
                                                  <div className="bg-muted/20 p-3 rounded-md text-sm">
                                                    {treatment.treatmentDetails ||
                                                      "No details provided"}
                                                  </div>
                                                </div>
                                              )}

                                              {/* General Patient details */}
                                              {/* Dental Chart Visualization */}
                                              {treatment.selectedTeethDetails &&
                                                treatment.selectedTeethDetails
                                                  .length > 0 && (
                                                  <div className="p-6 border-b">
                                                    <div className="flex items-center justify-between mb-4">
                                                      <h6 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                                        <Thermometer className="h-4 w-4" />
                                                        Dental Chart
                                                      </h6>
                                                      <div className="flex items-center gap-2">
                                                        <div className="flex items-center">
                                                          <div className="h-2.5 w-2.5 rounded-full bg-blue-500 mr-1.5"></div>
                                                          <span className="text-xs text-muted-foreground">
                                                            Selected
                                                          </span>
                                                        </div>
                                                        <div className="flex items-center">
                                                          <div className="h-2.5 w-2.5 rounded-full bg-green-500 mr-1.5"></div>
                                                          <span className="text-xs text-muted-foreground">
                                                            Treated
                                                          </span>
                                                        </div>
                                                        <div className="flex items-center">
                                                          <div className="h-2.5 w-2.5 rounded-full bg-amber-500 mr-1.5"></div>
                                                          <span className="text-xs text-muted-foreground">
                                                            In Progress
                                                          </span>
                                                        </div>
                                                      </div>
                                                    </div>
                                                    <div className="bg-white dark:bg-gray-900/50 p-6 rounded-xl border border-muted shadow-sm">
                                                      {record.patientType ===
                                                      "Child" ? (
                                                        <ChildDentalChart
                                                          selectedTeeth={
                                                            selectedTeethMap
                                                          }
                                                          onToothSelect={() => {}}
                                                          readOnly={true}
                                                        />
                                                      ) : (
                                                        <DentalChart
                                                          selectedTeeth={
                                                            selectedTeethMap
                                                          }
                                                          onToothSelect={() => {}}
                                                          readOnly={true}
                                                        />
                                                      )}
                                                    </div>
                                                  </div>
                                                )}

                                              {/* Selected Teeth Details */}
                                              {treatment.selectedTeethDetails &&
                                                treatment.selectedTeethDetails
                                                  .length > 0 && (
                                                  <div className="p-4">
                                                    <p className="text-xs text-muted-foreground font-medium mb-3">
                                                      Selected Teeth Details
                                                    </p>
                                                    <div className="space-y-4">
                                                      {treatment.selectedTeethDetails.map(
                                                        (tooth) => (
                                                          <motion.div
                                                            key={tooth.number}
                                                            initial={{
                                                              opacity: 0,
                                                              x: -20,
                                                            }}
                                                            animate={{
                                                              opacity: 1,
                                                              x: 0,
                                                            }}
                                                            transition={{
                                                              duration: 0.3,
                                                            }}
                                                            className="border rounded-md overflow-hidden bg-card"
                                                          >
                                                            <div className="bg-muted/30 px-4 py-2 border-b flex items-center justify-between">
                                                              <h6 className="font-medium text-sm">
                                                                Tooth{" "}
                                                                {tooth.number} -{" "}
                                                                {tooth.procedure ||
                                                                  "General Treatment"}
                                                              </h6>
                                                              <Badge
                                                                variant={
                                                                  (tooth as any)
                                                                    .isCompleted
                                                                    ? "default"
                                                                    : "outline"
                                                                }
                                                                className={`text-xs ${
                                                                  (tooth as any)
                                                                    .isCompleted
                                                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                                                                    : "border-orange-200 text-orange-800 dark:border-orange-800 dark:text-orange-200"
                                                                }`}
                                                              >
                                                                {(tooth as any)
                                                                  .isCompleted
                                                                  ? "Completed"
                                                                  : "In Progress"}
                                                              </Badge>
                                                            </div>

                                                            <div className="p-3">
                                                              {/* Tooth details */}
                                                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3 text-sm">
                                                                <div>
                                                                  <span className="text-xs text-muted-foreground">
                                                                    Position:{" "}
                                                                  </span>
                                                                  <span className="font-medium">
                                                                    {tooth.position ||
                                                                      "N/A"}
                                                                  </span>
                                                                </div>
                                                                <div>
                                                                  <span className="text-xs text-muted-foreground">
                                                                    Side:{" "}
                                                                  </span>
                                                                  <span className="font-medium">
                                                                    {tooth.side ||
                                                                      "N/A"}
                                                                  </span>
                                                                </div>
                                                                {tooth.details && (
                                                                  <div className="col-span-full">
                                                                    <span className="text-xs text-muted-foreground">
                                                                      Details:{" "}
                                                                    </span>
                                                                    <span className="font-medium">
                                                                      {
                                                                        tooth.details
                                                                      }
                                                                    </span>
                                                                  </div>
                                                                )}
                                                              </div>

                                                              {/* Daily Treatments Table */}
                                                              {tooth.dailyTreatments &&
                                                                tooth
                                                                  .dailyTreatments
                                                                  .length >
                                                                  0 && (
                                                                  <div className="mt-3">
                                                                    <p className="text-xs font-medium mb-2">
                                                                      Treatment
                                                                      History
                                                                    </p>
                                                                    <div className="rounded-md border overflow-hidden">
                                                                      <Table>
                                                                        <TableHeader className="bg-muted/50">
                                                                          <TableRow>
                                                                            <TableHead className="text-xs">
                                                                              Date
                                                                            </TableHead>
                                                                            <TableHead className="text-xs">
                                                                              Procedure
                                                                            </TableHead>
                                                                            <TableHead className="text-xs">
                                                                              Doctor
                                                                            </TableHead>
                                                                            <TableHead className="text-xs text-right">
                                                                              Amount
                                                                            </TableHead>
                                                                            <TableHead className="text-xs text-right">
                                                                              Paid
                                                                            </TableHead>
                                                                            <TableHead className="text-xs">
                                                                              Payment Date
                                                                            </TableHead>
                                                                            <TableHead className="text-xs">
                                                                              Notes
                                                                            </TableHead>
                                                                            <TableHead className="text-xs text-right">
                                                                              Status
                                                                            </TableHead>
                                                                          </TableRow>
                                                                        </TableHeader>
                                                                        <TableBody>
                                                                          {tooth.dailyTreatments.map(
                                                                            (
                                                                              dailyTreatment,
                                                                              idx
                                                                            ) => (
                                                                              <TableRow
                                                                                key={
                                                                                  idx
                                                                                }
                                                                                className={
                                                                                  (
                                                                                    dailyTreatment as any
                                                                                  )
                                                                                    .isCompleted
                                                                                    ? "bg-green-50/30 dark:bg-green-900/20"
                                                                                    : ""
                                                                                }
                                                                              >
                                                                                <TableCell className="text-xs py-2">
                                                                                  {formatSafeDate(
                                                                                    dailyTreatment.date
                                                                                  )}
                                                                                </TableCell>
                                                                                <TableCell className="text-xs py-2">
                                                                                  {dailyTreatment.procedure ||
                                                                                    "General"}
                                                                                </TableCell>
                                                                                <TableCell className="text-xs py-2">
                                                                                  {typeof dailyTreatment.treatedByDoctor ===
                                                                                    "object" &&
                                                                                  dailyTreatment.treatedByDoctor !==
                                                                                    null &&
                                                                                  "name" in
                                                                                    dailyTreatment.treatedByDoctor
                                                                                    ? (
                                                                                        dailyTreatment.treatedByDoctor as {
                                                                                          name: string;
                                                                                        }
                                                                                      )
                                                                                        .name
                                                                                    : typeof dailyTreatment.treatedByDoctor ===
                                                                                        "string"
                                                                                      ? dailyTreatment.treatedByDoctor
                                                                                      : "N/A"}
                                                                                </TableCell>
                                                                                <TableCell className="text-xs py-2 text-right">
                                                                                  ₹
                                                                                  {dailyTreatment.treatmentAmount ||
                                                                                    0}
                                                                                </TableCell>
                                                                                <TableCell className="text-xs py-2 text-right">
                                                                                  ₹
                                                                                  {dailyTreatment.paidAmount ||
                                                                                    0}
                                                                                </TableCell>
                                                                                <TableCell className="text-xs py-2">
                                                                                  {dailyTreatment.paymentDate
                                                                                    ? formatSafeDate(dailyTreatment.paymentDate)
                                                                                    : "Not paid"}
                                                                                </TableCell>
                                                                                <TableCell className="text-xs py-2 max-w-[150px]">
                                                                                  {dailyTreatment.notes ? (
                                                                                    <div 
                                                                                      className="truncate" 
                                                                                      title={dailyTreatment.notes}
                                                                                    >
                                                                                      {dailyTreatment.notes}
                                                                                    </div>
                                                                                  ) : (
                                                                                    <span className="text-muted-foreground">No notes</span>
                                                                                  )}
                                                                                </TableCell>
                                                                                <TableCell className="text-xs py-2 text-right">
                                                                                  <Badge
                                                                                    variant={
                                                                                      (
                                                                                        dailyTreatment as any
                                                                                      )
                                                                                        .isCompleted
                                                                                        ? "default"
                                                                                        : "outline"
                                                                                    }
                                                                                    className={`text-xs ${
                                                                                      (
                                                                                        dailyTreatment as any
                                                                                      )
                                                                                        .isCompleted
                                                                                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                                                                                        : "border-orange-200 text-orange-800 dark:border-orange-800 dark:text-orange-200"
                                                                                    }`}
                                                                                  >
                                                                                    {(
                                                                                      dailyTreatment as any
                                                                                    )
                                                                                      .isCompleted
                                                                                      ? "Done"
                                                                                      : "Pending"}
                                                                                  </Badge>
                                                                                </TableCell>
                                                                              </TableRow>
                                                                            )
                                                                          )}
                                                                        </TableBody>
                                                                      </Table>
                                                                    </div>
                                                                  </div>
                                                                )}
                                                            </div>
                                                          </motion.div>
                                                        )
                                                      )}
                                                    </div>

                                                    {/* Financial Summary Section */}
                                                    <div className="mt-6 p-4 bg-muted/10 rounded-md">
                                                      <div className="flex justify-between items-center mb-3">
                                                        <h3 className="text-sm font-medium">
                                                          Financial Summary
                                                        </h3>
                                                        <Button
                                                          variant="outline"
                                                          size="sm"
                                                          onClick={() => setIsPaymentDialogOpen(true)}
                                                          className="h-7 px-2 text-xs"
                                                        >
                                                          Edit Payment
                                                        </Button>
                                                      </div>
                                                      <div className="grid grid-cols-3 gap-4">
                                                        {(() => {
                                                          // Calculate totals from daily treatments
                                                          const dailyTreatments =
                                                            treatment.selectedTeethDetails.flatMap(
                                                              (tooth) =>
                                                                tooth.dailyTreatments ||
                                                                []
                                                            );

                                                          const totalDailyAmount =
                                                            dailyTreatments.reduce(
                                                              (sum, dt) =>
                                                                sum +
                                                                Number(
                                                                  dt.treatmentAmount ||
                                                                    0
                                                                ),
                                                              0
                                                            );

                                                          const totalDailyPaid =
                                                            dailyTreatments.reduce(
                                                              (sum, dt) =>
                                                                sum +
                                                                Number(
                                                                  dt.paidAmount ||
                                                                    0
                                                                ),
                                                              0
                                                            );

                                                          const totalDailyBalance =
                                                            totalDailyAmount -
                                                            totalDailyPaid;

                                                          return (
                                                            <>
                                                              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                                                                <p className="text-xs text-muted-foreground">
                                                                  Total Amount
                                                                </p>
                                                                <p className="font-bold text-lg text-blue-600 dark:text-blue-400">
                                                                  ₹
                                                                  {
                                                                    totalDailyAmount
                                                                  }
                                                                </p>
                                                              </div>
                                                              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                                                                <p className="text-xs text-muted-foreground">
                                                                  Total Paid
                                                                </p>
                                                                <p className="font-bold text-lg text-green-600 dark:text-green-400">
                                                                  ₹
                                                                  {
                                                                    totalDailyPaid
                                                                  }
                                                                </p>
                                                              </div>
                                                              <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-md">
                                                                <p className="text-xs text-muted-foreground">
                                                                  Balance
                                                                </p>
                                                                <p className="font-bold text-lg text-orange-600 dark:text-orange-400">
                                                                  ₹
                                                                  {
                                                                    totalDailyBalance
                                                                  }
                                                                </p>
                                                              </div>
                                                            </>
                                                          );
                                                        })()}
                                                      </div>
                                                    </div>
                                                  </div>
                                                )}

                                              {/* Ortho Patient Details  */}
                                              {treatment.groupTreatmentDetails &&
                                                treatment.groupTreatmentDetails
                                                  .length > 0 && (
                                                  <div>
                                                    <div className="space-y-4">
                                                      {treatment.groupTreatmentDetails.map(
                                                        (ortho, index) => (
                                                          <motion.div
                                                            key={index}
                                                            initial={{
                                                              opacity: 0,
                                                              x: -20,
                                                            }}
                                                            animate={{
                                                              opacity: 1,
                                                              x: 0,
                                                            }}
                                                            transition={{
                                                              duration: 0.3,
                                                            }}
                                                            className="border rounded-md overflow-hidden bg-card"
                                                          >
                                                            <div className="flex items-center justify-between bg-muted/30 px-4 py-2 border-b">
                                                              <span className="flex gap-4 bg-gradient-to-r from-red-600 to-pink-600 dark:from-red-400 dark:to-pink-400 bg-clip-text text-transparent font-bold">
                                                                <div className="p-2 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 text-white shadow-md w-8 h-8 flex items-center justify-center">
                                                                  <Heart className="h-5 w-5" />
                                                                </div>
                                                                Ortho Patient
                                                                Details
                                                              </span>
                                                              <Badge
                                                                variant={
                                                                  ortho.isCompleted
                                                                    ? "default"
                                                                    : "outline"
                                                                }
                                                                className={
                                                                  ortho.isCompleted
                                                                    ? "bg-green-100 text-green-800 border-none dark:bg-green-900 dark:text-green-100"
                                                                    : "border-orange-200 text-orange-800 dark:border-orange-800 dark:text-orange-200"
                                                                }
                                                              >
                                                                {ortho.isCompleted
                                                                  ? "Completed"
                                                                  : "In Progress"}
                                                              </Badge>
                                                            </div>

                                                            <div className="bg-muted/30 px-4 py-2 border-b flex flex-wrap items-center justify-between">
                                                              <DateDisplay
                                                                englishDate={
                                                                  ortho.startDate
                                                                }
                                                                label="Start Date"
                                                                icon={
                                                                  CalendarCheck
                                                                }
                                                                color="text-blue-500"
                                                              />

                                                              <motion.div
                                                                className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
                                                                initial={{
                                                                  opacity: 0,
                                                                  y: 10,
                                                                }}
                                                                animate={{
                                                                  opacity: 1,
                                                                  y: 0,
                                                                }}
                                                                whileHover={{
                                                                  scale: 1.01,
                                                                }}
                                                                transition={{
                                                                  duration: 0.3,
                                                                }}
                                                              >
                                                                <div className="p-2 rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                                                                  <User className="w-4 h-4" />
                                                                </div>
                                                                <div className="flex-1">
                                                                  <h4 className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                                                    Toatal
                                                                    Treatment
                                                                    Amount
                                                                  </h4>
                                                                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                                                                    {
                                                                      ortho.totalTreatmentAmount
                                                                    }
                                                                  </p>
                                                                </div>
                                                              </motion.div>

                                                              <motion.div
                                                                className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
                                                                initial={{
                                                                  opacity: 0,
                                                                  y: 10,
                                                                }}
                                                                animate={{
                                                                  opacity: 1,
                                                                  y: 0,
                                                                }}
                                                                whileHover={{
                                                                  scale: 1.01,
                                                                }}
                                                                transition={{
                                                                  duration: 0.3,
                                                                }}
                                                              >
                                                                <div className="p-2 rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                                                                  <User className="w-4 h-4" />
                                                                </div>
                                                                <div className="flex-1">
                                                                  <h4 className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                                                    Toatal Paid
                                                                    Amount
                                                                  </h4>
                                                                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                                                                    {
                                                                      ortho.totalPaidAmount
                                                                    }
                                                                  </p>
                                                                </div>
                                                              </motion.div>

                                                              <motion.div
                                                                className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
                                                                initial={{
                                                                  opacity: 0,
                                                                  y: 10,
                                                                }}
                                                                animate={{
                                                                  opacity: 1,
                                                                  y: 0,
                                                                }}
                                                                whileHover={{
                                                                  scale: 1.01,
                                                                }}
                                                                transition={{
                                                                  duration: 0.3,
                                                                }}
                                                              >
                                                                <div className="p-2 rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                                                                  <User className="w-4 h-4" />
                                                                </div>
                                                                <div className="flex-1">
                                                                  <h4 className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                                                    Total
                                                                    Remaining
                                                                    Amount
                                                                  </h4>
                                                                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                                                                    {
                                                                      ortho.totalRemainingAmount
                                                                    }
                                                                  </p>
                                                                </div>
                                                              </motion.div>

                                                              <motion.div
                                                                className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
                                                                initial={{
                                                                  opacity: 0,
                                                                  y: 10,
                                                                }}
                                                                animate={{
                                                                  opacity: 1,
                                                                  y: 0,
                                                                }}
                                                                whileHover={{
                                                                  scale: 1.01,
                                                                }}
                                                                transition={{
                                                                  duration: 0.3,
                                                                }}
                                                              >
                                                                <div className="p-2 rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                                                                  <User className="w-4 h-4" />
                                                                </div>
                                                                <div className="flex-1">
                                                                  <h4 className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                                                    Procedure
                                                                  </h4>
                                                                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                                                                    {
                                                                      ortho.procedure
                                                                    }
                                                                  </p>
                                                                </div>
                                                              </motion.div>
                                                            </div>
                                                            {/* ortho daily treatment */}
                                                            {ortho.dailyTreatments &&
                                                              ortho
                                                                .dailyTreatments
                                                                .length > 0 && (
                                                                <div className="mt-3 space-x-4 space-y-4">
                                                                  <p className="text-xs font-medium mb-2 px-4">
                                                                    Daily
                                                                    Treatments
                                                                    History
                                                                  </p>
                                                                  <div className="rounded-md border overflow-hidden">
                                                                    <Table>
                                                                      <TableHeader className="bg-muted/50">
                                                                        <TableRow>
                                                                          <TableHead className="text-xs">
                                                                            Date
                                                                          </TableHead>
                                                                          <TableHead className="text-xs">
                                                                            Procedure
                                                                          </TableHead>
                                                                          <TableHead className="text-xs">
                                                                            Doctor
                                                                          </TableHead>
                                                                          <TableHead className="text-xs text-right">
                                                                            Amount
                                                                          </TableHead>
                                                                          <TableHead className="text-xs text-right">
                                                                            Paid
                                                                          </TableHead>
                                                                          <TableHead className="text-xs">
                                                                            Payment Date
                                                                          </TableHead>
                                                                          <TableHead className="text-xs">
                                                                            Notes
                                                                          </TableHead>
                                                                          <TableHead className="text-xs text-right">
                                                                            Status
                                                                          </TableHead>
                                                                        </TableRow>
                                                                      </TableHeader>
                                                                      <TableBody>
                                                                        {ortho.dailyTreatments.map(
                                                                          (
                                                                            dailyTreatment,
                                                                            idx
                                                                          ) => (
                                                                            <TableRow
                                                                              key={
                                                                                idx
                                                                              }
                                                                              className={
                                                                                (
                                                                                  dailyTreatment as any
                                                                                )
                                                                                  .isCompleted
                                                                                  ? "bg-green-50/30 dark:bg-green-900/20"
                                                                                  : ""
                                                                              }
                                                                            >
                                                                              <TableCell className="text-xs py-2">
                                                                                {formatSafeDate(
                                                                                  dailyTreatment.date
                                                                                )}
                                                                              </TableCell>
                                                                              <TableCell className="text-xs py-2">
                                                                                {dailyTreatment.procedure ||
                                                                                  "General"}
                                                                              </TableCell>
                                                                              <TableCell className="text-xs py-2">
                                                                                {typeof dailyTreatment.treatedByDoctor ===
                                                                                  "object" &&
                                                                                dailyTreatment.treatedByDoctor !==
                                                                                  null &&
                                                                                "name" in
                                                                                  dailyTreatment.treatedByDoctor
                                                                                  ? (
                                                                                      dailyTreatment.treatedByDoctor as {
                                                                                        name: string;
                                                                                      }
                                                                                    )
                                                                                      .name
                                                                                  : typeof dailyTreatment.treatedByDoctor ===
                                                                                      "string"
                                                                                    ? dailyTreatment.treatedByDoctor
                                                                                    : "N/A"}
                                                                              </TableCell>
                                                                              <TableCell className="text-xs py-2 text-right">
                                                                                ₹
                                                                                {dailyTreatment.treatmentAmount ||
                                                                                  0}
                                                                              </TableCell>
                                                                              <TableCell className="text-xs py-2 text-right">
                                                                                ₹
                                                                                {dailyTreatment.paidAmount ||
                                                                                  0}
                                                                              </TableCell>
                                                                              <TableCell className="text-xs py-2">
                                                                                {dailyTreatment.paymentDate
                                                                                  ? formatSafeDate(dailyTreatment.paymentDate)
                                                                                  : "Not paid"}
                                                                              </TableCell>
                                                                              <TableCell className="text-xs py-2 max-w-[150px]">
                                                                                {dailyTreatment.notes ? (
                                                                                  <div 
                                                                                    className="truncate" 
                                                                                    title={dailyTreatment.notes}
                                                                                  >
                                                                                    {dailyTreatment.notes}
                                                                                  </div>
                                                                                ) : (
                                                                                  <span className="text-muted-foreground">No notes</span>
                                                                                )}
                                                                              </TableCell>
                                                                              <TableCell className="text-xs py-2 text-right">
                                                                                <Badge
                                                                                  variant={
                                                                                    (
                                                                                      dailyTreatment as any
                                                                                    )
                                                                                      .isCompleted
                                                                                      ? "default"
                                                                                      : "outline"
                                                                                  }
                                                                                  className={`text-xs ${
                                                                                    (
                                                                                      dailyTreatment as any
                                                                                    )
                                                                                      .isCompleted
                                                                                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                                                                                      : "border-orange-200 text-orange-800 dark:border-orange-800 dark:text-orange-200"
                                                                                  }`}
                                                                                >
                                                                                  {(
                                                                                    dailyTreatment as any
                                                                                  )
                                                                                    .isCompleted
                                                                                    ? "Done"
                                                                                    : "Pending"}
                                                                                </Badge>
                                                                              </TableCell>
                                                                            </TableRow>
                                                                          )
                                                                        )}
                                                                      </TableBody>
                                                                    </Table>
                                                                  </div>
                                                                </div>
                                                              )}
                                                          </motion.div>
                                                        )
                                                      )}
                                                    </div>
                                                  </div>
                                                )}
                                            </div>
                                          </motion.div>
                                        );
                                      }
                                    )}
                                  </div>
                                </motion.div>
                              )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))
                  )}
                </motion.div>
              </TabsContent>

              <TabsContent value="timeline" className="pb-6">
                <Card className="border-none shadow-sm bg-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CalendarDays className="h-5 w-5 text-primary" />
                      Medical History Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
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

              <TabsContent value="documents" className="pb-6">
                <Card className="border-none shadow-sm bg-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileDigit className="h-5 w-5 text-primary" />
                      Documents
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
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

              <TabsContent value="prescriptions" className="pb-6">
                <Card className="border-none shadow-sm bg-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Pill className="h-5 w-5 text-primary" />
                      Prescriptions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
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

              <TabsContent value="service-payments" className="pb-6">
                <Card className="border-none shadow-sm bg-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileDigit className="h-5 w-5 text-primary" />
                      Service Payments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
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
    </Drawer>
  );
}

export default ViewPatientDrawer;
