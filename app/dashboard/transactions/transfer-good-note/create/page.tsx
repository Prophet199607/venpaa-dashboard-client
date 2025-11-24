"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { ArrowLeftRight, Calendar, X } from "lucide-react";
import { ShoppingBag, Trash2, ArrowLeft } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  sellingPrice: number;
  purchasePrice: number;
  packSize: number;
  packQty: number;
  unitQty: number;
  amount: number;
}

interface Book {
  id: string;
  name: string;
  code: string;
}

export default function TransferGoodsNoteForm() {
  const router = useRouter();
  const [product, setProduct] = useState("");
  const [supplier, setSupplier] = useState("");
  const [locationTo, setLocationTo] = useState("");
  const [locationFrom, setLocationFrom] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("");

  const [date, setDate] = useState<Date | undefined>(undefined);

  const handleDateChange = (newDate: Date | undefined) => {
    if (newDate) setDate(newDate);
  };

  const [formData, setFormData] = useState({
    locationFrom: "",
    transactionType: "",
    transactionDocumentNumber: "",
    date: "",
    locationTo: "",
    remarks: "",
  });

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [newProduct, setNewProduct] = useState({
    name: "",
    sellingPrice: 0,
    purchasePrice: 0,
    packQty: 0,
    unitQty: 0,
  });

  const [totalAmount, setTotalAmount] = useState(0);
  const [summary, setSummary] = useState({
    subTotal: 0,
    discountPercent: 0,
    discountValue: 0,
    taxPercent: 0,
    taxValue: 0,
    netAmount: 0,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        name.includes("Price") || name.includes("Qty")
          ? parseFloat(value) || 0
          : value,
    }));
  };

  const calculateAmount = () => {
    const amount = newProduct.sellingPrice * newProduct.packQty;
    return amount;
  };

  const addProduct = () => {
    if (!newProduct.name) return;

    const amount = calculateAmount();

    const product: ProductItem = {
      id: Date.now().toString(),
      code: newProduct.name,
      name: newProduct.name,
      sellingPrice: newProduct.sellingPrice,
      purchasePrice: newProduct.purchasePrice,
      packSize: 12,
      packQty: newProduct.packQty,
      unitQty: newProduct.unitQty,
      amount,
    };

    setProducts((prev) => [...prev, product]);
    setNewProduct({
      name: "",
      sellingPrice: 0,
      purchasePrice: 0,
      packQty: 0,
      unitQty: 0,
    });

    // Update total amount
    const newTotalAmount =
      products.reduce((sum, p) => sum + p.amount, 0) + amount;
    setTotalAmount(newTotalAmount);
  };

  const removeProduct = (id: string) => {
    setProducts((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      const newTotalAmount = updated.reduce((sum, p) => sum + p.amount, 0);
      setTotalAmount(newTotalAmount);
      return updated;
    });
  };

  return (
    <div className="space-y-3">
      {" "}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {" "}
          <ArrowLeftRight className="h-6 w-6" />
          <h1 className="text-xl font-semibold">New Transfer of Goods Note</h1>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-1 px-2 py-1 text-sm"
        >
          <ArrowLeft className="h-3 w-3" />
          Back
        </Button>
      </div>
      <div className="flex justify-end">
        <Badge variant="secondary" className="px-2 py-1 text-sm">
          {" "}
          Document No:
        </Badge>
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="space-y-6 mb-8">
            {/* Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-4">
              <div>
                <Label className="text-sm font-medium">Location From*</Label>
                <Select
                  value={locationFrom}
                  onValueChange={setLocationFrom}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="--Choose Location--" />
                  </SelectTrigger>
                  <SelectContent></SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium">Transaction Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Transaction Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transfer">Transfer</SelectItem>
                    <SelectItem value="return">Return</SelectItem>
                    <SelectItem value="adjustment">Adjustment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium">
                  Transaction Document Number
                </Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="No documents available" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="doc1">Document 1</SelectItem>
                    <SelectItem value="doc2">Document 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium">Date*</Label>
                <DatePicker
                  date={date}
                  setDate={setDate}
                  placeholder="dd/mm/yyyy"
                  required
                  disabled={true}
                />
              </div>

              {/* Row 2 */}
              <div>
                <Label className="text-sm font-medium">Location To*</Label>
                <Select
                  value={locationTo}
                  onValueChange={setLocationTo}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="--Choose Location--" />
                  </SelectTrigger>
                  <SelectContent></SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium">Remarks</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Remarks" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="good">Good Condition</SelectItem>
                    <SelectItem value="damaged">Damaged</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                    <TableHead>Selling Price</TableHead>
                    <TableHead>Purchase Price</TableHead>
                    <TableHead>Pack Size</TableHead>
                    <TableHead>Pack Qty</TableHead>
                    <TableHead>Unit Qty</TableHead>
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
                          {product.sellingPrice}
                        </TableCell>
                        <TableCell className="text-right">
                          {product.purchasePrice}
                        </TableCell>
                        <TableCell className="text-center">
                          {product.packSize}
                        </TableCell>
                        <TableCell className="text-center">
                          {product.packQty}
                        </TableCell>
                        <TableCell className="text-center">
                          {product.unitQty}
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
                  <SelectContent></SelectContent>
                </Select>
              </div>
              <div className="w-24">
                <Label>Selling Price</Label>
                <Input
                  name="sellingPrice"
                  type="number"
                  value={newProduct.sellingPrice}
                  onChange={handleProductChange}
                  placeholder="0"
                  onFocus={(e) => e.target.select()}
                  className="text-sm"
                />
              </div>
              <div className="w-24">
                <Label>Purchase Price</Label>
                <Input
                  name="purchasePrice"
                  type="number"
                  value={newProduct.purchasePrice}
                  onChange={handleProductChange}
                  placeholder="0"
                  onFocus={(e) => e.target.select()}
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
                  onFocus={(e) => e.target.select()}
                  className="text-sm"
                />
              </div>
              <div className="w-20">
                <Label>Unit Qty</Label>
                <Input
                  name="unitQty"
                  type="number"
                  value={newProduct.unitQty}
                  onChange={handleProductChange}
                  placeholder="0"
                  onFocus={(e) => e.target.select()}
                  className="text-sm"
                />
              </div>
              <div className="w-24">
                <Label>Amount</Label>
                <Input
                  value={calculateAmount()}
                  placeholder="0"
                  disabled
                  className="text-sm bg-gray-50 dark:bg-gray-800"
                />
              </div>
              <div className="w-20">
                <Button
                  type="button"
                  onClick={addProduct}
                  size="sm"
                  className="w-20 h-9"
                >
                  ADD
                </Button>
              </div>
            </div>

            {/* Product Information */}
            <div className="flex gap-6 text-sm text-gray-600 dark:text-gray-400 mb-4">
              <span>Pack Size: 12</span>
              <span>Current Pack Qty: 60</span>
              <span>Current Unit Qty: 6</span>
            </div>
          </div>

          {/* Action Buttons and Total Amount */}
          <div className="flex items-center justify-between mt-8">
            <div className="flex gap-4 mt-8">
              <Button variant="outline">DRAFT TGN</Button>
              <Button>APPLY TGN</Button>
            </div>
            <div className="text-lg font-semibold">
              Total Amount: {totalAmount}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
