import { Sidebar } from "@/components/layout/sidebar";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, email")
    .eq("id", user.id)
    .single();

  const userName = profile?.name ?? user.email?.split("@")[0] ?? "Consultant";
  const userEmail = profile?.email ?? user.email ?? "";

  return (
    <div className="flex h-screen bg-background">
      <Sidebar userName={userName} userEmail={userEmail} />
      <main className="flex-1 ml-[240px] overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
