"use client";

import { navItems } from "@/components/layout/nav-items";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { LogOut, Moon, Palette, Play, Radio, Sun } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";

const ACCENT_COLORS = [
  { key: "teal",   label: "Teal",   hex: "#11B989", oklch: "0.66 0.155 165" },
  { key: "blue",   label: "Blue",   hex: "#3B82F6", oklch: "0.62 0.19 255"  },
  { key: "indigo", label: "Indigo", hex: "#6366F1", oklch: "0.59 0.23 275"  },
  { key: "purple", label: "Purple", hex: "#8B5CF6", oklch: "0.61 0.22 292"  },
  { key: "pink",   label: "Pink",   hex: "#EC4899", oklch: "0.65 0.22 350"  },
  { key: "orange", label: "Orange", hex: "#F97316", oklch: "0.72 0.19 50"   },
  { key: "red",    label: "Red",    hex: "#EF4444", oklch: "0.63 0.22 25"   },
  { key: "black",  label: "Black",  hex: "#18181B", oklch: "0.14 0.005 286" },
] as const;

type AccentKey = typeof ACCENT_COLORS[number]["key"];

const ACCENT_LS_KEY = "pov-accent-color";

function applyAccent(oklch: string) {
  const val = `oklch(${oklch})`;
  const root = document.documentElement;
  root.style.setProperty("--primary", val);
  root.style.setProperty("--ring", val);
  root.style.setProperty("--sidebar-primary", val);
  root.style.setProperty("--sidebar-ring", val);
}

interface SidebarProps {
  userName: string;
  userEmail: string;
  activeMeetingId: string | null;
}

export function Sidebar({ userName, userEmail, activeMeetingId }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [accentKey, setAccentKey] = useState<AccentKey>("teal");
  const paletteRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  // Load saved accent on mount
  useEffect(() => {
    const saved = localStorage.getItem(ACCENT_LS_KEY) as AccentKey | null;
    if (saved) {
      const color = ACCENT_COLORS.find((c) => c.key === saved);
      if (color) { setAccentKey(saved); applyAccent(color.oklch); }
    }
  }, []);

  // Close palette on outside click
  useEffect(() => {
    if (!paletteOpen) return;
    function handleClick(e: MouseEvent) {
      if (paletteRef.current && !paletteRef.current.contains(e.target as Node)) {
        setPaletteOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [paletteOpen]);

  function selectAccent(color: typeof ACCENT_COLORS[number]) {
    setAccentKey(color.key);
    applyAccent(color.oklch);
    localStorage.setItem(ACCENT_LS_KEY, color.key);
    setPaletteOpen(false);
  }

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="fixed top-0 bottom-0 left-0 z-40 flex h-screen w-[240px] flex-col border-r border-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 shrink-0">
          <span className="text-primary font-bold text-sm">P</span>
        </div>
        <span className="font-semibold text-sm tracking-tight">POV Win Goals</span>
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
            title="Toggle theme"
          >
            {mounted ? (resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />) : <Sun className="h-4 w-4" />}
          </button>

          {/* Accent color picker */}
          <div ref={paletteRef} className="relative">
            <button
              onClick={() => setPaletteOpen((o) => !o)}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
              title="Accent color"
            >
              <Palette className="h-4 w-4" />
            </button>

            {paletteOpen && (
              <div className="absolute right-0 top-full mt-2 z-50 w-48 rounded-lg border border-border bg-card shadow-lg p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Accent color
                </p>
                <div className="flex flex-wrap gap-3 px-1 pb-1">
                  {ACCENT_COLORS.map((color) => (
                    <button
                      key={color.key}
                      onClick={() => selectAccent(color)}
                      title={color.label}
                      className={cn(
                        "h-6 w-6 rounded-full border-2 transition-transform hover:scale-110",
                        accentKey === color.key ? "border-foreground scale-110" : "border-transparent"
                      )}
                      style={{ backgroundColor: color.hex }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {/* Meeting CTA */}
        <div className="px-3 pt-4 pb-2">
          {activeMeetingId ? (
            <Link
              href={`/meeting/${activeMeetingId}`}
              className={cn(
                buttonVariants(),
                "w-full bg-orange-500 text-white hover:bg-orange-500/90 gap-2 font-medium justify-center"
              )}
            >
              <Radio className="h-4 w-4 animate-pulse" />
              In Progress
            </Link>
          ) : (
            <Link
              href="/meeting/new"
              className={cn(
                buttonVariants(),
                "w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2 font-medium justify-center"
              )}
            >
              <Play className="h-4 w-4" />
              Start Meeting
            </Link>
          )}
        </div>

        <Separator className="my-3 bg-border" />

        {/* Navigation */}
        <div className="px-3 pb-4">
          <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Navigation
          </p>
          <nav className="grid gap-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </ScrollArea>

      {/* User profile */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{userName}</p>
            <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
            title="Sign out"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
