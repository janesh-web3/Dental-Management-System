import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import {  Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { crudRequest } from "@/lib/api";

// UI Components
import { Button } from "@/components/ui/button";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";

// Types
import { Doctor } from "@/types/doctor";
import { Patient } from "@/types/patient";

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

interface TreatmentPlanFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  doctors: Doctor[];
  patients?: Patient[];
  patientId?: string;
  doctorId?: string;
  isDrawer?: boolean;
}

export function TreatmentPlanForm({
  isOpen = false,
  onClose = () => {},
  onSuccess = () => {},
  doctors = [],
  patients = [],
  patientId,
  doctorId,
  isDrawer = false,
}: TreatmentPlanFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalculatingTotal, setIsCalculatingTotal] = useState(false);

  // Initialize form with default values
  const form = useForm<TreatmentPlanFormValues>({
    resolver: zodResolver(treatmentPlanSchema),
    defaultValues: {
      patient: patientId || "",
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
    setIsCalculatingTotal(true);
    const total = procedures.reduce((sum, procedure) => sum + (procedure.cost || 0), 0);
    form.setValue("totalCost", total);
    setIsCalculatingTotal(false);
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
      onSuccess();
      onClose();
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
        <ScrollArea className="h-[calc(85vh-180px)] pr-4">
          <div className="space-y-6 pb-6">
            {/* Patient Selection */}
            <FormField
              control={form.control}
              name="patient"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Patient</FormLabel>
                  <Select
                    disabled={!!patientId}
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select patient" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {patients?.map((patient) => (
                        <SelectItem key={patient._id} value={patient._id}>
                          {patient.personalDetails.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Doctor Selection */}
            <FormField
              control={form.control}
              name="doctor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Doctor</FormLabel>
                  <Select
                    disabled={!!doctorId}
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
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
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Treatment Title (Diagnosis) */}
            <FormField
              control={form.control}
              name="diagnosis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Treatment Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter treatment title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description (Notes) */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter treatment description"
                      className="min-h-[100px] resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Start Date */}
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className="w-full pl-3 text-left font-normal"
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* End Date (Optional) */}
            <FormField
              control={form.control}
              name="expectedEndDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>End Date (Optional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className="w-full pl-3 text-left font-normal"
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value || undefined}
                        onSelect={field.onChange}
                        initialFocus
                        disabled={(date) => date < form.getValues("startDate")}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Procedures List */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-base">Procedures</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ name: "", cost: 0, remarks: "" })}
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Procedure
                </Button>
              </div>

              <AnimatePresence>
                {fields.map((field, index) => (
                  <motion.div
                    key={field.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="mb-4">
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-medium">Procedure {index + 1}</h4>
                          {fields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => remove(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Procedure Name */}
                          <FormField
                            control={form.control}
                            name={`procedures.${index}.name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Procedure Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter procedure name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Procedure Cost */}
                          <FormField
                            control={form.control}
                            name={`procedures.${index}.cost`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Cost</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="Enter cost"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Procedure Remarks */}
                        <FormField
                          control={form.control}
                          name={`procedures.${index}.remarks`}
                          render={({ field }) => (
                            <FormItem className="mt-4">
                              <FormLabel>Remarks</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Enter remarks (optional)"
                                  className="resize-y"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Total Cost */}
            <FormField
              control={form.control}
              name="totalCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estimated Total Cost</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      disabled={isCalculatingTotal}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Payment Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Active">In Progress</SelectItem>
                      <SelectItem value="Completed">Paid</SelectItem>
                      <SelectItem value="Cancelled">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Treatment Plan"}
          </Button>
        </div>
      </form>
    </Form>
  );

  // Render either Dialog or Drawer based on isDrawer prop
  return (
    <>
      {isDrawer ? (
        <Drawer open={isOpen} onOpenChange={onClose}>
          <DrawerContent className="max-h-[90vh]">
            <DrawerHeader>
              <DrawerTitle>Create Treatment Plan</DrawerTitle>
            </DrawerHeader>
            <div className="px-4">
              <FormContent />
            </div>
            <DrawerFooter className="pt-0">
              <DrawerClose asChild>
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Create Treatment Plan</DialogTitle>
            </DialogHeader>
            <FormContent />
            <DialogFooter className="hidden">
              {/* Hidden because buttons are already in the form */}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
