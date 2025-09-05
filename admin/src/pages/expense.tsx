import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function ExpensePage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-redirect to the full-featured expense management page after 3 seconds
    const timer = setTimeout(() => {
      navigate("/finance/expense");
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="container mx-auto py-6">
      <Card className="bg-background border-border">
        <CardHeader>
          <CardTitle>Expense Management - Redirecting...</CardTitle>
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
              onClick={() => navigate("/finance/expense")}
              className="mt-4"
            >
              Go to Expense Management <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 