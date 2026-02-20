"use client";

import { useEffect, useState, useCallback, Suspense, useRef } from "react";
import { z } from "zod";
import { api } from "@/utils/api";
import { useForm } from "react-hook-form";
import Loader from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { zodResolver } from "@hookform/resolvers/zod";
import { DataTable } from "@/components/ui/data-table";
import { DatePicker } from "@/components/ui/date-picker";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { BasicProductSearch } from "@/components/shared/basic-product-search";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Define the schema based on our back-end and requirements
const priceLevelSchema = z
  .object({
    prod_code: z.string().min(1, "Product is required"),
    prod_name: z.string().optional(),
    has_expiry: z.boolean(),
    expiry_date: z.date().optional().nullable(),
    purchase_price: z.union([z.string(), z.number()]).transform((val) => {
      const num = typeof val === "string" ? parseFloat(val) : val;
      return isNaN(num) || num < 0 ? 0 : num;
    }),
    selling_price: z.union([z.string(), z.number()]).transform((val) => {
      const num = typeof val === "string" ? parseFloat(val) : val;
      return isNaN(num) || num < 0 ? 0 : num;
    }),
    wholesale_price: z.union([z.string(), z.number()]).transform((val) => {
      const num = typeof val === "string" ? parseFloat(val) : val;
      return isNaN(num) || num < 0 ? 0 : num;
    }),
  })
  .refine(
    (data) => {
      if (data.has_expiry && !data.expiry_date) {
        return false;
      }
      return true;
    },
    {
      message: "Expiry date is required when 'Has Expiry' is checked",
      path: ["expiry_date"],
    },
  );

type FormData = {
  prod_code: string;
  prod_name?: string;
  has_expiry: boolean;
  expiry_date?: Date | null;
  purchase_price: number;
  selling_price: number;
  wholesale_price: number;
};

interface PriceLevel {
  id: number;
  prod_code: string;
  purchase_price: number;
  selling_price: number;
  wholesale_price: number;
  has_expiry: boolean;
  expiry_date: string | null;
  created_at: string;
  product?: {
    prod_name: string;
  };
}

