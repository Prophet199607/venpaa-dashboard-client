"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { ArrowLeftRight, Trash2, ArrowLeft } from "lucide-react";
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
  currentPackQty: number;
  currentUnitQty: number;
  physicalPackQty: number;
  physicalUnitQty: number;
  variancePackQty: number;
  varianceUnitQty: number;
}

interface Book {
  id: string;
  name: string;
  code: string;
}

export default function StockAdjustmentForm() {
  const router = useRouter();
  const [product, setProduct] = useState("");
  const [location, setLocation] = useState("");

  const [date, setDate] = useState<Date | undefined>(new Date());

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
    currentPackQty: 0,
    currentUnitQty: 0,
    physicalPackQty: 0,
    physicalUnitQty: 0,
    variancePackQty: 0,
    varianceUnitQty: 0,
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
        name.includes("Price") || name.includes("Qty") || name.includes("Value")
          ? parseFloat(value) || 0
          : value,
    }));
  };

  const handleAddProduct = () => {
    if (!newProduct.name) return;

    const amount = calculateAmount();

    const product: ProductItem = {
      id: Date.now().toString(),
      code: newProduct.name,
      name: newProduct.name,
      sellingPrice: newProduct.sellingPrice,
      purchasePrice: newProduct.purchasePrice,
      packSize: 12,
      currentPackQty: newProduct.currentPackQty,
      currentUnitQty: newProduct.currentUnitQty,
      physicalPackQty: newProduct.physicalPackQty,
      physicalUnitQty: newProduct.physicalUnitQty,
      variancePackQty: newProduct.variancePackQty,
      varianceUnitQty: newProduct.varianceUnitQty,
    };

    setProducts((prev) => [...prev, product]);
    setNewProduct({
      name: "",
      sellingPrice: 0,
      purchasePrice: 0,
      currentPackQty: 0,
      currentUnitQty: 0,
      physicalPackQty: 0,
      physicalUnitQty: 0,
      variancePackQty: 0,
      varianceUnitQty: 0,
    });
  };

  const calculateAmount = () => {
    const amount = newProduct.sellingPrice * newProduct.physicalPackQty;
    return amount;
  };

  const handleDeleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((product) => product.id !== id));
  };

  const removeProduct = (id: string) => {};

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
                <Label className="text-sm font-medium">Date*</Label>
                <DatePicker
                  date={date}
                  setDate={setDate}
                  placeholder="dd/mm/yyyy"
                  required
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Location From*</Label>
                <Select value={location} onValueChange={setLocation} required>
                  <SelectTrigger>
                    <SelectValue placeholder="--Choose Location--" />
                  </SelectTrigger>
                  <SelectContent></SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium">Remark</Label>
                <Input
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleInputChange}
                  placeholder="Enter remark here"
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
                      <TableHead>Pack Size</TableHead>
                      <TableHead>Current Pack Qty</TableHead>
                      <TableHead>Current Unit Qty</TableHead>
                      <TableHead>Physical Pack Qty</TableHead>
                      <TableHead>Physical Unit Qty</TableHead>
                      <TableHead>Variance Pack</TableHead>
                      <TableHead>Variance Unit</TableHead>
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
                            {product.packSize}
                          </TableCell>
                          <TableCell className="text-center">
                            {product.currentPackQty}
                          </TableCell>
                          <TableCell className="text-center">
                            {product.currentUnitQty}
                          </TableCell>
                          <TableCell className="text-center">
                            {product.physicalPackQty}
                          </TableCell>
                          <TableCell className="text-center">
                            {product.physicalUnitQty}
                          </TableCell>
                          <TableCell className="text-right">
                            {product.variancePackQty}
                          </TableCell>
                          <TableCell className="text-right">
                            {product.varianceUnitQty}
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
                          {/* {summary.subTotal} */}
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
                  <Label>Current Pack Qty</Label>
                  <Input
                    name="currentPackQty"
                    type="number"
                    value={newProduct.currentPackQty}
                    onChange={handleProductChange}
                    placeholder="0"
                    onFocus={(e) => e.target.select()}
                    className="text-sm"
                  />
                </div>
                <div className="w-24">
                  <Label>Current Unit Qty</Label>
                  <Input
                    name="currentUnitQty"
                    type="number"
                    value={newProduct.currentUnitQty}
                    onChange={handleProductChange}
                    placeholder="0"
                    onFocus={(e) => e.target.select()}
                    className="text-sm"
                  />
                </div>

                <div className="w-24">
                  <Label>Physical Pack Qty</Label>
                  <Input
                    name="physicalPackQty"
                    type="number"
                    value={newProduct.physicalPackQty}
                    onChange={handleProductChange}
                    placeholder="0"
                    onFocus={(e) => e.target.select()}
                    className="text-sm"
                  />
                </div>
                <div className="w-24">
                  <Label>Physical Unit Qty</Label>
                  <Input
                    name="physicalUnitQty"
                    type="number"
                    value={newProduct.physicalUnitQty}
                    onChange={handleProductChange}
                    placeholder="0"
                    onFocus={(e) => e.target.select()}
                    className="text-sm"
                  />
                </div>

                <div className="w-24">
                  <Label>Variance Pack Qty</Label>
                  <Input
                    name="variancePackQty"
                    type="number"
                    value={newProduct.variancePackQty}
                    onChange={handleProductChange}
                    placeholder="0"
                    onFocus={(e) => e.target.select()}
                    className="text-sm"
                  />
                </div>
                <div className="w-24">
                  <Label>Variance Unit Qty</Label>
                  <Input
                    name="varianceUnitQty"
                    type="number"
                    value={newProduct.varianceUnitQty}
                    onChange={handleProductChange}
                    placeholder="0"
                    onFocus={(e) => e.target.select()}
                    className="text-sm"
                  />
                </div>

                <div className="w-20">
                  <Button
                    type="button"
                    onClick={handleAddProduct}
                    size="sm"
                    className="w-20 h-9"
                  >
                    ADD
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Section */}
          <div className="flex justify-end mt-10">
            <div className="grid grid-cols-2 gap-2 w-full max-w-lg">
              {/* Current Pack Qty */}
              <div className="flex items-center gap-2">
                <Label className="w-32">Current Pack Qty:</Label>
                <Input
                  disabled
                  defaultValue="0"
                  className="text-right flex-1"
                />
              </div>

              {/* Current Unit Qty */}
              <div className="flex items-center gap-2">
                <Label className="w-32">Current Unit Qty:</Label>
                <Input
                  disabled
                  defaultValue="0"
                  className="text-right flex-1"
                />
              </div>

              {/* Physical Pack Qty */}
              <div className="flex items-center gap-3">
                <Label className="w-32">Physical Pack Qty:</Label>
                <Input
                  disabled
                  defaultValue="0"
                  autoFocus
                  className="text-right flex-1"
                />
              </div>

              {/* Physical Unit Qty */}
              <div className="flex items-center gap-3">
                <Label className="w-32">Physical Unit Qty:</Label>
                <Input
                  disabled
                  defaultValue="0"
                  className="text-right flex-1"
                />
              </div>

              {/* Variance Pack */}
              <div className="flex items-center gap-3">
                <Label className="w-32">Variance Pack:</Label>
                <Input
                  disabled
                  defaultValue="0"
                  className="text-right flex-1"
                />
              </div>

              {/* Variance Unit */}
              <div className="flex items-center gap-3">
                <Label className="w-32">Variance Unit:</Label>
                <Input
                  disabled
                  defaultValue="0"
                  className="text-right flex-1"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-8">
            <Button variant="outline">DRAFT Adjustment</Button>
            <Button>APPLY Adjustment</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
