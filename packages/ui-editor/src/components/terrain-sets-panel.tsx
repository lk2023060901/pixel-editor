"use client";

import type { EditorController } from "@pixel-editor/app-services/ui";
import type {
  TerrainSetsPanelViewState,
  TerrainSetsPanelWangSetItemViewState
} from "@pixel-editor/app-services/ui";
import type { WangSetType } from "@pixel-editor/app-services/ui-tiles";
import { useI18n } from "@pixel-editor/i18n/client";
import { startTransition, useEffect, useState } from "react";

import { getWangSetTypeLabel } from "./i18n-helpers";
import { Panel } from "./panel";

export interface TerrainSetsPanelProps {
  viewState: TerrainSetsPanelViewState;
  store: EditorController;
  embedded?: boolean;
}

function TerrainSetToolbarButton(props: {
  title: string;
  label: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      className="flex h-6 items-center justify-center rounded border border-slate-700 bg-slate-900 px-2 text-[11px] text-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
      disabled={props.disabled}
      title={props.title}
      type="button"
      onClick={props.onClick}
    >
      {props.label}
    </button>
  );
}

function TerrainSetDetails(props: {
  wangSet: TerrainSetsPanelWangSetItemViewState | undefined;
  onRename: (name: string) => void;
  onTypeChange: (type: WangSetType) => void;
}) {
  const { t } = useI18n();
  const [nameDraft, setNameDraft] = useState(props.wangSet?.name ?? "");

  useEffect(() => {
    setNameDraft(props.wangSet?.name ?? "");
  }, [props.wangSet?.id, props.wangSet?.name]);

  if (!props.wangSet) {
    return (
      <div className="flex h-full min-h-[140px] items-center justify-center px-4 text-center text-sm text-slate-700">
        {t("terrainSets.noSelection")}
      </div>
    );
  }

  return (
    <div className="border-t border-slate-500/20 bg-slate-100/60 p-2">
      <div className="grid gap-2">
        <label className="grid grid-cols-[72px_minmax(0,1fr)] items-center gap-2 text-xs text-slate-700">
          <span>{t("terrainSets.name")}</span>
          <input
            className="h-7 border border-slate-500/30 bg-white px-2 text-sm text-slate-900 outline-none"
            value={nameDraft}
            onBlur={() => {
              props.onRename(nameDraft);
            }}
            onChange={(event) => {
              setNameDraft(event.target.value);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                props.onRename(nameDraft);
                event.currentTarget.blur();
              }
            }}
          />
        </label>
        <label className="grid grid-cols-[72px_minmax(0,1fr)] items-center gap-2 text-xs text-slate-700">
          <span>{t("terrainSets.type")}</span>
          <select
            className="h-7 border border-slate-500/30 bg-white px-2 text-sm text-slate-900 outline-none"
            value={props.wangSet.type}
            onChange={(event) => {
              props.onTypeChange(event.target.value as WangSetType);
            }}
          >
            {(["corner", "edge", "mixed"] as const).map((type) => (
              <option key={type} value={type}>
                {getWangSetTypeLabel(type, t)}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

function TerrainSetsDockContent({ viewState, store }: Omit<TerrainSetsPanelProps, "embedded">) {
  const { t } = useI18n();
  const [selectedWangSetId, setSelectedWangSetId] = useState<
    TerrainSetsPanelWangSetItemViewState["id"] | undefined
  >();
  const activeTileset =
    viewState.availableTilesets.find((tileset) => tileset.isActive) ??
    viewState.availableTilesets[0];
  const selectedWangSet =
    viewState.wangSets.find((wangSet) => wangSet.id === selectedWangSetId) ??
    viewState.wangSets[0];

  useEffect(() => {
    if (!activeTileset) {
      setSelectedWangSetId(undefined);
      return;
    }

    if (
      selectedWangSetId &&
      viewState.wangSets.some((wangSet) => wangSet.id === selectedWangSetId)
    ) {
      return;
    }

    setSelectedWangSetId(viewState.wangSets[0]?.id);
  }, [activeTileset, selectedWangSetId, viewState.wangSets]);

  if (!viewState.availableTilesets.length) {
    return (
      <div className="flex h-full min-h-[220px] items-center justify-center bg-[#b8b8b8] px-6 text-center text-sm text-slate-700">
        {t("terrainSets.noneAvailable")}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#b8b8b8]">
      <div className="flex items-end border-b border-slate-700 bg-slate-800">
        <div className="flex min-w-0 flex-1 items-end gap-px overflow-x-auto px-1 pt-1">
          {viewState.availableTilesets.map((tileset) => {
            return (
              <button
                key={tileset.id}
                className={`shrink-0 border px-2 py-1 text-xs transition ${
                  tileset.isActive
                    ? "border-slate-700 border-b-[#b8b8b8] bg-slate-900 text-slate-100"
                    : "border-slate-700 border-b-0 bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
                onClick={() => {
                  startTransition(() => {
                    store.setActiveTileset(tileset.id);
                  });
                }}
              >
                {tileset.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {viewState.wangSets.length ? (
          <div className="p-2">
            <ul className="border border-slate-500/20 bg-slate-100/70">
              {viewState.wangSets.map((wangSet) => {
                const isSelected = wangSet.id === selectedWangSet?.id;

                return (
                  <li key={wangSet.id} className="border-b border-slate-500/20 last:border-b-0">
                    <button
                      className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition ${
                        isSelected
                          ? "bg-blue-600 text-white"
                          : "text-slate-800 hover:bg-slate-200/80"
                      }`}
                      onClick={() => {
                        setSelectedWangSetId(wangSet.id);
                      }}
                    >
                      <span>{wangSet.name}</span>
                      <span className={`text-[11px] uppercase tracking-[0.16em] ${isSelected ? "text-blue-100" : "text-slate-500"}`}>
                        {getWangSetTypeLabel(wangSet.type, t)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <div className="flex h-full min-h-[180px] items-center justify-center px-6 text-center text-sm text-slate-700">
            {t("terrainSets.noSetsInTileset", {
              name: viewState.activeTilesetName ?? t("common.none")
            })}
          </div>
        )}
      </div>

      <TerrainSetDetails
        wangSet={selectedWangSet}
        onRename={(name) => {
          if (!selectedWangSet) {
            return;
          }

          startTransition(() => {
            store.updateActiveTilesetWangSet(selectedWangSet.id, { name });
          });
        }}
        onTypeChange={(type) => {
          if (!selectedWangSet) {
            return;
          }

          startTransition(() => {
            store.updateActiveTilesetWangSet(selectedWangSet.id, { type });
          });
        }}
      />

      <div className="flex items-center gap-1 border-t border-slate-700 bg-slate-800 px-2 py-1">
        <TerrainSetToolbarButton
          title={t("terrainSets.addCorner")}
          label={t("wangSetType.corner")}
          onClick={() => {
            startTransition(() => {
              const createdId = store.createActiveTilesetWangSet("corner");

              if (createdId) {
                setSelectedWangSetId(createdId);
              }
            });
          }}
        />
        <TerrainSetToolbarButton
          title={t("terrainSets.addEdge")}
          label={t("wangSetType.edge")}
          onClick={() => {
            startTransition(() => {
              const createdId = store.createActiveTilesetWangSet("edge");

              if (createdId) {
                setSelectedWangSetId(createdId);
              }
            });
          }}
        />
        <TerrainSetToolbarButton
          title={t("terrainSets.addMixed")}
          label={t("wangSetType.mixed")}
          onClick={() => {
            startTransition(() => {
              const createdId = store.createActiveTilesetWangSet("mixed");

              if (createdId) {
                setSelectedWangSetId(createdId);
              }
            });
          }}
        />
        <div className="min-w-0 flex-1" />
        <TerrainSetToolbarButton
          disabled={!selectedWangSet}
          title={t("terrainSets.removeSet")}
          label={t("common.remove")}
          onClick={() => {
            if (!selectedWangSet) {
              return;
            }

            const nextIndex =
              viewState.wangSets.findIndex((wangSet) => wangSet.id === selectedWangSet.id) ?? -1;
            const fallbackId =
              nextIndex > 0
                ? viewState.wangSets[nextIndex - 1]?.id
                : viewState.wangSets[1]?.id;

            startTransition(() => {
              store.removeActiveTilesetWangSet(selectedWangSet.id);
              setSelectedWangSetId(fallbackId);
            });
          }}
        />
      </div>
    </div>
  );
}

export function TerrainSetsPanel({
  embedded = false,
  ...props
}: TerrainSetsPanelProps) {
  const { t } = useI18n();
  const content = <TerrainSetsDockContent {...props} />;

  if (embedded) {
    return content;
  }

  return <Panel title={t("terrainSets.title")}>{content}</Panel>;
}
