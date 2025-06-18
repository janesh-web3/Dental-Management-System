import { useEffect, useState } from "react";
import { useAdminContext } from "@/contexts";
import PageTitle from "@/components/shared/page-title";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  CheckIcon,
  Trash2,
  RefreshCw,
  Check,
  CalendarIcon,
  FilterIcon,
  X,
} from "lucide-react";
import { format, parseISO, isEqual } from "date-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "react-toastify";
import { Notification } from "@/types/notification";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "@/services/notificationService";

export default function NotificationsPage() {
  const { adminDetails } = useAdminContext();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [isReadFilter, setIsReadFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [date, setDate] = useState<Date | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [currentView, setCurrentView] = useState<"list" | "card">("list");

  // Fetch notifications based on current filters
  const fetchNotifications = async (pageNum = 1, replace = true) => {
    if (!adminDetails?._id) return;

    try {
      setLoading(true);
      const response = await getNotifications(
        adminDetails._id,
        "User",
        pageNum,
        10,
        isReadFilter === "read"
          ? true
          : isReadFilter === "unread"
            ? false
            : undefined
      );

      if (response.success) {
        let filteredNotifications = response.data.notifications;

        // Apply client-side filters (type and date)
        if (typeFilter) {
          filteredNotifications = filteredNotifications.filter(
            (notification) => notification.type === typeFilter
          );
        }

        if (date) {
          filteredNotifications = filteredNotifications.filter(
            (notification) => {
              const notificationDate = parseISO(notification.createdAt);
              return isEqual(
                new Date(
                  notificationDate.getFullYear(),
                  notificationDate.getMonth(),
                  notificationDate.getDate()
                ),
                new Date(date.getFullYear(), date.getMonth(), date.getDate())
              );
            }
          );
        }

        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filteredNotifications = filteredNotifications.filter(
            (notification) =>
              notification.title.toLowerCase().includes(query) ||
              notification.description.toLowerCase().includes(query)
          );
        }

        if (replace) {
          setNotifications(filteredNotifications);
        } else {
          setNotifications((prev) => [...prev, ...filteredNotifications]);
        }

        setHasMore(response.data.hasNextPage);
        setPage(response.data.currentPage);
        setTotalCount(response.data.totalCount);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  };

  // Load more notifications
  const loadMore = () => {
    if (hasMore && !loading) {
      fetchNotifications(page + 1, false);
    }
  };

  // Handle mark as read/unread
  const handleMarkAsRead = async (
    notificationId: string,
    _currentStatus: boolean
  ) => {
    try {
      setLoading(true);
      const response = await markAsRead(notificationId);

      if (response.success) {
        // Update local state
        setNotifications((prev) =>
          prev.map((notification) =>
            notification._id === notificationId
              ? { ...notification, isRead: true }
              : notification
          )
        );
        toast.success("Notification marked as read");
      }
    } catch (error) {
      console.error("Error marking notification:", error);
      toast.error("Failed to update notification");
    } finally {
      setLoading(false);
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    if (!adminDetails?._id) return;

    try {
      setLoading(true);
      const response = await markAllAsRead(adminDetails._id, "User");

      if (response.success) {
        // Update all notifications in state to read
        setNotifications((prev) =>
          prev.map((notification) => ({ ...notification, isRead: true }))
        );
        toast.success(`Marked ${response.modifiedCount} notifications as read`);
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast.error("Failed to update notifications");
    } finally {
      setLoading(false);
    }
  };

  // Handle delete notification
  const handleDeleteNotification = async (notificationId: string) => {
    try {
      setLoading(true);
      const response = await deleteNotification(notificationId);

      if (response.success) {
        // Remove from local state
        setNotifications((prev) =>
          prev.filter((notification) => notification._id !== notificationId)
        );
        toast.success("Notification deleted");
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Failed to delete notification");
    } finally {
      setLoading(false);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setTypeFilter(null);
    setIsReadFilter(null);
    setSearchQuery("");
    setDate(null);
  };

  // Format date/time helpers
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "PP");
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return format(parseISO(dateString), "p");
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(parseISO(dateString), "PPp");
    } catch {
      return dateString;
    }
  };

  // Get badge variant based on notification type
  const getTypeVariant = (type: string) => {
    switch (type) {
      case "info":
        return "default";
      case "success":
        return "default"; // Using default instead of success due to shadcn constraints
      case "warning":
        return "secondary";
      case "error":
        return "destructive";
      default:
        return "default";
    }
  };

  // Initial fetch
  useEffect(() => {
    if (adminDetails?._id) {
      fetchNotifications();
    }
  }, [adminDetails?._id, typeFilter, isReadFilter, searchQuery, date]);

  return (
    <div className="container mx-auto py-6">
      <PageTitle
        heading="Notifications"
        text="View and manage your notification history"
      />

      <div className="flex flex-col-reverse md:flex-row gap-4 mt-4">
        {/* Main Content */}
        <div className="w-full">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Notification History</CardTitle>
                  <CardDescription>
                    You have {totalCount} total notifications
                  </CardDescription>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <FilterIcon className="h-4 w-4 mr-1" />
                    {showFilters ? "Hide Filters" : "Show Filters"}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentView(currentView === "list" ? "card" : "list")
                    }
                  >
                    {currentView === "list" ? "Card View" : "List View"}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchNotifications()}
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                    />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Check className="h-4 w-4 mr-1" />
                        Mark All Read
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Mark all as read?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will mark all your notifications as read. You
                          can't undo this action.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleMarkAllAsRead}>
                          Continue
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              {/* Filters */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 p-4 border rounded-md bg-muted/30">
                  <div>
                    <Label htmlFor="search">Search</Label>
                    <Input
                      id="search"
                      placeholder="Search notifications..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={typeFilter || ""}
                      onValueChange={(value) => setTypeFilter(value || null)}
                    >
                      <SelectTrigger id="type" className="mt-1">
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All types</SelectItem>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="success">Success</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={isReadFilter || ""}
                      onValueChange={(value) => setIsReadFilter(value || null)}
                    >
                      <SelectTrigger id="status" className="mt-1">
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All statuses</SelectItem>
                        <SelectItem value="read">Read</SelectItem>
                        <SelectItem value="unread">Unread</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full mt-1 justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={date || undefined}
                          onSelect={(date) => setDate(date || null)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="md:col-span-4 flex justify-end">
                    <Button variant="outline" size="sm" onClick={clearFilters}>
                      <X className="h-4 w-4 mr-1" />
                      Clear Filters
                    </Button>
                  </div>
                </div>
              )}
            </CardHeader>

            <CardContent>
              {loading && notifications.length === 0 ? (
                <div className="flex justify-center items-center h-40">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">
                    No notifications found
                  </p>
                </div>
              ) : currentView === "list" ? (
                <div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Type</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead className="hidden md:table-cell">
                          Date
                        </TableHead>
                        <TableHead className="hidden md:table-cell">
                          Status
                        </TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {notifications.map((notification) => (
                        <TableRow
                          key={notification._id}
                          className={notification.isRead ? "" : "bg-muted/50"}
                        >
                          <TableCell>
                            <Badge variant={getTypeVariant(notification.type)}>
                              {notification.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p
                                className={
                                  notification.isRead ? "" : "font-medium"
                                }
                              >
                                {notification.title}
                              </p>
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {notification.description}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="text-sm">
                              <p>{formatDate(notification.createdAt)}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatTime(notification.createdAt)}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {notification.isRead ? (
                              <Badge variant="outline">Read</Badge>
                            ) : (
                              <Badge variant="secondary">Unread</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              {!notification.isRead && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    handleMarkAsRead(
                                      notification._id,
                                      notification.isRead
                                    )
                                  }
                                  title="Mark as read"
                                >
                                  <CheckIcon className="h-4 w-4" />
                                </Button>
                              )}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    title="Delete notification"
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Delete notification?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently delete this
                                      notification.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() =>
                                        handleDeleteNotification(
                                          notification._id
                                        )
                                      }
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {hasMore && (
                    <div className="flex justify-center mt-4">
                      <Button
                        variant="outline"
                        onClick={loadMore}
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          "Load More"
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {notifications.map((notification) => (
                    <Card
                      key={notification._id}
                      className={
                        notification.isRead
                          ? ""
                          : "bg-muted/50 border-primary/50"
                      }
                    >
                      <CardHeader className="pb-2">
                        <div className="flex justify-between">
                          <Badge
                            variant={getTypeVariant(notification.type)}
                            className="mb-2"
                          >
                            {notification.type}
                          </Badge>
                          {notification.isRead ? (
                            <Badge variant="outline">Read</Badge>
                          ) : (
                            <Badge variant="secondary">Unread</Badge>
                          )}
                        </div>
                        <CardTitle className="text-base">
                          {notification.title}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {formatDateTime(notification.createdAt)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm mb-4">
                          {notification.description}
                        </p>
                        <div className="flex justify-end space-x-2">
                          {!notification.isRead && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleMarkAsRead(
                                  notification._id,
                                  notification.isRead
                                )
                              }
                            >
                              <CheckIcon className="h-4 w-4 mr-1" />
                              Mark as read
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4 mr-1 text-destructive" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete notification?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete this
                                  notification.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleDeleteNotification(notification._id)
                                  }
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {hasMore && (
                    <div className="flex justify-center mt-4 md:col-span-2">
                      <Button
                        variant="outline"
                        onClick={loadMore}
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          "Load More"
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
