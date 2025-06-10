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
    <Card className="mb-4 overflow-hidden" id={`treatment-0-${treatmentIndex}`}>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-2 space-y-2 sm:space-y-0 px-3 sm:px-6">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 flex-wrap">
            <CardTitle className="text-base sm:text-lg text-primary">
              X-Ray Plan {treatmentIndex + 1} Details
            </CardTitle>
            {plan.isCompleted && (
              <Badge variant="default" className="bg-green-600">
                Completed
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Date: {format(new Date(plan.treatmentDate), "dd MMM yyyy")}
          </p>
        </div>

        <div className="flex gap-2 self-end sm:self-auto">
          <Button variant="ghost" size="sm" onClick={onRemove}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-3 sm:px-6">
        <Tabs
          defaultValue="details"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="details" className="text-xs sm:text-sm py-2 px-1 sm:px-3">
              Details
            </TabsTrigger>
            <TabsTrigger value="teeth" className="text-xs sm:text-sm py-2 px-1 sm:px-3">
              Teeth ({selectedTeethCount})
            </TabsTrigger>
            <TabsTrigger value="documents" className="text-xs sm:text-sm py-2 px-1 sm:px-3">
              Docs{" "}
              {plan.treatmentDocuments &&
                plan.treatmentDocuments.length > 0 &&
                `(${plan.treatmentDocuments.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">Treatment Date</Label>
                <Input
                  type="date"
                  value={plan.treatmentDate}
                  onChange={(e) =>
                    onTreatmentChange("treatmentDate", e.target.value)
                  }  
                  className="text-sm"  
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">Clinical Findings</Label>
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
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Select findings" />
                  </SelectTrigger>
                  <SelectContent className="text-sm">
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

              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">
                  Treatment Procedure
                </Label>
                <Textarea
                  value={plan.treatmentFindings}
                  onChange={(e) =>
                    onTreatmentChange("treatmentFindings", e.target.value)
                  }
                  className="min-h-[80px] sm:min-h-[100px] text-sm resize-y"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">Other Findings</Label>
                <Textarea
                  value={plan.otherFindings}
                  onChange={(e) =>
                    onTreatmentChange("otherFindings", e.target.value)
                  }
                  className="min-h-[80px] sm:min-h-[100px] text-sm resize-y"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">Follow-up Date</Label>
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

          <TabsContent value="teeth" className="space-y-4 pt-4">
            <div className="border rounded-lg p-2 sm:p-4 overflow-x-auto">
              <div className="min-width-full w-full max-w-[800px] mx-auto">
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

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
              <h3 className="text-sm sm:text-lg font-normal">Selected Teeth ({selectedTeethCount})</h3>
              <Button
                variant={showTeethDetails ? "destructive" : "default"}
                size="sm"
                onClick={() => setShowTeethDetails(!showTeethDetails)}
                className="text-xs sm:text-sm"
              >
                {showTeethDetails ? "Hide Details" : "Show Details"}
              </Button>
            </div>

            <Collapsible open={showTeethDetails}>
              <CollapsibleContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <TabsContent value="documents" className="space-y-4 pt-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <h3 className="text-base sm:text-lg font-medium">Treatment Documents</h3>
              <Button onClick={() => setShowDocumentUpload(true)} size="sm" className="whitespace-nowrap">
                <Upload className="h-4 w-4 mr-2" /> Upload Files
              </Button>
            </div>

            {(!plan.treatmentDocuments ||
              plan.treatmentDocuments.length === 0) && (
              <div className="text-center py-6 sm:py-8 border border-dashed rounded-lg">
                <FileText className="h-6 w-6 sm:h-8 sm:w-8 mx-auto text-muted-foreground" />
                <p className="mt-2 text-muted-foreground text-sm">No documents yet</p>
                <Button
                  variant="outline"
                  className="mt-4 text-xs sm:text-sm"
                  onClick={() => setShowDocumentUpload(true)}
                >
                  <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" /> Upload Files
                </Button>
              </div>
            )}

            {plan.treatmentDocuments && plan.treatmentDocuments.length > 0 && (
              <div className="grid gap-2">
                {plan.treatmentDocuments.map((doc, idx) => (
                  <a
                    key={idx}
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 border rounded hover:bg-accent/20"
                  >
                    <FileText className="h-5 w-5 text-blue-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
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
