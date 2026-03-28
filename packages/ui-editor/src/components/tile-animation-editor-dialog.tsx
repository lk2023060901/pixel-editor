"use client";

import {
  type TileAnimationEditorViewState
} from "@pixel-editor/app-services/ui";
import type { TileAnimationEditorStore } from "@pixel-editor/app-services/ui-store";
import { useI18n } from "@pixel-editor/i18n/client";
import { useEffect, useRef } from "react";

import {
  TileAnimationEditorHeader,
  TileAnimationFrameList,
  TileAnimationPreviewPanel,
  TileAnimationSourceTilesPanel
} from "./tile-animation-editor-sections";
import { useTileAnimationEditorState } from "./use-tile-animation-editor-state";

function isEditableElement(target: EventTarget | null): target is HTMLElement {
  return (
    target instanceof HTMLElement &&
    (target instanceof HTMLInputElement ||
      target instanceof HTMLSelectElement ||
      target instanceof HTMLTextAreaElement ||
      target.isContentEditable)
  );
}

export function TileAnimationEditorDialog(props: {
  viewState: TileAnimationEditorViewState;
  store: TileAnimationEditorStore;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const state = useTileAnimationEditorState({
    store: props.store,
    viewState: props.viewState
  });

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-6 py-8">
      <div
        ref={dialogRef}
        className="flex h-[560px] w-[840px] flex-col border border-slate-700 bg-slate-900 shadow-[0_18px_60px_rgba(2,6,23,0.7)] outline-none"
        role="dialog"
        tabIndex={-1}
        aria-modal="true"
        aria-label={t("action.tileAnimationEditor")}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            props.onClose();
            return;
          }

          if (
            (event.key === "Delete" || event.key === "Backspace") &&
            !isEditableElement(event.target)
          ) {
            event.preventDefault();
            state.actions.removeSelectedFrame();
          }
        }}
      >
        <TileAnimationEditorHeader
          frameDurationText={state.frameDurationText}
          selectedFrameIndex={state.selectedFrameIndex}
          zoom={state.zoom}
          onApplyFrameDuration={state.actions.applyFrameDuration}
          onFrameDurationTextChange={state.setters.setFrameDurationText}
          onZoomChange={state.setters.setZoom}
        />

        <div className="grid min-h-0 flex-1 grid-cols-[220px_minmax(0,1fr)]">
          <div className="grid min-h-0 grid-rows-[minmax(0,1fr)_160px] border-r border-slate-700">
            <div className="min-h-0 overflow-auto bg-slate-950">
              <TileAnimationFrameList
                dragFrameIndex={state.dragFrameIndex}
                frames={state.frames}
                selectedFrameIndex={state.selectedFrameIndex}
                onDropFrameAt={state.actions.reorderFrameAt}
                onEndFrameDrag={state.actions.endFrameDrag}
                onSelectFrame={state.actions.selectFrame}
                onStartFrameDrag={state.actions.startFrameDrag}
              />
            </div>

            <div className="flex items-center justify-center border-t border-slate-700 bg-slate-900 px-4 py-4">
              <TileAnimationPreviewPanel previewFrame={state.previewFrame} />
            </div>
          </div>

          <div className="min-h-0 overflow-auto bg-[#b8b8b8] p-3">
            <TileAnimationSourceTilesPanel
              imageColumns={props.viewState.imageColumns}
              sourceLocalId={state.sourceLocalId}
              sourceTiles={props.viewState.sourceTiles}
              tileHeight={props.viewState.tileHeight}
              tileWidth={props.viewState.tileWidth}
              tilesetId={props.viewState.tilesetId}
              tilesetKind={props.viewState.tilesetKind}
              zoom={state.zoom}
              onAddFrame={state.actions.addFrame}
              onSelectSourceTile={state.actions.selectSourceTile}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-700 px-4 py-3">
          <button
            className="h-8 border border-slate-600 bg-slate-800 px-3 text-sm text-slate-100 transition hover:bg-slate-700"
            type="button"
            onClick={props.onClose}
          >
            {t("action.close")}
          </button>
        </div>
      </div>
    </div>
  );
}
