import { useEffect, useState } from 'react';
import { useSocketIO } from '@/hooks/use-socket';
import { useAdminContext } from '@/contexts/adminContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, AlertCircle, InfoIcon, Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function SocketDebugPanel() {
  const { socket, isConnected } = useSocketIO();
  const { adminDetails } = useAdminContext();
  const [events, setEvents] = useState<{event: string, data: any, timestamp: Date}[]>([]);
  const [testTitle, setTestTitle] = useState('Test Notification');
  const [testMessage, setTestMessage] = useState('This is a test notification');
  const [testType, setTestType] = useState<'info' | 'success' | 'warning' | 'error'>('info');
  
  useEffect(() => {
    if (!socket) return;
    
    const handleEvent = (data: any) => {
      console.log('Socket test event received:', data);
      setEvents(prev => [...prev, {
        event: 'test-event',
        data,
        timestamp: new Date()
      }]);
    };
      const handleNotification = (data: any) => {
      console.log('Socket notification received:', data);
      setEvents(prev => [...prev, {
        event: 'notification',
        data,
        timestamp: new Date()
      }]);
    };
    
    const handlePatientDeleted = (data: any) => {
      console.log('Socket patient:deleted event received:', data);
      setEvents(prev => [...prev, {
        event: 'patient:deleted',
        data,
        timestamp: new Date()
      }]);
    };
    
    socket.on('test-event', handleEvent);
    socket.on('notification', handleNotification);
    socket.on('patient:deleted', handlePatientDeleted);
      return () => {
      socket.off('test-event', handleEvent);
      socket.off('notification', handleNotification);
      socket.off('patient:deleted', handlePatientDeleted);
    };
  }, [socket]);
  
  const sendTestEvent = () => {
    if (!socket || !isConnected) return;
    
    socket.emit('test-event', {
      message: 'This is a test event',
      timestamp: new Date()
    });
  };
  
  const sendTestNotification = () => {
    if (!socket || !isConnected || !adminDetails._id) return;
    
    socket.emit('send_notification', {
      title: testTitle,
      description: testMessage,
      type: testType,
      receiver: adminDetails._id,
      receiverModel: 'User',
      createdBy: adminDetails._id,
      createdByModel: 'User',
      additionalData: {},
      createdAt: new Date().toISOString()
    });
  };
  
  const clearEvents = () => {
    setEvents([]);
  };
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString();
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Socket Debugging</CardTitle>
          <Badge variant={isConnected ? "success" : "destructive"}>
            {isConnected ? (
              <span className="flex items-center">
                <Check className="h-3 w-3 mr-1" /> Connected
              </span>
            ) : (
              <span className="flex items-center">
                <X className="h-3 w-3 mr-1" /> Disconnected
              </span>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <div className="flex justify-between">
              <div>
                <h3 className="text-sm font-semibold">Connection Details</h3>
                <p className="text-xs text-muted-foreground">
                  Socket ID: {socket?.id || 'Not connected'}
                </p>
                <p className="text-xs text-muted-foreground">
                  User ID: {adminDetails?._id || 'Unknown'}
                </p>
              </div>
              <div className="space-x-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={sendTestEvent}
                  disabled={!isConnected}
                >
                  Send Test Event
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={clearEvents}
                >
                  Clear Log
                </Button>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Send Test Notification</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <Input
                placeholder="Title"
                value={testTitle}
                onChange={(e) => setTestTitle(e.target.value)}
                className="md:col-span-1"
              />
              <Textarea
                placeholder="Message"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                className="md:col-span-2"
                rows={1}
              />
              <Select
                value={testType}
                onValueChange={(value) => setTestType(value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={sendTestNotification} 
              disabled={!isConnected || !testTitle || !testMessage}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" /> Send Test Notification
            </Button>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold mb-2">Event Log</h3>
            <div className="bg-muted/50 rounded-md p-2 h-64 overflow-y-auto">
              {events.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground p-4">
                  No events received yet
                </p>
              ) : (
                <div className="space-y-2">
                  {events.map((event, index) => (
                    <div key={index} className="text-xs border rounded-sm p-2">
                      <div className="flex justify-between items-start">
                        <span className="font-medium flex items-center">
                          {event.event === 'notification' ? (
                            <InfoIcon className="h-3 w-3 mr-1 text-blue-500" />
                          ) : (
                            <AlertCircle className="h-3 w-3 mr-1 text-amber-500" />
                          )}
                          {event.event}
                        </span>
                        <span className="text-muted-foreground">
                          {formatTime(event.timestamp)}
                        </span>
                      </div>
                      <pre className="mt-1 whitespace-pre-wrap break-all bg-muted p-1 rounded-sm text-[10px]">
                        {JSON.stringify(event.data, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default SocketDebugPanel;
