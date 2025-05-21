import React, { useEffect, useState } from "react";
import { usePatientAuthContext } from "@/contexts/patientAuthContext";
import { getPatientBills } from "@/utils/patientAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Download, Printer } from "lucide-react";

const PatientBills = () => {
  const { patientDetails } = usePatientAuthContext();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBills = async () => {
      if (patientDetails && patientDetails._id) {
        setLoading(true);
        try {
          const response = await getPatientBills(patientDetails._id);
          if (response.success) {
            setBills(response.bills);
          }
        } catch (error) {
          console.error("Error fetching bills:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchBills();
  }, [patientDetails]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "overdue":
        return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  // Calculate total amount due
  const totalDue = bills
    .filter(bill => bill.status === "pending" || bill.status === "overdue")
    .reduce((total, bill) => total + bill.amount, 0);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Billing History</h1>
        <p className="text-muted-foreground mt-2">
          View and manage your dental treatment bills
        </p>
      </div>

      {/* Summary Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Billing Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Due</p>
              <p className="text-2xl font-bold">${totalDue.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Payment Methods</p>
              <p className="text-sm">Credit Card, Bank Transfer</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bills Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading bills...</p>
          ) : bills.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills.map((bill) => (
                  <TableRow key={bill._id}>
                    <TableCell className="font-medium">{bill.invoiceNumber}</TableCell>
                    <TableCell>{format(new Date(bill.date), "MMM d, yyyy")}</TableCell>
                    <TableCell>{bill.description}</TableCell>
                    <TableCell>${bill.amount.toFixed(2)}</TableCell>
                    <TableCell>{getStatusBadge(bill.status)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                        <Button size="sm" variant="outline">
                          <Printer className="h-4 w-4 mr-1" />
                          Print
                        </Button>
                        {(bill.status === "pending" || bill.status === "overdue") && (
                          <Button size="sm">Pay Now</Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center py-4 text-muted-foreground">
              No billing records found.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientBills;
