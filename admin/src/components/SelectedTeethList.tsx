import React, { useState, useEffect } from "react";
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
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

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
  // Create a simpler dropdown for procedure selection
  const ProcedureDropdown = ({ 
    currentProcedure, 
    onSelect 
  }: { 
    currentProcedure: string | undefined; 
    onSelect: (procedure: string) => void;
  }) => {
    // Local state for search and dropdown
    const [searchQuery, setSearchQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    
    // Get all procedures safely
    const allProcedures = procedureColors ? Object.entries(procedureColors) : [];
    
    // Filter procedures based on search query
    const filteredProcedures = allProcedures.filter(([proc]) => 
      proc.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Handle selection
    const handleSelect = (proc: string) => {
      onSelect(proc);
      setIsOpen(false);
      setSearchQuery("");
    };

    // Reset search when dropdown closes
    useEffect(() => {
      if (!isOpen) {
        setSearchQuery("");
      }
    }, [isOpen]);

    return (
      <div className="relative">
        {/* Button to open dropdown */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-8 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <span className="truncate">{currentProcedure || "Select procedure"}</span>
          <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-50 mt-1 w-full rounded-md border border-input bg-popover shadow-md">
            {/* Search input */}
            <div className="flex items-center border-b p-2">
              <Search className="mr-2 h-3.5 w-3.5 shrink-0 opacity-50" />
              <input
                type="text"
                placeholder="Search procedures..."
                className="h-7 w-full bg-transparent text-xs outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Procedure list */}
            <div className="max-h-[200px] overflow-y-auto p-1">
              {filteredProcedures.length > 0 ? (
                filteredProcedures.map(([proc, { color }]) => (
                  <div
                    key={proc}
                    className={cn(
                      "flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-xs hover:bg-accent",
                      currentProcedure === proc ? "bg-accent text-accent-foreground" : ""
                    )}
                    onClick={() => handleSelect(proc)}
                  >
                    <div className={`mr-2 h-2 w-2 rounded-full ${color}`} />
                    <span>{proc}</span>
                    {currentProcedure === proc && (
                      <Check className="ml-auto h-3 w-3" />
                    )}
                  </div>
                ))
              ) : (
                <div className="py-2 text-center text-xs text-muted-foreground">
                  No procedures found
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

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
                <ProcedureDropdown
                  currentProcedure={data.procedure}
                  onSelect={(procedure) => onProcedureChange(number, procedure)}
                />
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
