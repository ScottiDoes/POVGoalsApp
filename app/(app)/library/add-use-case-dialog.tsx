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
import { Check, GripVertical, Pencil, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { UseCase } from "./types";

const PAIN_POINT_TAGS = [
  "Revenue Growth",
  "Cost Reduction",
  "Risk & Compliance",
  "Productivity",
  "Customer Success",
  "Other",
];

interface AddUseCaseDialogProps {
  consultantId: string;
  onSaved: () => void;
  // Edit mode — controlled externally
  editUseCase?: UseCase | null;
  editOpen?: boolean;
  onEditOpenChange?: (open: boolean) => void;
}

export function AddUseCaseDialog({
  consultantId,
  onSaved,
  editUseCase,
  editOpen,
  onEditOpenChange,
}: AddUseCaseDialogProps) {
  const isEditMode = editUseCase != null;
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    pain_point_tag: PAIN_POINT_TAGS[0],
    before_text: "",
    after_text: "",
    roi_stat: "",
    roi_description: "",
  });
  const [components, setComponents] = useState<string[]>([]);
  const [draftComponent, setDraftComponent] = useState<string | null>(null);
  const draftInputRef = useRef<HTMLInputElement>(null);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");

  // Populate form when switching into edit mode
  useEffect(() => {
    if (editUseCase) {
      setForm({
        title: editUseCase.title,
        pain_point_tag: editUseCase.pain_point_tag,
        before_text: editUseCase.before_text,
        after_text: editUseCase.after_text,
        roi_stat: editUseCase.roi_stat,
        roi_description: editUseCase.roi_description ?? "",
      });
      setComponents(editUseCase.components ?? []);
      setDraftComponent(null);
    }
  }, [editUseCase]);

  const open = isEditMode ? (editOpen ?? false) : addOpen;

  function handleOpenChange(val: boolean) {
    if (isEditMode) {
      onEditOpenChange?.(val);
    } else {
      setAddOpen(val);
      if (!val) {
        setForm({ title: "", pain_point_tag: PAIN_POINT_TAGS[0], before_text: "", after_text: "", roi_stat: "", roi_description: "" });
        setComponents([]);
        setDraftComponent(null);
      }
    }
  }

  function addDraftComponent() {
    setDraftComponent("");
    setTimeout(() => draftInputRef.current?.focus(), 0);
  }

  function saveDraftComponent() {
    const text = draftComponent?.trim();
    if (text) setComponents((c) => [...c, text]);
    setDraftComponent(null);
  }

  function removeComponent(i: number) {
    setComponents((c) => c.filter((_, idx) => idx !== i));
  }

  function startEditing(i: number) {
    setEditingIdx(i);
    setEditingText(components[i]);
  }

  function saveEdit(i: number) {
    const text = editingText.trim();
    if (text) setComponents((c) => c.map((v, idx) => (idx === i ? text : v)));
    setEditingIdx(null);
  }

  function handleDragOver(e: React.DragEvent, i: number) {
    e.preventDefault();
    if (draggingIdx === null || draggingIdx === i) return;
    setComponents((c) => {
      const next = [...c];
      const [item] = next.splice(draggingIdx, 1);
      next.splice(i, 0, item);
      return next;
    });
    setDraggingIdx(i);
  }

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave() {
    if (!form.title || !form.before_text || !form.after_text || !form.roi_stat) return;
    setSaving(true);
    const supabase = createClient();
    if (isEditMode) {
      await supabase.from("use_cases_consultant").update({
        title: form.title,
        pain_point_tag: form.pain_point_tag,
        before_text: form.before_text,
        after_text: form.after_text,
        roi_stat: form.roi_stat,
        roi_description: form.roi_description,
        components,
      }).eq("id", editUseCase!.id);
    } else {
      await supabase.from("use_cases_consultant").insert({
        consultant_id: consultantId,
        title: form.title,
        pain_point_tag: form.pain_point_tag,
        before_text: form.before_text,
        after_text: form.after_text,
        roi_stat: form.roi_stat,
        roi_description: form.roi_description,
        components,
      });
    }
    setSaving(false);
    handleOpenChange(false);
    if (!isEditMode) setForm({ title: "", pain_point_tag: PAIN_POINT_TAGS[0], before_text: "", after_text: "", roi_stat: "", roi_description: "" });
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {onEditOpenChange == null && (
        <DialogTrigger className={cn(buttonVariants({ size: "sm" }), "gap-2 bg-primary text-primary-foreground hover:bg-primary/90")}>
          <Plus className="h-4 w-4" />
          Add Use Case
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit use case" : "Add use case"}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isEditMode ? "Update this use case in your library." : "Add a personal use case to your library."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Title */}
          <div className="grid gap-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="e.g. Faster Sales Onboarding"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </div>

          {/* Pain point tag */}
          <div className="grid gap-2">
            <Label>Pain point</Label>
            <div className="flex flex-wrap gap-2">
              {PAIN_POINT_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => set("pain_point_tag", tag)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                    form.pain_point_tag === tag
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-transparent text-muted-foreground border-border hover:border-primary/40"
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* ROI */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="roi_stat">ROI stat *</Label>
              <Input
                id="roi_stat"
                placeholder="e.g. 40%"
                value={form.roi_stat}
                onChange={(e) => set("roi_stat", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="roi_description">Description</Label>
              <Input
                id="roi_description"
                placeholder="e.g. faster onboarding"
                value={form.roi_description}
                onChange={(e) => set("roi_description", e.target.value)}
              />
            </div>
          </div>

          {/* Before / After */}
          <div className="grid gap-2">
            <Label htmlFor="before_text">Before state *</Label>
            <Textarea
              id="before_text"
              placeholder="How things work today without the solution..."
              rows={2}
              value={form.before_text}
              onChange={(e) => set("before_text", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="after_text">After state *</Label>
            <Textarea
              id="after_text"
              placeholder="How things work with the solution..."
              rows={2}
              value={form.after_text}
              onChange={(e) => set("after_text", e.target.value)}
            />
          </div>
          {/* Components */}
          <div className="grid gap-2">
            <Label>Components</Label>
            <div className="rounded-md border border-border bg-muted/20 p-3 space-y-1">
              {components.map((text, i) => (
                <div
                  key={i}
                  draggable
                  onDragStart={() => setDraggingIdx(i)}
                  onDragOver={(e) => handleDragOver(e, i)}
                  onDragEnd={() => setDraggingIdx(null)}
                  className={cn(
                    "flex items-center gap-2 text-sm group",
                    draggingIdx === i && "opacity-40"
                  )}
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground/40 cursor-grab shrink-0" />
                  {editingIdx === i ? (
                    <>
                      <input
                        autoFocus
                        type="text"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { e.preventDefault(); saveEdit(i); }
                          if (e.key === "Escape") setEditingIdx(null);
                        }}
                        className="flex-1 bg-transparent text-sm outline-none border-b border-primary/60 py-0.5 transition-colors"
                      />
                      <button type="button" onClick={() => saveEdit(i)} className="text-primary hover:text-primary/80 shrink-0">
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1">{text}</span>
                      <button
                        type="button"
                        onClick={() => startEditing(i)}
                        className="text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeComponent(i)}
                        className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
              ))}

              {draftComponent !== null && (
                <div className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-muted-foreground/40 shrink-0" />
                  <input
                    ref={draftInputRef}
                    type="text"
                    value={draftComponent}
                    onChange={(e) => setDraftComponent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); saveDraftComponent(); }
                      if (e.key === "Escape") setDraftComponent(null);
                    }}
                    placeholder="Component name…"
                    className="flex-1 bg-transparent text-sm outline-none border-b border-border focus:border-primary/60 py-0.5 transition-colors placeholder:text-muted-foreground/50"
                  />
                  <button
                    type="button"
                    onClick={saveDraftComponent}
                    className={cn(
                      "shrink-0 transition-colors",
                      draftComponent.trim() ? "text-primary hover:text-primary/80" : "text-muted-foreground/40 pointer-events-none"
                    )}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={addDraftComponent}
                className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Add component
              </button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !form.title || !form.before_text || !form.after_text || !form.roi_stat}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {saving ? "Saving…" : isEditMode ? "Update use case" : "Save use case"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
