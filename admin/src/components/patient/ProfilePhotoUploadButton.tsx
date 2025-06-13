import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "react-toastify";
import { crudRequest } from "@/lib/api";
import { Loader2, Upload, UserCircle, Camera } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

interface ProfilePhotoUploadButtonProps {
  id?: string;
  patientId: string;
  patientName: string;
  currentPhotoUrl?: string;
  onSuccess?: () => void;
}

export function ProfilePhotoUploadButton({
  id,
  patientId,
  patientName,
  currentPhotoUrl,
  onSuccess,
}: ProfilePhotoUploadButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPhotoUrl || null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup video stream when component unmounts
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      setIsCameraActive(true);
    } catch (error) {
      toast.error("Could not access camera. Please check your camera permissions.");
      console.error("Camera error:", error);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `profile-photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(blob));
            stopCamera();
          }
        }, 'image/jpeg');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type
      if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/)) {
        toast.error("Please select a valid image file (JPEG, PNG, or WebP)");
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size should be less than 5MB");
        return;
      }
      
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first");
      return;
    }

    setIsUploading(true);
    setUploadProgress(10); // Start progress

    try {
      const formData = new FormData();
      formData.append("profilePhoto", selectedFile);

      // Simulate progress during upload
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const newProgress = prev + Math.random() * 5;
          return newProgress < 90 ? newProgress : 90;
        });
      }, 300);

      try {
        const response = await crudRequest<{ success: boolean; message: string }>(
          "POST",
          `/patient/upload-profile-photo/${patientId}`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );

        clearInterval(progressInterval);
        setUploadProgress(100);

        if (response.success) {
          toast.success("Profile photo uploaded successfully");
          setTimeout(() => {
            setIsOpen(false);
            if (onSuccess) onSuccess();
          }, 500); // Small delay to show 100% progress
        } else {
          toast.error(response.message || "Failed to upload profile photo");
        }
      } catch (error: any) {
        clearInterval(progressInterval);
        console.error("Error uploading profile photo:", error);
        
        // Handle specific error cases
        if (error.details && typeof error.details === 'string') {
          if (error.details.includes('timeout')) {
            toast.error("Upload timed out. Please try with a smaller image or check your internet connection.");
          } else {
            toast.error(`Upload error: ${error.details}`);
          }
        } else {
          toast.error("Failed to upload profile photo. Please try again later.");
        }
      }
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setPreviewUrl(currentPhotoUrl || null);
    setUploadProgress(0);
    stopCamera();
  };

  return (
    <>
      <Button
        id={id}
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <UserCircle className="h-4 w-4" />
        Upload Photo
      </Button>

      <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) resetUpload();
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Profile Photo</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={previewUrl || undefined} alt={patientName} />
              <AvatarFallback>
                {patientName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {isUploading && (
              <div className="w-full space-y-2">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-xs text-center text-muted-foreground">
                  {uploadProgress < 100 ? "Uploading..." : "Upload complete!"}
                </p>
              </div>
            )}

            {isCameraActive ? (
              <div className="space-y-4 w-full">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-lg"
                />
                <div className="flex justify-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={capturePhoto}
                    className="gap-2"
                  >
                    <Camera className="h-4 w-4" />
                    Capture Photo
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={stopCamera}
                    className="gap-2"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2 w-full">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <Button
                  type="button"
                  variant="outline"
                  onClick={triggerFileInput}
                  className="gap-2"
                  disabled={isUploading}
                >
                  <Upload className="h-4 w-4" />
                  Select Image
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={startCamera}
                  className="gap-2"
                  disabled={isUploading}
                >
                  <Camera className="h-4 w-4" />
                  Take Photo
                </Button>
              </div>
            )}

            <Label className="text-sm text-muted-foreground text-center">
              Select a profile photo for {patientName}.<br />
              Recommended size: 400x400 pixels. Max size: 5MB.<br />
              Supported formats: JPEG, PNG, WebP
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsOpen(false);
                resetUpload();
              }}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 