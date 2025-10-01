"use client";

import { Sun, Moon, Menu, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Navbar({
  onToggleSidebar,
}: {
  onToggleSidebar: () => void;
}) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
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
    document.cookie = "isLoggedIn=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

    // Redirect to login
    router.push("/login");
  };

  return (
    <div className="h-16 border-b border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-950/60 backdrop-blur">
      <div className="container-page h-full flex items-center justify-between">
        {/* Left: Sidebar Toggle */}
        <div className="flex items-center gap-2">
          <Button
            aria-label="Toggle sidebar"
            variant="outline"
            size="icon"
            onClick={onToggleSidebar}
          >
            <Menu size={18} />
          </Button>
        </div>

        {/* Right: Theme + User */}
        <div className="flex items-center gap-2">
          {mounted && (
            <Button
              aria-label="Toggle theme"
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </Button>
          )}

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="User menu">
                <User size={18} />
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
    </div>
  );
}
