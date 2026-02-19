"use client";

import { useState, useRef } from "react";
import { api } from "@/utils/api";
import Loader from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SearchSelectHandle } from "@/components/ui/search-select";
import { BasicProductSearch } from "@/components/shared/basic-product-search";
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
import { Trash2, Plus, Save, Loader2, Pencil } from "lucide-react";

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
  pack_size: number;
  pack_qty: number;
  unit_qty: number;
  total_qty: number;
  purchase_price: number;
  selling_price: number;
  amount: number;
}

export default function OpenStockPage() {
  const { toast } = useToast();
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isFetchingLocations, setIsFetchingLocations] = useState(false);

  // Item Entry State
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [locationQtys, setLocationQtys] = useState<
    Record<string, { pack: string; unit: string }>
  >({});
  const [costPrice, setCostPrice] = useState<string>("");
  const [sellingPrice, setSellingPrice] = useState<string>("");
  const [items, setItems] = useState<OpenStockItem[]>([]);

  const productSearchRef = useRef<SearchSelectHandle | null>(null);

  const formatThousandSeparator = (value: number | string) => {
    if (!value) return "0.00";
    return Number(value).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

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

  const updateLocationQty = (
    loca_code: string,
    field: "pack" | "unit",
    value: string,
  ) => {
    setLocationQtys((prev) => ({
      ...prev,
      [loca_code]: {
        ...prev[loca_code],
        [field]: value,
      },
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
      const pack = parseFloat(locationQtys[loc.loca_code]?.pack || "0");
      const unit = parseFloat(locationQtys[loc.loca_code]?.unit || "0");

      if (pack > 0 || unit > 0) {
        hasValidQty = true;

        const packSize = parseFloat(selectedProduct.pack_size?.toString());
        const totalQty = pack * packSize + unit;

        newItems.push({
          prod_code: selectedProduct.prod_code,
          prod_name: selectedProduct.prod_name,
          loca_code: loc.loca_code,
          loca_name: loc.loca_name,
          pack_size: packSize,
          pack_qty: pack,
          unit_qty: unit,
          total_qty: totalQty,
          purchase_price: parseFloat(costPrice) || 0,
          selling_price: parseFloat(sellingPrice) || 0,
          amount: totalQty * (parseFloat(costPrice) || 0),
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

    // Check for duplicates
    for (const newItem of newItems) {
      const exists = items.some(
        (item) =>
          item.prod_code === newItem.prod_code &&
          item.loca_code === newItem.loca_code,
      );
      if (exists) {
        toast({
          title: "Duplicate Item",
          description: `Product ${newItem.prod_name} is already added for location ${newItem.loca_name}`,
          type: "error",
        });
        return;
      }
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

  const editItem = (productCode: string) => {
    // Find all items for this product
    const productItems = items.filter((item) => item.prod_code === productCode);
    if (productItems.length === 0) return;

    const firstItem = productItems[0];

    // Set selected product (mocking the search result structure)
    setSelectedProduct({
      prod_code: firstItem.prod_code,
      prod_name: firstItem.prod_name,
      pack_size: firstItem.pack_size,
      purchase_price: firstItem.purchase_price,
      selling_price: firstItem.selling_price,
    });

    // Populate quantities
    const newLocationQtys: Record<string, { pack: string; unit: string }> = {};
    productItems.forEach((item) => {
      newLocationQtys[item.loca_code] = {
        pack: item.pack_qty.toString(),
        unit: item.unit_qty.toString(),
      };
    });
    setLocationQtys(newLocationQtys);

    // Set prices
    setCostPrice(firstItem.purchase_price.toString());
    setSellingPrice(firstItem.selling_price.toString());

    // Remove these items from the list
    setItems(items.filter((item) => item.prod_code !== productCode));

    // Scroll to top to see the form
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      const response = await api.post("/products/store-open-stock", {
        items,
        remarks,
      });

      if (response.data.success) {
        toast({
          title: "Success",
          description: "Open stock saved successfully",
          type: "success",
        });
        setItems([]);
        setRemarks("");
      } else {
        toast({
          title: "Error",
          description: response.data.message || "Failed to save open stock",
          type: "error",
        });
      }
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to save open stock",
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
        <h1 className="text-xl font-bold tracking-tight">Open Stock Entry</h1>
        <p className="text-muted-foreground text-xs">
          Manually initialize or update opening stock for products.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Product Addition Section */}
        <Card className="w-full shadow-md border-primary/10">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Plus className="h-4 w-4 text-primary" />
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                  {/* Locations List */}
                  <div className="divide-y max-h-[300px] overflow-y-auto">
                    {locations.length === 0 ? (
                      <div className="p-10 text-center text-sm text-muted-foreground italic">
                        No active locations found.
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-12 bg-muted/50 p-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          <div className="col-span-4">Location</div>
                          <div className="col-span-4 text-center">Pack Qty</div>
                          <div className="col-span-4 text-center">Unit Qty</div>
                        </div>
                        {locations.map((loc) => (
                          <div
                            key={loc.loca_code}
                            className="grid grid-cols-12 items-center gap-2 p-2 hover:bg-muted/50 transition-colors"
                          >
                            {/* Location Name */}
                            <div className="col-span-4 flex flex-col">
                              <span className="text-xs font-medium leading-tight break-words">
                                {loc.loca_name}
                              </span>
                              <span className="text-[9px] text-muted-foreground">
                                {loc.loca_code}
                              </span>
                            </div>

                            <Input
                              className="col-span-4 text-center text-sm px-1 h-8"
                              type="number"
                              placeholder="0"
                              value={locationQtys[loc.loca_code]?.pack || ""}
                              onChange={(e) =>
                                updateLocationQty(
                                  loc.loca_code,
                                  "pack",
                                  e.target.value,
                                )
                              }
                            />
                            <Input
                              className="col-span-4 text-center text-sm px-1 h-8"
                              type="number"
                              placeholder="0"
                              value={locationQtys[loc.loca_code]?.unit || ""}
                              onChange={(e) =>
                                updateLocationQty(
                                  loc.loca_code,
                                  "unit",
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                        ))}
                      </>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="bg-muted/50 p-2 border-t flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground">
                      Total Units
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-primary">
                        {locations.reduce((sum, loc) => {
                          const pack = parseFloat(
                            locationQtys[loc.loca_code]?.pack || "0",
                          );
                          const unit = parseFloat(
                            locationQtys[loc.loca_code]?.unit || "0",
                          );
                          const packSize = selectedProduct
                            ? parseFloat(
                                selectedProduct.pack_size?.toString() || "1",
                              )
                            : 1;
                          return sum + (pack * packSize + unit);
                        }, 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-2 pt-2 border-t flex justify-end">
              <Button
                className="w-auto text-xs font-medium"
                onClick={addItem}
                disabled={!selectedProduct}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Selection to Items List
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Items Table Section */}
        <Card className="w-full flex flex-col min-h-[400px]">
          <CardHeader className="flex flex-row items-center justify-between pb-2 h-16">
            <CardTitle className="text-base">Items List</CardTitle>
            <div className="text-right">
              <p className="text-xs">Total Items: {items.length}</p>
              <p className="text-sm font-medium">
                Total Amount:{" "}
                {formatThousandSeparator(
                  items.reduce((sum, item) => sum + item.amount, 0).toFixed(2),
                )}
              </p>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <div className="max-h-[350px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Pack Qty</TableHead>
                    <TableHead className="text-right">Unit Qty</TableHead>
                    <TableHead className="text-right">Total Qty</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="h-16 text-center text-muted-foreground"
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
                        <TableCell className="text-right font-medium">
                          {item.pack_qty}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {item.unit_qty}
                        </TableCell>
                        <TableCell className="text-right font-bold text-primary">
                          {item.total_qty}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.purchase_price.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatThousandSeparator(item.amount)}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() => editItem(item.prod_code)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 text-destructive"
                              onClick={() => removeItem(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <div className="p-4 border-t mt-auto flex justify-end">
            <Button
              className="w-auto justify-end h-8"
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
