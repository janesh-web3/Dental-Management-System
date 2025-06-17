import { QRScanner } from "@/components/patient/QRScanner";
import PageHead from "@/components/shared/page-head";

export function ScanPatient() {
  return (
    <div>
      <PageHead title="Scan Patient QR Code" />
      <div className="container mx-auto py-6">
        <QRScanner />
      </div>
    </div>
  );
} 