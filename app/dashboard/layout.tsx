"use client";
import Navbar from "@/components/layout/navbar";
import { Sidebar } from "./navigation/sidebar";
import { useEffect, useState } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("sidebar:open") : null;
    if (saved !== null) setOpen(saved === "true");
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebar:open", String(open));
    }
  }, [open]);

  const leftMargin = open ? "lg:ml-64" : "lg:ml-16";

  return (
    <div className="min-h-screen">
      {/* Full-height sidebar (fixed) */}
      <Sidebar open={open} onClose={() => setOpen(false)} />

      {/* Header aligned with sidebar */}
      <div className={`fixed top-0 right-0 z-50 w-auto transition-all duration-300 ${leftMargin}`}>
        <Navbar onToggleSidebar={() => setOpen((o) => !o)} />
      </div>

      {/* Main content aligned with header and sidebar */}
      <div className={`pt-16 transition-all duration-300 ${leftMargin}`}>
        <main className="container-page space-y-6">{children}</main>
      </div>
    </div>
  );
}