"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { useState } from "react";
import type { GoalStatus, UseCaseSummary } from "./types";

const STATUSES: { value: GoalStatus; label: string }[] = [
  { value: "not_started", label: "Not Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "achieved", label: "Achieved" },
];

interface AddGoalDialogProps {
  consultantId: string;
  useCases: UseCaseSummary[];
  onSaved: () => void;
}

export function AddGoalDialog({ consultantId, useCases, onSaved }: AddGoalDialogProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    success_metric: "",
    status: "not_started" as GoalStatus,
    linked_use_case_ids: [] as string[],
  });

  function set<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function toggleUseCase(id: string) {
    setForm((f) => ({
      ...f,
      linked_use_case_ids: f.linked_use_case_ids.includes(id)
        ? f.linked_use_case_ids.filter((x) => x !== id)
        : [...f.linked_use_case_ids, id],
    }));
  }

  async function handleSave() {
    if (!form.title || !form.success_metric) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from("pov_goals").insert({
      consultant_id: consultantId,
      title: form.title,
      success_metric: form.success_metric,
      status: form.status,
      linked_use_case_ids: form.linked_use_case_ids,
    });
    setSaving(false);
    setOpen(false);
    setForm({ title: "", success_metric: "", status: "not_started", linked_use_case_ids: [] });
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={cn(buttonVariants({ size: "sm" }), "gap-2 bg-primary text-primary-foreground hover:bg-primary/90")}>
        <Plus className="h-4 w-4" />
        Add Goal
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle>Add POV goal</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Define a goal to track during your proof of value.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="title">Goal title *</Label>
            <Input
              id="title"
              placeholder="e.g. Reduce onboarding time by 40%"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="success_metric">Success metric *</Label>
            <Textarea
              id="success_metric"
              placeholder="How will you measure success?"
              rows={2}
              value={form.success_metric}
              onChange={(e) => set("success_metric", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label>Status</Label>
            <div className="flex gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => set("status", s.value)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                    form.status === s.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-transparent text-muted-foreground border-border hover:border-primary/40"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {useCases.length > 0 && (
            <div className="grid gap-2">
              <Label>Link use cases</Label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {useCases.map((uc) => (
                  <button
                    key={uc.id}
                    type="button"
                    onClick={() => toggleUseCase(uc.id)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium border transition-colors text-left",
                      form.linked_use_case_ids.includes(uc.id)
                        ? "bg-primary/10 text-primary border-primary/40"
                        : "bg-transparent text-muted-foreground border-border hover:border-primary/40"
                    )}
                  >
                    <span className="font-bold">{uc.roi_stat}</span>
                    {uc.roi_description && <span className="ml-1">{uc.roi_description}</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !form.title || !form.success_metric}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {saving ? "Saving…" : "Save goal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
