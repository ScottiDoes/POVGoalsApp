import { createClient } from "@/lib/supabase/server";
import { ProgressClient } from "./progress-client";

export default async function ProgressPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: prospects }, { data: useCases }] = await Promise.all([
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
  ]);

  return (
    <ProgressClient
      prospects={prospects ?? []}
      useCases={useCases ?? []}
      consultantId={user!.id}
    />
  );
}
