import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { TreatmentCard } from "./TreatmentCard";
import { TreatmentPlanning } from "@/types/patient";

interface MedicalDetailsFormProps {
  medicalDetails: Array<{
    _id: string;
    checkUpDate: string;
    followUpDate: string;
    diagnosis: string;
    investigation: string;
    patientType: "Child" | "Adult";
    treatmentPlanning: TreatmentPlanning[];
  }>;
  patientId: string;
  onUpdate: () => void;
  selectedRecordId?: string | null;
}

export function MedicalDetailsForm({
  medicalDetails,
  onUpdate,
  patientId,
}: MedicalDetailsFormProps) {


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Medical Records</h3>
        {/* <Button onClick={addNewMedicalRecord}>
          <Plus className="w-4 h-4 mr-2" />
          Add New Record
        </Button> */}
      </div>

      <div className="grid gap-6">
        {medicalDetails.map((record, _index) => (
          <Card key={record._id}>
            <CardHeader>
              <CardTitle className="text-lg">
                Medical Record - {format(new Date(record.checkUpDate), 'PPP')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Check-up Date</Label>
                  <Input
                    type="date"
                    value={record.checkUpDate}
                    onChange={() => {}}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Follow-up Date</Label>
                  <Input
                    type="date"
                    value={record.followUpDate}
                    onChange={() => {}}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Diagnosis</Label>
                <Textarea
                  value={record.diagnosis}
                  onChange={() => {}}
                  placeholder="Enter diagnosis details"
                />
              </div>

              <div className="space-y-2">
                <Label>Investigation</Label>
                <Textarea
                  value={record.investigation}
                  onChange={() => {}}
                  placeholder="Enter investigation details"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Treatment Plans</Label>
                  {/* <Button
                    variant="outline"
                    onClick={() => addNewTreatment(record._id)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Treatment
                  </Button> */}
                </div>

                <div className="grid gap-4">
                  {record.treatmentPlanning.map((treatment) => (
                    <TreatmentCard
                      key={treatment._id}
                      treatment={treatment}
                      patientId={patientId}
                      medicalDetailId={record._id}
                      patientType={record.patientType}
                      onUpdate={onUpdate}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 