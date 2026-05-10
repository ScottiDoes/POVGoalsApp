import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SummaryClient } from "../../meeting/[id]/summary/summary-client";

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
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
    <div className="p-8">
      <Link
        href="/history"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-2 text-muted-foreground mb-6 -ml-2")}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to history
      </Link>

      <SummaryClient
        session={session}
        resonatedUseCases={resonatedUseCases ?? []}
        readOnly={true}
      />
    </div>
  );
}
