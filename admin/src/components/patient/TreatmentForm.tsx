import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { crudRequest } from "@/lib/api";
import { toast } from "react-toastify";

interface TreatmentFormProps {
  patientId: string;
  medicalDetailId: string;
  treatment?: {
    _id: string;
    treatmentName: string;
    treatmentDate: string;
    treatmentDetails: string;
    treatmentAmount: number;
    treatmentFindings: string;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

export function TreatmentForm({
  patientId,
  medicalDetailId,
  treatment,
  onSuccess,
  onCancel
}: TreatmentFormProps) {
  const [formData, setFormData] = useState({
    treatmentName: treatment?.treatmentName || "",
    treatmentDate: treatment?.treatmentDate || new Date().toISOString().split('T')[0],
    treatmentDetails: treatment?.treatmentDetails || "",
    treatmentAmount: treatment?.treatmentAmount || 0,
    treatmentFindings: treatment?.treatmentFindings || ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (treatment?._id) {
        await crudRequest(
          'PUT',
          `/patient/treatment/${patientId}/${medicalDetailId}/${treatment._id}`,
          formData
        );
      } else {
        await crudRequest(
          'POST',
          `/patient/treatment/${patientId}/${medicalDetailId}`,
          formData
        );
      }

      toast.success(`Treatment ${treatment ? 'updated' : 'added'} successfully`);
      onSuccess();
    } catch (error) {
      toast.error(`Failed to ${treatment ? 'update' : 'add'} treatment`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Treatment Name</Label>
        <Input
          value={formData.treatmentName}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            treatmentName: e.target.value
          }))}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Treatment Date</Label>
        <Input
          type="date"
          value={formData.treatmentDate}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            treatmentDate: e.target.value
          }))}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Details</Label>
        <Textarea
          value={formData.treatmentDetails}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            treatmentDetails: e.target.value
          }))}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Amount</Label>
        <Input
          type="number"
          value={formData.treatmentAmount}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            treatmentAmount: Number(e.target.value)
          }))}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Findings</Label>
        <Textarea
          value={formData.treatmentFindings}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            treatmentFindings: e.target.value
          }))}
        />
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : treatment ? 'Update Treatment' : 'Add Treatment'}
        </Button>
      </div>
    </form>
  );
} 