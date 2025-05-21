import React, { useEffect, useState } from "react";
import { usePatientAuthContext } from "@/contexts/patientAuthContext";
import { getPatientBills } from "@/utils/patientAuth.ts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Calendar, Stethoscope, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import PageTitle from "@/components/shared/page-title.tsx";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const PatientTreatments: React.FC = () => {
  const { patientDetails } = usePatientAuthContext();
  const [treatments, setTreatments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTreatments = async () => {
      if (patientDetails._id) {
        try {
          setLoading(true);
          const response = await getPatientBills(patientDetails._id);
          if (response.success && response.bills) {
            setTreatments(response.bills);
          } else {
            setError(response.message || "Failed to fetch treatment data");
          }
        } catch (error) {
          console.error("Error fetching treatments:", error);
          setError("An error occurred while fetching treatment data");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchTreatments();
  }, [patientDetails._id]);

  // Sort treatments by date (newest first)
  const sortedTreatments = [...treatments].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="container p-4 md:p-6 max-w-7xl mx-auto">
      <PageTitle 
        heading="My Treatments"
        text="View and manage your dental treatment history"
      >
        <Button asChild variant="outline">
          <Link to="/patient/bills">View Billing History</Link>
        </Button>
      </PageTitle>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : sortedTreatments.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No treatment records found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {sortedTreatments.map((treatment, index) => {
            // Calculate completion percentage
            const completionPercentage = treatment.totalAmount > 0 
              ? Math.round((treatment.paidAmount / treatment.totalAmount) * 100) 
              : 0;
            
            return (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      <span>
                        {treatment.date ? format(new Date(treatment.date), "MMMM d, yyyy") : "N/A"}
                      </span>
                    </CardTitle>
                    <Badge 
                      variant={treatment.isCompleted ? "default" : "outline"}
                      className="mt-2 md:mt-0"
                    >
                      {treatment.isCompleted ? "Completed" : "In Progress"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Treatment Progress</span>
                      <span className="text-sm font-medium">{completionPercentage}%</span>
                    </div>
                    <Progress value={completionPercentage} className="h-2" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <span className="text-sm text-muted-foreground">Total Amount</span>
                      <p className="font-medium">₹{treatment.totalAmount.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Paid Amount</span>
                      <p className="font-medium">₹{treatment.paidAmount.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Remaining</span>
                      <p className="font-medium">₹{treatment.remainingAmount.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value={`treatment-${index}`}>
                      <AccordionTrigger>Treatment Details</AccordionTrigger>
                      <AccordionContent>
                        {treatment.treatments && treatment.treatments.length > 0 ? (
                          <div className="space-y-4 mt-2">
                            {treatment.treatments.map((item: any, i: number) => (
                              <div key={i} className="border rounded-md p-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-2">
                                    <Stethoscope className="h-4 w-4 text-primary" />
                                    <span className="font-medium">
                                      Tooth #{item.toothNumber}
                                    </span>
                                  </div>
                                  {item.isCompleted && (
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  )}
                                </div>
                                
                                <div className="mt-2 text-sm">
                                  <span className="text-muted-foreground">Procedure: </span>
                                  <span>{item.procedure}</span>
                                </div>
                                
                                <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Amount: </span>
                                    <span>₹{item.amount.toFixed(2)}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Paid: </span>
                                    <span>₹{item.paid.toFixed(2)}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Due: </span>
                                    <span>₹{item.remaining.toFixed(2)}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-sm">No detailed treatment information available</p>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PatientTreatments;
