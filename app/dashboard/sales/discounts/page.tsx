"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Loader2,
  Percent,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/utils/api";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { usePermissions } from "@/context/permissions";
import { AccessDenied } from "@/components/shared/access-denied";
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

const GROUPS_PER_PAGE = 10;
const ROWS_PER_GROUP_PAGE = 15;

function fmt(value: number): string {
  return parseFloat(value.toString()).toFixed(2);
}

function checkExpired(range: string): boolean {
  if (range === "No Date Range") return false;
  const parts = range.split(" - ");
  if (parts.length !== 2) return false;

  const endPart = parts[1].trim();
  const [d, m, y] = endPart.split("/").map(Number);
  if (!d || !m || !y) return false;

  const endDate = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return endDate < today;
}

function getRangeKey(product: Product): string {
  return product.dis_start_date && product.dis_end_date
    ? `${product.dis_start_date} - ${product.dis_end_date}`
    : "No Date Range";
}

interface GroupTableProps {
  allProducts: Product[];
  selectedProducts: string[];
  onSelectProduct: (prodCode: string, checked: boolean) => void;
  showActions: boolean;
  isExpired?: boolean;
}

function GroupTable({
  allProducts,
  selectedProducts,
  onSelectProduct,
  showActions,
  isExpired = false,
}: GroupTableProps) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(
    1,
    Math.ceil(allProducts.length / ROWS_PER_GROUP_PAGE),
  );

  useEffect(() => {
    if (page > totalPages && totalPages > 0) {
      setPage(totalPages);
    } else if (totalPages === 0 && page !== 1) {
      setPage(1);
    }
  }, [totalPages, page]);

  const safePage = Math.min(page, totalPages);

  const pageRows = allProducts.slice(
    (safePage - 1) * ROWS_PER_GROUP_PAGE,
    safePage * ROWS_PER_GROUP_PAGE,
  );

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow className="h-8">
            {showActions && <TableHead className="w-[50px] text-center py-1" />}
            <TableHead className="py-1">Code</TableHead>
            <TableHead className="py-1">Name</TableHead>
            <TableHead className="text-right py-1">Price</TableHead>
            <TableHead className="text-right py-1">Discount</TableHead>
            <TableHead className="text-right py-1">Disc %</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageRows.map((p) => (
            <TableRow key={p.prod_code} className="h-7">
              {showActions && (
                <TableCell className="text-center py-0.5">
                  <Checkbox
                    checked={selectedProducts.includes(p.prod_code)}
                    onCheckedChange={(checked) =>
                      onSelectProduct(p.prod_code, checked as boolean)
                    }
                  />
                </TableCell>
              )}
              <TableCell className="font-medium py-0.5 text-xs">
                {p.prod_code}
              </TableCell>
              <TableCell className="py-0.5 text-xs">{p.prod_name}</TableCell>
              <TableCell className="text-right py-0.5 text-xs">
                {fmt(p.selling_price)}
              </TableCell>
              <TableCell
                className={cn(
                  "text-right font-semibold py-0.5 text-xs",
                  isExpired ? "text-muted-foreground" : "text-green-600",
                )}
              >
                {p.discount > 0 ? fmt(p.discount) : "-"}
              </TableCell>
              <TableCell
                className={cn(
                  "text-right font-semibold py-0.5 text-xs",
                  isExpired ? "text-muted-foreground" : "text-green-600",
                )}
              >
                {p.dis_per > 0 ? `${fmt(p.dis_per)}%` : "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <div className="text-sm text-muted-foreground">
            Showing {(safePage - 1) * ROWS_PER_GROUP_PAGE + 1} to{" "}
            {Math.min(safePage * ROWS_PER_GROUP_PAGE, allProducts.length)} of{" "}
            {allProducts.length} products
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={safePage <= 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <div className="text-sm font-medium">
              Page {safePage} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={safePage >= totalPages}
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

interface SectionPagerProps {
  currentPage: number;
  totalPages: number;
  totalGroups: number;
  loading: boolean;
  onPageChange: (page: number) => void;
}

function SectionPager({
  currentPage,
  totalPages,
  totalGroups,
  loading,
  onPageChange,
}: SectionPagerProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-4 bg-white dark:bg-neutral-950 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800">
      <div className="text-sm text-muted-foreground font-medium">
        Showing{" "}
        <span className="text-foreground">
          Batch {(currentPage - 1) * GROUPS_PER_PAGE + 1}–
          {Math.min(currentPage * GROUPS_PER_PAGE, totalGroups)}
        </span>{" "}
        of <span className="text-foreground">{totalGroups}</span> batches
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl h-9 px-4"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1 || loading}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        <div className="px-4 py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-sm font-semibold">
          Page {currentPage} of {totalPages}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl h-9 px-4"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || loading}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

export default function DiscountListPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [existingDiscountedProducts, setExistingDiscountedProducts] = useState<
    Product[]
  >([]);

  const [activePage, setActivePage] = useState(1);
  const [expiredPage, setExpiredPage] = useState(1);
  const [showPast, setShowPast] = useState(false);

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

  // Grouping and splitting
  const allProductsByGroup = existingDiscountedProducts.reduce<
    Record<string, Product[]>
  >((acc, product) => {
    const range = getRangeKey(product);
    if (!acc[range]) acc[range] = [];
    acc[range].push(product);
    return acc;
  }, {});

  const activeGroups = Object.entries(allProductsByGroup).filter(
    ([range]) => !checkExpired(range),
  );
  const expiredGroups = Object.entries(allProductsByGroup).filter(([range]) =>
    checkExpired(range),
  );

  const totalActivePages = Math.max(
    1,
    Math.ceil(activeGroups.length / GROUPS_PER_PAGE),
  );
  const totalExpiredPages = Math.max(
    1,
    Math.ceil(expiredGroups.length / GROUPS_PER_PAGE),
  );

  const currentActiveEntries = activeGroups.slice(
    (activePage - 1) * GROUPS_PER_PAGE,
    activePage * GROUPS_PER_PAGE,
  );
  const currentExpiredEntries = expiredGroups.slice(
    (expiredPage - 1) * GROUPS_PER_PAGE,
    expiredPage * GROUPS_PER_PAGE,
  );

  useEffect(() => {
    if (activePage > totalActivePages) setActivePage(totalActivePages);
  }, [totalActivePages, activePage]);

  useEffect(() => {
    if (expiredPage > totalExpiredPages) setExpiredPage(totalExpiredPages);
  }, [totalExpiredPages, expiredPage]);

  // Handler for select-all within a group
  const handleSelectAllInGroup = (range: string, checked: boolean) => {
    const groupCodes = (allProductsByGroup[range] ?? []).map(
      (p) => p.prod_code,
    );
    if (checked) {
      setSelectedProducts((prev) =>
        Array.from(new Set([...prev, ...groupCodes])),
      );
    } else {
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

  if (!permissionsLoading && !hasPermission("manage discount")) {
    return <AccessDenied />;
  }

  return (
    <div className="space-y-2 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <Percent className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              Manage Discounts
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage product-level discounts for the sales system.
          </p>
        </div>
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
      ) : activeGroups.length === 0 && expiredGroups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64 space-y-4">
            <p className="text-muted-foreground">No active discounts found.</p>
            <Link href="/dashboard/sales/discounts/create">
              <Button variant="outline">Create your first discount</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Active Discounts */}
          {activeGroups.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-gradient-to-r from-green-200 to-transparent" />
                <span className="text-xs font-semibold tracking-wider uppercase text-green-600 bg-green-50 dark:bg-green-950/30 px-3 py-1 rounded-full">
                  Active Discounts
                </span>
                <div className="h-px flex-1 bg-gradient-to-l from-green-200 to-transparent" />
              </div>

              {currentActiveEntries.map(([range]) => {
                const allInGroup = allProductsByGroup[range] ?? [];
                const isGroupChecked =
                  allInGroup.length > 0 &&
                  allInGroup.every((p) =>
                    selectedProducts.includes(p.prod_code),
                  );

                return (
                  <Card
                    key={range}
                    className="overflow-hidden transition-all rounded-2xl border-green-200 shadow-sm"
                  >
                    <CardHeader className="bg-green-50/50 dark:bg-green-950/10 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Checkbox
                            checked={isGroupChecked}
                            onCheckedChange={(checked) =>
                              handleSelectAllInGroup(range, checked as boolean)
                            }
                          />
                          <div>
                            <CardTitle className="text-base flex items-center gap-3">
                              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                              {range}
                              <span className="text-sm font-normal text-muted-foreground">
                                ({allInGroup.length} products)
                              </span>
                            </CardTitle>
                          </div>
                        </div>
                        <Link
                          href={`/dashboard/sales/discounts/create?prod_codes=${allInGroup.map((p) => p.prod_code).join(",")}`}
                        >
                          <Button variant="outline" size="sm" className="h-8">
                            <Pencil className="h-3 w-3 mr-2 text-blue-600" />
                            Edit Group
                          </Button>
                        </Link>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <GroupTable
                        allProducts={allInGroup}
                        selectedProducts={selectedProducts}
                        onSelectProduct={handleSelectProduct}
                        showActions
                      />
                    </CardContent>
                  </Card>
                );
              })}

              <SectionPager
                currentPage={activePage}
                totalPages={totalActivePages}
                totalGroups={activeGroups.length}
                loading={loading}
                onPageChange={(p) => {
                  if (p >= 1 && p <= totalActivePages) setActivePage(p);
                }}
              />
            </div>
          )}

          {/* Past Discounts */}
          {expiredGroups.length > 0 && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setShowPast(!showPast)}
                className="w-full flex items-center gap-3 cursor-pointer"
              >
                <div className="h-px flex-1 bg-gradient-to-r from-red-200 to-transparent" />
                <span className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-red-600 bg-red-50 dark:bg-red-950/30 px-3 py-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                  <Trash2 className="h-3 w-3" />
                  Past Discounts ({expiredGroups.length} batches)
                  <ChevronDown
                    className={cn(
                      "h-3 w-3 transition-transform",
                      showPast && "rotate-180",
                    )}
                  />
                </span>
                <div className="h-px flex-1 bg-gradient-to-l from-red-200 to-transparent" />
              </button>

              {showPast && (
                <>
                  {currentExpiredEntries.map(([range]) => {
                    const allInGroup = allProductsByGroup[range] ?? [];

                    return (
                      <Card
                        key={range}
                        className="overflow-hidden transition-all rounded-2xl border-dashed opacity-60 grayscale-[0.5]"
                      >
                        <CardHeader className="bg-muted/30 py-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <CardTitle className="text-base flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-muted-foreground inline-block" />
                                {range}
                                <span className="text-sm font-normal text-muted-foreground">
                                  ({allInGroup.length} products)
                                </span>
                                <Badge variant="destructive" className="ml-2">
                                  Expired
                                </Badge>
                              </CardTitle>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => {
                                setSelectedProducts(
                                  allInGroup.map((p) => p.prod_code),
                                );
                                setBulkDeleteMode(true);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-3 w-3 mr-2" />
                              Clear Expired
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="p-0">
                          <GroupTable
                            allProducts={allInGroup}
                            selectedProducts={selectedProducts}
                            onSelectProduct={handleSelectProduct}
                            showActions={false}
                            isExpired
                          />
                        </CardContent>
                      </Card>
                    );
                  })}

                  <SectionPager
                    currentPage={expiredPage}
                    totalPages={totalExpiredPages}
                    totalGroups={expiredGroups.length}
                    loading={loading}
                    onPageChange={(p) => {
                      if (p >= 1 && p <= totalExpiredPages) setExpiredPage(p);
                    }}
                  />
                </>
              )}
            </div>
          )}
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
