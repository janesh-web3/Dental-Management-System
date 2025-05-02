import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { crudRequest } from "@/lib/api";
import { toast } from "react-toastify";
import {  File, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Textarea } from "@/components/ui/textarea";

interface PatientFileUploadProps {
  patientId: string;
  onClose: () => void;
}

type FileType = {
  value: string;
  label: string;
};

const FILE_TYPES: FileType[] = [
  { value: "xray", label: "X-Ray" },
  { value: "report", label: "Medical Report" },
  { value: "prescription", label: "Prescription" },
  { value: "other", label: "Other" }
];

export function PatientFileUpload({ patientId, onClose }: PatientFileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [fileTypes, setFileTypes] = useState<string[]>([]);
  const [descriptions, setDescriptions] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [fileType, _setFileType] = useState<string>("xray");
  const [description, _setDescription] = useState<string>("");
  const [_selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
      setFileTypes(prev => [...prev, ...new Array(newFiles.length).fill(fileType)]);
      setDescriptions(prev => [...prev, ...new Array(newFiles.length).fill(description)]);
      setSelectedFile(newFiles[0]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setFileTypes(prev => prev.filter((_, i) => i !== index));
    setDescriptions(prev => prev.filter((_, i) => i !== index));
    setSelectedFile(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFiles(prev => [...prev, ...newFiles]);
      setFileTypes(prev => [...prev, ...new Array(newFiles.length).fill(fileType)]);
      setDescriptions(prev => [...prev, ...new Array(newFiles.length).fill(description)]);
      setSelectedFile(newFiles[0]);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    
    files.forEach((file) => {
      formData.append('files', file);
    });
    
    fileTypes.forEach((type) => {
      formData.append('fileTypes', type);
    });
    
    descriptions.forEach((desc) => {
      formData.append('descriptions', desc);
    });

    try {
      await crudRequest('POST', `/patient/upload-files/${patientId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      toast.success('Files uploaded successfully');
      onClose();
      window.location.reload();
    } catch (error) {
      toast.error('Failed to upload files');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragging ? 'border-primary bg-primary/10' : 'border-gray-300'}
          hover:border-primary hover:bg-primary/5`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center gap-2">
          <File className="w-12 h-12 text-gray-400" />
          <div className="text-xl font-semibold">Drag and drop files here</div>
          <p className="text-sm text-gray-500">or</p>
          <Label htmlFor="file-upload" className="cursor-pointer">
            <span className="text-primary hover:underline">Browse files</span>
            <Input
              id="file-upload"
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </Label>
          <p className="text-sm text-gray-500 mt-2">
            Supported formats: JPG, PNG, PDF
          </p>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Selected Files</h3>
          <div className="grid gap-4">
            {files.map((file, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{file.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>File Type</Label>
                        <Select
                          value={fileTypes[index]}
                          onValueChange={(value) => {
                            const newTypes = [...fileTypes];
                            newTypes[index] = value;
                            setFileTypes(newTypes);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {FILE_TYPES.map(type => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={descriptions[index]}
                          onChange={(e) => {
                            const newDescs = [...descriptions];
                            newDescs[index] = e.target.value;
                            setDescriptions(newDescs);
                          }}
                          placeholder="Enter file description"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-4 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          onClick={handleUpload} 
          disabled={isUploading || files.length === 0}
          className="min-w-[100px]"
        >
          {isUploading ? 'Uploading...' : 'Upload Files'}
        </Button>
      </div>
    </div>
  );
} 