import { useState, useEffect } from "react";
import { useSocketIO } from "@/hooks/use-socket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export function SocketExample() {
  const [message, setMessage] = useState("");
  const [room, setRoom] = useState("general");
  const [receivedMessages, setReceivedMessages] = useState<{text: string, time: Date}[]>([]);
  const [notifications, setNotifications] = useState<string[]>([]);
  
  // Initialize socket with event handlers
  const { isConnected, emit, joinRoom, socket } = useSocketIO(
    ["chat_message", "appointment_notification", "patient_notification"],
    {
      chat_message: (data) => {
        setReceivedMessages((prev) => [
          ...prev, 
          { text: data.message, time: new Date() }
        ]);
      },
      appointment_notification: (data) => {
        setNotifications((prev) => [
          ...prev,
          `New appointment: ${data.firstName} ${data.lastName} at ${data.appointmentTime}`
        ]);
      },
      patient_notification: (data) => {
        setNotifications((prev) => [
          ...prev,
          `New patient: ${data.personalDetails?.name || "Unknown"}`
        ]);
      },
    }
  );

  useEffect(() => {
    // Join the room on component mount or when room changes
    if (isConnected && room) {
      joinRoom(room);
    }
  }, [isConnected, room, joinRoom]);

  // Send a message
  const sendMessage = () => {
    if (!message.trim()) return;
    
    emit("chat_message", {
      message,
      room,
      sender: "User",
      timestamp: new Date().toISOString(),
    });
    
    setMessage("");
  };

  // Format time for messages
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: true,
    }).format(date);
  };

  return (
    <div className="space-y-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Socket.IO Example
            {isConnected ? (
              <Badge variant="success" className="bg-green-500">Connected</Badge>
            ) : (
              <Badge variant="destructive">Disconnected</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Socket ID: {socket?.id || "Not connected"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Join Room</label>
            <div className="flex space-x-2">
              <Input
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="Room name..."
              />
              <Button onClick={() => joinRoom(room)}>Join</Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Send Message</label>
            <div className="flex space-x-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <Button onClick={sendMessage}>Send</Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Received Messages</label>
            <Card>
              <ScrollArea className="h-[200px]">
                {receivedMessages.length === 0 ? (
                  <p className="p-4 text-center text-muted-foreground">No messages yet</p>
                ) : (
                  <ul className="divide-y p-2">
                    {receivedMessages.map((msg, index) => (
                      <li key={index} className="py-2">
                        <div className="flex justify-between">
                          <span className="font-medium">{msg.text}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(msg.time)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </ScrollArea>
            </Card>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Real-time Notifications</label>
            <Card>
              <ScrollArea className="h-[200px]">
                {notifications.length === 0 ? (
                  <p className="p-4 text-center text-muted-foreground">No notifications yet</p>
                ) : (
                  <ul className="divide-y p-2">
                    {notifications.map((notification, index) => (
                      <li key={index} className="py-2">
                        <div className="flex justify-between">
                          <span className="font-medium">{notification}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </ScrollArea>
            </Card>
          </div>
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          This is a demonstration of Socket.IO integration with React.
        </CardFooter>
      </Card>
    </div>
  );
} 