import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SMSDashboardCardProps {
  creditInfo: {
    availableCredit?: number;
    totalUsed?: number;
    lastUpdated?: string;
    error?: string;
  };
  loading?: boolean;
  onRefresh?: () => void;
}

export function SMSDashboardCard({ creditInfo, loading = false, onRefresh }: SMSDashboardCardProps) {
  const { availableCredit, totalUsed, lastUpdated, error } = creditInfo;
  
  const getCreditStatus = () => {
    if (availableCredit === undefined) return 'info';
    if (availableCredit < 50) return 'critical';
    if (availableCredit < 200) return 'warning';
    return 'good';
  };

  const status = getCreditStatus();
  
  const statusMessages = {
    info: 'Check your SMS balance',
    good: 'Sufficient balance',
    warning: 'Low balance',
    critical: 'Critical: Top up required'
  };

  const statusColors = {
    info: 'bg-blue-100 text-blue-800',
    good: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    critical: 'bg-red-100 text-red-800'
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-sm font-medium">SMS Credits</CardTitle>
          <CardDescription>
            {status === 'info' 
              ? 'Check your SMS balance' 
              : `Last updated: ${lastUpdated ? new Date(lastUpdated).toLocaleString() : 'Never'}`}
          </CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <CreditCard className="h-5 w-5 text-muted-foreground" />
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onRefresh} 
            disabled={loading}
            className="h-8 w-8" 
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="flex items-center space-x-2 text-red-500">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Error loading credit information</span>
          </div>
        ) : loading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold">
              {availableCredit?.toLocaleString() || 'N/A'} SMS
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-muted-foreground">
                Used: {totalUsed?.toLocaleString() || '0'}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full ${statusColors[status] || ''}`}>
                {statusMessages[status]}
              </span>
            </div>
            
            {status === 'critical' && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="mt-2 text-xs text-red-600 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Low credit. Please top up to avoid service interruption.
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Contact your system administrator to add more SMS credits.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
