"use client";

import type { EditorController } from "@pixel-editor/app-services";
import {
  getMapGlobalTileGid,
  getTilesetTileByLocalId,
  listTilesetLocalIds,
  resolveMapTileGid,
  type EditorMap,
  type PropertyTypeDefinition,
  type TilesetDefinition,
  type TilesetId
} from "@pixel-editor/domain";
import { useI18n } from "@pixel-editor/i18n/client";
import {
  getTileStampFootprint,
  getTileStampPrimaryGid,
  type TileStamp
} from "@pixel-editor/editor-state";
import type { ReactNode } from "react";
import { startTransition, useMemo, useState } from "react";

import { getTilesetKindLabel } from "./i18n-helpers";
import { Panel } from "./panel";
import { TilePropertiesEditor } from "./tile-properties-editor";
import { TilePreview } from "./tile-preview";
import {
  buildImageCollectionTileStyle,
  buildImageTilesetTileStyle,
  getImageTilesetColumns,
  TILESET_VIEW_ZOOM_OPTIONS
} from "./tileset-view-helpers";
import { TilesetCreateForms } from "./tileset-create-forms";
import { TilesetDetailsForm } from "./tileset-details-form";

export interface TilesetsPanelProps {
  activeMap: EditorMap | undefined;
  tilesets: TilesetDefinition[];
  activeTilesetId: TilesetId | undefined;
  activeTileLocalId: number | null;
  activeStamp: TileStamp;
  propertyTypes: readonly PropertyTypeDefinition[] | undefined;
  store: EditorController;
  onExportJson?: () => void;
  onOpenTileAnimationEditor?: () => void;
  onOpenTileCollisionEditor?: () => void;
  onOpenTerrainSets?: () => void;
  embedded?: boolean;
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

function TilesetsPanelContent({
  activeMap,
  tilesets,
  activeTilesetId,
  activeTileLocalId,
  activeStamp,
  propertyTypes,
  store,
  onExportJson
}: Omit<TilesetsPanelProps, "embedded">) {
  const { t } = useI18n();
  const availableTilesets = useMemo(() => {
    if (!activeMap) {
      return tilesets;
    }

    return activeMap.tilesetIds
      .map((tilesetId) => tilesets.find((tileset) => tileset.id === tilesetId))
      .filter((tileset): tileset is TilesetDefinition => tileset !== undefined);
  }, [activeMap, tilesets]);

  const activeStampGid = getTileStampPrimaryGid(activeStamp);
  const activeStampFootprint = getTileStampFootprint(activeStamp);
  const selectedStamp =
    activeMap && activeStampGid !== null
      ? resolveMapTileGid(activeMap, tilesets, activeStampGid)
      : undefined;
  const activeTileset =
    availableTilesets.find((tileset) => tileset.id === activeTilesetId) ??
    selectedStamp?.tileset ??
    availableTilesets[0];
  const activeTileIds = activeTileset ? listTilesetLocalIds(activeTileset) : [];
  const selectedLocalId =
    activeTileset && activeTileLocalId !== null && activeTileIds.includes(activeTileLocalId)
      ? activeTileLocalId
      : activeTileIds[0] ?? null;
  const selectedTile =
    activeTileset && selectedLocalId !== null
      ? getTilesetTileByLocalId(activeTileset, selectedLocalId)
      : undefined;

  return (
    <>
      {!availableTilesets.length && (
        <p className="text-sm text-slate-400">{t("tilesets.noAttached")}</p>
      )}

      {availableTilesets.length > 0 && (
        <>
          <div className="space-y-2">
            {availableTilesets.map((tileset) => (
              <article
                key={tileset.id}
                className={`cursor-pointer rounded-xl border px-3 py-3 transition ${
                  activeTileset?.id === tileset.id
                    ? "border-emerald-500/60 bg-emerald-500/10"
                    : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                }`}
                onClick={() => {
                  startTransition(() => {
                    store.setActiveTileset(tileset.id);
                  });
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <strong className="text-sm text-slate-100">{tileset.name}</strong>
                  <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                    {getTilesetKindLabel(tileset.kind, t)}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  {t("tilesets.tilesCount", { count: listTilesetLocalIds(tileset).length })}
                  {" · "}
                  {tileset.tileWidth}×{tileset.tileHeight}
                </p>
              </article>
            ))}
          </div>

          {activeTileset && (
            <>
              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-3 text-sm text-slate-300">
                <div className="flex items-center justify-between gap-3">
                  <span>{t("tilesets.activeStamp")}</span>
                  <span>
                    {activeStamp.kind === "pattern"
                      ? t("tilesets.patternSummary", {
                          width: activeStampFootprint.width,
                          height: activeStampFootprint.height
                        })
                      : selectedStamp
                        ? t("tilesets.stampTileSummary", {
                            gid: activeStampGid,
                            localId: selectedStamp.localId,
                            tilesetName: selectedStamp.tileset.name
                          })
                        : t("common.none")}
                  </span>
                </div>
                {selectedLocalId !== null && (
                  <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-3">
                    <TilePreview
                      tileset={activeTileset}
                      localId={selectedLocalId}
                      {...(activeStampGid !== null ? { gid: activeStampGid } : {})}
                    />
                    <div>
                      <p className="text-xs tracking-[0.18em] text-slate-500 uppercase">
                        {t("tilesets.selectedTile")}
                      </p>
                      <p className="mt-1 text-sm text-slate-100">
                        #{selectedLocalId}
                        {selectedTile?.className ? ` · ${selectedTile.className}` : ""}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 grid grid-cols-4 gap-2">
                {activeTileIds.map((localId) => {
                  const gid = activeMap
                    ? getMapGlobalTileGid(activeMap, tilesets, activeTileset.id, localId)
                    : undefined;
                  const isSelected = selectedLocalId === localId;

                  return (
                    <button
                      key={`${activeTileset.id}:${localId}`}
                      className={`flex aspect-square flex-col items-center justify-center rounded-xl border text-xs transition ${
                        isSelected
                          ? "border-emerald-400 bg-emerald-500/10 text-emerald-100"
                          : "border-slate-700 bg-slate-900/70 text-slate-200 hover:border-slate-500"
                      }`}
                      disabled={gid === undefined}
                      onClick={() => {
                        startTransition(() => {
                          store.selectStampTile(activeTileset.id, localId);
                        });
                      }}
                    >
                      <TilePreview
                        tileset={activeTileset}
                        localId={localId}
                        {...(gid !== undefined ? { gid } : {})}
                      />
                      <span>#{localId}</span>
                    </button>
                  );
                })}
              </div>

              <TilesetDetailsForm tileset={activeTileset} store={store} />
              <TilePropertiesEditor
                activeMap={activeMap}
                propertyTypes={propertyTypes}
                tileset={activeTileset}
                selectedLocalId={selectedLocalId}
                store={store}
              />
            </>
          )}
        </>
      )}

      <TilesetCreateForms store={store} />
    </>
  );
}

function TilesetsDockContent({
  activeMap,
  tilesets,
  activeTilesetId,
  activeTileLocalId,
  store,
  onExportJson,
  onOpenTileAnimationEditor,
  onOpenTileCollisionEditor,
  onOpenTerrainSets
}: Omit<TilesetsPanelProps, "embedded" | "activeStamp">) {
  const { t } = useI18n();
  const [zoom, setZoom] = useState<number>(1);
  const availableTilesets = useMemo(() => {
    if (!activeMap) {
      return tilesets;
    }

    return activeMap.tilesetIds
      .map((tilesetId) => tilesets.find((tileset) => tileset.id === tilesetId))
      .filter((tileset): tileset is TilesetDefinition => tileset !== undefined);
  }, [activeMap, tilesets]);
  const activeTileset =
    availableTilesets.find((tileset) => tileset.id === activeTilesetId) ??
    availableTilesets[0];
  const activeTileIds = activeTileset ? listTilesetLocalIds(activeTileset) : [];
  const selectedLocalId =
    activeTileset && activeTileLocalId !== null && activeTileIds.includes(activeTileLocalId)
      ? activeTileLocalId
      : activeTileIds[0] ?? null;

  if (!availableTilesets.length) {
    return (
      <div className="flex h-full min-h-[220px] items-center justify-center bg-[#b8b8b8] px-6 text-center text-sm text-slate-700">
        {t("tilesets.noAttached")}
      </div>
    );
  }

  const imageColumns =
    activeTileset?.kind === "image" ? getImageTilesetColumns(activeTileset) : undefined;

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#b8b8b8]">
      <div className="flex items-end border-b border-slate-700 bg-slate-800">
        <div className="flex min-w-0 flex-1 items-end gap-px overflow-x-auto px-1 pt-1">
          {availableTilesets.map((tileset) => {
            const isActive = tileset.id === activeTileset?.id;

            return (
              <button
                key={tileset.id}
                className={`shrink-0 border px-2 py-1 text-xs transition ${
                  isActive
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
        <button
          className="mx-1 mb-1 flex h-5 w-5 items-center justify-center rounded-sm border border-slate-600 bg-slate-700 text-[10px] text-slate-200"
          title={t("common.menu")}
          type="button"
        >
          ▼
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-2">
        {activeTileset ? (
          activeTileset.kind === "image" && imageColumns ? (
            <div
              className="inline-grid border border-slate-500/20 bg-transparent"
              style={{
                gridTemplateColumns: `repeat(${imageColumns}, ${activeTileset.tileWidth * zoom}px)`,
                gridAutoRows: `${activeTileset.tileHeight * zoom}px`
              }}
            >
              {activeTileIds.map((localId) => {
                const isSelected = selectedLocalId === localId;

                return (
                  <button
                    key={`${activeTileset.id}:${localId}`}
                    className={`relative border border-slate-500/10 bg-transparent ${
                      isSelected ? "z-10 ring-2 ring-blue-500 ring-inset" : ""
                    }`}
                    style={{
                      width: `${activeTileset.tileWidth * zoom}px`,
                      height: `${activeTileset.tileHeight * zoom}px`
                    }}
                    onClick={() => {
                      startTransition(() => {
                        store.selectStampTile(activeTileset.id, localId);
                      });
                    }}
                  >
                    <span
                      className="block"
                      style={buildImageTilesetTileStyle(activeTileset, localId, zoom)}
                    />
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-wrap items-start gap-1">
              {activeTileIds.map((localId) => {
                const isSelected = selectedLocalId === localId;

                return (
                  <button
                    key={`${activeTileset.id}:${localId}`}
                    className={`flex items-center justify-center border bg-slate-900/20 p-1 ${
                      isSelected ? "ring-2 ring-blue-500 ring-inset" : "border-slate-500/20"
                    }`}
                    onClick={() => {
                      startTransition(() => {
                        store.selectStampTile(activeTileset.id, localId);
                      });
                    }}
                  >
                    <span
                      className="block"
                      style={
                        buildImageCollectionTileStyle(activeTileset, localId, zoom) ?? {
                          width: `${activeTileset.tileWidth * zoom}px`,
                          height: `${activeTileset.tileHeight * zoom}px`,
                          backgroundColor: "#64748b"
                        }
                      }
                    />
                  </button>
                );
              })}
            </div>
          )
        ) : null}
      </div>

      <div className="flex items-center gap-1 border-t border-slate-700 bg-slate-800 px-2 py-1">
        <TilesetDockToolbarButton title={t("action.newTileset")}>
          <TilesetDockIcon>
            <path d="M4 2.5h5l2.5 2.5v8H4z" />
            <path d="M9 2.5V5h2.5" />
            <path d="M8 7v4" />
            <path d="M6 9h4" />
          </TilesetDockIcon>
        </TilesetDockToolbarButton>
        <TilesetDockToolbarButton title={t("action.addExternalTileset")}>
          <TilesetDockIcon>
            <path d="M3 8h6" />
            <path d="M7 4l4 4-4 4" />
            <path d="M2.5 3.5h2v9h-2z" />
          </TilesetDockIcon>
        </TilesetDockToolbarButton>
        <TilesetDockToolbarButton
          disabled={!activeTileset || !onExportJson}
          title={t("action.export")}
          onClick={onExportJson}
        >
          <TilesetDockIcon>
            <path d="M7 8h6" />
            <path d="M9 4l4 4-4 4" />
            <path d="M2.5 3.5h2v9h-2z" />
          </TilesetDockIcon>
        </TilesetDockToolbarButton>
        <TilesetDockToolbarButton title={t("action.tilesetProperties")}>
          <TilesetDockIcon>
            <path d="M3 4.5h10" />
            <path d="M3 8h10" />
            <path d="M3 11.5h10" />
            <circle cx="6" cy="4.5" r="1" fill="currentColor" stroke="none" />
            <circle cx="10" cy="8" r="1" fill="currentColor" stroke="none" />
            <circle cx="8" cy="11.5" r="1" fill="currentColor" stroke="none" />
          </TilesetDockIcon>
        </TilesetDockToolbarButton>
        <TilesetDockToolbarButton title={t("action.rearrangeTiles")}>
          <TilesetDockIcon>
            <path d="M3 5.5h8" />
            <path d="M9 3l2 2.5L9 8" />
            <path d="M13 10.5H5" />
            <path d="M7 8l-2 2.5L7 13" />
          </TilesetDockIcon>
        </TilesetDockToolbarButton>
        <TilesetDockToolbarButton
          disabled={!activeTileset || !onOpenTerrainSets}
          title={t("action.editWangSets")}
          onClick={onOpenTerrainSets}
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
          disabled={selectedLocalId === null || !onOpenTileCollisionEditor}
          title={t("action.editCollision")}
          onClick={onOpenTileCollisionEditor}
        >
          <TilesetDockIcon>
            <rect x="3" y="4" width="4" height="8" rx="0.8" />
            <circle cx="11.25" cy="8" r="2.25" />
          </TilesetDockIcon>
        </TilesetDockToolbarButton>
        <TilesetDockToolbarButton
          disabled={selectedLocalId === null || !onOpenTileAnimationEditor}
          title={t("action.tileAnimationEditor")}
          onClick={onOpenTileAnimationEditor}
        >
          <TilesetDockIcon>
            <rect x="2.5" y="3" width="3.5" height="10" rx="0.75" />
            <rect x="7.5" y="3" width="6" height="10" rx="0.75" />
            <path d="M9.5 5.5l2.5 2-2.5 2z" fill="currentColor" stroke="none" />
          </TilesetDockIcon>
        </TilesetDockToolbarButton>
        <TilesetDockToolbarButton title={t("action.removeTiles")}>
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
          value={String(zoom)}
          onChange={(event) => {
            setZoom(Number(event.target.value));
          }}
        >
          {TILESET_VIEW_ZOOM_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {Math.round(option * 100)} %
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function TilesetsPanel({
  embedded = false,
  ...props
}: TilesetsPanelProps) {
  const { t } = useI18n();
  const content = embedded
    ? <TilesetsDockContent {...props} />
    : <TilesetsPanelContent {...props} />;

  if (embedded) {
    return content;
  }

  return <Panel title={t("tilesets.title")}>{content}</Panel>;
}
