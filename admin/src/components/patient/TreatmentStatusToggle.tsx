import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { crudRequest } from "@/lib/api";
import { toast } from "react-toastify";
import { useState } from "react";

interface TreatmentStatusToggleProps {
  patientId: string;
  medicalDetailId: string;
  treatmentId: string;
  isCompleted: boolean;
  onStatusChange: (updatedPatient: any) => void;
}

export function TreatmentStatusToggle({
  patientId,
  medicalDetailId,
  treatmentId,
  isCompleted,
  onStatusChange
}: TreatmentStatusToggleProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = async (checked: boolean) => {
    setIsUpdating(true);
    try {
      const response: { data: any } = await crudRequest(
        'PATCH',
        `/patient/treatment-status/${patientId}/${medicalDetailId}/${treatmentId}`,
        { isCompleted: checked }
      );
      onStatusChange(response.data);
      toast.success(`Treatment marked as ${checked ? 'completed' : 'incomplete'}`);
    } catch (error) {
      toast.error('Failed to update treatment status');
      console.error('Status update error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Switch
        checked={isCompleted}
        onCheckedChange={handleToggle}
        disabled={isUpdating}
      />
      <Label>Mark as Complete</Label>
    </div>
  );
} 