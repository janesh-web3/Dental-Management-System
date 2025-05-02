import React from "react";
import { Button } from "../ui/button";
import { CardContent, CardHeader, CardFooter, Card } from "../ui/card";

interface StudentProps {
  name: string;
  billNo: string;
  paidAmount: string;
  date: string;
}

interface BillPrintProps {
  student: StudentProps;
}

const BillPrint: React.FC<BillPrintProps> = ({ student }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-lg p-8 mx-auto bg-white shadow-lg">
      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold">Institute Name</h2>
          <p className="text-sm">Institute Address, City, Country</p>
          <p className="text-sm">Phone: +123 456 789</p>
        </CardHeader>

        <CardContent>
          <div className="mt-4">
            <div className="flex justify-between">
              <span className="font-semibold">Student Name:</span>
              <span>{student.name}</span>
            </div>
            <div className="flex justify-between mt-2">
              <span className="font-semibold">Bill Number:</span>
              <span>{student.billNo}</span>
            </div>
            <div className="flex justify-between mt-2">
              <span className="font-semibold">Paid Amount:</span>
              <span>${student.paidAmount}</span>
            </div>
            <div className="flex justify-between mt-2">
              <span className="font-semibold">Date:</span>
              <span>{student.date}</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end">
          <Button variant="outline" onClick={handlePrint}>
            Print
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default BillPrint;
