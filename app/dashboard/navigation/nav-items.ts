// nav-items.ts
import { type LucideIcon, LayoutDashboard, FileText } from "lucide-react";

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
