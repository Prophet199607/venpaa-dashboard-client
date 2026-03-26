"use client";

import { useEffect, useState, useRef } from "react";
import { cn } from "@/utils/cn";
import { api } from "@/utils/api";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  Globe,
  FolderOpen,
  Tag,
  ChevronUp,
  ChevronDown,
  Save,
  RotateCcw,
  Eye,
  EyeOff,
  AlertCircle,
  Info,
  Layers,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

type NavbarItemType = "department" | "category";

interface NavbarItem {
  id: string;
  type: NavbarItemType;
  code: string;
  name: string;
  imageUrl?: string;
  visible: boolean;
  order: number;
}

interface Department {
  dep_code: string;
  dep_name: string;
  dep_image_url?: string;
}

interface Category {
  cat_code: string;
  cat_name: string;
  cat_image_url?: string;
  department_name?: string;
}

// ─── Local storage key ─────────────────────────────────────────────────────────
const STORAGE_KEY = "website:navbar_items";

function loadFromStorage(): NavbarItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(items: NavbarItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

// ─── Drag-and-drop types ───────────────────────────────────────────────────────
type DragState = {
  draggedId: string | null;
  overId: string | null;
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function NavbarItemsPage() {
  const { toast } = useToast();
  const hasFetched = useRef(false);

  // Data
  const [navItems, setNavItems] = useState<NavbarItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // UI State
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addType, setAddType] = useState<NavbarItemType>("department");
  const [selectedCode, setSelectedCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Drag state
  const [drag, setDrag] = useState<DragState>({
    draggedId: null,
    overId: null,
  });
  const dragCounter = useRef(0);

  // ── Load initial data ─────────────────────────────────────────────────────────
  useEffect(() => {
    const stored = loadFromStorage();
    setNavItems(stored);

    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchAll = async () => {
      setLoading(true);
      try {
        const [depRes, catRes] = await Promise.all([
          api.get("/departments"),
          api.get("/categories"),
        ]);
        if (depRes.data.success) setDepartments(depRes.data.data);
        if (catRes.data.success) setCategories(catRes.data.data);
      } catch (err) {
        console.error("Failed to fetch data", err);
        toast({
          title: "Failed to load data",
          description: "Could not fetch departments and categories.",
          type: "error",
          duration: 3000,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [toast]);

  // ── Derived helpers ────────────────────────────────────────────────────────────
  const addedCodes = new Set(navItems.map((i) => `${i.type}:${i.code}`));

  const availableDepartments = departments.filter(
    (d) => !addedCodes.has(`department:${d.dep_code}`),
  );
  const availableCategories = categories.filter(
    (c) => !addedCodes.has(`category:${c.cat_code}`),
  );

  // ── Add item ──────────────────────────────────────────────────────────────────
  const handleAdd = () => {
    if (!selectedCode) {
      toast({
        title: "Please select an item",
        description: `Choose a ${addType} from the dropdown.`,
        type: "error",
        duration: 2000,
      });
      return;
    }

    let name = "";
    let imageUrl = "";

    if (addType === "department") {
      const dep = departments.find((d) => d.dep_code === selectedCode);
      if (!dep) return;
      name = dep.dep_name;
      imageUrl = dep.dep_image_url || "";
    } else {
      const cat = categories.find((c) => c.cat_code === selectedCode);
      if (!cat) return;
      name = cat.cat_name;
      imageUrl = cat.cat_image_url || "";
    }

    const newItem: NavbarItem = {
      id: `${addType}-${selectedCode}-${Date.now()}`,
      type: addType,
      code: selectedCode,
      name,
      imageUrl,
      visible: true,
      order: navItems.length + 1,
    };

    const updated = [...navItems, newItem].map((item, idx) => ({
      ...item,
      order: idx + 1,
    }));

    setNavItems(updated);
    setHasUnsavedChanges(true);
    setSelectedCode("");
    setAddDialogOpen(false);
  };

  // ── Remove item ───────────────────────────────────────────────────────────────
  const handleRemove = (id: string) => {
    const updated = navItems
      .filter((i) => i.id !== id)
      .map((item, idx) => ({ ...item, order: idx + 1 }));
    setNavItems(updated);
    setHasUnsavedChanges(true);
  };

  // ── Toggle visibility ─────────────────────────────────────────────────────────
  const handleToggleVisible = (id: string) => {
    setNavItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, visible: !item.visible } : item,
      ),
    );
    setHasUnsavedChanges(true);
  };

  // ── Move item (buttons) ───────────────────────────────────────────────────────
  const moveItem = (id: string, direction: "up" | "down") => {
    const idx = navItems.findIndex((i) => i.id === id);
    if (idx === -1) return;
    const newItems = [...navItems];
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= newItems.length) return;
    [newItems[idx], newItems[swapIdx]] = [newItems[swapIdx], newItems[idx]];
    setNavItems(newItems.map((item, i) => ({ ...item, order: i + 1 })));
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

    const fromIdx = navItems.findIndex((i) => i.id === draggedId);
    const toIdx = navItems.findIndex((i) => i.id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;

    const newItems = [...navItems];
    const [removed] = newItems.splice(fromIdx, 1);
    newItems.splice(toIdx, 0, removed);

    setNavItems(newItems.map((item, idx) => ({ ...item, order: idx + 1 })));
    setHasUnsavedChanges(true);
    setDrag({ draggedId: null, overId: null });
  };

  const handleDragEnd = () => {
    dragCounter.current = 0;
    setDrag({ draggedId: null, overId: null });
  };

  // ── Save ──────────────────────────────────────────────────────────────────────
  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      saveToStorage(navItems);
      setHasUnsavedChanges(false);
      setSaving(false);
      toast({
        title: "Saved successfully",
        description: "Navbar configuration has been saved.",
        type: "success",
        duration: 2500,
      });
    }, 400);
  };

  // ── Reset ─────────────────────────────────────────────────────────────────────
  const handleReset = () => {
    const stored = loadFromStorage();
    setNavItems(stored);
    setHasUnsavedChanges(false);
    toast({
      title: "Changes discarded",
      description: "Reverted to the last saved configuration.",
      type: "info",
      duration: 2000,
    });
  };

  // ── Open add dialog ───────────────────────────────────────────────────────────
  const openAddDialog = (type: NavbarItemType) => {
    setAddType(type);
    setSelectedCode("");
    setAddDialogOpen(true);
  };

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10">
              <Globe className="w-3.5 h-3.5 text-primary" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight">
              Navbar Items
            </h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Manage and reorder the navigation items for your e-commerce website.
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
            <Save className="w-3.5 h-3.5" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: Item list ── */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <h2 className="font-medium text-sm">Current Navbar Items</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Drag to reorder · {navItems.length} item
                  {navItems.length !== 1 ? "s" : ""}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs"
                  onClick={() => openAddDialog("department")}
                >
                  <Plus className="w-3 h-3" />
                  Department
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs"
                  onClick={() => openAddDialog("category")}
                >
                  <Plus className="w-3 h-3" />
                  Category
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  <p className="text-xs text-muted-foreground">
                    Loading departments & categories…
                  </p>
                </div>
              ) : navItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                    <Layers className="w-6 h-6 text-neutral-400" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">No navbar items yet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Add departments or categories using the buttons above.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => openAddDialog("department")}
                      className="gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Department
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openAddDialog("category")}
                      className="gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Category
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {navItems.map((item, idx) => {
                    const isDragging = drag.draggedId === item.id;
                    const isOver = drag.overId === item.id;

                    return (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item.id)}
                        onDragEnter={(e) => handleDragEnter(e, item.id)}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, item.id)}
                        onDragEnd={handleDragEnd}
                        className={cn(
                          "group flex items-center gap-3 p-3 rounded-xl border transition-all duration-150 cursor-grab active:cursor-grabbing select-none",
                          isDragging
                            ? "opacity-40 scale-95 border-dashed border-primary/40 bg-primary/5"
                            : isOver
                              ? "border-primary/60 bg-primary/5 shadow-sm scale-[1.01]"
                              : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-white dark:bg-neutral-950 hover:shadow-sm",
                          !item.visible && "opacity-60",
                        )}
                      >
                        {/* Drag handle */}
                        <div className="text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 flex-shrink-0">
                          <GripVertical className="w-4 h-4" />
                        </div>

                        {/* Position badge */}
                        <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                          <span className="text-[10px] font-bold">
                            {idx + 1}
                          </span>
                        </div>

                        {/* Type icon */}
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10 text-primary">
                          {item.type === "department" ? (
                            <FolderOpen className="w-4 h-4" />
                          ) : (
                            <Tag className="w-4 h-4" />
                          )}
                        </div>

                        {/* Label */}
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              "text-sm font-medium truncate",
                              !item.visible && "line-through text-neutral-400",
                            )}
                          >
                            {item.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {item.code}
                          </p>
                        </div>

                        {/* Type badge */}
                        <Badge
                          variant="outline"
                          className="text-[10px] px-2 py-0.5 h-6 hidden sm:flex flex-shrink-0 bg-primary/5 text-primary border-primary/10"
                        >
                          {item.type}
                        </Badge>

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                            onClick={() => moveItem(item.id, "up")}
                            disabled={idx === 0}
                            title="Move up"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                            onClick={() => moveItem(item.id, "down")}
                            disabled={idx === navItems.length - 1}
                            title="Move down"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                            onClick={() => handleToggleVisible(item.id)}
                            title={item.visible ? "Hide item" : "Show item"}
                          >
                            {item.visible ? (
                              <Eye className="w-3.5 h-3.5 text-neutral-500" />
                            ) : (
                              <EyeOff className="w-3.5 h-3.5 text-neutral-400" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600"
                            onClick={() => handleRemove(item.id)}
                            title="Remove from navbar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Right: Preview + Info ── */}
        <div className="space-y-4">
          {/* Preview panel */}
          <Card>
            <CardHeader className="pb-3">
              <h2 className="font-medium text-sm flex items-center gap-2">
                <Globe className="w-4 h-4 text-muted-foreground" />
                Website Preview
              </h2>
              <p className="text-xs text-muted-foreground">
                How the navbar will appear to visitors.
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              {/* Mock browser bar */}
              <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                <div className="flex items-center gap-1.5 px-3 py-2 bg-neutral-100 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  <span className="w-2 h-2 rounded-full bg-yellow-400" />
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                  <div className="flex-1 mx-2 h-4 rounded bg-white dark:bg-neutral-700 px-2 flex items-center">
                    <span className="text-[9px] text-neutral-400 truncate">
                      {/* yourstore.com */}
                      venpaaapp.onimtaitsl.com
                    </span>
                  </div>
                </div>

                {/* Simulated navbar */}
                <div className="p-3 bg-white dark:bg-neutral-900">
                  {/* Nav items strip */}
                  <div className="flex gap-2 flex-wrap">
                    {navItems.filter((i) => i.visible).length === 0 ? (
                      <div className="w-full py-2 text-center">
                        <p className="text-[10px] text-neutral-400">
                          No visible items
                        </p>
                      </div>
                    ) : (
                      navItems
                        .filter((i) => i.visible)
                        .map((item) => (
                          <div
                            key={item.id}
                            className="px-2 py-0.5 rounded text-[9px] font-medium bg-primary/10 text-primary"
                          >
                            {item.name}
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Add Item Dialog ── */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-primary/10 text-primary">
                {addType === "department" ? (
                  <FolderOpen className="w-4 h-4" />
                ) : (
                  <Tag className="w-4 h-4" />
                )}
              </div>
              Add {addType === "department" ? "Department" : "Category"}
            </DialogTitle>
          </DialogHeader>

          <div className="py-2 space-y-4">
            {/* Type toggle */}
            <div className="flex rounded-lg border border-neutral-200 dark:border-neutral-800 p-1 gap-1">
              <button
                onClick={() => {
                  setAddType("department");
                  setSelectedCode("");
                }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-all",
                  addType === "department"
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800",
                )}
              >
                <FolderOpen className="w-3 h-3" />
                Department
              </button>
              <button
                onClick={() => {
                  setAddType("category");
                  setSelectedCode("");
                }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-all",
                  addType === "category"
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800",
                )}
              >
                <Tag className="w-3 h-3" />
                Category
              </button>
            </div>

            {/* Select */}
            <div>
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">
                Select {addType === "department" ? "Department" : "Category"}
              </label>
              <Select value={selectedCode} onValueChange={setSelectedCode}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={`Choose a ${addType}…`} />
                </SelectTrigger>
                <SelectContent>
                  {addType === "department" ? (
                    availableDepartments.length === 0 ? (
                      <div className="py-3 text-center text-xs text-muted-foreground">
                        All departments already added
                      </div>
                    ) : (
                      availableDepartments.map((d) => (
                        <SelectItem key={d.dep_code} value={d.dep_code}>
                          {d.dep_name}
                          <span className="ml-1 text-neutral-400">
                            ({d.dep_code})
                          </span>
                        </SelectItem>
                      ))
                    )
                  ) : availableCategories.length === 0 ? (
                    <div className="py-3 text-center text-xs text-muted-foreground">
                      All categories already added
                    </div>
                  ) : (
                    availableCategories.map((c) => (
                      <SelectItem key={c.cat_code} value={c.cat_code}>
                        {c.cat_name}
                        <span className="ml-1 text-neutral-400">
                          ({c.cat_code})
                        </span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleAdd} disabled={!selectedCode}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add to Navbar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
