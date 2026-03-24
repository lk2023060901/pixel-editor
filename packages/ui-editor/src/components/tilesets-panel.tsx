"use client";

import type { EditorController } from "@pixel-editor/app-services";
import {
  getMapGlobalTileGid,
  getTilesetTileByLocalId,
  listTilesetLocalIds,
  resolveMapTileGid,
  type EditorMap,
  type TilesetDefinition,
  type TilesetId
} from "@pixel-editor/domain";
import {
  getTileStampFootprint,
  getTileStampPrimaryGid,
  type TileStamp
} from "@pixel-editor/editor-state";
import { startTransition, useMemo } from "react";

import { Panel } from "./panel";
import { TilePropertiesEditor } from "./tile-properties-editor";
import { TilePreview } from "./tile-preview";
import { TilesetCreateForms } from "./tileset-create-forms";
import { TilesetDetailsForm } from "./tileset-details-form";

export interface TilesetsPanelProps {
  activeMap: EditorMap | undefined;
  tilesets: TilesetDefinition[];
  activeTilesetId: TilesetId | undefined;
  activeTileLocalId: number | null;
  activeStamp: TileStamp;
  store: EditorController;
}

export function TilesetsPanel({
  activeMap,
  tilesets,
  activeTilesetId,
  activeTileLocalId,
  activeStamp,
  store
}: TilesetsPanelProps) {
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
    <Panel title="Tilesets">
      {!availableTilesets.length && (
        <p className="text-sm text-slate-400">No tilesets attached to the active map.</p>
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
                    {tileset.kind}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  Tiles {listTilesetLocalIds(tileset).length}
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
                  <span>Active Stamp</span>
                  <span>
                    {activeStamp.kind === "pattern"
                      ? `${activeStampFootprint.width}×${activeStampFootprint.height} pattern`
                      : selectedStamp
                      ? `${selectedStamp.tileset.name} · tile ${selectedStamp.localId} · gid ${activeStampGid}`
                      : "None"}
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
                        Selected Tile
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
                tileset={activeTileset}
                selectedLocalId={selectedLocalId}
                store={store}
              />
            </>
          )}
        </>
      )}

      <TilesetCreateForms store={store} />
    </Panel>
  );
}
