"use client";

import { useEffect, useState, useCallback } from "react";
import { nodeApi } from "@/utils/api-node";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  User,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  Package,
  Calendar,
  CreditCard,
  Globe,
  Building2,
  Hash,
  MapPin as MapPinIcon,
} from "lucide-react";

interface Customer {
  id: number;
  fname: string;
  lname: string;
  email: string;
  phone: string;
  country: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  auth_provider: string;
  platform: string;
  status: number;
}

interface Product {
  prod_code: string;
  prod_name: string;
  prod_image: string;
  quantity: number;
  selling_price: number;
  marked_price: number;
  discount: number;
  dis_per: number;
  department: string;
  category: string;
  sub_category: string;
  status: number;
}

interface Order {
  record_type: string;
  order_id: number;
  type: number;
  type_name: string;
  location: string;
  location_name: string;
  order_status: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
  products: Product[];
}

interface OrderDetails {
  user: Customer;
  total_orders: number;
  orders: Order[];
}

interface CustomerOrdersDialogProps {
  isOpen: boolean;
  customer: Customer | null;
  onClose: () => void;
}

export default function CustomerOrdersDialog({
  isOpen,
  customer,
  onClose,
}: CustomerOrdersDialogProps) {
  const { toast } = useToast();
  const [data, setData] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!customer) return;
    setLoading(true);
    try {
      const { data: res } = await nodeApi.get(
        `/customers/${customer.id}/order-products`,
      );
      setData(res);
    } catch (err: any) {
      toast({
        title: "Failed to fetch orders",
        description: err.response?.data?.message || err.message,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [customer, toast]);

  useEffect(() => {
    if (isOpen && customer) {
      fetchOrders();
    } else {
      setData(null);
    }
  }, [isOpen, customer, fetchOrders]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
    });
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, string> = {
      pending: "bg-amber-50 text-amber-700 border-amber-200",
      confirmed: "bg-blue-50 text-blue-700 border-blue-200",
      processing: "bg-indigo-50 text-indigo-700 border-indigo-200",
      shipped: "bg-purple-50 text-purple-700 border-purple-200",
      delivery: "bg-teal-50 text-teal-700 border-teal-200",
      canceled: "bg-red-50 text-red-700 border-red-200",
      success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    };
    return (
      config[status] || "bg-neutral-50 text-neutral-700 border-neutral-200"
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            {customer?.fname} {customer?.lname}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-muted-foreground gap-3">
            <Loader2 className="w-6 h-6 animate-spin opacity-50" />
            <p className="text-sm">Loading order details...</p>
          </div>
        ) : data ? (
          <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-4">
            {/* Customer Details Card */}
            <div className="rounded-xl border bg-card p-4 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-primary">
                <User className="w-4 h-4" />
                Customer Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span>{data.user.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-3.5 h-3.5 shrink-0" />
                  <span>{data.user.phone || "-"}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Globe className="w-3.5 h-3.5 shrink-0" />
                  <span>{data.user.country || "-"}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {[data.user.address, data.user.city, data.user.province]
                      .filter(Boolean)
                      .join(", ") || "-"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Hash className="w-3.5 h-3.5 shrink-0" />
                  <span>Postal: {data.user.postal_code || "-"}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-xs">
                    {data.user.platform === "1"
                      ? "Android"
                      : data.user.platform === "2"
                        ? "iOS"
                        : data.user.platform === "3"
                          ? "Web"
                          : "-"}
                  </span>
                </div>
              </div>
            </div>

            {/* Orders Summary */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShoppingBag className="w-4 h-4" />
              <span className="font-semibold text-foreground">
                Total Orders: {data.total_orders}
              </span>
            </div>

            {/* Orders List */}
            {data.orders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No orders found for this customer.
              </div>
            ) : (
              <div className="space-y-3">
                {data.orders.map((order) => (
                  <div
                    key={order.order_id}
                    className="rounded-xl border bg-card overflow-hidden"
                  >
                    {/* Order Header */}
                    <div className="flex items-center justify-between flex-wrap gap-2 p-3 bg-muted/30 border-b">
                      <div className="flex items-center gap-3 text-sm">
                        <span className="font-semibold">
                          Order #{order.order_id}
                        </span>

                        <Badge
                          variant="outline"
                          className={`capitalize ${getStatusBadge(order.order_status)}`}
                        >
                          O : {order.order_status}
                        </Badge>

                        <Badge
                          variant="outline"
                          className={`capitalize ${getStatusBadge(order.payment_status)}`}
                        >
                          P : {order.payment_status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(order.created_at)}
                        </span>
                        {order.type_name && (
                          <span className="flex items-center gap-1">
                            <CreditCard className="w-3 h-3" />
                            {order.type_name}
                          </span>
                        )}
                        {order.location_name && (
                          <span className="flex items-center gap-1">
                            <MapPinIcon className="w-3 h-3" />
                            {order.location_name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Order Products */}
                    <div className="divide-y">
                      {order.products.map((product, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-3 p-3 text-sm hover:bg-muted/20 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <Package className="w-4 h-4 shrink-0 text-muted-foreground" />
                            <div className="min-w-0">
                              <p className="font-medium truncate">
                                {product.prod_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Code: {product.prod_code}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-semibold">
                              {formatCurrency(product.selling_price)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {product.quantity} x{" "}
                              {formatCurrency(product.selling_price)}
                              {product.dis_per > 0 && ` (-${product.dis_per}%)`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
