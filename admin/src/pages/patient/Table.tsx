import {
  Edit,
  Eye as View,
  Loader2,
  Mail,
  MapPin,
  MoreHorizontal,
  Plus,
  QrCode,
  Settings,
  Trash,
  X,
  FileSpreadsheet,
  FileUp,
  CreditCard,
  UserCircle,
  Calendar,
  Phone,
  LayoutGrid,
  LayoutList,
  FilePlus,
  User,
  FileX,
  MessageSquare,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useNavigate } from "react-router-dom";
import PopupModal from "@/components/shared/popup-modal";
import AddPatient from "./AddPatient";
import { useEffect, useState } from "react";
import { crudRequest } from "@/lib/api";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Error from "@/pages/not-found/error";
import Loading from "@/pages/not-found/loading";
import ViewPatientDrawer from "@/components/patient/ViewPatientDrawer";
import UpdatePatientModal from "@/components/patient/UpdatePatientModal";
import DeletePatientDialog from "@/components/patient/DeletePatientDialog";
import FollowUpTableDialog from "@/components/patient/FollowUpTableDialog";
import type { Patient } from "@/types/patient";
import { useAdminContext } from "@/contexts/adminContext";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { toast } from "react-toastify";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PaymentHistoryDialog } from "@/components/patient/PaymentHistoryDialog";
import AddXRayPlanModal from "@/components/patient/AddXRayPlanModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { DataTableSkeleton } from "@/components/shared/data-table-skeleton";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeModal } from "@/components/patient/QRCodeModal";
import { ServicePaymentForm } from "@/components/finance/ServicePaymentForm";
import { createServicePayment } from "@/lib/api";
import { PatientDocumentUploadButton } from "@/components/patient/PatientDocumentUploadButton";
import { ProfilePhotoUploadButton } from "@/components/patient/ProfilePhotoUploadButton";
import { AddPrescriptionButton } from "@/components/prescription";
import { dentalName } from "@/server";
import SMSModal from "@/components/patient/SMSModal";

interface ProcedureResponse {
  success: boolean;
  procedures: string[];
}

interface ColumnConfig {
  id: string;
  label: string;
  enabled: boolean;
}

const defaultColumns: ColumnConfig[] = [
  { id: "sn", label: "S.No", enabled: true },
  { id: "name", label: "Name", enabled: true },
  { id: "contact", label: "Contact", enabled: true },
  { id: "gender", label: "Gender", enabled: true },
  { id: "address", label: "Address", enabled: true },
  { id: "age", label: "Age", enabled: true },
  { id: "group", label: "Group", enabled: true },
  { id: "checkupDate", label: "Check-up Date", enabled: true },
  { id: "totalAmount", label: "Total Amount", enabled: true },
  { id: "paidAmount", label: "Paid Amount", enabled: true },
  { id: "remainingAmount", label: "Remaining Amount", enabled: true },
  { id: "treatmentDetails", label: "Treatment Details", enabled: true },
  { id: "teethDetails", label: "Teeth Details", enabled: true },
];

// Add date filter type
type DateFilterType = "all" | "today" | "week" | "month" | "custom";
type FollowUpFilterType = "all" | "today" | "week" | "month" | "custom";

