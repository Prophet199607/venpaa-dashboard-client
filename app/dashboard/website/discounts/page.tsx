"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { nodeApi } from "@/utils/api-node";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { usePermissions } from "@/context/permissions";
import { AccessDenied } from "@/components/shared/access-denied";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Percent,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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
  id: number;
  prod_code: string;
  prod_name: string;
  selling_price: number;
  discount: number;
  dis_per: number;
  discounted_price: number;
  start_date?: string | null;
  end_date?: string | null;
}

// Number of rows to show per page in the UI table
const ROWS_PER_PAGE = 15;

/** Maps a raw API record to our Product shape. */
function mapProduct(d: any): Product {
  return {
    id: Number(d.id),
    prod_code: d.prod_code,
    prod_name: d.product?.prod_name ?? "",
    selling_price: d.product?.selling_price ?? 0,
    discount: d.discount_amount ?? 0,
    dis_per: d.discount_percentage ?? 0,
    discounted_price: d.discounted_price ?? 0,
    start_date: d.start_date ?? null,
    end_date: d.end_date ?? null,
  };
}

/** Returns the date-range key for a product. */
function getRangeKey(product: Product): string {
  return product.start_date && product.end_date
    ? `${product.start_date} - ${product.end_date}`
    : "No Date Range";
}

