"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/utils/api";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sun,
  Moon,
  Menu,
  LogOut,
  User,
  BellRing,
  CalendarClock,
  FileText,
  BarChart3,
  ClipboardList,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { usePermissions } from "@/context/permissions";
import DayEndModal from "@/components/model/day-end-modal";
import StockProductSearch from "@/components/shared/stock-product-search";

export default function Navbar({
  onToggleSidebar,
}: {
  onToggleSidebar: () => void;
}) {
  const fetched = useRef(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { hasPermission, user } = usePermissions();
  const [hasNotification, setHasNotification] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isDayEndModalOpen, setIsDayEndModalOpen] = useState(false);
  const router = useRouter();
  useEffect(() => setMounted(true), []);

  const handleLogout = () => {
    // Clear authentication state
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("userLocation");
    } catch {}

    // Expire cookie so middleware treats user as logged out
    document.cookie =
      "isLoggedIn=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

    // Redirect to login
    router.push("/login");
  };

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    const checkNotifications = async () => {
      try {
        const response = await api.get("/transactions/load-all-transactions", {
          params: { iid: "TGR", status: "drafted", per_page: 1000 },
        });

        const result = response.data;
        const data =
          result.success && Array.isArray(result.data) ? result.data : [];
        setNotifications(data);
        setHasNotification(data.length > 0);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      }
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-12 border-b border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-950/60 backdrop-blur">
      <div className="max-w-[1500px] mx-auto px-4 md:px-6 lg:px-8 h-full flex items-center justify-between">
        {/* Left: Sidebar Toggle */}
        <div className="flex items-center gap-2 flex-1">
          <Button
            aria-label="Toggle sidebar"
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={onToggleSidebar}
          >
            <Menu size={12} />
          </Button>
          <div className="hidden sm:block">
            <StockProductSearch />
          </div>

          {/* Reports Dropdown */}
          <div className="ml-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-2 px-3 text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                >
                  <FileText size={14} />
                  <span className="text-xs font-medium">Reports</span>
                  <ChevronDown size={12} className="opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-64 p-2 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-2xl border border-zinc-200 dark:border-zinc-800 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-2xl animate-in fade-in zoom-in-95 slide-in-from-top-2"
              >
                {/* Sales Reports Submenu */}
                {(hasPermission("view pos-sales-summary-report") ||
                  hasPermission("view daily-collection-report")) && (
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all hover:bg-blue-500/5 dark:hover:bg-blue-500/10 group">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                        <BarChart3 size={12} />
                      </div>
                      <div className="flex flex-col flex-1">
                        <span className="text-xs font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          Sales Reports
                        </span>
                      </div>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent
                        sideOffset={14}
                        className="w-56 p-2 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-xl rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xl animate-in fade-in zoom-in-95 slide-in-from-left-2"
                      >
                        {hasPermission("view pos-sales-summary-report") && (
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(
                                "/dashboard/reports/pos-sales-summary",
                              )
                            }
                            className="text-xs p-2.5 rounded-lg cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                          >
                            POS Sales Summary
                          </DropdownMenuItem>
                        )}
                        {hasPermission("view daily-collection-report") && (
                          <DropdownMenuItem
                            onClick={() =>
                              router.push("/dashboard/reports/daily-collection")
                            }
                            className="text-xs p-2.5 rounded-lg cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                          >
                            Daily Collection
                          </DropdownMenuItem>
                        )}
                        {hasPermission("view sales-report") && (
                          <DropdownMenuItem
                            onClick={() =>
                              router.push("/dashboard/reports/sales-report")
                            }
                            className="text-xs p-2.5 rounded-lg cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                          >
                            Sales Report
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                )}

                {/* Inventory Reports Submenu */}
                {hasPermission("view current-stock-report") && (
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all hover:bg-emerald-500/5 dark:hover:bg-emerald-500/10 group">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                        <ClipboardList size={12} />
                      </div>
                      <div className="flex flex-col flex-1">
                        <span className="text-xs font-semibold group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          Inventory Reports
                        </span>
                      </div>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent
                        sideOffset={14}
                        className="w-56 p-2 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-xl rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xl animate-in fade-in zoom-in-95 slide-in-from-left-2"
                      >
                        <DropdownMenuItem
                          onClick={() =>
                            router.push("/dashboard/reports/current-stock")
                          }
                          className="text-xs p-2.5 rounded-lg cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                        >
                          Current Stock Report
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                )}

                {/* Financial Reports Submenu */}
                {/* <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all hover:bg-amber-500/5 dark:hover:bg-amber-500/10 group">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300">
                      <TrendingUp size={12} />
                    </div>
                    <div className="flex flex-col flex-1">
                      <span className="text-xs font-semibold group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        Finance Reports
                      </span>
                    </div>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent
                      sideOffset={14}
                      className="w-56 p-2 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-xl rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xl animate-in fade-in zoom-in-95 slide-in-from-left-2"
                    >
                      <DropdownMenuItem className="text-xs p-2.5 rounded-lg cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
                        Profit & Loss Statement
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-xs p-2.5 rounded-lg cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
                        VAT Summary Report
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-xs p-2.5 rounded-lg cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
                        Expense Breakdown
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>

                <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800 mx-2" /> */}

                {/* More Reports Submenu */}
                {/* <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all hover:bg-purple-500/5 dark:hover:bg-purple-500/10 group">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-all duration-300">
                      <PieChart size={12} />
                    </div>
                    <div className="flex flex-col flex-1">
                      <span className="text-xs font-semibold group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        Master Reports
                      </span>
                    </div>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent
                      sideOffset={14}
                      className="w-56 p-2 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-xl rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xl animate-in fade-in zoom-in-95 slide-in-from-left-2"
                    >
                      <DropdownMenuItem className="text-xs p-2.5 rounded-lg cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
                        Customer Aging Report
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-xs p-2.5 rounded-lg cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
                        Supplier Outstanding
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-xs p-2.5 rounded-lg cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
                        User Activity Logs
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub> */}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Right: Notification + Theme + User */}
        <div className="flex items-center gap-2">
          {hasPermission("process day-end") && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-2 hidden md:flex"
                onClick={() => setIsDayEndModalOpen(true)}
              >
                <CalendarClock size={14} />
                <span className="text-xs font-medium">Day End</span>
              </Button>

              {/* Mobile Icon Only */}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 md:hidden"
                onClick={() => setIsDayEndModalOpen(true)}
              >
                <CalendarClock size={14} />
              </Button>
            </>
          )}

          <div className="relative">
            {/* Notification */}
            {hasNotification && (
              <span className="absolute inset-0 rounded-full animate-ping bg-red-500/30" />
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className={`
                    h-8 w-8
                    relative z-10
                    transition-all duration-300 ease-out
                    hover:scale-105 hover:rotate-3
                    ${
                      hasNotification
                        ? "border-red-500 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.7)]"
                        : ""
                    }
                  `}
                >
                  <BellRing
                    size={12}
                    className={`
                        transition-all duration-300
                        ${hasNotification ? "fill-red-500 animate-wiggle" : ""}
                      `}
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-80 p-2 mt-2 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 shadow-[0_0_40px_-10px_rgba(0,0,0,0.2)] rounded-2xl animate-in fade-in zoom-in-95 slide-in-from-top-2"
              >
                <div className="flex items-center justify-between px-3 py-2 mb-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                    Notifications
                  </span>
                  {notifications.length > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500/10 px-1.5 text-[10px] font-medium text-red-500 border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                      {notifications.length}
                    </span>
                  )}
                </div>

                <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-200 dark:via-zinc-800 to-transparent mb-2" />

                <div className="max-h-[300px] overflow-y-auto pr-1">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-2 text-zinc-400">
                      <BellRing className="w-2 h-2 opacity-10" />
                      <p className="text-xs font-medium mb-2">
                        Notifications not available
                      </p>
                    </div>
                  ) : (
                    notifications.map((item: any, index: number) => (
                      <DropdownMenuItem
                        key={index}
                        className="group relative flex flex-col items-start gap-1 p-3 mb-1 rounded-xl cursor-pointer transition-all duration-300 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 focus:bg-zinc-100/50 dark:focus:bg-zinc-900/50"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-200 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                            {item.doc_no}
                          </span>
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Theme Menu */}
          {mounted && (
            <Button
              aria-label="Toggle theme"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun size={12} /> : <Moon size={12} />}
            </Button>
          )}

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="default"
                aria-label="User menu"
                className="h-8 gap-2 px-3 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all rounded-xl shadow-sm"
              >
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <User size={12} />
                </div>
                {user && (
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    {user.name}
                  </span>
                )}
                <ChevronDown size={12} className="opacity-40" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <DayEndModal
        isOpen={isDayEndModalOpen}
        onClose={() => setIsDayEndModalOpen(false)}
      />
    </div>
  );
}
