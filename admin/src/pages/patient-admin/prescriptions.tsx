import React, { useState, useEffect } from "react";
import { crudRequest } from "@/lib/api";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  Loader2,
  Search,
  Calendar,
  FileText,
  Pill,
  Clock,
  AlertCircle,
} from "lucide-react";
import { usePatientAuthContext } from "@/contexts/patientAuthContext";

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes?: string;
}

interface Prescription {
  _id: string;
  patient: string;
  doctor: {
    name: string;
    specialization: string;
  };
  diagnosis: string;
  medications: Medication[];
  tests?: string;
  nextVisitDate?: string;
  instructions?: string;
  createdAt: string;
  updatedAt: string;
}

const Prescriptions: React.FC = () => {
  const { patientDetails } = usePatientAuthContext();
  const patientId = patientDetails?._id;
  const { toast } = useToast();

  const [loading, setLoading] = useState<boolean>(true);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<Prescription[]>([]);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (patientId) {
      fetchPrescriptions();
    }
  }, [patientId]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredPrescriptions(prescriptions);
    } else {
      const filtered = prescriptions.filter(
        (prescription) =>
          prescription.diagnosis.toLowerCase().includes(searchQuery.toLowerCase()) ||
          prescription.doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          prescription.medications.some(med => 
            med.name.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
      setFilteredPrescriptions(filtered);
    }
  }, [searchQuery, prescriptions]);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const response = await crudRequest<any>(
        "GET",
        `/prescription/patient/${patientId}`
      );
      console.log("hello");
      console.log(response);

      if (response && Array.isArray(response.data)) {
        setPrescriptions(response.data);
        setFilteredPrescriptions(response.data);
      } else {
        setPrescriptions([]);
        setFilteredPrescriptions([]);
      }
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load prescriptions",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "PPP");
    } catch (error) {
      return "Invalid date";
    }
  };

  const viewPrescriptionDetails = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>My Prescriptions</CardTitle>
              <CardDescription>View all your prescriptions</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search prescriptions..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
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
                      <TableHead>Date</TableHead>
                      <TableHead>Diagnosis</TableHead>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Medications</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPrescriptions.length > 0 ? (
                      filteredPrescriptions.map((prescription) => (
                        <TableRow key={prescription._id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>{formatDate(prescription.createdAt)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{prescription.diagnosis}</div>
                          </TableCell>
                          <TableCell>
                            {prescription.doctor.name || "Unknown Doctor"}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {prescription.medications.slice(0, 2).map((med, index) => (
                                <Badge key={index} variant="outline" className="bg-primary/10">
                                  <Pill className="h-3 w-3 mr-1" />
                                  {med.name}
                                </Badge>
                              ))}
                              {prescription.medications.length > 2 && (
                                <Badge variant="outline">
                                  +{prescription.medications.length - 2} more
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => viewPrescriptionDetails(prescription)}
                            >
                              View Details
                            </Button>
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
            </>
          )}
        </CardContent>
      </Card>

      {/* Prescription Details Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
          {selectedPrescription ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">
                  Prescription Details
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Prescription Header */}
                <div className="flex flex-col md:flex-row justify-between gap-4 border-b pb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{selectedPrescription.diagnosis}</h3>
                    <p className="text-sm text-muted-foreground">
                      Prescribed by: {selectedPrescription.doctor.name || "Unknown Doctor"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDate(selectedPrescription.createdAt)}</span>
                    </div>
                    {selectedPrescription.nextVisitDate && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Next visit: {formatDate(selectedPrescription.nextVisitDate)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Medications */}
                <div>
                  <h3 className="font-medium text-md mb-3 flex items-center gap-2">
                    <Pill className="h-4 w-4" /> Medications
                  </h3>
                  <div className="space-y-3">
                    {selectedPrescription.medications.map((med, index) => (
                      <Card key={index} className="bg-muted/30">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold">{med.name}</h4>
                              <p className="text-sm">
                                {med.dosage} - {med.frequency} for {med.duration}
                              </p>
                              {med.notes && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  Note: {med.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Tests */}
                {selectedPrescription.tests && (
                  <div>
                    <h3 className="font-medium text-md mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" /> Tests Recommended
                    </h3>
                    <Card className="bg-muted/30">
                      <CardContent className="p-4">
                        <p>{selectedPrescription.tests}</p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Instructions */}
                {selectedPrescription.instructions && (
                  <div>
                    <h3 className="font-medium text-md mb-3 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" /> Instructions
                    </h3>
                    <Card className="bg-muted/30">
                      <CardContent className="p-4">
                        <p>{selectedPrescription.instructions}</p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Print Button */}
                <div className="flex justify-end">
                  <Button
                    onClick={() => {
                      window.print();
                    }}
                    className="print:hidden"
                  >
                    Print Prescription
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Prescriptions;
