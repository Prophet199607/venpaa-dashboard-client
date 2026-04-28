"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { cn } from "@/utils/cn";
import { nodeApi } from "@/utils/api-node";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Eye,
  EyeOff,
  Loader2,
  Tag,
  Calendar,
  Banknote,
  Percent,
  TrendingUp,
  Pencil,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface CouponAsset {
  id: number;
  code: string;
  description: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_value: number;
  max_discount: number;
  start_date: string | null;
  end_date: string | null;
  usage_limit: number | null;
  used_count: number;
  is_active: boolean;
}

interface CouponItem extends CouponAsset {
  // We can add frontend specific fields if needed
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function CouponsManagementPage() {
  const { toast } = useToast();

  // ── Data State ────────────────────────────────────────────────────────────────
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [originalCoupons, setOriginalCoupons] = useState<CouponItem[]>([]);

  // ── UI State ──────────────────────────────────────────────────────────────────
  const [fetching, setFetching] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const fetchedOnce = useRef(false);

  // ── New Coupon State ────────────────────────────────────────────────────────────
  const [newCode, setNewCode] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newType, setNewType] = useState<"percentage" | "fixed">("percentage");
  const [newAmount, setNewAmount] = useState("");
  const [newMinOrder, setNewMinOrder] = useState("0");
  const [newMaxDiscount, setNewMaxDiscount] = useState("0");
  const [newStartDate, setNewStartDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");
  const [newLimit, setNewLimit] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);

  // ── Fetch Logic ──────────────────────────────────────────────────────────────
  const fetchCoupons = useCallback(
    async (isInitial = false) => {
      if (isInitial && fetchedOnce.current) return;
      if (isInitial) fetchedOnce.current = true;

      setFetching(true);
      try {
        const res = await nodeApi.get("/coupons", {
          validateStatus: (status) =>
            (status >= 200 && status < 300) || status === 404,
        });

        if (res.status === 404) {
          setCoupons([]);
          setOriginalCoupons([]);
          setHasUnsavedChanges(false);
          return;
        }

        const data = res.data?.data ?? [];
        setCoupons(data);
        setOriginalCoupons(data);
        setHasUnsavedChanges(false);
      } catch (err: any) {
        if (!err.message?.includes("404")) {
          toast({
            title: "Fetch failed",
            description: "Could not load coupons from the server.",
            type: "error",
          });
        }
      } finally {
        setFetching(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    fetchCoupons(true);
  }, [fetchCoupons]);

  // ── Handlers ──────────────────────────────────────────────────────────────────

  const resetDialog = () => {
    setNewCode("");
    setNewDescription("");
    setNewType("percentage");
    setNewAmount("");
    setNewMinOrder("0");
    setNewMaxDiscount("0");
    setNewStartDate("");
    setNewEndDate("");
    setNewLimit("");
    setEditingId(null);
  };

  const formatDateForInput = (dateString: string | null) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      return date.toISOString().split("T")[0];
    } catch {
      return "";
    }
  };

  const handleOpenEdit = (coupon: CouponItem) => {
    setNewCode(coupon.code);
    setNewDescription(coupon.description || "");
    setNewType(coupon.discount_type);
    setNewAmount(coupon.discount_value.toString());
    setNewMinOrder(coupon.min_order_value.toString());
    setNewMaxDiscount(coupon.max_discount.toString());
    setNewStartDate(formatDateForInput(coupon.start_date));
    setNewEndDate(formatDateForInput(coupon.end_date));
    setNewLimit(coupon.usage_limit ? coupon.usage_limit.toString() : "");
    setEditingId(coupon.id);
    setAddDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!newCode || !newAmount) {
      toast({
        title: "Missing fields",
        description: "Please fill in the coupon code and amount.",
        type: "error",
      });
      return;
    }

