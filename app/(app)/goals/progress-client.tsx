"use client";

import { cn } from "@/lib/utils";
import { Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AddProspectDialog } from "./add-prospect-dialog";
import { ProspectCard } from "./prospect-card";
import type { Prospect, UseCase } from "./types";

interface ProgressClientProps {
  prospects: Prospect[];
  useCases: UseCase[];
  consultantId: string;
  importanceByProspect: Record<string, Record<string, Record<string, string>>>;
  sessionIdByProspect: Record<string, string>;
}

export function ProgressClient({ prospects, useCases, consultantId, importanceByProspect, sessionIdByProspect }: ProgressClientProps) {
  const router = useRouter();
  const [editingProspect, setEditingProspect] = useState<Prospect | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  function openEdit(p: Prospect) {
    setEditingProspect(p);
    setEditOpen(true);
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">POV Progress</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {prospects.length} active engagement{prospects.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AddProspectDialog
            consultantId={consultantId}
            useCases={useCases}
            onSaved={() => router.refresh()}
          />
          {/* Controlled edit dialog */}
          <AddProspectDialog
            consultantId={consultantId}
            useCases={useCases}
            onSaved={() => { router.refresh(); setEditingProspect(null); }}
            editProspect={editingProspect}
            editOpen={editOpen}
            onEditOpenChange={(val) => { setEditOpen(val); if (!val) setEditingProspect(null); }}
          />
        </div>
      </div>

      {/* Cards */}
      {prospects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Users className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="font-medium">No prospects yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Add your first POV engagement to start tracking progress.
          </p>
          <div className="mt-4">
            <AddProspectDialog
              consultantId={consultantId}
              useCases={useCases}
              onSaved={() => router.refresh()}
            />
          </div>
        </div>
      ) : (
        <div className="grid gap-5 grid-cols-1 xl:grid-cols-2">
          {prospects.map((p) => (
            <ProspectCard
              key={p.id}
              prospect={p}
              importance={importanceByProspect[p.id] ?? {}}
              importanceSessionId={sessionIdByProspect[p.id]}
              onEdit={() => openEdit(p)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
