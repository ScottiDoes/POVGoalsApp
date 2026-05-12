import { createClient } from "@/lib/supabase/server";
import { ProgressClient } from "./progress-client";

export default async function ProgressPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: prospects }, { data: useCases }, { data: recentSessions }] = await Promise.all([
    supabase
      .from("pov_prospects")
      .select("*")
      .eq("consultant_id", user!.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("use_cases_consultant")
      .select("id, title, pain_point_tag, roi_stat, roi_description, components")
      .eq("consultant_id", user!.id)
      .eq("is_hidden", false),
    supabase
      .from("meeting_sessions")
      .select("id, prospect_id, component_importance")
      .eq("consultant_id", user!.id)
      .not("prospect_id", "is", null)
      .order("created_at", { ascending: false }),
  ]);

  // Keep only the most recent session per prospect
  const importanceByProspect: Record<string, Record<string, Record<string, string>>> = {};
  const sessionIdByProspect: Record<string, string> = {};
  for (const s of recentSessions ?? []) {
    const ci = s.component_importance as Record<string, Record<string, string>> | null;
    if (s.prospect_id && !importanceByProspect[s.prospect_id] && ci && Object.keys(ci).length > 0) {
      importanceByProspect[s.prospect_id] = ci;
      sessionIdByProspect[s.prospect_id] = s.id;
    }
  }

  return (
    <ProgressClient
      prospects={prospects ?? []}
      useCases={useCases ?? []}
      consultantId={user!.id}
      importanceByProspect={importanceByProspect}
      sessionIdByProspect={sessionIdByProspect}
    />
  );
}
