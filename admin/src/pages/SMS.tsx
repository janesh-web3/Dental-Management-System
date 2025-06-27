import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from 'react-toastify';
import { MessageSquare, Users } from 'lucide-react';

const SMS = () => {
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);

  const navigate = useNavigate();

  const handleSendSMS = () => {
    navigate('/sms/single');
  };

  const handleSendBulkSMS = () => {
    navigate('/sms/bulk');
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">SMS Communication</h1>
        <Button 
          variant="outline"
          onClick={() => setShowTemplateDialog(true)}
        >
          New Template
        </Button>
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
              <p className="text-muted-foreground">SMS functionality will be implemented here.</p>
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
              <p className="text-muted-foreground">Bulk SMS functionality will be implemented here.</p>
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

      {/* Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent>
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">New Template</h2>
            <p className="text-sm text-muted-foreground">Template creation will be implemented here.</p>
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setShowTemplateDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  toast.info('Template creation will be implemented');
                  setShowTemplateDialog(false);
                }}
              >
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SMS;