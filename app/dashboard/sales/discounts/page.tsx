"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/utils/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

  // Handle checkbox selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(existingDiscountedProducts.map((p) => p.prod_code));
    } else {
      setSelectedProducts([]);
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
        <Link href="/dashboard/sales/discounts/create">
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Create Discount
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Existing Discounted Products</CardTitle>
            {selectedProducts.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setBulkDeleteMode(true);
                  setDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected ({selectedProducts.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px] text-center">
                  <Checkbox
                    checked={
                      existingDiscountedProducts.length > 0 &&
                      selectedProducts.length ===
                        existingDiscountedProducts.length
                    }
                    onCheckedChange={(checked) =>
                      handleSelectAll(checked as boolean)
                    }
                  />
                </TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Discount</TableHead>
                <TableHead className="text-right">Disc %</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && existingDiscountedProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : existingDiscountedProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    No active discounts.
                  </TableCell>
                </TableRow>
              ) : (
                existingDiscountedProducts.map((p) => (
                  <TableRow key={p.prod_code}>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={selectedProducts.includes(p.prod_code)}
                        onCheckedChange={(checked) =>
                          handleSelectProduct(p.prod_code, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell>{p.prod_code}</TableCell>
                    <TableCell>{p.prod_name}</TableCell>
                    <TableCell className="text-right">
                      {parseFloat(p.selling_price.toString()).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {parseFloat(p.discount.toString()).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {parseFloat(p.dis_per.toString()).toFixed(2)}%
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <Link
                            href={`/dashboard/sales/discounts/create?prod_code=${p.prod_code}`}
                          >
                            <DropdownMenuItem>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              setProductToDelete(p.prod_code);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
