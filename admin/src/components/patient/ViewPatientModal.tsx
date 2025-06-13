import { format } from "date-fns";
import { User, Activity, FileDigit } from "lucide-react";
import { useDoctorContext } from "@/contexts/DoctorContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Patient } from "@/types/patient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

interface ViewPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
}

export function ViewPatientModal({ isOpen, onClose, patient }: ViewPatientModalProps) {
  const { doctors } = useDoctorContext();
  const doctor = doctors.find((d) => d._id === patient.doctorId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Patient Details</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal">
              <User className="w-4 h-4 mr-2" />
              Personal
            </TabsTrigger>
            <TabsTrigger value="medical">
              <Activity className="w-4 h-4 mr-2" />
              Medical
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FileDigit className="w-4 h-4 mr-2" />
              Documents
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Name</h3>
                    <p className="text-sm text-muted-foreground">{patient.personalDetails.name}</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Age</h3>
                    <p className="text-sm text-muted-foreground">{patient.personalDetails.age}</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Gender</h3>
                    <p className="text-sm text-muted-foreground">{patient.personalDetails.gender}</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Phone</h3>
                    <p className="text-sm text-muted-foreground">{patient.personalDetails.phone}</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Address</h3>
                    <p className="text-sm text-muted-foreground">{patient.personalDetails.address}</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Check-up Date</h3>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(patient.personalDetails.checkUpDate), "PPP")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        (Nepali: {patient.personalDetails.checkUpDateNp})
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="medical">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Chief Complaint</h3>
                    <p className="text-sm text-muted-foreground">{patient.medicalDetails.chiefComplaint}</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Medical History</h3>
                    <p className="text-sm text-muted-foreground">{patient.medicalDetails.medicalHistory}</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Follow-up Date</h3>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(patient.medicalDetails.followUpDate), "PPP")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        (Nepali: {patient.medicalDetails.followUpDateNp})
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Treatment Plans</h3>
                  {patient.treatmentPlans.map((plan, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Treatment Date</h4>
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(plan.treatmentDate), "PPP")}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              (Nepali: {plan.treatmentDateNp})
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Follow-up Date</h4>
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(plan.followUpDate), "PPP")}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              (Nepali: {plan.followUpDateNp})
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Completion Date</h4>
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(plan.completionDate), "PPP")}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              (Nepali: {plan.completionDateNp})
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Treatment Details</h4>
                          <p className="text-sm text-muted-foreground">{plan.treatmentDetails}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Documents</h3>
                  {patient.documents && patient.documents.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                      {patient.documents.map((doc, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <p className="text-sm font-medium">{doc.name}</p>
                          <p className="text-sm text-muted-foreground">{doc.type}</p>
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            View Document
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No documents available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
} 