import { createClient } from "@/lib/supabase/server";
import { GoalsClient } from "./goals-client";

export default async function GoalsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: goals }, { data: useCases }] = await Promise.all([
    supabase
      .from("pov_goals")
      .select("*")
      .eq("consultant_id", user!.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("use_cases_consultant")
      .select("id, pain_point_tag, roi_stat, roi_description")
      .eq("consultant_id", user!.id)
      .eq("is_hidden", false),
  ]);

  return (
    <GoalsClient
      goals={goals ?? []}
      useCases={useCases ?? []}
      consultantId={user!.id}
    />
  );
}
