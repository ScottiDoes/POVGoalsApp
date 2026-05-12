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
  const meeting_type = ((formData.get("meeting_type") as string)?.trim() || "continuation") as "kickoff" | "continuation";

  const { data: session } = await supabase
    .from("meeting_sessions")
    .insert({
      consultant_id: user!.id,
      prospect_name,
      prospect_company,
      meeting_type,
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
          Choose a meeting type, then select your prospect.
        </p>
      </div>

      <NewMeetingClient prospects={prospects ?? []} action={startMeeting} />
    </div>
  );
}
