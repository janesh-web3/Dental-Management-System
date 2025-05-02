import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { FileText, Upload, Circle, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { TreatmentFileUpload } from "./TreatmentFileUpload";
import { TreatmentPlanning } from "@/types/patient";
import DentalChart from "@/components/DentalChart";
import ChildDentalChart from "../ChildDentalChart";
import { crudRequest } from "@/lib/api";
import { toast } from "sonner";

interface TreatmentCardProps {
  treatment: TreatmentPlanning;
  patientId: string;
  medicalDetailId: string;
  patientType: "Child" | "Adult";
  onUpdate: (updatedPatient: any) => void;
}

export function TreatmentCard({
  treatment,
  patientId,
  medicalDetailId,
  patientType,
  onUpdate,
}: TreatmentCardProps) {
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  // Convert selected teeth to format needed by DentalChart
  const selectedTeethMap = treatment.selectedTeethDetails.reduce(
    (acc, tooth) => ({
      ...acc,
      [tooth.number]: tooth,
    }),
    {}
  );

  const handleStatusChange = async () => {
    try {
      const response = (await crudRequest(
        "PATCH",
        `/patient/treatment-status/${patientId}/${medicalDetailId}/${treatment._id}`,
        {
          isCompleted: !treatment.isCompleted,
        }
      )) as { success: boolean; data: any };

      if (response.success && response.data) {
        onUpdate(response.data);
        toast.success(
          `Treatment marked as ${!treatment.isCompleted ? "completed" : "pending"}`
        );
      } else {
        throw new Error("Failed to update status");
      }
    } catch (error) {
      console.error("Error updating treatment status:", error);
      toast.error("Failed to update treatment status");
    }
  };

  const formatSafeDate = (dateString: string | undefined | null) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      return format(date, "PP");
    } catch {
      return "";
    }
  };

  return (
    <Card
      className={treatment.isCompleted ? "bg-primary/30" : "bg-destructive/30"}
    >
      <CardContent className="p-6 space-y-2 gap-10">
        {/* Treatment Header */}
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h4 className="font-semibold text-lg">Treatment Details</h4>
            <p className="text-sm text-muted-foreground">
              {format(new Date(treatment.treatmentDate), "PPP")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className={`${
                treatment.isCompleted
                  ? "bg-green-100 text-green-800 hover:bg-green-200"
                  : "bg-orange-100 text-orange-800 hover:bg-orange-200"
              }`}
              onClick={handleStatusChange}
            >
              {treatment.isCompleted ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <Circle className="h-5 w-5" />
              )}
              <span className="ml-2">
                {treatment.isCompleted ? "Completed" : "Mark as Complete"}
              </span>
            </Button>
            {treatment.completionDate && (
              <span className="text-sm text-muted-foreground">
                Completed: {formatSafeDate(treatment.completionDate)}
              </span>
            )}
          </div>
        </div>

        {/* Treatment Information */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Amount</p>
            <p className="font-medium">₹{treatment.treatmentAmount}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Advanced</p>
            <p className="font-medium">₹{treatment.advancedAmount}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Balance</p>
            <p className="font-medium">₹{treatment.balanceAmount}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <div className="flex items-center gap-2">
              {treatment.isCompleted ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-green-500">Completed</span>
                </>
              ) : (
                <>
                  <Circle className="w-4 h-4 text-orange-500" />
                  <span className="text-orange-500">Pending</span>
                </>
              )}
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Treated By</p>
            <p className="font-medium">{treatment.treatedByDoctor.name}</p>
          </div>
        </div>

        {/* Selected Teeth Details */}
        <div className="space-y-4">
          <h5 className="font-medium">Selected Teeth</h5>
          <div className="border rounded-lg p-4">
            <div>
              {patientType === "Child" ? (
                <>
                  <ChildDentalChart
                    selectedTeeth={selectedTeethMap}
                    onToothSelect={() => {}}
                    readOnly={true}
                  />
                </>
              ) : (
                <>
                  <DentalChart
                    selectedTeeth={selectedTeethMap}
                    onToothSelect={() => {}}
                    readOnly={true}
                  />
                </>
              )}
            </div>

            {/* Selected Teeth List */}
            <div className="space-y-2 flex flex-wrap gap-10">
              {treatment.selectedTeethDetails.map((tooth) => (
                <div
                  key={tooth.number}
                  className="flex items-center gap-4 p-2 bg-muted rounded-lg h-10"
                >
                  <span className="font-medium">Tooth {tooth.number}</span>
                  <span className="text-sm text-muted-foreground">
                    {tooth.details}
                  </span>
                  {tooth.procedure && (
                    <span className="text-sm bg-primary/10 px-2 py-1 rounded">
                      {tooth.procedure}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Treatment Details and Findings */}
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">
              Treatment Details
            </p>
            <p className="p-3 bg-muted rounded-lg">
              {treatment.treatmentDetails}
            </p>
          </div>
          {treatment.treatmentFindings && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Findings</p>
              <p className="p-3 bg-muted rounded-lg">
                {treatment.treatmentFindings}
              </p>
            </div>
          )}
        </div>

        {/* Documents Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h5 className="font-medium">Documents</h5>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUploadDialog(true)}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Files
            </Button>
          </div>

          {treatment.treatmentDocuments.length > 0 && (
            <div className="grid gap-2">
              {treatment.treatmentDocuments.map((doc, index) => (
                <a
                  key={index}
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 text-sm border rounded hover:bg-muted"
                >
                  <FileText className="w-4 h-4" />
                  <span className="flex-1">{doc.description}</span>
                  <span className="text-muted-foreground">
                    {format(new Date(doc.uploadDate), "PP")}
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>
      </CardContent>

      {/* File Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <TreatmentFileUpload
            patientId={patientId}
            medicalDetailId={medicalDetailId}
            treatmentId={treatment._id}
            onClose={() => setShowUploadDialog(false)}
            onSuccess={onUpdate}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
}
