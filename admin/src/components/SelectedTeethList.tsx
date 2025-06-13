import React from "react";
import { Card } from "./ui/card";
import { format } from "date-fns";
import { procedureColors } from "./DentalChart";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./ui/select";
import { ToothData, DailyTreatment } from "@/types/patient";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Doctor } from "@/types/doctor";
import { toast } from "react-toastify";
import { Textarea } from "./ui/textarea";

interface SelectedTeethListProps {
  selectedTeeth: { [key: string]: ToothData };
  onDetailsChange: (toothNumber: string, details: string) => void;
  onProcedureChange: (toothNumber: string, procedure: string) => void;
  onDailyTreatmentAdd: (toothNumber: string, treatment: DailyTreatment) => void;
  doctors: Doctor[];
}

const SelectedTeethList: React.FC<SelectedTeethListProps> = ({
  selectedTeeth,
  onProcedureChange,
  onDailyTreatmentAdd,
  doctors,
}) => {
  return (
    <div className="space-y-1">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {Object.entries(selectedTeeth).map(([number, data]) => (
          <Card key={number} className="p-2">
            <div className="flex flex-col gap-2">
              {/* Header */}
              <div className="flex justify-between items-center">
                <span className="font-semibold text-sm text-primary">
                  Tooth {number}
                </span>
                <span className="text-xs text-muted-foreground">
                  {data.procedure || "No procedure"}
                </span>
              </div>

              {/* Procedure and Doctor Selection */}
              <div className="grid grid-cols-2 gap-1">
                <Select
                  value={data.procedure}
                  onValueChange={(value) => onProcedureChange(number, value)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select procedure" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(procedureColors).map(
                      ([proc, { color }]) => (
                        <SelectItem key={proc} value={proc} className="text-xs">
                          <div className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${color}`} />
                            <span>{proc}</span>
                          </div>
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
                <Select
                  value={
                    data.dailyTreatments?.[data.dailyTreatments?.length - 1]
                      ?.treatedByDoctor || ""
                  }
                  onValueChange={(doctorId) => {
                    // Get the last treatment or create a new one
                    const lastTreatment =
                      data.dailyTreatments?.[data.dailyTreatments.length - 1];
                    const treatment = {
                      date:
                        lastTreatment?.date || format(new Date(), "yyyy-MM-dd"),
                      treatmentAmount: lastTreatment?.treatmentAmount || 0,
                      paidAmount: lastTreatment?.paidAmount || 0,
                      remainingAmount: lastTreatment?.remainingAmount || 0,
                      treatedByDoctor: doctorId, // Keep the doctor ID as is
                      notes: lastTreatment?.notes || "",
                    };
                    onDailyTreatmentAdd(number, treatment);
                  }}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="Doctor">
                      {doctors.find(
                        (d) =>
                          d._id ===
                          data.dailyTreatments?.[
                            data.dailyTreatments?.length - 1
                          ]?.treatedByDoctor
                      )?.name || "Select Doctor"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((doctor) => (
                      <SelectItem
                        key={doctor._id}
                        value={doctor._id}
                        className="text-xs"
                      >
                        {doctor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Daily Treatment Section */}
              <div className="border-t pt-1">
                <Label className="text-xs mb-1">Daily Treatment</Label>
                <Input
                  type="date"
                  className="h-7 text-xs mb-2"
                  defaultValue={format(new Date(), "yyyy-MM-dd")}
                  onChange={(e) => {
                    // Get the last treatment or create a new one
                    const lastTreatment =
                      data.dailyTreatments?.[data.dailyTreatments.length - 1];
                    onDailyTreatmentAdd(number, {
                      date: e.target.value,
                      treatmentAmount: lastTreatment?.treatmentAmount || 0,
                      paidAmount: lastTreatment?.paidAmount || 0,
                      remainingAmount: lastTreatment?.remainingAmount || 0,
                      treatedByDoctor: lastTreatment?.treatedByDoctor || "", // Keep existing doctor if any
                      notes: lastTreatment?.notes || "",
                    });
                  }}
                />
                <div className="grid grid-cols-2 gap-1">
                  <Input
                    type="number"
                    placeholder="Amount"
                    className="h-7 text-xs"
                    onChange={(e) => {
                      const treatmentAmount = Number(e.target.value);
                      // Get the last treatment or create a new one
                      const lastTreatment =
                        data.dailyTreatments?.[data.dailyTreatments.length - 1];
                      onDailyTreatmentAdd(number, {
                        date:
                          lastTreatment?.date ||
                          format(new Date(), "yyyy-MM-dd"),
                        treatmentAmount,
                        paidAmount: lastTreatment?.paidAmount || 0,
                        remainingAmount:
                          treatmentAmount - (lastTreatment?.paidAmount || 0),
                        treatedByDoctor: lastTreatment?.treatedByDoctor || "", // Keep existing doctor
                        notes: lastTreatment?.notes || "",
                      });
                    }}
                  />
                  <Input
                    type="number"
                    placeholder="Paid"
                    className="h-7 text-xs"
                    onChange={(e) => {
                      let paidAmount = Number(e.target.value);
                      // Get the last treatment or create a new one
                      const lastTreatment =
                        data.dailyTreatments?.[data.dailyTreatments.length - 1];
                      const treatmentAmount =
                        lastTreatment?.treatmentAmount ||
                        data.totalTreatmentAmount ||
                        0;

                      // Validate that paid amount doesn't exceed treatment amount
                      if (paidAmount > treatmentAmount) {
                        paidAmount = treatmentAmount;
                        toast.warning(
                          "Paid amount cannot exceed treatment amount"
                        );
                      }

                      onDailyTreatmentAdd(number, {
                        date:
                          lastTreatment?.date ||
                          format(new Date(), "yyyy-MM-dd"),
                        treatmentAmount,
                        paidAmount,
                        remainingAmount: treatmentAmount - paidAmount,
                        treatedByDoctor: lastTreatment?.treatedByDoctor || "", // Keep existing doctor
                        notes: lastTreatment?.notes || "",
                      });
                    }}
                  />
                </div>
              </div>

              {/* Notes */}
              <Textarea
                placeholder="Notes"
                className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs resize-y"
                onChange={(e) => {
                  const lastTreatment =
                    data.dailyTreatments?.[data.dailyTreatments.length - 1];
                  onDailyTreatmentAdd(number, {
                    date:
                      lastTreatment?.date || format(new Date(), "yyyy-MM-dd"),
                    treatmentAmount: lastTreatment?.treatmentAmount || 0,
                    paidAmount: lastTreatment?.paidAmount || 0,
                    remainingAmount: lastTreatment?.remainingAmount || 0,
                    treatedByDoctor: lastTreatment?.treatedByDoctor || "",
                    notes: e.target.value,
                  });
                }}
              />

              {/* Treatment History */}
              {data.dailyTreatments && data.dailyTreatments.length > 0 && (
                <div className="mt-1">
                  <div className="mt-1 text-xs font-medium flex justify-between">
                    <span>Total:</span>
                    <div className="flex gap-2">
                      <span>₹{data.totalTreatmentAmount || 0}</span>
                      <span className="text-green-600">
                        ₹{data.totalPaidAmount || 0}
                      </span>
                      <span className="text-red-600">
                        ₹{data.totalRemainingAmount || 0}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SelectedTeethList;
