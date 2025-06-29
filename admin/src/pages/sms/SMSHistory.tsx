import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { crudRequest } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// Interface for the API response
interface ApiResponse<T> {
  success: boolean;
  data: T;
  total: number;
  page: number;
  limit: number;
  pages: number;
  hasMore: boolean;
}

type SMSHistory = {
  _id: string;
  recipient: string;
  message: string;
  status:
    | "pending"
    | "sent"
    | "delivered"
    | "failed"
    | "undelivered"
    | "scheduled"
    | "queued"
    | "aborted";
  messageId?: string;
  networkProvider?: string;
  credit?: number;
  errorMessage?: string;
  sentBy: {
    _id: string;
    name: string;
    email: string;
  };
  patient?: {
    _id: string;
    personalDetails: {
      name: string;
    };
  };
  templateUsed?: {
    _id: string;
    name: string;
  };
  isBulk: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function SMSHistoryPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSMS, setSelectedSMS] = useState<SMSHistory | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const { data, isLoading, isError, error } = useQuery<
    ApiResponse<{ history: SMSHistory[]; total: number }>
  >({
    queryKey: [
      "smsHistory",
      { page, limit, status: statusFilter, search: searchQuery },
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      if (searchQuery) {
        params.append("search", searchQuery);
      }

      const response = await crudRequest(
        "GET",
        `/sms/history?${params.toString()}`
      );
      console.log("SMS History Response:", response);

      // Narrow the type of response
      const typedResponse = response as ApiResponse<{
        history: SMSHistory[];
        total: number;
      }>;

      if (!typedResponse.success) {
        throw new Error("Failed to fetch SMS history");
      }

      // Return the response directly since it's already in the right format
      return typedResponse;
    },
  });

  useEffect(() => {
    if (isError) {
      toast.error("Failed to load SMS history", {
        description: error?.message || "Please try again later",
      });
    }
  }, [isError, error]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page when searching
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy h:mm a");
    } catch (error) {
      return "Invalid date";
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      sent: "bg-blue-100 text-blue-800 hover:bg-blue-100",
      delivered: "bg-green-100 text-green-800 hover:bg-green-100",
      failed: "bg-red-100 text-red-800 hover:bg-red-100",
      pending: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
      scheduled: "bg-purple-100 text-purple-800 hover:bg-purple-100",
      undelivered: "bg-orange-100 text-orange-800 hover:bg-orange-100",
      queued: "bg-cyan-100 text-cyan-800 hover:bg-cyan-100",
      aborted: "bg-gray-100 text-gray-800 hover:bg-gray-100",
    };

    return (
      <Badge
        className={`${statusMap[status as keyof typeof statusMap] || "bg-gray-100"} capitalize`}
      >
        {status}
      </Badge>
    );
  };

  const handleViewDetails = (sms: SMSHistory) => {
    setSelectedSMS(sms);
    setDetailsOpen(true);
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">SMS History</h1>
          <p className="text-muted-foreground">
            View and manage your SMS message history
          </p>
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <div className="p-4 border-b">
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-x-4 md:space-y-0">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by recipient, message, or ID..."
                  className="pl-8 w-full md:w-[300px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>
            <div className="flex items-center space-x-2">
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="undelivered">Undelivered</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={limit.toString()}
                onValueChange={(value) => {
                  setLimit(Number(value));
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Rows" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="relative overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipient</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Credit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : data?.data?.history && data.data.history.length > 0 ? (
                data.data.history.map((item: SMSHistory) => (
                  <TableRow
                    key={item._id}
                    onClick={() => handleViewDetails(item)}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell className="font-medium">
                      {item.recipient}
                      {item.patient && (
                        <div className="text-sm text-muted-foreground">
                          {item.patient.personalDetails?.name || "N/A"}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate">
                      {item.message}
                      {item.templateUsed && (
                        <div className="text-xs text-muted-foreground">
                          Template: {item.templateUsed.name}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(item.status)}
                      {item.errorMessage && (
                        <div className="text-xs text-red-500 mt-1">
                          {item.errorMessage}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.sentBy?.name || "System"}
                      <div className="text-xs text-muted-foreground">
                        {formatDate(item.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {item.credit ? `${item.credit} credits` : "N/A"}
                      {item.isBulk && (
                        <div className="text-xs text-muted-foreground">
                          Bulk
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No SMS history found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t">
          <div className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-medium">
              {data?.data ? (page - 1) * limit + 1 : 0}
            </span>{" "}
            to{" "}
            <span className="font-medium">
              {data?.data ? Math.min(page * limit, data.data.total) : 0}
            </span>{" "}
            of <span className="font-medium">{data?.data?.total || 0}</span>{" "}
            messages
          </div>
          <div className="flex items-center justify-end space-x-2 px-4 py-3 bg-muted/50">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((old) => Math.max(old - 1, 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((old) => old + 1)}
              disabled={!data?.hasMore}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* SMS Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>SMS Details</DialogTitle>
          </DialogHeader>

          {selectedSMS && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Status
                  </h3>
                  <div className="mt-1">{getStatusBadge(selectedSMS.status)}</div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Date
                  </h3>
                  <div className="mt-1">{formatDate(selectedSMS.createdAt)}</div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Recipient
                  </h3>
                  <div className="mt-1 font-medium">{selectedSMS.recipient}</div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Message ID
                  </h3>
                  <div className="mt-1">{selectedSMS.messageId || "N/A"}</div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Network Provider
                  </h3>
                  <div className="mt-1">{selectedSMS.networkProvider || "N/A"}</div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Credits Used
                  </h3>
                  <div className="mt-1">{selectedSMS.credit || "N/A"}</div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Type
                  </h3>
                  <div className="mt-1 capitalize">
                    {selectedSMS.isBulk ? "Bulk" : "Single"}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Sent By
                  </h3>
                  <div className="mt-1">{selectedSMS.sentBy?.name || "System"}</div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Message
                </h3>
                <div className="p-3 bg-muted rounded-md whitespace-pre-wrap font-mono text-sm">
                  {selectedSMS.message}
                </div>
              </div>

              {selectedSMS.patient && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Patient
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {selectedSMS.patient.personalDetails?.name || "Unknown"}
                    </span>
                  </div>
                </div>
              )}

              {selectedSMS.errorMessage && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Error
                  </h3>
                  <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
                    {selectedSMS.errorMessage}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