export default function WebsiteDiscountListPage() {
  const { toast } = useToast();
  const hasFetched = useRef(false);

  const [loading, setLoading] = useState(false);
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const [productToDelete, setProductToDelete] = useState<number | null>(null);

  // ALL products fetched from every API page — the single source of truth.
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  // Client-side pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // ---------------------------------------------------------------------------
  // Data fetching — load EVERYTHING at once so selection always sees full data
  // ---------------------------------------------------------------------------
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      // First request to get total / last_page
      const firstRes = await nodeApi.get(`/discounts/list?page=1&per_page=${ROWS_PER_PAGE}`);
      const firstData: any[] = firstRes.data?.data ?? [];
      const paginationMeta = firstRes.data?.pagination;
      const lastPage: number = paginationMeta?.last_page ?? 1;

      let allRaw: any[] = [...firstData];

      // Fetch remaining pages in parallel if there are more
      if (lastPage > 1) {
        const pageNums = Array.from({ length: lastPage - 1 }, (_, i) => i + 2);
        const responses = await Promise.all(
          pageNums.map((p) => nodeApi.get(`/discounts/list?page=${p}&per_page=${ROWS_PER_PAGE}`)),
        );
        responses.forEach((res) => {
          allRaw = [...allRaw, ...(res.data?.data ?? [])];
        });
      }

      setAllProducts(allRaw.map(mapProduct));
      setCurrentPage(1);
    } catch (e) {
      console.error(e);
      toast({
        title: "Error",
        description: "Failed to fetch discounted products",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchAll();
  }, [fetchAll]);

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------

  /** All products grouped by date-range key — spans EVERY page. */
  const allProductsByGroup = allProducts.reduce(
    (acc, product) => {
      const range = getRangeKey(product);
      if (!acc[range]) acc[range] = [];
      acc[range].push(product);
      return acc;
    },
    {} as Record<string, Product[]>,
  );

  // Client-side pagination over allProducts
  const totalPages = Math.max(1, Math.ceil(allProducts.length / ROWS_PER_PAGE));
  const pagedProducts = allProducts.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE,
  );

  /** Groups shown in the table for the CURRENT page only (for rendering rows). */
  const groupedCurrentPage = pagedProducts.reduce(
    (acc, product) => {
      const range = getRangeKey(product);
      if (!acc[range]) acc[range] = [];
      acc[range].push(product);
      return acc;
    },
    {} as Record<string, Product[]>,
  );

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const checkExpired = (range: string) => {
    if (range === "No Date Range") return false;
    const parts = range.split(" - ");
    if (parts.length !== 2) return false;
    const endDate = new Date(parts[1].trim());
    if (isNaN(endDate.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return endDate < today;
  };

  // ---------------------------------------------------------------------------
  // Selection handlers
  // ---------------------------------------------------------------------------

  /**
   * Selects / deselects ALL products that belong to `range` — including those
   * on pages other than the currently visible page.
   */
  const handleSelectAllInGroup = (
    range: string,
    checked: boolean,
  ) => {
    // allProductsByGroup is built from the FULL dataset so this always covers
    // every page.
    const groupIds = (allProductsByGroup[range] ?? [])
      .map((p) => Number(p.id))
      .filter((id) => !isNaN(id));

    if (checked) {
      setSelectedProducts((prev) => Array.from(new Set([...prev, ...groupIds])));
    } else {
      setSelectedProducts((prev) => prev.filter((id) => !groupIds.includes(id)));
    }
  };

  const handleSelectProduct = (id: number, checked: boolean) => {
    const numericId = Number(id);
    if (isNaN(numericId)) return;
    if (checked) {
      setSelectedProducts((prev) => Array.from(new Set([...prev, numericId])));
    } else {
      setSelectedProducts((prev) => prev.filter((i) => i !== numericId));
    }
  };

  // ---------------------------------------------------------------------------
  // Delete handler
  // ---------------------------------------------------------------------------

  const handleDeleteDiscount = async () => {
    const idsToDelete = bulkDeleteMode ? selectedProducts : [productToDelete];
    if (
      !idsToDelete ||
      idsToDelete.length === 0 ||
      idsToDelete.some((id) => id === null)
    )
      return;

    setLoading(true);
    try {
      await nodeApi.delete("/discounts/delete", {
        data: { ids: idsToDelete },
      });
      toast({
        title: "Success",
        description: bulkDeleteMode
          ? `${idsToDelete.length} discounts removed`
          : "Discount removed",
        type: "success",
      });
      // Reset and reload fresh data
      hasFetched.current = false;
      setSelectedProducts([]);
      fetchAll();
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
    }
  };

  // ---------------------------------------------------------------------------
  // Pagination
  // ---------------------------------------------------------------------------

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
  };

  // ---------------------------------------------------------------------------
  // Guards
  // ---------------------------------------------------------------------------

  if (!permissionsLoading && !hasPermission("manage discount")) {
    return <AccessDenied />;
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <Percent className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight">
              Product Discounts for Website
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage product-level discounts visible on the website.
          </p>
        </div>

        <div className="flex items-center gap-2">
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
              Remove Selected ({selectedProducts.length})
            </Button>
          )}
          <Link href="/dashboard/website/discounts/create">
            <Button
              size="sm"
              className="gap-2 rounded-full px-6 bg-neutral-900 text-white hover:bg-neutral-800 transition-all dark:bg-neutral-100 dark:text-neutral-900"
            >
              <Plus className="h-4 w-4" /> Create Discount
            </Button>
          </Link>
        </div>
      </div>

      {loading && allProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm font-medium text-muted-foreground">
            Loading discounts...
          </span>
        </div>
      ) : Object.keys(allProductsByGroup).length === 0 ? (
        <Card className="border-dashed border-2 flex flex-col items-center justify-center py-24 px-4 text-center rounded-3xl bg-neutral-50/50 dark:bg-neutral-900/10">
          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-neutral-800 shadow-xl flex items-center justify-center mb-6">
            <Percent className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-xl tracking-tight">
            No active discounts found
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs mt-2 mb-6">
            Start by creating your first product discount.
          </p>
          <Link href="/dashboard/website/discounts/create">
            <Button className="gap-2 rounded-full px-6 h-10 shadow-xl shadow-primary/20">
              <Plus className="w-5 h-5" />
              Create First Discount
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-8">
          {/*
           * Render each group that appears on the current page.
           * The group-level checkbox covers ALL products in that group
           * across every page (from allProductsByGroup).
           */}
          {Object.entries(groupedCurrentPage).map(([range, pageProducts]) => {
            const isExpired = checkExpired(range);
            const allInGroup = allProductsByGroup[range] ?? pageProducts;
            const isGroupChecked =
              allInGroup.length > 0 &&
              allInGroup.every((p) => selectedProducts.includes(Number(p.id)));

            return (
              <Card
                key={range}
                className={cn(
                  "overflow-hidden transition-all rounded-2xl",
                  isExpired && "opacity-60 grayscale-[0.5] border-dashed",
                )}
              >
                <CardHeader className="bg-muted/30 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {!isExpired && (
                        <Checkbox
                          checked={isGroupChecked}
                          onCheckedChange={(checked) =>
                            handleSelectAllInGroup(range, checked as boolean)
                          }
                        />
                      )}
                      <div>
                        <CardTitle className="text-base flex items-center gap-3">
                          {range}
                          <span className="text-sm font-normal text-muted-foreground">
                            ({allInGroup.length} products)
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
                          href={`/dashboard/website/discounts/create?prod_codes=${allInGroup
                            .map((p) => p.prod_code)
                            .join(",")}`}
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
                              allInGroup
                                .map((p: Product) => Number(p.id))
                                .filter((id) => !isNaN(id)),
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
                        <TableHead className="text-right">
                          Discounted Price
                        </TableHead>
                        <TableHead className="text-right">Start Date</TableHead>
                        <TableHead className="text-right">End Date</TableHead>
                        <TableHead className="text-right w-[80px]">
                          Action
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pageProducts.map((p) => (
                        <TableRow key={p.prod_code}>
                          <TableCell className="text-center">
                            {!isExpired && (
                              <Checkbox
                                checked={selectedProducts.includes(Number(p.id))}
                                onCheckedChange={(checked) =>
                                  handleSelectProduct(p.id, checked as boolean)
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
                          <TableCell className="text-right">
                            {p.discounted_price
                              ? parseFloat(
                                  p.discounted_price.toString(),
                                ).toFixed(2)
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            {p.start_date
                              ? new Date(p.start_date).toLocaleDateString()
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            {p.end_date
                              ? new Date(p.end_date).toLocaleDateString()
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            {!isExpired && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  setProductToDelete(p.id);
                                  setBulkDeleteMode(false);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
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

      {/* Client-side Pagination UI */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-4 border-t bg-white dark:bg-neutral-950 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800">
          <div className="text-sm text-muted-foreground font-medium">
            Showing{" "}
            <span className="text-foreground">
              {Math.min((currentPage - 1) * ROWS_PER_PAGE + 1, allProducts.length)}
              {" "}–{" "}
              {Math.min(currentPage * ROWS_PER_PAGE, allProducts.length)}
            </span>{" "}
            of <span className="text-foreground">{allProducts.length}</span>{" "}
            products
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl h-9 px-4 gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1 || loading}
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            <div className="flex items-center px-4 py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-sm font-semibold min-w-[100px] justify-center">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl h-9 px-4 gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || loading}
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
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
