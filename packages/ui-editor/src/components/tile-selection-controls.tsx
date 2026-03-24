"use client";

import type { EditorController } from "@pixel-editor/app-services";
import {
  getTileStampFootprint,
  getTileSelectionBounds,
  isTileSelectionState,
  type ClipboardState,
  type SelectionState
} from "@pixel-editor/editor-state";
import { startTransition } from "react";

export interface TileSelectionControlsProps {
  clipboard: ClipboardState;
  selection: SelectionState;
  canEditTiles: boolean;
  store: EditorController;
}

export function TileSelectionControls({
  clipboard,
  selection,
  canEditTiles,
  store
}: TileSelectionControlsProps) {
  if (!isTileSelectionState(selection) || selection.coordinates.length === 0) {
    return null;
  }

  const bounds = getTileSelectionBounds(selection);

  if (!bounds) {
    return null;
  }

  const tileClipboardFootprint =
    clipboard.kind === "tile" ? getTileStampFootprint(clipboard.stamp) : undefined;
  const clipboardSummary =
    clipboard.kind === "tile"
      ? `${tileClipboardFootprint?.width ?? 0}×${tileClipboardFootprint?.height ?? 0}`
      : clipboard.kind === "object"
        ? `${clipboard.objects.length} object(s)`
      : "Empty";

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
        <div className="text-right">
          <p className="text-xs tracking-[0.18em] text-slate-500 uppercase">Clipboard</p>
          <p className="mt-1 text-sm text-slate-100">{clipboardSummary}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs font-medium text-slate-100 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-500"
          disabled={!canEditTiles}
          onClick={() =>
            startTransition(() => {
              store.copySelectedTilesToClipboard();
            })
          }
        >
          Copy
        </button>
        <button
          className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs font-medium text-slate-100 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-500"
          disabled={!canEditTiles}
          onClick={() =>
            startTransition(() => {
              store.cutSelectedTilesToClipboard();
            })
          }
        >
          Cut
        </button>
        <button
          className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs font-medium text-slate-100 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-500"
          disabled={!canEditTiles || clipboard.kind !== "tile"}
          onClick={() =>
            startTransition(() => {
              store.pasteClipboardToSelection();
            })
          }
        >
          Paste Here
        </button>
        <button
          className="rounded-full border border-emerald-500/50 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-100 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-900 disabled:text-slate-500"
          disabled={!canEditTiles}
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
