import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Download, ZoomIn, ZoomOut, RotateCw, RotateCcw, Image, FileText, SunIcon, MoonIcon } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface DocumentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  document: {
    name: string;
    url: string;
    type?: string;
    description?: string;
    uploadDate?: string;
  };
}

export function DocumentViewer({ isOpen, onClose, document }: DocumentViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isImage, setIsImage] = useState(false);
  const [isPdf, setIsPdf] = useState(false);
  const [isXray, setIsXray] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Image enhancement controls for X-rays
  const [brightness, setBrightness] = useState(100); // 100% is normal
  const [contrast, setContrast] = useState(100); // 100% is normal
  const [invert, setInvert] = useState(false); // For X-rays, inverted view is often helpful

  // Format the upload date if available
  const formattedUploadDate = document.uploadDate 
    ? new Date(document.uploadDate).toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) 
    : null;

  // Determine document type and set appropriate state
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    
    // Reset zoom and rotation when document changes
    setZoom(1);
    setRotation(0);
    setBrightness(100);
    setContrast(100);
    setInvert(false);
    
    // Check if document or url is undefined
    if (!document || !document.url) {
      setIsLoading(false);
      setError("Document not found or URL is invalid");
      return;
    }
    
    // Check document type
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".svg", ".dcm", ".dicom"];
    const pdfExtensions = [".pdf"];
    const xrayExtensions = [".dcm", ".dicom"];
    
    const urlLower = document.url.toLowerCase();
    const isImageByExtension = imageExtensions.some(ext => urlLower.endsWith(ext));
    const isPdfByExtension = pdfExtensions.some(ext => urlLower.endsWith(ext));
    const isXrayByExtension = xrayExtensions.some(ext => urlLower.endsWith(ext));
    
    const isImageByType = document.type?.includes("image") || false;
    const isPdfByType = document.type?.includes("pdf") || document.type?.includes("application/pdf") || false;
    const isXrayByType = document.type?.includes("xray") || document.type?.includes("x-ray") || 
                       document.type?.includes("dicom") || false;
    
    // Check if name or description contains X-ray related terms
    const nameOrDesc = ((document.name || "") + (document.description || "")).toLowerCase();
    const isXrayByName = nameOrDesc.includes("xray") || nameOrDesc.includes("x-ray") || 
                        nameOrDesc.includes("dental scan") || nameOrDesc.includes("radiograph");
    
    setIsImage(isImageByExtension || isImageByType);
    setIsPdf(isPdfByExtension || isPdfByType);
    setIsXray(isXrayByExtension || isXrayByType || isXrayByName || document.type === "xray");
    
    setIsLoading(false);
  }, [document]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.2));
  const handleRotateClockwise = () => setRotation(prev => (prev + 90) % 360);
  const handleRotateCounterClockwise = () => setRotation(prev => (prev - 90 + 360) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setBrightness(100);
    setContrast(100);
    setInvert(false);
  };

  const handleToggleInvert = () => setInvert(prev => !prev);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setError("Failed to load image. The file may be corrupted or in an unsupported format.");
  };

  const getImageFilters = () => {
    let filters = `brightness(${brightness}%) contrast(${contrast}%)`;
    if (invert) filters += " invert(100%)";
    return filters;
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin h-10 w-10 border-4 border-primary rounded-full border-t-transparent"></div>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
          <div className="text-red-500 mb-2">
            <X className="h-10 w-10 mx-auto" />
          </div>
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            asChild
          >
            <a href={document.url} target="_blank" rel="noopener noreferrer">
              Open in new tab
            </a>
          </Button>
        </div>
      );
    }

    if (isImage) {
      return (
        <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-800 rounded-lg">
          <img 
            src={document.url} 
            alt={document.name}
            style={{ 
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              maxHeight: '70vh',
              transition: 'transform 0.3s ease',
              filter: getImageFilters()
            }}
            className="object-contain"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        </div>
      );
    } else if (isPdf) {
      return (
        <iframe 
          src={document.url} 
          title={document.name}
          className="w-full h-[70vh] border-0"
          onLoad={() => setIsLoading(false)}
        />
      );
    } else {
      // For other document types
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
          <div className="mb-4">
            <FileText className="h-16 w-16 mx-auto text-blue-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">{document.name}</h3>
          <p className="mb-4 text-muted-foreground">This file type can't be previewed directly.</p>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <a 
                href={document.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                download={document.name}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </a>
            </Button>
            <Button asChild>
              <a 
                href={document.url} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                Open in browser
              </a>
            </Button>
          </div>
        </div>
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()} modal>
      <DialogContent className="max-w-5xl w-full h-[85vh] max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="flex flex-row items-center justify-between p-4 border-b">
          <div className="flex items-center">
            {isImage ? (
              <Image className="h-5 w-5 mr-2 text-blue-500" />
            ) : (
              <FileText className="h-5 w-5 mr-2 text-blue-500" /> 
            )}
            <div>
              <DialogTitle className="text-xl">
                {document.name}
                {isXray && <span className="text-sm ml-2 font-normal text-red-500">(X-ray)</span>}
              </DialogTitle>
              <DialogDescription>
                {isXray ? "X-ray viewer" : isImage ? "Image viewer" : isPdf ? "PDF viewer" : "Document viewer"}
                {document.description && <span className="block text-xs mt-1 italic">{document.description}</span>}
                {formattedUploadDate && <span className="block text-xs mt-0.5">Uploaded: {formattedUploadDate}</span>}
              </DialogDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isImage && (
              <>
                <Button variant="outline" size="icon" onClick={handleZoomIn} disabled={zoom >= 3}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleZoomOut} disabled={zoom <= 0.2}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleRotateClockwise}>
                  <RotateCw className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleRotateCounterClockwise}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
                {isXray && (
                  <Button 
                    variant={invert ? "secondary" : "outline"} 
                    size="icon" 
                    onClick={handleToggleInvert}
                    title="Invert colors"
                  >
                    {invert ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={handleReset}>
                  Reset
                </Button>
              </>
            )}
            <Button variant="outline" size="icon" asChild>
              <a href={document.url} download={document.name} target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4" />
              </a>
            </Button>
            <Button variant="outline" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        {isXray && (
          <div className="px-4 py-2 border-b bg-gray-50 dark:bg-gray-900 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs w-28">Brightness: {brightness}%</span>
              <Slider
                className="flex-1"
                value={[brightness]}
                min={50}
                max={150}
                step={1}
                onValueChange={(vals) => setBrightness(vals[0])}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs w-28">Contrast: {contrast}%</span>
              <Slider
                className="flex-1"
                value={[contrast]}
                min={50}
                max={150}
                step={1}
                onValueChange={(vals) => setContrast(vals[0])}
              />
            </div>
          </div>
        )}
        
        <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
} 