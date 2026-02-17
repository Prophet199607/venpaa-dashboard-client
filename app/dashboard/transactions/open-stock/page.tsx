"use client";

import { useState, useRef } from "react";
import { api } from "@/utils/api";
import Loader from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { BasicProductSearch } from "@/components/shared/basic-product-search";
import { SearchSelectHandle } from "@/components/ui/search-select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Trash2,
  Plus,
  Save,
  // Upload,
  // Download,
  // FileSpreadsheet,
  Loader2,
  // AlertCircle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Location {
  id: number;
  loca_code: string;
  loca_name: string;
}

interface OpenStockItem {
  prod_code: string;
  prod_name: string;
  loca_code: string;
  loca_name: string;
  qty: number;
  purchase_price: number;
  selling_price: number;
  amount: number;
}

export default function OpenStockPage() {
  const { toast } = useToast();
  const [locations, setLocations] = useState<Location[]>([]);
  const [isFetchingLocations, setIsFetchingLocations] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [documentDate, setDocumentDate] = useState<Date | undefined>(
    new Date(),
  );
  const [remarks, setRemarks] = useState("");

  // Item Entry State
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [locationQtys, setLocationQtys] = useState<Record<string, string>>({});
  const [costPrice, setCostPrice] = useState<string>("");
  const [sellingPrice, setSellingPrice] = useState<string>("");
  const [items, setItems] = useState<OpenStockItem[]>([]);

  const productSearchRef = useRef<SearchSelectHandle | null>(null);

  const fetchLocations = async () => {
    try {
      setIsFetchingLocations(true);
      const { data: res } = await api.get("/locations");
      if (res.success) {
        setLocations(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch locations:", error);
    } finally {
      setIsFetchingLocations(false);
    }
  };

  useState(() => {
    fetchLocations();
  });

  const handleProductSelect = (product: any) => {
    setSelectedProduct(product);
    if (product) {
      setCostPrice(product.purchase_price?.toString() || "");
      setSellingPrice(product.selling_price?.toString() || "");
    }
  };

  const updateLocationQty = (loca_code: string, value: string) => {
    setLocationQtys((prev) => ({
      ...prev,
      [loca_code]: value,
    }));
  };

  const addItem = () => {
    if (!selectedProduct) {
      toast({
        title: "Error",
        description: "Please select a product",
        type: "error",
      });
      return;
    }

    const newItems: OpenStockItem[] = [];
    let hasValidQty = false;

    locations.forEach((loc) => {
      const q = parseFloat(locationQtys[loc.loca_code] || "0");
      if (q > 0) {
        hasValidQty = true;
        newItems.push({
          prod_code: selectedProduct.prod_code,
          prod_name: selectedProduct.prod_name,
          loca_code: loc.loca_code,
          loca_name: loc.loca_name,
          qty: q,
          purchase_price: parseFloat(costPrice) || 0,
          selling_price: parseFloat(sellingPrice) || 0,
          amount: q * (parseFloat(costPrice) || 0),
        });
      }
    });

    if (!hasValidQty) {
      toast({
        title: "Error",
        description:
          "Please enter a quantity greater than 0 for at least one location",
        type: "error",
      });
      return;
    }

    setItems([...items, ...newItems]);
    resetItemEntry();
    productSearchRef.current?.openAndFocus();
  };

  const resetItemEntry = () => {
    setSelectedProduct(null);
    setLocationQtys({});
    setCostPrice("");
    setSellingPrice("");
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (items.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one item",
        type: "error",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Manual entry logic would go here
      // For now, this is just the structure as requested
      toast({
        title: "Success",
        description: "Open stock saved successfully (Simulated)",
        type: "success",
      });
      setItems([]);
      setRemarks("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to save open stock",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* 
  // COMMENTED OUT IMPORT/EXPORT CODE AS REQUESTED
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImportFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
       toast({ title: "No file selected", description: "Please select an Excel file", type: "error" });
       return;
    }
    // ... logic ...
  };

  const handleDownloadTemplate = async () => {
     // ... logic ...
  }
  */

  if (isFetchingLocations) {
    return <Loader />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4 py-4 px-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Open Stock Entry</h1>
        <p className="text-muted-foreground text-sm">
          Manually initialize or update opening stock for products.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Product Addition Section */}
        <Card className="w-full shadow-md border-primary/10">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Add Product to List
              </CardTitle>
              {selectedProduct && (
                <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                  {selectedProduct.prod_code}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Left Side: Product Configuration */}
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                    1. Select Product
                  </Label>
                  <BasicProductSearch
                    ref={productSearchRef}
                    value={selectedProduct?.prod_code}
                    onValueChange={handleProductSelect}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                    2. Set Prices
                  </Label>
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg border border-dashed">
                    <div className="space-y-1.5">
                      <Label className="text-[11px]">Purchase Price</Label>
                      <Input
                        className="h-9 bg-background"
                        type="number"
                        placeholder="0.00"
                        value={costPrice}
                        onChange={(e) => setCostPrice(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px]">Selling Price</Label>
                      <Input
                        className="h-9 bg-background"
                        type="number"
                        placeholder="0.00"
                        value={sellingPrice}
                        onChange={(e) => setSellingPrice(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: Quantities per Location */}
              <div className="space-y-2 flex flex-col">
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                    3. Enter Quantities
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">
                      Locations: {locations.length}
                    </span>
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden flex flex-col bg-background shadow-inner">
                  <div className="max-h-[180px] overflow-y-auto divide-y">
                    {locations.length === 0 ? (
                      <div className="p-10 text-center text-sm text-muted-foreground italic">
                        No active locations found.
                      </div>
                    ) : (
                      locations.map((loc) => (
                        <div
                          key={loc.loca_code}
                          className="flex items-center justify-between p-2.5 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex flex-col min-w-0 pr-4">
                            <span className="text-sm font-medium truncate leading-tight">
                              {loc.loca_name}
                            </span>
                            <span className="text-[9px] text-muted-foreground font-mono">
                              {loc.loca_code}
                            </span>
                          </div>
                          <Input
                            className="h-8 w-24 text-right font-bold focus-visible:ring-primary/30"
                            type="number"
                            placeholder="0"
                            value={locationQtys[loc.loca_code] || ""}
                            onChange={(e) =>
                              updateLocationQty(loc.loca_code, e.target.value)
                            }
                          />
                        </div>
                      ))
                    )}
                  </div>

                  {/* Input Qty Total Footer */}
                  <div className="bg-muted/50 p-2.5 border-t flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground">
                      Sum of Entries
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-primary">
                        {Object.values(locationQtys).reduce(
                          (sum, val) => sum + (parseFloat(val) || 0),
                          0,
                        )}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-medium">
                        Units
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t">
              <Button
                className="w-full h-12 text-sm font-bold uppercase tracking-widest shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all"
                onClick={addItem}
                disabled={!selectedProduct}
              >
                <Plus className="h-5 w-5 mr-3" />
                Add Selection to Items List
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Items Table Section */}
        <Card className="w-full flex flex-col min-h-[500px]">
          <CardHeader className="flex flex-row items-center justify-between pb-2 h-16">
            <CardTitle className="text-lg">Items List</CardTitle>
            <div className="text-right">
              <p className="text-sm font-medium">Total Items: {items.length}</p>
              <p className="text-lg font-bold">
                Total Amount:{" "}
                {items.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}
              </p>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <div className="max-h-[400px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="h-32 text-center text-muted-foreground"
                      >
                        No items added yet. Search and add products on the left.
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item, index) => (
                      <TableRow key={index} className="group">
                        <TableCell className="text-xs">
                          {item.prod_code}
                        </TableCell>
                        <TableCell className="font-medium max-w-[200px] truncate">
                          {item.prod_name}
                        </TableCell>
                        <TableCell className="text-xs">
                          <span className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-medium">
                            {item.loca_name}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {item.qty}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.purchase_price.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {item.amount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <div className="p-4 border-t mt-auto">
            <Button
              className="w-full h-11"
              size="lg"
              onClick={handleSubmit}
              disabled={items.length === 0 || isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <Save className="h-5 w-5 mr-2" />
              )}
              Save Opening Stock
            </Button>
          </div>
        </Card>
      </div>

      {/* 
        COMMENTED OUT IMPORT UI AS REQUESTED
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-40 grayscale pointer-events-none">
          ... Existing Import Card Content ...
        </div>
      */}
    </div>
  );
}
