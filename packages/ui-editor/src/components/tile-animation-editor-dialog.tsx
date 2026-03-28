"use client";

import {
  createTileAnimationEditorKeyDownActionPlan,
  deriveTileAnimationEditorHeaderPresentation,
  deriveTileAnimationFrameListPresentation,
  deriveTileAnimationSourceTilesPresentation,
  type TileAnimationEditorDialogStore,
  type TileAnimationFrameListStore,
  type TileAnimationSourceTilesStore,
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
  const headerPresentation = deriveTileAnimationEditorHeaderPresentation({
    selectedFrameIndex: state.selectedFrameIndex
  });
  const frameListPresentation = deriveTileAnimationFrameListPresentation({
    frames: state.frames,
    selectedFrameIndex: state.selectedFrameIndex,
    dragFrameIndex: state.dragFrameIndex
  });
  const sourceTilesPresentation = deriveTileAnimationSourceTilesPresentation({
    viewState: props.viewState,
    sourceLocalId: state.sourceLocalId
  });
  const frameListStore: TileAnimationFrameListStore = {
    selectFrame: state.actions.selectFrame,
    startFrameDrag: state.actions.startFrameDrag,
    endFrameDrag: state.actions.endFrameDrag,
    reorderFrameAt: state.actions.reorderFrameAt
  };
  const sourceTilesStore: TileAnimationSourceTilesStore = {
    selectSourceTile: state.actions.selectSourceTile,
    addFrame: state.actions.addFrame
  };
  const dialogStore: TileAnimationEditorDialogStore = {
    closeDialog: props.onClose,
    removeSelectedFrame: state.actions.removeSelectedFrame
  };

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
          const plan = createTileAnimationEditorKeyDownActionPlan({
            key: event.key,
            selectedFrameIndex: state.selectedFrameIndex,
            isEditableTarget: isEditableElement(event.target)
          });

          if (plan.kind === "transition") {
            event.preventDefault();
            plan.run(dialogStore);
          }
        }}
      >
        <TileAnimationEditorHeader
          frameDurationText={state.frameDurationText}
          presentation={headerPresentation}
          zoom={state.zoom}
          onApplyFrameDuration={state.actions.applyFrameDuration}
          onFrameDurationTextChange={state.setters.setFrameDurationText}
          onZoomChange={state.setters.setZoom}
        />

        <div className="grid min-h-0 flex-1 grid-cols-[220px_minmax(0,1fr)]">
          <div className="grid min-h-0 grid-rows-[minmax(0,1fr)_160px] border-r border-slate-700">
            <div className="min-h-0 overflow-auto bg-slate-950">
              <TileAnimationFrameList
                presentation={frameListPresentation}
                store={frameListStore}
              />
            </div>

            <div className="flex items-center justify-center border-t border-slate-700 bg-slate-900 px-4 py-4">
              <TileAnimationPreviewPanel previewFrame={state.previewFrame} />
            </div>
          </div>

          <div className="min-h-0 overflow-auto bg-[#b8b8b8] p-3">
            <TileAnimationSourceTilesPanel
              presentation={sourceTilesPresentation}
              store={sourceTilesStore}
              zoom={state.zoom}
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
