"use client";

import type { EditorMap, TilesetDefinition } from "@pixel-editor/domain";
import { useMemo } from "react";

import { Panel } from "./panel";

export interface TerrainSetsPanelProps {
  activeMap: EditorMap | undefined;
  tilesets: TilesetDefinition[];
  embedded?: boolean;
}

function TerrainSetsPanelContent({
  activeMap,
  tilesets
}: Omit<TerrainSetsPanelProps, "embedded">) {
  const availableTilesets = useMemo(() => {
    if (!activeMap) {
      return tilesets;
    }

    return activeMap.tilesetIds
      .map((tilesetId) => tilesets.find((tileset) => tileset.id === tilesetId))
      .filter((tileset): tileset is TilesetDefinition => tileset !== undefined);
  }, [activeMap, tilesets]);
  const tilesetsWithTerrainSets = availableTilesets.filter((tileset) => tileset.wangSets.length > 0);

  if (!tilesetsWithTerrainSets.length) {
    return (
      <div className="flex h-full min-h-[220px] items-center justify-center px-6 text-center text-sm text-slate-400">
        No tileset with terrain sets available.
      </div>
    );
  }

  return (
    <div className="min-h-0 overflow-y-auto">
      {tilesetsWithTerrainSets.map((tileset) => (
        <article key={tileset.id} className="border-b border-slate-800">
          <div className="px-3 py-2 text-xs uppercase tracking-[0.14em] text-slate-500">
            {tileset.name}
          </div>
          <ul className="text-sm text-slate-300">
            {tileset.wangSets.map((wangSet) => (
              <li
                key={`${tileset.id}:${wangSet.name}`}
                className="flex items-center justify-between border-t border-slate-800 px-3 py-2"
              >
                <span>{wangSet.name}</span>
                <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  {wangSet.type}
                </span>
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}

export function TerrainSetsPanel({
  embedded = false,
  ...props
}: TerrainSetsPanelProps) {
  const content = <TerrainSetsPanelContent {...props} />;

  if (embedded) {
    return content;
  }

  return <Panel title="Terrain Sets">{content}</Panel>;
}
