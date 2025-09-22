"use client";
import { Settings, Sun, Moon, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function Navbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(()=> setMounted(true), []);

  return (
    <div className="h-16 border-b border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-950/60 backdrop-blur">
      <div className="container-page h-full flex items-center gap-3">
        <Button
          aria-label="Toggle sidebar"
          variant="outline"
          size="icon"
          onClick={onToggleSidebar}
        >
          <Menu size={18} />
        </Button>

        <input placeholder="Search  ⌘K" className="input flex-1" />

        <Button variant="outline" size="icon" aria-label="Settings"><Settings size={18} /></Button>
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
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-500" />
      </div>
    </div>
  );
}