'use client';

import { useState } from 'react';
import { ShoppingBag, Calendar, Plus, X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from '@/components/ui/select';

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

export default function PurchaseOrderForm() {
  const [formData, setFormData] = useState({
    location: '',
    date: '',
    paymentMethod: '',
    supplier: '',
    expectedDate: '',
    deliveryLocation: '',
    remarks: '',
    deliveryAddress: ''
  });

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [newProduct, setNewProduct] = useState({
    code: '',
    name: '',
    purchasePrice: 0,
    packQty: 0,
    qty: 0,
    freeQty: 0,
    discValue: 0
  });

  const [summary, setSummary] = useState({
    subTotal: 0,
    discountPercent: 0,
    discountValue: 0,
    taxPercent: 0,
    taxValue: 0,
    netAmount: 0
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProductChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewProduct(prev => ({
      ...prev,
      [name]: name.includes('Price') || name.includes('Qty') || name.includes('Value') 
        ? parseFloat(value) || 0 
        : value
    }));
  };

  const calculateTotalQty = () => {
    return newProduct.qty + newProduct.freeQty;
  };

  const calculateAmount = () => {
    const totalQty = calculateTotalQty();
    const amount = (newProduct.purchasePrice * totalQty) - newProduct.discValue;
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
      amount
    };

    setProducts(prev => [...prev, product]);
    setNewProduct({
      code: '',
      name: '',
      purchasePrice: 0,
      packQty: 0,
      qty: 0,
      freeQty: 0,
      discValue: 0
    });

    // Update summary
    const newSubTotal = products.reduce((sum, p) => sum + p.amount, 0) + amount;
    setSummary(prev => ({
      ...prev,
      subTotal: newSubTotal,
      netAmount: newSubTotal - prev.discountValue + prev.taxValue
    }));
  };

  const removeProduct = (id: string) => {
    setProducts(prev => {
      const updated = prev.filter(p => p.id !== id);
      const newSubTotal = updated.reduce((sum, p) => sum + p.amount, 0);
      setSummary(prevSummary => ({
        ...prevSummary,
        subTotal: newSubTotal,
        netAmount: newSubTotal - prevSummary.discountValue + prevSummary.taxValue
      }));
      return updated;
    });
  };

  const handleSummaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value) || 0;
    
    setSummary(prev => {
      const updated = { ...prev, [name]: numValue };
      
      // Calculate derived values
      if (name === 'discountPercent') {
        updated.discountValue = (prev.subTotal * numValue) / 100;
      } else if (name === 'taxPercent') {
        updated.taxValue = ((prev.subTotal - updated.discountValue) * numValue) / 100;
      }
      
      // Calculate net amount
      updated.netAmount = prev.subTotal - updated.discountValue + updated.taxValue;
      
      return updated;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShoppingBag className="h-6 w-6 text-purple-600" />
          <h1 className="text-2xl font-semibold">New Purchase Order</h1>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700">
          Document No:
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          {/* General Information Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Location and Date Row */}
            <div>
              <Label className="text-sm font-medium">Location*</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="--Choose Location--" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="location1">Location 1</SelectItem>
                  <SelectItem value="location2">Location 2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">Date*</Label>
              <div className="relative">
                <Input
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  placeholder="27/09/2025"
                  className="pr-10"
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Payment Methods*</Label>
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

            {/* Supplier and Expected Date Row */}
            <div>
              <Label className="text-sm font-medium">Supplier*</Label>
              <div className="relative">
                <Input
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleInputChange}
                  placeholder="Select Supplier"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Expected Date*</Label>
              <div className="relative">
                <Input
                  name="expectedDate"
                  value={formData.expectedDate}
                  onChange={handleInputChange}
                  placeholder="dd/mm/yyyy"
                  className="pr-10"
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Delivery Location*</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="--Select Delivery Location--" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="delivery1">Delivery Location 1</SelectItem>
                  <SelectItem value="delivery2">Delivery Location 2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Remarks and Delivery Address */}
            <div className="md:col-span-2">
              <Label className="text-sm font-medium">Remarks</Label>
              <Textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                placeholder="Enter your remarks"
                rows={3}
              />
            </div>

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
          </div>

          {/* Product Details Table */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Product Details</h3>
            
            <div className="border rounded-lg p-4">
              {/* Table Header */}
              <div className="grid grid-cols-9 gap-2 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg font-medium text-sm mb-2">
                <div className="col-span-1">Line Number</div>
                <div className="col-span-2">Product Name / Code</div>
                <div className="col-span-1">Purchase Price</div>
                <div className="col-span-1">Pack Qty</div>
                <div className="col-span-1">Qty</div>
                <div className="col-span-1">Free Qty</div>
                <div className="col-span-1">Total Qty</div>
                <div className="col-span-1">Disc Value / Amount</div>
                <div className="col-span-1">Action</div>
              </div>

              {/* Scrollable Product Rows Container */}
              <div className="max-h-[180px] overflow-y-auto">
                {products.map((product, index) => (
                  <div key={product.id} className="grid grid-cols-9 gap-2 p-2 border-b border-gray-200 dark:border-gray-700 text-sm">
                    <div className="col-span-1">{index + 1}</div>
                    <div className="col-span-2">{product.name}</div>
                    <div className="col-span-1">{product.purchasePrice}</div>
                    <div className="col-span-1">{product.packQty}</div>
                    <div className="col-span-1">{product.qty}</div>
                    <div className="col-span-1">{product.freeQty}</div>
                    <div className="col-span-1">{product.totalQty}</div>
                    <div className="col-span-1 flex items-center justify-between">
                      <span>{product.discValue}</span>
                      <span className="ml-2">{product.amount}</span>
                    </div>
                    <div className="col-span-1 flex items-center justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeProduct(product.id)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {products.length === 0 && (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                    No products added yet
                  </div>
                )}
              </div>

              {/* Subtotal Row */}
              {products.length > 0 && (
                <div className="grid grid-cols-9 gap-2 p-2 bg-gray-50 dark:bg-gray-800 font-medium rounded-b-lg mt-2">
                  <div className="col-span-8 text-right">Subtotal</div>
                  <div className="col-span-1">{summary.subTotal}</div>
                </div>
              )}
            </div>

            {/* Add Product Section */}
            <div className="mt-6 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              <h4 className="font-medium mb-4">Product</h4>
              <div className="flex gap-2 items-end mb-4">
                <div className="flex-2">
                  <Input
                    name="name"
                    value={newProduct.name}
                    onChange={handleProductChange}
                    placeholder="Product Name / Code"
                    className="text-sm"
                  />
                </div>
                <div className="w-24">
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
                  <Input
                    name="freeQty"
                    type="number"
                    value={newProduct.freeQty}
                    onChange={handleProductChange}
                    placeholder="0"
                    className="text-sm"
                  />
                </div>
                <div className="w-20">
                  <Input
                    value={calculateTotalQty()}
                    placeholder="0"
                    disabled
                    className="text-sm bg-gray-50 dark:bg-gray-800"
                  />
                </div>
                <div className="w-20">
                  <Input
                    value={calculateAmount()}
                    placeholder="0"
                    disabled
                    className="text-sm bg-gray-50 dark:bg-gray-800"
                  />
                </div>
                <div className="w-20">
                  <Input
                    name="discValue"
                    type="number"
                    value={newProduct.discValue}
                    onChange={handleProductChange}
                    placeholder="0"
                    className="text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={addProduct}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  ADD
                </Button>
              </div>
            </div>
          </div>

          {/* Summary Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Label className="w-24">Sub Total</Label>
                <Input
                  value={summary.subTotal}
                  disabled
                  className="flex-1"
                />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-24">Discount %</Label>
                <Input
                  name="discountPercent"
                  type="number"
                  value={summary.discountPercent}
                  onChange={handleSummaryChange}
                  className="flex-1"
                />
                <Label className="w-20">Disc Value</Label>
                <Input
                  value={summary.discountValue}
                  disabled
                  className="flex-1"
                />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-24">Tax %</Label>
                <Input
                  name="taxPercent"
                  type="number"
                  value={summary.taxPercent}
                  onChange={handleSummaryChange}
                  className="flex-1"
                />
                <Label className="w-20">Tax Value</Label>
                <Input
                  value={summary.taxValue}
                  disabled
                  className="flex-1"
                />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-24">Net Amount</Label>
                <Input
                  value={summary.netAmount}
                  disabled
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-8">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              DRAFT PO
            </Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white">
              APPLY PO
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
