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
  BarChart3,
  Tag,
  Store,
  UserCircle,
  Percent,
  Warehouse,
} from "lucide-react";

export type NavItem = {
  label: string;
  icon?: LucideIcon;
  href?: string;
  children?: {
    label: string;
    href: string;
    icon?: LucideIcon;
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
          },
          {
            href: "/dashboard/master/supplier",
            label: "Suppliers",
            icon: Truck,
          },
          {
            href: "/dashboard/master/location",
            label: "Locations",
            icon: MapPin,
          },
          {
            href: "/dashboard/master/product",
            label: "Products",
            icon: Box,
          },
          {
            href: "/dashboard/master/customer",
            label: "Customers",
            icon: User,
          },
          {
            href: "/dashboard/master/price-level",
            label: "Price Level",
            icon: Tag,
          },
          { label: "divider", href: "#", divider: true },
          {
            href: "/dashboard/master/publisher",
            label: "Publishers",
            icon: BookMarked,
          },
          { href: "/dashboard/master/author", label: "Authors", icon: PenTool },
          { href: "/dashboard/master/book", label: "Books", icon: BookOpen },
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
          },
          {
            href: "/dashboard/transactions/pending-item-request",
            label: "Pending Item Request",
            icon: FileClock,
          },
          {
            href: "/dashboard/transactions/purchase-order",
            label: "Purchase Order",
            icon: ShoppingCart,
          },
          { label: "divider", href: "#", divider: true },
          {
            href: "/dashboard/transactions/good-receive-note",
            label: "Good Receive Note",
            icon: Package,
          },
          {
            href: "/dashboard/transactions/supplier-return-note",
            label: "Supplier Return",
            icon: Undo2,
          },
          {
            href: "/dashboard/transactions/stock-adjustment",
            label: "Stock Adjustment",
            icon: FileEdit,
          },
          { label: "divider", href: "#", divider: true },
          {
            href: "/dashboard/transactions/transfer-good-note",
            label: "Transfer Good Note",
            icon: Repeat,
          },
          {
            href: "/dashboard/transactions/accept-good-note",
            label: "Accept Good Note",
            icon: ClipboardCheck,
          },
          {
            href: "/dashboard/transactions/transfer-good-return",
            label: "Transfer Good Return",
            icon: RotateCcw,
          },
          { label: "divider", href: "#", divider: true },
          {
            href: "/dashboard/transactions/product-discard",
            label: "Product Discard",
            icon: Trash2,
          },
          { label: "divider", href: "#", divider: true },
          {
            href: "/dashboard/transactions/open-stock",
            label: "Open Stock",
            icon: Warehouse,
          },
        ],
      },
      {
        label: "Invoice",
        icon: FileText,
        href: "/dashboard/invoice",
      },
      {
        label: "Payments",
        icon: CreditCard,
        children: [
          {
            href: "/dashboard/payments/advance-payment",
            label: "Advance Payment",
            icon: Wallet,
          },
          {
            href: "/dashboard/payments/customer-receipt",
            label: "Customer Receipt",
            icon: FileText,
          },
          {
            href: "/dashboard/payments/payment-voucher",
            label: "Payment Voucher",
            icon: Banknote,
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
          },
          {
            href: "/dashboard/roles",
            label: "Roles",
            icon: ShieldCheck,
          },
          {
            href: "/dashboard/permissions",
            label: "Permissions",
            icon: LockKeyhole,
          },
          {
            href: "/dashboard/roles/assign-permissions",
            label: "Permissions Assigning",
            icon: KeySquare,
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
          },
          {
            href: "/dashboard/sales/salesman",
            label: "Salesman",
            icon: UserCircle,
          },
          {
            href: "/dashboard/sales/discounts",
            label: "Manage Discounts",
            icon: Percent,
          },
        ],
      },
    ],
  },
  {
    title: "Reports",
    items: [
      {
        label: "Inventory Reports",
        icon: BarChart3,
        children: [
          {
            href: "/dashboard/reports/stock-summary",
            label: "Stock Summary",
            icon: FileText,
          },
        ],
      },
    ],
  },
];