export function PatientTable() {
  const [patient, setPatient] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>("all");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState<boolean>(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [isFollowUpDialogOpen, setIsFollowUpDialogOpen] = useState(false);
  const [selectedPatientForFollowUp, setSelectedPatientForFollowUp] = useState<Patient | null>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [isCompactView, setIsCompactView] = useState<boolean>(false);
  const [viewMode, _setViewMode] = useState<"table" | "grid" | "list">("table");

  const [selectedDoctor, setSelectedDoctor] = useState<string>("all");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [availableProcedures, setAvailableProcedures] = useState<string[]>([]);
  const [selectedProcedures, setSelectedProcedures] = useState<string[]>([]);
  const [isFilteringEnabled, setIsFilteringEnabled] = useState<boolean>(false);

  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailPatient, setEmailPatient] = useState<Patient | null>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentPatient, setPaymentPatient] = useState<Patient | null>(null);
  const [isXRayPlanModalOpen, setIsXRayPlanModalOpen] = useState(false);
  const [xRayPlanPatient, setXRayPlanPatient] = useState<Patient | null>(null);
  // Commented out unused state variables related to report generation
  // const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  // const [reportContent, setReportContent] = useState("");
  // const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const { adminDetails } = useAdminContext();

  console.log("Admin Details:", adminDetails);

  // Handle report generation
  // Commented out as it's currently unused
  // const handleGenerateReport = async (patient: Patient) => {
  //   try {
  //     setIsGeneratingReport(true);
  //     setSelectedPatient(patient);

  //     // Prepare structured data for the report
  //     const patientInfo = {
  //       name: patient.personalDetails?.name || "N/A",
  //       age: patient.personalDetails?.age || "N/A",
  //       gender: patient.personalDetails?.gender || "N/A",
  //       contact: patient.personalDetails?.contactNumber || "N/A",
  //       email: patient.personalDetails?.emailAddress || "N/A",
  //       address: patient.personalDetails?.address || "N/A",
  //       registrationDate: patient.createdAt
  //         ? new Date(patient.createdAt).toISOString().split("T")[0]
  //         : "N/A",
  //       lastVisit: patient.updatedAt
  //         ? new Date(patient.updatedAt).toISOString().split("T")[0]
  //         : "N/A",
  //     };

  //     const medicalHistory = patient.medicalDetails?.[0]?.medicalHistory || {};
  //     const treatmentHistory =
  //       patient.medicalDetails?.[0]?.treatmentPlanning || [];

  //     // Format treatment history for the report
  //     const formattedTreatmentHistory = treatmentHistory.map((treatment) => ({
  //       date: treatment.treatmentDate
  //         ? new Date(treatment.treatmentDate).toLocaleDateString()
  //         : "N/A",
  //       details: treatment.treatmentDetails || "No details provided",
  //       teeth: treatment.teethNumber || "N/A",
  //       status: treatment.isCompleted ? "Completed" : "In Progress",
  //       findings: treatment.treatmentFindings || "No findings recorded",
  //       doctor: treatment.treatedByDoctor?.name || "N/A",
  //       clinicalFindings: treatment.clinicalFindings?.join(", ") || "None",
  //       followUpDate:
  //         treatment.followUps && treatment.followUps.length > 0
  //           ? treatment.followUps
  //               .filter((fu) => !fu.completed)
  //               .sort(
  //                 (a, b) =>
  //                   new Date(a.date).getTime() - new Date(b.date).getTime()
  //               )
  //               .slice(0, 1)
  //               .map(
  //                 (fu) =>
  //                   `${new Date(fu.date).toLocaleDateString()} (${fu.type})`
  //               )
  //               .join(", ")
  //           : "No follow-up scheduled",
  //     }));

  //     // Prepare medical history summary
  //     const medicalHistorySummary = {
  //       bloodPressure: medicalHistory.bloodPressure || "Not recorded",
  //       conditions:
  //         [
  //           medicalHistory.diabetes && "Diabetes",
  //           medicalHistory.thyroid && "Thyroid Issues",
  //           medicalHistory.bleedingDisorder && "Bleeding Disorder",
  //           medicalHistory.asthma && "Asthma",
  //           medicalHistory.pregnancy && "Pregnancy",
  //           medicalHistory.allergies &&
  //             `Allergies: ${medicalHistory.allergies}`,
  //           medicalHistory.otherConditions &&
  //             `Other: ${medicalHistory.otherConditions}`,
  //         ]
  //           .filter(Boolean)
  //           .join(", ") || "No significant medical history",
  //       chiefComplaint:
  //         patient.medicalDetails?.[0]?.chiefComplaint || "Not specified",
  //     };

  //     // Call the Gemini API to generate the report
  //     const response = await crudRequest("POST", "/gemini/get-response", {
  //       prompt: `Generate a comprehensive dental report based on the following patient data. 
        
  //       PATIENT INFORMATION:
  //       ${JSON.stringify(patientInfo, null, 2)}
        
  //       MEDICAL HISTORY SUMMARY:
  //       ${JSON.stringify(medicalHistorySummary, null, 2)}
        
  //       TREATMENT HISTORY (${formattedTreatmentHistory.length} treatments):
  //       ${JSON.stringify(formattedTreatmentHistory, null, 2)}
        
  //       Please generate a detailed dental report with the following sections:
  //       1. Executive Summary
  //       2. Patient Demographics
  //       3. Medical History Overview
  //       4. Treatment History Summary (include a table if multiple treatments)
  //       5. Current Oral Health Status
  //       6. Treatment Recommendations
  //       7. Preventive Care Suggestions
  //       8. Follow-up Plan
        
  //       Format the report using Markdown with clear section headers (##), sub-headers (###), and bullet points for lists. 
  //       Include tables for treatment history if applicable. Highlight important information in **bold**.
        
  //       For the Treatment History section, include:
  //       - Treatment date
  //       - Procedures performed
  //       - Teeth involved
  //       - Status (Completed/In Progress)
  //       - Key findings
  //       - Treating dentist
  //       - Next steps or follow-up required`,
  //     });

  //     // Type assertion for the response
  //     const responseData = response as { data?: string };
  //     setReportContent(responseData.data || "No report content available.");
  //     setIsReportModalOpen(true);
  //   } catch (error) {
  //     console.error("Error generating report:", error);
  //     toast.error("Failed to generate report. Please try again.");
  //   } finally {
  //     setIsGeneratingReport(false);
  //   }
  // };


  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const {} = useAdminContext();

  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isContactExportLoading, setIsContactExportLoading] = useState(false);
  const [selectedColumns, setSelectedColumns] =
    useState<ColumnConfig[]>(defaultColumns);

  const [dateFilter, setDateFilter] = useState<DateFilterType>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isDateRangePickerOpen, setIsDateRangePickerOpen] = useState(false);
  const [isTableLoading, setIsTableLoading] = useState(false);

  // Add follow-up date filter state
  const [followUpFilter, setFollowUpFilter] =
    useState<FollowUpFilterType>("all");
  const [followUpDateRange, setFollowUpDateRange] = useState<
    DateRange | undefined
  >();
  const [isFollowUpDateRangePickerOpen, setIsFollowUpDateRangePickerOpen] =
    useState(false);

  const [isQRCodeModalOpen, setIsQRCodeModalOpen] = useState(false);
  const [isSMSModalOpen, setIsSMSModalOpen] = useState(false);

  const [selectedPatientForQR, setSelectedPatientForQR] =
    useState<Patient | null>(null);
  const [selectedPatientForSMS, setSelectedPatientForSMS] =
    useState<Patient | null>(null);

  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [isServicePaymentDialogOpen, setIsServicePaymentDialogOpen] =
    useState(false);
  const [servicePaymentPatient, setServicePaymentPatient] =
    useState<Patient | null>(null);
  const [isSubmittingServicePayment, setIsSubmittingServicePayment] =
    useState(false);

  const fetchPatientDetailsForEmail = async (patientId: string) => {
    try {
      setEmailBody("Loading patient details...");

      interface EmailDetailsResponse {
        success: boolean;
        data: any;
      }

      const response: EmailDetailsResponse = await crudRequest(
        "GET",
        `/patient/get-patient-email-details/${patientId}`
      );

      if (response.success) {
        const patientData = response.data;
        setEmailBody(formatPatientEmailBody(patientData));
      } else {
        setEmailBody(
          "Failed to load patient details. Please type your message here."
        );
      }
    } catch (error) {
      console.error("Error fetching patient details for email:", error);
      setEmailBody(
        "Error loading patient details. Please type your message here."
      );
    }
  };

  const formatPatientEmailBody = (patientData: any) => {
    const { personalDetails, medicalDetails, treatments } = patientData;

    let emailBody = `Dear ${personalDetails.name},\n\n`;
    emailBody += `Thank you for choosing ${dentalName} for your dental care needs. Below is a summary of your dental records.\n\n`;

    emailBody += `===== PERSONAL INFORMATION =====\n`;
    emailBody += `Name: ${personalDetails.name}\n`;
    if (personalDetails.sn) emailBody += `Patient ID: ${personalDetails.sn}\n`;
    emailBody += `Contact: ${personalDetails.contactNumber || "N/A"}\n`;
    emailBody += `Email: ${personalDetails.emailAddress || "N/A"}\n`;
    emailBody += `Age: ${personalDetails.age || "N/A"}\n`;
    emailBody += `Gender: ${personalDetails.gender || "N/A"}\n`;
    if (personalDetails.address)
      emailBody += `Address: ${personalDetails.address}\n`;
    if (personalDetails.referredBy)
      emailBody += `Referred By: ${personalDetails.referredBy}\n`;
    if (personalDetails.checkUpDate) {
      const formattedDate = new Date(
        personalDetails.checkUpDate
      ).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      emailBody += `Last Check-up: ${formattedDate}\n`;
    }
    emailBody += `\n`;

    if (
      medicalDetails &&
      medicalDetails.length > 0 &&
      medicalDetails[0].medicalHistory
    ) {
      const medicalHistory = medicalDetails[0].medicalHistory;
      emailBody += `===== MEDICAL HISTORY =====\n`;

      if (medicalHistory.noMedicalIssues) {
        emailBody += `No significant medical issues reported.\n`;
      } else {
        if (medicalHistory.bloodPressure)
          emailBody += `Blood Pressure: ${medicalHistory.bloodPressure}\n`;
        if (medicalHistory.diabetes) emailBody += `Diabetes: Yes\n`;
        if (medicalHistory.thyroid) emailBody += `Thyroid Issues: Yes\n`;
        if (medicalHistory.bleedingDisorder)
          emailBody += `Bleeding Disorder: Yes\n`;
        if (medicalHistory.asthma) emailBody += `Asthma: Yes\n`;
        if (medicalHistory.pregnancy) emailBody += `Pregnancy: Yes\n`;
        if (medicalHistory.allergies)
          emailBody += `Allergies: ${medicalHistory.allergies}\n`;
        if (medicalHistory.otherConditions)
          emailBody += `Other Medical Conditions: ${medicalHistory.otherConditions}\n`;
      }
      emailBody += `\n`;
    }

    if (treatments && treatments.length > 0) {
      emailBody += `===== TREATMENT SUMMARY =====\n`;
      treatments.forEach((treatment: any, index: number) => {
        emailBody += `Treatment #${index + 1}: ${treatment.treatmentDetails || "General Dental Treatment"}\n`;

        if (treatment.treatmentDate) {
          const formattedDate = new Date(
            treatment.treatmentDate
          ).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });
          emailBody += `Date: ${formattedDate}\n`;
        }

        if (treatment.diagnosis)
          emailBody += `Diagnosis: ${treatment.diagnosis}\n`;
        if (treatment.teethNumber)
          emailBody += `Teeth Involved: ${treatment.teethNumber}\n`;
        emailBody += `Status: ${treatment.isCompleted ? "Completed" : "In Progress"}\n`;
        if (treatment.doctorName)
          emailBody += `Treated By: ${treatment.doctorName}\n`;

        if (treatment.treatmentAmount) {
          emailBody += `Total Amount: ₹${treatment.treatmentAmount}\n`;
          if (treatment.advancedAmount)
            emailBody += `Advance Paid: ₹${treatment.advancedAmount}\n`;
          if (treatment.balanceAmount !== undefined)
            emailBody += `Balance: ₹${treatment.balanceAmount}\n`;
        }

        if (treatment.teethDetails && treatment.teethDetails.length > 0) {
          emailBody += `\n  Detailed Treatment:\n`;
          treatment.teethDetails.forEach((tooth: any) => {
            emailBody += `  - Tooth #${tooth.toothNumber}: ${tooth.treatmentName || "Treatment"}\n`;

            if (tooth.sessions && tooth.sessions.length > 0) {
              emailBody += `    Sessions:\n`;
              tooth.sessions.forEach((session: any, sIndex: number) => {
                const sessionDate = new Date(session.date).toLocaleDateString(
                  "en-US",
                  {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  }
                );
                emailBody += `    ${sIndex + 1}. ${sessionDate}: ${session.details || "Treatment session"}\n`;
                if (session.amount)
                  emailBody += `       Amount: ₹${session.amount}, Paid: ₹${session.paid || 0}\n`;
                emailBody += `       Status: ${session.completed ? "Completed" : "Pending"}\n`;
                if (session.doctor)
                  emailBody += `       Doctor: ${session.doctor}\n`;
              });
            }

            if (tooth.totalAmount) {
              emailBody += `    Total for tooth #${tooth.toothNumber}: ₹${tooth.totalAmount}\n`;
              emailBody += `    Paid: ₹${tooth.paidAmount || 0}, Remaining: ₹${tooth.remainingAmount || 0}\n`;
            }
          });
        }

        emailBody += `\n`;
      });
    }

    emailBody += `===== ADDITIONAL INFORMATION =====\n`;
    emailBody += `For any questions or to schedule your next appointment, please contact us at:\n`;
    emailBody += `Phone: +977-9858424157 / +977-9848420357\n`;
    emailBody += `Email:  "contact@om-shreenagar-dental-clinic.com"}\n\n`;
    emailBody += `Thank you for choosing ${dentalName} for your dental care needs.\n\n`;
    emailBody += `Best regards,\nDr. Shree Nagar and Team`;

    return emailBody;
  };

  const handleSendEmail = (patient: Patient) => {
    if (!patient.personalDetails.emailAddress) {
      toast.error("This patient doesn't have an email address.");
      return;
    }

    setEmailPatient(patient);
    setEmailSubject(
      `Dental Treatment Information - ${patient.personalDetails.name}`
    );
    setIsEmailDialogOpen(true);

    fetchPatientDetailsForEmail(patient._id);
  };

  const sendEmail = async () => {
    if (!emailPatient) return;

    if (!emailSubject.trim()) {
      toast.error("Email subject cannot be empty");
      return;
    }

    if (!emailBody.trim()) {
      toast.error("Email body cannot be empty");
      return;
    }

    setIsSendingEmail(true);

    try {
      await crudRequest("POST", "/patient/send-email", {
        patientId: emailPatient._id,
        subject: emailSubject,
        body: emailBody,
      });

      toast.success(
        `Email sent successfully to ${emailPatient.personalDetails.name}`
      );
      setIsEmailDialogOpen(false);
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("Failed to send email. Please try again.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleEditPayment = (patient: Patient) => {
    setPaymentPatient(patient);
    setIsPaymentDialogOpen(true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    fetchPatient(currentPage, itemsPerPage);
    fetchDoctors();
    fetchProcedures();
  }, [currentPage, itemsPerPage]);

  const fetchDoctors = async () => {
    try {
      const response = await crudRequest("GET", "/doctor/get-doctor");
      if (response && Array.isArray(response)) {
        setDoctors(response);
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
    }
  };

  const fetchProcedures = async () => {
    try {
      const response = await crudRequest<ProcedureResponse>(
        "GET",
        "/patient/get-procedure-types"
      );
      if (response && response.success && Array.isArray(response.procedures)) {
        setAvailableProcedures(response.procedures);
      }
    } catch (error) {
      console.error("Error fetching procedures:", error);
    }
  };

  const handleDateFilterChange = (filter: DateFilterType) => {
    setDateFilter(filter);
    setIsFilteringEnabled(true);

    if (filter === "custom") {
      setIsDateRangePickerOpen(true);
    } else {
      setDateRange(undefined);
      fetchPatientsByDateFilter(filter as "all" | "today" | "week" | "month");
    }
  };

  const fetchPatientsByDateFilter = async (
    filter: "all" | "today" | "week" | "month"
  ) => {
    setIsTableLoading(true);
    try {
      let endpoint = "/patient/get-pagination-patient";
      let queryParams = `?page=${currentPage}&limit=${itemsPerPage}&search=${searchQuery}&dateFilter=${filter}`;

      if (selectedDoctor !== "all") {
        queryParams += `&doctorId=${selectedDoctor}`;
        endpoint = "/patient/get-filtered-patients";
      }

      if (selectedProcedures.length > 0) {
        queryParams += `&procedures=${selectedProcedures.join(",")}`;
        endpoint = "/patient/get-filtered-patients";
      }

      const response: { patients: Patient[]; totalPages: number } =
        await crudRequest("GET", `${endpoint}${queryParams}`);

      if (response && Array.isArray(response.patients)) {
        setPatient(response.patients);
        setFilteredPatients(response.patients);
        setTotalPages(response.totalPages);
      } else {
        setError("Unexpected response format");
      }
    } catch (error) {
      setError("Error fetching patient data");
      console.error("Error fetching patient data:", error);
    } finally {
      setIsTableLoading(false);
    }
  };

  const fetchPatientsByDateRange = async (from: Date, to: Date) => {
    setIsTableLoading(true);
    try {
      let endpoint = "/patient/get-pagination-patient";
      let queryParams = `?page=${currentPage}&limit=${itemsPerPage}&search=${searchQuery}&dateFilter=custom&startDate=${from.toISOString()}&endDate=${to.toISOString()}`;

      if (selectedDoctor !== "all") {
        queryParams += `&doctorId=${selectedDoctor}`;
        endpoint = "/patient/get-filtered-patients";
      }

      if (selectedProcedures.length > 0) {
        queryParams += `&procedures=${selectedProcedures.join(",")}`;
        endpoint = "/patient/get-filtered-patients";
      }

      const response: { patients: Patient[]; totalPages: number } =
        await crudRequest("GET", `${endpoint}${queryParams}`);

      if (response && Array.isArray(response.patients)) {
        setPatient(response.patients);
        setFilteredPatients(response.patients);
        setTotalPages(response.totalPages);
      } else {
        setError("Unexpected response format");
      }
    } catch (error) {
      setError("Error fetching patient data");
      console.error("Error fetching patient data:", error);
    } finally {
      setIsTableLoading(false);
    }
  };

  const fetchPatient = async (
    page: number = 1,
    limit: number = itemsPerPage,
    search: string = ""
  ) => {
    setLoading(true);
    setError(null);

    try {
      let endpoint = "/patient/get-pagination-patient";
      let queryParams = `?page=${page}&limit=${limit}&search=${search}`;

      if (dateFilter !== "all") {
        queryParams += `&dateFilter=${dateFilter}`;

        if (dateFilter === "custom" && dateRange?.from && dateRange?.to) {
          queryParams += `&startDate=${dateRange.from.toISOString()}&endDate=${dateRange.to.toISOString()}`;
        }
      }

      if (followUpFilter !== "all") {
        queryParams += `&followUpFilter=${followUpFilter}`;

        if (
          followUpFilter === "custom" &&
          followUpDateRange?.from &&
          followUpDateRange?.to
        ) {
          queryParams += `&startDate=${followUpDateRange.from.toISOString()}&endDate=${followUpDateRange.to.toISOString()}`;
        }
      }

      if (
        isFilteringEnabled &&
        (selectedDoctor !== "all" ||
          selectedProcedures.length > 0 ||
          selectedGroup !== "all")
      ) {
        endpoint = "/patient/get-filtered-patients";
        if (selectedDoctor !== "all") {
          queryParams += `&doctorId=${selectedDoctor}`;
        }
        if (selectedGroup !== "all") {
          queryParams += `&group=${selectedGroup}`;
        }
        if (selectedProcedures.length > 0) {
          queryParams += `&procedures=${selectedProcedures.join(",")}`;
        }
      }

      const response: { patients: Patient[]; totalPages: number } =
        await crudRequest("GET", `${endpoint}${queryParams}`);
      if (response && Array.isArray(response.patients)) {
        console.log(
          `Received ${response.patients.length} patients from server`
        );
        setPatient(response.patients);
        setFilteredPatients(response.patients);
        setTotalPages(response.totalPages);
      } else {
        setError("Unexpected response format");
      }
    } catch (error) {
      setError("Error fetching patient data");
      console.error("Error fetching patient data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatient(currentPage, itemsPerPage, searchQuery);
  }, [
    currentPage,
    itemsPerPage,
    searchQuery,
    isFilteringEnabled,
    selectedDoctor,
    selectedGroup,
    selectedProcedures,
    dateFilter,
    dateRange,
    followUpFilter,
    followUpDateRange,
  ]);

  useEffect(() => {
    let filtered = patient;

    if (selectedTab !== "all") {
      filtered = filtered.filter(
        (s) =>
          s.personalDetails.gender.toLowerCase() === selectedTab.toLowerCase()
      );
    }

    setFilteredPatients(filtered);
  }, [selectedTab, patient]);

  useEffect(() => {
    setFilteredPatients(patient);
  }, [patient]);

  const handleDoctorChange = (value: string) => {
    setSelectedDoctor(value);
    setIsFilteringEnabled(true);
  };

  const handleGroupChange = (value: string) => {
    setSelectedGroup(value);
    setIsFilteringEnabled(true);
  };

  const handleProcedureToggle = (procedure: string) => {
    setSelectedProcedures((prev) => {
      if (prev.includes(procedure)) {
        return prev.filter((p) => p !== procedure);
      } else {
        return [...prev, procedure];
      }
    });
    setIsFilteringEnabled(true);
  };

  const clearFilters = () => {
    setSelectedDoctor("all");
    setSelectedGroup("all");
    setSelectedProcedures([]);
    setDateFilter("all");
    setDateRange(undefined);
    setFollowUpFilter("all");
    setFollowUpDateRange(undefined);
    setIsFilteringEnabled(false);
  };

  const handleColumnToggle = (columnId: string) => {
    setSelectedColumns((prev) =>
      prev.map((col) =>
        col.id === columnId ? { ...col, enabled: !col.enabled } : col
      )
    );
  };

  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();

    const patientData = filteredPatients.map((patient) => {
      let treatmentDetails = "";
      let selectedTeethDetails = "";
      let totalAmount = 0;
      let totalPaidAmount = 0;
      let totalRemainingAmount = 0;

      if (patient.medicalDetails && patient.medicalDetails.length > 0) {
        patient.medicalDetails.forEach((medicalDetail) => {
          if (
            medicalDetail.treatmentPlanning &&
            medicalDetail.treatmentPlanning.length > 0
          ) {
            medicalDetail.treatmentPlanning.forEach((plan, planIndex) => {
              treatmentDetails += `Treatment Plan ${planIndex + 1}:\n`;
              treatmentDetails += `Date: ${plan.treatmentDate ? new Date(plan.treatmentDate).toLocaleDateString() : "N/A"}\n`;
              treatmentDetails += `Details: ${plan.treatmentDetails || "N/A"}\n\n`;

              if (
                plan.selectedTeethDetails &&
                plan.selectedTeethDetails.length > 0
              ) {
                plan.selectedTeethDetails.forEach((tooth) => {
                  if (
                    tooth.dailyTreatments &&
                    tooth.dailyTreatments.length > 0
                  ) {
                    const toothTotal = tooth.dailyTreatments.reduce(
                      (sum, treatment) =>
                        sum + (treatment.treatmentAmount || 0),
                      0
                    );
                    const toothPaid = tooth.dailyTreatments.reduce(
                      (sum, treatment) => sum + (treatment.paidAmount || 0),
                      0
                    );
                    const toothRemaining = toothTotal - toothPaid;

                    totalAmount += toothTotal;
                    totalPaidAmount += toothPaid;
                    totalRemainingAmount += toothRemaining;

                    selectedTeethDetails += `Tooth ${tooth.number}:\n`;
                    selectedTeethDetails += `Procedure: ${tooth.procedure || "N/A"}\n`;
                    selectedTeethDetails += `Position: ${tooth.position || "N/A"}\n`;
                    selectedTeethDetails += `Total: ₹${toothTotal}\n`;
                    selectedTeethDetails += `Paid: ₹${toothPaid}\n`;
                    selectedTeethDetails += `Remaining: ₹${toothRemaining}\n\n`;

                    selectedTeethDetails += `Daily Treatments:\n`;
                    tooth.dailyTreatments.forEach((treatment, index) => {
                      selectedTeethDetails += `  ${index + 1}. Date: ${new Date(treatment.date).toLocaleDateString()}\n`;
                      selectedTeethDetails += `     Amount: ₹${treatment.treatmentAmount || 0}\n`;
                      selectedTeethDetails += `     Paid: ₹${treatment.paidAmount || 0}\n`;
                      selectedTeethDetails += `     Remaining: ₹${(treatment.treatmentAmount || 0) - (treatment.paidAmount || 0)}\n`;
                      if (treatment.procedure) {
                        selectedTeethDetails += `     Procedure: ${treatment.procedure}\n`;
                      }
                      if (treatment.notes) {
                        selectedTeethDetails += `     Notes: ${treatment.notes}\n`;
                      }
                      selectedTeethDetails += `     Status: ${treatment.isCompleted ? "Completed" : "In Progress"}\n\n`;
                    });
                  }
                });
              }
            });
          }
        });
      }

      const data: Record<string, any> = {
        sn: patient.personalDetails.sn,
        name: patient.personalDetails.name,
        contact: patient.personalDetails.contactNumber,
        gender: patient.personalDetails.gender,
        address: patient.personalDetails.address || "",
        age: patient.personalDetails.age,
        checkupDate: patient.personalDetails.checkUpDate
          ? new Date(patient.personalDetails.checkUpDate).toLocaleDateString()
          : "",
        totalAmount: `₹${totalAmount}`,
        paidAmount: `₹${totalPaidAmount}`,
        remainingAmount: `₹${totalRemainingAmount}`,
        treatmentDetails: treatmentDetails || "No treatment plans",
        teethDetails: selectedTeethDetails || "No teeth details",
      };

      const filteredData: Record<string, any> = {};
      selectedColumns.forEach((col) => {
        if (col.enabled) {
          filteredData[col.label] = data[col.id];
        }
      });

      return filteredData;
    });

    const worksheet = XLSX.utils.json_to_sheet(patientData);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Patient List");

    const columnWidths: number[] = [];
    patientData.forEach((patient) => {
      Object.keys(patient).forEach((key, index) => {
        const value = patient[key as keyof typeof patient]
          ? patient[key as keyof typeof patient].toString()
          : "";
        if (!columnWidths[index] || columnWidths[index] < value.length) {
          columnWidths[index] = value.length;
        }
      });
    });

    worksheet["!cols"] = columnWidths.map((width) => ({
      wch: Math.max(width, 15),
    }));

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    const fileName = `patient_data_${new Date().toISOString().slice(0, 10)}.xlsx`;
    saveAs(data, fileName);
    setIsExportDialogOpen(false);
  };

  const exportContactsToExcel = async () => {
    try {
      setIsContactExportLoading(true);
      
      // Make API call to backend export endpoint
      const response = await fetch('http://localhost:5000/api/patient/export-contacts', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token') || localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorMessage = 'Failed to export contacts';
        throw errorMessage;
      }

      // Get the blob from response
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `patient_contacts_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Patient contacts exported successfully!');
    } catch (error) {
      console.error('Error exporting contacts:', error);
      toast.error('Failed to export patient contacts');
    } finally {
      setIsContactExportLoading(false);
    }
  };

  const renderDateFilter = () => {
    const getDateFilterLabel = () => {
      switch (dateFilter) {
        case "today":
          return "Today";
        case "week":
          return "This Week";
        case "month":
          return "This Month";
        case "custom":
          if (dateRange?.from && dateRange?.to) {
            return `${format(dateRange.from, "PP")} - ${format(dateRange.to, "PP")}`;
          }
          return "Custom Range";
        default:
          return "All Time";
      }
    };

    return (
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center">
              <Calendar className="h-2 w-2" />
              <span className="text-xs">{getDateFilterLabel()}</span>
            </Button>
          </DropdownMenuTrigger>
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>
                  Filter by Registration Date
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleDateFilterChange("all")}>
                  All Time
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDateFilterChange("today")}
                >
                  Today
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDateFilterChange("week")}
                >
                  This Week
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDateFilterChange("month")}
                >
                  This Month
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDateFilterChange("custom")}
                >
                  Custom Range
                </DropdownMenuItem>
              </DropdownMenuContent>
            </motion.div>
          </AnimatePresence>
        </DropdownMenu>

        {dateFilter === "custom" && (
          <Badge variant="outline" className="flex items-center gap-1">
            {dateRange?.from && dateRange?.to
              ? `${format(dateRange.from, "PP")} - ${format(dateRange.to, "PP")}`
              : "Select dates"}
            <X
              className="h-3 w-3 cursor-pointer"
              onClick={() => {
                setDateFilter("all");
                setDateRange(undefined);
                fetchPatient(currentPage, itemsPerPage, searchQuery);
              }}
            />
          </Badge>
        )}
      </div>
    );
  };

  const renderDateRangePicker = () => (
    <Drawer
      open={isDateRangePickerOpen}
      onOpenChange={setIsDateRangePickerOpen}
    >
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Select Date Range</DrawerTitle>
          <DrawerDescription>
            Choose a custom date range to filter patients
          </DrawerDescription>
        </DrawerHeader>
        <div className="p-4 flex justify-center">
          <DatePickerWithRange
            date={dateRange}
            setDate={(range) => {
              setDateRange(range);
              if (range?.from && range?.to) {
                fetchPatientsByDateRange(range.from, range.to);
                setIsDateRangePickerOpen(false);
              }
            }}
          />
        </div>
        <DrawerFooter>
          <Button
            onClick={() => setIsDateRangePickerOpen(false)}
            variant="outline"
          >
            Cancel
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );

  const handleQRCodeClick = (patient: Patient) => {
    setSelectedPatientForQR(patient);
    setIsQRCodeModalOpen(true);
  };

  const handleSMSClick = (patient: Patient) => {
    setSelectedPatientForSMS(patient);
    setIsSMSModalOpen(true);
  };

  const renderPatientTable = () => (
    <Card className="transition-all duration-300 hover:shadow-xl border border-foreground/10 rounded-xl overflow-hidden">
      {" "}
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 pb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <UserCircle className="h-6 w-6 text-primary" />
            <CardTitle className="text-md font-bold tracking-tight">
              Patient List
            </CardTitle>
          </div>
          <div className=" items-center gap-2 w-full sm:w-auto justify-end hidden">
            {/* {renderViewModeToggle()} */}
            {viewMode === "table" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCompactView(!isCompactView)}
                className="gap-2"
              >
                {isCompactView ? (
                  <>
                    <LayoutGrid className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    <LayoutList className="h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
        <CardDescription className="text-muted-foreground">
          Manage your patients and view their details. Total:{" "}
          {filteredPatients.length} patients
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="w-full rounded-md overflow-hidden">
          {isTableLoading ? (
            <div className="p-6">
              <DataTableSkeleton columns={8} rows={5} />
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <div className="flex flex-col items-center gap-2">
                <FileX className="h-10 w-10 text-muted-foreground/50" />
                <p>No patients found for the selected filters</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    clearFilters();
                    setDateFilter("all");
                    setDateRange(undefined);
                    fetchPatient(currentPage, itemsPerPage, searchQuery);
                  }}
                  className="mt-2"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          ) : (
            <>
              {viewMode === "table" && (
                <div className="overflow-x-auto">
                  <Table className="min-w-[800px]">
                    <TableHeader className="bg-muted/50 sticky top-0 z-10">
                      <TableRow>
                        <TableHead className="text-sm font-semibold text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <span>#</span>
                          </div>
                        </TableHead>
                        {!isCompactView && (
                          <TableHead className="text-sm font-semibold text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <UserCircle className="h-4 w-4" />
                              <span>Photo</span>
                            </div>
                          </TableHead>
                        )}
                        <TableHead className="text-sm font-semibold text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            <span>Name</span>
                          </div>
                        </TableHead>
                        <TableHead className="text-sm font-semibold text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            <span>Contact</span>
                          </div>
                        </TableHead>
                        <TableHead className="text-sm font-semibold text-muted-foreground hidden md:table-cell">
                          <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            <span>Email</span>
                          </div>
                        </TableHead>
                        <TableHead className="text-sm font-semibold text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>Age</span>
                          </div>
                        </TableHead>
                        <TableHead className="text-sm font-semibold text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <span>Gender</span>
                          </div>
                        </TableHead>
                        {!isCompactView && (
                          <TableHead className="text-sm font-semibold text-muted-foreground hidden lg:table-cell">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              <span>Address</span>
                            </div>
                          </TableHead>
                        )}

                        <TableHead className="text-sm font-semibold text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>Next Follow-up</span>
                          </div>
                        </TableHead>
                        {/* Report Column Header - Commented Out */}
                        {/* <TableHead className="text-sm font-semibold text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <span>Report</span>
                          </div>
                        </TableHead> */}
                        <TableHead className="text-sm font-semibold text-muted-foreground text-right">
                          <div className="flex items-center gap-1 justify-end">
                            <Settings className="h-4 w-4" />
                            <span>Actions</span>
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence>
                        {filteredPatients.map((patient, index) => (
                          <motion.tr
                            key={patient._id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                            className={`group hover:bg-primary/5 transition-colors cursor-pointer ${
                              index % 2 === 0 ? "bg-muted/30" : "bg-background"
                            }`}
                            onClick={() => {
                              setSelectedPatient(patient);
                              setIsViewDrawerOpen(true);
                            }}
                          >
                            <TableCell
                              className={`font-medium ${isCompactView ? "py-2" : "py-4"}`}
                            >
                              {patient.personalDetails.sn}
                            </TableCell>
                            {!isCompactView && (
                              <TableCell>
                                <Avatar className="h-10 w-10 border-2 border-background shadow-sm transition-all duration-200 group-hover:border-primary/20 group-hover:scale-110">
                                  <AvatarImage
                                    src={
                                      patient.personalDetails.profilePhoto?.url
                                    }
                                    alt={patient.personalDetails.name}
                                  />
                                  <AvatarFallback className="bg-primary/10 text-primary">
                                    {patient.personalDetails.name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              </TableCell>
                            )}
                            <TableCell className="font-medium">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  {isCompactView && (
                                    <Avatar className="h-6 w-6 mr-1">
                                      <AvatarImage
                                        src={
                                          patient.personalDetails.profilePhoto
                                            ?.url
                                        }
                                        alt={patient.personalDetails.name}
                                      />
                                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                        {patient.personalDetails.name
                                          .split(" ")
                                          .map((n) => n[0])
                                          .join("")
                                          .toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                  )}
                                  <span className="font-semibold">
                                    {patient.personalDetails.name}
                                  </span>
                                </div>
                                {!isCompactView && (
                                  <span className="text-xs text-muted-foreground">
                                    Added:{" "}
                                    {new Date(
                                      patient.createdAt
                                    ).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-mono text-sm">
                                {patient.personalDetails.contactNumber}
                              </span>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <span className="text-sm truncate max-w-[150px] block">
                                {patient.personalDetails.emailAddress || "-"}
                              </span>
                            </TableCell>
                            <TableCell>{patient.personalDetails.age}</TableCell>
                            <TableCell>
                              <Badge
                                variant="glass"
                                className={
                                  patient.personalDetails.gender === "Male"
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : patient.personalDetails.gender ===
                                        "Female"
                                      ? "bg-pink-50 text-pink-700 border-pink-200"
                                      : "bg-purple-50 text-purple-700 border-purple-200"
                                }
                              >
                                {patient.personalDetails.gender}
                              </Badge>
                            </TableCell>

                            {!isCompactView && (
                              <TableCell className="hidden lg:table-cell">
                                <span className="truncate max-w-[200px] block">
                                  {patient.personalDetails.address}
                                </span>
                              </TableCell>
                            )}

                            {/* Follow-up Cell */}
                            <TableCell>
                              {(() => {
                                const allFollowUps = patient.medicalDetails
                                  .flatMap(
                                    (record) => record.treatmentPlanning || []
                                  )
                                  .flatMap((plan) => plan.followUps || [])
                                  .filter((followUp) => !followUp.completed)
                                  .sort(
                                    (a, b) =>
                                      new Date(a.date).getTime() -
                                      new Date(b.date).getTime()
                                  );

                                const handleFollowUpClick = (e: React.MouseEvent) => {
                                  e.stopPropagation(); // Prevent row click
                                  setSelectedPatientForFollowUp(patient);
                                  setIsFollowUpDialogOpen(true);
                                };

                                if (allFollowUps.length === 0) {
                                  return (
                                    <button
                                      onClick={handleFollowUpClick}
                                      className="text-xs text-muted-foreground hover:text-primary hover:bg-gray-50 px-2 py-1 rounded transition-colors cursor-pointer"
                                      title="Click to manage follow-ups"
                                    >
                                      No follow-up
                                    </button>
                                  );
                                }

                                const nextFollowUp = allFollowUps[0];
                                const isOverdue =
                                  new Date(nextFollowUp.date) < new Date();

                                return (
                                  <button
                                    onClick={handleFollowUpClick}
                                    className="flex flex-col hover:bg-gray-50 px-2 py-1 rounded transition-colors cursor-pointer text-left w-full"
                                    title="Click to manage follow-ups"
                                  >
                                    <span
                                      className={`text-xs font-medium ${
                                        isOverdue
                                          ? "text-red-600"
                                          : "text-blue-600"
                                      }`}
                                    >
                                      {new Date(
                                        nextFollowUp.date
                                      ).toLocaleDateString()}
                                    </span>
                                    <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                                      {nextFollowUp.type}
                                    </span>
                                    {allFollowUps.length > 1 && (
                                      <span className="text-xs text-muted-foreground">
                                        +{allFollowUps.length - 1} more
                                      </span>
                                    )}
                                  </button>
                                );
                              })()}
                            </TableCell>

                            {/* Report Button - Commented Out */}
                            {/* <TableCell className="table-cell">
                              <button
                                className={`relative overflow-hidden group flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-sm font-medium transition-all duration-500 rounded-lg
                                  ${
                                    isGeneratingReport &&
                                    selectedPatient?._id === patient._id
                                      ? "bg-gradient-to-r from-green-600 to-blue-600 scale-95"
                                      : "bg-gradient-to-br  from-green-500/90 via-lime-500/90 to-sky-500/90 hover:scale-[1.03] hover:shadow-xl hover:shadow-blue-500/30"
                                  }
                                  backdrop-blur-sm border border-white/10 hover:border-white/20`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleGenerateReport(patient);
                                }}
                                disabled={
                                  isGeneratingReport &&
                                  selectedPatient?._id === patient._id
                                }
                              >
                                <span className="absolute inset-0 overflow-hidden rounded-xl">
                                  <span className="absolute inset-0 bg-gradient-to-br from-green-500/90 via-lime-500/90 to-sky-500/90 group-hover:from-teal-500/80 group-hover:via-green-500/80 group-hover:to-blue-500/80 transition-all duration-700"></span>
                                  <span className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></span>
                                  <span className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.1),rgba(255,255,255,0.05),transparent)]"></span>
                                </span>

                                {isGeneratingReport &&
                                selectedPatient?._id === patient._id ? (
                                  <div className="relative flex items-center justify-center space-x-2 z-10">
                                    <span className="w-2.5 h-2.5 bg-blue-950 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="w-2.5 h-2.5 bg-blue-950 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="w-2.5 h-2.5 bg-blue-950 rounded-full animate-bounce"></span>
                                    <span className="absolute -bottom-5 text-[11px] font-normal text-white/70 tracking-wider">
                                      Analyzing...
                                    </span>
                                  </div>
                                ) : (
                                  <>
                                    <div className="relative z-10 flex items-center gap-1">
                                      <div className="relative">
                                        <Zap className="w-3 h-3 text-blue-950 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300" />
                                        <span className="absolute -inset-1 bg-white/20 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                                      </div>
                                      <span className="text-blue-950 font-medium tracking-wide relative text-xs">
                                        <span className="relative z-10">
                                          Report
                                        </span>
                                        <span className="absolute -bottom-0.5 left-0 w-0 h-[1px] bg-white/50 group-hover:w-full transition-all duration-400"></span>
                                      </span>
                                    </div>
                                    <span className="absolute inset-0 overflow-hidden rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                      {[...Array(6)].map((_, i) => (
                                        <span
                                          key={i}
                                          className="absolute w-1 h-1 bg-white/40 rounded-full"
                                          style={{
                                            top: `${Math.random() * 100}%`,
                                            left: `${Math.random() * 100}%`,
                                            animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
                                            animationDelay: `${Math.random() * 2}s`,
                                          }}
                                        ></span>
                                      ))}
                                    </span>
                                  </>
                                )}

                                <span className="absolute inset-0 border border-white/10 rounded-lg group-hover:border-white/20 transition-all duration-500"></span>
                                <span className="absolute inset-0 rounded-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]"></span>

                                <span className="absolute inset-0 rounded-xl overflow-hidden">
                                  <span className="absolute top-0 -left-full h-full w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:animate-shine"></span>
                                </span>
                              </button>

                              <style
                                dangerouslySetInnerHTML={{
                                  __html: `
                                  @keyframes float {
                                    0% { transform: translateY(0) translateX(0) scale(1); opacity: 0.8; }
                                    50% { transform: translateY(-15px) translateX(5px) scale(1.1); opacity: 1; }
                                    100% { transform: translateY(0) translateX(0) scale(1); opacity: 0.8; }
                                  }
                                  @keyframes shine {
                                    to {
                                      left: 200%;
                                    }
                                  }
                                `,
                                }}
                              />
                            </TableCell> */}
                            <TableCell className="text-right p-2">
                              <div className="flex justify-end gap-1 items-center">
                                {/* View Button */}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-blue-600 hover:bg-green-200 hover:text-blue-700"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedPatient(patient);
                                    setIsViewDrawerOpen(true);
                                  }}
                                  title="View Patient"
                                >
                                  <View className="h-4 w-4" />
                                </Button>

                                {!isCompactView && (
                                  <>
                                    {/* Edit Button */}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedPatient(patient);
                                        setIsUpdateModalOpen(true);
                                      }}
                                      title="Edit Patient"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>

                                    {/* QR Code */}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-violet-600 hover:bg-violet-50 hover:text-violet-700"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleQRCodeClick(patient);
                                      }}
                                      title="QR Code"
                                    >
                                      <QrCode className="h-4 w-4" />
                                    </Button>

                                    {/* SMS Button */}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-green-600 hover:bg-green-50 hover:text-green-700"
                                      title="Send SMS"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSMSClick(patient);
                                      }}
                                      disabled={
                                        !patient.personalDetails.contactNumber
                                      }
                                    >
                                      <MessageSquare className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}

                                {/* Dropdown Menu */}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 p-0"
                                    >
                                      <span className="sr-only">Open menu</span>
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>

                                  <DropdownMenuContent
                                    align="end"
                                    className="overflow-auto min-w-[220px]"
                                  >
                                    <DropdownMenuLabel>
                                      Actions
                                    </DropdownMenuLabel>

                                    {/* Upload Photo */}
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        requestAnimationFrame(() => {
                                          document
                                            .getElementById(
                                              `profile-photo-btn-${patient._id}`
                                            )
                                            ?.click();
                                        });
                                      }}
                                      className="gap-2"
                                    >
                                      <UserCircle className="h-4 w-4" />
                                      Upload Photo
                                    </DropdownMenuItem>

                                    {/* Upload Documents */}
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        requestAnimationFrame(() => {
                                          document
                                            .getElementById(
                                              `upload-docs-btn-${patient._id}`
                                            )
                                            ?.click();
                                        });
                                      }}
                                      className="gap-2"
                                    >
                                      <FileUp className="h-4 w-4" />
                                      Upload Documents
                                    </DropdownMenuItem>

                                    {/* Add Prescription */}
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        requestAnimationFrame(() => {
                                          document
                                            .getElementById(
                                              `prescription-btn-${patient._id}`
                                            )
                                            ?.click();
                                        });
                                      }}
                                      className="gap-2"
                                    >
                                      <FilePlus className="h-4 w-4" />
                                      Add Prescription
                                    </DropdownMenuItem>

                                    {/* Edit Payment */}
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditPayment(patient);
                                      }}
                                      className="gap-2"
                                    >
                                      <CreditCard className="h-4 w-4" />
                                      Edit Payment
                                    </DropdownMenuItem>

                                    {/* Add Service Payment */}
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAddServicePayment(patient);
                                      }}
                                      className="gap-2"
                                    >
                                      <CreditCard className="h-4 w-4" />
                                      Add Service Payment
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator />

                                    {/* Send Email */}
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSendEmail(patient);
                                      }}
                                      className="gap-2"
                                      disabled={
                                        !patient.personalDetails.emailAddress
                                      }
                                    >
                                      <Mail className="h-4 w-4" />
                                      Send Email
                                    </DropdownMenuItem>

                                    {/* WhatsApp */}
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const phone =
                                          patient.personalDetails.contactNumber;
                                        if (phone) {
                                          const formatted = phone.startsWith(
                                            "+"
                                          )
                                            ? phone.replace(/\s/g, "")
                                            : `+977${phone.replace(/\s/g, "")}`;
                                          window.open(
                                            `https://wa.me/${formatted}`,
                                            "_blank"
                                          );
                                        } else {
                                          toast.error(
                                            "No contact number available"
                                          );
                                        }
                                      }}
                                      className="gap-2"
                                      disabled={
                                        !patient.personalDetails.contactNumber
                                      }
                                    >
                                      <MessageSquare
                                        className="h-4 w-4 text-green-500"
                                        fill="green"
                                      />
                                      WhatsApp
                                    </DropdownMenuItem>

                                    {/* Delete */}
                                    {(adminDetails.role === "admin" ||
                                      adminDetails.role === "superadmin") && (
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setPatientToDelete(patient);
                                          setIsDeleteDialogOpen(true);
                                        }}
                                        className="gap-2 text-red-600 hover:text-red-700"
                                      >
                                        <Trash className="h-4 w-4" />
                                        Delete
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>

                                {/* Hidden Action Buttons (for programmatic clicks) */}
                                <div className="hidden">
                                  <AddPrescriptionButton
                                    id={`prescription-btn-${patient._id}`}
                                    patientId={patient._id}
                                    patientName={patient.personalDetails.name}
                                    patientData={{
                                      contactNumber:
                                        patient.personalDetails.contactNumber,
                                      emailAddress:
                                        patient.personalDetails.emailAddress,
                                      age: patient.personalDetails.age,
                                      gender: patient.personalDetails.gender,
                                      address: patient.personalDetails.address,
                                    }}
                                    isAdmin
                                    variant="outline"
                                    size="sm"
                                  />
                                  <PatientDocumentUploadButton
                                    id={`upload-docs-btn-${patient._id}`}
                                    patientId={patient._id}
                                    medicalDetailId={
                                      patient.medicalDetails?.[0]?._id || ""
                                    }
                                    onSuccess={() =>
                                      fetchPatient(
                                        currentPage,
                                        itemsPerPage,
                                        searchQuery
                                      )
                                    }
                                  />
                                  <ProfilePhotoUploadButton
                                    id={`profile-photo-btn-${patient._id}`}
                                    patientId={patient._id}
                                    patientName={patient.personalDetails.name}
                                    currentPhotoUrl={
                                      patient.personalDetails.profilePhoto?.url
                                    }
                                    onSuccess={() =>
                                      fetchPatient(
                                        currentPage,
                                        itemsPerPage,
                                        searchQuery
                                      )
                                    }
                                  />
                                </div>
                              </div>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </div>{" "}
        <div className="flex flex-col sm:grid sm:grid-cols-1 gap-4 mt-6 md:grid-cols-3 items-center p-4 border-t">
          <div className="w-full sm:w-auto">
            <Select
              onValueChange={(value) => setItemsPerPage(Number(value))}
              value={itemsPerPage.toString()}
            >
              <SelectTrigger id="itemsPerPage" className="w-full sm:w-[180px]">
                <SelectValue placeholder="Items per page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 items per page</SelectItem>
                <SelectItem value="10">10 items per page</SelectItem>
                <SelectItem value="20">20 items per page</SelectItem>
                <SelectItem value="50">50 items per page</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Pagination className="justify-center mt-4 sm:mt-0">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(Math.max(currentPage - 1, 1));
                  }}
                  className={
                    currentPage === 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              {totalPages <= 7 ? (
                // Show all pages if there are 7 or fewer
                [...Array(totalPages)].map((_, index) => (
                  <PaginationItem
                    key={index}
                    className="hidden sm:inline-flex xs:inline-flex"
                  >
                    <PaginationLink
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(index + 1);
                      }}
                      isActive={currentPage === index + 1}
                      className="cursor-pointer"
                    >
                      {index + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))
              ) : (
                // Show pages with ellipsis for many pages
                <>
                  {/* First page always visible */}
                  <PaginationItem className="hidden sm:inline-flex xs:inline-flex">
                    <PaginationLink
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(1);
                      }}
                      isActive={currentPage === 1}
                      className="cursor-pointer"
                    >
                      1
                    </PaginationLink>
                  </PaginationItem>

                  {/* Show ellipsis if not in the first part */}
                  {currentPage > 3 && (
                    <PaginationItem className="hidden sm:inline-flex xs:inline-flex">
                      <PaginationLink className="cursor-default">
                        ...
                      </PaginationLink>
                    </PaginationItem>
                  )}

                  {/* Pages around current page */}
                  {[...Array(totalPages)].map((_, index) => {
                    const pageNumber = index + 1;
                    // Show current page and 1 page before/after on mobile
                    // Show current page and 2 pages before/after on larger screens
                    return (
                      (pageNumber === currentPage ||
                        (pageNumber >= currentPage - 1 &&
                          pageNumber <= currentPage + 1)) && (
                        <PaginationItem key={index}>
                          <PaginationLink
                            onClick={(e) => {
                              e.preventDefault();
                              handlePageChange(pageNumber);
                            }}
                            isActive={currentPage === pageNumber}
                            className="cursor-pointer"
                          >
                            {pageNumber}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    );
                  })}

                  {/* Show ellipsis if not in the last part */}
                  {currentPage < totalPages - 2 && (
                    <PaginationItem className="hidden sm:inline-flex xs:inline-flex">
                      <PaginationLink className="cursor-default">
                        ...
                      </PaginationLink>
                    </PaginationItem>
                  )}

                  {/* Last page always visible */}
                  {totalPages > 1 && (
                    <PaginationItem className="hidden sm:inline-flex xs:inline-flex">
                      <PaginationLink
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(totalPages);
                        }}
                        isActive={currentPage === totalPages}
                        className="cursor-pointer"
                      >
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  )}
                </>
              )}

              <PaginationItem>
                <PaginationNext
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(Math.min(currentPage + 1, totalPages));
                  }}
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>

          <div className="text-right text-sm text-muted-foreground">
            Showing{" "}
            {filteredPatients.length > 0
              ? (currentPage - 1) * itemsPerPage + 1
              : 0}{" "}
            - {Math.min(currentPage * itemsPerPage, filteredPatients.length)} of{" "}
            {filteredPatients.length}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderExportDialog = () => (
    <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Select Columns to Export</DialogTitle>
          <DialogDescription>
            Choose which columns you want to include in the Excel export.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            {selectedColumns.map((column) => (
              <div key={column.id} className="flex items-center space-x-2">
                <Checkbox
                  id={column.id}
                  checked={column.enabled}
                  onCheckedChange={() => handleColumnToggle(column.id)}
                />
                <Label htmlFor={column.id}>{column.label}</Label>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsExportDialogOpen(false)}
          >
            Cancel
          </Button>
          <Button onClick={exportToExcel}>Export</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const handleAddServicePayment = (patient: Patient) => {
    setServicePaymentPatient(patient);
    setIsServicePaymentDialogOpen(true);
  };

  const handleSubmitServicePayment = async (data: any) => {
    if (!servicePaymentPatient) return;

    setIsSubmittingServicePayment(true);
    try {
      const formattedData = {
        ...data,
        date: format(data.date, "yyyy-MM-dd"),
      };

      const response = await createServicePayment(formattedData);

      if (
        typeof response === "object" &&
        response !== null &&
        "success" in response &&
        (response as any).success
      ) {
        toast.success("Service payment added successfully");
        setIsServicePaymentDialogOpen(false);
      } else {
        toast.error("Failed to add service payment");
      }
    } catch (error) {
      console.error("Error adding service payment:", error);
      toast.error("Failed to add service payment");
    } finally {
      setIsSubmittingServicePayment(false);
    }
  };

  // Add follow-up filter handler
  const handleFollowUpFilterChange = (filter: FollowUpFilterType) => {
    setFollowUpFilter(filter);
    setIsFilteringEnabled(true);

    if (filter === "custom") {
      setIsFollowUpDateRangePickerOpen(true);
    } else {
      setFollowUpDateRange(undefined);
      fetchPatientsByFollowUpFilter(
        filter as "all" | "today" | "week" | "month"
      );
    }
  };

  const fetchPatientsByFollowUpFilter = async (
    filter: "all" | "today" | "week" | "month"
  ) => {
    setIsTableLoading(true);
    try {
      let endpoint = "/patient/get-pagination-patient";
      let queryParams = `?page=${currentPage}&limit=${itemsPerPage}&search=${searchQuery}&followUpFilter=${filter}`;

      if (selectedDoctor !== "all") {
        queryParams += `&doctorId=${selectedDoctor}`;
        endpoint = "/patient/get-filtered-patients";
      }

      if (selectedProcedures.length > 0) {
        queryParams += `&procedures=${selectedProcedures.join(",")}`;
        endpoint = "/patient/get-filtered-patients";
      }

      const response: { patients: Patient[]; totalPages: number } =
        await crudRequest("GET", `${endpoint}${queryParams}`);

      if (response && Array.isArray(response.patients)) {
        setPatient(response.patients);
        setFilteredPatients(response.patients);
        setTotalPages(response.totalPages);
      } else {
        setError("Unexpected response format");
      }
    } catch (error) {
      setError("Error fetching patient data");
      console.error("Error fetching patient data:", error);
    } finally {
      setIsTableLoading(false);
    }
  };

  const fetchPatientsByFollowUpDateRange = async (from: Date, to: Date) => {
    setIsTableLoading(true);
    try {
      let endpoint = "/patient/get-pagination-patient";
      let queryParams = `?page=${currentPage}&limit=${itemsPerPage}&search=${searchQuery}&followUpFilter=custom&startDate=${from.toISOString()}&endDate=${to.toISOString()}`;

      if (selectedDoctor !== "all") {
        queryParams += `&doctorId=${selectedDoctor}`;
        endpoint = "/patient/get-filtered-patients";
      }

      if (selectedProcedures.length > 0) {
        queryParams += `&procedures=${selectedProcedures.join(",")}`;
        endpoint = "/patient/get-filtered-patients";
      }

      const response: { patients: Patient[]; totalPages: number } =
        await crudRequest("GET", `${endpoint}${queryParams}`);

      if (response && Array.isArray(response.patients)) {
        console.log(
          `Received ${response.patients.length} patients from server`
        );
        setPatient(response.patients);
        setFilteredPatients(response.patients);
        setTotalPages(response.totalPages);
      } else {
        setError("Unexpected response format");
      }
    } catch (error) {
      setError("Error fetching patient data");
      console.error("Error fetching patient data:", error);
    } finally {
      setIsTableLoading(false);
    }
  };

  const renderFollowUpFilter = () => {
    const getFollowUpFilterLabel = () => {
      switch (followUpFilter) {
        case "today":
          return "Today";
        case "week":
          return "This Week";
        case "month":
          return "This Month";
        case "custom":
          if (followUpDateRange?.from && followUpDateRange?.to) {
            return `${format(followUpDateRange.from, "PP")} - ${format(followUpDateRange.to, "PP")}`;
          }
          return "Custom Range";
        default:
          return "All Time";
      }
    };

    return (
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Calendar className="h-2 w-2" />
              <span className="text-xs">
                Follow-up: {getFollowUpFilterLabel()}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Filter by Follow-up Date</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleFollowUpFilterChange("all")}
                >
                  All Time
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleFollowUpFilterChange("today")}
                >
                  Today
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleFollowUpFilterChange("week")}
                >
                  This Week
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleFollowUpFilterChange("month")}
                >
                  This Month
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleFollowUpFilterChange("custom")}
                >
                  Custom Range
                </DropdownMenuItem>
              </DropdownMenuContent>
            </motion.div>
          </AnimatePresence>
        </DropdownMenu>

        {followUpFilter === "custom" && (
          <Badge variant="outline" className="flex items-center gap-1">
            {followUpDateRange?.from && followUpDateRange?.to
              ? `${format(followUpDateRange.from, "PP")} - ${format(followUpDateRange.to, "PP")}`
              : "Select dates"}
            <X
              className="h-3 w-3 cursor-pointer"
              onClick={() => {
                setFollowUpFilter("all");
                setFollowUpDateRange(undefined);
                fetchPatient(currentPage, itemsPerPage, searchQuery);
              }}
            />
          </Badge>
        )}
      </div>
    );
  };

  const renderFollowUpDateRangePicker = () => (
    <Drawer
      open={isFollowUpDateRangePickerOpen}
      onOpenChange={setIsFollowUpDateRangePickerOpen}
    >
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Select Follow-up Date Range</DrawerTitle>
          <DrawerDescription>
            Choose a custom follow-up date range to filter patients
          </DrawerDescription>
        </DrawerHeader>
        <div className="p-4 flex justify-center">
          <DatePickerWithRange
            date={followUpDateRange}
            setDate={(range) => {
              setFollowUpDateRange(range);
              if (range?.from && range?.to) {
                fetchPatientsByFollowUpDateRange(range.from, range.to);
                setIsFollowUpDateRangePickerOpen(false);
              }
            }}
          />
        </div>
        <DrawerFooter>
          <Button
            onClick={() => setIsFollowUpDateRangePickerOpen(false)}
            variant="outline"
          >
            Cancel
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );

  return (
    <div className="flex flex-col w-full bg-background">
      <div className="flex flex-col sm:gap-4 sm:py-4 ">
        {" "}
        <header className="sticky justify-between top-0 z-30 grid grid-cols-2 md:grid-cols-3 sm:items-center gap-4 px-4 py-2 border-b bg-background  sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <Breadcrumb className="hidden md:flex">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="#">Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="#">Patient</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>All Patients</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="relative flex-1 w-full sm:w-auto sm:max-w-xs">
            <Input
              placeholder="Search patients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-full"
            />
          </div>

          <div className="flex items-center w-full sm:w-auto justify-end mt-2 sm:mt-0">
            <PopupModal
              buttonVariant="ai"
              text="Add Patient"
              icon={<Plus className="w-4 h-4 mr-2" />}
              renderModal={(onClose) => <AddPatient modalClose={onClose} />}
            />
          </div>
        </header>
        <main className="grid items-start grid-cols-1 gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          <Tabs
            defaultValue="all"
            value={selectedTab}
            className="px-2"
            onValueChange={(value) => setSelectedTab(value)}
          >
            {" "}
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 md:gap-4 justify-between">
              <TabsList className="mb-2 sm:mb-0">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="male">Male</TabsTrigger>
                <TabsTrigger value="female">Female</TabsTrigger>
                <TabsTrigger value="other">Other</TabsTrigger>
              </TabsList>{" "}
              <div className="px-2 sm:px-6 flex flex-row flex-wrap gap-3 items-center overflow-x-auto justify-center">
                {renderDateFilter()}
                {renderFollowUpFilter()}

                <Select value={selectedGroup} onValueChange={handleGroupChange}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue
                      placeholder="Select Group"
                      className="text-xs"
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Groups</SelectItem>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Ortho">Ortho</SelectItem>
                    <SelectItem value="Endo">Endo</SelectItem>
                    <SelectItem value="Perio">Perio</SelectItem>
                    <SelectItem value="Prostho">Prostho</SelectItem>
                    <SelectItem value="Surgery">Surgery</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={selectedDoctor}
                  onValueChange={handleDoctorChange}
                >
                  <SelectTrigger className="w-[130px]">
                    <SelectValue
                      placeholder="Select Doctor"
                      className="text-xs"
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Doctors</SelectItem>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor._id} value={doctor._id}>
                        {doctor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <span>Procedures</span>
                      {selectedProcedures.length > 0 && (
                        <Badge className="ml-1">
                          {selectedProcedures.length}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="start">
                    <ScrollArea className="h-[300px] p-4">
                      <div className="space-y-2">
                        {availableProcedures.map((procedure) => (
                          <div
                            key={procedure}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`procedure-${procedure}`}
                              checked={selectedProcedures.includes(procedure)}
                              onCheckedChange={() =>
                                handleProcedureToggle(procedure)
                              }
                            />
                            <label
                              htmlFor={`procedure-${procedure}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {procedure}
                            </label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </PopoverContent>
                </Popover>

                <Button
                  variant="ai"
                  size="sm"
                  onClick={() => setIsExportDialogOpen(true)}
                  className="gap-2"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Export
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportContactsToExcel}
                  disabled={isContactExportLoading}
                  className="gap-2"
                >
                  {isContactExportLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Phone className="h-4 w-4" />
                  )}
                  {isContactExportLoading ? 'Exporting...' : 'Export Contacts'}
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 ml-2">
                {isFilteringEnabled && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => {
                      clearFilters();
                      setDateFilter("all");
                      setDateRange(undefined);
                      setFollowUpFilter("all");
                      setFollowUpDateRange(undefined);
                      fetchPatient(currentPage, itemsPerPage, searchQuery);
                    }}
                    className="flex items-center gap-1"
                  >
                    <X className="h-4 w-4" />
                    Clear All Filters
                  </Button>
                )}

                {dateFilter !== "all" && dateFilter !== "custom" && (
                  <Badge variant="ai" className="flex items-center gap-1">
                    Date:{" "}
                    {dateFilter === "today"
                      ? "Today"
                      : dateFilter === "week"
                        ? "This Week"
                        : "This Month"}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => {
                        setDateFilter("all");
                        fetchPatient(currentPage, itemsPerPage, searchQuery);
                      }}
                    />
                  </Badge>
                )}

                {followUpFilter !== "all" && followUpFilter !== "custom" && (
                  <Badge variant="ai" className="flex items-center gap-1">
                    Follow-up:{" "}
                    {followUpFilter === "today"
                      ? "Today"
                      : followUpFilter === "week"
                        ? "This Week"
                        : "This Month"}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => {
                        setFollowUpFilter("all");
                        fetchPatient(currentPage, itemsPerPage, searchQuery);
                      }}
                    />
                  </Badge>
                )}
                {selectedGroup !== "all" && (
                  <Badge variant="ai" className="flex items-center gap-1">
                    Group: {selectedGroup}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => {
                        setSelectedGroup("all");
                        fetchPatient(currentPage, itemsPerPage, searchQuery);
                      }}
                    />
                  </Badge>
                )}
                {selectedDoctor !== "all" &&
                  doctors.find((d) => d._id === selectedDoctor) && (
                    <Badge variant="ai" className="flex items-center gap-1">
                      Doctor:{" "}
                      {doctors.find((d) => d._id === selectedDoctor)?.name}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => setSelectedDoctor("all")}
                      />
                    </Badge>
                  )}
                {selectedProcedures.map((proc) => (
                  <Badge
                    key={proc}
                    variant="ai"
                    className="flex items-center gap-1"
                  >
                    {proc}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleProcedureToggle(proc)}
                    />
                  </Badge>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/scan-patient")}
                className="gap-2 hidden"
              >
                <QrCode className="h-4 w-4" />
                Scan Patient
              </Button>
            </div>
            {loading ? (
              <div>
                <Loading />
              </div>
            ) : error ? (
              <div>
                <Error />
              </div>
            ) : (
              <div className="w-full overflow-x-auto max-h-[1000px] py-2">
                <TabsContent value="all">{renderPatientTable()}</TabsContent>
                <TabsContent value="male">{renderPatientTable()}</TabsContent>
                <TabsContent value="female">{renderPatientTable()}</TabsContent>
                <TabsContent value="other">{renderPatientTable()}</TabsContent>
              </div>
            )}
          </Tabs>
        </main>
      </div>
      {selectedPatient && (
        <ViewPatientDrawer
          patient={selectedPatient}
          isOpen={isViewDrawerOpen}
          onClose={() => {
            setIsViewDrawerOpen(false);
            setSelectedPatient(null);
          }}
        />
      )}
      {selectedPatient && (
        <UpdatePatientModal
          patient={selectedPatient}
          isOpen={isUpdateModalOpen}
          onClose={() => {
            setIsUpdateModalOpen(false);
            setSelectedPatient(null);
          }}
        />
      )}
      {patientToDelete && (
        <DeletePatientDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => {
            setIsDeleteDialogOpen(false);
            setPatientToDelete(null);
          }}
          patientId={patientToDelete._id}
          patientName={`${patientToDelete.personalDetails.name}`}
          onDeleteSuccess={() => {
            fetchPatient(currentPage, itemsPerPage, searchQuery);
          }}
        />
      )}
      
      {selectedPatientForFollowUp && (
        <FollowUpTableDialog
          isOpen={isFollowUpDialogOpen}
          onClose={() => {
            setIsFollowUpDialogOpen(false);
            setSelectedPatientForFollowUp(null);
          }}
          patient={selectedPatientForFollowUp}
          onRefresh={() => fetchPatient(currentPage, itemsPerPage, searchQuery)}
        />
      )}

      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Send Email to Patient</DialogTitle>
            <DialogDescription>
              {emailPatient?.personalDetails.emailAddress ? (
                <>
                  Sending email to {emailPatient?.personalDetails.name} (
                  {emailPatient?.personalDetails.emailAddress})
                </>
              ) : (
                <span className="text-yellow-600">
                  This patient doesn't have an email address
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {emailPatient?.personalDetails.emailAddress ? (
            <div>
              <Tabs defaultValue="compose">
                <TabsList className="mb-4">
                  <TabsTrigger value="compose">Compose</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>

                <TabsContent value="compose">
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        placeholder="Email subject"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="body">Email Body</Label>
                      <div className="border rounded-md p-2 bg-background/50">
                        <Textarea
                          id="body"
                          value={emailBody}
                          onChange={(e) => setEmailBody(e.target.value)}
                          placeholder="Loading patient details..."
                          className="min-h-[300px] resize-y font-mono text-sm"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        This email contains auto-generated patient details. Feel
                        free to edit before sending.
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="preview" className="p-2">
                  <div className="border rounded-md shadow overflow-hidden bg-white">
                    <div className="bg-blue-600 text-white p-4 text-center">
                      <h2 className="text-xl font-semibold">
                        Crown Dental Clinic
                      </h2>
                    </div>
                    <div className="p-4">
                      {emailBody.split("\n").map((line, i) => {
                        if (line.match(/===== (.*?) =====/)) {
                          const title = line.match(/===== (.*?) =====/)![1];
                          return (
                            <h3
                              key={i}
                              className="text-blue-600 font-semibold border-b border-blue-100 pb-1 mt-4 mb-2"
                            >
                              {title}
                            </h3>
                          );
                        }

                        if (line.match(/^Treatment #\d+:/)) {
                          return (
                            <div
                              key={i}
                              className="bg-blue-50 p-2 my-2 rounded-md border-l-4 border-blue-500"
                            >
                              <p className="font-medium text-blue-700">
                                {line}
                              </p>
                            </div>
                          );
                        }

                        return line ? (
                          <p key={i} className="my-1">
                            {line}
                          </p>
                        ) : (
                          <br key={i} />
                        );
                      })}
                    </div>
                    <div className="bg-gray-100 p-3 text-center text-gray-600 text-sm">
                      <p>
                        {new Date().getFullYear()} ${dentalName}. All rights
                        reserved.
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    This is a simplified preview. The actual email will be
                    properly formatted with colors and styling.
                  </p>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="py-4 text-center">
              <p className="text-red-500">
                Patient has no email address on record.
              </p>
              <p className="mt-2">
                Please update the patient details to add an email address first.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() => setIsEmailDialogOpen(false)}
            >
              Cancel
            </Button>
            {emailPatient?.personalDetails.emailAddress && (
              <Button
                onClick={sendEmail}
                disabled={
                  isSendingEmail || !emailSubject.trim() || !emailBody.trim()
                }
                variant={"ai"}
              >
                {isSendingEmail ? (
                  <>
                    <span className="mr-2">Sending...</span>
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Email
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {paymentPatient &&
        paymentPatient.medicalDetails &&
        paymentPatient.medicalDetails.length > 0 && (
          <PaymentHistoryDialog
            isOpen={isPaymentDialogOpen}
            onClose={() => {
              setIsPaymentDialogOpen(false);
              setPaymentPatient(null);
            }}
            selectedTeethMaps={paymentPatient.medicalDetails.reduce(
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
            groupTreatmentMaps={paymentPatient.medicalDetails.reduce(
              (acc, medicalDetail, medicalDetailIndex) => {
                medicalDetail.treatmentPlanning.forEach((plan, planIndex) => {
                  const mapKey = `${medicalDetailIndex}-${planIndex}`;

                  if (
                    plan.groupTreatmentDetails &&
                    plan.groupTreatmentDetails.length > 0
                  ) {
                    acc[mapKey] = plan.groupTreatmentDetails;
                  }
                });
                return acc;
              },
              {} as Record<string, any[]>
            )}
            onPaymentUpdate={(
              mapKey,
              toothNumber,
              treatmentIndex,
              newPaidAmount
            ) => {
              setPaymentPatient((prevPatient) => {
                if (!prevPatient) return null;

                const updatedPatient = { ...prevPatient };
                const [medicalDetailIndex, planIndex] = mapKey
                  .split("-")
                  .map(Number);

                if (
                  updatedPatient.medicalDetails[medicalDetailIndex]
                    ?.treatmentPlanning[planIndex]?.selectedTeethDetails
                ) {
                  const toothToUpdate = updatedPatient.medicalDetails[
                    medicalDetailIndex
                  ].treatmentPlanning[planIndex].selectedTeethDetails.find(
                    (tooth) => tooth.number === toothNumber
                  );

                  if (
                    toothToUpdate &&
                    toothToUpdate.dailyTreatments &&
                    toothToUpdate.dailyTreatments[treatmentIndex]
                  ) {
                    const treatment =
                      toothToUpdate.dailyTreatments[treatmentIndex];
                    treatment.paidAmount = newPaidAmount;
                    treatment.remainingAmount =
                      treatment.treatmentAmount - newPaidAmount;
                  }
                }

                return updatedPatient;
              });

              fetchPatient(currentPage, itemsPerPage, searchQuery);
            }}
            onGroupPaymentUpdate={(
              mapKey,
              groupIndex,
              treatmentIndex,
              newPaidAmount
            ) => {
              setPaymentPatient((prevPatient) => {
                if (!prevPatient) return null;

                const updatedPatient = { ...prevPatient };
                const [medicalDetailIndex, planIndex] = mapKey
                  .split("-")
                  .map(Number);

                if (
                  updatedPatient.medicalDetails[medicalDetailIndex]
                    ?.treatmentPlanning[planIndex]?.groupTreatmentDetails &&
                  updatedPatient.medicalDetails[medicalDetailIndex]
                    .treatmentPlanning[planIndex].groupTreatmentDetails[
                    groupIndex
                  ]
                ) {
                  const groupTreatment =
                    updatedPatient.medicalDetails[medicalDetailIndex]
                      .treatmentPlanning[planIndex].groupTreatmentDetails[
                      groupIndex
                    ];

                  if (
                    groupTreatment.dailyTreatments &&
                    groupTreatment.dailyTreatments[treatmentIndex]
                  ) {
                    const treatment =
                      groupTreatment.dailyTreatments[treatmentIndex];
                    treatment.paidAmount = newPaidAmount;
                    treatment.remainingAmount =
                      treatment.treatmentAmount - newPaidAmount;

                    // Update group totals
                    const totalPaid = groupTreatment.dailyTreatments.reduce(
                      (sum, t) => sum + (t.paidAmount || 0),
                      0
                    );
                    const totalAmount = groupTreatment.dailyTreatments.reduce(
                      (sum, t) => sum + (t.treatmentAmount || 0),
                      0
                    );

                    groupTreatment.totalPaidAmount = totalPaid;
                    groupTreatment.totalRemainingAmount =
                      totalAmount - totalPaid;
                  }
                }

                return updatedPatient;
              });

              fetchPatient(currentPage, itemsPerPage, searchQuery);
            }}
            patientId={paymentPatient._id}
            medicalDetailId={paymentPatient.medicalDetails[0]?._id || ""}
            patient={paymentPatient}
          />
        )}

      {xRayPlanPatient && (
        <AddXRayPlanModal
          isOpen={isXRayPlanModalOpen}
          onClose={() => {
            setIsXRayPlanModalOpen(false);
            setXRayPlanPatient(null);
          }}
          patient={xRayPlanPatient}
        />
      )}
      {selectedPatientForQR && (
        <QRCodeModal
          isOpen={isQRCodeModalOpen}
          onClose={() => {
            setIsQRCodeModalOpen(false);
            setSelectedPatientForQR(null);
          }}
          patient={selectedPatientForQR}
        />
      )}

      {selectedPatientForSMS && (
        <SMSModal
          isOpen={isSMSModalOpen}
          onClose={() => {
            setIsSMSModalOpen(false);
            setSelectedPatientForSMS(null);
          }}
          patient={selectedPatientForSMS}
        />
      )}

      {renderExportDialog()}
      {renderDateRangePicker()}
      {renderFollowUpDateRangePicker()}

      {/* Enhanced Report Modal - Commented out as report generation feature is currently disabled */}
      {/* <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
        <DialogContent className="w-full h-[90vh] max-w-[95vw] md:max-w-6xl flex flex-col p-0 overflow-hidden">
          ... Report modal content ...
        </DialogContent>
      </Dialog> */}

      {/* Service Payment Dialog */}
      <Dialog
        open={isServicePaymentDialogOpen}
        onOpenChange={setIsServicePaymentDialogOpen}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Add Service Payment</DialogTitle>
            <DialogDescription>
              Add a service payment for{" "}
              {servicePaymentPatient?.personalDetails.name}
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto pr-1 max-h-[calc(80vh-120px)]">
            {servicePaymentPatient && (
              <ServicePaymentForm
                onSubmit={handleSubmitServicePayment}
                onCancel={() => setIsServicePaymentDialogOpen(false)}
                isSubmitting={isSubmittingServicePayment}
                initialData={{
                  _id: "",
                  createdBy: "",
                  createdAt: "",
                  updatedAt: "",
                  patientName: servicePaymentPatient.personalDetails.name,
                  contactNumber:
                    servicePaymentPatient.personalDetails.contactNumber || "",
                  serviceType: "Consultation",
                  amount: 0,
                  paymentMethod: "Cash",
                  date: new Date().toISOString(),
                  isWalkIn: false,
                  patient: servicePaymentPatient._id,
                }}
                patients={[servicePaymentPatient]}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
