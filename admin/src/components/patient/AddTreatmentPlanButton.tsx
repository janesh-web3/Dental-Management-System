import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { toast } from "sonner";
import { crudRequest } from "@/lib/api";

// UI Components
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Doctor } from "@/types/doctor";

// Form schema definition
const procedureSchema = z.object({
  name: z.string().min(1, "Procedure name is required"),
  cost: z.coerce.number().min(0, "Cost must be a positive number"),
  remarks: z.string().optional(),
});

const treatmentPlanSchema = z.object({
  patient: z.string().min(1, "Patient is required"),
  doctor: z.string().min(1, "Doctor is required"),
  diagnosis: z.string().min(1, "Treatment title is required"),
  startDate: z.date({
    required_error: "Start date is required",
  }),
  expectedEndDate: z.date().optional(),
  procedures: z.array(procedureSchema).min(1, "At least one procedure is required"),
  totalCost: z.coerce.number().min(0, "Total cost must be a positive number"),
  status: z.enum(["Active", "Completed", "Cancelled"], {
    required_error: "Status is required",
  }),
  notes: z.string().optional(),
});

type TreatmentPlanFormValues = z.infer<typeof treatmentPlanSchema>;

interface AddTreatmentPlanButtonProps {
  patient: any; // Using any to accommodate different patient types
  doctors: Doctor[];
  doctorId?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  onSuccess?: () => void;

}

export function AddTreatmentPlanButton({
  patient,
  doctors,
  doctorId,
  variant = "default",
  size = "sm",
  className = "",
  onSuccess,

}: AddTreatmentPlanButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with default values
  const form = useForm<TreatmentPlanFormValues>({
    resolver: zodResolver(treatmentPlanSchema),
    defaultValues: {
      patient: patient?._id || "",
      doctor: doctorId || "",
      diagnosis: "",
      startDate: new Date(),
      procedures: [{ name: "", cost: 0, remarks: "" }],
      totalCost: 0,
      status: "Active",
      notes: "",
    },
  });

  // Setup field array for procedures
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "procedures",
  });

  // Watch procedures to calculate total cost
  const procedures = form.watch("procedures");
  
  // Calculate total cost whenever procedures change
  useEffect(() => {
    const total = procedures.reduce((sum, procedure) => sum + (procedure.cost || 0), 0);
    form.setValue("totalCost", total);
  }, [procedures, form]);

  // Handle form submission
  const onSubmit = async (data: TreatmentPlanFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Prepare data for backend
      const treatmentPlanData = {
        ...data,
        startDate: format(data.startDate, "yyyy-MM-dd"),
        expectedEndDate: data.expectedEndDate ? format(data.expectedEndDate, "yyyy-MM-dd") : undefined,
        treatmentSteps: data.procedures.map(proc => ({
          procedure: proc.name,
          cost: proc.cost,
          notes: proc.remarks,
          status: "Planned",
          plannedDate: format(data.startDate, "yyyy-MM-dd"),
        })),
      };

      // Make API request
      await crudRequest(
        "POST",
        "/treatment-plans",
        treatmentPlanData
      );

      toast.success("Treatment plan created successfully");
      form.reset();
      if (onSuccess) onSuccess();
      setIsOpen(false);
    } catch (error) {
      console.error("Error creating treatment plan:", error);
      toast.error("Failed to create treatment plan");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Form content component to be used in both Dialog and Drawer
  const FormContent = () => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <ScrollArea className="h-[calc(75vh-140px)] pr-2">
          <div className="space-y-4 pb-4">
            {/* Patient and Doctor Selection in a grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="patient"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs">Patient</FormLabel>
                    <Select
                      disabled={!!patient?._id}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Select patient" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={patient?._id || ""}>
                          {patient?.personalDetails?.name || "Select patient"}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="doctor"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs">Doctor</FormLabel>
                    <Select
                      disabled={!!doctorId}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Select doctor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {doctors.map((doctor) => (
                          <SelectItem key={doctor._id} value={doctor._id}>
                            {doctor.name} ({doctor.specialization})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            {/* Treatment Title (Diagnosis) */}
            <FormField
              control={form.control}
              name="diagnosis"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-xs">Treatment Title</FormLabel>
                  <FormControl>
                    <Input className="h-8" placeholder="Enter treatment title" {...field} />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* Description (Notes) */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-xs">Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter treatment description"
                      className="min-h-[60px] resize-y text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* Date fields in a grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Start Date */}
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs">Start Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        className="h-8"
                        {...field}
                        value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value) : null;
                          field.onChange(date);
                        }}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* End Date (Optional) */}
              <FormField
                control={form.control}
                name="expectedEndDate"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs">End Date (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        className="h-8"
                        {...field}
                        value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                        min={form.getValues("startDate") ? format(form.getValues("startDate"), "yyyy-MM-dd") : ""}
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value) : null;
                          field.onChange(date);
                        }}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            {/* Procedures List */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-medium">Procedures</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => append({ name: "", cost: 0, remarks: "" })}
                >
                  <PlusCircle className="h-3 w-3 mr-1" /> Add
                </Button>
              </div>

              {fields.map((field, index) => (
                <Card key={field.id} className="mb-2 shadow-sm border-muted">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-xs font-medium">Procedure {index + 1}</h4>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => remove(index)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {/* Procedure Name */}
                      <FormField
                        control={form.control}
                        name={`procedures.${index}.name`}
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormLabel className="text-xs">Name</FormLabel>
                            <FormControl>
                              <Input className="h-7 text-xs" placeholder="Procedure name" {...field} />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />

                      {/* Procedure Cost */}
                      <FormField
                        control={form.control}
                        name={`procedures.${index}.cost`}
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormLabel className="text-xs">Cost</FormLabel>
                            <FormControl>
                              <Input
                                className="h-7 text-xs"
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="Cost"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Procedure Remarks */}
                    <FormField
                      control={form.control}
                      name={`procedures.${index}.remarks`}
                      render={({ field }) => (
                        <FormItem className="mt-2 space-y-1">
                          <FormLabel className="text-xs">Remarks</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Optional remarks"
                              className="resize-none h-12 min-h-0 text-xs"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Total Cost and Payment Status in a grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Total Cost */}
              <FormField
                control={form.control}
                name="totalCost"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs">Estimated Total Cost</FormLabel>
                    <FormControl>
                      <Input
                        className="h-8 text-sm"
                        type="number"
                        min="0"
                        step="0.01"
                        disabled
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* Payment Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs">Payment Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Active">In Progress</SelectItem>
                        <SelectItem value="Completed">Paid</SelectItem>
                        <SelectItem value="Cancelled">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  );

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => setIsOpen(true)}
      >
        <PlusCircle className="h-4 w-4 mr-2" />
        Add Treatment Plan
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-hidden">
          <DialogHeader className="py-2">
            <DialogTitle className="text-base">Create Treatment Plan</DialogTitle>
          </DialogHeader>
          <FormContent />
        </DialogContent>
      </Dialog>
    </>
  );
}
