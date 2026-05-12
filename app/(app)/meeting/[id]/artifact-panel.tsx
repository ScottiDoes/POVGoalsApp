"use client";

import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Camera, Download, ImagePlus, Loader2, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CropModal } from "./crop-modal";

interface Artifact {
  id: string;
  storage_path: string;
  note: string | null;
  url: string;
}

interface ArtifactPanelProps {
  sessionId: string;
  prospectId: string | null;
  ucId: string;
  componentName: string;
  consultantId: string;
}

// Slugify component name for use in storage path
function slug(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function ArtifactPanel({
  sessionId,
  prospectId,
  ucId,
  componentName,
  consultantId,
}: ArtifactPanelProps) {
  const [open, setOpen] = useState(false);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [pendingBitmap, setPendingBitmap] = useState<ImageBitmap | null>(null);
  const [editingNote, setEditingNote] = useState<string | null>(null); // artifact id being edited
  const [noteValue, setNoteValue] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  // Load artifacts when panel opens
  useEffect(() => {
    if (!open) return;
    loadArtifacts();
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  async function loadArtifacts() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("component_artifacts")
      .select("*")
      .eq("session_id", sessionId)
      .eq("use_case_id", ucId)
      .eq("component_name", componentName)
      .order("created_at", { ascending: true });

    if (data) {
      const withUrls = await Promise.all(
        data.map(async (a) => {
          const { data: urlData } = await supabase.storage
            .from("artifacts")
            .createSignedUrl(a.storage_path, 3600);
          return { ...a, url: urlData?.signedUrl ?? "" };
        })
      );
      setArtifacts(withUrls);
    }
    setLoading(false);
  }

  async function capture() {
    setCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 1 },
        audio: false,
      });
      const track = stream.getVideoTracks()[0];
      const imageCapture = new (window as any).ImageCapture(track);
      const bitmap = await imageCapture.grabFrame();
      stream.getTracks().forEach((t) => t.stop());
      // Hand off to crop modal — close thumbnail panel so modal has full screen
      setOpen(false);
      setPendingBitmap(bitmap);
    } catch (err: any) {
      if (err?.name !== "NotAllowedError" && err?.name !== "AbortError") {
        console.error("Capture error:", err);
      }
    } finally {
      setCapturing(false);
    }
  }

  async function uploadCrop(blob: Blob) {
    const artifactId = crypto.randomUUID();
    const storagePath = `${consultantId}/${sessionId}/${ucId}/${slug(componentName)}/${artifactId}.png`;
    const supabase = createClient();

    const { error: uploadError } = await supabase.storage
      .from("artifacts")
      .upload(storagePath, blob, { contentType: "image/png" });
    if (uploadError) throw uploadError;

    const { data: row, error: insertError } = await supabase
      .from("component_artifacts")
      .insert({
        session_id: sessionId,
        prospect_id: prospectId,
        use_case_id: ucId,
        component_name: componentName,
        storage_path: storagePath,
        note: null,
      })
      .select()
      .single();
    if (insertError) throw insertError;

    const { data: urlData } = await supabase.storage
      .from("artifacts")
      .createSignedUrl(storagePath, 3600);

    const newArtifact: Artifact = { ...row, url: urlData?.signedUrl ?? "" };
    setArtifacts((prev) => [...prev, newArtifact]);
    setEditingNote(newArtifact.id);
    setNoteValue("");
    setPendingBitmap(null);
    setOpen(true); // re-open panel to show the new thumbnail
  }

  async function saveNote(artifactId: string) {
    const supabase = createClient();
    await supabase
      .from("component_artifacts")
      .update({ note: noteValue.trim() || null })
      .eq("id", artifactId);
    setArtifacts((prev) =>
      prev.map((a) => (a.id === artifactId ? { ...a, note: noteValue.trim() || null } : a))
    );
    setEditingNote(null);
  }

  async function deleteArtifact(artifact: Artifact) {
    const supabase = createClient();
    await supabase.storage.from("artifacts").remove([artifact.storage_path]);
    await supabase.from("component_artifacts").delete().eq("id", artifact.id);
    setArtifacts((prev) => prev.filter((a) => a.id !== artifact.id));
  }

  async function download(artifact: Artifact) {
    const a = document.createElement("a");
    a.href = artifact.url;
    a.download = `${slug(componentName)}-${artifact.id.slice(0, 8)}.png`;
    a.click();
  }

  return (
    <>
    {pendingBitmap && (
      <CropModal
        bitmap={pendingBitmap}
        onConfirm={uploadCrop}
        onCancel={() => { setPendingBitmap(null); setOpen(true); }}
      />
    )}
    <div className="relative" ref={panelRef}>
      {/* Camera trigger button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Screenshots"
        className={cn(
          "flex items-center justify-center h-6 w-6 rounded transition-colors",
          artifacts.length > 0
            ? "text-primary"
            : "text-muted-foreground/40 hover:text-muted-foreground",
          open && "text-primary"
        )}
      >
        <Camera className="h-3.5 w-3.5" />
        {artifacts.length > 0 && (
          <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center leading-none">
            {artifacts.length}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-72 rounded-lg border border-border bg-card shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Screenshots
            </span>
            <button
              onClick={capture}
              disabled={capturing}
              className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
            >
              {capturing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Camera className="h-3.5 w-3.5" />
              )}
              {capturing ? "Capturing…" : "Capture"}
            </button>
          </div>

          {/* Thumbnail grid */}
          <div className="p-3 space-y-3 max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : artifacts.length === 0 ? (
              /* Placeholder */
              <button
                onClick={capture}
                disabled={capturing}
                className="w-full flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 transition-colors py-6 text-muted-foreground hover:text-primary disabled:opacity-50"
              >
                <ImagePlus className="h-6 w-6" />
                <span className="text-xs font-medium">Add screenshot</span>
              </button>
            ) : (
              artifacts.map((artifact) => (
                <div key={artifact.id} className="space-y-1.5">
                  {/* Thumbnail */}
                  <div className="relative group rounded-md overflow-hidden border border-border">
                    {artifact.url && (
                      <img
                        src={artifact.url}
                        alt={artifact.note ?? "Screenshot"}
                        className="w-full h-32 object-cover"
                      />
                    )}
                    {/* Hover actions */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        onClick={() => download(artifact)}
                        className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteArtifact(artifact)}
                        className="p-1.5 rounded-full bg-white/20 hover:bg-red-500/80 text-white transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Note */}
                  {editingNote === artifact.id ? (
                    <div className="flex gap-1.5">
                      <input
                        autoFocus
                        type="text"
                        placeholder="Describe this screenshot…"
                        value={noteValue}
                        onChange={(e) => setNoteValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveNote(artifact.id);
                          if (e.key === "Escape") setEditingNote(null);
                        }}
                        className="flex-1 text-xs rounded border border-border bg-secondary/40 px-2 py-1 outline-none focus:border-primary/60"
                      />
                      <button
                        onClick={() => saveNote(artifact.id)}
                        className="text-xs text-primary font-medium px-2"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingNote(null)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingNote(artifact.id);
                        setNoteValue(artifact.note ?? "");
                      }}
                      className="w-full text-left text-xs text-muted-foreground hover:text-foreground transition-colors truncate"
                    >
                      {artifact.note || (
                        <span className="italic opacity-60">Add a note…</span>
                      )}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
    </>
  );
}
