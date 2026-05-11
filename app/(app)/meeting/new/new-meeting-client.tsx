"use client";

import { cn } from "@/lib/utils";
import { Building2, UserRound } from "lucide-react";
import { useState } from "react";

interface Prospect {
  id: string;
  org_name: string;
  contact_name: string | null;
}

interface NewMeetingClientProps {
  prospects: Prospect[];
  action: (formData: FormData) => Promise<void>;
}

export function NewMeetingClient({ prospects, action }: NewMeetingClientProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = prospects.find((p) => p.id === selectedId) ?? null;

  return (
    <form action={action} className="grid gap-6">
      {prospects.length > 0 && (
        <div className="grid gap-2">
          <p className="text-sm font-medium">Select a prospect</p>
          <div className="grid gap-2">
            {prospects.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedId(selectedId === p.id ? null : p.id)}
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors",
                  selectedId === p.id
                    ? "border-primary/50 bg-primary/10 text-foreground"
                    : "border-border bg-secondary/40 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                )}
              >
                <div className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                  selectedId === p.id ? "bg-primary/20" : "bg-muted"
                )}>
                  <Building2 className={cn("h-4 w-4", selectedId === p.id ? "text-primary" : "text-muted-foreground")} />
                </div>
                <div className="min-w-0">
                  <p className={cn("text-sm font-medium", selectedId === p.id && "text-foreground")}>
                    {p.org_name}
                  </p>
                  {p.contact_name && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <UserRound className="h-3 w-3" />
                      {p.contact_name}
                    </p>
                  )}
                </div>
                {selectedId === p.id && (
                  <div className="ml-auto h-2 w-2 rounded-full bg-primary shrink-0" />
                )}
              </button>
            ))}
          </div>
          {prospects.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Or leave unselected to enter details manually below.
            </p>
          )}
        </div>
      )}

      {/* Hidden fields populated from selected prospect */}
      <input type="hidden" name="prospect_id" value={selectedId ?? ""} />
      <input type="hidden" name="prospect_name" value={selected?.contact_name ?? ""} />
      <input type="hidden" name="prospect_company" value={selected?.org_name ?? ""} />

      {!selected && (
        <div className="grid gap-4">
          {prospects.length > 0 && (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-background px-2 text-muted-foreground">or enter manually</span>
              </div>
            </div>
          )}
          <div className="grid gap-2">
            <label htmlFor="manual_name" className="text-sm font-medium">Prospect name</label>
            <input
              id="manual_name"
              name="prospect_name"
              placeholder="e.g. Jane Smith"
              autoComplete="off"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="manual_company" className="text-sm font-medium">Company</label>
            <input
              id="manual_company"
              name="prospect_company"
              placeholder="e.g. Acme Corp"
              autoComplete="off"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        </div>
      )}

      <button
        type="submit"
        className="mt-2 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring w-full"
      >
        Start Meeting
      </button>
    </form>
  );
}
