"use client";

import type { EditorController } from "@pixel-editor/app-services";
import type { ShapeFillMode } from "@pixel-editor/editor-state";
import { startTransition } from "react";

export interface ShapeFillControlsProps {
  activeMode: ShapeFillMode;
  store: EditorController;
}

const shapeModes: Array<{ id: ShapeFillMode; label: string }> = [
  { id: "rectangle", label: "Rectangle" },
  { id: "ellipse", label: "Ellipse" }
];

export function ShapeFillControls({
  activeMode,
  store
}: ShapeFillControlsProps) {
  return (
    <div className="mt-4 space-y-2">
      <p className="text-[11px] tracking-[0.18em] text-slate-500 uppercase">
        Shape Mode
      </p>
      <div className="flex flex-wrap gap-2">
        {shapeModes.map((mode) => {
          const isActive = mode.id === activeMode;

          return (
            <button
              key={mode.id}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                isActive
                  ? "border-amber-400/70 bg-amber-400/15 text-amber-100"
                  : "border-slate-700 bg-slate-900/70 text-slate-200 hover:border-slate-500"
              }`}
              onClick={() =>
                startTransition(() => {
                  store.setShapeFillMode(mode.id);
                })
              }
            >
              {mode.label}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-slate-400">
        Hold <span className="font-medium text-slate-200">Shift</span> for square/circle. Hold{" "}
        <span className="font-medium text-slate-200">Alt</span> to draw from center.
      </p>
    </div>
  );
}
