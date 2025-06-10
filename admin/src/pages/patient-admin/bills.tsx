import React, { useEffect, useState } from "react";
import { usePatientAuthContext } from "@/contexts";
import { getPatientBills } from "@/utils/patientAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Receipt, ArrowDown, ArrowUp } from "lucide-react";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PatientBills: React.FC = () => {
  const { patientDetails } = usePatientAuthContext();
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortField, setSortField] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    const fetchBills = async () => {
      if (patientDetails._id) {
        try {
          setLoading(true);
          const response = await getPatientBills(patientDetails._id);
          if (response.success && response.bills) {
            setBills(response.bills);
          } else {
            setError(response.message || "Failed to fetch billing data");
          }
        } catch (error) {
          console.error("Error fetching bills:", error);
          setError("An error occurred while fetching billing data");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchBills();
  }, [patientDetails._id]);

  // Sort and filter bills
  const sortedAndFilteredBills = [...bills]
    .filter(bill => {
      if (filterStatus === "all") return true;
      if (filterStatus === "paid") return bill.isCompleted;
      if (filterStatus === "pending") return !bill.isCompleted;
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.date || 0).getTime();
      const dateB = new Date(b.date || 0).getTime();
      
      if (sortField === "date") {
        return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
      }
      
      if (sortField === "amount") {
        return sortDirection === "asc" 
          ? a.totalAmount - b.totalAmount 
          : b.totalAmount - a.totalAmount;
      }
      
      if (sortField === "remaining") {
        return sortDirection === "asc" 
          ? a.remainingAmount - b.remainingAmount 
          : b.remainingAmount - a.remainingAmount;
      }
      
      return 0;
    });

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />;
  };

  // Calculate totals
  const totalBilled = bills.reduce((sum, bill) => sum + bill.totalAmount, 0);
  const totalPaid = bills.reduce((sum, bill) => sum + bill.paidAmount, 0);
  const totalRemaining = bills.reduce((sum, bill) => sum + bill.remainingAmount, 0);

  return (
    <div className="container mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-6">Billing History</h1>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Billing Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Billed</p>
                <p className="text-2xl font-bold">₹{totalBilled.toFixed(2)}</p>
              </div>
              <Receipt className="h-8 w-8 text-primary opacity-70" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Paid</p>
                <p className="text-2xl font-bold">₹{totalPaid.toFixed(2)}</p>
              </div>
              <Receipt className="h-8 w-8 text-green-500 opacity-70" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Remaining</p>
                <p className="text-2xl font-bold">₹{totalRemaining.toFixed(2)}</p>
              </div>
              <Receipt className="h-8 w-8 text-amber-500 opacity-70" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/3">
              <Label htmlFor="status-filter">Filter by Status</Label>
              <Select
                value={filterStatus}
                onValueChange={setFilterStatus}
              >
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Bills</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Bills Table */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : sortedAndFilteredBills.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No billing records found.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Billing Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => toggleSort("date")}
                    >
                      <div className="flex items-center">
                        Date
                        {getSortIcon("date")}
                      </div>
                    </TableHead>
                    <TableHead>Treatment</TableHead>
                    <TableHead 
                      className="cursor-pointer text-right"
                      onClick={() => toggleSort("amount")}
                    >
                      <div className="flex items-center justify-end">
                        Amount
                        {getSortIcon("amount")}
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead 
                      className="cursor-pointer text-right"
                      onClick={() => toggleSort("remaining")}
                    >
                      <div className="flex items-center justify-end">
                        Remaining
                        {getSortIcon("remaining")}
                      </div>
                    </TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedAndFilteredBills.map((bill, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {bill.date ? format(new Date(bill.date), "MMM d, yyyy") : "N/A"}
                      </TableCell>
                      <TableCell>
                        {bill.treatments && bill.treatments.length > 0 
                          ? bill.treatments.map((t: any) => t.procedure).join(", ")
                          : "Dental Treatment"
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        ₹{bill.totalAmount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        ₹{bill.paidAmount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        ₹{bill.remainingAmount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={bill.isCompleted ? "default" : "outline"}>
                          {bill.isCompleted ? "Paid" : "Pending"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PatientBills;
