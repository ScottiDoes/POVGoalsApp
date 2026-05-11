"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarDays, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, UserRound, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { Database } from "@/lib/database.types";
import type { SnapshotUseCase } from "@/app/(app)/goals/types";

type Session = Database["public"]["Tables"]["meeting_sessions"]["Row"];

// Importance levels — ordered descending by significance
const IMPORTANCE_LEVELS = ["critical", "important", "nice_to_have", "not_required"] as const;
type Importance = typeof IMPORTANCE_LEVELS[number];

const IMPORTANCE_CONFIG: Record<Importance, { label: string; className: string; dotClass: string }> = {
  critical:     { label: "Critical",      className: "bg-red-500/10 text-red-400 border-red-500/30",    dotClass: "bg-red-400" },
  important:    { label: "Important",     className: "bg-orange/10 text-orange-400 border-orange/30",   dotClass: "bg-orange-400" },
  nice_to_have: { label: "Nice to have",  className: "bg-blue/10 text-blue-400 border-blue/30",         dotClass: "bg-blue-400" },
  not_required: { label: "Not required",  className: "bg-muted/60 text-muted-foreground border-border", dotClass: "bg-muted-foreground/40" },
};

const PAIN_POINT_COLORS: Record<string, string> = {
  "Revenue Growth":    "bg-teal/10 text-teal border-teal/20",
  "Cost Reduction":    "bg-blue/10 text-blue-400 border-blue/20",
  "Risk & Compliance": "bg-pink/10 text-pink-400 border-pink/20",
  "Productivity":      "bg-orange/10 text-orange-400 border-orange/20",
  "Customer Success":  "bg-green/10 text-green-400 border-green/20",
};

interface Prospect {
  id: string;
  org_name: string;
  contact_name: string | null;
  main_goals: string | null;
  kickoff_date: string | null;
  end_date: string | null;
  use_case_snapshot: unknown;
  component_statuses: unknown;
}

interface MeetingClientProps {
  session: Session;
  prospect: Prospect | null;
}

