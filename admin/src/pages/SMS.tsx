import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "react-toastify";
import { 
  MessageSquare, 
  Users, 
  FileText, 
  BarChart3, 
  Settings
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SMSHistoryPage from "./sms/SMSHistory";
import EnhancedSMSTemplateManager from "@/components/sms/EnhancedSMSTemplateManager";
import PatientGroupManager from "@/components/sms/PatientGroupManager";
import SMSDashboard from "@/components/sms/SMSDashboard";

const SMS = () => {
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);

  const navigate = useNavigate();

  const handleSendSMS = () => {
    navigate("/sms/single");
  };

  const handleSendBulkSMS = () => {
    navigate("/sms/bulk");
  };

  return (
    <div className="container mx-auto py-6">
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard" className="flex items-center">
            <BarChart3 className="w-4 h-4 mr-2" />
            <span className="text-md font-semibold">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center">
            <FileText className="w-4 h-4 mr-2" />
            <span className="text-md font-semibold">Templates</span>
          </TabsTrigger>
          <TabsTrigger value="groups" className="flex items-center">
            <Settings className="w-4 h-4 mr-2" />
            <span className="text-md font-semibold">Groups</span>
          </TabsTrigger>
          <TabsTrigger value="sms" className="flex items-center">
            <MessageSquare className="w-4 h-4 mr-2" />
            <span className="text-md font-semibold">Send SMS</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center">
            <span className="text-md font-semibold">History</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <SMSDashboard />
        </TabsContent>

        <TabsContent value="templates">
          <EnhancedSMSTemplateManager />
        </TabsContent>

        <TabsContent value="groups">
          <PatientGroupManager />
        </TabsContent>

        <TabsContent value="sms">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">SMS Communication</h1>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Send SMS
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Send individual SMS messages to patients
                  </p>
                  <div className="flex justify-end">
                    <Button onClick={handleSendSMS}>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Send SMS
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Bulk SMS
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Send SMS to multiple patients using groups and filters
                  </p>
                  <div className="flex justify-end">
                    <Button onClick={handleSendBulkSMS}>
                      <Users className="w-4 h-4 mr-2" />
                      Send Bulk SMS
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <SMSHistoryPage />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SMS;