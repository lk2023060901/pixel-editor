"use client";

import type {
  TerrainSetsPanelViewState,
  TerrainSetsPanelWangSetItemViewState
} from "@pixel-editor/app-services/ui";
import { useI18n } from "@pixel-editor/i18n/client";
import { useEffect, useState } from "react";

import { getWangSetTypeLabel } from "./i18n-helpers";

type WangSetType = TerrainSetsPanelWangSetItemViewState["type"];

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

export function TerrainSetsTabs(props: {
  tilesets: TerrainSetsPanelViewState["availableTilesets"];
  onActivateTileset: (tilesetId: string) => void;
}) {
  return (
    <div className="flex items-end border-b border-slate-700 bg-slate-800">
      <div className="flex min-w-0 flex-1 items-end gap-px overflow-x-auto px-1 pt-1">
        {props.tilesets.map((tileset) => (
          <button
            key={tileset.id}
            className={`shrink-0 border px-2 py-1 text-xs transition ${
              tileset.isActive
                ? "border-slate-700 border-b-[#b8b8b8] bg-slate-900 text-slate-100"
                : "border-slate-700 border-b-0 bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
            onClick={() => {
              props.onActivateTileset(tileset.id);
            }}
          >
            {tileset.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export function TerrainSetsList(props: {
  selectedWangSetId: TerrainSetsPanelWangSetItemViewState["id"] | undefined;
  wangSets: TerrainSetsPanelViewState["wangSets"];
  onSelectWangSet: (wangSetId: TerrainSetsPanelWangSetItemViewState["id"]) => void;
}) {
  const { t } = useI18n();

  if (!props.wangSets.length) {
    return null;
  }

  return (
    <div className="p-2">
      <ul className="border border-slate-500/20 bg-slate-100/70">
        {props.wangSets.map((wangSet) => {
          const isSelected = wangSet.id === props.selectedWangSetId;

          return (
            <li key={wangSet.id} className="border-b border-slate-500/20 last:border-b-0">
              <button
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition ${
                  isSelected
                    ? "bg-blue-600 text-white"
                    : "text-slate-800 hover:bg-slate-200/80"
                }`}
                onClick={() => {
                  props.onSelectWangSet(wangSet.id);
                }}
              >
                <span>{wangSet.name}</span>
                <span
                  className={`text-[11px] uppercase tracking-[0.16em] ${
                    isSelected ? "text-blue-100" : "text-slate-500"
                  }`}
                >
                  {getWangSetTypeLabel(wangSet.type, t)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function TerrainSetsEmptyState(props: {
  activeTilesetName: string | undefined;
}) {
  const { t } = useI18n();

  return (
    <div className="flex h-full min-h-[180px] items-center justify-center px-6 text-center text-sm text-slate-700">
      {t("terrainSets.noSetsInTileset", {
        name: props.activeTilesetName ?? t("common.none")
      })}
    </div>
  );
}

export function TerrainSetDetails(props: {
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

export function TerrainSetsToolbar(props: {
  hasSelectedWangSet: boolean;
  onAddCorner: () => void;
  onAddEdge: () => void;
  onAddMixed: () => void;
  onRemove: () => void;
}) {
  const { t } = useI18n();

  return (
    <div className="flex items-center gap-1 border-t border-slate-700 bg-slate-800 px-2 py-1">
      <TerrainSetToolbarButton
        title={t("terrainSets.addCorner")}
        label={t("wangSetType.corner")}
        onClick={props.onAddCorner}
      />
      <TerrainSetToolbarButton
        title={t("terrainSets.addEdge")}
        label={t("wangSetType.edge")}
        onClick={props.onAddEdge}
      />
      <TerrainSetToolbarButton
        title={t("terrainSets.addMixed")}
        label={t("wangSetType.mixed")}
        onClick={props.onAddMixed}
      />
      <div className="min-w-0 flex-1" />
      <TerrainSetToolbarButton
        disabled={!props.hasSelectedWangSet}
        title={t("terrainSets.removeSet")}
        label={t("common.remove")}
        onClick={props.onRemove}
      />
    </div>
  );
}
