"use client";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Check, ClipboardCopy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Database } from "@/lib/database.types";

type Session = Database["public"]["Tables"]["meeting_sessions"]["Row"];
type NextStepType = Database["public"]["Enums"]["next_step_type"];

type UseCase = {
  id: string;
  pain_point_tag: string;
  roi_stat: string;
  roi_description: string;
  before_text: string;
  after_text: string;
};

const NEXT_STEPS: { value: NextStepType; label: string }[] = [
  { value: "technical_deep_dive", label: "Technical Deep Dive" },
  { value: "pilot_scoping",       label: "Pilot Scoping" },
  { value: "stakeholder_review",  label: "Stakeholder Review" },
  { value: "send_materials",      label: "Send Materials" },
  { value: "other",               label: "Other" },
];

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

interface SummaryClientProps {
  session: Session;
  resonatedUseCases: UseCase[];
  readOnly: boolean;
}

export function SummaryClient({ session, resonatedUseCases, readOnly }: SummaryClientProps) {
  const router = useRouter();
  const [nextStep, setNextStep] = useState<NextStepType | null>(session.next_step ?? null);
  const [nextStepOther, setNextStepOther] = useState(session.next_step_other ?? "");
  const [notes, setNotes] = useState(session.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const prospectLabel = session.prospect_name
    ? `${session.prospect_name}${session.prospect_company ? ` · ${session.prospect_company}` : ""}`
    : session.prospect_company ?? "Unnamed prospect";

  function buildExportText() {
    const lines: string[] = [];
    lines.push(`POV Meeting Summary`);
    if (session.prospect_name || session.prospect_company) {
      lines.push(`Prospect: ${prospectLabel}`);
    }
    lines.push(`Date: ${new Date(session.created_at).toLocaleDateString()}`);
    lines.push("");

    if (resonatedUseCases.length > 0) {
      lines.push("Resonated Use Cases:");
      resonatedUseCases.forEach((uc) => {
        lines.push(`  • ${uc.roi_stat} ${uc.roi_description} (${uc.pain_point_tag})`);
      });
      lines.push("");
    }

    if (nextStep) {
      const label = NEXT_STEPS.find((s) => s.value === nextStep)?.label ?? nextStep;
      lines.push(`Next Step: ${label}${nextStep === "other" && nextStepOther ? ` — ${nextStepOther}` : ""}`);
    }

    if (notes.trim()) {
      lines.push("");
      lines.push("Notes:");
      lines.push(notes.trim());
    }

    return lines.join("\n");
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(buildExportText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleFinish() {
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("meeting_sessions")
      .update({
        next_step: nextStep,
        next_step_other: nextStep === "other" ? nextStepOther : null,
        notes: notes.trim() || null,
      })
      .eq("id", session.id);
    router.push("/history");
  }

  return (
    <div className="p-8 max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Meeting Summary</h1>
        <p className="text-muted-foreground mt-1 text-sm">{prospectLabel}</p>
      </div>

      {/* Resonated use cases */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Resonated ({resonatedUseCases.length})
        </h2>
        {resonatedUseCases.length === 0 ? (
          <p className="text-sm text-muted-foreground">No use cases marked as resonating.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {resonatedUseCases.map((uc) => (
              <div
                key={uc.id}
                className="flex items-center gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-2"
              >
                <Badge
                  variant="outline"
                  className={cn("text-[10px] shrink-0", tagColor(uc.pain_point_tag))}
                >
                  {uc.pain_point_tag}
                </Badge>
                <span className="text-sm font-bold text-primary">{uc.roi_stat}</span>
                {uc.roi_description && (
                  <span className="text-xs text-muted-foreground">{uc.roi_description}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Next step */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Next Step
        </h2>
        {readOnly ? (
          <p className="text-sm">
            {nextStep
              ? NEXT_STEPS.find((s) => s.value === nextStep)?.label
              : <span className="text-muted-foreground">Not set</span>}
            {nextStep === "other" && nextStepOther && ` — ${nextStepOther}`}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {NEXT_STEPS.map((s) => (
              <button
                key={s.value}
                onClick={() => setNextStep(nextStep === s.value ? null : s.value)}
                className={cn(
                  "rounded-lg border px-4 py-3 text-sm font-medium text-left transition-colors",
                  nextStep === s.value
                    ? "bg-primary/10 text-primary border-primary/40"
                    : "bg-secondary/40 text-foreground border-border hover:border-primary/30"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
        {!readOnly && nextStep === "other" && (
          <input
            type="text"
            placeholder="Describe the next step…"
            value={nextStepOther}
            onChange={(e) => setNextStepOther(e.target.value)}
            className="mt-2 w-full rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm outline-none focus:border-primary/60"
          />
        )}
      </section>

      {/* Notes */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Notes
        </h2>
        {readOnly ? (
          <p className="text-sm whitespace-pre-wrap">
            {notes || <span className="text-muted-foreground">No notes.</span>}
          </p>
        ) : (
          <Textarea
            placeholder="Any notes from the meeting…"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        )}
      </section>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleCopy}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "gap-2"
          )}
        >
          {copied ? <Check className="h-4 w-4 text-primary" /> : <ClipboardCopy className="h-4 w-4" />}
          {copied ? "Copied!" : "Copy summary"}
        </button>

        {!readOnly && (
          <button
            onClick={handleFinish}
            disabled={saving}
            className={cn(
              buttonVariants(),
              "bg-primary text-primary-foreground hover:bg-primary/90 ml-auto"
            )}
          >
            {saving ? "Saving…" : "Finish & save"}
          </button>
        )}
      </div>
    </div>
  );
}
