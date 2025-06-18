import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useState } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { crudRequest } from "@/lib/api";
import { Link } from "react-router-dom";
import { File, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Error from "../not-found/error";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Doctor = {
  _id: string;
  name: string;
  email: string;
};

type Appointment = {
  _id: string;
  firstName: string;
  lastName: string;
  age: string;
  address: string;
  phoneNumber: string;
  gender: string;
  appointmentDate: string;
  appointmentTime: string;
  doctor: Doctor;
  subject: string;
  reason: string;
  comments: string;
  hasVisited: boolean;
  status: string;
  isCreated: string;
};

const AppointmentTable = () => {
  const [columnVisibility, setColumnVisibility] = useState({
    firstName: true,
    lastName: true,
    age: false,
    phoneNumber: true,
    address: false,
    gender: false,
    appointmentDate: true,
    appointmentTime: true,
    doctor: true,
    subject: false,
    reason: false,
    comments: false,
    hasVisited: false,
    status: true,
  });

  const [appointment, setAppointment] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filteredAppointment, setFilteredAppointment] = useState<Appointment[]>(
    []
  );
  //pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedTab, setSelectedTab] = useState<string>("all");
  const [status, setStatus] = useState("All");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const toggleColumnVisibility = (column: keyof typeof columnVisibility) => {
    setColumnVisibility((prevState) => ({
      ...prevState,
      [column]: !prevState[column],
    }));
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const fetchAppointment = async (
    page: number = 1,
    limit: number = itemsPerPage,
    search: string = ""
  ) => {
    try {
      const response = await crudRequest<{
        result: Appointment[];
        totalPages: number;
        pageCount: number;
        totalUser: number;
      }>(
        "GET",
        `/appointment/appointment?page=${page}&limit=${limit}&search=${search}&status=${status}`
      );
      if (response && Array.isArray(response.result)) {
        setAppointment(response.result);
        setFilteredAppointment(response.result);
        setTotalPages(response.totalPages);
      } else {
        setError("Unexpected response format");
      }
    } catch (error) {
      setError("Error fetching student data");
      console.error("Error fetching student data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointment(currentPage, itemsPerPage, searchQuery);
  }, [currentPage, itemsPerPage, searchQuery]);

  useEffect(() => {
    let filtered = appointment;

    // Filter by gender
    if (selectedTab !== "all") {
      filtered = filtered.filter(
        (s) => s.gender.toLowerCase() === selectedTab.toLowerCase()
      );
    }

    setFilteredAppointment(filtered);
  }, [selectedTab, setFilteredAppointment, appointment]);

  useEffect(() => {
    setFilteredAppointment(appointment);
  }, [appointment]);

  const exportToCSV = () => {};

  const handleFilter = (value: string) => {
    setStatus(value);
    fetchAppointment();
  };

  const renderLoadingSkeleton = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Gender</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Address</TableHead>
          <TableHead>Visit Date</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[...Array(5)].map((_, index) => (
          <TableRow key={index}>
            <TableCell>
              <div className="h-4 bg-muted animate-pulse rounded w-[150px]" />
            </TableCell>
            <TableCell>
              <div className="h-4 bg-muted animate-pulse rounded w-[80px]" />
            </TableCell>
            <TableCell>
              <div className="h-4 bg-muted animate-pulse rounded w-[120px]" />
            </TableCell>
            <TableCell>
              <div className="h-4 bg-muted animate-pulse rounded w-[200px]" />
            </TableCell>
            <TableCell>
              <div className="h-4 bg-muted animate-pulse rounded w-[100px]" />
            </TableCell>
            <TableCell>
              <div className="w-8 h-8 rounded bg-muted animate-pulse" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  interface StatusChangeResponse {
    status: string;
  }

  const handleStatusChange = async (
    id: string,
    status: string
  ): Promise<void> => {
    try {
      await crudRequest<StatusChangeResponse>(
        "PUT",
        `/appointment/update-appointment-status/${id}`,
        { status }
      );
      fetchAppointment();
    } catch (error) {
      console.error("Error updating appointment status:", error);
    }
  };

  const renderAppointmentTable = () => (
    <Table>
      <TableHeader className="sticky top-0 bg-background">
        <TableRow>
          {columnVisibility.firstName && <TableHead>First Name</TableHead>}
          {columnVisibility.lastName && <TableHead>Last Name</TableHead>}
          {columnVisibility.age && <TableHead>Age</TableHead>}
          {columnVisibility.gender && <TableHead>Gender</TableHead>}
          {columnVisibility.address && <TableHead>Address</TableHead>}
          {columnVisibility.phoneNumber && <TableHead>Phone Number</TableHead>}
          {columnVisibility.appointmentDate && (
            <TableHead>Appointment Date</TableHead>
          )}
          {columnVisibility.appointmentTime && (
            <TableHead>Appointment Time</TableHead>
          )}
          {columnVisibility.doctor && <TableHead>Doctor</TableHead>}
          {columnVisibility.subject && <TableHead>Subject</TableHead>}
          {columnVisibility.reason && <TableHead>Reason</TableHead>}
          {columnVisibility.comments && <TableHead>Comments</TableHead>}
          {columnVisibility.hasVisited && <TableHead>Has Visited</TableHead>}
          {columnVisibility.status && <TableHead>Status</TableHead>}
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredAppointment.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7}>No appointment a vailable</TableCell>
          </TableRow>
        ) : (
          filteredAppointment &&
          filteredAppointment.map((appointment, index) => (
            <TableRow key={index}>
              {columnVisibility.firstName && (
                <TableCell className="font-medium">
                  {appointment.firstName}
                </TableCell>
              )}
              {columnVisibility.lastName && (
                <TableCell className="font-medium">
                  {appointment.lastName}
                </TableCell>
              )}
              {columnVisibility.age && (
                <TableCell className="font-medium">{appointment.age}</TableCell>
              )}
              {columnVisibility.gender && (
                <TableCell className="font-medium">
                  {appointment.gender}
                </TableCell>
              )}
              {columnVisibility.address && (
                <TableCell className="font-medium">
                  {appointment.address}
                </TableCell>
              )}
              {columnVisibility.phoneNumber && (
                <TableCell className="font-medium">
                  {appointment.phoneNumber}
                </TableCell>
              )}
              {columnVisibility.appointmentDate && (
                <TableCell className="font-medium">
                  {appointment.appointmentDate}
                </TableCell>
              )}
              {columnVisibility.appointmentTime && (
                <TableCell className="font-medium">
                  {appointment.appointmentTime}
                </TableCell>
              )}
              {columnVisibility.doctor && (
                <TableCell className="font-medium">
                  {appointment?.doctor?.name}
                </TableCell>
              )}
              {columnVisibility.subject && (
                <TableCell className="font-medium">
                  {appointment.subject}
                </TableCell>
              )}
              {columnVisibility.reason && (
                <TableCell className="font-medium">
                  {appointment?.reason}
                </TableCell>
              )}
              {columnVisibility.comments && (
                <TableCell className="font-medium">
                  {appointment?.comments}
                </TableCell>
              )}
              {columnVisibility.hasVisited && (
                <TableCell className="font-medium">
                  {appointment?.hasVisited}
                </TableCell>
              )}
              {columnVisibility.status && (
                <TableCell className="font-medium">
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      {appointment?.status === "Pending" ? (
                        <span>
                          <span className="px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-200 rounded-full">
                            Pending
                          </span>
                        </span>
                      ) : appointment?.status === "Accepted" ? (
                        <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-200 rounded-full">
                          Approved
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-200 rounded-full">
                          Rejected
                        </span>
                      )}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="cursor-pointer">
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() =>
                          handleStatusChange(appointment._id, "Pending")
                        }
                      >
                        Set to Pending
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() =>
                          handleStatusChange(appointment._id, "Accepted")
                        }
                      >
                        Set to Accepted
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() =>
                          handleStatusChange(appointment._id, "Rejected")
                        }
                      >
                        Set to Rejected
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              )}
              <TableCell className="text-right">
                <Drawer>
                  <DrawerTrigger>
                    <span className="bg-blue-700 px-2 py-1 rounded-lg">
                      View
                    </span>
                  </DrawerTrigger>

                  <DrawerContent className="px-10">
                    <DrawerHeader>
                      <DrawerTitle>Appointment Details</DrawerTitle>
                      <DrawerDescription>
                        Detailed information about the appointment.
                      </DrawerDescription>
                    </DrawerHeader>
                    <DrawerDescription>
                      <div className="grid gap-4 py-4 px-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="font-bold">First Name:</p>
                            <p>{appointment?.firstName}</p>
                          </div>
                          <div>
                            <p className="font-bold">Last Name:</p>
                            <p>{appointment?.lastName}</p>
                          </div>
                          <div>
                            <p className="font-bold">Age:</p>
                            <p>{appointment?.age}</p>
                          </div>
                          <div>
                            <p className="font-bold">Contact Number:</p>
                            <p>{appointment?.phoneNumber}</p>
                          </div>
                          <div>
                            <p className="font-bold">Gender:</p>
                            <p>{appointment?.gender}</p>
                          </div>
                          <div>
                            <p className="font-bold">Address:</p>
                            <p>{appointment?.address}</p>
                          </div>
                          <div>
                            <p className="font-bold">Doctor:</p>
                            <p>{appointment?.doctor?.name}</p>
                          </div>
                          <div>
                            <p className="font-bold">Date:</p>
                            <p>{appointment?.appointmentDate}</p>
                          </div>
                          <div>
                            <p className="font-bold">Time:</p>
                            <p>{appointment?.appointmentTime}</p>
                          </div>
                          <div>
                            <p className="font-bold">Status:</p>
                            <p>{appointment?.status}</p>
                          </div>
                          <div>
                            <p className="font-bold">Reason:</p>
                            <p>{appointment?.reason}</p>
                          </div>
                          <div>
                            <p className="font-bold">Subject:</p>
                            <p>{appointment?.subject}</p>
                          </div>
                          <div>
                            <p className="font-bold">Comments:</p>
                            <p>{appointment?.comments}</p>
                          </div>
                          <div>
                            <p className="font-bold">Created Date:</p>
                            <p>{appointment?.isCreated}</p>
                          </div>
                          <div>
                            <p className="font-bold">Visited:</p>
                            <p>{appointment?.hasVisited ? "Yes" : "No"}</p>
                          </div>
                        </div>
                      </div>
                    </DrawerDescription>
                    <DrawerFooter>
                      <DrawerClose>
                        <Button variant="outline">Cancel</Button>
                      </DrawerClose>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
  return (
    <div className="flex flex-col h-full">
      <div className="flex-none">
        <header className="sticky top-0 z-30 flex items-center gap-4 md:px-4 border-b h-14 bg-background sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-">
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
                  <Link to="#">Patients</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Appointments</BreadcrumbPage>
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
        </header>
      </div>

      <div className="flex-1">
        <div className="p-4">
          <Tabs
            defaultValue="all"
            value={selectedTab}
            onValueChange={setSelectedTab}
          >
            <div className="flex flex-wrap gap-2 items-center justify-between p-2">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="male">Male</TabsTrigger>
                <TabsTrigger value="female">Female</TabsTrigger>
                <TabsTrigger value="other">Other</TabsTrigger>
              </TabsList>
              <Select
                value={status}
                onValueChange={(value) => handleFilter(value)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Accepted">Accepted</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex flex-wrap items-center gap-2 ml-auto">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 ml-2 md:h-9"
                    >
                      Columns
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[200px]">
                    <DropdownMenuLabel>Select Columns</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem
                      checked={columnVisibility.firstName}
                      onCheckedChange={() =>
                        toggleColumnVisibility("firstName")
                      }
                    >
                      First Name
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={columnVisibility.lastName}
                      onCheckedChange={() => toggleColumnVisibility("lastName")}
                    >
                      Last Name
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={columnVisibility.gender}
                      onCheckedChange={() => toggleColumnVisibility("gender")}
                    >
                      Gender
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={columnVisibility.phoneNumber}
                      onCheckedChange={() =>
                        toggleColumnVisibility("phoneNumber")
                      }
                    >
                      Phone Number
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={columnVisibility.address}
                      onCheckedChange={() => toggleColumnVisibility("address")}
                    >
                      Address
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={columnVisibility.appointmentDate}
                      onCheckedChange={() =>
                        toggleColumnVisibility("appointmentDate")
                      }
                    >
                      Appointment Date
                    </DropdownMenuCheckboxItem>

                    <DropdownMenuCheckboxItem
                      checked={columnVisibility.appointmentTime}
                      onCheckedChange={() =>
                        toggleColumnVisibility("appointmentTime")
                      }
                    >
                      Appointment Time
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={columnVisibility.doctor}
                      onCheckedChange={() => toggleColumnVisibility("doctor")}
                    >
                      Doctor
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={columnVisibility.subject}
                      onCheckedChange={() => toggleColumnVisibility("subject")}
                    >
                      Subject
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={columnVisibility.reason}
                      onCheckedChange={() => toggleColumnVisibility("reason")}
                    >
                      Reason
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={columnVisibility.comments}
                      onCheckedChange={() => toggleColumnVisibility("comments")}
                    >
                      Comments
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={columnVisibility.hasVisited}
                      onCheckedChange={() =>
                        toggleColumnVisibility("hasVisited")
                      }
                    >
                      Has Visited
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={columnVisibility.status}
                      onCheckedChange={() => toggleColumnVisibility("status")}
                    >
                      Status
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1"
                  onClick={exportToCSV}
                >
                  <File className="h-3.5 w-3.5" />
                  <span>Export</span>
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center p-8">
                {renderLoadingSkeleton()}
              </div>
            ) : error ? (
              <div className="flex justify-center p-8">
                <Error />
              </div>
            ) : (
              <div>
                <div>
                  <TabsContent value="all">
                    {renderAppointmentTable()}
                  </TabsContent>
                  <TabsContent value="male">
                    {renderAppointmentTable()}
                  </TabsContent>
                  <TabsContent value="female">
                    {renderAppointmentTable()}
                  </TabsContent>
                  <TabsContent value="other">
                    {renderAppointmentTable()}
                  </TabsContent>
                </div>
              </div>
            )}
          </Tabs>
          <div className="flex-none p-4">
            <div className="flex items-center justify-end py-4 space-x-2 overflow-auto">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      isActive={currentPage === 1 ? false : true}
                      onClick={() =>
                        handlePageChange(Math.max(currentPage - 1, 1))
                      }
                      // disabled={currentPage === 1}
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
                      isActive={currentPage === totalPages ? false : true}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentTable;
