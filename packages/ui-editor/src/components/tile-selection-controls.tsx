"use client";

import type {
  EditorController,
  TileSelectionControlsViewState
} from "@pixel-editor/app-services/ui";
import { useI18n } from "@pixel-editor/i18n/client";
import { startTransition } from "react";

export interface TileSelectionControlsProps {
  viewState: TileSelectionControlsViewState | undefined;
  store: EditorController;
}

export function TileSelectionControls({ viewState, store }: TileSelectionControlsProps) {
  const { t } = useI18n();

  if (!viewState) {
    return null;
  }

  const clipboardSummary =
    viewState.clipboard.kind === "tile"
      ? `${viewState.clipboard.width}×${viewState.clipboard.height}`
      : viewState.clipboard.kind === "object"
        ? t("common.objectCount", { count: viewState.clipboard.objectCount })
        : t("common.empty");

  return (
    <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-3 text-sm text-slate-300">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs tracking-[0.18em] text-slate-500 uppercase">
            {t("tileSelection.title")}
          </p>
          <p className="mt-1 text-sm text-slate-100">
            {viewState.selectionWidth}×{viewState.selectionHeight} · {t("common.cellCount", {
              count: viewState.selectionCellCount
            })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs tracking-[0.18em] text-slate-500 uppercase">
            {t("tileSelection.clipboard")}
          </p>
          <p className="mt-1 text-sm text-slate-100">{clipboardSummary}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs font-medium text-slate-100 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-500"
          disabled={!viewState.canEditTiles}
          onClick={() =>
            startTransition(() => {
              store.copySelectedTilesToClipboard();
            })
          }
        >
          {t("common.copy")}
        </button>
        <button
          className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs font-medium text-slate-100 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-500"
          disabled={!viewState.canEditTiles}
          onClick={() =>
            startTransition(() => {
              store.cutSelectedTilesToClipboard();
            })
          }
        >
          {t("common.cut")}
        </button>
        <button
          className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs font-medium text-slate-100 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-500"
          disabled={!viewState.canEditTiles || !viewState.hasTileClipboard}
          onClick={() =>
            startTransition(() => {
              store.pasteClipboardToSelection();
            })
          }
        >
          {t("tileSelection.pasteHere")}
        </button>
        <button
          className="rounded-full border border-emerald-500/50 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-100 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-900 disabled:text-slate-500"
          disabled={!viewState.canEditTiles}
          onClick={() =>
            startTransition(() => {
              store.captureSelectedTilesAsStamp();
            })
          }
        >
          {t("tileSelection.captureStamp")}
        </button>
      </div>
    </div>
  );
}
