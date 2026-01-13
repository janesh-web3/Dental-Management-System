import React, { memo, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Edit, 
  Eye as View, 
  Trash, 
  MoreHorizontal,
  User
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Patient } from "@/types/patient";

// Memoized patient row component
const PatientRow = memo(({ index, style, data }: { 
  index: number; 
  style: React.CSSProperties; 
  data: { 
    patients: Patient[]; 
    onView: (patient: Patient) => void;
    onEdit: (patient: Patient) => void;
    onDelete: (patient: Patient) => void;
    visibleColumns: string[];
  } 
}) => {
  const { patients, onView, onEdit, onDelete, visibleColumns } = data;
  const patient = patients[index];

  if (!patient) return null;

  const personalDetails = patient.personalDetails || {};
  const medicalDetails = patient.medicalDetails?.[0] || {};
  
  // Calculate totals efficiently
  const totals = useMemo(() => {
    let totalAmount = 0;
    let paidAmount = 0;

    // Calculate from group treatments
    if (medicalDetails.treatmentPlanning) {
      medicalDetails.treatmentPlanning.forEach((treatment: any) => {
        if (treatment.groupTreatmentDetails) {
          treatment.groupTreatmentDetails.forEach((group: any) => {
            totalAmount += group.totalTreatmentAmount || 0;
            paidAmount += group.totalPaidAmount || 0;
          });
        }
      });
    }

    return {
      totalAmount,
      paidAmount,
      remainingAmount: totalAmount - paidAmount
    };
  }, [medicalDetails]);

  return (
    <div style={style} className="flex items-center border-b border-gray-200 hover:bg-gray-50 px-4 py-2">
      <div className="flex-1 grid grid-cols-12 gap-4 items-center">
        {/* Serial Number */}
        {visibleColumns.includes('sn') && (
          <div className="col-span-1 text-sm font-medium">
            {index + 1}
          </div>
        )}

        {/* Patient Info */}
        {visibleColumns.includes('name') && (
          <div className="col-span-2 flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={typeof personalDetails.profilePhoto === 'string' ? personalDetails.profilePhoto : personalDetails.profilePhoto?.url} />
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium text-sm">
                {personalDetails.name || 'N/A'}
              </div>
              <div className="text-xs text-gray-500">
                Age: {personalDetails.age || 'N/A'}
              </div>
            </div>
          </div>
        )}

        {/* Contact */}
        {visibleColumns.includes('contact') && (
          <div className="col-span-1 text-sm">
            {personalDetails.contactNumber || 'N/A'}
          </div>
        )}

        {/* Gender */}
        {visibleColumns.includes('gender') && (
          <div className="col-span-1">
            <Badge variant="outline" className="text-xs">
              {personalDetails.gender || 'N/A'}
            </Badge>
          </div>
        )}

        {/* Address */}
        {visibleColumns.includes('address') && (
          <div className="col-span-1 text-sm text-gray-600 truncate">
            {personalDetails.address || 'N/A'}
          </div>
        )}

        {/* Group */}
        {visibleColumns.includes('group') && (
          <div className="col-span-1">
            <Badge variant="secondary" className="text-xs">
              {medicalDetails.group || 'General'}
            </Badge>
          </div>
        )}

        {/* Financial Info */}
        {visibleColumns.includes('totalAmount') && (
          <div className="col-span-1 text-sm font-medium">
            Rs. {totals.totalAmount.toLocaleString()}
          </div>
        )}

        {visibleColumns.includes('paidAmount') && (
          <div className="col-span-1 text-sm text-green-600">
            Rs. {totals.paidAmount.toLocaleString()}
          </div>
        )}

        {visibleColumns.includes('remainingAmount') && (
          <div className="col-span-1 text-sm text-red-600">
            Rs. {totals.remainingAmount.toLocaleString()}
          </div>
        )}

        {/* Actions */}
        <div className="col-span-1 flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(patient)}>
                <View className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(patient)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(patient)}
                className="text-red-600"
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
});

PatientRow.displayName = 'PatientRow';

// Main optimized patient table component
interface OptimizedPatientTableProps {
  patients: Patient[];
  loading: boolean;
  onView: (patient: Patient) => void;
  onEdit: (patient: Patient) => void;
  onDelete: (patient: Patient) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  visibleColumns: string[];
}

export const OptimizedPatientTable = memo(({
  patients,
  loading,
  onView,
  onEdit,
  onDelete,
  searchTerm,
  onSearchChange,
  visibleColumns
}: OptimizedPatientTableProps) => {
  // Memoized filtered patients
  const filteredPatients = useMemo(() => {
    if (!searchTerm) return patients;
    
    const term = searchTerm.toLowerCase();
    return patients.filter(patient => {
      const personalDetails = patient.personalDetails || {};
      return (
        personalDetails.name?.toLowerCase().includes(term) ||
        personalDetails.contactNumber?.includes(term) ||
        personalDetails.emailAddress?.toLowerCase().includes(term) ||
        personalDetails.address?.toLowerCase().includes(term)
      );
    });
  }, [patients, searchTerm]);

  // Handle search with debouncing
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  }, [onSearchChange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center space-x-4">
        <Input
          placeholder="Search patients..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="max-w-sm"
        />
        <div className="text-sm text-gray-500">
          {filteredPatients.length} patients
        </div>
      </div>

      {/* Table Header */}
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
        <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
          {visibleColumns.includes('sn') && <div className="col-span-1">S.No</div>}
          {visibleColumns.includes('name') && <div className="col-span-2">Patient</div>}
          {visibleColumns.includes('contact') && <div className="col-span-1">Contact</div>}
          {visibleColumns.includes('gender') && <div className="col-span-1">Gender</div>}
          {visibleColumns.includes('address') && <div className="col-span-1">Address</div>}
          {visibleColumns.includes('group') && <div className="col-span-1">Group</div>}
          {visibleColumns.includes('totalAmount') && <div className="col-span-1">Total</div>}
          {visibleColumns.includes('paidAmount') && <div className="col-span-1">Paid</div>}
          {visibleColumns.includes('remainingAmount') && <div className="col-span-1">Remaining</div>}
          <div className="col-span-1 text-right">Actions</div>
        </div>
      </div>

      {/* Simple List instead of Virtual List for now */}
      <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
        {filteredPatients.map((patient, index) => (
          <PatientRow
            key={patient._id}
            index={index}
            style={{ height: '80px' }}
            data={{
              patients: filteredPatients,
              onView,
              onEdit,
              onDelete,
              visibleColumns
            }}
          />
        ))}
      </div>

      {filteredPatients.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No patients found
        </div>
      )}
    </div>
  );
});

OptimizedPatientTable.displayName = 'OptimizedPatientTable';