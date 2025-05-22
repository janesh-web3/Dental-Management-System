import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from "@/components/ui/card";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage 
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { 
  Popover, PopoverContent, PopoverTrigger 
} from "@/components/ui/popover";
import { useToast } from "@/components/ui/use-toast";
import { 
  CalendarIcon, Loader2, Plus, Search, Edit2, CheckCircle, AlertCircle
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useDoctorAuthContext } from '@/contexts/doctorAuthContext';

interface TreatmentsProps {
  doctorId: string;
}

interface Patient {
  _id: string;
  personalDetails: {
    name: string;
  };
}

interface TreatmentStep {
  _id?: string;
  procedure: string;
  status: "Planned" | "In Progress" | "Completed" | "Cancelled";
  plannedDate: Date | string;
  completedDate?: Date | string;
  notes?: string;
  cost: number;
}

interface TreatmentPlan {
  _id: string;
  patient: Patient;
  doctor: string;
  diagnosis: string;
  treatmentSteps: TreatmentStep[];
  totalCost: number;
  startDate: string;
  expectedEndDate?: string;
  actualEndDate?: string;
  status: "Active" | "Completed" | "Cancelled";
  notes?: string;
}

// Form schema for creating treatment plans
const treatmentPlanSchema = z.object({
  patient: z.string({
    required_error: "Patient is required",
  }),
  diagnosis: z.string().min(1, "Diagnosis is required"),
  expectedEndDate: z.date().optional(),
  notes: z.string().optional(),
  treatmentSteps: z.array(
    z.object({
      procedure: z.string().min(1, "Procedure is required"),
      plannedDate: z.date({
        required_error: "Planned date is required",
      }),
      cost: z.coerce.number().min(0, "Cost must be a positive number"),
      notes: z.string().optional(),
    })
  ).min(1, "At least one treatment step is required"),
});

type TreatmentPlanFormValues = z.infer<typeof treatmentPlanSchema>;

// Form schema for updating treatment steps
const treatmentStepSchema = z.object({
  status: z.enum(["Planned", "In Progress", "Completed", "Cancelled"]),
  completedDate: z.date().optional(),
  notes: z.string().optional(),
});

type TreatmentStepFormValues = z.infer<typeof treatmentStepSchema>;

