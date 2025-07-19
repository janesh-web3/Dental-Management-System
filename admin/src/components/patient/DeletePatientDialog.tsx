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
      toast.success("Patient moved to recycle bin successfully");
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
          <AlertDialogTitle>Move to Recycle Bin?</AlertDialogTitle>
          <AlertDialogDescription>
            This will move{" "}
            <span className="font-semibold">{patientName}</span>'s record and all
            associated data to the recycle bin. You can restore it later from the recycle bin if needed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-orange-600 text-white hover:bg-orange-700"
          >
            Move to Recycle Bin
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeletePatientDialog; 