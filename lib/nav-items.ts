import {
  type LucideIcon,
  LayoutDashboard,
  Archive,
  ArrowRightLeft,
  ShoppingCart,
  Package,
  FileEdit,
  Repeat,
  Building2,
  MapPin,
  BookOpen,
  BookMarked,
  Truck,
  PenTool,
  Box,
  Users,
  ShieldCheck,
  KeySquare,
  Undo2,
  UserCog,
  ClipboardPen,
  FileClock,
  ClipboardCheck,
  Wallet,
  FileText,
  Banknote,
  Trash2,
  LockKeyhole,
  RotateCcw,
  CreditCard,
  User,
  Tag,
  Store,
  UserCircle,
  Percent,
  Warehouse,
  Library,
  Globe,
  List,
  HandCoins,
  ShoppingBag,
  Image as ImageIcon,
  PanelTop,
} from "lucide-react";

export type NavItem = {
  label: string;
  icon?: LucideIcon;
  href?: string;
  permission?: string;
  children?: {
    label: string;
    href: string;
    icon?: LucideIcon;
    permission?: string;
    divider?: boolean;
    completed?: boolean;
  }[];
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export const navSections: NavSection[] = [
  {
    title: "Dashboards",
    items: [
      {
        href: "/dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        permission: "view dashboard stats",
      },
    ],
  },
  {
    title: "Pages",
    items: [
      {
        label: "Master Files",
        icon: Archive,
        children: [
          {
            href: "/dashboard/master/department",
            label: "Departments",
            icon: Building2,
            permission: "view department",
          },
          {
            href: "/dashboard/master/supplier",
            label: "Suppliers",
            icon: Truck,
            permission: "view supplier",
          },
          {
            href: "/dashboard/master/location",
            label: "Locations",
            icon: MapPin,
            permission: "view location",
          },
          {
            href: "/dashboard/master/product",
            label: "Products",
            icon: Box,
            permission: "view product",
          },
          {
            href: "/dashboard/master/customer",
            label: "Customers",
            icon: User,
            permission: "view customer",
          },
          {
            href: "/dashboard/master/price-level",
            label: "Price Level",
            icon: Tag,
            permission: "view price-level",
          },
          { label: "divider", href: "#", divider: true },
          {
            href: "/dashboard/master/publisher",
            label: "Publishers",
            icon: BookMarked,
            permission: "view publisher",
          },
          {
            href: "/dashboard/master/author",
            label: "Authors",
            icon: PenTool,
            permission: "view author",
          },
          {
            href: "/dashboard/master/book",
            label: "Books",
            icon: BookOpen,
            permission: "view book",
          },
          {
            href: "/dashboard/master/magazine",
            label: "Magazines",
            icon: Library,
            permission: "view magazine",
          },
        ],
      },
      {
        label: "Transactions",
        icon: ArrowRightLeft,
        children: [
          {
            href: "/dashboard/transactions/item-request",
            label: "Item Request",
            icon: ClipboardPen,
            permission: "view item-request",
          },
          {
            href: "/dashboard/transactions/pending-item-request",
            label: "Pending Item Request",
            icon: FileClock,
            permission: "view item-request",
          },
          {
            href: "/dashboard/transactions/purchase-order",
            label: "Purchase Order",
            icon: ShoppingCart,
            permission: "view purchase-order",
          },
          { label: "divider", href: "#", divider: true },
          {
            href: "/dashboard/transactions/good-receive-note",
            label: "Good Receive Note",
            icon: Package,
            permission: "view good-receive-note",
          },
          {
            href: "/dashboard/transactions/supplier-return-note",
            label: "Supplier Return",
            icon: Undo2,
            permission: "view supplier-return-note",
          },
          {
            href: "/dashboard/transactions/stock-adjustment",
            label: "Stock Adjustment",
            icon: FileEdit,
            permission: "view stock-adjustment",
          },
          { label: "divider", href: "#", divider: true },
          {
            href: "/dashboard/transactions/transfer-good-note",
            label: "Transfer Good Note",
            icon: Repeat,
            permission: "view transfer-good-note",
          },
          {
            href: "/dashboard/transactions/accept-good-note",
            label: "Accept Good Note",
            icon: ClipboardCheck,
            permission: "view accept-good-note",
          },
          {
            href: "/dashboard/transactions/transfer-good-return",
            label: "Transfer Good Return",
            icon: RotateCcw,
            permission: "view transfer-good-return",
          },
          { label: "divider", href: "#", divider: true },
          {
            href: "/dashboard/transactions/product-discard",
            label: "Product Discard",
            icon: Trash2,
            permission: "view product-discard",
          },
          { label: "divider", href: "#", divider: true },
          {
            href: "/dashboard/transactions/open-stock",
            label: "Open Stock",
            icon: Warehouse,
            permission: "manage-open-stock",
          },
        ],
      },
      {
        label: "Invoice",
        icon: FileText,
        href: "/dashboard/invoice",
        permission: "view invoice",
      },
      {
        label: "Payments",
        icon: CreditCard,
        children: [
          {
            href: "/dashboard/payments/advance-payment",
            label: "Advance Payment",
            icon: Wallet,
            permission: "view advance-payment",
          },
          {
            href: "/dashboard/payments/customer-receipt",
            label: "Customer Receipt",
            icon: FileText,
            permission: "view customer-receipt",
          },
          {
            href: "/dashboard/payments/payment-voucher",
            label: "Payment Voucher",
            icon: Banknote,
            permission: "view payment-voucher",
          },
          {
            href: "/dashboard/payments/cod-management",
            label: "COD Management",
            icon: HandCoins,
            permission: "view cod-management",
          },
        ],
      },
      {
        label: "User Management",
        icon: UserCog,
        children: [
          {
            href: "/dashboard/users",
            label: "Users",
            icon: Users,
            permission: "view user",
          },
          {
            href: "/dashboard/roles",
            label: "Roles",
            icon: ShieldCheck,
            permission: "view role",
          },
          {
            href: "/dashboard/permissions",
            label: "Permissions",
            icon: LockKeyhole,
            permission: "view permission",
          },
          {
            href: "/dashboard/roles/assign-permissions",
            label: "Permissions Assigning",
            icon: KeySquare,
            permission: "permission assign",
          },
        ],
      },
      {
        label: "Sales Operations",
        icon: Store,
        children: [
          {
            href: "/dashboard/sales/cashier",
            label: "Cashier",
            icon: CreditCard,
            permission: "view cashier",
          },
          {
            href: "/dashboard/sales/salesman",
            label: "Salesman",
            icon: UserCircle,
            permission: "view salesman",
          },
          {
            href: "/dashboard/sales/discounts",
            label: "Manage Discounts",
            icon: Percent,
            permission: "manage discount",
          },
        ],
      },
    ],
  },
  {
    title: "Order Management",
    items: [
      {
        label: "Orders",
        icon: ShoppingBag,
        href: "/dashboard/orders",
        permission: "view order",
      },
    ],
  },
  {
    title: "Website",
    items: [
      {
        label: "Web Management",
        icon: Globe,
        permission: "view website",
        children: [
          {
            label: "Navbar Items",
            href: "/dashboard/website/navigation",
            icon: List,
          },
          {
            label: "Carousel Slider",
            href: "/dashboard/website/carousel",
            icon: ImageIcon,
          },
          {
            label: "Banners",
            href: "/dashboard/website/banners",
            icon: PanelTop,
          },
        ],
      },
    ],
  },
];

/**
 * Returns the permission string required for a given dashboard path.
 */
export function getPermissionForPath(path: string): string | undefined {
  const normalizedPath = path.replace(/\/$/, "");

  // Collect all base routes with permissions
  const routes: { href: string; permission: string }[] = [];
  for (const section of navSections) {
    for (const item of section.items) {
      if (item.href && item.permission) {
        routes.push({ href: item.href, permission: item.permission });
      }
      if (item.children) {
        for (const child of item.children) {
          if (child.href && child.permission) {
            routes.push({ href: child.href, permission: child.permission });
          }
        }
      }
    }
  }

  // Sort routes by length (longest/most specific first)
  routes.sort((a, b) => b.href.length - a.href.length);

  // Check for exact or sub-route match
  for (const route of routes) {
    const normalizedRoute = route.href.replace(/\/$/, "");

    // Exact match
    if (normalizedPath === normalizedRoute) {
      return route.permission;
    }

    // Sub-route logic (e.g., /create, /edit)
    if (normalizedPath.startsWith(normalizedRoute + "/")) {
      const suffix = normalizedPath.replace(normalizedRoute, "");
      const basePermission = route.permission; // e.g., "view product"

      // Handle common action suffixes
      if (suffix.includes("/create")) {
        return basePermission.replace("view", "create");
      }
      if (suffix.includes("/edit")) {
        return basePermission.replace("view", "edit");
      }

      // Default to the base permission (usually "view")
      return basePermission;
    }
  }

  return undefined;
}
