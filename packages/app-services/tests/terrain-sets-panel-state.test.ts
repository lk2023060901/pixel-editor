import { createEntityId } from "@pixel-editor/domain";
import { describe, expect, it } from "vitest";

import {
  deriveTerrainSetsPanelSelection,
  resolveTerrainSetsActiveTileset,
  resolveTerrainSetsRemovedWangSetFallbackId,
  resolveTerrainSetsSelectedWangSetId
} from "../src/ui";

describe("terrain sets panel state helpers", () => {
  it("resolves active tileset and selected wang set through exported APIs", () => {
    const firstTilesetId = createEntityId("tileset");
    const secondTilesetId = createEntityId("tileset");
    const firstWangSetId = createEntityId("wangSet");
    const secondWangSetId = createEntityId("wangSet");
    const availableTilesets = [
      { id: firstTilesetId, name: "Ground", isActive: false },
      { id: secondTilesetId, name: "Cliffs", isActive: true }
    ];
    const wangSets = [
      { id: firstWangSetId, name: "Grass", type: "corner" as const },
      { id: secondWangSetId, name: "Rock", type: "edge" as const }
    ];

    expect(resolveTerrainSetsActiveTileset(availableTilesets)).toEqual(availableTilesets[1]);
    expect(
      resolveTerrainSetsSelectedWangSetId({
        activeTileset: availableTilesets[1],
        wangSets,
        selectedWangSetId: undefined
      })
    ).toBe(firstWangSetId);
    expect(
      deriveTerrainSetsPanelSelection({
        availableTilesets,
        wangSets,
        selectedWangSetId: secondWangSetId
      })
    ).toEqual({
      activeTileset: availableTilesets[1],
      selectedWangSetId: secondWangSetId,
      selectedWangSet: wangSets[1]
    });
  });

  it("normalizes empty and removal fallback cases through exported APIs", () => {
    const inactiveTilesetId = createEntityId("tileset");
    const firstWangSetId = createEntityId("wangSet");
    const secondWangSetId = createEntityId("wangSet");
    const thirdWangSetId = createEntityId("wangSet");
    const inactiveTilesets = [{ id: inactiveTilesetId, name: "Ground", isActive: false }];
    const wangSets = [
      { id: firstWangSetId, name: "Grass", type: "corner" as const },
      { id: secondWangSetId, name: "Rock", type: "edge" as const },
      { id: thirdWangSetId, name: "Sand", type: "mixed" as const }
    ];

    expect(
      resolveTerrainSetsSelectedWangSetId({
        activeTileset: undefined,
        wangSets,
        selectedWangSetId: secondWangSetId
      })
    ).toBeUndefined();
    expect(
      resolveTerrainSetsRemovedWangSetFallbackId({
        wangSets,
        selectedWangSetId: firstWangSetId
      })
    ).toBe(secondWangSetId);
    expect(
      resolveTerrainSetsRemovedWangSetFallbackId({
        wangSets,
        selectedWangSetId: thirdWangSetId
      })
    ).toBe(secondWangSetId);
    expect(
      deriveTerrainSetsPanelSelection({
        availableTilesets: inactiveTilesets,
        wangSets: [],
        selectedWangSetId: undefined
      })
    ).toEqual({
      activeTileset: inactiveTilesets[0],
      selectedWangSetId: undefined,
      selectedWangSet: undefined
    });
  });
});