    setAdding(true);
    try {
      const body = {
        code: newCode.toUpperCase().trim(),
        description: newDescription.trim() || null,
        discount_type: newType,
        discount_value: parseFloat(newAmount),
        min_order_value: parseFloat(newMinOrder || "0"),
        max_discount: parseFloat(newMaxDiscount || "0"),
        start_date: newStartDate ? new Date(newStartDate).toISOString() : null,
        end_date: newEndDate ? new Date(newEndDate).toISOString() : null,
        usage_limit: newLimit ? parseInt(newLimit) : null,
        is_active: editingId
          ? (coupons.find((c) => c.id === editingId)?.is_active ?? true)
          : true,
      };

      if (editingId) {
        await nodeApi.put(`/coupons/${editingId}`, body);
        toast({
          title: "Coupon updated",
          description: `Successfully updated coupon ${body.code}`,
          type: "success",
        });
      } else {
        await nodeApi.post("/coupons", body);
        toast({
          title: "Coupon created",
          description: `Successfully created coupon ${body.code}`,
          type: "success",
        });
      }

      resetDialog();
      setAddDialogOpen(false);
      fetchCoupons(); // Refresh list
    } catch (err: any) {
      toast({
        title: "Creation failed",
        description:
          err.response?.data?.message ||
          err.message ||
          "Could not create the coupon.",
        type: "error",
      });
    } finally {
      setAdding(false);
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await nodeApi.patch(`/coupons/${id}/toggle`);
      setCoupons((prev) =>
        prev.map((c) => (c.id === id ? { ...c, is_active: !c.is_active } : c)),
      );
      setOriginalCoupons((prev) =>
        prev.map((c) => (c.id === id ? { ...c, is_active: !c.is_active } : c)),
      );
      toast({
        title: "Status updated",
        description: "Coupon visibility has been toggled.",
        type: "success",
      });
    } catch (err: any) {
      toast({
        title: "Toggle failed",
        description: "Could not update the coupon status.",
        type: "error",
      });
    }
  };

  const handleRemove = async (id: number) => {
    try {
      await nodeApi.delete(`/coupons/${id}`);
      setCoupons((prev) => prev.filter((c) => c.id !== id));
      toast({
        title: "Deleted",
        description: "Coupon removed successfully.",
        type: "success",
      });
    } catch (err: any) {
      toast({
        title: "Delete failed",
        description: "Could not delete the coupon.",
        type: "error",
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Find what actually changed (comparing with original deep data)
      const changes = coupons.filter((c) => {
        const original = originalCoupons.find((o) => o.id === c.id);
        if (!original) return false;

        return (
          original.is_active !== c.is_active ||
          original.code !== c.code ||
          original.description !== c.description ||
          original.discount_value !== c.discount_value ||
          original.min_order_value !== c.min_order_value ||
          original.max_discount !== c.max_discount ||
          original.usage_limit !== c.usage_limit ||
          original.start_date !== c.start_date ||
          original.end_date !== c.end_date
        );
      });

      const promises = changes.map((c) => {
        return nodeApi.put(`/coupons/${c.id}`, {
          code: c.code,
          description: c.description,
          discount_type: c.discount_type,
          discount_value: c.discount_value,
          min_order_value: c.min_order_value,
          max_discount: c.max_discount,
          start_date: c.start_date,
          end_date: c.end_date,
          usage_limit: c.usage_limit,
          is_active: c.is_active,
        });
      });

      await Promise.all(promises);

      setOriginalCoupons(coupons);
      setHasUnsavedChanges(false);
      toast({
        title: "Changes saved",
        description: "Coupon settings updated successfully.",
        type: "success",
      });
    } catch (err: any) {
      toast({
        title: "Save failed",
        description: "Could not sync some changes.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setCoupons(originalCoupons);
    setHasUnsavedChanges(false);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <Tag className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight">
              Coupon Management
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Generate promotion codes and manage discount availability.
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
          {/* <Button
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
          </Button> */}
          <Button
            size="sm"
            onClick={() => setAddDialogOpen(true)}
            className="gap-2 rounded-full px-6 bg-neutral-900 text-white hover:bg-neutral-800 transition-all dark:bg-neutral-100 dark:text-neutral-900"
          >
            <Plus className="w-4 h-4" />
            New Coupon
          </Button>
        </div>
      </div>

      {fetching ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <span className="text-sm font-medium text-muted-foreground">
            Loading coupons...
          </span>
        </div>
      ) : coupons.length === 0 ? (
        <Card className="border-dashed border-2 flex flex-col items-center justify-center py-24 px-4 text-center rounded-3xl bg-neutral-50/50 dark:bg-neutral-900/10">
          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-neutral-800 shadow-xl flex items-center justify-center mb-6">
            <Tag className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-xl tracking-tight">No coupons found</h3>
          <p className="text-sm text-muted-foreground max-w-xs mt-2 mb-6 lowercase">
            START BY CREATING YOUR FIRST PROMOTIONAL CODE.
          </p>
          <Button
            onClick={() => setAddDialogOpen(true)}
            className="gap-2 rounded-full px-6 h-10 shadow-xl shadow-primary/20"
          >
            <Plus className="w-5 h-5" />
            Create First Coupon
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coupons.map((coupon) => (
            <CouponCard
              key={coupon.id}
              coupon={coupon}
              onToggleActive={handleToggleStatus}
              onRemove={handleRemove}
              onEdit={handleOpenEdit}
            />
          ))}
        </div>
      )}

      {/* ── Add Dialog ── */}
      <Dialog
        open={addDialogOpen}
        onOpenChange={(open) => {
          setAddDialogOpen(open);
          if (!open) resetDialog();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Tag className="w-4 h-4 text-primary" />
              </div>
              {editingId ? "Update Coupon" : "Create New Coupon"}
            </DialogTitle>
          </DialogHeader>

          <div className="py-2 space-y-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                Coupon Code
              </Label>
              <Input
                placeholder="e.g. SUMMER25"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                className="rounded-xl h-12 focus:ring-primary/20 transition-all font-mono tracking-widest text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                Description
              </Label>
              <Input
                placeholder="Give this coupon a short title or description"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="rounded-xl h-12 focus:ring-primary/20 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                  Discount Type
                </Label>
                <Select
                  value={newType}
                  onValueChange={(v: any) => setNewType(v)}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount (Rs)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                  Amount
                </Label>
                <div className="relative">
                  {newType === "percentage" ? (
                    <Percent className="absolute right-3 top-2 w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Banknote className="absolute right-3 top-2 w-4 h-4 text-muted-foreground" />
                  )}
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="rounded-xl h-12 focus:ring-primary/20 transition-all pr-10"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                  Min Order Value
                </Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={newMinOrder}
                  onChange={(e) => setNewMinOrder(e.target.value)}
                  className="rounded-xl h-12 focus:ring-primary/20 transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                  Max Discount
                </Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={newMaxDiscount}
                  onChange={(e) => setNewMaxDiscount(e.target.value)}
                  className="rounded-xl h-12 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                  Usage Limit
                </Label>
                <Input
                  type="number"
                  placeholder="Unlimited"
                  value={newLimit}
                  onChange={(e) => setNewLimit(e.target.value)}
                  className="rounded-xl h-12 focus:ring-primary/20 transition-all"
                />
              </div>
              <div className="space-y-2 disabled">
                {/* Spacer or additional logic */}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                  Start Date
                </Label>
                <Input
                  type="date"
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                  className="rounded-xl h-12 focus:ring-primary/20 transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                  End Date
                </Label>
                <Input
                  type="date"
                  value={newEndDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                  className="rounded-xl h-12 focus:ring-primary/20 transition-all"
                />
              </div>
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
              onClick={handleSubmit}
              disabled={adding || !newCode || !newAmount}
              className="gap-2 rounded-full px-8 shadow-lg shadow-primary/10"
            >
              {adding ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {editingId ? "Saving…" : "Creating…"}
                </>
              ) : (
                <>
                  {editingId ? (
                    <Save className="w-4 h-4" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {editingId ? "Save Changes" : "Create Coupon"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── CouponCard ─────────────────────────────────────────────────────────────

function CouponCard({
  coupon,
  onToggleActive,
  onRemove,
  onEdit,
}: {
  coupon: CouponItem;
  onToggleActive: (id: number) => void;
  onRemove: (id: number) => void;
  onEdit: (coupon: CouponItem) => void;
}) {
  const isExpired = coupon.end_date && new Date(coupon.end_date) < new Date();

  return (
    <Card
      className={cn(
        "relative group overflow-hidden border transition-all duration-500 rounded-3xl bg-white dark:bg-neutral-950",
        !coupon.is_active
          ? "opacity-70 grayscale-[0.5]"
          : "hover:shadow-2xl hover:shadow-primary/5",
        isExpired && "border-red-200 bg-red-50/10",
      )}
    >
      <div className="p-4">
        {/* Top: Status and Icon */}
        <div className="flex items-start justify-between mb-4">
          <div
            className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center",
              coupon.is_active
                ? "bg-primary/10 text-primary"
                : "bg-neutral-100 text-neutral-400",
            )}
          >
            <Tag className="w-6 h-6" />
          </div>
          <div className="flex items-center gap-2">
            {isExpired && (
              <Badge
                variant="destructive"
                className="rounded-full px-2 py-0.5 text-[10px] uppercase font-bold tracking-widest bg-red-500 text-white border-none"
              >
                Expired
              </Badge>
            )}
            <Badge
              className={cn(
                "rounded-full px-3 py-1 text-[11px] font-bold tracking-wider",
                coupon.is_active
                  ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border-none"
                  : "bg-neutral-100 text-neutral-500 border-none",
              )}
            >
              {coupon.is_active ? "Active" : "Disabled"}
            </Badge>
          </div>
        </div>

        {/* Coupon Code and Discount */}
        <div className="space-y-3 mb-4">
          <div>
            <h3 className="text-xl font-bold font-mono tracking-widest text-neutral-900 dark:text-white uppercase">
              {coupon.code}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              {coupon.discount_type === "percentage" ? (
                <Percent className="w-3 h-3 text-primary" />
              ) : (
                <Banknote className="w-3 h-3 text-primary" />
              )}
              <span className="text-2xl font-black text-neutral-900 dark:text-white">
                {coupon.discount_value}
                {coupon.discount_type === "percentage" ? "%" : ""}
                <span className="text-xs font-medium text-muted-foreground ml-1">
                  OFF
                </span>
              </span>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 gap-3 py-3 border-y border-neutral-100 dark:border-neutral-800">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                Used
              </span>
              <div className="flex items-center gap-1.5 font-bold">
                <TrendingUp className="w-3 h-3 text-emerald-500" />
                <span>{coupon.used_count || 0}</span>
                {coupon.usage_limit && (
                  <span className="text-xs font-medium text-muted-foreground">
                    / {coupon.usage_limit}
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                Min Spend
              </span>
              <div className="flex items-center gap-1.5 font-bold">
                <Banknote className="w-3 h-3 text-neutral-400" />
                <span>{coupon.min_order_value}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer: Date and Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span className="text-xs font-semibold">
              {coupon.end_date
                ? new Date(coupon.end_date).toLocaleDateString()
                : "No Expiry"}
            </span>
          </div>

          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full text-neutral-400 hover:text-primary hover:bg-primary/5"
              onClick={() => onEdit(coupon)}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-9 w-9 rounded-full",
                coupon.is_active
                  ? "text-primary hover:bg-primary/5"
                  : "text-neutral-400 hover:bg-neutral-100",
              )}
              onClick={() => onToggleActive(coupon.id)}
            >
              {coupon.is_active ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full text-neutral-400 hover:text-red-500 hover:bg-red-50"
              onClick={() => onRemove(coupon.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Visual Decoration */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-[4rem] -mr-8 -mt-8 blur-2xl group-hover:bg-primary/10 transition-colors" />
    </Card>
  );
}
