import { createClient } from "@/lib/supabase/server";
import { LibraryClient } from "./library-client";

export default async function LibraryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: useCases } = await supabase
    .from("use_cases_consultant")
    .select("*")
    .eq("consultant_id", user!.id)
    .order("created_at", { ascending: true });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();

  return (
    <LibraryClient
      useCases={useCases ?? []}
      consultantId={user!.id}
      isAdmin={profile?.role === "admin"}
    />
  );
}
