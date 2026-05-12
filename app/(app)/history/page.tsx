import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CalendarDays, ChevronRight, History } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

const NEXT_STEP_LABELS: Record<string, string> = {
  technical_deep_dive: "Technical Deep Dive",
  pilot_scoping:       "Pilot Scoping",
  stakeholder_review:  "Stakeholder Review",
  send_materials:      "Send Materials",
  other:               "Other",
};

export default async function HistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: sessions } = await supabase
    .from("meeting_sessions")
    .select("id, prospect_name, prospect_company, resonated_use_case_ids, next_step, created_at, meeting_type")
    .eq("consultant_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Meeting History</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {sessions?.length ?? 0} session{(sessions?.length ?? 0) !== 1 ? "s" : ""} recorded
        </p>
      </div>

      {!sessions?.length ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <History className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="font-medium">No meetings yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Start a meeting from the Home screen.
          </p>
          <Link
            href="/home"
            className={cn(buttonVariants(), "mt-4 bg-primary text-primary-foreground hover:bg-primary/90")}
          >
            Go to Home
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
          {sessions.map((session) => {
            const label = session.prospect_name
              ? `${session.prospect_name}${session.prospect_company ? ` · ${session.prospect_company}` : ""}`
              : session.prospect_company ?? "Unnamed prospect";

            return (
              <Link
                key={session.id}
                href={`/history/${session.id}`}
                className="flex items-center justify-between p-4 bg-secondary/20 hover:bg-secondary/50 transition-colors group"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{label}</p>
                    <span className={cn(
                      "shrink-0 text-[10px] font-semibold uppercase tracking-wide rounded-full px-2 py-0.5 border",
                      session.meeting_type === "kickoff"
                        ? "bg-primary/10 text-primary border-primary/20"
                        : "bg-blue/10 text-blue-400 border-blue/20"
                    )}>
                      {session.meeting_type === "kickoff" ? "Kickoff" : "Continuation"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <CalendarDays className="h-3 w-3" />
                      {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
                    </span>
                    {(session.resonated_use_case_ids?.length ?? 0) > 0 && (
                      <span className="text-xs text-primary/80">
                        {session.resonated_use_case_ids!.length} resonated
                      </span>
                    )}
                    {session.next_step && (
                      <span className="text-xs text-muted-foreground">
                        {NEXT_STEP_LABELS[session.next_step] ?? session.next_step}
                      </span>
                    )}
                  </div>
                </div>

                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-4 group-hover:text-foreground transition-colors" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
