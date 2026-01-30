"use client";

import { api } from "@/utils/api";
import { useState, Suspense } from "react";
import Loader from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Printer, RotateCcw } from "lucide-react";
import { BasicProductSearch } from "@/components/shared/basic-product-search";
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

/* ===================== TYPES ===================== */
interface Product {
  prod_code: string;
  prod_name: string;
  barcode?: string;
  selling_price?: number;
}

interface PrintItem {
  id: string;
  prod_code: string;
  prod_name: string;
  barcode: string;
  selling_price: number;
  qty: number;
  type: string;
}

/* ===================== COMPONENT ===================== */
function BarcodeGeneratorFormContent() {
  const { toast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState<number>(1);
  const [labelType, setLabelType] = useState<string>("DEFAULT");
  const [isPrinting, setIsPrinting] = useState(false);
  const [printItems, setPrintItems] = useState<PrintItem[]>([]);

  const handleSelectProduct = (product: any) => {
    if (product) {
      setSelectedProduct({
        prod_code: product.prod_code,
        prod_name: product.prod_name,
        barcode: product.barcode,
        selling_price: product.selling_price,
      });
    } else {
      setSelectedProduct(null);
    }
  };

  const handleAddItem = () => {
    if (!selectedProduct) return;
    if (qty <= 0) {
      toast({
        type: "error",
        title: "Invalid quantity",
        description: "Quantity must be at least 1.",
      });
      return;
    }

    const newItem: PrintItem = {
      id: Math.random().toString(36).substr(2, 9),
      prod_code: selectedProduct.prod_code,
      prod_name: selectedProduct.prod_name,
      barcode: selectedProduct.barcode || selectedProduct.prod_code,
      selling_price: Number(selectedProduct.selling_price || 0),
      qty,
      type: labelType || "DEFAULT",
    };

    setPrintItems((prev) => [...prev, newItem]);
    setSelectedProduct(null);
    setQty(1);
    setLabelType("DEFAULT");
  };

  const handleRemoveItem = (id: string) => {
    setPrintItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleReset = () => {
    setPrintItems([]);
    setSelectedProduct(null);
    setQty(1);
    setLabelType("DEFAULT");
  };

  /* ===================== PRINT ===================== */
  const handlePrint = async () => {
    if (printItems.length === 0) {
      toast({
        type: "error",
        title: "No products added",
        description: "Please add at least one product to the list.",
      });
      return;
    }

    setIsPrinting(true);

    try {
      const res = await api.post("/barcodes/print", {
        items: printItems.map((item) => ({
          prod_code: item.prod_code,
          barcode: item.barcode,
          prod_name: item.prod_name,
          selling_price: item.selling_price,
          qty: item.qty,
          type: item.type,
        })),
      });

      if (res?.data?.success) {
        toast({
          type: "success",
          title: "Print Job Sent",
          description:
            res.data.message ||
            `Print job created for ${
              res.data.total_qty ??
              printItems.reduce((acc, i) => acc + i.qty, 0)
            } labels.`,
        });
      }
    } catch (err: any) {
      toast({
        type: "error",
        title: "Failed to prepare barcodes",
        description:
          err?.response?.data?.message ||
          err?.message ||
          "Failed to prepare barcode data.",
      });
    } finally {
      setIsPrinting(false);
    }
  };

  /* ===================== UI ===================== */
  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Barcode Generator</CardTitle>
            <CardDescription>
              Add multiple products to the print list
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset List
          </Button>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1">
              <BasicProductSearch
                value={selectedProduct?.prod_code}
                onValueChange={handleSelectProduct}
              />
            </div>

            <Input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              className="md:w-24"
            />

            <Select value={labelType} onValueChange={setLabelType}>
              <SelectTrigger className="md:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DEFAULT">DEFAULT</SelectItem>
                <SelectItem value="SMALL">SMALL</SelectItem>
                <SelectItem value="MEDIUM">MEDIUM</SelectItem>
                <SelectItem value="LARGE">LARGE</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleAddItem} disabled={!selectedProduct}>
              Add Item
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>Print List Preview</CardTitle>
            <CardDescription>
              {printItems.length} product(s) ready to print
            </CardDescription>
          </div>

          <Button
            size="lg"
            onClick={handlePrint}
            disabled={isPrinting || printItems.length === 0}
          >
            <Printer className="mr-2 h-5 w-5" />
            {isPrinting ? "Preparing..." : `Print (${printItems.reduce((acc, i) => acc + i.qty, 0)} labels)`}
          </Button>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-center">Barcode</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-center">Type</TableHead>
                <TableHead className="text-center">Qty</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {printItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="font-medium">{item.prod_code}</div>
                    <div className="text-muted-foreground">{item.prod_name}</div>
                  </TableCell>
                  <TableCell className="text-center">{item.barcode}</TableCell>
                  <TableCell className="text-right">
                    Rs. {item.selling_price.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-center">{item.type}</TableCell>
                  <TableCell className="text-center">{item.qty}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BarcodeGeneratorForm() {
  return (
    <Suspense fallback={<Loader />}>
      <BarcodeGeneratorFormContent />
    </Suspense>
  );
}
