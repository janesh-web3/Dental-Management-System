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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Search, MessageSquare, Users } from "lucide-react";
import { crudRequest } from "@/lib/api";

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
  campaignId?: string;
  patientClass?: 'A' | 'B' | 'C';
  createdAt: string;
  updatedAt: string;
};

export default function SMSHistoryPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [campaignFilter, setCampaignFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Regular SMS history query
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

      const typedResponse = response as ApiResponse<{
        history: SMSHistory[];
        total: number;
      }>;

      if (!typedResponse.success) {
        throw new Error("Failed to fetch SMS history");
      }

      return typedResponse;
    },
    enabled: activeTab === "all",
  });

  // Class-based SMS history query
  const { data: classData, isLoading: classLoading } = useQuery<
    ApiResponse<{ history: SMSHistory[]; total: number }>
  >({
    queryKey: [
      "smsHistoryByClass",
      { page, limit, status: statusFilter, className: classFilter, campaignId: campaignFilter },
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      if (classFilter !== "all") {
        params.append("className", classFilter);
      }

      if (campaignFilter) {
        params.append("campaignId", campaignFilter);
      }

      const response = await crudRequest(
        "GET",
        `/sms/history-by-class?${params.toString()}`
      );

      const typedResponse = response as ApiResponse<{
        history: SMSHistory[];
        total: number;
      }>;

      if (!typedResponse.success) {
        throw new Error("Failed to fetch class-based SMS history");
      }

      return typedResponse;
    },
    enabled: activeTab === "class",
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

  // Get current data based on active tab
  const currentLoading = activeTab === "all" ? isLoading : classLoading;

  const renderHistoryTable = (historyData: SMSHistory[] | undefined) => (
    <div className="relative overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Recipient</TableHead>
            <TableHead>Message</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Class/Campaign</TableHead>
            <TableHead>Sent By</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Credit</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={`skeleton-${i}`}>
                <TableCell colSpan={7}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : historyData && historyData.length > 0 ? (
            historyData.map((item: SMSHistory) => (
              <TableRow key={item._id}>
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
                  {item.patientClass && (
                    <Badge variant="outline" className="mr-2">
                      Class {item.patientClass}
                    </Badge>
                  )}
                  {item.campaignId && (
                    <div className="text-xs text-muted-foreground">
                      Campaign: {item.campaignId.split('_')[0]}
                    </div>
                  )}
                  {item.isBulk && !item.patientClass && (
                    <Badge variant="secondary" className="text-xs">
                      Bulk
                    </Badge>
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
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center py-8 text-muted-foreground"
              >
                No SMS history found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">SMS History</h1>
          <p className="text-muted-foreground">
            View and manage your SMS message history with class-based filtering
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            All Messages
          </TabsTrigger>
          <TabsTrigger value="class" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Class-Based SMS
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                All SMS Messages
              </CardTitle>
              <CardDescription>
                Complete history of all SMS messages sent from the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-x-4 md:space-y-0 mb-4">
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

              {renderHistoryTable(data?.data?.history)}

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
                <div className="flex items-center justify-end space-x-2">
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="class" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Class-Based SMS History
              </CardTitle>
              <CardDescription>
                View SMS messages organized by patient classes and campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-x-4 md:space-y-0 mb-4">
                <div className="flex items-center space-x-2 flex-1">
                  <Select
                    value={classFilter}
                    onValueChange={(value) => {
                      setClassFilter(value);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      <SelectItem value="A">Class A</SelectItem>
                      <SelectItem value="B">Class B</SelectItem>
                      <SelectItem value="C">Class C</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="Campaign ID..."
                    className="w-[200px]"
                    value={campaignFilter}
                    onChange={(e) => {
                      setCampaignFilter(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Select
                    value={statusFilter}
                    onValueChange={(value) => {
                      setStatusFilter(value);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
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

              {renderHistoryTable(classData?.data?.history)}

              <div className="flex items-center justify-between px-4 py-3 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing{" "}
                  <span className="font-medium">
                    {classData?.data ? (page - 1) * limit + 1 : 0}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium">
                    {classData?.data ? Math.min(page * limit, classData.data.total) : 0}
                  </span>{" "}
                  of <span className="font-medium">{classData?.data?.total || 0}</span>{" "}
                  messages
                </div>
                <div className="flex items-center justify-end space-x-2">
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
                    disabled={!classData?.hasMore}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
