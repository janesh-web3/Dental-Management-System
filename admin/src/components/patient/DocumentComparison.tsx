import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Document {
  fileName: string;
  fileUrl: string;
  uploadDate: string;
}

interface DocumentComparisonProps {
  documents: Document[];
}

export function DocumentComparison({ documents }: DocumentComparisonProps) {
  const [selectedDocs, setSelectedDocs] = useState<[string?, string?]>([]);
  const imageDocuments = documents.filter(doc => 
    doc.fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)
  );

  if (imageDocuments.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Document Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500">
            At least 2 image documents are required for comparison
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compare Documents</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          {[0, 1].map((index) => (
            <div key={index} className="space-y-2">
              <Select
                value={selectedDocs[index]}
                onValueChange={(value) => {
                  const newDocs = [...selectedDocs];
                  newDocs[index] = value;
                  setSelectedDocs(newDocs as [string?, string?]);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select document" />
                </SelectTrigger>
                <SelectContent>
                  {imageDocuments.map((doc) => (
                    <SelectItem key={doc.fileUrl} value={doc.fileUrl}>
                      {doc.fileName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedDocs[index] && (
                <div className="border rounded-lg overflow-hidden">
                  <img
                    src={selectedDocs[index]}
                    alt={`Selected document ${index + 1}`}
                    className="w-full h-auto"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* {selectedDocs[0] && selectedDocs[1] && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => window.open(`/compare?doc1=${selectedDocs[0]}&doc2=${selectedDocs[1]}`, '_blank')}
            >
              Open in Full Screen
            </Button>
          </div>
        )} */}
      </CardContent>
    </Card>
  );
} 