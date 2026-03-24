"use client";

import type { EditorController } from "@pixel-editor/app-services";
import {
  getTileSelectionBounds,
  isTileSelectionState,
  type SelectionState
} from "@pixel-editor/editor-state";
import { startTransition } from "react";

export interface TileSelectionControlsProps {
  selection: SelectionState;
  canCaptureStamp: boolean;
  store: EditorController;
}

export function TileSelectionControls({
  selection,
  canCaptureStamp,
  store
}: TileSelectionControlsProps) {
  if (!isTileSelectionState(selection) || selection.coordinates.length === 0) {
    return null;
  }

  const bounds = getTileSelectionBounds(selection);

  if (!bounds) {
    return null;
  }

  return (
    <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-3 text-sm text-slate-300">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs tracking-[0.18em] text-slate-500 uppercase">
            Tile Selection
          </p>
          <p className="mt-1 text-sm text-slate-100">
            {bounds.width}×{bounds.height} · {selection.coordinates.length} cells
          </p>
        </div>
        <button
          className="rounded-full border border-emerald-500/50 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-100 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-900 disabled:text-slate-500"
          disabled={!canCaptureStamp}
          onClick={() =>
            startTransition(() => {
              store.captureSelectedTilesAsStamp();
            })
          }
        >
          Capture Stamp
        </button>
      </div>
    </div>
  );
}
