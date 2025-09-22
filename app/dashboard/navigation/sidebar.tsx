"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navSections } from "./nav-items";
import { cn } from "@/utils/cn";

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 lg:hidden transition-opacity",
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        )}
        // clicking the overlay should close the sidebar on mobile
        onClick={onClose}
      />

      {/* Full-height sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen bg-white dark:bg-neutral-950 border-r border-neutral-200 dark:border-neutral-800 transition-all duration-300",
          open ? "w-64" : "w-16"
        )}
      >
        {/* Offset content under the fixed header (h-16) */}
        <div className="flex flex-col h-full p-3 pt-16">
          {/* Logo / Title */}
          <div className="px-2 py-2 text-lg font-semibold">
            {open ? "Studio Admin" : "SA"}
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto">
            {navSections.map((section, idx) => (
              <div key={idx} className="mt-2">
                {/* Hide section title when collapsed */}
                <div
                  className={cn(
                    "px-2 text-xs uppercase tracking-wide text-neutral-500",
                    open ? "block" : "hidden"
                  )}
                >
                  {section.title}
                </div>

                <nav className="mt-1 space-y-1">
                  {section.items.map((item) => {
                    const active = pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center rounded-xl px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800",
                          active
                            ? "bg-neutral-100 dark:bg-neutral-800 font-medium"
                            : "text-neutral-600 dark:text-neutral-300",
                          open ? "gap-3 justify-start" : "justify-center"
                        )}
                        title={!open ? item.label : undefined}
                      >
                        <Icon size={18} />
                        {/* Hide label when collapsed */}
                        {open && <span>{item.label}</span>}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>

          {/* Footer hidden when collapsed */}
          {open && (
            <div className="text-xs text-neutral-500">
              <div className="font-medium">Arham Khan</div>
              <div className="truncate">hello@arhamkhnz.com</div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
