"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { CalendarIcon, X, Banknote, ArrowLeft } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { SupplierSearch } from "@/components/shared/supplier-search";
import { cn } from "@/lib/utils";
import { api } from "@/utils/api";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Define a simple schema for now, can be expanded later
const paymentVoucherSchema = z.object({
  supplier: z.string().optional(),
  location: z.string().optional(),
  documentNo: z.string().optional(),
  date: z.date().optional(),
  paymentMode: z.string().optional(),
  amount: z.string().optional(),
});

type PaymentVoucherFormValues = z.infer<typeof paymentVoucherSchema>;

export default function PaymentVoucherPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [locations, setLocations] = useState<any[]>([]);
  const [supplier, setSupplier] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [documentNo, setDocumentNo] = useState("");

  // Mock data for UI structure
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  const form = useForm<PaymentVoucherFormValues>({
    resolver: zodResolver(paymentVoucherSchema),
    defaultValues: {
      supplier: "",
      location: "",
      documentNo: "",
      paymentMode: "CASH",
      amount: "",
    },
  });

  // Fetch locations similar to PO page
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const { data: res } = await api.get("/locations");
        if (res.success) {
          setLocations(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch locations", err);
      }
    };
    fetchLocations();
  }, []);

  function onSubmit(data: PaymentVoucherFormValues) {
    console.log(data);
    toast({
      title: "You submitted the following values:",
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    });
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Banknote className="h-6 w-6" />
          <h1 className="text-xl font-semibold">Payment Voucher</h1>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            router.push("/dashboard/transactions/accept-good-note")
          }
          className="flex items-center gap-1 px-2 py-1 text-sm"
        >
          <ArrowLeft className="h-3 w-3" />
          Back
        </Button>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Top Section: Supplier, Location, Outstanding, Set Off, Doc No, Date */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-12 gap-4 items-end">
                {/* Supplier - spanning 4 cols */}
                <div className="col-span-12 md:col-span-4 lg:col-span-3">
                  <Label htmlFor="supplier" className="mb-2 block">
                    Supplier
                  </Label>
                  <SupplierSearch
                    value={supplier}
                    onValueChange={setSupplier}
                  />
                </div>

                {/* Location - spanning 3 cols */}
                <div className="col-span-12 md:col-span-3 lg:col-span-2">
                  <Label htmlFor="location" className="mb-2 block">
                    Location
                  </Label>
                  <Select
                    value={selectedLocation}
                    onValueChange={setSelectedLocation}
                  >
                    <SelectTrigger id="location">
                      <SelectValue placeholder="Select a location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((loc) => (
                        <SelectItem key={loc.id} value={loc.loca_code}>
                          {loc.loca_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Outstanding - spanning 2 cols */}
                <div className="col-span-6 md:col-span-2 lg:col-span-2">
                  <Label htmlFor="outstanding" className="mb-2 block">
                    Outstanding
                  </Label>
                  <Input
                    id="outstanding"
                    value=""
                    placeholder="0.00"
                    readOnly
                    className="text-right bg-gray-50 bg-opacity-50"
                  />
                </div>

                {/* Set Off Balance - spanning 2 cols */}
                <div className="col-span-6 md:col-span-2 lg:col-span-2">
                  <Label htmlFor="setoff" className="mb-2 block">
                    Set Off Balance
                  </Label>
                  <Input
                    id="setoff"
                    value=""
                    placeholder="0.00"
                    readOnly
                    className="text-right bg-gray-50 bg-opacity-50"
                  />
                </div>

                {/* Document No & Date - Spaced manually or float right */}
                <div className="col-span-12 md:col-span-3 lg:col-span-3 flex gap-2 items-center justify-end">
                  <div className="flex items-center">
                    <div className="bg-purple-600 text-white px-3 py-2 rounded-l-md font-medium text-sm whitespace-nowrap h-10 flex items-center">
                      Document No:
                    </div>
                    <Input
                      value={documentNo}
                      onChange={(e) => setDocumentNo(e.target.value)}
                      className="rounded-l-none border-l-0 h-10 w-24"
                    />
                  </div>
                  <div className="w-[140px]">
                    <DatePicker
                      date={date}
                      setDate={setDate}
                      className="h-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Pending Payments Section */}
            <Card className="flex flex-col h-full">
              <CardHeader className="py-3 px-4 border-b">
                <div className="text-sm font-medium text-gray-700">
                  Pending Payments
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1 flex flex-col">
                <div className="flex-1 overflow-auto max-h-[300px]">
                  <Table>
                    <TableHeader className="bg-gray-50 sticky top-0">
                      <TableRow>
                        <TableHead className="w-[50px]"></TableHead>
                        <TableHead>Document</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">
                          Balance Amount
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingPayments.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="text-center py-8 text-gray-500 text-sm"
                          >
                            No pending bills
                          </TableCell>
                        </TableRow>
                      ) : (
                        pendingPayments.map((item, i) => (
                          <TableRow key={i}>
                            {/* Table content would go here */}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="p-4 border-t mt-auto flex items-center justify-between bg-white">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="overpayment" />
                    <Label
                      htmlFor="overpayment"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Over Payment
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2 text-xs"
                    >
                      {">>"}
                    </Button>
                    <span className="text-sm font-medium">
                      Total Outstanding
                    </span>
                    <Input
                      className="w-32 h-8 text-right bg-yellow-50 border-yellow-200"
                      value="0.00"
                      readOnly
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Selected Documents Section */}
            <Card className="flex flex-col h-full">
              <CardHeader className="py-3 px-4 border-b">
                <div className="text-sm font-medium text-gray-700">
                  Selected Documents
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1 flex flex-col">
                <div className="flex-1 overflow-auto max-h-[300px]">
                  <Table>
                    <TableHeader className="bg-gray-50 sticky top-0">
                      <TableRow>
                        <TableHead>Document</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">
                          Balance Amount
                        </TableHead>
                        <TableHead className="text-right">
                          Paid Amount
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedDocuments.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="text-center py-8 text-gray-500 text-sm"
                          >
                            No documents selected
                          </TableCell>
                        </TableRow>
                      ) : // Items
                      null}
                    </TableBody>
                  </Table>
                </div>

                <div className="p-4 border-t mt-auto flex justify-end bg-white">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      Total Selected Payment
                    </span>
                    <Input
                      className="w-32 h-8 text-right bg-yellow-50 border-yellow-200"
                      value="0.00"
                      readOnly
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Payment Mode Section */}
            <Card className="flex flex-col">
              <CardHeader className="py-3 px-4 border-b">
                <div className="text-sm font-medium text-gray-700">
                  Payment Mode
                </div>
              </CardHeader>
              <CardContent className="p-4 flex-1">
                <div className="flex gap-4 mb-4">
                  <div className="w-1/2">
                    <Label className="mb-1.5 block text-xs font-medium text-gray-500">
                      Payment Mode
                    </Label>
                    <Select defaultValue="CASH">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CASH">CASH</SelectItem>
                        <SelectItem value="CHEQUE">CHEQUE</SelectItem>
                        <SelectItem value="CARD">CARD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-1/2">
                    <Label className="mb-1.5 block text-xs font-medium text-gray-500">
                      Amount
                    </Label>
                    <Input
                      type="number"
                      className="text-right"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-8">
                  <Button className="bg-blue-400 hover:bg-blue-500 text-white w-full sm:w-auto">
                    Select pending first
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Payments Section */}
            <Card className="flex flex-col">
              <CardHeader className="py-3 px-4 border-b">
                <div className="text-sm font-medium text-gray-700">
                  Payments
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1 flex flex-col">
                <div className="flex-1 overflow-auto min-h-[120px]">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead>Payment Mode</TableHead>
                        <TableHead>Cheque No</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={3}
                            className="text-center py-8 text-gray-500 text-sm"
                          >
                            No payments added
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </div>

                <div className="p-4 border-t mt-auto flex items-center justify-between bg-white">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">Balance</Label>
                    <Input
                      className="w-32 h-8 text-right bg-yellow-50 border-yellow-200"
                      value="0.00"
                      readOnly
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">Total Payment</Label>
                    <Input
                      className="w-32 h-8 text-right bg-yellow-50 border-yellow-200"
                      value="0.00"
                      readOnly
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white min-w-[100px]"
            >
              Apply
            </Button>
            <Button
              variant="secondary"
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 min-w-[100px]"
            >
              Clear
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
