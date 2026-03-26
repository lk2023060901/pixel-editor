import { describe, expect, it } from "vitest";

import { CommandHistory } from "@pixel-editor/command-engine";
import {
  createMapObject,
  createObjectTemplate,
  createProperty,
  createProject,
  createTileDefinition,
  createTileset,
  getMapGlobalTileGid
} from "@pixel-editor/domain";
import { createEditorWorkspaceState } from "@pixel-editor/editor-state";
import { createMapDocumentCommand } from "@pixel-editor/map";

import {
  addObjectCommand,
  detachTemplateInstancesCommand,
  moveObjectsCommand,
  pasteObjectClipboardCommand,
  replaceObjectsWithTemplateCommand,
  resetTemplateInstancesCommand,
  removeObjectPropertyCommand,
  removeSelectedObjectsCommand,
  selectObjectCommand,
  upsertObjectPropertyCommand,
  updateObjectDetailsCommand
} from "../src/index";

describe("object commands", () => {
  it("adds, selects, pastes, and removes objects through object-specific commands", () => {
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
    const objectLayer = map.layers.find((layer) => layer.kind === "object")!;
    const object = createMapObject({
      name: "Object 1",
      shape: "rectangle",
      x: 32,
      y: 64,
      width: 32,
      height: 16
    });

    history.execute(addObjectCommand(map.id, objectLayer.id, object));
    history.execute(selectObjectCommand(object.id));

    const afterAddLayer = history.state.maps[0]!.layers.find((layer) => layer.kind === "object");

    expect(afterAddLayer?.kind === "object" ? afterAddLayer.objects : []).toHaveLength(1);
    expect(history.state.session.selection).toEqual({
      kind: "object",
      objectIds: [object.id]
    });

    history.execute(
      pasteObjectClipboardCommand(map.id, objectLayer.id, 64, 96, [object], {
        x: 32,
        y: 64,
        width: 32,
        height: 16
      })
    );

    const afterPasteLayer = history.state.maps[0]!.layers.find((layer) => layer.kind === "object");

    expect(afterPasteLayer?.kind === "object" ? afterPasteLayer.objects : []).toHaveLength(2);
    expect(
      afterPasteLayer?.kind === "object" ? afterPasteLayer.objects[1] : undefined
    ).toMatchObject({
      x: 64,
      y: 96,
      width: 32,
      height: 16
    });

    history.execute(moveObjectsCommand(map.id, objectLayer.id, [object.id], 16, -8));

    const afterMoveLayer = history.state.maps[0]!.layers.find((layer) => layer.kind === "object");

    expect(afterMoveLayer?.kind === "object" ? afterMoveLayer.objects[0] : undefined).toMatchObject({
      x: 48,
      y: 56,
      width: 32,
      height: 16
    });

    history.execute(
      removeSelectedObjectsCommand(map.id, objectLayer.id, history.state.session.selection)
    );

    const afterRemoveLayer = history.state.maps[0]!.layers.find((layer) => layer.kind === "object");

    expect(afterRemoveLayer?.kind === "object" ? afterRemoveLayer.objects : []).toHaveLength(1);
    expect(history.state.session.selection).toEqual({ kind: "none" });
  });

  it("updates object details without replacing the object identity", () => {
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
    const objectLayer = map.layers.find((layer) => layer.kind === "object")!;
    const object = createMapObject({
      name: "Object 1",
      shape: "rectangle",
      x: 32,
      y: 64,
      width: 32,
      height: 16
    });

    history.execute(addObjectCommand(map.id, objectLayer.id, object));
    history.execute(
      updateObjectDetailsCommand(map.id, objectLayer.id, object.id, {
        name: "Spawn Point",
        className: "spawn",
        x: 48,
        y: 80,
        width: 40,
        height: 20,
        rotation: 15,
        visible: false
      })
    );

    const updatedLayer = history.state.maps[0]!.layers.find((layer) => layer.kind === "object");
    const updatedObject =
      updatedLayer?.kind === "object" ? updatedLayer.objects[0] : undefined;

    expect(updatedObject).toMatchObject({
      id: object.id,
      name: "Spawn Point",
      className: "spawn",
      x: 48,
      y: 80,
      width: 40,
      height: 20,
      rotation: 15,
      visible: false
    });
  });

  it("upserts and removes custom properties on the selected object", () => {
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
    const objectLayer = map.layers.find((layer) => layer.kind === "object")!;
    const object = createMapObject({
      name: "Object 1",
      shape: "rectangle",
      x: 32,
      y: 64,
      width: 32,
      height: 16
    });

    history.execute(addObjectCommand(map.id, objectLayer.id, object));
    history.execute(
      upsertObjectPropertyCommand(
        map.id,
        objectLayer.id,
        object.id,
        createProperty("spawnWeight", "int", 2)
      )
    );
    history.execute(
      upsertObjectPropertyCommand(
        map.id,
        objectLayer.id,
        object.id,
        createProperty("spawnTier", "int", 3),
        "spawnWeight"
      )
    );

    const withPropertyLayer = history.state.maps[0]!.layers.find((layer) => layer.kind === "object");
    expect(withPropertyLayer?.kind === "object" ? withPropertyLayer.objects[0]?.properties : []).toEqual([
      createProperty("spawnTier", "int", 3)
    ]);

    history.execute(removeObjectPropertyCommand(map.id, objectLayer.id, object.id, "spawnTier"));

    const withoutPropertyLayer = history.state.maps[0]!.layers.find((layer) => layer.kind === "object");
    expect(
      withoutPropertyLayer?.kind === "object" ? withoutPropertyLayer.objects[0]?.properties : []
    ).toEqual([]);
  });

  it("replaces selected objects with template instances while preserving object ids and positions", () => {
    const propsTileset = {
      ...createTileset({
        name: "Props",
        kind: "image-collection",
        tileWidth: 32,
        tileHeight: 32
      }),
      tiles: [createTileDefinition(0)]
    };
    const workspace = createEditorWorkspaceState({
      project: createProject({
        name: "demo",
        assetRoots: ["maps", "tilesets", "templates"]
      }),
      tilesets: [propsTileset]
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
    const objectLayer = map.layers.find((layer) => layer.kind === "object")!;
    const object = createMapObject({
      name: "Spawn",
      shape: "rectangle",
      x: 32,
      y: 64,
      width: 16,
      height: 24
    });
    const template = createObjectTemplate(
      "Torch Template",
      createMapObject({
        name: "Torch",
        className: "Decoration",
        shape: "tile",
        x: 0,
        y: 0,
        width: 32,
        height: 32,
        properties: [createProperty("kind", "string", "torch")],
        tile: {
          tilesetId: propsTileset.id,
          tileId: 0,
          gid: 1
        }
      }),
      [propsTileset.id]
    );
    const expectedGid = getMapGlobalTileGid(
      {
        ...map,
        tilesetIds: [...map.tilesetIds, propsTileset.id]
      },
      history.state.tilesets,
      propsTileset.id,
      0
    );

    expect(expectedGid).toBeDefined();

    history.execute(addObjectCommand(map.id, objectLayer.id, object));
    history.execute(
      replaceObjectsWithTemplateCommand({
        mapId: map.id,
        layerId: objectLayer.id,
        objectIds: [object.id],
        template,
        templateObject: {
          ...template.object,
          tile: {
            ...template.object.tile,
            gid: expectedGid!
          }
        },
        attachTilesetId: propsTileset.id
      })
    );

    const replacedLayer = history.state.maps[0]!.layers.find((layer) => layer.kind === "object");
    const replacedObject =
      replacedLayer?.kind === "object" ? replacedLayer.objects[0] : undefined;

    expect(history.state.maps[0]?.tilesetIds).toContain(propsTileset.id);
    expect(replacedObject).toMatchObject({
      id: object.id,
      name: "Torch",
      className: "Decoration",
      x: 32,
      y: 64,
      width: 32,
      height: 32,
      templateId: template.id,
      properties: [createProperty("kind", "string", "torch")],
      tile: {
        tilesetId: propsTileset.id,
        tileId: 0,
        gid: expectedGid!
      }
    });
  });

  it("resets template instances back to their template state while preserving ids and positions", () => {
    const workspace = createEditorWorkspaceState({
      project: createProject({
        name: "demo",
        assetRoots: ["maps", "templates"]
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
    const objectLayer = map.layers.find((layer) => layer.kind === "object")!;
    const template = createObjectTemplate(
      "Marker Template",
      createMapObject({
        name: "Marker",
        className: "Encounter",
        shape: "ellipse",
        width: 24,
        height: 24,
        rotation: 15,
        visible: false,
        properties: [createProperty("facing", "string", "north")]
      })
    );
    const instance = createMapObject({
      name: "Changed Marker",
      className: "Override",
      shape: "rectangle",
      x: 96,
      y: 128,
      width: 12,
      height: 40,
      rotation: 45,
      properties: [createProperty("facing", "string", "south")],
      templateId: template.id
    });

    history.execute(addObjectCommand(map.id, objectLayer.id, instance));
    history.execute(
      resetTemplateInstancesCommand({
        mapId: map.id,
        layerId: objectLayer.id,
        replacements: [
          {
            objectId: instance.id,
            templateId: template.id,
            templateObject: template.object
          }
        ]
      })
    );

    const resetLayer = history.state.maps[0]!.layers.find((layer) => layer.kind === "object");
    const resetObject = resetLayer?.kind === "object" ? resetLayer.objects[0] : undefined;

    expect(resetObject).toMatchObject({
      id: instance.id,
      name: "Marker",
      className: "Encounter",
      shape: "ellipse",
      x: 96,
      y: 128,
      width: 24,
      height: 24,
      rotation: 15,
      visible: false,
      templateId: template.id,
      properties: [createProperty("facing", "string", "north")]
    });
  });

  it("detaches template instances while preserving the current object state", () => {
    const workspace = createEditorWorkspaceState({
      project: createProject({
        name: "demo",
        assetRoots: ["maps", "templates"]
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
    const objectLayer = map.layers.find((layer) => layer.kind === "object")!;
    const template = createObjectTemplate(
      "Torch Template",
      createMapObject({
        name: "Torch",
        className: "Decoration",
        shape: "tile",
        width: 32,
        height: 32,
        properties: [createProperty("kind", "string", "torch")]
      })
    );
    const instance = createMapObject({
      name: "Torch",
      className: "Decoration",
      shape: "tile",
      x: 64,
      y: 96,
      width: 32,
      height: 32,
      properties: [createProperty("kind", "string", "torch")],
      templateId: template.id
    });

    history.execute(addObjectCommand(map.id, objectLayer.id, instance));
    history.execute(
      detachTemplateInstancesCommand({
        mapId: map.id,
        layerId: objectLayer.id,
        objectIds: [instance.id]
      })
    );

    const detachedLayer = history.state.maps[0]!.layers.find((layer) => layer.kind === "object");
    const detachedObject =
      detachedLayer?.kind === "object" ? detachedLayer.objects[0] : undefined;

    expect(detachedObject).toMatchObject({
      id: instance.id,
      name: "Torch",
      className: "Decoration",
      shape: "tile",
      x: 64,
      y: 96,
      width: 32,
      height: 32,
      properties: [createProperty("kind", "string", "torch")]
    });
    expect(detachedObject?.templateId).toBeUndefined();
  });
});
