import { QRCodeSVG } from "qrcode.react";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: {
    _id: string;
    personalDetails: {
      name: string;
      contactNumber: string;
      emailAddress: string;
    };
  };
}

export function QRCodeModal({ isOpen, onClose, patient }: QRCodeModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
  });

  const qrValue = `${window.location.origin}/patient/${patient._id}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Patient QR Code</DialogTitle>
        </DialogHeader>
        <div ref={printRef} className="p-4 bg-white">
          <div className="flex flex-col items-center space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold">{patient.personalDetails.name}</h3>
              <p className="text-sm text-muted-foreground">
                {patient.personalDetails.contactNumber}
              </p>
              {patient.personalDetails.emailAddress && (
                <p className="text-sm text-muted-foreground">
                  {patient.personalDetails.emailAddress}
                </p>
              )}
            </div>
            <div className="p-4 bg-white rounded-lg border">
              <QRCodeSVG
                value={qrValue}
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>
            <div className="text-center text-sm text-muted-foreground">
              Scan to view patient details
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 