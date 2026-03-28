import type { TerrainSetsPanelViewState } from "./ui-models";

export type TerrainSetsPanelTilesetItem = TerrainSetsPanelViewState["availableTilesets"][number];
export type TerrainSetsPanelWangSetItem = TerrainSetsPanelViewState["wangSets"][number];
export type TerrainSetsPanelWangSetId = TerrainSetsPanelWangSetItem["id"];

export interface TerrainSetsPanelSelection {
  activeTileset: TerrainSetsPanelTilesetItem | undefined;
  selectedWangSetId: TerrainSetsPanelWangSetId | undefined;
  selectedWangSet: TerrainSetsPanelWangSetItem | undefined;
}

export function resolveTerrainSetsActiveTileset(
  availableTilesets: readonly TerrainSetsPanelTilesetItem[]
): TerrainSetsPanelTilesetItem | undefined {
  return availableTilesets.find((tileset) => tileset.isActive) ?? availableTilesets[0];
}

export function resolveTerrainSetsSelectedWangSetId(args: {
  activeTileset: TerrainSetsPanelTilesetItem | undefined;
  wangSets: readonly TerrainSetsPanelWangSetItem[];
  selectedWangSetId: TerrainSetsPanelWangSetId | undefined;
}): TerrainSetsPanelWangSetId | undefined {
  if (!args.activeTileset) {
    return undefined;
  }

  if (
    args.selectedWangSetId &&
    args.wangSets.some((wangSet) => wangSet.id === args.selectedWangSetId)
  ) {
    return args.selectedWangSetId;
  }

  return args.wangSets[0]?.id;
}

export function deriveTerrainSetsPanelSelection(args: {
  availableTilesets: readonly TerrainSetsPanelTilesetItem[];
  wangSets: readonly TerrainSetsPanelWangSetItem[];
  selectedWangSetId: TerrainSetsPanelWangSetId | undefined;
}): TerrainSetsPanelSelection {
  const activeTileset = resolveTerrainSetsActiveTileset(args.availableTilesets);
  const selectedWangSetId = resolveTerrainSetsSelectedWangSetId({
    activeTileset,
    wangSets: args.wangSets,
    selectedWangSetId: args.selectedWangSetId
  });

  return {
    activeTileset,
    selectedWangSetId,
    selectedWangSet: selectedWangSetId
      ? args.wangSets.find((wangSet) => wangSet.id === selectedWangSetId)
      : undefined
  };
}

export function resolveTerrainSetsRemovedWangSetFallbackId(args: {
  wangSets: readonly TerrainSetsPanelWangSetItem[];
  selectedWangSetId: TerrainSetsPanelWangSetId | undefined;
}): TerrainSetsPanelWangSetId | undefined {
  if (!args.selectedWangSetId) {
    return undefined;
  }

  const currentIndex = args.wangSets.findIndex(
    (wangSet) => wangSet.id === args.selectedWangSetId
  );

  if (currentIndex < 0) {
    return undefined;
  }

  return currentIndex > 0
    ? args.wangSets[currentIndex - 1]?.id
    : args.wangSets[1]?.id;
}
