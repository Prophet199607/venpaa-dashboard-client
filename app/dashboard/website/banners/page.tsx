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
import { api } from "@/utils/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GripVertical,
  Plus,
  Trash2,
  Monitor,
  Smartphone,
  ChevronUp,
  ChevronDown,
  Save,
  RotateCcw,
  Eye,
  EyeOff,
  Upload,
  Loader2,
  PanelTop,
  Globe,
  Pencil,
  X,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

type BannerType = "web" | "mobile";

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
  language?: string | null;
  language_code?: string | null;
  language_name?: string | null;
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
  language?: string | null;
  language_code?: string | null;
  language_name?: string | null;
}

interface Language {
  lang_code: string;
  lang_name: string;
}

type DragState = {
  draggedId: string | null;
  overId: string | null;
};

const S3_BASE_URL = process.env.NEXT_PUBLIC_S3_BASE_URL ?? "";

function normalizeBannerType(orientation?: string | null): BannerType {
  const norm = (orientation || "").toLowerCase().trim();
  if (norm === "mobile") {
    return "mobile";
  }
  return "web";
}

function assetToItem(asset: BannerAsset): BannerItem {
  const getFullUrl = (url: string | null) => {
    if (!url) return "";
    if (url.startsWith("http") || url.startsWith("data:")) return url;
    return `${S3_BASE_URL}${url}`;
  };

  const img = getFullUrl(asset.image);
  const mobileImg = getFullUrl(asset.mobile_image);

  return {
    id: String(asset.id),
    assetId: asset.id,
    image_url: img || mobileImg,
    mobile_image_url: mobileImg || img,
    type: normalizeBannerType(asset.orientation),
    title: asset.title || "",
    placement_key: asset.placement_key || "",
    link: asset.link || "",
    visible: asset.is_active,
    position: asset.position,
    language: (asset as any).language || (asset as any).language_code || null,
    language_code:
      (asset as any).language_code || (asset as any).language || null,
    language_name: (asset as any).language_name || null,
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
  const [webBanners, setWebBanners] = useState<BannerItem[]>([]);
  const [mobileBanners, setMobileBanners] = useState<BannerItem[]>([]);
  const [activeTab, setActiveTab] = useState<BannerType>("web");
  const [languages, setLanguages] = useState<Language[]>([]);

  // ── UI State ──────────────────────────────────────────────────────────────────
  const [fetching, setFetching] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Storage for discarding changes
  const [originalWeb, setOriginalWeb] = useState<BannerItem[]>([]);
  const [originalMobile, setOriginalMobile] = useState<BannerItem[]>([]);

  // ── New / Edit Item State ──────────────────────────────────────────────────────
  const [editingItem, setEditingItem] = useState<BannerItem | null>(null);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [newPreview, setNewPreview] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newPlacementKey, setNewPlacementKey] = useState("");
  const [newLink, setNewLink] = useState("");
  const [newLanguage, setNewLanguage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ── Drag State ────────────────────────────────────────────────────────────────
  const [drag, setDrag] = useState<DragState>({
    draggedId: null,
    overId: null,
  });
  const dragCounter = useRef(0);

  // ── Derived ───────────────────────────────────────────────────────────────────
  const currentItems = activeTab === "web" ? webBanners : mobileBanners;
  const setCurrentItems =
    activeTab === "web" ? setWebBanners : setMobileBanners;

  // ── Fetch Languages ────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const { data: res } = await api.get("/languages");
        const list = res?.data || (Array.isArray(res) ? res : []);
        if (Array.isArray(list)) {
          setLanguages(list);
        }
      } catch (err: any) {
        console.error("Failed to fetch languages:", err);
      }
    };
    fetchLanguages();
  }, []);

  const fetchBanners = useCallback(async () => {
    setFetching(true);
    try {
      const res = await nodeApi.get("/banners", {
        validateStatus: (status) =>
          (status >= 200 && status < 300) || status === 404,
      });

      if (res.status === 404) {
        setWebBanners([]);
        setMobileBanners([]);
        setOriginalWeb([]);
        setOriginalMobile([]);
        setHasUnsavedChanges(false);
        return;
      }

      const rawData =
        res.data?.data ?? (Array.isArray(res.data) ? res.data : []);
      const items = rawData.map(assetToItem);

      const web = items
        .filter((i: any) => i.type === "web")
        .sort((a: BannerItem, b: BannerItem) => a.position - b.position);

      const mobile = items
        .filter((i: any) => i.type === "mobile")
        .sort((a: BannerItem, b: BannerItem) => a.position - b.position);

      setWebBanners(web);
      setMobileBanners(mobile);
      setOriginalWeb(web);
      setOriginalMobile(mobile);
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
    setEditingItem(null);
    setNewFile(null);
    setNewPreview("");
    setNewTitle("");
    setNewPlacementKey("");
    setNewLink("");
    setNewLanguage("");
  };

  const handleOpenEdit = (item: BannerItem) => {
    setEditingItem(item);
    if (item.type && item.type !== activeTab) {
      setActiveTab(item.type);
    }
    setNewFile(null);
    setNewPreview(item.image_url || item.mobile_image_url || "");
    setNewTitle(item.title || "");
    setNewPlacementKey(item.placement_key || "");
    setNewLink(item.link || "");
    setNewLanguage(item.language || item.language_code || "");
    setAddDialogOpen(true);
  };

  // ── Handlers ──────────────────────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewFile(file);
      setNewPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    const isEditing = Boolean(editingItem);
    const bannerTypeLabel = activeTab === "web" ? "desktop" : "mobile";

    if (!isEditing && !newFile) {
      toast({
        title: "Image required",
        description: `Please select an image for the ${bannerTypeLabel} banner.`,
        type: "error",
      });
      return;
    }

    if (isEditing && !newFile && !newPreview) {
      toast({
        title: "Image required",
        description: `Please select an image for the ${bannerTypeLabel} banner.`,
        type: "error",
      });
      return;
    }

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    if (newFile && newFile.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: `The ${bannerTypeLabel} image exceeds the 5MB size limit. Please upload a smaller image.`,
        type: "error",
      });
      return;
    }

    setSubmitting(true);
    try {
      const base64 = newFile ? await fileToBase64(newFile) : null;
      const selectedLangObj = languages.find(
        (l) => l.lang_code === newLanguage,
      );

      if (isEditing && editingItem) {
        const targetType = editingItem.type || activeTab;
        const body: any = {
          orientation: targetType,
          placement_key:
            newPlacementKey.trim() ||
            editingItem.placement_key ||
            `banner_${targetType}_${Date.now()}`,
          title: newTitle.trim() || editingItem.title || `Banner ${Date.now()}`,
          link: newLink.trim(),
          position: editingItem.position,
          is_active: editingItem.visible,
          language: newLanguage && newLanguage !== "all" ? newLanguage : null,
        };

        if (base64) {
          body.image = base64;
          if (targetType === "mobile") {
            body.mobile_image = base64;
          }
        } else if (editingItem.image_url) {
          body.image = editingItem.image_url.replace(S3_BASE_URL, "");
          if (targetType === "mobile") {
            body.mobile_image = (
              editingItem.mobile_image_url || editingItem.image_url
            ).replace(S3_BASE_URL, "");
          }
        }

        const res = await nodeApi.put(`/banners/${editingItem.assetId}`, body);
        const updatedAsset: BannerAsset = res.data?.data || res.data;
        const updatedItem = assetToItem({
          ...updatedAsset,
          orientation: targetType,
          image:
            updatedAsset.image ||
            (base64 ? newPreview : editingItem.image_url),
          link: updatedAsset.link || newLink.trim() || null,
          language:
            updatedAsset.language ||
            (newLanguage && newLanguage !== "all" ? newLanguage : null),
          language_name:
            updatedAsset.language_name || selectedLangObj?.lang_name || null,
        });

        setCurrentItems((prev) =>
          prev.map((item) => (item.id === editingItem.id ? updatedItem : item)),
        );

        toast({
          title: "Banner updated",
          description: "The banner has been updated successfully.",
          type: "success",
        });

        resetDialog();
        setAddDialogOpen(false);
        fetchBanners();
      } else {
        const body: any = {
          image: base64,
          mobile_image: activeTab === "mobile" ? base64 : null,
          orientation: activeTab, // "web" or "mobile"
          placement_key:
            newPlacementKey.trim() || `banner_${activeTab}_${Date.now()}`,
          title: newTitle.trim() || `Banner ${Date.now()}`,
          link: newLink.trim(),
          position: currentItems.length + 1,
          is_active: true,
          language: newLanguage && newLanguage !== "all" ? newLanguage : null,
        };

        const res = await nodeApi.post("/banners", body);

        const created: BannerAsset = res.data?.data || res.data;
        const newItem = assetToItem({
          ...created,
          orientation: activeTab,
          image: created.image || (base64 ? newPreview : ""),
          link: created.link || newLink.trim() || null,
          language:
            created.language ||
            (newLanguage && newLanguage !== "all" ? newLanguage : null),
          language_name:
            created.language_name || selectedLangObj?.lang_name || null,
        });

        setCurrentItems((prev) => [...prev, newItem]);
        resetDialog();
        setAddDialogOpen(false);

        toast({
          title: "Banner added",
          description: "New banner has been uploaded successfully.",
          type: "success",
        });

        fetchBanners();
      }
    } catch (err: any) {
      toast({
        title: isEditing ? "Update failed" : "Upload failed",
        description:
          err.response?.data?.message ||
          err.message ||
          (isEditing
            ? "Could not update the banner."
            : "Could not upload the banner image."),
        type: "error",
      });
    } finally {
      setSubmitting(false);
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
      const allItems = [...webBanners, ...mobileBanners];
      const itemsToUpdate = allItems.filter((i) => i.assetId);

      const updatePromises = itemsToUpdate.map((item) => {
        return nodeApi.put(`/banners/${item.assetId}`, {
          image: item.image_url
            ? item.image_url.replace(S3_BASE_URL, "")
            : "",
          mobile_image: item.mobile_image_url
            ? item.mobile_image_url.replace(S3_BASE_URL, "")
            : item.type === "mobile" && item.image_url
              ? item.image_url.replace(S3_BASE_URL, "")
              : null,
          orientation: item.type, // "web" or "mobile"
          placement_key: item.placement_key,
          title: item.title,
          link: item.link,
          position: item.position,
          is_active: item.visible,
          language: item.language || null,
        });
      });

      await Promise.all(updatePromises);

      setOriginalWeb(webBanners);
      setOriginalMobile(mobileBanners);
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

  const handleChangeLanguage = (id: string, langCode: string) => {
    const selectedLangObj = languages.find((l) => l.lang_code === langCode);
    setCurrentItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              language: langCode === "all" ? null : langCode,
              language_code: langCode === "all" ? null : langCode,
              language_name:
                langCode === "all" ? null : selectedLangObj?.lang_name || null,
            }
          : item,
      ),
    );
    setHasUnsavedChanges(true);
  };

  const handleReset = () => {
    setWebBanners(originalWeb);
    setMobileBanners(originalMobile);
    setHasUnsavedChanges(false);
    toast({
      title: "Changes discarded",
      description: "Reverted to the last saved state.",
    });
  };

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10">
              <PanelTop className="w-3.5 h-3.5 text-primary" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight">
              Banner Management
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Upload, arrange and manage desktop (web) and mobile website banners.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Discard
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasUnsavedChanges || saving}
            className="gap-1.5"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {fetching ? (
        <div className="flex flex-col items-center justify-center py-32 gap-2">
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
          defaultValue="web"
          value={activeTab}
          className="w-full"
          onValueChange={(v) => setActiveTab(v as BannerType)}
        >
          {/* Tab 1: Desktop Banners, Tab 2: Mobile Banners */}
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-2 p-1 bg-neutral-100 dark:bg-neutral-900 rounded-full">
            <TabsTrigger
              value="web"
              className="gap-2 rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Monitor className="w-4 h-4" />
              Desktop Banners
              {webBanners.length > 0 && (
                <Badge className="ml-1 h-5 px-1.5 text-[10px] bg-primary/10 text-primary border-none">
                  {webBanners.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="mobile"
              className="gap-2 rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Smartphone className="w-4 h-4" />
              Mobile Banners
              {mobileBanners.length > 0 && (
                <Badge className="ml-1 h-5 px-1.5 text-[10px] bg-primary/10 text-primary border-none">
                  {mobileBanners.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="grid grid-cols-1 lg:grid-cols-1 gap-2">
            <TabsContent value="web" className="mt-0 outline-none">
              <BannerList
                items={webBanners}
                languages={languages}
                onChangeLanguage={handleChangeLanguage}
                onEdit={handleOpenEdit}
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
                onAdd={() => {
                  resetDialog();
                  setAddDialogOpen(true);
                }}
                type="web"
              />
            </TabsContent>
            <TabsContent value="mobile" className="mt-0 outline-none">
              <BannerList
                items={mobileBanners}
                languages={languages}
                onChangeLanguage={handleChangeLanguage}
                onEdit={handleOpenEdit}
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
                onAdd={() => {
                  resetDialog();
                  setAddDialogOpen(true);
                }}
                type="mobile"
              />
            </TabsContent>
          </div>
        </Tabs>
      )}

      {/* ── Add / Edit Dialog ── */}
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
                {editingItem ? (
                  <Pencil className="w-4 h-4 text-primary" />
                ) : (
                  <Plus className="w-4 h-4 text-primary" />
                )}
              </div>
              {editingItem ? "Edit" : "Add"}{" "}
              {activeTab === "web" ? "Desktop" : "Mobile"} Banner
            </DialogTitle>
          </DialogHeader>

          <div className="py-2 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                {activeTab === "web"
                  ? "Desktop Banner Image (1920x420)"
                  : "Mobile Banner Image (750x500)"}
              </Label>
              <FileDropZone
                id="banner_upload"
                preview={newPreview}
                onChange={handleFileChange}
                onClear={() => {
                  setNewFile(null);
                  setNewPreview("");
                }}
                aspectLabel={
                  activeTab === "web"
                    ? "Desktop Banner Image"
                    : "Mobile Banner Image"
                }
                aspectClass={
                  activeTab === "web"
                    ? "w-full aspect-[1920/420]"
                    : "w-full max-w-[360px] aspect-[750/500]"
                }
                recommendedSize={
                  activeTab === "web"
                    ? "Recommended size: 1920x420px"
                    : "Recommended size: 750x500px"
                }
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  className="rounded-xl h-11 focus:ring-primary/20 transition-all border-neutral-200"
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
                  className="rounded-xl h-11 focus:ring-primary/20 transition-all border-neutral-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="banner_language"
                  className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1"
                >
                  Target Language
                </Label>
                <Select
                  value={newLanguage || "all"}
                  onValueChange={(val) =>
                    setNewLanguage(val === "all" ? "" : val)
                  }
                >
                  <SelectTrigger
                    id="banner_language"
                    className="rounded-xl h-11 border-neutral-200"
                  >
                    <SelectValue placeholder="All Languages (Default)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Languages (Default)</SelectItem>
                    {languages.map((lang) => (
                      <SelectItem key={lang.lang_code} value={lang.lang_code}>
                        {lang.lang_name} ({lang.lang_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  className="rounded-xl h-11 focus:ring-primary/20 transition-all border-neutral-200"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-3 sm:gap-0 mt-2">
            <Button
              variant="ghost"
              onClick={() => setAddDialogOpen(false)}
              disabled={submitting}
              className="rounded-full px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="gap-2 rounded-full px-8 shadow-lg shadow-primary/10"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {editingItem ? "Updating…" : "Processing…"}
                </>
              ) : (
                <>
                  {editingItem ? (
                    <Save className="w-4 h-4" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {editingItem ? "Update Banner" : "Add Banner"}
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
  languages,
  onChangeLanguage,
  onEdit,
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
  languages: Language[];
  onChangeLanguage: (id: string, langCode: string) => void;
  onEdit: (item: BannerItem) => void;
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
        <div className="w-20 h-20 rounded-3xl bg-white dark:bg-neutral-800 shadow-xl flex items-center justify-center mb-4 scale-110">
          {type === "web" ? (
            <Monitor className="w-10 h-10 text-neutral-300" />
          ) : (
            <Smartphone className="w-10 h-10 text-neutral-300" />
          )}
        </div>
        <h3 className="font-bold text-2xl tracking-tight">
          No {type === "web" ? "desktop" : "mobile"} banners yet
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs mt-3 mb-8">
          {type === "web"
            ? "Upload desktop banners (1920x420px) to showcase your content on desktop screens."
            : "Upload mobile banners (750x500px) optimized for mobile devices."}
        </p>
        <Button
          onClick={onAdd}
          className="gap-2 rounded-full px-8 h-12 shadow-xl shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
          Add Your First {type === "web" ? "Desktop" : "Mobile"} Banner
        </Button>
      </Card>
    );
  }

  return (
    <div
      className={cn(
        "grid gap-4",
        type === "web"
          ? "grid-cols-1 md:grid-cols-2"
          : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
      )}
    >
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
                "relative w-full overflow-hidden bg-neutral-100 dark:bg-neutral-900",
                type === "web" ? "aspect-[1920/420]" : "aspect-[750/500]",
              )}
            >
              {item.image_url ? (
                <Image
                  src={item.image_url}
                  alt={item.title || item.link || "banner"}
                  fill
                  unoptimized
                  className={cn(
                    "w-full h-full object-cover transition-transform duration-700",
                    !isDragging && "group-hover:scale-110",
                    !item.visible && "opacity-60",
                  )}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-neutral-100 dark:bg-neutral-900">
                  <PanelTop className="w-8 h-8 text-neutral-400 mb-2" />
                  <span className="text-xs font-semibold text-neutral-500">
                    No image available
                  </span>
                </div>
              )}

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
                      title="Edit banner"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(item);
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
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
                {item.language_name ? (
                  <Badge className="bg-primary/80 backdrop-blur-md text-white border-none text-[10px] font-bold tracking-wider px-2.5 py-1 flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    {item.language_name} ({item.language || item.language_code})
                  </Badge>
                ) : item.language ? (
                  <Badge className="bg-black/40 backdrop-blur-md text-white border-none text-[10px] font-bold tracking-wider px-2.5 py-1 flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    {item.language}
                  </Badge>
                ) : (
                  <Badge className="bg-black/40 backdrop-blur-md text-white/80 border-none text-[10px] tracking-wider px-2.5 py-1">
                    All Languages
                  </Badge>
                )}
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
            <div className="p-4 flex flex-col gap-2 bg-neutral-50/50 dark:bg-neutral-900/50">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 pr-2">
                  <h4
                    className={cn(
                      "font-bold text-neutral-900 dark:text-neutral-100 truncate text-sm",
                      !item.visible && "text-neutral-400",
                    )}
                  >
                    {item.title || "Untitled Banner"}
                  </h4>
                  <p className="text-[10px] text-muted-foreground truncate opacity-70 mt-0.5">
                    {item.placement_key}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2.5 rounded-full border-neutral-200 dark:border-neutral-700 text-xs font-medium gap-1 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(item);
                    }}
                  >
                    <Pencil className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
                    <span>Edit</span>
                  </Button>
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
                    <div className="w-[1px] h-4 bg-neutral-200 dark:border-neutral-700 my-auto" />
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

              {/* Language Selector */}
              {languages.length > 0 && (
                <div
                  className="flex items-center justify-between pt-1 border-t border-neutral-200/60 dark:border-neutral-800/60"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                    <Globe className="w-3 h-3 text-muted-foreground" /> Language:
                  </span>
                  <div className="w-36">
                    <Select
                      value={item.language || "all"}
                      onValueChange={(val) => onChangeLanguage(item.id, val)}
                    >
                      <SelectTrigger className="h-7 text-xs py-0 px-2 mt-0 rounded-lg">
                        <SelectValue placeholder="All Languages" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Languages</SelectItem>
                        {languages.map((lang) => (
                          <SelectItem
                            key={lang.lang_code}
                            value={lang.lang_code}
                          >
                            {lang.lang_name} ({lang.lang_code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Add New Placeholder */}
      <button
        onClick={onAdd}
        className={cn(
          "group relative flex flex-col items-center justify-center rounded-[2.5rem] border-2 border-dashed border-neutral-200 dark:border-neutral-800 p-8 hover:border-primary/50 hover:bg-primary/5 transition-all duration-500",
          type === "web" ? "min-h-[160px]" : "min-h-[260px]",
        )}
      >
        <div className="w-14 h-14 rounded-full bg-neutral-100 dark:bg-neutral-900 group-hover:bg-primary group-hover:scale-110 transition-all duration-500 flex items-center justify-center mb-3 group-hover:shadow-2xl group-hover:shadow-primary/30">
          <Plus className="w-7 h-7 text-neutral-400 group-hover:text-primary-foreground transition-colors duration-500" />
        </div>
        <p className="text-base font-bold text-neutral-400 group-hover:text-primary transition-colors">
          Add {type === "web" ? "Desktop" : "Mobile"} Banner
        </p>
        {type === "web" ? (
          <p className="text-xs text-muted-foreground text-center opacity-60 mt-1">
            Recommended size: 1920x420px
          </p>
        ) : (
          <p className="text-xs text-muted-foreground text-center opacity-60 mt-1">
            Recommended size: 750x500px
          </p>
        )}
      </button>
    </div>
  );
}

// ─── FileDropZone ──────────────────────────────────────────────────────────────
function FileDropZone({
  id,
  preview,
  onChange,
  onClear,
  aspectLabel,
  aspectClass,
  recommendedSize,
}: {
  id: string;
  preview: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear?: () => void;
  aspectLabel: string;
  aspectClass?: string;
  recommendedSize?: string;
}) {
  return (
    <div
      className={cn(
        "relative border-2 border-dashed rounded-[2rem] p-6 transition-all duration-500 flex flex-col items-center justify-center gap-4 cursor-pointer overflow-hidden min-h-[180px]",
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
        <div className="w-full flex flex-col items-center gap-3">
          <div
            className={cn(
              "rounded-2xl overflow-hidden shadow-xl relative group flex items-center justify-center border-none",
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
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center gap-3 backdrop-blur-sm">
              <p className="text-white text-sm font-bold bg-white/20 px-5 py-2.5 rounded-full flex items-center gap-2 border border-white/30">
                <Upload className="w-4 h-4" />
                Replace
              </p>
              {onClear && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClear();
                  }}
                  className="text-white text-sm font-bold bg-red-500/80 hover:bg-red-600 px-5 py-2.5 rounded-full flex items-center gap-1.5 border border-red-400/30 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Remove
                </button>
              )}
            </div>
          </div>
          {recommendedSize && (
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">
              {recommendedSize}
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shadow-lg shadow-primary/5">
            <Upload className="w-6 h-6 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-base font-bold">
              Click to upload or drag & drop
            </p>
            <p className="text-xs text-muted-foreground mt-1.5 uppercase tracking-widest font-bold opacity-60">
              {aspectLabel}
            </p>
            {recommendedSize && (
              <p className="text-[11px] text-muted-foreground mt-1 uppercase tracking-widest font-bold opacity-60">
                {recommendedSize}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
