import { useState } from "react";
import { useNotification } from "@/hooks/use-notification";
import { useAdminContext } from "@/contexts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, AlertCircle, Bell, Users } from "lucide-react";

export function RoleBasedNotification() {
  const { sendNotification, isConnected } = useNotification();
  const { adminDetails } = useAdminContext();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"info" | "success" | "warning" | "error">("info");
  const [targetRoles, setTargetRoles] = useState<string[]>(["admin"]);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  
  const handleSendNotification = () => {
    if (!title || targetRoles.length === 0) {
      setStatus("error");
      return;
    }
    
    const success = sendNotification({
      title,
      description,
      type,
      targetRoles,
      createdBy: adminDetails._id,
      createdByModel: "User",
      saveToDatabase: true
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
  
  // Toggle role selection
  const toggleRole = (role: string) => {
    if (targetRoles.includes(role)) {
      setTargetRoles(targetRoles.filter(r => r !== role));
    } else {
      setTargetRoles([...targetRoles, role]);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Role-Based Notifications
        </CardTitle>
        <CardDescription>
          Send notifications to specific user roles
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm">
            Socket status: <span className={isConnected ? "text-green-500" : "text-red-500"}>
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
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
          <Label>Target Roles</Label>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={targetRoles.includes("admin") ? "default" : "outline"}
              onClick={() => toggleRole("admin")}
            >
              Admin
            </Button>
            <Button
              type="button"
              size="sm"
              variant={targetRoles.includes("doctor") ? "default" : "outline"}
              onClick={() => toggleRole("doctor")}
            >
              Doctor
            </Button>
            <Button
              type="button"
              size="sm"
              variant={targetRoles.includes("reception") ? "default" : "outline"}
              onClick={() => toggleRole("reception")}
            >
              Reception
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Select one or more roles to receive this notification
          </p>
        </div>
        
        <div className="flex justify-between items-center pt-4">
          <div>
            {status === "success" && (
              <div className="flex items-center text-sm text-green-500">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Notification sent successfully!
              </div>
            )}
            {status === "error" && (
              <div className="flex items-center text-sm text-red-500">
                <AlertCircle className="h-4 w-4 mr-1" />
                Failed to send notification
              </div>
            )}
          </div>
          <Button
            onClick={handleSendNotification}
            disabled={!isConnected || !title || targetRoles.length === 0}
            className="flex items-center gap-2"
          >
            <Bell className="h-4 w-4" />
            Send to {targetRoles.length} {targetRoles.length === 1 ? "Role" : "Roles"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
