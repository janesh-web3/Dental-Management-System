import React, { useState, useEffect } from "react";
import { crudRequest } from "@/lib/api";
import { format, formatDistance } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import {
  Loader2,
  Search,
  User,
  Calendar,
  Phone,
  MapPin,
  Mail,
  FileImage,
  Filter,
  CheckCircle,
  Clock,
  Activity,
} from "lucide-react";
import { useDoctorAuthContext } from "@/contexts/doctorAuthContext";

interface PatientsProps {
  doctorId: string;
}

interface DailyTreatment {
  _id: string;
  date: string;
  treatmentAmount: number;
  paidAmount: number;
  remainingAmount: number;
  notes: string;
  treatedByDoctor: string;
  procedure: string;
  isCompleted: boolean;
}

interface ToothDetail {
  _id: string;
  number: string;
  details: string;
  position: string;
  procedure: string;
  side: string;
  dailyTreatments: DailyTreatment[];
  totalTreatmentAmount: number;
  totalPaidAmount: number;
  totalRemainingAmount: number;
  startDate: string;
  isCompleted: boolean;
}

interface TreatmentPlan {
  _id: string;
  patientType: string;
  advancedAmount: string;
  balanceAmount: string;
  isCompleted: boolean;
  selectedTeethDetails: ToothDetail[];
  teethNumber: string;
  treatmentAmount: string;
  treatmentDate: string;
  treatmentDetails: string;
  treatedByDoctor: string;
  treatmentDocuments: Array<{
    fileName: string;
    fileUrl: string;
    uploadDate: string;
    description: string;
  }>;
  treatmentFindings: string;
  completionDate: string | null;
  clinicalFindings: string[];
  otherFindings: string;
  followUpDate: string;
}

interface MedicalDetail {
  chiefComplaint: string;
  diagnosis: string;
  investigation: {
    blood: string;
    xray: string;
  };
  medicalHistory: {
    bloodPressure: string;
    diabetes: boolean;
    thyroid: boolean;
    bleedingDisorder: boolean;
    pregnancy: boolean;
    asthma: boolean;
    allergies: string;
    otherConditions: string;
    noMedicalIssues: boolean;
  };
  patientType: string;
  treatmentPlanning: TreatmentPlan[];
  followUpDate: string;
}

interface Patient {
  _id: string;
  personalDetails: {
    name: string;
    contactNumber: string;
    gender: string;
    address: string;
    age: string;
    emailAddress: string;
    referredBy: string;
    checkUpDate: string;
  };
  medicalDetails: MedicalDetail[];
}

interface PatientDetails {
  patient: Patient;
  appointments: Array<any>;
  treatmentPlans: Array<any>;
  prescriptions: Array<any>;
}

