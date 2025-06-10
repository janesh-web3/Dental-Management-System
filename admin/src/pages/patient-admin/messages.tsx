import React, { useEffect, useState } from "react";
import { usePatientAuthContext } from "@/contexts";
import { getPatientMessages } from "@/utils/patientAuth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, AlertCircle, Calendar, User } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import PageTitle from "@/components/shared/page-title";

const PatientMessages: React.FC = () => {
  const { patientDetails } = usePatientAuthContext();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMessages = async () => {
      if (patientDetails._id) {
        try {
          setLoading(true);
          const response = await getPatientMessages(patientDetails._id);
          if (response.success && response.messages) {
            setMessages(response.messages);
          } else {
            setError(response.message || "Failed to fetch messages");
          }
        } catch (error) {
          console.error("Error fetching messages:", error);
          setError("An error occurred while fetching messages");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchMessages();
  }, [patientDetails._id]);

  // Sort messages by date (newest first)
  const sortedMessages = [...messages].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="container mx-auto p-4 md:p-6">
      <PageTitle 
        heading="Messages"
        text="View messages from your doctor and admin"
      />
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : sortedMessages.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">You don't have any messages yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedMessages.map((message) => (
            <Card key={message._id} className="overflow-hidden">
              <CardHeader className="bg-muted/50 pb-3">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    <span className="font-medium">
                      {message.sender === "doctor" 
                        ? `Dr. ${message.senderDetails?.name || "Unknown"}`
                        : message.sender === "admin"
                        ? "Admin"
                        : "System"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(message.date), "PPP p")}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <MessageCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="space-y-2">
                    {message.subject && (
                      <h3 className="font-medium">{message.subject}</h3>
                    )}
                    <p className="text-sm">{message.content}</p>
                    
                    {message.category && (
                      <Badge variant="outline" className="mt-2">
                        {message.category}
                      </Badge>
                    )}
                    
                    {message.relatedTo && (
                      <div className="text-xs text-muted-foreground mt-2">
                        Related to: {message.relatedTo}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientMessages;
