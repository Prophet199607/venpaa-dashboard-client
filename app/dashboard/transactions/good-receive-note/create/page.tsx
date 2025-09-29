"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { locations, suppliers, books } from "@/lib/data";
import { Package, Trash2, CalendarDays, ArrowLeft } from "lucide-react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";

interface ProductItem {
  id: string;
  code: string;
  name: string;
  purchasePrice: number;
  packQty: number;
  qty: number;
  freeQty: number;
  totalQty: number;
  discValue: number;
  amount: number;
}

interface Book {
  id: string;
  name: string;
  code: string;
}

export default function GoodReceivedNoteForm() {
  const router = useRouter();
  const [product, setProduct] = useState("");
  const [location, setLocation] = useState("");
  const [supplier, setSupplier] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("");

  const [dateOpen, setDateOpen] = useState(false);
  const [date, setDate] = useState<Date>(new Date());

  const [actualReceivedOpen, setActualReceivedOpen] = useState(false);
  const [actualReceivedDate, setActualReceivedDate] = useState<Date>(
    new Date()
  );

  const [invoiceDateOpen, setInvoiceDateOpen] = useState(false);
  const [invoiceDate, setInvoiceDate] = useState<Date | undefined>(undefined);

  const [formData, setFormData] = useState({
    location: "",
    supplier: "",
    purchaseOrder: "Without PO",
    actualReceivedDate: "",
    paymentMethod: "",
    date: "",
    deliveryLocation: "",
    invoiceNumber: "",
    invoiceDate: "",
    invoiceAmount: "",
    deliveryAddress: "",
    poRemarks: "",
    remarks: "",
  });

  const [withoutPO, setWithoutPO] = useState(true);
  const [isReturn, setIsReturn] = useState(false);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [returnItems, setReturnItems] = useState<ProductItem[]>([]);
  const [newProduct, setNewProduct] = useState({
    code: "",
    name: "",
    purchasePrice: 0,
    packQty: 0,
    qty: 0,
    freeQty: 0,
    discValue: 0,
  });

  const [summary, setSummary] = useState({
    subTotal: 0,
    discountPercent: 0,
    discountValue: 0,
    taxPercent: 0,
    taxValue: 0,
    netAmount: 0,
  });

  function formatDate(date?: Date) {
    if (!date) return "dd/mm/yyyy";
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProductChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewProduct((prev) => ({
      ...prev,
      [name]:
        name.includes("Price") || name.includes("Qty") || name.includes("Value")
          ? parseFloat(value) || 0
          : value,
    }));
  };

  const calculateTotalQty = () => {
    return newProduct.qty + newProduct.freeQty;
  };

  const calculateAmount = () => {
    const totalQty = calculateTotalQty();
    const amount = newProduct.purchasePrice * totalQty - newProduct.discValue;
    return Math.max(0, amount);
  };

  const addProduct = () => {
    if (!newProduct.name) return;

    const totalQty = calculateTotalQty();
    const amount = calculateAmount();

    const product: ProductItem = {
      id: Date.now().toString(),
      code: newProduct.name, // Use name field for both code and name
      name: newProduct.name,
      purchasePrice: newProduct.purchasePrice,
      packQty: newProduct.packQty,
      qty: newProduct.qty,
      freeQty: newProduct.freeQty,
      totalQty,
      discValue: newProduct.discValue,
      amount,
    };

    setProducts((prev) => [...prev, product]);
    setNewProduct({
      code: "",
      name: "",
      purchasePrice: 0,
      packQty: 0,
      qty: 0,
      freeQty: 0,
      discValue: 0,
    });

    // Update summary
    const newSubTotal = products.reduce((sum, p) => sum + p.amount, 0) + amount;
    setSummary((prev) => ({
      ...prev,
      subTotal: newSubTotal,
      netAmount: newSubTotal - prev.discountValue + prev.taxValue,
    }));
  };

  const removeProduct = (id: string) => {
    setProducts((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      const newSubTotal = updated.reduce((sum, p) => sum + p.amount, 0);
      setSummary((prevSummary) => ({
        ...prevSummary,
        subTotal: newSubTotal,
        netAmount:
          newSubTotal - prevSummary.discountValue + prevSummary.taxValue,
      }));
      return updated;
    });
  };

  const handleSummaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value) || 0;

    setSummary((prev) => {
      const updated = { ...prev, [name]: numValue };

      // Calculate derived values
      if (name === "discountPercent") {
        updated.discountValue = (prev.subTotal * numValue) / 100;
      } else if (name === "taxPercent") {
        updated.taxValue =
          ((prev.subTotal - updated.discountValue) * numValue) / 100;
      }

      // Calculate net amount
      updated.netAmount =
        prev.subTotal - updated.discountValue + updated.taxValue;

      return updated;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="h-6 w-6" />
          <h1 className="text-2xl font-semibold">New Good Received Note</h1>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="without-po"
          checked={withoutPO}
          onCheckedChange={(checked) => setWithoutPO(checked as boolean)}
        />
        <Label htmlFor="without-po" className="text-sm font-medium">
          Without Purchase Order
        </Label>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-4">
            <div>
              <Label>Location*</Label>
              <Select value={location} onValueChange={setLocation} required>
                <SelectTrigger>
                  <SelectValue placeholder="--Choose Location--" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.locCode}>
                      {loc.locName} - {loc.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Supplier*</Label>
              <Select value={supplier} onValueChange={setSupplier} required>
                <SelectTrigger>
                  <SelectValue placeholder="--Select Supplier--" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((sup) => (
                    <SelectItem key={sup.id} value={sup.supCode}>
                      {sup.supName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">Purchase Order*</Label>
              <Input
                name="purchaseOrder"
                value={formData.purchaseOrder}
                onChange={handleInputChange}
                placeholder="Without PO"
                disabled
              />
            </div>

            <div>
              <Label className="text-sm font-medium">
                Actual Received Date*
              </Label>
              <Popover
                open={actualReceivedOpen}
                onOpenChange={setActualReceivedOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    id="actualReceivedDate"
                    className="w-full justify-between font-normal"
                  >
                    {formatDate(actualReceivedDate)}
                    <CalendarDays />
                  </Button>
                </PopoverTrigger>

                <PopoverContent
                  className="w-auto overflow-hidden p-0"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={actualReceivedDate}
                    onSelect={(d) => {
                      if (d) setActualReceivedDate(d);
                      setActualReceivedOpen(false);

                      setFormData((prev) => ({
                        ...prev,
                        actualReceivedDate: d
                          ? d.toISOString().split("T")[0]
                          : "",
                      }));
                    }}
                    captionLayout="dropdown"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-4">
            <div>
              <Label className="text-sm font-medium">Delivery Location</Label>
              <Select
                value={deliveryLocation}
                onValueChange={setDeliveryLocation}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="--Choose Location--" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.locCode}>
                      {loc.locName} - {loc.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">Payment Methods*</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select Payment Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">Date*</Label>
              <Popover open={dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    id="date"
                    className="w-full justify-between font-normal"
                  >
                    {formatDate(date)}
                    <CalendarDays />
                  </Button>
                </PopoverTrigger>

                <PopoverContent
                  className="w-auto overflow-hidden p-0"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => {
                      if (d) setDate(d);
                      setDateOpen(false);

                      setFormData((prev) => ({
                        ...prev,
                        date: d ? d.toISOString().split("T")[0] : "",
                      }));
                    }}
                    captionLayout="dropdown"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-4">
            <div>
              <Label className="text-sm font-medium">Invoice Number</Label>
              <Input
                name="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={handleInputChange}
                placeholder="Enter Invoice Number"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Invoice Date*</Label>
              <Popover open={invoiceDateOpen} onOpenChange={setInvoiceDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    id="invoiceDate"
                    className="w-full justify-between font-normal"
                  >
                    {formatDate(invoiceDate)}
                    <CalendarDays />
                  </Button>
                </PopoverTrigger>

                <PopoverContent
                  className="w-auto overflow-hidden p-0"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={invoiceDate}
                    onSelect={(d) => {
                      if (d) setInvoiceDate(d);
                      setInvoiceDateOpen(false);

                      setFormData((prev) => ({
                        ...prev,
                        invoiceDate: d ? d.toISOString().split("T")[0] : "",
                      }));
                    }}
                    captionLayout="dropdown"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label className="text-sm font-medium">Invoice Amount</Label>
              <Input
                name="invoiceAmount"
                value={formData.invoiceAmount}
                onChange={handleInputChange}
                placeholder="Enter Invoice Amount"
              />
            </div>
          </div>

          {/* Row 4 - Textareas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label className="text-sm font-medium">Delivery Address*</Label>
              <Textarea
                name="deliveryAddress"
                value={formData.deliveryAddress}
                onChange={handleInputChange}
                placeholder="Enter Delivery Address"
                rows={3}
              />
            </div>

            <div>
              <Label className="text-sm font-medium">PO Remarks</Label>
              <Textarea
                name="poRemarks"
                value={formData.poRemarks}
                onChange={handleInputChange}
                placeholder="PO Remarks"
                rows={3}
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Remarks</Label>
              <Textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                placeholder="Remarks"
                rows={3}
              />
            </div>
          </div>

          {/* Return Section */}
          <div className="mb-6 mt-6">
            <div className="flex items-center gap-2 mb-4">
              <Checkbox
                id="return"
                checked={isReturn}
                onCheckedChange={(checked) => setIsReturn(checked as boolean)}
              />
              <Label htmlFor="return" className="text-sm font-medium">
                RETURN
              </Label>
            </div>

            {/* Product Details Table */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Product Details</h3>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">#</TableHead>
                      <TableHead className="w-[50px]">Code</TableHead>
                      <TableHead className="w-[180px]">Name</TableHead>
                      <TableHead>Purchase Price</TableHead>
                      <TableHead>Pack Qty</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Free Qty</TableHead>
                      <TableHead>Total Qty</TableHead>
                      <TableHead>Disc</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead className="text-center">Action</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {products.length > 0 ? (
                      products.map((product, index) => (
                        <TableRow key={product.id}>
                          <TableCell className="text-center">
                            {index + 1}
                          </TableCell>
                          <TableCell className="text-right">
                            {product.code}
                          </TableCell>
                          <TableCell className="max-w-[180px] truncate">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="truncate block">
                                    {product.name}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                  {product.name}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell className="text-right">
                            {product.purchasePrice}
                          </TableCell>
                          <TableCell className="text-center">
                            {product.packQty}
                          </TableCell>
                          <TableCell className="text-center">
                            {product.qty}
                          </TableCell>
                          <TableCell className="text-center">
                            {product.freeQty}
                          </TableCell>
                          <TableCell className="text-center">
                            {product.totalQty}
                          </TableCell>
                          <TableCell className="text-right">
                            {product.discValue}
                          </TableCell>
                          <TableCell className="text-right">
                            {product.amount}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeProduct(product.id)}
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={9}
                          className="text-center py-6 text-gray-500"
                        >
                          No products added yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>

                  {products.length > 0 && (
                    <TableFooter>
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-right font-medium"
                        >
                          Subtotal
                        </TableCell>
                        <TableCell className="font-medium">
                          {summary.subTotal}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  )}
                </Table>
              </div>
            </div>
          </div>

          {/* Add Product Section */}
          <div>
            <div className="flex gap-2 items-end mb-4 overflow-x-auto">
              <div className="w-64">
                <Label>Product</Label>
                <Select value={product} onValueChange={setProduct} required>
                  <SelectTrigger>
                    <SelectValue placeholder="--Select Product--" />
                  </SelectTrigger>
                  <SelectContent>
                    {books.map((prod) => (
                      <SelectItem key={prod.code} value={prod.code}>
                        {" "}
                        {prod.code} - {prod.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-24">
                <Label>Purchase Price</Label>
                <Input
                  name="purchasePrice"
                  type="number"
                  value={newProduct.purchasePrice}
                  onChange={handleProductChange}
                  placeholder="0"
                  className="text-sm"
                />
              </div>

              <div className="w-20">
                <Label>Pack Qty</Label>
                <Input
                  name="packQty"
                  type="number"
                  value={newProduct.packQty}
                  onChange={handleProductChange}
                  placeholder="0"
                  className="text-sm"
                />
              </div>

              <div className="w-20">
                <Label>Qty</Label>
                <Input
                  name="qty"
                  type="number"
                  value={newProduct.qty}
                  onChange={handleProductChange}
                  placeholder="0"
                  className="text-sm"
                />
              </div>

              <div className="w-20">
                <Label>Free Qty</Label>
                <Input
                  name="freeQty"
                  type="number"
                  value={newProduct.freeQty}
                  onChange={handleProductChange}
                  placeholder="0"
                  className="text-sm"
                />
              </div>

              <div className="w-24">
                <Label>Total Qty</Label>
                <Input
                  value={calculateTotalQty()}
                  disabled
                  className="text-sm"
                />
              </div>

              <div className="w-24">
                <Label>Amount</Label>
                <Input value={calculateAmount()} disabled className="text-sm" />
              </div>

              <div className="w-20">
                <Label>Discount</Label>
                <Input
                  name="discValue"
                  type="number"
                  value={newProduct.discValue}
                  onChange={handleProductChange}
                  placeholder="0"
                  className="text-sm"
                />
              </div>

              <div className="w-20">
                <Button onClick={addProduct} size="sm" className="w-20 h-9">
                  ADD
                </Button>
              </div>
            </div>
          </div>

          {/* Summary Section */}
          <div className="flex justify-end mt-10">
            <div className="space-y-2 w-full max-w-md">
              {" "}
              <div className="flex items-center gap-4">
                <Label className="w-24">Sub Total</Label>
                <Input value={summary.subTotal} disabled className="flex-1" />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-24">Discount</Label>
                <Input
                  name="discount"
                  type="text"
                  value={
                    summary.discountPercent
                      ? `${summary.discountPercent}%`
                      : summary.discountValue
                  }
                  className="flex-1"
                />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-24">Tax</Label>
                <Input
                  name="tax"
                  type="text"
                  value={
                    summary.taxPercent
                      ? `${summary.taxPercent}%`
                      : summary.taxValue
                  }
                  className="flex-1"
                  placeholder="0 or 0%"
                />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-24">Net Amount</Label>
                <Input value={summary.netAmount} disabled className="flex-1" />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-8">
            <Button variant="outline">DRAFT GRN</Button>
            <Button>APPLY GRN</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
