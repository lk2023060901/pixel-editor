"use client";

import type { EditorController } from "@pixel-editor/app-services";
import type { ShapeFillMode } from "@pixel-editor/editor-state";
import { useI18n } from "@pixel-editor/i18n/client";
import { startTransition } from "react";

export interface ShapeFillControlsProps {
  activeMode: ShapeFillMode;
  store: EditorController;
}

export function ShapeFillControls({
  activeMode,
  store
}: ShapeFillControlsProps) {
  const { t } = useI18n();
  const shapeModes: Array<{ id: ShapeFillMode; label: string }> = [
    { id: "rectangle", label: t("shapeFill.rectangle") },
    { id: "ellipse", label: t("shapeFill.ellipse") }
  ];

  return (
    <div className="mt-4 space-y-2">
      <p className="text-[11px] tracking-[0.18em] text-slate-500 uppercase">
        {t("shapeFill.title")}
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
        {t("shapeFill.hint")}
      </p>
    </div>
  );
}
