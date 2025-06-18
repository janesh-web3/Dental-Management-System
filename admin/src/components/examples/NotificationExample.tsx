import { useState, useEffect } from "react";
import { useNotification } from "@/hooks/use-notification";
import { useAdminContext, useDoctorContext } from "@/contexts";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "react-toastify";

export function NotificationExample() {
  const { sendNotification, isConnected, notifications } = useNotification();
  const { adminDetails } = useAdminContext();
  const { doctors } = useDoctorContext();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"info" | "success" | "warning" | "error">("info");
  const [receiverType, setReceiverType] = useState<"User" | "Doctor" | "Patient">("User");
  const [receiver, setReceiver] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  
  // Track how many notifications we've received
  const [notificationCount, setNotificationCount] = useState(0);
  
  // Update count when new notifications come in
  useEffect(() => {
    setNotificationCount(notifications.length);
  }, [notifications]);
  
  const handleSendNotification = () => {
    if (!title || !receiver) {
      setStatus("error");
      return;
    }
    
    const success = sendNotification({
      title,
      description,
      type,
      receiver,
      receiverModel: receiverType,
      createdBy: adminDetails._id,
      createdByModel: "User",
    });
    
    setStatus(success ? "success" : "error");
    
    if (success) {
      // Reset form on success
      setTitle("");
      setDescription("");
      setType("info");
      
      // Clear status after 3 seconds
      setTimeout(() => {
        setStatus("idle");
      }, 3000);
    }
  };
  
  // Function to send a self-notification (to demonstrate toast)
  const handleTestNotification = () => {
    if (!adminDetails._id) {
      toast.error("Admin ID not available");
      return;
    }
    
    const types: Array<"info" | "success" | "warning" | "error"> = ["info", "success", "warning", "error"];
    const randomType = types[Math.floor(Math.random() * types.length)];
    
    sendNotification({
      title: `Test ${randomType} notification`,
      description: `This is a test ${randomType} notification sent at ${new Date().toLocaleTimeString()}`,
      type: randomType,
      receiver: adminDetails._id,
      receiverModel: "User",
      createdBy: adminDetails._id,
      createdByModel: "User",
    });
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Custom Notification</CardTitle>
        <CardDescription>
          Send a notification to any user in the system
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="text-sm">
            Socket status: <span className={isConnected ? "text-green-500" : "text-red-500"}>
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
          <div className="text-sm">
            Notifications received: <span className="font-medium">{notificationCount}</span>
          </div>
          <Button 
            onClick={handleTestNotification}
            variant="outline"
            disabled={!isConnected || !adminDetails._id}
            className="ml-2"
          >
            Test Notification
          </Button>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            placeholder="Notification title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Notification details"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={type}
              onValueChange={(value) => setType(value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="receiverType">Receiver Type</Label>
            <Select
              value={receiverType}
              onValueChange={(value) => {
                setReceiverType(value as any);
                setReceiver(""); // Reset receiver when type changes
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select receiver type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="User">Admin</SelectItem>
                <SelectItem value="Doctor">Doctor</SelectItem>
                <SelectItem value="Patient">Patient</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="receiver">Receiver</Label>
          {receiverType === "Doctor" && doctors.length > 0 ? (
            <Select value={receiver} onValueChange={setReceiver}>
              <SelectTrigger>
                <SelectValue placeholder="Select a doctor" />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((doctor) => (
                  <SelectItem key={doctor._id} value={doctor._id}>
                    {doctor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id="receiver"
              placeholder="Receiver ID"
              value={receiver}
              onChange={(e) => setReceiver(e.target.value)}
            />
          )}
          <p className="text-xs text-muted-foreground">
            {receiverType === "User" && "Enter the Admin user ID"}
            {receiverType === "Doctor" && "Select or enter the Doctor ID"}
            {receiverType === "Patient" && "Enter the Patient ID"}
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div>
          {status === "success" && (
            <p className="text-sm text-green-500">Notification sent successfully!</p>
          )}
          {status === "error" && (
            <p className="text-sm text-red-500">Failed to send notification</p>
          )}
        </div>
        <Button 
          onClick={handleSendNotification} 
          disabled={!isConnected || !title || !receiver}
        >
          Send Notification
        </Button>
      </CardFooter>
    </Card>
  );
} 