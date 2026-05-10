import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { BookOpen, Clock, Play, Target } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: profile }, { data: recentSessions }, { data: goals }] = await Promise.all([
    supabase.from("profiles").select("name").eq("id", user!.id).single(),
    supabase
      .from("meeting_sessions")
      .select("id, prospect_name, prospect_company, next_step, created_at")
      .eq("consultant_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("pov_goals")
      .select("id, status")
      .eq("consultant_id", user!.id),
  ]);

  const firstName = profile?.name?.split(" ")[0] ?? "there";
  const inProgressGoals = goals?.filter((g) => g.status === "in_progress").length ?? 0;
  const totalGoals = goals?.length ?? 0;

  return (
    <div className="p-8 max-w-4xl">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Good to see you, {firstName}
        </h1>
        <p className="text-muted-foreground mt-1">
          Ready for your next POV meeting?
        </p>
      </div>

      {/* Primary CTA */}
      <Card className="mb-8 border-primary/20 bg-primary/5">
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <h2 className="text-lg font-semibold">Start a new meeting</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Browse your use case library live with a prospect
            </p>
          </div>
          <Link
            href="/meeting/new"
            className={cn(buttonVariants({ size: "lg" }), "bg-primary text-primary-foreground hover:bg-primary/90 gap-2 shrink-0")}
          >
            <Play className="h-4 w-4" />
            Start Meeting
          </Link>
        </CardContent>
      </Card>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card className="border-border bg-secondary/40">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue/10">
                <Clock className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{recentSessions?.length ?? 0}</p>
                <p className="text-xs text-muted-foreground">Past sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-secondary/40">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Target className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{inProgressGoals}</p>
                <p className="text-xs text-muted-foreground">Goals in progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-secondary/40">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green/10">
                <BookOpen className="h-4 w-4 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{totalGoals}</p>
                <p className="text-xs text-muted-foreground">Total goals</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent sessions */}
      <Card className="border-border bg-secondary/40">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent meetings</CardTitle>
              <CardDescription className="text-xs mt-0.5">Your last {recentSessions?.length ?? 0} sessions</CardDescription>
            </div>
            <Link href="/history" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-primary hover:text-primary")}>
              View all
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {!recentSessions?.length ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground text-sm">No meetings yet.</p>
              <p className="text-muted-foreground text-xs mt-1">Start your first meeting above.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {session.prospect_name
                        ? `${session.prospect_name}${session.prospect_company ? ` · ${session.prospect_company}` : ""}`
                        : "Unnamed prospect"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
                      {session.next_step && (
                        <span className="ml-2 capitalize text-primary/80">
                          · {session.next_step.replace(/_/g, " ")}
                        </span>
                      )}
                    </p>
                  </div>
                  <Link href={`/history/${session.id}`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "shrink-0 ml-4 text-xs text-muted-foreground")}>
                    View
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
