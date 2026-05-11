"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Database } from "@/lib/database.types";
import type { ComponentStatus, SnapshotUseCase } from "@/app/(app)/goals/types";
import { STATUS_CONFIG, STATUS_CYCLE } from "@/app/(app)/goals/types";

type Session = Database["public"]["Tables"]["meeting_sessions"]["Row"];

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
  use_case_snapshot: unknown;
  component_statuses: unknown;
}

interface MeetingClientProps {
  session: Session;
  prospect: Prospect | null;
}

export function MeetingClient({ session, prospect }: MeetingClientProps) {
  const router = useRouter();
  const snapshot = (prospect?.use_case_snapshot as SnapshotUseCase[]) ?? [];
  const [index, setIndex] = useState(0);
  const [statuses, setStatuses] = useState<Record<string, Record<string, ComponentStatus>>>(
    (prospect?.component_statuses as Record<string, Record<string, ComponentStatus>>) ?? {}
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

  function getStatus(component: string): ComponentStatus {
    return statuses[current.id]?.[component] ?? "not_started";
  }

  function cycleStatus(component: string) {
    const curr = getStatus(component);
    const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(curr) + 1) % STATUS_CYCLE.length];
    const nextStatuses = {
      ...statuses,
      [current.id]: { ...(statuses[current.id] ?? {}), [component]: next },
    };
    setStatuses(nextStatuses);
    const supabase = createClient();
    supabase
      .from("pov_prospects")
      .update({ component_statuses: nextStatuses })
      .eq("id", prospect!.id)
      .then(() => {});
  }

  function toggleResonance() {
    const next = new Set(resonated);
    if (isResonated) next.delete(current.id); else next.add(current.id);
    setResonated(next);
    const supabase = createClient();
    supabase
      .from("meeting_sessions")
      .update({ resonated_use_case_ids: [...next] })
      .eq("id", session.id)
      .then(() => {});
  }

  const done = () => router.push(`/meeting/${session.id}/summary`);

  const done_count = current.components.filter((c) => getStatus(c) === "complete").length;
  const total_count = current.components.length;

  return (
    <div className="flex flex-col h-[calc(100vh-0px)] p-6 gap-5">
      {/* Top bar */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-base">{prospect.org_name}</span>
          <span className="text-sm text-muted-foreground">
            {index + 1} / {snapshot.length}
          </span>
          <div className="flex gap-1.5">
            {snapshot.map((uc, i) => (
              <button
                key={uc.id}
                onClick={() => setIndex(i)}
                className={cn(
                  "h-2 rounded-full transition-all",
                  i === index
                    ? "w-6 bg-primary"
                    : resonated.has(uc.id)
                    ? "w-2 bg-primary/40"
                    : "w-2 bg-muted"
                )}
                title={uc.title}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{resonated.size} resonated</span>
          <button
            onClick={done}
            className={cn(buttonVariants({ size: "sm" }), "bg-primary text-primary-foreground hover:bg-primary/90")}
          >
            Done
          </button>
        </div>
      </div>

      {/* Use case card */}
      <div className="flex-1 flex items-center justify-center min-h-0">
        <div className="w-full max-w-2xl flex flex-col gap-4">
          <Card className="border-border bg-secondary/40 w-full">
            <CardContent className="p-0">
              {/* Use case header */}
              <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-3 px-5 pt-5 pb-4">
                <div className="flex items-center gap-2 min-w-0 flex-wrap">
                  <span className="font-semibold text-base">
                    {current.title || `${current.roi_stat} ${current.roi_description}`}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] font-medium",
                      PAIN_POINT_COLORS[current.pain_point_tag] ?? "bg-muted text-muted-foreground border-border"
                    )}
                  >
                    {current.pain_point_tag}
                  </Badge>
                </div>
                {total_count > 0 && (
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {done_count}/{total_count} complete
                  </span>
                )}
                <div />
              </div>

              {/* Components */}
              {current.components.length > 0 && (
                <div className="border-t border-border px-5 py-4">
                  <div className="space-y-1.5 pl-3 border-l border-border">
                    {current.components.map((component) => {
                      const status = getStatus(component);
                      const cfg = STATUS_CONFIG[status];
                      return (
                        <div key={component} className="grid grid-cols-[1fr_auto_auto] items-center gap-x-3">
                          <span className={cn(
                            "text-sm leading-snug",
                            status === "disregarded" && "line-through text-muted-foreground/50"
                          )}>
                            {component}
                          </span>
                          <button onClick={() => cycleStatus(component)} title="Click to advance status">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] font-medium cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap",
                                cfg.className
                              )}
                            >
                              {cfg.label}
                            </Badge>
                          </button>
                          <div />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation + resonance */}
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={isFirst}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "gap-2 min-w-[120px]",
                isFirst && "opacity-30 pointer-events-none"
              )}
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
              onClick={() => isLast ? done() : setIndex((i) => i + 1)}
              className={cn(
                buttonVariants({ size: "lg" }),
                "gap-2 min-w-[120px] bg-primary text-primary-foreground hover:bg-primary/90"
              )}
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
