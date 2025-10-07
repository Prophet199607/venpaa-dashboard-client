import {
  type LucideIcon,
  LayoutDashboard,
  Archive,
  ArrowRightLeft,
  ShoppingCart,
  PackageCheck,
  FileEdit,
  Repeat,
  Building2,
  MapPin,
  BookOpen,
  BookMarked,
  Truck,
  PenTool
} from 'lucide-react';

export type NavItem = {
  label: string;
  icon?: LucideIcon;
  href?: string;
  children?: { label: string; href: string; icon?: LucideIcon }[];
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export const navSections: NavSection[] = [
  {
    title: 'Dashboards',
    items: [
      {
        href: '/dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard
      }
    ]
  },
  {
    title: 'Pages',
    items: [
      {
        label: 'Master Files',
        icon: Archive,
        children: [
          {
            href: '/dashboard/master/department',
            label: 'Departments',
            icon: Building2
          },
          {
            href: '/dashboard/master/location',
            label: 'Location',
            icon: MapPin
          },
          { href: '/dashboard/master/book', label: 'Books', icon: BookOpen },
          {
            href: '/dashboard/master/publisher',
            label: 'Publishers',
            icon: BookMarked
          },
          {
            href: '/dashboard/master/supplier',
            label: 'Suppliers',
            icon: Truck
          },
          { href: '/dashboard/master/author', label: 'Authors', icon: PenTool }
        ]
      }
      // {
      //   label: "Transactions",
      //   icon: ArrowRightLeft,
      //   children: [
      //     {
      //       href: "/dashboard/transactions/purchase-order",
      //       label: "Purchase Order",
      //       icon: ShoppingCart,
      //     },
      //     {
      //       href: "/dashboard/transactions/stock-adjustment",
      //       label: "Stock Adjustment",
      //       icon: FileEdit,
      //     },
      //     {
      //       href: "/dashboard/transactions/good-receive-note",
      //       label: "Good Receive Note",
      //       icon: PackageCheck,
      //     },
      //     {
      //       href: "/dashboard/transactions/transfer-good-note",
      //       label: "Transfer Good Note",
      //       icon: Repeat,
      //     },
      //   ],
      // },
    ]
  }
];
