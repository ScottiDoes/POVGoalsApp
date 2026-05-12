"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarDays, Check, ChevronDown, Pencil, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ComponentStatus, Prospect, SnapshotUseCase } from "./types";
import { STATUS_CONFIG, STATUS_CYCLE } from "./types";

const PAIN_POINT_COLORS: Record<string, string> = {
  "Revenue Growth":    "bg-teal/10 text-teal border-teal/20",
  "Cost Reduction":    "bg-blue/10 text-blue-400 border-blue/20",
  "Risk & Compliance": "bg-pink/10 text-pink-400 border-pink/20",
  "Productivity":      "bg-orange/10 text-orange-400 border-orange/20",
  "Customer Success":  "bg-green/10 text-green-400 border-green/20",
};

const IMPORTANCE_LEVELS = ["critical", "important", "nice_to_have", "not_required"] as const;
type Importance = typeof IMPORTANCE_LEVELS[number];

const IMPORTANCE_CONFIG: Record<Importance, { label: string; className: string; dotClass: string }> = {
  critical:     { label: "Critical",     className: "bg-red-500/10 text-red-400 border-red-500/30",    dotClass: "bg-red-400" },
  important:    { label: "Important",    className: "bg-orange/10 text-orange-400 border-orange/30",   dotClass: "bg-orange-400" },
  nice_to_have: { label: "Nice to have", className: "bg-blue/10 text-blue-400 border-blue/30",         dotClass: "bg-blue-400" },
  not_required: { label: "Not required", className: "bg-muted/60 text-muted-foreground border-border", dotClass: "bg-muted-foreground/40" },
};

const STATUS_DOT: Record<ComponentStatus, string> = {
  not_started:   "bg-muted-foreground/40",
  in_progress:   "bg-blue-400",
  demo_approved: "bg-orange-400",
  complete:      "bg-teal",
  disregarded:   "bg-muted-foreground/30",
};

// ucId -> componentName -> importance level
type ImportanceMap = Record<string, Record<string, string>>;

