import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import ViewPatientDrawer from "@/components/patient/ViewPatientDrawer";
import { crudRequest } from "@/lib/api";
import { Patient } from "@/types/patient";

export default function PatientView() {
  const { patientId } = useParams<{ patientId: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState<boolean>(false);
  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        setLoading(true);
        const response = await crudRequest<any>(
          "GET",
          `/patients/public/${patientId}`
        );
        console.log("Fetched patient data:", response);
        setPatient(response.patient);
        setLoading(false);
        // Automatically open the drawer when patient data is loaded
        setIsViewDrawerOpen(true);
      } catch (err) {
        console.error("Error fetching patient data:", err);
        setError("Failed to load patient data. Please try again later.");
        setLoading(false);
      }
    };

    if (patientId) {
      fetchPatientData();
    }
  }, [patientId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="mt-4 text-lg">Loading patient data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Patient Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              The patient information you are looking for could not be found.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 pb-16">
      <div className="flex flex-col space-y-6">
        {/* Patient Header */}{" "}
        <Card className="w-full">
          <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
            {" "}
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <Avatar className="w-20 h-20">
                <AvatarImage
                  src={patient.personalDetails.profilePhoto?.url}
                  alt={patient.personalDetails.name}
                />
                <AvatarFallback className="text-xl">
                  {patient.personalDetails.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl font-bold">
                  {patient.personalDetails.name}
                </CardTitle>
                <CardDescription className="text-lg">
                  ID: {patient._id}
                </CardDescription>
              </div>
            </div>{" "}
            <div className="mt-4 md:mt-0">
              {!isViewDrawerOpen && (
                <button
                  onClick={() => {
                    window.location.reload();
                  }}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                >
                  Reload
                </button>
              )}
            </div>
          </CardHeader>{" "}
          <CardContent>
            {/* Render the drawer component outside the CardContent */}
          </CardContent>{" "}
          {/* Move the drawer component here */}
          {patient && (
            <ViewPatientDrawer
              patient={patient}
              isOpen={isViewDrawerOpen}
              onClose={() => {
                console.log("Drawer closed");
                setIsViewDrawerOpen(false);
              }}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
