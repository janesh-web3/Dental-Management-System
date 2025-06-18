import DashboardLayout from "@/components/layout/dashboard-layout";
import { SocketExample } from "@/components/examples/SocketExample";
import { NotificationExample } from "@/components/examples/NotificationExample";
import { RoleBasedNotification } from "@/components/examples/RoleBasedNotification";
import PageTitle from "@/components/shared/page-title";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SocketExamplePage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <PageTitle 
          heading="Socket.IO Example" 
          text="Real-time communication with Socket.IO and notifications"
        />
        
        <Tabs defaultValue="socket" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="socket">Socket.IO Example</TabsTrigger>
            <TabsTrigger value="notification">User Notification</TabsTrigger>
            <TabsTrigger value="role-notification">Role-Based Notification</TabsTrigger>
          </TabsList>
          
          <TabsContent value="socket" className="mt-6">
            <SocketExample />
          </TabsContent>
          
          <TabsContent value="notification" className="mt-6">
            <NotificationExample />
          </TabsContent>
          
          <TabsContent value="role-notification" className="mt-6">
            <RoleBasedNotification />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
} 