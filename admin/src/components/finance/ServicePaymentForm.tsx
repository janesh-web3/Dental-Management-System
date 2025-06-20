import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ServicePayment, ServiceType, PaymentMethod } from "@/types/finance";
import { Patient } from "@/types/patient";

// Define schema for form validation
const servicePaymentSchema = z.object({
  patientName: z.string().min(3, "Patient name must be at least 3 characters"),
  contactNumber: z
    .string()
    .regex(/^\d{10}$/, "Contact number must be 10 digits")
    .optional()
    .or(z.literal("")),
  serviceType: z.enum([
    "X-Ray",
    "Consultation",
    "Medicine",
    "Lab Test",
    "Cleaning",
    "Other",
  ] as const),
  description: z.string().optional(),
  amount: z.coerce
    .number()
    .min(1, "Amount must be greater than 0")
    .nonnegative("Amount cannot be negative"),
  paymentMethod: z.enum([
    "Cash",
    "Credit Card",
    "Debit Card",
    "Insurance",
    "Bank Transfer",
    "Other",
  ] as const),
  date: z.date(),
  patient: z.string().optional(),
  isWalkIn: z.boolean().default(true),
});

type ServicePaymentFormValues = z.infer<typeof servicePaymentSchema>;

interface ServicePaymentFormProps {
  onSubmit: (data: ServicePaymentFormValues) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  initialData?: ServicePayment;
  patients?: Patient[];
}

export function ServicePaymentForm({
  onSubmit,
  onCancel,
  isSubmitting,
  initialData,
  patients = [],
}: ServicePaymentFormProps) {
  const [isExistingPatient, setIsExistingPatient] = useState(
    initialData ? !initialData.isWalkIn : false
  );

  // Initialize form with default values or initial data
  const form = useForm<ServicePaymentFormValues>({
    resolver: zodResolver(servicePaymentSchema),
    defaultValues: initialData
      ? {
          patientName: initialData.patientName,
          contactNumber: initialData.contactNumber || "",
          serviceType: initialData.serviceType as ServiceType,
          description: initialData.description || "",
          amount: initialData.amount,
          paymentMethod: initialData.paymentMethod as PaymentMethod,
          date: new Date(initialData.date),
          patient: typeof initialData.patient === "string" 
            ? initialData.patient 
            : initialData.patient?._id,
          isWalkIn: initialData.isWalkIn,
        }
      : {
          patientName: "",
          contactNumber: "",
          serviceType: "Consultation",
          description: "",
          amount: 0,
          paymentMethod: "Cash",
          date: new Date(),
          isWalkIn: true,
        },
  });

  // Update form when existing patient checkbox changes
  useEffect(() => {
    form.setValue("isWalkIn", !isExistingPatient);
    
    // Clear patient field if not using existing patient
    if (!isExistingPatient) {
      form.setValue("patient", undefined);
    }
  }, [isExistingPatient, form]);

  // Update patient name and contact when existing patient is selected
  const handlePatientChange = (patientId: string) => {
    const selectedPatient = patients.find((p) => p._id === patientId);
    if (selectedPatient) {
      form.setValue("patientName", selectedPatient.personalDetails.name);
      form.setValue(
        "contactNumber",
        selectedPatient.personalDetails.contactNumber || ""
      );
      form.setValue("patient", patientId);
    }
  };

  const serviceTypes: ServiceType[] = [
    "X-Ray",
    "Consultation",
    "Medicine",
    "Lab Test",
    "Cleaning",
    "Other",
  ];

  const paymentMethods: PaymentMethod[] = [
    "Cash",
    "Credit Card",
    "Debit Card",
    "Insurance",
    "Bank Transfer",
    "Other",
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 max-h-[calc(80vh-120px)]">
        {/* Existing Patient Checkbox */}
        <div className="flex items-center space-x-2 mb-4">
          <Checkbox
            id="existingPatient"
            checked={isExistingPatient}
            onCheckedChange={() => setIsExistingPatient(!isExistingPatient)}
          />
          <label
            htmlFor="existingPatient"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Existing Patient
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Patient Selection (if existing patient) */}
          {isExistingPatient && (
            <div className="col-span-1 sm:col-span-2">
              <FormField
                control={form.control}
                name="patient"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Patient</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        handlePatientChange(value);
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a patient" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {patients.map((patient) => (
                          <SelectItem key={patient._id} value={patient._id}>
                            {patient.personalDetails.name} ({patient.personalDetails.contactNumber || "No contact"})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Patient Name */}
          <FormField
            control={form.control}
            name="patientName"
            render={({ field }) => (
              <FormItem className="col-span-1 sm:col-span-2">
                <FormLabel>Patient Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    disabled={isExistingPatient && !!form.getValues("patient")}
                    placeholder="Enter patient name"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Contact Number */}
          <FormField
            control={form.control}
            name="contactNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Number</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    disabled={isExistingPatient && !!form.getValues("patient")}
                    placeholder="Enter 10-digit contact number"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Service Type */}
          <FormField
            control={form.control}
            name="serviceType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Service Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select service type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {serviceTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Amount */}
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount (Rs)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    min="0"
                    placeholder="Enter amount"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Payment Method */}
          <FormField
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Method</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Date */}
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Enter service description (optional)"
                  className="resize-none"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <span className="mr-2">Saving...</span>
                <Loader2 className="h-4 w-4 animate-spin" />
              </>
            ) : (
              "Save"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
} 