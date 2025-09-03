import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  DollarSign, 
  Trash2,
  Edit,
  Check,
  X
} from "lucide-react";

interface GroupTreatmentDetails {
  _id?: string;
  groupName: "Ortho" | "Endo" | "Perio" | "Prostho" | "Surgery" | "General" | "Other";
  procedure: string;
  totalTreatmentAmount: number;
  totalPaidAmount: number;
  totalRemainingAmount: number;
  startDate?: string;
  followUpDate?: string;
  followUpDateNp?: string;
  completionDate?: string;
  completionDateNp?: string;
  treatedByDoctor: string | null;
  isCompleted: boolean;
  dailyTreatments: Array<{
    _id?: string;
    date: string;
    treatmentAmount: number;
    paidAmount: number;
    remainingAmount: number;
    paymentDate?: string; // Add payment date field
    treatedByDoctor: string | null;
    notes: string;
    procedure: string;
    isCompleted: boolean;
  }>;
}

interface DailyTreatment {
  _id?: string;
  date: string;
  treatmentAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentDate?: string; // Add payment date field
  treatedByDoctor: string | null;
  notes: string;
  procedure: string;
  isCompleted: boolean;
}

interface Doctor {
  _id: string;
  name: string;
  specialization: string;
}

interface GroupTreatmentManagerProps {
  groupTreatments: GroupTreatmentDetails[];
  doctors: Doctor[];
  onAddGroupTreatment: (groupTreatment: GroupTreatmentDetails) => void;
  onUpdateGroupTreatment: (index: number, groupTreatment: GroupTreatmentDetails) => void;
  onRemoveGroupTreatment: (index: number) => void;
}

