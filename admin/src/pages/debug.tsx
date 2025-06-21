import DashboardLayout from "@/components/layout/dashboard-layout";
import SocketDebugPanel from "@/components/dev/socket-debug-panel";

export default function DebugPage() {
  return (
    <DashboardLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Debug Tools</h1>
        <p className="text-muted-foreground">
          This page contains tools to help debug application features.
        </p>
        
        <div className="mt-6">
          <SocketDebugPanel />
        </div>
      </div>
    </DashboardLayout>
  );
}
