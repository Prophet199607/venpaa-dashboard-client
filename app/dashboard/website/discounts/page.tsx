"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Percent,
  Plus,
  Trash2,
  Pencil,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { nodeApi } from "@/utils/api-node";
import Loader from "@/components/ui/loader";
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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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
  status?: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Date-range groups displayed per page in the section-level pagination UI. */
const GROUPS_PER_PAGE = 10;

/** Rows shown per page inside each group's table. */
const ROWS_PER_GROUP_PAGE = 15;

/** How many records to request per API call — large enough to get everything in one shot. */
const API_PAGE_SIZE = 1000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Maps a raw API record to our Product shape. */
function mapProduct(d: Record<string, any>): Product {
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
    status: d.status,
  };
}

/** Returns the date-range key for a product. */
function getRangeKey(product: Product): string {
  return product.start_date && product.end_date
    ? `${product.start_date} - ${product.end_date}`
    : "No Date Range";
}

/** Format a number to 2 decimal places. */
function fmt(value: number): string {
  return parseFloat(value.toString()).toFixed(2);
}

// ---------------------------------------------------------------------------
// Sub-component: paginated table inside a group card
// ---------------------------------------------------------------------------

interface GroupTableProps {
  /** All products belonging to this group (across ALL pages). */
  allProducts: Product[];
  selectedProducts: number[];
  onSelectProduct: (id: number, checked: boolean) => void;
  /** Whether to show the checkbox + action column (active groups only). */
  showActions: boolean;
  onDeleteProduct?: (id: number) => void;
  /** Use compact row heights. */
  compact?: boolean;
}

