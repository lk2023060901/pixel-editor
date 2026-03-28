"use client";

import {
  type TilesetsPanelActiveStampPresentation,
  type TilesetsPanelPalettePresentation,
  type TilesetsPanelTileGridPresentation,
  type TilesetsPanelToolbarActionId,
  type TilesetsPanelToolbarPresentation,
  type TilesetsPanelViewState
} from "@pixel-editor/app-services/ui";
import { useI18n } from "@pixel-editor/i18n/client";
import type { ReactNode } from "react";

import { getTilesetKindLabel } from "./i18n-helpers";
import { TilePreview } from "./tile-preview";
import { buildTileVisualStyle } from "./tileset-view-helpers";

type TilesetListItem = TilesetsPanelViewState["availableTilesets"][number];
export function TilesetsListSection(props: {
  tilesets: readonly TilesetListItem[];
  onActivateTileset: (tilesetId: string) => void;
}) {
  const { t } = useI18n();

  return (
    <div className="space-y-2">
      {props.tilesets.map((tileset) => (
        <article
          key={tileset.id}
          className={`cursor-pointer rounded-xl border px-3 py-3 transition ${
            tileset.isActive
              ? "border-emerald-500/60 bg-emerald-500/10"
              : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
          }`}
          onClick={() => {
            props.onActivateTileset(tileset.id);
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <strong className="text-sm text-slate-100">{tileset.name}</strong>
            <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
              {getTilesetKindLabel(tileset.kind, t)}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            {t("tilesets.tilesCount", { count: tileset.tileCount })}
            {" · "}
            {tileset.tileWidth}×{tileset.tileHeight}
          </p>
        </article>
      ))}
    </div>
  );
}

export function TilesetActiveStampCard(props: {
  presentation: TilesetsPanelActiveStampPresentation;
}) {
  const { t } = useI18n();
  const selectedTile = props.presentation.selectedTile;
  const stampSummary = props.presentation.summary;

  return (
    <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-3 text-sm text-slate-300">
      <div className="flex items-center justify-between gap-3">
        <span>{t("tilesets.activeStamp")}</span>
        <span>
          {stampSummary.kind === "pattern"
            ? t("tilesets.patternSummary", {
                width: stampSummary.width,
                height: stampSummary.height
              })
            : stampSummary.kind === "tile"
              ? t("tilesets.stampTileSummary", {
                  gid: stampSummary.gid,
                  localId: stampSummary.localId,
                  tilesetName: stampSummary.tilesetName
                })
              : t("common.none")}
        </span>
      </div>
      {selectedTile ? (
        <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-3">
          {selectedTile.preview ? <TilePreview viewState={selectedTile.preview} /> : null}
          <div>
            <p className="text-xs tracking-[0.18em] text-slate-500 uppercase">
              {t("tilesets.selectedTile")}
            </p>
            <p className="mt-1 text-sm text-slate-100">
              #{selectedTile.localId}
              {selectedTile.className ? ` · ${selectedTile.className}` : ""}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function TilesetsPanelTileGrid(props: {
  presentation: TilesetsPanelTileGridPresentation;
  onSelectTile: (localId: number) => void;
}) {
  if (props.presentation.kind === "none") {
    return null;
  }

  return (
    <div className="mt-4 grid grid-cols-4 gap-2">
      {props.presentation.items.map((tileEntry) => (
        <button
          key={tileEntry.key}
          className={`flex aspect-square flex-col items-center justify-center rounded-xl border text-xs transition ${
            tileEntry.isSelected
              ? "border-emerald-400 bg-emerald-500/10 text-emerald-100"
              : "border-slate-700 bg-slate-900/70 text-slate-200 hover:border-slate-500"
          }`}
          disabled={tileEntry.disabled}
          onClick={() => {
            props.onSelectTile(tileEntry.localId);
          }}
        >
          <TilePreview viewState={tileEntry.preview} />
          <span>#{tileEntry.localId}</span>
        </button>
      ))}
    </div>
  );
}

function TilesetDockToolbarButton(props: {
  title: string;
  children: ReactNode;
  disabled?: boolean | undefined;
  onClick?: (() => void) | undefined;
}) {
  return (
    <button
      className="flex h-6 w-6 items-center justify-center rounded border border-slate-700 bg-slate-900 text-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
      disabled={props.disabled}
      title={props.title}
      type="button"
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
}

function TilesetDockIcon(props: {
  children: ReactNode;
}) {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      viewBox="0 0 16 16"
    >
      {props.children}
    </svg>
  );
}

export function TilesetsDockTabs(props: {
  tilesets: readonly TilesetListItem[];
  onActivateTileset: (tilesetId: string) => void;
}) {
  const { t } = useI18n();

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
      <button
        className="mx-1 mb-1 flex h-5 w-5 items-center justify-center rounded-sm border border-slate-600 bg-slate-700 text-[10px] text-slate-200"
        title={t("common.menu")}
        type="button"
      >
        ▼
      </button>
    </div>
  );
}

export function TilesetsDockTilePalette(props: {
  presentation: TilesetsPanelPalettePresentation;
  zoom: number;
  onSelectTile: (localId: number) => void;
}) {
  const presentation = props.presentation;

  if (presentation.kind === "none") {
    return null;
  }

  if (presentation.kind === "image-grid") {
    return (
      <div
        className="inline-grid border border-slate-500/20 bg-transparent"
        style={{
          gridTemplateColumns: `repeat(${presentation.imageColumns}, ${presentation.tileWidth * props.zoom}px)`,
          gridAutoRows: `${presentation.tileHeight * props.zoom}px`
        }}
      >
        {presentation.activeTileEntries.map((tileEntry) => (
          <button
            key={`${presentation.activeTilesetId}:${tileEntry.localId}`}
            className={`relative border border-slate-500/10 bg-transparent ${
              tileEntry.isSelected ? "z-10 ring-2 ring-blue-500 ring-inset" : ""
            }`}
            style={{
              width: `${presentation.tileWidth * props.zoom}px`,
              height: `${presentation.tileHeight * props.zoom}px`
            }}
            onClick={() => {
              props.onSelectTile(tileEntry.localId);
            }}
          >
            <span className="block" style={buildTileVisualStyle(tileEntry.preview, props.zoom)} />
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-start gap-1">
      {presentation.activeTileEntries.map((tileEntry) => (
        <button
          key={`${presentation.activeTilesetId}:${tileEntry.localId}`}
          className={`flex items-center justify-center border bg-slate-900/20 p-1 ${
            tileEntry.isSelected ? "ring-2 ring-blue-500 ring-inset" : "border-slate-500/20"
          }`}
          onClick={() => {
            props.onSelectTile(tileEntry.localId);
          }}
        >
          <span className="block" style={buildTileVisualStyle(tileEntry.preview, props.zoom)} />
        </button>
      ))}
    </div>
  );
}

export function TilesetsDockToolbar(props: {
  presentation: TilesetsPanelToolbarPresentation;
  zoom: number;
  setZoom: (zoom: number) => void;
  onAction: (actionId: TilesetsPanelToolbarActionId) => void;
}) {
  return (
    <div className="flex items-center gap-1 border-t border-slate-700 bg-slate-800 px-2 py-1">
      <TilesetDockToolbarButton
        disabled={props.presentation.actionItems[0]?.disabled}
        title={props.presentation.actionItems[0]?.title ?? ""}
        onClick={() => {
          props.onAction(props.presentation.actionItems[0]!.actionId);
        }}
      >
        <TilesetDockIcon>
          <path d="M4 2.5h5l2.5 2.5v8H4z" />
          <path d="M9 2.5V5h2.5" />
          <path d="M8 7v4" />
          <path d="M6 9h4" />
        </TilesetDockIcon>
      </TilesetDockToolbarButton>
      <TilesetDockToolbarButton
        disabled={props.presentation.actionItems[1]?.disabled}
        title={props.presentation.actionItems[1]?.title ?? ""}
        onClick={() => {
          props.onAction(props.presentation.actionItems[1]!.actionId);
        }}
      >
        <TilesetDockIcon>
          <path d="M3 8h6" />
          <path d="M7 4l4 4-4 4" />
          <path d="M2.5 3.5h2v9h-2z" />
        </TilesetDockIcon>
      </TilesetDockToolbarButton>
      <TilesetDockToolbarButton
        disabled={props.presentation.actionItems[2]?.disabled}
        title={props.presentation.actionItems[2]?.title ?? ""}
        onClick={() => {
          props.onAction(props.presentation.actionItems[2]!.actionId);
        }}
      >
        <TilesetDockIcon>
          <path d="M7 8h6" />
          <path d="M9 4l4 4-4 4" />
          <path d="M2.5 3.5h2v9h-2z" />
        </TilesetDockIcon>
      </TilesetDockToolbarButton>
      <TilesetDockToolbarButton
        disabled={props.presentation.actionItems[3]?.disabled}
        title={props.presentation.actionItems[3]?.title ?? ""}
        onClick={() => {
          props.onAction(props.presentation.actionItems[3]!.actionId);
        }}
      >
        <TilesetDockIcon>
          <path d="M3 4.5h10" />
          <path d="M3 8h10" />
          <path d="M3 11.5h10" />
          <circle cx="6" cy="4.5" r="1" fill="currentColor" stroke="none" />
          <circle cx="10" cy="8" r="1" fill="currentColor" stroke="none" />
          <circle cx="8" cy="11.5" r="1" fill="currentColor" stroke="none" />
        </TilesetDockIcon>
      </TilesetDockToolbarButton>
      <TilesetDockToolbarButton
        disabled={props.presentation.actionItems[4]?.disabled}
        title={props.presentation.actionItems[4]?.title ?? ""}
        onClick={() => {
          props.onAction(props.presentation.actionItems[4]!.actionId);
        }}
      >
        <TilesetDockIcon>
          <path d="M3 5.5h8" />
          <path d="M9 3l2 2.5L9 8" />
          <path d="M13 10.5H5" />
          <path d="M7 8l-2 2.5L7 13" />
        </TilesetDockIcon>
      </TilesetDockToolbarButton>
      <TilesetDockToolbarButton
        disabled={props.presentation.actionItems[5]?.disabled}
        title={props.presentation.actionItems[5]?.title ?? ""}
        onClick={() => {
          props.onAction(props.presentation.actionItems[5]!.actionId);
        }}
      >
        <TilesetDockIcon>
          <path d="M3 12.5h10" />
          <path d="M4 10.5l2-4 2 2 2-4 2 6" />
          <circle cx="6" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
          <circle cx="8" cy="8.5" r="0.8" fill="currentColor" stroke="none" />
          <circle cx="10" cy="4.5" r="0.8" fill="currentColor" stroke="none" />
          <circle cx="12" cy="10.5" r="0.8" fill="currentColor" stroke="none" />
        </TilesetDockIcon>
      </TilesetDockToolbarButton>
      <TilesetDockToolbarButton
        disabled={props.presentation.actionItems[6]?.disabled}
        title={props.presentation.actionItems[6]?.title ?? ""}
        onClick={() => {
          props.onAction(props.presentation.actionItems[6]!.actionId);
        }}
      >
        <TilesetDockIcon>
          <rect x="3" y="4" width="4" height="8" rx="0.8" />
          <circle cx="11.25" cy="8" r="2.25" />
        </TilesetDockIcon>
      </TilesetDockToolbarButton>
      <TilesetDockToolbarButton
        disabled={props.presentation.actionItems[7]?.disabled}
        title={props.presentation.actionItems[7]?.title ?? ""}
        onClick={() => {
          props.onAction(props.presentation.actionItems[7]!.actionId);
        }}
      >
        <TilesetDockIcon>
          <rect x="2.5" y="3" width="3.5" height="10" rx="0.75" />
          <rect x="7.5" y="3" width="6" height="10" rx="0.75" />
          <path d="M9.5 5.5l2.5 2-2.5 2z" fill="currentColor" stroke="none" />
        </TilesetDockIcon>
      </TilesetDockToolbarButton>
      <TilesetDockToolbarButton
        disabled={props.presentation.actionItems[8]?.disabled}
        title={props.presentation.actionItems[8]?.title ?? ""}
        onClick={() => {
          props.onAction(props.presentation.actionItems[8]!.actionId);
        }}
      >
        <TilesetDockIcon>
          <path d="M4.5 5.5h7" />
          <path d="M6 5.5V4h4v1.5" />
          <path d="M5.5 5.5v6.5h5V5.5" />
          <path d="M7.25 7.5v3" />
          <path d="M8.75 7.5v3" />
        </TilesetDockIcon>
      </TilesetDockToolbarButton>
      <div className="min-w-0 flex-1" />
      <select
        className="h-6 border border-slate-600 bg-slate-900 px-2 text-xs text-slate-100 outline-none"
        value={String(props.zoom)}
        onChange={(event) => {
          props.setZoom(Number(event.target.value));
        }}
      >
        {props.presentation.zoomOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
