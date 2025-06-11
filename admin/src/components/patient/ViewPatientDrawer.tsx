import React, { useState, useEffect } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  User,
  Mail,
  Phone,
  MapPin,
  FileDigit,
  Calendar,
  Stethoscope,
  X,
  Clock,
  CalendarDays,
  Download,
  FileText,
  Pill,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface ViewPatientDrawerProps {
  patient: Patient;
  isOpen: boolean;
  onClose: () => void;
}

export function ViewPatientDrawer({
  patient,
  isOpen,
  onClose,
}: ViewPatientDrawerProps) {
  console.log("Patient data:", patient);
  const [localPatient] = useState(patient);
  const [_selectedMedicalRecordId, setSelectedMedicalRecordId] = useState<
    string | null
  >(null);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loadingPrescriptions, setLoadingPrescriptions] =
    useState<boolean>(false);
  const [expandedPrescription, setExpandedPrescription] = useState<
    string | null
  >(null);

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

  // Calculate totals based on daily treatments data
  const totalAmount = allDailyTreatments.reduce(
    (sum, dailyTreatment: DailyTreatment) => {
      // Handle null, undefined, or non-numeric values
      const amount = dailyTreatment.treatmentAmount;
      if (amount === undefined || amount === null) return sum;

      // Ensure we're working with a number
      return sum + Number(amount);
    },
    0
  );

  const paidAmount = allDailyTreatments.reduce(
    (sum, dailyTreatment: DailyTreatment) => {
      // Handle null, undefined, or non-numeric values
      const amount = dailyTreatment.paidAmount;
      if (amount === undefined || amount === null) return sum;

      // Ensure we're working with a number
      return sum + Number(amount);
    },
    0
  );

  // Calculate remaining amount
  const remainingAmount = totalAmount - paidAmount;

  console.log("Treatment totals from daily treatments:", {
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

      // Add clinic logo if available
      // const img = new Image();
      // img.src = '/logos.png';
      // doc.addImage(img, 'PNG', 170, 10, 30, 30);

      // Document title and header - better positioning
      doc.setFontSize(18);
      doc.setTextColor(41, 128, 185); // Primary color
      doc.text("Shree Nagar Dental Clinic", 105, 20, { align: "center" });

      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text("Patient Details", 105, 30, { align: "center" });

      // Patient info section
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text("Patient Information", 14, 45);

      // Personal details table - improved spacing and formatted data
      doc.setFontSize(10);
      const personalData = [
        ["Name", patient.personalDetails.name || "-"],
        [
          "Age/Gender",
          `${patient.personalDetails.age || "-"} / ${patient.personalDetails.gender || "-"}`,
        ],
        ["Contact", patient.personalDetails.contactNumber || "-"],
        ["Email", patient.personalDetails.emailAddress || "-"],
        ["Address", patient.personalDetails.address || "-"],
        ["Serial Number", patient.personalDetails.sn || "-"],
        ["Referred By", patient.personalDetails.referredBy || "-"],
        [
          "Check-up Date",
          formatSafeDate(patient.personalDetails.checkUpDate || ""),
        ],
      ];

      // Use autoTable with improved styling and cell sizes
      autoTable(doc, {
        startY: 50,
        head: [],
        body: personalData,
        theme: "striped",
        styles: { cellPadding: 3, overflow: "linebreak", fontSize: 10 },
        headStyles: { fillColor: [41, 128, 185] },
        columnStyles: {
          0: { cellWidth: 45, fontStyle: "bold" },
          1: { cellWidth: "auto", overflow: "linebreak" },
        },
        margin: { left: 14, right: 14 },
      });

      // Track vertical position with added space for separation
      let currentY = doc.previousAutoTable?.finalY || 50;
      currentY += 25; // Add more space between sections

      // Medical details section with better spacing
      if (patient.medicalDetails && patient.medicalDetails.length > 0) {
        const medicalDetails = patient.medicalDetails[0];

        // Check if we need a page break before medical history
        if (currentY > 220) {
          doc.addPage();
          currentY = 20;
        }

        // Medical history header
        doc.setFontSize(14);
        // doc.text("Medical History", 14, currentY);
        currentY += 8; // Add space after header

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
            styles: { cellPadding: 3, overflow: "linebreak", fontSize: 10 },
            headStyles: { fillColor: [41, 128, 185] },
            columnStyles: {
              0: { cellWidth: 45, fontStyle: "bold" },
              1: { cellWidth: "auto", overflow: "linebreak" },
            },
            margin: { left: 14, right: 14 },
          });

          currentY = doc.previousAutoTable?.finalY || currentY;
          currentY += 25; // Add space after table
        } else {
          currentY += 10;
        }

        // Check for page break before clinical information
        if (currentY > 220) {
          doc.addPage();
          currentY = 20;
        }

        // Clinical information section
        doc.setFontSize(14);
        // doc.text("Clinical Information", 14, currentY);
        currentY += 8; // Add space after header

        const clinicalData = [
          ["Chief Complaint", medicalDetails.chiefComplaint || "-"],
          ["Diagnosis", medicalDetails.diagnosis || "-"],
        ];

        autoTable(doc, {
          startY: currentY,
          head: [],
          body: clinicalData,
          theme: "striped",
          styles: { cellPadding: 3, overflow: "linebreak", fontSize: 10 },
          headStyles: { fillColor: [41, 128, 185] },
          columnStyles: {
            0: { cellWidth: 45, fontStyle: "bold" },
            1: { cellWidth: "auto", overflow: "linebreak" },
          },
          margin: { left: 14, right: 14 },
        });

        currentY = doc.previousAutoTable?.finalY || currentY;
        currentY += 25; // Add space after table

        // Treatment plans with proper page breaks
        if (
          medicalDetails.treatmentPlanning &&
          medicalDetails.treatmentPlanning.length > 0
        ) {
          // Check if need a new page for treatments
          if (currentY > 200) {
            doc.addPage();
            currentY = 20;
          }

          doc.setFontSize(14);
          doc.text("Treatment Plans", 14, currentY);
          currentY += 10;

          medicalDetails.treatmentPlanning.forEach((plan, index) => {
            // Check if we need a new page
            if (currentY > 220) {
              doc.addPage();
              currentY = 20;
            }

            // Treatment plan header
            doc.setFontSize(12);
            doc.setTextColor(41, 128, 185);
            doc.text(
              `Plan ${index + 1}: ${plan.treatmentDetails || "Treatment Plan"}`,
              14,
              currentY
            );
            doc.setTextColor(0);
            currentY += 8;

            // Treatment details table
            const treatmentData = [
              ["Date", formatSafeDate(plan.treatmentDate || "")],
              ["Amount", `Rs. ${plan.treatmentAmount || 0}`],
              ["Paid", `Rs. ${plan.advancedAmount || 0}`],
              ["Balance", `Rs. ${plan.balanceAmount || 0}`],
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
              styles: { cellPadding: 3, overflow: "linebreak", fontSize: 10 },
              columnStyles: {
                0: { cellWidth: 45, fontStyle: "bold" },
                1: { cellWidth: "auto", overflow: "linebreak" },
              },
              margin: { left: 14, right: 14 },
            });

            currentY = doc.previousAutoTable?.finalY || currentY;
            currentY += 15; // Add space between treatment plans
          });
        }
      }

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
      doc.save(`${patient.personalDetails.name}_medical_record.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      // Uncomment and add toast if you want to show user feedback
      // toast.error("Failed to generate PDF. Please try again.");
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="h-[95vh] max-h-[95vh]">
        <div className="flex flex-col h-full">
          <DrawerHeader className="border-b sticky top-0 z-10 bg-background">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getInitials(patient.personalDetails.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <DrawerTitle className="text-xl font-bold">
                    {patient.personalDetails.name}
                  </DrawerTitle>
                  <div className="flex items-center gap-3 mt-1 text-muted-foreground text-sm">
                    <div className="flex items-center gap-1">
                      <FileDigit className="h-3.5 w-3.5" />
                      <span>ID: {patient.personalDetails.sn}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Added: {formatSafeDate(patient.createdAt)}</span>
                    </div>
                    <div className="flex mt-2 gap-2">
                      {patient.personalDetails.gender && (
                        <Badge variant="outline" className="bg-card">
                          {patient.personalDetails.gender}
                        </Badge>
                      )}
                      {patient.personalDetails.age && (
                        <Badge variant="outline" className="bg-card">
                          {patient.personalDetails.age} years
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportPatientPDF}
                  className="flex items-center gap-1"
                >
                  <Download className="h-4 w-4" />
                  Export PDF
                </Button>
                <Button variant="outline" size="sm" onClick={onClose}>
                  <X className="w-4 h-4 mr-2" /> Close
                </Button>
              </div>
            </div>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto px-4">
            <Tabs defaultValue="overview" className="space-y-4">
              <div className="sticky top-0 z-10 bg-background pt-1 pb-3">
                <TabsList className="grid w-full grid-cols-5 bg-muted/50 p-1">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="medical">Medical Records</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                  <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="overview" className="space-y-6 pb-6">
                {/* Personal Information */}
                <Card className="border-none shadow-sm bg-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-3 gap-4">
                    <div className="flex items-start gap-2">
                      <FileDigit className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">S.N</p>
                        <p className="font-medium">
                          {localPatient.personalDetails.sn}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <User className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Name</p>
                        <p className="font-medium">
                          {localPatient.personalDetails.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Contact</p>
                        <p className="font-medium">
                          {localPatient.personalDetails.contactNumber}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">
                          {localPatient.personalDetails.emailAddress ||
                            "Not provided"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Address</p>
                        <p className="font-medium">
                          {localPatient.personalDetails.address ||
                            "Not provided"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CalendarDays className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Birth Date
                        </p>
                        <p className="font-medium">
                          {localPatient.personalDetails.dob
                            ? formatSafeDate(localPatient.personalDetails.dob)
                            : "Not provided"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Treatment Progress */}
                <TreatmentProgress
                  totalAmount={totalAmount}
                  paidAmount={paidAmount}
                  remainingAmount={remainingAmount}
                  treatments={allTreatments}
                />
              </TabsContent>

              <TabsContent value="medical" className="pb-6">
                {/* Medical History */}
                <Card className="border-none shadow-sm bg-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Stethoscope className="h-5 w-5 text-primary" />
                      Medical History
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-4">
                    {localPatient.medicalDetails[0]?.medicalHistory
                      ?.noMedicalIssues ? (
                      <div className="col-span-2">
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                          No Medical Issues
                        </Badge>
                      </div>
                    ) : (
                      <>
                        {/* Existing medical history display */}
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Blood Pressure
                          </p>
                          <p className="font-medium">
                            {localPatient.medicalDetails[0]?.medicalHistory
                              ?.bloodPressure || "Not recorded"}
                          </p>
                        </div>
                        {/* Other existing medical history fields */}
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Medical Records Section */}
                {localPatient.medicalDetails.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center bg-muted/30 rounded-lg">
                    <Stethoscope className="h-12 w-12 text-muted-foreground mb-3" />
                    <h3 className="text-lg font-medium">No Medical Records</h3>
                    <p className="text-sm text-muted-foreground max-w-md mt-1">
                      This patient doesn't have any medical records yet.
                    </p>
                  </div>
                ) : (
                  localPatient.medicalDetails.map((record) => (
                    <Card
                      key={record._id}
                      className="border border-primary/10 shadow-sm bg-card overflow-hidden mt-4"
                    >
                      <div className="bg-primary/5 px-6 py-3 border-b border-primary/10">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-primary flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {formatSafeDate(record.checkUpDate)}
                          </h3>
                          <Badge
                            variant="outline"
                            className={`${record.followUpDate ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-700"}`}
                          >
                            {record.followUpDate
                              ? "Follow-up Scheduled"
                              : "Check-up Complete"}
                          </Badge>
                        </div>
                      </div>

                      <CardContent className="p-0">
                        {/* Medical Details Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border-b bg-muted/20">
                          <div>
                            <p className="text-sm text-muted-foreground font-medium">
                              Check-up Date
                            </p>
                            <p className="font-medium text-sm">
                              {formatSafeDate(record.checkUpDate)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground font-medium">
                              Follow-up Date
                            </p>
                            <p className="font-medium text-sm">
                              {record.followUpDate
                                ? formatSafeDate(record.followUpDate)
                                : "Not scheduled"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground font-medium">
                              Patient Type
                            </p>
                            <p className="font-medium text-sm">
                              {record.patientType || "Not specified"}
                            </p>
                          </div>
                        </div>

                        {/* Diagnosis and Investigation */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border-b">
                          <div>
                            <p className="text-sm text-muted-foreground font-medium mb-1">
                              Diagnosis
                            </p>
                            <div className="bg-muted/30 p-3 rounded-md text-sm">
                              {record.diagnosis || "No diagnosis provided"}
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground font-medium mb-1">
                              Investigation
                            </p>
                            <div className="bg-muted/30 p-3 rounded-md text-sm">
                              {record.investigation?.blood ||
                              record.investigation?.xray
                                ? "See details below"
                                : "No investigation details provided"}
                            </div>
                          </div>

                          {/* Display blood investigation */}
                          {record.investigation?.blood && (
                            <div className="mb-4">
                              <p className="text-sm text-muted-foreground font-medium mb-1">
                                Blood Investigation
                              </p>
                              <div className="bg-muted/30 p-3 rounded-md text-sm">
                                {record.investigation.blood}
                              </div>
                            </div>
                          )}

                          {/* Display X-Ray investigation */}
                          {record.investigation?.xray && (
                            <div className="mb-4">
                              <p className="text-sm text-muted-foreground font-medium mb-1">
                                X-Ray Investigation
                              </p>
                              <div className="bg-muted/30 p-3 rounded-md text-sm">
                                {record.investigation.xray}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Treatment Plans */}
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-sm text-muted-foreground">
                              Treatment Plans
                            </h4>
                            <Badge className="bg-primary/10 text-primary border-none">
                              {record.treatmentPlanning.length}{" "}
                              {record.treatmentPlanning.length === 1
                                ? "plan"
                                : "plans"}
                            </Badge>
                          </div>

                          <div className="space-y-4">
                            {record.treatmentPlanning.map(
                              (treatment, index) => {
                                // Create a map of selected teeth for the dental chart
                                const selectedTeethMap: Record<string, any> =
                                  {};
                                if (treatment.selectedTeethDetails) {
                                  treatment.selectedTeethDetails.forEach(
                                    (tooth) => {
                                      selectedTeethMap[tooth.number] = tooth;
                                    }
                                  );
                                }

                                return (
                                  <Accordion
                                    type="single"
                                    collapsible
                                    className="border rounded-lg overflow-hidden bg-card"
                                    key={treatment._id}
                                    defaultValue="item-1"
                                  >
                                    <AccordionItem
                                      value="item-1"
                                      className="border-0"
                                    >
                                      <AccordionTrigger className="bg-muted/30 px-4 py-2 border-b hover:no-underline">
                                        <div className="flex items-center justify-between w-full pr-4">
                                          <h5 className="font-medium text-sm flex items-center gap-2">
                                            <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">
                                              {index + 1}
                                            </span>
                                            Treatment Plan {index + 1}:{" "}
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
                                                ? "bg-green-100 text-green-800 border-none"
                                                : "border-orange-200 text-orange-800"
                                            }
                                          >
                                            {treatment.isCompleted
                                              ? "Completed"
                                              : "In Progress"}
                                          </Badge>
                                        </div>
                                      </AccordionTrigger>
                                      <AccordionContent className="p-4">
                                        {/* Treatment Details Summary */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 bg-muted/10 p-3 rounded-md">
                                          <div>
                                            <p className="text-xs text-muted-foreground">
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
                                              <p className="text-xs text-muted-foreground">
                                                Treated By
                                              </p>
                                              <p className="font-medium text-sm">
                                                {typeof treatment.treatedByDoctor ===
                                                  "object" &&
                                                treatment.treatedByDoctor !==
                                                  null &&
                                                "name" in
                                                  treatment.treatedByDoctor
                                                  ? (treatment
                                                      .treatedByDoctor as { name: string })
                                                      .name
                                                  : typeof treatment.treatedByDoctor ===
                                                      "string"
                                                    ? treatment.treatedByDoctor
                                                    : "N/A"}
                                              </p>
                                            </div>
                                          )}

                                          {treatment.completionDate && (
                                            <div>
                                              <p className="text-xs text-muted-foreground">
                                                Completion Date
                                              </p>
                                              <p className="font-medium text-sm">
                                                {formatSafeDate(
                                                  treatment.completionDate
                                                )}
                                              </p>
                                            </div>
                                          )}
                                        </div>

                                        {/* Treatment Details */}
                                        <div className="mb-4">
                                          <p className="text-xs text-muted-foreground mb-1">
                                            Treatment Details
                                          </p>
                                          <div className="bg-muted/20 p-3 rounded-md text-sm">
                                            {treatment.treatmentDetails ||
                                              "No details provided"}
                                          </div>
                                        </div>

                                        {/* Dental Chart Visualization */}
                                        {treatment.selectedTeethDetails &&
                                          treatment.selectedTeethDetails
                                            .length > 0 && (
                                            <div className="mb-4">
                                              <p className="text-xs text-muted-foreground mb-1">
                                                Selected Teeth Visualization
                                              </p>
                                              <div className="bg-muted/10 p-3 rounded-md">
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
                                            <div className="mb-4">
                                              <p className="text-xs text-muted-foreground mb-1">
                                                Selected Teeth Details
                                              </p>
                                              <div className="space-y-4">
                                                {treatment.selectedTeethDetails.map(
                                                  (tooth) => (
                                                    <div
                                                      key={tooth.number}
                                                      className="border rounded-md overflow-hidden"
                                                    >
                                                      <div className="bg-muted/30 px-4 py-2 border-b flex items-center justify-between">
                                                        <h6 className="font-medium text-sm">
                                                          Tooth {tooth.number} -{" "}
                                                          {tooth.procedure ||
                                                            "General Treatment"}
                                                        </h6>
                                                        <Badge
                                                          variant={
                                                            (tooth as any).isCompleted
                                                              ? "default"
                                                              : "outline"
                                                          }
                                                          className={`text-[10px] ${(tooth as any).isCompleted ? "bg-green-100 text-green-800" : "border-orange-200 text-orange-800"}`}
                                                        >
                                                          {(tooth as any).isCompleted
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
                                                                {tooth.details}
                                                              </span>
                                                            </div>
                                                          )}
                                                        </div>

                                                        {/* Daily Treatments Table */}
                                                        {tooth.dailyTreatments &&
                                                          tooth.dailyTreatments
                                                            .length > 0 && (
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
                                                                      <TableHead className="text-xs text-right">
                                                                        Status
                                                                      </TableHead>
                                                                    </TableRow>
                                                                  </TableHeader>
                                                                  <TableBody>
                                                                    {tooth.dailyTreatments.map(
                                                                      (
                                                                        treatment,
                                                                        idx
                                                                      ) => (
                                                                        <TableRow
                                                                          key={
                                                                            idx
                                                                          }
                                                                          className={
                                                                            (treatment as any).isCompleted
                                                                              ? "bg-green-50/30"
                                                                              : ""
                                                                          }
                                                                        >
                                                                          <TableCell className="text-xs py-2">
                                                                            {formatSafeDate(
                                                                              treatment.date
                                                                            )}
                                                                          </TableCell>
                                                                          <TableCell className="text-xs py-2">
                                                                            {treatment.procedure ||
                                                                              "General"}
                                                                          </TableCell>
                                                                          <TableCell className="text-xs py-2">
                                                                            {typeof treatment.treatedByDoctor ===
                                                                              "object" &&
                                                                            treatment.treatedByDoctor !==
                                                                              null &&
                                                                            "name" in
                                                                              treatment.treatedByDoctor
                                                                              ? (treatment
                                                                                  .treatedByDoctor as { name: string })
                                                                                  .name
                                                                              : typeof treatment.treatedByDoctor ===
                                                                                  "string"
                                                                                ? treatment.treatedByDoctor
                                                                                : "N/A"}
                                                                          </TableCell>
                                                                          <TableCell className="text-xs py-2 text-right">
                                                                            ₹
                                                                            {treatment.treatmentAmount ||
                                                                              0}
                                                                          </TableCell>
                                                                          <TableCell className="text-xs py-2 text-right">
                                                                            ₹
                                                                            {treatment.paidAmount ||
                                                                              0}
                                                                          </TableCell>
                                                                          <TableCell className="text-xs py-2 text-right">
                                                                            <Badge
                                                                              variant={
                                                                                (treatment as any).isCompleted
                                                                                  ? "default"
                                                                                  : "outline"
                                                                              }
                                                                              className={`text-[10px] ${(treatment as any).isCompleted ? "bg-green-100 text-green-800" : "border-orange-200 text-orange-800"}`}
                                                                            >
                                                                              {(treatment as any).isCompleted
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

                                                              {/* Notes section */}
                                                              {tooth.dailyTreatments.some(
                                                                (t) => t.notes
                                                              ) && (
                                                                <div className="mt-3">
                                                                  <p className="text-xs font-medium mb-2">
                                                                    Treatment
                                                                    Notes
                                                                  </p>
                                                                  <div className="space-y-2">
                                                                    {tooth.dailyTreatments
                                                                      .filter(
                                                                        (t) =>
                                                                          t.notes
                                                                      )
                                                                      .map(
                                                                        (
                                                                          treatment,
                                                                          idx
                                                                        ) => (
                                                                          <div
                                                                            key={
                                                                              idx
                                                                            }
                                                                            className="bg-muted/20 p-2 rounded-md"
                                                                          >
                                                                            <p className="text-xs text-muted-foreground mb-1">
                                                                              {formatSafeDate(
                                                                                treatment.date
                                                                              )}{" "}
                                                                              -{" "}
                                                                              {treatment.procedure ||
                                                                                "General"}
                                                                              :
                                                                            </p>
                                                                            <p className="text-sm">
                                                                              {
                                                                                treatment.notes
                                                                              }
                                                                            </p>
                                                                          </div>
                                                                        )
                                                                      )}
                                                                  </div>
                                                                </div>
                                                              )}
                                                            </div>
                                                          )}
                                                      </div>
                                                    </div>
                                                  )
                                                )}
                                              </div>
                                            </div>
                                          )}

                                        {/* Financial Summary Section - After all teeth details */}
                                        <div className="mt-6">
                                          <h3 className="text-sm font-medium mb-3">
                                            Financial Summary
                                          </h3>

                                          {/* Daily Treatment Sessions Summary */}
                                          {treatment.selectedTeethDetails &&
                                            treatment.selectedTeethDetails
                                              .length > 0 && (
                                              <div className="bg-muted/10 rounded-md p-4">
                                                <h4 className="text-xs font-medium text-muted-foreground mb-2">
                                                  Treatment Sessions Totals
                                                </h4>
                                                <div className="grid grid-cols-3 gap-2">
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
                                                            dt.paidAmount || 0
                                                          ),
                                                        0
                                                      );

                                                    const totalDailyBalance =
                                                      totalDailyAmount -
                                                      totalDailyPaid;

                                                    return (
                                                      <>
                                                        <div className="text-center p-2 bg-background rounded shadow-sm">
                                                          <p className="text-xs text-muted-foreground mb-1">
                                                            Sessions Amount
                                                          </p>
                                                          <p className="font-semibold text-lg">
                                                            ₹{totalDailyAmount}
                                                          </p>
                                                        </div>
                                                        <div className="text-center p-2 bg-background rounded shadow-sm">
                                                          <p className="text-xs text-muted-foreground mb-1">
                                                            Sessions Paid
                                                          </p>
                                                          <p className="font-semibold text-lg text-green-600">
                                                            ₹{totalDailyPaid}
                                                          </p>
                                                        </div>
                                                        <div className="text-center p-2 bg-background rounded shadow-sm">
                                                          <p className="text-xs text-muted-foreground mb-1">
                                                            Sessions Balance
                                                          </p>
                                                          <p className="font-semibold text-lg text-red-600">
                                                            ₹{totalDailyBalance}
                                                          </p>
                                                        </div>
                                                      </>
                                                    );
                                                  })()}
                                                </div>
                                              </div>
                                            )}
                                        </div>
                                      </AccordionContent>
                                    </AccordionItem>
                                  </Accordion>
                                );
                              }
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
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
                                      <div className="bg-muted/30 p-4 rounded-md">
                                        <div className="mb-4">
                                          <h4 className="text-sm font-semibold mb-2">
                                            Diagnosis
                                          </h4>
                                          <p className="text-sm">
                                            {prescription.diagnosis ||
                                              "No diagnosis provided"}
                                          </p>
                                        </div>

                                        <div className="mb-4">
                                          <h4 className="text-sm font-semibold mb-2">
                                            Medications
                                          </h4>
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
            </Tabs>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export default ViewPatientDrawer;
