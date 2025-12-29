"use client";
import Navbar from "@/components/layout/navbar";
import { Sidebar } from "../../components/layout/sidebar";
import { useEffect, useState } from "react";
import { cn } from "@/utils/cn";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const saved =
      typeof window !== "undefined"
        ? localStorage.getItem("sidebar:open")
        : null;

    if (saved !== null) {
      setOpen(saved === "true");
    } else {
      if (typeof window !== "undefined") {
        setOpen(window.innerWidth >= 1024);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebar:open", String(open));
    }
  }, [open]);

  const navbarLeft = open ? "lg:left-64" : "lg:left-16";
  const contentLeft = open ? "lg:pl-64" : "lg:pl-16";

  return (
    <div className="min-h-screen">
      <Sidebar open={open} onClose={() => setOpen(false)} />

      <div
        className={cn(
          "fixed top-0 right-0 left-0 z-[100] transition-all duration-300",
          navbarLeft
        )}
      >
        <Navbar onToggleSidebar={() => setOpen((o) => !o)} />
      </div>

      <div
        className={cn(
          "pt-6 transition-all duration-300 min-h-screen",
          contentLeft
        )}
      >
        <main className="container-page">{children}</main>
      </div>
    </div>
  );
}
