import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { NewMeetingClient } from "./new-meeting-client";

async function startMeeting(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const prospect_id = (formData.get("prospect_id") as string)?.trim() || null;
  const prospect_name = (formData.get("prospect_name") as string)?.trim() || null;
  const prospect_company = (formData.get("prospect_company") as string)?.trim() || null;

  const { data: session } = await supabase
    .from("meeting_sessions")
    .insert({
      consultant_id: user!.id,
      prospect_name,
      prospect_company,
      ...(prospect_id ? { prospect_id } : {}),
    })
    .select("id")
    .single();

  redirect(`/meeting/${session!.id}`);
}

export default async function NewMeetingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: prospects } = await supabase
    .from("pov_prospects")
    .select("id, org_name, contact_name")
    .eq("consultant_id", user!.id)
    .order("org_name", { ascending: true });

  return (
    <div className="p-8 max-w-lg">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Start a meeting</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Select a prospect from your POV tracker to begin.
        </p>
      </div>

      <NewMeetingClient prospects={prospects ?? []} action={startMeeting} />
    </div>
  );
}
