"use client";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AddUseCaseDialog } from "./add-use-case-dialog";
import { ComponentsSection } from "./components-section";
import { UseCase } from "./types";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, Pencil, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const PAIN_POINT_COLORS: Record<string, string> = {
  "Revenue Growth":    "bg-teal/10 text-teal border-teal/20",
  "Cost Reduction":    "bg-blue/10 text-blue-400 border-blue/20",
  "Risk & Compliance": "bg-pink/10 text-pink-400 border-pink/20",
  "Productivity":      "bg-orange/10 text-orange-400 border-orange/20",
  "Customer Success":  "bg-green/10 text-green-400 border-green/20",
};

function tagColor(tag: string) {
  return PAIN_POINT_COLORS[tag] ?? "bg-muted text-muted-foreground border-border";
}

interface LibraryClientProps {
  useCases: UseCase[];
  consultantId: string;
  isAdmin: boolean;
}

export function LibraryClient({ useCases, consultantId, isAdmin }: LibraryClientProps) {
  const router = useRouter();
  const [activeTag, setActiveTag] = useState<string>("All");
  const [showHidden, setShowHidden] = useState(false);
  const [editingUseCase, setEditingUseCase] = useState<UseCase | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const allTags = ["All", ...Array.from(new Set(useCases.map((u) => u.pain_point_tag))).sort()];

  const visible = useCases.filter((u) => {
    const tagMatch = activeTag === "All" || u.pain_point_tag === activeTag;
    const hiddenMatch = showHidden || !u.is_hidden;
    return tagMatch && hiddenMatch;
  });

  function openEdit(uc: UseCase) {
    setEditingUseCase(uc);
    setEditOpen(true);
  }

  async function toggleHidden(id: string, current: boolean) {
    const supabase = createClient();
    await supabase
      .from("use_cases_consultant")
      .update({ is_hidden: !current })
      .eq("id", id);
    router.refresh();
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Use Case Library</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {useCases.length} use case{useCases.length !== 1 ? "s" : ""} · your personal library
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHidden((v) => !v)}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-2 text-xs"
            )}
          >
            {showHidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {showHidden ? "Hide hidden" : "Show hidden"}
          </button>
          <AddUseCaseDialog consultantId={consultantId} onSaved={() => router.refresh()} />
          {/* Controlled edit dialog — no trigger, opened programmatically */}
          <AddUseCaseDialog
            consultantId={consultantId}
            onSaved={() => { router.refresh(); setEditingUseCase(null); }}
            editUseCase={editingUseCase}
            editOpen={editOpen}
            onEditOpenChange={(val) => { setEditOpen(val); if (!val) setEditingUseCase(null); }}
          />
        </div>
      </div>

      {/* Pain point filter tabs */}
      {useCases.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-6">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                activeTag === tag
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-transparent text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Use case cards */}
      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="font-medium">
            {useCases.length === 0 ? "Your library is empty" : "No matching use cases"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {useCases.length === 0
              ? "Add your first use case to get started"
              : "Try a different filter"}
          </p>
          {useCases.length === 0 && (
            <div className="mt-4">
              <AddUseCaseDialog consultantId={consultantId} onSaved={() => router.refresh()} />
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 xl:grid-cols-2">
          {visible.map((uc) => (
            <Card
              key={uc.id}
              className={cn(
                "border-border bg-secondary/40 transition-opacity",
                uc.is_hidden && "opacity-50"
              )}
            >
              <CardContent className="p-5">
                {/* Title + actions row */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  {uc.title ? (
                    <h3 className="font-semibold text-base leading-snug">{uc.title}</h3>
                  ) : (
                    <span />
                  )}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => openEdit(uc)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => toggleHidden(uc.id, uc.is_hidden)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      title={uc.is_hidden ? "Show" : "Hide"}
                    >
                      {uc.is_hidden
                        ? <EyeOff className="h-4 w-4" />
                        : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Tag */}
                <div className="mb-3">
                  <Badge
                    variant="outline"
                    className={cn("text-xs font-medium", tagColor(uc.pain_point_tag))}
                  >
                    {uc.pain_point_tag}
                  </Badge>
                </div>

                {/* ROI stat */}
                <div className="mb-3">
                  <span className="text-2xl font-bold text-primary">{uc.roi_stat}</span>
                  <span className="text-sm text-muted-foreground ml-2">{uc.roi_description}</span>
                </div>

                {/* Before / After */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-md bg-muted/50 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Before</p>
                    <p className="text-sm leading-snug">{uc.before_text}</p>
                  </div>
                  <div className="rounded-md bg-primary/5 border border-primary/10 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-primary/60 mb-1">After</p>
                    <p className="text-sm leading-snug">{uc.after_text}</p>
                  </div>
                </div>

                {/* Components */}
                <ComponentsSection components={uc.components ?? []} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
