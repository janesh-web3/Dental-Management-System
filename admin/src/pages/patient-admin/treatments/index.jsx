import React, { useEffect, useState } from "react";
import { usePatientAuthContext } from "@/contexts/patientAuthContext";
import { getPatientTreatments } from "@/utils/patientAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

const TreatmentCard = ({ treatment }) => {
  // Calculate progress percentage based on status
  const getProgressPercentage = (status) => {
    switch (status) {
      case "not-started":
        return 0;
      case "in-progress":
        return 50;
      case "completed":
        return 100;
      default:
        return 0;
    }
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    switch (status) {
      case "not-started":
        return <Badge className="bg-gray-100 text-gray-800">Not Started</Badge>;
      case "in-progress":
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-medium text-lg">{treatment.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Doctor: {treatment.doctorName}
            </p>
            <p className="text-sm text-muted-foreground">
              Start Date: {format(new Date(treatment.startDate), "MMMM d, yyyy")}
            </p>
          </div>
          {getStatusBadge(treatment.status)}
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{getProgressPercentage(treatment.status)}%</span>
          </div>
          <Progress value={getProgressPercentage(treatment.status)} />
        </div>
        
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Description</h4>
          <p className="text-sm text-muted-foreground">{treatment.description}</p>
        </div>
      </CardContent>
    </Card>
  );
};

const PatientTreatments = () => {
  const { patientDetails } = usePatientAuthContext();
  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTreatments = async () => {
      if (patientDetails && patientDetails._id) {
        setLoading(true);
        try {
          const response = await getPatientTreatments(patientDetails._id);
          if (response.success) {
            setTreatments(response.treatments);
          }
        } catch (error) {
          console.error("Error fetching treatments:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchTreatments();
  }, [patientDetails]);

  // Filter treatments by status
  const activeTreatments = treatments.filter(
    (treatment) => treatment.status === "in-progress" || treatment.status === "not-started"
  );
  
  const completedTreatments = treatments.filter(
    (treatment) => treatment.status === "completed"
  );

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Treatment Plans</h1>
        <p className="text-muted-foreground mt-2">
          View your current and past dental treatment plans
        </p>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="active">
            Active Treatments ({activeTreatments.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedTreatments.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="active">
          {loading ? (
            <p>Loading treatments...</p>
          ) : activeTreatments.length > 0 ? (
            activeTreatments.map((treatment) => (
              <TreatmentCard key={treatment._id} treatment={treatment} />
            ))
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">
                  You don't have any active treatment plans.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="completed">
          {loading ? (
            <p>Loading treatments...</p>
          ) : completedTreatments.length > 0 ? (
            completedTreatments.map((treatment) => (
              <TreatmentCard key={treatment._id} treatment={treatment} />
            ))
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">
                  You don't have any completed treatment plans.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PatientTreatments;
