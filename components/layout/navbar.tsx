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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DayEndModal from "@/components/model/day-end-modal";

export default function Navbar({
  onToggleSidebar,
}: {
  onToggleSidebar: () => void;
}) {
  const fetched = useRef(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
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
        <div className="flex items-center gap-2">
          <Button
            aria-label="Toggle sidebar"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={onToggleSidebar}
          >
            <Menu size={12} />
          </Button>
        </div>

        {/* Right: Notification + Theme + User */}
        <div className="flex items-center gap-2">
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
                size="icon"
                aria-label="User menu"
                className="h-8 w-8"
              >
                <User size={14} />
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
