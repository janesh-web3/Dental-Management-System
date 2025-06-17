import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, QrCode, User, Phone, Mail, MapPin, Calendar, Stethoscope, Receipt } from "lucide-react";
import { crudRequest } from "@/lib/api";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface PatientDetails {
  _id: string;
  personalDetails: {
    name: string;
    contactNumber: string;
    emailAddress: string;
    age: number;
    gender: string;
    address: string;
    profilePhoto?: {
      url: string;
    };
  };
  medicalDetails: Array<{
    medicalHistory: {
      bloodPressure?: string;
      diabetes?: boolean;
      thyroid?: boolean;
      bleedingDisorder?: boolean;
      asthma?: boolean;
      pregnancy?: boolean;
      allergies?: string;
      otherConditions?: string;
    };
    treatments: Array<{
      date: string;
      procedure: string;
      doctor: {
        name: string;
      };
      amount: number;
      paidAmount: number;
    }>;
  }>;
}

export function QRScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scannedPatient, setScannedPatient] = useState<PatientDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const fetchPatientDetails = async (patientId: string) => {
    try {
      setIsLoading(true);
      const response = await crudRequest("GET", `/patient/get-single-patient/${patientId}`);
      if (response.success) {
        setScannedPatient(response.data);
      } else {
        setError("Failed to fetch patient details");
      }
    } catch (err) {
      setError("Error fetching patient details");
      console.error("Error fetching patient details:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;

    const startScanner = () => {
      try {
        scanner = new Html5QrcodeScanner(
          "qr-reader",
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          false
        );

        scanner.render(
          async (decodedText) => {
            const patientId = decodedText.split("/").pop();
            if (patientId) {
              await fetchPatientDetails(patientId);
              if (scanner) {
                scanner.clear();
                scanner = null;
              }
              setIsScanning(false);
            }
          },
          (errorMessage) => {
            console.log(errorMessage);
          }
        );

        setIsScanning(true);
        setError(null);
      } catch (err) {
        setError("Failed to start camera. Please check camera permissions.");
        console.error("Error starting scanner:", err);
      }
    };

    const stopScanner = () => {
      if (scanner) {
        scanner.clear();
        scanner = null;
      }
      setIsScanning(false);
    };

    if (!scannedPatient) {
      startScanner();
    }

    return () => {
      stopScanner();
    };
  }, [scannedPatient]);

  const handleBackToScan = () => {
    setScannedPatient(null);
    setError(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading patient details...</span>
      </div>
    );
  }

  if (scannedPatient) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleBackToScan}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Scanner
          </Button>
          <Badge variant="outline" className="text-sm">
            Patient ID: {scannedPatient._id}
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage
                  src={scannedPatient.personalDetails.profilePhoto?.url}
                  alt={scannedPatient.personalDetails.name}
                />
                <AvatarFallback>
                  {scannedPatient.personalDetails.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">
                  {scannedPatient.personalDetails.name}
                </CardTitle>
                <CardDescription className="text-base">
                  {scannedPatient.personalDetails.gender}, {scannedPatient.personalDetails.age} years
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="medical">Medical History</TabsTrigger>
                <TabsTrigger value="treatments">Treatments</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Phone</p>
                          <p>{scannedPatient.personalDetails.contactNumber}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p>{scannedPatient.personalDetails.emailAddress || "N/A"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Address</p>
                          <p>{scannedPatient.personalDetails.address}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="medical" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Stethoscope className="h-5 w-5" />
                      Medical History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {scannedPatient.medicalDetails?.[0]?.medicalHistory ? (
                      <div className="grid grid-cols-2 gap-4">
                        {Object.entries(scannedPatient.medicalDetails[0].medicalHistory).map(
                          ([key, value]) =>
                            value && (
                              <div key={key} className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-primary" />
                                <div>
                                  <p className="text-sm text-muted-foreground">
                                    {key.replace(/([A-Z])/g, " $1").trim()}
                                  </p>
                                  <p>{typeof value === "boolean" ? (value ? "Yes" : "No") : value}</p>
                                </div>
                              </div>
                            )
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No medical history recorded</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="treatments" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Receipt className="h-5 w-5" />
                      Recent Treatments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {scannedPatient.medicalDetails?.[0]?.treatments?.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Procedure</TableHead>
                            <TableHead>Doctor</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-right">Paid</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {scannedPatient.medicalDetails[0].treatments.map((treatment, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  {format(new Date(treatment.date), "dd MMM yyyy")}
                                </div>
                              </TableCell>
                              <TableCell>{treatment.procedure}</TableCell>
                              <TableCell>{treatment.doctor.name}</TableCell>
                              <TableCell className="text-right">₹{treatment.amount}</TableCell>
                              <TableCell className="text-right">₹{treatment.paidAmount}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-muted-foreground">No treatments recorded</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Scan Patient QR Code</h2>
        <p className="text-muted-foreground">
          Position the QR code within the frame to scan
        </p>
      </div>
      
      {error && (
        <div className="text-destructive text-center p-4 bg-destructive/10 rounded-lg w-full max-w-md">
          {error}
        </div>
      )}

      <div id="qr-reader" className="w-full max-w-md" />

      {!isScanning && (
        <Button
          onClick={() => window.location.reload()}
          className="mt-4"
        >
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Restart Scanner
        </Button>
      )}
    </div>
  );
} 