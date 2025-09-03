import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Calendar, Clock, User, FileText, Trash2, Edit3, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { FollowUp } from '@/types/patient';

interface FollowUpManagerProps {
  followUps: FollowUp[];
  onFollowUpChange: (followUps: FollowUp[]) => void;
  treatmentPlanId?: string;
  className?: string;
}

const FollowUpManager: React.FC<FollowUpManagerProps> = ({
  followUps,
  onFollowUpChange,
  treatmentPlanId,
  className = ""
}) => {
  const [isAddingFollowUp, setIsAddingFollowUp] = useState(false);
  const [editingFollowUp, setEditingFollowUp] = useState<FollowUp | null>(null);
  
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

  const linkedToTypes = [
    { value: "treatment", label: "Treatment Plan" },
    { value: "groupTreatment", label: "Group Treatment" },
    { value: "tooth", label: "Specific Tooth" },
    { value: "medicalRecord", label: "Medical Record" }
  ];

  const [newFollowUp, setNewFollowUp] = useState<Partial<FollowUp>>({
    date: format(new Date(), 'yyyy-MM-dd'),
    reason: "",
    type: "Routine Check",
    linkedTo: {
      type: "treatment",
      entityId: treatmentPlanId || ""
    },
    completed: false,
    notes: ""
  });

  const addFollowUp = () => {
    if (!newFollowUp.date) return;

    const followUp: FollowUp = {
      _id: `temp-${Date.now()}`,
      date: newFollowUp.date!,
      reason: newFollowUp.reason || "",
      type: newFollowUp.type as any || "Routine Check",
      linkedTo: newFollowUp.linkedTo || {
        type: "treatment",
        entityId: treatmentPlanId || ""
      },
      completed: false,
      notes: newFollowUp.notes || "",
      createdAt: new Date().toISOString()
    };

    onFollowUpChange([...followUps, followUp]);
    setNewFollowUp({
      date: format(new Date(), 'yyyy-MM-dd'),
      reason: "",
      type: "Routine Check",
      linkedTo: {
        type: "treatment",
        entityId: treatmentPlanId || ""
      },
      completed: false,
      notes: ""
    });
    setIsAddingFollowUp(false);
  };

  const updateFollowUp = (id: string, updates: Partial<FollowUp>) => {
    const updated = followUps.map(fu => 
      fu._id === id ? { ...fu, ...updates } : fu
    );
    onFollowUpChange(updated);
  };

  const deleteFollowUp = (id: string) => {
    onFollowUpChange(followUps.filter(fu => fu._id !== id));
  };

  const getTypeColor = (type: string) => {
    const colors = {
      "Treatment Review": "bg-blue-100 text-blue-800",
      "Orthodontic Check": "bg-purple-100 text-purple-800",
      "Pain Assessment": "bg-red-100 text-red-800",
      "Routine Check": "bg-green-100 text-green-800",
      "Post-Surgery": "bg-orange-100 text-orange-800",
      "Cleaning": "bg-cyan-100 text-cyan-800",
      "X-Ray Review": "bg-gray-100 text-gray-800",
      "Other": "bg-yellow-100 text-yellow-800"
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Follow-up Schedule
        </h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsAddingFollowUp(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Follow-up
        </Button>
      </div>

      {/* Follow-up List */}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        <AnimatePresence>
          {followUps.map((followUp) => (
            <motion.div
              key={followUp._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="relative"
            >
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge className={getTypeColor(followUp.type)}>
                          {followUp.type}
                        </Badge>
                        {followUp.completed && (
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            <Check className="w-3 h-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(followUp.date), 'PPP')}
                        </div>
                      </div>

                      {followUp.reason && (
                        <p className="text-sm text-gray-700">{followUp.reason}</p>
                      )}

                      {followUp.notes && (
                        <p className="text-xs text-gray-500 italic">{followUp.notes}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 ml-4">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => updateFollowUp(followUp._id!, { completed: !followUp.completed })}
                        className="p-1"
                      >
                        {followUp.completed ? (
                          <Clock className="w-4 h-4 text-orange-500" />
                        ) : (
                          <Check className="w-4 h-4 text-green-500" />
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteFollowUp(followUp._id!)}
                        className="p-1 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {followUps.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No follow-ups scheduled</p>
            <p className="text-sm">Click "Add Follow-up" to create one</p>
          </div>
        )}
      </div>

      {/* Add Follow-up Dialog */}
      <Dialog open={isAddingFollowUp} onOpenChange={setIsAddingFollowUp}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Follow-up</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="followup-date">Date</Label>
              <Input
                id="followup-date"
                type="date"
                value={newFollowUp.date}
                onChange={(e) => setNewFollowUp({ ...newFollowUp, date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="followup-type">Type</Label>
              <Select 
                value={newFollowUp.type} 
                onValueChange={(value) => setNewFollowUp({ ...newFollowUp, type: value as any })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select follow-up type" />
                </SelectTrigger>
                <SelectContent>
                  {followUpTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="followup-reason">Reason</Label>
              <Input
                id="followup-reason"
                placeholder="Why is this follow-up needed?"
                value={newFollowUp.reason}
                onChange={(e) => setNewFollowUp({ ...newFollowUp, reason: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="followup-notes">Notes (Optional)</Label>
              <Textarea
                id="followup-notes"
                placeholder="Additional notes..."
                value={newFollowUp.notes}
                onChange={(e) => setNewFollowUp({ ...newFollowUp, notes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => setIsAddingFollowUp(false)}
              >
                Cancel
              </Button>
              <Button 
                type="button"
                onClick={addFollowUp}
                disabled={!newFollowUp.date}
              >
                Add Follow-up
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FollowUpManager;