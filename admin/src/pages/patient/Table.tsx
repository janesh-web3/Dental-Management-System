import {
  Edit,
  Mail,
  MoreHorizontal,
  Plus,
  Trash,
  MessageSquare,
  View,
  FilePlus,
  Filter,
  X,
  CreditCard,
  FileUp,
  UserCircle,
  FileSpreadsheet,
  Calendar,
  QrCode,
  Phone,
  MapPin,
  Settings,
  FileX,
  User,
  LayoutGrid,
  LayoutList,
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
import type { Patient } from "@/types/patient";
import { useAdminContext } from "@/contexts/adminContext";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { AddPrescriptionButton } from "@/components/prescription";
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
import { Send, Loader2 } from "lucide-react";
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
import { PatientDocumentUploadButton } from "@/components/patient/PatientDocumentUploadButton";
import { ProfilePhotoUploadButton } from "@/components/patient/ProfilePhotoUploadButton";
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
  { id: "checkupDate", label: "Check-up Date", enabled: true },
  { id: "totalAmount", label: "Total Amount", enabled: true },
  { id: "paidAmount", label: "Paid Amount", enabled: true },
  { id: "remainingAmount", label: "Remaining Amount", enabled: true },
  { id: "treatmentDetails", label: "Treatment Details", enabled: true },
  { id: "teethDetails", label: "Teeth Details", enabled: true },
];

