"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Plus,
  Trash2,
  GripVertical,
  Save,
  Loader2,
  RefreshCw,
  BookMarked,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { cn } from "@/utils/cn";
import { nodeApi } from "@/utils/api-node";

import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PublisherSearch } from "@/components/shared/publisher-search";

interface FeaturedItem {
  id?: number;
  code: string;
  name: string;
  position: number;
  pub_image?: string;
}

export default function FeaturedPublishersPage() {
  const { toast } = useToast();
  const hasFetched = useRef(false);

  const [items, setItems] = useState<FeaturedItem[]>([]);
  const [originalItems, setOriginalItems] = useState<FeaturedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const response = await nodeApi
        .get("/feature-authors-publishers/list", {
          params: { type: "publisher" },
        })
        .catch(() => ({ data: { data: [] } }));

      const data = response.data?.data || [];

      let mapped: FeaturedItem[] = [];

      if (Array.isArray(data)) {
        if (data.length > 0 && typeof data[0] === "object") {
          mapped = data.map((item: any, i: number) => ({
            id: item.id,
            code: item.code || item.publisher?.pub_code,
            name:
              item.publisher?.pub_name || item.code || item.publisher?.pub_code,
            position: i + 1,
            auth_image: item.publisher?.pub_image,
          }));
        } else {
          mapped = data
            .filter((d: any) => typeof d === "string")
            .map((code: string, i: number) => ({
              code,
              name: code,
              position: i + 1,
            }));
        }
      }

      setItems(mapped);
      setOriginalItems(JSON.parse(JSON.stringify(mapped)));
      setHasChanges(false);
    } catch (error) {
      console.error("Failed to fetch featured publishers", error);
      toast({
        title: "Error",
        description: "Failed to load featured publishers.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchItems();
  }, [fetchItems]);

  const handleAddPublisher = useCallback(
    async (pubCode: string) => {
      if (!pubCode) return;

      if (items.some((item) => item.code === pubCode)) {
        toast({
          title: "Already added",
          description: "This publisher is already featured.",
          type: "warning",
        });
        return;
      }

      const newItem: FeaturedItem = {
        code: pubCode,
        name: pubCode,
        position: items.length + 1,
      };

      setItems((prev) => [...prev, newItem]);
      setHasChanges(true);
    },
    [items, toast],
  );

  const handleRemoveItem = (code: string) => {
    const updated = items
      .filter((item) => item.code !== code)
      .map((item, idx) => ({ ...item, position: idx + 1 }));
    setItems(updated);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const toCreate = items.filter((i) => !i.id);
      const toDelete = originalItems.filter(
        (orig) => !items.some((curr) => curr.code === orig.code),
      );
      const toPosition = items
        .filter((i) => i.id)
        .map((i) => ({
          id: i.id!,
          position: i.position,
        }));

      for (const item of toCreate) {
        await nodeApi.post("/feature-authors-publishers/create", {
          type: "publisher",
          code: item.code,
        });
      }

      if (toPosition.length > 0) {
        await Promise.all(
          toPosition.map((item) =>
            nodeApi.put(`/feature-authors-publishers/update/${item.id}`, {
              position: item.position,
            }),
          ),
        );
      }

      if (toDelete.length > 0) {
        const toDeleteWithIds = toDelete.filter((item) => item.id);
        if (toDeleteWithIds.length > 0) {
          await Promise.all(
            toDeleteWithIds.map((item) =>
              nodeApi.delete("/feature-authors-publishers/delete", {
                data: { ids: item.id },
              }),
            ),
          );
        }
      }

      toast({
        title: "Success",
        description: "Featured publishers updated successfully.",
        type: "success",
      });
      setHasChanges(false);
      hasFetched.current = false;
      await fetchItems();
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                Featured Publishers
              </h1>
              <Badge variant="outline" className="ml-2 font-mono">
                {items.length} Publishers
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              Manage featured publishers displayed on the website.
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
        <div className="w-full">
          <Card className="border-none shadow-md bg-gradient-to-br from-white to-neutral-50/50 dark:from-neutral-900 dark:to-neutral-950">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" />
                Add Publishers
              </CardTitle>
              <CardDescription>
                Search for publishers to feature on the website.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                <div className="md:col-span-2">
                  <PublisherSearch
                    onValueChange={(value) => handleAddPublisher(value)}
                  />
                </div>

                <div className="hidden md:block pl-6 border-l border-dashed border-neutral-200 dark:border-neutral-800">
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-2 uppercase tracking-wider font-bold">
                    <BookMarked className="w-3 h-3" />
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

        <div className="w-full">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin" />
              <p>Loading featured publishers...</p>
            </div>
          ) : items.length === 0 ? (
            <Card className="border-dashed h-[400px] flex flex-col items-center justify-center text-center p-8">
              <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
                <BookMarked className="w-5 h-5 text-neutral-300" />
              </div>
              <h3 className="text-base font-semibold">
                No publishers featured yet
              </h3>
              <p className="text-muted-foreground text-xs max-w-sm mt-2">
                Use the search box above to find and add publishers to the
                featured section.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 gap-3">
                {items.map((item, index) => (
                  <div
                    key={item.code}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      "group relative bg-white dark:bg-neutral-900 border rounded-2xl p-4 transition-all hover:shadow-lg hover:border-primary/20",
                      draggedIndex === index &&
                        "opacity-50 border-primary scale-[1.02] shadow-xl",
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
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

                    <div className="w-14 h-14 rounded-full overflow-hidden mb-3 mx-auto relative">
                      <Image
                        src={item.pub_image || "/images/Placeholder.jpg"}
                        alt={item.name}
                        width={56}
                        height={56}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "/images/Placeholder.jpg";
                        }}
                      />
                    </div>

                    <div className="text-center space-y-1">
                      <h4 className="font-bold text-sm line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                        {item.name}
                      </h4>
                      <span className="text-[10px] font-mono text-muted-foreground truncate uppercase tracking-tighter block">
                        {item.code}
                      </span>
                    </div>

                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all">
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleRemoveItem(item.code)}
                        className="h-8 w-8 rounded-full shadow-lg border-2 border-white dark:border-neutral-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

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
