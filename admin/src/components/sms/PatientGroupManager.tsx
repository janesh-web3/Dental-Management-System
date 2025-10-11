import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "react-toastify";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  X,
  Users,
  Calendar,
  User
} from 'lucide-react';
import { BulkSMSFilter } from './BulkSMSFilter';
import { crudRequest } from '@/lib/api';

interface PatientGroup {
  _id: string;
  name: string;
  description: string;
  patientCount: number;
  createdBy: {
    _id: string;
    name: string;
  };
  createdAt: string;
  lastUsed?: string;
}

interface Patient {
  _id: string;
  personalDetails: {
    name: string;
    contactNumber: string;
    gender: string;
  };
  assignedDoctor?: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

interface FilterPayload {
  treatmentStatus: string;
  gender: string;
  group: string;
  procedure: string;
  doctor: string;
  dateRange: { from: string; to: string };
  dateRangePreset: string;
}

export const PatientGroupManager: React.FC = () => {
  const [groups, setGroups] = useState<PatientGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<PatientGroup | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatients, setSelectedPatients] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      // Fetch patient groups from the backend API
      const response = await crudRequest<{ data: PatientGroup[] }>('GET', '/patient-groups');
      // Ensure groups is always an array
      setGroups(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast.error('Failed to fetch patient groups');
      // Set groups to empty array on error
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    try {
      // Create a new patient group via the backend API
      const response = await crudRequest<{ data: PatientGroup }>('POST', '/patient-groups', {
        name: groupName,
        description: groupDescription,
        patientIds: selectedPatients
      });
      
      setGroups(prev => [response.data, ...prev]);
      setIsCreateDialogOpen(false);
      setGroupName('');
      setGroupDescription('');
      setSelectedPatients([]);
      toast.success('Patient group created successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create group');
    }
  };

  const handleEditGroup = async () => {
    if (!selectedGroup) return;

    try {
      // Update patient group via the backend API
      const response = await crudRequest<{ data: PatientGroup }>('PUT', `/patient-groups/${selectedGroup._id}`, {
        name: groupName,
        description: groupDescription
      });
      
      setGroups(prev => prev.map(g => 
        g._id === selectedGroup._id ? response.data : g
      ));
      setIsEditDialogOpen(false);
      setSelectedGroup(null);
      setGroupName('');
      setGroupDescription('');
      toast.success('Patient group updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update group');
    }
  };

  const handleDeleteGroup = async (group: PatientGroup) => {
    if (!confirm(`Are you sure you want to delete the group "${group.name}"?`)) return;

    try {
      // Delete patient group via the backend API
      await crudRequest('DELETE', `/patient-groups/${group._id}`);
      setGroups(prev => prev.filter(g => g._id !== group._id));
      toast.success('Patient group deleted successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete group');
    }
  };

  const handleFilter = async (filters: FilterPayload) => {
    try {
      // Fetch patients based on filters from the backend API
      const response = await crudRequest<{ data: Patient[] }>('POST', '/patient-groups/filter-patients', filters);
      setPatients(response.data || []);
      setIsFilterDialogOpen(false);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Failed to fetch patients');
    }
  };

  const handleResetFilters = () => {
    // Reset filters logic would go here
  };

  const togglePatientSelection = (patientId: string) => {
    setSelectedPatients(prev => 
      prev.includes(patientId) 
        ? prev.filter(id => id !== patientId) 
        : [...prev, patientId]
    );
  };

  const selectAllPatients = () => {
    if (selectedPatients.length === patients.length) {
      setSelectedPatients([]);
    } else {
      setSelectedPatients(patients.map(p => p._id));
    }
  };

  const openCreateDialog = () => {
    setGroupName('');
    setGroupDescription('');
    setSelectedPatients([]);
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (group: PatientGroup) => {
    setSelectedGroup(group);
    setGroupName(group.name);
    setGroupDescription(group.description);
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Patient Groups</h1>
          <p className="text-muted-foreground">
            Manage and organize patient groups for targeted SMS campaigns
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsFilterDialogOpen(true)}>
            <Users className="mr-2 h-4 w-4" />
            Create Group from Filter
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            New Group
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search groups..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            {(searchQuery) && (
              <Button
                variant="outline"
                onClick={() => { setSearchQuery(''); }}
              >
                <X className="mr-2 h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Groups List */}
      <Card>
        <CardHeader>
          <CardTitle>Groups ({groups.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading groups...</div>
          ) : groups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No patient groups found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Patients</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.isArray(groups) && groups.map(group => (
                  <TableRow key={group._id}>
                    <TableCell className="font-medium">{group.name}</TableCell>
                    <TableCell>{group.description}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{group.patientCount} patients</Badge>
                    </TableCell>
                    <TableCell>{group.createdBy.name}</TableCell>
                    <TableCell>{new Date(group.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {group.lastUsed ? new Date(group.lastUsed).toLocaleDateString() : 'Never'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(group)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteGroup(group)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Group Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Patient Group</DialogTitle>
            <DialogDescription>
              Create a new patient group for targeted SMS campaigns
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="groupName">Group Name</Label>
                <Input
                  id="groupName"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter group name"
                />
              </div>
              <div>
                <Label htmlFor="groupDescription">Description</Label>
                <Input
                  id="groupDescription"
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder="Enter group description"
                />
              </div>
              <div>
                <Label>Selected Patients: {selectedPatients.length}</Label>
                <div className="border rounded-lg p-3 bg-muted min-h-[200px]">
                  {selectedPatients.length > 0 ? (
                    <div className="space-y-2">
                      {selectedPatients.map(patientId => {
                        const patient = patients.find(p => p._id === patientId);
                        return patient ? (
                          <div key={patientId} className="flex items-center justify-between bg-background p-2 rounded">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span>{patient.personalDetails.name}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => togglePatientSelection(patientId)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : null;
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No patients selected
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Select Patients</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllPatients}
                >
                  {selectedPatients.length === patients.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              <div className="border rounded-lg p-3 bg-muted min-h-[300px]">
                {patients.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Doctor</TableHead>
                        <TableHead>Registered</TableHead>
                        <TableHead>Select</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {patients.map(patient => (
                        <TableRow key={patient._id}>
                          <TableCell className="font-medium">{patient.personalDetails.name}</TableCell>
                          <TableCell>{patient.personalDetails.contactNumber}</TableCell>
                          <TableCell>{patient.assignedDoctor?.name || 'N/A'}</TableCell>
                          <TableCell>{new Date(patient.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={selectedPatients.includes(patient._id)}
                              onChange={() => togglePatientSelection(patient._id)}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <Button
                      variant="outline"
                      onClick={() => setIsFilterDialogOpen(true)}
                    >
                      <Filter className="mr-2 h-4 w-4" />
                      Apply Filters to Find Patients
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateGroup}
              disabled={!groupName || selectedPatients.length === 0}
            >
              Create Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Patient Group</DialogTitle>
            <DialogDescription>
              Modify your patient group details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="editGroupName">Group Name</Label>
              <Input
                id="editGroupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name"
              />
            </div>
            <div>
              <Label htmlFor="editGroupDescription">Description</Label>
              <Input
                id="editGroupDescription"
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                placeholder="Enter group description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEditGroup}
              disabled={!groupName}
            >
              Update Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filter Dialog */}
      <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Filter Patients</DialogTitle>
            <DialogDescription>
              Apply filters to find patients for your group
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <BulkSMSFilter 
              onFilter={handleFilter} 
              onReset={handleResetFilters}
              loading={false}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFilterDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PatientGroupManager;