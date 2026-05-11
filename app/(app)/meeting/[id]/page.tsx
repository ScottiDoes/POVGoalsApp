import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MeetingClient } from "./meeting-client";

export default async function MeetingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: session } = await supabase
    .from("meeting_sessions")
    .select("*")
    .eq("id", id)
    .eq("consultant_id", user!.id)
    .single();

  if (!session) redirect("/home");

  // Fetch prospect snapshot if this session is linked to one
  let prospect = null;
  if (session.prospect_id) {
    const { data } = await supabase
      .from("pov_prospects")
      .select("id, org_name, contact_name, main_goals, kickoff_date, end_date, use_case_snapshot, component_statuses")
      .eq("id", session.prospect_id)
      .single();
    prospect = data;
  }

  return (
    <MeetingClient
      session={session}
      prospect={prospect}
    />
  );
}
