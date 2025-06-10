import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { crudRequest } from "@/lib/api";
import { toast } from "react-toastify";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Upload, FileText, X } from "lucide-react";

interface TreatmentFileUploadProps {
  patientId: string;
  medicalDetailId: string;
  treatmentId: string;
  onClose: () => void;
  onSuccess?: (updatedPatient: any) => void
}

export function TreatmentFileUpload({
  patientId,
  medicalDetailId,
  treatmentId,
  onClose,
  onSuccess
}: TreatmentFileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [descriptions, setDescriptions] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Determine if this is a general patient document upload or treatment-specific
  const isGeneralUpload = treatmentId === "general";
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prevFiles => [...prevFiles, ...newFiles]);
      setDescriptions(prevDesc => [...prevDesc, ...newFiles.map(() => '')]);
    }
  };
  
  const handleDescriptionChange = (index: number, value: string) => {
    const newDescriptions = [...descriptions];
    newDescriptions[index] = value;
    setDescriptions(newDescriptions);
  };
  
  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
    setDescriptions(descriptions.filter((_, i) => i !== index));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      toast.error("Please select at least one file to upload");
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append('files', file);
        formData.append('descriptions', descriptions[index] || '');
      });
      
      const interval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 5, 90));
      }, 200);
      
      // Use the appropriate endpoint based on whether this is a general upload or treatment-specific
      const endpoint = isGeneralUpload 
        ? `/patient/documents/${patientId}`
        : `/patient/treatment-files/${patientId}/${medicalDetailId}/${treatmentId}`;
      
      // Add headers for multipart form data
      const response = await crudRequest(
        'POST',
        endpoint,
        formData,
        {
          headers: {  
            'Content-Type': undefined // Let the browser set it automatically
          }
        }
      );
      
      clearInterval(interval);
      setUploadProgress(100);
      
      if (response) {
        toast.success("Files uploaded successfully");
        if (onSuccess) onSuccess(response);
        setTimeout(() => onClose(), 1000);
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error("Failed to upload files");
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>
          {isGeneralUpload ? "Upload Patient Documents" : "Upload Treatment Files"}
        </DialogTitle>
        <DialogDescription>
          {isGeneralUpload 
            ? "Add X-rays, reports, or other documents related to this patient."
            : "Add documentation, X-rays or other files related to this treatment."}
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div 
          className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <input 
            type="file" 
            id="file-input" 
            className="hidden"
            onChange={handleFileChange}
            multiple
          />
          <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Click to select files or drag and drop them here
          </p>
        </div>
        
        {files.length > 0 && (
          <div className="space-y-2">
            <Label>Selected Files ({files.length})</Label>
            <div className="max-h-[200px] overflow-y-auto space-y-2">
              {files.map((file, index) => (
                <div key={index} className="flex items-center gap-2 p-2 rounded border hover:bg-muted/50">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            {files.length > 0 && (
              <div className="space-y-2">
                <Label>Add Descriptions (Optional)</Label>
                {files.map((file, index) => (
                  <div key={index} className="space-y-1">
                    <Label className="text-xs">{file.name}</Label>
                    <Textarea
                      value={descriptions[index]}
                      onChange={(e) => handleDescriptionChange(index, e.target.value)}
                      placeholder="Add description for this file"
                      className="text-sm"
                      rows={2}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {isUploading && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}
        
        <div className="flex justify-end gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={files.length === 0 || isUploading}
          >
            {isUploading ? 'Uploading...' : 'Upload Files'}
          </Button>
        </div>
      </form>
    </div>
  );
}