"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { z } from "zod";
import { api } from "@/utils/api";
import { useForm } from "react-hook-form";
import Loader from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { BasicProductSearch } from "@/components/shared/basic-product-search";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";

// Define the schema based on our back-end and requirements
const priceLevelSchema = z.object({
  prod_code: z.string().min(1, "Product is required"),
  prod_name: z.string().optional(),
  has_expiry: z.boolean(),
  expiry_date: z.date().optional().nullable(),
  purchase_price: z.number().min(0, "Purchase price must be positive"),
  selling_price: z.number().min(0, "Selling price must be positive"),
  wholesale_price: z.number().min(0, "Wholesale price must be positive"),
}).refine((data) => {
  if (data.has_expiry && !data.expiry_date) {
    return false;
  }
  return true;
}, {
  message: "Expiry date is required when 'Has Expiry' is checked",
  path: ["expiry_date"],
});

type FormData = z.infer<typeof priceLevelSchema>;

interface PriceLevel {
  id: number;
  prod_code: string;
  purchase_price: number;
  selling_price: number;
  wholesale_price: number;
  has_expiry: boolean;
  expiry_date: string | null;
  created_at: string;
}

function PriceLevelContent() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [priceLevels, setPriceLevels] = useState<PriceLevel[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(priceLevelSchema),
    defaultValues: {
      prod_code: "",
      prod_name: "",
      has_expiry: false,
      expiry_date: null,
      purchase_price: 0,
      selling_price: 0,
      wholesale_price: 0,
    },
  });

  const prodCode = form.watch("prod_code");
  const hasExpiry = form.watch("has_expiry");

  const fetchPriceLevels = useCallback(async (code: string) => {
    if (!code) {
      setPriceLevels([]);
      return;
    }
    setFetching(true);
    try {
      const { data: res } = await api.get(`/price-levels?prod_code=${code}`);
      if (res.success) {
        setPriceLevels(res.data);
      }
    } catch (error: any) {
      console.error("Failed to fetch price levels", error);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (prodCode) {
      fetchPriceLevels(prodCode);
    } else {
      setPriceLevels([]);
    }
  }, [prodCode, fetchPriceLevels]);

  const handleProductChange = (product: any) => {
    setSelectedProduct(product);
    if (product) {
      form.setValue("prod_code", product.prod_code);
      form.setValue("prod_name", product.prod_name);
      // Optional: auto-fill prices from product if available
      form.setValue("purchase_price", product.purchase_price || 0);
      form.setValue("selling_price", product.selling_price || 0);
      form.setValue("wholesale_price", product.wholesale_price || 0);
    } else {
      form.setValue("prod_code", "");
      form.setValue("prod_name", "");
    }
  };

  const handleAdd = async () => {
    const isValid = await form.trigger();
    if (!isValid) return;

    const values = form.getValues();
    const newEntry: PriceLevel = {
      id: Date.now(), // Temporary ID for local state
      prod_code: values.prod_code,
      purchase_price: values.purchase_price,
      selling_price: values.selling_price,
      wholesale_price: values.wholesale_price,
      has_expiry: values.has_expiry,
      expiry_date: values.expiry_date ? values.expiry_date.toISOString().split('T')[0] : null,
      created_at: new Date().toISOString(),
    };

    setPriceLevels((prev) => [newEntry, ...prev]);
    
    // Reset price fields to original product prices after adding
    if (selectedProduct) {
      form.setValue("purchase_price", selectedProduct.purchase_price || 0);
      form.setValue("selling_price", selectedProduct.selling_price || 0);
      form.setValue("wholesale_price", selectedProduct.wholesale_price || 0);
    }
    
    // Clear expiry date if it was set
    if (values.expiry_date) {
      form.setValue("expiry_date", null);
    }
  };

  const onSave = async () => {
    if (priceLevels.length === 0) {
      toast({
        title: "Warning",
        description: "Add at least one price level to the table before saving",
        type: "warning",
      });
      return;
    }

    // Filter only new items (temporary IDs) to save
    // Temporary IDs are created with Date.now() which are very large numbers
    const newPriceLevels = priceLevels.filter(pl => pl.id > 1000000000000);
    
    if (newPriceLevels.length === 0) {
      toast({
        title: "Info",
        description: "All price levels are already saved",
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        prod_code: prodCode,
        price_levels: newPriceLevels.map(pl => ({
          purchase_price: Number(pl.purchase_price),
          selling_price: Number(pl.selling_price),
          wholesale_price: Number(pl.wholesale_price),
          has_expiry: Boolean(pl.has_expiry || false),
          expiry_date: pl.expiry_date || null,
        }))
      };

      console.log("Saving price levels:", payload);

      const { data: res } = await api.post("/price-levels/batch", payload);
      if (res.success) {
        toast({
          title: "Success",
          description: `${newPriceLevels.length} price level(s) saved successfully`,
          type: "success",
        });
        // Refresh the price levels from database
        fetchPriceLevels(prodCode);
      }
    } catch (error: any) {
      console.error("Save error:", error);
      const errorMessage = error.response?.data?.message 
        || error.response?.data?.errors 
        || error.message 
        || "Failed to save price levels";
      toast({
        title: "Error",
        description: typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!prodCode) return;
    if (!confirm("Are you sure you want to delete all price levels for this product?")) return;

    try {
      setLoading(true);
      const { data: res } = await api.delete(`/price-levels/product/${prodCode}`);
      if (res.success) {
        toast({
          title: "Success",
          description: "All price levels deleted",
          type: "success",
        });
        fetchPriceLevels(prodCode);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete price levels",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveExpired = async () => {
    try {
      setLoading(true);
      const { data: res } = await api.delete("/price-levels/expired");
      if (res.success) {
        toast({
          title: "Success",
          description: "Expired price levels removed",
          type: "success",
        });
        if (prodCode) fetchPriceLevels(prodCode);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to remove expired price levels",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    form.reset({
      prod_code: "",
      prod_name: "",
      has_expiry: false,
      expiry_date: null,
      purchase_price: 0,
      selling_price: 0,
      wholesale_price: 0,
    });
    setSelectedProduct(null);
    setPriceLevels([]);
  };

  const deleteSinglePriceLevel = async (id: number) => {
    if (!confirm("Are you sure you want to delete this price level?")) return;

    // Check if this is a temporary ID (local-only item)
    // Temporary IDs are created with Date.now() which are very large numbers
    // Real database IDs are typically smaller auto-incrementing integers
    const isTemporaryId = id > 1000000000000; // Rough threshold for Date.now() values

    if (isTemporaryId) {
      // Remove from local state only
      setPriceLevels((prev) => prev.filter((pl) => pl.id !== id));
      toast({
        title: "Success",
        description: "Price level removed",
        type: "success",
      });
      return;
    }

    // Delete from database
    try {
      setLoading(true);
      const { data: res } = await api.delete(`/price-levels/${id}`);
      if (res.success) {
        toast({
          title: "Success",
          description: "Price level deleted",
          type: "success",
        });
        if (prodCode) fetchPriceLevels(prodCode);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete price level",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  const columns: ColumnDef<PriceLevel>[] = [
    {
      id: "index",
      header: "#",
      cell: ({ row }) => row.index + 1,
      size: 50,
    },
    {
      accessorKey: "prod_code",
      header: "Product",
    },
    {
      id: "description",
      header: "Description",
      cell: () => selectedProduct?.prod_name || "-",
    },
    {
        accessorKey: "purchase_price",
        header: "Purch Price",
        cell: ({ row }) => Number(row.original.purchase_price).toFixed(4),
    },
    {
        accessorKey: "selling_price",
        header: "Selling Price",
        cell: ({ row }) => Number(row.original.selling_price).toFixed(4),
    },
    {
        accessorKey: "wholesale_price",
        header: "WholeSale Price",
        cell: ({ row }) => Number(row.original.wholesale_price).toFixed(4),
    },
    {
        accessorKey: "expiry_date",
        header: "Expiry Date",
        cell: ({ row }) => row.original.expiry_date || "-",
    },
    {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
            <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteSinglePriceLevel(row.original.id)}
                disabled={loading}
                className="text-red-500 hover:text-red-700"
            >
                <Trash2 className="h-4 w-4" />
            </Button>
        )
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="text-xl font-bold">Product Price Level</div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAdd)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="prod_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product *</FormLabel>
                        <FormControl>
                          <BasicProductSearch
                            value={field.value}
                            onValueChange={handleProductChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center gap-6 pt-2">
                    <FormField
                      control={form.control}
                      name="has_expiry"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Has Expiry</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    {hasExpiry && (
                      <FormField
                        control={form.control}
                        name="expiry_date"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <DatePicker
                                date={field.value || undefined}
                                setDate={(date) => field.onChange(date)}
                                placeholder="Select Expiry Date"
                                allowFuture={true}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="purchase_price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Purchase Price</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.0001"
                              placeholder="0.0000"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="selling_price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Selling Price</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.0001"
                              placeholder="0.0000"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="wholesale_price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Whole Sale Price</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.0001"
                              placeholder="0.0000"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button 
                      type="button" 
                      onClick={handleAdd}
                      disabled={loading}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <DataTable
                  columns={columns}
                  data={priceLevels}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t">
                <div>
                   <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleRemoveExpired}
                    disabled={loading || priceLevels.some(pl => pl.id > 1000000000000)}
                  >
                    Remove All Expired Price Levels
                  </Button>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDeleteAll}
                    disabled={loading || !prodCode}
                  >
                    Delete All
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="min-w-[100px]"
                    onClick={onSave}
                    disabled={loading || priceLevels.length === 0}
                  >
                    Save
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleClear}
                    disabled={loading}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
        {loading ? <Loader /> : null}
      </Card>
    </div>
  );
}

export default function PriceLevelPage() {
  return (
    <Suspense fallback={<Loader />}>
      <PriceLevelContent />
    </Suspense>
  );
}
