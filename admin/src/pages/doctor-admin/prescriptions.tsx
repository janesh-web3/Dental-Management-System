import React, { useState, useEffect } from 'react';
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
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { 
  Loader2, Plus, Search, Download, Trash
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useDoctorAuthContext } from '@/contexts/doctorAuthContext';
import { crudRequest } from '@/utils/api';

// No props needed as we'll get doctor info from context

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

// No prescription templates needed

const Prescriptions: React.FC = () => {
  // Get the doctor details from the auth context
  const { doctorDetails, isLoading } = useDoctorAuthContext();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading doctor panel...</span>
      </div>
    );
  }

  // No need for a separate doctorId variable as we use doctorDetails._id directly

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [patientFilter, setPatientFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState<boolean>(false);
  const [_submitting, setSubmitting] = useState<boolean>(false); // Used during form submission
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
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
    if (doctorDetails._id) {
      fetchPrescriptions();
      fetchPatients();
    }
  }, [doctorDetails._id, currentPage, searchTerm, patientFilter]);

  // No template functionality needed

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      
      // Calculate pagination parameters
      const limit = 10; // Items per page
      const skip = (currentPage - 1) * limit;
      
      // Build query parameters
      let queryParams = `limit=${limit}&skip=${skip}`;
      if (searchTerm) queryParams += `&search=${encodeURIComponent(searchTerm)}`;
      if (patientFilter) queryParams += `&patient=${encodeURIComponent(patientFilter)}`;
      
      // Use the crudRequest function to fetch prescriptions for the current doctor
      const response = await crudRequest<{
        count: number;
        prescriptions: Prescription[];
        total: number;
      }>(
        'GET',
        `/prescription/doctor/${doctorDetails._id}?${queryParams}`
      );
      
      if (response.success && response.data) {
        setPrescriptions(response.data.prescriptions || []);
        const total = response.data.count || 0;
        setTotalPages(Math.ceil(total / limit));
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: response.message || "Failed to load prescriptions",
        });
        setPrescriptions([]);
        setTotalPages(0);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load prescriptions",
      });
      setPrescriptions([]);
      setTotalPages(0);
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      // Fetch patients from the API
      const response = await crudRequest<{ data: Patient[] }>(
        'GET',
        '/patient/get-patient'
      );
      
      
      if (response.success && response.data) {
        setPatients(response.data.data || []);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: response.message || "Failed to load patients",
        });
        setPatients([]);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load patients",
      });
      setPatients([]);
    }
  };

  // No prescription templates functionality needed

  const handleCreatePrescription = async (values: PrescriptionFormValues) => {
    try {
      setSubmitting(true);
      
      // Create the prescription data object
      const prescriptionData = {
        patient: values.patient,
        doctor: doctorDetails._id,
        medications: values.medications,
        diagnosis: values.diagnosis,
        instructions: values.instructions
      };
      
      // Send the prescription data to the API
      const response = await crudRequest<Prescription>(
        'POST',
        '/prescription/create',
        prescriptionData
      );
      
      if (response.success && response.data) {
        // Refresh the prescriptions list
        fetchPrescriptions();
        setIsDialogOpen(false);
        form.reset();
        toast({
          title: "Success",
          description: "Prescription created successfully",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: response.message || "Failed to create prescription",
        });
      }
      
      setSubmitting(false);
    } catch (error) {
      console.error('Error creating prescription:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create prescription",
      });
      setSubmitting(false);
    }
  };

  const viewPrescription = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setIsViewDialogOpen(true);
  };

  const downloadPrescription = async (prescription: Prescription) => {
    try {
      // Request the prescription PDF from the API
      const response = await crudRequest<{ fileUrl: string }>(
        'GET',
        `/prescription/${prescription._id}/download`,
        undefined,
        { responseType: 'blob' }
      );
      
      if (response.success && response.data) {
        // Create a download link for the PDF
        const url = window.URL.createObjectURL(new Blob([response.data as any]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `prescription-${prescription._id}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        
        toast({
          title: "Download Started",
          description: `Downloading prescription for ${prescription.patient.personalDetails.name}`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: response.message || "Failed to download prescription",
        });
      }
    } catch (error) {
      console.error('Error downloading prescription:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to download prescription",
      });
    }
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
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                    {/* Template selection removed */}
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