const Patients: React.FC = () => {
  const { doctorDetails, isLoading } = useDoctorAuthContext();

  // Get the doctor ID from the auth context
  const doctorId = doctorDetails?._id || "";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading doctor panel...</span>
      </div>
    );
  }

  const [loading, setLoading] = useState<boolean>(true);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedPatient, setSelectedPatient] = useState<PatientDetails | null>(
    null
  );
  const [isPatientDialogOpen, setIsPatientDialogOpen] =
    useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPatients();
  }, [doctorId, currentPage, searchTerm, statusFilter]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await crudRequest<{
        success: boolean;
        data: {
          patients: Patient[];
          totalPages: number;
          currentPage: number;
          totalPatients: number;
        };
        message?: string;
      }>('GET', `/doctor-admin/patients/${doctorId}`, {
        params: {
          page: currentPage,
          limit: 10,
          search: searchTerm,
          status: statusFilter
        }
      });

      if (response.success) {
        setPatients(response.data.patients);
        setTotalPages(response.data.totalPages);
      } else {
        throw new Error(response.message || 'Failed to fetch patients');
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load patients",
      });
    } finally {
      setLoading(false);
    }
  };

  const viewPatientDetails = async (patientId: string) => {
    try {
      setLoading(true);
      const response = await crudRequest<{
        success: boolean;
        data: PatientDetails;
        message?: string;
      }>('GET', `/doctor-admin/patients/${doctorId}/${patientId}`);
      
      if (response.success) {
        setSelectedPatient(response.data);
        setIsPatientDialogOpen(true);
      } else {
        throw new Error(response.message || 'Failed to fetch patient details');
      }
    } catch (error) {
      console.error("Error fetching patient details:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load patient details",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Get the last treatment date for a patient
  const getLastTreatmentDate = (patient: Patient): Date | null => {
    let lastDate: Date | null = null;
    
    if (patient.medicalDetails && patient.medicalDetails.length > 0) {
      patient.medicalDetails.forEach(medicalDetail => {
        if (medicalDetail.treatmentPlanning && medicalDetail.treatmentPlanning.length > 0) {
          medicalDetail.treatmentPlanning.forEach(treatment => {
            if (treatment.selectedTeethDetails && treatment.selectedTeethDetails.length > 0) {
              treatment.selectedTeethDetails.forEach(tooth => {
                if (tooth.dailyTreatments && tooth.dailyTreatments.length > 0) {
                  tooth.dailyTreatments.forEach(dt => {
                    if (dt.date) {
                      const treatmentDate = new Date(dt.date);
                      if (!lastDate || treatmentDate > lastDate) {
                        lastDate = treatmentDate;
                      }
                    }
                  });
                }
              });
            }
          });
        }
      });
    }
    
    return lastDate;
  };
  
  // Format date to a readable string
  const formatDate = (date: Date): string => {
    return format(date, 'MMM dd, yyyy');
  };
  
  // Get days ago string
  const getDaysAgo = (date: Date): string => {
    return formatDistance(date, new Date(), { addSuffix: true });
  };
  
  // Count total treatments for a patient
  const countTreatments = (patient: Patient): { total: number; completed: number } => {
    let total = 0;
    let completed = 0;
    
    if (patient.medicalDetails && patient.medicalDetails.length > 0) {
      patient.medicalDetails.forEach(medicalDetail => {
        if (medicalDetail.treatmentPlanning && medicalDetail.treatmentPlanning.length > 0) {
          medicalDetail.treatmentPlanning.forEach(treatment => {
            if (treatment.selectedTeethDetails && treatment.selectedTeethDetails.length > 0) {
              treatment.selectedTeethDetails.forEach(tooth => {
                if (tooth.dailyTreatments && tooth.dailyTreatments.length > 0) {
                  total += tooth.dailyTreatments.length;
                  completed += tooth.dailyTreatments.filter(dt => dt.isCompleted).length;
                }
              });
            }
          });
        }
      });
    }
    
    return { total, completed };
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Patients</CardTitle>
              <CardDescription>View and manage your patients</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search patients by name..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                className="p-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Treatments</option>
                <option value="completed">Completed Treatments</option>
                <option value="ongoing">Ongoing Treatments</option>
              </select>
            </div>
          </div>

          {loading && !selectedPatient ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Treatment Status</TableHead>
                      <TableHead>Last Treatment</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patients.length > 0 ? (
                      patients.map((patient) => {
                        const treatmentStats = countTreatments(patient);
                        const lastTreatmentDate = getLastTreatmentDate(patient);
                        
                        return (
                          <TableRow key={patient._id}>
                            <TableCell className="font-medium">
                              <div className="flex flex-col">
                                <span>{patient.personalDetails.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {patient.personalDetails.gender}, {patient.personalDetails.age} yrs
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span>{patient.personalDetails.contactNumber}</span>
                                {patient.personalDetails.emailAddress && (
                                  <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                                    {patient.personalDetails.emailAddress}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1">
                                  {treatmentStats.completed === treatmentStats.total && treatmentStats.total > 0 ? (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Clock className="h-4 w-4 text-amber-500" />
                                  )}
                                  <span>
                                    {treatmentStats.completed === treatmentStats.total && treatmentStats.total > 0
                                      ? "Completed"
                                      : "In Progress"}
                                  </span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {treatmentStats.completed}/{treatmentStats.total} treatments
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {lastTreatmentDate ? (
                                <div className="flex flex-col">
                                  <span>{formatDate(lastTreatmentDate)}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {getDaysAgo(lastTreatmentDate)}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">No treatments</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                onClick={() => viewPatientDetails(patient._id)}
                              >
                                View Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          No patients found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center mt-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Patient Details Dialog */}
      <Dialog open={isPatientDialogOpen} onOpenChange={setIsPatientDialogOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
          {selectedPatient ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">
                  Patient: {selectedPatient.patient.personalDetails.name}
                </DialogTitle>
              </DialogHeader>

              <Tabs defaultValue="personal">
                <TabsList className="grid grid-cols-5 mb-4">
                  <TabsTrigger value="personal">Personal Info</TabsTrigger>
                  <TabsTrigger value="medical">Medical History</TabsTrigger>
                  <TabsTrigger value="dental">Dental Records</TabsTrigger>
                  <TabsTrigger value="appointments">Appointments</TabsTrigger>
                  <TabsTrigger value="treatments">Treatments</TabsTrigger>
                </TabsList>

                <TabsContent value="personal" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Personal Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Name:</span>
                          <span>
                            {selectedPatient.patient.personalDetails.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Contact:</span>
                          <span>
                            {
                              selectedPatient.patient.personalDetails
                                .contactNumber
                            }
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-medium">Gender:</span>
                          <span>
                            {selectedPatient.patient.personalDetails.gender}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-medium">Age:</span>
                          <span>
                            {selectedPatient.patient.personalDetails.age}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Address:</span>
                          <span>
                            {selectedPatient.patient.personalDetails.address ||
                              "N/A"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Email:</span>
                          <span>
                            {selectedPatient.patient.personalDetails
                              .emailAddress || "N/A"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-medium">Referred By:</span>
                          <span>
                            {selectedPatient.patient.personalDetails
                              .referredBy || "N/A"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Last Check-up:</span>
                          <span>
                            {selectedPatient.patient.personalDetails.checkUpDate
                              ? new Date(
                                  selectedPatient.patient.personalDetails.checkUpDate
                                ).toLocaleDateString()
                              : "N/A"}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="medical" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Medical History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedPatient.patient.medicalDetails &&
                      selectedPatient.patient.medicalDetails.length > 0 ? (
                        <div className="space-y-4">
                          {selectedPatient.patient.medicalDetails.map(
                            (medical, index) => (
                              <div
                                key={index}
                                className="border rounded-md p-4"
                              >
                                <h3 className="font-semibold mb-2">
                                  Medical Record {index + 1}
                                </h3>

                                <div className="grid grid-cols-2 gap-4 mb-4">
                                  <div>
                                    <span className="font-medium">
                                      Chief Complaint:
                                    </span>
                                    <p>{medical.chiefComplaint || "N/A"}</p>
                                  </div>

                                  <div>
                                    <span className="font-medium">
                                      Diagnosis:
                                    </span>
                                    <p>{medical.diagnosis || "N/A"}</p>
                                  </div>
                                </div>

                                <div className="mb-4">
                                  <h4 className="font-medium mb-2">
                                    Medical Conditions:
                                  </h4>
                                  {medical.medicalHistory ? (
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="flex items-center gap-2">
                                        <span>Blood Pressure:</span>
                                        <span>
                                          {medical.medicalHistory
                                            .bloodPressure || "N/A"}
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <span>Diabetes:</span>
                                        <Badge
                                          variant={
                                            medical.medicalHistory.diabetes
                                              ? "default"
                                              : "outline"
                                          }
                                        >
                                          {medical.medicalHistory.diabetes
                                            ? "Yes"
                                            : "No"}
                                        </Badge>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <span>Thyroid:</span>
                                        <Badge
                                          variant={
                                            medical.medicalHistory.thyroid
                                              ? "default"
                                              : "outline"
                                          }
                                        >
                                          {medical.medicalHistory.thyroid
                                            ? "Yes"
                                            : "No"}
                                        </Badge>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <span>Bleeding Disorder:</span>
                                        <Badge
                                          variant={
                                            medical.medicalHistory
                                              .bleedingDisorder
                                              ? "default"
                                              : "outline"
                                          }
                                        >
                                          {medical.medicalHistory
                                            .bleedingDisorder
                                            ? "Yes"
                                            : "No"}
                                        </Badge>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <span>Pregnancy:</span>
                                        <Badge
                                          variant={
                                            medical.medicalHistory.pregnancy
                                              ? "default"
                                              : "outline"
                                          }
                                        >
                                          {medical.medicalHistory.pregnancy
                                            ? "Yes"
                                            : "No"}
                                        </Badge>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <span>Asthma:</span>
                                        <Badge
                                          variant={
                                            medical.medicalHistory.asthma
                                              ? "default"
                                              : "outline"
                                          }
                                        >
                                          {medical.medicalHistory.asthma
                                            ? "Yes"
                                            : "No"}
                                        </Badge>
                                      </div>
                                    </div>
                                  ) : (
                                    <p>No medical history recorded</p>
                                  )}
                                </div>

                                <div className="mb-4">
                                  <h4 className="font-medium mb-2">
                                    Allergies:
                                  </h4>
                                  <p>
                                    {medical.medicalHistory &&
                                    medical.medicalHistory.allergies
                                      ? medical.medicalHistory.allergies
                                      : "No allergies recorded"}
                                  </p>
                                </div>

                                <div>
                                  <h4 className="font-medium mb-2">
                                    Other Conditions:
                                  </h4>
                                  <p>
                                    {medical.medicalHistory &&
                                    medical.medicalHistory.otherConditions
                                      ? medical.medicalHistory.otherConditions
                                      : "No other conditions recorded"}
                                  </p>
                                </div>

                                {medical.followUpDate && (
                                  <div className="mt-4">
                                    <span className="font-medium">
                                      Follow-up Date:
                                    </span>
                                    <p>
                                      {new Date(
                                        medical.followUpDate
                                      ).toLocaleDateString()}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <p className="text-center py-4">
                          No medical history recorded
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="dental" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Dental Records</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedPatient.patient.medicalDetails &&
                      selectedPatient.patient.medicalDetails.some(
                        (m) =>
                          m.treatmentPlanning && m.treatmentPlanning.length > 0
                      ) ? (
                        <div className="space-y-4">
                          {selectedPatient.patient.medicalDetails.map(
                            (medical, medIndex) =>
                              medical.treatmentPlanning &&
                              medical.treatmentPlanning.length > 0 && (
                                <div key={medIndex}>
                                  {medical.treatmentPlanning.map(
                                    (treatment, treatIndex) => (
                                      <div
                                        key={treatIndex}
                                        className="border rounded-md p-4 mb-4"
                                      >
                                        <h3 className="font-semibold mb-2">
                                          Treatment Plan {treatIndex + 1}
                                          {treatment.isCompleted && (
                                            <Badge
                                              className="ml-2"
                                              variant="default"
                                            >
                                              Completed
                                            </Badge>
                                          )}
                                        </h3>

                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                          <div>
                                            <span className="font-medium">
                                              Treatment Date:
                                            </span>
                                            <p>
                                              {treatment.treatmentDate
                                                ? new Date(
                                                    treatment.treatmentDate
                                                  ).toLocaleDateString()
                                                : "N/A"}
                                            </p>
                                          </div>

                                          <div>
                                            <span className="font-medium">
                                              Follow-up Date:
                                            </span>
                                            <p>
                                              {treatment.followUpDate
                                                ? new Date(
                                                    treatment.followUpDate
                                                  ).toLocaleDateString()
                                                : "N/A"}
                                            </p>
                                          </div>
                                        </div>

                                        <div className="mb-4">
                                          <span className="font-medium">
                                            Teeth Involved:
                                          </span>
                                          <p>
                                            {treatment.teethNumber || "N/A"}
                                          </p>
                                        </div>

                                        <div className="mb-4">
                                          <span className="font-medium">
                                            Treatment Findings:
                                          </span>
                                          <p>
                                            {treatment.treatmentFindings ||
                                              "N/A"}
                                          </p>
                                        </div>

                                        {treatment.clinicalFindings &&
                                          treatment.clinicalFindings.length >
                                            0 && (
                                            <div className="mb-4">
                                              <span className="font-medium">
                                                Clinical Findings:
                                              </span>
                                              <ul className="list-disc pl-5 mt-1">
                                                {treatment.clinicalFindings.map(
                                                  (finding, findingIndex) => (
                                                    <li key={findingIndex}>
                                                      {finding}
                                                    </li>
                                                  )
                                                )}
                                              </ul>
                                            </div>
                                          )}

                                        <div className="mb-4">
                                          <span className="font-medium">
                                            Other Findings:
                                          </span>
                                          <p>
                                            {treatment.otherFindings || "N/A"}
                                          </p>
                                        </div>

                                        {treatment.treatmentDocuments &&
                                          treatment.treatmentDocuments.length >
                                            0 && (
                                            <div>
                                              <span className="font-medium">
                                                Documents:
                                              </span>
                                              <div className="grid grid-cols-2 gap-2 mt-1">
                                                {treatment.treatmentDocuments.map(
                                                  (doc, docIndex) => (
                                                    <a
                                                      key={docIndex}
                                                      href={doc.fileUrl}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="flex items-center gap-2 text-blue-600 hover:underline"
                                                    >
                                                      <FileImage className="h-4 w-4" />
                                                      {doc.fileName}
                                                    </a>
                                                  )
                                                )}
                                              </div>
                                            </div>
                                          )}
                                      </div>
                                    )
                                  )}
                                </div>
                              )
                          )}
                        </div>
                      ) : (
                        <p className="text-center py-4">
                          No dental records available
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="appointments" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Appointment History
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedPatient.appointments &&
                      selectedPatient.appointments.length > 0 ? (
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead>Subject</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {selectedPatient.appointments.map(
                                (appointment) => (
                                  <TableRow key={appointment._id}>
                                    <TableCell>
                                      {appointment.appointmentDate}
                                    </TableCell>
                                    <TableCell>
                                      {appointment.appointmentTime}
                                    </TableCell>
                                    <TableCell>{appointment.subject}</TableCell>
                                    <TableCell>
                                      <Badge
                                        variant={
                                          appointment.status === "Accepted"
                                            ? "default"
                                            : appointment.status === "Rejected"
                                              ? "destructive"
                                              : "outline"
                                        }
                                      >
                                        {appointment.status}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                )
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <p className="text-center py-4">
                          No appointment history
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="treatments" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Treatment Plans</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedPatient.treatmentPlans &&
                      selectedPatient.treatmentPlans.length > 0 ? (
                        <div className="space-y-4">
                          {selectedPatient.treatmentPlans.map((plan) => (
                            <div
                              key={plan._id}
                              className="border rounded-md p-4"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="font-semibold">
                                  {plan.diagnosis}
                                </h3>
                                <Badge
                                  variant={
                                    plan.status === "Completed"
                                      ? "default"
                                      : plan.status === "Cancelled"
                                        ? "destructive"
                                        : "outline"
                                  }
                                >
                                  {plan.status}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                  <span className="font-medium">
                                    Start Date:
                                  </span>
                                  <p>
                                    {new Date(
                                      plan.startDate
                                    ).toLocaleDateString()}
                                  </p>
                                </div>

                                <div>
                                  <span className="font-medium">
                                    Expected End Date:
                                  </span>
                                  <p>
                                    {plan.expectedEndDate
                                      ? new Date(
                                          plan.expectedEndDate
                                        ).toLocaleDateString()
                                      : "Not specified"}
                                  </p>
                                </div>
                              </div>

                              <div className="mb-4">
                                <span className="font-medium">Total Cost:</span>
                                <p>${plan.totalCost.toFixed(2)}</p>
                              </div>

                              {plan.treatmentSteps &&
                                plan.treatmentSteps.length > 0 && (
                                  <div>
                                    <span className="font-medium">
                                      Treatment Steps:
                                    </span>
                                    <div className="mt-2 space-y-2">
                                      {plan.treatmentSteps.map(
                                        (
                                          step: {
                                            procedure:
                                              | string
                                              | number
                                              | boolean
                                              | React.ReactElement<
                                                  any,
                                                  | string
                                                  | React.JSXElementConstructor<any>
                                                >
                                              | Iterable<React.ReactNode>
                                              | React.ReactPortal
                                              | Iterable<React.ReactNode>
                                              | null
                                              | undefined;
                                            status:
                                              | string
                                              | number
                                              | boolean
                                              | React.ReactElement<
                                                  any,
                                                  | string
                                                  | React.JSXElementConstructor<any>
                                                >
                                              | Iterable<React.ReactNode>
                                              | null
                                              | undefined;
                                            plannedDate: string | number | Date;
                                            completedDate:
                                              | string
                                              | number
                                              | Date;
                                            notes:
                                              | string
                                              | number
                                              | boolean
                                              | React.ReactElement<
                                                  any,
                                                  | string
                                                  | React.JSXElementConstructor<any>
                                                >
                                              | Iterable<React.ReactNode>
                                              | React.ReactPortal
                                              | Iterable<React.ReactNode>
                                              | null
                                              | undefined;
                                          },
                                          stepIndex:
                                            | React.Key
                                            | null
                                            | undefined
                                        ) => (
                                          <div
                                            key={stepIndex}
                                            className="border-l-2 pl-3 py-1"
                                          >
                                            <div className="flex justify-between">
                                              <span>{step.procedure}</span>
                                              <Badge
                                                variant={
                                                  step.status === "Completed"
                                                    ? "default"
                                                    : step.status ===
                                                        "Cancelled"
                                                      ? "destructive"
                                                      : step.status ===
                                                          "In Progress"
                                                        ? "secondary"
                                                        : "outline"
                                                }
                                              >
                                                {step.status}
                                              </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                              {step.plannedDate &&
                                                `Planned: ${new Date(step.plannedDate).toLocaleDateString()}`}
                                              {step.completedDate &&
                                                ` • Completed: ${new Date(step.completedDate).toLocaleDateString()}`}
                                            </p>
                                            {step.notes && (
                                              <p className="text-sm mt-1">
                                                {step.notes}
                                              </p>
                                            )}
                                          </div>
                                        )
                                      )}
                                    </div>
                                  </div>
                                )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center py-4">
                          No treatment plans available
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Patients;
