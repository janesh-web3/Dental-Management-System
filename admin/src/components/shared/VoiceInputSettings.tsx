import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic } from "lucide-react";
import { useVoiceInput } from '@/contexts/VoiceInputContext';
import { toast } from 'react-toastify';

export function VoiceInputSettings() {
  const { isVoiceInputEnabled, setVoiceInputEnabled } = useVoiceInput();

  const handleToggleVoiceInput = (checked: boolean) => {
    setVoiceInputEnabled(checked);
    if (checked) {
      toast.success('Voice input is now enabled');
    } else {
      toast.info('Voice input is now disabled');
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium flex items-center space-x-2">
          <Mic className="h-5 w-5" />
          <span>Voice Input Settings</span>
        </CardTitle>        <CardDescription>
          Control voice recognition features throughout the application (disabled by default)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between py-2">
          <div className="space-y-0.5">
            <Label htmlFor="voice-recognition">Enable Voice Recognition</Label>            <p className="text-sm text-muted-foreground">
              Voice input is disabled by default. When enabled, voice input buttons will appear next to form fields.
            </p>
          </div>
          <Switch
            id="voice-recognition"
            checked={isVoiceInputEnabled}
            onCheckedChange={handleToggleVoiceInput}
          />
        </div>
      </CardContent>
    </Card>
  );
}
