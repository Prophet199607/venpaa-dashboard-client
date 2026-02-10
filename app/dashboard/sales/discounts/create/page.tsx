"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/utils/api";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Pencil,
  Check,
  X,
} from "lucide-react";
import Link from "next/link";
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

interface FilterOption {
  id: number;
  name: string;
  code: string;
}

export default function CreateDiscountPage() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const prodCode = searchParams.get("prod_code");
  const isEditing = !!prodCode;

  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  // Filter states
  const [categories, setCategories] = useState<FilterOption[]>([]);
  const [departments, setDepartments] = useState<FilterOption[]>([]);
  const [subCategories, setSubCategories] = useState<FilterOption[]>([]);

  const [selectedCat, setSelectedCat] = useState("all");
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedSubCat, setSelectedSubCat] = useState("all");

  // Discount input states
  const [discountAmount, setDiscountAmount] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");

  // Added products for saving
  const [addedProducts, setAddedProducts] = useState<Product[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    last_page: 1,
    per_page: 10,
  });

  // Edit mode for inline editing in the review table
  const [editingProdCode, setEditingProdCode] = useState<string | null>(null);
  const [editDiscountAmount, setEditDiscountAmount] = useState("");
  const [editDiscountPercent, setEditDiscountPercent] = useState("");

  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  // Fetch filter options
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [deptRes, catRes, subCatRes] = await Promise.all([
          api.get("/departments"),
          api.get("/categories"),
          api.get("/sub-categories"),
        ]);

        if (deptRes.data.success) {
          setDepartments([
            { id: 0, name: "All Departments", code: "all" },
            ...deptRes.data.data.map((d: any) => ({
              id: d.id,
              name: d.dep_name,
              code: d.dep_code,
            })),
          ]);
        }
        if (catRes.data.success) {
          setCategories([
            { id: 0, name: "All Categories", code: "all" },
            ...catRes.data.data.map((c: any) => ({
              id: c.id,
              name: c.cat_name,
              code: c.cat_code,
            })),
          ]);
        }
        if (subCatRes.data.success) {
          setSubCategories([
            { id: 0, name: "All Sub Categories", code: "all" },
            ...subCatRes.data.data.map((s: any) => ({
              id: s.id,
              name: s.scat_name,
              code: s.scat_code,
            })),
          ]);
        }
      } catch (error) {
        console.error("Failed to fetch filter options", error);
      }
    };
    fetchOptions();
  }, []);

  // Fetch product data when editing
  useEffect(() => {
    if (isEditing && prodCode) {
      const fetchProductData = async () => {
        setLoading(true);
        try {
          const res = await api.get("/products/discounts/list");
          if (res.data.success) {
            const product = res.data.data.find(
              (p: Product) => p.prod_code === prodCode,
            );
            if (product) {
              setDiscountAmount(product.discount.toString());
              setDiscountPercent(product.dis_per.toString());
              setAddedProducts([product]);
            }
          }
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to fetch product data",
            type: "error",
          });
        } finally {
          setLoading(false);
        }
      };
      fetchProductData();
    }
  }, [isEditing, prodCode, toast]);

  // Fetch products based on filter
  const fetchProducts = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const response = await api.post(
          `/products/discounts/filter?page=${page}`,
          {
            department: selectedDept,
            category: selectedCat,
            sub_category: selectedSubCat,
          },
        );

        if (response.data.success) {
          setProducts(response.data.data);
          setPagination(response.data.pagination);
          setCurrentPage(response.data.pagination.current_page);
          setSelectedProducts([]);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch products",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    },
    [selectedDept, selectedCat, selectedSubCat, toast],
  );

  useEffect(() => {
    fetchProducts(1);
  }, [fetchProducts]);

  // Handle checkboxes
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(products.map((p) => p.prod_code));
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

  // Add discount to selected products
  const handleAddDiscount = () => {
    if (selectedProducts.length === 0) {
      toast({
        title: "Warning",
        description: "Please select at least one product",
        type: "warning",
      });
      return;
    }

    const discAmt = parseFloat(discountAmount) || 0;
    const discPer = parseFloat(discountPercent) || 0;

    // Ensure only one discount type is set
    const finalDiscAmt = discountAmount ? discAmt : 0;
    const finalDiscPer = discountPercent ? discPer : 0;

    if (discAmt === 0 && discPer === 0) {
      toast({
        title: "Warning",
        description: "Please enter a discount amount or percentage",
        type: "warning",
      });
      return;
    }

    const newAddedProducts = products
      .filter((p) => selectedProducts.includes(p.prod_code))
      .map((p) => ({
        ...p,
        discount: finalDiscAmt,
        dis_per: finalDiscPer,
      }));

    // Merge with existing added products, avoiding duplicates based on prod_code
    const merged = [...addedProducts];
    newAddedProducts.forEach((newItem) => {
      const index = merged.findIndex((p) => p.prod_code === newItem.prod_code);
      if (index >= 0) {
        merged[index] = newItem;
      } else {
        merged.push(newItem);
      }
    });

    setAddedProducts(merged);
    setSelectedProducts([]);
    setDiscountAmount("");
    setDiscountPercent("");
  };

  const handleRemoveFromAdded = (prodCode: string) => {
    if (isEditing) {
      // In edit mode, show confirmation and delete from database
      setProductToDelete(prodCode);
      setDeleteDialogOpen(true);
    } else {
      // In create mode, just remove from local state
      setAddedProducts(addedProducts.filter((p) => p.prod_code !== prodCode));
    }
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;

    setLoading(true);
    try {
      await api.post("/products/discounts/update", {
        prod_codes: [productToDelete],
        discount: 0,
        dis_per: 0,
      });
      toast({
        title: "Success",
        description: "Discount removed",
        type: "success",
      });
      router.push("/dashboard/sales/discounts");
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
    }
  };

  // Handle inline editing in the review table
  const handleStartEdit = (product: Product) => {
    setEditingProdCode(product.prod_code);
    setEditDiscountAmount(product.discount.toString());
    setEditDiscountPercent(product.dis_per.toString());
  };

  const handleCancelEdit = () => {
    setEditingProdCode(null);
    setEditDiscountAmount("");
    setEditDiscountPercent("");
  };

  const handleSaveEdit = () => {
    if (!editingProdCode) return;

    const discAmt = parseFloat(editDiscountAmount) || 0;
    const discPer = parseFloat(editDiscountPercent) || 0;

    // Ensure only one discount type is set
    const finalDiscAmt = editDiscountAmount ? discAmt : 0;
    const finalDiscPer = editDiscountPercent ? discPer : 0;

    if (finalDiscAmt === 0 && finalDiscPer === 0) {
      toast({
        title: "Warning",
        description: "Please enter a discount amount or percentage",
        type: "warning",
      });
      return;
    }

    setAddedProducts(
      addedProducts.map((p) =>
        p.prod_code === editingProdCode
          ? { ...p, discount: finalDiscAmt, dis_per: finalDiscPer }
          : p,
      ),
    );

    setEditingProdCode(null);
    setEditDiscountAmount("");
    setEditDiscountPercent("");
  };

  // Save changes
  const handleSave = async () => {
    if (addedProducts.length === 0) return;

    setLoading(true);
    try {
      const groups: { [key: string]: string[] } = {};

      addedProducts.forEach((p) => {
        const key = `${p.discount}-${p.dis_per}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(p.prod_code);
      });

      const promises = Object.keys(groups).map((key) => {
        const [discount, dis_per] = key.split("-");
        return api.post("/products/discounts/update", {
          prod_codes: groups[key],
          discount: parseFloat(discount),
          dis_per: parseFloat(dis_per),
        });
      });

      await Promise.all(promises);

      toast({
        title: "Success",
        description: "Discounts updated successfully",
        type: "success",
      });
      setAddedProducts([]);
      fetchProducts();
      router.push("/dashboard/sales/discounts");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update discounts",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/sales/discounts">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold tracking-tight">
            {isEditing ? "Edit Discount" : "Create Discounts"}
          </h1>
        </div>
      </div>

      {/* Filter Section */}
      {!isEditing && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Filter Products</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select value={selectedDept} onValueChange={setSelectedDept}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={d.code}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={selectedCat} onValueChange={setSelectedCat}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.code}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sub Category</Label>
                  <Select
                    value={selectedSubCat}
                    onValueChange={setSelectedSubCat}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Sub Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {subCategories.map((s) => (
                        <SelectItem key={s.id} value={s.code}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Products Table to Select */}
          <Card>
            <CardContent className="p-0">
              <div className="max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader className="bg-muted/50 sticky top-0 z-10">
                    <TableRow>
                      <TableHead className="w-[50px] text-center">
                        <Checkbox
                          checked={
                            products.length > 0 &&
                            selectedProducts.length === products.length
                          }
                          onCheckedChange={(checked) =>
                            handleSelectAll(checked as boolean)
                          }
                        />
                      </TableHead>
                      <TableHead className="w-[80px]">Code</TableHead>
                      <TableHead className="w-[500px]">Name</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">
                        Current Disc.
                      </TableHead>
                      <TableHead className="text-right">
                        Current Disc %
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : products.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          No products found
                        </TableCell>
                      </TableRow>
                    ) : (
                      products.map((product) => (
                        <TableRow key={product.prod_code}>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={selectedProducts.includes(
                                product.prod_code,
                              )}
                              onCheckedChange={(checked) =>
                                handleSelectProduct(
                                  product.prod_code,
                                  checked as boolean,
                                )
                              }
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {product.prod_code}
                          </TableCell>
                          <TableCell>{product.prod_name}</TableCell>
                          <TableCell className="text-right">
                            {parseFloat(
                              product.selling_price.toString(),
                            ).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            {parseFloat(product.discount.toString()).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            {parseFloat(product.dis_per.toString()).toFixed(2)}%
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              {pagination.last_page > 1 && (
                <div className="flex items-center justify-between px-4 py-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {products.length} of {pagination.total} products
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchProducts(currentPage - 1)}
                      disabled={currentPage === 1 || loading}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                    </Button>
                    <div className="text-sm font-medium">
                      Page {currentPage} of {pagination.last_page}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchProducts(currentPage + 1)}
                      disabled={currentPage === pagination.last_page || loading}
                    >
                      Next <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Discount Input Section */}
          <div className="flex flex-col md:flex-row gap-4 items-end bg-muted/30 p-4 rounded-lg border">
            <div className="space-y-2 flex-1">
              <Label>Discount Amount</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={discountAmount}
                onChange={(e) => {
                  setDiscountAmount(e.target.value);
                  if (e.target.value) setDiscountPercent("");
                }}
              />
            </div>
            <div className="space-y-2 flex-1">
              <Label>Discount Percentage</Label>
              <Input
                type="number"
                placeholder="0%"
                value={discountPercent}
                onChange={(e) => {
                  setDiscountPercent(e.target.value);
                  if (e.target.value) setDiscountAmount("");
                }}
              />
            </div>
            <Button onClick={handleAddDiscount} className="gap-2">
              <Plus className="h-4 w-4" /> Add Discount
            </Button>
          </div>
        </>
      )}

      {/* Review Added Discounts Section */}
      {addedProducts.length > 0 && (
        <Card className="border-green-200 bg-green-50/20">
          <CardHeader>
            <CardTitle>Products to Update</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Discount</TableHead>
                  <TableHead className="text-right">Disc %</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {addedProducts.map((p) => {
                  const isEditingRow =
                    isEditing && editingProdCode === p.prod_code;
                  return (
                    <TableRow key={p.prod_code}>
                      <TableCell>{p.prod_code}</TableCell>
                      <TableCell>{p.prod_name}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {isEditingRow ? (
                          <Input
                            type="number"
                            value={editDiscountAmount}
                            onChange={(e) => {
                              setEditDiscountAmount(e.target.value);
                              if (e.target.value) setEditDiscountPercent("");
                            }}
                            className="w-24 ml-auto"
                            onFocus={(e) => e.target.select()}
                          />
                        ) : (
                          Number(p.discount || 0).toFixed(2)
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {isEditingRow ? (
                          <Input
                            type="number"
                            value={editDiscountPercent}
                            onChange={(e) => {
                              setEditDiscountPercent(e.target.value);
                              if (e.target.value) setEditDiscountAmount("");
                            }}
                            className="w-24 ml-auto"
                            onFocus={(e) => e.target.select()}
                          />
                        ) : (
                          `${Number(p.dis_per || 0).toFixed(2)}%`
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isEditing &&
                            (isEditingRow ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={handleSaveEdit}
                                >
                                  <Check className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={handleCancelEdit}
                                >
                                  <X className="h-4 w-4 text-gray-600" />
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleStartEdit(p)}
                              >
                                <Pencil className="h-4 w-4 text-blue-600" />
                              </Button>
                            ))}
                          {!isEditingRow && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveFromAdded(p.prod_code)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <div className="mt-4 flex justify-end">
              <Button onClick={handleSave} disabled={loading} size="lg">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the discount from this product and
              redirect you to the discounts list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
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
