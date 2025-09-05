import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function IncomePage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-redirect to the full-featured income management page after 3 seconds
    const timer = setTimeout(() => {
      navigate("/finance/income");
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="2xl:container mx-auto py-6">
      <Card className="bg-background border-border">
        <CardHeader>
          <CardTitle>Income Management - Redirecting...</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
          <div className="space-y-4">
            <p className="text-lg text-muted-foreground">
              This page has been moved to a better location with full functionality including payment methods and invoice generation.
            </p>
            <p className="text-sm text-muted-foreground">
              You will be automatically redirected in 3 seconds...
            </p>
            <Button 
              onClick={() => navigate("/finance/income")}
              className="mt-4"
            >
              Go to Income Management <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 