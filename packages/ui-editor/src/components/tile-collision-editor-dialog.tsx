"use client";

import {
  createTileCollisionEditorDialogActionPlan,
  createTileCollisionEditorKeyDownPlan,
  createTileCollisionEditorToolbarActionPlan,
  deriveTileCollisionObjectListPresentation,
  deriveTileCollisionEditorToolbarPresentation,
  type TileCollisionEditorDialogStore,
  type TileCollisionObjectListStore,
  type TileCollisionEditorViewState
} from "@pixel-editor/app-services/ui";
import type { TileCollisionEditorStore } from "@pixel-editor/app-services/ui-store";
import { useI18n } from "@pixel-editor/i18n/client";
import { useEffect, useRef } from "react";

import type { EditorRenderBridge } from "../render-bridge";

import { TileCollisionCanvas } from "./tile-collision-canvas";
import {
  TileCollisionEditorToolbar,
  TileCollisionObjectList,
  TileCollisionObjectProperties
} from "./tile-collision-editor-sections";
import { useTileCollisionEditorState } from "./use-tile-collision-editor-state";

export function TileCollisionEditorDialog(props: {
  renderBridge: EditorRenderBridge;
  store: TileCollisionEditorStore;
  viewState: TileCollisionEditorViewState;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const state = useTileCollisionEditorState({
    store: props.store,
    viewState: props.viewState
  });
  const toolbarPresentation = deriveTileCollisionEditorToolbarPresentation({
    selectedObjectId: state.selectedObjectId,
    t
  });
  const objectListPresentation = deriveTileCollisionObjectListPresentation({
    collisionObjects: state.collisionObjects,
    selectedObjectId: state.selectedObjectId,
    t
  });
  const dialogStore: TileCollisionEditorDialogStore = {
    createObject: state.actions.createObject,
    removeSelectedObject: state.actions.removeSelectedObject,
    reorderSelectedObject: state.actions.reorderSelectedObject,
    closeDialog: props.onClose
  };
  const objectListStore: TileCollisionObjectListStore = {
    selectObject: state.actions.selectObject
  };

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-6 py-8">
      <div
        ref={dialogRef}
        className="flex h-[720px] w-[1120px] flex-col border border-slate-700 bg-slate-900 shadow-[0_18px_60px_rgba(2,6,23,0.7)] outline-none"
        role="dialog"
        tabIndex={-1}
        aria-modal="true"
        aria-label={t("action.editCollision")}
        onKeyDown={(event) => {
          const plan = createTileCollisionEditorDialogActionPlan(
            createTileCollisionEditorKeyDownPlan({
              key: event.key,
              selectedObjectId: state.selectedObjectId
            })
          );

          if (plan.kind === "transition") {
            event.preventDefault();
            plan.run(dialogStore);
          }
        }}
      >
        <TileCollisionEditorToolbar
          presentation={toolbarPresentation}
          onAction={(actionId) => {
            const plan = createTileCollisionEditorDialogActionPlan(
              createTileCollisionEditorToolbarActionPlan({
                actionId,
                selectedObjectId: state.selectedObjectId
              })
            );

            if (plan.kind === "transition") {
              plan.run(dialogStore);
            }
          }}
        />

        {props.viewState.selectedLocalId === null || !props.viewState.canvas ? (
          <div className="flex min-h-0 flex-1 items-center justify-center px-6 text-sm text-slate-400">
            {t("tileCollisionEditor.noTileSelected")}
          </div>
        ) : (
          <div className="grid min-h-0 flex-1 grid-cols-[392px_minmax(0,1fr)]">
            <div className="flex min-h-0 flex-col border-r border-slate-700 px-4 py-4">
              <TileCollisionCanvas
                renderBridge={props.renderBridge}
                selectedObjectIds={state.selectedObjectIds}
                viewState={props.viewState.canvas}
                onMoveCommit={state.actions.moveSelectedObjects}
                onSelectionChange={state.actions.selectObjects}
              />
            </div>

            <div className="grid min-h-0 grid-rows-[220px_minmax(0,1fr)]">
              <TileCollisionObjectList
                presentation={objectListPresentation}
                store={objectListStore}
              />

              <div className="min-h-0 overflow-y-auto">
                {state.selectedObject ? (
                  <TileCollisionObjectProperties
                    draft={state.draft}
                    propertyTypes={props.viewState.propertyTypes}
                    selectedObject={state.selectedObject}
                    setDraft={state.setDraft}
                    onCommitClassName={state.actions.commitClassName}
                    onCommitName={state.actions.commitName}
                    onCommitNumericField={state.actions.commitNumericField}
                    onCommitPoints={state.actions.commitPoints}
                    onCommitVisible={state.actions.commitVisible}
                    onRemoveProperty={state.actions.removeSelectedObjectProperty}
                    onUpsertProperty={state.actions.upsertSelectedObjectProperty}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center px-4 text-sm text-slate-400">
                    {t("tileCollisionEditor.noObjects")}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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
