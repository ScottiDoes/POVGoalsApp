"use client";

import { cn } from "@/lib/utils";
import { Building2, ChevronRight, Rocket, RotateCcw, UserRound } from "lucide-react";
import { useState } from "react";

type MeetingType = "kickoff" | "continuation";

interface Prospect {
  id: string;
  org_name: string;
  contact_name: string | null;
}

interface NewMeetingClientProps {
  prospects: Prospect[];
  action: (formData: FormData) => Promise<void>;
}

const MEETING_TYPES: {
  value: MeetingType;
  label: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
}[] = [
  {
    value: "kickoff",
    label: "POV Kickoff",
    description: "First meeting — discover pain points, align on goals, set expectations.",
    icon: Rocket,
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
  },
  {
    value: "continuation",
    label: "POV Continuation",
    description: "Follow-up meeting — walk through use cases, capture screenshots, track progress.",
    icon: RotateCcw,
    iconColor: "text-blue-400",
    iconBg: "bg-blue/10",
  },
];

export function NewMeetingClient({ prospects, action }: NewMeetingClientProps) {
  const [meetingType, setMeetingType] = useState<MeetingType | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = prospects.find((p) => p.id === selectedId) ?? null;

  return (
    <form action={action} className="grid gap-8">

      {/* Step 1 — Meeting type */}
      <div className="grid gap-3">
        <p className="text-sm font-semibold">1. Choose meeting type</p>
        <div className="grid gap-2.5">
          {MEETING_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setMeetingType(t.value)}
              className={cn(
                "flex items-center gap-4 rounded-lg border px-4 py-3.5 text-left transition-colors",
                meetingType === t.value
                  ? "border-primary/50 bg-primary/10"
                  : "border-border bg-secondary/40 hover:border-primary/30 hover:bg-secondary/60"
              )}
            >
              <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-md", t.iconBg)}>
                <t.icon className={cn("h-4 w-4", t.iconColor)} />
              </div>
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm font-semibold", meetingType === t.value ? "text-primary" : "text-foreground")}>
                  {t.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {t.description}
                </p>
              </div>
              {meetingType === t.value && (
                <div className="ml-auto h-2 w-2 rounded-full bg-primary shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Step 2 — Prospect (only shown after type is chosen) */}
      {meetingType && (
        <div className="grid gap-3">
          <p className="text-sm font-semibold">2. Select a prospect</p>
          {prospects.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No prospects yet — add one in POV Progress first.
            </p>
          ) : (
            <div className="grid gap-2">
              {prospects.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedId(selectedId === p.id ? null : p.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors",
                    selectedId === p.id
                      ? "border-primary/50 bg-primary/10"
                      : "border-border bg-secondary/40 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                  )}
                >
                  <div className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                    selectedId === p.id ? "bg-primary/20" : "bg-muted"
                  )}>
                    <Building2 className={cn("h-4 w-4", selectedId === p.id ? "text-primary" : "text-muted-foreground")} />
                  </div>
                  <div className="min-w-0">
                    <p className={cn("text-sm font-medium", selectedId === p.id && "text-foreground")}>
                      {p.org_name}
                    </p>
                    {p.contact_name && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <UserRound className="h-3 w-3" />
                        {p.contact_name}
                      </p>
                    )}
                  </div>
                  {selectedId === p.id && (
                    <div className="ml-auto h-2 w-2 rounded-full bg-primary shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Hidden fields */}
      <input type="hidden" name="meeting_type" value={meetingType ?? ""} />
      <input type="hidden" name="prospect_id" value={selectedId ?? ""} />
      <input type="hidden" name="prospect_name" value={selected?.contact_name ?? ""} />
      <input type="hidden" name="prospect_company" value={selected?.org_name ?? ""} />

      {/* Submit */}
      {meetingType && (
        <button
          type="submit"
          disabled={!selectedId}
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-md px-6 py-2.5 text-sm font-medium shadow transition-colors w-full",
            selectedId
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          Begin {MEETING_TYPES.find((t) => t.value === meetingType)?.label}
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </form>
  );
}
