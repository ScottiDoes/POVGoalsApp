import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MeetingClient } from "./meeting-client";

export default async function MeetingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: session }, { data: useCases }] = await Promise.all([
    supabase
      .from("meeting_sessions")
      .select("*")
      .eq("id", id)
      .eq("consultant_id", user!.id)
      .single(),
    supabase
      .from("use_cases_consultant")
      .select("id, pain_point_tag, roi_stat, roi_description, before_text, after_text")
      .eq("consultant_id", user!.id)
      .eq("is_hidden", false),
  ]);

  if (!session) redirect("/home");

  return (
    <MeetingClient
      session={session}
      useCases={useCases ?? []}
    />
  );
}
