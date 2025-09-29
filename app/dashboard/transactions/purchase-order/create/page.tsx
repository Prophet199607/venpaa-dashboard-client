"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { locations, suppliers, books } from "@/lib/data";
import { ShoppingBag, Trash2, CalendarDays, ArrowLeft } from "lucide-react";
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

export default function PurchaseOrderForm() {
  const router = useRouter();
  const [product, setProduct] = useState("");
  const [location, setLocation] = useState("");
  const [supplier, setSupplier] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("");

  const [dateOpen, setDateOpen] = useState(false);
  const [date, setDate] = useState<Date>(new Date());
  const [expectedDateOpen, setExpectedDateOpen] = useState(false);
  const [expectedDate, setExpectedDate] = useState<Date | undefined>(undefined);

  const [formData, setFormData] = useState({
    location: "",
    date: "",
    paymentMethod: "",
    supplier: "",
    expectedDate: "",
    deliveryLocation: "",
    remarks: "",
    deliveryAddress: "",
  });

  const [products, setProducts] = useState<ProductItem[]>([]);
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

  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();

    setSummary((prev) => {
      const updated = { ...prev };

      if (value.endsWith("%")) {
        // Discount entered as percentage
        const num = parseFloat(value.slice(0, -1)) || 0;
        updated.discountPercent = num;
        updated.discountValue = (prev.subTotal * num) / 100;
      } else {
        // Discount entered as amount
        const num = parseFloat(value) || 0;
        updated.discountValue = num;
        updated.discountPercent = prev.subTotal
          ? (num / prev.subTotal) * 100
          : 0;
      }

      // Recalculate net amount
      updated.netAmount = prev.subTotal - updated.discountValue + prev.taxValue;

      return updated;
    });
  };

  const handleTaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();

    setSummary((prev) => {
      const updated = { ...prev };

      const taxableAmount = prev.subTotal - prev.discountValue;

      if (value.endsWith("%")) {
        // Tax entered as percentage
        const num = parseFloat(value.slice(0, -1)) || 0;
        updated.taxPercent = num;
        updated.taxValue = (taxableAmount * num) / 100;
      } else {
        // Tax entered as amount
        const num = parseFloat(value) || 0;
        updated.taxValue = num;
        updated.taxPercent = taxableAmount ? (num / taxableAmount) * 100 : 0;
      }

      // Recalculate net amount
      updated.netAmount = prev.subTotal - prev.discountValue + updated.taxValue;

      return updated;
    });
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
    if (!product) return;

    // Find the selected book to get the name
    const selectedBook = books.find((book) => book.code === product);
    if (!selectedBook) return;

    const totalQty = calculateTotalQty();
    const amount = calculateAmount();

    const productItem: ProductItem = {
      id: Date.now().toString(),
      code: product,
      name: selectedBook.name,
      purchasePrice: newProduct.purchasePrice,
      packQty: newProduct.packQty,
      qty: newProduct.qty,
      freeQty: newProduct.freeQty,
      totalQty,
      discValue: newProduct.discValue,
      amount,
    };

    // Add the new product
    setProducts((prev) => {
      const updatedProducts = [...prev, productItem];

      // Update summary after adding
      const newSubTotal = updatedProducts.reduce((sum, p) => sum + p.amount, 0);
      setSummary((prevSummary) => ({
        ...prevSummary,
        subTotal: newSubTotal,
        netAmount:
          newSubTotal - prevSummary.discountValue + prevSummary.taxValue,
      }));

      return updatedProducts;
    });

    // Reset the newProduct state
    setNewProduct({
      code: "",
      name: "",
      purchasePrice: 0,
      packQty: 0,
      qty: 0,
      freeQty: 0,
      discValue: 0,
    });

    // Reset selected product
    setProduct("");
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShoppingBag className="h-6 w-6" />
          <h1 className="text-2xl font-semibold">New Purchase Order</h1>
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
      <div className="flex justify-end m-0">
        <Badge variant="secondary" className="p-3">
          Document No:
        </Badge>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-4">
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
              <Label>Date*</Label>
              <Popover open={dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    id="date"
                    className="w-full justify-between font-normal"
                    disabled
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
                    }}
                    captionLayout="dropdown"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Payment Methods*</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="--Select Payment method--" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
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
              <Label>Expected Date*</Label>
              <Popover
                open={expectedDateOpen}
                onOpenChange={setExpectedDateOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    id="expectedDate"
                    className="w-full justify-between font-normal"
                  >
                    {formatDate(expectedDate)}
                    <CalendarDays />
                  </Button>
                </PopoverTrigger>

                <PopoverContent
                  className="w-auto overflow-hidden p-0"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={expectedDate}
                    onSelect={(d) => {
                      if (d) setExpectedDate(d);
                      setExpectedDateOpen(false);
                    }}
                    captionLayout="dropdown"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Delivery Location*</Label>
              <Select
                value={deliveryLocation}
                onValueChange={setDeliveryLocation}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="--Select Delivery Location--" />
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
            <div>
              <Label>Remarks</Label>
              <Textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                placeholder="Enter your remarks"
                rows={2}
              />
            </div>
            <div>
              <Label>Delivery Address*</Label>
              <Textarea
                name="deliveryAddress"
                value={formData.deliveryAddress}
                onChange={handleInputChange}
                placeholder="Enter Delivery Address"
                rows={2}
              />
            </div>
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
                      <TableCell colSpan={8} className="text-right font-medium">
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
                  onChange={handleDiscountChange}
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
                  onChange={handleTaxChange}
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
            <Button variant="outline">DRAFT PO</Button>
            <Button>APPLY PO</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
