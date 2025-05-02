import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash, Plus, Eye } from "lucide-react";
import { crudRequest } from "@/lib/api";
import AddDoctor from "./AddDoctor";
import PopupModal from "@/components/shared/popup-modal";
import Loading from "@/pages/not-found/loading";
import Error from "@/pages/not-found/error";
import ViewDoctor from "@/components/doctor/ViewDoctor";
import UpdateDoctorModal from "@/components/doctor/UpdateDoctorModal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Doctor } from "@/types/doctor";
import { useAdminContext } from "@/contexts/adminContext";

export function DoctorTable() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [doctorToDelete, setDoctorToDelete] = useState<Doctor | null>(null);
  const { adminDetails } = useAdminContext();

  useEffect(() => {
    fetchDoctors();
  }, [searchQuery]);

  const fetchDoctors = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await crudRequest<{
        doctor: Doctor[];
        totalPages: number;
        patientsOnPage: number;
        totalPatients: number;
      }>("GET", `/doctor/get-pagination-doctor?search=${searchQuery}`);
      if (response && Array.isArray(response.doctor)) {
        setDoctors(response.doctor);
      } else {
        setError("Unexpected response format");
      }
    } catch (error) {
      setError("Error fetching doctor data");
      console.error("Error fetching doctor data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleDelete = async (id: string) => {
    try {
      await crudRequest("DELETE", `/doctor/delete-doctor/${id}`);
      setDoctors((prev) => prev.filter((doctor) => doctor._id !== id));
    } catch (error) {
      console.error("Error deleting doctor:", error);
    }
  };

  const handleDeleteClick = (doctor: Doctor) => {
    setDoctorToDelete(doctor);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (doctorToDelete) {
      await handleDelete(doctorToDelete._id);
      setDeleteDialogOpen(false);
      setDoctorToDelete(null);
    }
  };

  const renderDoctorTable = () => (
    <Table className="min-w-full table-fixed">
      <TableHeader>
        <TableRow>
          <TableHead className="table-cell">Name</TableHead>
          <TableHead className="table-cell">Age</TableHead>
          <TableHead className="table-cell">Phone Number</TableHead>
          <TableHead className="table-cell">Address</TableHead>
          <TableHead className="table-cell">Experience Years</TableHead>
          <TableHead className="table-cell">Specialization</TableHead>
          <TableHead className="table-cell">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {doctors.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7}>No doctors available</TableCell>
          </TableRow>
        ) : (
          doctors.map((doctor, index) => (
            <TableRow key={index}>
              <TableCell className="table-cell">{doctor.name}</TableCell>
              <TableCell className="table-cell">{doctor.age}</TableCell>
              <TableCell className="table-cell">
                {doctor.contactNumber}
              </TableCell>
              <TableCell className="table-cell">{doctor.address}</TableCell>
              <TableCell className="table-cell">
                {doctor.experienceYears}
              </TableCell>
              <TableCell className="table-cell">
                {doctor.specialization}
              </TableCell>
              <TableCell className="table-cell">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-8 h-8 p-0">
                      <MoreHorizontal className="w-6 h-6" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="cursor-pointer">
                    <DropdownMenuItem
                      className="flex justify-between cursor-pointer"
                      onClick={() => {
                        setSelectedDoctor(doctor);
                        setIsUpdateModalOpen(true);
                      }}
                    >
                      Edit <Edit size={17} />
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedDoctor(doctor);
                        setIsViewModalOpen(true);
                      }}
                      className="flex justify-between cursor-pointer"
                    >
                      View <Eye size={17} />
                    </DropdownMenuItem>
                    {adminDetails.role === "admin" && (
                      <DropdownMenuItem
                        onClick={() => handleDeleteClick(doctor)}
                        className="flex justify-between cursor-pointer"
                      >
                        Delete <Trash size={17} />
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="flex flex-col w-full bg-muted/40">
      <div className="flex flex-col sm:gap-4 sm:py-4">
        <header className="sticky top-0 z-30 flex items-center gap-4 px-4 border-b h-14 bg-background sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <div className="relative flex-1 mx-2 ml-auto md:grow-0">
            <Input
              type="search"
              placeholder="Search..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
            />
          </div>
        </header>
        <main className="grid items-start flex-1 gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          <div className="flex items-center">
            <div className="flex items-center gap-2 ml-auto">
              <PopupModal
                text="Add Doctor"
                icon={<Plus className="w-4 h-4 mr-2" />}
                renderModal={(onClose) => <AddDoctor modalClose={onClose} />}
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
              <div>{renderDoctorTable()}</div>
            </div>
          )}
        </main>
      </div>
      {selectedDoctor && (
        <ViewDoctor
          doctor={selectedDoctor}
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedDoctor(null);
          }}
        />
      )}
      {selectedDoctor && (
        <UpdateDoctorModal
          isOpen={isUpdateModalOpen}
          onClose={() => {
            setIsUpdateModalOpen(false);
            setSelectedDoctor(null);
          }}
          doctor={selectedDoctor}
        />
      )}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete Dr. {doctorToDelete?.name}? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
