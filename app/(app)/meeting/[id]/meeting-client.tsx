"use client";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { CheckCircle2, ChevronLeft, ChevronRight, Library } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Database } from "@/lib/database.types";

type Session = Database["public"]["Tables"]["meeting_sessions"]["Row"];
type UseCase = {
  id: string;
  pain_point_tag: string;
  roi_stat: string;
  roi_description: string;
  before_text: string;
  after_text: string;
};

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

interface MeetingClientProps {
  session: Session;
  useCases: UseCase[];
}

export function MeetingClient({ session, useCases }: MeetingClientProps) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [resonated, setResonated] = useState<Set<string>>(
    new Set(session.resonated_use_case_ids ?? [])
  );

  if (useCases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center p-8">
        <Library className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">No use cases in your library</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Add use cases to your library before running a meeting.
        </p>
        <Link
          href="/library"
          className={cn(buttonVariants(), "bg-primary text-primary-foreground hover:bg-primary/90")}
        >
          Go to Library
        </Link>
      </div>
    );
  }

  const current = useCases[index];
  const isResonated = resonated.has(current.id);
  const isFirst = index === 0;
  const isLast = index === useCases.length - 1;

  function toggleResonance() {
    const next = new Set(resonated);
    if (isResonated) {
      next.delete(current.id);
    } else {
      next.add(current.id);
    }
    setResonated(next);
    const supabase = createClient();
    supabase
      .from("meeting_sessions")
      .update({ resonated_use_case_ids: [...next] })
      .eq("id", session.id)
      .then(() => {});
  }

  function prev() {
    setIndex((i) => Math.max(0, i - 1));
  }

  function next() {
    setIndex((i) => Math.min(useCases.length - 1, i + 1));
  }

  function done() {
    router.push(`/meeting/${session.id}/summary`);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-0px)] p-6 gap-6">
      {/* Top bar */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground font-medium">
            {index + 1} / {useCases.length}
          </span>
          {/* Progress dots */}
          <div className="flex gap-1.5">
            {useCases.map((uc, i) => (
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
                title={`Use case ${i + 1}`}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {resonated.size} resonated
          </span>
          <button
            onClick={done}
            className={cn(
              buttonVariants({ size: "sm" }),
              "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            Done
          </button>
        </div>
      </div>

      {/* Use case card */}
      <div className="flex-1 flex items-center justify-center min-h-0">
        <div className="w-full max-w-3xl">
          {/* Tag */}
          <div className="flex justify-center mb-6">
            <Badge
              variant="outline"
              className={cn("text-sm font-medium px-4 py-1", tagColor(current.pain_point_tag))}
            >
              {current.pain_point_tag}
            </Badge>
          </div>

          {/* ROI */}
          <div className="text-center mb-8">
            <p className="text-7xl font-bold text-primary leading-none mb-2">
              {current.roi_stat}
            </p>
            {current.roi_description && (
              <p className="text-xl text-muted-foreground">{current.roi_description}</p>
            )}
          </div>

          {/* Before / After */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="rounded-xl bg-muted/50 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Before
              </p>
              <p className="text-base leading-relaxed">{current.before_text}</p>
            </div>
            <div className="rounded-xl bg-primary/5 border border-primary/15 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-primary/60 mb-3">
                After
              </p>
              <p className="text-base leading-relaxed">{current.after_text}</p>
            </div>
          </div>

          {/* Navigation + Resonance */}
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={prev}
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
              <CheckCircle2 className={cn("h-5 w-5", isResonated ? "fill-primary-foreground" : "")} />
              {isResonated ? "Resonated!" : "This resonates"}
            </button>

            <button
              onClick={next}
              disabled={isLast}
              className={cn(
                buttonVariants({ size: "lg" }),
                "gap-2 min-w-[120px] bg-primary text-primary-foreground hover:bg-primary/90",
                isLast && "opacity-30 pointer-events-none"
              )}
            >
              Next
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
