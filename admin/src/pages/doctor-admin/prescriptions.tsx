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
import { useToast } from "@/components/ui/use-toast";
import { 
  Loader2, Plus, Search, Download, FileText, Trash
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useDoctorAuthContext } from '@/contexts/doctorAuthContext';

interface PrescriptionsProps {
  doctorId: string;
}

interface Patient {
  _id: string;
  personalDetails: {
    name: string;
  };
}

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes?: string;
}

interface Prescription {
  _id: string;
  patient: Patient;
  doctor: {
    _id: string;
    name: string;
  };
  medications: Medication[];
  diagnosis?: string;
  instructions?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

// Form schema for creating prescriptions
const prescriptionSchema = z.object({
  patient: z.string({
    required_error: "Patient is required",
  }),
  diagnosis: z.string().optional(),
  instructions: z.string().optional(),
  medications: z.array(
    z.object({
      name: z.string().min(1, "Medication name is required"),
      dosage: z.string().min(1, "Dosage is required"),
      frequency: z.string().min(1, "Frequency is required"),
      duration: z.string().min(1, "Duration is required"),
      notes: z.string().optional(),
    })
  ).min(1, "At least one medication is required"),
});

type PrescriptionFormValues = z.infer<typeof prescriptionSchema>;

// Predefined prescription templates
const prescriptionTemplates = [
  {
    name: "Dental Pain Relief",
    medications: [
      {
        name: "Ibuprofen",
        dosage: "400mg",
        frequency: "Every 6 hours as needed",
        duration: "5 days",
        notes: "Take with food",
      },
      {
        name: "Acetaminophen",
        dosage: "500mg",
        frequency: "Every 6 hours as needed (alternate with Ibuprofen)",
        duration: "5 days",
        notes: "Do not exceed 4000mg per day",
      },
    ],
    instructions: "Apply cold compress to affected area for 15 minutes at a time. Avoid hard foods and chewing on the affected side.",
  },
  {
    name: "Post-Extraction Care",
    medications: [
      {
        name: "Amoxicillin",
        dosage: "500mg",
        frequency: "Every 8 hours",
        duration: "7 days",
        notes: "Complete the full course",
      },
      {
        name: "Ibuprofen",
        dosage: "600mg",
        frequency: "Every 6 hours as needed",
        duration: "3 days",
        notes: "Take with food",
      },
    ],
    instructions: "Bite down on gauze for 30 minutes. No rinsing, spitting, or using straws for 24 hours. Soft foods only for 2 days.",
  },
  {
    name: "Gum Infection",
    medications: [
      {
        name: "Metronidazole",
        dosage: "400mg",
        frequency: "Every 8 hours",
        duration: "7 days",
        notes: "Complete the full course",
      },
      {
        name: "Chlorhexidine Mouthwash",
        dosage: "15ml",
        frequency: "Twice daily",
        duration: "14 days",
        notes: "Rinse for 30 seconds and spit. Do not eat or drink for 30 minutes after use.",
      },
    ],
    instructions: "Brush gently with a soft toothbrush. Floss daily. Avoid alcohol and smoking during treatment.",
  },
];

const Prescriptions: React.FC = () => {
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
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [patientFilter, setPatientFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState<boolean>(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState<boolean>(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("none");
  const { toast } = useToast();

  const form = useForm<PrescriptionFormValues>({
    resolver: zodResolver(prescriptionSchema),
    defaultValues: {
      diagnosis: "",
      instructions: "",
      medications: [
        {
          name: "",
          dosage: "",
          frequency: "",
          duration: "",
          notes: "",
        },
      ],
    },
  });

  useEffect(() => {
    fetchPrescriptions();
    fetchPatients();
  }, [doctorId, currentPage, searchTerm, patientFilter]);

  useEffect(() => {
    // Apply template when selected
    if (selectedTemplate && selectedTemplate !== 'none') {
      const template = prescriptionTemplates.find(t => t.name === selectedTemplate);
      if (template) {
        form.setValue("medications", template.medications);
        form.setValue("instructions", template.instructions || "");
      }
    }
  }, [selectedTemplate, form]);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      // This would be replaced with an actual API call in a real implementation
      // For now, we'll simulate the data
      setTimeout(() => {
        setPrescriptions([
          {
            _id: "1",
            patient: {
              _id: "101",
              personalDetails: {
                name: "John Doe",
              },
            },
            doctor: {
              _id: doctorId,
              name: "Dr. Smith",
            },
            medications: [
              {
                name: "Amoxicillin",
                dosage: "500mg",
                frequency: "Every 8 hours",
                duration: "7 days",
                notes: "Take with food",
              },
              {
                name: "Ibuprofen",
                dosage: "400mg",
                frequency: "Every 6 hours as needed",
                duration: "5 days",
              },
            ],
            diagnosis: "Dental abscess",
            instructions: "Rinse with warm salt water three times daily",
            createdAt: "2025-05-15T10:30:00Z",
            updatedAt: "2025-05-15T10:30:00Z",
            isActive: true,
          },
        ]);
        setTotalPages(1);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load prescriptions",
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

  const handleCreatePrescription = async (values: PrescriptionFormValues) => {
    try {
      setLoading(true);
      // Format the data for the API
      const formattedValues = {
        ...values,
        doctor: doctorId,
      };

      // In a real implementation, this would be an API call
      console.log('Creating prescription:', formattedValues);
      
      toast({
        title: "Success",
        description: "Prescription created successfully",
      });
      
      setIsCreateDialogOpen(false);
      form.reset();
      setSelectedTemplate("none");
      fetchPrescriptions();
    } catch (error) {
      console.error('Error creating prescription:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create prescription",
      });
    } finally {
      setLoading(false);
    }
  };

  const viewPrescription = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setIsViewDialogOpen(true);
  };

  const downloadPrescription = (prescription: Prescription) => {
    // In a real implementation, this would generate a PDF or call an API endpoint
    // For now, we'll just show a toast
    toast({
      title: "Download Started",
      description: `Downloading prescription for ${prescription.patient.personalDetails.name}`,
    });
  };

  const addMedication = () => {
    const currentMedications = form.getValues("medications");
    form.setValue("medications", [
      ...currentMedications,
      {
        name: "",
        dosage: "",
        frequency: "",
        duration: "",
        notes: "",
      },
    ]);
  };

  const removeMedication = (index: number) => {
    const currentMedications = form.getValues("medications");
    if (currentMedications.length > 1) {
      form.setValue(
        "medications",
        currentMedications.filter((_, i) => i !== index)
      );
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Prescriptions</CardTitle>
              <CardDescription>
                Create and manage patient prescriptions
              </CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Prescription
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Prescription</DialogTitle>
                  <DialogDescription>
                    Create a prescription for your patient
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleCreatePrescription)} className="space-y-4">
                    <div className="mb-4">
                      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Use Template (Optional)</label>
                      <Select 
                        value={selectedTemplate} 
                        onValueChange={setSelectedTemplate}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a template" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {prescriptionTemplates.map((template) => (
                            <SelectItem key={template.name} value={template.name}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
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
                          <FormLabel>Diagnosis (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter diagnosis" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div>
                      <h3 className="text-sm font-medium mb-2">Medications</h3>
                      <div className="space-y-4">
                        {form.watch("medications").map((_, index) => (
                          <div key={index} className="border rounded-md p-4">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="text-sm font-medium">Medication {index + 1}</h4>
                              {form.watch("medications").length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeMedication(index)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 gap-4">
                              <FormField
                                control={form.control}
                                name={`medications.${index}.name`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Medication Name</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Enter medication name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <div className="grid grid-cols-2 gap-4">
                                <FormField
                                  control={form.control}
                                  name={`medications.${index}.dosage`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Dosage</FormLabel>
                                      <FormControl>
                                        <Input placeholder="e.g., 500mg" {...field} />
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
                                        <Input placeholder="e.g., Twice daily" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              
                              <FormField
                                control={form.control}
                                name={`medications.${index}.duration`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Duration</FormLabel>
                                    <FormControl>
                                      <Input placeholder="e.g., 7 days" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name={`medications.${index}.notes`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Notes (Optional)</FormLabel>
                                    <FormControl>
                                      <Input placeholder="e.g., Take with food" {...field} />
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
                          onClick={addMedication}
                          className="w-full"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Medication
                        </Button>
                      </div>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="instructions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Instructions (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Additional instructions for the patient" 
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
                        Create Prescription
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search prescriptions..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select
              value={patientFilter}
              onValueChange={setPatientFilter}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by patient" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Patients</SelectItem>
                {patients.map((patient) => (
                  <SelectItem key={patient._id} value={patient._id}>
                    {patient.personalDetails.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Diagnosis</TableHead>
                      <TableHead>Medications</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prescriptions.length > 0 ? (
                      prescriptions.map((prescription) => (
                        <TableRow key={prescription._id}>
                          <TableCell className="font-medium">
                            {prescription.patient.personalDetails.name}
                          </TableCell>
                          <TableCell>
                            {new Date(prescription.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {prescription.diagnosis || "N/A"}
                          </TableCell>
                          <TableCell>
                            {prescription.medications.length} medication(s)
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => viewPrescription(prescription)}
                              >
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => downloadPrescription(prescription)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          No prescriptions found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {totalPages > 1 && (
                <div className="flex justify-center mt-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      
      {/* View Prescription Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          {selectedPrescription && (
            <>
              <DialogHeader>
                <DialogTitle>Prescription Details</DialogTitle>
                <DialogDescription>
                  Prescription for {selectedPrescription.patient.personalDetails.name}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-muted-foreground">Patient</p>
                    <p className="font-medium">{selectedPrescription.patient.personalDetails.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">
                      {new Date(selectedPrescription.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Doctor</p>
                    <p className="font-medium">{selectedPrescription.doctor.name}</p>
                  </div>
                </div>
                
                {selectedPrescription.diagnosis && (
                  <div>
                    <p className="text-sm text-muted-foreground">Diagnosis</p>
                    <p className="font-medium">{selectedPrescription.diagnosis}</p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm font-medium mb-2">Medications</p>
                  <div className="space-y-2">
                    {selectedPrescription.medications.map((medication, index) => (
                      <div key={index} className="border rounded-md p-3">
                        <div className="flex justify-between">
                          <p className="font-medium">{medication.name}</p>
                          <p>{medication.dosage}</p>
                        </div>
                        <div className="mt-1 text-sm">
                          <p>Frequency: {medication.frequency}</p>
                          <p>Duration: {medication.duration}</p>
                          {medication.notes && <p>Notes: {medication.notes}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {selectedPrescription.instructions && (
                  <div>
                    <p className="text-sm font-medium mb-2">Instructions</p>
                    <div className="border rounded-md p-3">
                      <p>{selectedPrescription.instructions}</p>
                    </div>
                  </div>
                )}
                
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => downloadPrescription(selectedPrescription)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </DialogFooter>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Prescriptions;
