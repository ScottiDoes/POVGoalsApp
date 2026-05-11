"use client";

import { navItems } from "@/components/layout/nav-items";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { LogOut, Play, Radio } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface SidebarProps {
  userName: string;
  userEmail: string;
  activeMeetingId: string | null;
}

export function Sidebar({ userName, userEmail, activeMeetingId }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

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
