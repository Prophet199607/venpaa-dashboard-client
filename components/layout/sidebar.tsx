"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { navSections, type NavItem } from "../../lib/nav-items";
import { cn } from "@/utils/cn";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<string | null>(null);

  const renderItem = (item: NavItem) => {
    const hasChildren = !!item.children;
    const isExpanded = expanded === item.label;
    const active = item.href && pathname === item.href;
    const Icon = item.icon;

    return (
      <div key={item.label}>
        {hasChildren ? (
          <button
            onClick={() => setExpanded(isExpanded ? null : item.label)}
            className={cn(
              "flex w-full items-center rounded-xl px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800",
              active
                ? "bg-neutral-100 dark:bg-neutral-800 font-medium"
                : "text-neutral-600 dark:text-neutral-300",
              open ? "gap-3 justify-start" : "justify-center"
            )}
            title={!open ? item.label : undefined}
          >
            {Icon && <Icon size={18} />}
            {open && (
              <span className="flex-1 flex items-center justify-between">
                {item.label}
                <ChevronDown
                  size={14}
                  className={cn(
                    "ml-2 transition-transform",
                    isExpanded ? "rotate-180" : ""
                  )}
                />
              </span>
            )}
          </button>
        ) : (
          <Link
            href={item.href as any}
            className={cn(
              "flex items-center rounded-xl px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800",
              active
                ? "bg-neutral-100 dark:bg-neutral-800 font-medium"
                : "text-neutral-600 dark:text-neutral-300",
              open ? "gap-3 justify-start" : "justify-center"
            )}
            title={!open ? item.label : undefined}
          >
            {Icon && <Icon size={18} />}
            {open && <span>{item.label}</span>}
          </Link>
        )}

        {/* Submenu */}
        {hasChildren && isExpanded && open && (
          <div className="ml-8 mt-1 space-y-1">
            {item.children?.map((child) => {
              if (child.divider) {
                return (
                  <hr
                    key={child.label}
                    className="my-2 border-neutral-200 dark:border-neutral-700"
                  />
                );
              }

              const childActive = pathname === child.href;
              const ChildIcon = child.icon;
              return (
                <Link
                  key={child.href}
                  href={child.href as any}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800",
                    childActive
                      ? "bg-neutral-100 dark:bg-neutral-800 font-medium"
                      : "text-neutral-600 dark:text-neutral-300"
                  )}
                >
                  {ChildIcon && <ChildIcon size={16} />}
                  <span>{child.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

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
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          "group fixed top-0 left-0 z-40 h-screen bg-white dark:bg-neutral-950 border-r border-neutral-200 dark:border-neutral-800 transition-all duration-300",
          open ? "w-64" : "w-16"
        )}
      >
        <div className="flex flex-col h-full p-3 pt-2">
          {/* Logo */}
          <div className="flex items-center justify-center px-2 py-2 text-lg font-semibold">
            {open ? (
              <Image
                src="/images/logo4.png"
                alt="Brand Logo"
                width={140}
                height={140}
              />
            ) : (
              "VD"
            )}
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto">
            {navSections.map((section, idx) => (
              <div key={idx} className="mt-2">
                <div
                  className={cn(
                    "px-2 text-xs uppercase tracking-wide text-neutral-500",
                    open ? "block" : "hidden"
                  )}
                >
                  {section.title}
                </div>
                <nav className="mt-1 space-y-1">
                  {section.items.map(renderItem)}
                </nav>
              </div>
            ))}
          </div>

          {open ? (
            <footer className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
              <p className="text-center text-sm text-neutral-500 truncate">
                V&nbsp;1.0.0
              </p>
            </footer>
          ) : (
            <footer className="mt-3 pb-2">
              <span
                className="block text-[10px] leading-none text-neutral-500 text-center"
                title="V 1.0.0"
              >
                V1
              </span>
            </footer>
          )}
        </div>
      </aside>
    </>
  );
}