function PriceLevelContent() {
  const { toast } = useToast();
  const fetched = useRef(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [priceLevels, setPriceLevels] = useState<PriceLevel[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Confirmation modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    description: string;
    onConfirm: () => void;
    actionLabel?: string;
    variant?: "default" | "destructive";
  }>({
    title: "",
    description: "",
    onConfirm: () => {},
  });

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const triggerConfirm = (config: typeof confirmConfig) => {
    setConfirmConfig(config);
    setConfirmOpen(true);
  };

  const form = useForm<FormData>({
    resolver: zodResolver(priceLevelSchema) as any,
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

  const fetchPriceLevels = useCallback(async (code?: string) => {
    setFetching(true);
    try {
      const url = code ? `/price-levels?prod_code=${code}` : "/price-levels";
      const { data: res } = await api.get(url);
      if (res.success) {
        // PRESERVE unsaved items (temporary IDs > 1000000000000)
        setPriceLevels((prev) => {
          const unsavedItems = prev.filter((pl) => pl.id > 1000000000000);
          return [...unsavedItems, ...res.data];
        });
      }
    } catch (error: any) {
      console.error("Failed to fetch price levels", error);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    fetchPriceLevels(prodCode);
  }, [prodCode, fetchPriceLevels]);

  const handleProductChange = (product: any) => {
    setSelectedProduct(product);
    if (product) {
      form.setValue("prod_code", product.prod_code);
      form.setValue("prod_name", product.prod_name);
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

    if (editingId) {
      const isTemporaryId = editingId > 1000000000000;

      if (isTemporaryId) {
        setPriceLevels((prev) =>
          prev.map((pl) =>
            pl.id === editingId
              ? {
                  ...pl,
                  purchase_price: values.purchase_price,
                  selling_price: values.selling_price,
                  wholesale_price: values.wholesale_price,
                  has_expiry: values.has_expiry,
                  expiry_date: formatDate(values.expiry_date),
                }
              : pl,
          ),
        );
        resetAddForm();
      } else {
        setLoading(true);
        try {
          const payload = {
            purchase_price: values.purchase_price,
            selling_price: values.selling_price,
            wholesale_price: values.wholesale_price,
            has_expiry: values.has_expiry,
            expiry_date: formatDate(values.expiry_date),
          };
          const { data: res } = await api.put(
            `/price-levels/${editingId}`,
            payload,
          );
          if (res.success) {
            toast({
              title: "Success",
              description: "Price level updated successfully",
              type: "success",
            });
            handleClear();
          }
        } catch (error: any) {
          toast({
            title: "Error",
            description: "Failed to update price level",
            type: "error",
          });
        } finally {
          setLoading(false);
        }
      }
      return;
    }

    const newEntry: PriceLevel = {
      id: Date.now(),
      prod_code: values.prod_code,
      purchase_price: values.purchase_price ?? 0,
      selling_price: values.selling_price ?? 0,
      wholesale_price: values.wholesale_price ?? 0,
      has_expiry: values.has_expiry,
      expiry_date: formatDate(values.expiry_date),
      created_at: new Date().toISOString(),
      product: selectedProduct
        ? { prod_name: selectedProduct.prod_name }
        : undefined,
    };

    setPriceLevels((prev) => [newEntry, ...prev]);
    resetAddForm();
  };

  const resetAddForm = () => {
    if (selectedProduct) {
      form.setValue("purchase_price", selectedProduct.purchase_price || 0);
      form.setValue("selling_price", selectedProduct.selling_price || 0);
      form.setValue("wholesale_price", selectedProduct.wholesale_price || 0);
    } else {
      form.setValue("purchase_price", 0);
      form.setValue("selling_price", 0);
      form.setValue("wholesale_price", 0);
    }
    form.setValue("has_expiry", false);
    form.setValue("expiry_date", null);
    setEditingId(null);
  };

  const handleEdit = (pl: PriceLevel) => {
    setEditingId(pl.id);
    form.setValue("prod_code", pl.prod_code);
    form.setValue("prod_name", pl.product?.prod_name || "");
    form.setValue("purchase_price", pl.purchase_price);
    form.setValue("selling_price", pl.selling_price);
    form.setValue("wholesale_price", pl.wholesale_price);
    form.setValue("has_expiry", !!pl.has_expiry);
    form.setValue(
      "expiry_date",
      pl.expiry_date
        ? (() => {
            const [y, m, d] = pl.expiry_date.split("-").map(Number);
            return new Date(y, m - 1, d);
          })()
        : null,
    );

    if (pl.product) {
      setSelectedProduct({
        prod_code: pl.prod_code,
        prod_name: pl.product.prod_name,
      });
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

    const newPriceLevels = priceLevels.filter((pl) => pl.id > 1000000000000);

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
        price_levels: newPriceLevels.map((pl) => ({
          prod_code: pl.prod_code,
          purchase_price: Number(pl.purchase_price),
          selling_price: Number(pl.selling_price),
          wholesale_price: Number(pl.wholesale_price),
          has_expiry: Boolean(pl.has_expiry || false),
          expiry_date: pl.expiry_date || null,
        })),
      };

      const { data: res } = await api.post("/price-levels/batch", payload);
      if (res.success) {
        toast({
          title: "Success",
          description: `${newPriceLevels.length} price level(s) saved successfully`,
          type: "success",
        });
        setPriceLevels([]);
        fetchPriceLevels();
        handleClear();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to save price levels",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    if (priceLevels.length === 0) return;

    const isSystemWide = !prodCode;

    triggerConfirm({
      title: isSystemWide
        ? "Delete ALL Price Levels?"
        : "Delete All for this Product?",
      description: isSystemWide
        ? "Are you sure you want to delete every price level in the system? This action cannot be undone."
        : `Are you sure you want to delete all price levels for product ${prodCode}?`,
      variant: "destructive",
      actionLabel: "Delete All",
      onConfirm: async () => {
        try {
          setLoading(true);
          const url = isSystemWide
            ? "/price-levels/delete-all"
            : `/price-levels/delete-all?prod_code=${prodCode}`;
          const { data: res } = await api.delete(url);
          if (res.success) {
            toast({
              title: "Success",
              description: res.message || "Price levels deleted",
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
      },
    });
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
    setEditingId(null);
    fetchPriceLevels();
  };

  const deleteSinglePriceLevel = async (record: PriceLevel) => {
    const isTemporaryId = record.id > 1000000000000;

    triggerConfirm({
      title: isTemporaryId ? "Remove Item?" : "Delete Price Level?",
      description: isTemporaryId
        ? "Are you sure you want to remove this item from the list?"
        : "Are you sure you want to delete this price level from the database?",
      variant: "destructive",
      actionLabel: isTemporaryId ? "Remove" : "Delete",
      onConfirm: async () => {
        if (isTemporaryId) {
          setPriceLevels((prev) => prev.filter((pl) => pl.id !== record.id));
          toast({
            title: "Success",
            description: "Price level removed",
            type: "success",
          });
          return;
        }

        try {
          setLoading(true);
          const { data: res } = await api.delete(`/price-levels/${record.id}`);
          if (res.success) {
            toast({
              title: "Success",
              description: "Price level deleted",
              type: "success",
            });
            fetchPriceLevels(prodCode);
          }
        } catch (error: any) {
          toast({
            title: "Error",
            description:
              error.response?.data?.message || "Failed to delete price level",
            type: "error",
          });
        } finally {
          setLoading(false);
        }
      },
    });
  };

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
      cell: ({ row }) => row.original.product?.prod_name || "-",
    },
    {
      accessorKey: "purchase_price",
      header: "Purch Price",
      cell: ({ row }) => Number(row.original.purchase_price).toFixed(2),
    },
    {
      accessorKey: "selling_price",
      header: "Selling Price",
      cell: ({ row }) => Number(row.original.selling_price).toFixed(2),
    },
    {
      accessorKey: "wholesale_price",
      header: "WholeSale Price",
      cell: ({ row }) => Number(row.original.wholesale_price).toFixed(2),
    },
    {
      accessorKey: "expiry_date",
      header: "Expiry Date",
      cell: ({ row }) => {
        const expiryDate = row.original.expiry_date;
        const hasExpiry = row.original.has_expiry;

        if (!expiryDate) return "-";

        const today = new Date().toISOString().split("T")[0];
        const isExpired = hasExpiry && expiryDate < today;

        return (
          <div className="flex items-center gap-2">
            <span className={isExpired ? "text-red-600 font-medium" : ""}>
              {expiryDate}
            </span>
            {isExpired && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-600 border border-red-200 uppercase tracking-tighter">
                Expired
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(row.original)}
            disabled={loading}
            className="text-blue-500 hover:text-blue-700"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => deleteSinglePriceLevel(row.original)}
            disabled={loading}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-2">
      <Card>
        <CardHeader>
          <div className="text-xl font-bold">Product Price Level</div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAdd)} className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="space-y-2">
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

                  <div className="flex items-center gap-2 pt-2">
                    <FormField
                      control={form.control}
                      name="has_expiry"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-2 space-y-0">
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

                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
                              onChange={(e) => field.onChange(e.target.value)}
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
                              onChange={(e) => field.onChange(e.target.value)}
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
                              onChange={(e) => field.onChange(e.target.value)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    {editingId && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={handleClear}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                    )}
                    <Button
                      type="button"
                      onClick={handleAdd}
                      disabled={loading}
                    >
                      {editingId ? "Update" : "Add"}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <DataTable columns={columns} data={priceLevels} />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-6 border-t">
                <div></div>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDeleteAll}
                    disabled={loading || priceLevels.length === 0}
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
        {loading || fetching ? <Loader /> : null}
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmConfig.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmConfig.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={
                confirmConfig.variant === "destructive"
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : ""
              }
              onClick={confirmConfig.onConfirm}
            >
              {confirmConfig.actionLabel || "Continue"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