function GroupTable({
  allProducts,
  selectedProducts,
  onSelectProduct,
  showActions,
  onDeleteProduct,
  compact = false,
}: GroupTableProps) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(
    1,
    Math.ceil(allProducts.length / ROWS_PER_GROUP_PAGE),
  );

  // Keep page in bounds when products change
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
            <TableHead className="text-right py-1">Disc&nbsp;%</TableHead>
            <TableHead className="text-right py-1">Discounted Price</TableHead>
            {showActions && (
              <>
                <TableHead className="text-right py-1">Start Date</TableHead>
                <TableHead className="text-right py-1">End Date</TableHead>
                <TableHead className="text-right w-[80px] py-1">
                  Action
                </TableHead>
              </>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageRows.map((p) => (
            <TableRow key={p.prod_code} className="h-7">
              {showActions && (
                <TableCell className="text-center py-0.5">
                  <Checkbox
                    checked={selectedProducts.includes(Number(p.id))}
                    onCheckedChange={(checked) =>
                      onSelectProduct(p.id, checked as boolean)
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
              <TableCell className="text-right font-semibold text-green-600 py-0.5 text-xs">
                {p.discount > 0 ? fmt(p.discount) : "-"}
              </TableCell>
              <TableCell className="text-right font-semibold text-green-600 py-0.5 text-xs">
                {p.dis_per > 0 ? `${fmt(p.dis_per)}%` : "-"}
              </TableCell>
              <TableCell className="text-right py-0.5 text-xs">
                {p.discounted_price ? fmt(p.discounted_price) : "-"}
              </TableCell>
              {showActions && (
                <>
                  <TableCell className="text-right py-0.5 text-xs">
                    {p.start_date
                      ? new Date(p.start_date).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right py-0.5 text-xs">
                    {p.end_date
                      ? new Date(p.end_date).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right py-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => onDeleteProduct?.(p.id)}
                    >
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </Button>
                  </TableCell>
                </>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Row-level pagination inside the group — matching create page style */}
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

// ---------------------------------------------------------------------------
// Sub-component: section-level pagination controls
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function WebsiteDiscountListPage() {
  const { toast } = useToast();
  const hasFetched = useRef(false);

  const [loading, setLoading] = useState(false);
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const { hasPermission, loading: permissionsLoading, user } = usePermissions();
  const [productToDelete, setProductToDelete] = useState<number | null>(null);

  // ALL products fetched — the single source of truth.
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  // Section-level pagination (groups per page)
  const [activePage, setActivePage] = useState(1);
  const [expiredPage, setExpiredPage] = useState(1);
  const [showPast, setShowPast] = useState(false);

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const firstRes = await nodeApi.get(
        `/discounts/list?page=1&per_page=${API_PAGE_SIZE}`,
      );
      const firstData: Record<string, any>[] = firstRes.data?.data ?? [];
      const paginationMeta = firstRes.data?.pagination;
      const lastPage: number = paginationMeta?.last_page ?? 1;

      let allRaw: Record<string, any>[] = [...firstData];

      if (lastPage > 1) {
        const pageNums = Array.from({ length: lastPage - 1 }, (_, i) => i + 2);
        const responses = await Promise.all(
          pageNums.map((p) =>
            nodeApi.get(`/discounts/list?page=${p}&per_page=${API_PAGE_SIZE}`),
          ),
        );
        responses.forEach((res) => {
          allRaw = [...allRaw, ...(res.data?.data ?? [])];
        });
      }

      setAllProducts(allRaw.map(mapProduct));
      setActivePage(1);
      setExpiredPage(1);
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

  const activeProducts = allProducts.filter((p) => p.status === 1);
  const expiredProducts = allProducts.filter((p) => p.status === 0);

  /** All products grouped by date-range key (used for group-level select/delete). */
  const allProductsByGroup = allProducts.reduce<Record<string, Product[]>>(
    (acc, product) => {
      const range = getRangeKey(product);
      if (!acc[range]) acc[range] = [];
      acc[range].push(product);
      return acc;
    },
    {},
  );

  const activeGroups = activeProducts.reduce<Record<string, Product[]>>(
    (acc, p) => {
      const range = getRangeKey(p);
      if (!acc[range]) acc[range] = [];
      acc[range].push(p);
      return acc;
    },
    {},
  );

  const expiredGroups = expiredProducts.reduce<Record<string, Product[]>>(
    (acc, p) => {
      const range = getRangeKey(p);
      if (!acc[range]) acc[range] = [];
      acc[range].push(p);
      return acc;
    },
    {},
  );

  /** Active group entries sorted by start_date ascending. */
  const activeGroupEntries = Object.entries(activeGroups).sort(([a], [b]) => {
    const aStart = new Date(a.split(" - ")[0]?.trim()).getTime();
    const bStart = new Date(b.split(" - ")[0]?.trim()).getTime();
    return (isNaN(aStart) ? 0 : aStart) - (isNaN(bStart) ? 0 : bStart);
  });

  /** Expired group entries sorted by end_date descending (most recent first). */
  const expiredGroupEntries = Object.entries(expiredGroups).sort(([a], [b]) => {
    const aEnd = new Date(a.split(" - ")[1]?.trim()).getTime();
    const bEnd = new Date(b.split(" - ")[1]?.trim()).getTime();
    return (isNaN(bEnd) ? 0 : bEnd) - (isNaN(aEnd) ? 0 : aEnd);
  });

  const totalActivePages = Math.max(
    1,
    Math.ceil(activeGroupEntries.length / GROUPS_PER_PAGE),
  );
  const totalExpiredPages = Math.max(
    1,
    Math.ceil(expiredGroupEntries.length / GROUPS_PER_PAGE),
  );

  const currentActiveEntries = activeGroupEntries.slice(
    (activePage - 1) * GROUPS_PER_PAGE,
    activePage * GROUPS_PER_PAGE,
  );

  const currentExpiredEntries = expiredGroupEntries.slice(
    (expiredPage - 1) * GROUPS_PER_PAGE,
    expiredPage * GROUPS_PER_PAGE,
  );

  // Keep pages in bounds when data changes
  useEffect(() => {
    if (activePage > totalActivePages) setActivePage(totalActivePages);
  }, [totalActivePages, activePage]);

  useEffect(() => {
    if (expiredPage > totalExpiredPages) setExpiredPage(totalExpiredPages);
  }, [totalExpiredPages, expiredPage]);

  // ---------------------------------------------------------------------------
  // Selection handlers
  // ---------------------------------------------------------------------------

  const handleSelectAllInGroup = (range: string, checked: boolean) => {
    const groupIds = (allProductsByGroup[range] ?? [])
      .map((p) => Number(p.id))
      .filter((id) => !isNaN(id));

    if (checked) {
      setSelectedProducts((prev) =>
        Array.from(new Set([...prev, ...groupIds])),
      );
    } else {
      setSelectedProducts((prev) =>
        prev.filter((id) => !groupIds.includes(id)),
      );
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
      await nodeApi.delete("/discounts/delete", { data: { ids: idsToDelete, changed_by: user?.name || "" } });
      toast({
        title: "Success",
        description: bulkDeleteMode
          ? `${idsToDelete.length} discounts removed`
          : "Discount removed",
        type: "success",
      });
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
              className="gap-2 rounded-full px-4 bg-neutral-900 text-white hover:bg-neutral-800 transition-all dark:bg-neutral-100 dark:text-neutral-900"
            >
              <Plus className="h-4 w-4" />
              Create Discount
            </Button>
          </Link>
        </div>
      </div>

      {/* Loading / empty state */}
      {loading && allProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader />
        </div>
      ) : activeGroupEntries.length === 0 &&
        expiredGroupEntries.length === 0 ? (
        <Card className="border-dashed border-2 flex flex-col items-center justify-center py-24 px-4 text-center rounded-3xl bg-neutral-50/50 dark:bg-neutral-900/10">
          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-neutral-800 shadow-xl flex items-center justify-center mb-4">
            <Percent className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-xl tracking-tight">
            No active discounts found
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs mt-2 mb-4">
            Start by creating your first product discount.
          </p>
          <Link href="/dashboard/website/discounts/create">
            <Button className="gap-2 rounded-full px-4 h-10 shadow-xl shadow-primary/20">
              <Plus className="w-5 h-5" />
              Create First Discount
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* ---------------------------------------------------------------- */}
          {/* Active Discounts section                                          */}
          {/* ---------------------------------------------------------------- */}
          {activeGroupEntries.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-gradient-to-r from-green-200 to-transparent" />
                <span className="text-xs font-semibold tracking-wider uppercase text-green-600 bg-green-50 dark:bg-green-950/30 px-3 py-1 rounded-full">
                  Active Discounts
                </span>
                <div className="h-px flex-1 bg-gradient-to-l from-green-200 to-transparent" />
              </div>

              {currentActiveEntries.map(([range]) => {
                // Use ALL products for this range (not a sliced subset) so
                // the group header count, checkbox state, and Edit Group link
                // always reflect the full group.
                const allInGroup = allProductsByGroup[range] ?? [];
                const isGroupChecked =
                  allInGroup.length > 0 &&
                  allInGroup.every((p) =>
                    selectedProducts.includes(Number(p.id)),
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
                        {/* Edit Group: passes ALL prod_codes in the group */}
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
                      </div>
                    </CardHeader>

                    <CardContent className="p-0">
                      {/* Row-level paginated table — compact rows */}
                      <GroupTable
                        allProducts={allInGroup}
                        selectedProducts={selectedProducts}
                        onSelectProduct={handleSelectProduct}
                        showActions
                        compact
                        onDeleteProduct={(id) => {
                          setProductToDelete(id);
                          setBulkDeleteMode(false);
                          setDeleteDialogOpen(true);
                        }}
                      />
                    </CardContent>
                  </Card>
                );
              })}

              <SectionPager
                currentPage={activePage}
                totalPages={totalActivePages}
                totalGroups={activeGroupEntries.length}
                loading={loading}
                onPageChange={(p) => {
                  if (p >= 1 && p <= totalActivePages) setActivePage(p);
                }}
              />
            </div>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* Past Discounts section — hidden by default                       */}
          {/* ---------------------------------------------------------------- */}
          {expiredGroupEntries.length > 0 && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setShowPast(!showPast)}
                className="w-full flex items-center gap-3 cursor-pointer"
              >
                <div className="h-px flex-1 bg-gradient-to-r from-red-200 to-transparent" />
                <span className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-red-600 bg-red-50 dark:bg-red-950/30 px-3 py-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                  <Trash2 className="h-3 w-3" />
                  Past Discounts ({expiredGroupEntries.length} batches)
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
                                  allInGroup
                                    .map((p) => Number(p.id))
                                    .filter((id) => !isNaN(id)),
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
                          />
                        </CardContent>
                      </Card>
                    );
                  })}

                  <SectionPager
                    currentPage={expiredPage}
                    totalPages={totalExpiredPages}
                    totalGroups={expiredGroupEntries.length}
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

      {/* Delete confirmation dialog */}
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
