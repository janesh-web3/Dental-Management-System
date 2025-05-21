import React, { useEffect, useState } from "react";
import { useDoctorAuthContext } from "@/contexts/doctorAuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDoctorPatients } from "@/services/doctorService";
import { Skeleton } from "@/components/ui/skeleton";
import { User } from "lucide-react";

const DoctorPatients: React.FC = () => {
  const { doctorDetails } = useDoctorAuthContext();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatients = async () => {
      if (!doctorDetails._id) return;
      
      try {
        setLoading(true);
        const data = await getDoctorPatients(doctorDetails._id);
        setPatients(data.patients || []);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching patients:", err);
        setError(err.message || "Failed to load patients");
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [doctorDetails._id]);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Patients</h1>
        <p className="text-muted-foreground">
          Manage and view your patient records
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p>{error}</p>
          <button 
            className="text-sm underline mt-2"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Patient List</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((_, index) => (
                  <Skeleton key={index} className="h-16 w-full" />
                ))}
              </div>
            ) : patients.length > 0 ? (
              <div className="space-y-4">
                {patients.map((patient, index) => (
                  <div key={index} className="flex items-center p-3 border rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">{patient.personalDetails?.name || 'Unknown Patient'}</h3>
                      <p className="text-sm text-muted-foreground">
                        {patient.personalDetails?.email || 'No email'} | {patient.personalDetails?.phoneNumber || 'No phone'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                No patients found
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DoctorPatients;
