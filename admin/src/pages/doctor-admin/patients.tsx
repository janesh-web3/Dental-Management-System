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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { useDoctorAuthContext } from "@/contexts/doctorAuthContext";
import { AddPrescriptionButton } from "@/components/prescription/AddPrescriptionButton";
import ViewPatientDrawer from "@/components/patient/ViewPatientDrawer";
import { Patient } from "@/types/patient";

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

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes?: string;
}

interface Prescription {
  _id: string;
  patient: string;
  doctor: string;
  doctorName?: string;
  diagnosis: string;
  medications: Medication[];
  tests?: string;
  nextVisitDate?: string;
  instructions?: string;
  createdAt: string;
  updatedAt: string;
}

interface PatientDetails {
  patient: Patient;
  appointments: Array<any>;
  treatmentPlans: Array<any>;
  prescriptions: Prescription[];
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
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState<boolean>(false);
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
      // Find the patient in the existing patients array
      const patient = patients.find(p => p._id === patientId);
      
      if (patient) {
        setSelectedPatient(patient);
        setIsViewDrawerOpen(true);
      } else {
        throw new Error('Patient not found');
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
                              <div className="flex justify-end gap-2">
                                <AddPrescriptionButton
                                  patientId={patient._id}
                                  patientName={patient.personalDetails.name}
                                  patientData={{
                                    contactNumber: patient.personalDetails.contactNumber,
                                    emailAddress: patient.personalDetails.emailAddress,
                                    age: patient.personalDetails.age,
                                    gender: patient.personalDetails.gender,
                                    address: patient.personalDetails.address
                                  }}
                                  doctorId={doctorId}
                                  isAdmin={false}
                                  variant="outline"
                                  size="sm"
                                />
                                <Button
                                  variant="outline"
                                  onClick={() => viewPatientDetails(patient._id)}
                                >
                                  View Details
                                </Button>
                              </div>
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

      {/* ViewPatientDrawer component */}
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
    </div>
  );
};

export default Patients;
