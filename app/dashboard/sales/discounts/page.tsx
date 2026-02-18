"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/utils/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

interface Product {
  prod_code: string;
  prod_name: string;
  selling_price: number;
  discount: number;
  dis_per: number;
  dis_start_date?: string | null;
  dis_end_date?: string | null;
}

export default function DiscountListPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [existingDiscountedProducts, setExistingDiscountedProducts] = useState<
    Product[]
  >([]);

  const fetchExisting = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/products/discounts/list");
      if (res.data.success) {
        setExistingDiscountedProducts(res.data.data);
      }
    } catch (e) {
      console.error(e);
      toast({
        title: "Error",
        description: "Failed to fetch discounted products",
        type: "error",
      });
    } finally {
      setLoading(false);
      setSelectedProducts([]);
    }
  }, [toast]);

  useEffect(() => {
    fetchExisting();
  }, [fetchExisting]);

  // Grouping logic
  const groupedProducts = existingDiscountedProducts.reduce(
    (acc, product) => {
      const range =
        product.dis_start_date && product.dis_end_date
          ? `${product.dis_start_date} - ${product.dis_end_date}`
          : "No Date Range";
      if (!acc[range]) acc[range] = [];
      acc[range].push(product);
      return acc;
    },
    {} as Record<string, Product[]>,
  );

  const checkExpired = (range: string) => {
    if (range === "No Date Range") return false;
    const parts = range.split(" - ");
    if (parts.length !== 2) return false;

    // Parse DD/MM/YYYY
    const endPart = parts[1].trim();
    const [d, m, y] = endPart.split("/").map(Number);
    if (!d || !m || !y) return false;

    const endDate = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return endDate < today;
  };

  // Handle checkbox selection
  const handleSelectAllInGroup = (
    groupProducts: Product[],
    checked: boolean,
  ) => {
    if (checked) {
      const groupCodes = groupProducts.map((p) => p.prod_code);
      setSelectedProducts((prev) =>
        Array.from(new Set([...prev, ...groupCodes])),
      );
    } else {
      const groupCodes = groupProducts.map((p) => p.prod_code);
      setSelectedProducts((prev) =>
        prev.filter((code) => !groupCodes.includes(code)),
      );
    }
  };

  const handleSelectProduct = (prodCode: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts([...selectedProducts, prodCode]);
    } else {
      setSelectedProducts(selectedProducts.filter((code) => code !== prodCode));
    }
  };

  const handleDeleteDiscount = async () => {
    const codesToDelete = bulkDeleteMode ? selectedProducts : [productToDelete];

    if (!codesToDelete || codesToDelete.length === 0) return;

    setLoading(true);
    try {
      await api.post("/products/discounts/update", {
        prod_codes: codesToDelete,
        discount: 0,
        dis_per: 0,
      });
      toast({
        title: "Success",
        description: bulkDeleteMode
          ? `${codesToDelete.length} discounts removed`
          : "Discount removed",
        type: "success",
      });
      fetchExisting();
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to remove discount",
        type: "error",
      });
      setLoading(false);
    } finally {
      setDeleteDialogOpen(false);
      setProductToDelete(null);
      setBulkDeleteMode(false);
      setSelectedProducts([]);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Manage Discounts</h1>
        <div className="flex items-center gap-2">
          {selectedProducts.length > 0 && (
            <Button
              variant="destructive"
              onClick={() => {
                setBulkDeleteMode(true);
                setDeleteDialogOpen(true);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove Selected ({selectedProducts.length})
            </Button>
          )}
          <Link href="/dashboard/sales/discounts/create">
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Create Discount
            </Button>
          </Link>
        </div>
      </div>

      {loading && existingDiscountedProducts.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : Object.keys(groupedProducts).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64 space-y-4">
            <p className="text-muted-foreground">No active discounts found.</p>
            <Link href="/dashboard/sales/discounts/create">
              <Button variant="outline">Create your first discount</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedProducts).map(([range, products]) => {
            const isExpired = checkExpired(range);
            return (
              <Card
                key={range}
                className={cn(
                  "overflow-hidden transition-all",
                  isExpired && "opacity-60 grayscale-[0.5] border-dashed",
                )}
              >
                <CardHeader className="bg-muted/30 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {!isExpired && (
                        <Checkbox
                          checked={
                            products.length > 0 &&
                            products.every((p) =>
                              selectedProducts.includes(p.prod_code),
                            )
                          }
                          onCheckedChange={(checked) =>
                            handleSelectAllInGroup(products, checked as boolean)
                          }
                        />
                      )}
                      <div>
                        <CardTitle className="text-lg flex items-center gap-3">
                          {range}
                          <span className="text-sm font-normal text-muted-foreground">
                            ({products.length} products)
                          </span>
                          {isExpired && (
                            <Badge variant="destructive" className="ml-2">
                              Expired
                            </Badge>
                          )}
                        </CardTitle>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isExpired && (
                        <Link
                          href={`/dashboard/sales/discounts/create?prod_codes=${products.map((p) => p.prod_code).join(",")}`}
                        >
                          <Button variant="outline" size="sm" className="h-8">
                            <Pencil className="h-3 w-3 mr-2 text-blue-600" />
                            Edit Group
                          </Button>
                        </Link>
                      )}
                      {isExpired && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            setSelectedProducts(
                              products.map((p) => p.prod_code),
                            );
                            setBulkDeleteMode(true);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-3 w-3 mr-2" />
                          Clear Expired
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px] text-center"></TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Discount</TableHead>
                        <TableHead className="text-right">Disc %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((p) => (
                        <TableRow key={p.prod_code}>
                          <TableCell className="text-center">
                            {!isExpired && (
                              <Checkbox
                                checked={selectedProducts.includes(p.prod_code)}
                                onCheckedChange={(checked) =>
                                  handleSelectProduct(
                                    p.prod_code,
                                    checked as boolean,
                                  )
                                }
                              />
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            {p.prod_code}
                          </TableCell>
                          <TableCell>{p.prod_name}</TableCell>
                          <TableCell className="text-right">
                            {parseFloat(p.selling_price.toString()).toFixed(2)}
                          </TableCell>
                          <TableCell
                            className={cn(
                              "text-right font-semibold",
                              isExpired
                                ? "text-muted-foreground"
                                : "text-green-600",
                            )}
                          >
                            {p.discount > 0
                              ? parseFloat(p.discount.toString()).toFixed(2)
                              : "-"}
                          </TableCell>
                          <TableCell
                            className={cn(
                              "text-right font-semibold",
                              isExpired
                                ? "text-muted-foreground"
                                : "text-green-600",
                            )}
                          >
                            {p.dis_per > 0
                              ? `${parseFloat(p.dis_per.toString()).toFixed(2)}%`
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {bulkDeleteMode
                ? `This will remove discounts from ${selectedProducts.length} selected product(s). This action cannot be undone.`
                : "This will remove the discount from this product. This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDiscount}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
