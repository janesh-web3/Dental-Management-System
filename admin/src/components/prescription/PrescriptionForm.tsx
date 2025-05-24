import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";

// UI Components
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { crudRequest } from "@/lib/api";

// Define the schema for medication items
const medicationSchema = z.object({
  name: z.string().min(1, "Medication name is required"),
  dosage: z.string().min(1, "Dosage is required"),
  frequency: z.string().min(1, "Frequency is required"),
  duration: z.string().min(1, "Duration is required"),
  notes: z.string().optional(),
});

// Define the schema for the entire form
const prescriptionFormSchema = z.object({
  patient: z.string().min(1, "Patient is required"),
  doctor: z.string().min(1, "Doctor is required"),
  diagnosis: z.string().min(1, "Diagnosis is required"),
  medications: z.array(medicationSchema).min(1, "At least one medication is required"),
  tests: z.string().optional(),
  nextVisitDate: z.date().optional(),
  instructions: z.string().optional(),
});

// Define the type for our form values
type PrescriptionFormValues = z.infer<typeof prescriptionFormSchema>;

// Define props for the component
interface PrescriptionFormProps {
  patientId?: string;
  patientName?: string;
  patientData?: {
    contactNumber?: string;
    emailAddress?: string;
    age?: string;
    gender?: string;
    address?: string;
  };
  doctorId?: string;
  doctorName?: string;
  isAdmin?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PrescriptionForm({
  patientId,
  patientName,
  patientData,
  doctorId,
  doctorName,
  isAdmin = false,
  onSuccess,
  onCancel,
}: PrescriptionFormProps) {
  const [patients, setPatients] = useState<Array<{ id: string; name: string }>>([]);
  const [doctors, setDoctors] = useState<Array<{ id: string; name: string }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize the form with default values
  const form = useForm<PrescriptionFormValues>({
    resolver: zodResolver(prescriptionFormSchema),
    defaultValues: {
      patient: patientId || "",
      doctor: doctorId || "",
      diagnosis: "",
      medications: [
        {
          name: "",
          dosage: "",
          frequency: "",
          duration: "",
          notes: "",
        },
      ],
      tests: "",
      nextVisitDate: undefined,
      instructions: "",
    },
  });

  // Setup field array for medications
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "medications",
  });

  // Fetch patients and doctors data
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!patientId || isAdmin) {
          const patientsResponse = await crudRequest<any>("GET", "/patient/get-pagination-patient?limit=100");
          if (patientsResponse && Array.isArray(patientsResponse.patients)) {
            setPatients(
              patientsResponse.patients.map((patient: any) => ({
                id: patient._id,
                name: patient.personalDetails?.name || 'Unknown Patient',
              }))
            );
          }
        }

        if (!doctorId || isAdmin) {
          const doctorsResponse = await crudRequest<any>("GET", "/doctor/get-doctor");
          if (doctorsResponse && Array.isArray(doctorsResponse)) {
            setDoctors(
              doctorsResponse.map((doctor: any) => ({
                id: doctor._id,
                name: doctor.name || 'Unknown Doctor',
              }))
            );
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load patients or doctors data");
      }
    };

    fetchData();
  }, [patientId, doctorId, isAdmin]);

  // Handle form submission
  const onSubmit = async (data: PrescriptionFormValues) => {
    setIsSubmitting(true);
    try {
      // Format the data for the API
      const prescriptionData = {
        patient: data.patient,
        doctor: data.doctor,
        diagnosis: data.diagnosis,
        medications: data.medications,
        instructions: data.instructions,
        ...(data.tests && { tests: data.tests }),
        ...(data.nextVisitDate && { nextVisitDate: data.nextVisitDate }),
      };

      // Make the API call
      await crudRequest("POST", "/prescription/create", prescriptionData);
      
      toast.success("Prescription created successfully!");
      form.reset();
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error creating prescription:", error);
      toast.error("Failed to create prescription. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-4xl mx-auto p-6"
    >
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Patient Information Card - Only show when patientData is available */}
              {patientId && patientData && (
                <Card className="bg-muted/50 border border-muted-foreground/20">
                  <CardContent className="pt-4">
                    <h3 className="text-sm font-medium mb-2">Patient Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="font-semibold">Name:</span> {patientName}
                      </div>
                      {patientData.contactNumber && (
                        <div>
                          <span className="font-semibold">Contact:</span> {patientData.contactNumber}
                        </div>
                      )}
                      {patientData.emailAddress && (
                        <div>
                          <span className="font-semibold">Email:</span> {patientData.emailAddress}
                        </div>
                      )}
                      {patientData.age && (
                        <div>
                          <span className="font-semibold">Age:</span> {patientData.age}
                        </div>
                      )}
                      {patientData.gender && (
                        <div>
                          <span className="font-semibold">Gender:</span> {patientData.gender}
                        </div>
                      )}
                      {patientData.address && (
                        <div>
                          <span className="font-semibold">Address:</span> {patientData.address}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Patient Selection */}
                <FormField
                  control={form.control}
                  name="patient"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Patient</FormLabel>
                      <Select
                        disabled={!!patientId || isSubmitting}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select patient" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {patientName && patientId ? (
                            <SelectItem value={patientId}>{patientName}</SelectItem>
                          ) : (
                            patients.map((patient) => (
                              <SelectItem key={patient.id} value={patient.id}>
                                {patient.name}
                              </SelectItem>
                            ))
                          )}
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
                        disabled={!!doctorId || isSubmitting}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select doctor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {doctorName && doctorId ? (
                            <SelectItem value={doctorId}>{doctorName}</SelectItem>
                          ) : (
                            doctors.map((doctor) => (
                              <SelectItem key={doctor.id} value={doctor.id}>
                                {doctor.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Diagnosis */}
              <FormField
                control={form.control}
                name="diagnosis"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Diagnosis</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter diagnosis"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Medications */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-base">Medications</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      append({
                        name: "",
                        dosage: "",
                        frequency: "",
                        duration: "",
                        notes: "",
                      })
                    }
                    disabled={isSubmitting}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Medication
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
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name={`medications.${index}.name`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Medication Name</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Medication name"
                                      {...field}
                                      disabled={isSubmitting}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`medications.${index}.dosage`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Dosage</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="e.g., 500mg"
                                      {...field}
                                      disabled={isSubmitting}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`medications.${index}.frequency`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Frequency</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="e.g., Twice daily"
                                      {...field}
                                      disabled={isSubmitting}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`medications.${index}.duration`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Duration</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="e.g., 7 days"
                                      {...field}
                                      disabled={isSubmitting}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`medications.${index}.notes`}
                              render={({ field }) => (
                                <FormItem className="col-span-2">
                                  <FormLabel>Notes</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Additional notes (optional)"
                                      {...field}
                                      disabled={isSubmitting}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {fields.length > 1 && (
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="mt-4"
                              onClick={() => remove(index)}
                              disabled={isSubmitting}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Remove
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Tests Recommended */}
              <FormField
                control={form.control}
                name="tests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tests Recommended (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter recommended tests"
                        className="min-h-[80px]"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Next Visit Date */}
              <FormField
                control={form.control}
                name="nextVisitDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Next Visit Date (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        className="w-full"
                        disabled={isSubmitting}
                        min={new Date().toISOString().split('T')[0]}
                        value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value) : undefined;
                          field.onChange(date);
                        }}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Select the recommended date for the next appointment
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Instructions/Advice */}
              <FormField
                control={form.control}
                name="instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes / Advice</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter additional instructions or advice"
                        className="min-h-[120px]"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      Include any special instructions or advice for the patient.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Prescription"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
