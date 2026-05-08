"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  GripVertical,
  Save,
  Loader2,
  Package,
  RefreshCw,
  Settings2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import Image from "next/image";
import { cn } from "@/utils/cn";
import { nodeApi } from "@/utils/api-node";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BasicProductSearch } from "@/components/shared/basic-product-search";

// --- Types ---

interface Product {
  id: number;
  prod_code: string;
  prod_name: string;
  barcode?: string;
  selling_price: number;
  image_url?: string;
  prod_image?: string;
  prod_image_url?: string;
}

interface SectionItem {
  id: string;
  productId: number;
  productCode: string;
  product: Product;
  position: number;
}

const sectionConfigs: Record<string, { title: string; description: string }> = {
  "new-arrival": {
    title: "New Arrivals",
    description: "Manage books that recently arrived in the store.",
  },
  "new-release": {
    title: "New Releases",
    description: "Manage books that are newly released.",
  },
  // "special-offer": {
  //   title: "Special Offers",
  //   description: "Manage books with special discounts or deals.",
  // },
  "top-kids": {
    title: "Top Kids Books",
    description: "Manage the most popular books for children.",
  },
  "top-selling": {
    title: "Top Selling",
    description: "Manage the best-selling books across the store.",
  },
};

export default function SectionManagementPage() {
  const router = useRouter();
  const { type } = useParams();
  const { toast } = useToast();
  const hasFetched = useRef(false);
  const config =
    sectionConfigs[type as string] || sectionConfigs["new-arrival"];

  // --- State ---
  const [items, setItems] = useState<SectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  // --- Drag and Drop State ---
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // --- Fetch Data ---
  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const response = await nodeApi
        .get(`/sections/${type}`)
        .catch(() => ({ data: { data: [] } }));
      const data = response.data?.data || [];

      setItems(data.sort((a: any, b: any) => a.position - b.position));
      setHasChanges(false);
    } catch (error) {
      console.error("Failed to fetch section items", error);
      toast({
        title: "Error",
        description: "Failed to load section products.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [type, toast]);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    fetchItems();
  }, [fetchItems]);

  // --- Handlers ---
  const handleAddProduct = (product: any) => {
    if (!product) return;

    // Check if already exists
    if (items.some((item) => item.productId === product.id)) {
      toast({
        title: "Already added",
        description: "This product is already in this section.",
        type: "warning",
      });
      return;
    }

    const newItem: SectionItem = {
      id: `new-${Date.now()}`,
      productId: product.id,
      productCode: product.prod_code,
      product: {
        id: product.id,
        prod_code: product.prod_code,
        prod_name: product.prod_name,
        selling_price: product.selling_price,
        image_url:
          product.prod_image_url || product.image_url || product.prod_image,
      },
      position: items.length + 1,
    };

    setItems([...items, newItem]);
    setHasChanges(true);
    setSearchValue(""); // Reset search
  };

  const handleRemoveItem = (id: string) => {
    const updated = items
      .filter((item) => item.id !== id)
      .map((item, idx) => ({ ...item, position: idx + 1 }));
    setItems(updated);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Real API call: nodeApi.put(`/sections/${type}`, { items: items.map(i => ({ productId: i.productId, position: i.position })) })
      await nodeApi.put(`/sections/${type}`, {
        items: items.map((item) => ({
          productId: item.productId,
          productCode: item.productCode,
          position: item.position,
        })),
      });

      toast({
        title: "Success",
        description: `${config.title} updated successfully.`,
        type: "success",
      });
      setHasChanges(false);
    } catch (error: any) {
      toast({
        title: "Save failed",
        description: error.response?.data?.message || "Failed to save changes.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  // --- Drag and Drop Handlers ---
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newItems = [...items];
    const draggedItem = newItems[draggedIndex];
    newItems.splice(draggedIndex, 1);
    newItems.splice(index, 0, draggedItem);

    // Update positions
    const reordered = newItems.map((item, idx) => ({
      ...item,
      position: idx + 1,
    }));
    setItems(reordered);
    setDraggedIndex(index);
    setHasChanges(true);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                {config.title}
              </h1>
              <Badge variant="outline" className="ml-2 font-mono">
                {items.length} Books
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              {config.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={fetchItems}
            disabled={loading || saving}
            className="gap-2"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="gap-2 min-w-[120px]"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Top: Add Products */}
        <div className="w-full">
          <Card className="border-none shadow-md bg-gradient-to-br from-white to-neutral-50/50 dark:from-neutral-900 dark:to-neutral-950">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" />
                Add Products to {config.title}
              </CardTitle>
              <CardDescription>
                Search for books to include in this featured section.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                <div className="md:col-span-2">
                  <BasicProductSearch
                    value={searchValue}
                    onValueChange={(p) => {
                      if (p) handleAddProduct(p);
                    }}
                  />
                </div>

                <div className="hidden md:block pl-6 border-l border-dashed border-neutral-200 dark:border-neutral-800">
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-2 uppercase tracking-wider font-bold">
                    <Settings2 className="w-3 h-3" />
                    <span>Quick Guide</span>
                  </div>
                  <ul className="space-y-1.5">
                    <li className="text-[11px] flex items-center gap-2 text-muted-foreground">
                      <div className="w-1 h-1 rounded-full bg-primary" />
                      Drag cards below to reorder
                    </li>
                    <li className="text-[11px] flex items-center gap-2 text-muted-foreground">
                      <div className="w-1 h-1 rounded-full bg-primary" />
                      Don&apos;t forget to Save Changes
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom: Items List */}
        <div className="w-full">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p>Loading products...</p>
            </div>
          ) : items.length === 0 ? (
            <Card className="border-dashed h-[400px] flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
                <Package className="w-8 h-8 text-neutral-300" />
              </div>
              <h3 className="text-lg font-semibold">No products added yet</h3>
              <p className="text-muted-foreground max-w-sm mt-2">
                Use the search box above to find and add books to the{" "}
                {config.title} section.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8 gap-3">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      "group relative bg-white dark:bg-neutral-900 border rounded-2xl p-3 transition-all hover:shadow-lg hover:border-primary/20",
                      draggedIndex === index &&
                        "opacity-50 border-primary scale-[1.02] shadow-xl",
                    )}
                  >
                    {/* Header: Position & Drag Handle */}
                    <div className="flex items-center justify-between mb-2">
                      <Badge
                        variant="secondary"
                        className="text-[10px] h-5 px-1.5 font-mono rounded-md"
                      >
                        #{item.position}
                      </Badge>
                      <div className="cursor-grab active:cursor-grabbing p-1 text-neutral-300 group-hover:text-neutral-500 transition-colors">
                        <GripVertical className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Product Image Wrapper */}
                    <div className="aspect-[3/4] relative rounded-xl bg-neutral-100 dark:bg-neutral-800 overflow-hidden mb-3 flex items-center justify-center">
                      {item.product.image_url ||
                      item.product.prod_image_url ||
                      item.product.prod_image ? (
                        <Image
                          src={
                            item.product.image_url ||
                            item.product.prod_image_url ||
                            item.product.prod_image ||
                            ""
                          }
                          alt={item.product.prod_name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <Package className="w-10 h-10 text-neutral-300" />
                      )}

                      {/* Delete Overlay */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-[-4px] group-hover:translate-y-0">
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleRemoveItem(item.id)}
                          className="h-8 w-8 rounded-full shadow-lg border-2 border-white dark:border-neutral-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Product Metadata */}
                    <div className="space-y-1 px-1">
                      <h4 className="font-bold text-[13px] line-clamp-2 leading-tight min-h-[2.1rem] group-hover:text-primary transition-colors">
                        {item.product.prod_name}
                      </h4>
                      <div className="flex flex-col pt-1">
                        <span className="text-[10px] font-mono text-muted-foreground truncate uppercase tracking-tighter">
                          {item.product.prod_code}
                        </span>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm font-black text-primary">
                            Rs. {item.product.selling_price.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer instruction */}
              <div className="pt-4 flex justify-center">
                <div className="px-4 py-2 rounded-full bg-neutral-100 dark:bg-neutral-800 border flex items-center gap-2 shadow-sm">
                  <GripVertical className="w-3.5 h-3.5 text-neutral-400" />
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                    Drag cards to reorder
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
