import { describe, expect, it } from "vitest";

import { CommandHistory } from "@pixel-editor/command-engine";
import { createProject, createProperty, getTileLayerCell } from "@pixel-editor/domain";
import {
  createSingleTileStamp,
  createEditorWorkspaceState,
  getTileStampPrimaryGid
} from "@pixel-editor/editor-state";

import {
  addLayerCommand,
  captureTileSelectionStampCommand,
  clearTileSelectionCommand,
  createTileStampFromSelection,
  createMapDocumentCommand,
  moveLayerCommand,
  paintTileAtCommand,
  pasteTileClipboardCommand,
  paintTileStampCommand,
  paintTileStrokeCommand,
  removeLayerCommand,
  removeLayerPropertyCommand,
  removeMapPropertyCommand,
  selectTileRegionCommand,
  setActiveStampCommand,
  setViewportZoomCommand,
  toggleHighlightCurrentLayerCommand,
  toggleGridCommand,
  toggleOtherLayersLockCommand,
  toggleOtherLayersVisibilityCommand,
  upsertLayerPropertyCommand,
  upsertMapPropertyCommand,
  updateLayerDetailsCommand,
  updateMapDetailsCommand,
  zoomViewportCommand
} from "./index";

describe("map commands", () => {
  it("creates a default map with tile and object layers", () => {
    const workspace = createEditorWorkspaceState({
      project: createProject({
        name: "demo",
        assetRoots: ["maps"]
      })
    });
    const history = new CommandHistory(workspace);

    history.execute(
      createMapDocumentCommand({
        name: "map-1",
        orientation: "orthogonal",
        width: 20,
        height: 12,
        tileWidth: 32,
        tileHeight: 32
      })
    );

    expect(history.state.maps).toHaveLength(1);
    expect(history.state.maps[0]?.layers.map((layer) => layer.kind)).toEqual([
      "tile",
      "object"
    ]);
    expect(history.state.session.activeMapId).toBe(history.state.maps[0]?.id);
  });

  it("updates viewport grid and zoom commands", () => {
    const workspace = createEditorWorkspaceState({
      project: createProject({
        name: "demo",
        assetRoots: ["maps"]
      })
    });
    const history = new CommandHistory(workspace);

    history.execute(toggleGridCommand());
    history.execute(zoomViewportCommand("in"));
    history.execute(setViewportZoomCommand(2));

    expect(history.state.session.viewport.showGrid).toBe(false);
    expect(history.state.session.viewport.zoom).toBe(2);
  });

  it("toggles current layer highlighting in session state", () => {
    const workspace = createEditorWorkspaceState({
      project: createProject({
        name: "demo",
        assetRoots: ["maps"]
      })
    });
    const history = new CommandHistory(workspace);

    history.execute(toggleHighlightCurrentLayerCommand());

    expect(history.state.session.highlightCurrentLayer).toBe(false);
  });

  it("updates map details and manages layer order", () => {
    const workspace = createEditorWorkspaceState({
      project: createProject({
        name: "demo",
        assetRoots: ["maps"]
      })
    });
    const history = new CommandHistory(workspace);

    history.execute(
      createMapDocumentCommand({
        name: "map-1",
        orientation: "orthogonal",
        width: 20,
        height: 12,
        tileWidth: 32,
        tileHeight: 32
      })
    );

    const mapId = history.state.maps[0]!.id;
    const originalFirstLayerId = history.state.maps[0]!.layers[0]!.id;

    history.execute(
      updateMapDetailsCommand(mapId, {
        width: 24,
        height: 18,
        tileWidth: 16,
        tileHeight: 16,
        renderOrder: "left-down"
      })
    );
    history.execute(addLayerCommand(mapId, "tile", "Decor"));
    history.execute(moveLayerCommand(mapId, originalFirstLayerId, "down"));
    history.execute(removeLayerCommand(mapId, history.state.maps[0]!.layers[2]!.id));

    expect(history.state.maps[0]?.settings.width).toBe(24);
    expect(history.state.maps[0]?.settings.tileWidth).toBe(16);
    expect(history.state.maps[0]?.layers.map((layer) => layer.name)).toEqual([
      "Objects",
      "Ground"
    ]);
  });

  it("adds image and group layers through the map command API", () => {
    const workspace = createEditorWorkspaceState({
      project: createProject({
        name: "demo",
        assetRoots: ["maps"]
      })
    });
    const history = new CommandHistory(workspace);

    history.execute(
      createMapDocumentCommand({
        name: "map-1",
        orientation: "orthogonal",
        width: 20,
        height: 12,
        tileWidth: 32,
        tileHeight: 32
      })
    );

    const mapId = history.state.maps[0]!.id;

    history.execute(addLayerCommand(mapId, "image", "Backdrop"));
    history.execute(addLayerCommand(mapId, "group", "Gameplay"));

    expect(history.state.maps[0]?.layers.slice(-2)).toMatchObject([
      {
        kind: "image",
        name: "Backdrop",
        imagePath: ""
      },
      {
        kind: "group",
        name: "Gameplay",
        layers: []
      }
    ]);
    expect(history.state.session.activeLayerId).toBe(history.state.maps[0]?.layers.at(-1)?.id);
  });

  it("updates active layer details", () => {
    const workspace = createEditorWorkspaceState({
      project: createProject({
        name: "demo",
        assetRoots: ["maps"]
      })
    });
    const history = new CommandHistory(workspace);

    history.execute(
      createMapDocumentCommand({
        name: "map-1",
        orientation: "orthogonal",
        width: 20,
        height: 12,
        tileWidth: 32,
        tileHeight: 32
      })
    );

    const mapId = history.state.maps[0]!.id;
    const layerId = history.state.maps[0]!.layers[0]!.id;

    history.execute(
      updateLayerDetailsCommand(mapId, layerId, {
        name: "Foreground",
        className: "collision",
        visible: false,
        locked: true,
        opacity: 0.4,
        offsetX: 10,
        offsetY: -6
      })
    );

    expect(history.state.maps[0]?.layers[0]).toMatchObject({
      name: "Foreground",
      className: "collision",
      visible: false,
      locked: true,
      opacity: 0.4,
      offsetX: 10,
      offsetY: -6
    });
  });

  it("toggles visibility and lock state for other layers", () => {
    const workspace = createEditorWorkspaceState({
      project: createProject({
        name: "demo",
        assetRoots: ["maps"]
      })
    });
    const history = new CommandHistory(workspace);

    history.execute(
      createMapDocumentCommand({
        name: "map-1",
        orientation: "orthogonal",
        width: 20,
        height: 12,
        tileWidth: 32,
        tileHeight: 32
      })
    );

    const mapId = history.state.maps[0]!.id;
    const activeLayerId = history.state.maps[0]!.layers[0]!.id;

    history.execute(addLayerCommand(mapId, "tile", "Decor"));
    history.execute(toggleOtherLayersVisibilityCommand(mapId, activeLayerId));
    history.execute(toggleOtherLayersLockCommand(mapId, activeLayerId));

    expect(
      history.state.maps[0]?.layers
        .filter((layer) => layer.id !== activeLayerId)
        .map((layer) => ({ visible: layer.visible, locked: layer.locked }))
    ).toEqual([
      { visible: false, locked: true },
      { visible: false, locked: true }
    ]);

    history.execute(toggleOtherLayersVisibilityCommand(mapId, activeLayerId));
    history.execute(toggleOtherLayersLockCommand(mapId, activeLayerId));

    expect(
      history.state.maps[0]?.layers
        .filter((layer) => layer.id !== activeLayerId)
        .map((layer) => ({ visible: layer.visible, locked: layer.locked }))
    ).toEqual([
      { visible: true, locked: false },
      { visible: true, locked: false }
    ]);
  });

  it("upserts and removes map and layer custom properties", () => {
    const workspace = createEditorWorkspaceState({
      project: createProject({
        name: "demo",
        assetRoots: ["maps"]
      })
    });
    const history = new CommandHistory(workspace);

    history.execute(
      createMapDocumentCommand({
        name: "map-1",
        orientation: "orthogonal",
        width: 20,
        height: 12,
        tileWidth: 32,
        tileHeight: 32
      })
    );

    const mapId = history.state.maps[0]!.id;
    const layerId = history.state.maps[0]!.layers[0]!.id;

    history.execute(upsertMapPropertyCommand(mapId, createProperty("music", "string", "forest")));
    history.execute(
      upsertLayerPropertyCommand(mapId, layerId, createProperty("collision", "bool", true))
    );
    history.execute(
      upsertLayerPropertyCommand(
        mapId,
        layerId,
        createProperty("solid", "bool", false),
        "collision"
      )
    );

    expect(history.state.maps[0]?.properties).toEqual([
      createProperty("music", "string", "forest")
    ]);
    expect(history.state.maps[0]?.layers[0]?.properties).toEqual([
      createProperty("solid", "bool", false)
    ]);

    history.execute(removeMapPropertyCommand(mapId, "music"));
    history.execute(removeLayerPropertyCommand(mapId, layerId, "solid"));

    expect(history.state.maps[0]?.properties).toEqual([]);
    expect(history.state.maps[0]?.layers[0]?.properties).toEqual([]);
  });

  it("sets the active stamp and paints tile selections", () => {
    const workspace = createEditorWorkspaceState({
      project: createProject({
        name: "demo",
        assetRoots: ["maps"]
      })
    });
    const history = new CommandHistory(workspace);

    history.execute(
      createMapDocumentCommand({
        name: "map-1",
        orientation: "orthogonal",
        width: 20,
        height: 12,
        tileWidth: 32,
        tileHeight: 32
      })
    );

    const map = history.state.maps[0]!;
    const tileLayer = map.layers.find((layer) => layer.kind === "tile");

    history.execute(setActiveStampCommand(createSingleTileStamp(7)));
    history.execute(paintTileAtCommand(map.id, tileLayer!.id, 4, 5, 7));

    expect(getTileStampPrimaryGid(history.state.session.activeStamp)).toBe(7);
    expect(history.state.session.selection).toEqual({
      kind: "tile",
      coordinates: [{ x: 4, y: 5 }]
    });
    expect(
      history.state.maps[0]?.layers[0]?.kind === "tile"
        ? getTileLayerCell(history.state.maps[0].layers[0], 4, 5)?.gid
        : null
    ).toBe(7);
  });

  it("groups multi-tile strokes into one history entry", () => {
    const workspace = createEditorWorkspaceState({
      project: createProject({
        name: "demo",
        assetRoots: ["maps"]
      })
    });
    const history = new CommandHistory(workspace);

    history.execute(
      createMapDocumentCommand({
        name: "map-1",
        orientation: "orthogonal",
        width: 20,
        height: 12,
        tileWidth: 32,
        tileHeight: 32
      })
    );

    const map = history.state.maps[0]!;
    const tileLayer = map.layers.find((layer) => layer.kind === "tile");

    history.execute(
      paintTileStrokeCommand(map.id, tileLayer!.id, [
        { x: 1, y: 1, gid: 5 },
        { x: 2, y: 1, gid: 5 },
        { x: 3, y: 1, gid: 5 }
      ])
    );

    expect(history.past).toHaveLength(2);
    expect(
      history.state.maps[0]?.layers[0]?.kind === "tile"
        ? getTileLayerCell(history.state.maps[0].layers[0], 1, 1)?.gid
        : null
    ).toBe(5);
    expect(
      history.state.maps[0]?.layers[0]?.kind === "tile"
        ? getTileLayerCell(history.state.maps[0].layers[0], 3, 1)?.gid
        : null
    ).toBe(5);
    expect(history.state.session.selection).toEqual({
      kind: "tile",
      coordinates: [{ x: 3, y: 1 }]
    });
  });

  it("captures a tile selection as a pattern stamp and reuses it for painting", () => {
    const workspace = createEditorWorkspaceState({
      project: createProject({
        name: "demo",
        assetRoots: ["maps"]
      })
    });
    const history = new CommandHistory(workspace);

    history.execute(
      createMapDocumentCommand({
        name: "map-1",
        orientation: "orthogonal",
        width: 12,
        height: 12,
        tileWidth: 32,
        tileHeight: 32
      })
    );

    const map = history.state.maps[0]!;
    const tileLayer = map.layers.find((layer) => layer.kind === "tile")!;

    history.execute(paintTileAtCommand(map.id, tileLayer.id, 1, 1, 3));
    history.execute(paintTileAtCommand(map.id, tileLayer.id, 2, 1, 4));
    history.execute(selectTileRegionCommand(1, 1, 2, 1));
    const currentTileLayer = history.state.maps[0]!.layers.find((layer) => layer.kind === "tile")!;
    history.execute(
      captureTileSelectionStampCommand(currentTileLayer, history.state.session.selection)
    );

    expect(history.state.session.activeStamp.kind).toBe("pattern");
    expect(getTileStampPrimaryGid(history.state.session.activeStamp)).toBe(3);

    history.execute(
      paintTileStampCommand(map.id, tileLayer.id, 5, 5, history.state.session.activeStamp)
    );

    const nextLayer = history.state.maps[0]!.layers[0];

    expect(
      nextLayer?.kind === "tile" ? getTileLayerCell(nextLayer, 5, 5)?.gid : null
    ).toBe(3);
    expect(
      nextLayer?.kind === "tile" ? getTileLayerCell(nextLayer, 6, 5)?.gid : null
    ).toBe(4);
  });

  it("cuts and pastes selected tile regions through explicit clipboard commands", () => {
    const workspace = createEditorWorkspaceState({
      project: createProject({
        name: "demo",
        assetRoots: ["maps"]
      })
    });
    const history = new CommandHistory(workspace);

    history.execute(
      createMapDocumentCommand({
        name: "map-1",
        orientation: "orthogonal",
        width: 12,
        height: 12,
        tileWidth: 32,
        tileHeight: 32
      })
    );

    const map = history.state.maps[0]!;
    const tileLayer = map.layers.find((layer) => layer.kind === "tile")!;

    history.execute(paintTileAtCommand(map.id, tileLayer.id, 1, 1, 7));
    history.execute(paintTileAtCommand(map.id, tileLayer.id, 2, 1, 8));
    history.execute(selectTileRegionCommand(1, 1, 2, 1));

    const currentTileLayer = history.state.maps[0]!.layers.find((layer) => layer.kind === "tile")!;
    const stamp = createTileStampFromSelection(currentTileLayer, history.state.session.selection)!;

    history.execute(clearTileSelectionCommand(map.id, tileLayer.id, history.state.session.selection));

    let nextLayer = history.state.maps[0]!.layers[0];

    expect(
      nextLayer?.kind === "tile" ? getTileLayerCell(nextLayer, 1, 1)?.gid : null
    ).toBeNull();
    expect(
      nextLayer?.kind === "tile" ? getTileLayerCell(nextLayer, 2, 1)?.gid : null
    ).toBeNull();

    history.execute(pasteTileClipboardCommand(map.id, tileLayer.id, 5, 4, stamp));

    nextLayer = history.state.maps[0]!.layers[0];

    expect(
      nextLayer?.kind === "tile" ? getTileLayerCell(nextLayer, 5, 4)?.gid : null
    ).toBe(7);
    expect(
      nextLayer?.kind === "tile" ? getTileLayerCell(nextLayer, 6, 4)?.gid : null
    ).toBe(8);
  });

});
