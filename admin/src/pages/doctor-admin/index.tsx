import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { Loader2 } from "lucide-react";
import { useDoctorAuthContext } from "@/contexts/doctorAuthContext";

import Dashboard from './dashboard';
import Appointments from './appointments';
import Patients from './patients';
import Treatments from './treatments';
import Prescriptions from './prescriptions';
import Billing from './billing';
import Analytics from './analytics';
import Profile from './profile';
import Notifications from './notifications';

const DoctorAdmin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
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

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Doctor Admin Panel</CardTitle>
          <CardDescription>
            Manage your patients, appointments, treatments, and more
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 md:grid-cols-9 mb-8">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="patients">Patients</TabsTrigger>
          <TabsTrigger value="treatments">Treatments</TabsTrigger>
          <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <Dashboard doctorId={doctorId} />
        </TabsContent>
        
        <TabsContent value="appointments">
          <Appointments doctorId={doctorId} />
        </TabsContent>
        
        <TabsContent value="patients">
          <Patients doctorId={doctorId} />
        </TabsContent>
        
        <TabsContent value="treatments">
          <Treatments doctorId={doctorId} />
        </TabsContent>
        
        <TabsContent value="prescriptions">
          <Prescriptions doctorId={doctorId} />
        </TabsContent>
        
        <TabsContent value="billing">
          <Billing doctorId={doctorId} />
        </TabsContent>
        
        <TabsContent value="analytics">
          <Analytics doctorId={doctorId} />
        </TabsContent>
        
        <TabsContent value="profile">
          <Profile doctorId={doctorId} />
        </TabsContent>
        
        <TabsContent value="notifications">
          <Notifications doctorId={doctorId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DoctorAdmin;