const Treatments: React.FC = () => {
  const { doctorDetails, isLoading } = useDoctorAuthContext();
  
    // Get the doctor ID from the auth context
    const doctorId = doctorDetails?._id || "";
  
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading doctor panel...</span>
        </div>
      );
    }
  const [loading, setLoading] = useState<boolean>(true);
  const [treatments, setTreatments] = useState<TreatmentPlan[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState<boolean>(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState<boolean>(false);
  const [selectedTreatment, setSelectedTreatment] = useState<TreatmentPlan | null>(null);
  const [selectedStep, setSelectedStep] = useState<TreatmentStep & { treatmentId: string } | null>(null);
  const { toast } = useToast();

  const form = useForm<TreatmentPlanFormValues>({
    resolver: zodResolver(treatmentPlanSchema),
    defaultValues: {
      diagnosis: "",
      notes: "",
      treatmentSteps: [
        {
          procedure: "",
          plannedDate: new Date(),
          cost: 0,
          notes: "",
        },
      ],
    },
  });

  const updateStepForm = useForm<TreatmentStepFormValues>({
    resolver: zodResolver(treatmentStepSchema),
    defaultValues: {
      status: "Planned",
      notes: "",
    },
  });

  useEffect(() => {
    fetchTreatments();
    fetchPatients();
  }, [doctorId]);

  const fetchTreatments = async () => {
    try {
      setLoading(true);
      // This would be replaced with an actual API call in a real implementation
      // For now, we'll simulate the data
      setTimeout(() => {
        setTreatments([
          {
            _id: "1",
            patient: {
              _id: "101",
              personalDetails: {
                name: "John Doe",
              },
            },
            doctor: doctorId,
            diagnosis: "Dental Caries",
            treatmentSteps: [
              {
                _id: "step1",
                procedure: "X-ray and Examination",
                status: "Completed",
                plannedDate: "2025-05-15",
                completedDate: "2025-05-15",
                notes: "Initial examination completed",
                cost: 50,
              },
              {
                _id: "step2",
                procedure: "Cavity Filling",
                status: "In Progress",
                plannedDate: "2025-05-22",
                notes: "Scheduled for upper right molar",
                cost: 150,
              },
            ],
            totalCost: 200,
            startDate: "2025-05-15",
            expectedEndDate: "2025-05-29",
            status: "Active",
          },
        ]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching treatments:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load treatments",
      });
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      // This would be replaced with an actual API call in a real implementation
      // For now, we'll simulate the data
      setTimeout(() => {
        setPatients([
          {
            _id: "101",
            personalDetails: {
              name: "John Doe",
            },
          },
          {
            _id: "102",
            personalDetails: {
              name: "Jane Smith",
            },
          },
        ]);
      }, 500);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load patients",
      });
    }
  };

  const handleCreateTreatment = async (values: TreatmentPlanFormValues) => {
    try {
      setLoading(true);
      // Format the data for the API
      const formattedValues = {
        ...values,
        doctor: doctorId,
        expectedEndDate: values.expectedEndDate ? format(values.expectedEndDate, 'yyyy-MM-dd') : undefined,
        treatmentSteps: values.treatmentSteps.map(step => ({
          ...step,
          plannedDate: format(step.plannedDate, 'yyyy-MM-dd'),
          status: "Planned",
        })),
      };

      // In a real implementation, this would be an API call
      console.log('Creating treatment plan:', formattedValues);
      
      toast({
        title: "Success",
        description: "Treatment plan created successfully",
      });
      
      setIsCreateDialogOpen(false);
      form.reset();
      fetchTreatments();
    } catch (error) {
      console.error('Error creating treatment plan:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create treatment plan",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTreatmentStep = async (values: TreatmentStepFormValues) => {
    if (!selectedStep) return;
    
    try {
      setLoading(true);
      // Format the data for the API
      const formattedValues = {
        ...values,
        completedDate: values.completedDate ? format(values.completedDate, 'yyyy-MM-dd') : undefined,
      };

      // In a real implementation, this would be an API call
      console.log('Updating treatment step:', formattedValues);
      
      toast({
        title: "Success",
        description: "Treatment step updated successfully",
      });
      
      setIsUpdateDialogOpen(false);
      updateStepForm.reset();
      fetchTreatments();
    } catch (error) {
      console.error('Error updating treatment step:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update treatment step",
      });
    } finally {
      setLoading(false);
    }
  };

  const openUpdateStepDialog = (treatmentId: string, step: TreatmentStep) => {
    setSelectedStep({ ...step, treatmentId });
    
    updateStepForm.reset({
      status: step.status,
      completedDate: step.completedDate ? new Date(step.completedDate) : undefined,
      notes: step.notes || "",
    });
    
    setIsUpdateDialogOpen(true);
  };

  const addTreatmentStep = () => {
    const currentSteps = form.getValues("treatmentSteps");
    form.setValue("treatmentSteps", [
      ...currentSteps,
      {
        procedure: "",
        plannedDate: new Date(),
        cost: 0,
        notes: "",
      },
    ]);
  };

  const removeTreatmentStep = (index: number) => {
    const currentSteps = form.getValues("treatmentSteps");
    if (currentSteps.length > 1) {
      form.setValue(
        "treatmentSteps",
        currentSteps.filter((_, i) => i !== index)
      );
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Treatment Plans</CardTitle>
              <CardDescription>
                Create and manage patient treatment plans
              </CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Treatment Plan
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Treatment Plan</DialogTitle>
                  <DialogDescription>
                    Create a comprehensive treatment plan for your patient
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleCreateTreatment)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="patient"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Patient</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select patient" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {patients.map((patient) => (
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
                    
                    <FormField
                      control={form.control}
                      name="diagnosis"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Diagnosis</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter diagnosis" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="expectedEndDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Expected End Date (Optional)</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={`w-full pl-3 text-left font-normal ${
                                    !field.value && "text-muted-foreground"
                                  }`}
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
                                disabled={(date) => date < new Date()}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Additional notes" 
                              className="resize-none" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div>
                      <h3 className="text-sm font-medium mb-2">Treatment Steps</h3>
                      <div className="space-y-4">
                        {form.watch("treatmentSteps").map((_, index) => (
                          <div key={index} className="border rounded-md p-4">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="text-sm font-medium">Step {index + 1}</h4>
                              {form.watch("treatmentSteps").length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeTreatmentStep(index)}
                                >
                                  Remove
                                </Button>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 gap-4">
                              <FormField
                                control={form.control}
                                name={`treatmentSteps.${index}.procedure`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Procedure</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Enter procedure" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <div className="grid grid-cols-2 gap-4">
                                <FormField
                                  control={form.control}
                                  name={`treatmentSteps.${index}.plannedDate`}
                                  render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                      <FormLabel>Planned Date</FormLabel>
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <FormControl>
                                            <Button
                                              variant={"outline"}
                                              className={`w-full pl-3 text-left font-normal ${
                                                !field.value && "text-muted-foreground"
                                              }`}
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
                                            disabled={(date) => date < new Date()}
                                            initialFocus
                                          />
                                        </PopoverContent>
                                      </Popover>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={form.control}
                                  name={`treatmentSteps.${index}.cost`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Cost ($)</FormLabel>
                                      <FormControl>
                                        <Input 
                                          type="number" 
                                          min="0" 
                                          step="0.01" 
                                          placeholder="0.00" 
                                          {...field} 
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              
                              <FormField
                                control={form.control}
                                name={`treatmentSteps.${index}.notes`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Notes (Optional)</FormLabel>
                                    <FormControl>
                                      <Textarea 
                                        placeholder="Step notes" 
                                        className="resize-none" 
                                        {...field} 
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        ))}
                        
                        <Button
                          type="button"
                          variant="outline"
                          onClick={addTreatmentStep}
                          className="w-full"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Step
                        </Button>
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Treatment Plan
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-6">
              {treatments.length > 0 ? (
                treatments.map((treatment) => (
                  <Card key={treatment._id} className="overflow-hidden">
                    <CardHeader className="bg-muted/50">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            {treatment.diagnosis}
                          </CardTitle>
                          <CardDescription>
                            Patient: {treatment.patient.personalDetails.name}
                          </CardDescription>
                        </div>
                        <Badge variant={
                          treatment.status === "Completed" 
                            ? "default" 
                            : treatment.status === "Cancelled" 
                              ? "destructive" 
                              : "outline"
                        }>
                          {treatment.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div>
                          <p className="text-sm text-muted-foreground">Start Date</p>
                          <p className="font-medium">{new Date(treatment.startDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Expected End Date</p>
                          <p className="font-medium">
                            {treatment.expectedEndDate 
                              ? new Date(treatment.expectedEndDate).toLocaleDateString() 
                              : "Not specified"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total Cost</p>
                          <p className="font-medium">${treatment.totalCost.toFixed(2)}</p>
                        </div>
                      </div>
                      
                      <h3 className="text-sm font-medium mb-2">Treatment Steps</h3>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Procedure</TableHead>
                              <TableHead>Planned Date</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Cost</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {treatment.treatmentSteps.map((step) => (
                              <TableRow key={step._id}>
                                <TableCell className="font-medium">{step.procedure}</TableCell>
                                <TableCell>{new Date(step.plannedDate).toLocaleDateString()}</TableCell>
                                <TableCell>
                                  <Badge variant={
                                    step.status === "Completed" 
                                      ? "default" 
                                      : step.status === "Cancelled" 
                                        ? "destructive" 
                                        : step.status === "In Progress"
                                          ? "secondary"
                                          : "outline"
                                  }>
                                    {step.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>${step.cost.toFixed(2)}</TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openUpdateStepDialog(treatment._id, step)}
                                  >
                                    Update
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12 border rounded-md">
                  <h3 className="text-lg font-medium mb-2">No Treatment Plans</h3>
                  <p className="text-muted-foreground mb-4">
                    You haven't created any treatment plans yet
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Treatment Plan
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Update Treatment Step Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Update Treatment Step</DialogTitle>
            <DialogDescription>
              Update the status and details of this treatment step
            </DialogDescription>
          </DialogHeader>
          
          <Form {...updateStepForm}>
            <form onSubmit={updateStepForm.handleSubmit(handleUpdateTreatmentStep)} className="space-y-4">
              <FormField
                control={updateStepForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
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
                        <SelectItem value="Planned">Planned</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {updateStepForm.watch("status") === "Completed" && (
                <FormField
                  control={updateStepForm.control}
                  name="completedDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Completion Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={`w-full pl-3 text-left font-normal ${
                                !field.value && "text-muted-foreground"
                              }`}
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
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <FormField
                control={updateStepForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Additional notes" 
                        className="resize-none" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Step
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Treatments;
