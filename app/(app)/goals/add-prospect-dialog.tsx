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
import { useEffect, useState } from "react";
import type { Prospect, UseCase } from "./types";

interface AddProspectDialogProps {
  consultantId: string;
  useCases: UseCase[];
  onSaved: () => void;
  // Edit mode
  editProspect?: Prospect | null;
  editOpen?: boolean;
  onEditOpenChange?: (open: boolean) => void;
}

const EMPTY_FORM = {
  org_name: "",
  contact_name: "",
  main_goals: "",
  kickoff_date: "",
  end_date: "",
  linked_use_case_ids: [] as string[],
};

export function AddProspectDialog({
  consultantId,
  useCases,
  onSaved,
  editProspect,
  editOpen,
  onEditOpenChange,
}: AddProspectDialogProps) {
  const isEditMode = onEditOpenChange != null;
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (editProspect) {
      setForm({
        org_name: editProspect.org_name,
        contact_name: editProspect.contact_name ?? "",
        main_goals: editProspect.main_goals ?? "",
        kickoff_date: editProspect.kickoff_date ?? "",
        end_date: editProspect.end_date ?? "",
        linked_use_case_ids: editProspect.linked_use_case_ids ?? [],
      });
    }
  }, [editProspect]);

  const open = isEditMode ? (editOpen ?? false) : addOpen;

  function handleOpenChange(val: boolean) {
    if (isEditMode) {
      onEditOpenChange?.(val);
    } else {
      setAddOpen(val);
      if (!val) setForm(EMPTY_FORM);
    }
  }

  function set(field: string, value: string) {
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
    if (!form.org_name.trim()) return;
    setSaving(true);
    const supabase = createClient();

    // Build snapshot from selected use cases
    const selectedUseCases = useCases.filter((uc) =>
      form.linked_use_case_ids.includes(uc.id)
    );

    let use_case_snapshot;
    if (isEditMode && editProspect) {
      // Preserve prospect-specific components for unchanged use cases
      const existingSnapshot = (editProspect.use_case_snapshot ?? []) as import("./types").SnapshotUseCase[];
      use_case_snapshot = selectedUseCases.map((uc) => {
        const existing = existingSnapshot.find((s) => s.id === uc.id);
        return existing ?? {
          id: uc.id,
          title: uc.title,
          pain_point_tag: uc.pain_point_tag,
          roi_stat: uc.roi_stat,
          roi_description: uc.roi_description,
          components: [...(uc.components ?? [])],
        };
      });
    } else {
      use_case_snapshot = selectedUseCases.map((uc) => ({
        id: uc.id,
        title: uc.title,
        pain_point_tag: uc.pain_point_tag,
        roi_stat: uc.roi_stat,
        roi_description: uc.roi_description,
        components: [...(uc.components ?? [])],
      }));
    }

    const payload = {
      org_name: form.org_name.trim(),
      contact_name: form.contact_name.trim() || null,
      main_goals: form.main_goals.trim() || null,
      kickoff_date: form.kickoff_date || null,
      end_date: form.end_date || null,
      linked_use_case_ids: form.linked_use_case_ids,
      use_case_snapshot,
    };

    if (isEditMode && editProspect) {
      await supabase.from("pov_prospects").update(payload).eq("id", editProspect.id);
    } else {
      await supabase.from("pov_prospects").insert({ ...payload, consultant_id: consultantId });
    }

    setSaving(false);
    handleOpenChange(false);
    if (!isEditMode) setForm(EMPTY_FORM);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!isEditMode && (
        <DialogTrigger
          className={cn(buttonVariants({ size: "sm" }), "gap-2 bg-primary text-primary-foreground hover:bg-primary/90")}
        >
          <Plus className="h-4 w-4" />
          Add Prospect
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit prospect" : "Add prospect"}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isEditMode ? "Update this POV record." : "Start tracking a new proof-of-value engagement."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="org_name">Organization *</Label>
              <Input
                id="org_name"
                placeholder="e.g. Acme Corp"
                value={form.org_name}
                onChange={(e) => set("org_name", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contact_name">Contact</Label>
              <Input
                id="contact_name"
                placeholder="e.g. Jane Smith"
                value={form.contact_name}
                onChange={(e) => set("contact_name", e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="main_goals">Main goals</Label>
            <Textarea
              id="main_goals"
              placeholder="What does this prospect need to prove during the POV?"
              rows={2}
              value={form.main_goals}
              onChange={(e) => set("main_goals", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="kickoff_date">Kickoff date</Label>
              <Input
                id="kickoff_date"
                type="date"
                value={form.kickoff_date}
                onChange={(e) => set("kickoff_date", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end_date">End date</Label>
              <Input
                id="end_date"
                type="date"
                value={form.end_date}
                onChange={(e) => set("end_date", e.target.value)}
              />
            </div>
          </div>

          {useCases.length > 0 && (
            <div className="grid gap-2">
              <Label>Use cases to test</Label>
              <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                {useCases.map((uc) => (
                  <button
                    key={uc.id}
                    type="button"
                    onClick={() => toggleUseCase(uc.id)}
                    className={cn(
                      "flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-left transition-colors",
                      form.linked_use_case_ids.includes(uc.id)
                        ? "bg-primary/10 text-primary border-primary/40"
                        : "bg-transparent text-muted-foreground border-border hover:border-primary/30"
                    )}
                  >
                    <span className="font-medium truncate">{uc.title || `${uc.roi_stat} ${uc.roi_description}`}</span>
                    <span className="ml-auto text-xs opacity-60 shrink-0">{uc.pain_point_tag}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !form.org_name.trim()}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {saving ? "Saving…" : isEditMode ? "Update prospect" : "Save prospect"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
