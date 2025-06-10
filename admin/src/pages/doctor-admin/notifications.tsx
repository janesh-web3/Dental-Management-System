import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { 
  Loader2, Bell, Calendar, AlertCircle, CheckCircle, Clock, User
} from "lucide-react";
import { useDoctorAuthContext } from '@/contexts/doctorAuthContext';

interface Notification {
  type: "appointment" | "treatment" | "followup" | "patient";
  title: string;
  description: string;
  date: string;
  status?: string;
  id: string;
  patientName?: string;
}

const Notifications: React.FC = () => {
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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchNotifications();
  }, [doctorId]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      // This would be replaced with an actual API call in a real implementation
      // For now, we'll simulate the data
      setTimeout(() => {
        setNotifications([
          {
            type: "appointment",
            title: "Upcoming Appointment",
            description: "You have an appointment for dental checkup",
            date: "2025-05-22T10:30:00Z",
            status: "Accepted",
            id: "appt1",
            patientName: "John Doe"
          },
          {
            type: "appointment",
            title: "Upcoming Appointment",
            description: "You have an appointment for root canal treatment",
            date: "2025-05-22T14:00:00Z",
            status: "Accepted",
            id: "appt2",
            patientName: "Jane Smith"
          },
          {
            type: "treatment",
            title: "Treatment Update Required",
            description: "Root canal treatment in progress needs update",
            date: "2025-05-21T00:00:00Z",
            status: "In Progress",
            id: "treat1",
            patientName: "Jane Smith"
          },
          {
            type: "followup",
            title: "Patient Follow-up Due",
            description: "Follow-up check after cavity filling",
            date: "2025-05-22T00:00:00Z",
            id: "follow1",
            patientName: "Michael Johnson"
          },
          {
            type: "patient",
            title: "Patient Needs Treatment Plan",
            description: "Patient visited but no treatment plan created",
            date: "2025-05-20T00:00:00Z",
            id: "patient1",
            patientName: "Sarah Williams"
          },
        ]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load notifications",
      });
      setLoading(false);
    }
  };

  const markAsRead = (id: string) => {
    // In a real implementation, this would be an API call
    setNotifications(notifications.filter(notification => notification.id !== id));
    toast({
      title: "Notification dismissed",
      description: "The notification has been marked as read",
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "appointment":
        return <Calendar className="h-5 w-5 text-blue-500" />;
      case "treatment":
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case "followup":
        return <Clock className="h-5 w-5 text-green-500" />;
      case "patient":
        return <User className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const notificationDate = new Date(date);
    notificationDate.setHours(0, 0, 0, 0);
    
    if (notificationDate.getTime() === today.getTime()) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (notificationDate.getTime() === tomorrow.getTime()) {
      return `Tomorrow at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + 
             ` at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Notifications & Reminders</CardTitle>
              <CardDescription>
                Stay updated with your appointments, treatments, and follow-ups
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{notification.title}</h3>
                          <p className="text-sm text-muted-foreground">{notification.description}</p>
                          {notification.patientName && (
                            <p className="text-sm font-medium mt-1">Patient: {notification.patientName}</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="text-sm text-muted-foreground">
                            {formatDate(notification.date)}
                          </span>
                          {notification.status && (
                            <Badge variant={
                              notification.status === "Accepted" 
                                ? "default" 
                                : notification.status === "In Progress" 
                                  ? "secondary" 
                                  : "outline"
                            }>
                              {notification.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-3">
                        <div className="flex gap-2">
                          {notification.type === "appointment" && (
                            <Button variant="outline" size="sm">
                              View Appointment
                            </Button>
                          )}
                          {notification.type === "treatment" && (
                            <Button variant="outline" size="sm">
                              Update Treatment
                            </Button>
                          )}
                          {notification.type === "followup" && (
                            <Button variant="outline" size="sm">
                              Schedule Follow-up
                            </Button>
                          )}
                          {notification.type === "patient" && (
                            <Button variant="outline" size="sm">
                              Create Treatment Plan
                            </Button>
                          )}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">All caught up!</h3>
                  <p className="text-muted-foreground mt-1">
                    You have no pending notifications or reminders
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Notifications;