export function GroupTreatmentManager({
  groupTreatments,
  doctors,
  onAddGroupTreatment,
  onUpdateGroupTreatment,
  onRemoveGroupTreatment,
}: GroupTreatmentManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newGroupTreatment, setNewGroupTreatment] = useState<GroupTreatmentDetails>({
    groupName: "General",
    procedure: "",
    totalTreatmentAmount: 0,
    totalPaidAmount: 0,
    totalRemainingAmount: 0,
    startDate: format(new Date(), "yyyy-MM-dd"),
    followUpDate: "",
    followUpDateNp: "",
    treatedByDoctor: null,
    isCompleted: false,
    dailyTreatments: [],
  });

  const handleAddGroupTreatment = () => {
    const groupTreatment = {
      ...newGroupTreatment,
      totalRemainingAmount: newGroupTreatment.totalTreatmentAmount - newGroupTreatment.totalPaidAmount,
    };
    onAddGroupTreatment(groupTreatment);
    setNewGroupTreatment({
      groupName: "General",
      procedure: "",
      totalTreatmentAmount: 0,
      totalPaidAmount: 0,
      totalRemainingAmount: 0,
      startDate: format(new Date(), "yyyy-MM-dd"),
      followUpDate: "",
      followUpDateNp: "",
      treatedByDoctor: null,
      isCompleted: false,
      dailyTreatments: [],
    });
    setShowAddForm(false);
  };

  const addDailyTreatment = (groupIndex: number) => {
    const newDailyTreatment: DailyTreatment = {
      date: format(new Date(), "yyyy-MM-dd"),
      treatmentAmount: 0,
      paidAmount: 0,
      remainingAmount: 0,
      paymentDate: format(new Date(), "yyyy-MM-dd"), // Default to today's date
      treatedByDoctor: null,
      notes: "",
      procedure: "",
      isCompleted: false,
    };

    const updatedGroupTreatment = { ...groupTreatments[groupIndex] };
    updatedGroupTreatment.dailyTreatments = [
      ...updatedGroupTreatment.dailyTreatments,
      newDailyTreatment,
    ];

    onUpdateGroupTreatment(groupIndex, updatedGroupTreatment);
  };

  const updateDailyTreatment = (
    groupIndex: number,
    treatmentIndex: number,
    field: keyof DailyTreatment,
    value: any
  ) => {
    const updatedGroupTreatment = { ...groupTreatments[groupIndex] };
    updatedGroupTreatment.dailyTreatments = [...updatedGroupTreatment.dailyTreatments];
    updatedGroupTreatment.dailyTreatments[treatmentIndex] = {
      ...updatedGroupTreatment.dailyTreatments[treatmentIndex],
      [field]: value,
    };

    // Auto-calculate remaining amount
    if (field === "treatmentAmount" || field === "paidAmount") {
      const treatment = updatedGroupTreatment.dailyTreatments[treatmentIndex];
      treatment.remainingAmount = (treatment.treatmentAmount || 0) - (treatment.paidAmount || 0);
    }

    onUpdateGroupTreatment(groupIndex, updatedGroupTreatment);
  };

  const removeDailyTreatment = (groupIndex: number, treatmentIndex: number) => {
    const updatedGroupTreatment = { ...groupTreatments[groupIndex] };
    updatedGroupTreatment.dailyTreatments = updatedGroupTreatment.dailyTreatments.filter(
      (_, index) => index !== treatmentIndex
    );
    onUpdateGroupTreatment(groupIndex, updatedGroupTreatment);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Group Treatment Details</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddForm(true)}
          className="gap-1.5 h-7 px-2 text-xs"
        >
          <Plus className="h-3 w-3" />
          Add Group Treatment
        </Button>
      </div>

      {/* Add Group Treatment Form */}
      {showAddForm && (
        <Card className="border-dashed border-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Add New Group Treatment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Group Name</Label>
                <Select
                  value={newGroupTreatment.groupName}
                  onValueChange={(value: any) =>
                    setNewGroupTreatment((prev) => ({ ...prev, groupName: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Ortho">Orthodontics</SelectItem>
                    <SelectItem value="Endo">Endodontics</SelectItem>
                    <SelectItem value="Perio">Periodontics</SelectItem>
                    <SelectItem value="Prostho">Prosthodontics</SelectItem>
                    <SelectItem value="Surgery">Oral Surgery</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Procedure</Label>
                <Input
                  value={newGroupTreatment.procedure}
                  onChange={(e) =>
                    setNewGroupTreatment((prev) => ({ ...prev, procedure: e.target.value }))
                  }
                  placeholder="Enter procedure name"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Total Treatment Amount</Label>
                <Input
                  type="number"
                  value={newGroupTreatment.totalTreatmentAmount}
                  onChange={(e) =>
                    setNewGroupTreatment((prev) => ({
                      ...prev,
                      totalTreatmentAmount: Number(e.target.value) || 0,
                    }))
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Total Paid Amount</Label>
                <Input
                  type="number"
                  value={newGroupTreatment.totalPaidAmount}
                  onChange={(e) =>
                    setNewGroupTreatment((prev) => ({
                      ...prev,
                      totalPaidAmount: Number(e.target.value) || 0,
                    }))
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Start Date</Label>
                <Input
                  type="date"
                  value={newGroupTreatment.startDate}
                  onChange={(e) =>
                    setNewGroupTreatment((prev) => ({ ...prev, startDate: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Follow-up Date</Label>
                <Input
                  type="date"
                  value={newGroupTreatment.followUpDate}
                  onChange={(e) =>
                    setNewGroupTreatment((prev) => ({ ...prev, followUpDate: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Treated By Doctor</Label>
                <Select
                  value={newGroupTreatment.treatedByDoctor || ""}
                  onValueChange={(value) =>
                    setNewGroupTreatment((prev) => ({ ...prev, treatedByDoctor: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor._id} value={doctor._id}>
                        {doctor.name} - {doctor.specialization}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddGroupTreatment} className="gap-1.5 h-7 px-3 text-xs">
                <Check className="h-3 w-3" />
                Add Group Treatment
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAddForm(false)}
                className="gap-1.5 h-7 px-3 text-xs"
              >
                <X className="h-3 w-3" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Group Treatments */}
      {groupTreatments.map((groupTreatment, groupIndex) => (
        <Card key={groupIndex} className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm">
                  {groupTreatment.groupName} Treatment
                </CardTitle>
                {groupTreatment.isCompleted && (
                  <Badge variant="default" className="bg-green-600 text-xs px-1.5 py-0.5">
                    Completed
                  </Badge>
                )}
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setEditingIndex(editingIndex === groupIndex ? null : groupIndex)
                  }
                  className="h-7 w-7 p-0"
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveGroupTreatment(groupIndex)}
                  className="h-7 w-7 p-0"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              Procedure: {groupTreatment.procedure || "Not specified"}
            </div>

            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                Total: ${groupTreatment.totalTreatmentAmount}
              </span>
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                Paid: ${groupTreatment.totalPaidAmount}
              </span>
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                Remaining: ${groupTreatment.totalRemainingAmount}
              </span>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {/* Group Treatment Edit Form */}
            {editingIndex === groupIndex && (
              <div className="p-3 bg-muted/50 rounded-lg space-y-3">
                <h4 className="font-medium text-xs">Edit Group Treatment Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Procedure</Label>
                    <Input
                      value={groupTreatment.procedure}
                      onChange={(e) => {
                        const updated = { ...groupTreatment, procedure: e.target.value };
                        onUpdateGroupTreatment(groupIndex, updated);
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Total Treatment Amount</Label>
                    <Input
                      type="number"
                      value={groupTreatment.totalTreatmentAmount}
                      onChange={(e) => {
                        const amount = Number(e.target.value) || 0;
                        const updated = {
                          ...groupTreatment,
                          totalTreatmentAmount: amount,
                          totalRemainingAmount: amount - groupTreatment.totalPaidAmount,
                        };
                        onUpdateGroupTreatment(groupIndex, updated);
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Total Paid Amount</Label>
                    <Input
                      type="number"
                      value={groupTreatment.totalPaidAmount}
                      onChange={(e) => {
                        const paid = Number(e.target.value) || 0;
                        const updated = {
                          ...groupTreatment,
                          totalPaidAmount: paid,
                          totalRemainingAmount: groupTreatment.totalTreatmentAmount - paid,
                        };
                        onUpdateGroupTreatment(groupIndex, updated);
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Treated By Doctor</Label>
                    <Select
                      value={groupTreatment.treatedByDoctor || ""}
                      onValueChange={(value) => {
                        const updated = { ...groupTreatment, treatedByDoctor: value };
                        onUpdateGroupTreatment(groupIndex, updated);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select doctor" />
                      </SelectTrigger>
                      <SelectContent>
                        {doctors.map((doctor) => (
                          <SelectItem key={doctor._id} value={doctor._id}>
                            {doctor.name} - {doctor.specialization}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Daily Treatments Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-xs">Daily Treatments</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addDailyTreatment(groupIndex)}
                  className="gap-1.5 h-6 px-2 text-xs"
                >
                  <Plus className="h-3 w-3" />
                  Add Daily Treatment
                </Button>
              </div>

              {groupTreatment.dailyTreatments.length === 0 ? (
                <div className="text-center py-3 text-muted-foreground text-xs">
                  No daily treatments recorded
                </div>
              ) : (
                <div className="space-y-2">
                  {groupTreatment.dailyTreatments.map((treatment, treatmentIndex) => (
                    <Card key={treatmentIndex} className="p-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-2">
                        <div className="space-y-0.5">
                          <Label className="text-xs">Date</Label>
                          <Input
                            type="date"
                            value={treatment.date}
                            onChange={(e) =>
                              updateDailyTreatment(
                                groupIndex,
                                treatmentIndex,
                                "date",
                                e.target.value
                              )
                            }
                            className="text-sm"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <Label className="text-xs">Treatment Amount</Label>
                          <Input
                            type="number"
                            value={treatment.treatmentAmount}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              // Validate non-negative numbers
                              if (value >= 0) {
                                updateDailyTreatment(
                                  groupIndex,
                                  treatmentIndex,
                                  "treatmentAmount",
                                  value
                                );
                              }
                            }}
                            className="text-sm"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <Label className="text-xs">Paid Amount</Label>
                          <Input
                            type="number"
                            value={treatment.paidAmount}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              // Validate non-negative and not exceeding treatment amount
                              if (value >= 0 && value <= treatment.treatmentAmount) {
                                updateDailyTreatment(
                                  groupIndex,
                                  treatmentIndex,
                                  "paidAmount",
                                  value
                                );
                              }
                            }}
                            className="text-sm"
                            min="0"
                            max={treatment.treatmentAmount}
                            step="0.01"
                            placeholder="0.00"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <Label className="text-xs">Payment Date</Label>
                          <Input
                            type="date"
                            value={treatment.paymentDate || ""}
                            onChange={(e) => {
                              const selectedDate = new Date(e.target.value);
                              const today = new Date();
                              today.setHours(23, 59, 59, 999); // End of today
                              
                              // Validate payment date is not in the future
                              if (selectedDate <= today) {
                                updateDailyTreatment(
                                  groupIndex,
                                  treatmentIndex,
                                  "paymentDate",
                                  e.target.value
                                );
                              }
                            }}
                            className="text-sm"
                            placeholder="Payment date"
                            max={format(new Date(), "yyyy-MM-dd")}
                          />
                        </div>
                        <div className="space-y-0.5">
                          <Label className="text-xs">Remaining</Label>
                          <Input
                            type="number"
                            value={treatment.remainingAmount}
                            readOnly
                            className="text-xs bg-muted"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <Label className="text-xs">Doctor</Label>
                          <Select
                            value={treatment.treatedByDoctor || ""}
                            onValueChange={(value) =>
                              updateDailyTreatment(
                                groupIndex,
                                treatmentIndex,
                                "treatedByDoctor",
                                value
                              )
                            }
                          >
                            <SelectTrigger className="text-xs">
                              <SelectValue placeholder="Select" />
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
                        <div className="space-y-0.5">
                          <Label className="text-xs">Actions</Label>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeDailyTreatment(groupIndex, treatmentIndex)}
                            className="w-full h-6 px-2"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="mt-2 space-y-1.5">
                        <div className="space-y-0.5">
                          <Label className="text-xs">Procedure</Label>
                          <Input
                            value={treatment.procedure}
                            onChange={(e) =>
                              updateDailyTreatment(
                                groupIndex,
                                treatmentIndex,
                                "procedure",
                                e.target.value
                              )
                            }
                            placeholder="Enter procedure"
                            className="text-sm"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <Label className="text-xs">Daily Notes & Observations</Label>
                          <Textarea
                            value={treatment.notes}
                            onChange={(e) => {
                              const value = e.target.value;
                              // Limit to 500 characters
                              if (value.length <= 500) {
                                updateDailyTreatment(
                                  groupIndex,
                                  treatmentIndex,
                                  "notes",
                                  value
                                );
                              }
                            }}
                            placeholder="Enter daily notes: pain level, wire change, aligner number, patient response, treatment progress, observations..."
                            className="text-xs min-h-[60px] resize-none border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            maxLength={500}
                          />
                          <div className="text-xs text-gray-500">
                            {(treatment.notes || "").length}/500 characters
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {groupTreatments.length === 0 && !showAddForm && (
        <div className="text-center py-6 border border-dashed rounded-lg">
          <div className="text-muted-foreground text-xs">
            No group treatments added yet
          </div>
          <Button
            variant="outline"
            className="mt-3 h-7 px-3 text-xs"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add First Group Treatment
          </Button>
        </div>
      )}
    </div>
  );
}
