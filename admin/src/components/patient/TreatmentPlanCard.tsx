import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import DentalChart from "../DentalChart";
import ChildDentalChart from "../ChildDentalChart";
import SelectedTeethList from "../SelectedTeethList";
import { Doctor } from "@/types/doctor";
import { MultiSelect } from "@/components/ui/multi-select";

interface TreatmentPlanCardProps {
  plan: any;
  index: number;
  doctors: Doctor[];
  patientType: "Child" | "Adult";
  selectedTeeth: any;
  onRemove: () => void;
  onChange: (field: string, value: any) => void;
  onToothSelect: (toothNumber: string) => void;
  onToothDetailsChange: (toothNumber: string, details: string) => void;
  onToothProcedureChange: (toothNumber: string, procedure: string) => void;
}

export function TreatmentPlanCard({
  plan,
  index,
  doctors,
  patientType,
  selectedTeeth,
  onRemove,
  onChange,
  onToothSelect,
  onToothDetailsChange,
  onToothProcedureChange
}: TreatmentPlanCardProps) {
  const clinicalFindingOptions = [
    { value: "Caries", label: "Caries" },
    { value: "Decayed", label: "Decayed" },
    { value: "Missing", label: "Missing" },
    { value: "Crowding", label: "Crowding" },
    { value: "Swelling", label: "Swelling" },
    { value: "Enlargement", label: "Enlargement" },
    { value: "Bleeding", label: "Bleeding" },
    { value: "Bad Breathing", label: "Bad Breathing" },
    { value: "Impaction", label: "Impaction" },
    { value: "Pericoronitis", label: "Pericoronitis" },
    { value: "Food Lodgment", label: "Food Lodgment" },
    { value: "Attrition", label: "Attrition" },
    { value: "Abrasion", label: "Abrasion" },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Treatment Plan {index + 1}</CardTitle>
        <Button variant="ghost" size="sm" onClick={onRemove}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Treatment Date</Label>
            <Input
              type="date"
              value={plan.treatmentDate}
              onChange={(e) => onChange("treatmentDate", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Follow-up Date</Label>
            <Input
              type="date"
              value={plan.followUpDate}
              onChange={(e) => onChange("followUpDate", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Doctor</Label>
            <Select
              value={plan.treatedByDoctor}
              onValueChange={(value) => onChange("treatedByDoctor", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select doctor" />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((doctor) => (
                  <SelectItem key={doctor._id} value={doctor._id}>
                    {doctor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="border rounded-lg p-4 space-y-4">
          <h4 className="font-medium">Selected Teeth</h4>
          <SelectedTeethList
            selectedTeeth={selectedTeeth}
            onDetailsChange={onToothDetailsChange}
            onProcedureChange={onToothProcedureChange}
            onDailyTreatmentAdd={() => {}}
            doctors={doctors}
          />
          {patientType === "Child" ? (
            <ChildDentalChart
              selectedTeeth={selectedTeeth}
              onToothSelect={onToothSelect}
              readOnly={false}
            />
          ) : (
            <DentalChart
              selectedTeeth={selectedTeeth}
              onToothSelect={onToothSelect}
              readOnly={false}
            />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Treatment Amount</Label>
            <Input
              type="number"
              value={plan.treatmentAmount}
              onChange={(e) => onChange("treatmentAmount", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Advanced Amount</Label>
            <Input
              type="number"
              value={plan.advancedAmount}
              onChange={(e) => onChange("advancedAmount", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Balance Amount</Label>
            <Input
              value={plan.balanceAmount}
              readOnly
              disabled
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Treatment Details</Label>
          <Textarea
            value={plan.treatmentDetails}
            onChange={(e) => onChange("treatmentDetails", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Treatment Findings</Label>
          <Textarea
            value={plan.treatmentFindings}
            onChange={(e) => onChange("treatmentFindings", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Clinical Findings</Label>
          <MultiSelect
            options={clinicalFindingOptions}
            selected={plan.clinicalFindings}
            onChange={(values: string[]) => onChange("clinicalFindings", values)}
          />
        </div>

        <div className="space-y-2">
          <Label>Other Findings</Label>
          <Textarea
            value={plan.otherFindings}
            onChange={(e) => onChange("otherFindings", e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
} 