function ImportanceDropdown({
  value,
  onChange,
}: {
  value: Importance | null;
  onChange: (v: Importance) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const cfg = value ? IMPORTANCE_CONFIG[value] : null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-medium transition-colors whitespace-nowrap",
          cfg ? cfg.className : "bg-muted/40 text-muted-foreground/60 border-border hover:border-primary/30 hover:text-muted-foreground"
        )}
      >
        {cfg && <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", cfg.dotClass)} />}
        {cfg ? cfg.label : "Set importance"}
        <ChevronDown className="h-2.5 w-2.5 opacity-60" />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          {/* Menu */}
          <div className="absolute right-0 top-full mt-1 z-20 min-w-[140px] rounded-md border border-border bg-card shadow-lg py-1">
            {IMPORTANCE_LEVELS.map((level) => {
              const lcfg = IMPORTANCE_CONFIG[level];
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => { onChange(level); setOpen(false); }}
                  className={cn(
                    "flex items-center gap-2 w-full px-3 py-1.5 text-xs text-left transition-colors hover:bg-muted/50",
                    value === level ? "font-semibold" : "font-normal"
                  )}
                >
                  <span className={cn("h-2 w-2 rounded-full shrink-0", lcfg.dotClass)} />
                  <span className={cn(
                    value === level ? lcfg.className.split(" ").find(c => c.startsWith("text-")) : "text-foreground/80"
                  )}>
                    {lcfg.label}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export function MeetingClient({ session, prospect }: MeetingClientProps) {
  const router = useRouter();
  const snapshot = (prospect?.use_case_snapshot as SnapshotUseCase[]) ?? [];
  const [index, setIndex] = useState(0);
  // importance: { ucId: { componentName: Importance } }
  const [importance, setImportance] = useState<Record<string, Record<string, Importance>>>(
    (session.component_importance as Record<string, Record<string, Importance>>) ?? {}
  );
  const [resonated, setResonated] = useState<Set<string>>(
    new Set(session.resonated_use_case_ids ?? [])
  );

  if (!prospect || snapshot.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center p-8">
        <p className="text-muted-foreground text-sm">
          No use cases found for this prospect. Add some in POV Progress first.
        </p>
      </div>
    );
  }

  const current = snapshot[index];
  const isFirst = index === 0;
  const isLast = index === snapshot.length - 1;
  const isResonated = resonated.has(current.id);

  function setComponentImportance(component: string, level: Importance) {
    const next = {
      ...importance,
      [current.id]: { ...(importance[current.id] ?? {}), [component]: level },
    };
    setImportance(next);
    const supabase = createClient();
    supabase.from("meeting_sessions").update({ component_importance: next }).eq("id", session.id).then(() => {});
  }

  function toggleResonance() {
    const next = new Set(resonated);
    if (isResonated) next.delete(current.id); else next.add(current.id);
    setResonated(next);
    const supabase = createClient();
    supabase.from("meeting_sessions").update({ resonated_use_case_ids: [...next] }).eq("id", session.id).then(() => {});
  }

  async function endMeeting() {
    const supabase = createClient();
    await supabase.from("meeting_sessions").update({ status: "ended" }).eq("id", session.id);
    router.push(`/meeting/${session.id}/summary`);
  }

  return (
    <div className="flex flex-col h-screen p-6 gap-5">
      {/* Top bar */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            Use case {index + 1} of {snapshot.length}
          </span>
          <div className="flex gap-1.5">
            {snapshot.map((uc, i) => (
              <button
                key={uc.id}
                onClick={() => setIndex(i)}
                className={cn(
                  "h-2 rounded-full transition-all",
                  i === index ? "w-6 bg-primary" : resonated.has(uc.id) ? "w-2 bg-primary/40" : "w-2 bg-muted"
                )}
                title={uc.title}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{resonated.size} resonated</span>
          <button
            onClick={endMeeting}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5 text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive")}
          >
            <X className="h-3.5 w-3.5" />
            End Meeting
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center min-h-0">
        <div className="w-full max-w-2xl flex flex-col gap-4">

          {/* Prospect info card */}
          <Card className="border-border bg-secondary/40 w-full">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-semibold leading-tight">{prospect.org_name}</h2>
                  {prospect.contact_name && (
                    <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                      <UserRound className="h-3.5 w-3.5 shrink-0" />
                      {prospect.contact_name}
                    </div>
                  )}
                  {prospect.main_goals && (
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                      <span className="text-foreground/60 font-medium">Goals: </span>
                      {prospect.main_goals}
                    </p>
                  )}
                </div>
                {(prospect.kickoff_date || prospect.end_date) && (
                  <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground shrink-0">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {prospect.kickoff_date && <span>{format(new Date(prospect.kickoff_date), "MMM d")}</span>}
                    {prospect.end_date && <span>→ {format(new Date(prospect.end_date), "MMM d, yyyy")}</span>}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Use case + components */}
          <div className="rounded-lg border border-border bg-secondary/20 px-5 py-4">
            {/* Use case header */}
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <span className="font-semibold text-base">
                {current.title || `${current.roi_stat} ${current.roi_description}`}
              </span>
              <Badge
                variant="outline"
                className={cn("text-[10px] font-medium", PAIN_POINT_COLORS[current.pain_point_tag] ?? "bg-muted text-muted-foreground border-border")}
              >
                {current.pain_point_tag}
              </Badge>
            </div>

            {/* Components */}
            {current.components.length > 0 && (
              <div className="space-y-2 pl-3 border-l border-border">
                {current.components.map((component) => {
                  const level = importance[current.id]?.[component] ?? null;
                  return (
                    <div key={component} className="grid grid-cols-[1fr_auto] items-center gap-x-3">
                      <span className="text-sm leading-snug">{component}</span>
                      <ImportanceDropdown
                        value={level}
                        onChange={(v) => setComponentImportance(component, v)}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Navigation + resonance */}
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={isFirst}
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "gap-2 min-w-[120px]", isFirst && "opacity-30 pointer-events-none")}
            >
              <ChevronLeft className="h-5 w-5" />
              Previous
            </button>

            <button
              onClick={toggleResonance}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-8 py-4 text-base font-semibold transition-all border-2",
                isResonated
                  ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                  : "bg-transparent text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
              )}
            >
              <CheckCircle2 className={cn("h-5 w-5", isResonated && "fill-primary-foreground")} />
              {isResonated ? "Resonated!" : "This resonates"}
            </button>

            <button
              onClick={() => isLast ? endMeeting() : setIndex((i) => i + 1)}
              className={cn(buttonVariants({ size: "lg" }), "gap-2 min-w-[120px] bg-primary text-primary-foreground hover:bg-primary/90")}
            >
              {isLast ? "Finish" : "Next"}
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
