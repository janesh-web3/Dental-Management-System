import React, { memo, useMemo, useCallback, useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Search, User, Phone, Mail, MapPin, Loader2 } from "lucide-react";
import { useDebounce } from "@/hooks/usePerformanceMonitor";
import { crudRequest } from "@/lib/api";
import type { Patient } from "@/types/patient";

interface OptimizedPatientSearchProps {
  onPatientSelect?: (patient: Patient) => void;
  placeholder?: string;
  className?: string;
  showResults?: boolean;
  maxResults?: number;
}

// Memoized patient result item
const PatientResultItem = memo(({ 
  patient, 
  onSelect 
}: { 
  patient: Patient; 
  onSelect: (patient: Patient) => void;
}) => {
  const personalDetails = patient.personalDetails || {};
  
  const handleClick = useCallback(() => {
    onSelect(patient);
  }, [patient, onSelect]);

  return (
    <Card 
      className="cursor-pointer hover:bg-gray-50 transition-colors duration-150"
      onClick={handleClick}
    >
      <CardContent className="p-3">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={typeof personalDetails.profilePhoto === 'string' ? personalDetails.profilePhoto : personalDetails.profilePhoto?.url} />
            <AvatarFallback>
              <User className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h4 className="font-medium text-sm truncate">
                {personalDetails.name || 'N/A'}
              </h4>
              <Badge variant="outline" className="text-xs">
                {personalDetails.gender || 'N/A'}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
              {personalDetails.contactNumber && (
                <div className="flex items-center space-x-1">
                  <Phone className="h-3 w-3" />
                  <span>{personalDetails.contactNumber}</span>
                </div>
              )}
              
              {personalDetails.emailAddress && (
                <div className="flex items-center space-x-1">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{personalDetails.emailAddress}</span>
                </div>
              )}
            </div>
            
            {personalDetails.address && (
              <div className="flex items-center space-x-1 mt-1 text-xs text-gray-500">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{personalDetails.address}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

PatientResultItem.displayName = 'PatientResultItem';

export const OptimizedPatientSearch = memo(({
  onPatientSelect,
  placeholder = "Search patients...",
  className = "",
  showResults = true,
  maxResults = 10
}: OptimizedPatientSearchProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Debounce search term to avoid excessive API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Perform search when debounced term changes
  React.useEffect(() => {
    const performSearch = async () => {
      if (!debouncedSearchTerm.trim() || debouncedSearchTerm.length < 2) {
        setSearchResults([]);
        setShowDropdown(false);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      
      try {
        const response = await crudRequest<{ success: boolean; data: Patient[] }>(
          'POST',
          '/patient/search',
          { 
            query: debouncedSearchTerm,
            limit: maxResults
          },
          { useCache: true, cacheDuration: 2 * 60 * 1000 } // Cache for 2 minutes
        );

        if (response.success) {
          setSearchResults(response.data);
          setShowDropdown(true);
        }
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedSearchTerm, maxResults]);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (!value.trim()) {
      setShowDropdown(false);
      setSearchResults([]);
    }
  }, []);

  // Handle patient selection
  const handlePatientSelect = useCallback((patient: Patient) => {
    setSearchTerm(patient.personalDetails?.name || '');
    setShowDropdown(false);
    onPatientSelect?.(patient);
  }, [onPatientSelect]);

  // Handle input focus
  const handleInputFocus = useCallback(() => {
    if (searchResults.length > 0) {
      setShowDropdown(true);
    }
  }, [searchResults.length]);

  // Handle input blur (with delay to allow clicks)
  const handleInputBlur = useCallback(() => {
    setTimeout(() => {
      setShowDropdown(false);
    }, 200);
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setSearchResults([]);
    setShowDropdown(false);
  }, []);

  // Memoized search results
  const memoizedResults = useMemo(() => {
    return searchResults.map(patient => (
      <PatientResultItem
        key={patient._id}
        patient={patient}
        onSelect={handlePatientSelect}
      />
    ));
  }, [searchResults, handlePatientSelect]);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          className="pl-10 pr-10"
        />
        
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
        )}
        
        {searchTerm && !isSearching && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
          >
            ×
          </Button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && showDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-96 overflow-y-auto">
          {isSearching ? (
            <div className="p-4 text-center text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
              Searching...
            </div>
          ) : searchResults.length > 0 ? (
            <div className="p-2 space-y-1">
              {memoizedResults}
            </div>
          ) : debouncedSearchTerm.length >= 2 ? (
            <div className="p-4 text-center text-gray-500">
              No patients found for "{debouncedSearchTerm}"
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
});

OptimizedPatientSearch.displayName = 'OptimizedPatientSearch';