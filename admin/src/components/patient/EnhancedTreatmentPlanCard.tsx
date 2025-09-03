import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TreatmentFileUpload } from "./TreatmentFileUpload";
import { DailyTreatmentManager } from "./DailyTreatmentManager";
import { FileText, Upload, Trash2 } from "lucide-react";
import { ToothData, DailyTreatment, TreatmentPlan } from "@/types/patient";
import DentalChart from "../DentalChart";
import ChildDentalChart from "../ChildDentalChart";

export type Doctor = {
  _id: string;
  name: string;
  specialization: string;
};

interface EnhancedTreatmentPlanCardProps {
  treatmentIndex: number;
  plan: TreatmentPlan;
  selectedTeethMap: Record<string, ToothData>;
  patientId: string;
  medicalDetailId: string;
  patientType: "Adult" | "Child";
  doctors: Doctor[];
  onRemove: () => void;
  onTreatmentChange: (field: string, value: any) => void;
  onToothSelect: (toothNumber: string) => void;
  onToothDetailsChange: (toothNumber: string, details: string) => void;
  onToothProcedureChange: (toothNumber: string, procedure: string) => void;
  onDailyTreatmentAdd: (toothNumber: string, treatment: DailyTreatment) => void;
}

export function EnhancedTreatmentPlanCard({
  treatmentIndex,
  plan,
  selectedTeethMap,
  patientId,
  medicalDetailId,
  patientType,
  doctors,
  onRemove,
  onTreatmentChange,
  onToothSelect,
  onDailyTreatmentAdd,
}: EnhancedTreatmentPlanCardProps) {
  const [activeTab, setActiveTab] = useState("details");
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [showTeethDetails, setShowTeethDetails] = useState(true);

  // Get selected teeth count
  const selectedTeethCount = Object.keys(selectedTeethMap).length;

  return (
    <Card className="mb-3 overflow-hidden" id={`treatment-0-${treatmentIndex}`}>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-1.5 space-y-1.5 sm:space-y-0 px-2 sm:px-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 flex-wrap">
            <CardTitle className="text-sm sm:text-base text-primary">
              X-Ray Plan {treatmentIndex + 1} Details
            </CardTitle>
            {plan.isCompleted && (
              <Badge variant="default" className="bg-green-600 text-xs px-1.5 py-0.5">
                Completed
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Date: {format(new Date(plan.treatmentDate), "dd MMM yyyy")}
          </p>
        </div>

        <div className="flex gap-1.5 self-end sm:self-auto">
          <Button variant="ghost" size="sm" onClick={onRemove} className="h-7 w-7 p-0">
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 px-2 sm:px-4">
        <Tabs
          defaultValue="details"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="details" className="text-xs py-1.5 px-1 sm:px-2">
              Details
            </TabsTrigger>
            <TabsTrigger value="teeth" className="text-xs py-1.5 px-1 sm:px-2">
              Teeth ({selectedTeethCount})
            </TabsTrigger>
            <TabsTrigger value="documents" className="text-xs py-1.5 px-1 sm:px-2">
              Docs{" "}
              {plan.treatmentDocuments &&
                plan.treatmentDocuments.length > 0 &&
                `(${plan.treatmentDocuments.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-3 pt-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Treatment Date</Label>
                <Input
                  type="date"
                  value={plan.treatmentDate}
                  onChange={(e) =>
                    onTreatmentChange("treatmentDate", e.target.value)
                  }
                  className="text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Clinical Findings</Label>
                <Select
                  value={plan.clinicalFindings[0] || ""}
                  onValueChange={(value) =>
                    onTreatmentChange(
                      "clinicalFindings",
                      plan.clinicalFindings.includes(value)
                        ? plan.clinicalFindings.filter((v) => v !== value)
                        : [...plan.clinicalFindings, value]
                    )
                  }
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Select findings" />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    {[
                      "Caries",
                      "Decayed",
                      "Missing",
                      "Crowding",
                      "Swelling",
                      "Enlargement",
                      "Bleeding",
                      "Bad Breathing",
                      "Impaction",
                      "Pericoronitis",
                      "Food Lodgment",
                      "Attrition",
                      "Abrasion",
                    ].map((finding) => (
                      <SelectItem key={finding} value={finding}>
                        {finding}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">
                  Treatment Procedure
                </Label>
                <Textarea
                  value={plan.treatmentFindings}
                  onChange={(e) =>
                    onTreatmentChange("treatmentFindings", e.target.value)
                  }
                  className="min-h-[60px] sm:min-h-[80px] text-xs resize-y"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Other Findings</Label>
                <Textarea
                  value={plan.otherFindings}
                  onChange={(e) =>
                    onTreatmentChange("otherFindings", e.target.value)
                  }
                  className="min-h-[60px] sm:min-h-[80px] text-xs resize-y"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Follow-up Date</Label>
                <Input
                  type="date"
                  value={plan.followUpDate}
                  onChange={(e) =>
                    onTreatmentChange("followUpDate", e.target.value)
                  }
                  className="text-sm"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="teeth" className="space-y-3 pt-3">
            <div className="border rounded-lg p-1.5 sm:p-3 overflow-x-auto">
              <div className="w-[280px] mx-auto">
                {patientType === "Child" ? (
                  <ChildDentalChart
                    selectedTeeth={selectedTeethMap}
                    onToothSelect={onToothSelect}
                    readOnly={false}
                  />
                ) : (
                  <DentalChart
                    selectedTeeth={selectedTeethMap}
                    onToothSelect={onToothSelect}
                    readOnly={false}
                  />
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-1.5 sm:space-y-0">
              <h3 className="text-xs sm:text-sm font-normal">Selected Teeth ({selectedTeethCount})</h3>
              <Button
                variant={showTeethDetails ? "destructive" : "default"}
                size="sm"
                onClick={() => setShowTeethDetails(!showTeethDetails)}
                className="text-xs h-7 px-2"
              >
                {showTeethDetails ? "Hide Details" : "Show Details"}
              </Button>
            </div>

            <Collapsible open={showTeethDetails}>
              <CollapsibleContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(selectedTeethMap).map(([number, toothData]) => {
                  // Update tooth data with required IDs
                  const updatedToothData = {
                    ...toothData,
                    treatmentId: plan._id, // Add the treatment ID
                    _id: toothData._id || toothData.number, // Use existing _id or fall back to number
                  };

                  return (
                    <DailyTreatmentManager
                      key={number}
                      toothNumber={number}
                      toothData={updatedToothData} // Pass the updated tooth data
                      doctors={doctors}
                      onAddTreatment={onDailyTreatmentAdd}
                      patientId={patientId}
                      medicalDetailId={medicalDetailId}
                    />
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          </TabsContent>

          <TabsContent value="documents" className="space-y-3 pt-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5">
              <h3 className="text-sm font-medium">Treatment Documents</h3>
              <Button onClick={() => setShowDocumentUpload(true)} size="sm" className="whitespace-nowrap h-7 px-2 text-xs">
                <Upload className="h-3 w-3 mr-1" /> Upload Files
              </Button>
            </div>

            {(!plan.treatmentDocuments ||
              plan.treatmentDocuments.length === 0) && (
              <div className="text-center py-4 sm:py-6 border border-dashed rounded-lg">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 mx-auto text-muted-foreground" />
                <p className="mt-1.5 text-muted-foreground text-xs">No documents yet</p>
                <Button
                  variant="outline"
                  className="mt-3 text-xs h-7 px-2"
                  onClick={() => setShowDocumentUpload(true)}
                >
                  <Upload className="h-3 w-3 mr-1" /> Upload Files
                </Button>
              </div>
            )}

            {plan.treatmentDocuments && plan.treatmentDocuments.length > 0 && (
              <div className="grid gap-1.5">
                {plan.treatmentDocuments.map((doc, idx) => (
                  <a
                    key={idx}
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 p-2 border rounded hover:bg-accent/20"
                  >
                    <FileText className="h-4 w-4 text-blue-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">
                        {doc.fileName}
                      </p>
                      {doc.description && (
                        <p className="text-xs text-muted-foreground truncate">
                          {doc.description}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(doc.uploadDate), "dd MMM yyyy")}
                    </p>
                  </a>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Document Upload Dialog */}
      <Dialog open={showDocumentUpload} onOpenChange={setShowDocumentUpload}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <TreatmentFileUpload
            patientId={patientId}
            medicalDetailId={medicalDetailId}
            treatmentId={plan._id || ""}
            onClose={() => setShowDocumentUpload(false)}
            onSuccess={() => setShowDocumentUpload(false)}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
}
