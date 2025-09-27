import { type LucideIcon, LayoutDashboard, Archive } from "lucide-react";

export type NavItem = {
  label: string;
  icon?: LucideIcon;
  href?: string;
  children?: { label: string; href: string }[];
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
          { href: "/dashboard/master/department", label: "Departments" },
          { href: "/dashboard/master/location", label: "Location" },
          { href: "/dashboard/master/book-type", label: "Book Type" },
          { href: "/dashboard/master/book", label: "Books" },
          { href: "/dashboard/master/publisher", label: "Publishers" },
          { href: "/dashboard/master/supplier", label: "Suppliers" },
          { href: "/dashboard/master/author", label: "Authors" },
        ],
      },
    ],
  },

  {
    title: "Transactions",
    items: [
      {
        label: "Transactions",
        icon: Archive,
        children: [
          { href: "/dashboard/transactions/purchase-order", label: "Purchase Order" },
          { href: "/dashboard/transactions/good-receive-note", label: "Good Receive Note" },
          { href: "/dashboard/transactions/transfer-good-note", label: "Transafer Good Note" },
        ],
      },
    ],
  },
];
