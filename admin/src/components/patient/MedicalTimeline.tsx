import { Card } from "@/components/ui/card";
import { MedicalDetails } from "@/types/patient";
import { format } from "date-fns";

interface MedicalTimelineProps {
  medicalDetails: MedicalDetails[];
  onSelectRecord: (id: string) => void;
}

const formatSafeDate = (dateString: string | undefined | null) => {
  if (!dateString) return format(new Date(), "PP");
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return format(new Date(), "PP");
    }
    return format(date, "PP");
  } catch {
    return format(new Date(), "PP");
  }
};

export function MedicalTimeline({ medicalDetails, onSelectRecord }: MedicalTimelineProps) {
  // Sort medical details by date in descending order
  const sortedDetails = [...medicalDetails].sort((a, b) => {
    return new Date(b.checkUpDate).getTime() - new Date(a.checkUpDate).getTime();
  });

  return (
    <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:w-0.5 before:-translate-x-1/2 before:bg-gradient-to-b before:from-transparent before:via-foreground/20 before:to-transparent">
      {sortedDetails.map((record) => (
        <div key={record._id} className="relative pl-8">
          <div className="absolute left-0 top-3 w-3 h-3 bg-primary rounded-full" />
          
          <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer" 
                onClick={() => onSelectRecord(record._id)}>
            <div className="mb-2">
              <span className="text-sm text-muted-foreground">
                {formatSafeDate(record.checkUpDate)}
              </span>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Patient Type</p>
                  <p className="text-sm">{record.patientType}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Follow-up Date</p>
                  <p className="text-sm">
                    {record.followUpDate ? formatSafeDate(record.followUpDate) : "Not scheduled"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Diagnosis</p>
                <p className="text-sm line-clamp-2">{record.diagnosis || "No diagnosis recorded"}</p>
              </div>

              <div className="border-t pt-3">
                <p className="text-sm font-medium text-muted-foreground mb-2">Treatments</p>
                <div className="space-y-2">
                  {record.treatmentPlanning.map((treatment, idx) => (
                    <div key={idx} className="text-sm bg-muted/50 p-2 rounded">
                      <div className="flex justify-between">
                        <span>{formatSafeDate(treatment.treatmentDate)}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          treatment.isCompleted 
                            ? "bg-green-100 text-green-800" 
                            : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {treatment.isCompleted ? "Completed" : "Pending"}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-1">{treatment.treatmentDetails}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      ))}
    </div>
  );
} 