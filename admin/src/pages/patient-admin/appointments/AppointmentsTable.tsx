import React, { useState, useEffect } from "react";
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePatientAuthContext } from "@/contexts/patientAuthContext";
import { getPatientAppointments } from "@/utils/patientAuth";
import { Skeleton } from "@/components/ui/skeleton";

interface Doctor {
  _id: string;
  name: string;
  specialization?: string;
}

interface Appointment {
  _id: string;
  appointmentDate: string;
  appointmentTime: string;
  doctor: Doctor;
  doctorId: Doctor;
  subject: string;
  reason: string;
  status: string;
  notes?: string;
  comments?: string;
}

interface AppointmentsTableProps {
  onAddAppointment: () => void;
}

const AppointmentsTable: React.FC<AppointmentsTableProps> = ({
  onAddAppointment,
}) => {
  const { patientDetails } = usePatientAuthContext();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filtering and sorting states
  const [doctorFilter, setDoctorFilter] = useState<string>("all");
  const [treatmentFilter, setTreatmentFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Appointment | "";
    direction: "ascending" | "descending";
  }>({ key: "", direction: "ascending" });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Fetch appointments
  useEffect(() => {
    const fetchAppointments = async () => {
      if (patientDetails._id) {
        try {
          setLoading(true);
          const response = await getPatientAppointments(patientDetails._id);
          if (response.success && response.appointments) {
            setAppointments(response.appointments);
          } else {
            setError(response.message || "Failed to fetch appointments");
          }
        } catch (error) {
          console.error("Error fetching appointments:", error);
          setError("An error occurred while fetching appointments");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchAppointments();
  }, [patientDetails._id]);

  // Extract unique doctors and treatment types for filters
  const uniqueDoctors = React.useMemo(() => {
    const doctors = appointments
      .map((appointment) => {
        const doctor = appointment.doctor || appointment.doctorId;
        return doctor ? { id: doctor._id, name: doctor.name } : null;
      })
      .filter((doctor): doctor is { id: string; name: string } => doctor !== null);

    return Array.from(
      new Map(doctors.map((doctor) => [doctor.id, doctor])).values()
    );
  }, [appointments]);

  const uniqueTreatments = React.useMemo(() => {
    return Array.from(
      new Set(appointments.map((appointment) => appointment.subject))
    );
  }, [appointments]);

  // Handle sorting
  const requestSort = (key: keyof Appointment) => {
    let direction: "ascending" | "descending" = "ascending";
    if (
      sortConfig.key === key &&
      sortConfig.direction === "ascending"
    ) {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  // Apply filters and sorting
  const filteredAndSortedAppointments = React.useMemo(() => {
    let filtered = [...appointments];

    // Apply doctor filter
    if (doctorFilter !== "all") {
      filtered = filtered.filter((appointment) => {
        const doctor = appointment.doctor || appointment.doctorId;
        return doctor && doctor._id === doctorFilter;
      });
    }

    // Apply treatment filter
    if (treatmentFilter !== "all") {
      filtered = filtered.filter(
        (appointment) => appointment.subject === treatmentFilter
      );
    }

    // Apply date filter
    if (dateFilter) {
      const filterDate = format(dateFilter, "yyyy-MM-dd");
      filtered = filtered.filter((appointment) => {
        const appointmentDate = appointment.appointmentDate.split("T")[0];
        return appointmentDate === filterDate;
      });
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (appointment) =>
          (appointment.doctor?.name || appointment.doctorId?.name || "")
            .toLowerCase()
            .includes(query) ||
          appointment.subject.toLowerCase().includes(query) ||
          appointment.reason.toLowerCase().includes(query) ||
          (appointment.notes || "").toLowerCase().includes(query)
      );
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (sortConfig.key === "appointmentDate") {
          aValue = new Date(a.appointmentDate + " " + a.appointmentTime);
          bValue = new Date(b.appointmentDate + " " + b.appointmentTime);
        } else if (sortConfig.key === "doctor") {
          aValue = a.doctor?.name || a.doctorId?.name || "";
          bValue = b.doctor?.name || b.doctorId?.name || "";
        } else if (sortConfig.key) {
          // Use type assertion to access properties safely
          aValue = a[sortConfig.key as keyof Appointment];
          bValue = b[sortConfig.key as keyof Appointment];
        }

        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [
    appointments,
    doctorFilter,
    treatmentFilter,
    dateFilter,
    searchQuery,
    sortConfig,
  ]);

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAndSortedAppointments.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(
    filteredAndSortedAppointments.length / itemsPerPage
  );

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [doctorFilter, treatmentFilter, dateFilter, searchQuery]);

  // Status badge variant
  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "accepted":
      case "confirmed":
        return "default";
      case "pending":
        return "outline";
      case "rejected":
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  // Render loading skeletons
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-[150px]" />
          <Skeleton className="h-10 w-[100px]" />
        </div>
        <div className="flex gap-2 mb-4">
          <Skeleton className="h-10 w-[120px]" />
          <Skeleton className="h-10 w-[120px]" />
          <Skeleton className="h-10 w-[120px]" />
          <Skeleton className="h-10 flex-1" />
        </div>
        <div className="border rounded-md">
          <div className="h-10 border-b flex">
            <Skeleton className="h-full w-1/5" />
            <Skeleton className="h-full w-1/5" />
            <Skeleton className="h-full w-1/5" />
            <Skeleton className="h-full w-1/5" />
            <Skeleton className="h-full w-1/5" />
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 border-b flex last:border-0">
              <Skeleton className="h-full w-1/5" />
              <Skeleton className="h-full w-1/5" />
              <Skeleton className="h-full w-1/5" />
              <Skeleton className="h-full w-1/5" />
              <Skeleton className="h-full w-1/5" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Your Appointments</h2>
        <Button onClick={onAddAppointment}>Schedule Appointment</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-2 mb-4">
        <Select
          value={doctorFilter}
          onValueChange={setDoctorFilter}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Doctor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Doctors</SelectItem>
            {uniqueDoctors.map((doctor) => (
              <SelectItem key={doctor.id} value={doctor.id}>
                {doctor.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={treatmentFilter}
          onValueChange={setTreatmentFilter}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Treatment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Treatments</SelectItem>
            {uniqueTreatments.map((treatment) => (
              <SelectItem key={treatment} value={treatment}>
                {treatment}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[180px] justify-start text-left font-normal",
                !dateFilter && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateFilter ? format(dateFilter, "PPP") : "Filter by Date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={dateFilter}
              onSelect={setDateFilter}
              initialFocus
            />
            {dateFilter && (
              <div className="p-2 border-t border-border">
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => setDateFilter(undefined)}
                >
                  Clear Date
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>

        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search appointments..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Appointments Table */}
      {error ? (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          {error}
        </div>
      ) : filteredAndSortedAppointments.length === 0 ? (
        <div className="bg-muted p-8 text-center rounded-md">
          <p className="text-muted-foreground">No appointments found</p>
          {(doctorFilter !== "all" ||
            treatmentFilter !== "all" ||
            dateFilter ||
            searchQuery) && (
            <Button
              variant="link"
              onClick={() => {
                setDoctorFilter("all");
                setTreatmentFilter("all");
                setDateFilter(undefined);
                setSearchQuery("");
              }}
            >
              Clear all filters
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => requestSort("appointmentDate")}
                  >
                    Date & Time
                    {sortConfig.key === "appointmentDate" && (
                      <span className="ml-1">
                        {sortConfig.direction === "ascending" ? "↑" : "↓"}
                      </span>
                    )}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => requestSort("doctor")}
                  >
                    Doctor
                    {sortConfig.key === "doctor" && (
                      <span className="ml-1">
                        {sortConfig.direction === "ascending" ? "↑" : "↓"}
                      </span>
                    )}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => requestSort("subject")}
                  >
                    Treatment
                    {sortConfig.key === "subject" && (
                      <span className="ml-1">
                        {sortConfig.direction === "ascending" ? "↑" : "↓"}
                      </span>
                    )}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => requestSort("status")}
                  >
                    Status
                    {sortConfig.key === "status" && (
                      <span className="ml-1">
                        {sortConfig.direction === "ascending" ? "↑" : "↓"}
                      </span>
                    )}
                  </TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems.map((appointment) => (
                  <TableRow key={appointment._id}>
                    <TableCell>
                      <div className="font-medium">
                        {format(
                          new Date(appointment.appointmentDate),
                          "MMM d, yyyy"
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {appointment.appointmentTime}
                      </div>
                    </TableCell>
                    <TableCell>
                      {(appointment.doctor?.name || appointment.doctorId?.name) && (
                        <div>
                          <div>{appointment.doctor?.name || appointment.doctorId?.name}</div>
                          {(appointment.doctor?.specialization || appointment.doctorId?.specialization) && (
                            <div className="text-sm text-muted-foreground">
                              {appointment.doctor?.specialization || appointment.doctorId?.specialization}
                            </div>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>{appointment.subject}</div>
                      <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                        {appointment.reason}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(appointment.status)}>
                        {appointment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm truncate max-w-[200px]">
                        {appointment.notes || appointment.comments || "-"}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {indexOfFirstItem + 1}-
                {Math.min(indexOfLastItem, filteredAndSortedAppointments.length)} of{" "}
                {filteredAndSortedAppointments.length} appointments
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-sm">
                  Page {currentPage} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AppointmentsTable;
