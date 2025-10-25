import React, { useState, useEffect } from "react";
import { crudRequest } from "@/lib/api";
import {
  format,
  formatDistance,
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
  isAfter,
} from "date-fns";
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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
  Loader2,
  Search,
  Filter,
  CheckCircle,
  Clock,
  CalendarRange,
} from "lucide-react";
import { useDoctorAuthContext } from "@/contexts/doctorAuthContext";
import { AddPrescriptionButton } from "@/components/prescription/AddPrescriptionButton";
import ViewPatientDrawer from "@/components/patient/ViewPatientDrawer";
import { Patient } from "@/types/patient";
import { SMSActionButtons } from "@/components/sms/SMSActionButtons";

// Extend the Patient type with additional properties
interface ExtendedPatient extends Patient {
  createdAt: string;
  followUpDate?: string;
  billingDetails?: {
    totalAmount: number;
    totalPaid: number;
  };
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
  const [patients, setPatients] = useState<ExtendedPatient[]>([]);
  const [allPatients, setAllPatients] = useState<ExtendedPatient[]>([]); // Store all patients for client-side filtering
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState<string>("all"); // New time filter state
  const [selectedPatient, setSelectedPatient] =
    useState<ExtendedPatient | null>(null);
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    // Only fetch from server when these parameters change
    fetchPatients();
  }, [doctorId, currentPage, searchTerm, statusFilter]);

  // Apply client-side time filter when it changes
  useEffect(() => {
    if (allPatients.length > 0 && timeFilter) {
      filterPatientsByTime(timeFilter);
    }
  }, [timeFilter]);

  // Function to get start date based on time filter
  const getStartDate = (timeRange: string): Date | null => {
    const now = new Date();
    switch (timeRange) {
      case "daily":
        return startOfDay(now);
      case "weekly":
        return startOfWeek(now);
      case "monthly":
        return startOfMonth(now);
      case "yearly":
        return startOfYear(now);
      default:
        return null; // "all" - no date filtering
    }
  };

  const fetchPatients = async () => {
    try {
      setLoading(true);

      // Get start date based on time filter
      const startDate = getStartDate(timeFilter);

      // Add startDate to params if time filter is not "all"
      const params: Record<string, any> = {
        page: currentPage,
        limit: 10,
        search: searchTerm,
        status: statusFilter,
      };

      // For server-side filtering (optional)
      // if (startDate) {
      //   params.startDate = startDate.toISOString();
      // }

      const response = await crudRequest<{
        success: boolean;
        data: {
          patients: ExtendedPatient[];
          totalPages: number;
          currentPage: number;
          totalPatients: number;
        };
        message?: string;
      }>("GET", `/doctor-admin/patients/${doctorId}`, { params });

      if (response.success) {
        // Store all patients for client-side filtering
        setAllPatients(response.data.patients);

        // Apply time filter client-side
        if (timeFilter !== "all" && startDate) {
          const filteredPatients = response.data.patients.filter((patient) => {
            const patientCreatedAt = new Date(patient.createdAt);
            return (
              isAfter(patientCreatedAt, startDate) ||
              patientCreatedAt.getTime() === startDate.getTime()
            );
          });
          setPatients(filteredPatients);
        } else {
          setPatients(response.data.patients);
        }

        setTotalPages(response.data.totalPages);
      } else {
        throw new Error(response.message || "Failed to fetch patients");
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

  // Handle time filter change
  const handleTimeFilterChange = (value: string) => {
    setTimeFilter(value);

    // If we're using client-side filtering
    if (allPatients.length > 0) {
      filterPatientsByTime(value);
    } else {
      // If we're using server-side filtering, reset to first page and let the useEffect trigger
      setCurrentPage(1);
    }
  };

  // Filter patients by time range client-side
  const filterPatientsByTime = (timeRange: string) => {
    if (timeRange === "all") {
      setPatients(allPatients);
      return;
    }

    const startDate = getStartDate(timeRange);
    if (!startDate) {
      setPatients(allPatients);
      return;
    }

    const filteredPatients = allPatients.filter((patient) => {
      const patientCreatedAt = new Date(patient.createdAt);
      return (
        isAfter(patientCreatedAt, startDate) ||
        patientCreatedAt.getTime() === startDate.getTime()
      );
    });

    setPatients(filteredPatients);
  };

  const viewPatientDetails = async (patientId: string) => {
    try {
      setLoading(true);
      // Find the patient in the existing patients array
      const patient = patients.find((p) => p._id === patientId);

      if (patient) {
        setSelectedPatient(patient);
        setIsViewDrawerOpen(true);
      } else {
        throw new Error("Patient not found");
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
  const getLastTreatmentDate = (patient: ExtendedPatient): Date | null => {
    let lastDate: Date | null = null;

    if (patient.medicalDetails && patient.medicalDetails.length > 0) {
      patient.medicalDetails.forEach((medicalDetail) => {
        if (
          medicalDetail.treatmentPlanning &&
          medicalDetail.treatmentPlanning.length > 0
        ) {
          medicalDetail.treatmentPlanning.forEach((treatment) => {
            if (
              treatment.selectedTeethDetails &&
              treatment.selectedTeethDetails.length > 0
            ) {
              treatment.selectedTeethDetails.forEach((tooth) => {
                if (tooth.dailyTreatments && tooth.dailyTreatments.length > 0) {
                  tooth.dailyTreatments.forEach((dt) => {
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
    return format(date, "MMM dd, yyyy");
  };

  // Get days ago string
  const getDaysAgo = (date: Date): string => {
    return formatDistance(date, new Date(), { addSuffix: true });
  };

  // Count total treatments for a patient
  const countTreatments = (
    patient: ExtendedPatient
  ): { total: number; completed: number } => {
    let total = 0;
    let completed = 0;

    if (patient.medicalDetails && patient.medicalDetails.length > 0) {
      patient.medicalDetails.forEach((medicalDetail) => {
        if (
          medicalDetail.treatmentPlanning &&
          medicalDetail.treatmentPlanning.length > 0
        ) {
          medicalDetail.treatmentPlanning.forEach((treatment) => {
            if (
              treatment.selectedTeethDetails &&
              treatment.selectedTeethDetails.length > 0
            ) {
              treatment.selectedTeethDetails.forEach((tooth) => {
                if (tooth.dailyTreatments && tooth.dailyTreatments.length > 0) {
                  total += tooth.dailyTreatments.length;
                  completed += tooth.dailyTreatments.filter(
                    (dt) => dt.isCompleted
                  ).length;
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
            {timeFilter !== "all" && (
              <div className="text-sm text-muted-foreground">
                Showing {patients.length} patients in selected time range
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search patients by name..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex items-center gap-2 flex-1">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  className="w-full sm:w-auto p-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Treatments</option>
                  <option value="completed">Completed Treatments</option>
                  <option value="ongoing">Ongoing Treatments</option>
                </select>
              </div>
              <div className="flex items-center gap-2 flex-1">
                <CalendarRange className="h-4 w-4 text-muted-foreground" />
                <Select
                  value={timeFilter}
                  onValueChange={handleTimeFilterChange}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Time Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="daily">Today</SelectItem>
                      <SelectItem value="weekly">This Week</SelectItem>
                      <SelectItem value="monthly">This Month</SelectItem>
                      <SelectItem value="yearly">This Year</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
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
                                  {patient.personalDetails.gender},{" "}
                                  {patient.personalDetails.age} yrs
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span>
                                  {patient.personalDetails.contactNumber}
                                </span>
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
                                  {treatmentStats.completed ===
                                    treatmentStats.total &&
                                  treatmentStats.total > 0 ? (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Clock className="h-4 w-4 text-amber-500" />
                                  )}
                                  <span>
                                    {treatmentStats.completed ===
                                      treatmentStats.total &&
                                    treatmentStats.total > 0
                                      ? "Completed"
                                      : "In Progress"}
                                  </span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {treatmentStats.completed}/
                                  {treatmentStats.total} treatments
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
                                <span className="text-muted-foreground">
                                  No treatments
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2 items-center">
                                <SMSActionButtons 
                                  patientId={patient._id}
                                  patientName={patient.personalDetails.name}
                                  phoneNumber={patient.personalDetails.contactNumber}
                                  followUpDate={patient.followUpDate}
                                  hasPaymentDue={patient.billingDetails ? patient.billingDetails.totalAmount > (patient.billingDetails.totalPaid || 0) : false}
                                  onSuccess={() => {
                                    toast({
                                      title: "Success",
                                      description: "SMS sent successfully",
                                    });
                                  }}
                                />
                                <AddPrescriptionButton
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
                                  doctorId={doctorId}
                                  isAdmin={false}
                                  variant="outline"
                                  size="sm"
                                />
                                <Button
                                  variant="outline"
                                  onClick={() =>
                                    viewPatientDetails(patient._id)
                                  }
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
                          {timeFilter !== "all" ? (
                            <>No patients found in the selected time range</>
                          ) : (
                            <>No patients found</>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && timeFilter === "all" && (
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
          isDoctorView={true}
        />
      )}
    </div>
  );
};

export default Patients;
