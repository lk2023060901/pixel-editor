import { describe, expect, it } from "vitest";

import {
  createProperty,
  getMapGlobalTileGid,
  getTileLayerCell
} from "@pixel-editor/domain";
import {
  createSingleTileStamp,
  getTileStampPrimaryGid
} from "@pixel-editor/editor-state";

import { createTestEditorStore } from "./support/create-test-editor-store";

describe("editor controller", () => {
  it("creates a quick map through the controller preset API", () => {
    const store = createTestEditorStore("demo");
    const initialMapCount = store.getState().maps.length;

    const mapId = store.createQuickMapDocument();
    const snapshot = store.getSnapshot();

    expect(snapshot.workspace.maps).toHaveLength(initialMapCount + 1);
    expect(snapshot.activeMap?.id).toBe(mapId);
    expect(snapshot.activeMap?.name).toBe("map-2");
    expect(snapshot.activeMap?.settings).toMatchObject({
      orientation: "orthogonal",
      width: 48,
      height: 32,
      tileWidth: 32,
      tileHeight: 32
    });
  });

  it("routes canvas actions through the active tool", () => {
    const store = createTestEditorStore("demo");

    store.setActiveStamp(createSingleTileStamp(11));
    store.handleCanvasPrimaryAction(3, 4);

    const paintedSnapshot = store.getSnapshot();
    const tileLayer =
      paintedSnapshot.activeMap?.layers.find((layer) => layer.kind === "tile") ?? null;

    expect(tileLayer?.kind).toBe("tile");
    expect(
      tileLayer?.kind === "tile" ? getTileLayerCell(tileLayer, 3, 4)?.gid : null
    ).toBe(11);

    store.setActiveTool("select");
    store.handleCanvasPrimaryAction(5, 6);

    expect(store.getState().session.selection).toEqual({
      kind: "tile",
      coordinates: [{ x: 5, y: 6 }]
    });
  });

  it("commits drag painting as a single undoable stroke", () => {
    const store = createTestEditorStore("demo");

    store.setActiveStamp(createSingleTileStamp(13));
    store.beginCanvasStroke(1, 1);
    store.updateCanvasStroke(4, 1);
    store.endCanvasStroke();

    const paintedLayer = store
      .getSnapshot()
      .activeMap?.layers.find((layer) => layer.kind === "tile");

    expect(
      paintedLayer?.kind === "tile" ? getTileLayerCell(paintedLayer, 1, 1)?.gid : null
    ).toBe(13);
    expect(
      paintedLayer?.kind === "tile" ? getTileLayerCell(paintedLayer, 4, 1)?.gid : null
    ).toBe(13);

    store.undo();

    const revertedLayer = store
      .getSnapshot()
      .activeMap?.layers.find((layer) => layer.kind === "tile");

    expect(
      revertedLayer?.kind === "tile" ? getTileLayerCell(revertedLayer, 1, 1)?.gid : null
    ).toBeNull();
    expect(
      revertedLayer?.kind === "tile" ? getTileLayerCell(revertedLayer, 4, 1)?.gid : null
    ).toBeNull();
  });

  it("supports drag erasing through the stroke lifecycle", () => {
    const store = createTestEditorStore("demo");

    store.setActiveStamp(createSingleTileStamp(17));
    store.beginCanvasStroke(2, 2);
    store.updateCanvasStroke(4, 2);
    store.endCanvasStroke();

    store.setActiveTool("eraser");
    store.beginCanvasStroke(3, 2);
    store.updateCanvasStroke(4, 2);
    store.endCanvasStroke();

    const layer = store
      .getSnapshot()
      .activeMap?.layers.find((entry) => entry.kind === "tile");

    expect(layer?.kind === "tile" ? getTileLayerCell(layer, 2, 2)?.gid : null).toBe(17);
    expect(layer?.kind === "tile" ? getTileLayerCell(layer, 3, 2)?.gid : null).toBeNull();
    expect(layer?.kind === "tile" ? getTileLayerCell(layer, 4, 2)?.gid : null).toBeNull();
  });

  it("fills a bounded region through the bucket-fill tool", () => {
    const store = createTestEditorStore("demo");

    store.setActiveStamp(createSingleTileStamp(9));
    store.handleCanvasPrimaryAction(2, 0);
    store.handleCanvasPrimaryAction(2, 1);
    store.handleCanvasPrimaryAction(2, 2);
    store.handleCanvasPrimaryAction(0, 2);
    store.handleCanvasPrimaryAction(1, 2);

    store.setActiveStamp(createSingleTileStamp(6));
    store.setActiveTool("bucket-fill");
    store.handleCanvasPrimaryAction(0, 0);

    let layer = store
      .getSnapshot()
      .activeMap?.layers.find((entry) => entry.kind === "tile");

    expect(layer?.kind === "tile" ? getTileLayerCell(layer, 0, 0)?.gid : null).toBe(6);
    expect(layer?.kind === "tile" ? getTileLayerCell(layer, 1, 1)?.gid : null).toBe(6);
    expect(layer?.kind === "tile" ? getTileLayerCell(layer, 2, 1)?.gid : null).toBe(9);
    expect(store.getState().session.selection).toEqual({
      kind: "tile",
      coordinates: [{ x: 0, y: 0 }]
    });

    store.undo();

    layer = store.getSnapshot().activeMap?.layers.find((entry) => entry.kind === "tile");

    expect(layer?.kind === "tile" ? getTileLayerCell(layer, 0, 0)?.gid : null).toBeNull();
    expect(layer?.kind === "tile" ? getTileLayerCell(layer, 1, 1)?.gid : null).toBeNull();
    expect(layer?.kind === "tile" ? getTileLayerCell(layer, 2, 1)?.gid : null).toBe(9);
  });

  it("previews and commits shape fills with shape mode modifiers", () => {
    const store = createTestEditorStore("demo");

    store.setActiveStamp(createSingleTileStamp(12));
    store.setActiveTool("shape-fill");
    store.setShapeFillMode("ellipse");
    store.beginCanvasStroke(5, 5, {
      lockAspectRatio: true,
      fromCenter: true
    });
    store.updateCanvasStroke(8, 7, {
      lockAspectRatio: true,
      fromCenter: true
    });

    const preview = store.getSnapshot().interactions.canvasPreview;

    expect(preview.kind).toBe("shape-fill");
    expect(preview.kind === "shape-fill" ? preview.coordinates : []).toContainEqual({
      x: 5,
      y: 5
    });
    expect(preview.kind === "shape-fill" ? preview.coordinates : []).toContainEqual({
      x: 5,
      y: 3
    });
    expect(preview.kind === "shape-fill" ? preview.coordinates : []).not.toContainEqual({
      x: 3,
      y: 3
    });

    store.endCanvasStroke();

    const layer = store
      .getSnapshot()
      .activeMap?.layers.find((entry) => entry.kind === "tile");

    expect(store.getSnapshot().interactions.canvasPreview.kind).toBe("none");
    expect(layer?.kind === "tile" ? getTileLayerCell(layer, 5, 5)?.gid : null).toBe(12);
    expect(layer?.kind === "tile" ? getTileLayerCell(layer, 5, 3)?.gid : null).toBe(12);
    expect(layer?.kind === "tile" ? getTileLayerCell(layer, 3, 3)?.gid : null).toBeNull();
  });

  it("clears transient canvas previews when the shape mode changes", () => {
    const store = createTestEditorStore("demo");

    store.setActiveTool("shape-fill");
    store.beginCanvasStroke(2, 2);
    store.updateCanvasStroke(6, 4);

    expect(store.getSnapshot().interactions.canvasPreview.kind).toBe("shape-fill");

    store.setShapeFillMode("ellipse");

    expect(store.getSnapshot().interactions.canvasPreview.kind).toBe("none");
  });

  it("selects tile regions and captures them as reusable pattern stamps", () => {
    const store = createTestEditorStore("demo");

    store.setActiveStamp(createSingleTileStamp(21));
    store.handleCanvasPrimaryAction(1, 1);
    store.setActiveStamp(createSingleTileStamp(22));
    store.handleCanvasPrimaryAction(2, 1);

    store.setActiveTool("select");
    store.beginCanvasStroke(1, 1);
    store.updateCanvasStroke(2, 1);

    const preview = store.getSnapshot().interactions.canvasPreview;

    expect(preview.kind).toBe("tile-selection");
    expect(preview.kind === "tile-selection" ? preview.coordinates : []).toHaveLength(2);

    store.endCanvasStroke();

    expect(store.getState().session.selection).toEqual({
      kind: "tile",
      coordinates: [
        { x: 1, y: 1 },
        { x: 2, y: 1 }
      ]
    });

    store.captureSelectedTilesAsStamp();

    const capturedSnapshot = store.getSnapshot();

    expect(capturedSnapshot.workspace.session.activeStamp.kind).toBe("pattern");
    expect(getTileStampPrimaryGid(capturedSnapshot.workspace.session.activeStamp)).toBe(21);
    expect(capturedSnapshot.workspace.session.activeTool).toBe("stamp");

    store.handleCanvasPrimaryAction(6, 4);

    const layer = store
      .getSnapshot()
      .activeMap?.layers.find((entry) => entry.kind === "tile");

    expect(layer?.kind === "tile" ? getTileLayerCell(layer, 6, 4)?.gid : null).toBe(21);
    expect(layer?.kind === "tile" ? getTileLayerCell(layer, 7, 4)?.gid : null).toBe(22);
  });

  it("selects stamps from the active tileset set", () => {
    const store = createTestEditorStore("demo");
    const snapshot = store.getSnapshot();
    const secondTileset = snapshot.workspace.tilesets[1]!;
    store.setActiveTileset(secondTileset.id);
    store.selectStampTile(secondTileset.id, 2);

    const nextSnapshot = store.getSnapshot();
    const gid = getMapGlobalTileGid(
      nextSnapshot.activeMap!,
      nextSnapshot.workspace.tilesets,
      secondTileset.id,
      2
    );

    expect(nextSnapshot.activeTileset?.id).toBe(secondTileset.id);
    expect(nextSnapshot.workspace.session.activeTilesetTileLocalId).toBe(2);
    expect(getTileStampPrimaryGid(nextSnapshot.workspace.session.activeStamp)).toBe(gid);
    expect(nextSnapshot.workspace.session.activeTool).toBe("stamp");
  });

  it("creates sprite-sheet and image-collection tilesets on the active map", () => {
    const store = createTestEditorStore("demo");
    const initialTilesetCount = store.getState().tilesets.length;

    store.createSpriteSheetTileset({
      name: "Custom Sheet",
      imagePath: "/demo/terrain-core.svg",
      imageWidth: 192,
      imageHeight: 128,
      tileWidth: 32,
      tileHeight: 32,
      columns: 6
    });
    store.createImageCollectionTileset({
      name: "Custom Collection",
      tileWidth: 32,
      tileHeight: 32,
      imageSources: ["/demo/props/prop-1.svg", "/demo/props/prop-2.svg"]
    });

    const snapshot = store.getSnapshot();

    expect(snapshot.workspace.tilesets).toHaveLength(initialTilesetCount + 2);
    expect(snapshot.activeMap?.tilesetIds).toHaveLength(initialTilesetCount + 2);
    expect(snapshot.activeTileset?.name).toBe("Custom Collection");
  });

  it("updates active tileset details and selected tile properties", () => {
    const store = createTestEditorStore("demo");

    store.setActiveTileset(store.getState().tilesets[0]!.id);
    store.selectStampTile(store.getState().tilesets[0]!.id, 5);
    store.updateActiveTilesetDetails({
      tileOffsetX: 6,
      tileOffsetY: -4,
      objectAlignment: "bottom",
      tileRenderSize: "grid"
    });
    store.updateSelectedTileMetadata({
      className: "TerrainSlope"
    });
    store.upsertSelectedTileProperty(createProperty("terrainType", "string", "grass"));

    let snapshot = store.getSnapshot();

    expect(snapshot.activeTileset).toMatchObject({
      tileOffsetX: 6,
      tileOffsetY: -4,
      objectAlignment: "bottom",
      tileRenderSize: "grid"
    });
    expect(snapshot.workspace.session.activeTilesetTileLocalId).toBe(5);
    expect(snapshot.activeTileset?.tiles[5]).toMatchObject({
      className: "TerrainSlope"
    });
    expect(snapshot.activeTileset?.tiles[5]?.properties).toEqual([
      createProperty("terrainType", "string", "grass")
    ]);

    store.upsertSelectedTileProperty(
      createProperty("spawnWeight", "int", 4),
      "terrainType"
    );
    store.removeSelectedTileProperty("spawnWeight");

    snapshot = store.getSnapshot();

    expect(snapshot.activeTileset?.tiles[5]?.properties).toEqual([]);
  });
});
