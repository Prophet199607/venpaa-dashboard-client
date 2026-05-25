"use client";

import { cn } from "@/utils/cn";
import Loader from "@/components/ui/loader";
import Navbar from "@/components/layout/navbar";
import { Suspense, useEffect, useState } from "react";
import { Sidebar } from "../../components/layout/sidebar";
import { getPermissionForPath } from "../../lib/nav-items";
import { usePathname, useSearchParams } from "next/navigation";
import { AccessDenied } from "@/components/shared/access-denied";
import { PermissionsProvider, usePermissions } from "@/context/permissions";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PermissionsProvider>
      <Suspense>
        <DashboardContent>{children}</DashboardContent>
      </Suspense>
    </PermissionsProvider>
  );
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(true);
  const searchParams = useSearchParams();
  const { hasPermission, loading } = usePermissions();

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

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white dark:bg-neutral-950">
        <div className="flex flex-col items-center gap-4">
          <Loader />
        </div>
      </div>
    );
  }

  // Permission Check Enforcement — pass searchParams so /create?doc_no=... maps to "edit" permission
  const requiredPermission = getPermissionForPath(pathname, searchParams);
  const isDenied =
    requiredPermission && !loading && !hasPermission(requiredPermission);

  const navbarLeft = open ? "lg:left-64" : "lg:left-16";
  const contentLeft = open ? "lg:pl-64" : "lg:pl-16";

  return (
    <div className="min-h-screen">
      <Sidebar open={open} onClose={() => setOpen(false)} />

      <div
        className={cn(
          "fixed top-0 right-0 left-0 z-[50] transition-all duration-300",
          navbarLeft,
        )}
      >
        <Navbar onToggleSidebar={() => setOpen((o: boolean) => !o)} />
      </div>

      <div
        className={cn(
          "pt-[44px] transition-all duration-300 min-h-screen",
          contentLeft,
        )}
      >
        <main className="container-page">
          {isDenied ? <AccessDenied /> : children}
        </main>
      </div>
    </div>
  );
}
