import { describe, expect, it } from "vitest";

import {
  createProject,
  createProperty,
  getMapGlobalTileGid,
  getTileLayerCell,
  type TileAnimationFrame
} from "@pixel-editor/domain";
import {
  createEditorWorkspaceState,
  createSingleTileStamp,
  getTileStampPrimaryGid
} from "@pixel-editor/editor-state";

import { createEditorStore } from "../src/controller";
import { createTestEditorStore } from "./support/create-test-editor-store";

describe("editor controller", () => {
  it("returns a stable snapshot reference until state changes", () => {
    const store = createTestEditorStore("demo");

    const firstSnapshot = store.getSnapshot();
    const secondSnapshot = store.getSnapshot();

    expect(secondSnapshot).toBe(firstSnapshot);

    store.zoomIn();

    const thirdSnapshot = store.getSnapshot();

    expect(thirdSnapshot).not.toBe(firstSnapshot);
    expect(store.getSnapshot()).toBe(thirdSnapshot);
  });

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

  it("imports a TMJ document into the workspace through the controller", () => {
    const store = createTestEditorStore("demo");
    const initialMapCount = store.getState().maps.length;

    const imported = store.importTmjMapDocument(
      {
        name: "imported-map",
        orientation: "orthogonal",
        width: 2,
        height: 2,
        tilewidth: 32,
        tileheight: 32,
        layers: [
          {
            type: "tilelayer",
            name: "Ground",
            width: 2,
            height: 2,
            data: [1, 0, 2, 0]
          }
        ],
        tilesets: [
          {
            firstgid: 1,
            source: "../tilesets/terrain.tsj"
          }
        ]
      },
      {
        documentPath: "maps/imported-map.tmj"
      }
    );

    expect(store.getState().maps).toHaveLength(initialMapCount + 1);
    expect(store.getSnapshot().activeMap?.name).toBe("imported-map");
    expect(imported.tilesetReferences).toEqual([
      {
        firstGid: 1,
        source: "../tilesets/terrain.tsj"
      }
    ]);
    expect(imported.assetReferences).toEqual([
      expect.objectContaining({
        kind: "tileset",
        ownerPath: "tmj.tilesets[0].source",
        resolvedPath: "tilesets/terrain.tsj",
        assetRoot: "tilesets",
        externalToProject: false,
        documentPath: "maps/imported-map.tmj"
      })
    ]);
    expect(imported.issues).toEqual([]);
  });

  it("imports a TMX document into the workspace through the controller", () => {
    const store = createTestEditorStore("demo");
    const initialMapCount = store.getState().maps.length;

    const imported = store.importTmxMapDocument(`<?xml version="1.0" encoding="UTF-8"?>
<map version="1.11" tiledversion="1.11.2" name="xml-import" orientation="orthogonal" width="2" height="2" tilewidth="32" tileheight="32">
  <tileset firstgid="1" source="../tilesets/terrain.tsx"/>
  <layer id="1" name="Ground" width="2" height="2">
    <data encoding="csv">1,0,2,0</data>
  </layer>
</map>`);

    expect(store.getState().maps).toHaveLength(initialMapCount + 1);
    expect(store.getSnapshot().activeMap?.name).toBe("xml-import");
    expect(imported.tilesetReferences).toEqual([
      {
        firstGid: 1,
        source: "../tilesets/terrain.tsx"
      }
    ]);
    expect(imported.issues).toEqual([]);
  });

  it("imports a TSJ tileset into the workspace through the controller", () => {
    const store = createTestEditorStore("demo");
    const initialTilesetCount = store.getState().tilesets.length;
    const activeMap = store.getSnapshot().activeMap;

    const imported = store.importTsjTilesetDocument({
      type: "tileset",
      version: "1.11",
      tiledversion: "1.11.2",
      name: "Imported Props",
      tilewidth: 32,
      tileheight: 32,
      tilecount: 2,
      columns: 0,
      tiles: [
        {
          id: 0,
          image: "../tilesets/prop-a.png"
        },
        {
          id: 1,
          image: "../tilesets/prop-b.png",
          type: "Decoration"
        }
      ]
    });

    const snapshot = store.getSnapshot();

    expect(snapshot.workspace.tilesets).toHaveLength(initialTilesetCount + 1);
    expect(snapshot.activeTileset?.name).toBe("Imported Props");
    expect(imported.tileset.kind).toBe("image-collection");
    expect(imported.tileset.tiles[1]).toMatchObject({
      localId: 1,
      className: "Decoration",
      imageSource: "../tilesets/prop-b.png"
    });
    expect(imported.issues).toEqual([]);
    expect(activeMap?.tilesetIds).not.toContain(imported.tileset.id);
    expect(snapshot.activeMap?.tilesetIds).toContain(imported.tileset.id);
  });

  it("imports a TSX tileset into the workspace through the controller", () => {
    const store = createTestEditorStore("demo");
    const initialTilesetCount = store.getState().tilesets.length;
    const activeMap = store.getSnapshot().activeMap;

    const imported = store.importTsxTilesetDocument(`<?xml version="1.0" encoding="UTF-8"?>
<tileset version="1.11" tiledversion="1.11.2" name="Imported Terrain" tilewidth="32" tileheight="32" tilecount="2" columns="2">
  <image source="../tilesets/terrain.png" width="64" height="32"/>
  <tile id="1" type="Decoration"/>
</tileset>`);

    const snapshot = store.getSnapshot();

    expect(snapshot.workspace.tilesets).toHaveLength(initialTilesetCount + 1);
    expect(snapshot.activeTileset?.name).toBe("Imported Terrain");
    expect(imported.tileset).toMatchObject({
      kind: "image",
      name: "Imported Terrain"
    });
    expect(imported.tileset.tiles[1]).toMatchObject({
      localId: 1,
      className: "Decoration"
    });
    expect(imported.issues).toEqual([]);
    expect(activeMap?.tilesetIds).not.toContain(imported.tileset.id);
    expect(snapshot.activeMap?.tilesetIds).toContain(imported.tileset.id);
  });

  it("records import issues in runtime state and exposes issues panel controls", () => {
    const store = createTestEditorStore("demo");

    store.importTmxMapDocument(`<?xml version="1.0" encoding="UTF-8"?>
<map version="1.11" tiledversion="1.11.2" name="xml-import" orientation="orthogonal" width="1" height="1" tilewidth="32" tileheight="32" mystery="1">
  <tileset firstgid="1" source="https://example.com/terrain.tsx"/>
</map>`, {
      documentPath: "maps/xml-import.tmx"
    });

    let snapshot = store.getSnapshot();

    expect(snapshot.runtime.issues.panelOpen).toBe(true);
    expect(snapshot.runtime.issues.entries).toEqual([
      expect.objectContaining({
        documentName: "xml-import",
        sourceKind: "tmx",
        code: "tmx.attribute.unknown",
        path: "tmx.@mystery"
      }),
      expect.objectContaining({
        documentName: "xml-import",
        sourceKind: "tmx",
        code: "tmx.asset.externalReference",
        path: "tmx.tilesets[0].source"
      })
    ]);

    store.toggleIssuesPanel();
    snapshot = store.getSnapshot();
    expect(snapshot.runtime.issues.panelOpen).toBe(false);

    store.clearIssues();
    snapshot = store.getSnapshot();
    expect(snapshot.runtime.issues.entries).toEqual([]);
    expect(snapshot.runtime.issues.panelOpen).toBe(false);
  });

  it("imports tiled project metadata into the current workspace", () => {
    const store = createTestEditorStore("demo");

    const imported = store.importTiledProjectDocument(
      {
        folders: ["maps", "tilesets", "templates"],
        extensionsPath: "extensions",
        automappingRulesFile: "rules.txt",
        compatibilityVersion: 1120,
        propertyTypes: [
          {
            id: 1,
            type: "enum",
            name: "Biome",
            storageType: "string",
            values: ["forest", "desert"],
            valuesAsFlags: false
          }
        ],
        commands: [{ name: "Build" }]
      },
      {
        documentPath: "projects/demo.tiled-project"
      }
    );

    expect(imported.project).toMatchObject({
      name: "demo",
      assetRoots: ["maps", "tilesets", "templates"],
      compatibilityVersion: "1.12",
      extensionsDirectory: "extensions",
      automappingRulesFile: "rules.txt"
    });

    const snapshot = store.getSnapshot();

    expect(snapshot.workspace.project).toMatchObject({
      name: "demo",
      assetRoots: ["maps", "tilesets", "templates"],
      compatibilityVersion: "1.12",
      extensionsDirectory: "extensions",
      automappingRulesFile: "rules.txt"
    });
    expect(snapshot.workspace.project.propertyTypes).toEqual([
      expect.objectContaining({
        kind: "enum",
        name: "Biome"
      })
    ]);
    expect(snapshot.runtime.issues.entries).toEqual([
      expect.objectContaining({
        documentName: "demo",
        sourceKind: "project",
        code: "project.commands.unsupported",
        path: "project.commands"
      })
    ]);
    expect(snapshot.workspace.session.hasUnsavedChanges).toBe(true);
  });

  it("applies localized naming config to generated maps, layers and objects", () => {
    const store = createEditorStore(
      createEditorWorkspaceState({
        project: createProject({
          name: "示例项目",
          assetRoots: ["maps", "tilesets", "templates"]
        })
      }),
      {
        naming: {
          mapNamePrefix: "地图",
          defaultMapLayerNames: {
            tile: "地面",
            object: "对象"
          },
          layerNamePrefixes: {
            tile: "图块层",
            object: "对象层"
          },
          objectNamePrefix: "对象",
          defaultWangSetName: "未命名集合"
        }
      }
    );

    store.createQuickMapDocument();

    expect(store.getSnapshot().activeMap?.name).toBe("地图-1");
    expect(store.getSnapshot().activeMap?.layers.map((layer) => layer.name)).toEqual([
      "地面",
      "对象"
    ]);

    store.addTileLayer();
    store.addObjectLayer();

    expect(store.getSnapshot().activeMap?.layers.map((layer) => layer.name)).toEqual([
      "地面",
      "对象",
      "图块层 3",
      "对象层 4"
    ]);

    const objectLayer = store
      .getSnapshot()
      .activeMap?.layers.find((layer) => layer.kind === "object" && layer.name === "对象");

    expect(objectLayer?.kind).toBe("object");

    if (!objectLayer || objectLayer.kind !== "object") {
      throw new Error("Expected localized default object layer.");
    }

    store.setActiveLayer(objectLayer.id);
    store.createRectangleObject();

    const nextObjectLayer = store
      .getSnapshot()
      .activeMap?.layers.find((layer) => layer.id === objectLayer.id);

    expect(nextObjectLayer?.kind === "object" ? nextObjectLayer.objects[0]?.name : undefined).toBe(
      "对象 1"
    );

    store.createImageCollectionTileset({
      name: "道具图块集",
      tileWidth: 32,
      tileHeight: 32,
      imageSources: ["/tests/props/prop-1.svg"]
    });
    store.createActiveTilesetWangSet("mixed");

    expect(store.getSnapshot().activeTileset?.wangSets[0]?.name).toBe("未命名集合");
  });

  it("updates active layer details through the controller", () => {
    const store = createTestEditorStore("demo");

    store.updateActiveLayerDetails({
      name: "Foreground",
      className: "collision",
      visible: false,
      locked: true,
      opacity: 0.5,
      offsetX: 12,
      offsetY: -8
    });

    const activeLayer = store.getSnapshot().activeLayer;

    expect(activeLayer).toMatchObject({
      name: "Foreground",
      className: "collision",
      visible: false,
      locked: true,
      opacity: 0.5,
      offsetX: 12,
      offsetY: -8
    });
  });

  it("updates the selected object details through the controller", () => {
    const store = createTestEditorStore("demo");
    const objectLayer = store
      .getSnapshot()
      .activeMap?.layers.find((layer) => layer.kind === "object");

    expect(objectLayer?.kind).toBe("object");

    if (!objectLayer || objectLayer.kind !== "object") {
      throw new Error("Expected object layer.");
    }

    store.setActiveLayer(objectLayer.id);
    store.createRectangleObject();
    store.updateSelectedObjectDetails({
      name: "Spawn Point",
      className: "spawn",
      x: 48,
      y: 64,
      width: 40,
      height: 24,
      rotation: 15,
      visible: false
    });

    const updatedObjectLayer = store
      .getSnapshot()
      .activeMap?.layers.find((layer) => layer.id === objectLayer.id);
    const updatedObject =
      updatedObjectLayer?.kind === "object" ? updatedObjectLayer.objects[0] : undefined;

    expect(updatedObject).toMatchObject({
      name: "Spawn Point",
      className: "spawn",
      x: 48,
      y: 64,
      width: 40,
      height: 24,
      rotation: 15,
      visible: false
    });
  });

  it("creates, updates, and removes Wang sets through the controller", () => {
    const store = createTestEditorStore("demo");
    const activeTileset = store.getSnapshot().activeTileset;

    expect(activeTileset).toBeDefined();

    const wangSetId = store.createActiveTilesetWangSet("mixed", "Core Terrain");

    expect(wangSetId).toBeDefined();

    if (!wangSetId) {
      throw new Error("Expected Wang set to be created.");
    }

    store.updateActiveTilesetWangSet(wangSetId, {
      name: "Road Terrain",
      type: "edge"
    });

    let updatedTileset = store.getSnapshot().activeTileset;

    expect(updatedTileset?.wangSets).toMatchObject([
      {
        id: wangSetId,
        name: "Road Terrain",
        type: "edge"
      }
    ]);

    store.removeActiveTilesetWangSet(wangSetId);
    updatedTileset = store.getSnapshot().activeTileset;

    expect(updatedTileset?.wangSets).toEqual([]);
  });

  it("upserts and removes map, layer, and object custom properties through the controller", () => {
    const store = createTestEditorStore("demo");
    const initialActiveLayerId = store.getSnapshot().activeLayer?.id;
    const objectLayer = store
      .getSnapshot()
      .activeMap?.layers.find((layer) => layer.kind === "object");

    expect(objectLayer?.kind).toBe("object");

    if (!objectLayer || objectLayer.kind !== "object") {
      throw new Error("Expected object layer.");
    }

    store.upsertActiveMapProperty(createProperty("music", "string", "forest"));
    store.upsertActiveLayerProperty(createProperty("collision", "bool", true));
    store.setActiveLayer(objectLayer.id);
    store.createRectangleObject();
    store.upsertSelectedObjectProperty(createProperty("spawnWeight", "int", 2));

    let snapshot = store.getSnapshot();
    let updatedActiveLayer = snapshot.activeMap?.layers.find((layer) => layer.id === initialActiveLayerId);
    let updatedObjectLayer = snapshot.activeMap?.layers.find((layer) => layer.id === objectLayer.id);
    let updatedObject =
      updatedObjectLayer?.kind === "object" ? updatedObjectLayer.objects[0] : undefined;

    expect(snapshot.activeMap?.properties).toEqual([
      createProperty("music", "string", "forest")
    ]);
    expect(updatedActiveLayer).toMatchObject({
      properties: [createProperty("collision", "bool", true)]
    });
    expect(updatedObject?.properties).toEqual([createProperty("spawnWeight", "int", 2)]);

    store.removeActiveMapProperty("music");
    store.removeSelectedObjectProperty("spawnWeight");
    if (initialActiveLayerId) {
      store.setActiveLayer(initialActiveLayerId);
    }
    store.removeActiveLayerProperty("collision");

    snapshot = store.getSnapshot();
    updatedActiveLayer = snapshot.activeMap?.layers.find((layer) => layer.id === initialActiveLayerId);
    updatedObjectLayer = snapshot.activeMap?.layers.find((layer) => layer.id === objectLayer.id);
    updatedObject = updatedObjectLayer?.kind === "object" ? updatedObjectLayer.objects[0] : undefined;

    expect(snapshot.activeMap?.properties).toEqual([]);
    expect(updatedActiveLayer).toMatchObject({
      properties: []
    });
    expect(updatedObject?.properties).toEqual([]);
  });

  it("supports object reference properties through the shared property command chain", () => {
    const store = createTestEditorStore("demo");
    const objectLayer = store
      .getSnapshot()
      .activeMap?.layers.find((layer) => layer.kind === "object");

    expect(objectLayer?.kind).toBe("object");

    if (!objectLayer || objectLayer.kind !== "object") {
      throw new Error("Expected object layer.");
    }

    store.setActiveLayer(objectLayer.id);
    store.createRectangleObject();

    const selectedObject = store
      .getSnapshot()
      .activeMap?.layers.find((layer) => layer.id === objectLayer.id);
    const targetObject =
      selectedObject?.kind === "object" ? selectedObject.objects[0] : undefined;

    expect(targetObject).toBeDefined();

    if (!targetObject) {
      throw new Error("Expected created object.");
    }

    store.upsertActiveMapProperty(
      createProperty("focusObject", "object", { objectId: targetObject.id })
    );

    expect(store.getSnapshot().activeMap?.properties).toEqual([
      createProperty("focusObject", "object", { objectId: targetObject.id })
    ]);
  });

  it("sets viewport zoom directly for status bar controls", () => {
    const store = createTestEditorStore("demo");

    store.setViewportZoom(2);
    expect(store.getSnapshot().bootstrap.viewport.zoom).toBe(2);

    store.setViewportZoom(999);
    expect(store.getSnapshot().bootstrap.viewport.zoom).toBe(8);
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

    const preview = store.getSnapshot().runtime.interactions.canvasPreview;

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

    expect(store.getSnapshot().runtime.interactions.canvasPreview.kind).toBe("none");
    expect(layer?.kind === "tile" ? getTileLayerCell(layer, 5, 5)?.gid : null).toBe(12);
    expect(layer?.kind === "tile" ? getTileLayerCell(layer, 5, 3)?.gid : null).toBe(12);
    expect(layer?.kind === "tile" ? getTileLayerCell(layer, 3, 3)?.gid : null).toBeNull();
  });

  it("clears transient canvas previews when the shape mode changes", () => {
    const store = createTestEditorStore("demo");

    store.setActiveTool("shape-fill");
    store.beginCanvasStroke(2, 2);
    store.updateCanvasStroke(6, 4);

    expect(store.getSnapshot().runtime.interactions.canvasPreview.kind).toBe("shape-fill");

    store.setShapeFillMode("ellipse");

    expect(store.getSnapshot().runtime.interactions.canvasPreview.kind).toBe("none");
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

    const preview = store.getSnapshot().runtime.interactions.canvasPreview;

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

  it("copies, cuts, and pastes tile selections through the clipboard API", () => {
    const store = createTestEditorStore("demo");

    store.setActiveStamp(createSingleTileStamp(31));
    store.handleCanvasPrimaryAction(1, 1);
    store.setActiveStamp(createSingleTileStamp(32));
    store.handleCanvasPrimaryAction(2, 1);

    store.setActiveTool("select");
    store.beginCanvasStroke(1, 1);
    store.updateCanvasStroke(2, 1);
    store.endCanvasStroke();

    store.copySelectedTilesToClipboard();

    expect(store.getSnapshot().runtime.clipboard.kind).toBe("tile");

    store.cutSelectedTilesToClipboard();

    let layer = store
      .getSnapshot()
      .activeMap?.layers.find((entry) => entry.kind === "tile");

    expect(layer?.kind === "tile" ? getTileLayerCell(layer, 1, 1)?.gid : null).toBeNull();
    expect(layer?.kind === "tile" ? getTileLayerCell(layer, 2, 1)?.gid : null).toBeNull();

    store.setActiveTool("select");
    store.beginCanvasStroke(6, 4);
    store.updateCanvasStroke(7, 4);
    store.endCanvasStroke();
    store.pasteClipboardToSelection();

    layer = store.getSnapshot().activeMap?.layers.find((entry) => entry.kind === "tile");

    expect(layer?.kind === "tile" ? getTileLayerCell(layer, 6, 4)?.gid : null).toBe(31);
    expect(layer?.kind === "tile" ? getTileLayerCell(layer, 7, 4)?.gid : null).toBe(32);
  });

  it("creates, selects, cuts, and pastes objects through the object clipboard API", () => {
    const store = createTestEditorStore("demo");
    const objectLayer = store.getSnapshot().activeMap?.layers.find((layer) => layer.kind === "object");

    expect(objectLayer?.kind).toBe("object");

    if (!objectLayer || objectLayer.kind !== "object") {
      return;
    }

    store.setActiveLayer(objectLayer.id);
    store.createRectangleObject();

    let nextObjectLayer = store
      .getSnapshot()
      .activeMap?.layers.find((layer) => layer.id === objectLayer.id);
    const firstObject = nextObjectLayer?.kind === "object" ? nextObjectLayer.objects[0] : undefined;

    expect(firstObject).toMatchObject({
      name: "Object 1",
      shape: "rectangle",
      x: 32,
      y: 32,
      width: 32,
      height: 32
    });
    expect(store.getState().session.selection).toEqual({
      kind: "object",
      objectIds: firstObject ? [firstObject.id] : []
    });

    if (!firstObject) {
      return;
    }

    store.copySelectedObjectsToClipboard();

    expect(store.getSnapshot().runtime.clipboard.kind).toBe("object");

    store.pasteClipboardToActiveObjectLayer();

    nextObjectLayer = store
      .getSnapshot()
      .activeMap?.layers.find((layer) => layer.id === objectLayer.id);
    const objectEntries = nextObjectLayer?.kind === "object" ? nextObjectLayer.objects : [];
    const pastedObject = objectEntries[1];

    expect(objectEntries).toHaveLength(2);
    expect(pastedObject).toMatchObject({
      name: "Object 1",
      shape: "rectangle",
      x: 64,
      y: 64,
      width: 32,
      height: 32
    });

    store.selectObject(firstObject.id);
    store.cutSelectedObjectsToClipboard();

    nextObjectLayer = store
      .getSnapshot()
      .activeMap?.layers.find((layer) => layer.id === objectLayer.id);

    expect(nextObjectLayer?.kind === "object" ? nextObjectLayer.objects : []).toHaveLength(1);
    expect(store.getState().session.selection).toEqual({ kind: "none" });
  });

  it("previews and commits object drag moves as a single undoable command", () => {
    const store = createTestEditorStore("demo");
    const objectLayer = store.getSnapshot().activeMap?.layers.find((layer) => layer.kind === "object");

    expect(objectLayer?.kind).toBe("object");

    if (!objectLayer || objectLayer.kind !== "object") {
      return;
    }

    store.setActiveLayer(objectLayer.id);
    store.createRectangleObject();

    const createdObject = store
      .getSnapshot()
      .activeMap?.layers.find((layer) => layer.id === objectLayer.id);
    const targetObject =
      createdObject?.kind === "object" ? createdObject.objects[0] : undefined;

    expect(targetObject).toBeDefined();

    if (!targetObject) {
      return;
    }

    store.beginObjectMove(targetObject.id, 32, 32);
    store.updateObjectMove(56, 44);

    const preview = store.getSnapshot().runtime.interactions.objectTransformPreview;

    expect(preview.kind).toBe("object-move");
    expect(
      preview.kind === "object-move"
        ? {
            objectIds: preview.objectIds,
            deltaX: preview.deltaX,
            deltaY: preview.deltaY
          }
        : null
    ).toEqual({
      objectIds: [targetObject.id],
      deltaX: 24,
      deltaY: 12
    });

    store.endObjectMove();

    const movedObject = store
      .getSnapshot()
      .activeMap?.layers.find((layer) => layer.id === objectLayer.id);
    const committedObject =
      movedObject?.kind === "object" ? movedObject.objects[0] : undefined;

    expect(store.getSnapshot().runtime.interactions.objectTransformPreview.kind).toBe("none");
    expect(committedObject).toMatchObject({
      id: targetObject.id,
      x: 56,
      y: 44,
      width: 32,
      height: 32
    });

    store.undo();

    const revertedObject = store
      .getSnapshot()
      .activeMap?.layers.find((layer) => layer.id === objectLayer.id);

    expect(revertedObject?.kind === "object" ? revertedObject.objects[0] : undefined).toMatchObject({
      id: targetObject.id,
      x: 32,
      y: 32,
      width: 32,
      height: 32
    });
  });

  it("snaps object drag moves to the tile grid when requested", () => {
    const store = createTestEditorStore("demo");
    const objectLayer = store.getSnapshot().activeMap?.layers.find((layer) => layer.kind === "object");

    expect(objectLayer?.kind).toBe("object");

    if (!objectLayer || objectLayer.kind !== "object") {
      return;
    }

    store.setActiveLayer(objectLayer.id);
    store.createRectangleObject();

    const createdObject = store
      .getSnapshot()
      .activeMap?.layers.find((layer) => layer.id === objectLayer.id);
    const targetObject =
      createdObject?.kind === "object" ? createdObject.objects[0] : undefined;

    expect(targetObject).toBeDefined();

    if (!targetObject) {
      return;
    }

    store.beginObjectMove(targetObject.id, 32, 32);
    store.updateObjectMove(50, 49, {
      snapToGrid: true
    });

    const preview = store.getSnapshot().runtime.interactions.objectTransformPreview;

    expect(preview.kind).toBe("object-move");
    expect(
      preview.kind === "object-move"
        ? {
            deltaX: preview.deltaX,
            deltaY: preview.deltaY,
            modifiers: preview.modifiers
          }
        : null
    ).toEqual({
      deltaX: 32,
      deltaY: 32,
      modifiers: {
        snapToGrid: true
      }
    });

    store.endObjectMove();

    const snappedObject = store
      .getSnapshot()
      .activeMap?.layers.find((layer) => layer.id === objectLayer.id);

    expect(snappedObject?.kind === "object" ? snappedObject.objects[0] : undefined).toMatchObject({
      id: targetObject.id,
      x: 64,
      y: 64,
      width: 32,
      height: 32
    });
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
      className: "TerrainSlope",
      probability: 0.25
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
      className: "TerrainSlope",
      probability: 0.25
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

  it("updates selected tile animation frames through the controller", () => {
    const store = createTestEditorStore("demo");
    const firstTilesetId = store.getState().tilesets[0]!.id;
    const frames: TileAnimationFrame[] = [
      { tileId: 1, durationMs: 100 },
      { tileId: 4, durationMs: 220 }
    ];

    store.setActiveTileset(firstTilesetId);
    store.selectStampTile(firstTilesetId, 3);
    store.updateSelectedTileAnimation(frames);

    const snapshot = store.getSnapshot();

    expect(snapshot.workspace.session.activeTilesetTileLocalId).toBe(3);
    expect(snapshot.activeTileset?.tiles[3]?.animation).toEqual(frames);
  });

  it("edits collision objects on the selected tile through the controller", () => {
    const store = createTestEditorStore("demo");
    const firstTilesetId = store.getState().tilesets[0]!.id;

    store.setActiveTileset(firstTilesetId);
    store.selectStampTile(firstTilesetId, 2);

    const objectId = store.createSelectedTileCollisionObject("rectangle");

    expect(objectId).toBeDefined();

    if (!objectId) {
      throw new Error("Expected collision object to be created.");
    }

    store.updateSelectedTileCollisionObjectDetails(objectId, {
      name: "Hitbox",
      x: 6,
      y: 8,
      width: 18,
      height: 12
    });
    store.upsertSelectedTileCollisionObjectProperty(
      objectId,
      createProperty("kind", "string", "solid")
    );
    store.moveSelectedTileCollisionObjects([objectId], 4, -2);
    store.reorderSelectedTileCollisionObjects([objectId], "down");
    store.removeSelectedTileCollisionObjectProperty(objectId, "kind");

    let snapshot = store.getSnapshot();
    let collisionObject = snapshot.activeTileset?.tiles[2]?.collisionLayer?.objects.find(
      (object) => object.id === objectId
    );

    expect(collisionObject).toMatchObject({
      name: "Hitbox",
      x: 10,
      y: 6,
      width: 18,
      height: 12,
      properties: []
    });

    store.removeSelectedTileCollisionObjects([objectId]);

    snapshot = store.getSnapshot();
    collisionObject = snapshot.activeTileset?.tiles[2]?.collisionLayer?.objects.find(
      (object) => object.id === objectId
    );

    expect(collisionObject).toBeUndefined();
  });
});
