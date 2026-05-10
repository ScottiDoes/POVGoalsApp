import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Play } from "lucide-react";
import { redirect } from "next/navigation";

async function startMeeting(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const prospect_name = (formData.get("prospect_name") as string)?.trim() || null;
  const prospect_company = (formData.get("prospect_company") as string)?.trim() || null;

  const { data: session } = await supabase
    .from("meeting_sessions")
    .insert({ consultant_id: user!.id, prospect_name, prospect_company })
    .select("id")
    .single();

  redirect(`/meeting/${session!.id}`);
}

export default function NewMeetingPage() {
  return (
    <div className="p-8 max-w-lg">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Start a meeting</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Prospect info is optional — you can add it in the summary.
        </p>
      </div>

      <form action={startMeeting} className="grid gap-5">
        <div className="grid gap-2">
          <Label htmlFor="prospect_name">Prospect name</Label>
          <Input
            id="prospect_name"
            name="prospect_name"
            placeholder="e.g. Jane Smith"
            autoComplete="off"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="prospect_company">Company</Label>
          <Input
            id="prospect_company"
            name="prospect_company"
            placeholder="e.g. Acme Corp"
            autoComplete="off"
          />
        </div>

        <button
          type="submit"
          className={cn(
            buttonVariants({ size: "lg" }),
            "mt-2 bg-primary text-primary-foreground hover:bg-primary/90 gap-2 w-full"
          )}
        >
          <Play className="h-4 w-4" />
          Start Meeting
        </button>
      </form>
    </div>
  );
}
