import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Image, Maximize2, ZoomIn, ZoomOut, RotateCw, File, Stethoscope } from "lucide-react";
import { format } from "date-fns";

interface Document {
  fileName: string;
  fileUrl: string;
  uploadDate: string;
  description?: string;
  source?: 'patient' | 'treatment';
}

interface DocumentComparisonProps {
  documents: Document[];
  patientDocuments?: Document[];
}

export function DocumentComparison({ documents, patientDocuments = [] }: DocumentComparisonProps) {
  const [selectedDocs, setSelectedDocs] = useState<[string?, string?]>([]);
  const [zoom, setZoom] = useState<[number, number]>([1, 1]);
  const [rotation, setRotation] = useState<[number, number]>([0, 0]);
  const [viewMode, setViewMode] = useState<'grid' | 'comparison'>('grid');
  
  // Combine all documents
  const allDocuments = [
    ...patientDocuments.map(doc => ({
      ...doc,
      source: doc.source || 'patient' as const
    })),
    ...documents.map(doc => ({
      ...doc,
      source: doc.source || 'treatment' as const
    }))
  ];
  
  // Filter image documents
  const imageDocuments = allDocuments.filter(doc => 
    doc.fileUrl.match(/\.(jpg|jpeg|png|gif|webp|bmp|tiff|svg)$/i)
  );
  
  // Filter other documents
  const otherDocuments = allDocuments.filter(doc => 
    !doc.fileUrl.match(/\.(jpg|jpeg|png|gif|webp|bmp|tiff|svg)$/i)
  );

  const handleZoom = (index: number, factor: number) => {
    const newZoom = [...zoom];
    newZoom[index] = Math.max(0.1, Math.min(3, newZoom[index] + factor));
    setZoom(newZoom as [number, number]);
  };

  const handleRotate = (index: number) => {
    const newRotation = [...rotation];
    newRotation[index] = (newRotation[index] + 90) % 360;
    setRotation(newRotation as [number, number]);
  };

  const getDocumentDetails = (url: string) => {
    return allDocuments.find(doc => doc.fileUrl === url);
  };

  const renderDocumentGrid = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">All Documents ({allDocuments.length})</h3>
        {imageDocuments.length >= 2 && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setViewMode('comparison')}
            className="flex items-center gap-1"
          >
            <Maximize2 className="h-4 w-4" />
            Compare Images
          </Button>
        )}
      </div>
      
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({allDocuments.length})</TabsTrigger>
          <TabsTrigger value="images">Images ({imageDocuments.length})</TabsTrigger>
          <TabsTrigger value="documents">Other ({otherDocuments.length})</TabsTrigger>
          <TabsTrigger value="patient">Patient ({patientDocuments.length})</TabsTrigger>
          <TabsTrigger value="treatment">Treatment ({documents.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {allDocuments.map((doc, index) => renderDocumentCard(doc, index))}
          </div>
        </TabsContent>
        
        <TabsContent value="images" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {imageDocuments.map((doc, index) => renderDocumentCard(doc, index))}
          </div>
        </TabsContent>
        
        <TabsContent value="documents" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {otherDocuments.map((doc, index) => renderDocumentCard(doc, index))}
          </div>
        </TabsContent>
        
        <TabsContent value="patient" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {allDocuments
              .filter(doc => doc.source === 'patient')
              .map((doc, index) => renderDocumentCard(doc, index))}
          </div>
        </TabsContent>
        
        <TabsContent value="treatment" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {allDocuments
              .filter(doc => doc.source === 'treatment')
              .map((doc, index) => renderDocumentCard(doc, index))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  const renderDocumentCard = (doc: Document, index: number) => (
    <div key={index} className="border rounded-md p-3 bg-card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate" title={doc.fileName}>
            {doc.fileName}
          </p>
          <div className="flex items-center gap-1 mt-1">
            <Badge 
              variant="outline" 
              className={`text-xs ${doc.source === 'patient' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}
            >
              {doc.source === 'patient' ? (
                <File className="h-3 w-3 mr-1" />
              ) : (
                <Stethoscope className="h-3 w-3 mr-1" />
              )}
              {doc.source === 'patient' ? 'Patient' : 'Treatment'}
            </Badge>
            <p className="text-xs text-muted-foreground">
              {doc.uploadDate ? format(new Date(doc.uploadDate), 'MMM dd, yyyy') : 'No date'}
            </p>
          </div>
        </div>
        <a 
          href={doc.fileUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary hover:text-primary/80"
        >
          <Download className="h-4 w-4" />
        </a>
      </div>
      
      {doc.fileUrl.match(/\.(jpg|jpeg|png|gif|webp|bmp|tiff|svg)$/i) ? (
        <div className="mt-2 border rounded overflow-hidden aspect-video flex items-center justify-center bg-muted/30">
          <img 
            src={doc.fileUrl} 
            alt={doc.fileName} 
            className="max-h-[120px] max-w-full object-contain"
            onClick={() => {
              setSelectedDocs([doc.fileUrl, selectedDocs[1]]);
              setViewMode('comparison');
            }}
          />
        </div>
      ) : (
        <div className="mt-2 border rounded p-3 flex items-center justify-center bg-muted/30 aspect-video">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      
      {doc.description && (
        <p className="text-xs mt-2 text-muted-foreground line-clamp-2">
          {doc.description}
        </p>
      )}
      
      {doc.fileUrl.match(/\.(jpg|jpeg|png|gif|webp|bmp|tiff|svg)$/i) && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full mt-2 text-xs"
          onClick={() => {
            setSelectedDocs([doc.fileUrl, selectedDocs[1]]);
            setViewMode('comparison');
          }}
        >
          <Image className="h-3 w-3 mr-1" />
          Compare
        </Button>
      )}
    </div>
  );

  const renderComparisonView = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Document Comparison</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setViewMode('grid')}
        >
          Back to All Documents
        </Button>
      </div>
      
      <div className="grid md:grid-cols-2 gap-4">
        {[0, 1].map((index) => (
          <div key={index} className="space-y-2">
            <Select
              value={selectedDocs[index]}
              onValueChange={(value) => {
                const newDocs = [...selectedDocs];
                newDocs[index] = value;
                setSelectedDocs(newDocs as [string?, string?]);
                // Reset zoom and rotation when changing document
                const newZoom = [...zoom];
                newZoom[index] = 1;
                setZoom(newZoom as [number, number]);
                const newRotation = [...rotation];
                newRotation[index] = 0;
                setRotation(newRotation as [number, number]);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Select document ${index + 1}`} />
              </SelectTrigger>
              <SelectContent>
                {imageDocuments.map((doc) => (
                  <SelectItem key={doc.fileUrl} value={doc.fileUrl}>
                    <div className="flex items-center">
                      {doc.source === 'patient' ? (
                        <File className="h-3 w-3 mr-1" />
                      ) : (
                        <Stethoscope className="h-3 w-3 mr-1" />
                      )}
                      {doc.fileName}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedDocs[index] && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="text-xs text-muted-foreground">
                    {getDocumentDetails(selectedDocs[index]!)?.fileName}
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleZoom(index, 0.1)}
                      className="h-7 w-7 p-0"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleZoom(index, -0.1)}
                      className="h-7 w-7 p-0"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleRotate(index)}
                      className="h-7 w-7 p-0"
                    >
                      <RotateCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="border rounded-lg overflow-hidden flex items-center justify-center bg-muted/30 h-[300px]">
                  <img
                    src={selectedDocs[index]}
                    alt={`Selected document ${index + 1}`}
                    className="max-h-full max-w-full object-contain transition-all"
                    style={{
                      transform: `scale(${zoom[index]}) rotate(${rotation[index]}deg)`,
                    }}
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  {getDocumentDetails(selectedDocs[index]!)?.description || "No description"}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedDocs[0] && selectedDocs[1] && (
        <div className="text-center text-sm text-muted-foreground mt-4">
          <p>Tip: Use the zoom and rotate controls to better compare the images</p>
        </div>
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Patient Documents</CardTitle>
      </CardHeader>
      <CardContent>
        {viewMode === 'grid' ? renderDocumentGrid() : renderComparisonView()}
      </CardContent>
    </Card>
  );
} 