import {
  Edit,
  Mail,
  MoreHorizontal,
  Plus,
  Search,
  Trash,
  MessageSquare,
  View,
  FilePlus,
  Filter,
  X,
  ClipboardList,
  CreditCard,
  XCircle,
  FileUp,
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
import { Link } from "react-router-dom";
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
import { Patient } from "@/types/patient";
import { useAdminContext } from "@/contexts/adminContext";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { FileSpreadsheet } from "lucide-react";
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
import { TreatmentFileUpload } from "@/components/patient/TreatmentFileUpload";
import { PatientDocumentUploadButton } from "@/components/patient/PatientDocumentUploadButton";

// Add a type definition for the procedure response
interface ProcedureResponse {
  success: boolean;
  procedures: string[];
}

// Main component for patient table
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

  // New state variables for filtering
  const [selectedDoctor, setSelectedDoctor] = useState<string>("all");
  const [availableProcedures, setAvailableProcedures] = useState<string[]>([]);
  const [selectedProcedures, setSelectedProcedures] = useState<string[]>([]);
  const [isFilteringEnabled, setIsFilteringEnabled] = useState<boolean>(false);

  // Add near your other states
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailPatient, setEmailPatient] = useState<Patient | null>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentPatient, setPaymentPatient] = useState<Patient | null>(null);
  const [isXRayPlanModalOpen, setIsXRayPlanModalOpen] = useState(false);
  const [xRayPlanPatient, setXRayPlanPatient] = useState<Patient | null>(null);

  //pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10); // Customize this based on your requirement
  const { adminDetails } = useAdminContext();

  // Add this function to fetch patient details for email
  const fetchPatientDetailsForEmail = async (patientId: string) => {
    try {
      setEmailBody("Loading patient details...");

      interface EmailDetailsResponse {
        success: boolean;
        data: any; // Replace `any` with the actual type of `data` if known
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

  // Function to format patient data into a readable email body
  const formatPatientEmailBody = (patientData: any) => {
    const { personalDetails, medicalDetails, treatments } = patientData;

    let emailBody = `Dear ${personalDetails.name},\n\n`;
    emailBody += `Thank you for choosing Shree Nagar Dental Clinic for your dental care needs. Below is a summary of your dental records.\n\n`;

    // Personal Details Section
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

    // Medical History Section
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

    // Treatment Plans Section
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

        // Financial information for the overall treatment
        if (treatment.treatmentAmount) {
          emailBody += `Total Amount: ₹${treatment.treatmentAmount}\n`;
          if (treatment.advancedAmount)
            emailBody += `Advance Paid: ₹${treatment.advancedAmount}\n`;
          if (treatment.balanceAmount !== undefined)
            emailBody += `Balance: ₹${treatment.balanceAmount}\n`;
        }

        // Detailed tooth-specific treatments
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

    // Footer
    emailBody += `===== ADDITIONAL INFORMATION =====\n`;
    emailBody += `For any questions or to schedule your next appointment, please contact us at:\n`;
    emailBody += `Phone: +977-9858424157 / +977-9848420357\n`;
    emailBody += `Email:  "contact@om-shreenagar-dental-clinic.com"}\n\n`;
    emailBody += `Thank you for choosing Shree Nagar Dental Clinic for your dental care needs.\n\n`;
    emailBody += `Best regards,\nDr. Shree Nagar and Team`;

    return emailBody;
  };

  // Update the handleSendEmail function to use the new patient details
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

    // Fetch patient details to populate the email body
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

  // Add this function to handle payment dialog
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

  //search functionality
  const [searchQuery, setSearchQuery] = useState<string>("");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

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

      // Use filtered endpoint if filtering is enabled
      if (
        isFilteringEnabled &&
        (selectedDoctor !== "all" || selectedProcedures.length > 0)
      ) {
        endpoint = "/patient/get-filtered-patients";
        queryParams = `?page=${page}&limit=${limit}&search=${search}`;

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
  ]);

  useEffect(() => {
    let filtered = patient;

    // Filter by gender
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
    setIsFilteringEnabled(false);
  };

  // Add this function to export patient data to Excel
  const exportToExcel = () => {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Format patient data for export
    const patientData = filteredPatients.map((patient) => ({
      "S.No": patient.personalDetails.sn,
      Name: patient.personalDetails.name,
      Contact: patient.personalDetails.contactNumber,
      Email: patient.personalDetails.emailAddress || "",
      Age: patient.personalDetails.age,
      Gender: patient.personalDetails.gender,
      Address: patient.personalDetails.address || "",
      "Referred By": patient.personalDetails.referredBy || "",
      "Check-up Date": patient.personalDetails.checkUpDate
        ? new Date(patient.personalDetails.checkUpDate).toLocaleDateString()
        : "",
      "Created Date": new Date(patient.createdAt).toLocaleDateString(),
    }));

    // Create a worksheet from the patient data
    const worksheet = XLSX.utils.json_to_sheet(patientData);

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Patient List");

    // Auto-size columns
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

    // Apply column widths (accounting for header)
    worksheet["!cols"] = columnWidths.map((width) => ({
      wch: Math.max(width, 10),
    }));

    // Generate Excel file and trigger download
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });

    // Generate filename with current date
    const fileName = `patient_data_${new Date().toISOString().slice(0, 10)}.xlsx`;
    saveAs(data, fileName);
  };

  // Update the handleAddXRayPlan function to make it simpler
  const handleAddXRayPlan = (patient: Patient) => {
    setXRayPlanPatient(patient);
    setIsXRayPlanModalOpen(true);
  };

  const renderPatientTable = () => (
    <Card className=" transition-all duration-200 hover:shadow-lg border-2 border-foreground/10">
      <CardHeader>
        <CardTitle className="text-2xl font-bold tracking-tight">
          Patients
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Manage your patients and view their details.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full max-h-[70vh] overflow-auto rounded-md border">
          <Table className="min-w-[800px]">
            <TableHeader className="bg-muted/50 sticky top-0">
              <TableRow>
                <TableHead className="font-semibold">S.N</TableHead>
                <TableHead className="font-semibold">Name</TableHead>
                <TableHead className="font-semibold">Contact</TableHead>
                <TableHead className="font-semibold">Email</TableHead>
                <TableHead className="font-semibold">Age</TableHead>
                <TableHead className="font-semibold">Gender</TableHead>
                <TableHead className="font-semibold">Address</TableHead>
                <TableHead className="font-semibold text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No patients available
                  </TableCell>
                </TableRow>
              ) : (
                filteredPatients.map((patient, index) => (
                  <TableRow
                    key={index}
                    className="hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <TableCell
                      className="font-medium"
                      onClick={() => {
                        setSelectedPatient(patient);
                        setIsUpdateModalOpen(true);
                      }}
                    >
                      {patient.personalDetails.sn}
                    </TableCell>
                    <TableCell
                      className="font-medium"
                      onClick={() => {
                        setSelectedPatient(patient);
                        setIsUpdateModalOpen(true);
                      }}
                    >
                      {patient.personalDetails.name}
                    </TableCell>
                    <TableCell
                      onClick={() => {
                        setSelectedPatient(patient);
                        setIsUpdateModalOpen(true);
                      }}
                    >
                      {patient.personalDetails.contactNumber}
                    </TableCell>
                    <TableCell
                      onClick={() => {
                        setSelectedPatient(patient);
                        setIsUpdateModalOpen(true);
                      }}
                    >
                      {patient.personalDetails.emailAddress}
                    </TableCell>
                    <TableCell
                      onClick={() => {
                        setSelectedPatient(patient);
                        setIsUpdateModalOpen(true);
                      }}
                    >
                      {patient.personalDetails.age}
                    </TableCell>
                    <TableCell
                      onClick={() => {
                        setSelectedPatient(patient);
                        setIsUpdateModalOpen(true);
                      }}
                    >
                      {patient.personalDetails.gender}
                    </TableCell>
                    <TableCell
                      onClick={() => {
                        setSelectedPatient(patient);
                        setIsUpdateModalOpen(true);
                      }}
                    >
                      {patient.personalDetails.address}
                    </TableCell>
                    <TableCell className="text-right">
                      {/* Hidden AddPrescriptionButton that will be triggered by the dropdown menu */}
                      <div className="hidden">
                        <AddPrescriptionButton
                          id={`prescription-btn-${patient._id}`}
                          patientId={patient._id}
                          patientName={patient.personalDetails.name}
                          patientData={{
                            contactNumber:
                              patient.personalDetails.contactNumber,
                            emailAddress: patient.personalDetails.emailAddress,
                            age: patient.personalDetails.age,
                            gender: patient.personalDetails.gender,
                            address: patient.personalDetails.address,
                          }}
                          isAdmin={true}
                          variant="outline"
                          size="sm"
                        />
                        {/* Hidden PatientDocumentUploadButton */}
                        <PatientDocumentUploadButton
                          id={`upload-docs-btn-${patient._id}`}
                          patientId={patient._id}
                          medicalDetailId={
                            patient.medicalDetails?.[0]?._id || ""
                          }
                          onSuccess={() => {
                            // Refresh patient data if needed
                            fetchPatient(
                              currentPage,
                              itemsPerPage,
                              searchQuery
                            );
                          }}
                        />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0 hover:bg-muted"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[160px]">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPatient(patient);
                              setIsViewDrawerOpen(true);
                            }}
                            className="gap-2"
                          >
                            <View className="h-4 w-4" /> View
                          </DropdownMenuItem>

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

                          {/* Add Payment History Menu Item */}
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditPayment(patient);
                            }}
                            className="gap-2"
                          >
                            <CreditCard className="h-4 w-4" /> Edit Payment
                          </DropdownMenuItem>

                          {/* Add Document Upload Menu Item */}
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              document
                                .getElementById(
                                  `upload-docs-btn-${patient._id}`
                                )
                                ?.click();
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

                       

                          {/* Add X-Ray Plan Menu Item */}
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddXRayPlan(patient);
                            }}
                            className="gap-2"
                          >
                            <XCircle className="h-4 w-4" /> Add X-Ray Plan
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              const phoneNumber =
                                patient.personalDetails.contactNumber;
                              if (phoneNumber) {
                                // Format the phone number for WhatsApp (remove spaces and add country code if needed)
                                let formattedNumber = phoneNumber.replace(
                                  /\s/g,
                                  ""
                                );
                                if (!formattedNumber.startsWith("+")) {
                                  formattedNumber = `+977${formattedNumber}`; // Adding Nepal's country code as default
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
                            disabled={!patient.personalDetails.contactNumber}
                          >
                            <MessageSquare
                              className="h-4 w-4 text-green-500"
                              fill="green"
                            />{" "}
                            WhatsApp
                          </DropdownMenuItem>

                          {adminDetails.role === "admin" && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setPatientToDelete(patient);
                                setIsDeleteDialogOpen(true);
                              }}
                              className="gap-2 text-destructive focus:text-destructive"
                            >
                              <Trash className="h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          )}

                             {/* Add Prescription Menu Item */}
                             <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              // We'll use a modal approach for prescriptions
                              document
                                .getElementById(
                                  `prescription-btn-${patient._id}`
                                )
                                ?.click();
                            }}
                            className="gap-2"
                          >
                            <FilePlus className="h-4 w-4" /> Add Prescription
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-3 items-center">
          <Select
            onValueChange={(value) => setItemsPerPage(Number(value))}
            value={itemsPerPage.toString()}
          >
            <SelectTrigger id="itemsPerPage" className="w-[180px]">
              <SelectValue placeholder="Items per page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 items per page</SelectItem>
              <SelectItem value="10">10 items per page</SelectItem>
              <SelectItem value="20">20 items per page</SelectItem>
              <SelectItem value="50">50 items per page</SelectItem>
            </SelectContent>
          </Select>

          <Pagination className="justify-center">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                  className={
                    currentPage === 1 ? "pointer-events-none opacity-50" : ""
                  }
                />
              </PaginationItem>
              {[...Array(totalPages)].map((_, index) => (
                <PaginationItem key={index}>
                  <PaginationLink
                    href="#"
                    onClick={() => handlePageChange(index + 1)}
                    isActive={currentPage === index + 1}
                  >
                    {index + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={() =>
                    handlePageChange(Math.min(currentPage + 1, totalPages))
                  }
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex flex-col w-full bg-muted/40">
      <div className="flex flex-col sm:gap-4 sm:py-4 ">
        <header className="sticky top-0 z-30 flex items-center gap-4 px-4 border-b h-14 bg-background sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
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
          <div className="relative flex-1 mx-2 ml-auto md:grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToExcel}
            className="flex items-center gap-1"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export Excel
          </Button>
        </header>

        {/* Filter Controls */}

        <main className="grid items-start flex-1 gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          <Tabs
            defaultValue="all"
            value={selectedTab}
            className="p-2"
            onValueChange={(value) => setSelectedTab(value)}
          >
            <div className="flex items-center">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="male">Male</TabsTrigger>
                <TabsTrigger value="female">Female</TabsTrigger>
                <TabsTrigger value="other">Other</TabsTrigger>
              </TabsList>

              <div className="px-6 py-2 flex flex-wrap gap-2 items-center">
                <div className="flex items-center gap-2 mr-4">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Filter by:</span>
                </div>

                {/* Doctor Filter */}
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

                {/* Procedure Filter */}
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

                {/* Clear Filters Button */}
                {isFilteringEnabled && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="flex items-center gap-1"
                  >
                    <X className="h-4 w-4" />
                    Clear Filters
                  </Button>
                )}

                {/* Active Filters Display */}
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

              <div className="flex items-center ml-auto">
                <PopupModal
                  text="Add Patient"
                  icon={<Plus className="w-4 h-4 mr-2" />}
                  renderModal={(onClose) => <AddPatient modalClose={onClose} />}
                />
              </div>
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
              <div className="w-full overflow-x-auto max-h-[500px] py-2">
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

      {/* Email Dialog with Preview */}
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
                        // Check if this is a section header
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

                        // Check if this is a treatment line
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

                        // Regular line
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
                        © {new Date().getFullYear()} Shree Nagar Dental Clinic.
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

      {/* Payment History Dialog */}
      {paymentPatient &&
        paymentPatient.medicalDetails &&
        paymentPatient.medicalDetails.length > 0 && (
          <PaymentHistoryDialog
            isOpen={isPaymentDialogOpen}
            onClose={() => {
              setIsPaymentDialogOpen(false);
              setPaymentPatient(null);
            }}
            selectedTeethMaps={
              // Create a map of all teeth with treatments from the patient's medical details
              paymentPatient.medicalDetails.reduce(
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
              )
            }
            onPaymentUpdate={(
              mapKey,
              toothNumber,
              treatmentIndex,
              newPaidAmount
            ) => {
              // Update the local state to reflect the payment change
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

              // Refresh the patient list to reflect the updated payment
              fetchPatient(currentPage, itemsPerPage, searchQuery);
            }}
            patientId={paymentPatient._id}
            medicalDetailId={paymentPatient.medicalDetails[0]?._id || ""}
            patient={paymentPatient}
          />
        )}

      {/* Add this new modal at the end of the component, near other modals */}
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
    </div>
  );
}
