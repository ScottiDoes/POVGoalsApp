import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SummaryClient } from "./summary-client";

export default async function SummaryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: session } = await supabase
    .from("meeting_sessions")
    .select("*")
    .eq("id", id)
    .eq("consultant_id", user!.id)
    .single();

  if (!session) redirect("/history");

  const resonatedIds = session.resonated_use_case_ids ?? [];
  const { data: resonatedUseCases } = resonatedIds.length > 0
    ? await supabase
        .from("use_cases_consultant")
        .select("id, pain_point_tag, roi_stat, roi_description, before_text, after_text")
        .in("id", resonatedIds)
    : { data: [] };

  return (
    <SummaryClient
      session={session}
      resonatedUseCases={resonatedUseCases ?? []}
      readOnly={false}
    />
  );
}
