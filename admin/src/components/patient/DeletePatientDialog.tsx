import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { crudRequest } from "@/lib/api";
import { toast } from "react-toastify";

interface DeletePatientDialogProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  onDeleteSuccess: () => void;
}

const DeletePatientDialog = ({
  isOpen,
  onClose,
  patientId,
  patientName,
  onDeleteSuccess,
}: DeletePatientDialogProps) => {
  const handleDelete = async () => {
    try {
      await crudRequest("DELETE", `/patient/delete-patient/${patientId}`);
      toast.success("Patient deleted successfully");
      onDeleteSuccess();
      onClose();
      window.location.reload();
    } catch (error) {
      toast.error("Failed to delete patient");
      console.error("Error deleting patient:", error);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete{" "}
            <span className="font-semibold">{patientName}</span>'s record and all
            associated data from the database.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeletePatientDialog; 