function ImportanceDropdown({ value, onChange }: { value: Importance | null; onChange: (v: Importance) => void }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const cfg = value ? IMPORTANCE_CONFIG[value] : null;

  function handleOpen() {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setOpen((o) => !o);
  }

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        className={cn(
          "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors whitespace-nowrap",
          cfg
            ? cfg.className
            : "bg-muted/40 text-muted-foreground/50 border-border hover:border-primary/30 hover:text-muted-foreground"
        )}
      >
        {cfg && <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", cfg.dotClass)} />}
        {cfg ? cfg.label : "Set importance"}
        <ChevronDown className="h-2.5 w-2.5 opacity-60" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="fixed z-50 min-w-[140px] rounded-md border border-border bg-card shadow-lg py-1"
            style={{ top: pos.top, right: pos.right }}
          >
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
                  <span className={value === level ? lcfg.className.split(" ").find(c => c.startsWith("text-")) : "text-foreground/80"}>
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

function StatusDropdown({ value, onChange }: { value: ComponentStatus; onChange: (v: ComponentStatus) => void }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const cfg = STATUS_CONFIG[value];

  function handleOpen() {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setOpen((o) => !o);
  }

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        title="Click to change status"
      >
        <Badge
          variant="outline"
          className={cn("text-[10px] font-medium cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap flex items-center gap-1", cfg.className)}
        >
          {cfg.label}
          <ChevronDown className="h-2.5 w-2.5 opacity-60" />
        </Badge>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="fixed z-50 min-w-[150px] rounded-md border border-border bg-card shadow-lg py-1"
            style={{ top: pos.top, right: pos.right }}
          >
            {STATUS_CYCLE.map((status) => {
              const scfg = STATUS_CONFIG[status];
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => { onChange(status); setOpen(false); }}
                  className={cn(
                    "flex items-center gap-2 w-full px-3 py-1.5 text-xs text-left transition-colors hover:bg-muted/50",
                    value === status ? "font-semibold" : "font-normal"
                  )}
                >
                  <span className={cn("h-2 w-2 rounded-full shrink-0", STATUS_DOT[status])} />
                  <span className={value === status ? scfg.className.split(" ").find(c => c.startsWith("text-")) : "text-foreground/80"}>
                    {scfg.label}
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

interface ProspectCardProps {
  prospect: Prospect;
  importance: ImportanceMap;
  importanceSessionId?: string;
  onEdit: () => void;
}

export function ProspectCard({ prospect, importance: importanceProp, importanceSessionId, onEdit }: ProspectCardProps) {
  const [snapshot, setSnapshot] = useState<SnapshotUseCase[]>(
    (prospect.use_case_snapshot as SnapshotUseCase[]) ?? []
  );
  const [statuses, setStatuses] = useState<Record<string, Record<string, ComponentStatus>>>(
    (prospect.component_statuses as Record<string, Record<string, ComponentStatus>>) ?? {}
  );
  const [importance, setImportance] = useState<ImportanceMap>(importanceProp);

  useEffect(() => {
    setSnapshot((prospect.use_case_snapshot as SnapshotUseCase[]) ?? []);
    setStatuses((prospect.component_statuses as Record<string, Record<string, ComponentStatus>>) ?? {});
  }, [prospect.use_case_snapshot, prospect.component_statuses]);

  useEffect(() => {
    setImportance(importanceProp);
  }, [importanceProp]);

  // Per-use-case draft component: ucId -> draft text | null
  const [collapsed, setCollapsed] = useState(true);

  // Per-use-case draft component: ucId -> draft text | null
  const [drafts, setDrafts] = useState<Record<string, string | null>>({});
  const draftRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Inline component edit: { ucId, original, text } | null
  const [editing, setEditing] = useState<{ ucId: string; original: string; text: string } | null>(null);
  const editRef = useRef<HTMLInputElement | null>(null);

  async function persistSnapshot(next: SnapshotUseCase[]) {
    const supabase = createClient();
    await supabase.from("pov_prospects").update({ use_case_snapshot: next }).eq("id", prospect.id);
  }

  async function persistStatuses(next: Record<string, Record<string, ComponentStatus>>) {
    const supabase = createClient();
    await supabase.from("pov_prospects").update({ component_statuses: next }).eq("id", prospect.id);
  }

  function persistImportance(next: ImportanceMap) {
    if (!importanceSessionId) return;
    const supabase = createClient();
    supabase.from("meeting_sessions").update({ component_importance: next }).eq("id", importanceSessionId).then(() => {});
  }

  function getStatus(ucId: string, component: string): ComponentStatus {
    return statuses[ucId]?.[component] ?? "not_started";
  }

  function setStatus(ucId: string, component: string, next: ComponentStatus) {
    const nextStatuses = {
      ...statuses,
      [ucId]: { ...(statuses[ucId] ?? {}), [component]: next },
    };
    setStatuses(nextStatuses);
    persistStatuses(nextStatuses);
  }

  function setImportanceLevel(ucId: string, component: string, level: Importance) {
    const nextImportance = {
      ...importance,
      [ucId]: { ...(importance[ucId] ?? {}), [component]: level },
    };
    setImportance(nextImportance);
    persistImportance(nextImportance);
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

  function startEdit(ucId: string, component: string) {
    setEditing({ ucId, original: component, text: component });
    setTimeout(() => editRef.current?.focus(), 0);
  }

  function saveEdit() {
    if (!editing) return;
    const { ucId, original, text } = editing;
    const trimmed = text.trim();
    if (!trimmed || trimmed === original) { setEditing(null); return; }
    const next = snapshot.map((uc) =>
      uc.id === ucId
        ? { ...uc, components: uc.components.map((c) => (c === original ? trimmed : c)) }
        : uc
    );
    // Migrate status key to new name
    const nextStatuses = { ...statuses };
    if (nextStatuses[ucId]?.[original] !== undefined) {
      const { [original]: val, ...rest } = nextStatuses[ucId];
      nextStatuses[ucId] = { ...rest, [trimmed]: val };
    }
    // Migrate importance key to new name
    const nextImportance = { ...importance };
    if (nextImportance[ucId]?.[original] !== undefined) {
      const { [original]: impVal, ...impRest } = nextImportance[ucId];
      nextImportance[ucId] = { ...impRest, [trimmed]: impVal };
    }
    setSnapshot(next);
    setStatuses(nextStatuses);
    setImportance(nextImportance);
    setEditing(null);
    persistSnapshot(next);
    persistStatuses(nextStatuses);
    persistImportance(nextImportance);
  }

  function removeComponent(ucId: string, component: string) {
    const next = snapshot.map((uc) =>
      uc.id === ucId ? { ...uc, components: uc.components.filter((c) => c !== component) } : uc
    );
    const nextStatuses = { ...statuses };
    if (nextStatuses[ucId]) {
      const { [component]: _, ...rest } = nextStatuses[ucId];
      nextStatuses[ucId] = rest;
    }
    const nextImportance = { ...importance };
    if (nextImportance[ucId]) {
      const { [component]: __, ...impRest } = nextImportance[ucId];
      nextImportance[ucId] = impRest;
    }
    setSnapshot(next);
    setStatuses(nextStatuses);
    setImportance(nextImportance);
    persistSnapshot(next);
    persistStatuses(nextStatuses);
    persistImportance(nextImportance);
  }

  const completionSummary = snapshot.map((uc) => {
    const title = uc.title || `${uc.roi_stat} ${uc.roi_description}`;
    if (!uc.components.length) return { id: uc.id, title, done: 0, total: 0, pct: null as number | null };
    const done = uc.components.filter((c) => getStatus(uc.id, c) === "complete").length;
    return { id: uc.id, title, done, total: uc.components.length, pct: Math.round((done / uc.components.length) * 100) };
  });
  const totalDone = completionSummary.reduce((a, s) => a + s.done, 0);
  const totalComponents = completionSummary.reduce((a, s) => a + s.total, 0);
  const totalPct = totalComponents > 0 ? Math.round((totalDone / totalComponents) * 100) : null;

  return (
    <Card className="border-border bg-secondary/20 w-full overflow-hidden">
      <CardContent className="p-0">
        {/* Header — elevated background for visual contrast */}
        <div className={cn("flex justify-between p-5 bg-primary/10", collapsed ? "items-center pb-5" : "items-start pb-4")}>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-3 flex-wrap">
              <h2 className="text-lg font-semibold leading-tight">{prospect.org_name}</h2>
              {prospect.contact_name && (
                <span className="text-sm text-muted-foreground">
                  Contact: <span className="text-foreground/80">{prospect.contact_name}</span>
                </span>
              )}
            </div>
            {!collapsed && prospect.main_goals && (
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                <span className="text-foreground/60 font-medium">Main goals: </span>
                {prospect.main_goals}
              </p>
            )}
            {!collapsed && (prospect.kickoff_date || prospect.end_date) && (
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
            {/* Completion summary card — only when expanded */}
            {!collapsed && totalComponents > 0 && (
              <div className="mt-3 rounded-lg border border-border/60 bg-background/40 px-4 py-3 flex items-start gap-4">
                <div className="shrink-0 text-center min-w-[3rem]">
                  <div className="text-3xl font-bold leading-none">{totalPct}%</div>
                  <div className="text-[10px] text-muted-foreground mt-1">overall</div>
                </div>
                <div className="w-px self-stretch bg-border/60 shrink-0" />
                <div className="flex-1 min-w-0 space-y-1">
                  {completionSummary.map((s) => (
                    <div key={s.id} className="flex items-center justify-between gap-3">
                      <span className="text-[11px] text-muted-foreground truncate">{s.title}</span>
                      <span className="text-[11px] font-semibold tabular-nums shrink-0 text-foreground/80">
                        {s.pct != null ? `${s.pct}%` : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0 ml-4">
            {/* Overall % shown inline when collapsed */}
            {collapsed && totalPct != null && (
              <span className="text-lg font-bold tabular-nums">{totalPct}%</span>
            )}
            <button onClick={onEdit} className="text-muted-foreground hover:text-foreground transition-colors" title="Edit">
              <Pencil className="h-4 w-4" />
            </button>
            <button onClick={() => setCollapsed((c) => !c)} className="text-muted-foreground hover:text-foreground transition-colors" title={collapsed ? "Expand" : "Collapse"}>
              <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", !collapsed && "rotate-180")} />
            </button>
          </div>
        </div>

        {/* Use cases from snapshot */}
        {!collapsed && snapshot.length > 0 && (
          <div className="border-t border-border px-5 py-4 space-y-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Use cases to test
            </p>
            {snapshot.map((uc) => {
              const ucSummary = completionSummary.find((s) => s.id === uc.id);
              const draft = drafts[uc.id];
              return (
                <div key={uc.id}>
                  {/* Use case header — same fixed grid as component rows */}
                  <div className="grid grid-cols-[1fr_7rem_8rem_1rem] items-center gap-x-3 mb-2">
                    <div className="flex items-center gap-2 min-w-0 flex-wrap">
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
                    </div>
                    {/* Spans importance + status cols — centers label at their boundary */}
                    <div className="col-span-2 flex justify-center">
                      <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                        {ucSummary?.pct != null ? `${ucSummary.pct}%` : ""}
                      </span>
                    </div>
                    <div /> {/* X col placeholder */}
                  </div>

                  {/* Components */}
                  <div className="space-y-1.5 pl-3 border-l border-border">
                    {uc.components.map((component) => {
                      const isEditing = editing?.ucId === uc.id && editing.original === component;
                      const status = getStatus(uc.id, component);
                      const impLevel = (importance[uc.id]?.[component] ?? null) as Importance | null;
                      return (
                        <div key={component} className="grid grid-cols-[1fr_7rem_8rem_1rem] items-center gap-x-3 group">
                          {/* Col 1: text + pencil */}
                          {isEditing ? (
                            <input
                              ref={editRef}
                              type="text"
                              value={editing.text}
                              onChange={(e) => setEditing((s) => s ? { ...s, text: e.target.value } : s)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveEdit();
                                if (e.key === "Escape") setEditing(null);
                              }}
                              className="bg-transparent text-sm outline-none border-b border-primary/60 py-0.5 transition-colors"
                            />
                          ) : (
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className={cn(
                                "text-sm leading-snug truncate",
                                status === "disregarded" && "line-through text-muted-foreground/50"
                              )}>
                                {component}
                              </span>
                              <button
                                onClick={() => startEdit(uc.id, component)}
                                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all shrink-0"
                                title="Edit component"
                              >
                                <Pencil className="h-3 w-3" />
                              </button>
                            </div>
                          )}

                          {/* Col 2: importance dropdown (or check when editing) */}
                          {isEditing ? (
                            <button
                              onClick={saveEdit}
                              className={cn(
                                "shrink-0 transition-colors",
                                editing.text.trim() && editing.text.trim() !== editing.original
                                  ? "text-primary"
                                  : "text-muted-foreground/40 pointer-events-none"
                              )}
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <ImportanceDropdown
                              value={impLevel}
                              onChange={(v) => setImportanceLevel(uc.id, component, v)}
                            />
                          )}

                          {/* Col 3: status dropdown (or empty when editing) */}
                          {isEditing ? (
                            <div />
                          ) : (
                            <StatusDropdown
                              value={status}
                              onChange={(v) => setStatus(uc.id, component, v)}
                            />
                          )}

                          {/* Col 4: X (remove or cancel edit) */}
                          {isEditing ? (
                            <button
                              onClick={() => setEditing(null)}
                              className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => removeComponent(uc.id, component)}
                              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all shrink-0"
                              title="Remove component"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}

                    {/* Draft row */}
                    {draft != null && (
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
                        <button
                          onClick={() => setDrafts((d) => ({ ...d, [uc.id]: null }))}
                          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Add component */}
                    {draft == null && (
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
