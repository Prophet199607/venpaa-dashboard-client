// nav-items.ts
import {
  type LucideIcon,
  LayoutDashboard,
  FileText,
  Archive,
} from "lucide-react";

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
          { href: "/dashboard/master/sub-category", label: "Sub Category" },
          { href: "/dashboard/master/location", label: "Location" },
          { href: "/dashboard/master/book-type", label: "Book Type" },
          { href: "/dashboard/master/book", label: "Books" },
          { href: "/dashboard/master/publisher", label: "Publishers" },
        ],
      },
      {
        label: "Forms",
        icon: FileText,
        children: [
          { href: "/dashboard/forms", label: "Basic Form" },
          { href: "/dashboard/forms/advanced", label: "Advanced Form" },
        ],
      },
    ],
  },
];
