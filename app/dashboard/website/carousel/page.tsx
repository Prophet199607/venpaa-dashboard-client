"use client";

import { useEffect, useState, useRef } from "react";
import { cn } from "@/utils/cn";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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
  Image as ImageIcon,
  Monitor,
  Smartphone,
  ChevronUp,
  ChevronDown,
  Save,
  RotateCcw,
  Eye,
  EyeOff,
  Layers,
  Upload,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface CarouselItem {
  id: string;
  image_url: string;
  visible: boolean;
  order: number;
}

type CarouselType = "desktop" | "mobile";

// ─── Drag-and-drop types ───────────────────────────────────────────────────────
type DragState = {
  draggedId: string | null;
  overId: string | null;
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function CarouselManagementPage() {
  const { toast } = useToast();

  // Data
  const [desktopImages, setDesktopImages] = useState<CarouselItem[]>([
    {
      id: "d1",
      image_url:
        "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=2070&auto=format&fit=crop",
      visible: true,
      order: 1,
    },
    {
      id: "d2",
      image_url:
        "https://images.unsplash.com/photo-1607083206968-13611e3d76db?q=80&w=2031&auto=format&fit=crop",
      visible: true,
      order: 2,
    },
  ]);
  const [mobileImages, setMobileImages] = useState<CarouselItem[]>([
    {
      id: "m1",
      image_url:
        "https://images.unsplash.com/photo-1607082349566-187342175e2f?q=80&w=1000&auto=format&fit=crop",
      visible: true,
      order: 1,
    },
  ]);
  const [activeTab, setActiveTab] = useState<CarouselType>("desktop");

  // UI State
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // New Item State
  const [previewUrl, setPreviewUrl] = useState<string>("");

  // Drag state
  const [drag, setDrag] = useState<DragState>({
    draggedId: null,
    overId: null,
  });
  const dragCounter = useRef(0);

  // Current list based on active tab
  const currentItems = activeTab === "desktop" ? desktopImages : mobileImages;
  const setCurrentItems =
    activeTab === "desktop" ? setDesktopImages : setMobileImages;

  // ── Handlers ──────────────────────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleAdd = () => {
    if (!previewUrl) {
      toast({
        title: "Please select an image",
        description: "An image file is required for the carousel slide.",
        type: "error",
      });
      return;
    }

    const item: CarouselItem = {
      id: `carousel-${Date.now()}`,
      image_url: previewUrl,
      visible: true,
      order: currentItems.length + 1,
    };

    setCurrentItems((prev) => [...prev, item]);
    setHasUnsavedChanges(true);
    setPreviewUrl("");
    setAddDialogOpen(false);

    toast({
      title: "Slide added",
      description: "New image has been added to the carousel.",
      type: "success",
    });
  };

  const handleRemove = (id: string) => {
    setCurrentItems((prev) =>
      prev
        .filter((i) => i.id !== id)
        .map((item, idx) => ({ ...item, order: idx + 1 })),
    );
    setHasUnsavedChanges(true);
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
    setCurrentItems(newItems.map((item, i) => ({ ...item, order: i + 1 })));
    setHasUnsavedChanges(true);
  };

  // ── Drag and Drop ─────────────────────────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDrag({ draggedId: id, overId: null });
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
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

    setCurrentItems(newItems.map((item, idx) => ({ ...item, order: idx + 1 })));
    setHasUnsavedChanges(true);
    setDrag({ draggedId: null, overId: null });
  };

  const handleDragEnd = () => {
    dragCounter.current = 0;
    setDrag({ draggedId: null, overId: null });
  };

  // ── Save/Reset ────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    // Mimic API call
    setTimeout(() => {
      setSaving(false);
      setHasUnsavedChanges(false);
      toast({
        title: "Carousel updated",
        description: "Your changes have been saved successfully.",
        type: "success",
      });
    }, 1000);
  };

  const handleReset = () => {
    setHasUnsavedChanges(false);
    toast({
      title: "Changes discarded",
      description: "Reverted to the last saved state.",
    });
  };

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <ImageIcon className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              Carousel Slider Management
            </h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Upload and reorder images for your desktop and mobile homepage
            sliders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Discard
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasUnsavedChanges || saving}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <Tabs
        defaultValue="desktop"
        className="w-full"
        onValueChange={(v) => setActiveTab(v as CarouselType)}
      >
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
          <TabsTrigger value="desktop" className="gap-2">
            <Monitor className="w-4 h-4" />
            Desktop Slider
          </TabsTrigger>
          <TabsTrigger value="mobile" className="gap-2">
            <Smartphone className="w-4 h-4" />
            Mobile Slider
          </TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left: Images List ── */}
          <div className="lg:col-span-2 space-y-4">
            <TabsContent value="desktop" className="mt-0">
              <CarouselList
                items={desktopImages}
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
              />
            </TabsContent>
            <TabsContent value="mobile" className="mt-0">
              <CarouselList
                items={mobileImages}
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
              />
            </TabsContent>
          </div>

          {/* ── Right: Preview + Info ── */}
          <div className="space-y-6">
            <Card className="overflow-hidden border-neutral-200 dark:border-neutral-800">
              <CardHeader className="bg-neutral-50/50 dark:bg-neutral-900/50 pb-3">
                <h2 className="font-semibold text-sm flex items-center gap-2">
                  <Eye className="w-4 h-4 text-primary" />
                  Live Preview
                </h2>
                <p className="text-xs text-muted-foreground">
                  Simulated preview of how your carousel will look.
                </p>
              </CardHeader>
              <CardContent className="p-4 bg-neutral-100/50 dark:bg-black/20">
                <div
                  className={cn(
                    "relative rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-white dark:bg-neutral-900 shadow-sm transition-all duration-300 mx-auto",
                    activeTab === "desktop"
                      ? "aspect-[21/9] w-full"
                      : "aspect-[9/16] w-[200px]",
                  )}
                >
                  {currentItems.filter((i) => i.visible).length > 0 ? (
                    <div className="relative w-full h-full group">
                      <img
                        src={currentItems.filter((i) => i.visible)[0].image_url}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />

                      {/* Dots */}
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                        {currentItems
                          .filter((i) => i.visible)
                          .map((_, idx) => (
                            <div
                              key={idx}
                              className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                idx === 0 ? "bg-white" : "bg-white/40",
                              )}
                            />
                          ))}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-6 text-center">
                      <ImageIcon className="w-10 h-10 text-neutral-300" />
                      <p className="text-xs text-neutral-400 font-medium">
                        No visible slides to preview
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 p-1 rounded bg-primary/20">
                      <Layers className="w-3 h-3 text-primary" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-primary uppercase tracking-wider">
                        Configuration
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {activeTab === "desktop"
                          ? "Recommended size: 1920x800px or larger. Aspect ratio: 2.4:1"
                          : "Recommended size: 1080x1920px. Aspect ratio: 9:16"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* <Card className="border-dashed border-neutral-300 dark:border-neutral-700 bg-transparent">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                    <Plus className="w-6 h-6 text-neutral-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">Add New Slide</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Upload an image to your {activeTab} carousel.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => setAddDialogOpen(true)}
                  >
                    Start Adding
                  </Button>
                </div>
              </CardContent>
            </Card> */}
          </div>
        </div>
      </Tabs>

      {/* ── Add Dialog ── */}
      <Dialog
        open={addDialogOpen}
        onOpenChange={(open) => {
          setAddDialogOpen(open);
          if (!open) {
            setPreviewUrl("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <ImageIcon className="w-4 h-4 text-primary" />
              </div>
              Upload {activeTab === "desktop" ? "Desktop" : "Mobile"} Slide
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-3">
              <Label
                htmlFor="image_upload"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Select Slide Image
              </Label>
              <div
                className={cn(
                  "relative border-2 border-dashed rounded-xl p-8 transition-colors flex flex-col items-center justify-center gap-3 cursor-pointer",
                  previewUrl
                    ? "border-primary/50 bg-primary/5"
                    : "border-neutral-200 dark:border-neutral-800 hover:border-primary/40 hover:bg-neutral-50 dark:hover:bg-neutral-900/50",
                )}
                onClick={() => document.getElementById("image_upload")?.click()}
              >
                <input
                  id="image_upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />

                {previewUrl ? (
                  <div className="w-full aspect-video rounded-lg overflow-hidden border border-primary/20 bg-white dark:bg-neutral-900 shadow-sm relative group">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-white text-xs font-medium bg-black/50 px-3 py-1.5 rounded-full flex items-center gap-2">
                        <Upload className="w-3 h-3" />
                        Replace Image
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-1">
                      <Upload className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">
                        Click to upload or drag & drop
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-tight font-semibold">
                        PNG, JPG, WEBP up to 5MB
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={!previewUrl}>
              Add to Carousel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function CarouselList({
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
}: {
  items: CarouselItem[];
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
}) {
  if (items.length === 0) {
    return (
      <Card className="border-dashed flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
          <ImageIcon className="w-8 h-8 text-neutral-400" />
        </div>
        <h3 className="font-semibold text-lg">No slides yet</h3>
        <p className="text-sm text-muted-foreground max-w-xs mt-2 mb-6">
          Upload some beautiful images to showcase your latest products and
          collections.
        </p>
        <Button onClick={onAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          Add First Slide
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
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
              "group relative flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 cursor-grab active:cursor-grabbing",
              isDragging
                ? "opacity-30 scale-95 border-dashed border-primary bg-primary/5"
                : isOver
                  ? "border-primary bg-primary/5 shadow-xl -translate-y-1"
                  : "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-md",
              !item.visible &&
                "bg-neutral-50/50 dark:bg-neutral-900/50 border-dashed",
            )}
          >
            {/* Grab Handle */}
            <div className="text-neutral-300 group-hover:text-neutral-500 transition-colors">
              <GripVertical className="w-5 h-5" />
            </div>

            {/* Position */}
            <div className="w-6 h-6 rounded-md bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-[10px] font-bold text-neutral-500">
              {idx + 1}
            </div>

            {/* Thumbnail */}
            <div className="relative w-40 aspect-[16/9] rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-100 flex-shrink-0">
              <img
                src={item.image_url}
                alt={`carousel slide ${idx + 1}`}
                className={cn(
                  "w-full h-full object-cover",
                  !item.visible && "grayscale opacity-50",
                )}
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://placehold.co/400x225?text=Image+Not+Found";
                }}
              />
              {!item.visible && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <EyeOff className="w-4 h-4 text-white" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h4
                  className={cn(
                    "text-sm font-semibold truncate",
                    !item.visible && "text-neutral-400 line-through",
                  )}
                >
                  Slide {idx + 1}
                </h4>
                {!item.visible && (
                  <Badge
                    variant="outline"
                    className="text-[9px] px-1.5 py-0 h-4 bg-neutral-100 dark:bg-neutral-800 text-neutral-500"
                  >
                    HIDDEN
                  </Badge>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground truncate uppercase tracking-tighter font-semibold">
                JPEG/PNG Image
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-lg p-0.5 mr-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-md hover:bg-white dark:hover:bg-neutral-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMove(item.id, "up");
                  }}
                  disabled={idx === 0}
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-md hover:bg-white dark:hover:bg-neutral-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMove(item.id, "down");
                  }}
                  disabled={idx === items.length - 1}
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </Button>
              </div>

              <Button
                variant={item.visible ? "ghost" : "secondary"}
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-lg",
                  item.visible
                    ? "text-neutral-500 hover:text-primary"
                    : "text-amber-600 bg-amber-50 dark:bg-amber-950/30",
                )}
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
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(item.id);
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        );
      })}

      <Button
        variant="outline"
        className="w-full border-dashed py-8 mt-4 rounded-2xl flex flex-col gap-2 bg-transparent hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
        onClick={onAdd}
      >
        <Plus className="w-5 h-5 text-neutral-400" />
        <span className="text-xs font-medium text-neutral-500">
          Upload Another Slide
        </span>
      </Button>
    </div>
  );
}