// Add date filter type
type DateFilterType = "all" | "today" | "week" | "month" | "custom";

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
  const [doctors, setDoctors] = useState<any[]>([]);
  const [isCompactView, setIsCompactView] = useState<boolean>(false);
  const [viewMode, _setViewMode] = useState<"table" | "grid" | "list">("table");

  const [selectedDoctor, setSelectedDoctor] = useState<string>("all");
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

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const { adminDetails } = useAdminContext();

  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] =
    useState<ColumnConfig[]>(defaultColumns);

  const [dateFilter, setDateFilter] = useState<DateFilterType>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isDateRangePickerOpen, setIsDateRangePickerOpen] = useState(false);
  const [isTableLoading, setIsTableLoading] = useState(false);

  const [isQRCodeModalOpen, setIsQRCodeModalOpen] = useState(false);
  const [selectedPatientForQR, setSelectedPatientForQR] =
    useState<Patient | null>(null);

  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState<string>("");

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
    emailBody += `Thank you for choosing Shree Nagar Dental Clinic for your dental care needs. Below is a summary of your dental records.\n\n`;

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
    emailBody += `Thank you for choosing Shree Nagar Dental Clinic for your dental care needs.\n\n`;
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

      console.log(`Fetching patients with date filter: ${filter}`);
      console.log(`Endpoint: ${endpoint}${queryParams}`);

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

      console.log(
        `Fetching patients with custom date range: ${from.toLocaleDateString()} to ${to.toLocaleDateString()}`
      );
      console.log(`Endpoint: ${endpoint}${queryParams}`);

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

      if (
        isFilteringEnabled &&
        (selectedDoctor !== "all" || selectedProcedures.length > 0)
      ) {
        endpoint = "/patient/get-filtered-patients";
        if (selectedDoctor !== "all") {
          queryParams += `&doctorId=${selectedDoctor}`;
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
    selectedProcedures,
    dateFilter,
    dateRange,
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
    setSelectedProcedures([]);
    setDateFilter("all");
    setDateRange(undefined);
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
            <Button variant="outline" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{getDateFilterLabel()}</span>
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
                <DropdownMenuLabel>Filter by Date</DropdownMenuLabel>
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
  // const renderViewModeToggle = () => (
  //   <div className="flex items-center gap-1 border rounded-md overflow-hidden">
  //     <Button
  //       variant={viewMode === "table" ? "default" : "ghost"}
  //       size="icon"
  //       onClick={() => setViewMode("table")}
  //       className="rounded-none border-0 h-8 w-8 sm:h-9 sm:w-9"
  //       title="Table View"
  //     >
  //       <LayoutIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
  //     </Button>
  //     <Button
  //       variant={viewMode === "list" ? "default" : "ghost"}
  //       size="icon"
  //       onClick={() => setViewMode("list")}
  //       className="rounded-none border-0 h-8 w-8 sm:h-9 sm:w-9"
  //       title="List View"
  //     >
  //       <LayoutList className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
  //     </Button>
  //     <Button
  //       variant={viewMode === "grid" ? "default" : "ghost"}
  //       size="icon"
  //       onClick={() => setViewMode("grid")}
  //       className="rounded-none border-0 h-8 w-8 sm:h-9 sm:w-9"
  //       title="Grid View"
  //     >
  //       <LayoutGrid className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
  //     </Button>
  //   </div>
  // );
  const renderGridView = () => (
    <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-2 sm:p-4">
      {filteredPatients.map((patient, index) => (
        <motion.div
          key={patient._id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, delay: index * 0.05 }}
          className="group"
        >
          <Card
            className="h-full overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer border border-border/40 hover:border-primary/20"
            onClick={() => {
              setSelectedPatient(patient);
              setIsViewDrawerOpen(true);
            }}
          >
            <CardHeader className="p-4 pb-2 space-y-2">
              <div className="flex items-start justify-between">
                <Avatar className="h-16 w-16 border-2 border-background shadow-sm group-hover:border-primary/20">
                  <AvatarImage
                    src={patient.personalDetails.profilePhoto?.url}
                    alt={patient.personalDetails.name}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary text-lg">
                    {patient.personalDetails.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Badge
                  variant="outline"
                  className={
                    patient.personalDetails.gender === "Male"
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : patient.personalDetails.gender === "Female"
                        ? "bg-pink-50 text-pink-700 border-pink-200"
                        : "bg-purple-50 text-purple-700 border-purple-200"
                  }
                >
                  {patient.personalDetails.gender}
                </Badge>
              </div>
              <div>
                <CardTitle className="text-base font-semibold line-clamp-1">
                  {patient.personalDetails.name}
                </CardTitle>
                <CardDescription className="text-xs">
                  ID: {patient.personalDetails.sn}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              <div className="space-y-1">
                <div className="flex items-center text-sm">
                  <Phone className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                  <span className="font-mono text-sm">
                    {patient.personalDetails.contactNumber}
                  </span>
                </div>
                {patient.personalDetails.emailAddress && (
                  <div className="flex items-center text-sm">
                    <Mail className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                    <span className="truncate text-sm">
                      {patient.personalDetails.emailAddress}
                    </span>
                  </div>
                )}
                <div className="flex items-center text-sm">
                  <Calendar className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                  <span>{patient.personalDetails.age} years</span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-muted-foreground">
                  Added: {new Date(patient.createdAt).toLocaleDateString()}
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPatient(patient);
                      setIsViewDrawerOpen(true);
                    }}
                    title="View Patient"
                  >
                    <View className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPatient(patient);
                      setIsUpdateModalOpen(true);
                    }}
                    title="Edit Patient"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:bg-muted"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-[180px] shadow-lg border border-border/30"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQRCodeClick(patient);
                        }}
                        className="gap-2"
                      >
                        <QrCode className="h-4 w-4" /> QR Code
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          // Add a delay to prevent the parent view drawer from opening
                          setTimeout(() => {
                            document
                              .getElementById(
                                `profile-photo-btn-${patient._id}`
                              )
                              ?.click();
                          }, 50);
                        }}
                        className="gap-2"
                      >
                        <UserCircle className="h-4 w-4" /> Upload Photo
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditPayment(patient);
                        }}
                        className="gap-2"
                      >
                        <CreditCard className="h-4 w-4" /> Edit Payment
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          // Add a delay to prevent the parent view drawer from opening
                          setTimeout(() => {
                            document
                              .getElementById(`prescription-btn-${patient._id}`)
                              ?.click();
                          }, 100);
                        }}
                        className="gap-2"
                      >
                        <FilePlus className="h-4 w-4" /> Add Prescription
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="divide-y">
      {filteredPatients.map((patient, index) => (
        <motion.div
          key={patient._id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, delay: index * 0.03 }}
          className="group"
        >
          {" "}
          <div
            className="flex flex-col md:flex-row md:items-center gap-4 p-3 sm:p-4 hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={() => {
              setSelectedPatient(patient);
              setIsViewDrawerOpen(true);
            }}
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border-2 border-background shadow-sm group-hover:border-primary/20">
                <AvatarImage
                  src={patient.personalDetails.profilePhoto?.url}
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
              <div>
                <div className="font-medium">
                  {patient.personalDetails.name}
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <span>#{patient.personalDetails.sn}</span>
                  <span>•</span>
                  <Badge
                    variant="outline"
                    className={
                      patient.personalDetails.gender === "Male"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : patient.personalDetails.gender === "Female"
                          ? "bg-pink-50 text-pink-700 border-pink-200"
                          : "bg-purple-50 text-purple-700 border-purple-200"
                    }
                  >
                    {patient.personalDetails.gender}
                  </Badge>
                  <span>•</span>
                  <span>{patient.personalDetails.age} years</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row flex-1 gap-4 md:items-center justify-between">
              <div className="grid grid-cols-1 gap-y-1 md:grid-cols-2 md:gap-x-8 w-full">
                <div className="flex items-center text-sm">
                  <Phone className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                  <span className="font-mono">
                    {patient.personalDetails.contactNumber}
                  </span>
                </div>
                {patient.personalDetails.emailAddress && (
                  <div className="flex items-center text-sm">
                    <Mail className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                    <span className="truncate max-w-[200px]">
                      {patient.personalDetails.emailAddress}
                    </span>
                  </div>
                )}
                {patient.personalDetails.address && (
                  <div className="flex items-center text-sm md:col-span-2">
                    <MapPin className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                    <span className="truncate max-w-[300px]">
                      {patient.personalDetails.address}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-end gap-1 sm:gap-2 shrink-0 mt-2 md:mt-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPatient(patient);
                    setIsViewDrawerOpen(true);
                  }}
                  title="View Patient"
                >
                  <View className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPatient(patient);
                    setIsUpdateModalOpen(true);
                  }}
                  title="Edit Patient"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-violet-600 hover:bg-violet-50 hover:text-violet-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQRCodeClick(patient);
                  }}
                  title="QR Code"
                >
                  <QrCode className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-muted"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                      }}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-[180px] shadow-lg border border-border/30"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                  >
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        // Add a delay to prevent the parent view drawer from opening
                        setTimeout(() => {
                          document
                            .getElementById(`profile-photo-btn-${patient._id}`)
                            ?.click();
                        }, 100);
                      }}
                      className="gap-2"
                    >
                      <UserCircle className="h-4 w-4" /> Upload Photo
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditPayment(patient);
                      }}
                      className="gap-2"
                    >
                      <CreditCard className="h-4 w-4" /> Edit Payment
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        // Add a delay to prevent the parent view drawer from opening
                        setTimeout(() => {
                          document
                            .getElementById(`upload-docs-btn-${patient._id}`)
                            ?.click();
                        }, 100);
                      }}
                      className="gap-2"
                    >
                      <FileUp className="h-4 w-4" /> Upload Documents
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSendEmail(patient);
                      }}
                      className="gap-2"
                      disabled={!patient.personalDetails.emailAddress}
                    >
                      <Mail className="h-4 w-4" /> Send Email
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        // Add a delay to prevent the parent view drawer from opening
                        setTimeout(() => {
                          document
                            .getElementById(`prescription-btn-${patient._id}`)
                            ?.click();
                        }, 100);
                      }}
                      className="gap-2"
                    >
                      <FilePlus className="h-4 w-4" /> Add Prescription
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );

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
                    <span className="hidden sm:inline">Standard View</span>
                  </>
                ) : (
                  <>
                    <LayoutList className="h-4 w-4" />
                    <span className="hidden sm:inline">Compact View</span>
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
                                variant="outline"
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
                            <TableCell className="text-right p-2">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
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
                                  </>
                                )}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 hover:bg-muted"
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                      <span className="sr-only">Open menu</span>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    className="w-[180px] shadow-lg border border-border/30"
                                  >
                                    <DropdownMenuLabel>
                                      Actions
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />

                                    {isCompactView && (
                                      <>
                                        <DropdownMenuItem
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedPatient(patient);
                                            setIsUpdateModalOpen(true);
                                          }}
                                          className="gap-2"
                                        >
                                          <Edit className="h-4 w-4" /> Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleQRCodeClick(patient);
                                          }}
                                          className="gap-2"
                                        >
                                          <QrCode className="h-4 w-4" /> QR Code
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                      </>
                                    )}

                                    <div
                                      className="hidden"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <AddPrescriptionButton
                                        id={`prescription-btn-${patient._id}`}
                                        patientId={patient._id}
                                        patientName={
                                          patient.personalDetails.name
                                        }
                                        patientData={{
                                          contactNumber:
                                            patient.personalDetails
                                              .contactNumber,
                                          emailAddress:
                                            patient.personalDetails
                                              .emailAddress,
                                          age: patient.personalDetails.age,
                                          gender:
                                            patient.personalDetails.gender,
                                          address:
                                            patient.personalDetails.address,
                                        }}
                                        isAdmin={true}
                                        variant="outline"
                                        size="sm"
                                      />
                                      <PatientDocumentUploadButton
                                        id={`upload-docs-btn-${patient._id}`}
                                        patientId={patient._id}
                                        medicalDetailId={
                                          patient.medicalDetails?.[0]?._id || ""
                                        }
                                        onSuccess={() => {
                                          fetchPatient(
                                            currentPage,
                                            itemsPerPage,
                                            searchQuery
                                          );
                                        }}
                                      />
                                      <ProfilePhotoUploadButton
                                        id={`profile-photo-btn-${patient._id}`}
                                        patientId={patient._id}
                                        patientName={
                                          patient.personalDetails.name
                                        }
                                        currentPhotoUrl={
                                          patient.personalDetails.profilePhoto
                                            ?.url
                                        }
                                        onSuccess={() => {
                                          fetchPatient(
                                            currentPage,
                                            itemsPerPage,
                                            searchQuery
                                          );
                                        }}
                                      />
                                    </div>

                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        // Add a delay to prevent the parent view drawer from opening
                                        setTimeout(() => {
                                          document
                                            .getElementById(
                                              `profile-photo-btn-${patient._id}`
                                            )
                                            ?.click();
                                        }, 100);
                                      }}
                                      className="gap-2"
                                    >
                                      <UserCircle className="h-4 w-4" /> Upload
                                      Photo
                                    </DropdownMenuItem>

                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditPayment(patient);
                                      }}
                                      className="gap-2"
                                    >
                                      <CreditCard className="h-4 w-4" /> Edit
                                      Payment
                                    </DropdownMenuItem>

                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        // Add a delay to prevent the parent view drawer from opening
                                        setTimeout(() => {
                                          document
                                            .getElementById(
                                              `upload-docs-btn-${patient._id}`
                                            )
                                            ?.click();
                                        }, 100);
                                      }}
                                      className="gap-2"
                                    >
                                      <FileUp className="h-4 w-4" /> Upload
                                      Documents
                                    </DropdownMenuItem>

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
                                      <Mail className="h-4 w-4" /> Send Email
                                    </DropdownMenuItem>

                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const phoneNumber =
                                          patient.personalDetails.contactNumber;
                                        if (phoneNumber) {
                                          let formattedNumber =
                                            phoneNumber.replace(/\s/g, "");
                                          if (
                                            !formattedNumber.startsWith("+")
                                          ) {
                                            formattedNumber = `+977${formattedNumber}`;
                                          }
                                          window.open(
                                            `https://wa.me/${formattedNumber}`,
                                            "_blank"
                                          );
                                        } else {
                                          toast.error(
                                            "No contact number available for this patient"
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
                                      />{" "}
                                      WhatsApp
                                    </DropdownMenuItem>

                                    {adminDetails.role === "admin" ||
                                      (adminDetails.role === "superadmin" && (
                                        <DropdownMenuItem
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setPatientToDelete(patient);
                                            setIsDeleteDialogOpen(true);
                                          }}
                                          className="gap-2 text-red-600 hover:text-red-700 focus:text-red-700"
                                        >
                                          <Trash className="h-4 w-4" /> Delete
                                        </DropdownMenuItem>
                                      ))}

                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        // Add a delay to prevent the parent view drawer from opening
                                        setTimeout(() => {
                                          document
                                            .getElementById(
                                              `prescription-btn-${patient._id}`
                                            )
                                            ?.click();
                                        }, 100);
                                      }}
                                      className="gap-2"
                                    >
                                      <FilePlus className="h-4 w-4" /> Add
                                      Prescription
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </div>
              )}
              {viewMode === "grid" && renderGridView()}
              {viewMode === "list" && renderListView()}
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
              {[...Array(totalPages)].map((_, index) => (
                <PaginationItem key={index}>
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
              ))}
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

  return (
    <div className="flex flex-col w-full bg-muted/40">
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
            className="p-2"
            onValueChange={(value) => setSelectedTab(value)}
          >
            {" "}
            <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-between">
              <TabsList className="mb-2 sm:mb-0">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="male">Male</TabsTrigger>
                <TabsTrigger value="female">Female</TabsTrigger>
                <TabsTrigger value="other">Other</TabsTrigger>
              </TabsList>{" "}
              <div className="px-2 sm:px-6 py-2 flex flex-wrap gap-2 items-center overflow-x-auto">
                <div className="flex items-center gap-2 mr-4">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Filter by:</span>
                </div>

                {renderDateFilter()}

                <Select
                  value={selectedDoctor}
                  onValueChange={handleDoctorChange}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select Doctor" />
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

                {isFilteringEnabled && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      clearFilters();
                      setDateFilter("all");
                      setDateRange(undefined);
                      fetchPatient(currentPage, itemsPerPage, searchQuery);
                    }}
                    className="flex items-center gap-1"
                  >
                    <X className="h-4 w-4" />
                    Clear All Filters
                  </Button>
                )}

                {dateFilter !== "all" && dateFilter !== "custom" && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
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

                <div className="flex flex-wrap gap-1 ml-2">
                  {selectedDoctor !== "all" &&
                    doctors.find((d) => d._id === selectedDoctor) && (
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
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
                      variant="secondary"
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExportDialogOpen(true)}
                className="gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Export
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
                        {new Date().getFullYear()} Shree Nagar Dental Clinic.
                        All rights reserved.
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
              variant="outline"
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
      {renderExportDialog()}
      {renderDateRangePicker()}
    </div>
  );
}
