"use client";

import type { EditorController } from "@pixel-editor/app-services";
import type { ObjectLayer } from "@pixel-editor/domain";
import { useI18n } from "@pixel-editor/i18n/client";
import {
  isObjectSelectionState,
  type ClipboardState,
  type SelectionState
} from "@pixel-editor/editor-state";
import { startTransition, useMemo, useState } from "react";

import { getObjectShapeLabel } from "./i18n-helpers";
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

function DockActionButton(props: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="min-w-0 border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] text-slate-200 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
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
  embedded?: boolean;
}

function ObjectsPanelContent({
  activeLayer,
  clipboard,
  selection,
  store
}: Omit<ObjectsPanelProps, "embedded">) {
  const { t } = useI18n();
  const selectedIds = isObjectSelectionState(selection)
    ? new Set(selection.objectIds)
    : new Set();
  const hasObjectSelection = selectedIds.size > 0;
  const clipboardSummary =
    clipboard.kind === "object"
      ? t("common.objectCount", { count: clipboard.objects.length })
      : t("common.empty");

  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-2">
        <ActionButton
          label={t("objects.addRectangle")}
          disabled={!activeLayer}
          onClick={() => {
            startTransition(() => {
              store.createRectangleObject();
            });
          }}
        />
        <ActionButton
          label={t("objects.removeSelected")}
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
          label={t("common.copy")}
          disabled={!activeLayer || !hasObjectSelection}
          onClick={() => {
            startTransition(() => {
              store.copySelectedObjectsToClipboard();
            });
          }}
        />
        <ActionButton
          label={t("common.cut")}
          disabled={!activeLayer || !hasObjectSelection}
          onClick={() => {
            startTransition(() => {
              store.cutSelectedObjectsToClipboard();
            });
          }}
        />
        <ActionButton
          label={t("common.paste")}
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
            {t("objects.clipboard")}
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
                  {getObjectShapeLabel(object.shape, t)}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                #{index + 1} · {object.x},{object.y} · {object.width}×{object.height}
              </p>
            </article>
          );
        })}

        {!activeLayer && (
          <p className="text-sm text-slate-400">{t("objects.selectObjectLayer")}</p>
        )}

        {activeLayer && activeLayer.objects.length === 0 && (
          <p className="text-sm text-slate-400">{t("objects.noObjects")}</p>
        )}
      </div>
    </>
  );
}

function ObjectsDockContent({
  activeLayer,
  clipboard,
  selection,
  store
}: Omit<ObjectsPanelProps, "embedded">) {
  const { t } = useI18n();
  const [filterText, setFilterText] = useState("");
  const selectedIds = isObjectSelectionState(selection)
    ? new Set(selection.objectIds)
    : new Set();
  const hasObjectSelection = selectedIds.size > 0;
  const filteredObjects = useMemo(() => {
    const keyword = filterText.trim().toLowerCase();

    if (!activeLayer || keyword.length === 0) {
      return activeLayer?.objects ?? [];
    }

    return activeLayer.objects.filter((object) => {
      return (
        object.name.toLowerCase().includes(keyword) ||
        getObjectShapeLabel(object.shape, t).toLowerCase().includes(keyword)
      );
    });
  }, [activeLayer, filterText, t]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-slate-800 p-1.5">
        <input
          className="w-full border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-slate-500"
          placeholder={t("common.filter")}
          value={filterText}
          onChange={(event) => {
            setFilterText(event.target.value);
          }}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {filteredObjects.map((object) => {
          const isSelected = selectedIds.has(object.id);

          return (
            <button
              key={object.id}
              className={`grid w-full grid-cols-[1fr_auto] items-center gap-2 border-b border-slate-800 px-2 py-1.5 text-left text-sm transition ${
                isSelected
                  ? "bg-slate-800 text-slate-100"
                  : "bg-slate-900 text-slate-300 hover:bg-slate-800/70"
              }`}
              onClick={() => {
                startTransition(() => {
                  store.selectObject(object.id);
                });
              }}
            >
              <span className="min-w-0 truncate font-medium">{object.name}</span>
              <span className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                {getObjectShapeLabel(object.shape, t)}
              </span>
            </button>
          );
        })}

        {!activeLayer && (
          <div className="px-3 py-3 text-sm text-slate-400">{t("objects.selectObjectLayer")}</div>
        )}

        {activeLayer && filteredObjects.length === 0 && (
          <div className="px-3 py-3 text-sm text-slate-400">
            {t("objects.noObjectsMatchFilter")}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-px border-t border-slate-700 bg-slate-800 p-1">
        <DockActionButton
          label={t("common.add")}
          disabled={!activeLayer}
          onClick={() => {
            startTransition(() => {
              store.createRectangleObject();
            });
          }}
        />
        <DockActionButton
          label={t("common.delete")}
          disabled={!activeLayer || !hasObjectSelection}
          onClick={() => {
            startTransition(() => {
              store.removeSelectedObjects();
            });
          }}
        />
        <DockActionButton
          label={t("common.copy")}
          disabled={!activeLayer || !hasObjectSelection}
          onClick={() => {
            startTransition(() => {
              store.copySelectedObjectsToClipboard();
            });
          }}
        />
        <DockActionButton
          label={t("common.cut")}
          disabled={!activeLayer || !hasObjectSelection}
          onClick={() => {
            startTransition(() => {
              store.cutSelectedObjectsToClipboard();
            });
          }}
        />
        <DockActionButton
          label={t("common.paste")}
          disabled={!activeLayer || clipboard.kind !== "object"}
          onClick={() => {
            startTransition(() => {
              store.pasteClipboardToActiveObjectLayer();
            });
          }}
        />
      </div>
    </div>
  );
}

export function ObjectsPanel({
  embedded = false,
  ...props
}: ObjectsPanelProps) {
  const { t } = useI18n();
  const content = embedded ? <ObjectsDockContent {...props} /> : <ObjectsPanelContent {...props} />;

  if (embedded) {
    return content;
  }

  return <Panel title={t("objects.title")}>{content}</Panel>;
}
