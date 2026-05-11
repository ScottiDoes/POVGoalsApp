import type { Database } from "@/lib/database.types";

export type Prospect = Database["public"]["Tables"]["pov_prospects"]["Row"];
export type ComponentStatus = Database["public"]["Enums"]["component_status"];

export type UseCase = {
  id: string;
  title: string;
  pain_point_tag: string;
  roi_stat: string;
  roi_description: string;
  components: string[];
};

// A point-in-time copy of a use case stored on the prospect record.
// Editable per-prospect without touching the library.
export type SnapshotUseCase = {
  id: string;           // original use_cases_consultant id (for reference)
  title: string;
  pain_point_tag: string;
  roi_stat: string;
  roi_description: string;
  components: string[]; // prospect-specific component list
};

export const STATUS_CYCLE: ComponentStatus[] = [
  "not_started",
  "in_progress",
  "demo_approved",
  "complete",
  "disregarded",
];

export const STATUS_CONFIG: Record<ComponentStatus, { label: string; className: string }> = {
  not_started:   { label: "Not Started",   className: "bg-muted/60 text-muted-foreground border-border" },
  in_progress:   { label: "In Progress",   className: "bg-blue/10 text-blue-400 border-blue/20" },
  demo_approved: { label: "Demo Approved", className: "bg-orange/10 text-orange-400 border-orange/20" },
  complete:      { label: "Complete",      className: "bg-teal/10 text-teal border-teal/20" },
  disregarded:   { label: "Disregarded",   className: "bg-muted/30 text-muted-foreground/50 border-border line-through" },
};
