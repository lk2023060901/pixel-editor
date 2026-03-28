import type { TranslationFn } from "@pixel-editor/i18n";
import { describe, expect, it, vi } from "vitest";

import {
  createTilesetsPanelStoreActionPlan,
  createTilesetsPanelSurfaceActionPlan,
  defaultTilesetsPanelZoom,
  deriveTilesetsPanelActiveStampPresentation,
  deriveTilesetsPanelPalettePresentation,
  deriveTilesetsPanelTileGridPresentation,
  deriveTilesetsPanelToolbarPresentation,
  tilesetsPanelStoreActionIds,
  tilesetsPanelToolbarActionIds,
  type TilesetsPanelViewState
} from "../src/ui";

const t = ((key: string) => key) as TranslationFn;

function createViewState(
  overrides: Partial<TilesetsPanelViewState> = {}
): TilesetsPanelViewState {
  return {
    availableTilesets: [],
    selectedLocalId: null,
    activeTileEntries: [],
    stampSummary: { kind: "none" },
    ...overrides
  };
}

describe("tilesets panel presentation helpers", () => {
  it("derives active stamp card data through exported APIs", () => {
    expect(
      deriveTilesetsPanelActiveStampPresentation(
        createViewState({
          selectedLocalId: 7,
          selectedTileClassName: "Water",
          selectedTilePreview: { kind: "fallback", tileWidth: 16, tileHeight: 16, gid: 11 },
          stampSummary: { kind: "tile", gid: 11, localId: 7, tilesetName: "Terrain" }
        })
      )
    ).toEqual({
      summary: { kind: "tile", gid: 11, localId: 7, tilesetName: "Terrain" },
      selectedTile: {
        localId: 7,
        className: "Water",
        preview: { kind: "fallback", tileWidth: 16, tileHeight: 16, gid: 11 }
      }
    });

    expect(deriveTilesetsPanelActiveStampPresentation(createViewState())).toEqual({
      summary: { kind: "none" },
      selectedTile: undefined
    });
  });

  it("derives palette modes through exported APIs", () => {
    expect(deriveTilesetsPanelPalettePresentation(createViewState())).toEqual({ kind: "none" });

    expect(
      deriveTilesetsPanelPalettePresentation(
        createViewState({
          activeTilesetId: "tileset-1",
          activeTilesetKind: "image",
          activeTileWidth: 16,
          activeTileHeight: 24,
          activeImageColumns: 8,
          activeTileEntries: [{ localId: 1, isSelected: true, preview: { kind: "fallback", tileWidth: 16, tileHeight: 24, gid: 5 } }]
        })
      )
    ).toMatchObject({
      kind: "image-grid",
      activeTilesetId: "tileset-1",
      tileWidth: 16,
      tileHeight: 24,
      imageColumns: 8
    });

    expect(
      deriveTilesetsPanelPalettePresentation(
        createViewState({
          activeTilesetId: "tileset-2",
          activeTilesetKind: "image-collection",
          activeTileWidth: 32,
          activeTileHeight: 32
        })
      )
    ).toEqual({
      kind: "collection-grid",
      activeTilesetId: "tileset-2",
      activeTileEntries: []
    });
  });

  it("derives tile grid item presentation through exported APIs", () => {
    expect(deriveTilesetsPanelTileGridPresentation(createViewState())).toEqual({ kind: "none" });

    expect(
      deriveTilesetsPanelTileGridPresentation(
        createViewState({
          activeTilesetId: "tileset-1",
          activeTileEntries: [
            {
              localId: 1,
              isSelected: true,
              preview: { kind: "fallback", tileWidth: 16, tileHeight: 24, gid: 5 }
            },
            {
              localId: 2,
              isSelected: false,
              preview: { kind: "fallback", tileWidth: 16, tileHeight: 24 }
            }
          ]
        })
      )
    ).toEqual({
      kind: "grid",
      tilesetId: "tileset-1",
      items: [
        {
          key: "tileset-1:1",
          localId: 1,
          isSelected: true,
          preview: { kind: "fallback", tileWidth: 16, tileHeight: 24, gid: 5 },
          disabled: false
        },
        {
          key: "tileset-1:2",
          localId: 2,
          isSelected: false,
          preview: { kind: "fallback", tileWidth: 16, tileHeight: 24 },
          disabled: true
        }
      ]
    });
  });

  it("derives toolbar state and zoom options through shared presentation helpers", () => {
    const presentation = deriveTilesetsPanelToolbarPresentation({
      viewState: createViewState({
        activeTilesetId: "tileset-1",
        selectedLocalId: 3
      }),
      hasExportJsonAction: true,
      hasOpenTerrainSetsAction: true,
      hasOpenTileCollisionEditorAction: true,
      hasOpenTileAnimationEditorAction: true,
      t
    });

    expect(defaultTilesetsPanelZoom).toBe(1);
    expect(presentation.zoomOptions.length).toBeGreaterThan(0);
    expect(presentation.actionItems).toEqual([
      { actionId: tilesetsPanelToolbarActionIds.newTileset, title: "action.newTileset", disabled: false },
      { actionId: tilesetsPanelToolbarActionIds.addExternalTileset, title: "action.addExternalTileset", disabled: false },
      { actionId: tilesetsPanelToolbarActionIds.exportJson, title: "action.export", disabled: false },
      { actionId: tilesetsPanelToolbarActionIds.tilesetProperties, title: "action.tilesetProperties", disabled: false },
      { actionId: tilesetsPanelToolbarActionIds.rearrangeTiles, title: "action.rearrangeTiles", disabled: false },
      { actionId: tilesetsPanelToolbarActionIds.openTerrainSets, title: "action.editWangSets", disabled: false },
      { actionId: tilesetsPanelToolbarActionIds.openTileCollisionEditor, title: "action.editCollision", disabled: false },
      { actionId: tilesetsPanelToolbarActionIds.openTileAnimationEditor, title: "action.tileAnimationEditor", disabled: false },
      { actionId: tilesetsPanelToolbarActionIds.removeTiles, title: "action.removeTiles", disabled: false }
    ]);
  });

  it("creates store-backed and surface action plans through exported APIs", () => {
    const store = {
      setActiveTileset: vi.fn(),
      selectStampTile: vi.fn()
    };
    const surfaceStore = {
      exportJson: vi.fn(),
      openTerrainSets: vi.fn(),
      openTileCollisionEditor: vi.fn(),
      openTileAnimationEditor: vi.fn()
    };

    const activatePlan = createTilesetsPanelStoreActionPlan({
      actionId: tilesetsPanelStoreActionIds.activateTileset,
      tilesetId: "tileset-1"
    });
    const selectPlan = createTilesetsPanelStoreActionPlan({
      actionId: tilesetsPanelStoreActionIds.selectStampTile,
      tilesetId: "tileset-1",
      localId: 7
    });

    expect(activatePlan.kind).toBe("transition");
    if (activatePlan.kind === "transition") {
      activatePlan.run(store as never);
    }
    expect(selectPlan.kind).toBe("transition");
    if (selectPlan.kind === "transition") {
      selectPlan.run(store as never);
    }

    expect(store.setActiveTileset).toHaveBeenCalledWith("tileset-1");
    expect(store.selectStampTile).toHaveBeenCalledWith("tileset-1", 7);
    expect(
      createTilesetsPanelStoreActionPlan({
        actionId: tilesetsPanelStoreActionIds.selectStampTile,
        tilesetId: undefined,
        localId: 3
      })
    ).toEqual({ kind: "noop" });

    const exportPlan = createTilesetsPanelSurfaceActionPlan({
      actionId: tilesetsPanelToolbarActionIds.exportJson,
      viewState: createViewState({ activeTilesetId: "tileset-1" }),
      hasExportJsonAction: true,
      hasOpenTerrainSetsAction: false,
      hasOpenTileCollisionEditorAction: false,
      hasOpenTileAnimationEditorAction: false
    });

    expect(exportPlan.kind).toBe("transition");
    if (exportPlan.kind === "transition") {
      exportPlan.run(surfaceStore);
    }
    expect(surfaceStore.exportJson).toHaveBeenCalledTimes(1);

    expect(
      createTilesetsPanelSurfaceActionPlan({
        actionId: tilesetsPanelToolbarActionIds.openTileCollisionEditor,
        viewState: createViewState({ selectedLocalId: null }),
        hasExportJsonAction: false,
        hasOpenTerrainSetsAction: false,
        hasOpenTileCollisionEditorAction: true,
        hasOpenTileAnimationEditorAction: false
      })
    ).toEqual({ kind: "noop" });
  });
});
