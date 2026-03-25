import { describe, expect, it } from "vitest";

import { CommandHistory } from "@pixel-editor/command-engine";
import {
  createMapObject,
  createProperty,
  createTileDefinition,
  createTileset,
  createProject,
  type TileAnimationFrame,
  type EditorMap
} from "@pixel-editor/domain";
import {
  createEditorWorkspaceState,
  getTileStampPrimaryGid
} from "@pixel-editor/editor-state";

import {
  createImageCollectionTilesetCommand,
  createImageTilesetCommand,
  createTilesetTileCollisionObjectCommand,
  moveTilesetTileCollisionObjectsCommand,
  removeTilesetTileCollisionObjectPropertyCommand,
  removeTilesetTileCollisionObjectsCommand,
  removeTilesetTilePropertyCommand,
  reorderTilesetTileCollisionObjectsCommand,
  selectTilesetStampCommand,
  setActiveTilesetCommand,
  updateTilesetTileCollisionObjectCommand,
  updateTilesetTileAnimationCommand,
  updateTilesetDetailsCommand,
  updateTilesetTileMetadataCommand,
  upsertTilesetTileCollisionObjectPropertyCommand,
  upsertTilesetTilePropertyCommand
} from "./index";

describe("tileset commands", () => {
  it("sets the active tileset", () => {
    const tileset = {
      ...createTileset({
        name: "terrain",
        kind: "image-collection",
        tileWidth: 32,
        tileHeight: 32
      }),
      tiles: [createTileDefinition(0)]
    };
    const history = new CommandHistory(
      createEditorWorkspaceState({
        project: createProject({
          name: "demo",
          assetRoots: ["maps", "tilesets"]
        }),
        tilesets: [tileset]
      })
    );

    history.execute(setActiveTilesetCommand(tileset.id));

    expect(history.state.session.activeTilesetId).toBe(tileset.id);
    expect(history.state.session.activeTilesetTileLocalId).toBe(0);
  });

  it("selects a tileset stamp and switches to stamp tool", () => {
    const map = {
      id: "map_demo" as EditorMap["id"],
      kind: "map",
      name: "demo",
      settings: {
        orientation: "orthogonal",
        width: 8,
        height: 8,
        tileWidth: 32,
        tileHeight: 32,
        infinite: false,
        renderOrder: "right-down",
        compressionLevel: -1,
        parallaxOriginX: 0,
        parallaxOriginY: 0
      },
      layers: [],
      tilesetIds: [],
      properties: [],
      nextLayerOrder: 1,
      nextObjectId: 1
    } satisfies EditorMap;
    const tileset = {
      ...createTileset({
        name: "terrain",
        kind: "image-collection",
        tileWidth: 32,
        tileHeight: 32
      }),
      tiles: [createTileDefinition(0), createTileDefinition(1)]
    };
    const history = new CommandHistory(
      createEditorWorkspaceState({
        project: createProject({
          name: "demo",
          assetRoots: ["maps", "tilesets"]
        }),
        maps: [
          {
            ...map,
            tilesetIds: [tileset.id]
          }
        ],
        tilesets: [tileset]
      })
    );

    history.execute(selectTilesetStampCommand(tileset.id, 1));

    expect(history.state.session.activeTilesetId).toBe(tileset.id);
    expect(history.state.session.activeTilesetTileLocalId).toBe(1);
    expect(getTileStampPrimaryGid(history.state.session.activeStamp)).toBe(2);
    expect(history.state.session.activeTool).toBe("stamp");
  });

  it("creates tilesets and attaches them to the active map", () => {
    const map = {
      id: "map_demo" as EditorMap["id"],
      kind: "map",
      name: "demo",
      settings: {
        orientation: "orthogonal",
        width: 8,
        height: 8,
        tileWidth: 32,
        tileHeight: 32,
        infinite: false,
        renderOrder: "right-down",
        compressionLevel: -1,
        parallaxOriginX: 0,
        parallaxOriginY: 0
      },
      layers: [],
      tilesetIds: [],
      properties: [],
      nextLayerOrder: 1,
      nextObjectId: 1
    } satisfies EditorMap;
    const history = new CommandHistory(
      createEditorWorkspaceState({
        project: createProject({
          name: "demo",
          assetRoots: ["maps", "tilesets"]
        }),
        maps: [map],
        session: {
          activeMapId: map.id
        }
      })
    );

    history.execute(
      createImageTilesetCommand({
        mapId: map.id,
        tileset: {
          name: "terrain",
          tileWidth: 32,
          tileHeight: 32,
          imagePath: "/demo/terrain-core.svg",
          imageWidth: 192,
          imageHeight: 128,
          columns: 6
        }
      })
    );
    history.execute(
      createImageCollectionTilesetCommand({
        mapId: map.id,
        tileset: {
          name: "props",
          tileWidth: 32,
          tileHeight: 32,
          imageSources: ["/demo/props/prop-1.svg", "/demo/props/prop-2.svg"]
        }
      })
    );

    expect(history.state.tilesets).toHaveLength(2);
    expect(history.state.maps[0]?.tilesetIds).toHaveLength(2);
    expect(history.state.session.activeTilesetId).toBe(history.state.tilesets[1]?.id);
    expect(history.state.session.activeTilesetTileLocalId).toBe(0);
  });

  it("updates tileset details and selected tile metadata", () => {
    const tileset = {
      ...createTileset({
        name: "terrain",
        kind: "image",
        tileWidth: 32,
        tileHeight: 32,
        source: {
          imagePath: "/demo/terrain-core.svg",
          imageWidth: 192,
          imageHeight: 128,
          margin: 0,
          spacing: 0,
          columns: 6
        }
      }),
      tiles: Array.from({ length: 24 }, (_, localId) => createTileDefinition(localId))
    };
    const history = new CommandHistory(
      createEditorWorkspaceState({
        project: createProject({
          name: "demo",
          assetRoots: ["maps", "tilesets"]
        }),
        tilesets: [tileset]
      })
    );

    history.execute(
      updateTilesetDetailsCommand(tileset.id, {
        tileOffsetX: 4,
        tileOffsetY: -6,
        objectAlignment: "bottom",
        tileRenderSize: "grid",
        spacing: 2
      })
    );
    history.execute(
      updateTilesetTileMetadataCommand(tileset.id, 3, {
        className: "TerrainCorner"
      })
    );

    expect(history.state.tilesets[0]).toMatchObject({
      tileOffsetX: 4,
      tileOffsetY: -6,
      objectAlignment: "bottom",
      tileRenderSize: "grid"
    });
    expect(history.state.tilesets[0]?.tiles[3]).toMatchObject({
      className: "TerrainCorner"
    });
  });

  it("upserts and removes tile properties", () => {
    const tileset = {
      ...createTileset({
        name: "props",
        kind: "image-collection",
        tileWidth: 32,
        tileHeight: 32
      }),
      tiles: [createTileDefinition(0)]
    };
    const history = new CommandHistory(
      createEditorWorkspaceState({
        project: createProject({
          name: "demo",
          assetRoots: ["maps", "tilesets"]
        }),
        tilesets: [tileset]
      })
    );

    history.execute(
      upsertTilesetTilePropertyCommand(
        tileset.id,
        0,
        createProperty("biome", "string", "forest")
      )
    );
    history.execute(
      upsertTilesetTilePropertyCommand(
        tileset.id,
        0,
        createProperty("spawnWeight", "int", 3),
        "biome"
      )
    );
    history.execute(removeTilesetTilePropertyCommand(tileset.id, 0, "spawnWeight"));

    expect(history.state.tilesets[0]?.tiles[0]?.properties).toEqual([]);
  });

  it("updates tile animation frames", () => {
    const tileset = {
      ...createTileset({
        name: "terrain",
        kind: "image-collection",
        tileWidth: 32,
        tileHeight: 32
      }),
      tiles: [createTileDefinition(0), createTileDefinition(1), createTileDefinition(2)]
    };
    const history = new CommandHistory(
      createEditorWorkspaceState({
        project: createProject({
          name: "demo",
          assetRoots: ["maps", "tilesets"]
        }),
        tilesets: [tileset]
      })
    );
    const frames: TileAnimationFrame[] = [
      { tileId: 0, durationMs: 100 },
      { tileId: 2, durationMs: 160 }
    ];

    history.execute(updateTilesetTileAnimationCommand(tileset.id, 1, frames));

    expect(history.state.tilesets[0]?.tiles[1]?.animation).toEqual(frames);
  });

  it("creates, updates and removes collision objects on tiles", () => {
    const tileset = {
      ...createTileset({
        name: "terrain",
        kind: "image-collection",
        tileWidth: 32,
        tileHeight: 32
      }),
      tiles: [createTileDefinition(0), createTileDefinition(1)]
    };
    const history = new CommandHistory(
      createEditorWorkspaceState({
        project: createProject({
          name: "demo",
          assetRoots: ["maps", "tilesets"]
        }),
        tilesets: [tileset]
      })
    );
    const object = createMapObject({
      name: "Object 1",
      shape: "rectangle",
      x: 2,
      y: 3,
      width: 10,
      height: 12
    });

    history.execute(createTilesetTileCollisionObjectCommand(tileset.id, 0, object));
    history.execute(
      updateTilesetTileCollisionObjectCommand(tileset.id, 0, object.id, {
        width: 14,
        height: 16
      })
    );
    history.execute(
      upsertTilesetTileCollisionObjectPropertyCommand(
        tileset.id,
        0,
        object.id,
        createProperty("kind", "string", "solid")
      )
    );
    history.execute(
      moveTilesetTileCollisionObjectsCommand(tileset.id, 0, [object.id], 5, -1)
    );
    history.execute(
      reorderTilesetTileCollisionObjectsCommand(tileset.id, 0, [object.id], "up")
    );
    history.execute(
      removeTilesetTileCollisionObjectPropertyCommand(tileset.id, 0, object.id, "kind")
    );
    history.execute(removeTilesetTileCollisionObjectsCommand(tileset.id, 0, [object.id]));

    expect(history.state.tilesets[0]?.tiles[0]?.collisionLayer).toBeUndefined();
  });
});
