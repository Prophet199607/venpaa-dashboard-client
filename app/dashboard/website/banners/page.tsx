"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import { cn } from "@/utils/cn";
import { nodeApi } from "@/utils/api-node";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  GripVertical,
  Plus,
  Trash2,
  Maximize2,
  ChevronUp,
  ChevronDown,
  Save,
  RotateCcw,
  Eye,
  EyeOff,
  Upload,
  Loader2,
  Layout,
  PanelTop,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

type BannerType = "horizontal" | "panoramic";

interface BannerAsset {
  id: number;
  image: string;
  mobile_image: string | null;
  orientation: string;
  placement_key: string | null;
  title: string | null;
  link: string | null;
  is_active: boolean;
  position: number;
}

interface BannerItem {
  id: string;
  assetId?: number;
  image_url: string;
  mobile_image_url: string;
  type: BannerType;
  title: string;
  placement_key: string;
  link: string;
  visible: boolean;
  position: number;
}

type DragState = {
  draggedId: string | null;
  overId: string | null;
};

const S3_BASE_URL = process.env.NEXT_PUBLIC_S3_BASE_URL ?? "";

function assetToItem(asset: BannerAsset): BannerItem {
  const getFullUrl = (url: string | null) => {
    if (!url) return "";
    if (url.startsWith("http") || url.startsWith("data:")) return url;
    return `${S3_BASE_URL}${url}`;
  };

  return {
    id: String(asset.id),
    assetId: asset.id,
    image_url: getFullUrl(asset.image),
    mobile_image_url: getFullUrl(asset.mobile_image),
    type: asset.orientation as BannerType,
    title: asset.title || "",
    placement_key: asset.placement_key || "",
    link: asset.link || "",
    visible: asset.is_active,
    position: asset.position,
  };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function BannersManagementPage() {
  const { toast } = useToast();

  // ── Data State ────────────────────────────────────────────────────────────────
  const [horizontalBanners, setHorizontalBanners] = useState<BannerItem[]>([]);
  const [panoramicBanners, setPanoramicBanners] = useState<BannerItem[]>([]);
  const [activeTab, setActiveTab] = useState<BannerType>("horizontal");

  // ── UI State ──────────────────────────────────────────────────────────────────
  const [fetching, setFetching] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Storage for discarding changes
  const [originalHorizontal, setOriginalHorizontal] = useState<BannerItem[]>(
    [],
  );
  const [originalPanoramic, setOriginalPanoramic] = useState<BannerItem[]>([]);

  // ── New Item State ─────────────────────────────────────────────────────────────
  const [newFile, setNewFile] = useState<File | null>(null);
  const [newMobileFile, setNewMobileFile] = useState<File | null>(null);
  const [newPreview, setNewPreview] = useState("");
  const [newMobilePreview, setNewMobilePreview] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newPlacementKey, setNewPlacementKey] = useState("");
  const [newLink, setNewLink] = useState("");
  const [adding, setAdding] = useState(false);

  // ── Drag State ────────────────────────────────────────────────────────────────
  const [drag, setDrag] = useState<DragState>({
    draggedId: null,
    overId: null,
  });
  const dragCounter = useRef(0);

  // ── Derived ───────────────────────────────────────────────────────────────────
  const currentItems =
    activeTab === "horizontal" ? horizontalBanners : panoramicBanners;
  const setCurrentItems =
    activeTab === "horizontal" ? setHorizontalBanners : setPanoramicBanners;

  const fetchBanners = useCallback(async () => {
    setFetching(true);
    try {
      const res = await nodeApi.get("/banners", {
        validateStatus: (status) =>
          (status >= 200 && status < 300) || status === 404,
      });

      if (res.status === 404) {
        setHorizontalBanners([]);
        setPanoramicBanners([]);
        setOriginalHorizontal([]);
        setOriginalPanoramic([]);
        setHasUnsavedChanges(false);
        return;
      }

      const rawData = res.data?.data ?? [];
      const items = rawData.map(assetToItem);

      const horizontal = items
        .filter((i: any) => i.type === "horizontal")
        .sort((a: BannerItem, b: BannerItem) => a.position - b.position);

      const panoramic = items
        .filter((i: any) => i.type === "panoramic")
        .sort((a: BannerItem, b: BannerItem) => a.position - b.position);

      setHorizontalBanners(horizontal);
      setPanoramicBanners(panoramic);
      setOriginalHorizontal(horizontal);
      setOriginalPanoramic(panoramic);
      setHasUnsavedChanges(false);
    } catch (err: any) {
      if (!err.message?.includes("404")) {
        toast({
          title: "Fetch failed",
          description: "Could not load banners from the server.",
          type: "error",
        });
      }
    } finally {
      setFetching(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  // ── Reset file fields when dialog closes ──────────────────────────────────────
  const resetDialog = () => {
    setNewFile(null);
    setNewMobileFile(null);
    setNewPreview("");
    setNewMobilePreview("");
    setNewTitle("");
    setNewPlacementKey("");
    setNewLink("");
  };

  // ── Handlers ──────────────────────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewFile(file);
      setNewPreview(URL.createObjectURL(file));
    }
  };

  const handleAdd = async () => {
    if (!newFile) {
      toast({
        title: "Image required",
        description: `Please select an image for the ${activeTab} banner.`,
        type: "error",
      });
      return;
    }

    setAdding(true);
    try {
      const base64 = await fileToBase64(newFile);
      const mobileBase64 = newMobileFile
        ? await fileToBase64(newMobileFile)
        : null;

      const body = {
        image: base64,
        mobile_image: mobileBase64,
        orientation: activeTab,
        placement_key:
          newPlacementKey.trim() || `banner_${activeTab}_${Date.now()}`,
        title: newTitle.trim() || `Banner ${Date.now()}`,
        link: newLink,
        position: currentItems.length + 1,
        is_active: true,
      };

      const res = await nodeApi.post("/banners", body);

      const created: BannerAsset = res.data;
      const newItem = assetToItem(created);

      setCurrentItems((prev) => [...prev, newItem]);
      resetDialog();
      setAddDialogOpen(false);

      toast({
        title: "Banner added",
        description: "New banner has been uploaded successfully.",
        type: "success",
      });

      // Refresh to sync
      fetchBanners();
    } catch (err: any) {
      toast({
        title: "Upload failed",
        description:
          err.response?.data?.message ||
          err.message ||
          "Could not upload the banner image.",
        type: "error",
      });
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id: string) => {
    const itemToRemove = currentItems.find((i) => i.id === id);
    if (!itemToRemove) return;

    const performRemove = () => {
      setCurrentItems((prev) =>
        prev
          .filter((i) => i.id !== id)
          .map((item, idx) => ({
            ...item,
            position: idx + 1,
          })),
      );
      setHasUnsavedChanges(true);
    };

    if (itemToRemove.assetId !== undefined) {
      try {
        await nodeApi.delete(`/banners/${itemToRemove.assetId}`);
        performRemove();
        toast({
          title: "Banner deleted",
          description: "The banner has been removed successfully.",
          type: "success",
        });
      } catch (err: any) {
        toast({
          title: "Delete failed",
          description:
            err.response?.data?.message ||
            err.message ||
            "Could not delete the banner.",
          type: "error",
        });
      }
    } else {
      performRemove();
    }
  };

  const handleToggleVisible = (id: string) => {
    setCurrentItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, visible: !item.visible } : item,
      ),
    );
    setHasUnsavedChanges(true);
  };

  const moveItem = (id: string, direction: "up" | "down") => {
    const idx = currentItems.findIndex((i) => i.id === id);
    if (idx === -1) return;
    const newItems = [...currentItems];
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= newItems.length) return;
    [newItems[idx], newItems[swapIdx]] = [newItems[swapIdx], newItems[idx]];
    setCurrentItems(
      newItems.map((item, i) => ({
        ...item,
        position: i + 1,
      })),
    );
    setHasUnsavedChanges(true);
  };

  // ── Drag and Drop ─────────────────────────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDrag({ draggedId: id, overId: null });
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnter = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    dragCounter.current++;
    if (id !== drag.draggedId) {
      setDrag((prev) => ({ ...prev, overId: id }));
    }
  };

  const handleDragLeave = () => {
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDrag((prev) => ({ ...prev, overId: null }));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    dragCounter.current = 0;
    const { draggedId } = drag;
    if (!draggedId || draggedId === targetId) {
      setDrag({ draggedId: null, overId: null });
      return;
    }

    const fromIdx = currentItems.findIndex((i) => i.id === draggedId);
    const toIdx = currentItems.findIndex((i) => i.id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;

    const newItems = [...currentItems];
    const [removed] = newItems.splice(fromIdx, 1);
    newItems.splice(toIdx, 0, removed);

    setCurrentItems(
      newItems.map((item, idx) => ({
        ...item,
        position: idx + 1,
      })),
    );
    setHasUnsavedChanges(true);
    setDrag({ draggedId: null, overId: null });
  };

  const handleDragEnd = () => {
    dragCounter.current = 0;
    setDrag({ draggedId: null, overId: null });
  };

  // ── Save / Reset ──────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      const allItems = [...horizontalBanners, ...panoramicBanners];
      const itemsToUpdate = allItems.filter((i) => i.assetId);

      const updatePromises = itemsToUpdate.map((item) => {
        return nodeApi.put(`/banners/${item.assetId}`, {
          image: item.image_url.replace(S3_BASE_URL, ""),
          mobile_image: item.mobile_image_url.replace(S3_BASE_URL, ""),
          orientation: item.type,
          placement_key: item.placement_key,
          title: item.title,
          link: item.link,
          position: item.position,
          is_active: item.visible,
        });
      });

      await Promise.all(updatePromises);

      setOriginalHorizontal(horizontalBanners);
      setOriginalPanoramic(panoramicBanners);
      setHasUnsavedChanges(false);

      toast({
        title: "Banners updated",
        description: "Your changes have been saved successfully.",
        type: "success",
      });
    } catch (err: any) {
      toast({
        title: "Save failed",
        description:
          err.response?.data?.message ||
          err.message ||
          "Could not synchronize some changes with the database.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setHorizontalBanners(originalHorizontal);
    setPanoramicBanners(originalPanoramic);
    setHasUnsavedChanges(false);
    toast({
      title: "Changes discarded",
      description: "Reverted to the last saved state.",
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <PanelTop className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight">
              Banner Management
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Upload, arrange and manage horizontal and panoramic website banners.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="gap-2 rounded-full px-4"
            >
              <RotateCcw className="w-4 h-4" />
              Discard
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasUnsavedChanges || saving}
            className="gap-2 rounded-full px-5 shadow-lg shadow-primary/20"
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

      {fetching ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-primary/20 animate-pulse"></div>
            <Loader2 className="w-12 h-12 text-primary animate-spin absolute inset-0" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            Fetching banners...
          </span>
        </div>
      ) : (
        <Tabs
          defaultValue="horizontal"
          className="w-full"
          onValueChange={(v) => setActiveTab(v as BannerType)}
        >
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-8 p-1 bg-neutral-100 dark:bg-neutral-900 rounded-full">
            <TabsTrigger
              value="horizontal"
              className="gap-2 rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Layout className="w-4 h-4" />
              Horizontal
              {horizontalBanners.length > 0 && (
                <Badge className="ml-1 h-5 px-1.5 text-[10px] bg-primary/10 text-primary border-none">
                  {horizontalBanners.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="panoramic"
              className="gap-2 rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Maximize2 className="w-4 h-4" />
              Panoramic
              {panoramicBanners.length > 0 && (
                <Badge className="ml-1 h-5 px-1.5 text-[10px] bg-primary/10 text-primary border-none">
                  {panoramicBanners.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
            <TabsContent value="horizontal" className="mt-0 outline-none">
              <BannerList
                items={horizontalBanners}
                onRemove={handleRemove}
                onToggleVisible={handleToggleVisible}
                onMove={moveItem}
                onDragStart={handleDragStart}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                dragState={drag}
                onAdd={() => setAddDialogOpen(true)}
                type="horizontal"
              />
            </TabsContent>
            <TabsContent value="panoramic" className="mt-0 outline-none">
              <BannerList
                items={panoramicBanners}
                onRemove={handleRemove}
                onToggleVisible={handleToggleVisible}
                onMove={moveItem}
                onDragStart={handleDragStart}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                dragState={drag}
                onAdd={() => setAddDialogOpen(true)}
                type="panoramic"
              />
            </TabsContent>
          </div>
        </Tabs>
      )}

      {/* ── Add Dialog ── */}
      <Dialog
        open={addDialogOpen}
        onOpenChange={(open) => {
          setAddDialogOpen(open);
          if (!open) resetDialog();
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Plus className="w-4 h-4 text-primary" />
              </div>
              Add {activeTab === "horizontal" ? "Horizontal" : "Panoramic"}{" "}
              Banner
            </DialogTitle>
          </DialogHeader>

          <div className="py-2 space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-1 gap-2">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                  Desktop Image <span className="text-red-500">*</span>
                </Label>
                <FileDropZone
                  id="banner_upload"
                  preview={newPreview}
                  onChange={handleFileChange}
                  aspectLabel={
                    activeTab === "horizontal"
                      ? "Horizontal Image"
                      : "Panoramic Image"
                  }
                />
              </div>

              {/* <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                  Mobile Image (Optional)
                </Label>
                <FileDropZone
                  id="mobile_banner_upload"
                  preview={newMobilePreview}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setNewMobileFile(file);
                      setNewMobilePreview(URL.createObjectURL(file));
                    }
                  }}
                  aspectLabel="Recommended: 9:16 or 1:1"
                  aspectClass="aspect-[3/4]"
                />
              </div> */}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label
                  htmlFor="banner_title"
                  className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1"
                >
                  Internal Title
                </Label>
                <Input
                  id="banner_title"
                  placeholder="e.g. Summer Collection 2024"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="rounded-xl h-12 focus:ring-primary/20 transition-all border-neutral-200"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="banner_placement"
                  className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1"
                >
                  Placement Key
                </Label>
                <Input
                  id="banner_placement"
                  placeholder="e.g. home_top_main"
                  value={newPlacementKey}
                  onChange={(e) => setNewPlacementKey(e.target.value)}
                  className="rounded-xl h-12 focus:ring-primary/20 transition-all border-neutral-200"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="banner_link"
                className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1"
              >
                Banner Link / URL
              </Label>
              <Input
                id="banner_link"
                placeholder="https://example.com/collection"
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
                className="rounded-xl h-12 focus:ring-primary/20 transition-all border-neutral-200"
              />
            </div>
          </div>

          <DialogFooter className="gap-3 sm:gap-0 mt-2">
            <Button
              variant="ghost"
              onClick={() => setAddDialogOpen(false)}
              disabled={adding}
              className="rounded-full px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={adding || !newFile}
              className="gap-2 rounded-full px-8 shadow-lg shadow-primary/10"
            >
              {adding ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Add Banner
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── BannerList ──────────────────────────────────────────────────────────────

function BannerList({
  items,
  onRemove,
  onToggleVisible,
  onMove,
  onDragStart,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onDragEnd,
  dragState,
  onAdd,
  type,
}: {
  items: BannerItem[];
  onRemove: (id: string) => void;
  onToggleVisible: (id: string) => void;
  onMove: (id: string, direction: "up" | "down") => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnter: (e: React.DragEvent, id: string) => void;
  onDragLeave: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  dragState: DragState;
  onAdd: () => void;
  type: BannerType;
}) {
  if (items.length === 0) {
    return (
      <Card className="border-dashed border-2 flex flex-col items-center justify-center py-24 px-4 text-center rounded-3xl bg-neutral-50/50 dark:bg-neutral-900/10">
        <div className="w-20 h-20 rounded-3xl bg-white dark:bg-neutral-800 shadow-xl flex items-center justify-center mb-6 scale-110">
          <PanelTop className="w-10 h-10 text-neutral-300" />
        </div>
        <h3 className="font-bold text-2xl tracking-tight">
          No {type} banners yet
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs mt-3 mb-8">
          Give your website a fresh look by uploading beautiful banners to
          showcase your content.
        </p>
        <Button
          onClick={onAdd}
          className="gap-2 rounded-full px-8 h-12 shadow-xl shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
          Add Your First Banner
        </Button>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {items.map((item, idx) => {
        const isDragging = dragState.draggedId === item.id;
        const isOver = dragState.overId === item.id;

        return (
          <div
            key={item.id}
            draggable
            onDragStart={(e) => onDragStart(e, item.id)}
            onDragEnter={(e) => onDragEnter(e, item.id)}
            onDragLeave={onDragLeave}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, item.id)}
            onDragEnd={onDragEnd}
            className={cn(
              "group relative flex flex-col rounded-[2rem] border transition-all duration-300 cursor-grab active:cursor-grabbing overflow-hidden bg-white dark:bg-neutral-950",
              isDragging
                ? "opacity-30 scale-95 border-dashed border-primary"
                : isOver
                  ? "border-primary ring-4 ring-primary/10 shadow-2xl scale-[1.02] z-10"
                  : "border-neutral-100 dark:border-neutral-800 hover:border-primary/30 hover:shadow-2xl hover:shadow-neutral-200/50 dark:hover:shadow-none",
              !item.visible && "opacity-75 grayscale-[0.5]",
            )}
          >
            {/* Banner Image Container */}
            <div
              className={cn(
                "relative w-full overflow-hidden bg-neutral-100",
                type === "horizontal" ? "aspect-video" : "aspect-[21/9]",
              )}
            >
              <Image
                src={item.image_url}
                alt={item.link || "banner"}
                fill
                unoptimized
                className={cn(
                  "w-full h-full object-cover transition-transform duration-700",
                  !isDragging && "group-hover:scale-110",
                  !item.visible && "opacity-60",
                )}
              />

              {/* Overlay for actions when not dragging */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-white font-bold text-sm truncate">
                      {item.title || "Untitled Banner"}
                    </p>
                    <p className="text-white/70 text-[10px] truncate mt-0.5">
                      {item.link || "No link provided"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-9 w-9 rounded-full bg-white/20 backdrop-blur-md border-none text-white hover:bg-white hover:text-black transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleVisible(item.id);
                      }}
                    >
                      {item.visible ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-9 w-9 rounded-full bg-red-500/80 backdrop-blur-md border-none text-white hover:bg-red-600 transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(item.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Status Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                <Badge className="bg-black/40 backdrop-blur-md text-white border-none text-[10px] uppercase font-bold tracking-widest px-2.5 py-1">
                  POS {item.position}
                </Badge>
                {!item.visible && (
                  <Badge
                    variant="secondary"
                    className="bg-amber-500 text-white border-none text-[10px] uppercase font-bold tracking-widest px-2.5 py-1"
                  >
                    Hidden
                  </Badge>
                )}
              </div>

              {/* Handle */}
              <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="w-4 h-4" />
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="p-5 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/50">
              <div className="flex-1 min-w-0">
                <h4
                  className={cn(
                    "font-bold text-neutral-900 dark:text-neutral-100 truncate flex items-center gap-2 text-sm",
                    !item.visible && "text-neutral-400",
                  )}
                >
                  {item.title || "Untitled Banner"}
                </h4>
                <p className="text-[10px] text-muted-foreground truncate opacity-70 mt-1">
                  {item.placement_key}
                </p>
              </div>

              <div className="flex gap-1.5 border border-neutral-200 dark:border-neutral-700 rounded-full p-1 bg-white dark:bg-neutral-800">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMove(item.id, "up");
                  }}
                  disabled={idx === 0}
                >
                  <ChevronUp className="w-4 h-4" />
                </Button>
                <div className="w-[1px] h-4 bg-neutral-200 dark:bg-neutral-700 my-auto" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMove(item.id, "down");
                  }}
                  disabled={idx === items.length - 1}
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        );
      })}

      {/* Add New Placeholder */}
      <button
        onClick={onAdd}
        className="group relative flex flex-col items-center justify-center rounded-[2.5rem] border-2 border-dashed border-neutral-200 dark:border-neutral-800 p-8 min-h-[300px] hover:border-primary/50 hover:bg-primary/5 transition-all duration-500"
      >
        <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-900 group-hover:bg-primary group-hover:scale-110 transition-all duration-500 flex items-center justify-center mb-4 group-hover:shadow-2xl group-hover:shadow-primary/30">
          <Plus className="w-8 h-8 text-neutral-400 group-hover:text-primary-foreground transition-colors duration-500" />
        </div>
        <p className="text-lg font-bold text-neutral-400 group-hover:text-primary transition-colors">
          Add {type} Banner
        </p>
        <p className="text-xs text-muted-foreground mt-2 max-w-[180px] text-center opacity-60">
          Upload a fresh visual for your website
        </p>
      </button>
    </div>
  );
}

// ─── FileDropZone ──────────────────────────────────────────────────────────────
function FileDropZone({
  id,
  preview,
  onChange,
  aspectLabel,
  aspectClass,
}: {
  id: string;
  preview: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  aspectLabel: string;
  aspectClass?: string;
}) {
  return (
    <div
      className={cn(
        "relative border-2 border-dashed rounded-[2rem] p-8 transition-all duration-500 flex flex-col items-center justify-center gap-4 cursor-pointer overflow-hidden min-h-[220px]",
        preview
          ? "border-primary/30 bg-primary/5"
          : "border-neutral-200 dark:border-neutral-800 hover:border-primary/40 hover:bg-neutral-50 dark:hover:bg-neutral-900/50",
      )}
      onClick={() => document.getElementById(id)?.click()}
    >
      <input
        id={id}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={onChange}
      />

      {preview ? (
        <div
          className={cn(
            "rounded-3xl overflow-hidden shadow-2xl relative group flex items-center justify-center border-none",
            aspectClass || "w-full aspect-video",
          )}
        >
          <Image
            src={preview}
            alt="Preview"
            fill
            unoptimized
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center backdrop-blur-sm">
            <p className="text-white text-sm font-bold bg-white/20 px-6 py-3 rounded-full flex items-center gap-3 border border-white/30">
              <Upload className="w-4 h-4" />
              Replace Banner
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center shadow-lg shadow-primary/5">
            <Upload className="w-7 h-7 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-base font-bold">
              Click to upload or drag & drop
            </p>
            <p className="text-xs text-muted-foreground mt-1.5 uppercase tracking-widest font-bold opacity-60">
              {aspectLabel}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
