"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Target } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AddGoalDialog } from "./add-goal-dialog";
import type { Goal, GoalStatus, UseCaseSummary } from "./types";

const STATUS_CONFIG: Record<GoalStatus, { label: string; className: string }> = {
  not_started: { label: "Not Started", className: "bg-muted text-muted-foreground border-border" },
  in_progress:  { label: "In Progress", className: "bg-blue/10 text-blue-400 border-blue/20" },
  achieved:     { label: "Achieved",    className: "bg-teal/10 text-teal border-teal/20" },
};

const FILTER_TABS: { value: GoalStatus | "all"; label: string }[] = [
  { value: "all",         label: "All" },
  { value: "not_started", label: "Not Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "achieved",    label: "Achieved" },
];

interface GoalsClientProps {
  goals: Goal[];
  useCases: UseCaseSummary[];
  consultantId: string;
}

export function GoalsClient({ goals, useCases, consultantId }: GoalsClientProps) {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<GoalStatus | "all">("all");

  const useCaseMap = Object.fromEntries(useCases.map((uc) => [uc.id, uc]));

  const visible = activeFilter === "all"
    ? goals
    : goals.filter((g) => g.status === activeFilter);

  async function cycleStatus(goal: Goal) {
    const next: Record<GoalStatus, GoalStatus> = {
      not_started: "in_progress",
      in_progress: "achieved",
      achieved: "not_started",
    };
    const supabase = createClient();
    await supabase.from("pov_goals").update({ status: next[goal.status] }).eq("id", goal.id);
    router.refresh();
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">POV Goals</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {goals.length} goal{goals.length !== 1 ? "s" : ""} · click a status badge to advance it
          </p>
        </div>
        <AddGoalDialog consultantId={consultantId} useCases={useCases} onSaved={() => router.refresh()} />
      </div>

      {/* Filter tabs */}
      {goals.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-6">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveFilter(tab.value)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                activeFilter === tab.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-transparent text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
              )}
            >
              {tab.label}
              {tab.value !== "all" && (
                <span className="ml-1.5 opacity-60">
                  {goals.filter((g) => g.status === tab.value).length}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Target className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="font-medium">
            {goals.length === 0 ? "No goals yet" : "No goals match this filter"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {goals.length === 0
              ? "Add your first POV goal to get started"
              : "Try a different filter"}
          </p>
          {goals.length === 0 && (
            <div className="mt-4">
              <AddGoalDialog consultantId={consultantId} useCases={useCases} onSaved={() => router.refresh()} />
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3">
          {visible.map((goal) => {
            const statusCfg = STATUS_CONFIG[goal.status];
            const linked = (goal.linked_use_case_ids ?? [])
              .map((id) => useCaseMap[id])
              .filter(Boolean);

            return (
              <Card key={goal.id} className="border-border bg-secondary/40">
                <CardContent className="p-5">
                  {/* Status badge — clickable to cycle */}
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <button
                      onClick={() => cycleStatus(goal)}
                      title="Click to advance status"
                      className="shrink-0"
                    >
                      <Badge
                        variant="outline"
                        className={cn("text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity", statusCfg.className)}
                      >
                        {statusCfg.label}
                      </Badge>
                    </button>
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-sm leading-snug mb-2">{goal.title}</h3>

                  {/* Success metric */}
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                    {goal.success_metric}
                  </p>

                  {/* Linked use cases */}
                  {linked.length > 0 && (
                    <div className="border-t border-border pt-3 mt-auto">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                        Linked use cases
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {linked.map((uc) => (
                          <span
                            key={uc.id}
                            className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-[11px] font-medium px-2 py-0.5"
                          >
                            <span className="font-bold">{uc.roi_stat}</span>
                            {uc.roi_description && (
                              <span className="opacity-70">{uc.roi_description}</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
