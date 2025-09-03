import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Clock, Edit3, Trash2, Check, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { FollowUp, Patient } from '@/types/patient';
import { crudRequest } from '@/lib/api';

interface FollowUpTableDialogProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  onRefresh?: () => void;
}

const FollowUpTableDialog: React.FC<FollowUpTableDialogProps> = ({
  isOpen,
  onClose,
  patient,
  onRefresh
}) => {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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

  const [newFollowUp, setNewFollowUp] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    type: "Routine Check" as const,
    reason: "",
    notes: ""
  });

  // Load follow-ups when dialog opens
  useEffect(() => {
    if (isOpen && patient) {
      loadFollowUps();
    }
  }, [isOpen, patient]);

  const loadFollowUps = async () => {
    try {
      setIsLoading(true);
      const response = await crudRequest('GET', `/follow-ups/${patient._id}`) as any;
      setFollowUps(response.data || []);
    } catch (error) {
      console.error('Error loading follow-ups:', error);
      toast.error('Failed to load follow-ups');
    } finally {
      setIsLoading(false);
    }
  };

  const addFollowUp = async () => {
    if (!newFollowUp.date || !newFollowUp.type) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      setIsLoading(true);
      await crudRequest('POST', `/follow-ups/${patient._id}/add`, {
        treatmentPlanId: patient.medicalDetails[0]?.treatmentPlanning[0]?._id,
        date: newFollowUp.date,
        type: newFollowUp.type,
        reason: newFollowUp.reason,
        notes: newFollowUp.notes,
        linkedTo: "treatment",
        entityId: patient.medicalDetails[0]?.treatmentPlanning[0]?._id || ""
      });

      toast.success('Follow-up added successfully');
      setNewFollowUp({
        date: format(new Date(), 'yyyy-MM-dd'),
        type: "Routine Check",
        reason: "",
        notes: ""
      });
      setIsAddingFollowUp(false);
      await loadFollowUps();
      onRefresh?.();
    } catch (error) {
      console.error('Error adding follow-up:', error);
      toast.error('Failed to add follow-up');
    } finally {
      setIsLoading(false);
    }
  };

  const updateFollowUp = async (followUpId: string, updates: Partial<FollowUp>) => {
    try {
      setIsLoading(true);
      await crudRequest('PUT', `/follow-ups/${patient._id}/followup/${followUpId}`, updates);
      toast.success('Follow-up updated successfully');
      setEditingFollowUp(null);
      await loadFollowUps();
      onRefresh?.();
    } catch (error) {
      console.error('Error updating follow-up:', error);
      toast.error('Failed to update follow-up');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteFollowUp = async (followUpId: string) => {
    if (!confirm('Are you sure you want to delete this follow-up?')) return;

    try {
      setIsLoading(true);
      await crudRequest('DELETE', `/follow-ups/${patient._id}/followup/${followUpId}`);
      toast.success('Follow-up deleted successfully');
      await loadFollowUps();
      onRefresh?.();
    } catch (error) {
      console.error('Error deleting follow-up:', error);
      toast.error('Failed to delete follow-up');
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    const colors = {
      "Treatment Review": "bg-blue-100 text-blue-700 border-blue-200",
      "Orthodontic Check": "bg-purple-100 text-purple-700 border-purple-200", 
      "Pain Assessment": "bg-red-100 text-red-700 border-red-200",
      "Routine Check": "bg-green-100 text-green-700 border-green-200",
      "Post-Surgery": "bg-orange-100 text-orange-700 border-orange-200",
      "Cleaning": "bg-cyan-100 text-cyan-700 border-cyan-200",
      "X-Ray Review": "bg-gray-100 text-gray-700 border-gray-200",
      "Other": "bg-yellow-100 text-yellow-700 border-yellow-200"
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  const sortedFollowUps = followUps.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const upcomingFollowUps = sortedFollowUps.filter(fu => !fu.completed);
  const completedFollowUps = sortedFollowUps.filter(fu => fu.completed);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Follow-ups for {patient.personalDetails.name}
            <Badge variant="outline" className="ml-2">
              {followUps.length} total
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add New Follow-up Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                Quick Add Follow-up
                {!isAddingFollowUp && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddingFollowUp(true)}
                    disabled={isLoading}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            
            {isAddingFollowUp && (
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Date *</Label>
                    <Input
                      type="date"
                      value={newFollowUp.date}
                      onChange={(e) => setNewFollowUp({ ...newFollowUp, date: e.target.value })}
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Type *</Label>
                    <Select 
                      value={newFollowUp.type} 
                      onValueChange={(value) => setNewFollowUp({ ...newFollowUp, type: value as any })}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {followUpTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">Reason</Label>
                    <Input
                      placeholder="Why is this follow-up needed?"
                      value={newFollowUp.reason}
                      onChange={(e) => setNewFollowUp({ ...newFollowUp, reason: e.target.value })}
                      className="h-8"
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">Notes</Label>
                    <Textarea
                      placeholder="Additional notes..."
                      value={newFollowUp.notes}
                      onChange={(e) => setNewFollowUp({ ...newFollowUp, notes: e.target.value })}
                      rows={2}
                      className="resize-none"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 mt-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsAddingFollowUp(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm"
                    onClick={addFollowUp}
                    disabled={isLoading || !newFollowUp.date || !newFollowUp.type}
                  >
                    {isLoading ? 'Adding...' : 'Add Follow-up'}
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Follow-ups List */}
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {/* Upcoming Follow-ups */}
              {upcomingFollowUps.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium">Upcoming ({upcomingFollowUps.length})</span>
                  </div>
                  {upcomingFollowUps.map((followUp) => (
                    <Card key={followUp._id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge className={`text-xs ${getTypeColor(followUp.type)}`}>
                                {followUp.type}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(followUp.date), 'MMM dd, yyyy')}
                              </span>
                              {new Date(followUp.date) < new Date() && (
                                <Badge variant="destructive" className="text-xs">
                                  Overdue
                                </Badge>
                              )}
                            </div>
                            {followUp.reason && (
                              <p className="text-sm text-gray-700">{followUp.reason}</p>
                            )}
                            {followUp.notes && (
                              <p className="text-xs text-gray-500">{followUp.notes}</p>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateFollowUp(followUp._id!, { completed: true })}
                              className="h-6 w-6 p-0"
                              title="Mark as completed"
                            >
                              <Check className="w-3 h-3 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingFollowUp(followUp)}
                              className="h-6 w-6 p-0"
                              title="Edit"
                            >
                              <Edit3 className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteFollowUp(followUp._id!)}
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
                              title="Delete"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {upcomingFollowUps.length > 0 && completedFollowUps.length > 0 && <Separator />}

              {/* Completed Follow-ups */}
              {completedFollowUps.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">Completed ({completedFollowUps.length})</span>
                  </div>
                  {completedFollowUps.map((followUp) => (
                    <Card key={followUp._id} className="border-l-4 border-l-green-500 opacity-75">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge className={`text-xs ${getTypeColor(followUp.type)}`}>
                                {followUp.type}
                              </Badge>
                              <span className="text-xs text-muted-foreground line-through">
                                {format(new Date(followUp.date), 'MMM dd, yyyy')}
                              </span>
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                Completed
                              </Badge>
                            </div>
                            {followUp.reason && (
                              <p className="text-sm text-gray-700">{followUp.reason}</p>
                            )}
                            {followUp.notes && (
                              <p className="text-xs text-gray-500">{followUp.notes}</p>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateFollowUp(followUp._id!, { completed: false })}
                              className="h-6 w-6 p-0"
                              title="Mark as pending"
                            >
                              <X className="w-3 h-3 text-orange-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteFollowUp(followUp._id!)}
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
                              title="Delete"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {followUps.length === 0 && !isLoading && (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No follow-ups scheduled</p>
                  <p className="text-sm">Click "Add" to create your first follow-up</p>
                </div>
              )}

              {isLoading && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">Loading follow-ups...</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Edit Follow-up Dialog */}
        <Dialog open={!!editingFollowUp} onOpenChange={() => setEditingFollowUp(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Follow-up</DialogTitle>
            </DialogHeader>
            
            {editingFollowUp && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Date</Label>
                  <Input
                    type="date"
                    value={editingFollowUp.date}
                    onChange={(e) => setEditingFollowUp({ ...editingFollowUp, date: e.target.value })}
                    className="h-8"
                  />
                </div>
                
                <div className="space-y-1">
                  <Label className="text-xs">Type</Label>
                  <Select 
                    value={editingFollowUp.type} 
                    onValueChange={(value) => setEditingFollowUp({ ...editingFollowUp, type: value as any })}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {followUpTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-1">
                  <Label className="text-xs">Reason</Label>
                  <Input
                    value={editingFollowUp.reason || ''}
                    onChange={(e) => setEditingFollowUp({ ...editingFollowUp, reason: e.target.value })}
                    className="h-8"
                  />
                </div>
                
                <div className="space-y-1">
                  <Label className="text-xs">Notes</Label>
                  <Textarea
                    value={editingFollowUp.notes || ''}
                    onChange={(e) => setEditingFollowUp({ ...editingFollowUp, notes: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setEditingFollowUp(null)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => updateFollowUp(editingFollowUp._id!, editingFollowUp)}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};

export default FollowUpTableDialog;
