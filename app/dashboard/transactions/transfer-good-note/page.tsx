'use client';

import { useState } from 'react';
import { ArrowLeftRight, Calendar, X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
  sellingPrice: number;
  purchasePrice: number;
  packSize: number;
  packQty: number;
  unitQty: number;
  amount: number;
}

export default function TransferGoodsNoteForm() {
  const [formData, setFormData] = useState({
    locationFrom: '',
    transactionType: '',
    transactionDocumentNumber: '',
    date: '',
    locationTo: '',
    remarks: ''
  });

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [newProduct, setNewProduct] = useState({
    name: '',
    sellingPrice: 0,
    purchasePrice: 0,
    packQty: 0,
    unitQty: 0
  });

  const [totalAmount, setTotalAmount] = useState(0);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      [name]: name.includes('Price') || name.includes('Qty') 
        ? parseFloat(value) || 0 
        : value
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
      code: newProduct.name, // Use name field for both code and name
      name: newProduct.name,
      sellingPrice: newProduct.sellingPrice,
      purchasePrice: newProduct.purchasePrice,
      packSize: 12, // Default pack size
      packQty: newProduct.packQty,
      unitQty: newProduct.unitQty,
      amount
    };

    setProducts(prev => [...prev, product]);
    setNewProduct({
      name: '',
      sellingPrice: 0,
      purchasePrice: 0,
      packQty: 0,
      unitQty: 0
    });

    // Update total amount
    const newTotalAmount = products.reduce((sum, p) => sum + p.amount, 0) + amount;
    setTotalAmount(newTotalAmount);
  };

  const removeProduct = (id: string) => {
    setProducts(prev => {
      const updated = prev.filter(p => p.id !== id);
      const newTotalAmount = updated.reduce((sum, p) => sum + p.amount, 0);
      setTotalAmount(newTotalAmount);
      return updated;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ArrowLeftRight className="h-6 w-6 text-purple-600" />
          <h1 className="text-2xl font-semibold">New Transfer of Goods Note</h1>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          {/* Document and Transaction Information Section */}
          <div className="space-y-6 mb-8">
            {/* Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <Label className="text-sm font-medium">Location From*</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Location From" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maharagama">Maharagama</SelectItem>
                    <SelectItem value="dehiwala">Dehiwala</SelectItem>
                    <SelectItem value="colombo">Colombo</SelectItem>
                  </SelectContent>
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
                <Label className="text-sm font-medium">Transaction Document Number</Label>
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
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <Label className="text-sm font-medium">Location To*</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Location To" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dehiwala">Dehiwala</SelectItem>
                    <SelectItem value="maharagama">Maharagama</SelectItem>
                    <SelectItem value="colombo">Colombo</SelectItem>
                  </SelectContent>
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
            
            <div className="border rounded-lg p-4">
              {/* Table Header */}
              <div className="grid grid-cols-9 gap-2 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg font-medium text-sm mb-2">
                <div className="col-span-1">Line No</div>
                <div className="col-span-2">Product Name / Code</div>
                <div className="col-span-1">Selling Price</div>
                <div className="col-span-1">Purchase Price</div>
                <div className="col-span-1">Pack Size</div>
                <div className="col-span-1">Pack Qty</div>
                <div className="col-span-1">Unit Qty</div>
                <div className="col-span-1">Amount</div>
                <div className="col-span-1">Actions</div>
              </div>

              {/* Scrollable Product Rows Container */}
              <div className="max-h-[180px] overflow-y-auto">
                {products.map((product, index) => (
                  <div key={product.id} className="grid grid-cols-9 gap-2 p-2 border-b border-gray-200 dark:border-gray-700 text-sm">
                    <div className="col-span-1">{index + 1}</div>
                    <div className="col-span-2">{product.name}</div>
                    <div className="col-span-1">{product.sellingPrice}</div>
                    <div className="col-span-1">{product.purchasePrice}</div>
                    <div className="col-span-1">{product.packSize}</div>
                    <div className="col-span-1">{product.packQty}</div>
                    <div className="col-span-1">{product.unitQty}</div>
                    <div className="col-span-1">{product.amount}</div>
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

              {/* Total Amount Row */}
              {products.length > 0 && (
                <div className="grid grid-cols-9 gap-2 p-2 bg-gray-50 dark:bg-gray-800 font-medium rounded-b-lg mt-2">
                  <div className="col-span-8 text-right">Total Amount</div>
                  <div className="col-span-1">{totalAmount}</div>
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
                    name="sellingPrice"
                    type="number"
                    value={newProduct.sellingPrice}
                    onChange={handleProductChange}
                    placeholder="0"
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
                    name="unitQty"
                    type="number"
                    value={newProduct.unitQty}
                    onChange={handleProductChange}
                    placeholder="0"
                    className="text-sm"
                  />
                </div>
                <div className="w-24">
                  <Input
                    value={calculateAmount()}
                    placeholder="0"
                    disabled
                    className="text-sm bg-gray-50 dark:bg-gray-800"
                  />
                </div>
              </div>
              
              {/* Product Information */}
              <div className="flex gap-6 text-sm text-gray-600 dark:text-gray-400 mb-4">
                <span>Pack Size: 12</span>
                <span>Current Pack Qty: 60</span>
                <span>Current Unit Qty: 6</span>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={addProduct}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  Add
                </Button>
              </div>
            </div>
          </div>

          {/* Action Buttons and Total Amount */}
          <div className="flex items-center justify-between mt-8">
            <div className="flex gap-4">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                DRAFT TGN
              </Button>
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                Apply
              </Button>
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
