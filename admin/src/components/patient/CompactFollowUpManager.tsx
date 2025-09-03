import React, { useState } from 'react';
import { Plus, Calendar, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { FollowUp } from '@/types/patient';

interface CompactFollowUpManagerProps {
  followUps: FollowUp[];
  onFollowUpChange: (followUps: FollowUp[]) => void;
  treatmentPlanId?: string;
  className?: string;
}

const CompactFollowUpManager: React.FC<CompactFollowUpManagerProps> = ({
  followUps,
  onFollowUpChange,
  treatmentPlanId,
  className = ""
}) => {
  const [isAddingFollowUp, setIsAddingFollowUp] = useState(false);
  const [quickFollowUp, setQuickFollowUp] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    type: "Routine Check" as const,
    reason: ""
  });

  const followUpTypes = [
    "Treatment Review",
    "Orthodontic Check", 
    "Pain Assessment",
    "Routine Check",
    "Post-Surgery",
    "Cleaning",
    "X-Ray Review",
    "Other"
  ];

  const addQuickFollowUp = () => {
    if (!quickFollowUp.date) return;

    const followUp: FollowUp = {
      _id: `temp-${Date.now()}`,
      date: quickFollowUp.date,
      reason: quickFollowUp.reason,
      type: quickFollowUp.type as any,
      linkedTo: {
        type: "treatment",
        entityId: treatmentPlanId || ""
      },
      completed: false,
      notes: "",
      createdAt: new Date().toISOString()
    };

    onFollowUpChange([...followUps, followUp]);
    setQuickFollowUp({
      date: format(new Date(), 'yyyy-MM-dd'),
      type: "Routine Check",
      reason: ""
    });
    setIsAddingFollowUp(false);
  };

  const removeFollowUp = (id: string) => {
    onFollowUpChange(followUps.filter(fu => fu._id !== id));
  };

  const getTypeColor = (type: string) => {
    const colors = {
      "Treatment Review": "bg-blue-100 text-blue-700",
      "Orthodontic Check": "bg-purple-100 text-purple-700", 
      "Pain Assessment": "bg-red-100 text-red-700",
      "Routine Check": "bg-green-100 text-green-700",
      "Post-Surgery": "bg-orange-100 text-orange-700",
      "Cleaning": "bg-cyan-100 text-cyan-700",
      "X-Ray Review": "bg-gray-100 text-gray-700",
      "Other": "bg-yellow-100 text-yellow-700"
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Follow-ups ({followUps.length})
        </h4>
        {!isAddingFollowUp && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAddingFollowUp(true)}
            className="h-8 px-2 text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add
          </Button>
        )}
      </div>

      {/* Existing Follow-ups - Compact List */}
      {followUps.length > 0 && (
        <div className="space-y-2 max-h-32 overflow-y-auto bg-muted/50 rounded-md p-2 border">
          {followUps.map((followUp) => (
            <div
              key={followUp._id}
              className="flex items-center justify-between bg-background rounded px-2 py-1.5 text-xs border hover:bg-muted/20 transition-colors"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Badge className={`text-xs ${getTypeColor(followUp.type)} px-1.5 py-0.5`}>
                  {followUp.type}
                </Badge>
                <span className="text-muted-foreground truncate">
                  {format(new Date(followUp.date), 'MMM dd, yyyy')}
                </span>
                {followUp.reason && (
                  <span className="text-muted-foreground/70 truncate">
                    - {followUp.reason}
                  </span>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFollowUp(followUp._id!)}
                className="h-6 w-6 p-0 text-red-500 hover:text-red-700 flex-shrink-0"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Quick Add Form */}
      {isAddingFollowUp && (
        <div className="bg-primary/5 border border-primary/20 rounded-md p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Date</Label>
              <Input
                type="date"
                value={quickFollowUp.date}
                onChange={(e) => setQuickFollowUp({ ...quickFollowUp, date: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Type</Label>
              <Select 
                value={quickFollowUp.type} 
                onValueChange={(value) => setQuickFollowUp({ ...quickFollowUp, type: value as any })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {followUpTypes.map((type) => (
                    <SelectItem key={type} value={type} className="text-xs">{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-1">
            <Label className="text-xs">Reason (Optional)</Label>
            <Input
              placeholder="Why is this follow-up needed?"
              value={quickFollowUp.reason}
              onChange={(e) => setQuickFollowUp({ ...quickFollowUp, reason: e.target.value })}
              className="h-8 text-xs"
            />
          </div>

          <div className="flex justify-end gap-1">
            <Button 
              type="button"
              variant="outline" 
              size="sm"
              onClick={() => setIsAddingFollowUp(false)}
              className="h-7 px-2 text-xs"
            >
              Cancel
            </Button>
            <Button 
              type="button"
              size="sm"
              onClick={addQuickFollowUp}
              disabled={!quickFollowUp.date}
              className="h-7 px-2 text-xs"
            >
              <Check className="w-3 h-3 mr-1" />
              Add
            </Button>
          </div>
        </div>
      )}

      {followUps.length === 0 && !isAddingFollowUp && (
        <div className="text-center py-3 text-xs text-muted-foreground bg-muted/30 rounded-md border-dashed border border-muted">
          No follow-ups scheduled
        </div>
      )}
    </div>
  );
};

export default CompactFollowUpManager;