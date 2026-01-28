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
      qty: qty,
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
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to prepare barcode data.";
      const errors = err?.response?.data?.errors;

      toast({
        type: "error",
        title: "Failed to prepare barcodes",
        description: errors ? errors.join(", ") : errorMessage,
      });
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <CardTitle>Barcode Generator</CardTitle>
            <CardDescription className="mt-1">
              Add multiple products to the print list
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="self-start md:self-auto"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset List
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <div className="w-full md:flex-1">
                <div className="text-xs font-medium mb-1 text-muted-foreground uppercase tracking-wider">
                  Select Product
                </div>
                <div className="w-full max-w-xl">
                  <BasicProductSearch
                    value={selectedProduct?.prod_code}
                    onValueChange={handleSelectProduct}
                  />
                </div>
              </div>
              <div className="w-full md:w-24">
                <div className="text-xs font-medium mb-1 text-muted-foreground uppercase tracking-wider">
                  Qty
                </div>
                <Input
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                />
              </div>
              <div className="w-full md:w-40">
                <div className="text-xs font-medium mb-1 text-muted-foreground uppercase tracking-wider">
                  Label Type
                </div>
                <Select value={labelType} onValueChange={setLabelType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DEFAULT">DEFAULT</SelectItem>
                    <SelectItem value="SMALL">SMALL</SelectItem>
                    <SelectItem value="MEDIUM">MEDIUM</SelectItem>
                    <SelectItem value="LARGE">LARGE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleAddItem}
                disabled={!selectedProduct}
                className="w-full md:w-auto"
              >
                Add Item
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Print List Preview</CardTitle>
            <CardDescription className="mt-1">
              {printItems.length} product(s) ready to print.
            </CardDescription>
          </div>
          <Button
            size="lg"
            className="px-8 shadow-lg hover:shadow-xl transition-all"
            onClick={handlePrint}
            disabled={isPrinting || printItems.length === 0}
          >
            {isPrinting ? (
              "Preparing..."
            ) : (
              <>
                <Printer className="mr-2 h-5 w-5" />
                Print ({printItems.reduce((acc, i) => acc + i.qty, 0)} labels)
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[450px]">Product</TableHead>
                <TableHead className="text-center">Barcode</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-center">Type</TableHead>
                <TableHead className="text-center">Qty</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {printItems.map((item) => (
                <TableRow className="text-xs" key={item.id}>
                  <TableCell>
                    <div className="font-medium text-primary">
                      {item.prod_code}
                    </div>
                    <div className="text-muted-foreground">
                      {item.prod_name}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{item.barcode}</TableCell>
                  <TableCell className="text-right">
                    Rs. {Number(item.selling_price).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-center">{item.type}</TableCell>
                  <TableCell className="text-center">{item.qty}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {printItems.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-12 text-center text-muted-foreground"
                  >
                    No products added to the print list yet.
                  </TableCell>
                </TableRow>
              )}
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
