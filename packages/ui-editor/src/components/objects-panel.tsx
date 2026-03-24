"use client";

import type { EditorController } from "@pixel-editor/app-services";
import type { ObjectLayer } from "@pixel-editor/domain";
import {
  isObjectSelectionState,
  type ClipboardState,
  type SelectionState
} from "@pixel-editor/editor-state";
import { startTransition } from "react";

import { Panel } from "./panel";

function ActionButton(props: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-200 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
      disabled={props.disabled}
      onClick={props.onClick}
    >
      {props.label}
    </button>
  );
}

export interface ObjectsPanelProps {
  activeLayer: ObjectLayer | undefined;
  clipboard: ClipboardState;
  selection: SelectionState;
  store: EditorController;
}

export function ObjectsPanel({
  activeLayer,
  clipboard,
  selection,
  store
}: ObjectsPanelProps) {
  const selectedIds = isObjectSelectionState(selection)
    ? new Set(selection.objectIds)
    : new Set();
  const hasObjectSelection = selectedIds.size > 0;
  const clipboardSummary =
    clipboard.kind === "object" ? `${clipboard.objects.length} object(s)` : "Empty";

  return (
    <Panel title="Objects">
      <div className="mb-4 grid grid-cols-2 gap-2">
        <ActionButton
          label="Add Rectangle"
          disabled={!activeLayer}
          onClick={() => {
            startTransition(() => {
              store.createRectangleObject();
            });
          }}
        />
        <ActionButton
          label="Remove Selected"
          disabled={!activeLayer || !hasObjectSelection}
          onClick={() => {
            startTransition(() => {
              store.removeSelectedObjects();
            });
          }}
        />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <ActionButton
          label="Copy"
          disabled={!activeLayer || !hasObjectSelection}
          onClick={() => {
            startTransition(() => {
              store.copySelectedObjectsToClipboard();
            });
          }}
        />
        <ActionButton
          label="Cut"
          disabled={!activeLayer || !hasObjectSelection}
          onClick={() => {
            startTransition(() => {
              store.cutSelectedObjectsToClipboard();
            });
          }}
        />
        <ActionButton
          label="Paste"
          disabled={!activeLayer || clipboard.kind !== "object"}
          onClick={() => {
            startTransition(() => {
              store.pasteClipboardToActiveObjectLayer();
            });
          }}
        />
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-3 text-sm text-slate-300">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs tracking-[0.18em] text-slate-500 uppercase">
            Clipboard
          </span>
          <span className="text-sm text-slate-100">{clipboardSummary}</span>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {activeLayer?.objects.map((object, index) => {
          const isSelected = selectedIds.has(object.id);

          return (
            <article
              key={object.id}
              className={`cursor-pointer rounded-xl border px-3 py-3 transition ${
                isSelected
                  ? "border-emerald-500/60 bg-emerald-500/10"
                  : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
              }`}
              onClick={() => {
                startTransition(() => {
                  store.selectObject(object.id);
                });
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <strong className="text-sm text-slate-100">{object.name}</strong>
                <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                  {object.shape}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                #{index + 1} · {object.x},{object.y} · {object.width}×{object.height}
              </p>
            </article>
          );
        })}

        {!activeLayer && (
          <p className="text-sm text-slate-400">
            Select an object layer to manage objects.
          </p>
        )}

        {activeLayer && activeLayer.objects.length === 0 && (
          <p className="text-sm text-slate-400">No objects in the active layer.</p>
        )}
      </div>
    </Panel>
  );
}
