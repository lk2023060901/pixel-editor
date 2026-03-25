import { describe, expect, it } from "vitest";

import {
  createMap,
  createMapObject,
  createProperty,
  type TileAnimationFrame,
  createTileDefinition,
  createTileset
} from "./index";
import {
  attachTilesetToMap,
  createTilesetTileCollisionObject,
  createImageCollectionTileset,
  createImageTileset,
  moveTilesetTileCollisionObjects,
  getMapGlobalTileGid,
  getTilesetTileCollisionObject,
  getTilesetTileCount,
  listTilesetLocalIds,
  removeTilesetTileCollisionObjectProperty,
  removeTilesetTileCollisionObjects,
  removeTilesetTileProperty,
  reorderTilesetTileCollisionObjects,
  resolveMapTileGid,
  updateTilesetTileCollisionObject,
  updateTilesetTileAnimation,
  updateTilesetDetails,
  updateTilesetTileMetadata,
  upsertTilesetTileCollisionObjectProperty,
  upsertTilesetTileProperty
} from "./tileset-operations";

describe("tileset operations", () => {
  it("derives tile count from explicit tiles and image metadata", () => {
    const imageTileset = {
      ...createTileset({
        name: "terrain",
        kind: "image",
        tileWidth: 32,
        tileHeight: 32,
        source: {
          imagePath: "terrain.png",
          imageWidth: 128,
          imageHeight: 64,
          margin: 0,
          spacing: 0,
          columns: 4
        }
      }),
      tiles: [createTileDefinition(0), createTileDefinition(1)]
    };
    const collectionTileset = {
      ...createTileset({
        name: "props",
        kind: "image-collection",
        tileWidth: 32,
        tileHeight: 32
      }),
      tiles: [createTileDefinition(0), createTileDefinition(1), createTileDefinition(2)]
    };

    expect(getTilesetTileCount(imageTileset)).toBe(8);
    expect(getTilesetTileCount(collectionTileset)).toBe(3);
    expect(listTilesetLocalIds(collectionTileset)).toEqual([0, 1, 2]);
  });

  it("resolves map gids against ordered map tilesets", () => {
    const terrainTileset = {
      ...createTileset({
        name: "terrain",
        kind: "image",
        tileWidth: 32,
        tileHeight: 32,
        source: {
          imagePath: "terrain.png",
          imageWidth: 128,
          imageHeight: 64,
          margin: 0,
          spacing: 0,
          columns: 4
        }
      }),
      tiles: Array.from({ length: 8 }, (_, localId) => createTileDefinition(localId))
    };
    const propsTileset = {
      ...createTileset({
        name: "props",
        kind: "image-collection",
        tileWidth: 32,
        tileHeight: 32
      }),
      tiles: Array.from({ length: 4 }, (_, localId) => createTileDefinition(localId))
    };
    const map = createMap({
      name: "demo",
      orientation: "orthogonal",
      width: 8,
      height: 8,
      tileWidth: 32,
      tileHeight: 32,
      tilesetIds: [terrainTileset.id, propsTileset.id]
    });

    expect(getMapGlobalTileGid(map, [terrainTileset, propsTileset], terrainTileset.id, 2)).toBe(3);
    expect(getMapGlobalTileGid(map, [terrainTileset, propsTileset], propsTileset.id, 1)).toBe(10);

    expect(resolveMapTileGid(map, [terrainTileset, propsTileset], 10)).toMatchObject({
      firstGid: 9,
      localId: 1,
      tileset: propsTileset
    });
  });

  it("creates image and image-collection tilesets and attaches them to maps", () => {
    const spriteTileset = createImageTileset({
      name: "terrain",
      tileWidth: 32,
      tileHeight: 32,
      imagePath: "/demo/terrain-core.svg",
      imageWidth: 192,
      imageHeight: 128,
      columns: 6
    });
    const collectionTileset = createImageCollectionTileset({
      name: "props",
      tileWidth: 32,
      tileHeight: 32,
      imageSources: ["/demo/props/prop-1.svg", "/demo/props/prop-2.svg"]
    });
    const map = createMap({
      name: "demo",
      orientation: "orthogonal",
      width: 8,
      height: 8,
      tileWidth: 32,
      tileHeight: 32
    });

    const attached = attachTilesetToMap(attachTilesetToMap(map, spriteTileset.id), collectionTileset.id);

    expect(spriteTileset.tiles).toHaveLength(24);
    expect(collectionTileset.tiles).toHaveLength(2);
    expect(attached.tilesetIds).toEqual([spriteTileset.id, collectionTileset.id]);
  });

  it("updates tileset parameters and keeps image tiles aligned with computed count", () => {
    const tileset = createImageTileset({
      name: "terrain",
      tileWidth: 32,
      tileHeight: 32,
      imagePath: "/demo/terrain-core.svg",
      imageWidth: 192,
      imageHeight: 128,
      columns: 6
    });

    const updated = updateTilesetDetails(tileset, {
      name: "terrain-v2",
      tileWidth: 48,
      tileHeight: 32,
      tileOffsetX: 4,
      tileOffsetY: -8,
      objectAlignment: "bottom",
      tileRenderSize: "grid",
      fillMode: "preserve-aspect-fit",
      spacing: 4,
      margin: 2,
      columns: 3
    });

    expect(updated.name).toBe("terrain-v2");
    expect(updated.tileWidth).toBe(48);
    expect(updated.tileOffsetX).toBe(4);
    expect(updated.tileOffsetY).toBe(-8);
    expect(updated.objectAlignment).toBe("bottom");
    expect(updated.tileRenderSize).toBe("grid");
    expect(updated.fillMode).toBe("preserve-aspect-fit");
    expect(updated.source).toMatchObject({
      margin: 2,
      spacing: 4,
      columns: 3
    });
    expect(updated.tiles).toHaveLength(9);
  });

  it("updates tile metadata and custom properties by local id", () => {
    const tileset = createImageCollectionTileset({
      name: "props",
      tileWidth: 32,
      tileHeight: 32,
      imageSources: ["/demo/props/prop-1.svg", "/demo/props/prop-2.svg"]
    });

    const withMetadata = updateTilesetTileMetadata(tileset, 1, {
      className: "PropRock",
      probability: 0.5
    });
    const withProperty = upsertTilesetTileProperty(
      withMetadata,
      1,
      createProperty("biome", "string", "forest")
    );
    const renamedProperty = upsertTilesetTileProperty(
      withProperty,
      1,
      createProperty("spawnWeight", "int", 4),
      "biome"
    );
    const cleaned = removeTilesetTileProperty(renamedProperty, 1, "spawnWeight");

    expect(withMetadata.tiles[1]).toMatchObject({
      localId: 1,
      className: "PropRock",
      probability: 0.5
    });
    expect(withProperty.tiles[1]?.properties).toEqual([
      createProperty("biome", "string", "forest")
    ]);
    expect(renamedProperty.tiles[1]?.properties).toEqual([
      createProperty("spawnWeight", "int", 4)
    ]);
    expect(cleaned.tiles[1]?.properties).toEqual([]);
  });

  it("updates tile animation frames by local id", () => {
    const tileset = createImageCollectionTileset({
      name: "props",
      tileWidth: 32,
      tileHeight: 32,
      imageSources: [
        "/demo/props/prop-1.svg",
        "/demo/props/prop-2.svg",
        "/demo/props/prop-3.svg"
      ]
    });
    const animation: TileAnimationFrame[] = [
      { tileId: 0, durationMs: 100 },
      { tileId: 2, durationMs: 180 }
    ];

    const updated = updateTilesetTileAnimation(tileset, 1, animation);

    expect(updated.tiles[1]?.animation).toEqual(animation);
    expect(updated.tiles[1]?.animation).not.toBe(animation);
  });

  it("edits tile collision objects by local id", () => {
    const tileset = createImageCollectionTileset({
      name: "props",
      tileWidth: 32,
      tileHeight: 32,
      imageSources: ["/demo/props/prop-1.svg", "/demo/props/prop-2.svg"]
    });
    const collisionObject = createMapObject({
      name: "Object 1",
      shape: "rectangle",
      x: 4,
      y: 6,
      width: 20,
      height: 16
    });

    const withObject = createTilesetTileCollisionObject(tileset, 0, collisionObject);
    const moved = moveTilesetTileCollisionObjects(withObject, 0, [collisionObject.id], 3, -2);
    const updated = updateTilesetTileCollisionObject(moved, 0, collisionObject.id, {
      name: "Hitbox",
      width: 24
    });
    const withProperty = upsertTilesetTileCollisionObjectProperty(
      updated,
      0,
      collisionObject.id,
      createProperty("kind", "string", "solid")
    );
    const reordered = reorderTilesetTileCollisionObjects(
      createTilesetTileCollisionObject(
        withProperty,
        0,
        createMapObject({
          name: "Object 2",
          shape: "ellipse",
          x: 8,
          y: 8,
          width: 8,
          height: 8
        })
      ),
      0,
      [collisionObject.id],
      "down"
    );
    const withoutProperty = removeTilesetTileCollisionObjectProperty(
      reordered,
      0,
      collisionObject.id,
      "kind"
    );
    const cleaned = removeTilesetTileCollisionObjects(withoutProperty, 0, [collisionObject.id]);

    expect(getTilesetTileCollisionObject(withObject, 0, collisionObject.id)).toMatchObject({
      name: "Object 1"
    });
    expect(getTilesetTileCollisionObject(moved, 0, collisionObject.id)).toMatchObject({
      x: 7,
      y: 4
    });
    expect(getTilesetTileCollisionObject(withProperty, 0, collisionObject.id)?.properties).toEqual([
      createProperty("kind", "string", "solid")
    ]);
    expect(reordered.tiles[0]?.collisionLayer?.objects.at(-1)?.id).toBe(collisionObject.id);
    expect(getTilesetTileCollisionObject(withoutProperty, 0, collisionObject.id)?.properties).toEqual([]);
    expect(cleaned.tiles[0]?.collisionLayer?.objects).toEqual([
      expect.objectContaining({ name: "Object 2" })
    ]);
  });
});
