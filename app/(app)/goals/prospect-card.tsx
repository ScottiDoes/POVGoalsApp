"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarDays, Check, Pencil, Plus, X } from "lucide-react";
import { useRef, useState } from "react";
import type { ComponentStatus, Prospect, SnapshotUseCase } from "./types";
import { STATUS_CONFIG, STATUS_CYCLE } from "./types";

const PAIN_POINT_COLORS: Record<string, string> = {
  "Revenue Growth":    "bg-teal/10 text-teal border-teal/20",
  "Cost Reduction":    "bg-blue/10 text-blue-400 border-blue/20",
  "Risk & Compliance": "bg-pink/10 text-pink-400 border-pink/20",
  "Productivity":      "bg-orange/10 text-orange-400 border-orange/20",
  "Customer Success":  "bg-green/10 text-green-400 border-green/20",
};

interface ProspectCardProps {
  prospect: Prospect;
  onEdit: () => void;
}

export function ProspectCard({ prospect, onEdit }: ProspectCardProps) {
  const [snapshot, setSnapshot] = useState<SnapshotUseCase[]>(
    (prospect.use_case_snapshot as SnapshotUseCase[]) ?? []
  );
  const [statuses, setStatuses] = useState<Record<string, Record<string, ComponentStatus>>>(
    (prospect.component_statuses as Record<string, Record<string, ComponentStatus>>) ?? {}
  );
  // Per-use-case draft component: ucId -> draft text | null
  const [drafts, setDrafts] = useState<Record<string, string | null>>({});
  const draftRefs = useRef<Record<string, HTMLInputElement | null>>({});

  async function persistSnapshot(next: SnapshotUseCase[]) {
    const supabase = createClient();
    await supabase.from("pov_prospects").update({ use_case_snapshot: next }).eq("id", prospect.id);
  }

  async function persistStatuses(next: Record<string, Record<string, ComponentStatus>>) {
    const supabase = createClient();
    await supabase.from("pov_prospects").update({ component_statuses: next }).eq("id", prospect.id);
  }

  function getStatus(ucId: string, component: string): ComponentStatus {
    return statuses[ucId]?.[component] ?? "not_started";
  }

  function cycleStatus(ucId: string, component: string) {
    const current = getStatus(ucId, component);
    const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(current) + 1) % STATUS_CYCLE.length];
    const nextStatuses = {
      ...statuses,
      [ucId]: { ...(statuses[ucId] ?? {}), [component]: next },
    };
    setStatuses(nextStatuses);
    persistStatuses(nextStatuses);
  }

  function addDraft(ucId: string) {
    setDrafts((d) => ({ ...d, [ucId]: "" }));
    setTimeout(() => draftRefs.current[ucId]?.focus(), 0);
  }

  function saveComponent(ucId: string) {
    const text = drafts[ucId]?.trim();
    if (!text) { setDrafts((d) => ({ ...d, [ucId]: null })); return; }
    const next = snapshot.map((uc) =>
      uc.id === ucId ? { ...uc, components: [...uc.components, text] } : uc
    );
    setSnapshot(next);
    setDrafts((d) => ({ ...d, [ucId]: null }));
    persistSnapshot(next);
  }

  function removeComponent(ucId: string, component: string) {
    const next = snapshot.map((uc) =>
      uc.id === ucId ? { ...uc, components: uc.components.filter((c) => c !== component) } : uc
    );
    // Also remove its status entry
    const nextStatuses = { ...statuses };
    if (nextStatuses[ucId]) {
      const { [component]: _, ...rest } = nextStatuses[ucId];
      nextStatuses[ucId] = rest;
    }
    setSnapshot(next);
    setStatuses(nextStatuses);
    persistSnapshot(next);
    persistStatuses(nextStatuses);
  }

  function useCaseProgress(uc: SnapshotUseCase) {
    if (!uc.components.length) return null;
    const done = uc.components.filter((c) => getStatus(uc.id, c) === "complete").length;
    return { done, total: uc.components.length };
  }

  return (
    <Card className="border-border bg-secondary/40 w-full">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-3 flex-wrap">
              <h2 className="text-lg font-semibold leading-tight">{prospect.org_name}</h2>
              {prospect.contact_name && (
                <span className="text-sm text-muted-foreground">
                  Contact: <span className="text-foreground/80">{prospect.contact_name}</span>
                </span>
              )}
            </div>
            {prospect.main_goals && (
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                <span className="text-foreground/60 font-medium">Main goals: </span>
                {prospect.main_goals}
              </p>
            )}
            {(prospect.kickoff_date || prospect.end_date) && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                {prospect.kickoff_date && (
                  <span>Kickoff: <span className="text-foreground/70">{format(new Date(prospect.kickoff_date), "MMM d, yyyy")}</span></span>
                )}
                {prospect.kickoff_date && prospect.end_date && <span className="mx-1">·</span>}
                {prospect.end_date && (
                  <span>End: <span className="text-foreground/70">{format(new Date(prospect.end_date), "MMM d, yyyy")}</span></span>
                )}
              </div>
            )}
          </div>
          <button onClick={onEdit} className="shrink-0 ml-4 text-muted-foreground hover:text-foreground transition-colors" title="Edit">
            <Pencil className="h-4 w-4" />
          </button>
        </div>

        {/* Use cases from snapshot */}
        {snapshot.length > 0 && (
          <div className="border-t border-border px-5 py-4 space-y-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Use cases to test
            </p>
            {snapshot.map((uc) => {
              const progress = useCaseProgress(uc);
              const draft = drafts[uc.id];
              return (
                <div key={uc.id}>
                  {/* Use case header */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="font-medium text-sm">
                      {uc.title || `${uc.roi_stat} ${uc.roi_description}`}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] font-medium",
                        PAIN_POINT_COLORS[uc.pain_point_tag] ?? "bg-muted text-muted-foreground border-border"
                      )}
                    >
                      {uc.pain_point_tag}
                    </Badge>
                    {progress && (
                      <span className="ml-auto text-xs text-muted-foreground shrink-0">
                        {progress.done}/{progress.total} complete
                      </span>
                    )}
                  </div>

                  {/* Components */}
                  <div className="space-y-1.5 pl-3 border-l border-border">
                    {uc.components.map((component) => {
                      const status = getStatus(uc.id, component);
                      const cfg = STATUS_CONFIG[status];
                      return (
                        <div key={component} className="flex items-center gap-3 group">
                          <span className={cn(
                            "text-sm flex-1 leading-snug",
                            status === "disregarded" && "line-through text-muted-foreground/50"
                          )}>
                            {component}
                          </span>
                          <button
                            onClick={() => cycleStatus(uc.id, component)}
                            title="Click to advance status"
                          >
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
                          <button
                            onClick={() => removeComponent(uc.id, component)}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all shrink-0"
                            title="Remove component"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}

                    {/* Draft row */}
                    {draft !== null && (
                      <div className="flex items-center gap-2 animate-in slide-in-from-bottom-1 duration-150">
                        <input
                          ref={(el) => { draftRefs.current[uc.id] = el; }}
                          type="text"
                          value={draft}
                          onChange={(e) => setDrafts((d) => ({ ...d, [uc.id]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveComponent(uc.id);
                            if (e.key === "Escape") setDrafts((d) => ({ ...d, [uc.id]: null }));
                          }}
                          placeholder="New component…"
                          className="flex-1 bg-transparent text-sm outline-none border-b border-border focus:border-primary/60 py-0.5 transition-colors placeholder:text-muted-foreground/50"
                        />
                        <button
                          onClick={() => saveComponent(uc.id)}
                          className={cn(
                            "shrink-0 transition-colors",
                            draft.trim() ? "text-primary" : "text-muted-foreground/40 pointer-events-none"
                          )}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Add component */}
                    {draft === null && (
                      <button
                        onClick={() => addDraft(uc.id)}
                        className="flex items-center gap-1 mt-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        Add component
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
