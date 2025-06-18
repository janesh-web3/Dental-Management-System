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
import { Edit, Trash, Plus, Eye, Key } from "lucide-react";
import { crudRequest } from "@/lib/api";
import AddDoctor from "./AddDoctor";
import PopupModal from "@/components/shared/popup-modal";
import Loading from "@/pages/not-found/loading";
import Error from "@/pages/not-found/error";
import ViewDoctor from "@/components/doctor/ViewDoctor";
import UpdateDoctorModal from "@/components/doctor/UpdateDoctorModal";
import ChangePasswordModal from "@/components/doctor/ChangePasswordModal";
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
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
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
    <Table className="min-w-full border-collapse">
      <TableHeader>
        <TableRow>
          <TableHead className="hidden sm:table-cell whitespace-nowrap font-semibold">Name</TableHead>
          <TableHead className="hidden md:table-cell whitespace-nowrap font-semibold">Age</TableHead>
          <TableHead className="hidden sm:table-cell whitespace-nowrap font-semibold">Phone</TableHead>
          <TableHead className="hidden lg:table-cell whitespace-nowrap font-semibold">Address</TableHead>
          <TableHead className="hidden lg:table-cell whitespace-nowrap font-semibold">Experience</TableHead>
          <TableHead className="hidden md:table-cell whitespace-nowrap font-semibold">Specialization</TableHead>
          <TableHead className="text-right whitespace-nowrap font-semibold">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {doctors.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
              No doctors available
            </TableCell>
          </TableRow>
        ) : (
          doctors.map((doctor, index) => (
            <TableRow key={index} className="hover:bg-muted/50">
              <TableCell className="sm:table-cell font-medium">
                <div className="block sm:hidden text-xs text-muted-foreground mb-1">Doctor</div>
                {doctor.name}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {doctor.age}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {doctor.contactNumber}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {doctor.address}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {doctor.experienceYears} years
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {doctor.specialization}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex sm:justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                    onClick={() => {
                      setSelectedDoctor(doctor);
                      setIsViewModalOpen(true);
                    }}
                    title="View Doctor"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 p-0 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                    onClick={() => {
                      setSelectedDoctor(doctor);
                      setIsUpdateModalOpen(true);
                    }}
                    title="Edit Doctor"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 p-0 text-violet-600 hover:bg-violet-50 hover:text-violet-700"
                    onClick={() => {
                      setSelectedDoctor(doctor);
                      setIsPasswordModalOpen(true);
                    }}
                    title="Change Password"
                  >
                    <Key className="h-4 w-4" />
                  </Button>
                  {adminDetails.role === "admin" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => handleDeleteClick(doctor)}
                      title="Delete Doctor"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  )}
                </div>
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
        <header className="sticky top-0 z-30 flex flex-col sm:flex-row items-center gap-4 px-4 py-2 border-b bg-background sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <div className="relative flex-1 w-full sm:w-auto sm:max-w-xs">
            <Input
              type="search"
              placeholder="Search doctors..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full rounded-lg bg-background pl-8"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </header>
        <main className="grid items-start flex-1 gap-4 p-2 sm:p-4 sm:px-6 sm:py-0 md:gap-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-muted-foreground hidden sm:block">Doctor Management</h2>
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
            <div className="w-full overflow-x-auto rounded-md border bg-card shadow-sm">
              <div className="p-1 sm:p-2">{renderDoctorTable()}</div>
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
      {selectedDoctor && (
        <ChangePasswordModal
          isOpen={isPasswordModalOpen}
          onClose={() => {
            setIsPasswordModalOpen(false);
            setSelectedDoctor(null);
          }}
          doctor={selectedDoctor}
        />
      )}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center sm:text-left">Confirm Deletion</DialogTitle>
            <DialogDescription className="text-center sm:text-left">
              Are you sure you want to delete Dr. {doctorToDelete?.name}? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              className="w-full sm:w-auto"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
