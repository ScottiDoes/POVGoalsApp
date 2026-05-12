"use client";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Rect { x: number; y: number; w: number; h: number; }

interface CropModalProps {
  bitmap: ImageBitmap;
  onConfirm: (blob: Blob) => Promise<void>;
  onCancel: () => void;
}

export function CropModal({ bitmap, onConfirm, onCancel }: CropModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState(1);
  const [selection, setSelection] = useState<Rect | null>(null);
  const [dragging, setDragging] = useState(false);
  const [start, setStart] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);

  // Draw the bitmap onto the canvas scaled to fit the viewport
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const maxW = window.innerWidth - 96;
    const maxH = window.innerHeight - 160;
    const s = Math.min(maxW / bitmap.width, maxH / bitmap.height, 1);
    canvas.width = Math.round(bitmap.width * s);
    canvas.height = Math.round(bitmap.height * s);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    setScale(s);
    setSelection(null);
  }, [bitmap]);

  // Clamp a point to canvas bounds
  function clamp(pos: { x: number; y: number }) {
    const canvas = canvasRef.current!;
    return {
      x: Math.max(0, Math.min(pos.x, canvas.width)),
      y: Math.max(0, Math.min(pos.y, canvas.height)),
    };
  }

  function getPos(e: React.MouseEvent) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return clamp({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  function onMouseDown(e: React.MouseEvent) {
    const pos = getPos(e);
    setStart(pos);
    setSelection({ x: pos.x, y: pos.y, w: 0, h: 0 });
    setDragging(true);
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!dragging) return;
    const pos = getPos(e);
    setSelection({
      x: Math.min(start.x, pos.x),
      y: Math.min(start.y, pos.y),
      w: Math.abs(pos.x - start.x),
      h: Math.abs(pos.y - start.y),
    });
  }

  function onMouseUp() {
    setDragging(false);
    // Discard tiny accidental drags
    setSelection((s) => (s && s.w > 8 && s.h > 8 ? s : null));
  }

  async function handleConfirm() {
    if (!selection) return;
    setSaving(true);
    // Scale selection back to original bitmap resolution
    const sx = selection.x / scale;
    const sy = selection.y / scale;
    const sw = selection.w / scale;
    const sh = selection.h / scale;
    const out = document.createElement("canvas");
    out.width = Math.round(sw);
    out.height = Math.round(sh);
    out.getContext("2d")!.drawImage(bitmap, sx, sy, sw, sh, 0, 0, out.width, out.height);
    const blob = await new Promise<Blob>((res) => out.toBlob((b) => res(b!), "image/png"));
    await onConfirm(blob);
    setSaving(false);
  }

  const hasValidSelection = selection && selection.w > 8 && selection.h > 8;
  const dimLabel = hasValidSelection
    ? `${Math.round(selection!.w / scale)} × ${Math.round(selection!.h / scale)} px`
    : null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/85 backdrop-blur-sm">

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 shrink-0 border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-white/80">
            Drag to select the region to save
          </span>
          {dimLabel && (
            <span className="text-xs tabular-nums text-white/40 bg-white/10 rounded px-2 py-0.5">
              {dimLabel}
            </span>
          )}
        </div>
        <button
          onClick={onCancel}
          className="text-white/50 hover:text-white transition-colors"
          title="Cancel"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Canvas area */}
      <div className="flex-1 flex items-center justify-center overflow-hidden p-6">
        <div
          className="relative select-none cursor-crosshair"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          {/* The screenshot */}
          <canvas
            ref={canvasRef}
            className="block rounded-md shadow-2xl ring-1 ring-white/10"
          />

          {/* Dim overlay: 4 rects around the selection */}
          {hasValidSelection && (
            <>
              {/* Top */}
              <div
                className="absolute inset-x-0 top-0 bg-black/55 pointer-events-none"
                style={{ height: selection!.y }}
              />
              {/* Bottom */}
              <div
                className="absolute inset-x-0 bottom-0 bg-black/55 pointer-events-none"
                style={{ top: selection!.y + selection!.h }}
              />
              {/* Left */}
              <div
                className="absolute left-0 bg-black/55 pointer-events-none"
                style={{ top: selection!.y, width: selection!.x, height: selection!.h }}
              />
              {/* Right */}
              <div
                className="absolute right-0 bg-black/55 pointer-events-none"
                style={{
                  top: selection!.y,
                  left: selection!.x + selection!.w,
                  height: selection!.h,
                }}
              />

              {/* Selection border + handles */}
              <div
                className="absolute border-2 border-white pointer-events-none"
                style={{
                  left: selection!.x,
                  top: selection!.y,
                  width: selection!.w,
                  height: selection!.h,
                }}
              >
                {/* Corner handles */}
                {[
                  { top: -4, left: -4 },
                  { top: -4, right: -4 },
                  { bottom: -4, left: -4 },
                  { bottom: -4, right: -4 },
                ].map((style, i) => (
                  <div
                    key={i}
                    className="absolute h-2.5 w-2.5 rounded-sm bg-white shadow"
                    style={style as React.CSSProperties}
                  />
                ))}
                {/* Edge midpoint handles */}
                {[
                  { top: "50%", left: -4, transform: "translateY(-50%)" },
                  { top: "50%", right: -4, transform: "translateY(-50%)" },
                  { left: "50%", top: -4, transform: "translateX(-50%)" },
                  { left: "50%", bottom: -4, transform: "translateX(-50%)" },
                ].map((style, i) => (
                  <div
                    key={i + 4}
                    className="absolute h-2 w-2 rounded-sm bg-white shadow"
                    style={style as React.CSSProperties}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="flex items-center justify-center gap-3 px-6 py-4 shrink-0 border-t border-white/10">
        <button
          onClick={onCancel}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "text-white/60 hover:text-white hover:bg-white/10"
          )}
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={!hasValidSelection || saving}
          className={cn(
            buttonVariants(),
            "gap-2 bg-primary text-primary-foreground hover:bg-primary/90 min-w-[140px]",
            !hasValidSelection && "opacity-40 pointer-events-none"
          )}
        >
          <Check className="h-4 w-4" />
          {saving ? "Saving…" : "Save capture"}
        </button>
      </div>
    </div>
  );
}
