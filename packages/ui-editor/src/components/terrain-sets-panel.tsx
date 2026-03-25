"use client";

import type { EditorMap, TilesetDefinition } from "@pixel-editor/domain";
import { useI18n } from "@pixel-editor/i18n/client";
import { useMemo } from "react";

import { Panel } from "./panel";
import { getWangSetTypeLabel } from "./i18n-helpers";

export interface TerrainSetsPanelProps {
  activeMap: EditorMap | undefined;
  tilesets: TilesetDefinition[];
  embedded?: boolean;
}

function TerrainSetsPanelContent({
  activeMap,
  tilesets
}: Omit<TerrainSetsPanelProps, "embedded">) {
  const { t } = useI18n();
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
      <div className="flex h-full min-h-[220px] items-center justify-center bg-[#b8b8b8] px-6 text-center text-sm text-slate-700">
        {t("terrainSets.noneAvailable")}
      </div>
    );
  }

  return (
    <div className="min-h-0 h-full overflow-y-auto bg-[#b8b8b8] p-2">
      {tilesetsWithTerrainSets.map((tileset) => (
        <article key={tileset.id} className="mb-2 border border-slate-500/30 bg-slate-100/70">
          <div className="border-b border-slate-500/30 px-3 py-2 text-xs uppercase tracking-[0.14em] text-slate-600">
            {tileset.name}
          </div>
          <ul className="text-sm text-slate-800">
            {tileset.wangSets.map((wangSet) => (
              <li
                key={`${tileset.id}:${wangSet.name}`}
                className="flex items-center justify-between border-t border-slate-500/20 px-3 py-2"
              >
                <span>{wangSet.name}</span>
                <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  {getWangSetTypeLabel(wangSet.type, t)}
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
  const { t } = useI18n();
  const content = <TerrainSetsPanelContent {...props} />;

  if (embedded) {
    return content;
  }

  return <Panel title={t("terrainSets.title")}>{content}</Panel>;
}
