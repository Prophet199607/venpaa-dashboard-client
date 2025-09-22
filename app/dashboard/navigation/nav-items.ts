import { LayoutDashboard, BarChart3, Mail, MessageSquare, Calendar, Kanban, FileText, Users, Shield, Layers } from "lucide-react";

export const navSections = [
  {
    title: "Dashboards",
    items: [
      { href: "/dashboard", label: "Default", icon: LayoutDashboard },
      { href: "/dashboard/crm", label: "CRM", icon: BarChart3 },
      { href: "/dashboard/finance", label: "Finance", icon: Layers }
    ]
  },
  {
    title: "Pages",
    items: [
      { href: "/dashboard/forms", label: "Forms", icon: FileText },
      { href: "/dashboard/email", label: "Email", icon: Mail },
      { href: "/dashboard/chat", label: "Chat", icon: MessageSquare },
      { href: "/dashboard/calendar", label: "Calendar", icon: Calendar },
      { href: "/dashboard/kanban", label: "Kanban", icon: Kanban },
      { href: "/dashboard/users", label: "Users", icon: Users },
      { href: "/dashboard/roles", label: "Roles", icon: Shield }
    ]
  }
];
